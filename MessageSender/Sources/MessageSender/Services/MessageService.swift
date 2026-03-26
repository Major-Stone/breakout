import Foundation

enum MessageError: LocalizedError {
    case timeout
    case messagesNotAvailable
    case recipientNotFound(String)
    case noSMSService
    case scriptError(String)

    var errorDescription: String? {
        switch self {
        case .timeout:
            return "Timed out waiting for Messages app to send. Is Messages running and signed in?"
        case .messagesNotAvailable:
            return "Messages app is not available. This tool requires macOS with the Messages app installed."
        case .recipientNotFound(let recipient):
            return "Recipient \"\(recipient)\" not found. Make sure it is a valid phone number or Apple ID."
        case .noSMSService:
            return "No SMS service found. Ensure your iPhone is paired with this Mac via iCloud and Text Message Forwarding is enabled (Settings → Messages → Text Message Forwarding)."
        case .scriptError(let detail):
            return "AppleScript error: \(detail)"
        }
    }
}

final class MessageService {

    func send(to recipient: String, message: String) async throws {
        let escapedRecipient = recipient
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
        let escapedMessage = message
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")

        let script = """
        tell application "Messages"
            set targetService to 1st service whose service type = iMessage
            set targetBuddy to buddy "\(escapedRecipient)" of targetService
            send "\(escapedMessage)" to targetBuddy
        end tell
        """

        try await runOsascript(script: script, recipient: recipient)
    }

    private func runOsascript(script: String, recipient: String) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
            process.arguments = ["-e", script]

            let stderrPipe = Pipe()
            process.standardError = stderrPipe
            process.standardOutput = Pipe()

            var didResume = false

            process.terminationHandler = { proc in
                guard !didResume else { return }
                didResume = true

                let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()
                let stderr = String(data: stderrData, encoding: .utf8) ?? ""

                if proc.terminationStatus == 0 {
                    continuation.resume()
                } else {
                    let error = Self.classifyError(stderr: stderr, recipient: recipient)
                    continuation.resume(throwing: error)
                }
            }

            do {
                try process.run()
            } catch {
                didResume = true
                continuation.resume(throwing: MessageError.messagesNotAvailable)
                return
            }

            // Timeout after 30 seconds
            DispatchQueue.global().asyncAfter(deadline: .now() + 30) {
                guard process.isRunning else { return }
                process.terminate()
                guard !didResume else { return }
                didResume = true
                continuation.resume(throwing: MessageError.timeout)
            }
        }
    }

    private static func classifyError(stderr: String, recipient: String) -> MessageError {
        let msg = stderr.lowercased()
        if msg.contains("not found") || msg.contains("can't get application") {
            return .messagesNotAvailable
        }
        if msg.contains("buddy") && msg.contains("can't get") {
            return .recipientNotFound(recipient)
        }
        if msg.contains("service") && msg.contains("can't get") {
            return .noSMSService
        }
        return .scriptError(stderr.trimmingCharacters(in: .whitespacesAndNewlines))
    }
}
