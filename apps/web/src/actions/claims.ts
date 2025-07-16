/**
 * @fileMetadata
 * @purpose Server actions for managing insurance claims
 * @owner frontend-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["createClaim", "getClaims", "getClaim", "updateClaim", "addClaimCommunication"]
 * @complexity medium
 * @tags ["server-action", "claims", "database"]
 * @status active
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  Claim, 
  CreateClaimInput, 
  UpdateClaimInput,
  ClaimStatus,
  ClaimCommunication,
  CommunicationType,
  CommunicationDirection 
} from '@/types/database-enhancements'

export async function createClaim(input: CreateClaimInput) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    // Verify property ownership
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', input.property_id)
      .eq('user_id', user.id)
      .single()
    
    if (!property) {
      return { data: null, error: 'Property not found or access denied' }
    }
    
    // Create the claim
    const { data, error } = await supabase
      .from('claims')
      .insert({
        ...input,
        user_id: user.id,
        status: 'draft' as ClaimStatus
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Add initial status history
    await supabase
      .from('claim_status_history')
      .insert({
        claim_id: data.id,
        new_status: 'draft' as ClaimStatus,
        changed_by: user.id,
        reason: 'Claim created'
      })
    
    revalidatePath('/dashboard/claims')
    revalidatePath(`/dashboard/property/${input.property_id}`)
    
    return { data, error: null }
  } catch (error) {
    console.error('Error creating claim:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create claim' 
    }
  }
}

export async function getClaims() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    const { data, error } = await supabase
      .from('claims_overview')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching claims:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch claims' 
    }
  }
}

export async function getClaim(claimId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    // Get claim with all related data
    const { data: claim, error: claimError } = await supabase
      .from('claims_overview')
      .select('*')
      .eq('id', claimId)
      .eq('user_id', user.id)
      .single()
    
    if (claimError) throw claimError
    
    // Get status history
    const { data: statusHistory } = await supabase
      .from('claim_status_history')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false })
    
    // Get communications
    const { data: communications } = await supabase
      .from('claim_communications')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false })
    
    return { 
      data: {
        ...claim,
        status_history: statusHistory || [],
        communications: communications || []
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error fetching claim:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch claim' 
    }
  }
}

export async function updateClaim(claimId: string, updates: UpdateClaimInput) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    // Get current claim to check ownership and status
    const { data: currentClaim } = await supabase
      .from('claims')
      .select('status, user_id')
      .eq('id', claimId)
      .single()
    
    if (!currentClaim || currentClaim.user_id !== user.id) {
      return { data: null, error: 'Claim not found or access denied' }
    }
    
    // Update the claim
    const { data, error } = await supabase
      .from('claims')
      .update(updates)
      .eq('id', claimId)
      .select()
      .single()
    
    if (error) throw error
    
    // Track status change
    if (updates.status && updates.status !== currentClaim.status) {
      await supabase
        .from('claim_status_history')
        .insert({
          claim_id: claimId,
          previous_status: currentClaim.status,
          new_status: updates.status,
          changed_by: user.id,
          reason: `Status updated to ${updates.status}`
        })
    }
    
    revalidatePath('/dashboard/claims')
    revalidatePath(`/dashboard/claims/${claimId}`)
    
    return { data, error: null }
  } catch (error) {
    console.error('Error updating claim:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to update claim' 
    }
  }
}

export async function addClaimCommunication({
  claimId,
  type,
  direction,
  subject,
  content,
  attachments = []
}: {
  claimId: string
  type: CommunicationType
  direction: CommunicationDirection
  subject?: string
  content: string
  attachments?: any[]
}) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    // Verify claim ownership
    const { data: claim } = await supabase
      .from('claims')
      .select('id')
      .eq('id', claimId)
      .eq('user_id', user.id)
      .single()
    
    if (!claim) {
      return { data: null, error: 'Claim not found or access denied' }
    }
    
    // Add communication
    const { data, error } = await supabase
      .from('claim_communications')
      .insert({
        claim_id: claimId,
        user_id: user.id,
        communication_type: type,
        direction,
        subject,
        content,
        attachments
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/claims/${claimId}`)
    
    return { data, error: null }
  } catch (error) {
    console.error('Error adding communication:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to add communication' 
    }
  }
}

export async function getClaimsByProperty(propertyId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    const { data, error } = await supabase
      .from('claims_overview')
      .select('*')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching claims by property:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch claims' 
    }
  }
}