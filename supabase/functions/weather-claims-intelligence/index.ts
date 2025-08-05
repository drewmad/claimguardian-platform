import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface WeatherRequest {
  location: {
    lat: number
    lng: number
    address: string
  }
  claimDate?: string
  dateRange?: {
    start: string
    end: string
  }
  analysisType: 'current' | 'historical' | 'claim-correlation' | 'risk-assessment'
}

interface WeatherIntelligence {
  current?: any
  historical?: any[]
  claimCorrelation?: {
    probability: number
    weatherEvents: any[]
    riskFactors: string[]
    recommendation: string
  }
  riskAssessment?: {
    floodRisk: number
    windRisk: number
    hailRisk: number
    hurricaneRisk: number
    seasonalFactors: string[]
  }
}

const WEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY') || Deno.env.get('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')

async function getCurrentWeather(lat: number, lng: number): Promise<any> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=imperial`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`)
  }
  
  return await response.json()
}

async function getHistoricalWeather(lat: number, lng: number, startDate: string, endDate: string): Promise<any[]> {
  const results = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const oneDay = 24 * 60 * 60 * 1000
  
  // OpenWeatherMap historical data (requires subscription, using mock for now)
  for (let date = new Date(start); date <= end; date.setTime(date.getTime() + oneDay)) {
    const timestamp = Math.floor(date.getTime() / 1000)
    
    try {
      // For now, we'll simulate historical data
      // In production, you'd use: https://api.openweathermap.org/data/2.5/onecall/timemachine
      const mockHistoricalData = {
        dt: timestamp,
        temp: 75 + Math.random() * 20,
        humidity: 60 + Math.random() * 30,
        pressure: 1010 + Math.random() * 20,
        wind_speed: Math.random() * 25,
        weather: [{
          main: Math.random() > 0.7 ? 'Rain' : 'Clear',
          description: Math.random() > 0.7 ? 'heavy rain' : 'clear sky'
        }],
        precipitation: Math.random() > 0.7 ? Math.random() * 2 : 0
      }
      
      results.push(mockHistoricalData)
    } catch (error) {
      console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: `Failed to fetch historical data for ${date.toISOString()}:`,
  error: error instanceof Error ? error.message : String(error)
}));
    }
  }
  
  return results
}

function analyzeClaimCorrelation(weatherData: any[], claimDate: string): any {
  const claimDateTime = new Date(claimDate)
  const claimTimestamp = claimDateTime.getTime() / 1000
  
  // Find weather data closest to claim date
  const relevantWeather = weatherData.filter(data => {
    const timeDiff = Math.abs(data.dt - claimTimestamp)
    return timeDiff <= 7 * 24 * 60 * 60 // Within 7 days
  })
  
  if (relevantWeather.length === 0) {
    return {
      probability: 0,
      weatherEvents: [],
      riskFactors: ['No weather data available for claim period'],
      recommendation: 'Unable to correlate claim with weather events due to lack of data'
    }
  }
  
  const weatherEvents = []
  const riskFactors = []
  let probability = 0
  
  relevantWeather.forEach(weather => {
    // Check for severe weather conditions
    if (weather.weather?.[0]?.main === 'Rain' && weather.precipitation > 1) {
      weatherEvents.push({
        type: 'Heavy Rain',
        intensity: weather.precipitation,
        date: new Date(weather.dt * 1000).toISOString()
      })
      probability += 30
      riskFactors.push('Heavy rainfall detected')
    }
    
    if (weather.wind_speed > 39) { // 39+ mph = tropical storm force
      weatherEvents.push({
        type: 'High Winds',
        speed: weather.wind_speed,
        date: new Date(weather.dt * 1000).toISOString()
      })
      probability += 40
      riskFactors.push('High wind speeds recorded')
    }
    
    if (weather.pressure < 1000) {
      weatherEvents.push({
        type: 'Low Pressure System',
        pressure: weather.pressure,
        date: new Date(weather.dt * 1000).toISOString()
      })
      probability += 20
      riskFactors.push('Low atmospheric pressure (storm system)')
    }
  })
  
  probability = Math.min(probability, 95) // Cap at 95%
  
  let recommendation = ''
  if (probability > 70) {
    recommendation = 'High correlation with severe weather events. Claim likely valid and weather-related.'
  } else if (probability > 40) {
    recommendation = 'Moderate weather correlation. Additional investigation recommended.'
  } else {
    recommendation = 'Low weather correlation. Claim may not be weather-related.'
  }
  
  return {
    probability,
    weatherEvents,
    riskFactors,
    recommendation
  }
}

