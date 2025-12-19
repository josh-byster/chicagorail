import Foundation

/// Provides access to shared UserDefaults via App Groups for data sharing between app and widget
public struct SharedUserDefaults {
    public static let suiteName = "group.com.chicagorail.app"

    /// Shared UserDefaults instance using App Group container
    public static var shared: UserDefaults {
        UserDefaults(suiteName: suiteName) ?? .standard
    }

    // MARK: - Storage Keys

    /// Key for storing favorite stops
    public static let favoritesKey = "chicagorail_favorites"

    /// Key for storing the selected widget stop
    public static let widgetStopKey = "chicagorail_widget_stop"

    /// Key for caching widget departures
    public static let widgetDeparturesKey = "chicagorail_widget_departures"
}
