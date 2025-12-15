import SwiftUI

public struct DepartureRowView: View {
    let departure: Departure

    public init(departure: Departure) {
        self.departure = departure
    }

    public var body: some View {
        HStack(spacing: 12) {
            // Route color bar
            RoundedRectangle(cornerRadius: 2)
                .fill(Color(hex: departure.route.routeColor))
                .frame(width: 4)

            // Route badge
            Text(departure.route.routeShortName)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(Color(hex: departure.route.routeTextColor))
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

            // Relative time
            VStack(alignment: .trailing, spacing: 2) {
                Text(getRelativeTime(departure.departureTime))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(relativeTimeColor)

                Text(departure.direction.rawValue.capitalized)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .background(Color(.systemBackground))
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
