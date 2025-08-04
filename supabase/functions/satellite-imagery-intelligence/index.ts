import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface SatelliteRequest {
  location: {
    lat: number
    lng: number
    address?: string
  }
  analysisType: 'damage-assessment' | 'before-after-comparison' | 'property-monitoring' | 'storm-impact' | 'complete-satellite-intel'
  options?: {
    resolution?: 'low' | 'medium' | 'high' | 'ultra-high' // Determines cost and detail
    dateRange?: {
      start: string // ISO date
      end: string // ISO date
    }
    includeHistorical?: boolean
    damageTypes?: string[] // hurricane, flood, fire, etc.
    analysisRadius?: number // miles from center point
    includeChangeDetection?: boolean
  }
}

interface SatelliteIntelligence {
  currentImagery?: {
    imageUrl: string
    captureDate: string
    resolution: string
    provider: string
    cloudCover: number
    qualityScore: number
  }
  historicalImagery?: Array<{
    imageUrl: string
    captureDate: string
    resolution: string
    provider: string
    cloudCover: number
    timeSinceEvent?: number // days
  }>
  damageAssessment?: {
    overallDamageLevel: 'none' | 'minor' | 'moderate' | 'severe' | 'total'
    damagePercentage: number
    affectedAreas: Array<{
      type: string // roof, structure, landscape, etc.
      severity: string
      coordinates: { lat: number, lng: number }[]
      description: string
    }>
    repairPriority: Array<{
      area: string
      urgency: 'immediate' | 'urgent' | 'scheduled' | 'deferred'
      estimatedCost: number
      description: string
    }>
  }
  changeDetection?: {
    changesDetected: boolean
    changeAreas: Array<{
      type: 'damage' | 'construction' | 'vegetation' | 'infrastructure'
      severity: 'minor' | 'moderate' | 'major'
      coordinates: { lat: number, lng: number }[]
      beforeImageUrl: string
      afterImageUrl: string
      confidence: number
    }>
    timelineAnalysis: string
  }
  propertyAnalysis?: {
    structureCondition: string
    roofCondition: string
    landscapeHealth: string
    accessibilityStatus: string
    environmentalFactors: string[]
    structuralIntegrity: number // 0-100 score
  }
  insuranceIntelligence?: {
    documentationQuality: 'excellent' | 'good' | 'adequate' | 'insufficient'
    claimSupportLevel: 'strong' | 'moderate' | 'weak'
    recommendedActions: string[]
    additionalDocumentationNeeded: string[]
    estimatedClaimValue: number
  }
}

// Note: Real satellite imagery requires partnerships with providers like:
// - Maxar (WorldView, GeoEye satellites) - $2-10 per km²
// - Planet Labs - $0.50-3 per km²
// - Google Earth Engine - $0.006 per pixel for commercial use
// - Airbus (Pleiades, SPOT) - $2-8 per km²

async function getSatelliteImagery(lat: number, lng: number, options: any): Promise<any> {
  try {
    // In production, integrate with satellite imagery providers:
    // 1. Maxar SecureWatch API
    // 2. Planet Labs API
    // 3. Google Earth Engine
    // 4. Airbus OneAtlas API
    
    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `[Satellite Mock] Fetching imagery for: ${lat}, ${lng}`
    }));
    return generateMockSatelliteData(lat, lng, options)
    
  } catch (error) {
    console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  message: 'Satellite imagery API error, using mock data:', error
}));
    return generateMockSatelliteData(lat, lng, options)
  }
}

function generateMockSatelliteData(lat: number, lng: number, options: any): any {
  const isFloridaLocation = lat > 24 && lat < 31 && lng > -88 && lng < -79
  const resolution = options.resolution || 'medium'
  
  // Generate current imagery
  const currentImagery = {
    imageUrl: `https://mock-satellite-api.com/image?lat=${lat}&lng=${lng}&res=${resolution}&date=2024-08-04`,
    captureDate: '2024-08-04T10:30:00Z',
    resolution: getResolutionDetails(resolution),
    provider: 'Maxar WorldView-3',
    cloudCover: Math.random() * 20, // 0-20% cloud cover
    qualityScore: 85 + Math.random() * 15 // 85-100 quality score
  }
  
  // Generate historical imagery if requested
  const historicalImagery = []
  if (options.includeHistorical) {
    for (let i = 1; i <= 5; i++) {
      const daysAgo = i * 30 // Monthly intervals
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      
      historicalImagery.push({
        imageUrl: `https://mock-satellite-api.com/image?lat=${lat}&lng=${lng}&res=${resolution}&date=${date.toISOString().split('T')[0]}`,
        captureDate: date.toISOString(),
        resolution: getResolutionDetails(resolution),
        provider: i % 2 === 0 ? 'Maxar WorldView-3' : 'Planet Labs SkySat',
        cloudCover: Math.random() * 30,
        timeSinceEvent: daysAgo
      })
    }
  }
  
  return {
    currentImagery,
    historicalImagery,
    location: { lat, lng },
    options
  }
}

