/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI-powered parcel lookup and property enrichment using Florida 9.6M dataset"
 * @dependencies ["@supabase/supabase-js", "@claimguardian/utils"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context properties
 * @supabase-integration database
 * @florida-specific true
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger/production-logger'
import { toError } from '@claimguardian/utils'

export interface ParcelSearchParams {
  address?: string
  county?: string
  owner?: string
  parcelId?: string
  limit?: number
}

export interface ParcelData {
  parcel_id: string
  own_name: string
  phy_addr1: string
  phy_city: string
  county_fips: string
  lnd_val: number
  imp_val: number
  del_val: number
  yr_blt: number
  act_yr_blt: number
  no_bdrm: number
  no_bath: number
  tot_lvg_area: number
  geometry?: unknown
}

/**
 * Search Florida parcels by various criteria
 * Uses service role access to bypass RLS
 */
export async function searchParcels(params: ParcelSearchParams) {
  try {
    const supabase = await createClient()
    
    logger.info('[PARCEL SEARCH] Starting search with params:', params)
    
    let query = supabase
      .from('florida_parcels')
      .select(`
        parcel_id,
        own_name,
        phy_addr1,
        phy_city,
        county_fips,
        lnd_val,
        imp_val,
        del_val,
        yr_blt,
        act_yr_blt,
        no_bdrm,
        no_bath,
        tot_lvg_area
      `)
      .limit(params.limit || 10)
    
    // Apply filters based on search parameters
    if (params.address) {
      query = query.ilike('phy_addr1', `%${params.address}%`)
    }
    
    if (params.county) {
      query = query.eq('county_fips', params.county)
    }
    
    if (params.owner) {
      query = query.ilike('own_name', `%${params.owner}%`)
    }
    
    if (params.parcelId) {
      query = query.eq('parcel_id', params.parcelId)
    }
    
    const { data, error } = await query
    
    if (error) {
      logger.error('[PARCEL SEARCH] Database error:', error)
      throw error
    }
    
    logger.info(`[PARCEL SEARCH] Found ${data?.length || 0} parcels`)
    
    return { data: data as ParcelData[], error: null }
  } catch (error) {
    logger.error('[PARCEL SEARCH] Error:', toError(error))
    return { data: null, error: error as Error }
  }
}

/**
 * Get parcel details by specific parcel ID
 */
export async function getParcelDetails(parcelId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('florida_parcels')
      .select('*')
      .eq('parcel_id', parcelId)
      .single()
    
    if (error) throw error
    
    return { data: data as ParcelData, error: null }
  } catch (error) {
    logger.error('[PARCEL DETAILS] Error:', toError(error))
    return { data: null, error: error as Error }
  }
}

/**
 * Get county statistics
 */
export async function getCountyStats(countyFips: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .rpc('get_county_statistics', { county_fips: countyFips })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    logger.error('[COUNTY STATS] Error:', toError(error))
    return { data: null, error: error as Error }
  }
}

/**
 * AI-powered property risk assessment
 */
export async function assessPropertyRisk(parcelId: string) {
  try {
    const parcelResult = await getParcelDetails(parcelId)
    if (parcelResult.error || !parcelResult.data) {
      throw new Error('Parcel not found')
    }
    
    const parcel = parcelResult.data
    
    // AI risk analysis based on parcel data
    const riskFactors: RiskFactors = {
      floodRisk: calculateFloodRisk(parcel.county_fips),
      hurricaneRisk: calculateHurricaneRisk(parcel.county_fips),
      ageRisk: calculateAgeRisk(parcel.yr_blt || parcel.act_yr_blt),
      valueRisk: calculateValueRisk((parcel.lnd_val || 0) + (parcel.imp_val || 0)),
      locationRisk: calculateLocationRisk(parcel.phy_city)
    }
    
    const overallRisk = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / 5
    
    return {
      data: {
        parcelId,
        riskFactors,
        overallRisk: Math.round(overallRisk * 100) / 100,
        recommendations: generateRiskRecommendations(riskFactors)
      },
      error: null
    }
  } catch (error) {
    logger.error('[RISK ASSESSMENT] Error:', toError(error))
    return { data: null, error: error as Error }
  }
}

// Helper functions for risk calculation
function calculateFloodRisk(countyFips: string): number {
  // Florida coastal counties have higher flood risk
  const coastalCounties = ['12015', '12071', '12081', '12103', '12057']
  return coastalCounties.includes(countyFips) ? 0.8 : 0.4
}

function calculateHurricaneRisk(countyFips: string): number {
  // All Florida counties have hurricane risk, coastal higher
  const coastalCounties = ['12015', '12071', '12081', '12103', '12057']
  return coastalCounties.includes(countyFips) ? 0.9 : 0.7
}

function calculateAgeRisk(yearBuilt: number): number {
  if (!yearBuilt) return 0.5
  const currentYear = new Date().getFullYear()
  const age = currentYear - yearBuilt
  
  if (age > 50) return 0.8
  if (age > 30) return 0.6
  if (age > 20) return 0.4
  return 0.2
}

function calculateValueRisk(totalValue: number): number {
  if (!totalValue) return 0.5
  
  // Higher value properties have higher risk exposure
  if (totalValue > 1000000) return 0.8
  if (totalValue > 500000) return 0.6
  if (totalValue > 250000) return 0.4
  return 0.2
}

function calculateLocationRisk(city: string): number {
  // Coastal cities have higher location risk
  const coastalCities = ['NAPLES', 'FORT MYERS', 'SARASOTA', 'ST PETERSBURG', 'TAMPA']
  return coastalCities.some(coastal => city?.toUpperCase().includes(coastal)) ? 0.7 : 0.3
}

interface RiskFactors {
  floodRisk: number
  hurricaneRisk: number
  ageRisk: number
  valueRisk: number
  locationRisk: number
}

function generateRiskRecommendations(riskFactors: RiskFactors): string[] {
  const recommendations = []
  
  if (riskFactors.floodRisk > 0.6) {
    recommendations.push('Consider flood insurance coverage')
    recommendations.push('Evaluate flood mitigation measures')
  }
  
  if (riskFactors.hurricaneRisk > 0.7) {
    recommendations.push('Ensure hurricane shutters or impact windows')
    recommendations.push('Review windstorm coverage limits')
  }
  
  if (riskFactors.ageRisk > 0.6) {
    recommendations.push('Schedule comprehensive property inspection')
    recommendations.push('Consider electrical and plumbing upgrades')
  }
  
  if (riskFactors.valueRisk > 0.6) {
    recommendations.push('Review coverage limits for adequate protection')
    recommendations.push('Consider umbrella insurance policy')
  }
  
  return recommendations
}