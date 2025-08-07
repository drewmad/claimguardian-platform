/**
 * @fileMetadata
 * @purpose "Partner API types for white-label insurance carrier integration"
 * @owner partner-api-team
 * @dependencies ["@claimguardian/db", "zod"]
 * @exports ["PartnerApiKey", "PartnerWebhook", "PartnerUsage", "ClaimApiRequest", "DocumentApiRequest"]
 * @complexity high
 * @tags ["partner-api", "white-label", "insurance-carriers", "multi-tenant"]
 * @status stable
 */

// Partner API Authentication & Authorization
export interface PartnerApiKey {
  id: string
  partnerId: string
  keyName: string
  keyPrefix: string // First 8 chars of key for display (e.g., "pk_live_")
  hashedKey: string
  permissions: PartnerApiPermissions
  rateLimit: PartnerRateLimit
  status: 'active' | 'suspended' | 'revoked'
  environment: 'sandbox' | 'production'
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PartnerApiPermissions {
  claims: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  documents: {
    upload: boolean
    download: boolean
    process: boolean
    delete: boolean
  }
  properties: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  analytics: {
    read: boolean
    export: boolean
  }
  webhooks: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  users: {
    create: boolean
    read: boolean
    update: boolean
    suspend: boolean
  }
}

export interface PartnerRateLimit {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstLimit: number
}

// Partner Organization Management
export interface PartnerOrganization {
  id: string
  companyName: string
  companyCode: string // Unique identifier for white-labeling
  domain: string
  additionalDomains: string[]

  // Subscription & Billing
  subscriptionTier: 'starter' | 'professional' | 'enterprise' | 'custom'
  billingCycle: 'monthly' | 'quarterly' | 'annual'
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled'

  // Usage Limits
  limits: {
    maxUsers: number
    maxClaims: number
    maxStorageGB: number
    aiRequestsPerMonth: number
    webhookCallsPerMonth: number
    apiRequestsPerMonth: number
  }

  // Current Usage
  currentUsage: {
    users: number
    claims: number
    storageGB: number
    aiRequests: number
    webhookCalls: number
    apiRequests: number
  }

  // White-label Configuration
  branding: PartnerBranding
  configuration: PartnerConfiguration

  // Contact Information
  primaryContactEmail: string
  technicalContactEmail: string
  billingContactEmail: string
  supportContactEmail: string
  phone: string

  // Compliance & Security
  allowedStates: string[] // Geographic restrictions
  dataRegion: 'us-east' | 'us-west' | 'eu-central' | 'ap-southeast'
  complianceRequirements: ('hipaa' | 'sox' | 'gdpr' | 'ccpa')[]
  ssoEnabled: boolean
  mfaRequired: boolean
  ipWhitelist: string[]

  // Metadata
  createdAt: string
  updatedAt: string
  trialEndsAt: string | null
  nextBillingDate: string | null
}

export interface PartnerBranding {
  logoUrl: string
  faviconUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  customCSS: string
  emailTemplates: Record<string, string>
  customDomain: string
  hideClaimGuardianBranding: boolean
}

export interface PartnerConfiguration {
  claimWorkflows: {
    requirePhotos: boolean
    requireReceipts: boolean
    autoApproveLimit: number
    manualReviewThreshold: number
    enableAIAssessment: boolean
  }
  documentProcessing: {
    enableOCR: boolean
    enableAIExtraction: boolean
    autoClassification: boolean
    retentionPeriodDays: number
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    webhookEnabled: boolean
    realTimeUpdates: boolean
  }
  integrations: {
    xactimate: boolean
    corelogic: boolean
    verisk: boolean
    customIntegrations: Record<string, any>
  }
}

// Partner API Request/Response Types
export interface PartnerApiRequest {
  partnerId: string
  userId: string // Partner's internal user ID
  requestId: string
  timestamp: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  version: 'v1'
}

export interface PartnerApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  metadata: {
    requestId: string
    timestamp: string
    processingTime: number
    rateLimit: {
      remaining: number
      reset: string
    }
  }
}

// Claims API Types
export interface ClaimApiRequest extends PartnerApiRequest {
  claimData: {
    externalId: string // Partner's claim ID
    policyNumber: string
    propertyAddress: string
    incidentDate: string
    incidentType: 'hurricane' | 'wind' | 'hail' | 'water' | 'fire' | 'lightning' | 'other'
    description: string
    estimatedLoss: number
    deductible: number
    claimantInfo: {
      firstName: string
      lastName: string
      email: string
      phone: string
      address: string
    }
    adjusterInfo?: {
      name: string
      company: string
      phone: string
      email: string
    }
  }
}

export interface ClaimApiResponse {
  claimId: string
  externalId: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'settled'
  claimNumber: string
  estimatedProcessingTime: string
  nextSteps: string[]
  requiredDocuments: string[]
  webhookUrl?: string
}

