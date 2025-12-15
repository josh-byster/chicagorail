import Foundation

public enum Direction: String, Codable, Sendable {
    case inbound
    case outbound
}

public struct Departure: Codable, Identifiable, Hashable, Sendable {
    public let route: Route
    public let tripHeadsign: String
    public let departureTime: String
    public let arrivalTime: String
    public let direction: Direction
    public let tripId: String

    public var id: String { tripId }

    enum CodingKeys: String, CodingKey {
        case route
        case tripHeadsign = "trip_headsign"
        case departureTime = "departure_time"
        case arrivalTime = "arrival_time"
        case direction
        case tripId = "trip_id"
    }
}
