import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Priority counties by population/importance
const PRIORITY_COUNTIES = [
  13, // Miami-Dade
  6,  // Broward
  50, // Palm Beach
  29, // Hillsborough
  48, // Orange
  16, // Duval
  52, // Pinellas
  36, // Lee
  53, // Polk
  5,  // Brevard
  64, // Volusia
  51, // Pasco
  59, // Seminole
  58, // Sarasota
  11, // Collier
  35, // Lake
  42, // Marion
  55, // St. Johns
  8,  // Charlotte (already tested)
  41, // Manatee
];

interface OrchestratorRequest {
  action: 'start' | 'stop' | 'status' | 'reset';
  mode?: 'priority' | 'all' | 'specific';
  counties?: number[];
  batch_size?: number;
  parallel_counties?: number;
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
      action,
      mode = 'priority',
      counties = [],
      batch_size = 1000,
      parallel_counties = 2
    } = await req.json() as OrchestratorRequest;

    switch (action) {
      case 'start':
        return await startProcessing(supabase, mode, counties, batch_size, parallel_counties);

      case 'stop':
        return await stopProcessing(supabase);

      case 'status':
        return await getOrchestratorStatus(supabase);

      case 'reset':
        return await resetProcessing(supabase, counties);

      default:
        throw new Error(`Invalid action: ${action}`);
    }

  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function startProcessing(
  supabase: any,
  mode: string,
  specificCounties: number[],
  batchSize: number,
  parallelCounties: number
): Promise<Response> {
  console.log(`Starting orchestrator in ${mode} mode`);

  // Check if already running
  const { data: runningJobs } = await supabase
    .from('florida_parcels_orchestrator')
    .select('*')
    .eq('status', 'running');

  if (runningJobs && runningJobs.length > 0) {
    return new Response(
      JSON.stringify({
        error: 'Orchestrator is already running',
        job_id: runningJobs[0].id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409
      }
    );
  }

  // Determine counties to process
  let countiesToProcess: number[] = [];

  switch (mode) {
    case 'priority':
      countiesToProcess = PRIORITY_COUNTIES;
      break;

    case 'all':
      countiesToProcess = Array.from({ length: 67 }, (_, i) => i + 1);
      break;

    case 'specific':
      countiesToProcess = specificCounties;
      break;
  }

  // Filter out already completed counties
  const { data: completedCounties } = await supabase
    .from('florida_parcels_processing_log')
    .select('county_code')
    .in('status', ['completed', 'completed_with_errors']);

  const completedCodes = new Set(completedCounties?.map((c: any) => c.county_code) || []);
  countiesToProcess = countiesToProcess.filter(code => !completedCodes.has(code));

  if (countiesToProcess.length === 0) {
    return new Response(
      JSON.stringify({
        message: 'All counties have been processed',
        completed_counties: completedCodes.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create orchestrator job
  const { data: job, error: jobError } = await supabase
    .from('florida_parcels_orchestrator')
    .insert({
      status: 'running',
      mode: mode,
      counties_to_process: countiesToProcess,
      total_counties: countiesToProcess.length,
      processed_counties: 0,
      batch_size: batchSize,
      parallel_counties: parallelCounties,
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (jobError) throw jobError;

  // Start processing counties in parallel batches
  processCountiesInBatches(
    supabase,
    job.id,
    countiesToProcess,
    batchSize,
    parallelCounties
  );

  return new Response(
    JSON.stringify({
      job_id: job.id,
      status: 'started',
      mode: mode,
      counties_to_process: countiesToProcess.length,
      batch_size: batchSize,
      parallel_counties: parallelCounties,
      message: `Started processing ${countiesToProcess.length} counties`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processCountiesInBatches(
  supabase: any,
  jobId: string,
  counties: number[],
  batchSize: number,
  parallelCounties: number
): Promise<void> {
  console.log(`Processing ${counties.length} counties in batches of ${parallelCounties}`);

  for (let i = 0; i < counties.length; i += parallelCounties) {
    // Check if job was stopped
    const { data: job } = await supabase
      .from('florida_parcels_orchestrator')
      .select('status')
      .eq('id', jobId)
      .single();

    if (job?.status !== 'running') {
      console.log('Job was stopped');
      break;
    }

    // Process batch of counties in parallel
    const batch = counties.slice(i, i + parallelCounties);
    const promises = batch.map(countyCode =>
      processCounty(supabase, countyCode, batchSize)
    );

    try {
      await Promise.all(promises);

      // Update progress
      const processedCount = Math.min(i + parallelCounties, counties.length);
      await supabase
        .from('florida_parcels_orchestrator')
        .update({
          processed_counties: processedCount,
          last_updated: new Date().toISOString()
        })
        .eq('id', jobId);

    } catch (error) {
      console.error(`Batch processing error:`, error);

      // Update job with error
      await supabase
        .from('florida_parcels_orchestrator')
        .update({
          status: 'error',
          error_message: error.message,
          failed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      throw error;
    }
  }

  // Mark job as completed
  await supabase
    .from('florida_parcels_orchestrator')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId);
}

async function processCounty(
  supabase: any,
  countyCode: number,
  batchSize: number
): Promise<void> {
  const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/florida-parcels-processor`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'process',
      county_code: countyCode,
      batch_size: batchSize
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to process county ${countyCode}: ${error}`);
  }

  const result = await response.json();
  console.log(`County ${countyCode} result:`, result);
}

async function stopProcessing(supabase: any): Promise<Response> {
  // Find running jobs
  const { data: runningJobs } = await supabase
    .from('florida_parcels_orchestrator')
    .select('*')
    .eq('status', 'running');

  if (!runningJobs || runningJobs.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No running jobs to stop' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Stop all running jobs
  const { error } = await supabase
    .from('florida_parcels_orchestrator')
    .update({
      status: 'stopped',
      stopped_at: new Date().toISOString()
    })
    .eq('status', 'running');

  if (error) throw error;

  return new Response(
    JSON.stringify({
      message: `Stopped ${runningJobs.length} running job(s)`,
      stopped_jobs: runningJobs.map((j: any) => j.id)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getOrchestratorStatus(supabase: any): Promise<Response> {
  // Get all jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('florida_parcels_orchestrator')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (jobsError) throw jobsError;

  // Get processing status
  const processorResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/florida-parcels-processor`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'status' })
    }
  );

  const processingStatus = await processorResponse.json();

  return new Response(
    JSON.stringify({
      current_job: jobs?.find((j: any) => j.status === 'running') || null,
      recent_jobs: jobs,
      processing_status: processingStatus
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function resetProcessing(
  supabase: any,
  counties: number[]
): Promise<Response> {
  // Reset specific counties or all
  const conditions: any = {};
  if (counties.length > 0) {
    conditions.county_code = counties;
  }

  // Delete from processing log
  const { error: logError } = await supabase
    .from('florida_parcels_processing_log')
    .delete()
    .match(conditions);

  if (logError) throw logError;

  // Delete parcels data
  const deleteConditions: any = {};
  if (counties.length > 0) {
    deleteConditions.CO_NO = counties;
  }

  const { error: parcelsError } = await supabase
    .from('florida_parcels')
    .delete()
    .match(deleteConditions);

  if (parcelsError) throw parcelsError;

  return new Response(
    JSON.stringify({
      message: counties.length > 0
        ? `Reset data for counties: ${counties.join(', ')}`
        : 'Reset all processing data',
      counties_reset: counties.length || 'all'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
