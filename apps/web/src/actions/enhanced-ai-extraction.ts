/**
 * @fileMetadata
 * @purpose "Enhanced server actions for AI document extraction with multi-provider support"
 * @owner backend-team
 * @dependencies ["@/lib/supabase/server", "@/lib/services/enhanced-document-extraction"]
 * @exports ["processEnhancedExtraction", "getEnhancedExtractionResults", "approveExtraction", "getExtractionQueue"]
 * @complexity high
 * @tags ["server-action", "ai", "document-processing", "multi-provider"]
 * @status stable
 */

'use server'

import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { 
  enhancedDocumentExtractor, 
  ExtractedPolicyDataEnhanced,
  EnhancedExtractionResult 
} from '@/lib/services/enhanced-document-extraction'
import { createClient } from '@/lib/supabase/server'

export interface ProcessEnhancedExtractionParams {
  documentId: string
  propertyId: string
  options?: {
    apiProvider?: 'gemini' | 'openai' | 'claude' | 'auto'
    useOCR?: boolean
    confidenceThreshold?: number
    validateAddress?: boolean
    enrichWithPublicData?: boolean
  }
}

export interface EnhancedExtractionRecord {
  id: string
  document_id: string
  property_id: string
  extracted_data: ExtractedPolicyDataEnhanced
  confidence_score: number
  extracted_fields: string[]
  missing_fields: string[]
  validation_errors: string[]
  warnings: string[]
  suggestions: string[]
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'review_required'
  processing_time_ms: number
  extraction_method: 'ocr' | 'vision' | 'combined'
  model_used: string
  provider_used: string
  applied_to_property: boolean
  applied_at?: string
  policy_id?: string
  created_at: string
  updated_at: string
}

/**
 * Process enhanced AI extraction for a policy document with multi-provider support
 */
