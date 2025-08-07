import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all, address, owner, parcel
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!query || query.length < 3) {
      return NextResponse.json({ 
        error: 'Query must be at least 3 characters' 
      }, { status: 400 });
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Build search query based on type
    let dbQuery = supabase
      .from('florida_parcels')
      .select('PARCEL_ID, OWN_NAME, PHY_ADDR1, PHY_CITY, PHY_ZIPCD, latitude, longitude, JV, CO_NO')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(limit);
    
    const searchTerm = `%${query}%`;
    
    switch (type) {
      case 'address':
        dbQuery = dbQuery.or(`PHY_ADDR1.ilike.${searchTerm},PHY_CITY.ilike.${searchTerm}`);
        break;
      case 'owner':
        dbQuery = dbQuery.ilike('OWN_NAME', searchTerm);
        break;
      case 'parcel':
        dbQuery = dbQuery.ilike('PARCEL_ID', searchTerm);
        break;
      default: // 'all'
        dbQuery = dbQuery.or(
          `PHY_ADDR1.ilike.${searchTerm},PHY_CITY.ilike.${searchTerm},OWN_NAME.ilike.${searchTerm},PARCEL_ID.ilike.${searchTerm}`
        );
    }
    
    const { data, error } = await dbQuery;
    
    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ 
        error: 'Search failed' 
      }, { status: 500 });
    }
    
    // Format results with relevance scoring
    const results = (data || []).map((parcel: any) => {
      // Simple relevance scoring based on match type
      let relevance = 0;
      const lowerQuery = query.toLowerCase();
      
      if (parcel.PARCEL_ID?.toLowerCase().includes(lowerQuery)) relevance += 3;
      if (parcel.OWN_NAME?.toLowerCase().includes(lowerQuery)) relevance += 2;
      if (parcel.PHY_ADDR1?.toLowerCase().includes(lowerQuery)) relevance += 2;
      if (parcel.PHY_CITY?.toLowerCase().includes(lowerQuery)) relevance += 1;
      
      return {
        id: parcel.PARCEL_ID,
        title: parcel.PHY_ADDR1 || 'Unknown Address',
        subtitle: `${parcel.PHY_CITY || ''}, FL ${parcel.PHY_ZIPCD || ''}`,
        owner: parcel.OWN_NAME,
        value: parcel.JV,
        coordinates: [parcel.longitude, parcel.latitude],
        relevance,
        type: 'property'
      };
    });
    
    // Sort by relevance
    results.sort((a: any, b: any) => b.relevance - a.relevance);
    
    return NextResponse.json({
      results,
      query,
      count: results.length,
      hasMore: results.length === limit
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Autocomplete endpoint
export async function POST(request: NextRequest) {
  try {
    const { query, field = 'PHY_CITY' } = await request.json();
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Get unique values for autocomplete
    const { data, error } = await supabase
      .from('florida_parcels')
      .select(field)
      .ilike(field, `${query}%`)
      .limit(10);
    
    if (error) {
      console.error('Autocomplete error:', error);
      return NextResponse.json({ suggestions: [] });
    }
    
    // Get unique values
    const uniqueValues = [...new Set(data?.map((item: any) => item[field]).filter(Boolean))];
    
    return NextResponse.json({
      suggestions: uniqueValues.slice(0, 10)
    });
    
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}