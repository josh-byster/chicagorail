import ActivityKit
import Foundation
import ChicagoRailShared

/// Manages Live Activities for tracking train departures
@Observable
@MainActor
public final class LiveActivityService {
    public static let shared = LiveActivityService()

    /// ID of the current tracking activity
    public private(set) var currentActivityId: String?

    /// Timer for periodic updates
    private var updateTimer: Timer?

    /// Cached departure date for updates
    private var cachedDepartureDate: Date?

    private init() {}

    /// Check if Live Activities are supported and enabled
    public var isSupported: Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }

    /// Check if currently tracking a train
    public var isTracking: Bool {
        currentActivityId != nil
    }

    /// Get the trip ID currently being tracked
    public var trackingTripId: String? {
        guard let activityId = currentActivityId else { return nil }
        let activity = Activity<TrainTrackingAttributes>.activities.first { $0.id == activityId }
        return activity?.attributes.tripId
    }

    /// Start tracking a departure
    public func startTracking(
        departure: Departure,
        stationName: String
    ) async throws {
        // End any existing activity first
        stopTracking()

        guard isSupported else {
            throw LiveActivityError.notSupported
        }

        // Parse departure time
        guard let departureDate = parseDepartureTime(departure.departureTime) else {
            throw LiveActivityError.invalidDepartureTime
        }

        let attributes = TrainTrackingAttributes(
            routeShortName: departure.route.routeShortName,
            routeColor: departure.route.routeColor,
            routeTextColor: departure.route.routeTextColor,
            tripHeadsign: departure.tripHeadsign,
            stationName: stationName,
            tripId: departure.tripId
        )

        let minutesUntil = max(0, Int(departureDate.timeIntervalSinceNow / 60))
        let status = determineStatus(minutesUntil: minutesUntil)

        let initialState = TrainTrackingAttributes.ContentState(
            departureTime: departureDate,
            minutesUntilDeparture: minutesUntil,
            status: status
        )

        let content = ActivityContent(
            state: initialState,
            staleDate: departureDate.addingTimeInterval(60) // Stale 1 min after departure
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: content,
                pushType: nil
            )
            currentActivityId = activity.id
            cachedDepartureDate = departureDate
            startUpdateTimer()
        } catch {
            throw LiveActivityError.failedToStart(error)
        }
    }

    /// Stop tracking the current train
    public func stopTracking() {
        stopUpdateTimer()

        guard let activityId = currentActivityId else { return }
        currentActivityId = nil
        cachedDepartureDate = nil

        // Find and end the activity
        if let activity = Activity<TrainTrackingAttributes>.activities.first(where: { $0.id == activityId }) {
            let finalState = TrainTrackingAttributes.ContentState(
                departureTime: Date(),
                minutesUntilDeparture: 0,
                status: .departed
            )

            Task {
                await activity.end(
                    ActivityContent(state: finalState, staleDate: nil),
                    dismissalPolicy: .immediate
                )
            }
        }
    }

    // MARK: - Private Methods

    private func startUpdateTimer() {
        stopUpdateTimer()

        // Update every 30 seconds
        updateTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.updateActivity()
            }
        }
    }

    private func stopUpdateTimer() {
        updateTimer?.invalidate()
        updateTimer = nil
    }

    private func updateActivity() {
        guard let activityId = currentActivityId,
              let departureDate = cachedDepartureDate else { return }

        let minutesUntil = Int(departureDate.timeIntervalSinceNow / 60)

        // If train has departed, end the activity
        if minutesUntil < -2 {
            stopTracking()
            return
        }

        // Find the activity
        guard let activity = Activity<TrainTrackingAttributes>.activities.first(where: { $0.id == activityId }) else {
            currentActivityId = nil
            return
        }

        let status = determineStatus(minutesUntil: minutesUntil)

        let updatedState = TrainTrackingAttributes.ContentState(
            departureTime: departureDate,
            minutesUntilDeparture: max(0, minutesUntil),
            status: status
        )

        let content = ActivityContent(
            state: updatedState,
            staleDate: departureDate.addingTimeInterval(60)
        )

        Task {
            await activity.update(content)
        }
    }

    private func determineStatus(minutesUntil: Int) -> TrainTrackingAttributes.ContentState.TrainStatus {
        if minutesUntil < 0 {
            return .departed
        } else if minutesUntil <= 2 {
            return .boarding
        } else {
            return .onTime
        }
    }

    private func parseDepartureTime(_ timeString: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        if let date = formatter.date(from: timeString) {
            return date
        }

        // Try without fractional seconds
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: timeString)
    }
}

// MARK: - Errors

public enum LiveActivityError: LocalizedError {
    case notSupported
    case invalidDepartureTime
    case failedToStart(Error)

    public var errorDescription: String? {
        switch self {
        case .notSupported:
            return "Live Activities are not supported or enabled on this device"
        case .invalidDepartureTime:
            return "Could not parse departure time"
        case .failedToStart(let error):
            return "Failed to start tracking: \(error.localizedDescription)"
        }
    }
}
