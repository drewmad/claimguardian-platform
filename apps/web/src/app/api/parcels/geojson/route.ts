import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const county = searchParams.get('county');
    const limit = searchParams.get('limit') || '10000';
    const bbox = searchParams.get('bbox'); // Format: minLng,minLat,maxLng,maxLat
    
    const supabase = await createServerSupabaseClient();
    
    // Build query
    let query = supabase
      .from('florida_parcels')
      .select('PARCEL_ID, OWN_NAME, PHY_ADDR1, PHY_CITY, PHY_ZIPCD, latitude, longitude, JV, DOR_UC, CO_NO')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(parseInt(limit));
    
    // Apply filters
    if (county) {
      query = query.eq('CO_NO', county);
    }
    
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      query = query
        .gte('longitude', minLng)
        .lte('longitude', maxLng)
        .gte('latitude', minLat)
        .lte('latitude', maxLat);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching parcels:', error);
      return NextResponse.json({ error: 'Failed to fetch parcels' }, { status: 500 });
    }
    
    // Convert to GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: (data || []).map((parcel: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parcel.longitude, parcel.latitude]
        },
        properties: {
          PARCEL_ID: parcel.PARCEL_ID,
          OWN_NAME: parcel.OWN_NAME,
          PHY_ADDR1: parcel.PHY_ADDR1,
          PHY_CITY: parcel.PHY_CITY,
          PHY_ZIPCD: parcel.PHY_ZIPCD,
          JV: parcel.JV,
          DOR_UC: parcel.DOR_UC,
          CO_NO: parcel.CO_NO,
          // Add claim status from related tables if needed
          claim_status: null // Placeholder
        }
      }))
    };
    
    return NextResponse.json(geojson, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
    
  } catch (error) {
    console.error('Error in parcels GeoJSON API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}