import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface ZillowRequest {
  location: {
    address: string
    lat?: number
    lng?: number
  }
  analysisType: 'property-value' | 'market-analysis' | 'price-history' | 'comparable-sales' | 'rental-estimates' | 'complete-property-intel'
  options?: {
    radius?: number // miles for comps
    includeOffMarket?: boolean
    maxComps?: number // 1-25
    includePriceHistory?: boolean
    includeRentalEstimates?: boolean
  }
}

interface ZillowPropertyIntelligence {
  propertyValue?: {
    zestimate: number
    valueRange: {
      low: number
      high: number
    }
    confidence: 'low' | 'medium' | 'high'
    lastUpdated: string
    pricePerSqFt: number
    valuationDate: string
    marketTrend: 'up' | 'down' | 'stable'
    monthlyChange: number
    yearlyChange: number
  }
  propertyDetails?: {
    bedrooms: number
    bathrooms: number
    sqft: number
    lotSize?: number
    yearBuilt: number
    homeType: string
    hoa?: number
    parking?: string
    cooling?: string
    heating?: string
    appliances?: string[]
    features?: string[]
    schoolDistrict?: string
  }
  marketAnalysis?: {
    medianHomeValue: number
    medianListPrice: number
    medianRentPrice: number
    priceAppreciation: {
      oneYear: number
      fiveYear: number
      tenYear: number
    }
    daysOnMarket: number
    inventoryLevel: 'low' | 'medium' | 'high'
    marketHeat: 'cold' | 'cool' | 'warm' | 'hot'
    competitiveness: number // 1-100
    neighborhoodRating: number // 1-10
  }
  priceHistory?: Array<{
    date: string
    price: number
    event: 'listed' | 'sold' | 'delisted' | 'price_change'
    source: string
    daysOnMarket?: number
  }>
  comparableSales?: Array<{
    address: string
    distance: number
    soldPrice: number
    soldDate: string
    bedrooms: number
    bathrooms: number
    sqft: number
    pricePerSqFt: number
    daysOnMarket: number
    similarity: number // 0-100
  }>
  rentalEstimates?: {
    rentZestimate: number
    rentRange: {
      low: number
      high: number
    }
    yieldEstimate: number // rental yield %
    cashFlowPotential: number
    comparableRents: Array<{
      address: string
      rent: number
      bedrooms: number
      bathrooms: number
      sqft: number
    }>
  }
  insuranceIntelligence?: {
    replacementCost: number
    insurableValue: number
    riskFactors: string[]
    recommendedCoverage: {
      dwelling: number
      personalProperty: number
      liability: number
    }
    claimHistory?: Array<{
      date: string
      type: string
      amount: number
    }>
  }
}

// Note: Zillow's API is not publicly available, but we can use web scraping
// or alternative APIs like RentSpider, Mashvisor, or PropertyRadar
// For development, we'll create intelligent mock data based on location

async function getZillowData(address: string, lat?: number, lng?: number): Promise<any> {
  try {
    // In production, you would use:
    // 1. RentSpider API (rentspider.com) - $0.10 per call
    // 2. Mashvisor API - $0.05 per call  
    // 3. PropertyRadar API - $0.02 per call
    // 4. Rentals.com API
    // 5. Web scraping (complex, rate-limited)
    
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", message: `[Zillow Mock] Generating property data for: ${address}` }))
    return generateMockZillowData(address, lat, lng)
    
  } catch (error) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "warn", message: 'Zillow API error, using mock data:', error }))
    return generateMockZillowData(address, lat, lng)
  }
}

