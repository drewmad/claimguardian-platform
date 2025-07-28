/**
 * @fileMetadata
 * @purpose AI service for extracting data from policy documents
 * @owner ai-team
 * @dependencies ["@/lib/logger"]
 * @exports ["aiDocumentExtractionService"]
 * @complexity high
 * @tags ["service", "ai", "document-extraction", "ocr"]
 * @status active
 */

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export interface ExtractedPolicyData {
  // Basic Policy Information
  policyNumber?: string
  carrierName?: string
  policyType?: string
  
  // Coverage Details
  coverageAmount?: number
  deductible?: number
  windDeductible?: number | string // Could be percentage or dollar amount
  floodDeductible?: number
  
  // Dates
  effectiveDate?: string
  expirationDate?: string
  issueDate?: string
  
  // Property Information
  propertyAddress?: string
  namedInsured?: string
  
  // Additional Details
  premiumAmount?: number
  additionalCoverages?: string[]
  
  // Extraction Metadata
  confidence?: number
  extractedFields?: string[]
  processingTime?: number
}

export interface ExtractionResult {
  success: boolean
  data?: ExtractedPolicyData
  error?: string
  confidence?: number
  processingTime?: number
}

export interface DocumentExtractionOptions {
  apiProvider?: 'gemini' | 'openai' | 'claude'
  useOCR?: boolean
  confidenceThreshold?: number
}

const DEFAULT_OPTIONS: DocumentExtractionOptions = {
  apiProvider: 'gemini',
  useOCR: true,
  confidenceThreshold: 0.7
}

class AIDocumentExtractionService {
  private supabase = createClient()
  
  /**
   * Extract policy data from a document file using server-side Edge Function
   */
  async extractPolicyData(
    fileUrl: string, 
    fileName: string,
    options: DocumentExtractionOptions = DEFAULT_OPTIONS
  ): Promise<ExtractionResult> {
    const startTime = Date.now()
    
    try {
      logger.info('Starting policy document extraction', { 
        fileName, 
        fileUrl: fileUrl.substring(0, 50) + '...', 
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

      // Call Edge Function for secure AI processing
      const { data, error } = await this.supabase.functions.invoke('ai-document-extraction', {
        body: {
          fileUrl,
          fileName,
          apiProvider: options.apiProvider,
          useOCR: options.useOCR,
          confidenceThreshold: options.confidenceThreshold
        }
      })

      if (error) {
        throw error
      }

      const extractionResult = data as ExtractionResult

      // Add processing time if not already included
      if (!extractionResult.processingTime) {
        extractionResult.processingTime = Date.now() - startTime
      }

      logger.info('Policy document extraction completed', {
        fileName,
        success: extractionResult.success,
        confidence: extractionResult.confidence,
        processingTime: extractionResult.processingTime
      })

      return extractionResult
    } catch (error) {
      logger.error('Unexpected error during document extraction', { 
        error, 
        fileName, 
        fileUrl: fileUrl.substring(0, 50) + '...' 
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error',
        processingTime: Date.now() - startTime
      }
    }
  }


  /**
   * Mock extraction for demonstration purposes
   */
  private async mockExtraction(_fileName: string): Promise<ExtractionResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockData: ExtractedPolicyData = {
      policyNumber: `HO-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      carrierName: ['Heritage Property & Casualty', 'Citizens Property Insurance', 'Universal Property', 'TypTap Insurance'][Math.floor(Math.random() * 4)],
      policyType: ['HO3', 'HO5', 'DP3'][Math.floor(Math.random() * 3)],
      coverageAmount: Math.floor(Math.random() * 500000) + 300000,
      deductible: [1000, 2500, 5000, 7500][Math.floor(Math.random() * 4)],
      windDeductible: ['2%', '5%', '10%'][Math.floor(Math.random() * 3)],
      effectiveDate: '2024-01-01',
      expirationDate: '2025-01-01',
      propertyAddress: '123 Demo Street, Port Charlotte, FL 33948',
      namedInsured: 'John & Jane Demo',
      premiumAmount: Math.floor(Math.random() * 3000) + 2000,
      additionalCoverages: [
        'Personal Property Coverage',
        'Loss of Use Coverage',
        'Personal Liability Protection'
      ],
      confidence: 0.85 + Math.random() * 0.1,
      extractedFields: [
        'policyNumber', 'carrierName', 'policyType', 'coverageAmount', 
        'deductible', 'windDeductible', 'effectiveDate', 'expirationDate'
      ],
      processingTime: 1500
    }

    return {
      success: true,
      data: mockData,
      confidence: mockData.confidence
    }
  }

  /**
   * Validate extracted data
   */
  validateExtractedData(data: ExtractedPolicyData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Policy number validation
    if (data.policyNumber && data.policyNumber.length < 3) {
      errors.push('Policy number seems too short')
    }

    // Date validation
    if (data.effectiveDate && data.expirationDate) {
      const effective = new Date(data.effectiveDate)
      const expiration = new Date(data.expirationDate)
      
      if (expiration <= effective) {
        errors.push('Expiration date must be after effective date')
      }
    }

    // Coverage amount validation
    if (data.coverageAmount && (data.coverageAmount < 10000 || data.coverageAmount > 10000000)) {
      errors.push('Coverage amount seems unrealistic')
    }

    // Deductible validation
    if (data.deductible && data.coverageAmount && data.deductible > data.coverageAmount * 0.1) {
      errors.push('Deductible seems too high relative to coverage amount')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export const aiDocumentExtractionService = new AIDocumentExtractionService()