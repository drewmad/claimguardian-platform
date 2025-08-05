'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface ParcelData {
  parcelId: string
  countyName: string
  propertyAddress: string
  ownerName: string
  assessedValue: number
  yearBuilt: number
  livingArea: number
  landArea: number
  geometry?: any
}

export interface RiskAssessment {
  parcelId: string
  floodRiskScore: number
  wildfireRiskScore: number
  windRiskScore: number
  surgeRiskScore: number
  compositeRiskScore: number
  riskFactors: {
    hazardZones: Array<{
      hazardType: string
      category: string
      zoneName: string
      riskWeight: number
    }>
    fireStationDistance: number
    hospitalDistance: number
  }
  assessmentDate: string
}

export interface HazardZone {
  id: string
  hazardType: string
  zoneName: string
  category: string
  riskWeight: number
}

export interface ActiveEvent {
  id: string
  eventType: string
  eventName: string
  status: string
  severity: string
  startTime: string
  geometry?: any
}

/**
 * Search for parcels by address or owner name
 */
export async function searchParcels({
  query,
  county,
  limit = 10
}: {
  query: string
  county?: string
  limit?: number
}): Promise<{ data: ParcelData[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Build the query
    let dbQuery = supabase
      .from('parcels')
      .select(`
        parcel_id,
        county_name,
        property_address,
        owner_name,
        assessed_value,
        year_built,
        living_area,
        land_area
      `)
      .or(`property_address.ilike.%${query}%,owner_name.ilike.%${query}%`)
      .limit(limit)
    
    // Filter by county if provided
    if (county) {
      dbQuery = dbQuery.eq('county_name', county)
    }
    
    const { data, error } = await dbQuery
    
    if (error) {
      logger.error('Error searching parcels:', {}, error instanceof Error ? error : new Error(String(error)))
      return { data: null, error: error.message }
    }
    
    // Map to camelCase
    const parcels: ParcelData[] = (data || []).map(row => ({
      parcelId: row.parcel_id,
      countyName: row.county_name,
      propertyAddress: row.property_address,
      ownerName: row.owner_name,
      assessedValue: row.assessed_value,
      yearBuilt: row.year_built,
      livingArea: row.living_area,
      landArea: row.land_area
    }))
    
    return { data: parcels, error: null }
    
  } catch (error) {
    logger.error('Error in searchParcels:', {}, error instanceof Error ? error : new Error(String(error)))
    return { data: null, error: 'Failed to search parcels' }
  }
}

/**
 * Get parcel details including geometry
 */
export async function getParcelDetails({
  parcelId
}: {
  parcelId: string
}): Promise<{ data: ParcelData | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Use RPC to get parcel with ST_AsGeoJSON
    const { data, error } = await supabase.rpc('get_parcel_with_geojson', {
      p_parcel_id: parcelId
    })
    
    if (error) {
      logger.error('Error getting parcel details:', {}, error instanceof Error ? error : new Error(String(error)))
      return { data: null, error: error.message }
    }
    
    if (!data || data.length === 0) {
      return { data: null, error: 'Parcel not found' }
    }
    
    const row = data[0]
    const parcel: ParcelData = {
      parcelId: row.parcel_id,
      countyName: row.county_name,
      propertyAddress: row.property_address,
      ownerName: row.owner_name,
      assessedValue: row.assessed_value,
      yearBuilt: row.year_built,
      livingArea: row.living_area,
      landArea: row.land_area,
      geometry: row.geom_geojson
    }
    
    return { data: parcel, error: null }
    
  } catch (error) {
    logger.error('Error in getParcelDetails:', {}, error instanceof Error ? error : new Error(String(error)))
    return { data: null, error: 'Failed to get parcel details' }
  }
}

/**
 * Get risk assessment for a parcel
 */
export async function getParcelRiskAssessment({
  parcelId
}: {
  parcelId: string
}): Promise<{ data: RiskAssessment | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get the most recent risk assessment
    const { data, error } = await supabase
      .from('parcel_risk_assessment')
      .select('*')
      .eq('parcel_id', parcelId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') { // Not found error
      logger.error('Error getting risk assessment:', {}, error instanceof Error ? error : new Error(String(error)))
      return { data: null, error: error.message }
    }
    
    let currentData = data
    
    if (!currentData) {
      // Calculate risk assessment on demand
      const { data: calcData, error: calcError } = await supabase.rpc('calculate_and_store_risk_assessment', {
        p_parcel_id: parcelId
      })
      
      if (calcError) {
        logger.error('Error calculating risk assessment:', {}, calcError instanceof Error ? calcError : new Error(String(calcError)))
        return { data: null, error: calcError.message }
      }
      
      // Fetch the newly created assessment
      const { data: newData, error: newError } = await supabase
        .from('parcel_risk_assessment')
        .select('*')
        .eq('parcel_id', parcelId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single()
      
      if (newError || !newData) {
        return { data: null, error: 'Failed to create risk assessment' }
      }
      
      currentData = newData
    }
    const assessment: RiskAssessment = {
      parcelId: currentData.parcel_id,
      floodRiskScore: currentData.flood_risk_score,
      wildfireRiskScore: currentData.wildfire_risk_score,
      windRiskScore: currentData.wind_risk_score,
      surgeRiskScore: currentData.surge_risk_score,
      compositeRiskScore: currentData.composite_risk_score,
      riskFactors: currentData.risk_factors,
      assessmentDate: currentData.assessment_date
    }
    
    return { data: assessment, error: null }
    
  } catch (error) {
    logger.error('Error in getParcelRiskAssessment:', {}, error instanceof Error ? error : new Error(String(error)))
    return { data: null, error: 'Failed to get risk assessment' }
  }
}

