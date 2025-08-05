import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://claimguardianai.com',
  'https://app.claimguardianai.com',
  Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:3000' : null
].filter(Boolean)

interface DamageAnalysisRequest {
  propertyId: string
  damageDescription: string
  damageType: string
  images?: string[]
  estimatedValue?: number
}

Deno.serve(async (req) => {
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

    // Verify property ownership
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ 
          error: 'Property not found or access denied'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check for active policies
    const { data: policies } = await supabaseClient
      .from('policies')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .gte('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (!policies || policies.length === 0) {
      // Return analysis without policy context
      return new Response(
        JSON.stringify({ 
          success: true,
          analysis: {
            damageType,
            description: damageDescription,
            estimatedValue,
            hasActivePolicy: false,
            message: 'No active policy found. This is a general damage assessment.',
            recommendations: [
              'Document all damage thoroughly with photos',
              'Get multiple repair estimates',
              'Review your insurance policy if available',
              'Contact your insurance carrier'
            ]
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const activePolicy = policies[0]

    // Initialize Gemini AI
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      // Fallback response without AI
      return new Response(
        JSON.stringify({ 
          success: true,
          analysis: {
            damageType,
            description: damageDescription,
            estimatedValue,
            hasActivePolicy: true,
            policyNumber: activePolicy.policy_number,
            carrier: activePolicy.carrier_name,
            message: 'AI analysis unavailable. Manual review recommended.'
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Simple prompt for damage analysis
    const prompt = `As an insurance expert, analyze this damage:
    Type: ${damageType}
    Description: ${damageDescription}
    Estimated Value: $${estimatedValue}
    
    Provide a brief analysis including:
    1. Whether this type of damage is typically covered
    2. Common exclusions to watch for
    3. Recommended next steps
    
    Format as JSON with: {isCovered: boolean, explanation: string, nextSteps: string[], warnings: string[]}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    let aiAnalysis
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      aiAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')
    } catch {
      aiAnalysis = {
        isCovered: true,
        explanation: 'Unable to parse AI response. Manual review required.',
        nextSteps: ['Contact your insurance carrier'],
        warnings: []
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: {
          ...aiAnalysis,
          damageType,
          description: damageDescription,
          estimatedValue,
          hasActivePolicy: true,
          policyNumber: activePolicy.policy_number,
          carrier: activePolicy.carrier_name
        }
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
      message: 'Error in analyze-damage-with-policy',
      error: error instanceof Error ? error.message : String(error)
    }));
    
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