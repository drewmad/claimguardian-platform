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
  private geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  private openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  /**
   * Extract policy data from a document file
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

      // Choose extraction method based on file type and options
      let extractionResult: ExtractionResult

      if (options.apiProvider === 'gemini' && this.geminiApiKey) {
        extractionResult = await this.extractWithGemini(fileUrl, isImage, isPDF)
      } else if (options.apiProvider === 'openai' && this.openaiApiKey) {
        extractionResult = await this.extractWithOpenAI(fileUrl, isImage, isPDF)
      } else {
        // Fallback to mock extraction for demo purposes
        extractionResult = await this.mockExtraction(fileName)
      }

      // Add processing time
      extractionResult.processingTime = Date.now() - startTime

      // Check confidence threshold
      if (extractionResult.confidence && extractionResult.confidence < options.confidenceThreshold!) {
        logger.warn('Extraction confidence below threshold', {
          confidence: extractionResult.confidence,
          threshold: options.confidenceThreshold,
          fileName
        })
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
   * Extract using Google Gemini Vision API
   */
  private async extractWithGemini(
    fileUrl: string, 
    isImage: boolean, 
    isPDF: boolean
  ): Promise<ExtractionResult> {
    try {
      // For demo purposes, this is a simplified implementation
      // In production, you would:
      // 1. Download the file from the URL
      // 2. Convert PDF to images if needed
      // 3. Send to Gemini Vision API with proper prompts
      // 4. Parse the response and extract structured data

      const prompt = this.buildExtractionPrompt()
      
      // Mock Gemini API call for now
      logger.info('Would call Gemini API for document extraction', { 
        fileUrl: fileUrl.substring(0, 50) + '...', 
        prompt: prompt.substring(0, 100) + '...' 
      })

      // Return mock data for demonstration
      return await this.mockExtraction('gemini-processed')
    } catch (error) {
      logger.error('Gemini extraction failed', { error })
      return {
        success: false,
        error: 'Gemini API extraction failed'
      }
    }
  }

  /**
   * Extract using OpenAI GPT-4 Vision API
   */
  private async extractWithOpenAI(
    fileUrl: string, 
    isImage: boolean, 
    isPDF: boolean
  ): Promise<ExtractionResult> {
    try {
      // For demo purposes, this is a simplified implementation
      // In production, you would:
      // 1. Download the file from the URL
      // 2. Convert PDF to images if needed
      // 3. Send to OpenAI Vision API with proper prompts
      // 4. Parse the response and extract structured data

      const prompt = this.buildExtractionPrompt()
      
      // Mock OpenAI API call for now
      logger.info('Would call OpenAI API for document extraction', { 
        fileUrl: fileUrl.substring(0, 50) + '...', 
        prompt: prompt.substring(0, 100) + '...' 
      })

      // Return mock data for demonstration
      return await this.mockExtraction('openai-processed')
    } catch (error) {
      logger.error('OpenAI extraction failed', { error })
      return {
        success: false,
        error: 'OpenAI API extraction failed'
      }
    }
  }

  /**
   * Build extraction prompt for AI models
   */
  private buildExtractionPrompt(): string {
    return `
You are an AI assistant specialized in extracting structured data from insurance policy documents. 

Please analyze this insurance policy document and extract the following information in JSON format:

{
  "policyNumber": "string - The policy number",
  "carrierName": "string - Insurance company name",
  "policyType": "string - Type of policy (HO3, HO5, etc.)",
  "coverageAmount": "number - Total coverage amount in dollars",
  "deductible": "number - Standard deductible amount",
  "windDeductible": "string|number - Wind/hurricane deductible (percentage or dollar amount)",
  "floodDeductible": "number - Flood deductible if applicable",
  "effectiveDate": "string - Policy effective date (YYYY-MM-DD)",
  "expirationDate": "string - Policy expiration date (YYYY-MM-DD)",
  "propertyAddress": "string - Insured property address",
  "namedInsured": "string - Primary insured person/entity",
  "premiumAmount": "number - Annual premium amount",
  "additionalCoverages": ["array of strings - Additional coverage types"],
  "confidence": "number - Your confidence in the extraction (0-1)"
}

Rules:
- Only include fields you can clearly identify in the document
- For dates, use YYYY-MM-DD format
- For monetary amounts, use numbers without currency symbols
- If uncertain about a field, omit it rather than guessing
- Provide a confidence score between 0 and 1
    `.trim()
  }

  /**
   * Mock extraction for demonstration purposes
   */
  private async mockExtraction(fileName: string): Promise<ExtractionResult> {
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