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
// Insurance policy and settlement types for ClaimGuardian

// Settlement Analysis Types
export interface ComparisonPoint {
  item: string // e.g., "Living Room Drywall Repair"
  offerAmount: number
  documentedAmount: number
  variance: number
}

export interface Discrepancy {
  item: string
  issue: 'Omission' | 'Under-evaluation' | 'Incorrect Material' | 'Policy Misinterpretation'
  details: string // e.g., "Offer omits coverage for paint and finishing."
}

export interface SettlementAnalysisReport {
  summary: {
    totalOffer: number
    totalDocumentedLoss: number
    totalVariance: number
    overallAssessment: string
  }
  comparison: ComparisonPoint[]
  discrepancies: Discrepancy[]
  recommendations: string[]
}

// Insurance Document Types
export type PolicyDocumentCategory =
  | 'Policy Lifecycle'
  | 'Claim-Related'
  | 'Regulatory, Legal, and Financial'
  | 'Billing & Payment'
  | 'Communications & Other'

export type PolicyDocumentSubCategory =
  | 'Quoting & Pre-Bind'
  | 'Binding & Issuance'
  | 'Policy Updates & Changes'
  | 'Claim Initiation'
  | 'Claim Processing'
  | 'Claim Resolution'
  | 'State-Mandated Notices'
  | 'Mortgage & Lienholder'
  | 'Legal & Public Adjuster'
  | 'Billing & Invoices'
  | 'Payments & Refunds'
  | 'General Communications'
  | 'Supplemental Coverage'

export interface PolicyDocument {
  id: string
  name: string
  description?: string
  category: PolicyDocumentCategory
  subCategory: PolicyDocumentSubCategory
  documentType: string
  source: 'Carrier' | 'Agent' | 'Third-Party' | 'Insured'
  date: string
  url: string
  file?: File
}

// Coverage Types
export interface Coverage {
  type: string
  limit: number
  deductible?: number
  description?: string
}

export interface InsurancePolicy {
  id: string
  userId: string
  assetId: string
  carrier: string
  carrierLogo?: string
  policyNumber: string
  type: 'HO-3' | 'HO-6' | 'DP-3' | 'Flood' | 'Windstorm' | 'Umbrella' | 'Other'
  effectiveDate: string
  expirationDate: string
  premium: number
  paymentFrequency: 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Monthly'

  // Standard Coverages (Coverage A, B, C, D)
  coverageDwelling: number // Coverage A
  coverageOtherStructures?: number // Coverage B
  coveragePersonalProperty?: number // Coverage C
  coverageLossOfUse?: number // Coverage D
  lossAssessmentCoverage?: number // For HO-6

  // Liability Coverages
  personalLiabilityCoverage?: number
  medicalPaymentsCoverage?: number

  // Deductibles
  standardDeductible: number
  windDeductible?: string | number // Can be percentage or fixed amount
  floodDeductible?: number

  // Additional Coverages
  additionalCoverages?: Coverage[]
  riders?: PolicyRider[]
  excludedPerils?: string[]

  // Agent/Broker Information
  agentName?: string
  agentEmail?: string
  agentPhone?: string
  agencyName?: string

  // Mortgagee Information
  mortgageeName?: string
  mortgageeLoanNumber?: string
  mortgageeAddress?: string

  // Payment Information
  paymentMethod?: 'Escrow' | 'Direct Bill' | 'Auto-Pay' | 'Credit Card'
  escrowAccount?: string
  autoPayAccount?: string

  // Documents
  documents?: PolicyDocument[]

  // Metadata
  status: 'Active' | 'Expired' | 'Cancelled' | 'Non-Renewed'
  cancellationDate?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export interface PolicyRider {
  id: string
  name: string
  type: 'Scheduled Personal Property' | 'Identity Theft' | 'Water Backup' | 'Service Line' | 'Equipment Breakdown' | 'Other'
  premium: number
  coverageLimit?: number
  deductible?: number
  items?: ScheduledItem[]
}

export interface ScheduledItem {
  id: string
  description: string
  value: number
  category: string
  appraisalDate?: string
  appraisalDocument?: string
}

// Policy Comparison
export interface PolicyComparison {
  policies: InsurancePolicy[]
  differences: {
    field: string
    values: (string | number)[]
  }[]
  recommendations?: string[]
}

// Renewal Information
export interface PolicyRenewal {
  id: string
  policyId: string
  renewalDate: string
  proposedPremium: number
  premiumChange: number
  premiumChangePercent: number
  coverageChanges?: {
    coverage: string
    oldValue: number
    newValue: number
  }[]
  status: 'Pending' | 'Accepted' | 'Declined' | 'Shopping'
  declineReason?: string
}

// Insurance Carrier Information
export interface InsuranceCarrier {
  id: string
  name: string
  logo?: string
  amBestRating?: string
  naic?: string
  website?: string
  claimsPhone?: string
  claimsEmail?: string
  claimsPortal?: string
  floridaMarketShare?: number
  averageTimeToSettle?: number // days
  complaintRatio?: number
}

// Policy Shopping/Quote
export interface InsuranceQuote {
  id: string
  userId: string
  assetId: string
  carrier: string
  quoteNumber?: string
  premium: number
  coverages: Partial<InsurancePolicy>
  validUntil: string
  status: 'Active' | 'Expired' | 'Converted' | 'Declined'
  notes?: string
  createdAt: string
}
