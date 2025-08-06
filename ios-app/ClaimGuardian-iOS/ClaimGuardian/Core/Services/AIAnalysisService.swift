import Foundation
import Vision
import CoreML
import UIKit
import Combine

// MARK: - AI Analysis Service
@MainActor
class AIAnalysisService: ObservableObject {
    static let shared = AIAnalysisService()
    
    @Published var analysisProgress: Double = 0.0
    @Published var isAnalyzing = false
    @Published var lastAnalysis: DamageAnalysis?
    @Published var errorMessage: String?
    
    private let visionService = VisionAnalysisService()
    private let supabaseService = SupabaseService.shared
    private let localMLService = LocalMLService()
    private let session = URLSession.shared
    
    private init() {
        setupServices()
    }
    
    private func setupServices() {
        Task {
            await localMLService.loadModels()
        }
    }
    
    // MARK: - Main Analysis Method
    func analyzeDamage(
        image: UIImage,
        assessmentContext: AssessmentContext? = nil
    ) async throws -> DamageAnalysis {
        
        isAnalyzing = true
        analysisProgress = 0.0
        errorMessage = nil
        
        do {
            // Step 1: Local Vision Analysis (20%)
            analysisProgress = 0.1
            let localResults = try await visionService.performLocalAnalysis(image: image)
            analysisProgress = 0.2
            
            // Step 2: Local ML Model Analysis (40%)
            let mlResults = try await localMLService.analyzeDamage(image: image)
            analysisProgress = 0.4
            
            // Step 3: Enhanced Cloud Analysis (80%)
            let enhancedResults = try await performCloudAnalysis(
                image: image,
                localResults: localResults,
                mlResults: mlResults,
                context: assessmentContext
            )
            analysisProgress = 0.8
            
            // Step 4: Combine and Validate Results (100%)
            let finalAnalysis = combineAnalysisResults(
                local: localResults,
                ml: mlResults,
                enhanced: enhancedResults,
                image: image
            )
            analysisProgress = 1.0
            
            lastAnalysis = finalAnalysis
            isAnalyzing = false
            
            return finalAnalysis
            
        } catch {
            isAnalyzing = false
            errorMessage = error.localizedDescription
            throw error
        }
    }
    
    // MARK: - Cloud Analysis
    private func performCloudAnalysis(
        image: UIImage,
        localResults: LocalAnalysisResults,
        mlResults: MLAnalysisResults,
        context: AssessmentContext?
    ) async throws -> EnhancedAnalysisResults {
        
        // Convert image to base64
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            throw AIAnalysisError.imageProcessingFailed
        }
        
        // Create analysis prompt with context
        let prompt = createAnalysisPrompt(
            localResults: localResults,
            mlResults: mlResults,
            context: context
        )
        
        // Perform cloud analysis through Supabase
        let cloudResults = try await supabaseService.analyzeImage(
            imageData: imageData,
            prompt: prompt
        )
        