/**
 * Get hazard zones affecting a property
 */
export async function getPropertyHazardZones({
  propertyId
}: {
  propertyId: string
}): Promise<{ data: HazardZone[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get property's parcel ID
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('parcel_id')
      .eq('id', propertyId)
      .single()
    
    if (propError || !property?.parcel_id) {
      return { data: null, error: 'Property not found or not linked to parcel' }
    }
    
    // Get hazard zones for the parcel
    const { data, error } = await supabase.rpc('get_parcel_hazard_zones', {
      p_parcel_id: property.parcel_id
    })
    
    if (error) {
      logger.error('Error getting hazard zones:', {}, error instanceof Error ? error : new Error(String(error)))
      return { data: null, error: error.message }
    }
    
    const hazards: HazardZone[] = (data || []).map((zone: any) => ({
      id: zone.id,
      hazardType: zone.hazard_type,
      zoneName: zone.zone_name,
      category: zone.category,
      riskWeight: zone.risk_weight
    }))
    
    return { data: hazards, error: null }
    
  } catch (error) {
    logger.error('Error in getPropertyHazardZones:', {}, error instanceof Error ? error : new Error(String(error)))
    return { data: null, error: 'Failed to get hazard zones' }
  }
}

/**
 * Get active events near a property
 */
export async function getActiveEventsNearProperty({
  propertyId,
  radiusMiles = 10
}: {
  propertyId: string
  radiusMiles?: number
}): Promise<{ data: ActiveEvent[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get property location
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('parcel_id')
      .eq('id', propertyId)
      .single()
    
    if (propError || !property?.parcel_id) {
      return { data: null, error: 'Property not found or not linked to parcel' }
    }
    
    // Get active events within radius
    const { data, error } = await supabase.rpc('get_active_events_near_parcel', {
      p_parcel_id: property.parcel_id,
      p_radius_meters: radiusMiles * 1609.34 // Convert miles to meters
    })
    
    if (error) {
      logger.error('Error getting active events:', {}, error instanceof Error ? error : new Error(String(error)))
      return { data: null, error: error.message }
    }
    
    const events: ActiveEvent[] = (data || []).map((event: any) => ({
      id: event.id,
      eventType: event.event_type,
      eventName: event.event_name,
      status: event.status,
      severity: event.severity,
      startTime: event.start_time,
      geometry: event.geom_geojson
    }))
    
    return { data: events, error: null }
    
  } catch (error) {
    logger.error('Error in getActiveEventsNearProperty:', {}, error instanceof Error ? error : new Error(String(error)))
    return { data: null, error: 'Failed to get active events' }
  }
}

/**
 * Link a property to a parcel
 */
export async function linkPropertyToParcel({
  propertyId,
  parcelId
}: {
  propertyId: string
  parcelId: string
}): Promise<{ data: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const user = await supabase.auth.getUser()
    
    if (!user.data.user) {
      return { data: false, error: 'Not authenticated' }
    }
    
    // Verify property ownership
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('user_id', user.data.user.id)
      .single()
    
    if (propError || !property) {
      return { data: false, error: 'Property not found or access denied' }
    }
    
    // Verify parcel exists
    const { data: parcel, error: parcelError } = await supabase
      .from('parcels')
      .select('parcel_id')
      .eq('parcel_id', parcelId)
      .single()
    
    if (parcelError || !parcel) {
      return { data: false, error: 'Parcel not found' }
    }
    
    // Update property with parcel ID
    const { error: updateError } = await supabase
      .from('properties')
      .update({ parcel_id: parcelId })
      .eq('id', propertyId)
    
    if (updateError) {
      logger.error('Error linking property to parcel:', {}, updateError instanceof Error ? updateError : new Error(String(updateError)))
      return { data: false, error: updateError.message }
    }
    
    // Trigger risk assessment calculation
    await supabase.rpc('calculate_and_store_risk_assessment', {
      p_parcel_id: parcelId
    })
    
    return { data: true, error: null }
    
  } catch (error) {
    logger.error('Error in linkPropertyToParcel:', {}, error instanceof Error ? error : new Error(String(error)))
    return { data: false, error: 'Failed to link property to parcel' }
  }
}

/**
 * Get portfolio risk summary for a user
 */
export async function getPortfolioRiskSummary(): Promise<{
  data: {
    totalProperties: number
    avgCompositeRisk: number
    highRiskProperties: number
    mediumRiskProperties: number
    lowRiskProperties: number
    riskByCategory: {
      flood: number
      wildfire: number
      wind: number
      surge: number
    }
  } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const user = await supabase.auth.getUser()
    
    if (!user.data.user) {
      return { data: null, error: 'Not authenticated' }
    }
    
    const { data, error } = await supabase.rpc('get_user_portfolio_risk_summary', {
      p_user_id: user.data.user.id
    })
    
    if (error) {
      logger.error('Error getting portfolio risk summary:', {}, error instanceof Error ? error : new Error(String(error)))
      return { data: null, error: error.message }
    }
    
    return { data: data[0], error: null }
    
  } catch (error) {
    logger.error('Error in getPortfolioRiskSummary:', {}, error instanceof Error ? error : new Error(String(error)))
    return { data: null, error: 'Failed to get portfolio risk summary' }
  }
}