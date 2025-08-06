import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0"
import OpenAI from "npm:openai@4.73.0"
import Anthropic from "npm:@anthropic-ai/sdk@0.30.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractionRequest {
  fileUrl: string
  fileName: string
  options: {
    apiProvider?: 'gemini' | 'openai' | 'claude' | 'auto'
    useOCR?: boolean
    confidenceThreshold?: number
    extractRawText?: boolean
    validateAddress?: boolean
    enrichWithPublicData?: boolean
    language?: string
    maxRetries?: number
  }
  extractionSchema?: any
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileUrl, fileName, options, extractionSchema } = await req.json() as ExtractionRequest
    
    console.log('Enhanced document extraction started', { fileName, provider: options.apiProvider })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Determine which provider to use
    let provider = options.apiProvider || 'auto'
    let extractedData = null
    let confidence = 0
    let modelUsed = ''
    let processingTime = Date.now()

    // Multi-provider extraction logic
    if (provider === 'auto') {
      // Try providers in order of preference
      const providers = ['gemini', 'openai', 'claude']
      
      for (const p of providers) {
        try {
          const result = await extractWithProvider(p as any, fileUrl, fileName, options, extractionSchema)
          if (result.success && result.confidence > confidence) {
            extractedData = result.data
            confidence = result.confidence
            modelUsed = result.modelUsed
            provider = p as any
            
            // If we get high confidence, stop trying other providers
            if (confidence >= 0.9) break
          }
        } catch (error) {
          console.warn(`Provider ${p} failed:`, error)
          continue
        }
      }
    } else {
      // Use specific provider
      const result = await extractWithProvider(provider, fileUrl, fileName, options, extractionSchema)
      extractedData = result.data
      confidence = result.confidence
      modelUsed = result.modelUsed
    }

    processingTime = Date.now() - processingTime

    if (!extractedData) {
      throw new Error('All extraction providers failed')
    }

    // Post-process extracted data
    extractedData = await postProcessExtraction(extractedData, options, supabase)

    // Log AI usage for cost tracking
    await logAIUsage(supabase, {
      provider,
      model: modelUsed,
      operation: 'document_extraction',
      tokensUsed: estimateTokens(extractedData),
      responseTime: processingTime,
      fileName
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        confidence,
        processingTime,
        provider,
        modelUsed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Enhanced extraction error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function extractWithProvider(
  provider: 'gemini' | 'openai' | 'claude',
  fileUrl: string,
  fileName: string,
  options: any,
  schema: any
): Promise<any> {
  switch (provider) {
    case 'gemini':
      return await extractWithGemini(fileUrl, fileName, options, schema)
    case 'openai':
      return await extractWithOpenAI(fileUrl, fileName, options, schema)
    case 'claude':
      return await extractWithClaude(fileUrl, fileName, options, schema)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

async function extractWithGemini(fileUrl: string, fileName: string, options: any, schema: any) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('Gemini API key not configured')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  })

  // Fetch the file
  const fileResponse = await fetch(fileUrl)
  const fileBuffer = await fileResponse.arrayBuffer()
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)))

  const prompt = `You are an expert insurance policy document analyzer. Extract all relevant information from this insurance policy document.

EXTRACTION REQUIREMENTS:
1. Extract ALL fields mentioned in the schema below
2. Pay special attention to Florida-specific coverages (hurricane, flood, wind)
3. Extract exact values without modification
4. For percentages in deductibles, keep as string (e.g., "2%" not 0.02)
5. Extract complete addresses with all components
6. Identify all endorsements and riders
7. Extract premium breakdowns if available
8. Note any exclusions or special limitations

SCHEMA TO FOLLOW:
${JSON.stringify(schema, null, 2)}

Return a JSON object with all extracted fields. For any field you cannot find, omit it from the response.
Include a confidence score (0-1) for the overall extraction.
Add an extractedFields array listing all successfully extracted field names.
Add a missingCriticalFields array for important fields that could not be found.`

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        data: base64Data
      }
    },
    prompt
  ])

  const response = result.response
  const extractedData = JSON.parse(response.text())
  
  return {
    success: true,
    data: extractedData,
    confidence: extractedData.confidence || 0.8,
    modelUsed: 'gemini-1.5-pro'
  }
}

