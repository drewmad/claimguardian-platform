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
// AI Response Schemas for structured outputs
// These are framework-agnostic and can be adapted for Gemini, OpenAI, etc.

export interface AIGuidedInventoryResponse {
  isObjectPresent: boolean
  itemName: string
  instruction: string
  isReadyToCapture: boolean
  shotIdentifier: string
}

export interface AIItemAnalysis {
  name: string
  brand: string
  model: string
  category: string
  value: number
  description: string
  serial: string
  condition: 'New' | 'Excellent' | 'Good' | 'Fair' | 'Poor'
}

export interface AIQuickScanItem {
  name: string
  category: string
  value: number
  description: string
  serial?: string
  confidence: number
}

export interface AIDonationItem {
  name: string
  description: string
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  fairMarketValue: number
  quantity: number
  originalCost?: number
  purchaseDate?: string
  isHighValue: boolean
}

export interface AIInspectionGuidance {
  instruction: string
  currentArea: string
  isAreaScanComplete: boolean
  nextAreaSuggestion: string
  suggestedRoomName: string
}

export interface AIInsurancePolicy {
  carrier: string
  policyNumber: string
  effectiveDate: string
  expirationDate: string
  premium: number
  coverageDwelling: number
  coverageOtherStructures?: number
  coveragePersonalProperty?: number
  coverageLossOfUse?: number
  standardDeductible: number
  windDeductible: string
  agentName?: string
  mortgageeName?: string
}

export interface AIMaintenanceSuggestion {
  task: string
  reason: string
}

export interface AIMaterialAnalysis {
  name: string
  type: 'Roofing' | 'Flooring' | 'Countertop' | 'Siding' | 'Other'
}

export interface AIDocumentAnalysis {
  documentType: 'Warranty' | 'Receipt' | 'Policy' | 'Manual' | 'Other'
  warrantyData?: {
    provider: string
    expirationDate: string
    details: string
  }
}

export interface AISettlementAnalysis {
  summary: {
    totalOffer: number
    totalDocumentedLoss: number
    totalVariance: number
    overallAssessment: string
  }
  comparison: Array<{
    item: string
    offerAmount: number
    documentedAmount: number
    variance: number
  }>
  discrepancies: Array<{
    item: string
    issue: 'Omission' | 'Under-evaluation' | 'Incorrect Material' | 'Policy Misinterpretation'
    details: string
  }>
  recommendations: string[]
}

export interface AIObjectDetection {
  roomType: 'Living Room' | 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Dining Room' | 'Office' | 'Garage' | 'Basement' | 'Other'
  objects: Array<{
    name: string
    category: string
    boundingBox: {
      xMin: number
      yMin: number
      xMax: number
      yMax: number
    }
  }>
}

export interface AIDamageAssessment {
  damageType: 'Water' | 'Wind' | 'Fire' | 'Hail' | 'Lightning' | 'Vandalism' | 'Other'
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Total Loss'
  affectedArea: string
  affectedMaterials: string[]
  estimatedRepairCost?: number
  repairRecommendations: string[]
  safetyHazards?: string[]
}

// Utility types for AI responses
export type AIResponse<T> = {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  metadata?: Record<string, unknown>
}

export type AIStreamResponse<T> = {
  chunk: Partial<T>
  isComplete: boolean
  error?: string
}