function generateMockZillowData(address: string, lat?: number, lng?: number): any {
  // Analyze address for location-based estimates
  const addressLower = address.toLowerCase()
  const isFloridaProperty = addressLower.includes('fl') || addressLower.includes('florida')
  const isMiami = addressLower.includes('miami') || addressLower.includes('dade')
  const isTampa = addressLower.includes('tampa') || addressLower.includes('hillsborough')
  const isOrlando = addressLower.includes('orlando') || addressLower.includes('orange')
  const isJacksonville = addressLower.includes('jacksonville') || addressLower.includes('duval')
  
  // Base property characteristics
  let baseValue = 300000
  let pricePerSqFt = 150
  let appreciation = 5.2 // Florida average
  
  // Florida location adjustments
  if (isFloridaProperty) {
    if (isMiami) {
      baseValue = 450000
      pricePerSqFt = 280
      appreciation = 8.1
    } else if (isTampa) {
      baseValue = 380000
      pricePerSqFt = 210
      appreciation = 7.3
    } else if (isOrlando) {
      baseValue = 340000
      pricePerSqFt = 190
      appreciation = 6.8
    } else if (isJacksonville) {
      baseValue = 290000
      pricePerSqFt = 140
      appreciation = 5.9
    }
  }
  
  // Add randomization for realism
  const variance = 0.15 // ±15%
  const randomFactor = 1 + (Math.random() - 0.5) * variance
  baseValue = Math.floor(baseValue * randomFactor)
  pricePerSqFt = Math.floor(pricePerSqFt * randomFactor)
  
  // Generate property details
  const bedrooms = Math.floor(Math.random() * 4) + 2 // 2-5 bedrooms
  const bathrooms = Math.floor(Math.random() * 3) + 1.5 // 1.5-4.5 bathrooms
  const sqft = Math.floor(baseValue / pricePerSqFt)
  const yearBuilt = 1980 + Math.floor(Math.random() * 40) // 1980-2020
  
  // Generate comparable sales
  const comparableSales = []
  for (let i = 0; i < 5; i++) {
    const compVariance = 1 + (Math.random() - 0.5) * 0.2 // ±20% variance
    const compSqft = Math.floor(sqft * compVariance)
    const compPrice = Math.floor(compSqft * pricePerSqFt * compVariance)
    
    comparableSales.push({
      address: `${Math.floor(Math.random() * 9000) + 1000} Mock St`,
      distance: Math.round((Math.random() * 0.8 + 0.1) * 100) / 100, // 0.1-0.9 miles
      soldPrice: compPrice,
      soldDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bedrooms: bedrooms + Math.floor(Math.random() * 3) - 1,
      bathrooms: bathrooms + Math.floor(Math.random() * 2) - 0.5,
      sqft: compSqft,
      pricePerSqFt: Math.floor(compPrice / compSqft),
      daysOnMarket: Math.floor(Math.random() * 90) + 15,
      similarity: Math.floor(Math.random() * 30) + 70 // 70-100% similarity
    })
  }
  
  // Generate price history
  const priceHistory = []
  let currentPrice = baseValue
  
  for (let i = 12; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    
    if (i === 0) {
      // Current listing/sale
      priceHistory.push({
        date: date.toISOString().split('T')[0],
        price: currentPrice,
        event: 'current',
        source: 'zestimate'
      })
    } else {
      // Historical monthly appreciation
      const monthlyAppreciation = (appreciation / 100) / 12
      currentPrice = Math.floor(currentPrice / (1 + monthlyAppreciation))
      
      if (i === 6 && Math.random() > 0.7) {
        // Occasional sale 6 months ago
        priceHistory.push({
          date: date.toISOString().split('T')[0],
          price: currentPrice,
          event: 'sold',
          source: 'public_record',
          daysOnMarket: Math.floor(Math.random() * 60) + 20
        })
      }
    }
  }
  
  return {
    address,
    zestimate: baseValue,
    bedrooms,
    bathrooms,
    sqft,
    yearBuilt,
    pricePerSqFt,
    appreciation,
    comparableSales,
    priceHistory,
    location: { lat, lng }
  }
}

function analyzePropertyValue(zillowData: any): any {
  const zestimate = zillowData.zestimate
  const sqft = zillowData.sqft
  const appreciation = zillowData.appreciation
  
  return {
    zestimate,
    valueRange: {
      low: Math.floor(zestimate * 0.92),
      high: Math.floor(zestimate * 1.08)
    },
    confidence: appreciation > 6 ? 'high' : appreciation > 4 ? 'medium' : 'low',
    lastUpdated: new Date().toISOString().split('T')[0],
    pricePerSqFt: Math.floor(zestimate / sqft),
    valuationDate: new Date().toISOString().split('T')[0],
    marketTrend: appreciation > 5 ? 'up' : appreciation > -2 ? 'stable' : 'down',
    monthlyChange: appreciation / 12,
    yearlyChange: appreciation
  }
}

function analyzeMarketConditions(zillowData: any, comparableSales: any[]): any {
  const avgSoldPrice = comparableSales.reduce((sum, comp) => sum + comp.soldPrice, 0) / comparableSales.length
  const avgDaysOnMarket = comparableSales.reduce((sum, comp) => sum + comp.daysOnMarket, 0) / comparableSales.length
  const appreciation = zillowData.appreciation
  
  return {
    medianHomeValue: Math.floor(avgSoldPrice),
    medianListPrice: Math.floor(avgSoldPrice * 1.05), // Typically 5% above sold prices
    medianRentPrice: Math.floor(avgSoldPrice * 0.008), // Rough 1% rule
    priceAppreciation: {
      oneYear: appreciation,
      fiveYear: appreciation * 4.5, // Compound effect
      tenYear: appreciation * 8.5
    },
    daysOnMarket: Math.floor(avgDaysOnMarket),
    inventoryLevel: avgDaysOnMarket < 30 ? 'low' : avgDaysOnMarket < 60 ? 'medium' : 'high',
    marketHeat: appreciation > 8 ? 'hot' : appreciation > 6 ? 'warm' : appreciation > 3 ? 'cool' : 'cold',
    competitiveness: Math.min(100, Math.floor((10 - appreciation) * 10 + 50)),
    neighborhoodRating: Math.floor(Math.random() * 3) + 7 // 7-10 rating
  }
}

