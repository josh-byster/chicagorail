import Foundation

@Observable
@MainActor
public final class StationSearchViewModel {
    public var query: String = ""
    public var results: [Stop] = []
    public var isLoading: Bool = false

    private var searchTask: Task<Void, Never>?
    private let debounceDelay: Duration = .milliseconds(150)

    public init() {}

    /// Perform debounced search
    public func search() {
        // Cancel any existing search task
        searchTask?.cancel()

        // Clear results if query is too short
        guard query.count >= 2 else {
            results = []
            isLoading = false
            return
        }

        isLoading = true

        searchTask = Task {
            // Debounce
            try? await Task.sleep(for: debounceDelay)

            // Check for cancellation
            guard !Task.isCancelled else { return }

            do {
                let searchResults = try await APIService.shared.searchStops(query: query)

                // Check for cancellation again
                guard !Task.isCancelled else { return }

                results = searchResults
            } catch {
                // Check for cancellation
                guard !Task.isCancelled else { return }

                results = []
            }

            isLoading = false
        }
    }

    /// Clear search state
    public func clearSearch() {
        searchTask?.cancel()
        query = ""
        results = []
        isLoading = false
    }
}
