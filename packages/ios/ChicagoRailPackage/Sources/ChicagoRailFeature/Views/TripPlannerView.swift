import SwiftUI

public struct TripPlannerView: View {
    @State private var viewModel = TripPlannerViewModel()
    @State private var isSearchingOrigin = false
    @State private var isSearchingDestination = false

    public init() {}

    public var body: some View {
        VStack(spacing: 0) {
            // Station selection
            VStack(spacing: 12) {
                // Origin
                StationPickerButton(
                    label: "From",
                    station: viewModel.origin,
                    placeholder: "Select origin station"
                ) {
                    isSearchingOrigin = true
                }

                // Swap button
                HStack {
                    Spacer()
                    Button {
                        viewModel.swapStations()
                    } label: {
                        Image(systemName: "arrow.up.arrow.down")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(.blue)
                            .padding(8)
                            .background(Color(.systemGray6))
                            .clipShape(Circle())
                    }
                    .disabled(viewModel.origin == nil && viewModel.destination == nil)
                    Spacer()
                }

                // Destination
                StationPickerButton(
                    label: "To",
                    station: viewModel.destination,
                    placeholder: "Select destination station"
                ) {
                    isSearchingDestination = true
                }

                // Find trains button
                Button {
                    Task {
                        await viewModel.findTrips()
                    }
                } label: {
                    HStack {
                        if viewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "magnifyingglass")
                        }
                        Text("Find Trains")
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(canSearch ? Color.blue : Color.gray)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(!canSearch || viewModel.isLoading)
                .padding(.top, 8)
            }
            .padding()

            Divider()

            // Results
            if let error = viewModel.errorMessage {
                errorView(error)
            } else if viewModel.hasSearched && viewModel.trips.isEmpty {
                emptyResultsView
            } else if !viewModel.trips.isEmpty {
                tripsList
            } else {
                instructionsView
            }
        }
        .navigationTitle("Plan a Trip")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $isSearchingOrigin) {
            StationSearchSheet(title: "Select Origin") { stop in
                viewModel.setOrigin(stop)
            }
        }
        .sheet(isPresented: $isSearchingDestination) {
            StationSearchSheet(title: "Select Destination") { stop in
                viewModel.setDestination(stop)
            }
        }
    }

    private var canSearch: Bool {
        viewModel.origin != nil && viewModel.destination != nil
    }

    private var tripsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.trips) { trip in
                    TripResultView(trip: trip)
                }
            }
            .padding()
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(.orange)

            Text("Error")
                .font(.headline)

            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    private var emptyResultsView: some View {
        VStack(spacing: 12) {
            Image(systemName: "tram")
                .font(.largeTitle)
                .foregroundStyle(.secondary)

            Text("No Direct Trains Found")
                .font(.headline)

            Text("There are no direct trains between these stations at this time.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    private var instructionsView: some View {
        VStack(spacing: 12) {
            Image(systemName: "arrow.left.arrow.right.circle")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text("Plan Your Journey")
                .font(.headline)

            Text("Select origin and destination stations to find direct trains")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

// MARK: - Station Picker Button

private struct StationPickerButton: View {
    let label: String
    let station: Stop?
    let placeholder: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(label)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if let station = station {
                        Text(station.stopName)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundStyle(.primary)
                    } else {
                        Text(placeholder)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Station Search Sheet

private struct StationSearchSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var searchViewModel = StationSearchViewModel()

    let title: String
    let onSelect: (Stop) -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search field
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(.secondary)

                    TextField("Search stations...", text: $searchViewModel.query)
                        .textFieldStyle(.plain)
                        .autocorrectionDisabled()
                        .onChange(of: searchViewModel.query) {
                            searchViewModel.search()
                        }

                    if !searchViewModel.query.isEmpty {
                        Button {
                            searchViewModel.clearSearch()
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(.secondary)
                        }
                        .buttonStyle(.plain)
                    }

                    if searchViewModel.isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                }
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .padding()

                // Results
                List {
                    if searchViewModel.query.count >= 2 {
                        if !searchViewModel.results.isEmpty {
                            Section("Search Results") {
                                ForEach(searchViewModel.results) { stop in
                                    Button {
                                        onSelect(stop)
                                        dismiss()
                                    } label: {
                                        StationListRow(stop: stop)
                                    }
                                }
                            }
                        } else if !searchViewModel.isLoading {
                            ContentUnavailableView(
                                "No Stations Found",
                                systemImage: "magnifyingglass",
                                description: Text("Try a different search term")
                            )
                        }
                    } else {
                        let recentStops = RecentStopsService.shared.recentStops
                        if !recentStops.isEmpty {
                            Section("Recent Searches") {
                                ForEach(recentStops) { stop in
                                    Button {
                                        onSelect(stop)
                                        dismiss()
                                    } label: {
                                        StationListRow(stop: stop, showRecent: true)
                                    }
                                }
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

private struct StationListRow: View {
    let stop: Stop
    var showRecent: Bool = false

    var body: some View {
        HStack {
            Image(systemName: showRecent ? "clock" : "tram")
                .foregroundStyle(.secondary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(stop.stopName)
                    .font(.subheadline)
                    .foregroundStyle(.primary)

                if !stop.stopDesc.isEmpty {
                    Text(stop.stopDesc)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
