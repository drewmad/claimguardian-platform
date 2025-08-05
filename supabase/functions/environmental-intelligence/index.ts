import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface EnvironmentalRequest {
  location: {
    lat: number
    lng: number
    address: string
  }
  apis: Array<'pollen' | 'air-quality' | 'timezone' | 'elevation' | 'distance-matrix'>
  destinations?: Array<{ lat: number, lng: number, name: string }> // For distance matrix
  options?: {
    pollenDays?: number
    distanceUnits?: 'imperial' | 'metric'
    distanceMode?: 'driving' | 'walking' | 'bicycling' | 'transit'
  }
}

interface EnvironmentalIntelligence {
  pollen?: {
    forecast: any[]
    currentConditions: any
    riskLevel: 'low' | 'moderate' | 'high' | 'very-high'
    recommendations: string[]
  }
  airQuality?: {
    aqi: number
    category: string
    pollutants: Record<string, any>
    healthRecommendations: string[]
  }
  timezone?: {
    timeZoneId: string
    timeZoneName: string
    rawOffset: number
    dstOffset: number
    currentTime: string
  }
  elevation?: {
    elevation: number
    floodRisk: 'low' | 'moderate' | 'high'
    drainageAssessment: string
  }
  distanceMatrix?: {
    destinations: Array<{
      name: string
      distance: string
      duration: string
      trafficDuration?: string
    }>
    nearestServices: any[]
  }
}

const GOOGLE_MAPS_API_KEY = Deno.env.get('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY')

async function getPollenData(lat: number, lng: number, days: number = 5): Promise<any> {
  try {
    // Google Pollen API
    const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_MAPS_API_KEY}`
    
    const requestBody = {
      location: {
        longitude: lng,
        latitude: lat
      },
      days: days,
      languageCode: "en"
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (response.ok) {
      const data = await response.json()
      return data
    } else {
      // Fallback to mock data
      return generateMockPollenData(lat, lng, days)
    }
  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'Pollen API error, using mock data:', error
}));
    return generateMockPollenData(lat, lng, days)
  }
}

function generateMockPollenData(lat: number, lng: number, days: number): any {
  const forecast = []
  const baseDate = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + i)
    
    // Florida has high pollen in spring/fall
    const month = date.getMonth()
    const isHighPollenSeason = (month >= 2 && month <= 5) || (month >= 8 && month <= 10)
    
    const grassIndex = isHighPollenSeason ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1
    const treeIndex = isHighPollenSeason ? Math.floor(Math.random() * 4) + 3 : Math.floor(Math.random() * 2) + 1
    const weedIndex = isHighPollenSeason ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1
    
    forecast.push({
      date: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      },
      pollenTypeInfo: [
        {
          code: "GRASS",
          displayName: "Grass",
          indexInfo: {
            code: grassIndex <= 1 ? "UPI_LOW" : grassIndex <= 2 ? "UPI_MODERATE" : grassIndex <= 3 ? "UPI_HIGH" : "UPI_VERY_HIGH",
            displayName: grassIndex <= 1 ? "Low" : grassIndex <= 2 ? "Moderate" : grassIndex <= 3 ? "High" : "Very High",
            value: grassIndex
          }
        },
        {
          code: "TREE",
          displayName: "Tree",
          indexInfo: {
            code: treeIndex <= 1 ? "UPI_LOW" : treeIndex <= 2 ? "UPI_MODERATE" : treeIndex <= 3 ? "UPI_HIGH" : "UPI_VERY_HIGH",
            displayName: treeIndex <= 1 ? "Low" : treeIndex <= 2 ? "Moderate" : treeIndex <= 3 ? "High" : "Very High",
            value: treeIndex
          }
        },
        {
          code: "WEED",
          displayName: "Weed",
          indexInfo: {
            code: weedIndex <= 1 ? "UPI_LOW" : weedIndex <= 2 ? "UPI_MODERATE" : weedIndex <= 3 ? "UPI_HIGH" : "UPI_VERY_HIGH",
            displayName: weedIndex <= 1 ? "Low" : weedIndex <= 2 ? "Moderate" : weedIndex <= 3 ? "High" : "Very High",
            value: weedIndex
          }
        }
      ]
    })
  }
  
  return { dailyInfo: forecast }
}

async function getAirQuality(lat: number, lng: number): Promise<any> {
  try {
    // Google Air Quality API
    const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}`
    
    const requestBody = {
      location: {
        longitude: lng,
        latitude: lat
      },
      extraComputations: [
        "HEALTH_RECOMMENDATIONS",
        "DOMINANT_POLLUTANT_CONCENTRATION",
        "POLLUTANT_CONCENTRATION",
        "LOCAL_AQI",
        "POLLUTANT_ADDITIONAL_INFO"
      ]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (response.ok) {
      const data = await response.json()
      return data
    } else {
      return generateMockAirQualityData(lat, lng)
    }
  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'Air Quality API error, using mock data:', error
}));
    return generateMockAirQualityData(lat, lng)
  }
}

