/**
 * @fileMetadata
 * @purpose Server actions for AI document extraction
 * @owner backend-team
 * @dependencies ["@/lib/supabase/server", "@/lib/services/ai-document-extraction"]
 * @exports ["processDocumentExtraction", "getExtractionResults"]
 * @complexity high
 * @tags ["server-action", "ai", "document-processing"]
 * @status active
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { aiDocumentExtractionService, ExtractedPolicyData } from '@/lib/services/ai-document-extraction'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

export interface ProcessExtractionParams {
  documentId: string
  propertyId: string
}

export interface ExtractionRecord {
  id: string
  document_id: string
  property_id: string
  extracted_data: ExtractedPolicyData
  confidence_score: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at: string
}

/**
 * Process AI extraction for a policy document
 */
export async function processDocumentExtraction(params: ProcessExtractionParams) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      logger.error('User not authenticated for document extraction', { error: userError })
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

    // Check if extraction already exists
    const { data: existingExtraction } = await supabase
      .from('document_extractions')
      .select('*')
      .eq('document_id', params.documentId)
      .single()

    if (existingExtraction && existingExtraction.processing_status === 'completed') {
      return { data: existingExtraction, error: null }
    }

    // Create or update extraction record
    const extractionRecord = {
      document_id: params.documentId,
      property_id: params.propertyId,
      processing_status: 'processing' as const,
      extracted_data: {},
      confidence_score: 0,
      processed_by: user.id
    }

    const { data: extraction, error: extractionError } = await supabase
      .from('document_extractions')
      .upsert(extractionRecord, { onConflict: 'document_id' })
      .select()
      .single()

    if (extractionError) {
      logger.error('Failed to create extraction record', { error: extractionError })
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
      return { data: null, error: 'Failed to access document for processing' }
    }

    logger.info('Starting AI extraction process', {
      documentId: params.documentId,
      fileName: document.file_name,
      fileType: document.file_type
    })

    // Process document with AI
    const extractionResult = await aiDocumentExtractionService.extractPolicyData(
      urlData.signedUrl,
      document.file_name,
      {
        apiProvider: 'gemini',
        useOCR: true,
        confidenceThreshold: 0.7
      }
    )

    // Update extraction record with results
    const updateData = {
      processing_status: extractionResult.success ? 'completed' as const : 'failed' as const,
      extracted_data: extractionResult.data || {},
      confidence_score: extractionResult.confidence || 0,
      error_message: extractionResult.error || null,
      processing_time_ms: extractionResult.processingTime || 0,
      updated_at: new Date().toISOString()
    }

    const { data: updatedExtraction, error: updateError } = await supabase
      .from('document_extractions')
      .update(updateData)
      .eq('id', extraction.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update extraction record', { error: updateError })
      return { data: null, error: updateError.message }
    }

    logger.info('AI extraction process completed', {
      documentId: params.documentId,
      success: extractionResult.success,
      confidence: extractionResult.confidence,
      processingTime: extractionResult.processingTime
    })

    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/property/${params.propertyId}`)

    return { data: updatedExtraction, error: null }
  } catch (error) {
    logger.error('Unexpected error during document extraction', { 
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
 * Get extraction results for a document
 */
export async function getExtractionResults(documentId: string) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get extraction with document details
    const { data: extraction, error } = await supabase
      .from('document_extractions')
      .select(`
        *,
        policy_documents (
          file_name,
          file_type,
          uploaded_at
        )
      `)
      .eq('document_id', documentId)
      .eq('processed_by', user.id)
      .single()

    if (error) {
      logger.error('Failed to fetch extraction results', { error, documentId })
      return { data: null, error: error.message }
    }

    return { data: extraction, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching extraction results', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Apply extracted data to property insurance information
 */
export async function applyExtractionToProperty(extractionId: string, propertyId: string) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get extraction data
    const { data: extraction, error: extractionError } = await supabase
      .from('document_extractions')
      .select('*')
      .eq('id', extractionId)
      .eq('processed_by', user.id)
      .single()

    if (extractionError || !extraction) {
      return { data: null, error: 'Extraction not found or access denied' }
    }

    const extractedData = extraction.extracted_data as ExtractedPolicyData

    // Create or update policy record
    if (extractedData.policyNumber && extractedData.carrierName) {
      const policyData = {
        property_id: propertyId,
        carrier_name: extractedData.carrierName,
        policy_number: extractedData.policyNumber,
        policy_type: (extractedData.policyType || 'HO3') as unknown,
        effective_date: extractedData.effectiveDate || new Date().toISOString().split('T')[0],
        expiration_date: extractedData.expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_details: {
          coverage_amount: extractedData.coverageAmount,
          deductible: extractedData.deductible,
          wind_deductible: extractedData.windDeductible,
          flood_deductible: extractedData.floodDeductible,
          additional_coverages: extractedData.additionalCoverages,
          extracted_from_document: true,
          extraction_confidence: extraction.confidence_score
        },
        premium_amount: extractedData.premiumAmount,
        deductible_amount: extractedData.deductible,
        created_by: user.id
      }

      const { data: policy, error: policyError } = await supabase
        .from('policies')
        .upsert(policyData, { 
          onConflict: 'property_id,policy_number,policy_type',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (policyError) {
        logger.error('Failed to create/update policy from extraction', { 
          error: policyError,
          extractionId 
        })
        return { data: null, error: policyError.message }
      }

      // Mark extraction as applied
      await supabase
        .from('document_extractions')
        .update({ 
          applied_to_property: true, 
          applied_at: new Date().toISOString() 
        })
        .eq('id', extractionId)

      logger.info('Extraction data applied to property', {
        extractionId,
        propertyId,
        policyId: policy.id
      })

      // Revalidate relevant pages
      revalidatePath('/dashboard')
      revalidatePath(`/dashboard/property/${propertyId}`)

      return { data: policy, error: null }
    }

    return { data: null, error: 'Insufficient data to create policy record' }
  } catch (error) {
    logger.error('Unexpected error applying extraction to property', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}