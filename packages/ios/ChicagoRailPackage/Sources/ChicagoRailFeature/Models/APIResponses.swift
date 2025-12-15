import Foundation

// MARK: - Routes Response
public struct GetRoutesResponse: Codable, Sendable {
    public let routes: [Route]
}

// MARK: - Stops Search Response
public struct SearchStopsResponse: Codable, Sendable {
    public let stops: [Stop]
}

// MARK: - Departures Response
public struct GetDeparturesResponse: Codable, Sendable {
    public let stop: Stop
    public let departures: [Departure]
    public let timestamp: String
}

// MARK: - Direct Trips Response
public struct FindDirectTripsResponse: Codable, Sendable {
    public let origin: Stop
    public let destination: Stop
    public let trips: [DirectTrip]
}

// MARK: - API Error
public struct APIError: Codable, Error, Sendable {
    public let error: String
    public let code: String
    public let details: String?
}
