'use server'

import { createClient } from '@claimguardian/db'
import { cookies } from 'next/headers'
import { z } from 'zod'

const inventoryItemSchema = z.object({
  propertyId: z.string().uuid().optional(),
  photoId: z.string().optional(),
  photoUrl: z.string().url().optional(),
  category: z.enum(['Electronics', 'Appliance', 'Furniture', 'Tool', 'Jewelry', 'Collectible', 'Other']),
  description: z.string().min(1).max(200),
  brand: z.string().default('UNKNOWN'),
  model: z.string().default('UNKNOWN'),
  serialNumber: z.string().default('UNKNOWN'),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().positive().optional(),
  proofOfPurchase: z.boolean().default(false),
  floridaTaxIncluded: z.boolean().optional(),
  conditionGrade: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']),
  estimatedReplacementCost: z.number().positive().optional(),
  depreciationPercent: z.number().min(0).max(100).default(0),
  locationInHome: z.string().default('UNKNOWN'),
  warrantyStatus: z.enum(['IN_WARRANTY', 'OUT_OF_WARRANTY', 'UNKNOWN']).default('UNKNOWN'),
  warrantyExpirationDate: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  notes: z.string().optional(),
})

export type CreateInventoryItemParams = z.infer<typeof inventoryItemSchema>

export async function createInventoryItem(params: CreateInventoryItemParams) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const validated = inventoryItemSchema.parse(params)
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        user_id: user.id,
        property_id: validated.propertyId,
        photo_id: validated.photoId,
        photo_url: validated.photoUrl,
        category: validated.category,
        description: validated.description,
        brand: validated.brand,
        model: validated.model,
        serial_number: validated.serialNumber,
        purchase_date: validated.purchaseDate,
        purchase_price_usd: validated.purchasePrice,
        proof_of_purchase: validated.proofOfPurchase,
        florida_tax_included: validated.floridaTaxIncluded,
        condition_grade: validated.conditionGrade,
        estimated_replacement_cost: validated.estimatedReplacementCost,
        depreciation_percent: validated.depreciationPercent,
        location_in_home: validated.locationInHome,
        warranty_status: validated.warrantyStatus,
        warranty_expiration_date: validated.warrantyExpirationDate,
        quantity: validated.quantity,
        notes: validated.notes,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create inventory item' }
  }
}

export async function getInventoryItems({ propertyId }: { propertyId?: string } = {}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch inventory items' }
  }
}

export async function updateInventoryItem({ 
  id, 
  ...params 
}: CreateInventoryItemParams & { id: string }) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const validated = inventoryItemSchema.parse(params)
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        property_id: validated.propertyId,
        photo_id: validated.photoId,
        photo_url: validated.photoUrl,
        category: validated.category,
        description: validated.description,
        brand: validated.brand,
        model: validated.model,
        serial_number: validated.serialNumber,
        purchase_date: validated.purchaseDate,
        purchase_price_usd: validated.purchasePrice,
        proof_of_purchase: validated.proofOfPurchase,
        florida_tax_included: validated.floridaTaxIncluded,
        condition_grade: validated.conditionGrade,
        estimated_replacement_cost: validated.estimatedReplacementCost,
        depreciation_percent: validated.depreciationPercent,
        location_in_home: validated.locationInHome,
        warranty_status: validated.warrantyStatus,
        warranty_expiration_date: validated.warrantyExpirationDate,
        quantity: validated.quantity,
        notes: validated.notes,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update inventory item' }
  }
}

export async function deleteInventoryItem({ id }: { id: string }) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete inventory item' }
  }
}

export async function calculateDepreciation({ 
  category, 
  purchaseDate 
}: { 
  category: string
  purchaseDate: string 
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data, error } = await supabase
      .rpc('calculate_depreciation', {
        p_category: category,
        p_purchase_date: purchaseDate
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error calculating depreciation:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to calculate depreciation' }
  }
}

export async function estimateReplacementCost({ 
  purchasePrice, 
  depreciationPercent, 
  category 
}: { 
  purchasePrice: number
  depreciationPercent: number
  category: string 
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data, error } = await supabase
      .rpc('estimate_replacement_cost', {
        p_purchase_price: purchasePrice,
        p_depreciation_percent: depreciationPercent,
        p_category: category
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error estimating replacement cost:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to estimate replacement cost' }
  }
}

export async function exportInventory({ 
  propertyId, 
  format = 'csv' 
}: { 
  propertyId?: string
  format?: 'csv' | 'json' 
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .rpc('export_inventory_florida_format', {
        p_user_id: user.id,
        p_property_id: propertyId,
        p_format: format
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error exporting inventory:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to export inventory' }
  }
}

export async function validateInventoryForClaims({ propertyId }: { propertyId?: string } = {}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .rpc('validate_inventory_for_claims', {
        p_user_id: user.id,
        p_property_id: propertyId
      })
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error validating inventory:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to validate inventory' }
  }
}

export async function getInventoryStatistics({ propertyId }: { propertyId?: string } = {}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    let query = supabase
      .from('inventory_statistics')
      .select('*')
      .eq('user_id', user.id)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') throw error
    
    const defaultStats = {
      total_items: 0,
      unique_categories: 0,
      total_quantity: 0,
      total_purchase_value: 0,
      total_replacement_value: 0,
      items_in_warranty: 0,
      damaged_items: 0,
      avg_depreciation: 0
    }

    return { data: data || defaultStats, error: null }
  } catch (error) {
    console.error('Error fetching inventory statistics:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch inventory statistics' }
  }
}