function assessRisk(currentWeather: any, historicalData: any[], location: { lat: number, lng: number }): any {
  const floodRisk = calculateFloodRisk(historicalData, location)
  const windRisk = calculateWindRisk(historicalData, location)
  const hailRisk = calculateHailRisk(historicalData, location)
  const hurricaneRisk = calculateHurricaneRisk(location)
  
  const seasonalFactors = []
  const month = new Date().getMonth()
  
  // Florida seasonal risk factors
  if (month >= 5 && month <= 10) { // June - November
    seasonalFactors.push('Hurricane Season Active')
  }
  if (month >= 6 && month <= 8) { // July - September
    seasonalFactors.push('Peak Storm Activity')
  }
  if (month >= 11 || month <= 2) { // Dec - March
    seasonalFactors.push('Dry Season - Lower Precipitation Risk')
  }
  
  return {
    floodRisk,
    windRisk,
    hailRisk,
    hurricaneRisk,
    seasonalFactors
  }
}

function calculateFloodRisk(historicalData: any[], location: { lat: number, lng: number }): number {
  // Basic flood risk calculation based on historical precipitation
  const avgPrecipitation = historicalData.reduce((sum, data) => sum + (data.precipitation || 0), 0) / historicalData.length
  const elevation = location.lat < 26 ? 5 : 10 // Rough Florida elevation estimate
  
  let risk = avgPrecipitation * 10
  if (elevation < 10) risk += 20 // Low elevation increases flood risk
  if (location.lat < 26 && location.lng > -81) risk += 15 // South Florida coastal
  
  return Math.min(Math.max(risk, 0), 100)
}

function calculateWindRisk(historicalData: any[], location: { lat: number, lng: number }): number {
  const avgWindSpeed = historicalData.reduce((sum, data) => sum + (data.wind_speed || 0), 0) / historicalData.length
  const maxWindSpeed = Math.max(...historicalData.map(data => data.wind_speed || 0))
  
  let risk = (avgWindSpeed * 2) + (maxWindSpeed * 0.5)
  if (location.lat > 24 && location.lat < 31) risk += 20 // Florida hurricane zone
  
  return Math.min(Math.max(risk, 0), 100)
}

function calculateHailRisk(historicalData: any[], location: { lat: number, lng: number }): number {
  // Florida has relatively low hail risk compared to other states
  let risk = 15 // Base Florida hail risk
  
  // Central Florida has slightly higher hail risk
  if (location.lat > 27 && location.lat < 29) risk += 10
  
  return Math.min(Math.max(risk, 0), 100)
}

function calculateHurricaneRisk(location: { lat: number, lng: number }): number {
  // Florida hurricane risk based on location
  let risk = 40 // Base Florida hurricane risk
  
  // Coastal areas have higher risk
  if (location.lng > -82 || location.lng < -80) risk += 30 // East/West coast
  if (location.lat < 26) risk += 20 // South Florida
  if (location.lat > 30) risk -= 10 // North Florida slightly lower risk
  
  return Math.min(Math.max(risk, 0), 100)
}

Deno.serve(async (req: Request) => {
  // CORS headers
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

    const requestData: WeatherRequest = await req.json()
    const { location, claimDate, dateRange, analysisType } = requestData

    if (!location?.lat || !location?.lng) {
      throw new Error('Location coordinates are required')
    }

    const intelligence: WeatherIntelligence = {}

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `[Weather Intelligence] Processing ${analysisType} for location: ${location.lat}, ${location.lng}`
    }));

    switch (analysisType) {
      case 'current':
        intelligence.current = await getCurrentWeather(location.lat, location.lng)
        break

      case 'historical':
        if (!dateRange) {
          throw new Error('Date range is required for historical analysis')
        }
        intelligence.historical = await getHistoricalWeather(
          location.lat, 
          location.lng, 
          dateRange.start, 
          dateRange.end
        )
        break

      case 'claim-correlation':
        if (!claimDate) {
          throw new Error('Claim date is required for claim correlation analysis')
        }
        
        // Get historical data around claim date (±7 days)
        const claimDateTime = new Date(claimDate)
        const startDate = new Date(claimDateTime.getTime() - 7 * 24 * 60 * 60 * 1000)
        const endDate = new Date(claimDateTime.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        const historicalData = await getHistoricalWeather(
          location.lat,
          location.lng,
          startDate.toISOString(),
          endDate.toISOString()
        )
        
        intelligence.historical = historicalData
        intelligence.claimCorrelation = analyzeClaimCorrelation(historicalData, claimDate)
        break

      case 'risk-assessment':
        // Get current weather and recent historical data
        intelligence.current = await getCurrentWeather(location.lat, location.lng)
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const recentHistorical = await getHistoricalWeather(
          location.lat,
          location.lng,
          thirtyDaysAgo.toISOString(),
          new Date().toISOString()
        )
        
        intelligence.historical = recentHistorical
        intelligence.riskAssessment = assessRisk(intelligence.current, recentHistorical, location)
        break

      default:
        throw new Error(`Unknown analysis type: ${analysisType}`)
    }

    const response = {
      success: true,
      data: intelligence,
      location,
      analysisType,
      timestamp: new Date().toISOString(),
      apiUsed: 'weather-claims-intelligence'
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: '[Weather Intelligence] Error:', error
}));
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Unknown error',
      timestamp: new Date().toISOString(),
      apiUsed: 'weather-claims-intelligence'
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})