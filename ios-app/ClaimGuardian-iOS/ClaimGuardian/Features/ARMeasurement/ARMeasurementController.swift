import ARKit
import SceneKit
import SwiftUI
import Combine

@MainActor
class ARMeasurementController: NSObject, ObservableObject {
    @Published var isSessionRunning = false
    @Published var measurements: [ARMeasurementModel] = []
    @Published var currentMeasurement: ARMeasurementModel?
    @Published var measurementMode: MeasurementMode = .distance
    @Published var errorMessage: String?
    @Published var isPlacingPoints = false
    @Published var sessionState: ARSessionState = .stopped

    private var arView: ARSCNView?
    private let session = ARSession()
    private var placementNodes: [SCNNode] = []
    private var lineNodes: [SCNNode] = []
    private var textNodes: [SCNNode] = []

    enum MeasurementMode: String, CaseIterable {
        case distance = "distance"
        case area = "area"
        case volume = "volume"
        case angle = "angle"

        var displayName: String {
            switch self {
            case .distance: return "Distance"
            case .area: return "Area"
            case .volume: return "Volume"
            case .angle: return "Angle"
            }
        }

        var systemImage: String {
            switch self {
            case .distance: return "ruler"
            case .area: return "square.dashed"
            case .volume: return "cube"
            case .angle: return "angle"
            }
        }
    }

    enum ARSessionState {
        case stopped
        case starting
        case running
        case paused
        case error(String)
    }

    override init() {
        super.init()
        session.delegate = self
        setupConfiguration()
    }

    // MARK: - Session Management
    private func setupConfiguration() {
        guard ARWorldTrackingConfiguration.isSupported else {
            sessionState = .error("AR not supported on this device")
            return
        }

        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic

        if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
            configuration.frameSemantics.insert(.sceneDepth)
        }

