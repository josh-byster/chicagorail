import SwiftUI

public struct TripResultView: View {
    let trip: DirectTrip

    public init(trip: DirectTrip) {
        self.trip = trip
    }

    public var body: some View {
        HStack(spacing: 12) {
            // Route color bar
            RoundedRectangle(cornerRadius: 2)
                .fill(Color(hex: trip.route.routeColor))
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 8) {
                // Route and headsign
                HStack {
                    Text(trip.route.routeShortName)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color(hex: trip.route.routeTextColor))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(hex: trip.route.routeColor))
                        .clipShape(RoundedRectangle(cornerRadius: 4))

                    Text("to \(trip.tripHeadsign)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    Spacer()

                    // Duration badge
                    Text(formatDuration(trip.durationMinutes))
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(.systemGray5))
                        .clipShape(Capsule())
                }

                // Times
                HStack(spacing: 16) {
                    // Departure
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Departs")
                            .font(.caption2)
                            .foregroundStyle(.secondary)

                        Text(formatTime(trip.originDeparture))
                            .font(.headline)
                    }

                    Image(systemName: "arrow.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    // Arrival
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Arrives")
                            .font(.caption2)
                            .foregroundStyle(.secondary)

                        Text(formatTime(trip.destinationArrival))
                            .font(.headline)
                    }

                    Spacer()

                    // Relative time
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(getRelativeTime(trip.originDeparture))
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.blue)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}
