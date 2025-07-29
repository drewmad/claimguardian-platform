import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DamageAnalysisRequest {
  propertyId: string
  damageDescription: string
  damageType: string
  images?: string[]
  estimatedValue?: number
}

interface PolicyCoverage {
  coverageType: string
  limit: number
  deductible: number
  isApplicable: boolean
  explanation: string
}

interface CoverageAnalysis {
  isCovered: boolean
  applicableCoverages: PolicyCoverage[]
  exclusions: string[]
  deductibles: {
    standard?: number
    hurricane?: string
    flood?: number
  }
  estimatedPayout: number
  nextSteps: string[]
  warnings: string[]
  recommendations: string[]
}

const COVERAGE_ANALYSIS_PROMPT = `You are an expert Florida insurance adjuster analyzing property damage against an active insurance policy.

Given the following:
1. Damage Description: {damageDescription}
2. Damage Type: {damageType}
3. Estimated Value: ${estimatedValue}
4. Active Policy Coverage:
{policyData}

Analyze whether this damage is covered and provide a detailed coverage analysis in JSON format:

{
  "isCovered": boolean,
  "applicableCoverages": [
    {
      "coverageType": "Coverage A - Dwelling",
      "limit": coverage limit,
      "deductible": applicable deductible,
      "isApplicable": true/false,
      "explanation": "Why this coverage applies or doesn't apply"
    }
  ],
  "exclusions": ["List any policy exclusions that might apply"],
  "deductibles": {
    "standard": standard deductible if applicable,
    "hurricane": "hurricane deductible if wind damage",
    "flood": flood deductible if applicable
  },
  "estimatedPayout": calculated payout after deductibles,
  "nextSteps": ["Recommended actions for the policyholder"],
  "warnings": ["Important warnings or limitations"],
  "recommendations": ["Additional recommendations for maximizing coverage"]
}

Consider Florida-specific factors:
- Hurricane/wind damage deductibles (often percentage-based)
- Flood coverage limitations
- Assignment of Benefits (AOB) considerations
- Matching statute requirements
- Code upgrade coverage
- Additional living expenses if home is uninhabitable`

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

    const { 
      propertyId, 
      damageDescription, 
      damageType, 
      images, 
      estimatedValue = 0 
    }: DamageAnalysisRequest = await req.json()

    // Fetch active policy documents for the property
    const { data: policyDocs, error: policyError } = await supabaseClient
      .from('policy_documents_extended')
      .select(`
        *,
        policies (
          policy_number,
          carrier_name,
          effective_date,
          expiration_date
        )
      `)
      .eq('property_id', propertyId)
      .eq('extraction_status', 'completed')
      .gte('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (policyError || !policyDocs || policyDocs.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No active policy found for this property',
          requiresPolicy: true 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const activePolicy = policyDocs[0]

    // Format policy data for AI analysis
    const policyDataFormatted = `
    Carrier: ${activePolicy.carrier_name}
    Policy Number: ${activePolicy.policy_number}
    Policy Type: ${activePolicy.policy_type}
    
    Coverage Limits:
    - Dwelling (Coverage A): $${activePolicy.dwelling_coverage?.toLocaleString() || 'Not specified'}
    - Other Structures (Coverage B): $${activePolicy.other_structures_coverage?.toLocaleString() || 'Not specified'}
    - Personal Property (Coverage C): $${activePolicy.personal_property_coverage?.toLocaleString() || 'Not specified'}
    - Loss of Use (Coverage D): $${activePolicy.loss_of_use_coverage?.toLocaleString() || 'Not specified'}
    - Personal Liability (Coverage E): $${activePolicy.liability_coverage?.toLocaleString() || 'Not specified'}
    - Medical Payments (Coverage F): $${activePolicy.medical_payments_coverage?.toLocaleString() || 'Not specified'}
    
    Deductibles:
    - All Other Perils: $${activePolicy.standard_deductible?.toLocaleString() || 'Not specified'}
    - Hurricane/Wind: ${activePolicy.hurricane_deductible || 'Not specified'}
    - Flood: ${activePolicy.flood_deductible ? `$${activePolicy.flood_deductible.toLocaleString()}` : 'Not covered'}
    
    Special Coverages: ${JSON.stringify(activePolicy.special_coverages || [])}
    Exclusions: ${JSON.stringify(activePolicy.exclusions || [])}
    Endorsements: ${JSON.stringify(activePolicy.endorsements || [])}
    `

    // Initialize Gemini AI
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Analyze damage against policy
    const prompt = COVERAGE_ANALYSIS_PROMPT
      .replace('{damageDescription}', damageDescription)
      .replace('{damageType}', damageType)
      .replace('{estimatedValue}', estimatedValue.toLocaleString())
      .replace('{policyData}', policyDataFormatted)

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let coverageAnalysis: CoverageAnalysis
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      coverageAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      coverageAnalysis = {
        isCovered: false,
        applicableCoverages: [],
        exclusions: [],
        deductibles: {},
        estimatedPayout: 0,
        nextSteps: ['Contact your insurance carrier for manual review'],
        warnings: ['Automated analysis failed - manual review required'],
        recommendations: []
      }
    }

    // Create damage assessment record with coverage analysis
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('property_damage')
      .insert({
        property_id: propertyId,
        user_id: user.id,
        damage_type: damageType,
        severity: estimatedValue > 10000 ? 'major' : estimatedValue > 1000 ? 'moderate' : 'minor',
        description: damageDescription,
        estimated_cost: estimatedValue,
        policy_document_id: activePolicy.id,
        coverage_analysis: coverageAnalysis,
        metadata: {
          images,
          analyzedAt: new Date().toISOString(),
          policyNumber: activePolicy.policy_number,
          carrier: activePolicy.carrier_name
        }
      })
      .select()
      .single()

    if (assessmentError) {
      throw assessmentError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        assessmentId: assessment.id,
        coverageAnalysis,
        policy: {
          carrier: activePolicy.carrier_name,
          policyNumber: activePolicy.policy_number,
          documentId: activePolicy.id
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in analyze-damage-with-policy:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})