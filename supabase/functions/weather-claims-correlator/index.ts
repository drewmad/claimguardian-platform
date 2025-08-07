import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

/**
 * Weather Claims Correlator
 * Automatically correlates insurance claims with weather events for evidence and documentation
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherCorrelation {
  claim_id: string
  weather_events: any[]
  severity_score: number
  evidence_strength: string
  correlation_details: any
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json().catch(() => ({}))
    const { action, claim_id, timeframe_days = 3 } = body
    
    console.log(`Weather Claims Correlator: ${action || 'correlate-all'}`)

    switch (action) {
      case 'correlate-claim':
        if (!claim_id) throw new Error('claim_id required')
        return await correlateSingleClaim(supabase, claim_id, timeframe_days)
      
      case 'correlate-recent':
        return await correlateRecentClaims(supabase, timeframe_days)
      
      case 'auto-documentation':
        if (!claim_id) throw new Error('claim_id required')
        return await generateClaimWeatherDocumentation(supabase, claim_id)
      
      case 'severity-analysis':
        return await analyzeClaimSeverityPatterns(supabase)
        
      default:
        return await correlateRecentClaims(supabase, timeframe_days)
    }
  } catch (error) {
    console.error('Weather Claims Correlator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function correlateSingleClaim(supabase: any, claimId: string, timeframeDays: number) {
  console.log(`Correlating claim ${claimId} with weather events`)
  
  // Get claim details
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select(`
      *,
      properties!inner(
        id,
        full_address,
        latitude,
        longitude,
        location
      )
    `)
    .eq('id', claimId)
    .single()

  if (claimError || !claim) {
    throw new Error('Claim not found')
  }

  const property = claim.properties
  if (!property.latitude || !property.longitude) {
    throw new Error('Property coordinates required for weather correlation')
  }

  // Calculate time window for weather events
  const claimDate = new Date(claim.date_of_loss || claim.created_at)
  const startDate = new Date(claimDate.getTime() - timeframeDays * 24 * 60 * 60 * 1000)
  const endDate = new Date(claimDate.getTime() + 24 * 60 * 60 * 1000) // Include day after claim

  console.log(`Searching for weather events between ${startDate.toISOString()} and ${endDate.toISOString()}`)

  const correlation = await findWeatherEventsForClaim(
    supabase, 
    claim, 
    property, 
    startDate, 
    endDate
  )

  // Store correlation results
  await supabase
    .from('weather_claim_correlations')
    .upsert({
      claim_id: claimId,
      property_id: property.id,
      correlation_data: correlation,
      severity_score: correlation.severity_score,
      evidence_strength: correlation.evidence_strength,
      correlated_at: new Date().toISOString()
    }, { onConflict: 'claim_id' })

  return new Response(
    JSON.stringify({
      claim_id: claimId,
      correlation: correlation,
      weather_events_found: correlation.weather_events.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ... (remaining functions would be here, but keeping file shorter for now)
async function findWeatherEventsForClaim(
  supabase: any, 
  claim: any, 
  property: any, 
  startDate: Date, 
  endDate: Date
): Promise<WeatherCorrelation> {
  // Simplified implementation for now
  return {
    claim_id: claim.id,
    weather_events: [],
    severity_score: 0,
    evidence_strength: 'none',
    correlation_details: {
      property_location: { lat: property.latitude, lon: property.longitude },
      search_timeframe: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      }
    }
  }
}

async function correlateRecentClaims(supabase: any, timeframeDays: number) {
  return new Response(
    JSON.stringify({ message: "Function placeholder - implementation needed" }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateClaimWeatherDocumentation(supabase: any, claimId: string) {
  return new Response(
    JSON.stringify({ message: "Function placeholder - implementation needed" }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function analyzeClaimSeverityPatterns(supabase: any) {
  return new Response(
    JSON.stringify({ message: "Function placeholder - implementation needed" }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}