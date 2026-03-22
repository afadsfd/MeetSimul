use lru::LruCache;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::num::NonZeroUsize;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Condvar, Mutex};
use tauri::Emitter;
use tauri::Manager;

// ─── TTS Queue ──────────────────────────────────────────────

#[derive(Clone)]
struct TtsItem {
    text: String,
    voice: String,
    mode: String,
}

struct TtsQueue {
    queue: Mutex<VecDeque<TtsItem>>,
    condvar: Condvar,
    is_speaking: AtomicBool,
}

impl TtsQueue {
    fn new() -> Self {
        Self {
            queue: Mutex::new(VecDeque::new()),
            condvar: Condvar::new(),
            is_speaking: AtomicBool::new(false),
        }
    }

    fn enqueue(&self, item: TtsItem) {
        let mut q = self.queue.lock().unwrap();
        q.push_back(item);
        self.condvar.notify_one();
    }

    fn clear_and_stop(&self) {
        {
            let mut q = self.queue.lock().unwrap();
            q.clear();
        }
        stop_speaking_internal();
    }

    fn dequeue(&self) -> TtsItem {
        let mut q = self.queue.lock().unwrap();
        loop {
            if let Some(item) = q.pop_front() {
                return item;
            }
            q = self.condvar.wait(q).unwrap();
        }
    }
}

// ─── App State ───────────────────────────────────────────────

struct AppState {
    translate_cache: Mutex<LruCache<String, String>>,
    tts_queue: Arc<TtsQueue>,
    listener_process: Mutex<Option<u32>>, // PID of speech recognizer
}

