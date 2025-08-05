import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Charlotte County specific configuration
const CHARLOTTE_LAYER_ID = 8
const CHARLOTTE_FIPS = '12015' // Florida (12) + Charlotte (015)

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://claimguardianai.com' 
    : 'http://localhost:3000',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Parse request body
    const { offset = 0, limit = 100 } = await req.json()
    
    console.log(`Loading Charlotte County parcels - Offset: ${offset}, Limit: ${limit}`)

    // Initialize Supabase with service role for database writes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log operation start
    await supabase
      .from('system_logs')
      .insert({
        level: 'info',
        message: 'Starting Charlotte County parcel load',
        context: { offset, limit }
      })

    // Construct FDOT API URL with correct parameters
    const fdotUrl = new URL(`https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer/${CHARLOTTE_LAYER_ID}/query`)
    
    // Use supported parameters
    fdotUrl.searchParams.set('where', '1=1')
    fdotUrl.searchParams.set('outFields', '*')
    fdotUrl.searchParams.set('f', 'json') // JSON format (not geojson)
    fdotUrl.searchParams.set('resultOffset', offset.toString())
    fdotUrl.searchParams.set('resultRecordCount', limit.toString())
    fdotUrl.searchParams.set('returnGeometry', 'true')
    fdotUrl.searchParams.set('outSR', '4326') // WGS84 for PostGIS

    console.log('Fetching from:', fdotUrl.toString())

    // Fetch data from FDOT
    const response = await fetch(fdotUrl)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`FDOT API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`Received ${data.features?.length || 0} features`)

    if (!data.features || data.features.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 0, 
        errors: 0,
        hasMore: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let processed = 0
    let errors = 0
    const errorDetails = []

    // Process each feature
    for (const feature of data.features) {
      try {
        const { attributes, geometry } = feature
        
        // Convert Esri geometry to PostGIS WKT
        let wkt = null
        if (geometry && geometry.rings) {
          // Handle single vs multi polygon
          if (geometry.rings.length === 1) {
            const ring = geometry.rings[0]
            const coords = ring.map(pt => `${pt[0]} ${pt[1]}`).join(',')
            wkt = `SRID=4326;POLYGON((${coords}))`
          } else {
            const polygons = geometry.rings.map(ring => {
              const coords = ring.map(pt => `${pt[0]} ${pt[1]}`).join(',')
              return `(${coords})`
            }).join(',')
            wkt = `SRID=4326;MULTIPOLYGON((${polygons}))`
          }
        }

        // Map FDOT fields to our schema (based on analysis)
        const parcelRecord = {
          id: crypto.randomUUID(),
          parcel_id: attributes.PARCELNO || attributes.PARCEL_ID,
          county_fips: CHARLOTTE_FIPS,
          county_name: 'CHARLOTTE',
          // Address fields - use fallback chain
          property_address: attributes.SITEADDRESS || attributes.PHY_ADDR1 || null,
          owner_name: attributes.OWN_NAME || attributes.OWNERNAME || null,
          owner_address: attributes.MAILING_ADDRESS_1 || attributes.OWN_ADDR1 || null,
          // Property details
          property_use_code: attributes.DOR_UC || null,
          assessed_value: attributes.JV || null,
          taxable_value: attributes.TV_NSD || null,
          year_built: attributes.EFF_YR_BLT || attributes.ACT_YR_BLT || null,
          living_area: attributes.TOT_LVG_AR || null,
          land_area: attributes.LND_SQFOOT ? (attributes.LND_SQFOOT / 43560) : null, // Convert to acres
          // Geometry and metadata
          geom: wkt,
          raw_data: attributes,
          data_source: 'FDOT',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        }

        // Skip if no parcel ID
        if (!parcelRecord.parcel_id) {
          console.warn('Skipping feature without parcel ID')
          errors++
          continue
        }

        // Check if parcel exists
        const { data: existing } = await supabase
          .from('parcels')
          .select('id')
          .eq('parcel_id', parcelRecord.parcel_id)
          .maybeSingle()

        if (existing) {
          // Update existing parcel
          const { error } = await supabase
            .from('parcels')
            .update({
              ...parcelRecord,
              updated_at: new Date().toISOString()
            })
            .eq('parcel_id', parcelRecord.parcel_id)

          if (error) {
            throw error
          }
        } else {
          // Insert new parcel
          const { error } = await supabase
            .from('parcels')
            .insert(parcelRecord)

          if (error) {
            throw error
          }
        }

        processed++
      } catch (err) {
        errors++
        errorDetails.push({
          parcel_id: feature.attributes?.PARCELNO,
          error: err.message
        })
        console.error('Error processing parcel:', err)
      }
    }

    // Check if there are more records
    const hasMore = data.exceededTransferLimit || data.features.length === limit

    // Log completion
    await supabase
      .from('system_logs')
      .insert({
        level: processed > 0 ? 'info' : 'warning',
        message: `Charlotte County parcel load completed`,
        context: {
          processed,
          errors,
          hasMore,
          offset,
          limit,
          errorSample: errorDetails.slice(0, 5)
        }
      })

    // Audit trail
    await supabase
      .from('audit_logs')
      .insert({
        action: 'bulk_load_parcels',
        resource_type: 'parcels',
        resource_id: 'charlotte_county',
        details: {
          processed,
          errors,
          offset,
          limit,
          hasMore
        }
      })

    return new Response(JSON.stringify({ 
      success: true,
      processed,
      errors,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
      errorDetails: errorDetails.slice(0, 10)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Fatal error:', err)
    
    // Log error
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    await supabase
      .from('system_logs')
      .insert({
        level: 'error',
        message: 'Charlotte County parcel load failed',
        context: {
          error: err.message,
          stack: err.stack
        }
      })

    return new Response(JSON.stringify({ 
      error: err.message,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})