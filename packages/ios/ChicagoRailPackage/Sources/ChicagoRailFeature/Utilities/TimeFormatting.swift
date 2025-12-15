import Foundation

/// Formats an ISO datetime string to a readable time (e.g., "3:45 PM")
public func formatTime(_ isoString: String) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    guard let date = formatter.date(from: isoString) else {
        // Try without fractional seconds
        formatter.formatOptions = [.withInternetDateTime]
        guard let date = formatter.date(from: isoString) else {
            return isoString
        }
        return formatDate(date)
    }

    return formatDate(date)
}

private func formatDate(_ date: Date) -> String {
    let displayFormatter = DateFormatter()
    displayFormatter.dateFormat = "h:mm a"
    return displayFormatter.string(from: date)
}

/// Returns a relative time string (e.g., "Now", "5 min", "1h 30m")
public func getRelativeTime(_ isoString: String) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    guard let date = formatter.date(from: isoString) else {
        // Try without fractional seconds
        formatter.formatOptions = [.withInternetDateTime]
        guard let date = formatter.date(from: isoString) else {
            return ""
        }
        return calculateRelativeTime(from: date)
    }

    return calculateRelativeTime(from: date)
}

private func calculateRelativeTime(from date: Date) -> String {
    let now = Date()
    let diff = date.timeIntervalSince(now)
    let minutes = Int(diff / 60)

    if minutes <= 0 {
        return "Now"
    } else if minutes < 60 {
        return "\(minutes) min"
    } else {
        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        if remainingMinutes == 0 {
            return "\(hours)h"
        }
        return "\(hours)h \(remainingMinutes)m"
    }
}

/// Formats duration in minutes to a readable string
public func formatDuration(_ minutes: Int) -> String {
    if minutes < 60 {
        return "\(minutes) min"
    } else {
        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        if remainingMinutes == 0 {
            return "\(hours)h"
        }
        return "\(hours)h \(remainingMinutes)m"
    }
}
