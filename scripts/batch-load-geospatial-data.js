#!/usr/bin/env node

/**
 * Batch load geospatial data with progress tracking and error recovery
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmlrvecuwgppbaynesji.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_ANON_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
  process.exit(1)
}

// Progress file to track what's been loaded
const PROGRESS_FILE = path.join(__dirname, '.geospatial-load-progress.json')

// Load configuration
const BATCH_CONFIG = {
  // Small datasets - load completely
  small_datasets: [
    { source: 'fire_stations', name: 'Fire Stations', priority: 1 },
    { source: 'active_wildfires', name: 'Active Wildfires', priority: 2 },
    { source: 'fema_flood_zones', name: 'FEMA Flood Zones', priority: 3 }
  ],

  // Large dataset - load by county
  florida_counties: [
    // Start with smaller counties for testing
    { name: 'Monroe', code: '44', population: 79000 },        // Keys
    { name: 'Miami-Dade', code: '13', population: 2700000 },  // Largest
    { name: 'Broward', code: '6', population: 1950000 },
    { name: 'Palm Beach', code: '50', population: 1500000 },
    { name: 'Hillsborough', code: '29', population: 1470000 },
    { name: 'Orange', code: '48', population: 1420000 },
    { name: 'Pinellas', code: '52', population: 975000 },
    { name: 'Duval', code: '16', population: 990000 },
    { name: 'Lee', code: '36', population: 770000 },
    { name: 'Polk', code: '53', population: 725000 },
    { name: 'Brevard', code: '5', population: 610000 },
    { name: 'Volusia', code: '64', population: 550000 }
  ],

  // Batch settings - Optimized based on analysis
  settings: {
    parcels_per_batch: 1000,      // Increased - most ArcGIS services handle 1000
    max_parcels_per_county: 10000, // Increased for more meaningful test
    delay_between_calls: 1000,    // 1 second between API calls (60 requests/minute)
    delay_between_sources: 5000,  // 5 seconds between data sources
    retry_attempts: 3,
    retry_delay: 10000,          // 10 seconds before retry

    // Rate limiting configuration
    rate_limit: {
      requests_per_minute: 60,    // Reasonable rate: 60 requests per minute
      requests_per_hour: 3000,    // Safety limit: 3000 requests per hour
      backoff_multiplier: 2       // Exponential backoff on 429 errors
    }
  }
}

// Rate limiting tracker
class RateLimiter {
  constructor() {
    this.requests = []
    this.lastReset = Date.now()
  }

  async checkLimit() {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const oneHourAgo = now - 3600000

    // Clean old requests
    this.requests = this.requests.filter(time => time > oneHourAgo)

    // Count recent requests
    const minuteRequests = this.requests.filter(time => time > oneMinuteAgo).length
    const hourRequests = this.requests.length

    // Check limits
    if (minuteRequests >= BATCH_CONFIG.settings.rate_limit.requests_per_minute) {
      const waitTime = 60000 - (now - this.requests[this.requests.length - BATCH_CONFIG.settings.rate_limit.requests_per_minute])
      console.log(`⏳ Rate limit reached (minute). Waiting ${Math.ceil(waitTime / 1000)} seconds...`)
      await sleep(waitTime)
    }

    if (hourRequests >= BATCH_CONFIG.settings.rate_limit.requests_per_hour) {
      const waitTime = 3600000 - (now - this.requests[0])
      console.log(`⏳ Rate limit reached (hour). Waiting ${Math.ceil(waitTime / 60000)} minutes...`)
      await sleep(waitTime)
    }

    // Record this request
    this.requests.push(now)
  }
}

const rateLimiter = new RateLimiter()

// Progress tracking
class ProgressTracker {
  constructor() {
    this.progress = this.load()
  }

  load() {
    try {
      if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
      }
    } catch (error) {
      console.warn('Could not load progress file, starting fresh')
    }
    return {
      started_at: new Date().toISOString(),
      small_datasets: {},
      counties: {},
      errors: []
    }
  }

  save() {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(this.progress, null, 2))
  }

  markComplete(type, name, stats) {
    if (type === 'dataset') {
      this.progress.small_datasets[name] = {
        completed_at: new Date().toISOString(),
        ...stats
      }
    } else if (type === 'county') {
      this.progress.counties[name] = {
        completed_at: new Date().toISOString(),
        ...stats
      }
    }
    this.save()
  }

  isComplete(type, name) {
    if (type === 'dataset') {
      return !!this.progress.small_datasets[name]?.completed_at
    } else if (type === 'county') {
      return !!this.progress.counties[name]?.completed_at
    }
    return false
  }

  recordError(error, context) {
    this.progress.errors.push({
      timestamp: new Date().toISOString(),
      error: error.message,
      context
    })
    this.save()
  }

  getStats() {
    const completedDatasets = Object.keys(this.progress.small_datasets).length
    const completedCounties = Object.keys(this.progress.counties).length
    const totalRecords = Object.values(this.progress.small_datasets)
      .concat(Object.values(this.progress.counties))
      .reduce((sum, item) => sum + (item.processed || 0), 0)

    return {
      completedDatasets,
      completedCounties,
      totalRecords,
      errors: this.progress.errors.length
    }
  }
}

// API call wrapper with retry logic and rate limiting
async function callEdgeFunctionWithRetry(functionName, payload, retries = 3) {
  const headers = {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }

  // Check rate limit before making request
  await rateLimiter.checkLimit()

  let backoffDelay = BATCH_CONFIG.settings.retry_delay

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      // Handle rate limit response
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : backoffDelay

        console.warn(`🚦 Rate limited (429). Waiting ${waitTime / 1000} seconds...`)
        await sleep(waitTime)

        // Exponential backoff for next attempt
        backoffDelay *= BATCH_CONFIG.settings.rate_limit.backoff_multiplier
        continue
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message)

      if (attempt < retries) {
        console.log(`Retrying in ${backoffDelay / 1000} seconds...`)
        await sleep(backoffDelay)
        backoffDelay *= BATCH_CONFIG.settings.rate_limit.backoff_multiplier
      } else {
        throw error
      }
    }
  }
}

// Utility function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Load small datasets
async function loadSmallDataset(dataset, tracker) {
  if (tracker.isComplete('dataset', dataset.source)) {
    console.log(`✓ ${dataset.name} already loaded, skipping...`)
    return
  }

  console.log(`\n📡 Loading ${dataset.name}...`)

  try {
    const result = await callEdgeFunctionWithRetry('load-geospatial-data', {
      source: dataset.source
    })

    console.log(`✅ ${dataset.name} loaded successfully:`)
    console.log(`   - Processed: ${result.processed} records`)
    console.log(`   - Errors: ${result.errors}`)

    tracker.markComplete('dataset', dataset.source, result)

  } catch (error) {
    console.error(`❌ Failed to load ${dataset.name}:`, error.message)
    tracker.recordError(error, { dataset: dataset.source })
    throw error
  }
}

// Load parcels by county
async function loadCountyParcels(county, tracker) {
  if (tracker.isComplete('county', county.name)) {
    console.log(`✓ ${county.name} County already loaded, skipping...`)
    return
  }

  console.log(`\n🏘️  Loading parcels for ${county.name} County...`)

  let offset = 0
  let totalProcessed = 0
  let totalErrors = 0
  const maxRecords = BATCH_CONFIG.settings.max_parcels_per_county

  while (totalProcessed < maxRecords) {
    try {
      console.log(`   Batch ${offset / BATCH_CONFIG.settings.parcels_per_batch + 1}: Loading records ${offset + 1}-${offset + BATCH_CONFIG.settings.parcels_per_batch}...`)

      const result = await callEdgeFunctionWithRetry('load-florida-parcels-fdot', {
        county: county.name,
        offset,
        limit: BATCH_CONFIG.settings.parcels_per_batch
      })

      totalProcessed += result.processed
      totalErrors += result.errors

      console.log(`   ✓ Batch complete: ${result.processed} processed, ${result.errors} errors`)

      if (!result.hasMore || totalProcessed >= maxRecords) {
        break
      }

      offset = result.nextOffset
      await sleep(BATCH_CONFIG.settings.delay_between_calls)

    } catch (error) {
      console.error(`❌ Error loading ${county.name} at offset ${offset}:`, error.message)
      tracker.recordError(error, { county: county.name, offset })
      break
    }
  }

  console.log(`✅ ${county.name} County complete: ${totalProcessed} parcels loaded`)

  tracker.markComplete('county', county.name, {
    processed: totalProcessed,
    errors: totalErrors
  })
}

// Progress bar helper
function showProgressBar(current, total, label = '') {
  const barLength = 30
  const progress = Math.round((current / total) * barLength)
  const percentage = Math.round((current / total) * 100)

  const bar = '█'.repeat(progress) + '░'.repeat(barLength - progress)
  process.stdout.write(`\r${label} [${bar}] ${percentage}% (${current}/${total})`)

  if (current === total) {
    console.log(' ✓')
  }
}

// Main orchestration
async function main() {
  console.log('🌍 ClaimGuardian Batch Geospatial Data Loader')
  console.log('===========================================')
  console.log('\n📋 Rate Limits:')
  console.log(`- ${BATCH_CONFIG.settings.rate_limit.requests_per_minute} requests/minute`)
  console.log(`- ${BATCH_CONFIG.settings.rate_limit.requests_per_hour} requests/hour`)
  console.log(`- ${BATCH_CONFIG.settings.parcels_per_batch} records per batch`)

  const tracker = new ProgressTracker()
  const stats = tracker.getStats()

  console.log('\n📊 Progress Status:')
  console.log(`- Datasets completed: ${stats.completedDatasets}/${BATCH_CONFIG.small_datasets.length}`)
  console.log(`- Counties completed: ${stats.completedCounties}/${BATCH_CONFIG.florida_counties.length}`)
  console.log(`- Total records loaded: ${stats.totalRecords.toLocaleString()}`)
  if (stats.errors > 0) {
    console.log(`- Errors encountered: ${stats.errors}`)
  }

  try {
    // Phase 1: Load small datasets
    console.log('\n📊 Phase 1: Loading reference datasets...')
    for (const dataset of BATCH_CONFIG.small_datasets) {
      await loadSmallDataset(dataset, tracker)
      await sleep(BATCH_CONFIG.settings.delay_between_sources)
    }

    // Phase 2: Load parcels by county
    console.log('\n🏡 Phase 2: Loading Florida parcels by county...')
    console.log(`(Loading up to ${BATCH_CONFIG.settings.max_parcels_per_county.toLocaleString()} parcels per county for testing)`)

    let countyIndex = 0
    for (const county of BATCH_CONFIG.florida_counties) {
      countyIndex++
      console.log(`\n[${countyIndex}/${BATCH_CONFIG.florida_counties.length}] Processing ${county.name} County...`)
      showProgressBar(countyIndex - 1, BATCH_CONFIG.florida_counties.length, 'Overall Progress')

      await loadCountyParcels(county, tracker)
      await sleep(BATCH_CONFIG.settings.delay_between_sources)
    }
    showProgressBar(BATCH_CONFIG.florida_counties.length, BATCH_CONFIG.florida_counties.length, 'Overall Progress')

    // Final stats
    const finalStats = tracker.getStats()
    console.log('\n✨ Batch loading complete!')
    console.log('Final Statistics:')
    console.log(`- Datasets loaded: ${finalStats.completedDatasets}/${BATCH_CONFIG.small_datasets.length}`)
    console.log(`- Counties loaded: ${finalStats.completedCounties}/${BATCH_CONFIG.florida_counties.length}`)
    console.log(`- Total records: ${finalStats.totalRecords.toLocaleString()}`)
    console.log(`- Total errors: ${finalStats.errors}`)

    if (finalStats.errors > 0) {
      console.log('\n⚠️  Some errors occurred. Check .geospatial-load-progress.json for details.')
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  }
}

// Add command line options
const args = process.argv.slice(2)
if (args[0] === '--reset') {
  console.log('Resetting progress...')
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE)
    console.log('Progress file deleted. Starting fresh on next run.')
  }
  process.exit(0)
} else if (args[0] === '--status') {
  const tracker = new ProgressTracker()
  const stats = tracker.getStats()
  console.log('\nCurrent Progress:')
  console.log(JSON.stringify(stats, null, 2))
  console.log('\nCompleted items:', tracker.progress)
  process.exit(0)
}

// Run the batch loader
main().catch(console.error)
