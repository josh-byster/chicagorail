import SwiftUI

public struct DeparturesView: View {
    @State private var viewModel = DeparturesViewModel()

    public init() {}

    public var body: some View {
        VStack(spacing: 0) {
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

            // Departure board
            DepartureBoardView(
                stop: viewModel.selectedStop,
                departures: viewModel.departures,
                isLoading: viewModel.isLoading,
                errorMessage: viewModel.errorMessage
            )
        }
        .navigationTitle("Departures")
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