async function extractWithOpenAI(fileUrl: string, fileName: string, options: any, schema: any) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OpenAI API key not configured')

  const openai = new OpenAI({ apiKey })

  // For OpenAI, we'll use GPT-4 Vision for images or GPT-4 with text extraction for PDFs
  const isImage = /\.(jpg|jpeg|png)$/i.test(fileName)
  
  if (isImage) {
    // Use GPT-4 Vision for images
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert insurance policy document analyzer. Extract structured data from insurance documents with high accuracy."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all insurance policy information from this document according to this schema: ${JSON.stringify(schema, null, 2)}. Return only valid JSON.`
            },
            {
              type: "image_url",
              image_url: {
                url: fileUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })

    const extractedData = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      success: true,
      data: extractedData,
      confidence: extractedData.confidence || 0.85,
      modelUsed: 'gpt-4o'
    }
  } else {
    // For PDFs, we need to extract text first
    // This would require additional PDF processing logic
    throw new Error('PDF processing with OpenAI requires text extraction first')
  }
}

async function extractWithClaude(fileUrl: string, fileName: string, options: any, schema: any) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('Claude API key not configured')

  const anthropic = new Anthropic({ apiKey })

  // Fetch and encode the file
  const fileResponse = await fetch(fileUrl)
  const fileBuffer = await fileResponse.arrayBuffer()
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)))

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8192,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an expert insurance policy document analyzer. Extract all relevant information from this insurance policy document according to the following schema:

${JSON.stringify(schema, null, 2)}

Requirements:
1. Extract ALL fields mentioned in the schema
2. Pay special attention to Florida-specific coverages
3. Extract exact values without modification
4. Return only valid JSON
5. Include confidence score and field tracking`
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
              data: base64Data
            }
          }
        ]
      }
    ]
  })

  const extractedData = JSON.parse(response.content[0].text)
  
  return {
    success: true,
    data: extractedData,
    confidence: extractedData.confidence || 0.9,
    modelUsed: 'claude-3-5-sonnet'
  }
}

async function postProcessExtraction(data: any, options: any, supabase: any) {
  // Add extraction metadata
  data.extractionMethod = options.useOCR ? 'combined' : 'vision'
  data.extractedFields = Object.keys(data).filter(key => 
    data[key] !== null && data[key] !== undefined && key !== 'extractedFields'
  )
  
  // Identify missing critical fields
  const criticalFields = ['policyNumber', 'carrierName', 'effectiveDate', 'expirationDate', 'dwellingCoverage']
  data.missingCriticalFields = criticalFields.filter(field => !data[field])
  
  // Validate and normalize dates
  const dateFields = ['effectiveDate', 'expirationDate', 'issueDate']
  for (const field of dateFields) {
    if (data[field]) {
      try {
        const date = new Date(data[field])
        data[field] = date.toISOString().split('T')[0]
      } catch (e) {
        console.warn(`Invalid date format for ${field}: ${data[field]}`)
      }
    }
  }
  
  // Parse currency values
  const currencyFields = [
    'dwellingCoverage', 'personalPropertyCoverage', 'liabilityCoverage',
    'annualPremium', 'monthlyPremium', 'allPerilsDeductible'
  ]
  for (const field of currencyFields) {
    if (data[field] && typeof data[field] === 'string') {
      // Remove currency symbols and parse
      data[field] = parseFloat(data[field].replace(/[$,]/g, ''))
    }
  }
  
  // Normalize state abbreviations
  if (data.propertyAddress?.state) {
    const stateMap: Record<string, string> = {
      'Florida': 'FL',
      'florida': 'FL',
      'FLORIDA': 'FL'
    }
    data.propertyAddress.state = stateMap[data.propertyAddress.state] || data.propertyAddress.state
  }
  
  return data
}

async function logAIUsage(supabase: any, usage: any) {
  try {
    await supabase.from('ai_usage_logs').insert({
      provider: usage.provider,
      model: usage.model,
      operation_type: usage.operation,
      tokens_used: usage.tokensUsed,
      response_time_ms: usage.responseTime,
      metadata: { fileName: usage.fileName },
      success: true
    })
  } catch (error) {
    console.warn('Failed to log AI usage:', error)
  }
}

function estimateTokens(data: any): number {
  // Rough estimation: ~4 characters per token
  const jsonString = JSON.stringify(data)
  return Math.ceil(jsonString.length / 4)
}