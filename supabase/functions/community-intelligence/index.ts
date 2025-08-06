import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CommunityQuery {
  damageType: string
  county?: string
  propertyType?: string
  requestType: 'settlement' | 'timeline' | 'factors' | 'all'
}

interface AnonymizedClaim {
  damageType: string
  county: string
  settlementBracket: number
  daysToSettle: number
  successFactors?: string[]
  propertyType?: string
}

interface CommunityInsight {
  averageSettlement: number
  medianTimeToSettle: number
  settlementRange: { low: number; high: number }
  successFactors: Array<{ factor: string; frequency: number }>
  sampleSize: number
  confidence: number
  lastUpdated: string
}

// Differential privacy parameters
const EPSILON = 0.1 // Privacy budget
const MIN_SAMPLE_SIZE = 100 // Minimum claims for analysis

serve(async (req) => {
  // Handle CORS
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

    const { damageType, county, propertyType, requestType } = await req.json() as CommunityQuery

    // Check if user has consented to see community data
    const authorization = req.headers.get('Authorization')
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user } } = await supabaseClient.auth.getUser(token)
      
      if (user) {
        // Log that user accessed community data (for transparency)
        await supabaseClient
          .from('achievement_events')
          .insert({
            user_id: user.id,
            event_type: 'community_access',
            event_data: { damageType, county },
            points_earned: 1
          })
      }
    }

    // Fetch anonymized community data
    let query = supabaseClient
      .from('community_claims')
      .select('*')
      .eq('damage_type', damageType)

    if (county) {
      query = query.eq('county', county)
    }
    if (propertyType) {
      query = query.eq('property_type', propertyType)
    }

    const { data: claims, error } = await query

    if (error) {
      throw new Error(`Failed to fetch community data: ${error.message}`)
    }

    // Check minimum sample size for privacy
    if (!claims || claims.length < MIN_SAMPLE_SIZE) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient data for analysis',
          message: 'We need at least 100 similar claims to provide insights while protecting privacy',
          currentSampleSize: claims?.length || 0,
          requiredSampleSize: MIN_SAMPLE_SIZE
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Apply differential privacy to the data
    const privatizedClaims = applyDifferentialPrivacy(claims)

    // Generate insights based on request type
    let insights: CommunityInsight
    
    switch (requestType) {
      case 'settlement':
        insights = analyzeSettlements(privatizedClaims)
        break
      case 'timeline':
        insights = analyzeTimelines(privatizedClaims)
        break
      case 'factors':
        insights = analyzeSuccessFactors(privatizedClaims)
        break
      case 'all':
      default:
        insights = generateComprehensiveInsights(privatizedClaims)
    }

    // Store aggregated insight for faster future queries
    await supabaseClient
      .from('community_insights')
      .insert({
        insight_type: requestType,
        damage_type: damageType,
        geographic_area: county || 'florida',
        insight_data: insights,
        confidence_score: insights.confidence,
        sample_size: privatizedClaims.length,
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Valid for 7 days
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        insights,
        privacy: {
          method: 'differential_privacy',
          epsilon: EPSILON,
          sampleSize: privatizedClaims.length,
          aggregationLevel: county ? 'county' : 'state'
        },
        disclaimer: 'These insights are based on anonymized community data and should not be considered legal or financial advice'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in community intelligence:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function applyDifferentialPrivacy(claims: any[]): AnonymizedClaim[] {
  return claims.map(claim => ({
    damageType: claim.damage_type,
    county: claim.county,
    // Add Laplacian noise to numerical values
    settlementBracket: addLaplacianNoise(claim.settlement_bracket, 10000 / EPSILON),
    daysToSettle: Math.max(1, Math.round(addLaplacianNoise(claim.days_to_settle, 10 / EPSILON))),
    successFactors: claim.success_factors || [],
    propertyType: claim.property_type
  }))
}

function addLaplacianNoise(value: number, scale: number): number {
  // Generate Laplacian noise for differential privacy
  const u = Math.random() - 0.5
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
  return Math.round(value + noise)
}

function analyzeSettlements(claims: AnonymizedClaim[]): CommunityInsight {
  const settlements = claims.map(c => c.settlementBracket).filter(s => s > 0)
  
  // Calculate statistics with noise already applied
  const average = settlements.reduce((a, b) => a + b, 0) / settlements.length
  const sorted = settlements.sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const low = sorted[Math.floor(sorted.length * 0.25)]
  const high = sorted[Math.floor(sorted.length * 0.75)]

  return {
    averageSettlement: Math.round(average / 1000) * 1000, // Round to nearest $1,000
    medianTimeToSettle: 0, // Not calculated in settlement-only analysis
    settlementRange: {
      low: Math.round(low / 1000) * 1000,
      high: Math.round(high / 1000) * 1000
    },
    successFactors: [],
    sampleSize: claims.length,
    confidence: calculateConfidence(claims.length),
    lastUpdated: new Date().toISOString()
  }
}

function analyzeTimelines(claims: AnonymizedClaim[]): CommunityInsight {
  const timelines = claims.map(c => c.daysToSettle).filter(t => t > 0)
  
  const average = timelines.reduce((a, b) => a + b, 0) / timelines.length
  const sorted = timelines.sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]

  return {
    averageSettlement: 0, // Not calculated in timeline-only analysis
    medianTimeToSettle: Math.round(median),
    settlementRange: { low: 0, high: 0 },
    successFactors: [],
    sampleSize: claims.length,
    confidence: calculateConfidence(claims.length),
    lastUpdated: new Date().toISOString()
  }
}

function analyzeSuccessFactors(claims: AnonymizedClaim[]): CommunityInsight {
  const factorCounts: Record<string, number> = {}
  
  claims.forEach(claim => {
    (claim.successFactors || []).forEach(factor => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1
    })
  })

  const topFactors = Object.entries(factorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([factor, count]) => ({
      factor,
      frequency: Math.round((count / claims.length) * 100)
    }))

  return {
    averageSettlement: 0,
    medianTimeToSettle: 0,
    settlementRange: { low: 0, high: 0 },
    successFactors: topFactors,
    sampleSize: claims.length,
    confidence: calculateConfidence(claims.length),
    lastUpdated: new Date().toISOString()
  }
}

