/**
 * Generate Vector Tiles Edge Function
 * Background service for pre-generating and caching MVT tiles
 * 
 * Modes:
 * - schedule: Queue tiles for Florida bounding box at multiple zoom levels
 * - worker: Process queued tiles and generate MVT data
 * - single: Generate a specific tile on-demand
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TileJob {
  id: number;
  tile_key: string;
  zoom_level: number;
  tile_x: number;
  tile_y: number;
  layer_sig: string;
  priority: number;
}

interface GenerationRequest {
  mode: 'schedule' | 'worker' | 'single';
  zoom_levels?: number[];
  single_tile?: {
    z: number;
    x: number;
    y: number;
  };
  max_jobs?: number;
}

// Environment configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TILE_STORAGE_BUCKET = Deno.env.get('TILE_STORAGE_BUCKET') || 'vector-tiles';
const TILE_STORAGE_PREFIX = Deno.env.get('TILE_STORAGE_PREFIX') || 'v1';
const MVT_VERSION_SIG = Deno.env.get('MVT_VERSION_SIG') || 'properties|boundaries|risk_zones@v1';
const MVT_DEFAULT_TTL_SECONDS = parseInt(Deno.env.get('MVT_DEFAULT_TTL_SECONDS') || '604800', 10);
const MVT_ACTIVE_TTL_SECONDS = parseInt(Deno.env.get('MVT_ACTIVE_TTL_SECONDS') || '86400', 10);

// Florida bounding box
const FLORIDA_BBOX = {
  minLon: parseFloat(Deno.env.get('FLORIDA_BBOX_MIN_LON') || '-87.6349'),
  minLat: parseFloat(Deno.env.get('FLORIDA_BBOX_MIN_LAT') || '24.3963'),
  maxLon: parseFloat(Deno.env.get('FLORIDA_BBOX_MAX_LON') || '-80.0314'),
  maxLat: parseFloat(Deno.env.get('FLORIDA_BBOX_MAX_LAT') || '31.0006'),
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Calculate tile coordinates for a bounding box at a given zoom level
 */
function calculateTileBounds(bbox: typeof FLORIDA_BBOX, zoom: number) {
  const toTileX = (lon: number, z: number) => Math.floor((lon + 180) / 360 * Math.pow(2, z));
  const toTileY = (lat: number, z: number) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));

  return {
    minX: toTileX(bbox.minLon, zoom),
    maxX: toTileX(bbox.maxLon, zoom),
    minY: toTileY(bbox.maxLat, zoom), // Note: Y coordinates are flipped
    maxY: toTileY(bbox.minLat, zoom),
  };
}

/**
 * Queue tiles for generation within Florida bounding box
 */
async function scheduleTileGeneration(zoomLevels: number[] = [6, 7, 8, 9, 10]) {
  console.log(`Scheduling tile generation for zoom levels: ${zoomLevels.join(', ')}`);
  
  let totalJobs = 0;
  
  for (const zoom of zoomLevels) {
    const bounds = calculateTileBounds(FLORIDA_BBOX, zoom);
    const priority = Math.max(1, 11 - zoom); // Higher priority for lower zoom levels
    
    console.log(`Zoom ${zoom}: Queueing tiles from (${bounds.minX},${bounds.minY}) to (${bounds.maxX},${bounds.maxY})`);
    
    // Queue tiles in batches to avoid memory issues
    const batchSize = 100;
    const tiles: Array<{z: number, x: number, y: number}> = [];
    
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        tiles.push({ z: zoom, x, y });
      }
    }
    
    console.log(`Zoom ${zoom}: ${tiles.length} tiles to queue`);
    
    // Process in batches
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize);
      
      for (const tile of batch) {
        const { data, error } = await supabase.rpc('queue_tile_generation', {
          p_zoom_level: tile.z,
          p_tile_x: tile.x,
          p_tile_y: tile.y,
          p_layer_sig: MVT_VERSION_SIG,
          p_priority: priority,
        });
        
        if (error) {
          console.error(`Failed to queue tile ${tile.z}/${tile.x}/${tile.y}:`, error);
        } else {
          totalJobs++;
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`Scheduled ${totalJobs} tile generation jobs`);
  return { scheduled: totalJobs, zoom_levels: zoomLevels };
}

/**
 * Process queued tile jobs
 */
