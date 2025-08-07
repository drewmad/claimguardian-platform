import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// County information
const COUNTY_INFO: Record<number, { name: string; population: number; parcels_estimate: number }> = {
  1: { name: "ALACHUA", population: 278468, parcels_estimate: 110000 },
  2: { name: "BAKER", population: 28259, parcels_estimate: 12000 },
  3: { name: "BAY", population: 175216, parcels_estimate: 85000 },
  4: { name: "BRADFORD", population: 28303, parcels_estimate: 13000 },
  5: { name: "BREVARD", population: 606612, parcels_estimate: 280000 },
  6: { name: "BROWARD", population: 1944375, parcels_estimate: 720000 },
  7: { name: "CALHOUN", population: 13648, parcels_estimate: 8000 },
  8: { name: "CHARLOTTE", population: 188910, parcels_estimate: 343620 }, // Known exact count
  9: { name: "CITRUS", population: 153843, parcels_estimate: 95000 },
  10: { name: "CLAY", population: 218245, parcels_estimate: 85000 },
  11: { name: "COLLIER", population: 375752, parcels_estimate: 200000 },
  12: { name: "COLUMBIA", population: 69698, parcels_estimate: 35000 },
  13: { name: "MIAMI-DADE", population: 2716940, parcels_estimate: 950000 },
  14: { name: "DESOTO", population: 35440, parcels_estimate: 18000 },
  15: { name: "DIXIE", population: 16759, parcels_estimate: 12000 },
  16: { name: "DUVAL", population: 995298, parcels_estimate: 380000 },
  17: { name: "ESCAMBIA", population: 321905, parcels_estimate: 145000 },
  18: { name: "FLAGLER", population: 115378, parcels_estimate: 65000 },
  19: { name: "FRANKLIN", population: 12125, parcels_estimate: 15000 },
  20: { name: "GADSDEN", population: 45660, parcels_estimate: 22000 },
  21: { name: "GILCHRIST", population: 18582, parcels_estimate: 10000 },
  22: { name: "GLADES", population: 13811, parcels_estimate: 8000 },
  23: { name: "GULF", population: 14817, parcels_estimate: 12000 },
  24: { name: "HAMILTON", population: 14428, parcels_estimate: 7000 },
  25: { name: "HARDEE", population: 25773, parcels_estimate: 12000 },
  26: { name: "HENDRY", population: 42022, parcels_estimate: 18000 },
  27: { name: "HERNANDO", population: 194515, parcels_estimate: 95000 },
  28: { name: "HIGHLANDS", population: 101235, parcels_estimate: 60000 },
  29: { name: "HILLSBOROUGH", population: 1459762, parcels_estimate: 520000 },
  30: { name: "HOLMES", population: 19653, parcels_estimate: 11000 },
  31: { name: "INDIAN RIVER", population: 159923, parcels_estimate: 85000 },
  32: { name: "JACKSON", population: 47409, parcels_estimate: 25000 },
  33: { name: "JEFFERSON", population: 14510, parcels_estimate: 8000 },
  34: { name: "LAFAYETTE", population: 8226, parcels_estimate: 5000 },
  35: { name: "LAKE", population: 383956, parcels_estimate: 180000 },
  36: { name: "LEE", population: 760822, parcels_estimate: 380000 },
  37: { name: "LEON", population: 293582, parcels_estimate: 120000 },
  38: { name: "LEVY", population: 42915, parcels_estimate: 28000 },
  39: { name: "LIBERTY", population: 7974, parcels_estimate: 5000 },
  40: { name: "MADISON", population: 18493, parcels_estimate: 9000 },
  41: { name: "MANATEE", population: 399710, parcels_estimate: 185000 },
  42: { name: "MARION", population: 375908, parcels_estimate: 180000 },
  43: { name: "MARTIN", population: 158431, parcels_estimate: 85000 },
  44: { name: "MONROE", population: 82874, parcels_estimate: 55000 },
  45: { name: "NASSAU", population: 90352, parcels_estimate: 45000 },
  46: { name: "OKALOOSA", population: 211668, parcels_estimate: 95000 },
  47: { name: "OKEECHOBEE", population: 39476, parcels_estimate: 20000 },
  48: { name: "ORANGE", population: 1429908, parcels_estimate: 480000 },
  49: { name: "OSCEOLA", population: 388656, parcels_estimate: 145000 },
  50: { name: "PALM BEACH", population: 1492191, parcels_estimate: 650000 },
  51: { name: "PASCO", population: 561891, parcels_estimate: 240000 },
  52: { name: "PINELLAS", population: 959107, parcels_estimate: 480000 },
  53: { name: "POLK", population: 724777, parcels_estimate: 290000 },
  54: { name: "PUTNAM", population: 73321, parcels_estimate: 40000 },
  55: { name: "ST. JOHNS", population: 273425, parcels_estimate: 115000 },
  56: { name: "ST. LUCIE", population: 329226, parcels_estimate: 145000 },
  57: { name: "SANTA ROSA", population: 188000, parcels_estimate: 85000 },
  58: { name: "SARASOTA", population: 434006, parcels_estimate: 220000 },
  59: { name: "SEMINOLE", population: 470856, parcels_estimate: 180000 },
  60: { name: "SUMTER", population: 129752, parcels_estimate: 85000 },
  61: { name: "SUWANNEE", population: 43474, parcels_estimate: 22000 },
  62: { name: "TAYLOR", population: 21796, parcels_estimate: 12000 },
  63: { name: "UNION", population: 15237, parcels_estimate: 7000 },
  64: { name: "VOLUSIA", population: 553543, parcels_estimate: 280000 },
  65: { name: "WAKULLA", population: 33764, parcels_estimate: 18000 },
  66: { name: "WALTON", population: 75305, parcels_estimate: 55000 },
  67: { name: "WASHINGTON", population: 25473, parcels_estimate: 14000 }
};

