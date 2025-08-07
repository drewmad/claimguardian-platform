import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch one parcel from FDOT
    const fdotUrl = 'https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer/44/query'
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'json',
      resultOffset: '200',  // Skip first 200 to get new data
      resultRecordCount: '1',
      returnGeometry: 'true',
      outSR: '4326'
    })

    console.log('Fetching from FDOT...')
    const fdotResponse = await fetch(`${fdotUrl}?${params}`)
    const fdotData = await fdotResponse.json()

    if (!fdotData.features || fdotData.features.length === 0) {
      return new Response(JSON.stringify({ error: 'No features from FDOT' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const feature = fdotData.features[0]
    const { attributes, geometry } = feature

    // Convert geometry
    let wkt = null
    if (geometry && geometry.rings) {
      const rings = geometry.rings.map((ring: number[][]) =>
        `(${ring.map(coord => `${coord[0]} ${coord[1]}`).join(',')})`
      ).join(',')
      wkt = `SRID=4326;MULTIPOLYGON((${rings}))`
    }

    const propertyAddress = [
      attributes.PHY_ADDR1,
      attributes.PHY_ADDR2,
      attributes.PHY_CITY,
      attributes.PHY_STATE,
      attributes.PHY_ZIPCD
    ].filter(Boolean).join(' ').trim()

    const parcelId = attributes.PARCEL_ID || attributes.PARCELNO
    console.log('Processing parcel:', parcelId)

    // First check if it exists
    const { data: existing } = await supabase
      .from('parcels')
      .select('id')
      .eq('parcel_id', parcelId)
      .maybeSingle()

    let result
    if (existing) {
      console.log('Parcel exists, updating...')
      // Update existing
      const { data, error } = await supabase
        .from('parcels')
        .update({
          county_fips: '087',
          county_name: 'MONROE',
          property_address: propertyAddress || null,
          owner_name: attributes.OWN_NAME || null,
          owner_address: attributes.OWN_ADDR1 || null,
          property_use_code: attributes.DOR_UC || null,
          assessed_value: attributes.JV || null,
          taxable_value: attributes.TV_NSD || null,
          year_built: attributes.ACT_YR_BLT || attributes.EFF_YR_BLT || null,
          living_area: attributes.TOT_LVG_AR || null,
          land_area: attributes.LND_SQFOOT ? attributes.LND_SQFOOT / 43560 : null,
          geom: wkt,
          raw_data: attributes,
          data_source: 'FDOT',
          last_updated: new Date().toISOString()
        })
        .eq('parcel_id', parcelId)
        .select()

      if (error) {
        console.error('Update error:', error)
        return new Response(JSON.stringify({ error: error.message, details: error }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      result = { action: 'updated', data }
    } else {
      console.log('New parcel, inserting...')
      // Insert new
      const { data, error } = await supabase
        .from('parcels')
        .insert({
          id: crypto.randomUUID(),
          parcel_id: parcelId,
          county_fips: '087',
          county_name: 'MONROE',
          property_address: propertyAddress || null,
          owner_name: attributes.OWN_NAME || null,
          owner_address: attributes.OWN_ADDR1 || null,
          property_use_code: attributes.DOR_UC || null,
          assessed_value: attributes.JV || null,
          taxable_value: attributes.TV_NSD || null,
          year_built: attributes.ACT_YR_BLT || attributes.EFF_YR_BLT || null,
          living_area: attributes.TOT_LVG_AR || null,
          land_area: attributes.LND_SQFOOT ? attributes.LND_SQFOOT / 43560 : null,
          geom: wkt,
          raw_data: attributes,
          data_source: 'FDOT',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Insert error:', error)
        return new Response(JSON.stringify({ error: error.message, details: error }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      result = { action: 'inserted', data }
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      parcel_id: parcelId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
