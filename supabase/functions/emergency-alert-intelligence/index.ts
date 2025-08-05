import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface EmergencyAlertRequest {
  location: {
    lat: number
    lng: number
    address?: string
    state?: string
    county?: string
  }
  monitoringType: 'active-alerts' | 'hurricane-tracking' | 'flood-warnings' | 'fire-alerts' | 'comprehensive-monitoring'
  options?: {
    radius?: number // miles from location
    severityFilter?: 'minor' | 'moderate' | 'severe' | 'extreme' | 'all'
    alertTypes?: string[] // hurricane, tornado, flood, fire, etc.
    timeframe?: number // hours to look back/ahead
    includeWatch?: boolean // include watches in addition to warnings
    includeAdvisory?: boolean // include advisories
  }
}

interface EmergencyAlertIntelligence {
  activeAlerts?: Array<{
    id: string
    type: string // Hurricane Warning, Tornado Watch, Flood Advisory, etc.
    severity: 'minor' | 'moderate' | 'severe' | 'extreme'
    urgency: 'immediate' | 'expected' | 'future' | 'past' | 'unknown'
    certainty: 'observed' | 'likely' | 'possible' | 'unlikely' | 'unknown'
    title: string
    description: string
    instruction?: string
    areaDescription: string
    effective: string
    expires: string
    category: string
    responseType: string
    distanceFromProperty: number
    directThreat: boolean
    insuranceRelevance: 'high' | 'medium' | 'low'
    recommendedActions: string[]
  }>
  hurricaneTracking?: {
    activeStorms: Array<{
      name: string
      basin: string
      classification: 'tropical-depression' | 'tropical-storm' | 'hurricane' | 'major-hurricane'
      category?: number // 1-5 for hurricanes
      windSpeed: number
      currentLocation: { lat: number, lng: number }
      movement: {
        direction: number // degrees
        speed: number // mph
      }
      distanceFromProperty: number
      estimatedArrival?: string
      threatLevel: 'none' | 'low' | 'moderate' | 'high' | 'extreme'
      evacuationRecommended: boolean
      trackingCone: Array<{ lat: number, lng: number, time: string }>
    }>
    seasonalOutlook: string
    preparednessRecommendations: string[]
  }
  floodMonitoring?: {
    currentConditions: {
      floodStage: 'normal' | 'action' | 'minor' | 'moderate' | 'major'
      waterLevel: number
      risingTrend: boolean
      nearbyGauges: Array<{
        name: string
        distance: number
        currentLevel: number
        floodStage: number
        trend: 'rising' | 'falling' | 'steady'
      }>
    }
    floodForecast: Array<{
      date: string
      predictedLevel: number
      floodProbability: number
      riskLevel: 'low' | 'moderate' | 'high'
    }>
    evacuationZones: Array<{
      zone: string
      evacuationStatus: 'none' | 'voluntary' | 'mandatory'
      shelterLocations: Array<{ name: string, address: string, distance: number }>
    }>
  }
  fireAlerts?: {
    activeIncidents: Array<{
      name: string
      size: number // acres
      containment: number // percentage
      cause: string
      distanceFromProperty: number
      smokeThreat: boolean
      evacuationStatus: 'none' | 'advisory' | 'warning' | 'order'
      airQualityImpact: 'low' | 'moderate' | 'unhealthy' | 'hazardous'
    }>
    riskAssessment: {
      fireWeatherWarning: boolean
      redFlagConditions: boolean
      droughtLevel: string
      vegetationMoisture: 'very-low' | 'low' | 'moderate' | 'high'
    }
  }
  emergencyServices?: {
    nearestServices: Array<{
      type: 'hospital' | 'fire-station' | 'police' | 'emergency-shelter'
      name: string
      address: string
      distance: number
      phone: string
      operationalStatus: 'open' | 'limited' | 'closed' | 'unknown'
    }>
    evacuationRoutes: Array<{
      routeName: string
      description: string
      currentStatus: 'clear' | 'congested' | 'blocked'
      estimatedTravelTime: number
    }>
  }
  riskSummary?: {
    immediateThreats: string[]
    todayRisks: string[]
    weekAheadRisks: string[]
    preparednessLevel: 'minimal' | 'standard' | 'heightened' | 'maximum'
    lastUpdated: string
    nextUpdateExpected: string
    alertCount: {
      total: number
      severe: number
      moderate: number
      minor: number
    }
  }
}

