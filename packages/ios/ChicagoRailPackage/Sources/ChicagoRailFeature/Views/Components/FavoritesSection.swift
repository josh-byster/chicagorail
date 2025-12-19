import SwiftUI
import ChicagoRailShared

/// Horizontal scrolling section showing favorite stations with quick access
struct FavoritesSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Favorites")
                .font(.headline)
                .padding(.horizontal)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(FavoritesService.shared.favorites) { favorite in
                        NavigationLink {
                            FavoriteDeparturesView(favorite: favorite)
                        } label: {
                            FavoriteStopCard(favorite: favorite)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Favorite Departures View

/// Wrapper view that pre-loads departures for a favorite stop
private struct FavoriteDeparturesView: View {
    let favorite: FavoriteStop
    @State private var viewModel = DeparturesViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // Line filter - only show routes that serve this station
            if viewModel.selectedStop != nil && !viewModel.availableRoutes.isEmpty {
                LineFilterView(
                    routes: viewModel.availableRoutes,
                    selectedRouteId: viewModel.routeFilter
                ) { routeId in
                    Task {
                        await viewModel.applyFilter(routeId)
                    }
                }
            }

            // Departure board
            DepartureBoardView(
                stop: viewModel.selectedStop,
                departures: viewModel.departures,
                isLoading: viewModel.isLoading,
                errorMessage: viewModel.errorMessage
            )
        }
        .navigationTitle(favorite.stopName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let stop = viewModel.selectedStop {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        FavoritesService.shared.toggleFavorite(stop)
                    } label: {
                        Image(systemName: FavoritesService.shared.isFavorite(stop.stopId) ? "star.fill" : "star")
                            .foregroundStyle(FavoritesService.shared.isFavorite(stop.stopId) ? .yellow : .secondary)
                    }
                }
            }
        }
        .refreshable {
            await viewModel.loadDepartures()
        }
        .task {
            // Create a Stop from the favorite and load departures
            let stop = Stop(
                stopId: favorite.stopId,
                stopName: favorite.stopName,
                stopDesc: favorite.stopDesc,
                stopLat: 0,
                stopLon: 0,
                wheelchairBoarding: 0
            )
            await viewModel.selectStop(stop)
            viewModel.startAutoRefresh()
        }
        .onDisappear {
            viewModel.stopAutoRefresh()
        }
    }
}

// MARK: - Favorite Stop Card

private struct FavoriteStopCard: View {
    let favorite: FavoriteStop

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: "tram.fill")
                .font(.title2)
                .foregroundStyle(.blue)

            Text(favorite.stopName)
                .font(.subheadline)
                .fontWeight(.medium)
                .lineLimit(2)
                .multilineTextAlignment(.leading)

            if !favorite.stopDesc.isEmpty {
                Text(favorite.stopDesc)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .frame(width: 140, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}
