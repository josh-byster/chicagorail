import Foundation

/// A stop along a trip with arrival/departure times
public struct TripStop: Codable, Identifiable, Hashable, Sendable {
    public let stop: Stop
    public let arrivalTime: String
    public let departureTime: String
    public let stopSequence: Int

    public var id: String { "\(stop.stopId)-\(stopSequence)" }

    enum CodingKeys: String, CodingKey {
        case stop
        case arrivalTime = "arrival_time"
        case departureTime = "departure_time"
        case stopSequence = "stop_sequence"
    }
}

/// Response from GET /api/trips/:tripId
public struct GetTripDetailsResponse: Codable, Sendable {
    public let tripId: String
    public let route: Route
    public let tripHeadsign: String
    public let direction: Direction
    public let stops: [TripStop]

    enum CodingKeys: String, CodingKey {
        case tripId = "trip_id"
        case route
        case tripHeadsign = "trip_headsign"
        case direction
        case stops
    }
}
