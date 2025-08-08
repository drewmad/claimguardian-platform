import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AddressLookupRequest {
  address?: string;
  lat?: number;
  lon?: number;
  radius_meters?: number;
}

interface ParcelResult {
  parcel_id: string;
  county_fips: string;
  owner_name: string;
  site_address: string;
  just_value: number;
  assessed_value: number;
  centroid: {
    lat: number;
    lon: number;
  };
  distance_meters?: number;
}

serve(async (req) => {
  const { method } = req;
  
  if (method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body: AddressLookupRequest = await req.json();
    const { address, lat, lon, radius_meters = 1000 } = body;

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabase
      .from('stg_parcels')
      .select(`
        parcel_id,
        county_fips,
        owner_name,
        site_address,
        just_value,
        assessed_value,
        centroid_lon,
        centroid_lat
      `);

    if (address) {
      // Address-based search
      query = query.ilike('site_address', `%${address}%`);
    } else if (lat && lon) {
      // Use PostGIS proximity search via RPC
      const { data, error } = await supabase.rpc('find_parcels_near_point', {
        search_lat: lat,
        search_lon: lon,
        radius_m: radius_meters,
        max_results: 50
      });

      if (error) {
        console.error('PostGIS proximity search error:', error);
        return new Response(JSON.stringify({ 
          error: 'Proximity search failed' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const results: ParcelResult[] = data.map((row: any) => ({
        parcel_id: row.parcel_id,
        county_fips: row.county_fips,
        owner_name: row.owner_name,
        site_address: row.site_address,
        just_value: row.just_value,
        assessed_value: row.assessed_value,
        centroid: {
          lat: row.centroid_lat,
          lon: row.centroid_lon
        },
        distance_meters: row.distance_meters
      }));

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Either address or coordinates (lat/lon) must be provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Address lookup error:', error);
      return new Response(JSON.stringify({ 
        error: 'Address lookup failed' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results: ParcelResult[] = data.map((row: any) => ({
      parcel_id: row.parcel_id,
      county_fips: row.county_fips,
      owner_name: row.owner_name,
      site_address: row.site_address,
      just_value: row.just_value,
      assessed_value: row.assessed_value,
      centroid: {
        lat: row.centroid_lat,
        lon: row.centroid_lon
      }
    }));

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});