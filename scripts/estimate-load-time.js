#!/usr/bin/env node

/**
 * Estimate time to load all Florida geospatial data
 */

// Current configuration
const CONFIG = {
  // Rate limits
  requests_per_minute: 20,
  parcels_per_batch: 500,
  delay_between_calls: 3000, // 3 seconds
  delay_between_sources: 10000, // 10 seconds
  
  // Data estimates
  small_datasets: 3, // fire_stations, wildfires, flood_zones
  
  // Florida has 67 counties, but we're testing with 12 major ones
  counties_to_load: 12,
  
  // Parcel estimates per county (based on population)
  parcel_estimates: {
    'Miami-Dade': 900000,    // ~900k parcels
    'Broward': 700000,       // ~700k parcels
    'Palm Beach': 600000,    // ~600k parcels
    'Hillsborough': 500000,  // ~500k parcels
    'Orange': 450000,        // ~450k parcels
    'Pinellas': 450000,      // ~450k parcels
    'Duval': 350000,         // ~350k parcels
    'Lee': 350000,           // ~350k parcels
    'Polk': 250000,          // ~250k parcels
    'Brevard': 250000,       // ~250k parcels
    'Volusia': 250000,       // ~250k parcels
    'Monroe': 50000,         // ~50k parcels (Keys)
  },
  
  // For testing, we limit to 5000 per county
  max_parcels_per_county_test: 5000,
  
  // If we want ALL parcels
  total_florida_parcels: 8500000 // ~8.5 million total parcels in Florida
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days} days, ${remainingHours} hours, ${minutes} minutes`
  }
  
  return `${hours} hours, ${minutes} minutes, ${secs} seconds`
}

function calculateLoadTime() {
  console.log('📊 Florida Geospatial Data Load Time Estimates')
  console.log('============================================\n')
  
  // Small datasets
  const smallDatasetTime = CONFIG.small_datasets * CONFIG.delay_between_sources / 1000
  console.log('📁 Small Datasets (fire stations, wildfires, flood zones):')
  console.log(`   - Datasets: ${CONFIG.small_datasets}`)
  console.log(`   - Time per dataset: ${CONFIG.delay_between_sources / 1000} seconds`)
  console.log(`   - Total time: ${formatTime(smallDatasetTime)}`)
  
  // Test mode (5000 parcels per county)
  console.log('\n🧪 Test Mode (5,000 parcels per county):')
  const testParcelsPerCounty = CONFIG.max_parcels_per_county_test
  const testBatchesPerCounty = Math.ceil(testParcelsPerCounty / CONFIG.parcels_per_batch)
  const testTimePerCounty = (testBatchesPerCounty * CONFIG.delay_between_calls) / 1000
  const testTotalTime = (CONFIG.counties_to_load * testTimePerCounty) + 
                       (CONFIG.counties_to_load * CONFIG.delay_between_sources / 1000)
  
  console.log(`   - Counties: ${CONFIG.counties_to_load}`)
  console.log(`   - Parcels per county: ${testParcelsPerCounty.toLocaleString()}`)
  console.log(`   - Batches per county: ${testBatchesPerCounty}`)
  console.log(`   - Time per county: ${formatTime(testTimePerCounty)}`)
  console.log(`   - Total parcels: ${(CONFIG.counties_to_load * testParcelsPerCounty).toLocaleString()}`)
  console.log(`   - Total time: ${formatTime(testTotalTime + smallDatasetTime)}`)
  
  // Full county loads
  console.log('\n🏘️  Full County Loads (actual parcel counts):')
  let totalFullParcels = 0
  let totalFullTime = 0
  
  Object.entries(CONFIG.parcel_estimates).forEach(([county, parcels]) => {
    const batches = Math.ceil(parcels / CONFIG.parcels_per_batch)
    const timeSeconds = (batches * CONFIG.delay_between_calls) / 1000
    totalFullParcels += parcels
    totalFullTime += timeSeconds + (CONFIG.delay_between_sources / 1000)
    
    console.log(`   ${county}: ${parcels.toLocaleString()} parcels, ${batches} batches, ${formatTime(timeSeconds)}`)
  })
  
  console.log(`\n   Total parcels: ${totalFullParcels.toLocaleString()}`)
  console.log(`   Total time: ${formatTime(totalFullTime + smallDatasetTime)}`)
  
  // All Florida parcels
  console.log('\n🌴 All Florida Parcels (67 counties):')
  const allFloridaBatches = Math.ceil(CONFIG.total_florida_parcels / CONFIG.parcels_per_batch)
  const allFloridaTime = (allFloridaBatches * CONFIG.delay_between_calls) / 1000
  
  console.log(`   - Total parcels: ${CONFIG.total_florida_parcels.toLocaleString()}`)
  console.log(`   - Total batches: ${allFloridaBatches.toLocaleString()}`)
  console.log(`   - Time at current rate: ${formatTime(allFloridaTime + smallDatasetTime)}`)
  
  // Rate limit analysis
  console.log('\n⚡ Rate Limit Analysis:')
  const requestsPerHour = (3600 / (CONFIG.delay_between_calls / 1000))
  const parcelsPerHour = requestsPerHour * CONFIG.parcels_per_batch
  
  console.log(`   - Current delay: ${CONFIG.delay_between_calls}ms between requests`)
  console.log(`   - Requests per hour: ${Math.floor(requestsPerHour)}`)
  console.log(`   - Parcels per hour: ${Math.floor(parcelsPerHour).toLocaleString()}`)
  console.log(`   - Days to load all Florida: ${(allFloridaTime / 86400).toFixed(1)} days`)
  
  // Optimization suggestions
  console.log('\n💡 Optimization Options:')
  
  const optimizations = [
    { delay: 1000, desc: '1 second delay (60 req/min)' },
    { delay: 500, desc: '0.5 second delay (120 req/min)' },
    { delay: 250, desc: '0.25 second delay (240 req/min)' },
  ]
  
  optimizations.forEach(opt => {
    const optBatches = Math.ceil(CONFIG.total_florida_parcels / CONFIG.parcels_per_batch)
    const optTime = (optBatches * opt.delay) / 1000
    const optDays = optTime / 86400
    console.log(`   - ${opt.desc}: ${optDays.toFixed(1)} days`)
  })
  
  // Parallel processing suggestion
  console.log('\n🚀 Parallel Processing Options:')
  const workers = [2, 4, 8, 16]
  workers.forEach(w => {
    const parallelTime = allFloridaTime / w
    console.log(`   - ${w} parallel workers: ${formatTime(parallelTime)}`)
  })
  
  // Recommendations
  console.log('\n📋 Recommendations:')
  console.log('1. Start with test mode (5,000 parcels/county) to validate the process')
  console.log('2. Monitor for rate limit errors (429 responses)')
  console.log('3. Consider increasing batch size if API allows (1000 instead of 500)')
  console.log('4. For production, implement parallel workers with different counties')
  console.log('5. Consider loading only populated areas first (top 20 counties = 80% of parcels)')
  console.log('6. Run during off-peak hours if possible')
  console.log('7. Contact Florida GIS services for higher rate limits if needed')
}

calculateLoadTime()