function generateMockAirQualityData(lat: number, lng: number): any {
  // Florida generally has good air quality
  const aqi = Math.floor(Math.random() * 60) + 20 // 20-80 range
  
  let category = "Good"
  if (aqi > 50) category = "Moderate"
  if (aqi > 100) category = "Unhealthy for Sensitive Groups"
  
  return {
    dateTime: new Date().toISOString(),
    regionCode: "us",
    indexes: [{
      code: "uaqi",
      displayName: "Universal AQI",
      aqi: aqi,
      aqiDisplay: aqi.toString(),
      color: aqi <= 50 ? { green: 1 } : aqi <= 100 ? { red: 1, green: 1 } : { red: 1 },
      category: category,
      dominantPollutant: aqi > 50 ? "pm25" : "o3"
    }],
    pollutants: [
      {
        code: "pm25",
        displayName: "PM2.5",
        concentration: { value: Math.random() * 15 + 5, units: "MICROGRAMS_PER_CUBIC_METER" }
      },
      {
        code: "o3",
        displayName: "Ozone",
        concentration: { value: Math.random() * 0.1 + 0.02, units: "PARTS_PER_MILLION" }
      }
    ],
    healthRecommendations: {
      generalPopulation: aqi <= 50 ? "Air quality is satisfactory" : "Consider reducing outdoor activities",
      sensitiveGroups: aqi <= 50 ? "Enjoy outdoor activities" : "Limit prolonged outdoor exertion"
    }
  }
}

async function getTimezone(lat: number, lng: number): Promise<any> {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${GOOGLE_MAPS_API_KEY}`
    
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      return data
    } else {
      throw new Error(`Timezone API error: ${response.statusText}`)
    }
  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'Timezone API error, using fallback:', error
}));
    // Florida fallback
    return {
      dstOffset: 3600, // DST offset in seconds
      rawOffset: -18000, // EST offset in seconds (-5 hours)
      status: "OK",
      timeZoneId: "America/New_York",
      timeZoneName: "Eastern Standard Time"
    }
  }
}

async function getElevation(lat: number, lng: number): Promise<any> {
  try {
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      return data
    } else {
      throw new Error(`Elevation API error: ${response.statusText}`)
    }
  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'Elevation API error, using estimated elevation:', error
}));
    // Florida elevation estimation
    const estimatedElevation = lat < 26 ? Math.random() * 10 + 2 : Math.random() * 50 + 10
    return {
      results: [{
        elevation: estimatedElevation,
        location: { lat, lng },
        resolution: 152.7032318115234
      }],
      status: "OK"
    }
  }
}

async function getDistanceMatrix(origin: { lat: number, lng: number }, destinations: Array<{ lat: number, lng: number, name: string }>, options: any = {}): Promise<any> {
  try {
    const destinationString = destinations.map(dest => `${dest.lat},${dest.lng}`).join('|')
    const units = options.distanceUnits === 'metric' ? 'metric' : 'imperial'
    const mode = options.distanceMode || 'driving'
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destinationString}&units=${units}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`
    
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      return data
    } else {
      throw new Error(`Distance Matrix API error: ${response.statusText}`)
    }
  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'Distance Matrix API error, using estimated distances:', error
}));
    // Mock distance data
    const elements = destinations.map(dest => ({
      distance: { text: `${Math.floor(Math.random() * 20 + 1)} mi`, value: Math.floor(Math.random() * 32000 + 1600) },
      duration: { text: `${Math.floor(Math.random() * 30 + 5)} mins`, value: Math.floor(Math.random() * 1800 + 300) },
      status: "OK"
    }))
    
    return {
      status: "OK",
      rows: [{ elements }]
    }
  }
}

