import Foundation
import Combine
import AuthenticationServices

// MARK: - Supabase Service Protocol
protocol SupabaseServiceProtocol {
    func signIn(email: String, password: String) async throws -> AuthUser
    func signUp(email: String, password: String, metadata: [String: Any]) async throws -> AuthUser
    func signOut() async throws
    func getCurrentUser() -> AuthUser?
    func refreshSession() async throws -> AuthUser
    
    // Properties
    func fetchProperties() async throws -> [PropertyResponse]
    func createProperty(_ property: PropertyRequest) async throws -> PropertyResponse
    func updateProperty(_ property: PropertyRequest) async throws -> PropertyResponse
    
    // Assessments
    func fetchAssessments(propertyId: UUID?) async throws -> [AssessmentResponse]
    func createAssessment(_ assessment: AssessmentRequest) async throws -> AssessmentResponse
    func updateAssessment(_ assessment: AssessmentRequest) async throws -> AssessmentResponse
    
    // Photos & Files
    func uploadPhoto(data: Data, path: String) async throws -> String
    func downloadPhoto(path: String) async throws -> Data
    func deletePhoto(path: String) async throws
    
    // AI Services
    func analyzeImage(imageData: Data, prompt: String) async throws -> AIAnalysisResponse
    func generateReport(assessmentId: UUID) async throws -> String
}

// MARK: - Supabase Service Implementation
class SupabaseService: ObservableObject, SupabaseServiceProtocol {
    static let shared = SupabaseService()
    
    private let baseURL = "https://your-supabase-url.supabase.co"
    private let apiKey = Bundle.main.object(forInfoPlistKey: "SupabaseAPIKey") as? String ?? ""
    private let session = URLSession.shared
    
    @Published var currentUser: AuthUser?
    @Published var isAuthenticated = false
    
    private var authToken: String?
    private var refreshToken: String?
    
    init() {
        loadStoredAuth()
    }
    
    // MARK: - Authentication
    func signIn(email: String, password: String) async throws -> AuthUser {
        let request = AuthRequest(email: email, password: password)
        let response: AuthResponse = try await performRequest(
            endpoint: "/auth/v1/token?grant_type=password",
            method: "POST",
            body: request
        )
        
        await storeAuthData(response)
        return response.user
    }
    
    func signUp(email: String, password: String, metadata: [String: Any] = [:]) async throws -> AuthUser {
        let request = SignUpRequest(email: email, password: password, data: metadata)
        let response: AuthResponse = try await performRequest(
            endpoint: "/auth/v1/signup",
            method: "POST",
            body: request
        )
        
        await storeAuthData(response)
        return response.user
    }
    
    func signOut() async throws {
        _ = try await performRequest(
            endpoint: "/auth/v1/logout",
            method: "POST",
            body: Optional<String>.none,
            requiresAuth: true
        ) as EmptyResponse
        
        await clearAuthData()
    }
    
    func getCurrentUser() -> AuthUser? {
        return currentUser
    }
    
    func refreshSession() async throws -> AuthUser {
        guard let refreshToken = refreshToken else {
            throw SupabaseError.noRefreshToken
        }
        
        let request = RefreshTokenRequest(refreshToken: refreshToken)
        let response: AuthResponse = try await performRequest(
            endpoint: "/auth/v1/token?grant_type=refresh_token",
            method: "POST",
            body: request
        )
        
        await storeAuthData(response)
        return response.user
    }
    
    // MARK: - Properties
    func fetchProperties() async throws -> [PropertyResponse] {
        return try await performRequest(
            endpoint: "/rest/v1/properties",
            method: "GET",
            requiresAuth: true
        )
    }
    
    func createProperty(_ property: PropertyRequest) async throws -> PropertyResponse {
        return try await performRequest(
            endpoint: "/rest/v1/properties",
            method: "POST",
            body: property,
            requiresAuth: true
        )
    }
    
    func updateProperty(_ property: PropertyRequest) async throws -> PropertyResponse {
        return try await performRequest(
            endpoint: "/rest/v1/properties?id=eq.\(property.id)",
            method: "PATCH",
            body: property,
            requiresAuth: true
        )
    }
    
    // MARK: - Assessments
    func fetchAssessments(propertyId: UUID? = nil) async throws -> [AssessmentResponse] {
        var endpoint = "/rest/v1/assessments?select=*,property(*),photos(*),damage_items(*)"
        if let propertyId = propertyId {
            endpoint += "&property_id=eq.\(propertyId)"
        }
        
        return try await performRequest(
            endpoint: endpoint,
            method: "GET",
            requiresAuth: true
        )
    }
    
    func createAssessment(_ assessment: AssessmentRequest) async throws -> AssessmentResponse {
        return try await performRequest(
            endpoint: "/rest/v1/assessments",
            method: "POST",
            body: assessment,
            requiresAuth: true
        )
    }
    
