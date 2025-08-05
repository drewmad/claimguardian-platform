import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractRequest {
  action: 'analyze' | 'extract' | 'list';
  extract_path?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, extract_path } = await req.json() as ExtractRequest;

    switch (action) {
      case 'analyze':
        return await analyzeZipFile(supabase);
      
      case 'extract':
        return await extractZipContents(supabase, extract_path);
        
      case 'list':
        return await listExtractedFiles(supabase);
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }

  } catch (error) {
    console.error('ZIP Extractor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

async function analyzeZipFile(supabase: any): Promise<Response> {
  console.log('Starting ZIP file analysis...');
  
  // Download the ZIP file to analyze it
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('parcels')
    .download('Cadastral_Statewide.zip');
  
  if (downloadError) {
    throw new Error(`Failed to download ZIP: ${downloadError.message}`);
  }

  // Save to temp file
  const tempDir = '/tmp/parcels_extract';
  await ensureDir(tempDir);
  const zipPath = `${tempDir}/Cadastral_Statewide.zip`;
  
  console.log('Writing ZIP to temp file...');
  const arrayBuffer = await fileData.arrayBuffer();
  await Deno.writeFile(zipPath, new Uint8Array(arrayBuffer));
  
  // Get detailed file listing
  console.log('Analyzing ZIP contents...');
  const listProcess = new Deno.Command('unzip', {
    args: ['-l', zipPath],
    stdout: 'piped',
    stderr: 'piped',
  });
  
  const { stdout, stderr } = await listProcess.output();
  
  if (stderr.length > 0) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to list ZIP contents: ${error}`);
  }
  
  const output = new TextDecoder().decode(stdout);
  const lines = output.split('\n');
  
  // Parse the file listing
  const files: any[] = [];
  let totalSize = 0;
  
  for (const line of lines) {
    // Skip header and footer lines
    if (!line.includes('.') || line.includes('----')) continue;
    
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 4) {
      const size = parseInt(parts[0]);
      const date = parts[1];
      const time = parts[2];
      const name = parts.slice(3).join(' ');
      
      if (!isNaN(size) && name) {
        files.push({
          name,
          size,
          date,
          time,
          extension: name.split('.').pop()?.toLowerCase(),
          directory: name.split('/').slice(0, -1).join('/')
        });
        totalSize += size;
      }
    }
  }
  
  // Analyze file types and structure
  const analysis = {
    total_files: files.length,
    total_size_bytes: totalSize,
    total_size_gb: (totalSize / 1024 / 1024 / 1024).toFixed(2),
    
    // Group by extension
    by_extension: files.reduce((acc: any, file) => {
      const ext = file.extension || 'no_extension';
      if (!acc[ext]) acc[ext] = { count: 0, files: [] };
      acc[ext].count++;
      if (acc[ext].files.length < 5) {
        acc[ext].files.push(file.name);
      }
      return acc;
    }, {}),
    
    // Group by directory
    directories: [...new Set(files.map(f => f.directory).filter(d => d))],
    
    // Find specific file types
    geodatabase_files: files.filter(f => f.name.includes('.gdb')),
    shapefile_files: files.filter(f => f.extension === 'shp'),
    geojson_files: files.filter(f => f.extension === 'geojson'),
    xml_files: files.filter(f => f.extension === 'xml'),
    
    // Sample files
    sample_files: files.slice(0, 20).map(f => ({
      name: f.name,
      size: f.size,
      extension: f.extension
    }))
  };
  
  // Clean up
  await Deno.remove(zipPath);
  
  // Determine best extraction strategy
  const strategy = determineExtractionStrategy(analysis);
  
  return new Response(
    JSON.stringify({
      zip_info: {
        name: 'Cadastral_Statewide.zip',
        size_gb: '4.11',
        files_count: analysis.total_files
      },
      analysis,
      strategy,
      recommendations: getRecommendations(analysis),
      next_steps: [
        'Use action: "extract" to extract the ZIP file',
        'Then process the extracted files based on their format'
      ]
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function extractZipContents(supabase: any, extractPath?: string): Promise<Response> {
  console.log('Starting ZIP extraction...');
  
  // Download the ZIP file
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('parcels')
    .download('Cadastral_Statewide.zip');
  
  if (downloadError) {
    throw new Error(`Failed to download ZIP: ${downloadError.message}`);
  }

  // Set up extraction
  const tempDir = '/tmp/parcels_extract';
  const extractDir = extractPath || `${tempDir}/extracted`;
  await ensureDir(extractDir);
  
  const zipPath = `${tempDir}/Cadastral_Statewide.zip`;
  
  console.log('Writing ZIP to temp file...');
  const arrayBuffer = await fileData.arrayBuffer();
  await Deno.writeFile(zipPath, new Uint8Array(arrayBuffer));
  
  // Extract the ZIP file
  console.log(`Extracting to ${extractDir}...`);
  const extractProcess = new Deno.Command('unzip', {
    args: ['-o', zipPath, '-d', extractDir],
    stdout: 'piped',
    stderr: 'piped',
  });
  
  const { stdout, stderr, success } = await extractProcess.output();
  
  if (!success) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to extract ZIP: ${error}`);
  }
  
  // List extracted files
  const extractedFiles: string[] = [];
  for await (const entry of Deno.readDir(extractDir)) {
    if (entry.isFile) {
      extractedFiles.push(entry.name);
    } else if (entry.isDirectory) {
      // Recursively list files in subdirectories
      const subDir = join(extractDir, entry.name);
      for await (const subEntry of Deno.readDir(subDir)) {
        if (subEntry.isFile) {
          extractedFiles.push(`${entry.name}/${subEntry.name}`);
        }
      }
    }
  }
  
  // Upload key files back to Storage for processing
  const uploadResults: any[] = [];
  
  // Look for GeoJSON files or other processable formats
  for (const file of extractedFiles) {
    if (file.endsWith('.geojson') || file.endsWith('.json')) {
      try {
        const filePath = join(extractDir, file);
        const fileContent = await Deno.readFile(filePath);
        
        // Upload to Storage
        const { data, error } = await supabase.storage
          .from('parcels')
          .upload(`extracted/${file}`, fileContent, {
            contentType: 'application/json',
            upsert: true
          });
        
        uploadResults.push({
          file,
          uploaded: !error,
          error: error?.message,
          storage_path: data?.path
        });
      } catch (err) {
        uploadResults.push({
          file,
          uploaded: false,
          error: err.message
        });
      }
    }
  }
  
  // Clean up local files
  await Deno.remove(zipPath);
  // Keep extracted files for now in case we need them
  
  return new Response(
    JSON.stringify({
      extraction_complete: true,
      extracted_location: extractDir,
      total_files_extracted: extractedFiles.length,
      files_by_type: groupFilesByType(extractedFiles),
      uploaded_files: uploadResults,
      geodatabase_found: extractedFiles.some(f => f.includes('.gdb')),
      next_steps: getNextSteps(extractedFiles)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listExtractedFiles(supabase: any): Promise<Response> {
  // List files in the extracted folder in Storage
  const { data: files, error } = await supabase.storage
    .from('parcels')
    .list('extracted', {
      limit: 1000,
      offset: 0
    });
  
  if (error) {
    throw new Error(`Failed to list extracted files: ${error.message}`);
  }
  
  // Group files by type and county
  const groupedFiles = {
    by_type: files?.reduce((acc: any, file: any) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      if (!acc[ext]) acc[ext] = [];
      acc[ext].push(file.name);
      return acc;
    }, {}) || {},
    
    by_county: files?.reduce((acc: any, file: any) => {
      // Try to extract county info from filename
      const match = file.name.match(/county_(\d+)|co_(\d+)|(\d{2,3})/i);
      if (match) {
        const countyCode = match[1] || match[2] || match[3];
        if (!acc[countyCode]) acc[countyCode] = [];
        acc[countyCode].push(file.name);
      }
      return acc;
    }, {}) || {},
    
    total_files: files?.length || 0,
    sample_files: files?.slice(0, 20) || []
  };
  
  return new Response(
    JSON.stringify({
      storage_path: 'parcels/extracted/',
      files: groupedFiles,
      ready_for_processing: files?.some((f: any) => f.name.endsWith('.geojson')),
      message: 'Files extracted and available in Storage'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions
function determineExtractionStrategy(analysis: any): any {
  const hasGDB = analysis.geodatabase_files.length > 0;
  const hasShapefiles = analysis.shapefile_files.length > 0;
  const hasGeoJSON = analysis.geojson_files.length > 0;
  
  return {
    primary_format: hasGDB ? 'FileGeodatabase' : hasShapefiles ? 'Shapefile' : hasGeoJSON ? 'GeoJSON' : 'Unknown',
    requires_conversion: hasGDB || hasShapefiles,
    can_process_directly: hasGeoJSON,
    recommended_approach: hasGDB 
      ? 'Extract GDB files and convert to GeoJSON using ogr2ogr'
      : hasShapefiles 
      ? 'Extract shapefiles and convert to GeoJSON'
      : hasGeoJSON
      ? 'Extract and process GeoJSON files directly'
      : 'Manual inspection required'
  };
}

function getRecommendations(analysis: any): string[] {
  const recommendations = [];
  
  if (analysis.geodatabase_files.length > 0) {
    recommendations.push('FileGeodatabase detected - will need ogr2ogr conversion after extraction');
  }
  
  if (analysis.total_size_gb > 3) {
    recommendations.push('Large file size - extraction may take several minutes');
  }
  
  if (analysis.directories.length > 0) {
    recommendations.push('Multiple directories found - data is organized by folder');
  }
  
  return recommendations;
}

function groupFilesByType(files: string[]): any {
  return files.reduce((acc: any, file) => {
    const ext = file.split('.').pop()?.toLowerCase() || 'no_extension';
    if (!acc[ext]) acc[ext] = 0;
    acc[ext]++;
    return acc;
  }, {});
}

function getNextSteps(files: string[]): string[] {
  const steps = [];
  
  if (files.some(f => f.includes('.gdb'))) {
    steps.push('Convert FileGeodatabase to GeoJSON format using ogr2ogr');
  }
  
  if (files.some(f => f.endsWith('.shp'))) {
    steps.push('Convert Shapefiles to GeoJSON format');
  }
  
  if (files.some(f => f.endsWith('.geojson'))) {
    steps.push('Process GeoJSON files directly using florida-parcels-processor');
  }
  
  steps.push('Monitor progress using the dashboard');
  
  return steps;
}