function getResolutionDetails(resolution: string): string {
  switch (resolution) {
    case 'ultra-high': return '30cm/pixel (Ultra-High Resolution)'
    case 'high': return '50cm/pixel (High Resolution)'
    case 'medium': return '1m/pixel (Medium Resolution)'
    case 'low': return '3m/pixel (Low Resolution)'
    default: return '1m/pixel (Medium Resolution)'
  }
}

function analyzeDamageFromImagery(imagery: any, damageTypes: string[]): any {
  // Simulate AI-powered damage analysis
  const hasHurricaneDamage = damageTypes?.includes('hurricane')
  const hasFloodDamage = damageTypes?.includes('flood')
  
  let damageLevel: 'none' | 'minor' | 'moderate' | 'severe' | 'total' = 'none'
  let damagePercentage = 0
  
  if (hasHurricaneDamage) {
    damageLevel = Math.random() > 0.7 ? 'severe' : Math.random() > 0.4 ? 'moderate' : 'minor'
    damagePercentage = damageLevel === 'severe' ? 60 + Math.random() * 30 : 
                       damageLevel === 'moderate' ? 25 + Math.random() * 35 : 
                       5 + Math.random() * 20
  } else if (hasFloodDamage) {
    damageLevel = Math.random() > 0.6 ? 'moderate' : 'minor'
    damagePercentage = damageLevel === 'moderate' ? 30 + Math.random() * 25 : 10 + Math.random() * 20
  }
  
  const affectedAreas = []
  if (damageLevel !== 'none') {
    if (hasHurricaneDamage) {
      affectedAreas.push({
        type: 'roof',
        severity: damageLevel,
        coordinates: [
          { lat: imagery.location.lat + 0.0001, lng: imagery.location.lng + 0.0001 },
          { lat: imagery.location.lat - 0.0001, lng: imagery.location.lng - 0.0001 }
        ],
        description: 'Missing shingles and structural damage visible from satellite imagery'
      })
      
      if (damageLevel === 'severe') {
        affectedAreas.push({
          type: 'structure',
          severity: 'moderate',
          coordinates: [
            { lat: imagery.location.lat + 0.0002, lng: imagery.location.lng + 0.0002 }
          ],
          description: 'Partial structural collapse detected in eastern section'
        })
      }
    }
    
    if (hasFloodDamage) {
      affectedAreas.push({
        type: 'landscape',
        severity: damageLevel,
        coordinates: [
          { lat: imagery.location.lat + 0.0003, lng: imagery.location.lng - 0.0003 }
        ],
        description: 'Flood damage and debris visible in yard and surrounding areas'
      })
    }
  }
  
  return {
    overallDamageLevel: damageLevel,
    damagePercentage: Math.round(damagePercentage),
    affectedAreas,
    repairPriority: generateRepairPriority(affectedAreas, damageLevel)
  }
}

function generateRepairPriority(affectedAreas: any[], damageLevel: string): any[] {
  const priorities = []
  
  affectedAreas.forEach(area => {
    if (area.type === 'roof') {
      priorities.push({
        area: 'Roof repair/replacement',
        urgency: damageLevel === 'severe' ? 'immediate' : damageLevel === 'moderate' ? 'urgent' : 'scheduled',
        estimatedCost: damageLevel === 'severe' ? 25000 + Math.random() * 20000 : 
                       damageLevel === 'moderate' ? 8000 + Math.random() * 12000 : 
                       2000 + Math.random() * 6000,
        description: 'Address structural integrity and weather protection'
      })
    }
    
    if (area.type === 'structure') {
      priorities.push({
        area: 'Structural repairs',
        urgency: 'immediate',
        estimatedCost: 15000 + Math.random() * 30000,
        description: 'Critical structural repairs required for safety'
      })
    }
    
    if (area.type === 'landscape') {
      priorities.push({
        area: 'Landscape restoration',
        urgency: 'deferred',
        estimatedCost: 3000 + Math.random() * 7000,
        description: 'Debris removal and landscape rehabilitation'
      })
    }
  })
  
  return priorities.sort((a, b) => {
    const urgencyOrder = { immediate: 4, urgent: 3, scheduled: 2, deferred: 1 }
    return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder]
  })
}

