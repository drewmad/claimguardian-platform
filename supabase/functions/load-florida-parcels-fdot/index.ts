import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// County name to layer ID mapping for FDOT service  
// Also includes mapping to Florida FIPS county codes
const COUNTY_LAYERS: Record<string, number> = {
  'ALACHUA': 1, 'BAKER': 2, 'BAY': 3, 'BRADFORD': 4, 'BREVARD': 5,
  'BROWARD': 6, 'CALHOUN': 7, 'CHARLOTTE': 8, 'CITRUS': 9, 'CLAY': 10,
  'COLLIER': 11, 'COLUMBIA': 12, 'MIAMI-DADE': 13, 'DESOTO': 14, 'DIXIE': 15,
  'DUVAL': 16, 'ESCAMBIA': 17, 'FLAGLER': 18, 'FRANKLIN': 19, 'GADSDEN': 20,
  'GILCHRIST': 21, 'GLADES': 22, 'GULF': 23, 'HAMILTON': 24, 'HARDEE': 25,
  'HENDRY': 26, 'HERNANDO': 27, 'HIGHLANDS': 28, 'HILLSBOROUGH': 29, 'HOLMES': 30,
  'INDIAN RIVER': 31, 'JACKSON': 32, 'JEFFERSON': 33, 'LAFAYETTE': 34, 'LAKE': 35,
  'LEE': 36, 'LEON': 37, 'LEVY': 38, 'LIBERTY': 39, 'MADISON': 40,
  'MANATEE': 41, 'MARION': 42, 'MARTIN': 43, 'MONROE': 44, 'NASSAU': 45,
  'OKALOOSA': 46, 'OKEECHOBEE': 47, 'ORANGE': 48, 'OSCEOLA': 49, 'PALM BEACH': 50,
  'PASCO': 51, 'PINELLAS': 52, 'POLK': 53, 'PUTNAM': 54, 'SANTA ROSA': 55,
  'SARASOTA': 56, 'SEMINOLE': 57, 'ST JOHNS': 58, 'ST LUCIE': 59, 'SUMTER': 60,
  'SUWANNEE': 61, 'TAYLOR': 62, 'UNION': 63, 'VOLUSIA': 64, 'WAKULLA': 65,
  'WALTON': 66, 'WASHINGTON': 67
}