        session.run(configuration)
    }

    func startSession() {
        guard !isSessionRunning else { return }

        sessionState = .starting

        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic

        session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        isSessionRunning = true
        sessionState = .running
    }

    func pauseSession() {
        session.pause()
        sessionState = .paused
        isSessionRunning = false
    }

    func resumeSession() {
        guard sessionState == .paused else { return }

        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        session.run(configuration)

        isSessionRunning = true
        sessionState = .running
    }

    func stopSession() {
        session.pause()
        sessionState = .stopped
        isSessionRunning = false
        clearAllMeasurements()
    }

    // MARK: - Measurement Actions
    func startMeasurement() {
        isPlacingPoints = true
        currentMeasurement = ARMeasurementModel(mode: measurementMode)
    }

    func addMeasurementPoint(at screenPoint: CGPoint) {
        guard let arView = arView,
              let currentFrame = session.currentFrame,
              isPlacingPoints else { return }

        // Perform ray casting to find real-world position
        let raycastQuery = ARRaycastQuery(
            origin: currentFrame.camera.transform.columns.3.xyz,
            direction: normalize(arView.unprojectPoint(screenPoint, ontoPlane: nil) - currentFrame.camera.transform.columns.3.xyz),
            allowing: .existingPlaneGeometry,
            alignment: .any
        )

        let raycastResults = session.raycast(raycastQuery)

        guard let firstResult = raycastResults.first else {
            // Fallback to feature point detection
            let results = arView.hitTest(screenPoint, types: .featurePoint)
            guard let result = results.first else {
                errorMessage = "Unable to place point. Move closer to a surface."
                return
            }

            let position = result.worldTransform.columns.3.xyz
            addPoint(position)
            return
        }

        let position = firstResult.worldTransform.columns.3.xyz
        addPoint(position)
    }

    private func addPoint(_ position: SIMD3<Float>) {
        guard var measurement = currentMeasurement else { return }

        // Add visual node
        let node = createPlacementNode(at: position)
        placementNodes.append(node)
        arView?.scene.rootNode.addChildNode(node)

        // Add point to measurement
        measurement.addPoint(position)
        currentMeasurement = measurement

        // Update visualization based on mode
        updateMeasurementVisualization()

        // Check if measurement is complete
        if measurement.isComplete {
            completeMeasurement()
        }
    }

    private func completeMeasurement() {
        guard let measurement = currentMeasurement else { return }

        measurements.append(measurement)
        currentMeasurement = nil
        isPlacingPoints = false

        // Add final measurement display
        addMeasurementLabel(for: measurement)

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }

    // MARK: - Visualization
    private func createPlacementNode(at position: SIMD3<Float>) -> SCNNode {
        let sphere = SCNSphere(radius: 0.01)
        sphere.firstMaterial?.diffuse.contents = UIColor.systemBlue
        sphere.firstMaterial?.emission.contents = UIColor.systemBlue

        let node = SCNNode(geometry: sphere)
        node.position = SCNVector3(position.x, position.y, position.z)

        // Add glow effect
        let glowGeometry = SCNSphere(radius: 0.015)
        glowGeometry.firstMaterial?.diffuse.contents = UIColor.systemBlue
        glowGeometry.firstMaterial?.transparency = 0.3
        let glowNode = SCNNode(geometry: glowGeometry)
        node.addChildNode(glowNode)

        return node
    }

    private func updateMeasurementVisualization() {
        guard let measurement = currentMeasurement else { return }

        // Clear previous visualization
        clearVisualizationNodes()

        switch measurementMode {
        case .distance:
            if measurement.points.count == 2 {
                createDistanceLine(from: measurement.points[0], to: measurement.points[1])
            }
        case .area:
            if measurement.points.count >= 3 {
                createAreaOutline(points: measurement.points)
            }
        case .volume:
            if measurement.points.count >= 4 {
                createVolumeWireframe(points: measurement.points)
            }
        case .angle:
            if measurement.points.count == 3 {
                createAngleVisualization(
                    vertex: measurement.points[1],
                    point1: measurement.points[0],
                    point2: measurement.points[2]
                )
            }
        }
    }

    private func createDistanceLine(from start: SIMD3<Float>, to end: SIMD3<Float>) {
        let lineGeometry = SCNGeometry.line(from: SCNVector3(start), to: SCNVector3(end))
        let lineNode = SCNNode(geometry: lineGeometry)
        lineNodes.append(lineNode)
        arView?.scene.rootNode.addChildNode(lineNode)
    }

    private func createAreaOutline(points: [SIMD3<Float>]) {
        guard points.count >= 3 else { return }

        for i in 0..<points.count {
            let nextIndex = (i + 1) % points.count
            createDistanceLine(from: points[i], to: points[nextIndex])
        }
    }

    private func createVolumeWireframe(points: [SIMD3<Float>]) {
        // Create a simple box wireframe from the points
        guard points.count >= 2 else { return }

        let min = points[0]
        let max = points[1]

        // Create box wireframe
        let boxVertices = [
            SIMD3<Float>(min.x, min.y, min.z),
            SIMD3<Float>(max.x, min.y, min.z),
            SIMD3<Float>(max.x, max.y, min.z),
            SIMD3<Float>(min.x, max.y, min.z),
            SIMD3<Float>(min.x, min.y, max.z),
            SIMD3<Float>(max.x, min.y, max.z),
            SIMD3<Float>(max.x, max.y, max.z),
            SIMD3<Float>(min.x, max.y, max.z)
        ]

        // Draw edges
        let edges = [
            (0, 1), (1, 2), (2, 3), (3, 0), // bottom face
            (4, 5), (5, 6), (6, 7), (7, 4), // top face
            (0, 4), (1, 5), (2, 6), (3, 7)  // vertical edges
        ]

        for edge in edges {
            createDistanceLine(from: boxVertices[edge.0], to: boxVertices[edge.1])
        }
    }

    private func createAngleVisualization(vertex: SIMD3<Float>, point1: SIMD3<Float>, point2: SIMD3<Float>) {
        // Draw the two lines forming the angle
        createDistanceLine(from: vertex, to: point1)
        createDistanceLine(from: vertex, to: point2)

        // Create arc to show the angle
        let vector1 = normalize(point1 - vertex)
        let vector2 = normalize(point2 - vertex)
        let angle = acos(dot(vector1, vector2))

        // Create arc geometry (simplified)
        createAngleArc(center: vertex, vector1: vector1, vector2: vector2, angle: angle)
    }

    private func createAngleArc(center: SIMD3<Float>, vector1: SIMD3<Float>, vector2: SIMD3<Float>, angle: Float) {
        let radius: Float = 0.1
        let segments = 20

        for i in 0..<segments {
            let t1 = Float(i) / Float(segments)
            let t2 = Float(i + 1) / Float(segments)

            let angle1 = t1 * angle
            let angle2 = t2 * angle

            let point1 = center + radius * (cos(angle1) * vector1 + sin(angle1) * cross(vector1, vector2))
            let point2 = center + radius * (cos(angle2) * vector1 + sin(angle2) * cross(vector1, vector2))

            createDistanceLine(from: point1, to: point2)
        }
    }

    private func addMeasurementLabel(for measurement: ARMeasurementModel) {
        guard let centerPoint = measurement.centerPoint else { return }

        let text = SCNText(string: measurement.formattedValue, extrusionDepth: 0.01)
        text.font = UIFont.systemFont(ofSize: 0.1)
        text.firstMaterial?.diffuse.contents = UIColor.white
        text.firstMaterial?.emission.contents = UIColor.white

        let textNode = SCNNode(geometry: text)
        textNode.position = SCNVector3(centerPoint.x, centerPoint.y + 0.05, centerPoint.z)
        textNode.scale = SCNVector3(0.01, 0.01, 0.01)

        // Billboard constraint to face camera
        let billboardConstraint = SCNBillboardConstraint()
        billboardConstraint.freeAxes = [.Y]
        textNode.constraints = [billboardConstraint]

        textNodes.append(textNode)
        arView?.scene.rootNode.addChildNode(textNode)
    }

    // MARK: - Cleanup
    func clearAllMeasurements() {
        measurements.removeAll()
        currentMeasurement = nil
        isPlacingPoints = false
        clearVisualizationNodes()
        clearPlacementNodes()
    }

    private func clearVisualizationNodes() {
        lineNodes.forEach { $0.removeFromParentNode() }
        lineNodes.removeAll()

        textNodes.forEach { $0.removeFromParentNode() }
        textNodes.removeAll()
    }

    private func clearPlacementNodes() {
        placementNodes.forEach { $0.removeFromParentNode() }
        placementNodes.removeAll()
    }

    func deleteMeasurement(at index: Int) {
        guard index < measurements.count else { return }
        measurements.remove(at: index)

        // Refresh visualization
        refreshVisualization()
    }

    private func refreshVisualization() {
        clearVisualizationNodes()
        clearPlacementNodes()

        // Recreate visualization for all measurements
        for measurement in measurements {
            for point in measurement.points {
                let node = createPlacementNode(at: point)
                placementNodes.append(node)
                arView?.scene.rootNode.addChildNode(node)
            }

            addMeasurementLabel(for: measurement)
        }
    }

    // MARK: - Utilities
    func setARView(_ arView: ARSCNView) {
        self.arView = arView
        arView.session = session
        arView.delegate = self
    }

    static func checkARAvailability() -> Bool {
        return ARWorldTrackingConfiguration.isSupported
    }
}

