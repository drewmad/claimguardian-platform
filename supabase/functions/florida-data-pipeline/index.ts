/**
 * Florida Data Pipeline Automation
 * Handles data refresh, quality monitoring, and pipeline orchestration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PipelineRequest {
  action: 'refresh_data' | 'quality_check' | 'pipeline_status' | 'schedule_refresh' | 'health_check'
  county_codes?: number[]
  data_sources?: string[]
  force_refresh?: boolean
  dry_run?: boolean
}

interface PipelineResult {
  success: boolean
  action: string
  results: Record<string, any>
  metadata: Record<string, any>
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let requestData: PipelineRequest = { action: 'pipeline_status' }
    
    if (req.method === 'POST') {
      requestData = await req.json()
    } else {
      // Handle GET requests for health checks
      const url = new URL(req.url)
      const action = url.searchParams.get('action') || 'pipeline_status'
      requestData = { action: action as PipelineRequest['action'] }
    }

    let result: PipelineResult

    switch (requestData.action) {
      case 'refresh_data':
        result = await refreshData(supabaseClient, requestData)
        break
      case 'quality_check':
        result = await performQualityCheck(supabaseClient, requestData)
        break
      case 'pipeline_status':
        result = await getPipelineStatus(supabaseClient)
        break
      case 'schedule_refresh':
        result = await scheduleDataRefresh(supabaseClient, requestData)
        break
      case 'health_check':
        result = await performHealthCheck(supabaseClient)
        break
      default:
        throw new Error(`Unknown action: ${requestData.action}`)
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Data pipeline error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function refreshData(supabase: any, request: PipelineRequest): Promise<PipelineResult> {
  const { county_codes, data_sources, force_refresh = false, dry_run = false } = request

  const refreshResults: Record<string, any> = {}
  
  if (dry_run) {
    refreshResults.message = 'Dry run mode - no actual data changes made'
    refreshResults.would_refresh_counties = county_codes || 'all'
    refreshResults.would_refresh_sources = data_sources || 'all'
    
    return {
      success: true,
      action: 'refresh_data',
      results: refreshResults,
      metadata: {
        dry_run: true,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Check last refresh times
  const { data: lastRefresh } = await supabase
    .from('data_source_status')
    .select('source_name, last_successful_update')
    .order('last_successful_update', { ascending: false })

  refreshResults.last_refresh_check = lastRefresh

  // Refresh county statistics
  if (!county_codes || county_codes.length === 0) {
    refreshResults.county_stats = await refreshCountyStats(supabase)
  } else {
    refreshResults.county_stats = await refreshCountyStats(supabase, county_codes)
  }

  // Refresh market trends
  refreshResults.market_trends = await refreshMarketTrends(supabase)

  // Update data quality metrics
  refreshResults.quality_metrics = await updateDataQualityMetrics(supabase)

  return {
    success: true,
    action: 'refresh_data',
    results: refreshResults,
    metadata: {
      processed_at: new Date().toISOString(),
      counties_processed: county_codes?.length || 'all',
      force_refresh
    }
  }
}

async function refreshCountyStats(supabase: any, county_codes?: number[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {}

  // Get list of counties to process
  let counties: number[]
  if (county_codes) {
    counties = county_codes
  } else {
    const { data } = await supabase
      .from('florida_parcels')
      .select('co_no')
      .limit(1000) // Prevent overwhelming query

    counties = [...new Set((data || []).map((row: any) => row.co_no))]
  }

  results.counties_to_process = counties.length

  // Process each county
  for (const countyCode of counties.slice(0, 10)) { // Limit to prevent timeout
    try {
      const { data: countyStats } = await supabase
        .rpc('get_county_statistics', { county_code_param: countyCode })

      if (countyStats && countyStats.length > 0) {
        const stats = countyStats[0]
        
        // Upsert county statistics
        await supabase
          .from('county_market_stats')
          .upsert({
            county_code: countyCode,
            county_name: getCountyName(countyCode),
            total_parcels: stats.total_parcels,
            median_property_value: stats.median_value,
            residential_parcels: Math.floor(stats.total_parcels * 0.75), // Estimate
            high_risk_parcels: stats.flood_risk_parcels,
            calculation_date: new Date().toISOString()
          }, { onConflict: 'county_code' })

        results[`county_${countyCode}`] = {
          updated: true,
          total_parcels: stats.total_parcels,
          median_value: stats.median_value
        }
      }
    } catch (error) {
      results[`county_${countyCode}`] = {
        error: error.message
      }
    }
  }

  return results
}

async function refreshMarketTrends(supabase: any): Promise<Record<string, any>> {
  const results: Record<string, any> = {}
  
  // Calculate current period trends
  const currentDate = new Date()
  const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000))

  // Get sample of recent property values for trend analysis
  const { data: recentData } = await supabase
    .from('florida_parcels')
    .select('co_no, tot_val, yr_blt, situs_city, updated_at')
    .gte('updated_at', thirtyDaysAgo.toISOString())
    .limit(1000)

  if (recentData && recentData.length > 0) {
    // Group by county and calculate trends
    const countyGroups = recentData.reduce((acc: any, row: any) => {
      if (!acc[row.co_no]) acc[row.co_no] = []
      acc[row.co_no].push(row)
      return acc
    }, {})

    for (const [countyCode, properties] of Object.entries(countyGroups)) {
      const props = properties as any[]
      const avgValue = props.reduce((sum: number, p: any) => sum + (p.tot_val || 0), 0) / props.length

      // Insert trend data
      await supabase
        .from('property_value_trends')
        .insert({
          county_code: parseInt(countyCode),
          period_start: thirtyDaysAgo.toISOString().split('T')[0],
          period_end: currentDate.toISOString().split('T')[0],
          median_value: avgValue,
          sales_count: props.length,
          mom_change: 2.5, // Placeholder
          yoy_change: 8.2 // Placeholder
        })

      results[`county_${countyCode}_trend`] = {
        properties_analyzed: props.length,
        avg_value: avgValue
      }
    }
  }

  return results
}

async function updateDataQualityMetrics(supabase: any): Promise<Record<string, any>> {
  const results: Record<string, any> = {}
  const tables = ['florida_parcels', 'property_risk_assessments', 'property_market_analysis']

  for (const tableName of tables) {
    try {
      // Get table statistics
      const { data: tableData } = await supabase
        .from(tableName)
        .select('*')
        .limit(1000) // Sample for quality assessment

      if (tableData) {
        const totalRecords = tableData.length
        let completeRecords = 0
        let missingCriticalFields = 0
        let invalidGeometries = 0

        // Analyze data quality
        for (const record of tableData) {
          // Check completeness (example logic)
          if (tableName === 'florida_parcels') {
            const hasRequiredFields = record.parcel_id && record.co_no && record.tot_val
            if (hasRequiredFields) completeRecords++
            else missingCriticalFields++

            // Check geometry validity (placeholder)
            if (!record.geometry) invalidGeometries++
          } else {
            completeRecords++
          }
        }

        // Insert quality metrics
        await supabase
          .from('data_quality_metrics')
          .insert({
            table_name: tableName,
            metric_date: new Date().toISOString().split('T')[0],
            total_records: totalRecords,
            complete_records: completeRecords,
            completeness_rate: (completeRecords / totalRecords) * 100,
            missing_critical_fields: missingCriticalFields,
            invalid_geometries: invalidGeometries,
            geometry_quality_score: tableName === 'florida_parcels' ? 
              ((totalRecords - invalidGeometries) / totalRecords) : 1.0
          })

        results[tableName] = {
          total_records: totalRecords,
          completeness_rate: (completeRecords / totalRecords) * 100,
          quality_issues: missingCriticalFields + invalidGeometries
        }
      }
    } catch (error) {
      results[tableName] = { error: error.message }
    }
  }

  return results
}

async function performQualityCheck(supabase: any, request: PipelineRequest): Promise<PipelineResult> {
  const qualityResults: Record<string, any> = {}

  // Check for data anomalies
  qualityResults.anomalies = await checkDataAnomalies(supabase)
  
  // Check data freshness
  qualityResults.freshness = await checkDataFreshness(supabase)
  
  // Check completeness
  qualityResults.completeness = await checkDataCompleteness(supabase)

  // Overall quality score
  const scores = [
    qualityResults.anomalies?.score || 0.5,
    qualityResults.freshness?.score || 0.5,
    qualityResults.completeness?.score || 0.5
  ]
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length

  return {
    success: true,
    action: 'quality_check',
    results: {
      ...qualityResults,
      overall_quality_score: overallScore,
      status: overallScore > 0.8 ? 'GOOD' : overallScore > 0.6 ? 'FAIR' : 'POOR'
    },
    metadata: {
      checked_at: new Date().toISOString(),
      check_type: 'comprehensive'
    }
  }
}

async function checkDataAnomalies(supabase: any): Promise<Record<string, any>> {
  const results: Record<string, any> = {}
  
  // Check for extreme property values
  const { data: extremeValues } = await supabase
    .from('florida_parcels')
    .select('parcel_id, tot_val, co_no')
    .or('tot_val.gt.10000000,tot_val.lt.1000')
    .limit(100)

  results.extreme_values = {
    count: extremeValues?.length || 0,
    samples: extremeValues?.slice(0, 5) || []
  }

  // Check for duplicate parcels
  const { data: duplicates } = await supabase
    .from('florida_parcels')
    .select('parcel_id')
    .limit(1000)

  const parcelIds = (duplicates || []).map((d: any) => d.parcel_id)
  const uniqueIds = new Set(parcelIds)
  
  results.duplicates = {
    total_checked: parcelIds.length,
    unique_count: uniqueIds.size,
    duplicate_count: parcelIds.length - uniqueIds.size
  }

  results.score = 1 - (results.extreme_values.count + results.duplicates.duplicate_count) / 1000

  return results
}

async function checkDataFreshness(supabase: any): Promise<Record<string, any>> {
  const results: Record<string, any> = {}
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

  // Check when data sources were last updated
  const { data: sourceStatus } = await supabase
    .from('data_source_status')
    .select('source_name, last_successful_update, expected_update_frequency')

  results.sources = (sourceStatus || []).map((source: any) => ({
    name: source.source_name,
    last_update: source.last_successful_update,
    is_stale: new Date(source.last_successful_update) < cutoffDate,
    expected_frequency: source.expected_update_frequency
  }))

  const staleCount = results.sources.filter((s: any) => s.is_stale).length
  results.freshness_score = 1 - (staleCount / Math.max(results.sources.length, 1))
  results.stale_sources = staleCount

  results.score = results.freshness_score

  return results
}

async function checkDataCompleteness(supabase: any): Promise<Record<string, any>> {
  const results: Record<string, any> = {}

  // Check critical field completeness in florida_parcels
  const { data: parcels } = await supabase
    .from('florida_parcels')
    .select('parcel_id, co_no, tot_val, yr_blt, situs_addr_1')
    .limit(1000)

  if (parcels) {
    const total = parcels.length
    const complete = parcels.filter((p: any) => 
      p.parcel_id && p.co_no && p.tot_val && p.situs_addr_1
    ).length

    results.florida_parcels = {
      total_records: total,
      complete_records: complete,
      completeness_rate: (complete / total) * 100
    }
  }

  // Calculate overall completeness score
  results.score = (results.florida_parcels?.completeness_rate || 0) / 100

  return results
}

async function getPipelineStatus(supabase: any): Promise<PipelineResult> {
  const status: Record<string, any> = {}

  // Get data source statuses
  const { data: sources } = await supabase
    .from('data_source_status')
    .select('*')
    .order('last_check_time', { ascending: false })

  status.data_sources = sources || []

  // Get recent quality metrics
  const { data: qualityMetrics } = await supabase
    .from('data_quality_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  status.recent_quality_metrics = qualityMetrics || []

  // Get pipeline health
  status.health = {
    active_sources: (sources || []).filter((s: any) => s.status === 'ACTIVE').length,
    total_sources: (sources || []).length,
    avg_quality_score: qualityMetrics ? 
      qualityMetrics.reduce((sum: number, m: any) => sum + (m.completeness_rate || 0), 0) / qualityMetrics.length : 0
  }

  return {
    success: true,
    action: 'pipeline_status',
    results: status,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  }
}

async function scheduleDataRefresh(supabase: any, request: PipelineRequest): Promise<PipelineResult> {
  // This would integrate with a job scheduling system
  // For now, just log the schedule request
  
  const scheduleResults: Record<string, any> = {
    message: 'Schedule refresh request received',
    county_codes: request.county_codes,
    data_sources: request.data_sources,
    scheduled_for: new Date(Date.now() + 60000).toISOString() // Schedule for 1 minute from now
  }

  return {
    success: true,
    action: 'schedule_refresh',
    results: scheduleResults,
    metadata: {
      scheduled_at: new Date().toISOString()
    }
  }
}

async function performHealthCheck(supabase: any): Promise<PipelineResult> {
  const healthResults: Record<string, any> = {}

  try {
    // Test database connectivity
    const { data } = await supabase
      .from('florida_parcels')
      .select('count()')
      .limit(1)

    healthResults.database_connectivity = 'OK'
    healthResults.sample_query_time = Date.now()

    // Check critical tables exist
    const tables = ['florida_parcels', 'property_risk_assessments', 'data_source_status']
    for (const table of tables) {
      try {
        await supabase.from(table).select('count()').limit(1)
        healthResults[`table_${table}`] = 'EXISTS'
      } catch {
        healthResults[`table_${table}`] = 'ERROR'
      }
    }

    healthResults.overall_status = 'HEALTHY'

  } catch (error) {
    healthResults.database_connectivity = 'ERROR'
    healthResults.error = error.message
    healthResults.overall_status = 'UNHEALTHY'
  }

  return {
    success: true,
    action: 'health_check',
    results: healthResults,
    metadata: {
      checked_at: new Date().toISOString(),
      environment: Deno.env.get('NODE_ENV') || 'production'
    }
  }
}

// Helper function to get county name from code
function getCountyName(countyCode: number): string {
  const countyNames: Record<number, string> = {
    11: 'ALACHUA', 12: 'BAKER', 13: 'BAY', 14: 'BRADFORD', 15: 'BREVARD',
    16: 'BROWARD', 17: 'CALHOUN', 18: 'CHARLOTTE', 19: 'CITRUS', 20: 'CLAY',
    21: 'COLLIER', 22: 'COLUMBIA', 23: 'DESOTO', 24: 'DIXIE', 25: 'DUVAL',
    26: 'ESCAMBIA', 27: 'FLAGLER', 28: 'FRANKLIN', 29: 'GADSDEN', 30: 'GILCHRIST',
    31: 'GLADES', 32: 'GULF', 33: 'HAMILTON', 34: 'HARDEE', 35: 'HENDRY',
    36: 'HERNANDO', 37: 'HIGHLANDS', 38: 'HILLSBOROUGH', 39: 'HOLMES', 40: 'INDIAN RIVER',
    41: 'JACKSON', 42: 'JEFFERSON', 43: 'LAFAYETTE', 44: 'LAKE', 45: 'LEE',
    46: 'LEON', 47: 'LEVY', 48: 'LIBERTY', 49: 'MADISON', 50: 'MANATEE',
    51: 'MARION', 52: 'MARTIN', 53: 'MIAMI-DADE', 54: 'MONROE', 55: 'NASSAU',
    56: 'OKALOOSA', 57: 'OKEECHOBEE', 58: 'ORANGE', 59: 'OSCEOLA', 60: 'PALM BEACH',
    61: 'PASCO', 62: 'PINELLAS', 63: 'POLK', 64: 'PUTNAM', 65: 'ST. JOHNS',
    66: 'ST. LUCIE', 67: 'SANTA ROSA', 68: 'SARASOTA', 69: 'SEMINOLE', 70: 'SUMTER',
    71: 'SUWANNEE', 72: 'TAYLOR', 73: 'UNION', 74: 'VOLUSIA', 75: 'WAKULLA',
    76: 'WALTON', 77: 'WASHINGTON'
  }
  
  return countyNames[countyCode] || 'UNKNOWN'
}