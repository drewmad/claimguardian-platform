import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extended county information with more details
const COUNTY_INFO: Record<number, {
  name: string;
  population: number;
  parcels_estimate: number;
  area_sqmi: number;
  region: string;
  major_cities: string[];
}> = {
  1: { name: "ALACHUA", population: 278468, parcels_estimate: 110000, area_sqmi: 969, region: "North Central", major_cities: ["Gainesville"] },
  2: { name: "BAKER", population: 28259, parcels_estimate: 12000, area_sqmi: 588, region: "Northeast", major_cities: ["Macclenny"] },
  3: { name: "BAY", population: 175216, parcels_estimate: 85000, area_sqmi: 1033, region: "Panhandle", major_cities: ["Panama City"] },
  4: { name: "BRADFORD", population: 28303, parcels_estimate: 13000, area_sqmi: 300, region: "North Central", major_cities: ["Starke"] },
  5: { name: "BREVARD", population: 606612, parcels_estimate: 280000, area_sqmi: 1557, region: "East Central", major_cities: ["Melbourne", "Palm Bay", "Titusville"] },
  6: { name: "BROWARD", population: 1944375, parcels_estimate: 720000, area_sqmi: 1320, region: "Southeast", major_cities: ["Fort Lauderdale", "Hollywood", "Pembroke Pines"] },
  7: { name: "CALHOUN", population: 13648, parcels_estimate: 8000, area_sqmi: 574, region: "Panhandle", major_cities: ["Blountstown"] },
  8: { name: "CHARLOTTE", population: 188910, parcels_estimate: 343620, area_sqmi: 859, region: "Southwest", major_cities: ["Port Charlotte", "Punta Gorda"] },
  9: { name: "CITRUS", population: 153843, parcels_estimate: 95000, area_sqmi: 773, region: "West Central", major_cities: ["Inverness", "Crystal River"] },
  10: { name: "CLAY", population: 218245, parcels_estimate: 85000, area_sqmi: 644, region: "Northeast", major_cities: ["Orange Park", "Green Cove Springs"] },
  11: { name: "COLLIER", population: 375752, parcels_estimate: 200000, area_sqmi: 2305, region: "Southwest", major_cities: ["Naples", "Marco Island"] },
  12: { name: "COLUMBIA", population: 69698, parcels_estimate: 35000, area_sqmi: 801, region: "North Central", major_cities: ["Lake City"] },
  13: { name: "MIAMI-DADE", population: 2716940, parcels_estimate: 950000, area_sqmi: 2431, region: "Southeast", major_cities: ["Miami", "Hialeah", "Miami Beach"] },
  14: { name: "DESOTO", population: 35440, parcels_estimate: 18000, area_sqmi: 639, region: "Southwest", major_cities: ["Arcadia"] },
  15: { name: "DIXIE", population: 16759, parcels_estimate: 12000, area_sqmi: 864, region: "North Central", major_cities: ["Cross City"] },
  16: { name: "DUVAL", population: 995298, parcels_estimate: 380000, area_sqmi: 918, region: "Northeast", major_cities: ["Jacksonville"] },
  17: { name: "ESCAMBIA", population: 321905, parcels_estimate: 145000, area_sqmi: 875, region: "Panhandle", major_cities: ["Pensacola"] },
  18: { name: "FLAGLER", population: 115378, parcels_estimate: 65000, area_sqmi: 571, region: "Northeast", major_cities: ["Palm Coast"] },
  19: { name: "FRANKLIN", population: 12125, parcels_estimate: 15000, area_sqmi: 1026, region: "Panhandle", major_cities: ["Apalachicola"] },
  20: { name: "GADSDEN", population: 45660, parcels_estimate: 22000, area_sqmi: 529, region: "Panhandle", major_cities: ["Quincy"] },
  21: { name: "GILCHRIST", population: 18582, parcels_estimate: 10000, area_sqmi: 353, region: "North Central", major_cities: ["Trenton"] },
  22: { name: "GLADES", population: 13811, parcels_estimate: 8000, area_sqmi: 984, region: "South Central", major_cities: ["Moore Haven"] },
  23: { name: "GULF", population: 14817, parcels_estimate: 12000, area_sqmi: 745, region: "Panhandle", major_cities: ["Port St. Joe"] },
  24: { name: "HAMILTON", population: 14428, parcels_estimate: 7000, area_sqmi: 519, region: "North Central", major_cities: ["Jasper"] },
  25: { name: "HARDEE", population: 25773, parcels_estimate: 12000, area_sqmi: 638, region: "Central", major_cities: ["Wauchula"] },
  26: { name: "HENDRY", population: 42022, parcels_estimate: 18000, area_sqmi: 1190, region: "South Central", major_cities: ["LaBelle", "Clewiston"] },
  27: { name: "HERNANDO", population: 194515, parcels_estimate: 95000, area_sqmi: 589, region: "West Central", major_cities: ["Brooksville", "Spring Hill"] },
  28: { name: "HIGHLANDS", population: 101235, parcels_estimate: 60000, area_sqmi: 1106, region: "Central", major_cities: ["Sebring", "Avon Park"] },
  29: { name: "HILLSBOROUGH", population: 1459762, parcels_estimate: 520000, area_sqmi: 1266, region: "West Central", major_cities: ["Tampa", "Brandon", "Plant City"] },
  30: { name: "HOLMES", population: 19653, parcels_estimate: 11000, area_sqmi: 489, region: "Panhandle", major_cities: ["Bonifay"] },
  31: { name: "INDIAN RIVER", population: 159923, parcels_estimate: 85000, area_sqmi: 617, region: "East Central", major_cities: ["Vero Beach", "Sebastian"] },
  32: { name: "JACKSON", population: 47409, parcels_estimate: 25000, area_sqmi: 955, region: "Panhandle", major_cities: ["Marianna"] },
  33: { name: "JEFFERSON", population: 14510, parcels_estimate: 8000, area_sqmi: 637, region: "North Central", major_cities: ["Monticello"] },
  34: { name: "LAFAYETTE", population: 8226, parcels_estimate: 5000, area_sqmi: 548, region: "North Central", major_cities: ["Mayo"] },
  35: { name: "LAKE", population: 383956, parcels_estimate: 180000, area_sqmi: 1156, region: "Central", major_cities: ["Leesburg", "Eustis", "Clermont"] },
  36: { name: "LEE", population: 760822, parcels_estimate: 380000, area_sqmi: 1212, region: "Southwest", major_cities: ["Fort Myers", "Cape Coral"] },
  37: { name: "LEON", population: 293582, parcels_estimate: 120000, area_sqmi: 702, region: "Panhandle", major_cities: ["Tallahassee"] },
  38: { name: "LEVY", population: 42915, parcels_estimate: 28000, area_sqmi: 1412, region: "North Central", major_cities: ["Chiefland", "Williston"] },
  39: { name: "LIBERTY", population: 7974, parcels_estimate: 5000, area_sqmi: 843, region: "Panhandle", major_cities: ["Bristol"] },
  40: { name: "MADISON", population: 18493, parcels_estimate: 9000, area_sqmi: 716, region: "North Central", major_cities: ["Madison"] },
  41: { name: "MANATEE", population: 399710, parcels_estimate: 185000, area_sqmi: 893, region: "Southwest", major_cities: ["Bradenton", "Palmetto"] },
  42: { name: "MARION", population: 375908, parcels_estimate: 180000, area_sqmi: 1663, region: "North Central", major_cities: ["Ocala"] },
  43: { name: "MARTIN", population: 158431, parcels_estimate: 85000, area_sqmi: 753, region: "Southeast", major_cities: ["Stuart"] },
  44: { name: "MONROE", population: 82874, parcels_estimate: 55000, area_sqmi: 3737, region: "South", major_cities: ["Key West", "Marathon"] },
  45: { name: "NASSAU", population: 90352, parcels_estimate: 45000, area_sqmi: 726, region: "Northeast", major_cities: ["Fernandina Beach", "Yulee"] },
  46: { name: "OKALOOSA", population: 211668, parcels_estimate: 95000, area_sqmi: 1082, region: "Panhandle", major_cities: ["Fort Walton Beach", "Destin", "Crestview"] },
  47: { name: "OKEECHOBEE", population: 39476, parcels_estimate: 20000, area_sqmi: 892, region: "South Central", major_cities: ["Okeechobee"] },
  48: { name: "ORANGE", population: 1429908, parcels_estimate: 480000, area_sqmi: 1003, region: "Central", major_cities: ["Orlando", "Apopka", "Winter Park"] },
  49: { name: "OSCEOLA", population: 388656, parcels_estimate: 145000, area_sqmi: 1506, region: "Central", major_cities: ["Kissimmee", "St. Cloud"] },
  50: { name: "PALM BEACH", population: 1492191, parcels_estimate: 650000, area_sqmi: 2383, region: "Southeast", major_cities: ["West Palm Beach", "Boca Raton", "Boynton Beach"] },
  51: { name: "PASCO", population: 561891, parcels_estimate: 240000, area_sqmi: 868, region: "West Central", major_cities: ["New Port Richey", "Land O' Lakes"] },
  52: { name: "PINELLAS", population: 959107, parcels_estimate: 480000, area_sqmi: 608, region: "West Central", major_cities: ["St. Petersburg", "Clearwater", "Largo"] },
  53: { name: "POLK", population: 724777, parcels_estimate: 290000, area_sqmi: 2010, region: "Central", major_cities: ["Lakeland", "Winter Haven", "Bartow"] },
  54: { name: "PUTNAM", population: 73321, parcels_estimate: 40000, area_sqmi: 827, region: "Northeast", major_cities: ["Palatka"] },
  55: { name: "ST. JOHNS", population: 273425, parcels_estimate: 115000, area_sqmi: 822, region: "Northeast", major_cities: ["St. Augustine", "St. Johns"] },
  56: { name: "ST. LUCIE", population: 329226, parcels_estimate: 145000, area_sqmi: 688, region: "Southeast", major_cities: ["Port St. Lucie", "Fort Pierce"] },
  57: { name: "SANTA ROSA", population: 188000, parcels_estimate: 85000, area_sqmi: 1174, region: "Panhandle", major_cities: ["Milton", "Navarre"] },
  58: { name: "SARASOTA", population: 434006, parcels_estimate: 220000, area_sqmi: 725, region: "Southwest", major_cities: ["Sarasota", "Venice", "North Port"] },
  59: { name: "SEMINOLE", population: 470856, parcels_estimate: 180000, area_sqmi: 345, region: "Central", major_cities: ["Sanford", "Altamonte Springs"] },
  60: { name: "SUMTER", population: 129752, parcels_estimate: 85000, area_sqmi: 580, region: "Central", major_cities: ["The Villages", "Wildwood"] },
  61: { name: "SUWANNEE", population: 43474, parcels_estimate: 22000, area_sqmi: 692, region: "North Central", major_cities: ["Live Oak"] },
  62: { name: "TAYLOR", population: 21796, parcels_estimate: 12000, area_sqmi: 1231, region: "North Central", major_cities: ["Perry"] },
  63: { name: "UNION", population: 15237, parcels_estimate: 7000, area_sqmi: 250, region: "North Central", major_cities: ["Lake Butler"] },
  64: { name: "VOLUSIA", population: 553543, parcels_estimate: 280000, area_sqmi: 1432, region: "East Central", major_cities: ["Daytona Beach", "Deltona", "Port Orange"] },
  65: { name: "WAKULLA", population: 33764, parcels_estimate: 18000, area_sqmi: 736, region: "Panhandle", major_cities: ["Crawfordville"] },
  66: { name: "WALTON", population: 75305, parcels_estimate: 55000, area_sqmi: 1238, region: "Panhandle", major_cities: ["DeFuniak Springs", "Santa Rosa Beach"] },
  67: { name: "WASHINGTON", population: 25473, parcels_estimate: 14000, area_sqmi: 616, region: "Panhandle", major_cities: ["Chipley"] }
};

