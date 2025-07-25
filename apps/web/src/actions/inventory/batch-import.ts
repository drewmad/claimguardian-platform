'use server'

import { createClient } from '@claimguardian/db'
import { cookies } from 'next/headers'
import { z } from 'zod'

const batchItemSchema = z.object({
  photo_id: z.string().optional(),
  category: z.enum(['Electronics', 'Appliance', 'Furniture', 'Tool', 'Jewelry', 'Collectible', 'Other']),
  description: z.string(),
  brand: z.string().default('UNKNOWN'),
  model: z.string().default('UNKNOWN'),
  serial_number: z.string().default('UNKNOWN'),
  purchase_date: z.string().optional(),
  purchase_price_usd: z.union([z.number(), z.string()]).optional(),
  condition_grade: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']),
  estimated_replacement_cost: z.union([z.number(), z.string()]).optional(),
  depreciation_percent: z.union([z.number(), z.string()]).optional(),
  location_in_home: z.string().default('UNKNOWN'),
  warranty_status: z.enum(['IN_WARRANTY', 'OUT_OF_WARRANTY', 'UNKNOWN']).default('UNKNOWN'),
  warranty_expiration_date: z.string().optional(),
  proof_of_purchase: z.union([z.boolean(), z.enum(['YES', 'NO'])]).default(false),
  florida_tax_included: z.union([z.boolean(), z.enum(['YES', 'NO', 'UNK'])]).optional(),
  notes: z.string().optional(),
})

const batchImportSchema = z.object({
  propertyId: z.string().uuid().optional(),
  batchName: z.string(),
  importSource: z.enum(['ai_photo_scan', 'csv_upload', 'manual_entry', 'api_import']),
  aiProvider: z.enum(['openai', 'gemini', 'claude', 'none']).optional(),
  aiModel: z.string().optional(),
  items: z.array(batchItemSchema),
})

export type BatchImportParams = z.infer<typeof batchImportSchema>

export async function createBatchImport(params: BatchImportParams) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const validated = batchImportSchema.parse(params)
    
    const { data: batch, error: batchError } = await supabase
      .from('inventory_import_batches')
      .insert({
        user_id: user.id,
        property_id: validated.propertyId,
        batch_name: validated.batchName,
        import_source: validated.importSource,
        ai_provider: validated.aiProvider,
        ai_model: validated.aiModel,
        total_items: validated.items.length,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (batchError) throw batchError

    let processedCount = 0
    let failedCount = 0
    const errors: any[] = []
    const importedItemIds: string[] = []

    for (const item of validated.items) {
      try {
        const purchasePrice = typeof item.purchase_price_usd === 'string' && item.purchase_price_usd !== 'UNKNOWN' 
          ? parseFloat(item.purchase_price_usd) 
          : item.purchase_price_usd === 'UNKNOWN' ? null : item.purchase_price_usd

        const replacementCost = typeof item.estimated_replacement_cost === 'string' && item.estimated_replacement_cost !== 'UNKNOWN'
          ? parseFloat(item.estimated_replacement_cost)
          : item.estimated_replacement_cost === 'UNKNOWN' ? null : item.estimated_replacement_cost

        const depreciation = typeof item.depreciation_percent === 'string' && item.depreciation_percent !== 'UNKNOWN'
          ? parseFloat(item.depreciation_percent)
          : item.depreciation_percent === 'UNKNOWN' ? 0 : item.depreciation_percent

        const proofOfPurchase = typeof item.proof_of_purchase === 'string' 
          ? item.proof_of_purchase === 'YES' 
          : item.proof_of_purchase

        const floridaTax = item.florida_tax_included === 'YES' ? true 
          : item.florida_tax_included === 'NO' ? false 
          : null

        const { data: inventoryItem, error: itemError } = await supabase
          .from('inventory_items')
          .insert({
            user_id: user.id,
            property_id: validated.propertyId,
            photo_id: item.photo_id,
            category: item.category,
            description: item.description,
            brand: item.brand,
            model: item.model,
            serial_number: item.serial_number,
            purchase_date: item.purchase_date === 'UNKNOWN' ? null : item.purchase_date,
            purchase_price_usd: purchasePrice,
            proof_of_purchase: proofOfPurchase,
            florida_tax_included: floridaTax,
            condition_grade: item.condition_grade,
            estimated_replacement_cost: replacementCost,
            depreciation_percent: depreciation || 0,
            location_in_home: item.location_in_home,
            warranty_status: item.warranty_status,
            warranty_expiration_date: item.warranty_expiration_date === 'UNKNOWN' ? null : item.warranty_expiration_date,
            notes: item.notes,
          })
          .select()
          .single()

        if (itemError) throw itemError
        
        processedCount++
        importedItemIds.push(inventoryItem.id)
      } catch (error) {
        failedCount++
        errors.push({
          item: item.description,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const { error: updateError } = await supabase
      .from('inventory_import_batches')
      .update({
        status: failedCount === 0 ? 'completed' : failedCount === validated.items.length ? 'failed' : 'partial',
        processed_items: processedCount,
        failed_items: failedCount,
        completed_at: new Date().toISOString(),
        import_results: { imported_item_ids: importedItemIds },
        error_log: errors.length > 0 ? { errors } : null,
      })
      .eq('id', batch.id)

    if (updateError) throw updateError

    return { 
      data: {
        batchId: batch.id,
        processedCount,
        failedCount,
        errors,
        importedItemIds
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error creating batch import:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create batch import' }
  }
}

export async function parseCSVInventory(csvContent: string): Promise<z.infer<typeof batchItemSchema>[]> {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must contain header and at least one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const items: z.infer<typeof batchItemSchema>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'))
    
    const item: any = {}
    headers.forEach((header, index) => {
      const value = cleanValues[index] || ''
      
      switch (header) {
        case 'photo_id':
          item.photo_id = value || undefined
          break
        case 'category':
          item.category = value as any
          break
        case 'description':
          item.description = value
          break
        case 'brand':
          item.brand = value || 'UNKNOWN'
          break
        case 'model':
          item.model = value || 'UNKNOWN'
          break
        case 'serial_number':
          item.serial_number = value || 'UNKNOWN'
          break
        case 'purchase_date':
          item.purchase_date = value === 'UNKNOWN' ? undefined : value
          break
        case 'purchase_price_usd':
          item.purchase_price_usd = value === 'UNKNOWN' ? undefined : value
          break
        case 'condition_grade':
          item.condition_grade = value as any
          break
        case 'estimated_replacement_cost':
          item.estimated_replacement_cost = value
          break
        case 'depreciation_%':
        case 'depreciation_percent':
          item.depreciation_percent = value
          break
        case 'location_in_home':
          item.location_in_home = value || 'UNKNOWN'
          break
        case 'warranty_status':
          item.warranty_status = value as any || 'UNKNOWN'
          break
        case 'warranty_expiration_date':
          item.warranty_expiration_date = value === 'UNKNOWN' ? undefined : value
          break
        case 'proof_of_purchase':
          item.proof_of_purchase = value
          break
        case 'florida_tax_included':
          item.florida_tax_included = value
          break
        case 'notes':
          item.notes = value || undefined
          break
      }
    })

    try {
      const validated = batchItemSchema.parse(item)
      items.push(validated)
    } catch (error) {
      console.error(`Error parsing row ${i}:`, error)
    }
  }

  return items
}

export async function getImportBatches() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('inventory_import_batches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching import batches:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch import batches' }
  }
}

export async function getImportBatchDetails({ batchId }: { batchId: string }) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('inventory_import_batches')
      .select('*')
      .eq('id', batchId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching import batch details:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch import batch details' }
  }
}