        return EnhancedAnalysisResults(
            categories: cloudResults.categories,
            severity: DamageSeverity(rawValue: cloudResults.severity) ?? .unknown,
            estimatedCost: cloudResults.estimatedCost ?? 0,
            confidence: cloudResults.confidence,
            description: cloudResults.analysis,
            recommendations: parseRecommendations(from: cloudResults.analysis),
            metadata: cloudResults.metadata
        )
    }
    
    private func createAnalysisPrompt(
        localResults: LocalAnalysisResults,
        mlResults: MLAnalysisResults,
        context: AssessmentContext?
    ) -> String {
        var prompt = """
        Analyze this property damage image as an expert insurance adjuster. 
        
        Local analysis detected:
        - Objects: \(localResults.detectedObjects.map { $0.label }.joined(separator: ", "))
        - Text: \(localResults.extractedText)
        - Dominant colors: \(localResults.dominantColors.map { $0.description }.joined(separator: ", "))
        
        ML model predictions:
        - Damage type: \(mlResults.damageType)
        - Severity: \(mlResults.severity.rawValue)
        - Confidence: \(mlResults.confidence)
        
        """
        
        if let context = context {
            prompt += """
            
            Property context:
            - Type: \(context.propertyType)
            - Age: \(context.propertyAge) years
            - Location: \(context.location)
            - Previous claims: \(context.previousClaims)
            
            """
        }
        
        prompt += """
        
        Please provide:
        1. Detailed damage assessment
        2. Estimated repair cost range
        3. Severity rating (minor, moderate, major, severe)
        4. Recommended next steps
        5. Insurance claim considerations
        6. Required documentation
        
        Format as JSON with fields: analysis, categories, severity, estimatedCost, recommendations.
        """
        
        return prompt
    }
    
    // MARK: - Results Combination
    private func combineAnalysisResults(
        local: LocalAnalysisResults,
        ml: MLAnalysisResults,
        enhanced: EnhancedAnalysisResults,
        image: UIImage
    ) -> DamageAnalysis {
        
        // Calculate final confidence score
        let confidence = calculateFinalConfidence(
            localConfidence: local.confidence,
            mlConfidence: ml.confidence,
            enhancedConfidence: enhanced.confidence
        )
        
        // Determine final severity
        let severity = determineFinalSeverity(
            mlSeverity: ml.severity,
            enhancedSeverity: enhanced.severity,
            confidence: confidence
        )
        
        // Create damage items from analysis
        let damageItems = createDamageItems(
            from: enhanced,
            localResults: local,
            mlResults: ml
        )
        
        return DamageAnalysis(
            id: UUID(),
            imageId: UUID(), // This would be the actual photo ID
            analysisType: .comprehensive,
            damageItems: damageItems,
            overallSeverity: severity,
            estimatedTotalCost: enhanced.estimatedCost,
            confidence: confidence,
            description: enhanced.description,
            recommendations: enhanced.recommendations,
            metadata: DamageAnalysisMetadata(
                localResults: local,
                mlResults: ml,
                enhancedResults: enhanced,
                processingTime: Date().timeIntervalSince(Date()),
                modelVersions: localMLService.modelVersions
            ),
            createdAt: Date(),
            processingTime: Date().timeIntervalSince(Date())
        )
    }
    
    private func calculateFinalConfidence(
        localConfidence: Double,
        mlConfidence: Double,
        enhancedConfidence: Double
    ) -> Double {
        // Weighted average with enhanced results having higher weight
        let weights: [Double] = [0.2, 0.3, 0.5] // local, ml, enhanced
        let confidences = [localConfidence, mlConfidence, enhancedConfidence]
        
        return zip(weights, confidences).reduce(0.0) { result, pair in
            result + (pair.0 * pair.1)
        }
    }
    
    private func determineFinalSeverity(
        mlSeverity: DamageSeverity,
        enhancedSeverity: DamageSeverity,
        confidence: Double
    ) -> DamageSeverity {
        // Use enhanced severity if confidence is high, otherwise use ML as fallback
        return confidence > 0.7 ? enhancedSeverity : mlSeverity
    }
    
    private func createDamageItems(
        from enhanced: EnhancedAnalysisResults,
        localResults: LocalAnalysisResults,
        mlResults: MLAnalysisResults
    ) -> [DamageItem] {
        
        var items: [DamageItem] = []
        
        // Create primary damage item from ML results
        let primaryItem = DamageItem(
            id: UUID(),
            category: mlResults.damageType,
            subcategory: nil,
            description: enhanced.description,
            severity: enhanced.severity.rawValue,
            location: extractLocationFromObjects(localResults.detectedObjects),
            dimensions: nil, // Would be filled by AR measurements
            estimatedCost: enhanced.estimatedCost,
            repairUrgency: calculateRepairUrgency(severity: enhanced.severity),
            confidence: enhanced.confidence,
            evidencePhotos: [],
            createdAt: Date()
        )
        
        items.append(primaryItem)
        
        // Create additional items from detected objects
        for object in localResults.detectedObjects {
            if let damageType = mapObjectToDamageType(object) {
                let additionalItem = DamageItem(
                    id: UUID(),
                    category: damageType,
                    subcategory: object.label,
                    description: "Detected \(object.label) damage",
                    severity: estimateSeverityFromObject(object),
                    location: object.boundingBox.description,
                    dimensions: nil,
                    estimatedCost: estimateCostFromObject(object),
                    repairUrgency: .medium,
                    confidence: object.confidence,
                    evidencePhotos: [],
                    createdAt: Date()
                )
                items.append(additionalItem)
            }
        }
        
        return items
    }
    
    // MARK: - Utility Methods
    private func parseRecommendations(from analysis: String) -> [String] {
        // Extract recommendations from AI analysis text
        let lines = analysis.components(separatedBy: .newlines)
        return lines.compactMap { line in
            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.hasPrefix("•") || trimmed.hasPrefix("-") || trimmed.contains("recommend") {
                return trimmed
            }
            return nil
        }
    }
    
    private func extractLocationFromObjects(_ objects: [DetectedObject]) -> String {
        // Analyze object positions to determine damage location
        let locations = objects.compactMap { object -> String? in
            let center = object.boundingBox.center
            
            if center.y < 0.3 {
                return "Upper area"
            } else if center.y > 0.7 {
                return "Lower area"
            } else if center.x < 0.3 {
                return "Left side"
            } else if center.x > 0.7 {
                return "Right side"
            } else {
                return "Center"
            }
        }
        
        return locations.first ?? "Unknown location"
    }
    
    private func mapObjectToDamageType(_ object: DetectedObject) -> String? {
        let damageKeywords = [
            "crack", "hole", "dent", "scratch", "stain", "leak",
            "break", "tear", "chip", "burn", "rust", "mold"
        ]
        
        let label = object.label.lowercased()
        return damageKeywords.first { label.contains($0) }
    }
    
    private func estimateSeverityFromObject(_ object: DetectedObject) -> String {
        // Estimate severity based on object size and confidence
        let area = object.boundingBox.width * object.boundingBox.height
        
        if area > 0.3 && object.confidence > 0.8 {
            return "major"
        } else if area > 0.1 || object.confidence > 0.6 {
            return "moderate"
        } else {
            return "minor"
        }
    }
    
    private func estimateCostFromObject(_ object: DetectedObject) -> Double {
        // Basic cost estimation based on damage type and size
        let area = object.boundingBox.width * object.boundingBox.height
        let baseMultiplier = 100.0 // Base cost per unit area
        
        return area * baseMultiplier * Double(object.confidence)
    }
    
    private func calculateRepairUrgency(severity: DamageSeverity) -> RepairUrgency {
        switch severity {
        case .minor:
            return .low
        case .moderate:
            return .medium
        case .major:
            return .high
        case .severe:
            return .critical
        case .unknown:
            return .medium
        }
    }
}

