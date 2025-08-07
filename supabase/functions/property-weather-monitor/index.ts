import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

/**
 * Property Weather Monitor
 * Monitors all properties for severe weather conditions and sends real-time alerts
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyAlert {
  property_id: string
  user_id: string
  alert_type: string
  severity: string
  conditions: any
  distance_from_event: number
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
    const { action } = await req.json().catch(() => ({ action: 'monitor-all' }))
    console.log(`Property Weather Monitor: ${action}`)

    switch (action) {
      case 'monitor-all':
        return await monitorAllProperties(supabase)
      case 'check-property':
        const { property_id } = await req.json()
        return await checkSingleProperty(supabase, property_id)
      case 'generate-alerts':
        return await generateWeatherAlerts(supabase)
      default:
        return await monitorAllProperties(supabase)
    }
  } catch (error) {
    console.error('Property Weather Monitor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function monitorAllProperties(supabase: any) {
  console.log('Monitoring all properties for severe weather...')
  
  // Get all active properties with coordinates
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select(`
      id,
      user_id,
      full_address,
      latitude,
      longitude,
      location
    `)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (propError) {
    console.error('Error fetching properties:', propError)
    throw propError
  }

  console.log(`Found ${properties.length} properties to monitor`)

  const alerts = []
  const processedProperties = []

  for (const property of properties) {
    try {
      const propertyAlerts = await checkPropertyWeatherConditions(supabase, property)
      alerts.push(...propertyAlerts)
      processedProperties.push({
        property_id: property.id,
        address: property.full_address,
        alerts_generated: propertyAlerts.length
      })
    } catch (error) {
      console.error(`Error checking property ${property.id}:`, error)
    }
  }

  // Store alerts in database
  if (alerts.length > 0) {
    const { error: insertError } = await supabase
      .from('property_weather_alerts')
      .insert(alerts)

    if (insertError) {
      console.error('Error inserting alerts:', insertError)
    } else {
      console.log(`Generated ${alerts.length} weather alerts`)
    }

    // Send real-time notifications
    for (const alert of alerts) {
      await supabase
        .channel('property-alerts')
        .send({
          type: 'broadcast',
          event: 'weather-alert',
          payload: alert
        })
    }
  }

  // Log monitoring activity
  await supabase
    .from('noaa_ingestion_logs')
    .insert({
      data_type: 'property_monitoring',
      severity_level: alerts.length > 0 ? 'elevated' : 'normal',
      records_processed: properties.length,
      metadata: {
        alerts_generated: alerts.length,
        properties_processed: processedProperties
      }
    })

  return new Response(
    JSON.stringify({
      success: true,
      properties_monitored: properties.length,
      alerts_generated: alerts.length,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkPropertyWeatherConditions(supabase: any, property: any): Promise<PropertyAlert[]> {
  const alerts: PropertyAlert[] = []
  const lat = property.latitude
  const lon = property.longitude

  // 1. Check for active storm warnings/watches
  const { data: stormAlerts } = await supabase
    .rpc('is_property_in_alert_zone', {
      property_lat: lat,
      property_lon: lon
    })

  if (stormAlerts && stormAlerts.length > 0) {
    for (const alert of stormAlerts) {
      alerts.push({
        property_id: property.id,
        user_id: property.user_id,
        alert_type: 'storm_warning',
        severity: alert.severity?.toLowerCase() || 'moderate',
        conditions: {
          event_type: alert.event_type,
          headline: alert.headline,
          expires: alert.expires
        },
        distance_from_event: 0
      })
    }
  }

  // 2. Check for high winds at nearby stations
  const { data: nearbyStations } = await supabase
    .rpc('find_nearest_weather_station', {
      user_lat: lat,
      user_lon: lon,
      max_distance_km: 50
    })

  if (nearbyStations && nearbyStations.length > 0) {
    // Get recent observations from nearest stations
    const stationIds = nearbyStations.slice(0, 3).map(s => s.station_id)
    
    const { data: observations } = await supabase
      .from('noaa_weather_observations')
      .select('*')
      .in('station_id', stationIds)
      .gte('observation_time', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order('observation_time', { ascending: false })

    if (observations) {
      for (const obs of observations) {
        const windSpeed = obs.wind_speed || 0
        const windGust = obs.wind_gust || 0
        
        // High wind alert
        if (windSpeed > 25 || windGust > 35) {
          alerts.push({
            property_id: property.id,
            user_id: property.user_id,
            alert_type: 'high_winds',
            severity: windSpeed > 35 || windGust > 50 ? 'severe' : 'moderate',
            conditions: {
              wind_speed: windSpeed,
              wind_gust: windGust,
              station_id: obs.station_id,
              observation_time: obs.observation_time
            },
            distance_from_event: nearbyStations.find(s => s.station_id === obs.station_id)?.distance_km || 0
          })
        }
      }
    }
  }

  // 3. Check for lightning strikes nearby
  const { data: lightningStrikes } = await supabase
    .from('noaa_lightning_strikes')
    .select('*')
    .gte('detection_time', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 minutes

  if (lightningStrikes) {
    // Count strikes within different radii
    let nearbyStrikes = 0
    let closeStrikes = 0
    
    for (const strike of lightningStrikes) {
      if (strike.latitude && strike.longitude) {
        const distance = calculateDistance(lat, lon, strike.latitude, strike.longitude)
        
        if (distance < 10) { // Within 10km
          nearbyStrikes++
          if (distance < 3) { // Within 3km
            closeStrikes++
          }
        }
      }
    }
    
    if (closeStrikes > 0 || nearbyStrikes > 5) {
      alerts.push({
        property_id: property.id,
        user_id: property.user_id,
        alert_type: 'lightning_activity',
        severity: closeStrikes > 0 ? 'severe' : 'moderate',
        conditions: {
          close_strikes: closeStrikes,
          nearby_strikes: nearbyStrikes,
          time_period: '30 minutes'
        },
        distance_from_event: closeStrikes > 0 ? 0 : 5 // Approximate
      })
    }
  }

  // 4. Check for coastal flooding (if near coast)
  const { data: tideData } = await supabase
    .from('noaa_tide_and_current_data')
    .select('*')
    .gte('observation_time', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
    .order('observation_time', { ascending: false })
    .limit(10)

  if (tideData) {
    for (const tide of tideData) {
      // Check if property is near this tide station (rough approximation)
      if (tide.water_level > 3.0) { // High water level threshold
        alerts.push({
          property_id: property.id,
          user_id: property.user_id,
          alert_type: 'coastal_flooding',
          severity: tide.water_level > 4.0 ? 'severe' : 'moderate',
          conditions: {
            water_level: tide.water_level,
            station_name: tide.station_name,
            observation_time: tide.observation_time
          },
          distance_from_event: 20 // Approximate for coastal properties
        })
      }
    }
  }

  return alerts
}

async function checkSingleProperty(supabase: any, propertyId: string) {
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (error || !property) {
    throw new Error('Property not found')
  }

  const alerts = await checkPropertyWeatherConditions(supabase, property)
  
  return new Response(
    JSON.stringify({
      property_id: propertyId,
      alerts,
      alert_count: alerts.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateWeatherAlerts(supabase: any) {
  // Get all unresolved alerts for notification
  const { data: alerts, error } = await supabase
    .from('property_weather_alerts')
    .select(`
      *,
      properties!inner(full_address, user_id)
    `)
    .eq('resolved', false)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (error) {
    throw error
  }

  console.log(`Found ${alerts.length} active weather alerts`)

  // Group alerts by user for batching
  const userAlerts = alerts.reduce((acc, alert) => {
    const userId = alert.user_id
    if (!acc[userId]) {
      acc[userId] = []
    }
    acc[userId].push(alert)
    return acc
  }, {})

  // Send notifications (placeholder - would integrate with email/SMS service)
  const notifications = []
  for (const [userId, userAlertList] of Object.entries(userAlerts)) {
    notifications.push({
      user_id: userId,
      alert_count: userAlertList.length,
      most_severe: userAlertList.reduce((max, alert) => 
        alert.severity === 'severe' ? alert : max, userAlertList[0]
      )
    })
  }

  return new Response(
    JSON.stringify({
      alerts_processed: alerts.length,
      users_notified: notifications.length,
      notifications
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}