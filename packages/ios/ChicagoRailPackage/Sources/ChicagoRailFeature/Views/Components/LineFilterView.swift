import SwiftUI

public struct LineFilterView: View {
    let routes: [Route]
    let selectedRouteId: String?
    let onFilterChange: (String?) -> Void

    public init(
        routes: [Route],
        selectedRouteId: String?,
        onFilterChange: @escaping (String?) -> Void
    ) {
        self.routes = routes
        self.selectedRouteId = selectedRouteId
        self.onFilterChange = onFilterChange
    }

    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // All Lines button
                FilterButton(
                    title: "All Lines",
                    isSelected: selectedRouteId == nil,
                    color: .blue
                ) {
                    onFilterChange(nil)
                }

                // Route buttons - only routes that serve this station
                ForEach(routes) { route in
                    FilterButton(
                        title: route.routeShortName,
                        isSelected: selectedRouteId == route.routeId,
                        color: Color(hex: route.routeColor)
                    ) {
                        onFilterChange(route.routeId)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemGray6))
    }
}

// MARK: - Filter Button

private struct FilterButton: View {
    let title: String
    let isSelected: Bool
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundStyle(isSelected ? .white : .primary)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? color : Color(.systemBackground))
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .strokeBorder(isSelected ? Color.clear : Color(.systemGray4), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}