async function processTileJobs(maxJobs: number = 10) {
  console.log(`Processing up to ${maxJobs} tile jobs`);
  
  let processedJobs = 0;
  const results = { success: 0, errors: 0 };
  
  for (let i = 0; i < maxJobs; i++) {
    // Get next job
    const { data: jobs, error: jobError } = await supabase.rpc('get_next_tile_job');
    
    if (jobError) {
      console.error('Failed to get next job:', jobError);
      break;
    }
    
    if (!jobs || jobs.length === 0) {
      console.log('No more jobs available');
      break;
    }
    
    const job: TileJob = jobs[0];
    console.log(`Processing job ${job.id}: ${job.zoom_level}/${job.tile_x}/${job.tile_y}`);
    
    try {
      // Generate tile data using the database function
      const { data: tileResult, error: tileError } = await supabase.rpc('get_parcel_tile_mvt', {
        z: job.zoom_level,
        x: job.tile_x,
        y: job.tile_y,
      });
      
      if (tileError) {
        throw new Error(`Tile generation failed: ${tileError.message}`);
      }
      
      const tileData = tileResult as ArrayBuffer | null;
      
      if (!tileData) {
        console.log(`No data for tile ${job.zoom_level}/${job.tile_x}/${job.tile_y}, using empty tile`);
      }
      
      // Convert to Uint8Array for storage
      const dataBuffer = tileData ? new Uint8Array(tileData) : new Uint8Array(0);
      
      // Compress the tile data
      const compressedData = await new Response(
        new Response(dataBuffer).body?.pipeThrough(new CompressionStream('gzip'))
      ).arrayBuffer();
      
      // Store in Supabase Storage
      const storagePath = `${TILE_STORAGE_PREFIX}/${MVT_VERSION_SIG}/${job.zoom_level}/${job.tile_x}/${job.tile_y}.mvt.gz`;
      
      const { error: uploadError } = await supabase.storage
        .from(TILE_STORAGE_BUCKET)
        .upload(storagePath, new Uint8Array(compressedData), {
          contentType: 'application/vnd.mapbox-vector-tile',
          contentEncoding: 'gzip',
          upsert: true,
        });
      
      if (uploadError) {
        console.warn(`Storage upload failed for ${storagePath}:`, uploadError);
      }
      
      // Cache in database
      const ttl = job.zoom_level >= 12 ? MVT_ACTIVE_TTL_SECONDS : MVT_DEFAULT_TTL_SECONDS;
      
      const { error: cacheError } = await supabase.rpc('upsert_cache_row', {
        p_tile_key: job.tile_key,
        p_z: job.zoom_level,
        p_x: job.tile_x,
        p_y: job.tile_y,
        p_layer_sig: job.layer_sig,
        p_tile_data: new Uint8Array(compressedData),
        p_ttl_seconds: ttl,
      });
      
      if (cacheError) {
        console.warn(`Cache update failed for ${job.tile_key}:`, cacheError);
      }
      
      // Mark job as completed
      const { error: completeError } = await supabase.rpc('complete_tile_job', {
        p_job_id: job.id,
        p_success: true,
        p_error_message: null,
      });
      
      if (completeError) {
        console.error(`Failed to mark job ${job.id} as complete:`, completeError);
      }
      
      results.success++;
      processedJobs++;
      
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      
      // Mark job as failed
      await supabase.rpc('complete_tile_job', {
        p_job_id: job.id,
        p_success: false,
        p_error_message: error instanceof Error ? error.message : String(error),
      });
      
      results.errors++;
    }
    
    // Small delay between jobs
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`Processed ${processedJobs} jobs: ${results.success} success, ${results.errors} errors`);
  return { processed: processedJobs, ...results };
}

/**
 * Generate a single tile on-demand
 */
async function generateSingleTile(z: number, x: number, y: number) {
  console.log(`Generating single tile: ${z}/${x}/${y}`);
  
  try {
    // Generate tile data
    const { data: tileResult, error: tileError } = await supabase.rpc('get_parcel_tile_mvt', { z, x, y });
    
    if (tileError) {
      throw new Error(`Tile generation failed: ${tileError.message}`);
    }
    
    const tileData = tileResult as ArrayBuffer | null;
    const dataBuffer = tileData ? new Uint8Array(tileData) : new Uint8Array(0);
    
    // Compress the tile
    const compressedData = await new Response(
      new Response(dataBuffer).body?.pipeThrough(new CompressionStream('gzip'))
    ).arrayBuffer();
    
    return {
      success: true,
      tile_size: compressedData.byteLength,
      has_data: dataBuffer.length > 0,
    };
    
  } catch (error) {
    console.error(`Error generating single tile ${z}/${x}/${y}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main request handler
 */
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: GenerationRequest = await req.json();
    const { mode, zoom_levels, single_tile, max_jobs } = requestData;

    console.log(`Vector tile generation request: mode=${mode}`);

    let result;
    
    switch (mode) {
      case 'schedule':
        result = await scheduleTileGeneration(zoom_levels);
        break;
        
      case 'worker':
        result = await processTileJobs(max_jobs);
        break;
        
      case 'single':
        if (!single_tile) {
          throw new Error('single_tile parameter required for single mode');
        }
        result = await generateSingleTile(single_tile.z, single_tile.x, single_tile.y);
        break;
        
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    return new Response(JSON.stringify({ success: true, mode, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Vector tile generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});