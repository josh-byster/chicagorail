import SwiftUI
import WidgetKit

// MARK: - Widget Entry

struct DepartureEntry: TimelineEntry {
    let date: Date
    let stopName: String
    let departures: [WidgetDepartureData]
    let isPlaceholder: Bool

    static var placeholder: DepartureEntry {
        DepartureEntry(
            date: Date(),
            stopName: "Union Station",
            departures: [
                WidgetDepartureData(
                    routeShortName: "BNSF",
                    routeColor: "35AB4A",
                    routeTextColor: "FFFFFF",
                    tripHeadsign: "Aurora",
                    departureTime: Date().addingTimeInterval(600)
                ),
                WidgetDepartureData(
                    routeShortName: "UP-N",
                    routeColor: "003D7C",
                    routeTextColor: "FFFFFF",
                    tripHeadsign: "Kenosha",
                    departureTime: Date().addingTimeInterval(1200)
                ),
                WidgetDepartureData(
                    routeShortName: "ME",
                    routeColor: "F9461C",
                    routeTextColor: "FFFFFF",
                    tripHeadsign: "Blue Island",
                    departureTime: Date().addingTimeInterval(1800)
                )
            ],
            isPlaceholder: true
        )
    }

    static var empty: DepartureEntry {
        DepartureEntry(
            date: Date(),
            stopName: "No Station Selected",
            departures: [],
            isPlaceholder: false
        )
    }
}

struct WidgetDepartureData: Identifiable {
    let id = UUID()
    let routeShortName: String
    let routeColor: String
    let routeTextColor: String
    let tripHeadsign: String
    let departureTime: Date

    var minutesUntilDeparture: Int {
        max(0, Int(departureTime.timeIntervalSinceNow / 60))
    }
}

// MARK: - Timeline Provider

struct DepartureProvider: TimelineProvider {
    func placeholder(in context: Context) -> DepartureEntry {
        .placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (DepartureEntry) -> Void) {
        if context.isPreview {
            completion(.placeholder)
        } else {
            Task {
                let entry = await fetchDepartures()
                completion(entry)
            }
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DepartureEntry>) -> Void) {
        Task {
            let entry = await fetchDepartures()
            // Refresh every 5 minutes
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 5, to: Date()) ?? Date()
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    private func fetchDepartures() async -> DepartureEntry {
        // Get favorite stop from shared UserDefaults
        guard let suiteName = UserDefaults(suiteName: "group.com.chicagorail.app"),
              let data = suiteName.data(forKey: "chicagorail_favorites"),
              let favorites = try? JSONDecoder().decode([FavoriteStopData].self, from: data),
              let favorite = favorites.first else {
            return .empty
        }

        // Fetch departures from API
        do {
            let departures = try await fetchDeparturesFromAPI(stopId: favorite.stopId)
            return DepartureEntry(
                date: Date(),
                stopName: favorite.stopName,
                departures: departures,
                isPlaceholder: false
            )
        } catch {
            return DepartureEntry(
                date: Date(),
                stopName: favorite.stopName,
                departures: [],
                isPlaceholder: false
            )
        }
    }

    private func fetchDeparturesFromAPI(stopId: String) async throws -> [WidgetDepartureData] {
        let baseURL = "https://chicagorail.app/api"
        guard let url = URL(string: "\(baseURL)/stops/\(stopId)/departures?limit=5") else {
            throw URLError(.badURL)
        }

        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try JSONDecoder().decode(DeparturesResponse.self, from: data)

        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        return response.departures.compactMap { departure -> WidgetDepartureData? in
            guard let departureTime = dateFormatter.date(from: departure.departureTime) else {
                return nil
            }
            return WidgetDepartureData(
                routeShortName: departure.routeShortName,
                routeColor: departure.routeColor,
                routeTextColor: departure.routeTextColor,
                tripHeadsign: departure.tripHeadsign,
                departureTime: departureTime
            )
        }
    }
}

// MARK: - API Response Types

private struct FavoriteStopData: Codable {
    let stopId: String
    let stopName: String
    let stopDesc: String
    let addedAt: Date
}

private struct DeparturesResponse: Codable {
    let departures: [APIDeparture]
}

private struct APIDeparture: Codable {
    let tripId: String
    let routeShortName: String
    let routeColor: String
    let routeTextColor: String
    let tripHeadsign: String
    let departureTime: String
}

// MARK: - Widget

struct DepartureWidget: Widget {
    let kind = "DepartureWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DepartureProvider()) { entry in
            DepartureWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Train Departures")
        .description("See upcoming departures from your favorite station.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Widget Views

struct DepartureWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: DepartureEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

struct SmallWidgetView: View {
    let entry: DepartureEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Station name
            HStack {
                Image(systemName: "tram.fill")
                    .foregroundStyle(.blue)
                Text(entry.stopName)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .lineLimit(1)
            }

            if entry.departures.isEmpty {
                Spacer()
                Text("No departures")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
            } else {
                // Show first 2 departures
                ForEach(entry.departures.prefix(2)) { departure in
                    SmallDepartureRow(departure: departure)
                }
                Spacer(minLength: 0)
            }
        }
        .redacted(reason: entry.isPlaceholder ? .placeholder : [])
    }
}

struct SmallDepartureRow: View {
    let departure: WidgetDepartureData

    var body: some View {
        HStack(spacing: 6) {
            // Route badge
            Text(departure.routeShortName)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundStyle(Color(hex: departure.routeTextColor))
                .padding(.horizontal, 4)
                .padding(.vertical, 2)
                .background(Color(hex: departure.routeColor), in: RoundedRectangle(cornerRadius: 4))

            // Destination
            Text(departure.tripHeadsign)
                .font(.caption2)
                .lineLimit(1)

            Spacer(minLength: 0)

            // Time
            Text("\(departure.minutesUntilDeparture)m")
                .font(.caption)
                .fontWeight(.semibold)
                .monospacedDigit()
        }
    }
}

struct MediumWidgetView: View {
    let entry: DepartureEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Image(systemName: "tram.fill")
                    .foregroundStyle(.blue)
                Text(entry.stopName)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Spacer()
                Text("Updated \(entry.date.formatted(date: .omitted, time: .shortened))")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            if entry.departures.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    Text("No upcoming departures")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                }
                Spacer()
            } else {
                // Departures grid
                HStack(spacing: 12) {
                    ForEach(entry.departures.prefix(3)) { departure in
                        MediumDepartureCard(departure: departure)
                    }
                }
            }
        }
        .redacted(reason: entry.isPlaceholder ? .placeholder : [])
    }
}

struct MediumDepartureCard: View {
    let departure: WidgetDepartureData

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Route badge
            Text(departure.routeShortName)
                .font(.caption)
                .fontWeight(.bold)
                .foregroundStyle(Color(hex: departure.routeTextColor))
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(Color(hex: departure.routeColor), in: RoundedRectangle(cornerRadius: 6))

            // Destination
            Text(departure.tripHeadsign)
                .font(.caption2)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)

            // Time
            Text("\(departure.minutesUntilDeparture) min")
                .font(.caption)
                .fontWeight(.semibold)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Previews

#Preview("Small", as: .systemSmall) {
    DepartureWidget()
} timeline: {
    DepartureEntry.placeholder
}

#Preview("Medium", as: .systemMedium) {
    DepartureWidget()
} timeline: {
    DepartureEntry.placeholder
}
