import SwiftUI

public struct DeparturesView: View {
    @State private var viewModel = DeparturesViewModel()

    public init() {}

    public var body: some View {
        VStack(spacing: 0) {
            // Station search
            StationSearchView(
                placeholder: "Search stations...",
                selectedStation: viewModel.selectedStop
            ) { stop in
                Task {
                    await viewModel.selectStop(stop)
                }
            }
            .padding()

            // Date picker - only show when a station is selected
            if viewModel.selectedStop != nil {
                DatePickerRow(
                    selectedDate: viewModel.selectedDate,
                    isToday: viewModel.isToday
                ) { date in
                    Task {
                        await viewModel.selectDate(date)
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }

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
        .navigationTitle("Departures")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await viewModel.loadDepartures()
        }
        .onAppear {
            viewModel.startAutoRefresh()
        }
        .onDisappear {
            viewModel.stopAutoRefresh()
        }
    }
}

// MARK: - Date Picker Row

private struct DatePickerRow: View {
    let selectedDate: Date
    let isToday: Bool
    let onDateChange: (Date) -> Void

    @State private var showingDatePicker = false

    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d"
        return formatter
    }

    var body: some View {
        HStack {
            Button {
                showingDatePicker = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "calendar")
                    Text(isToday ? "Today" : dateFormatter.string(from: selectedDate))
                    Image(systemName: "chevron.down")
                        .font(.caption)
                }
                .font(.subheadline)
                .foregroundStyle(.primary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
            }
            .sheet(isPresented: $showingDatePicker) {
                DatePickerSheet(
                    selectedDate: selectedDate,
                    onDateChange: { date in
                        onDateChange(date)
                        showingDatePicker = false
                    }
                )
                .presentationDetents([.medium])
            }

            if !isToday {
                Button("Today") {
                    onDateChange(Date())
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }

            Spacer()
        }
    }
}

// MARK: - Date Picker Sheet

private struct DatePickerSheet: View {
    let selectedDate: Date
    let onDateChange: (Date) -> Void

    @State private var pickerDate: Date

    init(selectedDate: Date, onDateChange: @escaping (Date) -> Void) {
        self.selectedDate = selectedDate
        self.onDateChange = onDateChange
        self._pickerDate = State(initialValue: selectedDate)
    }

    var body: some View {
        DatePicker(
            "Select Date",
            selection: $pickerDate,
            in: Date()...,
            displayedComponents: .date
        )
        .datePickerStyle(.graphical)
        .padding()
        .onChange(of: pickerDate) { _, newDate in
            onDateChange(newDate)
        }
    }
}
