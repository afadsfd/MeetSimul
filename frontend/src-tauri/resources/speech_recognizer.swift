import Foundation
import Speech
import AVFoundation

class SpeechRecognizer {
    let speechRecognizer: SFSpeechRecognizer
    let audioEngine = AVAudioEngine()
    var request: SFSpeechAudioBufferRecognitionRequest?
    var task: SFSpeechRecognitionTask?

    init() {
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN"))!
    }

    func start() {
        startRecognition()
        // Keep running
        RunLoop.main.run()
    }

    func startRecognition() {
        task?.cancel()
        task = nil
        request = nil

        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        // Don't force on-device recognition - it requires Siri to be fully enabled
        // Let the system decide whether to use on-device or server-based recognition
        request = req

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)

        guard format.sampleRate > 0 && format.channelCount > 0 else {
            emit("error", ["error": "No valid audio input. Check microphone."])
            exit(1)
            return
        }

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            req.append(buffer)
        }

        task = speechRecognizer.recognitionTask(with: req) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let text = result.bestTranscription.formattedString
                    .replacingOccurrences(of: "\\", with: "\\\\")
                    .replacingOccurrences(of: "\"", with: "\\\"")
                    .replacingOccurrences(of: "\n", with: " ")
                let isFinal = result.isFinal
                self.emit("result", ["text": text, "final": isFinal ? "true" : "false"])

                if isFinal {
                    self.restart()
                }
            }

            if let error = error {
                let nsError = error as NSError
                // Ignore common non-fatal errors
                if nsError.domain == "kAFAssistantErrorDomain" && nsError.code == 1110 {
                    // No speech detected - restart
                    self.restart()
                    return
                }
                if nsError.code == 216 || nsError.code == 209 || nsError.code == 203 {
                    // Cancelled / interrupted - restart
                    self.restart()
                    return
                }
                self.emit("error", ["error": error.localizedDescription])
                self.restart()
            }
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
            emit("status", ["status": "listening"])
        } catch {
            emit("error", ["error": "Audio engine failed: \(error.localizedDescription)"])
            exit(1)
        }
    }

    func restart() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        task = nil
        request = nil
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.startRecognition()
        }
    }

    func emit(_ type: String, _ data: [String: String]) {
        var json = "{"
        json += "\"type\":\"\(type)\""
        for (key, value) in data {
            json += ",\"\(key)\":\"\(value)\""
        }
        json += "}"
        print(json)
        fflush(stdout)
    }
}

let recognizer = SpeechRecognizer()
recognizer.start()
