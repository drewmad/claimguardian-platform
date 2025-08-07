import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch active wildfire data from Florida Forest Service
    const wildfireResponse = await fetch(
      'https://services3.arcgis.com/2p3s2n29pGgURi54/arcgis/rest/services/FFS_Active_Wildfires/FeatureServer/0/query?where=1%3D1&outFields=*&f=json'
    )

    if (!wildfireResponse.ok) {
      throw new Error('Failed to fetch wildfire data')
    }

    const wildfireData = await wildfireResponse.json()
    const features = wildfireData.features || []

    console.log(`Found ${features.length} active wildfires`)

    // Process each wildfire
    for (const feature of features) {
      const attrs = feature.attributes
      const geometry = feature.geometry

      // Upsert wildfire data
      const { error: upsertError } = await supabase
        .from('active_events')
        .upsert({
          external_id: attrs.FIRE_ID || `wildfire_${attrs.OBJECTID}`,
          event_type: 'wildfire',
          event_name: attrs.FIRE_NAME || 'Unnamed Fire',
          status: 'active',
          severity: attrs.ACRES > 100 ? 'high' : attrs.ACRES > 10 ? 'medium' : 'low',
          start_time: attrs.DISCOVERY_DATE ? new Date(attrs.DISCOVERY_DATE).toISOString() : new Date().toISOString(),
          attributes: attrs,
          geom: geometry ? `SRID=4326;POINT(${geometry.x} ${geometry.y})` : null,
          data_source: 'FL_FOREST_SERVICE'
        }, {
          onConflict: 'external_id'
        })

      if (upsertError) {
        console.error('Error upserting wildfire:', upsertError)
      }
    }

    // Find affected properties
    const { data: affectedProperties, error: queryError } = await supabase.rpc(
      'get_properties_affected_by_active_events'
    )

    if (queryError) {
      console.error('Error finding affected properties:', queryError)
    }

    // Create notifications for affected properties
    if (affectedProperties && affectedProperties.length > 0) {
      for (const property of affectedProperties) {
        // Check if notification already exists
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', property.user_id)
          .eq('data->>event_id', property.event_id)
          .eq('data->>property_id', property.property_id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .single()

        if (!existingNotif) {
          // Create new notification
          await supabase
            .from('notifications')
            .insert({
              user_id: property.user_id,
              type: 'hazard_alert',
              title: `${property.event_type} Alert`,
              message: `Your property "${property.property_name}" may be affected by ${property.event_name}`,
              data: {
                event_id: property.event_id,
                property_id: property.property_id,
                event_type: property.event_type,
                severity: property.severity
              }
            })
        }
      }
    }

    // Mark old events as resolved
    const { error: updateError } = await supabase
      .from('active_events')
      .update({ status: 'resolved' })
      .eq('event_type', 'wildfire')
      .lt('updated_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active')

    if (updateError) {
      console.error('Error updating old events:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        wildfires_processed: features.length,
        affected_properties: affectedProperties?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in monitor-active-events:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Helper RPC function to add to database
/*
CREATE OR REPLACE FUNCTION get_properties_affected_by_active_events()
RETURNS TABLE (
    event_id UUID,
    event_type VARCHAR,
    event_name VARCHAR,
    severity VARCHAR,
    property_id UUID,
    property_name VARCHAR,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ae.id as event_id,
        ae.event_type,
        ae.event_name,
        ae.severity,
        p.id as property_id,
        p.name as property_name,
        p.user_id
    FROM geospatial.active_events ae
    JOIN geospatial.parcels gp ON ST_Intersects(ae.geom, gp.geom)
    JOIN public.properties p ON p.parcel_id = gp.parcel_id
    WHERE ae.status = 'active'
    AND ae.updated_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
