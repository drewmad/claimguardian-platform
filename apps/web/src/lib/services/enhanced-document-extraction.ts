/**
 * @fileMetadata
 * @purpose "Enhanced AI service for comprehensive policy document extraction with multi-provider support"
 * @owner ai-team
 * @dependencies ["@/lib/logger", "@/lib/supabase/client", "openai", "@google/generative-ai"]
 * @exports ["EnhancedDocumentExtractor", "ExtractedPolicyDataEnhanced"]
 * @complexity high
 * @tags ["service", "ai", "document-extraction", "ocr", "multi-provider"]
 * @status stable
 */

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

// Comprehensive extraction schema for insurance policy documents
export interface ExtractedPolicyDataEnhanced {
  // ===== BASIC POLICY INFORMATION =====
  policyNumber?: string
  previousPolicyNumber?: string // For renewals
  masterPolicyNumber?: string // For commercial/condo master policies
  carrierName?: string
  carrierNAIC?: string // National Association of Insurance Commissioners code
  carrierPhone?: string
  carrierEmail?: string
  carrierAddress?: string
  
  // Policy Classification
  policyType?: 'HO1' | 'HO2' | 'HO3' | 'HO4' | 'HO5' | 'HO6' | 'HO8' | 'DP1' | 'DP2' | 'DP3' | 'COMMERCIAL' | 'FLOOD' | 'WIND' | 'UMBRELLA'
  policyForm?: string // Specific form number (e.g., "HO 00 03 05 11")
  policyVersion?: string
  
  // ===== INSURED INFORMATION =====
  primaryInsuredName?: string
  additionalInsuredNames?: string[]
  mortgageCompany?: string
  mortgageClause?: string
  additionalInterests?: Array<{
    type: 'mortgagee' | 'additional_insured' | 'loss_payee'
    name: string
    address?: string
    loanNumber?: string
  }>
  
  // ===== PROPERTY DETAILS =====
  propertyAddress?: {
    street1: string
    street2?: string
    city: string
    state: string
    zipCode: string
    county?: string
  }
  legalDescription?: string
  parcelId?: string
  propertyType?: 'single_family' | 'condo' | 'townhome' | 'mobile_home' | 'multi_family' | 'commercial'
  yearBuilt?: number
  squareFootage?: number
  numberOfStories?: number
  constructionType?: string
  roofType?: string
  roofAge?: number
  
  // ===== COVERAGE AMOUNTS =====
  dwellingCoverage?: number // Coverage A
  otherStructuresCoverage?: number // Coverage B
  personalPropertyCoverage?: number // Coverage C
  lossOfUseCoverage?: number // Coverage D
  personalLiabilityCoverage?: number // Coverage E
  medicalPaymentsCoverage?: number // Coverage F
  
  // Additional Coverages
  replacementCostCoverage?: boolean
  extendedReplacementCost?: number // Percentage over dwelling
  lawOrdinanceCoverage?: number
  debrisRemovalCoverage?: number
  identityTheftCoverage?: number
  waterBackupCoverage?: number
  serviceLineCoverage?: number
  
  // ===== DEDUCTIBLES =====
  allPerilsDeductible?: number
  windHailDeductible?: number | string // Can be percentage or dollar amount
  hurricaneDeductible?: number | string
  namedStormDeductible?: number | string
  floodDeductible?: number
  earthquakeDeductible?: number | string
  sinkholeCatastrophicGroundCoverCollapse?: number
  
  // ===== FLORIDA-SPECIFIC COVERAGES =====
  hurricaneCoverage?: boolean
  floodZone?: string
  windMitigationCredits?: Array<{
    type: string
    discount: number
  }>
  sinkholeCoverage?: boolean
  screenedEnclosureCoverage?: number
  poolCoverage?: boolean
  
  // ===== DATES =====
  effectiveDate?: string
  expirationDate?: string
  issueDate?: string
  cancellationDate?: string
  reinstateDate?: string
  lastPaymentDate?: string
  nextPaymentDue?: string
  
  // ===== PREMIUM INFORMATION =====
  annualPremium?: number
  monthlyPremium?: number
  totalPremium?: number
  basePremium?: number
  
  // Premium Breakdown
  premiumBreakdown?: {
    dwelling?: number
    personalProperty?: number
    liability?: number
    windHail?: number
    flood?: number
    taxes?: number
    fees?: number
    surcharges?: number
    discounts?: number
  }
  
  // ===== DISCOUNTS & CREDITS =====
  discounts?: Array<{
    type: string
    description: string
    amount: number
    percentage?: number
  }>
  