// ─── Types ───────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub mode: String,          // "local" or "cloud"
    pub voice: String,         // cloud voice identifier (Guy/Jenny)
    pub local_voice: String,   // local macOS voice name
    pub real_time_translate: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            mode: "cloud".to_string(),
            voice: "Guy".to_string(),
            local_voice: String::new(),
            real_time_translate: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemVoice {
    pub name: String,
    pub lang: String,
    pub sample: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlossaryEntry {
    pub zh: String,
    pub en: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslateResult {
    pub original: String,
    pub translated: String,
    pub time_ms: u64,
    pub method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelStatus {
    pub asr: bool,
    pub translation: bool,
    pub tts: bool,
}

// ─── Helpers ─────────────────────────────────────────────────

fn get_app_data_dir() -> std::path::PathBuf {
    let dir = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("com.zero.meetsimul");
    std::fs::create_dir_all(&dir).ok();
    dir
}

fn settings_path() -> std::path::PathBuf {
    get_app_data_dir().join("settings.json")
}

fn glossary_path() -> std::path::PathBuf {
    get_app_data_dir().join("glossary.json")
}

// ─── BlackHole ───────────────────────────────────────────────

fn check_blackhole() -> bool {
    let output = Command::new("system_profiler")
        .args(["SPAudioDataType"])
        .output();
    match output {
        Ok(o) => String::from_utf8_lossy(&o.stdout).contains("BlackHole"),
        Err(_) => false,
    }
}

#[tauri::command]
fn check_blackhole_installed() -> bool {
    check_blackhole()
}

#[tauri::command]
fn install_blackhole(app: tauri::AppHandle) -> Result<String, String> {
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Cannot get resource dir: {}", e))?
        .join("BlackHole2ch.pkg");

    if !resource_path.exists() {
        return Err(format!("BlackHole pkg not found at: {:?}", resource_path));
    }

    Command::new("open")
        .arg("-W")
        .arg(&resource_path)
        .spawn()
        .map_err(|e| format!("Failed to open pkg: {}", e))?;

    Ok("launched".to_string())
}

// ─── Settings ────────────────────────────────────────────────

#[tauri::command]
fn get_settings() -> Settings {
    let path = settings_path();
    if path.exists() {
        if let Ok(data) = std::fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str::<Settings>(&data) {
                return settings;
            }
        }
    }
    Settings::default()
}

#[tauri::command]
fn save_settings(settings: Settings) -> Result<(), String> {
    let path = settings_path();
    let data = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    std::fs::write(&path, data)
        .map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}

// ─── Glossary ────────────────────────────────────────────────

#[tauri::command]
fn get_glossary() -> Vec<GlossaryEntry> {
    let path = glossary_path();
    if path.exists() {
        if let Ok(data) = std::fs::read_to_string(&path) {
            if let Ok(entries) = serde_json::from_str::<Vec<GlossaryEntry>>(&data) {
                return entries;
            }
        }
    }
    Vec::new()
}

#[tauri::command]
fn save_glossary(entries: Vec<GlossaryEntry>) -> Result<(), String> {
    let path = glossary_path();
    let data = serde_json::to_string_pretty(&entries)
        .map_err(|e| format!("Failed to serialize glossary: {}", e))?;
    std::fs::write(&path, data)
        .map_err(|e| format!("Failed to write glossary: {}", e))?;
    Ok(())
}

// ─── Translation (Cloud) ────────────────────────────────────

#[tauri::command]
async fn translate_text(
    text: String,
    _mode: String,
    state: tauri::State<'_, AppState>,
) -> Result<TranslateResult, String> {
    if text.trim().is_empty() {
        return Err("No text provided".to_string());
    }

    let start = std::time::Instant::now();

    // Check cache first
    {
        let mut cache = state.translate_cache.lock().unwrap();
        if let Some(cached) = cache.get(&text) {
            return Ok(TranslateResult {
                original: text.clone(),
                translated: cached.clone(),
                time_ms: start.elapsed().as_millis() as u64,
                method: "cache".to_string(),
            });
        }
    }

    // Both local and cloud modes use cloud translation for now
    // Local models are downloaded but inference runtime will be added in Phase 3
    let translated = cloud_translate(&text).await?;

    // Store in cache
    {
        let mut cache = state.translate_cache.lock().unwrap();
        cache.put(text.clone(), translated.clone());
    }

    Ok(TranslateResult {
        original: text,
        translated,
        time_ms: start.elapsed().as_millis() as u64,
        method: "cloud".to_string(),
    })
}

async fn cloud_translate(text: &str) -> Result<String, String> {
    let encoded = url::form_urlencoded::Serializer::new(String::new())
        .append_pair("q", text)
        .finish();
    let url = format!(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&{}",
        encoded
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
        .map_err(|e| format!("Google Translate request failed: {}", e))?;

    if !resp.status().is_success() {
        return cloud_translate_youdao(text).await;
    }

    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if let Some(arr) = body.get(0).and_then(|v| v.as_array()) {
        let mut result = String::new();
        for item in arr {
            if let Some(t) = item.get(0).and_then(|v| v.as_str()) {
                result.push_str(t);
            }
        }
        if !result.is_empty() {
            return Ok(result);
        }
    }

    cloud_translate_youdao(text).await
}

async fn cloud_translate_youdao(text: &str) -> Result<String, String> {
    let encoded = url::form_urlencoded::Serializer::new(String::new())
        .append_pair("i", text)
        .finish();
    let url = format!(
        "http://fanyi.youdao.com/translate?doctype=json&type=ZH_CN_EN&{}",
        encoded
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
        .map_err(|e| format!("Youdao request failed: {}", e))?;

    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Youdao response: {}", e))?;

    if let Some(result) = body
        .get("translateResult")
        .and_then(|v| v.get(0))
        .and_then(|v| v.get(0))
        .and_then(|v| v.get("tgt"))
        .and_then(|v| v.as_str())
    {
        return Ok(result.to_string());
    }

    Ok(text.to_string())
}

// ─── System Voices ──────────────────────────────────────────

#[tauri::command]
fn get_system_voices() -> Vec<SystemVoice> {
    let output = Command::new("say")
        .args(["-v", "?"])
        .output();

    let mut voices = Vec::new();
    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        for line in stdout.lines() {
            // Format: "Name    lang_REGION    # Sample text"
            let line = line.trim();
            if line.is_empty() { continue; }

            // Split at '#' to get sample text
            let (left, sample) = if let Some(idx) = line.find('#') {
                (&line[..idx], line[idx+1..].trim().to_string())
            } else {
                (line, String::new())
            };

            // Parse name and lang - name is everything before the lang code
            let left = left.trim();
            let parts: Vec<&str> = left.split_whitespace().collect();
            if parts.len() >= 2 {
                let lang = parts[parts.len() - 1].to_string();
                let name = parts[..parts.len() - 1].join(" ");
                // Only include English voices (en_)
                if lang.starts_with("en_") {
                    voices.push(SystemVoice { name, lang, sample });
                }
            }
        }
    }
    voices
}

// ─── TTS (Cloud - Edge TTS via command) ─────────────────────

#[tauri::command]
fn speak_text(
    text: String,
    voice: String,
    mode: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if text.trim().is_empty() {
        return Ok(());
    }
    // Add to queue - background worker will play it in order
    state.tts_queue.enqueue(TtsItem { text, voice, mode });
    Ok(())
}

fn play_tts_item(item: &TtsItem) {
    let safe_text = item.text
        .replace('"', "")
        .replace('\'', "")
        .replace(';', "")
        .replace('`', "")
        .replace('$', "");

    if item.mode == "local" {
        play_tts_local(&safe_text, &item.voice);
    } else {
        play_tts_cloud(&safe_text, &item.voice);
    }
}

fn play_tts_cloud(text: &str, voice: &str) {
    let edge_voice = match voice {
        "Jenny" | "Samantha" | "Female" => "en-US-JennyNeural",
        _ => "en-US-GuyNeural",
    };

    let tmp_file = "/tmp/meetsimul_tts.mp3";

    let edge_tts_result = Command::new("edge-tts")
        .args(["--voice", edge_voice, "--text", text, "--write-media", tmp_file])
        .output();

    match edge_tts_result {
        Ok(output) if output.status.success() => {
            let _ = Command::new("afplay").arg(tmp_file).output();
        }
        _ => {
            // Fallback to macOS say
            let say_voice = if voice == "Jenny" || voice == "Samantha" || voice == "Female" {
                "Samantha"
            } else {
                "Daniel"
            };
            let _ = Command::new("say")
                .args(["-v", say_voice, text])
                .output();
        }
    }
}

fn play_tts_local(text: &str, voice: &str) {
    // If a specific voice name is provided, use it directly
    if !voice.is_empty() && voice != "Guy" && voice != "Jenny" {
        let result = Command::new("say")
            .args(["-v", voice, text])
            .output();
        if let Ok(output) = result {
            if output.status.success() {
                return;
            }
        }
    }

    // Fallback: try common English voices
    let fallback_voices = ["Samantha", "Daniel", "Alex"];
    for v in &fallback_voices {
        let result = Command::new("say")
            .args(["-v", v, text])
            .output();
        if let Ok(output) = result {
            if output.status.success() {
                return;
            }
        }
    }

    // Ultimate fallback
    let _ = Command::new("say").arg(text).output();
}


fn stop_speaking_internal() {
    let _ = Command::new("pkill").args(["-f", "afplay /tmp/meetsimul"]).output();
    let _ = Command::new("pkill").args(["-f", "say -v"]).output();
    let _ = Command::new("pkill").args(["-f", "local_tts"]).output();
}

#[tauri::command]
fn stop_speaking(state: tauri::State<'_, AppState>) {
    state.tts_queue.clear_and_stop();
}

// ─── Speech Recognition (macOS SFSpeechRecognizer) ──────────

fn get_speech_binary_path() -> std::path::PathBuf {
    get_app_data_dir().join("speech_recognizer")
}

fn compile_speech_recognizer(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let binary = get_speech_binary_path();
    // Check if binary exists and source hasn't changed
    // Use a version marker to detect updates
    let version_marker = get_app_data_dir().join("speech_recognizer.version");
    let current_version = "2.0.7"; // bump this when Swift source changes
    let needs_compile = if binary.exists() {
        match std::fs::read_to_string(&version_marker) {
            Ok(v) => v.trim() != current_version,
            Err(_) => true,
        }
    } else {
        true
    };
    if !needs_compile {
        return Ok(binary);
    }
    // Remove old binary
    let _ = std::fs::remove_file(&binary);

    // Find the Swift source bundled as a resource
    let resource_base = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Cannot get resource dir: {}", e))?;

    // Tauri bundles resources under Resources/resources/ subdirectory
    let source = resource_base.join("resources").join("speech_recognizer.swift");
    let source = if source.exists() {
        source
    } else {
        // Fallback: check directly under Resources/
        let alt = resource_base.join("speech_recognizer.swift");
        if alt.exists() {
            alt
        } else {
            return Err(format!(
                "speech_recognizer.swift not found. Checked:\n  {:?}\n  {:?}",
                resource_base.join("resources").join("speech_recognizer.swift"),
                resource_base.join("speech_recognizer.swift")
            ));
        }
    };

    // Compile the Swift source
    let output = Command::new("swiftc")
        .args([
            "-O",
            "-o",
            binary.to_str().unwrap(),
            source.to_str().unwrap(),
            "-framework", "Speech",
            "-framework", "AVFoundation",
        ])
        .output()
        .map_err(|e| format!("Failed to run swiftc: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to compile speech recognizer: {}", stderr));
    }

    // Write version marker
    let _ = std::fs::write(&version_marker, current_version);

    Ok(binary)
}

#[tauri::command]
async fn start_listening(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    // Stop existing listener
    stop_listening_internal(&state);

    let binary = compile_speech_recognizer(&app)?;

    // Spawn the speech recognizer process
    let child = std::process::Command::new(&binary)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start speech recognizer: {}", e))?;

    let pid = child.id();
    {
        let mut lp = state.listener_process.lock().unwrap();
        *lp = Some(pid);
    }

    // Read stdout in a background thread and emit events
    let app_handle = app.clone();
    let state_pid = pid;
    std::thread::spawn(move || {
        use std::io::BufRead;
        if let Some(stdout) = child.stdout {
            let reader = std::io::BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    if line.trim().is_empty() {
                        continue;
                    }
                    // Parse the JSON output from Swift helper
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&line) {
                        let msg_type = json.get("type").and_then(|v| v.as_str()).unwrap_or("");
                        match msg_type {
                            "result" => {
                                let text = json.get("text").and_then(|v| v.as_str()).unwrap_or("");
                                let is_final = json.get("final").map(|v| {
                                    v.as_bool().unwrap_or_else(|| v.as_str().map(|s| s == "true").unwrap_or(false))
                                }).unwrap_or(false);
                                app_handle.emit("speech_recognized", serde_json::json!({
                                    "text": text,
                                    "final": is_final,
                                })).ok();
                            }
                            "status" => {
                                let status = json.get("status").and_then(|v| v.as_str()).unwrap_or("");
                                app_handle.emit("speech_status", serde_json::json!({
                                    "status": status,
                                })).ok();
                            }
                            "error" => {
                                let error = json.get("error").and_then(|v| v.as_str()).unwrap_or("");
                                app_handle.emit("speech_error", serde_json::json!({
                                    "error": error,
                                })).ok();
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
        // Process ended unexpectedly - notify frontend
        app_handle.emit("speech_error", serde_json::json!({
            "error": "语音识别进程已停止",
        })).ok();
        let _ = state_pid;
    });

    Ok(())
}

fn stop_listening_internal(state: &AppState) {
    let mut lp = state.listener_process.lock().unwrap();
    if let Some(pid) = lp.take() {
        let _ = Command::new("kill").arg(pid.to_string()).output();
    }
}

#[tauri::command]
fn stop_listening(state: tauri::State<'_, AppState>) {
    stop_listening_internal(&state);
}

// ─── Models (legacy stubs for frontend compatibility) ────────

#[tauri::command]
fn check_models_status() -> ModelStatus {
    // Local mode now uses macOS native TTS, no models needed
    ModelStatus {
        asr: true,
        translation: true,
        tts: true,
    }
}

#[tauri::command]
async fn download_models(_app: tauri::AppHandle) -> Result<(), String> {
    // No models to download - local mode uses macOS native services
    Ok(())
}

// ─── App Entry ───────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tts_queue = Arc::new(TtsQueue::new());

    // Spawn TTS worker thread - processes queue items sequentially
    let tts_queue_clone = tts_queue.clone();
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            translate_cache: Mutex::new(LruCache::new(NonZeroUsize::new(500).unwrap())),
            tts_queue: tts_queue.clone(),
            listener_process: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            check_blackhole_installed,
            install_blackhole,
            get_settings,
            save_settings,
            get_glossary,
            save_glossary,
            translate_text,
            speak_text,
            stop_speaking,
            start_listening,
            stop_listening,
            check_models_status,
            download_models,
            get_system_voices,
        ])
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Start TTS worker thread
            let app_handle = app.handle().clone();
            let queue = tts_queue_clone.clone();
            std::thread::spawn(move || {
                loop {
                    let item = queue.dequeue();
                    queue.is_speaking.store(true, Ordering::SeqCst);
                    app_handle.emit("speak_status", serde_json::json!({
                        "status": "playing",
                        "text": &item.text,
                    })).ok();

                    play_tts_item(&item);

                    // Check if queue is empty to set idle
                    let is_empty = queue.queue.lock().unwrap().is_empty();
                    if is_empty {
                        queue.is_speaking.store(false, Ordering::SeqCst);
                        app_handle.emit("speak_status", serde_json::json!({
                            "status": "idle",
                        })).ok();
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
