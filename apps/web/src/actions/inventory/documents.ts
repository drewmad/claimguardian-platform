'use server'

import { createClient } from '@claimguardian/db'
import { cookies } from 'next/headers'
import { z } from 'zod'

const documentUploadSchema = z.object({
  inventoryItemId: z.string().uuid(),
  documentType: z.enum(['photo', 'receipt', 'warranty', 'manual', 'appraisal', 'other']),
  fileName: z.string(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  isPrimaryPhoto: z.boolean().default(false),
  containsSerialNumber: z.boolean().default(false),
  containsModelInfo: z.boolean().default(false),
})

export type DocumentUploadParams = z.infer<typeof documentUploadSchema>

export async function uploadInventoryDocument(
  params: DocumentUploadParams,
  file: File
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const validated = documentUploadSchema.parse(params)

    const fileExt = validated.fileName.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `inventory/${user.id}/${validated.inventoryItemId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('inventory')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data: document, error: documentError } = await supabase
      .from('inventory_documents')
      .insert({
        inventory_item_id: validated.inventoryItemId,
        user_id: user.id,
        document_type: validated.documentType,
        file_name: validated.fileName,
        file_path: filePath,
        file_size: validated.fileSize || file.size,
        mime_type: validated.mimeType || file.type,
        is_primary_photo: validated.isPrimaryPhoto,
        contains_serial_number: validated.containsSerialNumber,
        contains_model_info: validated.containsModelInfo,
      })
      .select()
      .single()

    if (documentError) throw documentError

    const { data: { publicUrl } } = supabase.storage
      .from('inventory')
      .getPublicUrl(filePath)

    return { 
      data: {
        ...document,
        publicUrl
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error uploading inventory document:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to upload document' }
  }
}

export async function getInventoryDocuments({ inventoryItemId }: { inventoryItemId: string }) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('inventory_documents')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })

    if (error) throw error

    const documentsWithUrls = await Promise.all(
      (data || []).map(async (doc) => {
        const { data: { publicUrl } } = supabase.storage
          .from('inventory')
          .getPublicUrl(doc.file_path)
        
        return {
          ...doc,
          publicUrl
        }
      })
    )

    return { data: documentsWithUrls, error: null }
  } catch (error) {
    console.error('Error fetching inventory documents:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch documents' }
  }
}

export async function deleteInventoryDocument({ documentId }: { documentId: string }) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: document, error: fetchError } = await supabase
      .from('inventory_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw fetchError

    const { error: storageError } = await supabase.storage
      .from('inventory')
      .remove([document.file_path])

    if (storageError) throw storageError

    const { error: deleteError } = await supabase
      .from('inventory_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Error deleting inventory document:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete document' }
  }
}

export async function setPrimaryPhoto({ 
  documentId, 
  inventoryItemId 
}: { 
  documentId: string
  inventoryItemId: string 
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('inventory_documents')
      .update({ is_primary_photo: true })
      .eq('id', documentId)
      .eq('inventory_item_id', inventoryItemId)
      .eq('user_id', user.id)

    if (error) throw error

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Error setting primary photo:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to set primary photo' }
  }
}

export async function analyzeDocumentWithAI({
  documentId,
  documentUrl,
  documentType
}: {
  documentId: string
  documentUrl: string
  documentType: string
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    let extractedData: any = {}

    if (documentType === 'receipt' || documentType === 'warranty') {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!apiKey) {
        return { data: null, error: 'OpenAI API key not configured' }
      }

      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey })

      const prompt = documentType === 'receipt' 
        ? 'Extract purchase date, price, store name, and item details from this receipt.'
        : 'Extract warranty period, coverage details, and expiration date from this warranty document.'

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: documentUrl } }
            ]
          }
        ],
        max_tokens: 500,
      })

      extractedData = response.choices[0]?.message?.content || ''
    }

    const { error: updateError } = await supabase
      .from('inventory_documents')
      .update({
        ai_extracted_text: JSON.stringify(extractedData),
        ai_confidence_score: 0.85
      })
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    return { data: extractedData, error: null }
  } catch (error) {
    console.error('Error analyzing document with AI:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to analyze document' }
  }
}