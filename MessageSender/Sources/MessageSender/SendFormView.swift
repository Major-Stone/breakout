import SwiftUI

struct SendFormView: View {
    @ObservedObject var viewModel: MessageViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Send Message")
                .font(.title2)
                .fontWeight(.semibold)

            TextField("Phone number or Apple ID", text: $viewModel.recipient)
                .textFieldStyle(.roundedBorder)
                .font(.body)

            TextEditor(text: $viewModel.messageText)
                .font(.body)
                .frame(minHeight: 80, maxHeight: 120)
                .overlay(
                    RoundedRectangle(cornerRadius: 5)
                        .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                )
                .overlay(alignment: .topLeading, content: {
                    if viewModel.messageText.isEmpty {
                        Text("Type your message...")
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 8)
                            .allowsHitTesting(false)
                    }
                })

            HStack {
                if let result = viewModel.lastResult {
                    resultBadge(result)
                }

                Spacer()

                Button(action: viewModel.send) {
                    if viewModel.isSending {
                        ProgressView()
                            .controlSize(.small)
                            .padding(.horizontal, 8)
                    } else {
                        Label("Send", systemImage: "paperplane.fill")
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isSending)
                .keyboardShortcut(.return, modifiers: .command)
            }
        }
    }

    @ViewBuilder
    private func resultBadge(_ result: SendResult) -> some View {
        switch result {
        case .success:
            Label("Sent", systemImage: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.callout)
        case .failure(let message):
            Label(message, systemImage: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
                .font(.callout)
                .lineLimit(2)
        }
    }
}
