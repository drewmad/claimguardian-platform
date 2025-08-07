import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface NOAAWeatherRequest {
  location: {
    lat: number
    lng: number
    address?: string
  }
  analysisType: 'current-conditions' | 'forecasts' | 'active-alerts' | 'storm-tracking' | 'historical-events' | 'complete-weather-intel'
  options?: {
    forecastDays?: number // 1-7 days
    includeHourly?: boolean
    alertSeverity?: 'minor' | 'moderate' | 'severe' | 'extreme'
    stormRadius?: number // miles from property
    includeRadar?: boolean
  }
}

interface NOAAWeatherIntelligence {
  currentConditions?: {
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: number
    pressure: number
    visibility: number
    conditions: string
    dewPoint: number
    heatIndex?: number
    windChill?: number
    uvIndex?: number
    observationTime: string
    weatherStation: string
  }
  forecasts?: {
    daily: Array<{
      date: string
      high: number
      low: number
      conditions: string
      precipitationChance: number
      windSpeed: number
      windDirection: string
      detailedForecast: string
    }>
    hourly?: Array<{
      time: string
      temperature: number
      conditions: string
      windSpeed: number
      precipitationChance: number
    }>
  }
  activeAlerts?: Array<{
    id: string
    title: string
    severity: 'minor' | 'moderate' | 'severe' | 'extreme'
    urgency: 'immediate' | 'expected' | 'future'
    certainty: 'observed' | 'likely' | 'possible'
    event: string
    headline: string
    description: string
    instruction?: string
    areaDesc: string
    effective: string
    expires: string
    category: string
    responseType: string
    claimRelevance: 'high' | 'medium' | 'low'
    insuranceImpact: string
  }>
  stormTracking?: {
    activeStorms: Array<{
      name: string
      type: 'hurricane' | 'tropical_storm' | 'tropical_depression' | 'severe_thunderstorm'
      category?: number
      windSpeed: number
      location: { lat: number, lng: number }
      movement: { direction: number, speed: number }
      distanceFromProperty: number
      eta?: string
      threatLevel: 'low' | 'moderate' | 'high' | 'extreme'
      evacuationRecommended: boolean
    }>
    radarImagery?: string
    satellite?: string
  }
  historicalEvents?: Array<{
    date: string
    eventType: string
    severity: string
    description: string
    damageReported: boolean
    relevanceToProperty: string
  }>
  riskAssessment?: {
    immediateThreats: string[]
    nextWeekRisks: string[]
    seasonalOutlook: string
    preparednessLevel: 'minimal' | 'standard' | 'heightened' | 'maximum'
    recommendedActions: string[]
    insuranceConsiderations: string[]
  }
}

// NOAA API endpoints don't require API keys - they're free government data!
const NOAA_BASE_URL = 'https://api.weather.gov'

