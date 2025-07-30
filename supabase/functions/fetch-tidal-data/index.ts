// supabase/functions/fetch-tidal-data/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// NOAA API endpoint for water levels in Florida, product=water_level, datum=STND (Storm Tide)
const NOAA_API_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_level&application=ClaimGuardian&begin_date=20250730&range=24&station_type=tide&format=json&datum=STND&units=english&time_zone=gmt&state=FL'

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const response = await fetch(NOAA_API_URL)
    if (!response.ok) {
      throw new Error(`NOAA API request failed: ${response.statusText}`)
    }
    const data = await response.json()

    if (!data.data) {
      return new Response(
        JSON.stringify({ message: 'No new tidal data available.' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const stationUpdates = data.data.map((reading: any) => ({
      station_id: reading.station,
      name: reading.name,
      state: 'FL',
      latitude: parseFloat(reading.lat),
      longitude: parseFloat(reading.lon),
      water_level: parseFloat(reading.v),
      unit: 'ft',
      observed_at: new Date(reading.t).toISOString(),
      location: `POINT(${reading.lon} ${reading.lat})`,
    }))

    if (stationUpdates.length > 0) {
      const { error } = await supabase
        .from('tidal_stations')
        .upsert(stationUpdates, { onConflict: 'station_id' })

      if (error) {
        throw error
      }
    }

    return new Response(
      JSON.stringify({ message: `Successfully processed ${stationUpdates.length} tidal station updates.` }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching tidal data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