function analyzePollenIntelligence(pollenData: any): any {
  if (!pollenData?.dailyInfo) {
    return {
      riskLevel: 'low',
      recommendations: ['Unable to analyze pollen data']
    }
  }

  const today = pollenData.dailyInfo[0]
  if (!today) {
    return {
      riskLevel: 'low',
      recommendations: ['No current pollen data available']
    }
  }

  const pollenTypes = today.pollenTypeInfo || []
  const maxIndex = Math.max(...pollenTypes.map((p: any) => p.indexInfo?.value || 0))
  
  let riskLevel: 'low' | 'moderate' | 'high' | 'very-high' = 'low'
  if (maxIndex >= 4) riskLevel = 'very-high'
  else if (maxIndex >= 3) riskLevel = 'high'
  else if (maxIndex >= 2) riskLevel = 'moderate'

  const recommendations = []
  if (riskLevel === 'very-high') {
    recommendations.push('Avoid outdoor activities if sensitive to pollen')
    recommendations.push('Keep windows closed, use air conditioning')
    recommendations.push('Consider taking allergy medication')
    recommendations.push('Shower after being outdoors')
  } else if (riskLevel === 'high') {
    recommendations.push('Limit outdoor activities during peak hours (5-10 AM)')
    recommendations.push('Consider wearing sunglasses outdoors')
  } else if (riskLevel === 'moderate') {
    recommendations.push('Monitor symptoms if you have allergies')
  } else {
    recommendations.push('Good day for outdoor activities')
  }

  return {
    forecast: pollenData.dailyInfo,
    currentConditions: today,
    riskLevel,
    recommendations
  }
}

function analyzeAirQualityIntelligence(airQualityData: any): any {
  const aqi = airQualityData?.indexes?.[0]?.aqi || 50
  const category = airQualityData?.indexes?.[0]?.category || 'Good'
  const pollutants = airQualityData?.pollutants || []
  
  const healthRecommendations = []
  if (aqi <= 50) {
    healthRecommendations.push('Air quality is satisfactory for outdoor activities')
  } else if (aqi <= 100) {
    healthRecommendations.push('Acceptable air quality, sensitive individuals should consider limiting prolonged outdoor exertion')
  } else {
    healthRecommendations.push('Unhealthy air quality, limit outdoor activities')
  }

  return {
    aqi,
    category,
    pollutants: pollutants.reduce((acc: any, p: any) => {
      acc[p.code] = p.concentration
      return acc
    }, {}),
    healthRecommendations
  }
}

function analyzeElevationIntelligence(elevationData: any): any {
  const elevation = elevationData?.results?.[0]?.elevation || 0
  
  let floodRisk: 'low' | 'moderate' | 'high' = 'low'
  if (elevation < 5) floodRisk = 'high'
  else if (elevation < 15) floodRisk = 'moderate'

  let drainageAssessment = ''
  if (elevation < 5) {
    drainageAssessment = 'High flood risk - consider elevation certificates and flood insurance'
  } else if (elevation < 15) {
    drainageAssessment = 'Moderate elevation - monitor drainage during heavy rains'
  } else {
    drainageAssessment = 'Good elevation for drainage'
  }

  return {
    elevation: Math.round(elevation * 10) / 10, // Round to 1 decimal
    floodRisk,
    drainageAssessment
  }
}

