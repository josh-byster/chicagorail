import Foundation

/// A lightweight representation of a favorited stop for persistence
public struct FavoriteStop: Codable, Identifiable, Hashable, Sendable {
    public let stopId: String
    public let stopName: String
    public let stopDesc: String
    public let addedAt: Date

    public var id: String { stopId }

    public init(stopId: String, stopName: String, stopDesc: String, addedAt: Date = Date()) {
        self.stopId = stopId
        self.stopName = stopName
        self.stopDesc = stopDesc
        self.addedAt = addedAt
    }

    enum CodingKeys: String, CodingKey {
        case stopId = "stop_id"
        case stopName = "stop_name"
        case stopDesc = "stop_desc"
        case addedAt = "added_at"
    }
}
