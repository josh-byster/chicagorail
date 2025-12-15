import SwiftUI

public struct FeatureCard<Destination: View>: View {
    let title: String
    let description: String
    let iconName: String
    let gradient: LinearGradient
    let destination: () -> Destination

    public init(
        title: String,
        description: String,
        iconName: String,
        gradient: LinearGradient,
        @ViewBuilder destination: @escaping () -> Destination
    ) {
        self.title = title
        self.description = description
        self.iconName = iconName
        self.gradient = gradient
        self.destination = destination
    }

    public var body: some View {
        NavigationLink {
            destination()
        } label: {
            HStack(spacing: 16) {
                Image(systemName: iconName)
                    .font(.system(size: 32))
                    .foregroundStyle(.white)
                    .frame(width: 60, height: 60)
                    .background(
                        Circle()
                            .fill(.white.opacity(0.2))
                    )

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(.white)

                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.8))
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.8))
            }
            .padding(20)
            .background(gradient)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preset Gradients

public extension LinearGradient {
    static let departuresGradient = LinearGradient(
        colors: [Color(hex: "3B82F6"), Color(hex: "1D4ED8")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let arrivalsGradient = LinearGradient(
        colors: [Color(hex: "10B981"), Color(hex: "059669")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let tripPlannerGradient = LinearGradient(
        colors: [Color(hex: "8B5CF6"), Color(hex: "6D28D9")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
