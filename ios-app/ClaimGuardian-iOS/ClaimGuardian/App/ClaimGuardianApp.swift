import SwiftUI
import CoreData

@main
struct ClaimGuardianApp: App {
    let persistenceController = PersistenceController.shared
    @StateObject private var appState = AppState()
    @StateObject private var networkMonitor = NetworkMonitor()
    @StateObject private var authenticationService = AuthenticationService()
    @StateObject private var syncService = SyncService()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(appState)
                .environmentObject(networkMonitor)
                .environmentObject(authenticationService)
                .environmentObject(syncService)
                .onAppear {
                    setupApp()
                }
        }
    }
    
    private func setupApp() {
        configureNetworkMonitoring()
        setupSiriShortcuts()
        initializeServices()
    }
    
    private func configureNetworkMonitoring() {
        networkMonitor.startMonitoring()
    }
    
    private func setupSiriShortcuts() {
        SiriShortcutService.shared.setupDefaultShortcuts()
    }
    
    private func initializeServices() {
        authenticationService.initialize()
        syncService.initialize()
    }
}

// MARK: - Content View
struct ContentView: View {
    @EnvironmentObject var authService: AuthenticationService
    
    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                AuthenticationView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authService.isAuthenticated)
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Dashboard")
                }
                .tag(0)
            
            AssessmentListView()
                .tabItem {
                    Image(systemName: "doc.text.magnifyingglass")
                    Text("Assessments")
                }
                .tag(1)
            
            CameraView()
                .tabItem {
                    Image(systemName: "camera.fill")
                    Text("Camera")
                }
                .tag(2)
            
            ARMeasurementView()
                .tabItem {
                    Image(systemName: "ruler.fill")
                    Text("Measure")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape.fill")
                    Text("Settings")
                }
                .tag(4)
        }
        .accentColor(.blue)
    }
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var currentUser: User?
    @Published var selectedProperty: Property?
    @Published var currentAssessment: Assessment?
    @Published var isOfflineMode = false
    
    func updateOfflineStatus(_ isOffline: Bool) {
        DispatchQueue.main.async {
            self.isOfflineMode = isOffline
        }
    }
}