// MARK: - Vision Analysis Service
class VisionAnalysisService {
    
    func performLocalAnalysis(image: UIImage) async throws -> LocalAnalysisResults {
        guard let cgImage = image.cgImage else {
            throw AIAnalysisError.imageProcessingFailed
        }
        
        return try await withThrowingTaskGroup(of: Void.self) { group in
            var detectedObjects: [DetectedObject] = []
            var extractedText = ""
            var dominantColors: [UIColor] = []
            var confidence = 0.0
            
            // Object Detection
            group.addTask {
                detectedObjects = try await self.performObjectDetection(cgImage: cgImage)
            }
            
            // Text Recognition
            group.addTask {
                extractedText = try await self.performTextRecognition(cgImage: cgImage)
            }
            
            // Color Analysis
            group.addTask {
                dominantColors = await self.analyzeDominantColors(image: image)
            }
            
            try await group.waitForAll()
            
            confidence = calculateOverallConfidence(
                objectCount: detectedObjects.count,
                textLength: extractedText.count,
                colorCount: dominantColors.count
            )
            
            return LocalAnalysisResults(
                detectedObjects: detectedObjects,
                extractedText: extractedText,
                dominantColors: dominantColors,
                confidence: confidence
            )
        }
    }
    
    private func performObjectDetection(cgImage: CGImage) async throws -> [DetectedObject] {
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeObjectsRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let observations = request.results as? [VNRecognizedObjectObservation] ?? []
                let objects = observations.compactMap { observation -> DetectedObject? in
                    guard let identifier = observation.labels.first else { return nil }
                    
                    return DetectedObject(
                        label: identifier.identifier,
                        confidence: Double(identifier.confidence),
                        boundingBox: observation.boundingBox
                    )
                }
                
                continuation.resume(returning: objects)
            }
            
            let handler = VNImageRequestHandler(cgImage: cgImage)
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
    
    private func performTextRecognition(cgImage: CGImage) async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let observations = request.results as? [VNRecognizedTextObservation] ?? []
                let text = observations.compactMap { observation in
                    try? observation.topCandidates(1).first?.string
                }.joined(separator: " ")
                