// MARK: - ARSession Delegate
extension ARMeasurementController: ARSessionDelegate {
    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        // Handle plane detection
    }

    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        // Handle anchor updates
    }

    func session(_ session: ARSession, didRemove anchors: [ARAnchor]) {
        // Handle anchor removal
    }

    func session(_ session: ARSession, didFailWithError error: Error) {
        errorMessage = "AR session failed: \(error.localizedDescription)"
        sessionState = .error(error.localizedDescription)
    }

    func sessionWasInterrupted(_ session: ARSession) {
        sessionState = .paused
        isSessionRunning = false
    }

    func sessionInterruptionEnded(_ session: ARSession) {
        // Restart session
        startSession()
    }
}

// MARK: - ARSCNView Delegate
extension ARMeasurementController: ARSCNViewDelegate {
    func renderer(_ renderer: SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
        // Handle plane visualization
        guard let planeAnchor = anchor as? ARPlaneAnchor else { return }

        let plane = SCNPlane(width: CGFloat(planeAnchor.extent.x), height: CGFloat(planeAnchor.extent.z))
        plane.firstMaterial?.diffuse.contents = UIColor.systemBlue.withAlphaComponent(0.3)
        plane.firstMaterial?.isDoubleSided = true

        let planeNode = SCNNode(geometry: plane)
        planeNode.position = SCNVector3(planeAnchor.center.x, 0, planeAnchor.center.z)
        planeNode.eulerAngles.x = -.pi / 2

        node.addChildNode(planeNode)
    }