// Map CO_NO to actual county FIPS codes
const CO_NO_TO_FIPS: Record<number, string> = {
  44: '087', // Monroe County FIPS
  54: '107'  // Putnam County FIPS
  // Add more mappings as needed
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { county, offset = 0, limit = 1000 } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (!county) {
      throw new Error('County parameter is required for FDOT service')
    }

    const countyUpper = county.toUpperCase()
    const layerId = COUNTY_LAYERS[countyUpper]
    
    if (!layerId) {
      throw new Error(`Invalid county: ${county}. Valid counties: ${Object.keys(COUNTY_LAYERS).join(', ')}`)
    }

    console.log(`Loading Florida parcels from FDOT - County: ${countyUpper} (Layer ${layerId}), Offset: ${offset}, Limit: ${limit}`)

    // Skip RPC tracking for now
    const loadId = null

    // FDOT Parcels endpoint - each county is a separate layer
    const url = new URL(`https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer/${layerId}/query`)
    
    // Build query parameters
    const params = {
      where: '1=1',
      outFields: '*',
      f: 'json',
      resultOffset: offset,
      resultRecordCount: limit,
      returnGeometry: 'true',
      outSR: '4326' // Request WGS84 coordinates
    }

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })

    // Fetch data
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to fetch parcels: ${response.statusText}`)
    }

    const data = await response.json()
    const features = data.features || []
    
    console.log(`Fetched ${features.length} parcels from FDOT`)
    
    // Log first feature for debugging
    if (features.length > 0) {
      console.log('Sample feature:', JSON.stringify(features[0], null, 2))
      console.log('Spatial reference:', JSON.stringify(data.spatialReference))
      console.log('First parcel ID:', features[0].attributes?.PARCEL_ID || features[0].attributes?.PARCELNO)
    }

    let processed = 0
    let errors = 0
    const batchSize = 100

    // Get field mappings from the response
    const fields = data.fields || []
    const fieldMap: Record<string, string> = {}
    fields.forEach((field: any) => {
      fieldMap[field.name.toUpperCase()] = field.name
    })

    // Process in batches
    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize)
      
      try {
        const records = batch.map((feature: any) => {
          const { attributes, geometry } = feature
          
          // Convert geometry to WKT
          let wkt = null
          if (geometry) {
            if (geometry.rings) {
              // Polygon or MultiPolygon
              const rings = geometry.rings.map((ring: number[][]) => 
                `(${ring.map(coord => `${coord[0]} ${coord[1]}`).join(',')})`
              ).join(',')
              wkt = `SRID=4326;MULTIPOLYGON((${rings}))`
            } else if (geometry.x && geometry.y) {
              // Point geometry - convert to small polygon
              const x = geometry.x
              const y = geometry.y
              const delta = 0.00001 // Small offset to create a polygon
              wkt = `SRID=4326;MULTIPOLYGON(((${x-delta} ${y-delta},${x+delta} ${y-delta},${x+delta} ${y+delta},${x-delta} ${y+delta},${x-delta} ${y-delta})))`
            }
          }
          
          // Map FDOT fields to our schema - based on actual field names
          const ownerAddress = [attributes.OWN_ADDR1, attributes.OWN_ADDR2].filter(Boolean).join(' ').trim()
          const propertyAddress = [attributes.PHY_ADDR1, attributes.PHY_ADDR2].filter(Boolean).join(' ').trim()
          
          return {
            id: crypto.randomUUID(),
            parcel_id: attributes.PARCEL_ID || attributes.PARCELNO,
            county_fips: '087', // Monroe County FIPS - we'll need proper mapping for other counties
            county_name: countyUpper,
            property_address: propertyAddress || null,
            owner_name: attributes.OWN_NAME || null,
            owner_address: ownerAddress || null,
            property_use_code: attributes.DOR_UC || null,
            assessed_value: attributes.JV || null,
            taxable_value: attributes.TV_NSD || null,
            year_built: attributes.ACT_YR_BLT || attributes.EFF_YR_BLT || null,
            living_area: attributes.TOT_LVG_AR || null,
            land_area: attributes.LND_SQFOOT ? (attributes.LND_SQFOOT / 43560) : null, // Convert sq ft to acres
            geom: wkt,
            raw_data: {
              ...attributes,
              source_metadata: {
                source_url: url.origin + url.pathname,
                source_name: 'FDOT Parcels Service',
                source_agency: 'Florida Department of Transportation',
                fetch_date: new Date().toISOString(),
                fetch_params: params,
                record_offset: offset + i,
                layer_id: layerId
              }
            },
            data_source: 'FDOT',
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        }).filter(r => r.parcel_id) // Only require parcel_id, geometry is optional
        
        console.log(`Batch ${i}-${i + batchSize}: Prepared ${records.length} records for insertion`)
        if (records.length > 0) {
          // Insert records one by one to get accurate error counts
          for (const record of records) {
            try {
              // First check if parcel exists
              const { data: existing } = await supabase
                .from('parcels')
                .select('id')
                .eq('parcel_id', record.parcel_id)
                .maybeSingle()
              
              let error
              if (existing) {
                // Update existing parcel
                const { error: updateError } = await supabase
                  .from('parcels')
                  .update({
                    ...record,
                    updated_at: new Date().toISOString()
                  })
                  .eq('parcel_id', record.parcel_id)
                error = updateError
              } else {
                // Insert new parcel
                const { error: insertError } = await supabase
                  .from('parcels')
                  .insert(record)
                error = insertError
              }
              
              if (error) {
                console.error(`Failed to insert parcel ${record.parcel_id}:`, error.message)
                errors++
              } else {
                processed++
              }
            } catch (recordErr) {
              console.error(`Exception inserting parcel ${record.parcel_id}:`, recordErr)
              errors++
            }
          }
          console.log(`Batch complete: ${processed} succeeded, ${errors} failed`)
        }
      } catch (err) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, err)
        console.error('Error details:', err instanceof Error ? err.message : err)
        errors += batch.length
      }
    }

    // Check if there are more records
    const hasMore = features.length === limit

    // Skip RPC and system_logs for now

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        total: features.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in load-florida-parcels-fdot:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})