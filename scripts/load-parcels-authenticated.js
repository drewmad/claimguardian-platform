#!/usr/bin/env node

/**
 * Authenticated Florida Parcel Loader
 * Uses authenticated user session to load parcels via Edge Function
 * Requires user to be logged in to ClaimGuardian
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// County mappings
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

  const urlMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)
  const url = urlMatch ? urlMatch[1].replace(/["']/g, '').trim() : null

  const keyMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+?)$/m)
  const anonKey = keyMatch ? keyMatch[1].split('\\n')[0].replace(/["']/g, '').trim() : null

  if (!url || !anonKey) {
    throw new Error('Missing required environment variables')
  }

  return { url, anonKey }
}

// Convert geometry
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

// Fetch from FDOT
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

// Process parcel
function processParcel(feature, countyName, countyFips) {
  const { attributes, geometry } = feature

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

// Call bulk insert Edge Function
async function bulkInsertParcels(supabaseUrl, anonKey, parcels) {
  const response = await fetch(`${supabaseUrl}/functions/v1/bulk-insert-parcels`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ parcels })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Edge Function error: ${response.status} - ${error}`)
  }

  return response.json()
}

// Main loading function
async function loadParcels(county, maxRecords = 1000) {
  console.log(`\n🏗️  Loading parcels for ${county} County...`)
  console.log('🔐 Using authenticated Edge Function for secure access')

  const layerId = COUNTY_LAYERS[county.toUpperCase()]
  const countyFips = COUNTY_FIPS[county.toUpperCase()]

  if (!layerId || !countyFips) {
    console.error(`❌ Unknown county: ${county}`)
    return { success: 0, errors: 0 }
  }

  const { url, anonKey } = loadEnvVars()

  let offset = 0
  let totalSuccess = 0
  let totalErrors = 0
  const batchSize = 50 // Smaller batches for Edge Function

  while (totalSuccess + totalErrors < maxRecords) {
    try {
      // Fetch from FDOT
      console.log(`📥 Fetching records ${offset} to ${offset + batchSize}...`)
      const data = await fetchParcels(layerId, offset, batchSize)

      if (!data.features || data.features.length === 0) {
        console.log('✅ No more records to process')
        break
      }

      // Process features
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

      if (parcels.length > 0) {
        console.log(`💾 Sending ${parcels.length} parcels to Edge Function...`)

        // Call Edge Function
        const result = await bulkInsertParcels(url, anonKey, parcels)

        totalSuccess += result.successful
        totalErrors += result.errors

        console.log(`✅ Batch result: ${result.successful} successful, ${result.errors} errors`)

        // Show first few errors if any
        if (result.errorDetails && result.errorDetails.length > 0) {
          console.log('❌ Sample errors:')
          result.errorDetails.slice(0, 3).forEach(err => {
            console.log(`   - ${err.parcel_id}: ${err.error}`)
          })
        }
      }

      if (data.features.length < batchSize) {
        console.log('✅ Reached end of data')
        break
      }

      offset += batchSize

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (err) {
      console.error('❌ Batch error:', err.message)
      totalErrors += batchSize

      // If authentication error, stop
      if (err.message.includes('401') || err.message.includes('403')) {
        console.error('\n🚫 Authentication failed. Please ensure you are logged in to ClaimGuardian.')
        break
      }
    }
  }

  return { success: totalSuccess, errors: totalErrors }
}

// Main execution
async function main() {
  console.log('🚀 Florida Parcel Loader - Authenticated Version')
  console.log('=' * 50)
  console.log('⚠️  This script requires authentication.')
  console.log('   Please ensure you are logged in to ClaimGuardian.')

  const args = process.argv.slice(2)
  const county = args[0] || 'MONROE'
  const maxRecords = parseInt(args[1]) || 100

  console.log(`\nLoading up to ${maxRecords} records from ${county} County`)

  try {
    const result = await loadParcels(county, maxRecords)

    console.log('\n📊 Final Results:')
    console.log(`✅ Successfully loaded: ${result.success} parcels`)
    console.log(`❌ Errors: ${result.errors}`)

    if (result.errors > 0 && result.success === 0) {
      console.log('\n💡 Tip: If you see authentication errors, you may need to:')
      console.log('   1. Log in to ClaimGuardian at https://claimguardianai.com')
      console.log('   2. Use a valid authentication token')
      console.log('   3. Contact support for data loading assistance')
    }

  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
