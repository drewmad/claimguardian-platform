import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://claimguardianai.com',
  'https://app.claimguardianai.com',
  Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:3000' : null
].filter(Boolean)

interface EnrichmentRequest {
  propertyId: string
  enrichmentTypes?: string[]
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
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

    const { propertyId, enrichmentTypes = ['all'] }: EnrichmentRequest = await req.json()

    // Verify property ownership
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: 'Property not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For now, return mock enrichment data
    const enrichmentData = {
      propertyId,
      enrichedAt: new Date().toISOString(),
      marketValue: {
        estimate: property.current_value || 350000,
        confidence: 0.85,
        lastUpdated: new Date().toISOString()
      },
      riskAssessment: {
        floodRisk: 'moderate',
        hurricaneRisk: 'high',
        overallRisk: 0.65
      },
      insuranceRecommendations: {
        suggestedCoverage: property.current_value * 1.2,
        deductibleRecommendation: 5000,
        additionalCoverages: ['flood', 'wind']
      }
    }

    // Store enrichment data
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        ai_enrichment_data: enrichmentData,
        ai_enrichment_date: new Date().toISOString()
      })
      .eq('id', propertyId)

    if (updateError) {
      console.error('Failed to store enrichment data:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: enrichmentData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Property enrichment error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error) || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
