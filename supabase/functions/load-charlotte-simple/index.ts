import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CHARLOTTE_LAYER_ID = 8
const CHARLOTTE_FIPS = '12015'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { offset = 0, limit = 1000 } = await req.json() // Increased default limit for efficiency (API max ~1000)

    console.log(`Loading Charlotte County parcels - Offset: ${offset}, Limit: ${limit}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build FDOT URL
    // NOTE: This FDOT service is 2022 vintage. For 2024 DOR data, download GeoJSON from
    // geodata.floridagio.gov/datasets/FGIO::florida-statewide-parcels-polygon,
    // upload to Supabase Storage, and process via separate function for WHERE COUNTY='CHARLOTTE'
    const fdotUrl = `https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer/${CHARLOTTE_LAYER_ID}/query`
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'json',
      resultOffset: offset.toString(),
      resultRecordCount: limit.toString(),
      returnGeometry: 'true',
      outSR: '4326'
    })

    console.log('Fetching from:', `${fdotUrl}?${params}`)

    // Fetch with exponential backoff retry logic
    let data;
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        const response = await fetch(`${fdotUrl}?${params}`)
        if (!response.ok) {
          throw new Error(`FDOT API error: ${response.status} - ${await response.text()}`)
        }
        data = await response.json()
        break;
      } catch (err) {
        attempts++;
        if (attempts === maxRetries) throw err;
        const delay = 1000 * (2 ** attempts); // Exponential backoff: 2s, 4s, 8s
        console.warn(`Retry ${attempts} after error: ${err.message}. Waiting ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const features = data.features || []
    console.log(`Received ${features.length} features`)

    const records = []
    let errors = 0
    const errorDetails = []

    for (const feature of features) {
      try {
        const { attributes, geometry } = feature

        // Fixed WKT conversion: Use POLYGON for single ring, MULTIPOLYGON for multiple
        let wkt = null
        if (geometry?.rings) {
          const rings = geometry.rings
          if (rings.length === 1) {
            // Single ring - use POLYGON with double parentheses
            const ringStr = rings[0].map(coord => `${coord[0]} ${coord[1]}`).join(',')
            wkt = `SRID=4326;POLYGON((${ringStr}))`
          } else if (rings.length > 1) {
            // Multiple rings - use MULTIPOLYGON with proper nesting
            const multiStr = rings.map(ring =>
              `((${ring.map(coord => `${coord[0]} ${coord[1]}`).join(',')}))`
            ).join(',')
            wkt = `SRID=4326;MULTIPOLYGON(${multiStr})`
          }
        }

        // Map to florida_parcels table structure
        const record = {
          // Use uppercase column names to match florida_parcels schema
          CO_NO: 15, // Charlotte County number
          PARCEL_ID: attributes.PARCELNO || attributes.PARCEL_ID,
          county_fips: CHARLOTTE_FIPS,

          // Assessment data
          ASMNT_YR: new Date().getFullYear(),
          DOR_UC: attributes.DOR_UC || null,
          PA_UC: attributes.PA_UC || null,
          JV: attributes.JV || null,
          TV_NSD: attributes.TV_NSD || null,

          // Owner information
          OWN_NAME: attributes.OWN_NAME || null,
          OWN_ADDR1: attributes.MAILING_ADDRESS_1 || null,
          OWN_CITY: attributes.OWN_CITY || null,
          OWN_STATE: attributes.OWN_STATE || null,
          OWN_ZIPCD: attributes.OWN_ZIPCD || null,

          // Property information
          PHY_ADDR1: attributes.SITEADDRESS || attributes.PHY_ADDR1 || null,
          PHY_CITY: attributes.PHY_CITY || null,
          PHY_ZIPCD: attributes.PHY_ZIPCD || null,

          // Building information
          EFF_YR_BLT: attributes.EFF_YR_BLT || null,
          ACT_YR_BLT: attributes.ACT_YR_BLT || null,
          TOT_LVG_AR: attributes.TOT_LVG_AR || null,
          LND_SQFOOT: attributes.LND_SQFOOT || null,
          NO_BULDNG: attributes.NO_BULDNG || null,

          // Values
          LND_VAL: attributes.LND_VAL || null,
          IMP_VAL: attributes.IMP_VAL || null,

          // Geometry
          geom: wkt,
          LATITUDE: geometry?.rings?.[0]?.[0]?.[1] || null,
          LONGITUDE: geometry?.rings?.[0]?.[0]?.[0] || null,

          // Metadata
          data_source: 'FDOT',
          import_batch: `charlotte_${new Date().toISOString().split('T')[0]}`,
          import_date: new Date().toISOString(),
        }

        if (!record.PARCEL_ID) {
          errors++
          errorDetails.push({ reason: 'Missing parcel ID', attributes })
          continue
        }

        records.push(record)
      } catch (err) {
        console.error('Error processing parcel:', err)
        errors++
        errorDetails.push({
          reason: err.message,
          parcelId: feature?.attributes?.PARCELNO,
          error: err.stack
        })
      }
    }

    // Batch upsert for efficiency
    if (records.length > 0) {
      const { error } = await supabase
        .from('florida_parcels')
        .upsert(records, {
          onConflict: 'CO_NO,PARCEL_ID', // Use composite unique constraint
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Batch upsert error:', error)
        throw error
      }
    }

    const processed = records.length
    const hasMore = data.exceededTransferLimit || features.length === limit

    // Log to system_logs table for traceability
    try {
      await supabase.from('system_logs').insert({
        level: 'info',
        message: 'Charlotte parcels load completed',
        metadata: {
          offset,
          limit,
          processed,
          errors,
          hasMore,
          errorSample: errorDetails.slice(0, 5) // Log first 5 errors
        },
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error('Failed to write to system_logs:', logError)
    }

    return new Response(JSON.stringify({
      success: true,
      processed,
      errors,
      total: features.length,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
      message: processed > 0 ?
        `Successfully processed ${processed} parcels with ${errors} errors` :
        'No parcels processed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Function error:', err)

    // Try to log error to system_logs
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await supabase.from('system_logs').insert({
        level: 'error',
        message: 'Charlotte parcels load failed',
        metadata: {
          error: err.message,
          stack: err.stack
        },
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(JSON.stringify({
      error: err.message,
      success: false,
      details: err.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
