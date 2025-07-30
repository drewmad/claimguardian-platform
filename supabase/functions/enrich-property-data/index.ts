import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EnrichmentRequest {
  propertyId: string
  latitude: number
  longitude: number
  address: string
  placeId?: string
}

serve(async (req) => {
  try {
    const { propertyId, latitude, longitude, address, placeId } = await req.json() as EnrichmentRequest

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check for existing current enrichment
    const { data: currentEnrichment } = await supabase
      .from('property_enrichments')
      .select('version, enriched_at')
      .eq('property_id', propertyId)
      .eq('is_current', true)
      .single()

    // Don't re-enrich if done in last 24 hours
    if (currentEnrichment?.enriched_at) {
      const enrichedDate = new Date(currentEnrichment.enriched_at)
      const hoursSinceEnrichment = (Date.now() - enrichedDate.getTime()) / (1000 * 60 * 60)
      if (hoursSinceEnrichment < 24) {
        return new Response(
          JSON.stringify({ message: 'Property recently enriched', data: currentEnrichment }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const newVersion = currentEnrichment ? currentEnrichment.version + 1 : 1

    // Parallel API calls for maximum efficiency
    const [
      geocodeData,
      elevationData,
      streetViewData,
      aerialData,
      nearbyData
    ] = await Promise.all([
      fetchReverseGeocode(latitude, longitude),
      fetchElevation(latitude, longitude),
      fetchStreetViewImages(latitude, longitude),
      fetchAerialImagery(latitude, longitude),
      fetchNearbyEmergencyServices(latitude, longitude)
    ])

    // Calculate derived fields
    const floodRisk = calculateFloodRisk(elevationData.elevation)
    const insuranceFactors = calculateInsuranceRiskFactors({
      elevation: elevationData,
      fireStation: nearbyData.fireStation,
      coastDistance: nearbyData.coastDistance,
      hurricaneZone: getHurricaneZone(nearbyData.coastDistance)
    })

    // Prepare enrichment data
    const enrichmentData = {
      property_id: propertyId,
      version: newVersion,
      is_current: true,
      
      // Location data
      plus_code: geocodeData.plus_code?.global_code,
      neighborhood: geocodeData.neighborhood,
      census_tract: geocodeData.census_tract,
      county: geocodeData.county,
      state_code: geocodeData.state_code,
      country_code: 'US',
      formatted_address: geocodeData.formatted_address || address,
      address_components: geocodeData.address_components,
      
      // Elevation
      elevation_meters: elevationData.elevation,
      elevation_resolution: elevationData.resolution,
      flood_zone: floodRisk.zone,
      flood_risk_score: floodRisk.score,
      
      // Visual documentation
      street_view_data: streetViewData,
      aerial_view_data: aerialData,
      imagery_captured_at: new Date().toISOString(),
      
      // Emergency services
      fire_protection: nearbyData.fireProtection,
      medical_services: nearbyData.medicalServices,
      police_services: nearbyData.policeServices,
      
      // Risk assessment
      distance_to_coast_meters: nearbyData.coastDistance,
      hurricane_evacuation_zone: nearbyData.hurricaneZone,
      storm_surge_zone: nearbyData.stormSurgeZone,
      wind_zone: getWindZone(geocodeData.county),
      
      // Insurance factors
      insurance_risk_factors: insuranceFactors,
      insurance_territory_code: getFloridaTerritoryCode(geocodeData.county, geocodeData.zip),
      
      // Metadata
      source_apis: {
        geocoding: 'v1',
        elevation: 'v1',
        street_view: 'v1',
        maps_static: 'v1',
        places_nearby: 'v3'
      },
      api_costs: {
        geocoding: 0.005,
        elevation: 0.005,
        street_view: 0.028,
        maps_static: 0.021,
        places_nearby: 0.005,
        total: 0.064
      },
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    }

    // Start transaction
    const { error: updateError } = await supabase.rpc('update_property_enrichment', {
      p_property_id: propertyId,
      p_enrichment_data: enrichmentData,
      p_previous_version: currentEnrichment?.version || 0
    })

    if (updateError) throw updateError

    // Store images in Supabase Storage
    await storePropertyImages(supabase, propertyId, {
      streetView: streetViewData,
      aerial: aerialData
    })

    // Log the enrichment
    await supabase.from('enrichment_audit_log').insert({
      property_id: propertyId,
      action: newVersion === 1 ? 'created' : 'updated',
      previous_version: currentEnrichment?.version || null,
      new_version: newVersion,
      api_calls_made: Object.keys(enrichmentData.source_apis),
      total_cost: 0.064,
      reason: 'Property enrichment from onboarding'
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        version: newVersion,
        cost: 0.064,
        data: enrichmentData 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Enrichment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// API Functions

async function fetchReverseGeocode(lat: number, lng: number) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`
  )
  const data = await response.json()
  
  if (!data.results?.[0]) throw new Error('Geocoding failed')
  
  const result = data.results[0]
  const components = result.address_components
  
  return {
    formatted_address: result.formatted_address,
    plus_code: data.plus_code,
    address_components: components,
    neighborhood: findComponent(components, 'neighborhood'),
    census_tract: findComponent(components, 'neighborhood'), // Approximate
    county: findComponent(components, 'administrative_area_level_2'),
    state_code: findComponent(components, 'administrative_area_level_1', true),
    zip: findComponent(components, 'postal_code')
  }
}

async function fetchElevation(lat: number, lng: number) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`
  )
  const data = await response.json()
  
  return {
    elevation: data.results[0].elevation,
    resolution: data.results[0].resolution
  }
}

async function fetchStreetViewImages(lat: number, lng: number) {
  const baseUrl = 'https://maps.googleapis.com/maps/api/streetview'
  const size = '640x640'
  const fov = 90
  
  // Check metadata first
  const metadataResponse = await fetch(
    `${baseUrl}/metadata?location=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`
  )
  const metadata = await metadataResponse.json()
  
  if (metadata.status !== 'OK') {
    return { available: false }
  }
  
  const images = {}
  const headings = { north: 0, east: 90, south: 180, west: 270 }
  
  for (const [direction, heading] of Object.entries(headings)) {
    images[direction] = {
      url: `${baseUrl}?size=${size}&location=${lat},${lng}&heading=${heading}&fov=${fov}&key=${GOOGLE_MAPS_KEY}`,
      pano_id: metadata.pano_id,
      date: metadata.date
    }
  }
  
  return images
}

async function fetchAerialImagery(lat: number, lng: number) {
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
  const size = '640x640'
  
  return {
    zoom_15: `${baseUrl}?center=${lat},${lng}&zoom=15&size=${size}&maptype=satellite&key=${GOOGLE_MAPS_KEY}`,
    zoom_18: `${baseUrl}?center=${lat},${lng}&zoom=18&size=${size}&maptype=satellite&key=${GOOGLE_MAPS_KEY}`,
    zoom_20: `${baseUrl}?center=${lat},${lng}&zoom=20&size=${size}&maptype=satellite&key=${GOOGLE_MAPS_KEY}`
  }
}

async function fetchNearbyEmergencyServices(lat: number, lng: number) {
  const types = ['fire_station', 'hospital', 'police']
  const radius = 5000 // 5km
  
  const results = await Promise.all(types.map(async (type) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_KEY}`
    )
    const data = await response.json()
    return { type, results: data.results }
  }))
  
  // Calculate distances to coast (simplified - would use actual coastline data)
  const coastDistance = calculateDistanceToCoast(lat, lng)
  
  return {
    fireStation: processNearbyResult(results.find(r => r.type === 'fire_station')),
    hospital: processNearbyResult(results.find(r => r.type === 'hospital')),
    police: processNearbyResult(results.find(r => r.type === 'police')),
    coastDistance,
    hurricaneZone: getHurricaneZone(coastDistance),
    stormSurgeZone: getStormSurgeZone(coastDistance),
    fireProtection: {
      nearest_station: processNearbyResult(results.find(r => r.type === 'fire_station')),
      protection_class: calculateProtectionClass(results.find(r => r.type === 'fire_station'))
    },
    medicalServices: {
      nearest_hospital: processNearbyResult(results.find(r => r.type === 'hospital'))
    },
    policeServices: {
      nearest_station: processNearbyResult(results.find(r => r.type === 'police'))
    }
  }
}

// Helper functions

function findComponent(components: any[], type: string, short = false) {
  const component = components.find(c => c.types.includes(type))
  return component ? (short ? component.short_name : component.long_name) : null
}

function calculateFloodRisk(elevationMeters: number) {
  // Simplified flood risk based on elevation
  if (elevationMeters < 3) return { zone: 'VE', score: 10 } // High velocity
  if (elevationMeters < 5) return { zone: 'AE', score: 8 }  // High risk
  if (elevationMeters < 10) return { zone: 'A', score: 6 }  // Moderate risk
  if (elevationMeters < 15) return { zone: 'X', score: 3 }  // Low risk
  return { zone: 'X', score: 1 } // Minimal risk
}

function calculateDistanceToCoast(lat: number, lng: number) {
  // Simplified - would use actual coastline data
  // This is a rough estimate for Florida
  const floridaEastCoast = -80.0
  const floridaWestCoast = -82.5
  
  const eastDistance = Math.abs(lng - floridaEastCoast) * 111000 // meters per degree
  const westDistance = Math.abs(lng - floridaWestCoast) * 111000
  
  return Math.min(eastDistance, westDistance)
}

function getHurricaneZone(coastDistanceMeters: number) {
  if (coastDistanceMeters < 1000) return 'A'
  if (coastDistanceMeters < 3000) return 'B'
  if (coastDistanceMeters < 5000) return 'C'
  if (coastDistanceMeters < 10000) return 'D'
  if (coastDistanceMeters < 20000) return 'E'
  return 'None'
}

function getStormSurgeZone(coastDistanceMeters: number) {
  if (coastDistanceMeters < 500) return '1'
  if (coastDistanceMeters < 1500) return '2'
  if (coastDistanceMeters < 3000) return '3'
  return 'None'
}

function getWindZone(county: string) {
  // Florida building code wind zones
  const highWindCounties = ['Miami-Dade', 'Broward', 'Monroe']
  return highWindCounties.includes(county) ? '180mph' : '150mph'
}

function getFloridaTerritoryCode(county: string, zip: string) {
  // Simplified - actual territories are complex
  return `FL-${county.substring(0, 3).toUpperCase()}-${zip?.substring(0, 3) || '000'}`
}

function processNearbyResult(result: any) {
  if (!result?.results?.[0]) return null
  
  const place = result.results[0]
  return {
    name: place.name,
    place_id: place.place_id,
    distance_meters: calculateDistance(place.geometry.location),
    address: place.vicinity
  }
}

function calculateDistance(location: any) {
  // Simplified distance calculation
  return Math.round(Math.random() * 5000) // Would use actual calculation
}

function calculateProtectionClass(fireStationResult: any) {
  if (!fireStationResult?.results?.[0]) return 10 // Worst
  
  // Simplified - actual calculation is complex
  const distance = calculateDistance(fireStationResult.results[0].geometry.location)
  if (distance < 1000) return 3
  if (distance < 3000) return 5
  if (distance < 5000) return 7
  return 9
}

function calculateInsuranceRiskFactors(data: any) {
  const fireScore = 10 - data.fireStation?.protection_class || 5
  const floodScore = 10 - (data.elevation?.elevation || 0) / 5
  const windScore = data.coastDistance < 5000 ? 8 : 4
  const overallScore = Math.round((fireScore + floodScore + windScore) / 3)
  
  return {
    fire_score: fireScore,
    flood_score: floodScore,
    wind_score: windScore,
    overall_score: overallScore,
    premium_impact: overallScore > 7 ? 'high' : overallScore > 4 ? 'moderate' : 'low'
  }
}

async function storePropertyImages(supabase: any, propertyId: string, images: any) {
  // Store references to Google URLs
  // In production, would download and store in Supabase Storage
  
  const imageRecords = []
  
  // Street view images
  if (images.streetView.north) {
    for (const [direction, data] of Object.entries(images.streetView)) {
      if (direction !== 'available') {
        imageRecords.push({
          property_id: propertyId,
          image_type: `street_view_${direction}`,
          google_url: data.url,
          metadata: { pano_id: data.pano_id, date: data.date }
        })
      }
    }
  }
  
  // Aerial images
  for (const [zoom, url] of Object.entries(images.aerial)) {
    imageRecords.push({
      property_id: propertyId,
      image_type: `aerial_${zoom}`,
      google_url: url,
      metadata: { zoom_level: zoom.replace('zoom_', '') }
    })
  }
  
  if (imageRecords.length > 0) {
    await supabase.from('property_images').insert(imageRecords)
  }
}