function performChangeDetection(currentImagery: any, historicalImagery: any[]): any {
  if (!historicalImagery || historicalImagery.length === 0) {
    return {
      changesDetected: false,
      changeAreas: [],
      timelineAnalysis: 'No historical imagery available for comparison'
    }
  }
  
  // Simulate AI change detection algorithm
  const changesDetected = Math.random() > 0.4 // 60% chance of detecting changes
  const changeAreas = []
  
  if (changesDetected) {
    // Generate 1-3 change areas
    const numChanges = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < numChanges; i++) {
      const changeTypes = ['damage', 'construction', 'vegetation', 'infrastructure']
      const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)]
      
      changeAreas.push({
        type: changeType,
        severity: Math.random() > 0.6 ? 'major' : Math.random() > 0.3 ? 'moderate' : 'minor',
        coordinates: [
          {
            lat: currentImagery.location.lat + (Math.random() - 0.5) * 0.001,
            lng: currentImagery.location.lng + (Math.random() - 0.5) * 0.001
          }
        ],
        beforeImageUrl: historicalImagery[0].imageUrl,
        afterImageUrl: currentImagery.imageUrl,
        confidence: 0.7 + Math.random() * 0.3 // 70-100% confidence
      })
    }
  }
  
  return {
    changesDetected,
    changeAreas,
    timelineAnalysis: changesDetected 
      ? `Detected ${changeAreas.length} significant change(s) between ${historicalImagery[0].captureDate.split('T')[0]} and ${currentImagery.captureDate.split('T')[0]}`
      : 'No significant changes detected in the analyzed time period'
  }
}

function analyzePropertyCondition(imagery: any, damageAssessment: any): any {
  const overallCondition = damageAssessment.overallDamageLevel
  
  return {
    structureCondition: overallCondition === 'none' ? 'Excellent' : 
                       overallCondition === 'minor' ? 'Good' :
                       overallCondition === 'moderate' ? 'Fair' : 'Poor',
    roofCondition: overallCondition === 'none' ? 'Intact' :
                   overallCondition === 'minor' ? 'Minor Issues' :
                   overallCondition === 'moderate' ? 'Significant Damage' : 'Major Damage',
    landscapeHealth: 'Good - Vegetation appears healthy',
    accessibilityStatus: 'Accessible - Clear access routes visible',
    environmentalFactors: [
      'Coastal proximity - salt air exposure',
      'Hurricane risk zone',
      'Flood zone considerations'
    ],
    structuralIntegrity: Math.max(10, 100 - (damageAssessment.damagePercentage * 0.8))
  }
}

