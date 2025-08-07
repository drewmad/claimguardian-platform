/**
 * Mapbox Vector Tiles (MVT) API Route
 * Serves compressed vector tiles for Florida parcel data
 * 
 * Route: /api/tiles/mvt/{z}/{x}/{y}
 * Returns: application/vnd.mapbox-vector-tile (gzipped)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCachedTile, cacheTile } from '@/lib/map-utils/tile-cache';
import { generateCompressedTile, isValidTile } from '@/lib/map-utils/tile-generator';
import { generateTileETag } from '@/lib/util/hash';

// Force Node.js runtime for database connections
export const runtime = 'nodejs';

interface RouteParams {
  z: string;
  x: string;
  y: string;
}

const MVT_VERSION_SIG = process.env.MVT_VERSION_SIG || 'properties|boundaries|risk_zones@v1';
const MVT_DEFAULT_TTL = parseInt(process.env.MVT_DEFAULT_TTL_SECONDS || '604800', 10); // 7 days
const MVT_ACTIVE_TTL = parseInt(process.env.MVT_ACTIVE_TTL_SECONDS || '86400', 10); // 1 day

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // Parse and validate tile coordinates
    const z = parseInt(params.z, 10);
    const x = parseInt(params.x, 10);
    const y = parseInt(params.y, 10);

    if (!isValidTile(z, x, y)) {
      return new NextResponse('Invalid tile coordinates', { 
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Check zoom level bounds
    const minZoom = parseInt(process.env.MVT_MIN_ZOOM || '6', 10);
    const maxZoom = parseInt(process.env.MVT_MAX_ZOOM || '22', 10);
    
    if (z < minZoom || z > maxZoom) {
      return new NextResponse('Zoom level out of range', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const tileInfo = { z, x, y, layerSig: MVT_VERSION_SIG };

    // Check for cached tile first
    let tileData: Buffer | null = null;
    
    try {
      tileData = await getCachedTile(tileInfo);
    } catch (error) {
      console.warn('Cache lookup failed, generating fresh tile:', error);
    }

    // Generate tile if not cached
    if (!tileData) {
      console.log(`Generating tile ${z}/${x}/${y}`);
      tileData = await generateCompressedTile(tileInfo);
      
      // Cache the generated tile (use shorter TTL for active areas)
      const ttl = z >= 12 ? MVT_ACTIVE_TTL : MVT_DEFAULT_TTL;
      
      try {
        await cacheTile(tileInfo, tileData, ttl);
      } catch (error) {
        console.warn('Failed to cache tile:', error);
        // Continue serving the tile even if caching fails
      }
    }

    // Handle empty tiles
    if (!tileData || tileData.length === 0) {
      return new NextResponse(Buffer.alloc(0), {
        status: 204, // No Content
        headers: {
          'Content-Type': 'application/vnd.mapbox-vector-tile',
          'Content-Encoding': 'gzip',
          'Cache-Control': 'public, max-age=3600', // 1 hour for empty tiles
          'CDN-Cache-Control': 'public, max-age=86400', // 24 hours on CDN
        },
      });
    }

    // Generate ETag for caching
    const etag = generateTileETag(z, x, y, MVT_VERSION_SIG, tileData);

    // Check if client has current version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=3600',
          'CDN-Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Set appropriate cache headers based on zoom level
    const browserCacheAge = z >= 14 ? 1800 : 3600; // 30 min for high zoom, 1 hour for low zoom
    const cdnCacheAge = z >= 14 ? 7200 : 86400; // 2 hours for high zoom, 24 hours for low zoom

    return new NextResponse(tileData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.mapbox-vector-tile',
        'Content-Encoding': 'gzip',
        'ETag': etag,
        'Cache-Control': `public, max-age=${browserCacheAge}`,
        'CDN-Cache-Control': `public, max-age=${cdnCacheAge}`,
        'Vary': 'Accept-Encoding',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
        'Content-Length': tileData.length.toString(),
      },
    });

  } catch (error) {
    console.error(`Error serving tile ${params.z}/${params.x}/${params.y}:`, error);
    
    return new NextResponse('Internal server error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
      'Access-Control-Max-Age': '86400',
    },
  });
}