// Document Processing API Types
export interface DocumentApiRequest extends PartnerApiRequest {
  claimId: string
  documentType: 'photo' | 'receipt' | 'estimate' | 'policy' | 'other'
  fileName: string
  fileSize: number
  mimeType: string
  metadata?: Record<string, unknown>
}

export interface DocumentApiResponse {
  documentId: string
  uploadUrl: string
  expiresAt: string
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  extractedData?: Record<string, unknown>
  ocrText?: string
  confidence?: number
}

// Property Intelligence API Types
export interface PropertyApiRequest extends PartnerApiRequest {
  address: string
  zipCode: string
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'commercial'
}

export interface PropertyApiResponse {
  propertyId: string
  basicInfo: {
    address: string
    yearBuilt: number
    squareFootage: number
    bedrooms: number
    bathrooms: number
    lotSize: number
    propertyType: string
  }
  riskAssessment: {
    overallScore: number // 1-100
    fireRisk: number
    floodRisk: number
    windRisk: number
    hailRisk: number
    crimeRisk: number
  }
  marketValue: {
    estimatedValue: number
    confidence: number
    comparables: Array<{
      address: string
      soldPrice: number
      soldDate: string
      squareFootage: number
      distance: number
    }>
  }
  insurabilityFactors: {
    roofAge: number
    roofMaterial: string
    hvacAge: number
    electricalAge: number
    plumbingAge: number
    foundationType: string
    construction: string
  }
}

// Webhook Management Types
export interface PartnerWebhook {
  id: string
  partnerId: string
  url: string
  events: PartnerWebhookEvent[]
  secret: string
  active: boolean
  retryPolicy: {
    maxAttempts: number
    backoffStrategy: 'linear' | 'exponential'
    timeoutMs: number
  }
  createdAt: string
  updatedAt: string
}

export type PartnerWebhookEvent =
  | 'claim.created'
  | 'claim.updated'
  | 'claim.approved'
  | 'claim.denied'
  | 'claim.settled'
  | 'document.processed'
  | 'property.assessed'
  | 'user.created'
  | 'user.updated'
  | 'billing.usage_warning'
  | 'billing.limit_exceeded';

export interface WebhookPayload<T = any> {
  id: string
  event: PartnerWebhookEvent
  data: T
  partnerId: string
  timestamp: string
  version: string
}

// Usage Tracking & Billing Types
export interface PartnerUsageRecord {
  id: string
  partnerId: string
  date: string // YYYY-MM-DD
  apiRequests: number
  claimsProcessed: number
  documentsProcessed: number
  aiRequestsUsed: number
  storageUsedGB: number
  webhookDeliveries: number
  costs: {
    base: number
    overages: {
      apiRequests: number
      claims: number
      documents: number
      aiRequests: number
      storage: number
      webhooks: number
    }
    total: number
  }
}

export interface PartnerBillingInvoice {
  id: string
  partnerId: string
  invoiceNumber: string
  billingPeriod: {
    start: string
    end: string
  }
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate: string
  paidDate: string | null
  createdAt: string
}

// Analytics & Reporting Types
export interface PartnerAnalytics {
  partnerId: string
  period: {
    start: string
    end: string
  }
  claims: {
    total: number
    byStatus: Record<string, number>
    byType: Record<string, number>
    averageProcessingTime: number
    totalValue: number
    settledValue: number
  }
  usage: {
    apiRequests: number
    averageResponseTime: number
    errorRate: number
    peakHour: string
  }
  users: {
    total: number
    active: number
    new: number
  }
  documents: {
    total: number
    processed: number
    failedProcessing: number
    averageProcessingTime: number
  }
}

// SDK Configuration Types
export interface PartnerSDKConfig {
  apiKey: string
  environment: 'sandbox' | 'production'
  baseUrl: string
  webhookSecret: string
  timeoutMs: number
  retryAttempts: number
  customHeaders?: Record<string, string>
}

// Error Codes for Partner API
export enum PartnerApiErrorCode {
  // Authentication
  INVALID_API_KEY = 'invalid_api_key',
  EXPIRED_API_KEY = 'expired_api_key',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  QUOTA_EXCEEDED = 'quota_exceeded',

  // Validation
  INVALID_REQUEST = 'invalid_request',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INVALID_FIELD_VALUE = 'invalid_field_value',

  // Resource Management
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_ALREADY_EXISTS = 'resource_already_exists',
  RESOURCE_LIMIT_EXCEEDED = 'resource_limit_exceeded',

  // Processing
  PROCESSING_FAILED = 'processing_failed',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',

  // Business Logic
  CLAIM_ALREADY_SUBMITTED = 'claim_already_submitted',
  INVALID_CLAIM_STATUS = 'invalid_claim_status',
  DOCUMENT_TOO_LARGE = 'document_too_large',
  UNSUPPORTED_FILE_TYPE = 'unsupported_file_type',

  // System
  INTERNAL_ERROR = 'internal_error',
  SERVICE_UNAVAILABLE = 'service_unavailable'
}
