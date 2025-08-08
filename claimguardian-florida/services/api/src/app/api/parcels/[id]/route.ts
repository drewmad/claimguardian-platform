import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ParcelParamsSchema = z.object({
  id: z.string().min(1)
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate parameters
    const { id } = ParcelParamsSchema.parse(params);

    // Query parcel details
    const { data: parcel, error } = await supabase
      .from('stg_parcels')
      .select(`
        parcel_id,
        county_fips,
        owner_name,
        site_address,
        just_value,
        assessed_value,
        land_use_code,
        centroid_lon,
        centroid_lat,
        is_valid_parcel,
        assessment_ratio,
        created_at,
        updated_at
      `)
      .eq('parcel_id', id)
      .eq('is_valid_parcel', true)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch parcel' },
        { status: 500 }
      );
    }

    if (!parcel) {
      return NextResponse.json(
        { error: 'Parcel not found' },
        { status: 404 }
      );
    }

    // Transform response to match OpenAPI schema
    const response = {
      parcel_id: parcel.parcel_id,
      county_fips: parcel.county_fips,
      address: parcel.site_address,
      owner_name: parcel.owner_name,
      just_value: parcel.just_value,
      assessed_value: parcel.assessed_value,
      site_centroid: {
        lat: parcel.centroid_lat,
        lon: parcel.centroid_lon
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}