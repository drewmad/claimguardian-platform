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

    console.log('Testing single parcel insertion')

    // Fetch one parcel from FDOT
    const fdotUrl = 'https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer/44/query'
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'json',
      resultOffset: '100',
      resultRecordCount: '1',
      returnGeometry: 'true',
      outSR: '4326'
    })

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

    console.log('FDOT parcel:', attributes.PARCEL_ID || attributes.PARCELNO)

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

    const record = {
      id: crypto.randomUUID(),
      parcel_id: attributes.PARCEL_ID || attributes.PARCELNO,
      county_fips: '087', // Monroe County
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
      raw_data: { ...attributes, source_metadata: { county: 'MONROE', layer: 44 } },
      data_source: 'FDOT',
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    console.log('Attempting to insert parcel:', record.parcel_id)

    // Try to insert the record
    const { data, error } = await supabase
      .from('parcels')
      .upsert(record, {
        onConflict: 'parcel_id',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({
        error: error.message,
        details: error,
        record: record
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    return new Response(JSON.stringify({
      success: true,
      data: data,
      record: record
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
