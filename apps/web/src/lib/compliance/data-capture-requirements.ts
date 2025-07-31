/**
 * @fileMetadata
 * @purpose Comprehensive data capture requirements for compliance and user experience
 * @owner compliance-team
 * @status active
 */

export interface ComplianceDataRequirements {
  // === REQUIRED FOR LEGAL COMPLIANCE ===
  required: {
    // Personal Identification
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: Date // For age verification (must be 18+)
    
    // Legal Consents (GDPR, CCPA, Florida specific)
    termsAccepted: boolean
    privacyAccepted: boolean
    gdprConsent: boolean
    dataProcessingConsent: boolean
    ageVerification: boolean // Confirm 18+ years old
    
    // Location (for jurisdiction)
    country: string
    stateProvince: string // Critical for Florida-specific regulations
    
    // Security
    deviceFingerprint: string
    ipAddress: string
    sessionId: string
  }
  
  // === HIGHLY RECOMMENDED FOR SERVICE ===
  recommended: {
    // Enhanced Personal Info
    middleName?: string
    preferredName?: string // How they want to be addressed
    secondaryEmail?: string // Backup contact
    secondaryPhone?: string // Emergency contact
    
    // Physical Address (important for claims)
    addressLine1: string
    addressLine2?: string
    city: string
    postalCode: string
    
    // Property Owner Status
    floridaResident: boolean
    propertyOwner: boolean
    numberOfProperties?: number
    
    // Communication Preferences
    languagePreference: string // Default: 'en'
    timezone: string // For scheduling
    communicationPreferences: {
      email: boolean
      sms: boolean
      push: boolean
      phone: boolean
    }
    
    // Emergency Contact
    emergencyContacts: Array<{
      name: string
      relationship: string
      phone: string
      email?: string
    }>
    
    // Marketing & Analytics
    referralSource?: string // How they found us
    referralCode?: string // If referred by another user
    marketingConsent: boolean
    
    // Browser/Device Info
    userAgent: string
    browserLanguage: string
    screenResolution: string
    timeZoneOffset: number
    doNotTrack: boolean
  }
  
  // === FOR ENHANCED SECURITY & FRAUD PREVENTION ===
  security: {
    // Multi-factor Authentication
    mfaEnabled: boolean
    mfaMethod?: 'sms' | 'email' | 'authenticator'
    
    // Identity Verification (KYC)
    idVerificationStatus: 'not_started' | 'pending' | 'verified' | 'failed'
    idDocumentType?: 'drivers_license' | 'passport' | 'state_id'
    idDocumentUploaded: boolean
    
    // Risk Assessment
    riskScore: number // 0-100
    riskFactors: string[]
    isVpn: boolean
    isTor: boolean
    isProxy: boolean
    
    // Session Security
    trustedDevices: string[] // Device fingerprints
    lastPasswordChange: Date
    failedLoginAttempts: number
    accountLockStatus: boolean
  }
  
  // === FOR BETTER USER EXPERIENCE ===
  experience: {
    // Profile Completeness
    profileCompleteness: number // Percentage
    onboardingStep: string
    onboardingCompleted: boolean
    
    // User Preferences
    notificationSettings: {
      claimUpdates: boolean
      policyChanges: boolean
      weatherAlerts: boolean
      maintenanceReminders: boolean
      communityUpdates: boolean
    }
    
    // Feature Flags
    betaFeatures: boolean
    aiAssistanceEnabled: boolean
    
    // Usage Patterns
    primaryUseCase: 'homeowner' | 'contractor' | 'publicAdjuster' | 'attorney'
    claimHistory: 'none' | 'previous' | 'active'
  }
  
  // === TRACKING & ANALYTICS ===
  analytics: {
    // Attribution
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmTerm?: string
    utmContent?: string
    
    // First Touch
    landingPage: string
    originalReferrer: string
    signupDuration: number // Time from first visit to signup
    
    // Engagement
    pageViews: number
    documentsRead: string[] // Which legal docs they actually read
    videoWatched: boolean // If we have explainer videos
    
    // Device & Browser
    deviceType: 'mobile' | 'tablet' | 'desktop'
    browser: string
    browserVersion: string
    os: string
    osVersion: string
    
    // Geographic
    city?: string
    region?: string
    latitude?: number
    longitude?: number
    isp?: string
  }
}

/**
 * Data capture implementation checklist
 */
export const dataCapturePriority = {
  // Phase 1: Critical for Launch (Already implemented or in progress)
  phase1: [
    'firstName',
    'lastName', 
    'email',
    'phone',
    'termsAccepted',
    'privacyAccepted',
    'gdprConsent',
    'dataProcessingConsent',
    'deviceFingerprint',
    'ipAddress'
  ],
  
  // Phase 2: Important for Compliance (Should implement soon)
  phase2: [
    'dateOfBirth', // Age verification
    'ageVerification', // Explicit 18+ confirmation
    'country',
    'stateProvince', // Florida jurisdiction
    'floridaResident', // Florida-specific features
    'propertyOwner', // Service eligibility
    'addressLine1',
    'city',
    'postalCode'
  ],
  
  // Phase 3: Enhanced Security
  phase3: [
    'mfaEnabled',
    'idVerificationStatus',
    'riskScore',
    'trustedDevices',
    'emergencyContacts'
  ],
  
  // Phase 4: Better UX
  phase4: [
    'preferredName',
    'languagePreference',
    'timezone',
    'communicationPreferences',
    'notificationSettings',
    'referralSource'
  ]
}

/**
 * Validation rules for data capture
 */
export const validationRules = {
  age: {
    minimum: 18,
    message: 'You must be 18 or older to use ClaimGuardian'
  },
  
  phone: {
    pattern: /^\+?1?\d{10,14}$/,
    message: 'Please enter a valid phone number'
  },
  
  postalCode: {
    floridaPattern: /^(32|33|34)\d{3}$/,
    message: 'Please enter a valid Florida ZIP code'
  },
  
  password: {
    minLength: 12, // Increased from 8 for better security
    requireUpperCase: true,
    requireLowerCase: true,
    requireNumber: true,
    requireSpecial: true,
    message: 'Password must be at least 12 characters with mixed case, numbers, and symbols'
  }
}