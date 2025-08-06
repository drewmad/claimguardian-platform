import SwiftUI
import ARKit
import SceneKit

struct ARMeasurementView: View {
    @StateObject private var arController = ARMeasurementController()
    @State private var showingMeasurementsList = false
    @State private var showingInstructions = true
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            // AR Scene View
            ARSceneView(arController: arController)
                .ignoresSafeArea()
                .onTapGesture { location in
                    arController.addMeasurementPoint(at: location)
                }
            
            // Overlay UI
            VStack {
                // Top Controls
                topControlsView
                
                Spacer()
                
                // Bottom Controls
                bottomControlsView
            }
            
            // Instructions Overlay
            if showingInstructions {
                instructionsOverlay
            }
            
            // Error Message
            if let errorMessage = arController.errorMessage {
                errorMessageView(errorMessage)
            }
            
            // Session State Indicator
            sessionStateIndicator
        }
        .onAppear {
            setupARSession()
        }
        .onDisappear {
            arController.stopSession()
        }
        .sheet(isPresented: $showingMeasurementsList) {
            MeasurementsListView(measurements: arController.measurements) { index in
                arController.deleteMeasurement(at: index)
            }
        }
    }
    
    // MARK: - Top Controls
    private var topControlsView: some View {
        HStack {
            // Close Button
            Button(action: { dismiss() }) {
                Image(systemName: "xmark")
                    .font(.title2)
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(Color.black.opacity(0.6))
                    .clipShape(Circle())
            }
            
            Spacer()
            
            // Session State
            sessionStatusView
            
            Spacer()
            
            // Instructions Toggle
            Button(action: { showingInstructions.toggle() }) {
                Image(systemName: "questionmark.circle")
                    .font(.title2)
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(Color.black.opacity(0.6))
                    .clipShape(Circle())
            }
        }
        .padding()
    }
    
    // MARK: - Bottom Controls
    private var bottomControlsView: some View {
        VStack(spacing: 16) {
            // Measurement Mode Selector
            HStack(spacing: 20) {
                ForEach(ARMeasurementController.MeasurementMode.allCases, id: \.self) { mode in
                    Button(action: { arController.measurementMode = mode }) {
                        VStack(spacing: 4) {
                            Image(systemName: mode.systemImage)
                                .font(.title3)
                            Text(mode.displayName)
                                .font(.caption)
                        }
                        .foregroundColor(arController.measurementMode == mode ? .yellow : .white)
                        .frame(width: 60)
                    }
                }
            }
            .padding(.horizontal)
            
            // Action Buttons
            HStack(spacing: 30) {
                // Measurements List
                Button(action: { showingMeasurementsList = true }) {
                    VStack(spacing: 4) {
                        Image(systemName: "list.bullet")
                            .font(.title2)
                        Text("\(arController.measurements.count)")
                            .font(.caption)
                    }
                    .foregroundColor(.white)
                    .frame(width: 50, height: 50)
                    .background(Color.blue.opacity(0.8))
                    .clipShape(Circle())
                }
                
                // Main Action Button
                Button(action: mainButtonAction) {
                    ZStack {
                        Circle()
                            .fill(buttonColor)
                            .frame(width: 80, height: 80)
                        
                        Image(systemName: buttonIcon)
                            .font(.title)
                            .foregroundColor(.white)
                    }
                }
                
                // Clear All
                Button(action: { arController.clearAllMeasurements() }) {
                    VStack(spacing: 4) {
                        Image(systemName: "trash")
                            .font(.title2)
                        Text("Clear")
                            .font(.caption)
                    }
                    .foregroundColor(.white)
                    .frame(width: 50, height: 50)
                    .background(Color.red.opacity(0.8))
                    .clipShape(Circle())
                }
                .disabled(arController.measurements.isEmpty)
                .opacity(arController.measurements.isEmpty ? 0.5 : 1.0)
            }
            .padding(.bottom, 30)
        }
    }
    
    // MARK: - Session Status
    private var sessionStatusView: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(sessionStatusColor)
                .frame(width: 8, height: 8)
            
            Text(sessionStatusText)
                .font(.caption)
                .foregroundColor(.white)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.black.opacity(0.6))
        .clipShape(Capsule())
    }
    
    // MARK: - Session State Indicator
    private var sessionStateIndicator: some View {
        Group {
            switch arController.sessionState {
            case .starting:
                VStack {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    Text("Starting AR Session...")
                        .foregroundColor(.white)
                        .font(.headline)
                }
                .padding()
                .background(Color.black.opacity(0.8))
                .cornerRadius(12)
                
            case .error(let message):
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.title)
                        .foregroundColor(.red)
                    
                    Text("AR Error")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text(message)
                        .font(.body)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                    
                    Button("Retry") {
                        arController.startSession()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .background(Color.black.opacity(0.9))
                .cornerRadius(12)
                .padding()
                
            default:
                EmptyView()
            }
        }
    }
    
    // MARK: - Instructions Overlay
    private var instructionsOverlay: some View {
        VStack(spacing: 16) {
            Text("AR Measurement Instructions")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            VStack(alignment: .leading, spacing: 12) {
                instructionStep("1", "Move your device to scan the environment")
                instructionStep("2", "Select measurement mode (Distance, Area, Volume, Angle)")
                instructionStep("3", "Tap 'Start' to begin placing measurement points")
                instructionStep("4", "Tap on surfaces to place measurement points")
                instructionStep("5", "View results in the measurements list")
            }
            
            Button("Got It") {
                showingInstructions = false
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding()
        .background(Color.black.opacity(0.9))
        .cornerRadius(16)
        .padding()
    }
    
    private func instructionStep(_ number: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(number)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.yellow)
                .frame(width: 20, alignment: .leading)
            
            Text(text)
                .font(.body)
                .foregroundColor(.white)
        }
    }
    
    // MARK: - Error Message
    private func errorMessageView(_ message: String) -> some View {
        VStack {
            Spacer()
            
            HStack {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundColor(.red)
                
                Text(message)
                    .foregroundColor(.white)
                    .font(.body)
            }
            .padding()
            .background(Color.black.opacity(0.8))
            .cornerRadius(8)
            .padding()
        }
    }
    
    // MARK: - Computed Properties
    private var mainButtonAction: () -> Void {
        if arController.isPlacingPoints {
            return { /* Current measurement will auto-complete */ }
        } else {
            return { arController.startMeasurement() }
        }
    }
    
    private var buttonIcon: String {
        if arController.isPlacingPoints {
            switch arController.measurementMode {
            case .distance:
                return arController.currentMeasurement?.points.count == 1 ? "2.circle" : "1.circle"
            case .area:
                return "\(min((arController.currentMeasurement?.points.count ?? 0) + 1, 3)).circle"
            case .volume:
                return arController.currentMeasurement?.points.count == 1 ? "2.circle" : "1.circle"
            case .angle:
                return "\(min((arController.currentMeasurement?.points.count ?? 0) + 1, 3)).circle"
            }
        } else {
            return "play.circle"
        }
    }
    
    private var buttonColor: Color {
        arController.isPlacingPoints ? .orange : .green
    }
    
    private var sessionStatusColor: Color {
        switch arController.sessionState {
        case .running:
            return .green
        case .starting:
            return .yellow
        case .paused:
            return .orange
        case .stopped:
            return .red
        case .error:
            return .red
        }
    }
    
    private var sessionStatusText: String {
        switch arController.sessionState {
        case .running:
            return "AR Active"
        case .starting:
            return "Starting..."
        case .paused:
            return "Paused"
        case .stopped:
            return "Stopped"
        case .error:
            return "Error"
        }
    }
    
    // MARK: - Methods
    private func setupARSession() {
        guard ARMeasurementController.checkARAvailability() else {
            arController.errorMessage = "AR is not supported on this device"
            return
        }
        
        arController.startSession()
    }
}

