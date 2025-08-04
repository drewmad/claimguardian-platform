/**
 * @fileMetadata
 * @purpose Claims management server actions for CRUD operations
 * @owner claims-team
 * @dependencies ["@claimguardian/db", "@claimguardian/utils"]
 * @exports ["createClaim", "updateClaim", "deleteClaim", "getClaim", "getUserClaims", "uploadClaimDocument", "generateClaimReport"]
 * @complexity high
 * @tags ["server-action", "claims", "database", "documents"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T22:05:00Z
 */

'use server'

import { createServerSupabaseClient, type ClaimInsert, type ClaimUpdate } from '@claimguardian/db'
import { toError } from '@claimguardian/utils'
import { cookies } from 'next/headers'

export interface ClaimResult {
  success: boolean
  error?: string
  data?: any
}

export async function createClaim({ 
  propertyId, 
  damageType, 
  description, 
  estimatedAmount 
}: {
  propertyId: string
  damageType: string
  description: string
  estimatedAmount?: number
}): Promise<ClaimResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const claimData: ClaimInsert = {
      user_id: user.id,
      property_id: propertyId,
      damage_type: damageType,
      description,
      estimated_amount: estimatedAmount || 0,
      status: 'draft'
    }

    const { data, error } = await supabase
      .from('claims')
      .insert(claimData)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    const err = toError(error)
    return {
      success: false,
      error: err.message
    }
  }
}

export async function updateClaim({ 
  claimId, 
  updates 
}: {
  claimId: string
  updates: ClaimUpdate
}): Promise<ClaimResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const { data, error } = await supabase
      .from('claims')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId)
      .eq('user_id', user.id) // Ensure user owns the claim
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    const err = toError(error)
    return {
      success: false,
      error: err.message
    }
  }
}

export async function deleteClaim({ claimId }: { claimId: string }): Promise<ClaimResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', claimId)
      .eq('user_id', user.id) // Ensure user owns the claim

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: { message: 'Claim deleted successfully' }
    }
  } catch (error) {
    const err = toError(error)
    return {
      success: false,
      error: err.message
    }
  }
}

export async function getClaim({ claimId }: { claimId: string }): Promise<ClaimResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const { data, error } = await supabase
      .from('claims')
      .select(`
        *,
        properties (
          id,
          name,
          address
        )
      `)
      .eq('id', claimId)
      .eq('user_id', user.id) // Ensure user owns the claim
      .single()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    const err = toError(error)
    return {
      success: false,
      error: err.message
    }
  }
}

export async function getUserClaims(): Promise<ClaimResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const { data, error } = await supabase
      .from('claims')
      .select(`
        *,
        properties (
          id,
          name,
          address
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    const err = toError(error)
    return {
      success: false,
      error: err.message
    }
  }
}

export async function uploadClaimDocument({ 
  claimId, 
  file, 
  documentType 
}: {
  claimId: string
  file: File
  documentType: string
}): Promise<ClaimResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${claimId}/${documentType}/${timestamp}-${file.name}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('claim-documents')
      .upload(fileName, file)

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('claim-documents')
      .getPublicUrl(fileName)

    // Save document record to database
    const { data: docData, error: docError } = await supabase
      .from('claim_documents')
      .insert({
        claim_id: claimId,
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_path: fileName,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single()

    if (docError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('claim-documents').remove([fileName])
      return {
        success: false,
        error: docError.message
      }
    }

    return {
      success: true,
      data: docData
    }
  } catch (error) {
    const err = toError(error)
    return {
      success: false,
      error: err.message
    }
  }
}

export async function generateClaimReport({ claimId }: { claimId: string }): Promise<ClaimResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Get claim data with related information
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select(`
        *,
        properties (
          id,
          name,
          address,
          year_built,
          square_footage
        ),
        claim_documents (
          id,
          document_type,
          file_name,
          file_url,
          created_at
        )
      `)
      .eq('id', claimId)
      .eq('user_id', user.id)
      .single()

    if (claimError) {
      return {
        success: false,
        error: claimError.message
      }
    }

    // Generate report data (simplified version)
    const report = {
      claim,
      summary: {
        totalDocuments: claim.claim_documents?.length || 0,
        estimatedAmount: claim.estimated_amount,
        status: claim.status,
        createdAt: claim.created_at,
        lastUpdated: claim.updated_at
      },
      recommendations: [
        'Review all uploaded documentation for completeness',
        'Ensure damage photos are clear and comprehensive',
        'Verify estimated repair costs with contractor quotes'
      ]
    }

    return {
      success: true,
      data: report
    }
  } catch (error) {
    const err = toError(error)
    return {
      success: false,
      error: err.message
    }
  }
}