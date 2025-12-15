import SwiftUI

public struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var apiBaseURL: String = APIService.shared.baseURL

    public init() {}

    public var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("API Base URL")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        TextField("API URL", text: $apiBaseURL)
                            .textFieldStyle(.roundedBorder)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                            .keyboardType(.URL)

                        Button("Reset to Default") {
                            APIService.shared.resetToDefaultURL()
                            apiBaseURL = APIService.shared.baseURL
                        }
                        .font(.caption)
                    }
                } header: {
                    Text("API Configuration")
                } footer: {
                    Text("Change the API endpoint for development or testing. Default: https://www.chicagorail.app/api")
                }

                Section {
                    Button {
                        RecentStopsService.shared.clearRecent()
                    } label: {
                        HStack {
                            Image(systemName: "clock.arrow.circlepath")
                            Text("Clear Recent Searches")
                        }
                    }
                } header: {
                    Text("Data")
                }

                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(appVersion)
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Text("Build")
                        Spacer()
                        Text(buildNumber)
                            .foregroundStyle(.secondary)
                    }
                } header: {
                    Text("About")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        // Save the URL when dismissing
                        APIService.shared.baseURL = apiBaseURL
                        dismiss()
                    }
                }
            }
        }
    }

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }

    private var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
}