function generateInsuranceIntelligence(damageAssessment: any, imagery: any): any {
  const damageLevel = damageAssessment.overallDamageLevel
  const totalRepairCost = damageAssessment.repairPriority?.reduce((sum: number, item: any) => sum + item.estimatedCost, 0) || 0
  
  return {
    documentationQuality: imagery.qualityScore > 90 ? 'excellent' : 
                         imagery.qualityScore > 75 ? 'good' : 
                         imagery.qualityScore > 60 ? 'adequate' : 'insufficient',
    claimSupportLevel: damageLevel === 'severe' || damageLevel === 'total' ? 'strong' :
                      damageLevel === 'moderate' ? 'moderate' : 'weak',
    recommendedActions: [
      'Submit satellite imagery as primary damage documentation',
      'Schedule professional on-site assessment to validate satellite findings',
      'Document specific damage areas identified in satellite analysis',
      ...(damageLevel === 'severe' ? ['Expedite claim processing due to severe damage level'] : []),
      ...(totalRepairCost > 50000 ? ['Request additional coverage review for high-value repairs'] : [])
    ],
    additionalDocumentationNeeded: [
      'Ground-level photos of damaged areas',
      'Interior damage assessment photos',
      'Receipts for temporary repairs or mitigation efforts',
      ...(damageLevel !== 'none' ? ['Professional contractor estimates'] : [])
    ],
    estimatedClaimValue: Math.round(totalRepairCost * 1.1) // Add 10% for additional costs
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

    const requestData: SatelliteRequest = await req.json()
    const { location, analysisType, options = {} } = requestData

    if (!location?.lat || !location?.lng) {
      throw new Error('Location coordinates are required')
    }

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `[Satellite Intelligence] Processing ${analysisType} for location: ${location.lat}, ${location.lng}`
    }));

    // Get satellite imagery data
    const imageryData = await getSatelliteImagery(location.lat, location.lng, options)
    
    let intelligence: SatelliteIntelligence = {}

    switch (analysisType) {
      case 'damage-assessment':
        intelligence.currentImagery = imageryData.currentImagery
        intelligence.damageAssessment = analyzeDamageFromImagery(imageryData, options.damageTypes || [])
        intelligence.propertyAnalysis = analyzePropertyCondition(imageryData, intelligence.damageAssessment)
        intelligence.insuranceIntelligence = generateInsuranceIntelligence(intelligence.damageAssessment, imageryData.currentImagery)
        break

      case 'before-after-comparison':
        intelligence.currentImagery = imageryData.currentImagery
        intelligence.historicalImagery = imageryData.historicalImagery
        intelligence.changeDetection = performChangeDetection(imageryData.currentImagery, imageryData.historicalImagery)
        intelligence.damageAssessment = analyzeDamageFromImagery(imageryData, options.damageTypes || [])
        break

      case 'property-monitoring':
        intelligence.currentImagery = imageryData.currentImagery
        intelligence.propertyAnalysis = analyzePropertyCondition(imageryData, { overallDamageLevel: 'none', damagePercentage: 0, repairPriority: [] })
        if (options.includeHistorical) {
          intelligence.historicalImagery = imageryData.historicalImagery
          intelligence.changeDetection = performChangeDetection(imageryData.currentImagery, imageryData.historicalImagery)
        }
        break

      case 'storm-impact':
        intelligence.currentImagery = imageryData.currentImagery
        intelligence.historicalImagery = imageryData.historicalImagery
        intelligence.damageAssessment = analyzeDamageFromImagery(imageryData, ['hurricane', 'flood', 'wind'])
        intelligence.changeDetection = performChangeDetection(imageryData.currentImagery, imageryData.historicalImagery)
        intelligence.propertyAnalysis = analyzePropertyCondition(imageryData, intelligence.damageAssessment)
        intelligence.insuranceIntelligence = generateInsuranceIntelligence(intelligence.damageAssessment, imageryData.currentImagery)
        break

      case 'complete-satellite-intel':
        intelligence.currentImagery = imageryData.currentImagery
        intelligence.historicalImagery = imageryData.historicalImagery
        intelligence.damageAssessment = analyzeDamageFromImagery(imageryData, options.damageTypes || ['hurricane', 'flood'])
        intelligence.changeDetection = performChangeDetection(imageryData.currentImagery, imageryData.historicalImagery)
        intelligence.propertyAnalysis = analyzePropertyCondition(imageryData, intelligence.damageAssessment)
        intelligence.insuranceIntelligence = generateInsuranceIntelligence(intelligence.damageAssessment, imageryData.currentImagery)
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
      timestamp: new Date().toISOString(),
      apiUsed: 'satellite-imagery-intelligence',
      dataSource: 'Satellite Imagery Providers (Mock Data)',
      costs: {
        estimatedCost: calculateSatelliteCost(options.resolution, analysisType),
        currency: 'USD',
        breakdown: {
          imagery: '$2-10 per km²',
          analysis: '$0.50 per analysis',
          storage: '$0.10 per image'
        }
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: '[Satellite Intelligence] Error:', error
}));
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      apiUsed: 'satellite-imagery-intelligence'
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function calculateSatelliteCost(resolution: string = 'medium', analysisType: string): number {
  const baseCosts = {
    'ultra-high': 8.50,
    'high': 5.00,
    'medium': 2.50,
    'low': 1.00
  }
  
  const analysisCosts = {
    'damage-assessment': 2.00,
    'before-after-comparison': 3.50,
    'property-monitoring': 1.50,
    'storm-impact': 4.00,
    'complete-satellite-intel': 5.00
  }
  
  return (baseCosts[resolution as keyof typeof baseCosts] || baseCosts.medium) + 
         (analysisCosts[analysisType as keyof typeof analysisCosts] || 2.00)
}