// Emergency Alert Data Sources
const ALERT_SOURCES = {
  nws: 'https://api.weather.gov/alerts', // National Weather Service
  fema: 'https://www.fema.gov/api/open/v2/EmergencyAlerts', // FEMA Alerts
  nhc: 'https://www.nhc.noaa.gov/CurrentStorms.json', // National Hurricane Center
  usgs: 'https://waterservices.usgs.gov/nwis/iv/', // USGS Water Services
  nifc: 'https://rmgsc.cr.usgs.gov/outgoing/GeoMAC/ActiveFirePerimeters.json', // Fire Data
  ipaws: 'https://api.fema.gov/open/v1/IpawsArchiveSearch' // Integrated Public Alert & Warning System
}

async function getActiveAlerts(lat: number, lng: number, options: any): Promise<any> {
  try {
    // Real implementation would query multiple alert sources
    // For now, generate comprehensive mock data based on location and season
    
    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `[Emergency Alerts] Fetching alerts for: ${lat}, ${lng}`
    }));
    return generateMockAlertData(lat, lng, options)
    
  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'Emergency alerts API error, using mock data:', error
}));
    return generateMockAlertData(lat, lng, options)
  }
}

function generateMockAlertData(lat: number, lng: number, options: any): any {
  const isFloridaLocation = lat > 24 && lat < 31 && lng > -88 && lng < -79
  const currentMonth = new Date().getMonth()
  const isHurricaneSeason = currentMonth >= 5 && currentMonth <= 10 // June-November
  
  const alerts = []
  
  // Generate hurricane-related alerts for Florida during hurricane season
  if (isFloridaLocation && isHurricaneSeason && Math.random() > 0.6) {
    alerts.push({
      id: 'hurricane-watch-fl-001',
      type: 'Hurricane Watch',
      severity: 'severe' as const,
      urgency: 'expected' as const,
      certainty: 'likely' as const,
      title: 'Hurricane Watch issued for Southeast Florida',
      description: 'A Hurricane Watch has been issued for Southeast Florida including Miami-Dade, Broward, and Palm Beach counties. Hurricane conditions are possible within 48 hours.',
      instruction: 'Preparations to protect life and property should be rushed to completion. Prepare for dangerous wind having possible significant impacts across Southeast Florida.',
      areaDescription: 'Southeast Florida coastal areas',
      effective: new Date().toISOString(),
      expires: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      category: 'Met',
      responseType: 'Prepare',
      distanceFromProperty: Math.random() * 20,
      directThreat: true,
      insuranceRelevance: 'high' as const,
      recommendedActions: [
        'Document current property condition with photos',
        'Secure outdoor furniture and potential projectiles',
        'Review insurance coverage and contact information',
        'Prepare emergency supplies for 3-7 days',
        'Identify evacuation routes and shelters'
      ]
    })
  }
  
  // Generate flood warnings for low-lying areas
  if (isFloridaLocation && Math.random() > 0.7) {
    alerts.push({
      id: 'flood-advisory-fl-002',
      type: 'Flood Advisory',
      severity: 'moderate' as const,
      urgency: 'expected' as const,
      certainty: 'likely' as const,
      title: 'Flood Advisory for urban and small stream flooding',
      description: 'Heavy rainfall may cause flooding of small creeks and streams, urban areas, highways, streets and underpasses.',
      instruction: 'Turn around, don\'t drown when encountering flooded roads. Most flood deaths occur in vehicles.',
      areaDescription: 'Urban and low-lying areas',
      effective: new Date().toISOString(),
      expires: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      category: 'Met',
      responseType: 'Avoid',
      distanceFromProperty: Math.random() * 5,
      directThreat: Math.random() > 0.5,
      insuranceRelevance: 'medium' as const,
      recommendedActions: [
        'Avoid driving through flooded roads',
        'Move valuables to higher ground if flooding expected',
        'Check flood insurance coverage',
        'Monitor local water levels'
      ]
    })
  }
  
  // Generate tornado watch during stormy weather
  if (Math.random() > 0.8) {
    alerts.push({
      id: 'tornado-watch-003',
      type: 'Tornado Watch',
      severity: 'severe' as const,
      urgency: 'immediate' as const,
      certainty: 'possible' as const,
      title: 'Tornado Watch until 8 PM',
      description: 'Conditions are favorable for the development of severe thunderstorms and tornadoes.',
      instruction: 'Be ready to act quickly if a tornado warning is issued or you suspect a tornado is approaching.',
      areaDescription: 'Central and Northern Florida',
      effective: new Date().toISOString(),
      expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      category: 'Met',
      responseType: 'Prepare',
      distanceFromProperty: Math.random() * 50,
      directThreat: false,
      insuranceRelevance: 'high' as const,
      recommendedActions: [
        'Identify safe room or interior room on lowest floor',
        'Stay tuned to weather radio or local media',
        'Have shoes and protective covering ready',
        'Be prepared to take shelter immediately'
      ]
    })
  }
  
  return {
    alerts,
    location: { lat, lng },
    queryTime: new Date().toISOString(),
    sources: ['NWS', 'FEMA', 'Local Emergency Management']
  }
}

