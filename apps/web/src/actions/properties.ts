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

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    console.error('Error fetching property:', error)
    return { data: null, error: error as Error }
  }
}

export async function getProperties() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error in getProperties:', authError)
      throw new Error('Authentication failed')
    }
    
    if (!user) {
      console.error('No user found in getProperties')
      throw new Error('Not authenticated')
    }
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error in getProperties:', error)
      throw error
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching properties:', error)
    return { data: null, error: error as Error }
  }
}

export async function updateProperty({ 
  propertyId, 
  updates 
}: { 
  propertyId: string
  updates: Partial<PropertyData> 
}) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // Format the data for the database
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    
    if (updates.name) dbUpdates.name = updates.name
    if (updates.address) dbUpdates.address = { street: updates.address }
    if (updates.type) dbUpdates.type = updates.type
    if (updates.year_built) dbUpdates.year_built = updates.year_built
    if (updates.square_feet) dbUpdates.square_feet = updates.square_feet
    
    // Handle nested details
    if (updates.details) {
      const { data: currentProperty } = await supabase
        .from('properties')
        .select('details')
        .eq('id', propertyId)
        .single()
      
      dbUpdates.details = {
        ...(currentProperty?.details || {}),
        ...updates.details
      }
    }
    
    const { data, error } = await supabase
      .from('properties')
      .update(dbUpdates)
      .eq('id', propertyId)
      .eq('user_id', user.id) // Ensure user owns the property
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/property')
    revalidatePath(`/dashboard/property/${propertyId}`)
    
    return { data, error: null }
  } catch (error) {
    console.error('Error updating property:', error)
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
    console.error('Error creating property:', error)
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
    console.error('Error deleting property:', error)
    return { data: null, error: error as Error }
  }
}