interface MonitorRequest {
  view: 'dashboard' | 'timeline' | 'errors' | 'performance';
  county_code?: number;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { view = 'dashboard', county_code, limit = 50 } = await req.json() as MonitorRequest;

    switch (view) {
      case 'dashboard':
        return await getDashboard(supabase);

      case 'timeline':
        return await getTimeline(supabase, limit);

      case 'errors':
        return await getErrors(supabase, county_code, limit);

      case 'performance':
        return await getPerformance(supabase);

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

async function getDashboard(supabase: any): Promise<Response> {
  // Get overall statistics
  const { count: totalParcels } = await supabase
    .from('florida_parcels')
    .select('*', { count: 'exact', head: true });

  // Get processing logs
  const { data: logs } = await supabase
    .from('florida_parcels_processing_log')
    .select('*')
    .order('updated_at', { ascending: false });

  // Get orchestrator status
  const { data: orchestratorJobs } = await supabase
    .from('florida_parcels_orchestrator')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  // Calculate statistics
  const countyStats = new Map<number, any>();

  // Initialize all counties
  for (const [code, info] of Object.entries(COUNTY_INFO)) {
    countyStats.set(parseInt(code), {
      county_code: parseInt(code),
      county_name: info.name,
      population: info.population,
      estimated_parcels: info.parcels_estimate,
      actual_parcels: 0,
      status: 'pending',
      progress: 0,
      last_updated: null,
      processing_time: null,
      errors: 0
    });
  }

  // Update with actual data
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

      if (log.started_at && log.completed_at) {
        const start = new Date(log.started_at).getTime();
        const end = new Date(log.completed_at).getTime();
        stats.processing_time = Math.round((end - start) / 1000 / 60); // minutes
      }
    }
  }

  // Convert to array and sort by status/progress
  const countiesArray = Array.from(countyStats.values()).sort((a, b) => {
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
  });

