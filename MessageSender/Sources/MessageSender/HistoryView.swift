import SwiftUI

struct HistoryView: View {
    @ObservedObject var viewModel: MessageViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("History")
                    .font(.title3)
                    .fontWeight(.medium)

                Spacer()

                if !viewModel.history.isEmpty {
                    Button("Clear All") {
                        viewModel.clearHistory()
                    }
                    .buttonStyle(.borderless)
                    .foregroundColor(.secondary)
                    .font(.callout)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)

            if viewModel.history.isEmpty {
                VStack {
                    Spacer()
                    Text("No messages sent yet")
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity)
                    Spacer()
                }
            } else {
                List {
                    ForEach(viewModel.history) { entry in
                        HistoryRow(entry: entry)
                            .contextMenu {
                                Button("Delete") {
                                    viewModel.deleteMessage(entry)
                                }
                            }
                    }
                }
                .listStyle(.inset)
            }
        }
    }
}

struct HistoryRow: View {
    let entry: SentMessage

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .short
        f.timeStyle = .short
        return f
    }()

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: entry.success ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(entry.success ? .green : .red)
                .font(.title3)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(entry.recipient)
                        .fontWeight(.medium)
                    Spacer()
                    Text(Self.timeFormatter.string(from: entry.timestamp))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(entry.message)
                    .font(.callout)
                    .foregroundColor(.secondary)
                    .lineLimit(2)

                if let error = entry.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .lineLimit(1)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
