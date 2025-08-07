import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OCRRequest {
  fileUrl: string
  fileName: string
  documentType?: 'receipt' | 'invoice' | 'estimate' | 'report' | 'letter' | 'general'
  extractStructuredData?: boolean
  language?: 'en' | 'es'
}

interface OCRResult {
  success: boolean
  text?: string
  structuredData?: any
  confidence?: number
  language?: string
  processingTime?: number
  error?: string
}

interface ReceiptData {
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

interface InvoiceData {
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

interface EstimateData {
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

function getStructuredDataPrompt(documentType: string): string {
  switch (documentType) {
    case 'receipt':
      return `Extract the following information from this receipt in JSON format:
{
  "merchantName": "string",
  "date": "YYYY-MM-DD",
  "total": number,
  "subtotal": number,
  "tax": number,
  "items": [
    {
      "name": "string",
      "quantity": number,
      "price": number
    }
  ],
  "paymentMethod": "string",
  "transactionId": "string"
}`;

    case 'invoice':
      return `Extract the following information from this invoice in JSON format:
{
  "invoiceNumber": "string",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "vendor": "string",
  "vendorAddress": "string",
  "client": "string",
  "clientAddress": "string",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "terms": "string"
}`;

    case 'estimate':
      return `Extract the following information from this contractor estimate in JSON format:
{
  "estimateNumber": "string",
  "date": "YYYY-MM-DD",
  "contractor": "string",
  "contractorLicense": "string",
  "propertyAddress": "string",
  "scopeOfWork": "string",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unit": "string",
      "unitPrice": number,
      "total": number
    }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "validUntil": "YYYY-MM-DD",
  "notes": "string"
}`;

    case 'report':
      return `Extract the key information from this report, including:
- Report title and date
- Author/inspector information
- Key findings and recommendations
- Any numerical data or measurements
- Summary or conclusions`;

    case 'letter':
      return `Extract the following from this letter:
- Date
- Sender information
- Recipient information
- Subject/RE line
- Key points or requests
- Any deadlines mentioned`;

    default:
      return `Extract all relevant text and structured information from this document.`;
  }
}

async function performOCR(fileUrl: string, documentType: string, extractStructured: boolean, language: string): Promise<OCRResult> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  // Fetch the file
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  const mimeType = response.headers.get('content-type') || 'image/jpeg'

  // Build the prompt
  let prompt = language === 'es'
    ? 'Por favor, extrae todo el texto de esta imagen. '
    : 'Please extract all text from this image. ';

  if (extractStructured && documentType !== 'general') {
    prompt += '\n\nThen, ' + getStructuredDataPrompt(documentType);
    prompt += '\n\nProvide the response in this format:\n\n--- EXTRACTED TEXT ---\n[all extracted text]\n\n--- STRUCTURED DATA ---\n[JSON data]';
  } else {
    prompt += 'Preserve the original formatting and layout as much as possible.';
  }

  const startTime = Date.now()

  try {
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64
            }
          }
        ]
      }]
    })

    const responseText = result.response.text()
    const processingTime = Date.now() - startTime

    if (extractStructured && documentType !== 'general') {
      // Parse structured data from response
      const textMatch = responseText.match(/--- EXTRACTED TEXT ---\n([\s\S]*?)\n\n--- STRUCTURED DATA ---/)
      const jsonMatch = responseText.match(/--- STRUCTURED DATA ---\n([\s\S]*?)$/m)

      const extractedText = textMatch ? textMatch[1].trim() : responseText
      let structuredData = null

      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1].trim()
          // Find JSON object in the text
          const jsonObjMatch = jsonStr.match(/\{[\s\S]*\}/)
          if (jsonObjMatch) {
            structuredData = JSON.parse(jsonObjMatch[0])
          }
        } catch (e) {
          console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Failed to parse structured data:', e
}));
        }
      }

      return {
        success: true,
        text: extractedText,
        structuredData,
        confidence: 0.9, // Gemini generally has high confidence
        language,
        processingTime
      }
    } else {
      return {
        success: true,
        text: responseText,
        confidence: 0.9,
        language,
        processingTime
      }
    }
  } catch (error) {
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: OCRRequest = await req.json()
    const {
      fileUrl,
      fileName,
      documentType = 'general',
      extractStructuredData = false,
      language = 'en'
    } = body

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'File URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user's subscription for OCR limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()

    // Check monthly OCR usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: ocrCount } = await supabase
      .from('ocr_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    // Define OCR limits by plan
    const ocrLimits: Record<string, number> = {
      free: 10,
      essential: 100,
      plus: 500,
      pro: -1 // unlimited
    }

    const userPlan = profile?.subscription_plan || 'free'
    const userLimit = ocrLimits[userPlan] || ocrLimits.free

    if (userLimit !== -1 && (ocrCount || 0) >= userLimit) {
      return new Response(
        JSON.stringify({
          error: 'Monthly OCR limit reached. Please upgrade your plan for more OCR scans.',
          limit: userLimit,
          used: ocrCount
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      // Perform OCR
      const result = await performOCR(fileUrl, documentType, extractStructuredData, language)

      // Log OCR usage
      await supabase
        .from('ocr_history')
        .insert({
          user_id: user.id,
          file_name: fileName,
          document_type: documentType,
          success: result.success,
          processing_time: result.processingTime,
          extracted_structured_data: extractStructuredData
        })

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (ocrError) {
      console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'OCR processing error:', ocrError
}));

      // Log failed attempt
      await supabase
        .from('ocr_history')
        .insert({
          user_id: user.id,
          file_name: fileName,
          document_type: documentType,
          success: false,
          error: ocrError.message
        })

      return new Response(
        JSON.stringify({
          success: false,
          error: ocrError.message || 'OCR processing failed'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Edge function error:', error
}));

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error) || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