  // Summary statistics
  const summary = {
    total_parcels_processed: totalParcels || 0,
    total_parcels_estimated: Object.values(COUNTY_INFO).reduce((sum, info) => sum + info.parcels_estimate, 0),
    counties_completed: countiesArray.filter(c => c.status === 'completed').length,
    counties_processing: countiesArray.filter(c => c.status === 'processing').length,
    counties_with_errors: countiesArray.filter(c => c.status === 'error' || c.status === 'completed_with_errors').length,
    counties_pending: countiesArray.filter(c => c.status === 'pending').length,
    overall_progress: Math.round((totalParcels || 0) / Object.values(COUNTY_INFO).reduce((sum, info) => sum + info.parcels_estimate, 0) * 100),
    current_orchestrator_job: orchestratorJobs?.[0] || null,
    last_update: new Date().toISOString()
  };

  // Performance metrics
  const completedCounties = countiesArray.filter(c => c.processing_time);
  const avgProcessingTime = completedCounties.length > 0
    ? Math.round(completedCounties.reduce((sum, c) => sum + c.processing_time, 0) / completedCounties.length)
    : 0;

  const performance = {
    average_processing_time_minutes: avgProcessingTime,
    average_parcels_per_minute: avgProcessingTime > 0
      ? Math.round(completedCounties.reduce((sum, c) => sum + c.actual_parcels, 0) / completedCounties.reduce((sum, c) => sum + c.processing_time, 0))
      : 0,
    fastest_county: completedCounties.sort((a, b) => a.processing_time - b.processing_time)[0] || null,
    slowest_county: completedCounties.sort((a, b) => b.processing_time - a.processing_time)[0] || null
  };

