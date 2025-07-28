/**
 * @fileMetadata
 * @purpose Server actions for document management
 * @owner backend-team
 * @dependencies ["@/lib/supabase/server", "@/lib/logger"]
 * @exports ["uploadPolicyDocument", "deletePolicyDocument", "getPolicyDocuments"]
 * @complexity medium
 * @tags ["server-action", "documents", "storage"]
 * @status active
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

export interface DocumentUploadParams {
  propertyId: string
  policyId?: string
  file: FormData
  documentType: 'policy' | 'claim' | 'evidence'
  description?: string
}

export interface DocumentRecordParams {
  propertyId: string
  policyId?: string
  filePath: string
  fileName: string
  fileSize: number
  fileType: string
  documentType: 'policy' | 'claim' | 'evidence'
  description?: string
}

export interface DocumentRecord {
  id: string
  property_id: string
  policy_id?: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  document_type: 'policy' | 'claim' | 'evidence'
  description?: string
  uploaded_at: string
  uploaded_by: string
}

/**
 * Upload a policy document and create database record
 */
export async function uploadPolicyDocument(params: DocumentUploadParams) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      logger.error('User not authenticated for document upload', { error: userError })
      return { data: null, error: 'User not authenticated' }
    }

    // Extract file from FormData
    const file = params.file.get('file') as File
    if (!file) {
      return { data: null, error: 'No file provided' }
    }

    // Validate file
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    
    if (file.size > maxSize) {
      return { data: null, error: 'File size exceeds 50MB limit' }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { data: null, error: `File type ${file.type} not allowed` }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${sanitizedName}`
    const filePath = `${user.id}/${params.documentType}/${fileName}`

    logger.info('Uploading policy document', { 
      fileName, 
      filePath, 
      fileSize: file.size,
      fileType: file.type,
      propertyId: params.propertyId 
    })

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('policy-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      logger.error('Failed to upload document to storage', { error: uploadError, filePath })
      return { data: null, error: uploadError.message }
    }

    // Create database record
    const { data: documentRecord, error: dbError } = await supabase
      .from('policy_documents')
      .insert({
        property_id: params.propertyId,
        policy_id: params.policyId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        document_type: params.documentType,
        description: params.description,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('policy-documents')
        .remove([filePath])
      
      logger.error('Failed to create document record', { error: dbError, filePath })
      return { data: null, error: dbError.message }
    }

    logger.info('Policy document uploaded successfully', { 
      documentId: documentRecord.id,
      filePath 
    })

    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/property/${params.propertyId}`)

    return { data: documentRecord, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading policy document', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a document record for an already uploaded file
 */
export async function createDocumentRecord(params: DocumentRecordParams) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      logger.error('User not authenticated for document record creation', { error: userError })
      return { data: null, error: 'User not authenticated' }
    }

    logger.info('Creating document record for uploaded file', { 
      fileName: params.fileName, 
      filePath: params.filePath, 
      propertyId: params.propertyId 
    })

    // Create database record
    const { data: documentRecord, error: dbError } = await supabase
      .from('policy_documents')
      .insert({
        property_id: params.propertyId,
        policy_id: params.policyId,
        file_path: params.filePath,
        file_name: params.fileName,
        file_size: params.fileSize,
        file_type: params.fileType,
        document_type: params.documentType,
        description: params.description,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      logger.error('Failed to create document record', { error: dbError, filePath: params.filePath })
      return { data: null, error: dbError.message }
    }

    logger.info('Document record created successfully', { 
      documentId: documentRecord.id,
      filePath: params.filePath 
    })

    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/property/${params.propertyId}`)

    return { data: documentRecord, error: null }
  } catch (error) {
    logger.error('Unexpected error creating document record', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete a policy document
 */
export async function deletePolicyDocument(documentId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get document record to verify ownership and get file path
    const { data: document, error: fetchError } = await supabase
      .from('policy_documents')
      .select('*')
      .eq('id', documentId)
      .eq('uploaded_by', user.id)
      .single()

    if (fetchError || !document) {
      logger.error('Document not found or access denied', { documentId, userId: user.id })
      return { data: null, error: 'Document not found or access denied' }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('policy-documents')
      .remove([document.file_path])

    if (storageError) {
      logger.error('Failed to delete file from storage', { 
        error: storageError, 
        filePath: document.file_path 
      })
      // Continue with database deletion even if storage deletion fails
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('policy_documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      logger.error('Failed to delete document record', { error: dbError, documentId })
      return { data: null, error: dbError.message }
    }

    logger.info('Policy document deleted successfully', { documentId })

    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/property/${document.property_id}`)

    return { data: { success: true }, error: null }
  } catch (error) {
    logger.error('Unexpected error deleting policy document', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get policy documents for a property
 */
export async function getPolicyDocuments(propertyId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data: documents, error } = await supabase
      .from('policy_documents')
      .select('*')
      .eq('property_id', propertyId)
      .eq('uploaded_by', user.id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch policy documents', { error, propertyId })
      return { data: null, error: error.message }
    }

    return { data: documents, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching policy documents', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get signed URL for downloading a document
 */
export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get document record to verify ownership
    const { data: document, error: fetchError } = await supabase
      .from('policy_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('uploaded_by', user.id)
      .single()

    if (fetchError || !document) {
      return { data: null, error: 'Document not found or access denied' }
    }

    // Create signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('policy-documents')
      .createSignedUrl(document.file_path, 3600)

    if (urlError) {
      logger.error('Failed to create signed URL', { error: urlError })
      return { data: null, error: urlError.message }
    }

    return { data: { url: urlData.signedUrl }, error: null }
  } catch (error) {
    logger.error('Unexpected error creating signed URL', { error })
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}