function generateHurricaneTracking(lat: number, lng: number): any {
  const isFloridaLocation = lat > 24 && lat < 31 && lng > -88 && lng < -79
  const currentMonth = new Date().getMonth()
  const isHurricaneSeason = currentMonth >= 5 && currentMonth <= 10
  
  if (!isHurricaneSeason || !isFloridaLocation || Math.random() > 0.4) {
    return {
      activeStorms: [],
      seasonalOutlook: 'No active tropical systems threatening the area',
      preparednessRecommendations: ['Monitor weather conditions during hurricane season']
    }
  }
  
  // Generate mock active hurricane
  const stormNames = ['Alex', 'Bonnie', 'Colin', 'Danielle', 'Earl', 'Fiona', 'Gaston', 'Hermine']
  const stormName = stormNames[Math.floor(Math.random() * stormNames.length)]
  
  const activeStorms = [{
    name: `Hurricane ${stormName}`,
    basin: 'Atlantic',
    classification: 'hurricane' as const,
    category: Math.floor(Math.random() * 3) + 2, // Cat 2-4
    windSpeed: 100 + Math.random() * 55, // 100-155 mph
    currentLocation: {
      lat: lat - 2 - Math.random() * 3, // 2-5 degrees south
      lng: lng + 1 + Math.random() * 2   // 1-3 degrees east
    },
    movement: {
      direction: 315 + Math.random() * 30, // Generally NW movement
      speed: 8 + Math.random() * 12       // 8-20 mph forward speed
    },
    distanceFromProperty: 150 + Math.random() * 100, // 150-250 miles
    estimatedArrival: new Date(Date.now() + (24 + Math.random() * 48) * 60 * 60 * 1000).toISOString(),
    threatLevel: 'high' as const,
    evacuationRecommended: Math.random() > 0.5,
    trackingCone: generateTrackingCone(lat, lng)
  }]
  
  return {
    activeStorms,
    seasonalOutlook: `Active hurricane season - ${stormName} poses significant threat to Florida`,
    preparednessRecommendations: [
      'Complete hurricane preparations immediately',
      'Review evacuation plans and routes',
      'Ensure emergency supplies are stocked',
      'Secure all outdoor items and potential projectiles',
      'Document property condition for insurance purposes'
    ]
  }
}

