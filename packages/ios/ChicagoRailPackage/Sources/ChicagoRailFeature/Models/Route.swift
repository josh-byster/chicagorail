import Foundation

public struct Route: Codable, Identifiable, Hashable, Sendable {
    public let routeId: String
    public let routeShortName: String
    public let routeLongName: String
    public let routeDesc: String
    public let routeColor: String
    public let routeTextColor: String
    public let routeUrl: String

    public var id: String { routeId }

    enum CodingKeys: String, CodingKey {
        case routeId = "route_id"
        case routeShortName = "route_short_name"
        case routeLongName = "route_long_name"
        case routeDesc = "route_desc"
        case routeColor = "route_color"
        case routeTextColor = "route_text_color"
        case routeUrl = "route_url"
    }
}
