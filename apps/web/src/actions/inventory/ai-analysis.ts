'use server'

import { createClient } from '@claimguardian/db'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FLORIDA_INVENTORY_PROMPT = `You are an expert property-inventory adjuster for residential insurance claims in the State of Florida.
Analyze every user-supplied photograph and produce a precise, line-item inventory list that satisfies:
- Florida insurance carrier requirements for hurricane, flood, fire, theft, and liability claims.
- Manufacturer warranty claim requirements (proof-of-purchase, serial data, warranty terms).

For EVERY item visible in the photo(s), extract or infer:
- category: One of: Electronics, Appliance, Furniture, Tool, Jewelry, Collectible, Other
- description: Plain-language item description (max 20 words)
- brand: Manufacturer or maker; "UNKNOWN" if not visible
- model: Model name/number; "UNKNOWN" if not visible
- serial_number: Exact serial or "UNKNOWN"
- purchase_date: YYYY-MM-DD or "UNKNOWN"
- purchase_price_usd: Numeric with 2 decimals or "UNKNOWN"
- condition_grade: NEW, GOOD, FAIR, POOR, DAMAGED
- estimated_replacement_cost: Current FL retail (USD, 2 decimals)
- depreciation_%: Based on useful life - Electronics 5yr, Appliance 10yr, Furniture 15yr, Tool 7yr, Jewelry/Collectible 0yr, Other 10yr
- location_in_home: Room or area inferred from image or "UNKNOWN"
- warranty_status: IN_WARRANTY, OUT_OF_WARRANTY, UNKNOWN
- warranty_expiration_date: YYYY-MM-DD or "UNKNOWN"
- proof_of_purchase: YES if receipt/box/tag visible; else NO
- florida_tax_included: YES if purchase price includes 6% FL state tax plus county surtax; else NO/UNK
- notes: Any distinctive details or visible damage

Apply replacement cost value (RCV) using Florida pricing.
Return ONLY a JSON array with these exact field names. No additional text or formatting.`

export async function analyzeInventoryWithAI({
  images,
  provider = 'openai',
  propertyId,
}: {
  images: { url: string; filename?: string }[]
  provider?: 'openai' | 'gemini'
  propertyId?: string
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    let analysisResult: any[] = []
    let aiModel = ''

    if (provider === 'openai') {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!apiKey) {
        return { data: null, error: 'OpenAI API key not configured' }
      }

      const openai = new OpenAI({ apiKey })
      aiModel = 'gpt-4-vision-preview'

      const messages: any[] = [
        {
          role: 'system',
          content: FLORIDA_INVENTORY_PROMPT
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze these photos and identify all items for insurance inventory:' },
            ...images.map(img => ({
              type: 'image_url',
              image_url: { url: img.url }
            }))
          ]
        }
      ]

      const response = await openai.chat.completions.create({
        model: aiModel,
        messages,
        max_tokens: 4096,
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        try {
          analysisResult = JSON.parse(content)
        } catch (e) {
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            analysisResult = JSON.parse(jsonMatch[0])
          }
        }
      }
    } else if (provider === 'gemini') {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        return { data: null, error: 'Gemini API key not configured' }
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      aiModel = 'gemini-1.5-flash'

      const imageParts = await Promise.all(
        images.map(async (img) => {
          const response = await fetch(img.url)
          const arrayBuffer = await response.arrayBuffer()
          return {
            inlineData: {
              data: Buffer.from(arrayBuffer).toString('base64'),
              mimeType: response.headers.get('content-type') || 'image/jpeg'
            }
          }
        })
      )

      const result = await model.generateContent([
        FLORIDA_INVENTORY_PROMPT + '\nAnalyze these photos and identify all items for insurance inventory:',
        ...imageParts
      ])

      const content = result.response.text()
      try {
        analysisResult = JSON.parse(content)
      } catch (e) {
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0])
        }
      }
    }

    if (!Array.isArray(analysisResult) || analysisResult.length === 0) {
      return { data: null, error: 'No items detected in the provided images' }
    }

    for (let i = 0; i < analysisResult.length; i++) {
      const item = analysisResult[i]
      if (images[0]?.filename && !item.photo_id) {
        item.photo_id = images[0].filename
      }
    }

    const { data: batchResult, error: batchError } = await createBatchImport({
      propertyId,
      batchName: `AI Analysis - ${new Date().toLocaleDateString()}`,
      importSource: 'ai_photo_scan',
      aiProvider: provider,
      aiModel,
      items: analysisResult
    })

    if (batchError) {
      return { data: null, error: batchError }
    }

    return { 
      data: {
        items: analysisResult,
        batchId: batchResult?.batchId,
        processedCount: batchResult?.processedCount,
        failedCount: batchResult?.failedCount,
        errors: batchResult?.errors
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error analyzing inventory with AI:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to analyze inventory' }
  }
}

async function createBatchImport(params: any) {
  const { createBatchImport: importFn } = await import('./batch-import')
  return importFn(params)
}

export async function validateInventoryItem(item: any) {
  const requiredFields = ['category', 'description', 'condition_grade']
  const missingFields = requiredFields.filter(field => !item[field])
  
  if (missingFields.length > 0) {
    return { valid: false, errors: [`Missing required fields: ${missingFields.join(', ')}`] }
  }

  const errors: string[] = []

  if (!['Electronics', 'Appliance', 'Furniture', 'Tool', 'Jewelry', 'Collectible', 'Other'].includes(item.category)) {
    errors.push('Invalid category')
  }

  if (!['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].includes(item.condition_grade)) {
    errors.push('Invalid condition grade')
  }

  if (item.depreciation_percent && (item.depreciation_percent < 0 || item.depreciation_percent > 100)) {
    errors.push('Depreciation must be between 0 and 100')
  }

  if (item.purchase_date && item.purchase_date !== 'UNKNOWN') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(item.purchase_date)) {
      errors.push('Purchase date must be in YYYY-MM-DD format')
    }
  }

  return { valid: errors.length === 0, errors }
}

export async function enrichInventoryItem(item: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  if (item.purchase_date && item.purchase_date !== 'UNKNOWN' && !item.depreciation_percent) {
    const { data: depreciation } = await supabase
      .rpc('calculate_depreciation', {
        p_category: item.category,
        p_purchase_date: item.purchase_date
      })
    
    if (depreciation !== null) {
      item.depreciation_percent = depreciation
    }
  }

  if (item.purchase_price_usd && item.purchase_price_usd !== 'UNKNOWN' && !item.estimated_replacement_cost) {
    const purchasePrice = typeof item.purchase_price_usd === 'string' ? parseFloat(item.purchase_price_usd) : item.purchase_price_usd
    
    const { data: replacementCost } = await supabase
      .rpc('estimate_replacement_cost', {
        p_purchase_price: purchasePrice,
        p_depreciation_percent: item.depreciation_percent || 0,
        p_category: item.category
      })
    
    if (replacementCost !== null) {
      item.estimated_replacement_cost = replacementCost
    }
  }

  return item
}