function generateTrackingCone(centerLat: number, centerLng: number): Array<{ lat: number, lng: number, time: string }> {
  const cone = []
  const baseTime = Date.now()
  
  for (let i = 0; i <= 5; i++) { // 5-day forecast
    const time = new Date(baseTime + i * 24 * 60 * 60 * 1000)
    const uncertainty = i * 0.5 // Increasing uncertainty over time
    
    cone.push({
      lat: centerLat + (i * 0.3) + (Math.random() - 0.5) * uncertainty,
      lng: centerLng - (i * 0.2) + (Math.random() - 0.5) * uncertainty,
      time: time.toISOString()
    })
  }
  
  return cone
}

function generateFloodMonitoring(lat: number, lng: number): any {
  const isCoastal = Math.abs(lng) < 81 // Rough approximation for Florida coast
  const elevation = 5 + Math.random() * 15 // Low elevation typical of Florida
  
  return {
    currentConditions: {
      floodStage: elevation < 8 ? 'action' : 'normal',
      waterLevel: elevation - 2 + Math.random() * 4,
      risingTrend: Math.random() > 0.6,
      nearbyGauges: [
        {
          name: 'Local Creek Gauge',
          distance: 1.2 + Math.random() * 3,
          currentLevel: elevation - 1,
          floodStage: elevation + 2,
          trend: Math.random() > 0.5 ? 'rising' : 'steady'
        }
      ]
    },
    floodForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predictedLevel: elevation - 1 + Math.random() * 3,
      floodProbability: Math.random() * 40,
      riskLevel: Math.random() > 0.7 ? 'moderate' : 'low'
    })),
    evacuationZones: isCoastal ? [{
      zone: 'Zone A - Coastal',
      evacuationStatus: 'none' as const,
      shelterLocations: [
        { name: 'Community Center', address: '123 Safe St', distance: 2.1 },
        { name: 'High School Gymnasium', address: '456 Shelter Ave', distance: 3.8 }
      ]
    }] : []
  }
}

function generateEmergencyServices(lat: number, lng: number): any {
  return {
    nearestServices: [
      {
        type: 'hospital' as const,
        name: 'Regional Medical Center',
        address: '789 Health Way',
        distance: 2.3 + Math.random() * 3,
        phone: '(555) 123-4567',
        operationalStatus: 'open' as const
      },
      {
        type: 'fire-station' as const,
        name: 'Fire Station 12',
        address: '456 Fire Lane',
        distance: 1.1 + Math.random() * 2,
        phone: '911',
        operationalStatus: 'open' as const
      },
      {
        type: 'emergency-shelter' as const,
        name: 'Emergency Shelter - Community Center',
        address: '123 Safe Street',
        distance: 2.8 + Math.random() * 4,
        phone: '(555) 234-5678',
        operationalStatus: Math.random() > 0.8 ? 'limited' : 'open'
      }
    ],
    evacuationRoutes: [
      {
        routeName: 'Primary Evacuation Route - I-95 North',
        description: 'Main highway evacuation route heading inland',
        currentStatus: Math.random() > 0.7 ? 'congested' : 'clear',
        estimatedTravelTime: 45 + Math.random() * 30
      },
      {
        routeName: 'Secondary Route - US-1 North',
        description: 'Alternative coastal evacuation route',
        currentStatus: 'clear' as const,
        estimatedTravelTime: 60 + Math.random() * 20
      }
    ]
  }
}

