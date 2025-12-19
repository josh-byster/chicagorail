import SwiftUI

public struct DepartureRowView: View {
    let departure: Departure
    let stationName: String
    @State private var isExpanded = false
    @State private var tripDetails: GetTripDetailsResponse?
    @State private var isLoading = false
    @State private var loadError: String?
    @State private var showTrackingError = false
    @State private var trackingErrorMessage = ""

    public init(departure: Departure, stationName: String = "") {
        self.departure = departure
        self.stationName = stationName
    }

    public var body: some View {
        VStack(spacing: 0) {
            // Main row - tappable
            Button(action: toggleExpanded) {
                HStack(spacing: 12) {
                    // Route color bar
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(hex: departure.route.routeColor))
                        .frame(width: 4)

                    // Route badge - fixed width for alignment
                    Text(departure.route.routeShortName)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color(hex: departure.route.routeTextColor))
                        .frame(minWidth: 44)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(hex: departure.route.routeColor))
                        .clipShape(RoundedRectangle(cornerRadius: 4))

                    // Destination
                    Text(departure.tripHeadsign)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Spacer()

                    // Time and chevron
                    HStack(spacing: 8) {
                        Text(formatTime(departure.departureTime))
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        Image(systemName: "chevron.down")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)
                            .rotationEffect(.degrees(isExpanded ? 180 : 0))
                    }
                }
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .background(Color(.systemBackground))
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            // Expandable stops section
            if isExpanded {
                VStack(spacing: 0) {
                    // Track Train button
                    if LiveActivityService.shared.isSupported {
                        TrackTrainButton(
                            departure: departure,
                            stationName: stationName,
                            showError: $showTrackingError,
                            errorMessage: $trackingErrorMessage
                        )
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color(.secondarySystemBackground))
                    }

                    if isLoading {
                        HStack {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Loading stops...")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color(.secondarySystemBackground))
                    } else if let error = loadError {
                        Text(error)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color(.secondarySystemBackground))
                    } else if let details = tripDetails {
                        TripStopsView(
                            stops: details.stops,
                            routeColor: Color(hex: departure.route.routeColor)
                        )
                    }
                }
                .transition(.asymmetric(
                    insertion: .push(from: .top).combined(with: .opacity),
                    removal: .push(from: .bottom).combined(with: .opacity)
                ))
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 0))
        .alert("Tracking Error", isPresented: $showTrackingError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(trackingErrorMessage)
        }
    }

    private func toggleExpanded() {
        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
            isExpanded.toggle()
        }

        // Load trip details if expanding and not already loaded
        if isExpanded && tripDetails == nil && !isLoading {
            loadTripDetails()
        }
    }

    private func loadTripDetails() {
        isLoading = true
        loadError = nil

        Task {
            do {
                let details = try await APIService.shared.getTripDetails(tripId: departure.tripId)
                await MainActor.run {
                    tripDetails = details
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    loadError = "Failed to load stops"
                    isLoading = false
                }
            }
        }
    }

}

// MARK: - Track Train Button

private struct TrackTrainButton: View {
    let departure: Departure
    let stationName: String
    @Binding var showError: Bool
    @Binding var errorMessage: String

    private var isTracking: Bool {
        LiveActivityService.shared.trackingTripId == departure.tripId
    }

    var body: some View {
        Button {
            Task {
                if isTracking {
                    LiveActivityService.shared.stopTracking()
                } else {
                    do {
                        try await LiveActivityService.shared.startTracking(
                            departure: departure,
                            stationName: stationName
                        )
                    } catch {
                        errorMessage = error.localizedDescription
                        showError = true
                    }
                }
            }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: isTracking ? "stop.circle.fill" : "location.circle.fill")
                    .font(.subheadline)

                Text(isTracking ? "Stop Tracking" : "Track This Train")
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .foregroundStyle(isTracking ? .red : .blue)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(
                (isTracking ? Color.red : Color.blue).opacity(0.1),
                in: RoundedRectangle(cornerRadius: 8)
            )
        }
        .buttonStyle(.plain)
    }
}
