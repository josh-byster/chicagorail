import SwiftUI

public struct ArrivalsView: View {
    @State private var viewModel = DeparturesViewModel()

    public init() {}

    public var body: some View {
        VStack(spacing: 0) {
            // Warning banner
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)

                Text("Currently showing departures. Arrivals filter coming soon.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(12)
            .frame(maxWidth: .infinity)
            .background(Color.orange.opacity(0.1))

            // Station search
            StationSearchView(
                placeholder: "Search stations...",
                selectedStation: viewModel.selectedStop
            ) { stop in
                Task {
                    await viewModel.selectStop(stop)
                }
            }
            .padding()

            // Line filter
            if viewModel.selectedStop != nil {
                LineFilterView(
                    selectedRouteId: viewModel.routeFilter
                ) { routeId in
                    Task {
                        await viewModel.applyFilter(routeId)
                    }
                }
            }

            // Departure board (showing departures for now)
            DepartureBoardView(
                stop: viewModel.selectedStop,
                departures: viewModel.departures,
                isLoading: viewModel.isLoading,
                errorMessage: viewModel.errorMessage
            )
        }
        .navigationTitle("Arrivals")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await viewModel.loadDepartures()
        }
        .onAppear {
            viewModel.startAutoRefresh()
        }
        .onDisappear {
            viewModel.stopAutoRefresh()
        }
    }
}