                continuation.resume(returning: text)
            }
            
            request.recognitionLevel = .accurate
            
            let handler = VNImageRequestHandler(cgImage: cgImage)
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
    
    private func analyzeDominantColors(image: UIImage) async -> [UIColor] {
        return await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                let colors = self.extractDominantColors(from: image, count: 5)
                continuation.resume(returning: colors)
            }
        }
    }
    
    private func extractDominantColors(from image: UIImage, count: Int) -> [UIColor] {
        guard let cgImage = image.cgImage else { return [] }
        
        let width = 50
        let height = 50
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bytesPerPixel = 4
        let bytesPerRow = bytesPerPixel * width
        let bitsPerComponent = 8
        
        guard let data = CFDataCreateMutable(kCFAllocatorDefault, width * height * bytesPerPixel),
              let context = CGContext(
                data: CFDataGetMutableBytePtr(data),
                width: width,
                height: height,
                bitsPerComponent: bitsPerComponent,
                bytesPerRow: bytesPerRow,
                space: colorSpace,
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
              ) else {
            return []
        }
        
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        let pixelData = CFDataGetBytePtr(data)!
        var colorCounts: [String: Int] = [:]
        
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = (y * width + x) * bytesPerPixel
                let r = pixelData[pixelIndex]
                let g = pixelData[pixelIndex + 1]
                let b = pixelData[pixelIndex + 2]
                
                let colorKey = "\(r)-\(g)-\(b)"
                colorCounts[colorKey] = (colorCounts[colorKey] ?? 0) + 1
            }
        }
        
        let sortedColors = colorCounts.sorted { $0.value > $1.value }
        
        return Array(sortedColors.prefix(count)).compactMap { item in
            let components = item.key.split(separator: "-")
            guard components.count == 3,
                  let r = Int(components[0]),
                  let g = Int(components[1]),
                  let b = Int(components[2]) else {
                return nil
            }
            
            return UIColor(
                red: CGFloat(r) / 255.0,
                green: CGFloat(g) / 255.0,
                blue: CGFloat(b) / 255.0,
                alpha: 1.0
            )
        }
    }
    
    private func calculateOverallConfidence(objectCount: Int, textLength: Int, colorCount: Int) -> Double {
        let objectScore = min(Double(objectCount) / 10.0, 1.0) * 0.5
        let textScore = min(Double(textLength) / 100.0, 1.0) * 0.3
        let colorScore = min(Double(colorCount) / 5.0, 1.0) * 0.2
        
        return objectScore + textScore + colorScore
    }
}

// MARK: - Local ML Service
class LocalMLService {
    private var damageClassificationModel: MLModel?
    private var severityEstimationModel: MLModel?
    
    var modelVersions: [String: String] {
        return [
            "damage_classification": "1.0",
            "severity_estimation": "1.0"
        ]
    }
    
    func loadModels() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask {
                await self.loadDamageClassificationModel()
            }
            
            group.addTask {
                await self.loadSeverityEstimationModel()
            }
        }
    }
    
    private func loadDamageClassificationModel() async {
        // In a real implementation, you would load your custom Core ML model
        // For now, we'll use a placeholder
        damageClassificationModel = nil
    }
    
    private func loadSeverityEstimationModel() async {
        // In a real implementation, you would load your custom Core ML model
        // For now, we'll use a placeholder
        severityEstimationModel = nil
    }
    
    func analyzeDamage(image: UIImage) async throws -> MLAnalysisResults {
        // Since we don't have actual models, we'll return mock results
        // In a real implementation, you would:
        // 1. Preprocess the image
        // 2. Run inference on both models
        // 3. Postprocess the results
        
        return MLAnalysisResults(
            damageType: "structural",
            severity: .moderate,
            confidence: 0.75,
            categories: ["wall_damage", "paint_peeling"],
            features: extractImageFeatures(from: image)
        )
    }
    
    private func extractImageFeatures(from image: UIImage) -> [Double] {
        // Extract basic image features for ML processing
        // This is a simplified implementation
        guard let cgImage = image.cgImage else { return [] }
        
        let width = cgImage.width
        let height = cgImage.height
        let aspectRatio = Double(width) / Double(height)
        
        // Basic features
        return [
            aspectRatio,
            Double(width),
            Double(height),
            0.5, // Placeholder for brightness
            0.3, // Placeholder for contrast
            0.2  // Placeholder for saturation
        ]
    }
}

// MARK: - Data Models

struct DamageAnalysis: Codable, Identifiable {
    let id: UUID
    let imageId: UUID
    let analysisType: AnalysisType
    let damageItems: [DamageItem]
    let overallSeverity: DamageSeverity
    let estimatedTotalCost: Double
    let confidence: Double
    let description: String
    let recommendations: [String]
    let metadata: DamageAnalysisMetadata
    let createdAt: Date
    let processingTime: TimeInterval
    
    enum AnalysisType: String, Codable {
        case basic = "basic"
        case comprehensive = "comprehensive"
        case expert = "expert"
    }
}

struct DamageItem: Codable, Identifiable {
    let id: UUID
    let category: String
    let subcategory: String?
    let description: String
    let severity: String
    let location: String
    let dimensions: String?
    let estimatedCost: Double
    let repairUrgency: RepairUrgency
    let confidence: Double
    let evidencePhotos: [UUID]
    let createdAt: Date
}