// MARK: - AR Scene View
struct ARSceneView: UIViewRepresentable {
    let arController: ARMeasurementController
    
    func makeUIView(context: Context) -> ARSCNView {
        let arView = ARSCNView()
        arController.setARView(arView)
        
        // Configure the view
        arView.backgroundColor = UIColor.black
        arView.automaticallyUpdatesLighting = true
        arView.debugOptions = []
        
        return arView
    }
    
    func updateUIView(_ uiView: ARSCNView, context: Context) {
        // Updates handled by ARMeasurementController
    }
    
    static func dismantleUIView(_ uiView: ARSCNView, coordinator: ()) {
        // Cleanup if needed
    }
}

// MARK: - Measurements List View
struct MeasurementsListView: View {
    let measurements: [ARMeasurementModel]
    let onDelete: (Int) -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List {
                if measurements.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "ruler")
                            .font(.title)
                            .foregroundColor(.secondary)
                        
                        Text("No measurements yet")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        Text("Use the AR measurement tools to create your first measurement")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                } else {
                    ForEach(Array(measurements.enumerated()), id: \.element.id) { index, measurement in
                        MeasurementRowView(measurement: measurement)
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button("Delete", role: .destructive) {
                                    onDelete(index)
                                }
                            }
                    }
                }
            }
            .navigationTitle("Measurements")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Measurement Row View
