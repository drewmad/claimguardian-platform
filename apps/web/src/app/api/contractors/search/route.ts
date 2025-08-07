import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const licenseType = searchParams.get('type');
    const county = searchParams.get('county');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters' 
      }, { status: 400 });
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Use the search function we created in the migration
    const { data, error } = await supabase.rpc('search_contractors', {
      search_term: query,
      license_type_filter: licenseType,
      county_filter: county,
      limit_count: limit
    });
    
    if (error) {
      console.error('Contractor search error:', error);
      return NextResponse.json({ 
        error: 'Search failed',
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      results: data || [],
      query,
      filters: {
        licenseType,
        county
      },
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('Contractor search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseNumbers } = body;
    
    if (!licenseNumbers || !Array.isArray(licenseNumbers)) {
      return NextResponse.json({ 
        error: 'License numbers array required' 
      }, { status: 400 });
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Batch lookup by license numbers
    const { data, error } = await supabase
      .from('dbpr_licenses')
      .select('*')
      .in('license_number', licenseNumbers)
      .eq('is_current', true);
    
    if (error) {
      console.error('Contractor lookup error:', error);
      return NextResponse.json({ 
        error: 'Lookup failed',
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      contractors: data || [],
      requested: licenseNumbers.length,
      found: data?.length || 0
    });
    
  } catch (error) {
    console.error('Contractor lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}