  return new Response(
    JSON.stringify({
      summary,
      performance,
      counties: countiesArray,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getTimeline(supabase: any, limit: number): Promise<Response> {
  // Get recent processing activities
  const { data: logs } = await supabase
    .from('florida_parcels_processing_log')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  // Transform to timeline events
  const timeline = logs?.map((log: any) => ({
    timestamp: log.updated_at,
    county_code: log.county_code,
    county_name: COUNTY_INFO[log.county_code]?.name || 'Unknown',
    event_type: getEventType(log),
    status: log.status,
    progress: log.total_parcels > 0
      ? Math.round((log.processed_parcels / log.total_parcels) * 100)
      : 0,
    parcels_processed: log.processed_parcels,
    total_parcels: log.total_parcels,
    error_message: log.error_message
  })) || [];

  return new Response(
    JSON.stringify({
      timeline,
      count: timeline.length,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

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

async function getErrors(supabase: any, countyCode?: number, limit: number = 50): Promise<Response> {
  // Build query
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

  // Get system logs for more details
  const { data: systemLogs } = await supabase
    .from('system_logs')
    .select('*')
    .eq('level', 'error')
    .like('module', '%parcels%')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Transform error data
  const errors = errorLogs?.map((log: any) => ({
    timestamp: log.updated_at,
    county_code: log.county_code,
    county_name: COUNTY_INFO[log.county_code]?.name || 'Unknown',
    error_type: log.status,
    error_message: log.error_message,
    error_count: log.error_count,
    parcels_affected: log.total_parcels - log.processed_parcels,
    can_resume: log.last_batch_index != null,
    resume_from: log.last_batch_index
  })) || [];

  // Aggregate error statistics
  const errorStats = {
    total_errors: errors.length,
    counties_affected: new Set(errors.map(e => e.county_code)).size,
    parcels_affected: errors.reduce((sum, e) => sum + (e.parcels_affected || 0), 0),
    common_errors: getCommonErrors(errors),
    recent_system_errors: systemLogs?.slice(0, 10) || []
  };

  return new Response(
    JSON.stringify({
      errors,
      statistics: errorStats,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function getCommonErrors(errors: any[]): any[] {
  const errorCounts = new Map<string, number>();

  errors.forEach(error => {
    if (error.error_message) {
      const key = error.error_message.substring(0, 100); // First 100 chars
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    }
  });

  return Array.from(errorCounts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function getPerformance(supabase: any): Promise<Response> {
  // Get completed counties with timing data
  const { data: completedLogs } = await supabase
    .from('florida_parcels_processing_log')
    .select('*')
    .in('status', ['completed', 'completed_with_errors'])
    .not('completed_at', 'is', null)
    .not('started_at', 'is', null);

  // Calculate performance metrics
  const countyPerformance = completedLogs?.map((log: any) => {
    const startTime = new Date(log.started_at).getTime();
    const endTime = new Date(log.completed_at).getTime();
    const durationMinutes = (endTime - startTime) / 1000 / 60;
    const parcelsPerMinute = durationMinutes > 0 ? Math.round(log.processed_parcels / durationMinutes) : 0;

    return {
      county_code: log.county_code,
      county_name: COUNTY_INFO[log.county_code]?.name || 'Unknown',
      parcels_processed: log.processed_parcels,
      duration_minutes: Math.round(durationMinutes),
      parcels_per_minute: parcelsPerMinute,
      batch_size: log.batch_size,
      errors: log.error_count || 0,
      efficiency_score: calculateEfficiencyScore(parcelsPerMinute, log.error_count || 0)
    };
  }) || [];

  // Sort by performance
  const sortedBySpeed = [...countyPerformance].sort((a, b) => b.parcels_per_minute - a.parcels_per_minute);
  const sortedByEfficiency = [...countyPerformance].sort((a, b) => b.efficiency_score - a.efficiency_score);

  // Calculate aggregates
  const totalParcels = countyPerformance.reduce((sum, c) => sum + c.parcels_processed, 0);
  const totalMinutes = countyPerformance.reduce((sum, c) => sum + c.duration_minutes, 0);
  const avgParcelsPerMinute = totalMinutes > 0 ? Math.round(totalParcels / totalMinutes) : 0;

  // Batch size analysis
  const batchSizePerformance = new Map<number, { count: number; avgSpeed: number }>();
  countyPerformance.forEach(cp => {
    const existing = batchSizePerformance.get(cp.batch_size) || { count: 0, avgSpeed: 0 };
    existing.count++;
    existing.avgSpeed = ((existing.avgSpeed * (existing.count - 1)) + cp.parcels_per_minute) / existing.count;
    batchSizePerformance.set(cp.batch_size, existing);
  });

  return new Response(
    JSON.stringify({
      summary: {
        counties_processed: countyPerformance.length,
        total_parcels_processed: totalParcels,
        total_processing_minutes: totalMinutes,
        average_parcels_per_minute: avgParcelsPerMinute,
        optimal_batch_size: getOptimalBatchSize(batchSizePerformance)
      },
      top_performers: sortedBySpeed.slice(0, 10),
      most_efficient: sortedByEfficiency.slice(0, 10),
      slowest_counties: sortedBySpeed.slice(-5).reverse(),
      batch_size_analysis: Array.from(batchSizePerformance.entries()).map(([size, stats]) => ({
        batch_size: size,
        counties_processed: stats.count,
        average_speed: Math.round(stats.avgSpeed)
      })),
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function calculateEfficiencyScore(parcelsPerMinute: number, errorCount: number): number {
  // Score based on speed with penalty for errors
  const errorPenalty = Math.max(0, 1 - (errorCount / 100));
  return Math.round(parcelsPerMinute * errorPenalty);
}

function getOptimalBatchSize(batchSizePerformance: Map<number, { count: number; avgSpeed: number }>): number {
  let optimalSize = 1000;
  let maxSpeed = 0;

  batchSizePerformance.forEach((stats, size) => {
    if (stats.avgSpeed > maxSpeed && stats.count >= 3) { // Need at least 3 samples
      maxSpeed = stats.avgSpeed;
      optimalSize = size;
    }
  });

  return optimalSize;
}