struct MeasurementRowView: View {
    let measurement: ARMeasurementModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: measurement.mode.systemImage)
                    .foregroundColor(.blue)
                    .frame(width: 24)
                
                Text(measurement.mode.displayName)
                    .font(.headline)
                
                Spacer()
                
                Text(measurement.formattedValue)
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
            }
            
            HStack {
                Text("Points: \(measurement.points.count)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(DateFormatter.measurementFormatter.string(from: measurement.timestamp))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Extensions
extension DateFormatter {
    static let measurementFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter
    }()
}

// MARK: - Preview
struct ARMeasurementView_Previews: PreviewProvider {
    static var previews: some View {
        ARMeasurementView()
    }
}

// MARK: - Keychain Helper
class KeychainHelper {
    static func store(_ value: String, forKey key: String) {
        let data = value.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    static func load(forKey key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        
        guard let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    static func delete(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Network Monitor
import Network

class NetworkMonitor: ObservableObject {
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue.global(qos: .background)
    
    @Published var isConnected = true
    @Published var connectionType: ConnectionType = .unknown
    
    enum ConnectionType {
        case wifi
        case cellular
        case ethernet
        case unknown
    }
    
    func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
                self?.getConnectionType(path)
            }
        }
        monitor.start(queue: queue)
    }
    
    func stopMonitoring() {
        monitor.cancel()
    }
    
    private func getConnectionType(_ path: NWPath) {
        if path.usesInterfaceType(.wifi) {
            connectionType = .wifi
        } else if path.usesInterfaceType(.cellular) {
            connectionType = .cellular
        } else if path.usesInterfaceType(.wiredEthernet) {
            connectionType = .ethernet
        } else {
            connectionType = .unknown
        }
    }
}

// MARK: - Authentication Service
class AuthenticationService: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: AuthUser?
    
    private let supabaseService = SupabaseService.shared
    
    func initialize() {
        // Check for existing authentication
        isAuthenticated = supabaseService.isAuthenticated
        currentUser = supabaseService.currentUser
        
        // Setup authentication state listener
        setupAuthStateListener()
    }
    
    private func setupAuthStateListener() {
        // Monitor changes in authentication state
        supabaseService.$isAuthenticated
            .assign(to: &$isAuthenticated)
        
        supabaseService.$currentUser
            .assign(to: &$currentUser)
    }
    
    func signIn(email: String, password: String) async throws {
        try await supabaseService.signIn(email: email, password: password)
    }
    
    func signOut() async throws {
        try await supabaseService.signOut()
    }
}

// MARK: - Sync Service
class SyncService: ObservableObject {
    @Published var syncStatus: SyncStatus = .idle
    @Published var lastSyncDate: Date?
    
    private let supabaseService = SupabaseService.shared
    private let persistenceController = PersistenceController.shared
    
    enum SyncStatus {
        case idle
        case syncing
        case success
        case failure(String)
    }
    
    func initialize() {
        // Setup automatic sync when network is available
        setupAutoSync()
    }
    
    private func setupAutoSync() {
        // Implement background sync logic
    }
    
    func performManualSync() async {
        await performSync()
    }
    
    private func performSync() async {
        DispatchQueue.main.async {
            self.syncStatus = .syncing
        }
        
        do {
            // Implement sync logic here
            // This would sync Core Data with Supabase
            
            DispatchQueue.main.async {
                self.syncStatus = .success
                self.lastSyncDate = Date()
            }
        } catch {
            DispatchQueue.main.async {
                self.syncStatus = .failure(error.localizedDescription)
            }
        }
    }
}

// MARK: - Siri Shortcut Service
import Intents

class SiriShortcutService {
    static let shared = SiriShortcutService()
    
    private init() {}
    
    func setupDefaultShortcuts() {
        // Setup default Siri shortcuts for common actions
    }
}