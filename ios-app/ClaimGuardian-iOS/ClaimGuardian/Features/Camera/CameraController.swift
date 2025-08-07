import SwiftUI
import AVFoundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

@MainActor
class CameraController: NSObject, ObservableObject {
    @Published var isSessionRunning = false
    @Published var captureMode: CaptureMode = .photo
    @Published var flashMode: AVCaptureDevice.FlashMode = .auto
    @Published var isRecording = false
    @Published var capturedPhoto: UIImage?
    @Published var lastCapturedVideoURL: URL?
    @Published var errorMessage: String?

    private let session = AVCaptureSession()
    private var photoOutput = AVCapturePhotoOutput()
    private var videoOutput = AVCaptureMovieFileOutput()
    private var currentInput: AVCaptureDeviceInput?
    private var currentDevice: AVCaptureDevice?

    private let photoProcessor = PhotoProcessor()

    enum CaptureMode: String, CaseIterable {
        case photo = "photo"
        case video = "video"
        case timelapse = "timelapse"

        var displayName: String {
            switch self {
            case .photo: return "Photo"
            case .video: return "Video"
            case .timelapse: return "Time-lapse"
            }
        }
    }

    override init() {
        super.init()
        setupCamera()
    }

    // MARK: - Camera Setup
    private func setupCamera() {
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            errorMessage = "Camera not available"
            return
        }

        do {
            currentDevice = device
            let input = try AVCaptureDeviceInput(device: device)
            currentInput = input

            session.beginConfiguration()

            // Configure session for high quality
            if session.canSetSessionPreset(.hd4K3840x2160) {
                session.sessionPreset = .hd4K3840x2160
            } else if session.canSetSessionPreset(.high) {
                session.sessionPreset = .high
            }

            // Add input
            if session.canAddInput(input) {
                session.addInput(input)
            }

            // Configure photo output
            if session.canAddOutput(photoOutput) {
                session.addOutput(photoOutput)
                photoOutput.isHighResolutionCaptureEnabled = true

                // Enable all available photo formats
                if photoOutput.isAppleProRAWSupported {
                    photoOutput.isAppleProRAWEnabled = true
                }
            }

            // Configure video output
            if session.canAddOutput(videoOutput) {
                session.addOutput(videoOutput)

                if let connection = videoOutput.connection(with: .video) {
                    if connection.isVideoStabilizationSupported {
                        connection.preferredVideoStabilizationMode = .cinematicExtended
                    }
                }
            }

            session.commitConfiguration()

        } catch {
            errorMessage = "Failed to setup camera: \(error.localizedDescription)"
        }
    }

    // MARK: - Session Control
    func startSession() {
        guard !session.isRunning else { return }

        Task {
            session.startRunning()
            isSessionRunning = session.isRunning
        }
    }

    func stopSession() {
        guard session.isRunning else { return }

        Task {
            session.stopRunning()
            isSessionRunning = false
        }
    }

    // MARK: - Photo Capture
    func capturePhoto() {
        guard isSessionRunning else { return }

        let settings = AVCapturePhotoSettings()

        // Configure photo settings for professional quality
        if photoOutput.availablePhotoCodecTypes.contains(.hevc) {
            settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.hevc])
        }

        // Enable RAW if supported
        if photoOutput.isAppleProRAWSupported {
            settings.isAppleProRAWEnabled = true
        }

        // Flash settings
        if currentDevice?.hasFlash == true {
            settings.flashMode = flashMode
        }

        // Enable high resolution capture
        settings.isHighResolutionPhotoEnabled = true

        // Depth data if available
        if photoOutput.isDepthDataDeliverySupported {
            settings.isDepthDataDeliveryEnabled = true
        }

        // Portrait effects matte
        if photoOutput.isPortraitEffectsMatteDeliverySupported {
            settings.isPortraitEffectsMatteDeliveryEnabled = true
        }

        photoOutput.capturePhoto(with: settings, delegate: self)
    }

    // MARK: - Video Recording
    func startVideoRecording() {
        guard !isRecording, isSessionRunning else { return }

        let outputURL = createVideoOutputURL()

        // Configure video recording settings
        if let connection = videoOutput.connection(with: .video) {
            connection.videoOrientation = .portrait

            if connection.isVideoStabilizationSupported {
                connection.preferredVideoStabilizationMode = .cinematicExtended
            }
        }

        videoOutput.startRecording(to: outputURL, recordingDelegate: self)
        isRecording = true
    }

    func stopVideoRecording() {
        guard isRecording else { return }

        videoOutput.stopRecording()
        isRecording = false
    }

    // MARK: - Camera Controls
    func switchCaptureMode(_ mode: CaptureMode) {
        captureMode = mode

        // Optimize session configuration for each mode
        session.beginConfiguration()

        switch mode {
        case .photo:
            if session.canSetSessionPreset(.hd4K3840x2160) {
                session.sessionPreset = .hd4K3840x2160
            }
        case .video:
            if session.canSetSessionPreset(.high) {
                session.sessionPreset = .high
            }
        case .timelapse:
            if session.canSetSessionPreset(.medium) {
                session.sessionPreset = .medium
            }
        }

        session.commitConfiguration()
    }

    func toggleFlash() {
        switch flashMode {
        case .auto:
            flashMode = .on
        case .on:
            flashMode = .off
        case .off:
            flashMode = .auto
        @unknown default:
            flashMode = .auto
        }
    }

    func focusAt(point: CGPoint) {
        guard let device = currentDevice else { return }

        do {
            try device.lockForConfiguration()

            if device.isFocusPointOfInterestSupported {
                device.focusPointOfInterest = point
                device.focusMode = .autoFocus
            }

            if device.isExposurePointOfInterestSupported {
                device.exposurePointOfInterest = point
                device.exposureMode = .autoExpose
            }

            device.unlockForConfiguration()
        } catch {
            errorMessage = "Failed to focus: \(error.localizedDescription)"
        }
    }

    // MARK: - Utilities
    private func createVideoOutputURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let fileName = "video_\(Date().timeIntervalSince1970).mov"
        return documentsDirectory.appendingPathComponent(fileName)
    }

    // MARK: - Permissions
    static func checkCameraPermission() async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            return true
        case .notDetermined:
            return await AVCaptureDevice.requestAccess(for: .video)
        default:
            return false
        }
    }
}

