import Foundation
import ChicagoRailShared

@Observable
@MainActor
public final class FavoritesService: Sendable {
    public static let shared = FavoritesService()

    public private(set) var favorites: [FavoriteStop] = []

    private init() {
        loadFavorites()
    }

    /// Check if a stop is favorited
    public func isFavorite(_ stopId: String) -> Bool {
        favorites.contains { $0.stopId == stopId }
    }

    /// Add a stop to favorites
    public func addFavorite(_ stop: Stop) {
        guard !isFavorite(stop.stopId) else { return }

        let favorite = FavoriteStop(
            stopId: stop.stopId,
            stopName: stop.stopName,
            stopDesc: stop.stopDesc
        )
        favorites.insert(favorite, at: 0)
        saveFavorites()
    }

    /// Remove a stop from favorites
    public func removeFavorite(_ stopId: String) {
        favorites.removeAll { $0.stopId == stopId }
        saveFavorites()
    }

    /// Toggle favorite status for a stop
    public func toggleFavorite(_ stop: Stop) {
        if isFavorite(stop.stopId) {
            removeFavorite(stop.stopId)
        } else {
            addFavorite(stop)
        }
    }

    /// Clear all favorites
    public func clearFavorites() {
        favorites = []
        SharedUserDefaults.shared.removeObject(forKey: SharedUserDefaults.favoritesKey)
    }

    // MARK: - Private Methods

    private func loadFavorites() {
        guard let data = SharedUserDefaults.shared.data(forKey: SharedUserDefaults.favoritesKey),
              let favorites = try? JSONDecoder().decode([FavoriteStop].self, from: data) else {
            return
        }
        self.favorites = favorites
    }

    private func saveFavorites() {
        guard let data = try? JSONEncoder().encode(favorites) else {
            return
        }
        SharedUserDefaults.shared.set(data, forKey: SharedUserDefaults.favoritesKey)
    }
}
