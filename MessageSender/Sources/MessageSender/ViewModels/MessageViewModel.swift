import Foundation
import SwiftUI

enum SendResult: Equatable {
    case success
    case failure(String)
}

@MainActor
final class MessageViewModel: ObservableObject {
    @Published var recipient = ""
    @Published var messageText = ""
    @Published var history: [SentMessage] = []
    @Published var isSending = false
    @Published var lastResult: SendResult?

    private let messageService = MessageService()
    private let historyService = HistoryService()

    init() {
        history = historyService.load()
    }

    func send() {
        let recipientTrimmed = recipient.trimmingCharacters(in: .whitespacesAndNewlines)
        let messageTrimmed = messageText.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !recipientTrimmed.isEmpty else {
            lastResult = .failure("Recipient cannot be empty.")
            return
        }
        guard !messageTrimmed.isEmpty else {
            lastResult = .failure("Message cannot be empty.")
            return
        }

        isSending = true
        lastResult = nil

        Task {
            do {
                try await messageService.send(to: recipientTrimmed, message: messageTrimmed)
                let entry = SentMessage(recipient: recipientTrimmed, message: messageTrimmed, success: true)
                history.insert(entry, at: 0)
                historyService.save(history)
                lastResult = .success
                messageText = ""
            } catch {
                let errorMsg = error.localizedDescription
                let entry = SentMessage(recipient: recipientTrimmed, message: messageTrimmed, success: false, errorMessage: errorMsg)
                history.insert(entry, at: 0)
                historyService.save(history)
                lastResult = .failure(errorMsg)
            }
            isSending = false
        }
    }

    func clearHistory() {
        history.removeAll()
        historyService.save(history)
    }

    func deleteMessage(_ message: SentMessage) {
        history.removeAll { $0.id == message.id }
        historyService.save(history)
    }
}