    func renderer(_ renderer: SCNSceneRenderer, didUpdate node: SCNNode, for anchor: ARAnchor) {
        guard let planeAnchor = anchor as? ARPlaneAnchor,
              let planeNode = node.childNodes.first,
              let plane = planeNode.geometry as? SCNPlane else { return }

        plane.width = CGFloat(planeAnchor.extent.x)
        plane.height = CGFloat(planeAnchor.extent.z)
        planeNode.position = SCNVector3(planeAnchor.center.x, 0, planeAnchor.center.z)
    }
}

// MARK: - Measurement Model
struct ARMeasurementModel: Identifiable, Codable {
    let id = UUID()
    let mode: ARMeasurementController.MeasurementMode
    var points: [SIMD3<Float>] = []
    let timestamp = Date()

    var isComplete: Bool {
        switch mode {
        case .distance: return points.count >= 2
        case .area: return points.count >= 3
        case .volume: return points.count >= 2  // Simplified to 2 opposite corners
        case .angle: return points.count >= 3
        }
    }

    var centerPoint: SIMD3<Float>? {
        guard !points.isEmpty else { return nil }

        let sum = points.reduce(SIMD3<Float>(0, 0, 0)) { $0 + $1 }
        return sum / Float(points.count)
    }

    var value: Double {
        switch mode {
        case .distance:
            return calculateDistance()
        case .area:
            return calculateArea()
        case .volume:
            return calculateVolume()
        case .angle:
            return calculateAngle()
        }
    }

    var formattedValue: String {
        switch mode {
        case .distance:
            return String(format: "%.2f m", value)
        case .area:
            return String(format: "%.2f m²", value)
        case .volume:
            return String(format: "%.2f m³", value)
        case .angle:
            return String(format: "%.1f°", value * 180 / .pi)
        }
    }

    mutating func addPoint(_ point: SIMD3<Float>) {
        if !isComplete {
            points.append(point)
        }
    }

    private func calculateDistance() -> Double {
        guard points.count >= 2 else { return 0 }
        let distance = simd_distance(points[0], points[1])
        return Double(distance)
    }

    private func calculateArea() -> Double {
        guard points.count >= 3 else { return 0 }

        // Simple polygon area calculation using shoelace formula
        var area: Float = 0
        for i in 0..<points.count {
            let j = (i + 1) % points.count
            area += points[i].x * points[j].z - points[j].x * points[i].z
        }
        return Double(abs(area) / 2.0)
    }

    private func calculateVolume() -> Double {
        guard points.count >= 2 else { return 0 }

        // Simple box volume from two opposite corners
        let diff = points[1] - points[0]
        let volume = abs(diff.x * diff.y * diff.z)
        return Double(volume)
    }

    private func calculateAngle() -> Double {
        guard points.count >= 3 else { return 0 }

        let vertex = points[1]
        let vector1 = normalize(points[0] - vertex)
        let vector2 = normalize(points[2] - vertex)

        let angle = acos(max(-1, min(1, dot(vector1, vector2))))
        return Double(angle)
    }
}

// MARK: - Extensions
extension SCNGeometry {
    static func line(from start: SCNVector3, to end: SCNVector3) -> SCNGeometry {
        let vertices: [SCNVector3] = [start, end]
        let vertexSource = SCNGeometrySource(vertices: vertices)

        let indices: [Int32] = [0, 1]
        let indexData = Data(bytes: indices, count: indices.count * MemoryLayout<Int32>.size)
        let geometryElement = SCNGeometryElement(data: indexData, primitiveType: .line, primitiveCount: 1, bytesPerIndex: MemoryLayout<Int32>.size)

        let geometry = SCNGeometry(sources: [vertexSource], elements: [geometryElement])
        geometry.firstMaterial?.diffuse.contents = UIColor.systemBlue
        geometry.firstMaterial?.lightingModel = .constant

        return geometry
    }
}

extension SIMD3 where Scalar == Float {
    var xyz: SIMD3<Float> { return self }
}

extension float4x4 {
    var xyz: SIMD3<Float> {
        return SIMD3<Float>(columns.3.x, columns.3.y, columns.3.z)
    }
}
