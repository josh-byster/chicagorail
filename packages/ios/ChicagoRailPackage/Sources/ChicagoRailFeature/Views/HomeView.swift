import SwiftUI

public struct HomeView: View {
    @State private var showSettings = false

    public init() {}

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "tram.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.blue)

                        Text("Chicago Rail")
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        Text("Track Metra train departures in real-time")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 32)
                    .padding(.bottom, 24)

                    // Feature Cards
                    VStack(spacing: 12) {
                        FeatureCard(
                            title: "View Departures",
                            description: "Check when trains leave from your station",
                            iconName: "arrow.up.right.circle.fill",
                            gradient: .departuresGradient
                        ) {
                            DeparturesView()
                        }

                        FeatureCard(
                            title: "Plan a Trip",
                            description: "Find direct trains between two stations",
                            iconName: "arrow.left.arrow.right.circle.fill",
                            gradient: .tripPlannerGradient
                        ) {
                            TripPlannerView()
                        }
                    }
                    .padding(.horizontal)

                    Spacer(minLength: 32)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
    }
}