async function getNOAAGridpoint(lat: number, lng: number): Promise<any> {
  try {
    const url = `${NOAA_BASE_URL}/points/${lat.toFixed(4)},${lng.toFixed(4)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ClaimGuardian/1.0 (contact@claimguardianai.com)' // NOAA requires User-Agent
      }
    })

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'NOAA Gridpoint API error, using fallback:', error
}));
    return generateMockGridpoint(lat, lng)
  }
}

function generateMockGridpoint(lat: number, lng: number): any {
  // Mock gridpoint data for development/fallback
  return {
    properties: {
      gridId: 'MFL', // Miami forecast office for Florida
      gridX: Math.floor(Math.random() * 100) + 50,
      gridY: Math.floor(Math.random() * 100) + 50,
      forecast: `${NOAA_BASE_URL}/gridpoints/MFL/65,45/forecast`,
      forecastHourly: `${NOAA_BASE_URL}/gridpoints/MFL/65,45/forecast/hourly`,
      observationStations: `${NOAA_BASE_URL}/gridpoints/MFL/65,45/stations`,
      forecastZone: 'https://api.weather.gov/zones/forecast/FLZ173',
      county: 'https://api.weather.gov/zones/county/FLC086',
      fireWeatherZone: 'https://api.weather.gov/zones/fire/FLZ173',
      timeZone: 'America/New_York',
      radarStation: 'KAMX'
    }
  }
}

async function getCurrentConditions(lat: number, lng: number): Promise<any> {
  try {
    const gridpoint = await getNOAAGridpoint(lat, lng)
    const stationsUrl = gridpoint.properties.observationStations

    // Get nearby weather stations
    const stationsResponse = await fetch(stationsUrl, {
      headers: { 'User-Agent': 'ClaimGuardian/1.0 (contact@claimguardianai.com)' }
    })

    if (stationsResponse.ok) {
      const stations = await stationsResponse.json()
      const nearestStation = stations.features?.[0]?.id

      if (nearestStation) {
        // Get current observations from nearest station
        const obsResponse = await fetch(`${nearestStation}/observations/latest`, {
          headers: { 'User-Agent': 'ClaimGuardian/1.0 (contact@claimguardianai.com)' }
        })

        if (obsResponse.ok) {
          const observation = await obsResponse.json()
          return observation
        }
      }
    }

    // Fallback to mock data
    return generateMockCurrentConditions(lat, lng)

  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'NOAA Current Conditions error, using mock data:', error
}));
    return generateMockCurrentConditions(lat, lng)
  }
}

function generateMockCurrentConditions(lat: number, lng: number): any {
  const isFloridaLocation = lat > 24 && lat < 31 && lng > -88 && lng < -79
  const baseTemp = isFloridaLocation ? 78 : 65

  return {
    properties: {
      timestamp: new Date().toISOString(),
      temperature: { value: baseTemp + (Math.random() - 0.5) * 20, unitCode: 'wmoUnit:degF' },
      relativeHumidity: { value: isFloridaLocation ? 70 + Math.random() * 20 : 50 + Math.random() * 30, unitCode: 'wmoUnit:percent' },
      windSpeed: { value: Math.random() * 15 + 5, unitCode: 'wmoUnit:mph' },
      windDirection: { value: Math.floor(Math.random() * 360), unitCode: 'wmoUnit:degree_(angle)' },
      barometricPressure: { value: 1013 + (Math.random() - 0.5) * 20, unitCode: 'wmoUnit:Pa' },
      visibility: { value: 10000, unitCode: 'wmoUnit:m' },
      textDescription: isFloridaLocation ? 'Partly Cloudy' : 'Fair',
      dewpoint: { value: baseTemp - 10 + Math.random() * 10, unitCode: 'wmoUnit:degF' },
      station: 'MOCK'
    }
  }
}

async function getForecast(gridpoint: any, includeHourly = false): Promise<any> {
  try {
    const forecastUrl = gridpoint.properties.forecast
    const forecastResponse = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'ClaimGuardian/1.0 (contact@claimguardianai.com)' }
    })

    let hourlyForecast = null
    if (includeHourly) {
      const hourlyUrl = gridpoint.properties.forecastHourly
      const hourlyResponse = await fetch(hourlyUrl, {
        headers: { 'User-Agent': 'ClaimGuardian/1.0 (contact@claimguardianai.com)' }
      })
      if (hourlyResponse.ok) {
        hourlyForecast = await hourlyResponse.json()
      }
    }

    if (forecastResponse.ok) {
      const forecast = await forecastResponse.json()
      return {
        daily: forecast,
        hourly: hourlyForecast
      }
    }

    return generateMockForecast(includeHourly)

  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'NOAA Forecast error, using mock data:', error
}));
    return generateMockForecast(includeHourly)
  }
}

function generateMockForecast(includeHourly: boolean): any {
  const daily = []
  const hourly = []

  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)

    daily.push({
      number: i + 1,
      name: date.toLocaleDateString('en-US', { weekday: 'long' }),
      startTime: date.toISOString(),
      isDaytime: true,
      temperature: 75 + Math.floor(Math.random() * 15),
      temperatureUnit: 'F',
      probabilityOfPrecipitation: { value: Math.floor(Math.random() * 60) },
      windSpeed: `${5 + Math.floor(Math.random() * 15)} mph`,
      windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      shortForecast: ['Sunny', 'Partly Cloudy', 'Mostly Cloudy', 'Scattered Showers'][Math.floor(Math.random() * 4)],
      detailedForecast: `Mock forecast for ${date.toDateString()}.`
    })
  }

  if (includeHourly) {
    for (let i = 0; i < 48; i++) {
      const time = new Date()
      time.setHours(time.getHours() + i)

      hourly.push({
        number: i + 1,
        startTime: time.toISOString(),
        temperature: 70 + Math.floor(Math.random() * 20),
        temperatureUnit: 'F',
        probabilityOfPrecipitation: { value: Math.floor(Math.random() * 40) },
        windSpeed: `${Math.floor(Math.random() * 20)} mph`,
        shortForecast: ['Clear', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)]
      })
    }
  }

  return {
    daily: { properties: { periods: daily } },
    hourly: includeHourly ? { properties: { periods: hourly } } : null
  }
}

async function getActiveAlerts(lat: number, lng: number): Promise<any> {
  try {
    // Get alerts for the specific point
    const alertsUrl = `${NOAA_BASE_URL}/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`

    const response = await fetch(alertsUrl, {
      headers: { 'User-Agent': 'ClaimGuardian/1.0 (contact@claimguardianai.com)' }
    })

    if (response.ok) {
      const alerts = await response.json()
      return alerts
    }

    return generateMockAlerts(lat, lng)

  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'NOAA Alerts error, using mock data:', error
}));
    return generateMockAlerts(lat, lng)
  }
}

function generateMockAlerts(lat: number, lng: number): any {
  const isFloridaLocation = lat > 24 && lat < 31 && lng > -88 && lng < -79
  const alerts = []

  if (isFloridaLocation && Math.random() > 0.7) {
    // Mock hurricane season alert for Florida
    alerts.push({
      id: 'mock-hurricane-watch-001',
      properties: {
        headline: 'Hurricane Watch issued for Coastal Florida',
        event: 'Hurricane Watch',
        severity: 'Severe',
        urgency: 'Expected',
        certainty: 'Likely',
        areaDesc: 'Coastal Florida',
        description: 'A Hurricane Watch has been issued for coastal areas. Prepare for potential hurricane conditions within 48 hours.',
        instruction: 'Preparations to protect life and property should be rushed to completion.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        category: 'Met',
        response: 'Prepare'
      }
    })
  }

  return { features: alerts }
}

function analyzeWeatherIntelligence(
  currentConditions: any,
  forecasts: any,
  alerts: any,
  location: { lat: number, lng: number }
): NOAAWeatherIntelligence {
  const current = currentConditions?.properties
  const dailyForecast = forecasts?.daily?.properties?.periods || []
  const hourlyForecast = forecasts?.hourly?.properties?.periods || []
  const activeAlerts = alerts?.features || []

  // Process current conditions
  const currentIntel = current ? {
    temperature: current.temperature?.value || 0,
    humidity: current.relativeHumidity?.value || 0,
    windSpeed: current.windSpeed?.value || 0,
    windDirection: current.windDirection?.value || 0,
    pressure: current.barometricPressure?.value || 0,
    visibility: current.visibility?.value || 0,
    conditions: current.textDescription || 'Unknown',
    dewPoint: current.dewpoint?.value || 0,
    heatIndex: current.heatIndex?.value,
    windChill: current.windChill?.value,
    observationTime: current.timestamp || new Date().toISOString(),
    weatherStation: current.station || 'Unknown'
  } : undefined

  // Process forecasts
  const forecastIntel = {
    daily: dailyForecast.slice(0, 7).map((period: any) => ({
      date: period.startTime,
      high: period.temperature || 0,
      low: (period.temperature || 0) - 10, // Approximate low
      conditions: period.shortForecast || 'Unknown',
      precipitationChance: period.probabilityOfPrecipitation?.value || 0,
      windSpeed: parseInt(period.windSpeed) || 0,
      windDirection: period.windDirection || 'Unknown',
      detailedForecast: period.detailedForecast || ''
    })),
    hourly: hourlyForecast.slice(0, 24).map((period: any) => ({
      time: period.startTime,
      temperature: period.temperature || 0,
      conditions: period.shortForecast || 'Unknown',
      windSpeed: parseInt(period.windSpeed) || 0,
      precipitationChance: period.probabilityOfPrecipitation?.value || 0
    }))
  }

  // Process alerts with insurance relevance analysis
  const alertsIntel = activeAlerts.map((alert: any) => {
    const props = alert.properties
    const claimRelevance = assessClaimRelevance(props.event, props.severity)

    return {
      id: alert.id,
      title: props.headline,
      severity: props.severity?.toLowerCase() as 'minor' | 'moderate' | 'severe' | 'extreme',
      urgency: props.urgency?.toLowerCase() as 'immediate' | 'expected' | 'future',
      certainty: props.certainty?.toLowerCase() as 'observed' | 'likely' | 'possible',
      event: props.event,
      headline: props.headline,
      description: props.description,
      instruction: props.instruction,
      areaDesc: props.areaDesc,
      effective: props.effective,
      expires: props.expires,
      category: props.category,
      responseType: props.response,
      claimRelevance,
      insuranceImpact: generateInsuranceImpactMessage(props.event, claimRelevance)
    }
  })

  // Risk assessment
  const riskAssessment = generateRiskAssessment(currentIntel, forecastIntel, alertsIntel, location)

  return {
    currentConditions: currentIntel,
    forecasts: forecastIntel,
    activeAlerts: alertsIntel,
    riskAssessment
  }
}

function assessClaimRelevance(eventType: string, severity: string): 'high' | 'medium' | 'low' {
  const highRiskEvents = ['hurricane', 'tornado', 'severe thunderstorm', 'flash flood', 'hail']
  const mediumRiskEvents = ['wind', 'flood', 'winter storm', 'ice storm']

  const event = eventType.toLowerCase()
  const sev = severity?.toLowerCase()

  if (highRiskEvents.some(risk => event.includes(risk))) {
    return sev === 'extreme' || sev === 'severe' ? 'high' : 'medium'
  }

  if (mediumRiskEvents.some(risk => event.includes(risk))) {
    return 'medium'
  }

  return 'low'
}

function generateInsuranceImpactMessage(eventType: string, relevance: 'high' | 'medium' | 'low'): string {
  const event = eventType.toLowerCase()

  if (relevance === 'high') {
    if (event.includes('hurricane')) {
      return 'High probability of property damage. Document property condition now. Wind and flood coverage may apply.'
    }
    if (event.includes('tornado') || event.includes('severe thunderstorm')) {
      return 'Potential for significant wind damage. Secure loose items and document property condition.'
    }
    if (event.includes('hail')) {
      return 'Hail damage to roof, vehicles, and exterior property likely. Comprehensive coverage applies.'
    }
  }

  if (relevance === 'medium') {
    return 'Moderate risk of property damage. Monitor conditions and be prepared to document any damage.'
  }

  return 'Low risk of insurance-relevant damage. Continue normal monitoring.'
}

function generateRiskAssessment(
  current: any,
  forecasts: any,
  alerts: any,
  location: { lat: number, lng: number }
): any {
  const immediateThreats = []
  const nextWeekRisks = []
  const recommendedActions = []
  const insuranceConsiderations = []

  // Analyze current conditions
  if (current?.windSpeed > 39) {
    immediateThreats.push('High winds (tropical storm force)')
    recommendedActions.push('Secure outdoor furniture and potential projectiles')
    insuranceConsiderations.push('Document property condition before storm impact')
  }

  // Analyze alerts
  alerts.forEach((alert: any) => {
    if (alert.claimRelevance === 'high') {
      immediateThreats.push(`${alert.event} - ${alert.severity} threat`)
      insuranceConsiderations.push(alert.insuranceImpact)
    }
  })

  // Analyze forecast
  const highWindDays = forecasts.daily.filter((day: any) => day.windSpeed > 35).length
  const highPrecipDays = forecasts.daily.filter((day: any) => day.precipitationChance > 70).length

  if (highWindDays > 0) {
    nextWeekRisks.push(`${highWindDays} day(s) with high wind potential`)
  }

  if (highPrecipDays > 2) {
    nextWeekRisks.push('Extended period of heavy precipitation possible')
    insuranceConsiderations.push('Monitor for flood damage, especially in low-lying areas')
  }

  // Determine preparedness level
  let preparednessLevel: 'minimal' | 'standard' | 'heightened' | 'maximum' = 'minimal'

  if (immediateThreats.length > 0) {
    preparednessLevel = alerts.some((a: any) => a.severity === 'extreme') ? 'maximum' : 'heightened'
  } else if (nextWeekRisks.length > 1) {
    preparednessLevel = 'standard'
  }

  // Seasonal outlook for Florida
  const isFloridaLocation = location.lat > 24 && location.lat < 31 && location.lng > -88 && location.lng < -79
  const currentMonth = new Date().getMonth()

  let seasonalOutlook = 'Normal seasonal weather patterns expected'
  if (isFloridaLocation && currentMonth >= 5 && currentMonth <= 10) {
    seasonalOutlook = 'Hurricane season active - monitor tropical development closely'
  }

  return {
    immediateThreats,
    nextWeekRisks,
    seasonalOutlook,
    preparednessLevel,
    recommendedActions,
    insuranceConsiderations
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

    const requestData: NOAAWeatherRequest = await req.json()
    const { location, analysisType, options = {} } = requestData

    if (!location?.lat || !location?.lng) {
      throw new Error('Location coordinates are required')
    }

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `[NOAA Weather Intelligence] Processing ${analysisType} for location: ${location.lat}, ${location.lng}`
    }));

    let intelligence: NOAAWeatherIntelligence = {}

    // Get gridpoint information first
    const gridpoint = await getNOAAGridpoint(location.lat, location.lng)

    switch (analysisType) {
      case 'current-conditions':
        const current = await getCurrentConditions(location.lat, location.lng)
        intelligence.currentConditions = analyzeWeatherIntelligence(current, null, null, location).currentConditions
        break

      case 'forecasts':
        const forecasts = await getForecast(gridpoint, options.includeHourly)
        intelligence.forecasts = analyzeWeatherIntelligence(null, forecasts, null, location).forecasts
        break

      case 'active-alerts':
        const alerts = await getActiveAlerts(location.lat, location.lng)
        intelligence.activeAlerts = analyzeWeatherIntelligence(null, null, alerts, location).activeAlerts
        break

      case 'storm-tracking':
        // Combine alerts and current conditions for storm tracking
        const [stormAlerts, stormCurrent] = await Promise.all([
          getActiveAlerts(location.lat, location.lng),
          getCurrentConditions(location.lat, location.lng)
        ])

        const stormIntel = analyzeWeatherIntelligence(stormCurrent, null, stormAlerts, location)
        intelligence.activeAlerts = stormIntel.activeAlerts
        intelligence.currentConditions = stormIntel.currentConditions
        intelligence.stormTracking = {
          activeStorms: stormIntel.activeAlerts?.filter(alert =>
            alert.event.toLowerCase().includes('hurricane') ||
            alert.event.toLowerCase().includes('tropical')
          ).map(alert => ({
            name: alert.event,
            type: alert.event.toLowerCase().includes('hurricane') ? 'hurricane' as const : 'tropical_storm' as const,
            windSpeed: stormIntel.currentConditions?.windSpeed || 0,
            location: location,
            movement: { direction: stormIntel.currentConditions?.windDirection || 0, speed: 0 },
            distanceFromProperty: 0,
            threatLevel: alert.claimRelevance as 'low' | 'moderate' | 'high' | 'extreme',
            evacuationRecommended: alert.severity === 'extreme'
          })) || []
        }
        break

      case 'complete-weather-intel':
        // Get all data for comprehensive analysis
        const [completeAlerts, completeCurrent, completeForecasts] = await Promise.all([
          getActiveAlerts(location.lat, location.lng),
          getCurrentConditions(location.lat, location.lng),
          getForecast(gridpoint, options.includeHourly)
        ])

        intelligence = analyzeWeatherIntelligence(completeCurrent, completeForecasts, completeAlerts, location)
        break

      default:
        throw new Error(`Unknown analysis type: ${analysisType}`)
    }

    const response = {
      success: true,
      data: intelligence,
      location,
      analysisType,
      options,
      gridpoint: gridpoint.properties, // Include for reference
      timestamp: new Date().toISOString(),
      apiUsed: 'noaa-weather-intelligence',
      dataSource: 'National Weather Service'
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: '[NOAA Weather Intelligence] Error:', error
}));

    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Unknown error',
      timestamp: new Date().toISOString(),
      apiUsed: 'noaa-weather-intelligence'
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
