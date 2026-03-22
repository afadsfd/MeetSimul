import Foundation
import AVFoundation

class LocalTTS: NSObject, AVSpeechSynthesizerDelegate {
    let synthesizer = AVSpeechSynthesizer()
    let semaphore = DispatchSemaphore(value: 0)
    var finished = false

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func speak(text: String, voiceId: String) {
        let utterance = AVSpeechUtterance(string: text)

        // Try premium voice first, fallback to standard
        if let voice = AVSpeechSynthesisVoice(identifier: voiceId) {
            utterance.voice = voice
        } else if let voice = AVSpeechSynthesisVoice(language: "en-US") {
            utterance.voice = voice
        }

        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        utterance.pitchMultiplier = 1.0
        utterance.volume = 1.0

        finished = false
        synthesizer.speak(utterance)

        // Wait for speech to finish
        semaphore.wait()
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
    }

    // MARK: - AVSpeechSynthesizerDelegate

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        finished = true
        semaphore.signal()
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        finished = true
        semaphore.signal()
    }
}

// ─── Main ────────────────────────────────────────────────────

// Usage: local_tts "text to speak" "voice_id"
// Commands via stdin:
//   SPEAK:<voice_id>:<text>
//   STOP
//   LIST_VOICES
//   QUIT

let tts = LocalTTS()

// If arguments provided, speak and exit
if CommandLine.arguments.count >= 3 {
    let text = CommandLine.arguments[1]
    let voiceId = CommandLine.arguments[2]
    tts.speak(text: text, voiceId: voiceId)
    exit(0)
}

// Interactive mode: read commands from stdin
if CommandLine.arguments.count >= 2 && CommandLine.arguments[1] == "--interactive" {
    // List available premium voices on startup
    let voices = AVSpeechSynthesisVoice.speechVoices()
        .filter { $0.language.starts(with: "en") }
        .sorted { $0.quality.rawValue > $1.quality.rawValue }

    var voiceList: [[String: Any]] = []
    for v in voices {
        voiceList.append([
            "id": v.identifier,
            "name": v.name,
            "language": v.language,
            "quality": v.quality.rawValue  // 0=default, 1=enhanced, 2=premium
        ])
    }

    if let data = try? JSONSerialization.data(withJSONObject: voiceList),
       let json = String(data: data, encoding: .utf8) {
        print("{\"type\":\"voices\",\"voices\":\(json)}")
        fflush(stdout)
    }

    while let line = readLine() {
        let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed == "QUIT" {
            break
        } else if trimmed == "STOP" {
            tts.stop()
            print("{\"type\":\"stopped\"}")
            fflush(stdout)
        } else if trimmed == "LIST_VOICES" {
            // Already listed on startup
        } else if trimmed.hasPrefix("SPEAK:") {
            let parts = trimmed.dropFirst(6)
            if let colonIdx = parts.firstIndex(of: ":") {
                let voiceId = String(parts[parts.startIndex..<colonIdx])
                let text = String(parts[parts.index(after: colonIdx)...])
                print("{\"type\":\"speaking\",\"text\":\"\(text.replacingOccurrences(of: "\"", with: "\\\""))\"}")
                fflush(stdout)
                tts.speak(text: text, voiceId: voiceId)
                print("{\"type\":\"done\"}")
                fflush(stdout)
            }
        }
    }
    exit(0)
}

// Default: print usage
print("Usage: local_tts \"text\" \"voice_id\"")
print("   or: local_tts --interactive")
exit(1)
