// supabase/functions/fetch-disaster-alerts/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const NWS_API_URL = 'https://api.weather.gov/alerts/active?area=FL'

// Helper to convert GeoJSON geometry to WKT for PostGIS
function toWkt(geoJson: any): string | null {
  if (!geoJson || !geoJson.coordinates) {
    return null
  }

  const type = geoJson.type.toUpperCase()
  const coords = geoJson.coordinates

  switch (type) {
    case 'POLYGON':
      return `POLYGON((${coords[0].map((p: number[]) => p.join(' ')).join(',')}))`
    case 'MULTIPOLYGON':
      return `MULTIPOLYGON(${coords.map((poly: any) => `((${poly[0].map((p: number[]) => p.join(' ')).join(',')}))`).join(',')})`
    default:
      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Unsupported geometry type: ${type}`
      }));
      return null
  }
}

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const response = await fetch(NWS_API_URL, {
      headers: { 'User-Agent': 'ClaimGuardian/1.0' }
    })
    if (!response.ok) {
      throw new Error(`NWS API request failed: ${response.statusText}`)
    }
    const data = await response.json()

    const alerts = data.features.map((alert: any) => {
      const props = alert.properties
      const geometryWkt = toWkt(alert.geometry)

      return {
        event_id: props.id,
        type: props.event,
        severity: props.severity,
        status: props.status,
        headline: props.headline,
        description: props.description,
        instruction: props.instruction,
        effective_at: props.effective,
        expires_at: props.expires,
        sender_name: props.senderName,
        affected_geography: geometryWkt,
      }
    }).filter((alert: any) => alert.affected_geography !== null) // Filter out alerts with unsupported geometry

    if (alerts.length > 0) {
      const { error } = await supabase
        .from('disaster_events')
        .upsert(alerts, { onConflict: 'event_id' })

      if (error) {
        throw error
      }
    }

    return new Response(
      JSON.stringify({ message: `Successfully processed ${alerts.length} alerts.` }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Error fetching disaster alerts:', error
}));
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