function calculateInsuranceIntelligence(propertyData: any, marketData: any): any {
  const zestimate = propertyData.zestimate
  const sqft = propertyData.sqft
  const yearBuilt = propertyData.yearBuilt
  
  // Replacement cost typically 20-30% higher than market value
  const replacementCost = Math.floor(zestimate * 1.25)
  
  // Age-based risk factors
  const riskFactors = []
  if (yearBuilt < 1990) riskFactors.push('Older construction - potential electrical/plumbing updates needed')
  if (yearBuilt < 1975) riskFactors.push('Pre-1975 construction - potential asbestos concerns')
  if (propertyData.address.toLowerCase().includes('fl')) {
    riskFactors.push('Florida location - hurricane and flood risk')
    riskFactors.push('High humidity climate - mold/moisture concerns')
  }
  
  return {
    replacementCost,
    insurableValue: Math.floor(replacementCost * 0.9), // Exclude land value
    riskFactors,
    recommendedCoverage: {
      dwelling: replacementCost,
      personalProperty: Math.floor(replacementCost * 0.5),
      liability: Math.max(300000, Math.floor(zestimate * 0.5))
    }
  }
}

function generateRentalEstimates(propertyData: any): any {
  const zestimate = propertyData.zestimate
  const bedrooms = propertyData.bedrooms
  const sqft = propertyData.sqft
  
  // Rough rental calculations (1% rule as baseline)
  const baseRent = Math.floor(zestimate * 0.01)
  
  // Bedroom adjustments
  const bedroomMultiplier = bedrooms <= 2 ? 0.9 : bedrooms >= 4 ? 1.1 : 1.0
  const rentZestimate = Math.floor(baseRent * bedroomMultiplier)
  
  return {
    rentZestimate,
    rentRange: {
      low: Math.floor(rentZestimate * 0.85),
      high: Math.floor(rentZestimate * 1.15)
    },
    yieldEstimate: Math.round((rentZestimate * 12 / zestimate) * 100 * 100) / 100,
    cashFlowPotential: Math.floor(rentZestimate * 0.3), // Rough after expenses
    comparableRents: [
      {
        address: '123 Comparable Ave',
        rent: Math.floor(rentZestimate * 0.95),
        bedrooms: bedrooms,
        bathrooms: propertyData.bathrooms,
        sqft: Math.floor(sqft * 0.9)
      },
      {
        address: '456 Similar St',
        rent: Math.floor(rentZestimate * 1.05),
        bedrooms: bedrooms + 1,
        bathrooms: propertyData.bathrooms + 0.5,
        sqft: Math.floor(sqft * 1.1)
      }
    ]
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

    const requestData: ZillowRequest = await req.json()
    const { location, analysisType, options = {} } = requestData

    if (!location?.address) {
      throw new Error('Property address is required')
    }

    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", message: `[Zillow Intelligence] Processing ${analysisType} for address: ${location.address}` }))

    // Get property data
    const zillowData = await getZillowData(location.address, location.lat, location.lng)
    
    let intelligence: ZillowPropertyIntelligence = {}

    switch (analysisType) {
      case 'property-value':
        intelligence.propertyValue = analyzePropertyValue(zillowData)
        intelligence.propertyDetails = {
          bedrooms: zillowData.bedrooms,
          bathrooms: zillowData.bathrooms,
          sqft: zillowData.sqft,
          yearBuilt: zillowData.yearBuilt,
          homeType: 'Single Family Home',
          features: ['Central Air', 'Garage', 'Patio'],
          schoolDistrict: 'Local School District'
        }
        break

      case 'market-analysis':
        intelligence.propertyValue = analyzePropertyValue(zillowData)
        intelligence.marketAnalysis = analyzeMarketConditions(zillowData, zillowData.comparableSales)
        break

      case 'price-history':
        intelligence.propertyValue = analyzePropertyValue(zillowData)
        intelligence.priceHistory = zillowData.priceHistory
        break

      case 'comparable-sales':
        intelligence.propertyValue = analyzePropertyValue(zillowData)
        intelligence.comparableSales = zillowData.comparableSales
        break

      case 'rental-estimates':
        intelligence.propertyValue = analyzePropertyValue(zillowData)
        intelligence.rentalEstimates = generateRentalEstimates(zillowData)
        break

      case 'complete-property-intel':
        intelligence.propertyValue = analyzePropertyValue(zillowData)
        intelligence.propertyDetails = {
          bedrooms: zillowData.bedrooms,
          bathrooms: zillowData.bathrooms,
          sqft: zillowData.sqft,
          yearBuilt: zillowData.yearBuilt,
          homeType: 'Single Family Home',
          features: ['Central Air', 'Garage', 'Patio'],
          schoolDistrict: 'Local School District'
        }
        intelligence.marketAnalysis = analyzeMarketConditions(zillowData, zillowData.comparableSales)
        intelligence.comparableSales = zillowData.comparableSales
        intelligence.priceHistory = zillowData.priceHistory
        intelligence.rentalEstimates = generateRentalEstimates(zillowData)
        intelligence.insuranceIntelligence = calculateInsuranceIntelligence(zillowData, intelligence.marketAnalysis)
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
      rawData: zillowData, // Include for debugging
      timestamp: new Date().toISOString(),
      apiUsed: 'zillow-property-intelligence',
      dataSource: 'Zillow (Mock Data)'
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", message: '[Zillow Intelligence] Error:', error }))
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      apiUsed: 'zillow-property-intelligence'
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})