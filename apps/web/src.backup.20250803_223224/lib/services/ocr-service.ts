import { createBrowserSupabaseClient } from '@claimguardian/db'

export type DocumentType = 'receipt' | 'invoice' | 'estimate' | 'report' | 'letter' | 'general'

export interface OCRResult {
  success: boolean
  text?: string
  structuredData?: unknown
  confidence?: number
  language?: string
  processingTime?: number
  error?: string
}

export interface OCRHistoryEntry {
  id: string
  created_at: string
  user_id: string
  document_type: DocumentType
  result_text?: string
  structured_data?: unknown
  confidence?: number
  processing_time?: number
  file_name?: string
  success?: boolean
}

export interface ReceiptData {
  merchantName?: string
  date?: string
  total?: number
  subtotal?: number
  tax?: number
  items?: Array<{
    name: string
    quantity?: number
    price: number
  }>
  paymentMethod?: string
  transactionId?: string
}

export interface InvoiceData {
  invoiceNumber?: string
  date?: string
  dueDate?: string
  vendor?: string
  vendorAddress?: string
  client?: string
  clientAddress?: string
  items?: Array<{
    description: string
    quantity?: number
    unitPrice?: number
    total: number
  }>
  subtotal?: number
  tax?: number
  total?: number
  terms?: string
}

export interface EstimateData {
  estimateNumber?: string
  date?: string
  contractor?: string
  contractorLicense?: string
  propertyAddress?: string
  scopeOfWork?: string
  items?: Array<{
    description: string
    quantity?: number
    unit?: string
    unitPrice?: number
    total: number
  }>
  subtotal?: number
  tax?: number
  total?: number
  validUntil?: string
  notes?: string
}

export interface OCROptions {
  documentType?: DocumentType
  language?: string
  extractStructuredData?: boolean
}

class OCRService {
  private supabase = createBrowserSupabaseClient()

  async processDocument(
    file: File,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    try {
      // Upload file to temporary storage
      const fileName = `ocr-temp/${Date.now()}-${file.name}`
      const { error: uploadError } = await this.supabase.storage
        .from('temp-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('temp-documents')
        .getPublicUrl(fileName)

      // Call OCR Edge Function
      const { data, error } = await this.supabase.functions.invoke('ocr-document', {
        body: {
          fileUrl: publicUrl,
          fileName: file.name,
          documentType: options.documentType || 'general',
          extractStructuredData: options.extractStructuredData ?? true,
          language: options.language || 'en'
        }
      })

      // Clean up temp file
      await this.supabase.storage
        .from('temp-documents')
        .remove([fileName])

      if (error) {
        throw error
      }

      return data as OCRResult
    } catch (error) {
      console.error('OCR processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      }
    }
  }

  async processReceiptFromUrl(imageUrl: string): Promise<OCRResult> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ocr-document', {
        body: {
          fileUrl: imageUrl,
          fileName: 'receipt.jpg',
          documentType: 'receipt',
          extractStructuredData: true,
          language: 'en'
        }
      })

      if (error) {
        throw error
      }

      return data as OCRResult
    } catch (error) {
      console.error('Receipt OCR error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Receipt processing failed'
      }
    }
  }

  validateReceiptData(data: ReceiptData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.merchantName) {
      errors.push('Merchant name not found')
    }

    if (!data.date) {
      errors.push('Date not found')
    }

    if (!data.total && data.total !== 0) {
      errors.push('Total amount not found')
    }

    if (data.items && data.items.length === 0) {
      errors.push('No items found')
    }

    // Validate totals if we have items
    if (data.items && data.items.length > 0 && data.subtotal) {
      const calculatedSubtotal = data.items.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1))
      }, 0)

      if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
        errors.push('Item prices do not match subtotal')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  formatCurrency(amount?: number): string {
    if (amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  async getOCRHistory(limit = 10): Promise<OCRHistoryEntry[]> {
    const { data, error } = await this.supabase
      .from('ocr_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching OCR history:', error)
      return []
    }

    return data || []
  }

  async getOCRUsage(): Promise<{ used: number; limit: number; remaining: number }> {
    try {
      // Get user profile
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { used: 0, limit: 0, remaining: 0 }
      }

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single()

      // Get usage count for current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: ocrCount } = await this.supabase
        .from('ocr_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      // Define limits by plan
      const ocrLimits: Record<string, number> = {
        free: 10,
        essential: 100,
        plus: 500,
        pro: -1 // unlimited
      }

      const userPlan = profile?.subscription_plan || 'free'
      const limit = ocrLimits[userPlan] || ocrLimits.free
      const used = ocrCount || 0
      const remaining = limit === -1 ? -1 : Math.max(0, limit - used)

      return { used, limit, remaining }
    } catch (error) {
      console.error('Error getting OCR usage:', error)
      return { used: 0, limit: 0, remaining: 0 }
    }
  }
}

export const ocrService = new OCRService()