    func updateAssessment(_ assessment: AssessmentRequest) async throws -> AssessmentResponse {
        return try await performRequest(
            endpoint: "/rest/v1/assessments?id=eq.\(assessment.id)",
            method: "PATCH",
            body: assessment,
            requiresAuth: true
        )
    }
    
    // MARK: - Storage
    func uploadPhoto(data: Data, path: String) async throws -> String {
        var request = URLRequest(url: URL(string: "\(baseURL)/storage/v1/object/photos/\(path)")!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken ?? "")", forHTTPHeaderField: "Authorization")
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        request.httpBody = data
        
        let (_, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw SupabaseError.uploadFailed
        }
        
        return "\(baseURL)/storage/v1/object/public/photos/\(path)"
    }
    
    func downloadPhoto(path: String) async throws -> Data {
        let url = URL(string: "\(baseURL)/storage/v1/object/public/photos/\(path)")!
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw SupabaseError.downloadFailed
        }
        
        return data
    }
    
    func deletePhoto(path: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/storage/v1/object/photos/\(path)")!)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(authToken ?? "")", forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw SupabaseError.deleteFailed
        }
    }
    
    // MARK: - AI Services
    func analyzeImage(imageData: Data, prompt: String) async throws -> AIAnalysisResponse {
        let base64Image = imageData.base64EncodedString()
        let request = AIAnalysisRequest(image: base64Image, prompt: prompt)
        
        return try await performRequest(
            endpoint: "/functions/v1/analyze-damage",
            method: "POST",
            body: request,
            requiresAuth: true
        )
    }
    
    func generateReport(assessmentId: UUID) async throws -> String {
        let request = ReportRequest(assessmentId: assessmentId)
        let response: ReportResponse = try await performRequest(
            endpoint: "/functions/v1/generate-report",
            method: "POST",
            body: request,
            requiresAuth: true
        )
        
        return response.reportUrl
    }
    
    // MARK: - Private Methods
    private func performRequest<T: Codable, U: Codable>(
        endpoint: String,
        method: String,
        body: T? = nil,
        requiresAuth: Bool = false
    ) async throws -> U {
        
        guard let url = URL(string: baseURL + endpoint) else {
            throw SupabaseError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        
        if requiresAuth {
            guard let authToken = authToken else {
                throw SupabaseError.notAuthenticated
            }
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.invalidResponse
        }
        
        if httpResponse.statusCode == 401 {
            // Try to refresh token
            if requiresAuth {
                try await refreshSession()
                // Retry request
                request.setValue("Bearer \(authToken ?? "")", forHTTPHeaderField: "Authorization")
                let (retryData, retryResponse) = try await session.data(for: request)
                guard let retryHttpResponse = retryResponse as? HTTPURLResponse,
                      200...299 ~= retryHttpResponse.statusCode else {
                    throw SupabaseError.authenticationFailed
                }
                return try JSONDecoder().decode(U.self, from: retryData)
            } else {
                throw SupabaseError.authenticationFailed
            }
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw SupabaseError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(U.self, from: data)
    }
    
    @MainActor
    private func storeAuthData(_ response: AuthResponse) {
        self.currentUser = response.user
        self.authToken = response.accessToken
        self.refreshToken = response.refreshToken
        self.isAuthenticated = true
        
        // Store in keychain
        KeychainHelper.store(response.accessToken, forKey: "access_token")
        KeychainHelper.store(response.refreshToken ?? "", forKey: "refresh_token")
        
        // Store user data
        if let userData = try? JSONEncoder().encode(response.user) {
            UserDefaults.standard.set(userData, forKey: "current_user")
        }
    }
    
    @MainActor
    private func clearAuthData() {
        self.currentUser = nil
        self.authToken = nil
        self.refreshToken = nil
        self.isAuthenticated = false
        
        KeychainHelper.delete(forKey: "access_token")
        KeychainHelper.delete(forKey: "refresh_token")
        UserDefaults.standard.removeObject(forKey: "current_user")
    }
    
    private func loadStoredAuth() {
        if let token = KeychainHelper.load(forKey: "access_token"),
           let refreshToken = KeychainHelper.load(forKey: "refresh_token"),
           let userData = UserDefaults.standard.data(forKey: "current_user"),
           let user = try? JSONDecoder().decode(AuthUser.self, from: userData) {
            
            DispatchQueue.main.async {
                self.authToken = token
                self.refreshToken = refreshToken
                self.currentUser = user
                self.isAuthenticated = true
            }
            
            // Validate token
            Task {
                do {
                    _ = try await self.refreshSession()
                } catch {
                    await self.clearAuthData()
                }
            }
        }
    }
}

// MARK: - Data Models
struct AuthUser: Codable {
    let id: UUID
    let email: String
    let userMetadata: [String: AnyCodable]?
    let createdAt: Date
    let updatedAt: Date
}

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String?
    let user: AuthUser
    let expiresIn: Int
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
        case expiresIn = "expires_in"
    }
}

