#!/usr/bin/env node

/**
 * Clean Florida Parcel Loader
 * Loads parcel data from FDOT directly into Supabase
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// County to layer mapping
const COUNTY_LAYERS = {
  'MONROE': 44,
  'MIAMI-DADE': 13,
  'BROWARD': 6,
  'PALM BEACH': 50,
  'LEE': 36,
  'CHARLOTTE': 8,
  'COLLIER': 11,
  'HILLSBOROUGH': 29,
  'PINELLAS': 52,
  'ORANGE': 48,
  'DUVAL': 16,
  'BREVARD': 5
}

// County FIPS codes
const COUNTY_FIPS = {
  'MONROE': '087',
  'MIAMI-DADE': '086',
  'BROWARD': '011',
  'PALM BEACH': '099',
  'LEE': '071',
  'CHARLOTTE': '015',
  'COLLIER': '021',
  'HILLSBOROUGH': '057',
  'PINELLAS': '103',
  'ORANGE': '095',
  'DUVAL': '031',
  'BREVARD': '009'
}

// Load environment variables
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')

  // Extract Supabase URL
  const urlMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)
  const url = urlMatch ? urlMatch[1].replace(/["']/g, '').trim() : null

  // Extract anon key - handling the \n literal properly
  const keyMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+?)$/m)
  const anonKey = keyMatch ? keyMatch[1].split('\\n')[0].replace(/["']/g, '').trim() : null

  if (!url || !anonKey) {
    throw new Error('Missing required environment variables')
  }

  return { url, anonKey }
}

// Convert ArcGIS geometry to PostGIS WKT
function convertToWKT(geometry) {
  if (!geometry || !geometry.rings) return null

  try {
    const rings = geometry.rings.map(ring => {
      const coords = ring.map(([lon, lat]) => `${lon} ${lat}`).join(',')
      return `(${coords})`
    }).join(',')

    return `SRID=4326;MULTIPOLYGON((${rings}))`
  } catch (err) {
    console.error('Geometry conversion error:', err)
    return null
  }
}

// Fetch parcels from FDOT
async function fetchParcels(layerId, offset = 0, limit = 100) {
  const url = `https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer/${layerId}/query`

  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    f: 'json',
    resultOffset: offset.toString(),
    resultRecordCount: limit.toString(),
    returnGeometry: 'true',
    outSR: '4326'
  })

  const response = await fetch(`${url}?${params}`)
  if (!response.ok) {
    throw new Error(`FDOT API error: ${response.status}`)
  }

  return response.json()
}

// Process a single parcel
function processParcel(feature, countyName, countyFips) {
  const { attributes, geometry } = feature

  // Build property address
  const propertyAddress = [
    attributes.PHY_ADDR1,
    attributes.PHY_ADDR2,
    attributes.PHY_CITY,
    attributes.PHY_STATE,
    attributes.PHY_ZIPCD
  ].filter(Boolean).join(' ').trim()

  return {
    id: crypto.randomUUID(),
    parcel_id: attributes.PARCEL_ID || attributes.PARCELNO,
    county_fips: countyFips,
    county_name: countyName,
    property_address: propertyAddress || null,
    owner_name: attributes.OWN_NAME || null,
    owner_address: attributes.OWN_ADDR1 || null,
    property_use_code: attributes.DOR_UC || null,
    assessed_value: attributes.JV || null,
    taxable_value: attributes.TV_NSD || null,
    year_built: attributes.ACT_YR_BLT || attributes.EFF_YR_BLT || null,
    living_area: attributes.TOT_LVG_AR || null,
    land_area: attributes.LND_SQFOOT ? attributes.LND_SQFOOT / 43560 : null,
    geom: convertToWKT(geometry),
    raw_data: attributes,
    data_source: 'FDOT',
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
}

// Main loading function
async function loadParcels(county, maxRecords = 1000) {
  console.log(`\n🏗️  Loading parcels for ${county} County...`)

  const layerId = COUNTY_LAYERS[county.toUpperCase()]
  const countyFips = COUNTY_FIPS[county.toUpperCase()]

  if (!layerId || !countyFips) {
    console.error(`❌ Unknown county: ${county}`)
    return { success: 0, errors: 0 }
  }

  // Initialize Supabase client
  const { url, anonKey } = loadEnvVars()
  const supabase = createClient(url, anonKey)

  let offset = 0
  let totalSuccess = 0
  let totalErrors = 0
  const batchSize = 100

  while (totalSuccess + totalErrors < maxRecords) {
    try {
      // Fetch batch from FDOT
      console.log(`📥 Fetching records ${offset} to ${offset + batchSize}...`)
      const data = await fetchParcels(layerId, offset, batchSize)

      if (!data.features || data.features.length === 0) {
        console.log('✅ No more records to process')
        break
      }

      // Process each feature
      const parcels = []
      for (const feature of data.features) {
        try {
          const parcel = processParcel(feature, county.toUpperCase(), countyFips)
          if (parcel.parcel_id) {
            parcels.push(parcel)
          }
        } catch (err) {
          console.error('Error processing feature:', err)
          totalErrors++
        }
      }

      // Insert batch into database
      if (parcels.length > 0) {
        console.log(`💾 Inserting ${parcels.length} parcels...`)

        // Insert one by one for better error tracking
        for (const parcel of parcels) {
          // First check if parcel exists
          const { data: existing } = await supabase
            .from('parcels')
            .select('id')
            .eq('parcel_id', parcel.parcel_id)
            .single()

          let error
          if (existing) {
            // Update existing parcel
            const { error: updateError } = await supabase
              .from('parcels')
              .update(parcel)
              .eq('parcel_id', parcel.parcel_id)
            error = updateError
          } else {
            // Insert new parcel
            const { error: insertError } = await supabase
              .from('parcels')
              .insert(parcel)
            error = insertError
          }

          if (error) {
            console.error(`❌ Failed to insert ${parcel.parcel_id}: ${error.message}`)
            totalErrors++
          } else {
            totalSuccess++
          }
        }

        console.log(`✅ Batch complete: ${totalSuccess} successful, ${totalErrors} errors`)
      }

      // Check if we have more data
      if (data.features.length < batchSize) {
        console.log('✅ Reached end of data')
        break
      }

      offset += batchSize

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (err) {
      console.error('❌ Batch error:', err)
      totalErrors += batchSize
      break
    }
  }

  return { success: totalSuccess, errors: totalErrors }
}

// Main execution
async function main() {
  console.log('🚀 Florida Parcel Loader - Clean Version')
  console.log('=' * 50)

  // Get command line arguments
  const args = process.argv.slice(2)
  const county = args[0] || 'MONROE'
  const maxRecords = parseInt(args[1]) || 500

  console.log(`Loading up to ${maxRecords} records from ${county} County`)

  try {
    const result = await loadParcels(county, maxRecords)

    console.log('\n📊 Final Results:')
    console.log(`✅ Successfully loaded: ${result.success} parcels`)
    console.log(`❌ Errors: ${result.errors}`)

  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
