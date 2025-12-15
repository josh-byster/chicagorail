import Foundation

@Observable
@MainActor
public final class DeparturesViewModel {
    public var selectedStop: Stop?
    public var departures: [Departure] = []
    public var routeFilter: String?
    public var isLoading: Bool = false
    public var errorMessage: String?

    private var refreshTask: Task<Void, Never>?
    private let refreshInterval: Duration = .seconds(30)

    public init() {}

    /// Load departures for the selected stop
    public func loadDepartures() async {
        guard let stop = selectedStop else {
            departures = []
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            let response = try await APIService.shared.getDepartures(
                stopId: stop.stopId,
                routeId: routeFilter
            )
            departures = response.departures
        } catch {
            errorMessage = error.localizedDescription
            departures = []
        }

        isLoading = false
    }

    /// Start auto-refresh every 30 seconds
    public func startAutoRefresh() {
        stopAutoRefresh()

        refreshTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(for: refreshInterval)

                guard !Task.isCancelled else { break }

                await loadDepartures()
            }
        }
    }

    /// Stop auto-refresh
    public func stopAutoRefresh() {
        refreshTask?.cancel()
        refreshTask = nil
    }

    /// Select a stop and load its departures
    public func selectStop(_ stop: Stop) async {
        selectedStop = stop
        RecentStopsService.shared.addRecent(stop)
        await loadDepartures()
    }

    /// Apply a route filter
    public func applyFilter(_ routeId: String?) async {
        routeFilter = routeId
        await loadDepartures()
    }

    /// Clear selection
    public func clearSelection() {
        stopAutoRefresh()
        selectedStop = nil
        departures = []
        routeFilter = nil
        errorMessage = nil
    }
}
