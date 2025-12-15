import Foundation

@Observable
@MainActor
public final class TripPlannerViewModel {
    public var origin: Stop?
    public var destination: Stop?
    public var trips: [DirectTrip] = []
    public var isLoading: Bool = false
    public var hasSearched: Bool = false
    public var errorMessage: String?

    public init() {}

    /// Find direct trips between origin and destination
    public func findTrips() async {
        guard let origin = origin, let destination = destination else {
            errorMessage = "Please select both origin and destination"
            return
        }

        guard origin.stopId != destination.stopId else {
            errorMessage = "Origin and destination cannot be the same"
            return
        }

        isLoading = true
        errorMessage = nil
        hasSearched = true

        do {
            let response = try await APIService.shared.findDirectTrips(
                origin: origin.stopId,
                destination: destination.stopId
            )
            trips = response.trips
        } catch {
            errorMessage = error.localizedDescription
            trips = []
        }

        isLoading = false
    }

    /// Set origin and add to recent
    public func setOrigin(_ stop: Stop) {
        origin = stop
        RecentStopsService.shared.addRecent(stop)
        // Reset search when changing stations
        hasSearched = false
        trips = []
    }

    /// Set destination and add to recent
    public func setDestination(_ stop: Stop) {
        destination = stop
        RecentStopsService.shared.addRecent(stop)
        // Reset search when changing stations
        hasSearched = false
        trips = []
    }

    /// Swap origin and destination
    public func swapStations() {
        let temp = origin
        origin = destination
        destination = temp
        // Reset search when swapping
        hasSearched = false
        trips = []
    }

    /// Clear all selections
    public func clear() {
        origin = nil
        destination = nil
        trips = []
        hasSearched = false
        errorMessage = nil
    }
}