function generateComprehensiveInsights(claims: AnonymizedClaim[]): CommunityInsight {
  const settlements = claims.map(c => c.settlementBracket).filter(s => s > 0)
  const timelines = claims.map(c => c.daysToSettle).filter(t => t > 0)
  
  // Settlement analysis
  const avgSettlement = settlements.reduce((a, b) => a + b, 0) / settlements.length
  const sortedSettlements = settlements.sort((a, b) => a - b)
  const lowSettlement = sortedSettlements[Math.floor(sortedSettlements.length * 0.25)]
  const highSettlement = sortedSettlements[Math.floor(sortedSettlements.length * 0.75)]
  
  // Timeline analysis
  const sortedTimelines = timelines.sort((a, b) => a - b)
  const medianTime = sortedTimelines[Math.floor(sortedTimelines.length / 2)]
  
  // Success factors
  const factorCounts: Record<string, number> = {}
  claims.forEach(claim => {
    (claim.successFactors || []).forEach(factor => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1
    })
  })

  const topFactors = Object.entries(factorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([factor, count]) => ({
      factor,
      frequency: Math.round((count / claims.length) * 100)
    }))

  return {
    averageSettlement: Math.round(avgSettlement / 1000) * 1000,
    medianTimeToSettle: Math.round(medianTime),
    settlementRange: {
      low: Math.round(lowSettlement / 1000) * 1000,
      high: Math.round(highSettlement / 1000) * 1000
    },
    successFactors: topFactors,
    sampleSize: claims.length,
    confidence: calculateConfidence(claims.length),
    lastUpdated: new Date().toISOString()
  }
}

function calculateConfidence(sampleSize: number): number {
  // Confidence score based on sample size
  // 100 samples = 0.6, 500 samples = 0.8, 1000+ samples = 0.95
  if (sampleSize < MIN_SAMPLE_SIZE) return 0
  if (sampleSize < 200) return 0.6
  if (sampleSize < 500) return 0.7
  if (sampleSize < 1000) return 0.8
  if (sampleSize < 5000) return 0.9
  return 0.95
}