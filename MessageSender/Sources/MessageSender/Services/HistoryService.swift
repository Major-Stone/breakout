import Foundation

final class HistoryService {
    private let fileURL: URL

    init() {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let appDir = appSupport.appendingPathComponent("MessageSender", isDirectory: true)
        self.fileURL = appDir.appendingPathComponent("history.json")
    }

    func load() -> [SentMessage] {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return []
        }
        do {
            let data = try Data(contentsOf: fileURL)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode([SentMessage].self, from: data)
        } catch {
            print("Failed to load history: \(error.localizedDescription)")
            return []
        }
    }

    func save(_ messages: [SentMessage]) {
        do {
            let dir = fileURL.deletingLastPathComponent()
            if !FileManager.default.fileExists(atPath: dir.path) {
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            }
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            encoder.outputFormatting = .prettyPrinted
            let data = try encoder.encode(messages)
            try data.write(to: fileURL, options: .atomic)
        } catch {
            print("Failed to save history: \(error.localizedDescription)")
        }
    }
}
