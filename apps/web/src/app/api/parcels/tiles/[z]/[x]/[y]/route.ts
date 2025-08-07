import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Vector tile generation for MapBox
// Using Mapbox Vector Tile (MVT) format

// Convert tile coordinates to bounding box
function tileToBBOX(x: number, y: number, z: number) {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  const minLat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  const maxLat = (180 / Math.PI) * Math.atan(Math.sinh(Math.PI - 2 * Math.PI * (y + 1) / Math.pow(2, z)));
  const minLng = x / Math.pow(2, z) * 360 - 180;
  const maxLng = (x + 1) / Math.pow(2, z) * 360 - 180;
  
  return { minLng, minLat, maxLng, maxLat };
}

// Simplify geometry based on zoom level
function getSimplificationTolerance(zoom: number): number {
  // Higher zoom = more detail, lower tolerance
  if (zoom >= 16) return 0.00001;
  if (zoom >= 14) return 0.0001;
  if (zoom >= 12) return 0.001;
  if (zoom >= 10) return 0.01;
  return 0.1;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z: zStr, x: xStr, y: yStr } = await params;
  try {
    const z = parseInt(zStr);
    const x = parseInt(xStr);
    const y = parseInt(yStr);
    
    // Validate tile coordinates
    if (isNaN(z) || isNaN(x) || isNaN(y) || z < 0 || z > 22) {
      return NextResponse.json({ error: 'Invalid tile coordinates' }, { status: 400 });
    }
    
    const bbox = tileToBBOX(x, y, z);
    const supabase = await createServerSupabaseClient();
    
    // Build query based on zoom level
    let query = supabase
      .from('florida_parcels')
      .select('PARCEL_ID, OWN_NAME, PHY_ADDR1, PHY_CITY, PHY_ZIPCD, latitude, longitude, JV, DOR_UC')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('longitude', bbox.minLng)
      .lte('longitude', bbox.maxLng)
      .gte('latitude', bbox.minLat)
      .lte('latitude', bbox.maxLat);
    
    // Apply data reduction based on zoom level
    if (z < 10) {
      // At low zoom, only show high-value properties
      query = query.gte('JV', 1000000);
    } else if (z < 12) {
      // At medium zoom, show properties over 500k
      query = query.gte('JV', 500000);
    }
    
    // Limit results to prevent huge tiles
    const maxFeatures = z >= 14 ? 5000 : z >= 12 ? 2000 : 500;
    query = query.limit(maxFeatures);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tile data:', error);
      return NextResponse.json({ error: 'Failed to fetch tile data' }, { status: 500 });
    }
    
    // Convert to GeoJSON for now (could convert to MVT binary format for better performance)
    const geojson = {
      type: 'FeatureCollection',
      features: (data || []).map((parcel: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parcel.longitude, parcel.latitude]
        },
        properties: {
          id: parcel.PARCEL_ID,
          owner: parcel.OWN_NAME,
          address: parcel.PHY_ADDR1,
          city: parcel.PHY_CITY,
          zip: parcel.PHY_ZIPCD,
          value: parcel.JV,
          year: parcel.DOR_UC
        }
      }))
    };
    
    // Return with appropriate caching headers
    return NextResponse.json(geojson, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Cache for 1 hour client, 1 day CDN
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error in vector tile generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}