import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RiskResponse {
  parcel_id: string;
  risk_score: number;
  risk_category: string;
  components: {
    hurricane_risk: number;
    wind_risk: number;
    value_risk: number;
  };
  calculated_at: string;
}

serve(async (req) => {
  const { method, url } = req;
  
  if (method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const urlObj = new URL(url);
    const parcelId = urlObj.searchParams.get('parcel_id');
    
    if (!parcelId) {
      return new Response(JSON.stringify({ 
        error: 'Missing parcel_id parameter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Query risk data from dbt mart
    const { data, error } = await supabase
      .from('mart_parcel_risk')
      .select(`
        parcel_id,
        risk_score,
        risk_category,
        hurricane_risk,
        wind_risk,
        value_risk,
        calculated_at
      `)
      .eq('parcel_id', parcelId)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return new Response(JSON.stringify({ 
        error: 'Database query failed' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ 
        error: 'Parcel not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response: RiskResponse = {
      parcel_id: data.parcel_id,
      risk_score: data.risk_score,
      risk_category: data.risk_category,
      components: {
        hurricane_risk: data.hurricane_risk,
        wind_risk: data.wind_risk,
        value_risk: data.value_risk
      },
      calculated_at: data.calculated_at
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
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