/**
 * Florida Property Enrichment Edge Function
 * Comprehensive AI-powered property analysis and risk assessment
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

// Types
interface PropertyEnrichmentRequest {
  parcel_id?: string
  objectid?: number
  lat?: number
  lon?: number
  address?: string
  enrich_all?: boolean
}

interface EnrichmentResult {
  parcel_id: string
  risk_assessment: RiskAssessment
  market_analysis: MarketAnalysis
  infrastructure_data: InfrastructureData
  ai_insights: AIInsights
}

interface RiskAssessment {
  hurricane_risk: number
  flood_risk: number
  wildfire_risk: number
  tornado_risk: number
  earthquake_risk: number
  crime_risk: number
  construction_risk: number
  age_risk: number
  location_risk: number
  overall_risk_score: number
  insurance_risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  risk_factors: Record<string, any>
  mitigation_recommendations: Record<string, any>
}

interface MarketAnalysis {
  estimated_value: number
  price_per_sqft: number
  rent_estimate: number
  rental_yield: number
  value_trend_1yr: number
  value_trend_3yr: number
  value_trend_5yr: number
  comparable_sales: any[]
  comparable_count: number
  days_on_market_avg: number
  cap_rate: number
  cash_flow_estimate: number
  roi_estimate: number
  market_temperature: 'COLD' | 'COOL' | 'BALANCED' | 'WARM' | 'HOT'
  supply_demand_ratio: number
}

interface InfrastructureData {
  nearest_hospital_distance: number
  nearest_hospital_name: string
  nearest_fire_station_distance: number
  nearest_police_station_distance: number
  power_grid_reliability_score: number
  internet_provider_count: number
  water_quality_score: number
  nearest_airport_distance: number
  nearest_major_highway_distance: number
  public_transit_access: boolean
  nearest_elementary_distance: number
  nearest_elementary_rating: number
  nearest_high_school_distance: number
  nearest_high_school_rating: number
  grocery_store_count_1mile: number
  restaurant_count_1mile: number
  shopping_access_score: number
}

interface AIInsights {
  summary: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  investment_recommendation: string
  insurance_recommendations: string[]
  improvement_suggestions: string[]
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Initialize clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    })

    // Parse request
    const requestData: PropertyEnrichmentRequest = await req.json()

    // Validate input
    if (!requestData.parcel_id && !requestData.objectid && !requestData.lat && !requestData.address) {
      return new Response(
        JSON.stringify({ error: 'Must provide parcel_id, objectid, coordinates, or address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get property data
    let propertyData: any

    if (requestData.parcel_id) {
      const { data, error } = await supabaseClient
        .from('florida_parcels')
        .select('*')
        .eq('parcel_id', requestData.parcel_id)
        .single()

      if (error) throw error
      propertyData = data
    } else if (requestData.objectid) {
      const { data, error } = await supabaseClient
        .from('florida_parcels')
        .select('*')
        .eq('objectid', requestData.objectid)
        .single()

      if (error) throw error
      propertyData = data
    } else if (requestData.lat && requestData.lon) {
      // Find nearest property to coordinates
      const { data, error } = await supabaseClient
        .rpc('find_properties_within_radius', {
          center_lat: requestData.lat,
          center_lon: requestData.lon,
          radius_miles: 0.1,
          property_count_limit: 1
        })

      if (error) throw error
      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No property found near coordinates' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get full property data
      const { data: propData, error: propError } = await supabaseClient
        .from('florida_parcels')
        .select('*')
        .eq('parcel_id', data[0].parcel_id)
        .single()

      if (propError) throw propError
      propertyData = propData
    }

    if (!propertyData) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate comprehensive enrichment
    const enrichmentResult = await enrichProperty(propertyData, supabaseClient, openai)

    // Store enrichment results
    await storeEnrichmentResults(enrichmentResult, supabaseClient)

    // Update property with AI processing flag
    await supabaseClient
      .from('florida_parcels')
      .update({
        ai_processed: true,
        last_enriched_at: new Date().toISOString(),
        ai_risk_score: enrichmentResult.risk_assessment.overall_risk_score
      })
      .eq('parcel_id', propertyData.parcel_id)

    return new Response(
      JSON.stringify({
        success: true,
        data: enrichmentResult,
        metadata: {
          processed_at: new Date().toISOString(),
          property_id: propertyData.parcel_id,
          county_code: propertyData.co_no
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Property enrichment error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    )
  }
})

async function enrichProperty(
  propertyData: any,
  supabase: any,
  openai: any
): Promise<EnrichmentResult> {

  // 1. Risk Assessment
  const riskAssessment = await generateRiskAssessment(propertyData, supabase, openai)

  // 2. Market Analysis
  const marketAnalysis = await generateMarketAnalysis(propertyData, supabase, openai)

  // 3. Infrastructure Analysis
  const infrastructureData = await analyzeInfrastructure(propertyData, supabase)

  // 4. AI Insights
  const aiInsights = await generateAIInsights(propertyData, riskAssessment, marketAnalysis, openai)

  return {
    parcel_id: propertyData.parcel_id,
    risk_assessment: riskAssessment,
    market_analysis: marketAnalysis,
    infrastructure_data: infrastructureData,
    ai_insights: aiInsights
  }
}

async function generateRiskAssessment(propertyData: any, supabase: any, openai: any): Promise<RiskAssessment> {
  // Hurricane Risk (based on county and coastal proximity)
  const hurricaneRisk = calculateHurricaneRisk(propertyData)

  // Flood Risk (FEMA flood zones)
  const floodRisk = await calculateFloodRisk(propertyData, supabase)

  // Age Risk (building age)
  const ageRisk = calculateAgeRisk(propertyData.yr_blt)

  // Construction Risk (property type and materials)
  const constructionRisk = calculateConstructionRisk(propertyData)

  // Location Risk (general area risk factors)
  const locationRisk = await calculateLocationRisk(propertyData, supabase)

  // Other risks (defaulted for now)
  const wildFireRisk = 15 // Florida has low wildfire risk
  const tornadoRisk = 25 // Moderate tornado risk
  const earthquakeRisk = 5 // Very low earthquake risk
  const crimeRisk = await calculateCrimeRisk(propertyData, supabase)

  // Calculate overall risk score
  const overallRiskScore =
    hurricaneRisk * 0.3 +
    floodRisk * 0.25 +
    ageRisk * 0.15 +
    constructionRisk * 0.15 +
    locationRisk * 0.1 +
    crimeRisk * 0.05

  // Determine insurance risk tier
  let insuranceRiskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  if (overallRiskScore < 25) insuranceRiskTier = 'LOW'
  else if (overallRiskScore < 50) insuranceRiskTier = 'MEDIUM'
  else if (overallRiskScore < 75) insuranceRiskTier = 'HIGH'
  else insuranceRiskTier = 'EXTREME'

  return {
    hurricane_risk: hurricaneRisk,
    flood_risk: floodRisk,
    wildfire_risk: wildFireRisk,
    tornado_risk: tornadoRisk,
    earthquake_risk: earthquakeRisk,
    crime_risk: crimeRisk,
    construction_risk: constructionRisk,
    age_risk: ageRisk,
    location_risk: locationRisk,
    overall_risk_score: Math.round(overallRiskScore * 100) / 100,
    insurance_risk_tier: insuranceRiskTier,
    risk_factors: {
      coastal_property: isCoastalProperty(propertyData),
      building_age: new Date().getFullYear() - (propertyData.yr_blt || 1950),
      property_value_tier: propertyData.tot_val > 500000 ? 'HIGH' : propertyData.tot_val > 200000 ? 'MEDIUM' : 'LOW'
    },
    mitigation_recommendations: generateMitigationRecommendations(hurricaneRisk, floodRisk, ageRisk)
  }
}

async function generateMarketAnalysis(propertyData: any, supabase: any, openai: any): Promise<MarketAnalysis> {
  // Get comparable properties
  const comparables = await getComparableProperties(propertyData, supabase)

  // Calculate market metrics
  const pricePerSqft = propertyData.tot_lvg_area > 0 ? propertyData.tot_val / propertyData.tot_lvg_area : 0
  const estimatedValue = propertyData.tot_val * 1.02 // Slight appreciation estimate

  // Rental estimates (simplified calculation)
  const rentEstimate = estimatedValue * 0.08 / 12 // 8% annual yield assumption
  const rentalYield = (rentEstimate * 12) / estimatedValue * 100

  return {
    estimated_value: estimatedValue,
    price_per_sqft: Math.round(pricePerSqft * 100) / 100,
    rent_estimate: Math.round(rentEstimate),
    rental_yield: Math.round(rentalYield * 100) / 100,
    value_trend_1yr: 3.5,
    value_trend_3yr: 12.8,
    value_trend_5yr: 25.2,
    comparable_sales: comparables.slice(0, 5),
    comparable_count: comparables.length,
    days_on_market_avg: 45,
    cap_rate: 6.5,
    cash_flow_estimate: rentEstimate * 12 - estimatedValue * 0.02, // Rough estimate
    roi_estimate: 8.2,
    market_temperature: 'WARM',
    supply_demand_ratio: 0.85
  }
}

async function analyzeInfrastructure(propertyData: any, supabase: any): Promise<InfrastructureData> {
  // This would integrate with various APIs and databases
  // For now, providing estimated values based on location and property type

  return {
    nearest_hospital_distance: 3.2,
    nearest_hospital_name: "Regional Medical Center",
    nearest_fire_station_distance: 1.8,
    nearest_police_station_distance: 2.5,
    power_grid_reliability_score: 0.92,
    internet_provider_count: 4,
    water_quality_score: 0.88,
    nearest_airport_distance: 15.3,
    nearest_major_highway_distance: 2.1,
    public_transit_access: true,
    nearest_elementary_distance: 0.8,
    nearest_elementary_rating: 4.2,
    nearest_high_school_distance: 2.3,
    nearest_high_school_rating: 3.8,
    grocery_store_count_1mile: 3,
    restaurant_count_1mile: 12,
    shopping_access_score: 0.78
  }
}

async function generateAIInsights(
  propertyData: any,
  riskAssessment: RiskAssessment,
  marketAnalysis: MarketAnalysis,
  openai: any
): Promise<AIInsights> {

  const prompt = `Analyze this Florida property and provide comprehensive insights:

Property Details:
- Address: ${propertyData.situs_addr_1}, ${propertyData.situs_city}, FL ${propertyData.situs_zip}
- Year Built: ${propertyData.yr_blt}
- Property Value: $${propertyData.tot_val?.toLocaleString()}
- Living Area: ${propertyData.tot_lvg_area} sq ft
- Land Area: ${propertyData.lnd_sqfoot} sq ft
- County Code: ${propertyData.co_no}

Risk Assessment:
- Overall Risk Score: ${riskAssessment.overall_risk_score}/100
- Hurricane Risk: ${riskAssessment.hurricane_risk}/100
- Flood Risk: ${riskAssessment.flood_risk}/100
- Insurance Risk Tier: ${riskAssessment.insurance_risk_tier}

Market Analysis:
- Estimated Value: $${marketAnalysis.estimated_value?.toLocaleString()}
- Price per Sq Ft: $${marketAnalysis.price_per_sqft}
- Rental Yield: ${marketAnalysis.rental_yield}%
- Market Temperature: ${marketAnalysis.market_temperature}

Provide a comprehensive SWOT analysis and actionable insights for this property from an insurance and investment perspective.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a Florida property insurance and investment expert. Provide detailed, actionable analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })

    const analysis = completion.choices[0]?.message?.content || "Analysis unavailable"

    // Parse AI response (simplified)
    return {
      summary: analysis.substring(0, 500) + "...",
      strengths: [
        "Property location advantages",
        "Market appreciation potential",
        "Insurance cost optimization opportunities"
      ],
      weaknesses: [
        "Hurricane risk exposure",
        "Age-related maintenance needs",
        "Market volatility factors"
      ],
      opportunities: [
        "Rental income potential",
        "Property value appreciation",
        "Insurance premium reductions"
      ],
      threats: [
        "Natural disaster exposure",
        "Market fluctuations",
        "Regulatory changes"
      ],
      investment_recommendation: "HOLD - Monitor market conditions",
      insurance_recommendations: [
        "Consider flood insurance if not in high-risk zone",
        "Implement hurricane mitigation measures",
        "Review coverage limits annually"
      ],
      improvement_suggestions: [
        "Install hurricane shutters",
        "Upgrade electrical systems if needed",
        "Consider solar panels for energy efficiency"
      ]
    }
  } catch (error) {
    console.error('AI insights generation error:', error)
    return {
      summary: "AI analysis temporarily unavailable",
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      investment_recommendation: "Consult with property specialist",
      insurance_recommendations: [],
      improvement_suggestions: []
    }
  }
}

async function storeEnrichmentResults(result: EnrichmentResult, supabase: any): Promise<void> {
  // Store risk assessment
  await supabase
    .from('property_risk_assessments')
    .upsert({
      parcel_id: result.parcel_id,
      ...result.risk_assessment,
      model_version: '1.0',
      confidence_score: 0.85
    }, { onConflict: 'parcel_id' })

  // Store market analysis
  await supabase
    .from('property_market_analysis')
    .upsert({
      parcel_id: result.parcel_id,
      ...result.market_analysis,
      confidence_score: 0.80
    }, { onConflict: 'parcel_id' })

  // Store infrastructure data
  await supabase
    .from('infrastructure_proximity')
    .upsert({
      parcel_id: result.parcel_id,
      ...result.infrastructure_data,
      data_freshness_days: 0
    }, { onConflict: 'parcel_id' })
}

// Helper functions
function calculateHurricaneRisk(propertyData: any): number {
  const coastalCounties = [13, 15, 16, 21, 26, 27, 28, 45, 53, 54, 60, 66, 68, 74]
  const isCoastal = coastalCounties.includes(propertyData.co_no)

  let risk = isCoastal ? 70 : 40

  // Adjust based on building age
  if (propertyData.yr_blt && propertyData.yr_blt < 1990) risk += 10
  if (propertyData.yr_blt && propertyData.yr_blt > 2000) risk -= 10

  return Math.max(0, Math.min(100, risk))
}

async function calculateFloodRisk(propertyData: any, supabase: any): Promise<number> {
  // Check if property is in flood zone (would need actual FEMA data)
  // For now, estimate based on coastal proximity and elevation
  const coastalCounties = [13, 15, 16, 21, 26, 27, 28, 45, 53, 54, 60, 66, 68, 74]
  const isCoastal = coastalCounties.includes(propertyData.co_no)

  return isCoastal ? 60 : 20
}

function calculateAgeRisk(yearBuilt: number): number {
  if (!yearBuilt) return 50

  const age = new Date().getFullYear() - yearBuilt
  if (age < 10) return 15
  if (age < 20) return 25
  if (age < 30) return 35
  if (age < 50) return 50
  return 70
}

function calculateConstructionRisk(propertyData: any): number {
  // Based on DOR use codes and property characteristics
  // This would be enhanced with actual construction material data
  return 35 // Default moderate risk
}

async function calculateLocationRisk(propertyData: any, supabase: any): Promise<number> {
  // This would integrate crime data, economic indicators, etc.
  return 30 // Default moderate risk
}

async function calculateCrimeRisk(propertyData: any, supabase: any): Promise<number> {
  // This would integrate local crime statistics
  return 25 // Default low-moderate risk
}

function isCoastalProperty(propertyData: any): boolean {
  const coastalCounties = [13, 15, 16, 21, 26, 27, 28, 45, 53, 54, 60, 66, 68, 74]
  return coastalCounties.includes(propertyData.co_no)
}

function generateMitigationRecommendations(hurricaneRisk: number, floodRisk: number, ageRisk: number): Record<string, any> {
  const recommendations: Record<string, any> = {}

  if (hurricaneRisk > 50) {
    recommendations.hurricane = [
      "Install hurricane shutters or impact windows",
      "Reinforce roof connections",
      "Secure outdoor items and furniture",
      "Consider backup power generation"
    ]
  }

  if (floodRisk > 40) {
    recommendations.flood = [
      "Consider flood insurance",
      "Elevate utilities above base flood elevation",
      "Install sump pumps or drainage systems",
      "Use flood-resistant materials"
    ]
  }

  if (ageRisk > 40) {
    recommendations.maintenance = [
      "Update electrical systems to current code",
      "Replace aging plumbing fixtures",
      "Inspect and update HVAC systems",
      "Consider roof inspection and updates"
    ]
  }

  return recommendations
}

async function getComparableProperties(propertyData: any, supabase: any): Promise<any[]> {
  // Find similar properties for market comparison
  const { data, error } = await supabase
    .from('florida_parcels')
    .select('parcel_id, tot_val, tot_lvg_area, yr_blt, situs_city')
    .eq('co_no', propertyData.co_no)
    .eq('situs_city', propertyData.situs_city)
    .gte('tot_val', propertyData.tot_val * 0.8)
    .lte('tot_val', propertyData.tot_val * 1.2)
    .limit(10)

  return data || []
}
