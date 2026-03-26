import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = MessageViewModel()

    var body: some View {
        VStack(spacing: 0) {
            SendFormView(viewModel: viewModel)
                .padding()

            Divider()

            HistoryView(viewModel: viewModel)
        }
        .frame(minWidth: 440, minHeight: 500)
    }
}