export async function processEnhancedExtraction(params: ProcessEnhancedExtractionParams) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      logger.error('User not authenticated for enhanced document extraction', { error: userError })
      return { data: null, error: 'User not authenticated' }
    }

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('policy_documents')
      .select('*')
      .eq('id', params.documentId)
      .eq('uploaded_by', user.id)
      .single()

    if (docError || !document) {
      logger.error('Document not found or access denied', { 
        documentId: params.documentId, 
        userId: user.id,
        error: docError 
      })
      return { data: null, error: 'Document not found or access denied' }
    }

    // Check if extraction already exists and is successful
    const { data: existingExtraction } = await supabase
      .from('document_extractions_enhanced')
      .select('*')
      .eq('document_id', params.documentId)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingExtraction && existingExtraction.confidence_score >= (params.options?.confidenceThreshold || 0.7)) {
      logger.info('Using existing high-confidence extraction', {
        extractionId: existingExtraction.id,
        confidence: existingExtraction.confidence_score
      })
      return { data: existingExtraction, error: null }
    }

    // Create extraction record with processing status
    const extractionRecord = {
      document_id: params.documentId,
      property_id: params.propertyId,
      processing_status: 'processing' as const,
      extracted_data: {},
      confidence_score: 0,
      extracted_fields: [],
      missing_fields: [],
      validation_errors: [],
      warnings: [],
      suggestions: [],
      processed_by: user.id
    }

    const { data: extraction, error: extractionError } = await supabase
      .from('document_extractions_enhanced')
      .insert(extractionRecord)
      .select()
      .single()

    if (extractionError) {
      logger.error('Failed to create enhanced extraction record', { error: extractionError })
      return { data: null, error: extractionError.message }
    }

    // Get signed URL for document
    const { data: urlData, error: urlError } = await supabase.storage
      .from('policy-documents')
      .createSignedUrl(document.file_path, 3600) // 1 hour expiry

    if (urlError) {
      logger.error('Failed to create signed URL for document', { 
        error: urlError,
        filePath: document.file_path 
      })
      
      // Update extraction status to failed
      await supabase
        .from('document_extractions_enhanced')
        .update({ 
          processing_status: 'failed',
          error_message: 'Failed to access document for processing'
        })
        .eq('id', extraction.id)
      
      return { data: null, error: 'Failed to access document for processing' }
    }

    logger.info('Starting enhanced AI extraction process', {
      documentId: params.documentId,
      fileName: document.file_name,
      fileType: document.file_type,
      provider: params.options?.apiProvider || 'auto'
    })

    // Process document with enhanced AI extraction
    const extractionResult = await enhancedDocumentExtractor.extractPolicyData(
      urlData.signedUrl,
      document.file_name,
      {
        apiProvider: params.options?.apiProvider || 'auto',
        useOCR: params.options?.useOCR !== false,
        confidenceThreshold: params.options?.confidenceThreshold || 0.7,
        validateAddress: params.options?.validateAddress !== false,
        enrichWithPublicData: params.options?.enrichWithPublicData !== false,
        maxRetries: 2
      }
    )

    // Determine processing status based on confidence and validation
    let processingStatus: 'completed' | 'failed' | 'review_required' = 'completed'
    
    if (!extractionResult.success) {
      processingStatus = 'failed'
    } else if (extractionResult.confidence && extractionResult.confidence < 0.7) {
      processingStatus = 'review_required'
    } else if (extractionResult.validationErrors && extractionResult.validationErrors.length > 0) {
      processingStatus = 'review_required'
    }

    // Generate suggestions based on missing or low-confidence fields
    const suggestions = generateExtractionSuggestions(extractionResult)

    // Update extraction record with results
    const updateData = {
      processing_status: processingStatus,
      extracted_data: extractionResult.data || {},
      confidence_score: extractionResult.confidence || 0,
      extracted_fields: extractionResult.data?.extractedFields || [],
      missing_fields: extractionResult.data?.missingCriticalFields || [],
      validation_errors: extractionResult.validationErrors || [],
      warnings: extractionResult.data?.warnings || [],
      suggestions,
      extraction_method: extractionResult.data?.extractionMethod || 'vision',
      model_used: extractionResult.data?.modelUsed || '',
      provider_used: extractionResult.provider || '',
      processing_time_ms: extractionResult.processingTime || 0,
      error_message: extractionResult.error || null,
      updated_at: new Date().toISOString()
    }

    const { data: updatedExtraction, error: updateError } = await supabase
      .from('document_extractions_enhanced')
      .update(updateData)
      .eq('id', extraction.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update enhanced extraction record', { error: updateError })
      return { data: null, error: updateError.message }
    }

    logger.info('Enhanced AI extraction process completed', {
      documentId: params.documentId,
      extractionId: extraction.id,
      success: extractionResult.success,
      confidence: extractionResult.confidence,
      processingTime: extractionResult.processingTime,
      fieldsExtracted: extractionResult.data?.extractedFields?.length || 0,
      provider: extractionResult.provider,
      status: processingStatus
    })

    // If high confidence and no errors, it will auto-apply via database trigger
    
    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/property/${params.propertyId}`)
    revalidatePath('/dashboard/documents')

    return { data: updatedExtraction, error: null }
  } catch (error) {
    logger.error('Unexpected error during enhanced document extraction', { 
      error,
      documentId: params.documentId 
    })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get enhanced extraction results for a document
 */
export async function getEnhancedExtractionResults(documentId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get extraction with document and policy details
    const { data: extraction, error } = await supabase
      .from('document_extractions_enhanced')
      .select(`
        *,
        policy_documents (
          file_name,
          file_type,
          insurance_type,
          uploaded_at
        ),
        policies (
          id,
          policy_number,
          carrier_name
        )
      `)
      .eq('document_id', documentId)
      .eq('processed_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      logger.error('Failed to fetch enhanced extraction results', { error, documentId })
      return { data: null, error: error.message }
    }

    return { data: extraction, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching enhanced extraction results', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Approve and apply extraction to property/policy
 */
export async function approveExtraction(
  extractionId: string, 
  editedData?: ExtractedPolicyDataEnhanced
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get extraction
    const { data: extraction, error: extractionError } = await supabase
      .from('document_extractions_enhanced')
      .select('*')
      .eq('id', extractionId)
      .single()

    if (extractionError || !extraction) {
      return { data: null, error: 'Extraction not found' }
    }

    // Update extraction with edited data if provided
    if (editedData) {
      const { error: updateError } = await supabase
        .from('document_extractions_enhanced')
        .update({
          extracted_data: editedData,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', extractionId)

      if (updateError) {
        logger.error('Failed to update extraction with edits', { error: updateError })
        return { data: null, error: updateError.message }
      }
    }

    // Mark as approved
    const { data: approvedExtraction, error: approveError } = await supabase
      .from('document_extractions_enhanced')
      .update({
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        processing_status: 'completed'
      })
      .eq('id', extractionId)
      .select()
      .single()

    if (approveError) {
      logger.error('Failed to approve extraction', { error: approveError })
      return { data: null, error: approveError.message }
    }

    // The database trigger will auto-apply to policy if confidence is high enough
    
    logger.info('Extraction approved', {
      extractionId,
      approvedBy: user.id,
      autoApplied: approvedExtraction.applied_to_property
    })

    // Revalidate pages
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/property/${extraction.property_id}`)
    revalidatePath('/dashboard/documents')

    return { data: approvedExtraction, error: null }
  } catch (error) {
    logger.error('Unexpected error approving extraction', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get extraction review queue for user
 */
export async function getExtractionQueue() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get extractions requiring review
    const { data: queue, error } = await supabase
      .from('extraction_review_queue')
      .select('*')
      .eq('processed_by', user.id)

    if (error) {
      logger.error('Failed to fetch extraction queue', { error })
      return { data: null, error: error.message }
    }

    return { data: queue, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching extraction queue', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get extraction statistics for dashboard
 */
export async function getExtractionStatistics(days: number = 30) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Call statistics function
    const { data: stats, error } = await supabase
      .rpc('get_extraction_statistics', {
        p_user_id: user.id,
        p_days: days
      })
      .single()

    if (error) {
      logger.error('Failed to fetch extraction statistics', { error })
      return { data: null, error: error.message }
    }

    return { data: stats, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching extraction statistics', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate suggestions based on extraction results
 */
function generateExtractionSuggestions(result: EnhancedExtractionResult): string[] {
  const suggestions: string[] = []
  
  if (!result.data) return suggestions

  // Check for missing critical fields
  if (!result.data.policyNumber) {
    suggestions.push('Policy number not found - check the declarations page')
  }
  
  if (!result.data.dwellingCoverage) {
    suggestions.push('Dwelling coverage amount missing - verify Coverage A section')
  }
  
  // Check for Florida-specific requirements
  if (!result.data.hurricaneDeductible && !result.data.windHailDeductible) {
    suggestions.push('Hurricane/wind deductible not found - required for Florida policies')
  }
  
  // Check dates
  if (result.data.expirationDate) {
    const expDate = new Date(result.data.expirationDate)
    const daysUntilExpiry = Math.floor((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 30) {
      suggestions.push(`Policy expires in ${daysUntilExpiry} days - consider renewal`)
    }
  }
  
  // Check coverage adequacy
  if (result.data.dwellingCoverage && result.data.dwellingCoverage < 200000) {
    suggestions.push('Dwelling coverage seems low for Florida property - verify adequacy')
  }
  
  return suggestions
}