struct AuthRequest: Codable {
    let email: String
    let password: String
}

struct SignUpRequest: Codable {
    let email: String
    let password: String
    let data: [String: Any]
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(email, forKey: .email)
        try container.encode(password, forKey: .password)
        
        // Convert [String: Any] to encodable format
        let encodableData = data.compactMapValues { AnyCodable($0) }
        try container.encode(encodableData, forKey: .data)
    }
    
    enum CodingKeys: String, CodingKey {
        case email, password, data
    }
}

struct RefreshTokenRequest: Codable {
    let refreshToken: String
    
    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}

struct EmptyResponse: Codable {}

// MARK: - API Models
struct PropertyRequest: Codable {
    let id: UUID?
    let address: String
    let propertyType: String
    let latitude: Double?
    let longitude: Double?
    let metadata: [String: AnyCodable]?
}

struct PropertyResponse: Codable {
    let id: UUID
    let address: String
    let propertyType: String
    let latitude: Double?
    let longitude: Double?
    let createdAt: Date
    let updatedAt: Date
    let metadata: [String: AnyCodable]?
}

struct AssessmentRequest: Codable {
    let id: UUID?
    let propertyId: UUID
    let title: String
    let status: String
    let priority: String?
    let metadata: [String: AnyCodable]?
}

struct AssessmentResponse: Codable {
    let id: UUID
    let propertyId: UUID
    let title: String
    let status: String
    let priority: String?
    let createdAt: Date
    let updatedAt: Date
    let metadata: [String: AnyCodable]?
    let property: PropertyResponse?
    let photos: [PhotoResponse]?
    let damageItems: [DamageItemResponse]?
}

struct PhotoResponse: Codable {
    let id: UUID
    let assessmentId: UUID
    let filename: String
    let url: String
    let thumbnailUrl: String?
    let metadata: [String: AnyCodable]?
    let createdAt: Date
}

struct DamageItemResponse: Codable {
    let id: UUID
    let assessmentId: UUID
    let category: String
    let description: String
    let severity: String
    let estimatedCost: Double?
    let metadata: [String: AnyCodable]?
}

struct AIAnalysisRequest: Codable {
    let image: String
    let prompt: String
}

struct AIAnalysisResponse: Codable {
    let analysis: String
    let confidence: Double
    let categories: [String]
    let estimatedCost: Double?
    let severity: String
    let metadata: [String: AnyCodable]?
}

struct ReportRequest: Codable {
    let assessmentId: UUID
}

struct ReportResponse: Codable {
    let reportUrl: String
}

// MARK: - Helper for Any type encoding
struct AnyCodable: Codable {
    let value: Any
    
    init<T>(_ value: T) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let boolValue = try? container.decode(Bool.self) {
            value = boolValue
        } else if let intValue = try? container.decode(Int.self) {
            value = intValue
        } else if let doubleValue = try? container.decode(Double.self) {
            value = doubleValue
        } else if let stringValue = try? container.decode(String.self) {
            value = stringValue
        } else if let arrayValue = try? container.decode([AnyCodable].self) {
            value = arrayValue.map { $0.value }
        } else if let dictionaryValue = try? container.decode([String: AnyCodable].self) {
            value = dictionaryValue.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let boolValue as Bool:
            try container.encode(boolValue)
        case let intValue as Int:
            try container.encode(intValue)
        case let doubleValue as Double:
            try container.encode(doubleValue)
        case let stringValue as String:
            try container.encode(stringValue)
        case let arrayValue as [Any]:
            let codableArray = arrayValue.map { AnyCodable($0) }
            try container.encode(codableArray)
        case let dictionaryValue as [String: Any]:
            let codableDictionary = dictionaryValue.mapValues { AnyCodable($0) }
            try container.encode(codableDictionary)
        default:
            try container.encodeNil()
        }
    }
}

// MARK: - Errors
enum SupabaseError: LocalizedError {
    case invalidURL
    case invalidResponse
    case notAuthenticated
    case authenticationFailed
    case noRefreshToken
    case uploadFailed
    case downloadFailed
    case deleteFailed
    case httpError(Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .notAuthenticated:
            return "User not authenticated"
        case .authenticationFailed:
            return "Authentication failed"
        case .noRefreshToken:
            return "No refresh token available"
        case .uploadFailed:
            return "File upload failed"
        case .downloadFailed:
            return "File download failed"
        case .deleteFailed:
            return "File deletion failed"
        case .httpError(let code):
            return "HTTP error: \(code)"
        }
    }
}