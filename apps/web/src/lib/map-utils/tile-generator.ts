/**
 * Vector tile generation utilities
 * Handles the creation of MVT tiles from PostGIS data
 */
import { query } from '@/lib/db/pg';
import { gzipSync } from 'zlib';
import { TileInfo } from './tile-cache';

export interface TileGenerationOptions {
  extent?: number;
  buffer?: number;
  simplificationTolerance?: number;
}

/**
 * Generate an MVT tile from the database
 */
export async function generateTile(
  tile: TileInfo,
  options: TileGenerationOptions = {}
): Promise<Buffer> {
  const { z, x, y } = tile;
  
  try {
    // Call the PostGIS function to generate MVT tile
    const result = await query(
      'SELECT public.get_parcel_tile_mvt($1, $2, $3) as tile_data',
      [z, x, y]
    );
    
    if (result.rows.length === 0 || !result.rows[0].tile_data) {
      // Return empty tile if no data
      return Buffer.alloc(0);
    }
    
    const tileData = result.rows[0].tile_data;
    
    // Return the MVT data as Buffer
    return Buffer.isBuffer(tileData) ? tileData : Buffer.from(tileData);
  } catch (error) {
    console.error(`Error generating tile ${z}/${x}/${y}:`, error);
    throw error;
  }
}

/**
 * Generate and compress an MVT tile
 */
export async function generateCompressedTile(
  tile: TileInfo,
  options: TileGenerationOptions = {}
): Promise<Buffer> {
  const tileData = await generateTile(tile, options);
  
  // Gzip compress the tile data
  return gzipSync(tileData);
}

/**
 * Estimate the number of parcels in a tile (for performance optimization)
 */
export async function estimateTileComplexity(tile: TileInfo): Promise<number> {
  const { z, x, y } = tile;
  
  try {
    const result = await query(
      'SELECT public.estimate_tile_parcel_count($1, $2, $3) as parcel_count',
      [z, x, y]
    );
    
    return result.rows[0]?.parcel_count || 0;
  } catch (error) {
    console.error(`Error estimating tile complexity ${z}/${x}/${y}:`, error);
    return 0;
  }
}

/**
 * Calculate tile bounds in different coordinate systems
 */
export function calculateTileBounds(z: number, x: number, y: number) {
  const tileCount = Math.pow(2, z);
  
  // Calculate longitude bounds
  const minLon = (x / tileCount) * 360 - 180;
  const maxLon = ((x + 1) / tileCount) * 360 - 180;
  
  // Calculate latitude bounds (Web Mercator projection)
  const n1 = Math.PI - (2 * Math.PI * y) / tileCount;
  const n2 = Math.PI - (2 * Math.PI * (y + 1)) / tileCount;
  
  const maxLat = (Math.atan(Math.sinh(n1)) * 180) / Math.PI;
  const minLat = (Math.atan(Math.sinh(n2)) * 180) / Math.PI;
  
  return {
    minLon,
    minLat,
    maxLon,
    maxLat,
    center: {
      lon: (minLon + maxLon) / 2,
      lat: (minLat + maxLat) / 2,
    },
  };
}

/**
 * Check if tile coordinates are valid
 */
export function isValidTile(z: number, x: number, y: number): boolean {
  if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }
  
  if (z < 0 || z > 22) {
    return false;
  }
  
  const maxTile = Math.pow(2, z);
  
  return x >= 0 && x < maxTile && y >= 0 && y < maxTile;
}

/**
 * Get neighboring tiles for preloading
 */
export function getNeighboringTiles(z: number, x: number, y: number, layerSig: string): TileInfo[] {
  const neighbors: TileInfo[] = [];
  const maxTile = Math.pow(2, z);
  
  // Get 8 neighboring tiles
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue; // Skip the center tile
      
      const neighborX = x + dx;
      const neighborY = y + dy;
      
      if (neighborX >= 0 && neighborX < maxTile && 
          neighborY >= 0 && neighborY < maxTile) {
        neighbors.push({
          z,
          x: neighborX,
          y: neighborY,
          layerSig,
        });
      }
    }
  }
  
  return neighbors;
}

/**
 * Calculate tile priority based on zoom level and position
 */
export function calculateTilePriority(z: number, x: number, y: number): number {
  // Higher priority for:
  // 1. Lower zoom levels (overview tiles)
  // 2. Center tiles
  const baseZoomPriority = Math.max(1, 11 - z); // z6=5, z10=1, z15+=1
  
  const maxTile = Math.pow(2, z);
  const centerX = maxTile / 2;
  const centerY = maxTile / 2;
  
  const distanceFromCenter = Math.sqrt(
    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
  );
  
  const centerBonus = Math.max(0, 5 - Math.floor(distanceFromCenter / (maxTile / 10)));
  
  return Math.max(1, Math.min(10, baseZoomPriority + centerBonus));
}