interface MonitorRequest {
  view: 'dashboard' | 'timeline' | 'errors' | 'performance' | 'detailed' | 'regions' | 'predictions';
  county_code?: number;
  limit?: number;
  region?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      view = 'dashboard',
      county_code,
      limit = 50,
      region
    } = await req.json() as MonitorRequest;

    switch (view) {
      case 'dashboard':
        return await getEnhancedDashboard(supabase);

      case 'timeline':
        return await getEnhancedTimeline(supabase, limit);

      case 'errors':
        return await getDetailedErrors(supabase, county_code, limit);

      case 'performance':
        return await getDetailedPerformance(supabase);

      case 'detailed':
        return await getDetailedCountyInfo(supabase, county_code);

      case 'regions':
        return await getRegionalAnalysis(supabase, region);

      case 'predictions':
        return await getPredictions(supabase);

      default:
        throw new Error(`Invalid view: ${view}`);
    }

  } catch (error) {
    console.error('Monitor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function getEnhancedDashboard(supabase: any): Promise<Response> {
  // Get overall statistics with enhanced queries
  const [
    { count: totalParcels },
    { data: logs },
    { data: orchestratorJobs },
    { data: recentActivity },
    { data: errorSummary }
  ] = await Promise.all([
    supabase.from('florida_parcels').select('*', { count: 'exact', head: true }),
    supabase.from('florida_parcels_processing_log').select('*').order('updated_at', { ascending: false }),
    supabase.from('florida_parcels_orchestrator').select('*').order('created_at', { ascending: false }).limit(1),
    supabase.from('florida_parcels_processing_log')
      .select('county_code, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase.from('florida_parcels_processing_log')
      .select('county_code, error_message, error_count')
      .not('error_message', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10)
  ]);

  // Calculate enhanced statistics
  const countyStats = new Map<number, any>();

  // Initialize all counties with extended info
  for (const [code, info] of Object.entries(COUNTY_INFO)) {
    const countyCode = parseInt(code);
    countyStats.set(countyCode, {
      county_code: countyCode,
      county_name: info.name,
      population: info.population,
      estimated_parcels: info.parcels_estimate,
      area_sqmi: info.area_sqmi,
      region: info.region,
      major_cities: info.major_cities,
      actual_parcels: 0,
      status: 'pending',
      progress: 0,
      last_updated: null,
      processing_time: null,
      errors: 0,
      parcels_per_minute: 0,
      parcels_per_capita: 0,
      density: 0
    });
  }

  // Update with actual data and calculate metrics
  for (const log of logs || []) {
    const stats = countyStats.get(log.county_code);
    if (stats) {
      stats.actual_parcels = log.processed_parcels || 0;
      stats.status = log.status;
      stats.progress = log.total_parcels > 0
        ? Math.round((log.processed_parcels / log.total_parcels) * 100)
        : 0;
      stats.last_updated = log.updated_at;
      stats.errors = log.error_count || 0;

      // Calculate processing metrics
      if (log.started_at && log.completed_at) {
        const start = new Date(log.started_at).getTime();
        const end = new Date(log.completed_at).getTime();
        const minutes = (end - start) / 1000 / 60;
        stats.processing_time = Math.round(minutes);
        stats.parcels_per_minute = minutes > 0 ? Math.round(log.processed_parcels / minutes) : 0;
      }

      // Calculate density metrics
      stats.parcels_per_capita = stats.population > 0
        ? (stats.actual_parcels / stats.population).toFixed(3)
        : 0;
      stats.density = stats.area_sqmi > 0
        ? Math.round(stats.actual_parcels / stats.area_sqmi)
        : 0;
    }
  }

  // Convert to array and group by region
  const countiesArray = Array.from(countyStats.values());
  const regionStats = groupByRegion(countiesArray);

  // Calculate predictions
  const predictions = calculatePredictions(countiesArray);

  // Enhanced summary statistics
  const summary = {
    total_parcels_processed: totalParcels || 0,
    total_parcels_estimated: Object.values(COUNTY_INFO).reduce((sum, info) => sum + info.parcels_estimate, 0),
    counties_completed: countiesArray.filter(c => c.status === 'completed').length,
    counties_processing: countiesArray.filter(c => c.status === 'processing').length,
    counties_with_errors: countiesArray.filter(c => c.status === 'error' || c.status === 'completed_with_errors').length,
    counties_pending: countiesArray.filter(c => c.status === 'pending').length,
    overall_progress: Math.round((totalParcels || 0) / Object.values(COUNTY_INFO).reduce((sum, info) => sum + info.parcels_estimate, 0) * 100),
    current_orchestrator_job: orchestratorJobs?.[0] || null,
    last_update: new Date().toISOString(),
    // New metrics
    total_area_processed: countiesArray
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + c.area_sqmi, 0),
    total_population_covered: countiesArray
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + c.population, 0),
    average_density: Math.round(
      countiesArray
        .filter(c => c.actual_parcels > 0)
        .reduce((sum, c) => sum + c.density, 0) /
      countiesArray.filter(c => c.actual_parcels > 0).length || 1
    ),
    estimated_completion_time: predictions.estimated_completion_time,
    estimated_total_cost: predictions.estimated_total_cost
  };

  // Performance metrics with enhanced calculations
  const completedCounties = countiesArray.filter(c => c.processing_time);
  const performance = calculateEnhancedPerformance(completedCounties);

  // Recent activity timeline
  const activityTimeline = recentActivity?.map((activity: any) => ({
    timestamp: activity.updated_at,
    county_code: activity.county_code,
    county_name: COUNTY_INFO[activity.county_code]?.name || 'Unknown',
    status: activity.status
  })) || [];

  // Error analysis
  const errorAnalysis = analyzeErrors(errorSummary || []);

  return new Response(
    JSON.stringify({
      summary,
      performance,
      counties: countiesArray.sort((a, b) => {
        const statusOrder = {
          'processing': 0,
          'error': 1,
          'completed_with_errors': 2,
          'completed': 3,
          'pending': 4
        };

        const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 5;
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 5;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return b.progress - a.progress;
      }),
      regions: regionStats,
      predictions,
      activity_timeline: activityTimeline,
      error_analysis: errorAnalysis,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getEnhancedTimeline(supabase: any, limit: number): Promise<Response> {
  // Get processing activities with more context
  const { data: logs } = await supabase
    .from('florida_parcels_processing_log')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  // Get system events
  const { data: systemEvents } = await supabase
    .from('system_logs')
    .select('*')
    .like('module', '%parcels%')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Transform to enhanced timeline events
  const timeline = logs?.map((log: any) => {
    const countyInfo = COUNTY_INFO[log.county_code];
    const processingRate = log.processing_time > 0
      ? Math.round(log.processed_parcels / log.processing_time)
      : 0;

    return {
      timestamp: log.updated_at,
      county_code: log.county_code,
      county_name: countyInfo?.name || 'Unknown',
      region: countyInfo?.region || 'Unknown',
      event_type: getEventType(log),
      status: log.status,
      progress: log.total_parcels > 0
        ? Math.round((log.processed_parcels / log.total_parcels) * 100)
        : 0,
      parcels_processed: log.processed_parcels,
      total_parcels: log.total_parcels,
      processing_rate: processingRate,
      error_message: log.error_message,
      duration_minutes: log.processing_time,
      batch_size: log.batch_size
    };
  }) || [];

  // Calculate timeline statistics
  const timelineStats = {
    events_in_last_hour: timeline.filter((e: any) =>
      new Date(e.timestamp).getTime() > Date.now() - 3600000
    ).length,
    average_processing_rate: Math.round(
      timeline.reduce((sum: number, e: any) => sum + e.processing_rate, 0) / timeline.length || 1
    ),
    most_active_region: getMostActiveRegion(timeline)
  };

  return new Response(
    JSON.stringify({
      timeline,
      system_events: systemEvents,
      statistics: timelineStats,
      count: timeline.length,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getDetailedErrors(supabase: any, countyCode?: number, limit: number = 50): Promise<Response> {
  // Build enhanced error query
  let query = supabase
    .from('florida_parcels_processing_log')
    .select('*')
    .or('status.eq.error,status.eq.completed_with_errors')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (countyCode) {
    query = query.eq('county_code', countyCode);
  }

  const { data: errorLogs } = await query;

  // Get detailed system logs
  const { data: systemLogs } = await supabase
    .from('system_logs')
    .select('*')
    .eq('level', 'error')
    .like('module', '%parcels%')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Get error patterns from stats
  const { data: errorStats } = await supabase
    .from('florida_parcels_processing_stats')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  // Transform and analyze error data
  const errors = errorLogs?.map((log: any) => {
    const countyInfo = COUNTY_INFO[log.county_code];

    return {
      timestamp: log.updated_at,
      county_code: log.county_code,
      county_name: countyInfo?.name || 'Unknown',
      region: countyInfo?.region || 'Unknown',
      error_type: log.status,
      error_message: log.error_message,
      error_count: log.error_count,
      parcels_affected: log.total_parcels - log.processed_parcels,
      can_resume: log.last_batch_index != null,
      resume_from_batch: log.last_batch_index,
      processing_duration: log.processing_time,
      last_successful_batch: log.last_successful_batch,
      suggested_action: getSuggestedAction(log.error_message)
    };
  }) || [];

  // Aggregate error statistics with patterns
  const errorPatterns = identifyErrorPatterns(errors, systemLogs);
  const errorStats = {
    total_errors: errors.length,
    counties_affected: new Set(errors.map(e => e.county_code)).size,
    parcels_affected: errors.reduce((sum, e) => sum + (e.parcels_affected || 0), 0),
    common_errors: getCommonErrors(errors),
    error_patterns: errorPatterns,
    recent_system_errors: systemLogs?.slice(0, 10) || [],
    recovery_suggestions: getRecoverySuggestions(errorPatterns),
    estimated_recovery_time: calculateRecoveryTime(errors)
  };

  return new Response(
    JSON.stringify({
      errors,
      statistics: errorStats,
      patterns: errorPatterns,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getDetailedPerformance(supabase: any): Promise<Response> {
  // Get comprehensive performance data
  const [
    { data: completedLogs },
    { data: processingStats },
    { data: systemMetrics }
  ] = await Promise.all([
    supabase
      .from('florida_parcels_processing_log')
      .select('*')
      .in('status', ['completed', 'completed_with_errors'])
      .not('completed_at', 'is', null)
      .not('started_at', 'is', null),
    supabase
      .from('florida_parcels_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('system_logs')
      .select('*')
      .eq('module', 'performance')
      .order('created_at', { ascending: false })
      .limit(50)
  ]);

  // Calculate detailed performance metrics
  const countyPerformance = completedLogs?.map((log: any) => {
    const countyInfo = COUNTY_INFO[log.county_code];
    const startTime = new Date(log.started_at).getTime();
    const endTime = new Date(log.completed_at).getTime();
    const durationMinutes = (endTime - startTime) / 1000 / 60;
    const parcelsPerMinute = durationMinutes > 0 ? Math.round(log.processed_parcels / durationMinutes) : 0;
    const parcelsPerBatch = log.batch_size > 0 ? Math.round(log.processed_parcels / log.batch_size) : 0;

    return {
      county_code: log.county_code,
      county_name: countyInfo?.name || 'Unknown',
      region: countyInfo?.region || 'Unknown',
      parcels_processed: log.processed_parcels,
      duration_minutes: Math.round(durationMinutes),
      parcels_per_minute: parcelsPerMinute,
      batch_size: log.batch_size,
      batches_processed: Math.ceil(log.processed_parcels / log.batch_size),
      errors: log.error_count || 0,
      efficiency_score: calculateEfficiencyScore(parcelsPerMinute, log.error_count || 0),
      throughput_mbps: calculateThroughput(log.processed_parcels, durationMinutes),
      cost_estimate: calculateCost(log.processed_parcels, durationMinutes),
      performance_grade: getPerformanceGrade(parcelsPerMinute, log.error_count || 0)
    };
  }) || [];

  // Analyze performance by various dimensions
  const performanceAnalysis = {
    by_region: analyzeByRegion(countyPerformance),
    by_batch_size: analyzeByBatchSize(countyPerformance),
    by_time_of_day: analyzeByTimeOfDay(completedLogs || []),
    optimization_recommendations: getOptimizationRecommendations(countyPerformance)
  };

  // Calculate advanced aggregates
  const summary = calculateAdvancedPerformanceSummary(countyPerformance);

  return new Response(
    JSON.stringify({
      summary,
      county_performance: countyPerformance.sort((a, b) => b.efficiency_score - a.efficiency_score),
      analysis: performanceAnalysis,
      trends: analyzeTrends(processingStats || []),
      system_metrics: systemMetrics,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getDetailedCountyInfo(supabase: any, countyCode?: number): Promise<Response> {
  if (!countyCode) {
    return new Response(
      JSON.stringify({ error: 'County code required' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  // Get all data for specific county
  const [
    { data: processingLog },
    { data: parcels, count: parcelCount },
    { data: errorLogs },
    { data: activityLogs }
  ] = await Promise.all([
    supabase
      .from('florida_parcels_processing_log')
      .select('*')
      .eq('county_code', countyCode)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('florida_parcels')
      .select('*', { count: 'exact', head: true })
      .eq('CO_NO', countyCode),
    supabase
      .from('system_logs')
      .select('*')
      .eq('level', 'error')
      .like('context', `%county:${countyCode}%`)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('florida_parcels_processing_log')
      .select('updated_at, status, processed_parcels')
      .eq('county_code', countyCode)
      .order('updated_at', { ascending: false })
      .limit(50)
  ]);

  const countyInfo = COUNTY_INFO[countyCode];

  // Calculate detailed metrics
  const detailedInfo = {
    basic_info: {
      county_code: countyCode,
      county_name: countyInfo?.name || 'Unknown',
      region: countyInfo?.region || 'Unknown',
      population: countyInfo?.population || 0,
      area_sqmi: countyInfo?.area_sqmi || 0,
      major_cities: countyInfo?.major_cities || [],
      estimated_parcels: countyInfo?.parcels_estimate || 0
    },
    processing_status: {
      current_status: processingLog?.status || 'pending',
      progress: processingLog?.progress || 0,
      parcels_processed: parcelCount || 0,
      last_updated: processingLog?.updated_at,
      started_at: processingLog?.started_at,
      completed_at: processingLog?.completed_at,
      processing_time_minutes: processingLog?.processing_time,
      error_count: processingLog?.error_count || 0,
      last_error: processingLog?.error_message
    },
    performance_metrics: {
      parcels_per_minute: processingLog?.parcels_per_minute || 0,
      average_batch_time: processingLog?.average_batch_time || 0,
      efficiency_score: calculateEfficiencyScore(
        processingLog?.parcels_per_minute || 0,
        processingLog?.error_count || 0
      ),
      estimated_completion: calculateEstimatedCompletion(processingLog)
    },
    data_quality: {
      completeness_score: calculateCompletenessScore(parcelCount || 0, countyInfo?.parcels_estimate || 0),
      error_rate: processingLog?.error_count > 0
        ? ((processingLog.error_count / (parcelCount || 1)) * 100).toFixed(2) + '%'
        : '0%',
      data_validation_status: 'pending'
    },
    activity_history: activityLogs?.map((log: any) => ({
      timestamp: log.updated_at,
      status: log.status,
      parcels: log.processed_parcels
    })) || [],
    error_history: errorLogs || [],
    recommendations: getCountyRecommendations(processingLog, countyInfo)
  };

  return new Response(
    JSON.stringify(detailedInfo),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getRegionalAnalysis(supabase: any, region?: string): Promise<Response> {
  // Get all county data
  const { data: logs } = await supabase
    .from('florida_parcels_processing_log')
    .select('*');

  const countiesArray = Object.entries(COUNTY_INFO).map(([code, info]) => {
    const countyCode = parseInt(code);
    const log = logs?.find((l: any) => l.county_code === countyCode);

    return {
      county_code: countyCode,
      county_name: info.name,
      region: info.region,
      population: info.population,
      area_sqmi: info.area_sqmi,
      status: log?.status || 'pending',
      progress: log?.progress || 0,
      parcels_processed: log?.processed_parcels || 0,
      estimated_parcels: info.parcels_estimate
    };
  });

  // Filter by region if specified
  const filteredCounties = region
    ? countiesArray.filter(c => c.region === region)
    : countiesArray;

  // Group by region for analysis
  const regionGroups = groupByRegion(filteredCounties);

  // Calculate regional statistics
  const regionalAnalysis = Object.entries(regionGroups).map(([regionName, counties]) => {
    const completed = counties.filter((c: any) => c.status === 'completed').length;
    const processing = counties.filter((c: any) => c.status === 'processing').length;
    const totalParcels = counties.reduce((sum: number, c: any) => sum + c.parcels_processed, 0);
    const estimatedParcels = counties.reduce((sum: number, c: any) => sum + c.estimated_parcels, 0);
    const totalPopulation = counties.reduce((sum: number, c: any) => sum + c.population, 0);
    const totalArea = counties.reduce((sum: number, c: any) => sum + c.area_sqmi, 0);

    return {
      region: regionName,
      counties_total: counties.length,
      counties_completed: completed,
      counties_processing: processing,
      counties_pending: counties.length - completed - processing,
      parcels_processed: totalParcels,
      parcels_estimated: estimatedParcels,
      progress: Math.round((totalParcels / estimatedParcels) * 100),
      population: totalPopulation,
      area_sqmi: totalArea,
      density: Math.round(totalParcels / totalArea),
      parcels_per_capita: (totalParcels / totalPopulation).toFixed(3)
    };
  });

  return new Response(
    JSON.stringify({
      regions: regionalAnalysis.sort((a, b) => b.progress - a.progress),
      counties: filteredCounties,
      summary: {
        total_regions: regionalAnalysis.length,
        most_complete: regionalAnalysis.sort((a, b) => b.progress - a.progress)[0],
        least_complete: regionalAnalysis.sort((a, b) => a.progress - b.progress)[0],
        highest_density: regionalAnalysis.sort((a, b) => b.density - a.density)[0]
      },
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getPredictions(supabase: any): Promise<Response> {
  // Get historical processing data
  const { data: logs } = await supabase
    .from('florida_parcels_processing_log')
    .select('*')
    .order('updated_at', { ascending: false });

  const predictions = calculatePredictions(logs || []);

  return new Response(
    JSON.stringify({
      predictions,
      confidence_level: 'medium',
      factors_considered: [
        'Historical processing rates',
        'County sizes and complexity',
        'Current system performance',
        'Error rates and recovery time'
      ],
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions

function getEventType(log: any): string {
  if (log.started_at && !log.completed_at && !log.failed_at) {
    return 'processing_started';
  }
  if (log.completed_at) {
    return log.error_count > 0 ? 'completed_with_errors' : 'completed';
  }
  if (log.failed_at) {
    return 'failed';
  }
  if (log.processed_parcels > 0) {
    return 'progress_update';
  }
  return 'status_change';
}

function groupByRegion(counties: any[]): Record<string, any[]> {
  return counties.reduce((groups, county) => {
    const region = county.region || 'Unknown';
    if (!groups[region]) groups[region] = [];
    groups[region].push(county);
    return groups;
  }, {} as Record<string, any[]>);
}

function calculatePredictions(counties: any[]): any {
  const processingCounties = counties.filter(c => c.status === 'processing');
  const completedCounties = counties.filter(c => c.status === 'completed');
  const pendingCounties = counties.filter(c => c.status === 'pending');

  // Calculate average processing rate
  const avgRate = completedCounties.length > 0
    ? completedCounties.reduce((sum, c) => sum + (c.parcels_per_minute || 0), 0) / completedCounties.length
    : 500; // Default estimate

  // Estimate remaining time
  const remainingParcels = pendingCounties.reduce((sum, c) => sum + (c.estimated_parcels || 0), 0);
  const estimatedMinutes = avgRate > 0 ? remainingParcels / avgRate : 0;
  const estimatedHours = Math.round(estimatedMinutes / 60);

  return {
    estimated_completion_time: new Date(Date.now() + estimatedMinutes * 60000).toISOString(),
    estimated_hours_remaining: estimatedHours,
    estimated_total_cost: (remainingParcels / 1000000) * 0.5, // $0.50 per million
    confidence_factors: {
      completed_counties: completedCounties.length,
      average_processing_rate: Math.round(avgRate),
      pending_parcels: remainingParcels
    }
  };
}

function calculateEfficiencyScore(parcelsPerMinute: number, errorCount: number): number {
  const errorPenalty = Math.max(0, 1 - (errorCount / 100));
  return Math.round(parcelsPerMinute * errorPenalty);
}

function calculateEnhancedPerformance(completedCounties: any[]): any {
  if (completedCounties.length === 0) {
    return {
      average_processing_time_minutes: 0,
      average_parcels_per_minute: 0,
      fastest_county: null,
      slowest_county: null,
      optimal_batch_size: 1000,
      performance_trends: []
    };
  }

  const totalParcels = completedCounties.reduce((sum, c) => sum + c.actual_parcels, 0);
  const totalMinutes = completedCounties.reduce((sum, c) => sum + c.processing_time, 0);
  const avgParcelsPerMinute = totalMinutes > 0 ? Math.round(totalParcels / totalMinutes) : 0;

  return {
    average_processing_time_minutes: Math.round(totalMinutes / completedCounties.length),
    average_parcels_per_minute: avgParcelsPerMinute,
    fastest_county: completedCounties.sort((a, b) => b.parcels_per_minute - a.parcels_per_minute)[0],
    slowest_county: completedCounties.sort((a, b) => a.parcels_per_minute - b.parcels_per_minute)[0],
    optimal_batch_size: 1000, // Could be calculated based on performance data
    median_processing_time: calculateMedian(completedCounties.map(c => c.processing_time)),
    standard_deviation: calculateStandardDeviation(completedCounties.map(c => c.parcels_per_minute))
  };
}

function getMostActiveRegion(timeline: any[]): string {
  const regionCounts = timeline.reduce((counts: Record<string, number>, event) => {
    counts[event.region] = (counts[event.region] || 0) + 1;
    return counts;
  }, {});

  return Object.entries(regionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';
}

function getCommonErrors(errors: any[]): any[] {
  const errorCounts = new Map<string, number>();

  errors.forEach(error => {
    if (error.error_message) {
      const key = error.error_message.substring(0, 100);
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    }
  });

  return Array.from(errorCounts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function identifyErrorPatterns(errors: any[], systemLogs: any[]): any {
  // Analyze error patterns
  const patterns = {
    timeout_errors: errors.filter(e => e.error_message?.includes('timeout')).length,
    connection_errors: errors.filter(e => e.error_message?.includes('connection')).length,
    data_errors: errors.filter(e => e.error_message?.includes('invalid') || e.error_message?.includes('null')).length,
    permission_errors: errors.filter(e => e.error_message?.includes('permission') || e.error_message?.includes('denied')).length
  };

  return {
    patterns,
    most_common: Object.entries(patterns).sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown',
    system_issues: systemLogs?.filter((log: any) => log.level === 'error').length || 0
  };
}

function getSuggestedAction(errorMessage: string): string {
  if (!errorMessage) return 'Review logs for more details';

  if (errorMessage.includes('timeout')) {
    return 'Increase timeout or reduce batch size';
  }
  if (errorMessage.includes('connection')) {
    return 'Check network connectivity and retry';
  }
  if (errorMessage.includes('permission')) {
    return 'Verify service role key and permissions';
  }
  if (errorMessage.includes('null') || errorMessage.includes('invalid')) {
    return 'Validate data format and retry with smaller batch';
  }

  return 'Contact support if issue persists';
}

function getRecoverySuggestions(patterns: any): string[] {
  const suggestions = [];

  if (patterns.patterns.timeout_errors > 0) {
    suggestions.push('Consider reducing batch size to prevent timeouts');
  }
  if (patterns.patterns.connection_errors > 0) {
    suggestions.push('Check Storage API connectivity and network stability');
  }
  if (patterns.patterns.data_errors > 0) {
    suggestions.push('Validate source data format and implement data cleaning');
  }
  if (patterns.patterns.permission_errors > 0) {
    suggestions.push('Review RLS policies and service role permissions');
  }

  return suggestions;
}

function calculateRecoveryTime(errors: any[]): number {
  // Estimate based on error types and counts
  const baseTime = 5; // minutes per error
  const complexityMultiplier = errors.some(e => e.error_type === 'error') ? 2 : 1;

  return errors.length * baseTime * complexityMultiplier;
}

function analyzeErrors(errorSummary: any[]): any {
  if (!errorSummary || errorSummary.length === 0) {
    return { healthy: true, issues: [] };
  }

  return {
    healthy: false,
    total_errors: errorSummary.length,
    error_rate: (errorSummary.length / 67 * 100).toFixed(2) + '%',
    most_affected_counties: errorSummary.slice(0, 5).map(e => ({
      county: COUNTY_INFO[e.county_code]?.name || 'Unknown',
      errors: e.error_count
    }))
  };
}

function calculateThroughput(parcels: number, minutes: number): number {
  // Estimate MB/s based on average parcel size
  const avgParcelSizeKB = 2.5;
  const totalMB = (parcels * avgParcelSizeKB) / 1024;
  const seconds = minutes * 60;

  return seconds > 0 ? (totalMB / seconds).toFixed(2) : 0;
}

function calculateCost(parcels: number, minutes: number): number {
  // Estimate based on compute time and data processed
  const computeCost = (minutes / 60) * 0.10; // $0.10 per hour
  const dataCost = (parcels / 1000000) * 0.50; // $0.50 per million

  return Number((computeCost + dataCost).toFixed(2));
}

function getPerformanceGrade(parcelsPerMinute: number, errors: number): string {
  const score = calculateEfficiencyScore(parcelsPerMinute, errors);

  if (score >= 800) return 'A+';
  if (score >= 700) return 'A';
  if (score >= 600) return 'B+';
  if (score >= 500) return 'B';
  if (score >= 400) return 'C+';
  if (score >= 300) return 'C';
  if (score >= 200) return 'D';
  return 'F';
}

function analyzeByRegion(performance: any[]): any {
  const regions = groupByRegion(performance);

  return Object.entries(regions).map(([region, counties]) => ({
    region,
    counties_processed: counties.length,
    average_speed: Math.round(
      counties.reduce((sum: number, c: any) => sum + c.parcels_per_minute, 0) / counties.length
    ),
    total_parcels: counties.reduce((sum: number, c: any) => sum + c.parcels_processed, 0),
    average_efficiency: Math.round(
      counties.reduce((sum: number, c: any) => sum + c.efficiency_score, 0) / counties.length
    )
  }));
}

function analyzeByBatchSize(performance: any[]): any {
  const batchGroups = performance.reduce((groups: any, county) => {
    const size = county.batch_size;
    if (!groups[size]) groups[size] = [];
    groups[size].push(county);
    return groups;
  }, {});

  return Object.entries(batchGroups).map(([size, counties]: [string, any]) => ({
    batch_size: parseInt(size),
    counties_count: counties.length,
    average_speed: Math.round(
      counties.reduce((sum: number, c: any) => sum + c.parcels_per_minute, 0) / counties.length
    ),
    average_errors: Math.round(
      counties.reduce((sum: number, c: any) => sum + c.errors, 0) / counties.length
    )
  }));
}

function analyzeByTimeOfDay(logs: any[]): any {
  const hourlyGroups = logs.reduce((groups: any, log) => {
    const hour = new Date(log.started_at).getHours();
    if (!groups[hour]) groups[hour] = [];
    groups[hour].push(log);
    return groups;
  }, {});

  return Object.entries(hourlyGroups).map(([hour, logs]: [string, any]) => ({
    hour: parseInt(hour),
    processing_count: logs.length,
    average_speed: Math.round(
      logs.reduce((sum: number, l: any) => {
        const minutes = (new Date(l.completed_at).getTime() - new Date(l.started_at).getTime()) / 60000;
        return sum + (l.processed_parcels / minutes);
      }, 0) / logs.length
    )
  }));
}

function getOptimizationRecommendations(performance: any[]): string[] {
  const recommendations = [];

  // Analyze performance data
  const avgSpeed = performance.reduce((sum, c) => sum + c.parcels_per_minute, 0) / performance.length;
  const avgErrors = performance.reduce((sum, c) => sum + c.errors, 0) / performance.length;

  if (avgSpeed < 500) {
    recommendations.push('Consider increasing batch size to improve throughput');
  }
  if (avgErrors > 10) {
    recommendations.push('High error rate detected - implement data validation preprocessing');
  }
  if (performance.some(p => p.duration_minutes > 120)) {
    recommendations.push('Some counties taking over 2 hours - consider parallel processing');
  }

  // Analyze batch size performance
  const batchSizePerformance = analyzeByBatchSize(performance);
  const optimalBatch = batchSizePerformance.sort((a, b) => b.average_speed - a.average_speed)[0];
  if (optimalBatch && optimalBatch.batch_size !== 1000) {
    recommendations.push(`Optimal batch size appears to be ${optimalBatch.batch_size}`);
  }

  return recommendations;
}

function calculateAdvancedPerformanceSummary(performance: any[]): any {
  const speeds = performance.map(p => p.parcels_per_minute);
  const times = performance.map(p => p.duration_minutes);
  const errors = performance.map(p => p.errors);

  return {
    total_counties_processed: performance.length,
    total_parcels_processed: performance.reduce((sum, p) => sum + p.parcels_processed, 0),
    total_processing_hours: Math.round(times.reduce((sum, t) => sum + t, 0) / 60),
    average_parcels_per_minute: Math.round(speeds.reduce((sum, s) => sum + s, 0) / speeds.length),
    median_parcels_per_minute: calculateMedian(speeds),
    percentile_95_speed: calculatePercentile(speeds, 95),
    standard_deviation_speed: calculateStandardDeviation(speeds),
    total_errors: errors.reduce((sum, e) => sum + e, 0),
    error_rate: ((errors.reduce((sum, e) => sum + e, 0) / performance.reduce((sum, p) => sum + p.parcels_processed, 0)) * 100).toFixed(3) + '%',
    estimated_total_cost: performance.reduce((sum, p) => sum + p.cost_estimate, 0).toFixed(2),
    performance_consistency: calculateConsistencyScore(speeds)
  };
}

function analyzeTrends(stats: any[]): any {
  if (stats.length < 2) return { trend: 'insufficient_data' };

  // Simple trend analysis
  const recentStats = stats.slice(0, 10);
  const olderStats = stats.slice(10, 20);

  if (olderStats.length === 0) return { trend: 'insufficient_data' };

  const recentAvg = recentStats.reduce((sum, s) => sum + (s.parcels_per_minute || 0), 0) / recentStats.length;
  const olderAvg = olderStats.reduce((sum, s) => sum + (s.parcels_per_minute || 0), 0) / olderStats.length;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  return {
    trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
    change_percentage: change.toFixed(1),
    recent_average: Math.round(recentAvg),
    historical_average: Math.round(olderAvg)
  };
}

function calculateEstimatedCompletion(log: any): string | null {
  if (!log || log.status !== 'processing' || !log.parcels_per_minute) return null;

  const remaining = log.total_parcels - log.processed_parcels;
  const minutesRemaining = remaining / log.parcels_per_minute;

  return new Date(Date.now() + minutesRemaining * 60000).toISOString();
}

function calculateCompletenessScore(actual: number, estimated: number): number {
  if (estimated === 0) return 0;
  return Math.min(100, Math.round((actual / estimated) * 100));
}

function getCountyRecommendations(log: any, countyInfo: any): string[] {
  const recommendations = [];

  if (!log) {
    recommendations.push('Start processing this county to begin data import');
    return recommendations;
  }

  if (log.status === 'error') {
    recommendations.push('Review error logs and retry processing');
  }

  if (log.error_count > 10) {
    recommendations.push('High error rate - consider data validation before retry');
  }

  if (log.parcels_per_minute < 300 && log.parcels_per_minute > 0) {
    recommendations.push('Processing speed below average - consider increasing batch size');
  }

  if (log.processed_parcels < countyInfo?.parcels_estimate * 0.9) {
    recommendations.push('Parcel count below estimate - verify data completeness');
  }

  return recommendations;
}

// Utility functions
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(Math.sqrt(variance));
}

function calculateConsistencyScore(values: number[]): number {
  if (values.length < 2) return 100;
  const stdDev = calculateStandardDeviation(values);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0; // Coefficient of variation
  return Math.max(0, Math.round(100 - cv));
}
