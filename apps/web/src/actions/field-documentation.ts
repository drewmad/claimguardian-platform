/**
 * @fileMetadata
 * @purpose "Server actions for mobile field documentation management"
 * @dependencies ["@/lib","next"]
 * @owner mobile-team
 * @status stable
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface FieldDocumentationData {
  type: 'damage' | 'inspection' | 'inventory' | 'maintenance'
  title: string
  description: string
  location: {
    lat: number
    lng: number
    address: string
  }
  metadata: {
    timestamp: Date
    weather?: string
    temperature?: number
    deviceInfo: string
    inspector: string
  }
  priority: 'low' | 'medium' | 'high' | 'urgent'
  propertyId?: string
  claimId?: string
  tags: string[]
  mediaCount: number
}

export async function createFieldDocumentation(data: FieldDocumentationData) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Create field documentation record
    const { data: docData, error } = await supabase
      .from('field_documentation')
      .insert({
        user_id: user.id,
        type: data.type,
        title: data.title,
        description: data.description,
        location: data.location,
        metadata: data.metadata,
        priority: data.priority,
        property_id: data.propertyId,
        claim_id: data.claimId,
        tags: data.tags,
        media_count: data.mediaCount,
        status: 'synced'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating field documentation:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/mobile/field')
    return { data: docData, error: null }
  } catch (error) {
    console.error('Server error:', error)
    return { data: null, error: 'Failed to create field documentation' }
  }
}

export async function getFieldDocumentation(userId: string) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return { data: null, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('field_documentation')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching field documentation:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Server error:', error)
    return { data: null, error: 'Failed to fetch field documentation' }
  }
}

export async function updateFieldDocumentationStatus(
  docId: string,
  status: 'draft' | 'syncing' | 'synced' | 'failed'
) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('field_documentation')
      .update({ status })
      .eq('id', docId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating field documentation status:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/mobile/field')
    return { data, error: null }
  } catch (error) {
    console.error('Server error:', error)
    return { data: null, error: 'Failed to update field documentation status' }
  }
}
