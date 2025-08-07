/**
 * @fileMetadata
 * @purpose "Unified Google Maps API service supporting all 11+ APIs"
 * @owner backend-team
 * @dependencies ["@/lib/logger", "@/lib/cache"]
 * @exports ["GoogleMapsUnifiedService"]
 * @complexity high
 * @tags ["google-maps", "api-integration", "property-intelligence"]
 * @status stable
 */

import { logger } from '@/lib/logger'

// Core configuration
interface GoogleMapsConfig {
  apiKey: string
  baseUrls: {
    places: string
    maps: string
    geocoding: string
    elevation: string
    timezone: string
    weather: string
    aerial: string
    pollen: string
    airQuality: string
    solar: string
    distanceMatrix: string
  }
  rateLimits: {
    [key: string]: number
  }
  cache: {
    ttl: number
    enabled: boolean
  }
}

// Unified response structure
interface UnifiedResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  apiUsed: string
  timestamp: string
  cached?: boolean
  remainingQuota?: number
}

// Property intelligence data structures
interface PropertyLocation {
  lat: number
  lng: number
  address: string
  placeId?: string
}

interface RoofAnalysis {
  area: number
  material: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  damagePercentage: number
  repairEstimate?: number
  solarPotential?: number
}

interface EnvironmentalData {
  pollen: {
    grass: number
    tree: number
    weed: number
    composite: number
  }
  airQuality: {
    aqi: number
    pollutants: Record<string, number>
  }
  weather: {
    current: unknown
    historical: unknown[]
    alerts: unknown[]
  }
}

