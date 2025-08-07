import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.24.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PolicyExtractionRequest {
  documentId: string
  fileContent: string
  fileName: string
}

interface ExtractedPolicyData {
  carrier?: string
  policyNumber?: string
  policyType?: string
  effectiveDate?: string
  expirationDate?: string
  premium?: number
  coverageDwelling?: number
  coverageOtherStructures?: number
  coveragePersonalProperty?: number
  coverageLossOfUse?: number
  coverageLiability?: number
  coverageMedicalPayments?: number
  standardDeductible?: number
  hurricaneDeductible?: string
  floodDeductible?: number
  specialCoverages?: Array<{
    type: string
    limit: number
    deductible?: number
  }>
  exclusions?: string[]
  endorsements?: Array<{
    form: string
    description: string
  }>
}

const EXTRACTION_PROMPT = `You are an expert insurance policy analyst specializing in Florida homeowners insurance.
Analyze this insurance policy document and extract the following information in JSON format:

{
  "carrier": "Insurance company name",
  "policyNumber": "Policy number",
  "policyType": "Policy type (HO3, HO5, DP3, etc.)",
  "effectiveDate": "Policy effective date (YYYY-MM-DD)",
  "expirationDate": "Policy expiration date (YYYY-MM-DD)",
  "premium": "Annual premium amount (number only)",
  "coverageDwelling": "Coverage A - Dwelling limit (number only)",
  "coverageOtherStructures": "Coverage B - Other structures limit (number only)",
  "coveragePersonalProperty": "Coverage C - Personal property limit (number only)",
  "coverageLossOfUse": "Coverage D - Loss of use limit (number only)",
  "coverageLiability": "Coverage E - Personal liability limit (number only)",
  "coverageMedicalPayments": "Coverage F - Medical payments limit (number only)",
  "standardDeductible": "All other perils deductible (number only)",
  "hurricaneDeductible": "Hurricane/wind deductible (percentage or dollar amount as string)",
  "floodDeductible": "Flood deductible if applicable (number only)",
  "specialCoverages": [
    {
      "type": "Coverage name",
      "limit": "Coverage limit (number)",
      "deductible": "Specific deductible if any (number)"
    }
  ],
  "exclusions": ["List of major exclusions"],
  "endorsements": [
    {
      "form": "Endorsement form number",
      "description": "Brief description"
    }
  ]
}

Extract only factual information present in the document. For missing information, omit the field from the response.
Focus on Florida-specific coverages like hurricane, flood, sinkhole, and mold.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { documentId, fileContent, fileName }: PolicyExtractionRequest = await req.json()

    // Verify document ownership
    const { data: document, error: docError } = await supabaseClient
      .from('policy_documents_extended')
      .select('id, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update status to processing
    await supabaseClient
      .from('policy_documents_extended')
      .update({
        extraction_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    // Initialize Gemini AI
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Extract policy data using AI
    const prompt = `${EXTRACTION_PROMPT}\n\nPolicy Document Content:\n${fileContent}`
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let extractedData: ExtractedPolicyData
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      extractedData = JSON.parse(jsonMatch[1] || jsonMatch[0])
    } catch (parseError) {
      console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Failed to parse AI response:', parseError
}));
      extractedData = {}
    }

    // Update the database with extracted data
    const { error: updateError } = await supabaseClient.rpc('update_policy_extraction', {
      p_document_id: documentId,
      p_extracted_data: extractedData
    })

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        extractedData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Error in extract-policy-data:', error
}));

    // Update document with error status
    if (req.method === 'POST') {
      try {
        const { documentId } = await req.json()
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        await supabaseClient
          .from('policy_documents_extended')
          .update({
            extraction_status: 'failed',
            extraction_error: error instanceof Error ? error.message : String(error),
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)
      } catch (e) {
        console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Failed to update error status:', e
}));
      }
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