// MARK: - Photo Capture Delegate
extension CameraController: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error = error {
            errorMessage = "Photo capture failed: \(error.localizedDescription)"
            return
        }

        guard let imageData = photo.fileDataRepresentation() else {
            errorMessage = "Failed to get image data"
            return
        }

        // Process the photo
        Task {
            do {
                let processedImage = try await photoProcessor.processPhoto(data: imageData, photo: photo)
                capturedPhoto = processedImage
            } catch {
                errorMessage = "Failed to process photo: \(error.localizedDescription)"
            }
        }
    }
}

// MARK: - Video Capture Delegate
extension CameraController: AVCaptureFileOutputRecordingDelegate {
    func fileOutput(_ output: AVCaptureFileOutput, didStartRecordingTo fileURL: URL, from connections: [AVCaptureConnection]) {
        // Recording started
    }

    func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        if let error = error {
            errorMessage = "Video recording failed: \(error.localizedDescription)"
            return
        }

        lastCapturedVideoURL = outputFileURL
    }
}

// MARK: - Photo Processor
class PhotoProcessor {
    private let context = CIContext()

    func processPhoto(data: Data, photo: AVCapturePhoto) async throws -> UIImage {
        guard let ciImage = CIImage(data: data) else {
            throw PhotoProcessingError.invalidImageData
        }

        var processedImage = ciImage

        // Apply professional processing
        processedImage = try await enhanceImage(processedImage)
        processedImage = try await correctExposure(processedImage)
        processedImage = try await sharpenImage(processedImage)

        // Convert back to UIImage
        guard let cgImage = context.createCGImage(processedImage, from: processedImage.extent) else {
            throw PhotoProcessingError.processingFailed
        }

        return UIImage(cgImage: cgImage)
    }

    private func enhanceImage(_ image: CIImage) async throws -> CIImage {
        let filter = CIFilter.colorControls()
        filter.inputImage = image
        filter.brightness = 0.1
        filter.contrast = 1.1
        filter.saturation = 1.05

        guard let output = filter.outputImage else {
            throw PhotoProcessingError.filterFailed
        }

        return output
    }

    private func correctExposure(_ image: CIImage) async throws -> CIImage {
        let filter = CIFilter.exposureAdjust()
        filter.inputImage = image
        filter.ev = 0.2

        guard let output = filter.outputImage else {
            throw PhotoProcessingError.filterFailed
        }

        return output
    }

    private func sharpenImage(_ image: CIImage) async throws -> CIImage {
        let filter = CIFilter.unsharpMask()
        filter.inputImage = image
        filter.radius = 2.0
        filter.intensity = 0.5

        guard let output = filter.outputImage else {
            throw PhotoProcessingError.filterFailed
        }

        return output
    }
}

// MARK: - Errors
enum PhotoProcessingError: LocalizedError {
    case invalidImageData
    case processingFailed
    case filterFailed