export class GoogleMapsUnifiedService {
  private config: GoogleMapsConfig
  private cache: Map<string, { data: unknown; expires: number }> = new Map()
  private rateLimitTrackers: Map<string, { count: number; resetTime: number }> = new Map()

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      baseUrls: {
        places: 'https://maps.googleapis.com/maps/api/place',
        maps: 'https://maps.googleapis.com/maps/api',
        geocoding: 'https://maps.googleapis.com/maps/api/geocode',
        elevation: 'https://maps.googleapis.com/maps/api/elevation',
        timezone: 'https://maps.googleapis.com/maps/api/timezone',
        weather: 'https://api.openweathermap.org/data/2.5', // Backup weather API
        aerial: 'https://aerialview.googleapis.com/v1',
        pollen: 'https://pollen.googleapis.com/v1',
        airQuality: 'https://airquality.googleapis.com/v1',
        solar: 'https://solar.googleapis.com/v1',
        distanceMatrix: 'https://maps.googleapis.com/maps/api/distancematrix'
      },
      rateLimits: {
        places: 100000, // per day
        geocoding: 40000,
        elevation: 2500,
        timezone: 100000,
        aerial: 1000,
        pollen: 10000,
        airQuality: 10000,
        solar: 1000,
        distanceMatrix: 25000
      },
      cache: {
        ttl: 3600000, // 1 hour default
        enabled: true
      }
    }
  }

  // ========== CORE UTILITIES ==========

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any>,
    apiType: string,
    cacheTtl?: number
  ): Promise<UnifiedResponse<T>> {
    const cacheKey = `${apiType}:${JSON.stringify(params)}`

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        return {
          success: true,
          data: cached.data as T,
          apiUsed: apiType,
          timestamp: new Date().toISOString(),
          cached: true
        }
      }
    }

    // Check rate limits
    const rateLimitKey = apiType
    const rateLimitTracker = this.rateLimitTrackers.get(rateLimitKey)
    if (rateLimitTracker && rateLimitTracker.count >= this.config.rateLimits[apiType]) {
      if (Date.now() < rateLimitTracker.resetTime) {
        return {
          success: false,
          error: `Rate limit exceeded for ${apiType}`,
          apiUsed: apiType,
          timestamp: new Date().toISOString()
        }
      }
    }

    try {
      const url = new URL(endpoint)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      })

      logger.info(`[GoogleMapsUnified] Making ${apiType} request`, { url: url.toString() })

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`API request failed: ${data.error_message || response.statusText}`)
      }

      // Update rate limit tracker
      const now = Date.now()
      const resetTime = now + (24 * 60 * 60 * 1000) // 24 hours
      this.rateLimitTrackers.set(rateLimitKey, {
        count: (rateLimitTracker?.count || 0) + 1,
        resetTime: rateLimitTracker?.resetTime || resetTime
      })

      // Cache the result
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, {
          data,
          expires: now + (cacheTtl || this.config.cache.ttl)
        })
      }

      return {
        success: true,
        data,
        apiUsed: apiType,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      logger.error(`[GoogleMapsUnified] ${apiType} request failed`, { error })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        apiUsed: apiType,
        timestamp: new Date().toISOString()
      }
    }
  }

  // ========== API 1: ADDRESS VALIDATION ==========

  async validateAddress(address: string): Promise<UnifiedResponse<{
    validated: boolean
    correctedAddress: string
    components: Record<string, string>
    geocode: { lat: number; lng: number }
    confidence: number
  }>> {
    return this.makeRequest(
      `${this.config.baseUrls.places}/textsearch/json`,
      {
        query: address,
        key: this.config.apiKey,
        region: 'us',
        language: 'en'
      },
      'address-validation',
      86400000 // 24 hours cache for addresses
    )
  }

  // ========== API 2: AERIAL VIEW (ROOF ANALYSIS) ==========

  async analyzeRoofFromAerial(location: PropertyLocation): Promise<UnifiedResponse<RoofAnalysis>> {
    // Note: This is a complex API that may require additional processing
    return this.makeRequest(
      `${this.config.baseUrls.aerial}/lookups:getRenders`,
      {
        'location.latitude': location.lat,
        'location.longitude': location.lng,
        renderType: 'ROOF_DORSAL_VIEW',
        key: this.config.apiKey
      },
      'aerial-view',
      3600000 // 1 hour cache
    )
  }

  // ========== API 3: WEATHER API ==========

  async getWeatherForClaims(location: PropertyLocation, dateRange?: { start: Date; end: Date }): Promise<UnifiedResponse<any>> {
    const endpoint = dateRange
      ? `${this.config.baseUrls.weather}/onecall/timemachine`
      : `${this.config.baseUrls.weather}/onecall`

    return this.makeRequest(
      endpoint,
      {
        lat: location.lat,
        lon: location.lng,
        appid: this.config.apiKey,
        units: 'imperial',
        ...(dateRange && { dt: Math.floor(dateRange.start.getTime() / 1000) })
      },
      'weather',
      1800000 // 30 minutes cache for weather
    )
  }

  // ========== API 4: POLLEN API ==========

  async getPollenData(location: PropertyLocation): Promise<UnifiedResponse<any>> {
    return this.makeRequest(
      `${this.config.baseUrls.pollen}/forecast`,
      {
        'location.longitude': location.lng,
        'location.latitude': location.lat,
        key: this.config.apiKey,
        days: 5,
        plantsDescription: true
      },
      'pollen',
      3600000 // 1 hour cache
    )
  }

  // ========== API 5: DISTANCE MATRIX ==========

  async getDistancesToServices(origin: PropertyLocation, destinations: PropertyLocation[]): Promise<UnifiedResponse<any>> {
    const destinationString = destinations
      .map(dest => `${dest.lat},${dest.lng}`)
      .join('|')

    return this.makeRequest(
      `${this.config.baseUrls.distanceMatrix}/json`,
      {
        origins: `${origin.lat},${origin.lng}`,
        destinations: destinationString,
        key: this.config.apiKey,
        units: 'imperial',
        mode: 'driving'
      },
      'distance-matrix',
      3600000 // 1 hour cache
    )
  }

  // ========== API 6: MAPS STATIC ==========

  generateStaticMap(location: PropertyLocation, options: {
    zoom?: number
    size?: string
    mapType?: string
    markers?: Array<{ lat: number; lng: number; label?: string }>
  } = {}): string {
    const params = new URLSearchParams({
      center: `${location.lat},${location.lng}`,
      zoom: String(options.zoom || 15),
      size: options.size || '600x400',
      maptype: options.mapType || 'satellite',
      key: this.config.apiKey
    })

    if (options.markers) {
      options.markers.forEach((marker, index) => {
        params.append('markers', `color:red|label:${marker.label || index + 1}|${marker.lat},${marker.lng}`)
      })
    }

    return `${this.config.baseUrls.maps}/staticmap?${params.toString()}`
  }

  // ========== API 7: ELEVATION ==========

  async getElevationData(locations: PropertyLocation[]): Promise<UnifiedResponse<any>> {
    const locationString = locations
      .map(loc => `${loc.lat},${loc.lng}`)
      .join('|')

    return this.makeRequest(
      `${this.config.baseUrls.elevation}/json`,
      {
        locations: locationString,
        key: this.config.apiKey
      },
      'elevation',
      86400000 // 24 hours cache for elevation
    )
  }

  // ========== API 8:街景 STATIC ==========

  generateStreetView(location: PropertyLocation, options: {
    size?: string
    heading?: number
    pitch?: number
    fov?: number
  } = {}): string {
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      size: options.size || '600x400',
      heading: String(options.heading || 0),
      pitch: String(options.pitch || 0),
      fov: String(options.fov || 90),
      key: this.config.apiKey
    })

    return `${this.config.baseUrls.maps}/streetview?${params.toString()}`
  }

  // ========== API 9: AIR QUALITY ==========

  async getAirQuality(location: PropertyLocation): Promise<UnifiedResponse<any>> {
    return this.makeRequest(
      `${this.config.baseUrls.airQuality}/currentConditions:lookup`,
      {
        'location.latitude': location.lat,
        'location.longitude': location.lng,
        key: this.config.apiKey
      },
      'air-quality',
      1800000 // 30 minutes cache
    )
  }

  // ========== API 10: SOLAR API ==========

  async getSolarPotential(location: PropertyLocation): Promise<UnifiedResponse<any>> {
    return this.makeRequest(
      `${this.config.baseUrls.solar}/buildingInsights:findClosest`,
      {
        'location.latitude': location.lat,
        'location.longitude': location.lng,
        key: this.config.apiKey
      },
      'solar',
      86400000 // 24 hours cache
    )
  }

  // ========== API 11: TIMEZONE ==========

  async getTimezone(location: PropertyLocation): Promise<UnifiedResponse<any>> {
    return this.makeRequest(
      `${this.config.baseUrls.timezone}/json`,
      {
        location: `${location.lat},${location.lng}`,
        timestamp: Math.floor(Date.now() / 1000),
        key: this.config.apiKey
      },
      'timezone',
      86400000 // 24 hours cache
    )
  }

  // ========== UNIFIED PROPERTY INTELLIGENCE ==========

  async getCompletePropertyIntelligence(location: PropertyLocation): Promise<UnifiedResponse<{
    address: unknown
    roofAnalysis: RoofAnalysis | null
    environmental: EnvironmentalData
    elevation: number | null
    timezone: string | null
    solarPotential: unknown
    staticMapUrl: string
    streetViewUrl: string
  }>> {
    try {
      logger.info('[GoogleMapsUnified] Starting complete property intelligence gathering', { location })

      // Execute all APIs in parallel where possible
      const [
        addressValidation,
        roofAnalysis,
        weatherData,
        pollenData,
        airQualityData,
        elevationData,
        timezoneData,
        solarData
      ] = await Promise.allSettled([
        this.validateAddress(location.address),
        this.analyzeRoofFromAerial(location),
        this.getWeatherForClaims(location),
        this.getPollenData(location),
        this.getAirQuality(location),
        this.getElevationData([location]),
        this.getTimezone(location),
        this.getSolarPotential(location)
      ])

      // Generate static resources
      const staticMapUrl = this.generateStaticMap(location, { zoom: 18, mapType: 'satellite' })
      const streetViewUrl = this.generateStreetView(location)

      const result = {
        address: addressValidation.status === 'fulfilled' ? addressValidation.value.data : null,
        roofAnalysis: roofAnalysis.status === 'fulfilled' ? (roofAnalysis.value.data || null) : null,
        environmental: {
          weather: weatherData.status === 'fulfilled' ? weatherData.value.data : null,
          pollen: pollenData.status === 'fulfilled' ? pollenData.value.data : null,
          airQuality: airQualityData.status === 'fulfilled' ? airQualityData.value.data : null
        },
        elevation: elevationData.status === 'fulfilled' ? (elevationData.value.data?.results?.[0]?.elevation || null) : null,
        timezone: timezoneData.status === 'fulfilled' ? (timezoneData.value.data?.timeZoneId || null) : null,
        solarPotential: solarData.status === 'fulfilled' ? solarData.value.data : null,
        staticMapUrl,
        streetViewUrl
      }

      return {
        success: true,
        data: result,
        apiUsed: 'unified-intelligence',
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      logger.error('[GoogleMapsUnified] Complete property intelligence failed', { error, location })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        apiUsed: 'unified-intelligence',
        timestamp: new Date().toISOString()
      }
    }
  }

  // ========== UTILITY METHODS ==========

  getCacheStats(): { size: number; apis: string[] } {
    return {
      size: this.cache.size,
      apis: Array.from(new Set(Array.from(this.cache.keys()).map(key => key.split(':')[0])))
    }
  }

  clearCache(apiType?: string): void {
    if (apiType) {
      Array.from(this.cache.keys())
        .filter(key => key.startsWith(`${apiType}:`))
        .forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
  }

  getRateLimitStatus(): Record<string, { used: number; limit: number; resetTime?: number }> {
    const status: Record<string, any> = {}

    Object.keys(this.config.rateLimits).forEach(api => {
      const tracker = this.rateLimitTrackers.get(api)
      status[api] = {
        used: tracker?.count || 0,
        limit: this.config.rateLimits[api],
        resetTime: tracker?.resetTime
      }
    })

    return status
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsUnifiedService()
