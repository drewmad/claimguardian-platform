import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Test NWS Weather API
    const lat = 26.6406; // Fort Myers, FL
    const lon = -81.8723;

    // Get current weather
    const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: {
        'User-Agent': 'ClaimGuardian/1.0 (claimguardianai.com)',
        'Accept': 'application/geo+json'
      }
    });

    if (!pointsResponse.ok) {
      throw new Error(`NWS API error: ${pointsResponse.statusText}`);
    }

    const pointsData = await pointsResponse.json();
    const gridId = pointsData.properties.gridId;
    const gridX = pointsData.properties.gridX;
    const gridY = pointsData.properties.gridY;

    // Get forecast
    const forecastResponse = await fetch(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
      {
        headers: {
          'User-Agent': 'ClaimGuardian/1.0',
          'Accept': 'application/geo+json'
        }
      }
    );

    const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;

    // Get active alerts for Florida
    const alertsResponse = await fetch(
      'https://api.weather.gov/alerts/active?area=FL',
      {
        headers: {
          'User-Agent': 'ClaimGuardian/1.0',
          'Accept': 'application/geo+json'
        }
      }
    );

    const alertsData = alertsResponse.ok ? await alertsResponse.json() : null;

    // Test FEMA API
    const femaResponse = await fetch(
      'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state%20eq%20%27FL%27&$top=5&$orderby=declarationDate%20desc',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClaimGuardian/1.0'
        }
      }
    );

    const femaData = femaResponse.ok ? await femaResponse.json() : null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      location: { lat, lon },
      weather: {
        grid: { gridId, gridX, gridY },
        forecast: forecastData?.properties?.periods?.[0] || null,
        activeAlerts: alertsData?.features?.length || 0
      },
      fema: {
        recentDisasters: femaData?.DisasterDeclarationsSummaries?.length || 0,
        latestDisaster: femaData?.DisasterDeclarationsSummaries?.[0] || null
      },
      message: 'API connections working! Visit /emergency-center to see the full dashboard.'
    });

  } catch (error: any) {
    console.error('Test weather API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: 'Check console for details'
      },
      { status: 500 }
    );
  }
}