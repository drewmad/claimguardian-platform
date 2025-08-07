/**
 * Integration Example: How to use the Florida Emergency Data Adapter
 * Replace mock data with real emergency feeds in Edge Functions
 * 
 * @fileMetadata
 * @purpose Example integration for replacing mock emergency data
 * @dependencies countyEmAdapter
 * @owner emergency-management-team
 * @status example
 */

import { getEmergencyIntelligence } from './countyEmAdapter';

/**
 * Example: Update the emergency-alert-intelligence Edge Function
 * 
 * Replace the generateMockAlertData function with real data calls
 */
export async function integrateRealEmergencyData(request: {
  location: {
    county?: string;
    zip?: string;
  };
}) {
  console.log('Getting real emergency intelligence for:', request.location);
  
  try {
    // Replace mock data with real data
    const emergencyIntelligence = await getEmergencyIntelligence(request.location);
    
    console.log(`Retrieved ${emergencyIntelligence.totalActiveAlerts} active alerts for ${emergencyIntelligence.countyName} County`);
    
    return {
      success: true,
      data: emergencyIntelligence,
      timestamp: new Date().toISOString(),
      source: 'real-time-feeds'
    };
    
  } catch (error) {
    console.error('Error getting real emergency data:', error);
    
    // Fallback to minimal response instead of mock data
    return {
      success: false,
      error: 'Failed to retrieve emergency data',
      data: {
        countyCode: request.location.county || 'FLZ052',
        countyName: 'Florida',
        alertStatus: 'unknown',
        totalActiveAlerts: 0,
        activeAlerts: [],
        riskAssessment: {
          overallRisk: 'minimal',
          immediateThreats: [],
          potentialImpacts: []
        },
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      source: 'fallback'
    };
  }
}

/**
 * Example: Integration for the emergency-alert-intelligence Edge Function
 * 
 * This shows how to modify the existing function to use real data
 */
export function getUpdatedEdgeFunctionCode() {
  return `
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getEmergencyIntelligence } from '../_shared/countyEmAdapter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();
    
    // Use real data instead of mock
    const result = await getEmergencyIntelligence(location);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        source: 'real-time-feeds'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Emergency Intelligence Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to retrieve emergency intelligence',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
`;
}

/**
 * Data source documentation for reference
 */
export const DATA_SOURCES = {
  primary: [
    {
      name: 'NOAA/NWS CAP Alerts',
      url: 'https://alerts.weather.gov/cap/wwaatmget.php',
      format: 'CAP XML',
      updateFrequency: 'Real-time',
      coverage: 'County-specific',
      reliability: 'High'
    },
    {
      name: 'Florida Division of Emergency Management',
      url: 'https://www.floridadisaster.org/rss/news.xml',
      format: 'RSS/XML',
      updateFrequency: 'As needed',
      coverage: 'State-wide',
      reliability: 'High'
    }
  ],
  fallback: [
    {
      name: 'NWS Florida State Alerts',
      url: 'https://alerts.weather.gov/cap/fl.php',
      format: 'CAP XML',
      updateFrequency: 'Real-time',
      coverage: 'State-wide',
      reliability: 'High'
    }
  ]
};

export default {
  integrateRealEmergencyData,
  getUpdatedEdgeFunctionCode,
  DATA_SOURCES
};