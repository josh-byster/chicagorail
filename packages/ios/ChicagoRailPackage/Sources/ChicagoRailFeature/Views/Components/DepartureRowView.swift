import SwiftUI

public struct DepartureRowView: View {
    let departure: Departure
    @State private var isExpanded = false
    @State private var tripDetails: GetTripDetailsResponse?
    @State private var isLoading = false
    @State private var loadError: String?

    public init(departure: Departure) {
        self.departure = departure
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
                    VStack(alignment: .leading, spacing: 2) {
                        Text(departure.tripHeadsign)
                            .font(.subheadline)
                            .fontWeight(.medium)

                        Text(formatTime(departure.departureTime))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    // Relative time and chevron
                    HStack(spacing: 8) {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(getRelativeTime(departure.departureTime))
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(relativeTimeColor)

                            Text(departure.direction.rawValue.capitalized)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }

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

    private var relativeTimeColor: Color {
        let relativeTime = getRelativeTime(departure.departureTime)
        if relativeTime == "Now" {
            return .green
        } else if relativeTime.contains("min"), let minutes = Int(relativeTime.components(separatedBy: " ").first ?? "0"), minutes <= 5 {
            return .orange
        }
        return .primary
    }
}
