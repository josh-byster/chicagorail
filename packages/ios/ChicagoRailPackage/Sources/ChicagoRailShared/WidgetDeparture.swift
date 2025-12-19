import Foundation

/// Lightweight departure model for widget display
public struct WidgetDeparture: Codable, Identifiable, Sendable {
    public let tripId: String
    public let routeShortName: String
    public let routeColor: String
    public let routeTextColor: String
    public let tripHeadsign: String
    public let departureTime: Date

    public var id: String { tripId }

    public init(
        tripId: String,
        routeShortName: String,
        routeColor: String,
        routeTextColor: String,
        tripHeadsign: String,
        departureTime: Date
    ) {
        self.tripId = tripId
        self.routeShortName = routeShortName
        self.routeColor = routeColor
        self.routeTextColor = routeTextColor
        self.tripHeadsign = tripHeadsign
        self.departureTime = departureTime
    }
}

/// Widget data stored in shared UserDefaults
public struct WidgetData: Codable, Sendable {
    public let stopId: String
    public let stopName: String
    public let departures: [WidgetDeparture]
    public let lastUpdated: Date

    public init(stopId: String, stopName: String, departures: [WidgetDeparture], lastUpdated: Date = Date()) {
        self.stopId = stopId
        self.stopName = stopName
        self.departures = departures
        self.lastUpdated = lastUpdated
    }
}
