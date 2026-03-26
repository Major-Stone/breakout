import Foundation

struct SentMessage: Codable, Identifiable {
    let id: UUID
    let recipient: String
    let message: String
    let timestamp: Date
    let success: Bool
    let errorMessage: String?

    init(recipient: String, message: String, success: Bool, errorMessage: String? = nil) {
        self.id = UUID()
        self.recipient = recipient
        self.message = message
        self.timestamp = Date()
        self.success = success
        self.errorMessage = errorMessage
    }
}
