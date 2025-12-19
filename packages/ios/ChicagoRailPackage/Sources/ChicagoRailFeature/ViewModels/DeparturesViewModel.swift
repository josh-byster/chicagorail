import Foundation

@Observable
@MainActor
public final class DeparturesViewModel {
    public var selectedStop: Stop?
    public var departures: [Departure] = []
    public var allDepartures: [Departure] = []  // Unfiltered departures for route extraction
    public var routeFilter: String?
    public var selectedDate: Date = Date()
    public var isLoading: Bool = false
    public var errorMessage: String?

    private var refreshTask: Task<Void, Never>?
    private let refreshInterval: Duration = .seconds(30)

    public init() {}

    /// Check if selected date is today
    public var isToday: Bool {
        Calendar.current.isDateInToday(selectedDate)
    }

    /// Routes that serve the currently selected station (extracted from departures)
    public var availableRoutes: [Route] {
        var seen = Set<String>()
        return allDepartures.compactMap { departure in
            guard !seen.contains(departure.route.routeId) else { return nil }
            seen.insert(departure.route.routeId)
            return departure.route
        }.sorted { $0.routeShortName < $1.routeShortName }
    }

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
                routeId: routeFilter,
                date: selectedDate
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
        routeFilter = nil  // Reset filter when selecting new station
        RecentStopsService.shared.addRecent(stop)

        // Load all departures (unfiltered) to get available routes
        do {
            let response = try await APIService.shared.getDepartures(stopId: stop.stopId, routeId: nil, date: selectedDate)
            allDepartures = response.departures
            departures = response.departures
        } catch {
            errorMessage = error.localizedDescription
            allDepartures = []
            departures = []
        }
    }

    /// Change the selected date and reload departures
    public func selectDate(_ date: Date) async {
        selectedDate = date
        routeFilter = nil  // Reset filter when changing date

        guard let stop = selectedStop else { return }

        // Reload all departures for the new date
        do {
            let response = try await APIService.shared.getDepartures(stopId: stop.stopId, routeId: nil, date: date)
            allDepartures = response.departures
            departures = response.departures
        } catch {
            errorMessage = error.localizedDescription
            allDepartures = []
            departures = []
        }
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
        allDepartures = []
        routeFilter = nil
        errorMessage = nil
    }
}
