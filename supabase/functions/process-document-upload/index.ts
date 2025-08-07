import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import OpenAI from "npm:openai"

// Multi-modal document processor with parallel extraction
Deno.serve(async (req: Request) => {
  try {
    const { documentId, bucketName, fileName } = await req.json()

    // Initialize clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Update status to processing
    await supabase
      .from('documents')
      .update({
        processing_status: 'extracting',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', documentId)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucketName)
      .download(fileName)

    if (downloadError) throw downloadError

    // Parallel extraction pipelines
    const [ocrResult, visionResult, metadataResult] = await Promise.allSettled([
      extractTextWithOCR(fileData),
      analyzeWithVisionAI(fileData),
      extractMetadata(fileData)
    ])

    // Intelligent consolidation
    const consolidatedData = await consolidateExtractions({
      ocr: ocrResult.status === 'fulfilled' ? ocrResult.value : null,
      vision: visionResult.status === 'fulfilled' ? visionResult.value : null,
      metadata: metadataResult.status === 'fulfilled' ? metadataResult.value : null
    })

    // Florida-specific enrichment
    const floridaContext = await enrichWithFloridaData(consolidatedData, supabase)

    // Generate intelligent naming and associations
    const suggestions = await generateSuggestions(consolidatedData, floridaContext)

    // Calculate confidence and determine routing
    const confidenceScore = calculateConfidence(suggestions)
    const processingRoute = determineRoute(confidenceScore)

    // Update document with results
    await supabase
      .from('documents')
      .update({
        processing_status: processingRoute === 'auto' ? 'auto_confirmed' : 'pending_review',
        extraction_results: consolidatedData,
        ai_metadata: suggestions,
        confidence_scores: { overall: confidenceScore, details: suggestions.confidences },
        florida_context: floridaContext,
        auto_confirmed: processingRoute === 'auto',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', documentId)

    // Create associations
    if (suggestions.associations && suggestions.associations.length > 0) {
      const associations = suggestions.associations.map(assoc => ({
        document_id: documentId,
        entity_type: assoc.type,
        entity_id: assoc.id,
        confidence_level: getConfidenceLevel(assoc.confidence),
        association_reasoning: assoc.reasoning,
        verified_by_user: processingRoute === 'auto'
      }))

      await supabase
        .from('document_associations')
        .insert(associations)
    }

    // Log for learning if not auto-confirmed
    if (processingRoute !== 'auto') {
      await supabase
        .from('ai_feedback_log')
        .insert({
          document_id: documentId,
          ai_suggested_name: suggestions.name,
          ai_suggested_category: suggestions.category,
          ai_suggested_associations: suggestions.associations,
          ai_confidence_scores: suggestions.confidences,
          ai_reasoning: suggestions.reasoning,
          model_version: 'v1.0.0',
          extraction_method: 'multi_modal'
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        route: processingRoute,
        suggestions
      }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error('Document processing error:', error)

    // Update document with error status
    if (documentId) {
      await supabase
        .from('documents')
        .update({
          processing_status: 'processing_failed',
          ai_metadata: { error: error.message }
        })
        .eq('id', documentId)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

async function extractTextWithOCR(fileData: Blob): Promise<any> {
  // Implement OCR using Google Cloud Vision or Tesseract.js
  const gemini = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" })

  const base64 = await blobToBase64(fileData)
  const result = await model.generateContent([
    "Extract all text from this document. Return structured JSON with sections.",
    { inlineData: { data: base64, mimeType: fileData.type } }
  ])

  return JSON.parse(result.response.text())
}

async function analyzeWithVisionAI(fileData: Blob): Promise<any> {
  // Visual analysis for damage assessment, document type classification
  const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

  const base64 = await blobToBase64(fileData)
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this document image. Identify document type, key entities, dates, amounts, and any damage visible. Return structured JSON."
          },
          {
            type: "image_url",
            image_url: { url: `data:${fileData.type};base64,${base64}` }
          }
        ]
      }
    ]
  })

  return JSON.parse(response.choices[0].message.content!)
}

async function extractMetadata(fileData: Blob): Promise<any> {
  // Extract EXIF, file metadata, creation dates
  return {
    size: fileData.size,
    type: fileData.type,
    // Additional metadata extraction logic
  }
}

async function consolidateExtractions(results: any): Promise<any> {
  // Intelligent merging with conflict resolution
  const consolidated = {
    text: results.ocr?.text || '',
    entities: mergeEntities(results),
    dates: extractDates(results),
    amounts: extractAmounts(results),
    document_type: determineDocumentType(results),
    confidence_scores: calculateSectionConfidences(results)
  }

  return consolidated
}

async function enrichWithFloridaData(data: any, supabase: any): Promise<any> {
  // Cross-reference with Florida-specific databases
  const floridaContext = {
    hurricane_dates: [],
    insurance_carriers: [],
    contractors: [],
    regulations: []
  }

  // Match against Florida parcels if address found
  if (data.entities?.address) {
    const { data: parcels } = await supabase
      .from('florida_parcels')
      .select('*')
      .textSearch('address', data.entities.address)
      .limit(1)

    if (parcels?.length > 0) {
      floridaContext.parcel = parcels[0]
    }
  }

  // Match insurance carrier
  if (data.entities?.insurance_company) {
    const { data: carriers } = await supabase
      .from('insurance_carriers')
      .select('*')
      .ilike('name', `%${data.entities.insurance_company}%`)
      .limit(1)

    if (carriers?.length > 0) {
      floridaContext.carrier = carriers[0]
    }
  }

  return floridaContext
}

async function generateSuggestions(data: any, floridaContext: any): Promise<any> {
  // Generate intelligent naming and associations
  const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

  const prompt = `
    Based on the extracted document data and Florida context, generate:
    1. A descriptive file name (following pattern: YYYY-MM-DD_DocumentType_KeyEntity)
    2. Document category
    3. Potential associations with claims, properties, or contractors
    4. Confidence scores for each suggestion
    5. Clear reasoning for the suggestions

    Document Data: ${JSON.stringify(data)}
    Florida Context: ${JSON.stringify(floridaContext)}

    Return as structured JSON.
  `

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  })

  return JSON.parse(response.choices[0].message.content!)
}

function calculateConfidence(suggestions: any): number {
  // Weighted average of confidence scores
  const weights = {
    name: 0.2,
    category: 0.3,
    associations: 0.5
  }

  let totalScore = 0
  totalScore += (suggestions.confidences?.name || 0) * weights.name
  totalScore += (suggestions.confidences?.category || 0) * weights.category
  totalScore += (suggestions.confidences?.associations || 0) * weights.associations

  return totalScore
}

function determineRoute(confidence: number): string {
  if (confidence >= 0.9) return 'auto'
  if (confidence >= 0.6) return 'review'
  return 'manual'
}

function getConfidenceLevel(score: number): string {
  if (score >= 0.95) return 'very_high'
  if (score >= 0.8) return 'high'
  if (score >= 0.6) return 'medium'
  if (score >= 0.3) return 'low'
  return 'very_low'
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function mergeEntities(results: any): any {
  // Merge and deduplicate entities from different sources
  const entities = {}

  if (results.ocr?.entities) {
    Object.assign(entities, results.ocr.entities)
  }

  if (results.vision?.entities) {
    Object.assign(entities, results.vision.entities)
  }

  return entities
}

function extractDates(results: any): string[] {
  // Extract and normalize dates from all sources
  const dates = new Set<string>()

  // Add date extraction logic

  return Array.from(dates)
}

function extractAmounts(results: any): any[] {
  // Extract monetary amounts with context
  const amounts = []

  // Add amount extraction logic

  return amounts
}

function determineDocumentType(results: any): string {
  // Classify document based on content
  const indicators = {
    invoice: ['invoice', 'bill', 'amount due'],
    estimate: ['estimate', 'quote', 'proposed'],
    policy: ['policy', 'coverage', 'premium'],
    claim: ['claim', 'loss', 'damage'],
    receipt: ['receipt', 'paid', 'transaction'],
    photo: ['jpg', 'png', 'image'],
    report: ['report', 'assessment', 'inspection']
  }

  // Add classification logic

  return 'unknown'
}
