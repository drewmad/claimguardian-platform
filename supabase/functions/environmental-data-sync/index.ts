import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get all active Florida counties for data sync
    const { data: counties } = await supabase
      .from('fl_parcels')
      .select('county_fips, county_name')
      .not('county_fips', 'is', null)
      .limit(10) // Limit for demo

    const uniqueCounties = [...new Set(counties?.map(c => c.county_fips) || [])]
    
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", message: `Starting environmental data sync for ${uniqueCounties.length} counties` }))

    const syncResults = {
      counties: uniqueCounties.length,
      hazardsUpdated: 0,
      sensorsUpdated: 0,
      errors: []
    }

    // Process each county
    for (const countyFips of uniqueCounties) {
      try {
        // Mock hazard data fetch
        const hazardData = [
          {
            type: 'flood',
            geometry: { type: 'Polygon', coordinates: [[[-80.1, 25.7], [-80.2, 25.7], [-80.2, 25.8], [-80.1, 25.8], [-80.1, 25.7]]] },
            severity: 'moderate',
            femaData: { zone: 'AE', elevation: 9 },
            noaaData: { surge_height: 6 }
          },
          {
            type: 'wind',
            geometry: { type: 'Polygon', coordinates: [[[-80.15, 25.75], [-80.25, 25.75], [-80.25, 25.85], [-80.15, 25.85], [-80.15, 25.75]]] },
            severity: 'high',
            femaData: {},
            noaaData: { wind_speed: 120 }
          }
        ]
        
        // Update environmental hazards with AI analysis
        for (const hazard of hazardData) {
          // Mock AI analysis
          const aiAnalysis = {
            severity: hazard.severity,
            embedding: new Array(512).fill(0).map(() => Math.random()),
            probabilities: {
              annual_occurrence: 0.05,
              impact_severity: 0.7
            },
            confidence: 0.85
          }
          
          await supabase
            .from('environmental_hazards_ai')
            .upsert({
              hazard_type: hazard.type,
              area_geometry: hazard.geometry,
              severity_level: aiAnalysis.severity,
              risk_embedding: aiAnalysis.embedding,
              probability_scores: aiAnalysis.probabilities,
              fema_data: hazard.femaData,
              noaa_data: hazard.noaaData,
              ai_processing_version: 'v1.0',
              last_ai_update: new Date().toISOString(),
              model_confidence: aiAnalysis.confidence
            })
        }
        
        syncResults.hazardsUpdated += hazardData.length

        // Mock sensor data
        const sensorData = [
          {
            id: `sensor_${countyFips}_001`,
            type: 'weather',
            location: { type: 'Point', coordinates: [-80.19, 25.76] },
            latestReading: { temperature: 78, humidity: 65, pressure: 1013 },
            timestamp: new Date().toISOString()
          }
        ]
        
        for (const sensor of sensorData) {
          // Mock AI insights
          const aiInsights = {
            trends: { temperature_trend: 'rising', change_rate: 0.2 },
            anomalies: { detected: false },
            predictions: { next_hour_temp: 79 }
          }
          
          await supabase
            .from('environmental_sensors_ai')
            .upsert({
              sensor_id: sensor.id,
              sensor_type: sensor.type,
              location: sensor.location,
              latest_reading: sensor.latestReading,
              reading_timestamp: sensor.timestamp,
              trend_analysis: aiInsights.trends,
              anomaly_detection: aiInsights.anomalies,
              predictive_modeling: aiInsights.predictions
            })
        }
        
        syncResults.sensorsUpdated += sensorData.length

      } catch (error) {
        syncResults.errors.push({
          county: countyFips,
          error: error.message
        })
      }
    }

    // Trigger AI confidence score updates
    await supabase.rpc('update_ai_confidence_scores')

    return new Response(JSON.stringify({
      success: true,
      data: syncResults
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})