import ActivityKit
import Foundation

/// Attributes for tracking a train departure in Live Activities (Dynamic Island)
public struct TrainTrackingAttributes: ActivityAttributes {
    /// Dynamic content state that updates during the activity
    public struct ContentState: Codable, Hashable, Sendable {
        public let departureTime: Date
        public let minutesUntilDeparture: Int
        public let status: TrainStatus

        public init(departureTime: Date, minutesUntilDeparture: Int, status: TrainStatus) {
            self.departureTime = departureTime
            self.minutesUntilDeparture = minutesUntilDeparture
            self.status = status
        }

        public enum TrainStatus: String, Codable, Sendable {
            case onTime = "On Time"
            case delayed = "Delayed"
            case boarding = "Boarding"
            case departed = "Departed"
        }
    }

    // MARK: - Static attributes (don't change during activity)

    public let routeShortName: String
    public let routeColor: String
    public let routeTextColor: String
    public let tripHeadsign: String
    public let stationName: String
    public let tripId: String

    public init(
        routeShortName: String,
        routeColor: String,
        routeTextColor: String,
        tripHeadsign: String,
        stationName: String,
        tripId: String
    ) {
        self.routeShortName = routeShortName
        self.routeColor = routeColor
        self.routeTextColor = routeTextColor
        self.tripHeadsign = tripHeadsign
        self.stationName = stationName
        self.tripId = tripId
    }
}