function generateRiskSummary(alerts: any[], intelligence: EmergencyAlertIntelligence): any {
  const severeCounts = alerts.filter(a => a.severity === 'severe').length
  const moderateCounts = alerts.filter(a => a.severity === 'moderate').length
  const minorCounts = alerts.filter(a => a.severity === 'minor').length
  
  const immediateThreats = alerts
    .filter(a => a.urgency === 'immediate' && a.directThreat)
    .map(a => a.title)
  
  const todayRisks = alerts
    .filter(a => a.urgency === 'expected')
    .map(a => a.type)
  
  let preparednessLevel: 'minimal' | 'standard' | 'heightened' | 'maximum' = 'minimal'
  
  if (severeCounts > 0 || immediateThreats.length > 0) {
    preparednessLevel = 'maximum'
  } else if (moderateCounts > 1 || todayRisks.length > 2) {
    preparednessLevel = 'heightened'
  } else if (moderateCounts > 0 || todayRisks.length > 0) {
    preparednessLevel = 'standard'
  }
  
  const weekAheadRisks = []
  if (intelligence.hurricaneTracking?.activeStorms?.length) {
    weekAheadRisks.push('Hurricane approach possible')
  }
  
  return {
    immediateThreats,
    todayRisks,
    weekAheadRisks,
    preparednessLevel,
    lastUpdated: new Date().toISOString(),
    nextUpdateExpected: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    alertCount: {
      total: alerts.length,
      severe: severeCounts,
      moderate: moderateCounts,
      minor: minorCounts
    }
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const requestData: EmergencyAlertRequest = await req.json()
    const { location, monitoringType, options = {} } = requestData

    if (!location?.lat || !location?.lng) {
      throw new Error('Location coordinates are required')
    }

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `[Emergency Alert Intelligence] Processing ${monitoringType} for location: ${location.lat}, ${location.lng}`
    }));

    // Get emergency alert data
    const alertData = await getActiveAlerts(location.lat, location.lng, options)
    
    let intelligence: EmergencyAlertIntelligence = {}

    switch (monitoringType) {
      case 'active-alerts':
        intelligence.activeAlerts = alertData.alerts
        break

      case 'hurricane-tracking':
        intelligence.activeAlerts = alertData.alerts.filter((alert: any) => 
          alert.type.toLowerCase().includes('hurricane') || 
          alert.type.toLowerCase().includes('tropical')
        )
        intelligence.hurricaneTracking = generateHurricaneTracking(location.lat, location.lng)
        break

      case 'flood-warnings':
        intelligence.activeAlerts = alertData.alerts.filter((alert: any) => 
          alert.type.toLowerCase().includes('flood')
        )
        intelligence.floodMonitoring = generateFloodMonitoring(location.lat, location.lng)
        break

      case 'fire-alerts':
        intelligence.activeAlerts = alertData.alerts.filter((alert: any) => 
          alert.type.toLowerCase().includes('fire')
        )
        // Fire alerts would be more relevant for western states
        intelligence.fireAlerts = {
          activeIncidents: [],
          riskAssessment: {
            fireWeatherWarning: false,
            redFlagConditions: false,
            droughtLevel: 'normal',
            vegetationMoisture: 'moderate'
          }
        }
        break

      case 'comprehensive-monitoring':
        intelligence.activeAlerts = alertData.alerts
        intelligence.hurricaneTracking = generateHurricaneTracking(location.lat, location.lng)
        intelligence.floodMonitoring = generateFloodMonitoring(location.lat, location.lng)
        intelligence.emergencyServices = generateEmergencyServices(location.lat, location.lng)
        intelligence.riskSummary = generateRiskSummary(alertData.alerts, intelligence)
        break

      default:
        throw new Error(`Unknown monitoring type: ${monitoringType}`)
    }

    const response = {
      success: true,
      data: intelligence,
      location,
      monitoringType,
      options,
      dataSources: alertData.sources,
      timestamp: new Date().toISOString(),
      apiUsed: 'emergency-alert-intelligence',
      dataSource: 'Multiple Emergency Alert Systems (Mock Data)',
      nextUpdate: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: '[Emergency Alert Intelligence] Error:', error
}));
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Unknown error',
      timestamp: new Date().toISOString(),
      apiUsed: 'emergency-alert-intelligence'
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})