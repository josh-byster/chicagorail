import Foundation

public struct DirectTrip: Codable, Identifiable, Hashable, Sendable {
    public let route: Route
    public let tripId: String
    public let tripHeadsign: String
    public let originDeparture: String
    public let destinationArrival: String
    public let durationMinutes: Int

    public var id: String { tripId }

    enum CodingKeys: String, CodingKey {
        case route
        case tripId = "trip_id"
        case tripHeadsign = "trip_headsign"
        case originDeparture = "origin_departure"
        case destinationArrival = "destination_arrival"
        case durationMinutes = "duration_minutes"
    }
}
