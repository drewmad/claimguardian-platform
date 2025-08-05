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
// Insurance claim types for ClaimGuardian
import type { ClaimStatus } from './database.types'

export interface ClaimEvidence {
  id: string
  type: 'photo' | 'document' | 'video' | 'receipt' | 'estimate' | 'report'
  name: string
  description: string
  url: string
  uploadDate: string
  tags?: string[]
  metadata?: {
    fileSize?: number
    mimeType?: string
    capturedDate?: string
    location?: {
      lat: number
      lng: number
    }
  }
}

export interface ClaimStatusHistory {
  id: string
  date: string
  status: ClaimStatus
  notes?: string
  updatedBy?: string
  documents?: string[] // Document IDs
}

// ClaimStatus is now imported from database.types.ts to avoid conflicts
// Database enum values: 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'settled'

export interface ClaimContact {
  id: string
  role: 'Adjuster' | 'Contractor' | 'Attorney' | 'Public Adjuster' | 'Other'
  name: string
  company?: string
  phone?: string
  email?: string
  notes?: string
}

export interface ClaimPayment {
  id: string
  date: string
  amount: number
  type: 'Initial' | 'Supplemental' | 'Final' | 'Depreciation Recovery'
  checkNumber?: string
  description?: string
}

export interface ClaimLineItem {
  id: string
  category: string // e.g., "Living Room", "Roof", "Kitchen"
  item: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  ageYears?: number
  depreciationPercent?: number
  acv?: number // Actual Cash Value
  rcv?: number // Replacement Cost Value
  status: 'Pending' | 'Approved' | 'Denied' | 'Partially Approved'
  notes?: string
}

export interface Claim {
  id: string
  userId: string
  assetId: string
  policyId: string
  claimNumber?: string
  
  // Incident details
  dateOfLoss: string
  incidentType: 'Hurricane' | 'Wind' | 'Hail' | 'Water' | 'Fire' | 'Lightning' | 'Theft' | 'Vandalism' | 'Other'
  description: string
  causeOfLoss?: string
  
  // Status and amounts
  status: ClaimStatus
  filedDate?: string
  closedDate?: string
  estimatedLoss: number
  claimedAmount?: number
  deductible?: number
  settlementAmount?: number
  paidAmount?: number
  
  // Detailed breakdown
  lineItems?: ClaimLineItem[]
  
  // Evidence and documentation
  evidence: ClaimEvidence[]
  
  // People involved
  contacts?: ClaimContact[]
  adjusterName?: string
  adjusterPhone?: string
  adjusterEmail?: string
  adjusterNotes?: string
  
  // History and payments
  statusHistory: ClaimStatusHistory[]
  payments?: ClaimPayment[]
  
  // Additional fields
  isEmergency?: boolean
  temporaryRepairsAmount?: number
  additionalLivingExpenses?: number
  
  // Metadata
  createdAt: string
  updatedAt: string
}

export interface Incident {
  id: string
  userId: string
  date: string
  type: string
  description: string
  severity: 'Minor' | 'Moderate' | 'Major' | 'Catastrophic'
  affectedAssets: string[] // Asset IDs
  estimatedTotalLoss?: number
  weatherData?: {
    conditions?: string
    windSpeed?: number
    precipitation?: number
    temperature?: number
  }
  newsReferences?: string[]
  officialDeclaration?: string // e.g., FEMA disaster number
  claims?: string[] // Claim IDs
  createdAt: string
  updatedAt: string
}

export interface ClaimTemplate {
  id: string
  name: string
  incidentType: string
  description: string
  commonLineItems: Partial<ClaimLineItem>[]
  requiredEvidence: string[]
  tips: string[]
}

export interface SettlementOffer {
  id: string
  claimId: string
  offerDate: string
  offerAmount: number
  details: string
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Counter Offered'
  expirationDate?: string
  counterAmount?: number
  counterNotes?: string
}

export interface ClaimAppeal {
  id: string
  claimId: string
  appealDate: string
  reason: string
  supportingDocuments: string[]
  status: 'Submitted' | 'Under Review' | 'Hearing Scheduled' | 'Approved' | 'Denied'
  outcome?: string
  hearingDate?: string
}