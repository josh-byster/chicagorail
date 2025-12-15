import Foundation

public struct Stop: Codable, Identifiable, Hashable, Sendable {
    public let stopId: String
    public let stopName: String
    public let stopDesc: String
    public let stopLat: Double
    public let stopLon: Double
    public let wheelchairBoarding: Int

    public var id: String { stopId }

    enum CodingKeys: String, CodingKey {
        case stopId = "stop_id"
        case stopName = "stop_name"
        case stopDesc = "stop_desc"
        case stopLat = "stop_lat"
        case stopLon = "stop_lon"
        case wheelchairBoarding = "wheelchair_boarding"
    }
}
