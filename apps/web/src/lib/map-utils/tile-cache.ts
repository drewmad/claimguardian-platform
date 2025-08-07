/**
 * Vector tile cache management utilities
 * Handles caching, retrieval, and invalidation of MVT tiles
 */
import { query } from '@/lib/db/pg';

export interface TileInfo {
  z: number;
  x: number;
  y: number;
  layerSig: string;
}

export interface CachedTile {
  tileKey: string;
  tileData: Buffer;
  generatedAt: Date;
  expiresAt: Date;
}

/**
 * Generate a tile cache key
 */
export function generateTileKey(tile: TileInfo): string {
  return `${tile.layerSig}:${tile.z}:${tile.x}:${tile.y}`;
}

/**
 * Check if a tile exists in cache and is not expired
 */
export async function getCachedTile(tile: TileInfo): Promise<Buffer | null> {
  const tileKey = generateTileKey(tile);
  
  try {
    const result = await query(
      `SELECT tile_data, expires_at 
       FROM public.vector_tiles_cache 
       WHERE tile_key = $1 AND expires_at > NOW()`,
      [tileKey]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].tile_data;
  } catch (error) {
    console.error('Error fetching cached tile:', error);
    return null;
  }
}

/**
 * Store a tile in the cache
 */
export async function cacheTile(tile: TileInfo, tileData: Buffer, ttlSeconds: number = 604800): Promise<void> {
  const tileKey = generateTileKey(tile);
  
  try {
    await query(
      `INSERT INTO public.vector_tiles_cache (tile_key, zoom_level, tile_x, tile_y, layer_sig, tile_data, generated_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '${ttlSeconds} seconds')
       ON CONFLICT (tile_key) DO UPDATE SET
         tile_data = EXCLUDED.tile_data,
         generated_at = NOW(),
         expires_at = NOW() + INTERVAL '${ttlSeconds} seconds',
         layer_sig = EXCLUDED.layer_sig`,
      [tileKey, tile.z, tile.x, tile.y, tile.layerSig, tileData]
    );
  } catch (error) {
    console.error('Error caching tile:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const result = await query('SELECT public.get_tile_stats() as stats');
    return result.rows[0].stats;
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return {
      cache_total: 0,
      cache_expired: 0,
      cache_size_mb: 0,
      jobs_pending: 0,
      jobs_processing: 0,
      jobs_failed: 0,
      last_generated: null,
    };
  }
}

/**
 * Clean up expired tiles
 */
export async function cleanupExpiredTiles(): Promise<number> {
  try {
    const result = await query('SELECT public.cleanup_expired_tiles() as deleted_count');
    return result.rows[0].deleted_count;
  } catch (error) {
    console.error('Error cleaning up expired tiles:', error);
    return 0;
  }
}

/**
 * Get tiles in viewport for preloading
 */
export async function getViewportTiles(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number,
  zoomLevel: number,
  layerSig: string
) {
  try {
    const result = await query(
      'SELECT * FROM public.get_viewport_tiles($1, $2, $3, $4, $5, $6)',
      [minLon, minLat, maxLon, maxLat, zoomLevel, layerSig]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching viewport tiles:', error);
    return [];
  }
}