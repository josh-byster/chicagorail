import SwiftUI

public struct StationSearchView: View {
    @State private var viewModel = StationSearchViewModel()
    @State private var isShowingResults = false

    let placeholder: String
    let selectedStation: Stop?
    let onSelect: (Stop) -> Void

    public init(
        placeholder: String = "Search stations...",
        selectedStation: Stop? = nil,
        onSelect: @escaping (Stop) -> Void
    ) {
        self.placeholder = placeholder
        self.selectedStation = selectedStation
        self.onSelect = onSelect
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Search Field
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)

                TextField(placeholder, text: $viewModel.query)
                    .textFieldStyle(.plain)
                    .autocorrectionDisabled()
                    .onChange(of: viewModel.query) {
                        viewModel.search()
                        isShowingResults = true
                    }

                if !viewModel.query.isEmpty {
                    Button {
                        viewModel.clearSearch()
                        isShowingResults = false
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                }

                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }
            .padding(12)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 10))

            // Selected Station Display
            if let station = selectedStation, viewModel.query.isEmpty {
                HStack {
                    Image(systemName: "tram.fill")
                        .foregroundStyle(.blue)
                    Text(station.stopName)
                        .font(.subheadline)
                    Spacer()
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.blue.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .padding(.top, 8)
            }

            // Results List
            if isShowingResults && viewModel.query.count >= 2 {
                resultsSection
            } else if isShowingResults && viewModel.query.isEmpty {
                recentSection
            }
        }
    }

    @ViewBuilder
    private var resultsSection: some View {
        if !viewModel.results.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(viewModel.results) { stop in
                    Button {
                        selectStation(stop)
                    } label: {
                        StationRow(stop: stop)
                    }
                    .buttonStyle(.plain)

                    if stop.id != viewModel.results.last?.id {
                        Divider()
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            .padding(.top, 4)
        } else if !viewModel.isLoading {
            Text("No stations found")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding()
        }
    }

    @ViewBuilder
    private var recentSection: some View {
        let recentStops = RecentStopsService.shared.recentStops
        if !recentStops.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                Text("Recent Searches")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)

                ForEach(recentStops) { stop in
                    Button {
                        selectStation(stop)
                    } label: {
                        StationRow(stop: stop, showRecent: true)
                    }
                    .buttonStyle(.plain)

                    if stop.id != recentStops.last?.id {
                        Divider()
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            .padding(.top, 4)
        }
    }

    private func selectStation(_ stop: Stop) {
        viewModel.clearSearch()
        isShowingResults = false
        onSelect(stop)
    }
}

// MARK: - Station Row

private struct StationRow: View {
    let stop: Stop
    var showRecent: Bool = false

    var body: some View {
        HStack {
            Image(systemName: showRecent ? "clock" : "tram")
                .foregroundStyle(.secondary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(stop.stopName)
                    .font(.subheadline)
                    .foregroundStyle(.primary)

                if !stop.stopDesc.isEmpty {
                    Text(stop.stopDesc)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .contentShape(Rectangle())
    }
}
