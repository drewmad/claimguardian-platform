import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  action: "list" | "extract" | "process";
  county_code?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, county_code } = (await req.json()) as ProcessRequest;

    switch (action) {
      case "list":
        return await listZipContents(supabase);

      case "extract":
        return await extractCountyData(supabase, county_code);

      case "process":
        return await processExtractedData(supabase, county_code);

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error("ZIP Processor error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function listZipContents(supabase: any): Promise<Response> {
  console.log("Downloading ZIP file to list contents...");

  // Download the ZIP file
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("parcels")
    .download("Cadastral_Statewide.zip");

  if (downloadError) {
    throw new Error(`Failed to download ZIP: ${downloadError.message}`);
  }

  // Save to temp file
  const tempDir = "/tmp/parcels";
  await ensureDir(tempDir);
  const zipPath = `${tempDir}/Cadastral_Statewide.zip`;

  const arrayBuffer = await fileData.arrayBuffer();
  await Deno.writeFile(zipPath, new Uint8Array(arrayBuffer));

  console.log("ZIP downloaded, extracting file list...");

  // List files in ZIP
  const unzipProcess = new Deno.Command("unzip", {
    args: ["-l", zipPath],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout, stderr } = await unzipProcess.output();

  if (stderr.length > 0) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to list ZIP contents: ${error}`);
  }

  const output = new TextDecoder().decode(stdout);
  const files = output
    .split("\n")
    .filter((line) => line.includes("."))
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return parts[parts.length - 1];
    })
    .filter((file) => file && !file.startsWith("_"));

  // Group by type
  const geojsonFiles = files.filter((f) => f.endsWith(".geojson"));
  const shpFiles = files.filter((f) => f.endsWith(".shp"));
  const gdbFiles = files.filter((f) => f.includes(".gdb"));

  // Clean up
  await Deno.remove(zipPath);

  return new Response(
    JSON.stringify({
      total_files: files.length,
      geojson_files: geojsonFiles.length,
      shapefile_files: shpFiles.length,
      geodatabase_files: gdbFiles.length,
      sample_files: files.slice(0, 20),
      geojson_samples: geojsonFiles.slice(0, 10),
      message:
        "ZIP file contains multiple formats. GeoJSON files are preferred for processing.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function extractCountyData(
  supabase: any,
  countyCode?: number,
): Promise<Response> {
  if (!countyCode) {
    throw new Error("County code is required for extraction");
  }

  console.log(`Extracting data for county ${countyCode}...`);

  // For now, we'll need to handle the actual GDB to GeoJSON conversion
  // This is a placeholder that shows the approach

  return new Response(
    JSON.stringify({
      status: "extraction_required",
      county_code: countyCode,
      message:
        "The ZIP file contains FileGeodatabase (.gdb) files that need to be converted to GeoJSON format.",
      next_steps: [
        "1. Extract the ZIP file locally",
        "2. Use ogr2ogr to convert GDB to GeoJSON for each county",
        "3. Upload the GeoJSON files back to Storage",
        "4. Process using the florida-parcels-processor function",
      ],
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function processExtractedData(
  supabase: any,
  countyCode?: number,
): Promise<Response> {
  // This would call the existing processor with the extracted GeoJSON
  const processorUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/florida-parcels-processor`;

  const response = await fetch(processorUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "process",
      county_code: countyCode,
      batch_size: 1000,
      storage_path: `extracted/county_${countyCode}.geojson`, // Assuming we extract to this path
    }),
  });

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