    var errorDescription: String? {
        switch self {
        case .invalidImageData:
            return "Invalid image data"
        case .processingFailed:
            return "Image processing failed"
        case .filterFailed:
            return "Filter application failed"
        }
    }
}

// MARK: - Camera Preview
struct CameraPreview: UIViewRepresentable {
    @ObservedObject var cameraController: CameraController

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: UIScreen.main.bounds)
        view.backgroundColor = .black

        let previewLayer = AVCaptureVideoPreviewLayer(session: cameraController.session)
        previewLayer.frame = view.frame
        previewLayer.videoGravity = .resizeAspectFill

        view.layer.addSublayer(previewLayer)

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        // Update preview layer if needed
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: ()) {
        // Cleanup when view is removed
    }
}

// MARK: - Camera View
struct CameraView: View {
    @StateObject private var cameraController = CameraController()
    @State private var showingCapturedPhoto = false
    @State private var showingSettings = false

    var body: some View {
        ZStack {
            // Camera Preview
            CameraPreview(cameraController: cameraController)
                .ignoresSafeArea()

            // Camera Controls Overlay
            VStack {
                // Top Controls
                HStack {
                    // Flash Control
                    Button(action: { cameraController.toggleFlash() }) {
                        Image(systemName: flashIcon)
                            .font(.title2)
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.black.opacity(0.3))
                            .clipShape(Circle())
                    }

                    Spacer()

                    // Settings
                    Button(action: { showingSettings = true }) {
                        Image(systemName: "gearshape")
                            .font(.title2)
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.black.opacity(0.3))
                            .clipShape(Circle())
                    }
                }
                .padding()

                Spacer()

                // Bottom Controls
                VStack(spacing: 20) {
                    // Mode Selector
                    HStack(spacing: 30) {
                        ForEach(CameraController.CaptureMode.allCases, id: \.self) { mode in
                            Button(mode.displayName) {
                                cameraController.switchCaptureMode(mode)
                            }
                            .foregroundColor(cameraController.captureMode == mode ? .yellow : .white)
                            .font(.headline)
                        }
                    }

                    // Capture Controls
                    HStack(spacing: 50) {
                        // Captured Photo Thumbnail
                        if let capturedPhoto = cameraController.capturedPhoto {
                            Button(action: { showingCapturedPhoto = true }) {
                                Image(uiImage: capturedPhoto)
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 50, height: 50)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        } else {
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 50, height: 50)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }

                        // Capture Button
                        Button(action: captureAction) {
                            ZStack {
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 80, height: 80)

                                if cameraController.isRecording {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color.red)
                                        .frame(width: 30, height: 30)
                                } else {
                                    Circle()
                                        .fill(Color.white)
                                        .frame(width: 70, height: 70)
                                        .overlay(
                                            Circle()
                                                .stroke(Color.black, lineWidth: 2)
                                                .frame(width: 60, height: 60)
                                        )
                                }
                            }
                        }

                        Spacer()
                            .frame(width: 50)
                    }
                }
                .padding(.bottom, 30)
            }

            // Error Message
            if let errorMessage = cameraController.errorMessage {
                VStack {
                    Spacer()

                    Text(errorMessage)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.red.opacity(0.8))
                        .cornerRadius(8)
                        .padding()
                }
            }
        }
        .onAppear {
            Task {
                if await CameraController.checkCameraPermission() {
                    cameraController.startSession()
                }
            }
        }
        .onDisappear {
            cameraController.stopSession()
        }
        .sheet(isPresented: $showingCapturedPhoto) {
            if let photo = cameraController.capturedPhoto {
                PhotoDetailView(image: photo)
            }
        }
        .sheet(isPresented: $showingSettings) {
            CameraSettingsView()
        }
    }

    private var flashIcon: String {
        switch cameraController.flashMode {
        case .auto:
            return "bolt.badge.a"
        case .on:
            return "bolt"
        case .off:
            return "bolt.slash"
        @unknown default:
            return "bolt.badge.a"
        }
    }

    private func captureAction() {
        switch cameraController.captureMode {
        case .photo:
            cameraController.capturePhoto()
        case .video, .timelapse:
            if cameraController.isRecording {
                cameraController.stopVideoRecording()
            } else {
                cameraController.startVideoRecording()
            }
        }
    }
}

// MARK: - Photo Detail View
struct PhotoDetailView: View {
    let image: UIImage
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Image(uiImage: image)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .navigationTitle("Captured Photo")
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

// MARK: - Camera Settings View
struct CameraSettingsView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Camera Quality") {
                    Text("4K Ultra HD")
                }

                Section("Features") {
                    HStack {
                        Text("HDR")
                        Spacer()
                        Text("Auto")
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Image Stabilization")
                        Spacer()
                        Text("On")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Camera Settings")
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