  // ===== ENDORSEMENTS & RIDERS =====
  endorsements?: Array<{
    code: string
    description: string
    premium?: number
    effectiveDate?: string
  }>
  
  // ===== EXCLUSIONS & LIMITATIONS =====
  exclusions?: string[]
  specialLimitations?: Array<{
    category: string
    limit: number
    description?: string
  }>
  
  // ===== AGENT INFORMATION =====
  agentName?: string
  agentPhone?: string
  agentEmail?: string
  agentLicenseNumber?: string
  agencyName?: string
  agencyAddress?: string
  
  // ===== CLAIMS HISTORY =====
  priorClaims?: Array<{
    date: string
    type: string
    amount: number
    status: string
  }>
  
  // ===== EXTRACTION METADATA =====
  confidence?: number
  extractedFields?: string[]
  missingCriticalFields?: string[]
  processingTime?: number
  extractionMethod?: 'ocr' | 'vision' | 'combined'
  modelUsed?: string
  pageCount?: number
  documentQuality?: 'high' | 'medium' | 'low'
  warnings?: string[]
  
  // ===== RAW EXTRACTED DATA =====
  rawText?: string // Full OCR text for reference
  extractedPages?: Array<{
    pageNumber: number
    content: string
    confidence: number
  }>
}

export interface EnhancedExtractionResult {
  success: boolean
  data?: ExtractedPolicyDataEnhanced
  error?: string
  confidence?: number
  processingTime?: number
  provider?: string
  validationErrors?: string[]
  suggestions?: string[]
}

export interface EnhancedExtractionOptions {
  apiProvider?: 'gemini' | 'openai' | 'claude' | 'auto' // 'auto' will try multiple providers
  useOCR?: boolean
  confidenceThreshold?: number
  extractRawText?: boolean
  validateAddress?: boolean
  enrichWithPublicData?: boolean // Look up carrier info, etc.
  language?: string
  maxRetries?: number
}

const DEFAULT_OPTIONS: EnhancedExtractionOptions = {
  apiProvider: 'auto',
  useOCR: true,
  confidenceThreshold: 0.7,
  extractRawText: true,
  validateAddress: true,
  enrichWithPublicData: true,
  language: 'en',
  maxRetries: 2
}

export class EnhancedDocumentExtractor {
  private supabase = createClient()
  
