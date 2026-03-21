import Foundation
import Speech
import AVFoundation

class SpeechRecognizer {
    let speechRecognizer: SFSpeechRecognizer
    let audioEngine = AVAudioEngine()
    var currentRequest: SFSpeechAudioBufferRecognitionRequest?
    var task: SFSpeechRecognitionTask?
    var silenceTimer: Timer?
    var lastText: String = ""
    var taskGeneration: Int = 0 // prevents stale callbacks from interfering
    let silenceTimeout: TimeInterval = 0.8

    init() {
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN"))!
    }

    func start() {
        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)

        guard format.sampleRate > 0 && format.channelCount > 0 else {
            emit("error", ["error": "No valid audio input. Check microphone."])
            exit(1)
            return
        }

        // Install tap ONCE - feeds audio to whatever currentRequest is active
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.currentRequest?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            emit("error", ["error": "Audio engine failed: \(error.localizedDescription)"])
            exit(1)
            return
        }

        startRecognitionTask()
        emit("status", ["status": "listening"])
        RunLoop.main.run()
    }

    func startRecognitionTask() {
        // Increment generation - any callbacks from old tasks will be ignored
        taskGeneration += 1
        let myGeneration = taskGeneration

        // Cancel previous
        task?.cancel()
        task = nil
        silenceTimer?.invalidate()
        silenceTimer = nil
        lastText = ""

        // New request
        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        currentRequest = req

        task = speechRecognizer.recognitionTask(with: req) { [weak self] result, error in
            guard let self = self else { return }
            // Ignore callbacks from old/cancelled tasks
            guard self.taskGeneration == myGeneration else { return }

            if let result = result {
                let text = result.bestTranscription.formattedString

                if result.isFinal {
                    self.silenceTimer?.invalidate()
                    if !text.isEmpty {
                        self.emit("result", ["text": text, "final": "true"])
                    }
                    self.startRecognitionTask()
                    return
                }

                // Partial result
                self.lastText = text
                self.emit("result", ["text": text, "final": "false"])

                // Reset silence timer
                DispatchQueue.main.async {
                    self.silenceTimer?.invalidate()
                    self.silenceTimer = Timer.scheduledTimer(withTimeInterval: self.silenceTimeout, repeats: false) { [weak self] _ in
                        guard let self = self, !self.lastText.isEmpty else { return }
                        guard self.taskGeneration == myGeneration else { return }
                        self.emit("result", ["text": self.lastText, "final": "true"])
                        self.startRecognitionTask()
                    }
                }
            }

            if let error = error {
                // Ignore if this is a stale task
                guard self.taskGeneration == myGeneration else { return }
                let nsError = error as NSError
                let ignoreCodes = [1110, 216, 209, 203, 301]
                if nsError.domain == "kAFAssistantErrorDomain" && ignoreCodes.contains(nsError.code) {
                    self.startRecognitionTask()
                    return
                }
                self.emit("error", ["error": error.localizedDescription])
                self.startRecognitionTask()
            }
        }
    }

    func emit(_ type: String, _ data: [String: String]) {
        var json = "{"
        json += "\"type\":\"\(type)\""
        for (key, value) in data {
            let escaped = value
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "\"", with: "\\\"")
                .replacingOccurrences(of: "\n", with: " ")
            json += ",\"\(key)\":\"\(escaped)\""
        }
        json += "}"
        print(json)
        fflush(stdout)
    }
}

let recognizer = SpeechRecognizer()
recognizer.start()
