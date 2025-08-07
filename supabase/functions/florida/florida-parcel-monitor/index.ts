import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface MonitorRequest {
  action: "check_sources" | "trigger_ingest" | "get_status" | "health_check";
  data_source?: string;
  force_refresh?: boolean;
}

const FLORIDA_DATA_SOURCES = {
  fl_dor_statewide: {
    base_url:
      "https://floridarevenue.com/property/Documents/PropertyDataPortal/",
    data_format: "csv",
    update_frequency: "quarterly",
    file_patterns: ["Statewide_Property_Data_*.csv"],
    expected_size_mb: 500,
  },
  fl_county_charlotte: {
    base_url: "https://www.ccappraiser.com/GIS/",
    data_format: "shapefile",
    update_frequency: "monthly",
    file_patterns: ["Parcels_*.zip"],
    expected_size_mb: 50,
  },
  fl_county_lee: {
    base_url: "https://www.leepa.org/GIS/",
    data_format: "shapefile",
    update_frequency: "monthly",
    file_patterns: ["Parcels_*.zip"],
    expected_size_mb: 75,
  },
  fl_county_sarasota: {
    base_url: "https://www.sc-pa.com/GIS/",
    data_format: "shapefile",
    update_frequency: "monthly",
    file_patterns: ["Parcels_*.zip"],
    expected_size_mb: 60,
  },
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      action,
      data_source,
      force_refresh = false,
    } = (await req.json()) as MonitorRequest;

    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Florida parcel monitor action: ${action}`,
      }),
    );

    switch (action) {
      case "check_sources":
        return await checkDataSources(data_source);

      case "trigger_ingest":
        return await triggerIngest(data_source, force_refresh);

      case "get_status":
        return await getStatus(data_source);

      case "health_check":
        return await healthCheck();

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message: "Parcel monitor error:",
        error,
      }),
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function checkDataSources(targetSource?: string) {
  const sourcesToCheck = targetSource
    ? [targetSource]
    : Object.keys(FLORIDA_DATA_SOURCES);

  const results = [];

  for (const source of sourcesToCheck) {
    const config =
      FLORIDA_DATA_SOURCES[source as keyof typeof FLORIDA_DATA_SOURCES];
    if (!config) {
      results.push({
        source,
        status: "error",
        message: "Unknown data source",
      });
      continue;
    }

    try {
      console.log(
        JSON.stringify({
          level: "info",
          timestamp: new Date().toISOString(),
          message: `Checking source: ${source}`,
        }),
      );

      // Get current source record
      const { data: sourceRecord } = await supabase
        .from("parcel_data_sources")
        .select("*")
        .eq("source", source)
        .single();

      // Check if source URL is accessible
      const healthCheck = await checkSourceHealth(config.base_url);

      // Look for available files (simplified - would need actual directory listing)
      const availableFiles = await findAvailableFiles(config);

      const sourceStatus = {
        source,
        status: healthCheck.accessible ? "healthy" : "down",
        base_url: config.base_url,
        data_format: config.data_format,
        update_frequency: config.update_frequency,
        last_checked: new Date().toISOString(),
        available_files: availableFiles.length,
        health_details: healthCheck,
        current_record: sourceRecord,
      };

      // Update source record
      await supabase.from("parcel_data_sources").upsert(
        {
          source: source as any,
          base_url: config.base_url,
          data_format: config.data_format,
          update_frequency: config.update_frequency,
          last_checked_at: new Date().toISOString(),
          health_status: sourceStatus.status,
          is_active: true,
          import_config: {
            file_patterns: config.file_patterns,
            expected_size_mb: config.expected_size_mb,
          },
        },
        {
          onConflict: "source",
        },
      );

      results.push(sourceStatus);
    } catch (error) {
      console.log(
        JSON.stringify({
          level: "info",
          timestamp: new Date().toISOString(),
          message: `Error checking source ${source}:`,
          error,
        }),
      );
      results.push({
        source,
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        last_checked: new Date().toISOString(),
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      sources_checked: results.length,
      results,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function triggerIngest(dataSource?: string, forceRefresh = false) {
  if (!dataSource) {
    throw new Error("data_source is required for trigger_ingest");
  }

  const config =
    FLORIDA_DATA_SOURCES[dataSource as keyof typeof FLORIDA_DATA_SOURCES];
  if (!config) {
    throw new Error(`Unknown data source: ${dataSource}`);
  }

  console.log(
    JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Triggering ingest for ${dataSource}`,
    }),
  );

  // Check if there's already a running import
  const { data: runningImports } = await supabase
    .from("parcel_import_batches")
    .select("id, status")
    .eq("data_source", dataSource)
    .in("status", [
      "pending",
      "downloading",
      "validating",
      "transforming",
      "importing",
    ]);

  if (runningImports && runningImports.length > 0 && !forceRefresh) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Import already in progress",
        running_batch_id: runningImports[0].id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Find the latest available file
  const availableFiles = await findAvailableFiles(config);
  if (availableFiles.length === 0) {
    throw new Error("No data files available for ingestion");
  }

  const latestFile = availableFiles[0]; // Assume first is latest
  const sourceUrl = `${config.base_url}${latestFile.name}`;

  // Call the ingest function
  const ingestResponse = await supabase.functions.invoke(
    "florida-parcel-ingest",
    {
      body: {
        data_source: dataSource,
        source_url: sourceUrl,
        force_refresh: forceRefresh,
        generate_embeddings: true,
      },
    },
  );

  if (ingestResponse.error) {
    throw new Error(
      `Ingest failed: ${ingestResponse.error instanceof Error ? error.message : String(error)}`,
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Ingest triggered successfully",
      source_url: sourceUrl,
      ingest_result: ingestResponse.data,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function getStatus(dataSource?: string) {
  let query = supabase
    .from("parcel_import_batches")
    .select(
      `
      id,
      data_source,
      status,
      total_records,
      processed_records,
      valid_records,
      invalid_records,
      started_at,
      completed_at,
      duration_seconds,
      errors
    `,
    )
    .order("started_at", { ascending: false });

  if (dataSource) {
    query = query.eq("data_source", dataSource);
  }

  const { data: batches, error } = await query.limit(20);

  if (error) {
    throw new Error(
      `Failed to get status: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Get summary statistics
  const { data: summary } = await supabase
    .from("properties_summary")
    .select("*");

  // Get data source health
  const { data: sources } = await supabase
    .from("parcel_data_sources")
    .select("*");

  return new Response(
    JSON.stringify({
      success: true,
      recent_batches: batches,
      summary_stats: summary,
      data_sources: sources,
      last_updated: new Date().toISOString(),
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function healthCheck() {
  const healthResults = {
    database: false,
    data_sources: {} as Record<string, boolean>,
    overall_status: "unknown" as "healthy" | "degraded" | "down" | "unknown",
  };

  try {
    // Test database connectivity
    const { data } = await supabase.from("properties").select("count").limit(1);

    healthResults.database = true;

    // Test each data source
    for (const [source, config] of Object.entries(FLORIDA_DATA_SOURCES)) {
      try {
        const response = await fetch(config.base_url, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        healthResults.data_sources[source] = response.ok;
      } catch {
        healthResults.data_sources[source] = false;
      }
    }

    // Determine overall status
    const sourceHealthy = Object.values(healthResults.data_sources).filter(
      Boolean,
    ).length;
    const totalSources = Object.keys(healthResults.data_sources).length;

    if (healthResults.database && sourceHealthy === totalSources) {
      healthResults.overall_status = "healthy";
    } else if (healthResults.database && sourceHealthy > 0) {
      healthResults.overall_status = "degraded";
    } else {
      healthResults.overall_status = "down";
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message: "Health check failed:",
        error,
      }),
    );
    healthResults.overall_status = "down";
  }

  return new Response(
    JSON.stringify({
      success: true,
      health: healthResults,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function checkSourceHealth(baseUrl: string): Promise<{
  accessible: boolean;
  response_time_ms?: number;
  status_code?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(baseUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    return {
      accessible: response.ok,
      response_time_ms: Date.now() - startTime,
      status_code: response.status,
    };
  } catch (error) {
    return {
      accessible: false,
      response_time_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function findAvailableFiles(config: any): Promise<
  Array<{
    name: string;
    size?: number;
    last_modified?: string;
  }>
> {
  // This is a simplified implementation
  // In reality, you'd need to:
  // 1. List directory contents (if available)
  // 2. Match against file patterns
  // 3. Get file metadata

  // For now, return mock data based on patterns
  const mockFiles = config.file_patterns.map(
    (pattern: string, index: number) => ({
      name: pattern.replace("*", new Date().toISOString().split("T")[0]),
      size: config.expected_size_mb * 1024 * 1024,
      last_modified: new Date().toISOString(),
    }),
  );

  return mockFiles;
}
