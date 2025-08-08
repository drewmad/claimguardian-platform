import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TileParamsSchema = z.object({
  tiles: z.tuple([z.string(), z.string(), z.string()]).transform(([z, x, y]) => ({
    z: parseInt(z, 10),
    x: parseInt(x, 10),
    y: parseInt(y, 10)
  }))
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tiles: string[] } }
) {
  try {
    // Validate tile coordinates
    const tileParams = TileParamsSchema.parse(params);
    const { z, x, y } = tileParams.tiles;

    // Validate zoom level
    if (z < 0 || z > 22) {
      return NextResponse.json(
        { error: 'Invalid zoom level' },
        { status: 400 }
      );
    }

    // Generate MVT tile using PostGIS function
    const { data, error } = await supabase.rpc('mvt_parcels', {
      z,
      x,
      y,
      query_params: {}
    });

    if (error) {
      console.error('MVT generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate tile' },
        { status: 500 }
      );
    }

    if (!data) {
      // Return empty tile
      return new NextResponse(new ArrayBuffer(0), {
        status: 204,
        headers: {
          'Content-Type': 'application/vnd.mapbox-vector-tile',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Convert base64 to binary
    const tileBuffer = Buffer.from(data, 'base64');

    return new NextResponse(tileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.mapbox-vector-tile',
        'Content-Encoding': 'gzip',
        'Cache-Control': 'public, max-age=3600', // Cache tiles for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Tile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}