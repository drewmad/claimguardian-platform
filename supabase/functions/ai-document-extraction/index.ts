import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { AICostTracker } from '../_shared/ai-cost-tracker.ts'

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://claimguardianai.com',
  'https://app.claimguardianai.com',
  Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:3000' : null
].filter(Boolean)

interface ExtractedPolicyData {
  policyNumber?: string
  carrierName?: string
  policyType?: string
  coverageAmount?: number
  deductible?: number
  windDeductible?: number | string
  floodDeductible?: number
  effectiveDate?: string
  expirationDate?: string
  issueDate?: string
  propertyAddress?: string
  namedInsured?: string
  premiumAmount?: number
  additionalCoverages?: string[]
  confidence?: number
  extractedFields?: string[]
  processingTime?: number
}

interface ExtractionRequest {
  fileUrl: string
  fileName: string
  apiProvider?: 'gemini' | 'openai'
  useOCR?: boolean
  confidenceThreshold?: number
}

const buildExtractionPrompt = (): string => {
  return `
You are an AI assistant specialized in extracting structured data from insurance policy documents.

Please analyze this insurance policy document and extract the following information in JSON format:

{
  "policyNumber": "string - The policy number",
  "carrierName": "string - Insurance company name",
  "policyType": "string - Type of policy (HO3, HO5, etc.)",
  "coverageAmount": "number - Total coverage amount in dollars",
  "deductible": "number - Standard deductible amount",
  "windDeductible": "string|number - Wind/hurricane deductible (percentage or dollar amount)",
  "floodDeductible": "number - Flood deductible if applicable",
  "effectiveDate": "string - Policy effective date (YYYY-MM-DD)",
  "expirationDate": "string - Policy expiration date (YYYY-MM-DD)",
  "propertyAddress": "string - Insured property address",
  "namedInsured": "string - Primary insured person/entity",
  "premiumAmount": "number - Annual premium amount",
  "additionalCoverages": ["array of strings - Additional coverage types"],
  "confidence": "number - Your confidence in the extraction (0-1)"
}

Rules:
- Only include fields you can clearly identify in the document
- For dates, use YYYY-MM-DD format
- For monetary amounts, use numbers without currency symbols
- If uncertain about a field, omit it rather than guessing
- Provide a confidence score between 0 and 1
  `.trim()
}

async function extractWithGemini(fileUrl: string): Promise<ExtractedPolicyData> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  // Fetch the file
  const response = await fetch(fileUrl)
  const arrayBuffer = await response.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

  const prompt = buildExtractionPrompt()

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: response.headers.get('content-type') || 'application/pdf',
            data: base64
          }
        }
      ]
    }]
  })

  const text = result.response.text()

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response')
  }

  return JSON.parse(jsonMatch[0])
}

async function extractWithOpenAI(fileUrl: string): Promise<ExtractedPolicyData> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Fetch the file
  const response = await fetch(fileUrl)
  const arrayBuffer = await response.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildExtractionPrompt() },
            {
              type: 'image_url',
              image_url: {
                url: `data:${response.headers.get('content-type') || 'application/pdf'};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    })
  })

  const data = await openaiResponse.json()
  const text = data.choices[0].message.content

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response')
  }

  return JSON.parse(jsonMatch[0])
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }

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

    const body: ExtractionRequest = await req.json()
    const { fileUrl, fileName, apiProvider = 'gemini', confidenceThreshold = 0.7 } = body

    const startTime = Date.now()
    const costTracker = new AICostTracker()

    let extractedData: ExtractedPolicyData

    try {
      if (apiProvider === 'gemini') {
        extractedData = await extractWithGemini(fileUrl)
      } else if (apiProvider === 'openai') {
        extractedData = await extractWithOpenAI(fileUrl)
      } else {
        throw new Error('Invalid API provider')
      }

      extractedData.processingTime = Date.now() - startTime

      // Log AI usage for cost tracking
      if (apiProvider === 'gemini') {
        await costTracker.logGeminiUsage(
          user.id,
          'gemini-1.5-flash',
          'document-extraction',
          buildExtractionPrompt(),
          JSON.stringify(extractedData),
          true
        )
      } else if (apiProvider === 'openai') {
        // For OpenAI, we'd need to capture the response object with usage data
        // This is a simplified version - in production, modify extractWithOpenAI to return usage data
        await costTracker.logUsage({
          userId: user.id,
          provider: 'openai',
          model: 'gpt-4o',
          operationType: 'document-extraction',
          tokensUsed: 1000, // Estimate - should come from actual response
          estimatedCost: 0.03, // Estimate - should be calculated from actual usage
          success: true,
          metadata: { fileName }
        })
      }

      // Check confidence threshold
      if (extractedData.confidence && extractedData.confidence < confidenceThreshold) {
        console.log(JSON.stringify({
          level: "warn",
          timestamp: new Date().toISOString(),
          message: 'Extraction confidence below threshold',
          confidence: extractedData.confidence,
          threshold: confidenceThreshold,
          fileName
        }))
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: extractedData,
          confidence: extractedData.confidence,
          processingTime: extractedData.processingTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (extractionError) {
      console.log(JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message: 'Extraction failed',
        error: extractionError instanceof Error ? extractionError.message : String(extractionError)
      }));

      // Log failed AI usage
      await costTracker.logUsage({
        userId: user.id,
        provider: apiProvider as 'gemini' | 'openai',
        model: apiProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o',
        operationType: 'document-extraction',
        tokensUsed: 0,
        estimatedCost: 0,
        success: false,
        errorMessage: extractionError instanceof Error ? extractionError.message : 'Extraction failed',
        metadata: { fileName }
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: extractionError instanceof Error ? extractionError.message : 'Extraction failed',
          processingTime: Date.now() - startTime
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.log(JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      message: 'Edge function error',
      error: error instanceof Error ? error.message : String(error)
    }));

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error) || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
