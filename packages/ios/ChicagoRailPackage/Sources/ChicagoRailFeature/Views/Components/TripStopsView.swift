import SwiftUI

/// Displays a timeline of stops for a trip
public struct TripStopsView: View {
    let stops: [TripStop]
    let routeColor: Color

    public init(stops: [TripStop], routeColor: Color) {
        self.stops = stops
        self.routeColor = routeColor
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("\(stops.count) stops")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
                .tracking(0.5)
                .padding(.bottom, 8)

            ForEach(Array(stops.enumerated()), id: \.element.id) { index, tripStop in
                HStack(alignment: .center, spacing: 12) {
                    // Timeline indicator
                    VStack(spacing: 0) {
                        Circle()
                            .fill(isTerminal(index: index) ? routeColor : Color.clear)
                            .overlay(
                                Circle()
                                    .strokeBorder(routeColor, lineWidth: 2)
                            )
                            .frame(width: 8, height: 8)

                        if index < stops.count - 1 {
                            Rectangle()
                                .fill(routeColor.opacity(0.3))
                                .frame(width: 2)
                                .frame(height: 24)
                        }
                    }

                    // Stop info
                    HStack {
                        Text(tripStop.stop.stopName)
                            .font(.subheadline)
                            .lineLimit(1)

                        Spacer()

                        Text(formatTime(tripStop.departureTime))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, index < stops.count - 1 ? 0 : 0)
                }
                .frame(minHeight: index < stops.count - 1 ? 32 : nil)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(.secondarySystemBackground))
    }

    private func isTerminal(index: Int) -> Bool {
        index == 0 || index == stops.count - 1
    }
}

#Preview {
    let mockRoute = Route(
        routeId: "UP-N",
        routeShortName: "UP-N",
        routeLongName: "Union Pacific North",
        routeDesc: "",
        routeColor: "009B3A",
        routeTextColor: "FFFFFF",
        routeUrl: ""
    )

    let mockStops: [TripStop] = [
        TripStop(
            stop: Stop(stopId: "1", stopName: "Ogilvie Transportation Center", stopDesc: "", stopLat: 0, stopLon: 0, wheelchairBoarding: 0),
            arrivalTime: "2024-01-15T08:00:00Z",
            departureTime: "2024-01-15T08:00:00Z",
            stopSequence: 1
        ),
        TripStop(
            stop: Stop(stopId: "2", stopName: "Clybourn", stopDesc: "", stopLat: 0, stopLon: 0, wheelchairBoarding: 0),
            arrivalTime: "2024-01-15T08:10:00Z",
            departureTime: "2024-01-15T08:10:00Z",
            stopSequence: 2
        ),
        TripStop(
            stop: Stop(stopId: "3", stopName: "Ravenswood", stopDesc: "", stopLat: 0, stopLon: 0, wheelchairBoarding: 0),
            arrivalTime: "2024-01-15T08:18:00Z",
            departureTime: "2024-01-15T08:18:00Z",
            stopSequence: 3
        ),
        TripStop(
            stop: Stop(stopId: "4", stopName: "Evanston Davis Street", stopDesc: "", stopLat: 0, stopLon: 0, wheelchairBoarding: 0),
            arrivalTime: "2024-01-15T08:30:00Z",
            departureTime: "2024-01-15T08:30:00Z",
            stopSequence: 4
        )
    ]

    return TripStopsView(
        stops: mockStops,
        routeColor: Color(hex: mockRoute.routeColor)
    )
}
