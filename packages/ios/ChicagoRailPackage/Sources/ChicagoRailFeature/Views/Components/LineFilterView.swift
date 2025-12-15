import SwiftUI

public struct LineFilterView: View {
    @State private var routes: [Route] = []
    @State private var isLoading = true

    let selectedRouteId: String?
    let onFilterChange: (String?) -> Void

    public init(
        selectedRouteId: String?,
        onFilterChange: @escaping (String?) -> Void
    ) {
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

                // Route buttons
                ForEach(routes) { route in
                    FilterButton(
                        title: route.routeShortName,
                        isSelected: selectedRouteId == route.routeId,
                        color: Color(hex: route.routeColor)
                    ) {
                        onFilterChange(route.routeId)
                    }
                }

                if isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                        .padding(.horizontal, 8)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemGray6))
        .task {
            await loadRoutes()
        }
    }

    private func loadRoutes() async {
        do {
            routes = try await APIService.shared.getRoutes()
        } catch {
            routes = []
        }
        isLoading = false
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