function analyzeDistanceIntelligence(distanceData: any, destinations: Array<{ lat: number, lng: number, name: string }>): any {
  const elements = distanceData?.rows?.[0]?.elements || []
  
  const destinationAnalysis = destinations.map((dest, index) => {
    const element = elements[index] || {}
    return {
      name: dest.name,
      distance: element.distance?.text || 'Unknown',
      duration: element.duration?.text || 'Unknown',
      trafficDuration: element.duration_in_traffic?.text
    }
  })

  // Find nearest services
  const nearestServices = destinationAnalysis
    .filter(d => d.distance !== 'Unknown')
    .sort((a, b) => {
      const aValue = parseInt(a.distance.replace(/[^\d]/g, '')) || 999
      const bValue = parseInt(b.distance.replace(/[^\d]/g, '')) || 999
      return aValue - bValue
    })
    .slice(0, 3)

  return {
    destinations: destinationAnalysis,
    nearestServices
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

    const requestData: EnvironmentalRequest = await req.json()
    const { location, apis, destinations, options = {} } = requestData

    if (!location?.lat || !location?.lng) {
      throw new Error('Location coordinates are required')
    }

    if (!apis || apis.length === 0) {
      throw new Error('At least one API must be specified')
    }

    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured')
    }

    console.log(JSON.stringify({
  level: "info",
  timestamp: new Date().toISOString(),
  message: `[Environmental Intelligence] Processing APIs [${apis.join(', ')}] for location: ${location.lat}, ${location.lng}`
}));

    const intelligence: EnvironmentalIntelligence = {}

    // Process each requested API
    const promises = apis.map(async (api) => {
      switch (api) {
        case 'pollen':
          const pollenData = await getPollenData(location.lat, location.lng, options.pollenDays)
          return { api, data: analyzePollenIntelligence(pollenData) }

        case 'air-quality':
          const airQualityData = await getAirQuality(location.lat, location.lng)
          return { api, data: analyzeAirQualityIntelligence(airQualityData) }

        case 'timezone':
          const timezoneData = await getTimezone(location.lat, location.lng)
          const currentTime = new Date().toLocaleString('en-US', { 
            timeZone: timezoneData.timeZoneId || 'America/New_York' 
          })
          return { 
            api, 
            data: {
              timeZoneId: timezoneData.timeZoneId,
              timeZoneName: timezoneData.timeZoneName,
              rawOffset: timezoneData.rawOffset,
              dstOffset: timezoneData.dstOffset,
              currentTime
            }
          }

        case 'elevation':
          const elevationData = await getElevation(location.lat, location.lng)
          return { api, data: analyzeElevationIntelligence(elevationData) }

        case 'distance-matrix':
          if (!destinations || destinations.length === 0) {
            throw new Error('Destinations are required for distance matrix API')
          }
          const distanceData = await getDistanceMatrix(location, destinations, options)
          return { api, data: analyzeDistanceIntelligence(distanceData, destinations) }

        default:
          throw new Error(`Unknown API: ${api}`)
      }
    })

    const results = await Promise.allSettled(promises)
    
    // Compile results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { api, data } = result.value
        intelligence[api as keyof EnvironmentalIntelligence] = data
      }
    })

    const response = {
      success: true,
      data: intelligence,
      location,
      apisProcessed: apis,
      timestamp: new Date().toISOString(),
      apiUsed: 'environmental-intelligence'
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: '[Environmental Intelligence] Error:', error
}));
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Unknown error',
      timestamp: new Date().toISOString(),
      apiUsed: 'environmental-intelligence'
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})