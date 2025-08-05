/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
export interface ExtractedPolicyData {
  policyNumber?: string
  carrierName?: string
  policyType?: string
  coverageAmount?: number
  deductible?: number
  windDeductible?: number | string
  floodDeductible?: number
  effectiveDate?: string
  expirationDate?: string
  issueDate?: string
  propertyAddress?: string
  namedInsured?: string
  premiumAmount?: number
  additionalCoverages?: string[]
  confidence?: number
  extractedFields?: string[]
  processingTime?: number
}

export interface ClaimAnalysisResult {
  claimType: string
  estimatedDamage?: number
  severity: 'minor' | 'moderate' | 'major' | 'total_loss'
  affectedAreas: string[]
  recommendedActions: string[]
  confidence: number
  processingTime?: number
}

export interface AIProvider {
  name: 'gemini' | 'openai' | 'claude'
  available: boolean
  apiKey?: string
}

export interface AIServiceConfig {
  providers: AIProvider[]
  retryAttempts?: number
  retryDelay?: number
  timeout?: number
  cacheEnabled?: boolean
  cacheTTL?: number
}

export interface DocumentExtractionRequest {
  fileUrl: string
  fileName: string
  fileType?: string
  apiProvider?: 'gemini' | 'openai'
  useOCR?: boolean
  confidenceThreshold?: number
}

export interface ClaimAssistantContext {
  userId: string
  propertyId?: string
  claimId?: string
  previousMessages?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
}

export interface AIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  provider?: string
  confidence?: number
  processingTime?: number
  cached?: boolean
}