  /**
   * Extract comprehensive policy data from a document using multi-provider AI
   */
  async extractPolicyData(
    fileUrl: string, 
    fileName: string,
    options: EnhancedExtractionOptions = DEFAULT_OPTIONS
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now()
    
    try {
      logger.info('Starting enhanced policy document extraction', { 
        fileName, 
        options 
      })

      // Determine file type
      const fileExtension = fileName.toLowerCase().split('.').pop()
      const isImage = ['png', 'jpg', 'jpeg'].includes(fileExtension || '')
      const isPDF = fileExtension === 'pdf'

      if (!isImage && !isPDF) {
        return {
          success: false,
          error: 'Unsupported file type. Only PDF and image files are supported.',
          processingTime: Date.now() - startTime
        }
      }

      // Call Edge Function for secure AI processing with enhanced schema
      const { data, error } = await this.supabase.functions.invoke('enhanced-document-extraction', {
        body: {
          fileUrl,
          fileName,
          options,
          extractionSchema: this.getExtractionSchema()
        }
      })

      if (error) {
        throw error
      }

      const extractionResult = data as EnhancedExtractionResult

      // Validate and enrich extracted data
      if (extractionResult.success && extractionResult.data) {
        const validation = this.validateExtractedData(extractionResult.data)
        extractionResult.validationErrors = validation.errors
        
        if (options.enrichWithPublicData) {
          extractionResult.data = await this.enrichExtractedData(extractionResult.data)
        }
        
        // Calculate overall confidence based on field completeness
        extractionResult.confidence = this.calculateConfidence(extractionResult.data)
      }

      // Add processing time
      extractionResult.processingTime = Date.now() - startTime

      logger.info('Enhanced policy document extraction completed', {
        fileName,
        success: extractionResult.success,
        confidence: extractionResult.confidence,
        fieldsExtracted: extractionResult.data?.extractedFields?.length || 0,
        processingTime: extractionResult.processingTime
      })

      return extractionResult
    } catch (error) {
      logger.error('Unexpected error during enhanced document extraction', { 
        error, 
        fileName 
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Get structured extraction schema for AI providers
   */
  private getExtractionSchema() {
    return {
      policyInformation: {
        policyNumber: { type: 'string', required: true, patterns: ['Policy Number', 'Policy #', 'Contract Number'] },
        carrierName: { type: 'string', required: true, patterns: ['Insurance Company', 'Carrier', 'Insurer'] },
        policyType: { type: 'enum', values: ['HO1', 'HO2', 'HO3', 'HO4', 'HO5', 'HO6', 'HO8', 'DP1', 'DP2', 'DP3'], patterns: ['Policy Form', 'Coverage Type'] }
      },
      coverageAmounts: {
        dwellingCoverage: { type: 'number', patterns: ['Coverage A', 'Dwelling', 'Building Coverage'] },
        personalPropertyCoverage: { type: 'number', patterns: ['Coverage C', 'Personal Property', 'Contents'] },
        liabilityCoverage: { type: 'number', patterns: ['Coverage E', 'Personal Liability'] }
      },
      deductibles: {
        allPerilsDeductible: { type: 'number', patterns: ['All Other Perils', 'Deductible'] },
        hurricaneDeductible: { type: 'string', patterns: ['Hurricane Deductible', 'Named Storm'] },
        windHailDeductible: { type: 'string', patterns: ['Wind/Hail', 'Windstorm'] }
      },
      dates: {
        effectiveDate: { type: 'date', patterns: ['Effective Date', 'Policy Period From', 'Coverage Begins'] },
        expirationDate: { type: 'date', patterns: ['Expiration Date', 'Policy Period To', 'Coverage Ends'] }
      },
      premiums: {
        annualPremium: { type: 'number', patterns: ['Annual Premium', 'Total Premium', 'Policy Premium'] },
        monthlyPremium: { type: 'number', patterns: ['Monthly Premium', 'Installment Amount'] }
      }
    }
  }

  /**
   * Validate extracted data for completeness and accuracy
   */
  validateExtractedData(data: ExtractedPolicyDataEnhanced): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const criticalFields = ['policyNumber', 'carrierName', 'effectiveDate', 'expirationDate']
    
    // Check critical fields
    for (const field of criticalFields) {
      if (!data[field as keyof ExtractedPolicyDataEnhanced]) {
        errors.push(`Missing critical field: ${field}`)
      }
    }

    // Policy number validation
    if (data.policyNumber && data.policyNumber.length < 3) {
      errors.push('Policy number seems invalid (too short)')
    }

    // Date validation
    if (data.effectiveDate && data.expirationDate) {
      const effective = new Date(data.effectiveDate)
      const expiration = new Date(data.expirationDate)
      
      if (expiration <= effective) {
        errors.push('Expiration date must be after effective date')
      }
      
      // Check for reasonable policy period (typically 6 months or 1 year)
      const daysDiff = (expiration.getTime() - effective.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff < 150 || daysDiff > 400) {
        errors.push('Policy period seems unusual (expected 6-12 months)')
      }
    }

    // Coverage validation
    if (data.dwellingCoverage && data.dwellingCoverage < 50000) {
      errors.push('Dwelling coverage seems unusually low')
    }

    // Premium validation
    if (data.annualPremium && data.annualPremium < 500) {
      errors.push('Annual premium seems unusually low for Florida property insurance')
    }

    // Florida-specific validation
    if (data.propertyAddress?.state && data.propertyAddress.state !== 'FL' && data.propertyAddress.state !== 'Florida') {
      errors.push('Property appears to be outside Florida')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Calculate confidence score based on extracted fields
   */
  private calculateConfidence(data: ExtractedPolicyDataEnhanced): number {
    const criticalFields = [
      'policyNumber', 'carrierName', 'effectiveDate', 'expirationDate',
      'dwellingCoverage', 'annualPremium', 'propertyAddress'
    ]
    
    const importantFields = [
      'primaryInsuredName', 'policyType', 'allPerilsDeductible',
      'hurricaneDeductible', 'personalPropertyCoverage', 'liabilityCoverage'
    ]
    
    let score = 0
    let maxScore = 0
    
    // Critical fields worth 2 points each
    for (const field of criticalFields) {
      maxScore += 2
      if (data[field as keyof ExtractedPolicyDataEnhanced]) {
        score += 2
      }
    }
    
    // Important fields worth 1 point each
    for (const field of importantFields) {
      maxScore += 1
      if (data[field as keyof ExtractedPolicyDataEnhanced]) {
        score += 1
      }
    }
    
    return Math.min(score / maxScore, 1)
  }

  /**
   * Enrich extracted data with public information
   */
  private async enrichExtractedData(data: ExtractedPolicyDataEnhanced): Promise<ExtractedPolicyDataEnhanced> {
    try {
      // Look up carrier NAIC code if we have the carrier name
      if (data.carrierName && !data.carrierNAIC) {
        const { data: carrier } = await this.supabase
          .from('FL_Companies')
          .select('naic_code, phone, email, address')
          .ilike('company_name', `%${data.carrierName}%`)
          .limit(1)
          .single()
        
        if (carrier) {
          data.carrierNAIC = carrier.naic_code
          data.carrierPhone = data.carrierPhone || carrier.phone
          data.carrierEmail = data.carrierEmail || carrier.email
          data.carrierAddress = data.carrierAddress || carrier.address
        }
      }

      // Look up property parcel information if we have an address
      if (data.propertyAddress) {
        const addressString = `${data.propertyAddress.street1} ${data.propertyAddress.city}`
        
        const { data: parcel } = await this.supabase
          .from('florida_parcels')
          .select('PARCEL_ID, CO_NO, ACT_YR_BLT, TOT_LVG_AREA, LAND_VAL, BLDG_VAL')
          .textSearch('SITUS_ADDR', addressString)
          .limit(1)
          .single()
        
        if (parcel) {
          data.parcelId = data.parcelId || parcel.PARCEL_ID
          data.yearBuilt = data.yearBuilt || parcel.ACT_YR_BLT
          data.squareFootage = data.squareFootage || parcel.TOT_LVG_AREA
        }
      }

      return data
    } catch (error) {
      logger.warn('Error enriching extracted data', { error })
      return data
    }
  }

  /**
   * Store extracted data in database with versioning
   */
  async storeExtractedData(
    documentId: string,
    propertyId: string,
    extractedData: ExtractedPolicyDataEnhanced,
    userId: string
  ) {
    try {
      // Store main extraction record
      const { data: extraction, error: extractionError } = await this.supabase
        .from('document_extractions_enhanced')
        .insert({
          document_id: documentId,
          property_id: propertyId,
          extracted_data: extractedData,
          confidence_score: extractedData.confidence,
          extracted_fields: extractedData.extractedFields,
          missing_fields: extractedData.missingCriticalFields,
          processing_time: extractedData.processingTime,
          extraction_method: extractedData.extractionMethod,
          model_used: extractedData.modelUsed,
          processed_by: userId,
          status: 'completed'
        })
        .select()
        .single()

      if (extractionError) throw extractionError

      // Auto-create or update policy record if confidence is high enough
      if (extractedData.confidence && extractedData.confidence >= 0.8) {
        await this.autoCreatePolicy(propertyId, extractedData, extraction.id, userId)
      }

      return { success: true, extractionId: extraction.id }
    } catch (error) {
      logger.error('Failed to store extracted data', { error })
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Automatically create or update policy from high-confidence extraction
   */
  private async autoCreatePolicy(
    propertyId: string,
    data: ExtractedPolicyDataEnhanced,
    extractionId: string,
    userId: string
  ) {
    try {
      const policyData = {
        property_id: propertyId,
        policy_number: data.policyNumber,
        carrier_name: data.carrierName,
        carrier_naic: data.carrierNAIC,
        policy_type: data.policyType,
        effective_date: data.effectiveDate,
        expiration_date: data.expirationDate,
        
        // Coverage amounts
        coverage_limits: {
          dwelling: data.dwellingCoverage,
          other_structures: data.otherStructuresCoverage,
          personal_property: data.personalPropertyCoverage,
          loss_of_use: data.lossOfUseCoverage,
          liability: data.personalLiabilityCoverage,
          medical_payments: data.medicalPaymentsCoverage
        },
        
        // Deductibles
        deductible_amount: data.allPerilsDeductible,
        wind_deductible: data.windHailDeductible,
        hurricane_deductible: data.hurricaneDeductible,
        
        // Premium
        premium_amount: data.annualPremium,
        premium_breakdown: data.premiumBreakdown,
        
        // Additional data
        endorsements: data.endorsements,
        discounts: data.discounts,
        
        // Metadata
        ai_extracted: true,
        extraction_id: extractionId,
        extraction_confidence: data.confidence,
        created_by: userId
      }

      const { data: policy, error } = await this.supabase
        .from('policies')
        .upsert(policyData, {
          onConflict: 'property_id,policy_number',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) throw error

      logger.info('Auto-created policy from extraction', { 
        policyId: policy.id, 
        extractionId,
        confidence: data.confidence 
      })

      return policy
    } catch (error) {
      logger.error('Failed to auto-create policy', { error })
      throw error
    }
  }
}

// Export singleton instance
export const enhancedDocumentExtractor = new EnhancedDocumentExtractor()