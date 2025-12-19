import SwiftUI

public struct DepartureBoardView: View {
    let stop: Stop?
    let departures: [Departure]
    let isLoading: Bool
    let errorMessage: String?

    public init(
        stop: Stop?,
        departures: [Departure],
        isLoading: Bool,
        errorMessage: String? = nil
    ) {
        self.stop = stop
        self.departures = departures
        self.isLoading = isLoading
        self.errorMessage = errorMessage
    }

    public var body: some View {
        Group {
            if let stop = stop {
                VStack(alignment: .leading, spacing: 0) {
                    // Station header
                    VStack(alignment: .leading, spacing: 4) {
                        Text(stop.stopName)
                            .font(.title2)
                            .fontWeight(.bold)

                        if !stop.stopDesc.isEmpty {
                            Text(stop.stopDesc)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()

                    Divider()

                    // Content
                    if isLoading {
                        loadingView
                    } else if let error = errorMessage {
                        errorView(error)
                    } else if departures.isEmpty {
                        emptyView
                    } else {
                        departuresList
                    }
                }
            } else {
                placeholderView
            }
        }
    }

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text("Loading departures...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
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

    private var emptyView: some View {
        VStack(spacing: 12) {
            Image(systemName: "tram")
                .font(.largeTitle)
                .foregroundStyle(.secondary)

            Text("No departures found")
                .font(.headline)

            Text("There are no upcoming departures from this station.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    private var departuresList: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(departures) { departure in
                    DepartureRowView(
                        departure: departure,
                        stationName: stop?.stopName ?? ""
                    )

                    if departure.id != departures.last?.id {
                        Divider()
                            .padding(.leading, 60)
                    }
                }
            }
        }
    }

    private var placeholderView: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text("Select a station")
                .font(.headline)

            Text("Search for a station above to see upcoming departures")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}
