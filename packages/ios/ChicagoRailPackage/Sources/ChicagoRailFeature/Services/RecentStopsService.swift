import Foundation

@Observable
@MainActor
public final class RecentStopsService: Sendable {
    public static let shared = RecentStopsService()

    private static let storageKey = "chicagorail_recent_stops"
    private static let maxRecentStops = 5

    public private(set) var recentStops: [Stop] = []

    private init() {
        loadRecent()
    }

    /// Add a stop to recent history
    public func addRecent(_ stop: Stop) {
        // Remove if already exists
        recentStops.removeAll { $0.stopId == stop.stopId }

        // Add to beginning
        recentStops.insert(stop, at: 0)

        // Trim to max size
        if recentStops.count > Self.maxRecentStops {
            recentStops = Array(recentStops.prefix(Self.maxRecentStops))
        }

        saveRecent()
    }

    /// Clear all recent history
    public func clearRecent() {
        recentStops = []
        UserDefaults.standard.removeObject(forKey: Self.storageKey)
    }

    // MARK: - Private Methods

    private func loadRecent() {
        guard let data = UserDefaults.standard.data(forKey: Self.storageKey),
              let stops = try? JSONDecoder().decode([Stop].self, from: data) else {
            return
        }
        recentStops = stops
    }

    private func saveRecent() {
        guard let data = try? JSONEncoder().encode(recentStops) else {
            return
        }
        UserDefaults.standard.set(data, forKey: Self.storageKey)
    }
}
