import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Live Activity Attributes (duplicated for widget target)

struct TrainTrackingAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let departureTime: Date
        let minutesUntilDeparture: Int
        let status: TrainStatus

        enum TrainStatus: String, Codable {
            case onTime = "On Time"
            case delayed = "Delayed"
            case boarding = "Boarding"
            case departed = "Departed"
        }
    }

    let routeShortName: String
    let routeColor: String
    let routeTextColor: String
    let tripHeadsign: String
    let stationName: String
    let tripId: String
}

// MARK: - Live Activity Configuration

struct TrainTrackingLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TrainTrackingAttributes.self) { context in
            // Lock screen / banner UI
            LockScreenView(context: context)
                .activityBackgroundTint(Color(hex: context.attributes.routeColor).opacity(0.2))
                .activitySystemActionForegroundColor(.primary)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    RouteBadge(
                        name: context.attributes.routeShortName,
                        color: context.attributes.routeColor,
                        textColor: context.attributes.routeTextColor
                    )
                }

                DynamicIslandExpandedRegion(.trailing) {
                    CountdownView(
                        minutes: context.state.minutesUntilDeparture,
                        status: context.state.status
                    )
                }

                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.tripHeadsign)
                            .font(.headline)
                            .lineLimit(1)

                        Text("from \(context.attributes.stationName)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        StatusIndicator(status: context.state.status)
                        Spacer()
                        Text(context.state.departureTime.formatted(date: .omitted, time: .shortened))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                // Compact leading
                RouteBadge(
                    name: context.attributes.routeShortName,
                    color: context.attributes.routeColor,
                    textColor: context.attributes.routeTextColor,
                    compact: true
                )
            } compactTrailing: {
                // Compact trailing
                Text("\(context.state.minutesUntilDeparture)m")
                    .font(.caption)
                    .fontWeight(.bold)
                    .monospacedDigit()
                    .foregroundStyle(statusColor(context.state.status))
            } minimal: {
                // Minimal (when other islands are showing)
                Text("\(context.state.minutesUntilDeparture)")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .monospacedDigit()
            }
        }
    }

    private func statusColor(_ status: TrainTrackingAttributes.ContentState.TrainStatus) -> Color {
        switch status {
        case .onTime: return .green
        case .delayed: return .orange
        case .boarding: return .blue
        case .departed: return .secondary
        }
    }
}

// MARK: - Lock Screen View

private struct LockScreenView: View {
    let context: ActivityViewContext<TrainTrackingAttributes>

    var body: some View {
        HStack(spacing: 16) {
            // Route badge
            VStack {
                Text(context.attributes.routeShortName)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(Color(hex: context.attributes.routeTextColor))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(hex: context.attributes.routeColor), in: RoundedRectangle(cornerRadius: 8))
            }

            // Train info
            VStack(alignment: .leading, spacing: 4) {
                Text(context.attributes.tripHeadsign)
                    .font(.headline)

                Text("from \(context.attributes.stationName)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            // Countdown
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(context.state.minutesUntilDeparture)")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .monospacedDigit()

                Text("min")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
    }
}

// MARK: - Components

private struct RouteBadge: View {
    let name: String
    let color: String
    let textColor: String
    var compact: Bool = false

    var body: some View {
        Text(name)
            .font(compact ? .caption2 : .caption)
            .fontWeight(.bold)
            .foregroundStyle(Color(hex: textColor))
            .padding(.horizontal, compact ? 4 : 6)
            .padding(.vertical, compact ? 2 : 3)
            .background(Color(hex: color), in: RoundedRectangle(cornerRadius: compact ? 4 : 6))
    }
}

private struct CountdownView: View {
    let minutes: Int
    let status: TrainTrackingAttributes.ContentState.TrainStatus

    var body: some View {
        VStack(alignment: .trailing, spacing: 0) {
            Text("\(minutes)")
                .font(.title2)
                .fontWeight(.bold)
                .monospacedDigit()

            Text("min")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

private struct StatusIndicator: View {
    let status: TrainTrackingAttributes.ContentState.TrainStatus

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 6, height: 6)

            Text(status.rawValue)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var statusColor: Color {
        switch status {
        case .onTime: return .green
        case .delayed: return .orange
        case .boarding: return .blue
        case .departed: return .secondary
        }
    }
}

