/**
 * @fileMetadata
 * @purpose Server actions for managing properties
 * @owner frontend-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["getProperty", "updateProperty", "createProperty", "deleteProperty"]
 * @complexity medium
 * @tags ["server-action", "properties", "database"]
 * @status active
 */
'use server'

import { 
  PaginationParams, 
  PaginatedResponse,
  normalizePaginationParams,
  createPaginationMeta 
} from '@claimguardian/utils'
import { revalidatePath } from 'next/cache'
import { logger } from "@/lib/logger/production-logger"

import { createClient } from '@/lib/supabase/server'
import { updatePropertySchema } from '@/lib/validation/schemas'
import { logger } from "@/lib/logger/production-logger"

interface PropertyData {
  name: string
  address: string
  type: string
  year_built: number
  square_feet: number
  details: {
    bedrooms: number
    bathrooms: number
    lot_size: number
  }
}

export async function getProperty({ propertyId }: { propertyId: string }) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user first
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Not authenticated')
    }
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', user.id) // Ensure user owns the property
      .single()
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching property:', error)
    return { data: null, error: error as Error }
  }
}

interface PropertyRecord {
  id: string
  user_id: string
  name: string
  address: string
  type: string
  year_built: number
  square_feet: number
  value: number | null
  insurability_score: number | null
  is_primary: boolean | null
  details: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function getProperties(params?: PaginationParams) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      logger.error('Auth error in getProperties:', authError)
      throw new Error('Authentication failed')
    }
    
    if (!user) {
      logger.error('No user found in getProperties')
      throw new Error('Not authenticated')
    }
    
    // Normalize pagination parameters
    const { page, limit, offset } = normalizePaginationParams(params)
    
    // Get total count
    const { count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    // Get paginated data
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      logger.error('Database error in getProperties:', error)
      throw error
    }
    
    // Create paginated response
    const paginatedResponse: PaginatedResponse<PropertyRecord> = {
      data: data || [],
      meta: createPaginationMeta(page, limit, count || 0)
    }
    
    return { data: paginatedResponse, error: null }
  } catch (error) {
    logger.error('Error fetching properties:', error)
    return { data: null, error: error as Error }
  }
}

export async function updateProperty(params: unknown) {
  try {
    // Validate input
    const { propertyId, updates } = updatePropertySchema.parse(params)
    
    const supabase = await createClient()
    
    // Debug logging
    logger.info('[UPDATE PROPERTY] Starting update for property:', propertyId)
    logger.info('[UPDATE PROPERTY] Updates:', updates)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      logger.error('[UPDATE PROPERTY] Auth error:', authError)
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    if (!user) {
      logger.error('[UPDATE PROPERTY] No user found')
      throw new Error('Not authenticated')
    }
    
    logger.info('[UPDATE PROPERTY] User authenticated:', user.id)
    
    // Handle demo property case - it doesn't exist in database
    if (propertyId === 'demo-property-uuid') {
      logger.info('[UPDATE PROPERTY] Demo property detected - skipping database update')
      // For demo property, just return success without database operation
      return { 
        data: { 
          id: propertyId, 
          ...updates,
          updated_at: new Date().toISOString() 
        }, 
        error: null 
      }
    }
    
    // First check if property exists and user owns it
    const { data: existingProperty, error: checkError } = await supabase
      .from('properties')
      .select('id, user_id, details')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()
    
    if (checkError) {
      logger.error('[UPDATE PROPERTY] Property check error:', checkError)
      throw new Error(`Property not found or access denied: ${checkError.message}`)
    }
    
    if (!existingProperty) {
      logger.error('[UPDATE PROPERTY] Property not found for user')
      throw new Error('Property not found or you do not have permission to update it')
    }
    
    logger.info('[UPDATE PROPERTY] Property found, proceeding with update')
    
    // Format the data for the database
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.address !== undefined) dbUpdates.address = { street: updates.address }
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.year_built !== undefined) dbUpdates.year_built = updates.year_built
    if (updates.square_feet !== undefined) dbUpdates.square_feet = updates.square_feet
    
    // Handle nested details - merge with existing
    if (updates.details) {
      dbUpdates.details = {
        ...(existingProperty.details || {}),
        ...updates.details
      }
    }
    
    logger.info('[UPDATE PROPERTY] Database updates:', dbUpdates)
    
    const { data, error } = await supabase
      .from('properties')
      .update(dbUpdates)
      .eq('id', propertyId)
      .eq('user_id', user.id) // Ensure user owns the property
      .select()
      .single()
    
    if (error) {
      logger.error('[UPDATE PROPERTY] Database update error:', error)
      throw new Error(`Failed to update property: ${error.message}`)
    }
    
    logger.info('[UPDATE PROPERTY] Update successful:', data)
    
    revalidatePath('/dashboard/property')
    revalidatePath(`/dashboard/property/${propertyId}`)
    
    return { data, error: null }
  } catch (error) {
    logger.error('[UPDATE PROPERTY] Error updating property:', error)
    return { data: null, error: error as Error }
  }
}

export async function createProperty({ propertyData }: { propertyData: PropertyData }) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('properties')
      .insert({
        user_id: user.id,
        name: propertyData.name,
        address: { street: propertyData.address },
        type: propertyData.type,
        year_built: propertyData.year_built,
        square_feet: propertyData.square_feet,
        details: propertyData.details
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/property')
    
    return { data, error: null }
  } catch (error) {
    logger.error('Error creating property:', error)
    return { data: null, error: error as Error }
  }
}

export async function deleteProperty({ propertyId }: { propertyId: string }) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('user_id', user.id) // Ensure user owns the property
    
    if (error) throw error
    
    revalidatePath('/dashboard/property')
    
    return { data: { success: true }, error: null }
  } catch (error) {
    logger.error('Error deleting property:', error)
    return { data: null, error: error as Error }
  }
}