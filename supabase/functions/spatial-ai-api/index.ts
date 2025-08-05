import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://claimguardianai.com',
  'https://app.claimguardianai.com',
  Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:3000' : null
].filter(Boolean)

interface SpatialAPIRequest {
  action: 'analyze_property' | 'generate_embeddings' | 'find_similar' | 'assess_risk' | 'environmental_data'
  data: Record<string, unknown>
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

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const { action, data }: SpatialAPIRequest = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (action) {
      case 'analyze_property': {
        const { propertyId, imageUrls, gisData } = data
        
        // For now, return mock data until we integrate the actual services
        const analysisResult = {
          imageAnalysis: {
            detectedObjects: [
              { class: 'roof', confidence: 0.95 },
              { class: 'windows', confidence: 0.88 }
            ],
            damageAssessment: {
              overall_condition: 'good',
              damage_categories: { roof: 0.1, siding: 0.05 },
              estimated_repair_cost: 5000,
              urgency_level: 'low'
            }
          },
          environmental3D: {
            floodRisk: {
              baseFloodElevation: 10.5,
              propertyElevation: 12.0,
              floodDepthRisk: 0.15
            },
            windRisk: {
              exposureCategory: 'B',
              windBorneDebrisRisk: 0.3
            }
          },
          riskAssessment: {
            overallRiskScore: 0.25,
            riskFactors: ['flood_zone', 'hurricane_exposure'],
            recommendedActions: ['flood_insurance', 'wind_mitigation']
          }
        }

        return new Response(
          JSON.stringify(analysisResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Spatial AI API error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
