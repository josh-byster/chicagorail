import Foundation

public enum APIServiceError: Error, LocalizedError {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case serverError(APIError)
    case unknownError

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Failed to parse response: \(error.localizedDescription)"
        case .serverError(let apiError):
            return apiError.error
        case .unknownError:
            return "An unknown error occurred"
        }
    }
}

@Observable
@MainActor
public final class APIService: Sendable {
    public static let shared = APIService()

    private static let defaultBaseURL = "https://www.chicagorail.app/api"
    private static let baseURLKey = "chicagorail_api_base_url"

    public var baseURL: String {
        didSet {
            UserDefaults.standard.set(baseURL, forKey: Self.baseURLKey)
        }
    }

    private init() {
        self.baseURL = UserDefaults.standard.string(forKey: Self.baseURLKey) ?? Self.defaultBaseURL
    }

    public func resetToDefaultURL() {
        baseURL = Self.defaultBaseURL
    }

    // MARK: - API Methods

    /// Get all Metra routes
    public func getRoutes() async throws -> [Route] {
        let response: GetRoutesResponse = try await fetch("/routes")
        return response.routes
    }

    /// Search for stations by query
    public func searchStops(query: String) async throws -> [Stop] {
        guard let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
            throw APIServiceError.invalidURL
        }
        let response: SearchStopsResponse = try await fetch("/stops/search?q=\(encodedQuery)")
        return response.stops
    }

    /// Get departures from a station
    public func getDepartures(stopId: String, routeId: String? = nil) async throws -> GetDeparturesResponse {
        var path = "/stops/\(stopId)/departures"
        if let routeId = routeId {
            path += "?routeId=\(routeId)"
        }
        return try await fetch(path)
    }

    /// Find direct trips between two stations
    public func findDirectTrips(origin: String, destination: String, limit: Int = 10) async throws -> FindDirectTripsResponse {
        let path = "/trips/direct?origin=\(origin)&destination=\(destination)&limit=\(limit)"
        return try await fetch(path)
    }

    // MARK: - Private Methods

    private nonisolated func fetch<T: Decodable>(_ path: String) async throws -> T {
        let baseURL = await self.baseURL
        guard let url = URL(string: baseURL + path) else {
            throw APIServiceError.invalidURL
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(from: url)
        } catch {
            throw APIServiceError.networkError(error)
        }

        if let httpResponse = response as? HTTPURLResponse,
           !(200...299).contains(httpResponse.statusCode) {
            // Try to decode error response
            if let apiError = try? JSONDecoder().decode(APIError.self, from: data) {
                throw APIServiceError.serverError(apiError)
            }
            throw APIServiceError.unknownError
        }

        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIServiceError.decodingError(error)
        }
    }
}