enum DamageSeverity: String, Codable, CaseIterable {
    case minor = "minor"
    case moderate = "moderate"
    case major = "major"
    case severe = "severe"
    case unknown = "unknown"
    
    var color: UIColor {
        switch self {
        case .minor: return .systemGreen
        case .moderate: return .systemYellow
        case .major: return .systemOrange
        case .severe: return .systemRed
        case .unknown: return .systemGray
        }
    }
    
    var priority: Int {
        switch self {
        case .minor: return 1
        case .moderate: return 2
        case .major: return 3
        case .severe: return 4
        case .unknown: return 0
        }
    }
}

enum RepairUrgency: String, Codable, CaseIterable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"
    
    var displayName: String {
        switch self {
        case .low: return "Low Priority"
        case .medium: return "Medium Priority"
        case .high: return "High Priority"
        case .critical: return "Critical/Emergency"
        }
    }
}

struct AssessmentContext: Codable {
    let propertyType: String
    let propertyAge: Int
    let location: String
    let previousClaims: Int
    let weatherConditions: String?
    let inspectionDate: Date
}

// MARK: - Analysis Results
struct LocalAnalysisResults: Codable {
    let detectedObjects: [DetectedObject]
    let extractedText: String
    let dominantColors: [ColorData]
    let confidence: Double
    
    init(detectedObjects: [DetectedObject], extractedText: String, dominantColors: [UIColor], confidence: Double) {
        self.detectedObjects = detectedObjects
        self.extractedText = extractedText
        self.dominantColors = dominantColors.map { ColorData(color: $0) }
        self.confidence = confidence
    }
}

struct MLAnalysisResults: Codable {
    let damageType: String
    let severity: DamageSeverity
    let confidence: Double
    let categories: [String]
    let features: [Double]
}

struct EnhancedAnalysisResults: Codable {
    let categories: [String]
    let severity: DamageSeverity
    let estimatedCost: Double
    let confidence: Double
    let description: String
    let recommendations: [String]
    let metadata: [String: AnyCodable]?
}

struct DetectedObject: Codable {
    let label: String
    let confidence: Double
    let boundingBox: BoundingBox
    
    init(label: String, confidence: Double, boundingBox: CGRect) {
        self.label = label
        self.confidence = confidence
        self.boundingBox = BoundingBox(rect: boundingBox)
    }
}

struct BoundingBox: Codable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    
    init(rect: CGRect) {
        self.x = Double(rect.origin.x)
        self.y = Double(rect.origin.y)
        self.width = Double(rect.width)
        self.height = Double(rect.height)
    }
    
    var center: CGPoint {
        return CGPoint(x: x + width/2, y: y + height/2)
    }
    
    var description: String {
        return "(\(String(format: "%.2f", x)), \(String(format: "%.2f", y))) \(String(format: "%.2f", width))×\(String(format: "%.2f", height))"
    }
}

struct ColorData: Codable {
    let red: Double
    let green: Double
    let blue: Double
    let alpha: Double
    
    init(color: UIColor) {
        var r: CGFloat = 0
        var g: CGFloat = 0
        var b: CGFloat = 0
        var a: CGFloat = 0
        
        color.getRed(&r, green: &g, blue: &b, alpha: &a)
        
        self.red = Double(r)
        self.green = Double(g)
        self.blue = Double(b)
        self.alpha = Double(a)
    }
    
    var uiColor: UIColor {
        return UIColor(red: red, green: green, blue: blue, alpha: alpha)
    }
    
    var description: String {
        return "RGB(\(String(format: "%.2f", red)), \(String(format: "%.2f", green)), \(String(format: "%.2f", blue)))"
    }
}

struct DamageAnalysisMetadata: Codable {
    let localResults: LocalAnalysisResults
    let mlResults: MLAnalysisResults
    let enhancedResults: EnhancedAnalysisResults
    let processingTime: TimeInterval
    let modelVersions: [String: String]
}

// MARK: - Errors
enum AIAnalysisError: LocalizedError {
    case imageProcessingFailed
    case modelLoadingFailed(String)
    case analysisTimeout
    case networkError(String)
    case insufficientData
    case invalidResponse
    
    var errorDescription: String? {
        switch self {
        case .imageProcessingFailed:
            return "Failed to process the image"
        case .modelLoadingFailed(let model):
            return "Failed to load ML model: \(model)"
        case .analysisTimeout:
            return "Analysis timed out"
        case .networkError(let message):
            return "Network error: \(message)"
        case .insufficientData:
            return "Insufficient data for analysis"
        case .invalidResponse:
            return "Invalid response from AI service"
        }
    }
}