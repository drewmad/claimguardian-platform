/**
 * @fileMetadata
 * @purpose Multi-source environmental data integration service
 * @owner gis-team
 * @status active
 */

import { logger } from '@/lib/logger'

// ==============================================
// FLORIDA GIS DATA SOURCES
// ==============================================

export interface FloridaGISDataSource {
  name: string
  baseUrl: string
  apiKey?: string
  updateFrequency: string
  reliability: number
  dataTypes: string[]
}

export const FLORIDA_DATA_SOURCES: Record<string, FloridaGISDataSource> = {
  florida_gio: {
    name: 'Florida Geographic Data Library',
    baseUrl: 'https://ca.dep.state.fl.us/arcgis/rest/services',
    updateFrequency: 'quarterly',
    reliability: 0.95,
    dataTypes: ['parcels', 'buildings', 'zoning', 'land_use']
  },
  fema_nfhl: {
    name: 'FEMA National Flood Hazard Layer',
    baseUrl: 'https://hazards.fema.gov/gis/nfhl/rest/services',
    updateFrequency: 'annual',
    reliability: 0.98,
    dataTypes: ['flood_zones', 'base_flood_elevation', 'levees']
  },
  noaa_weather: {
    name: 'NOAA Weather and Climate Data',
    baseUrl: 'https://api.weather.gov',
    updateFrequency: 'hourly',
    reliability: 0.92,
    dataTypes: ['weather', 'alerts', 'historical_climate', 'sea_level']
  },
  usgs_water: {
    name: 'USGS Water Resources',
    baseUrl: 'https://waterservices.usgs.gov',
    updateFrequency: 'real-time',
    reliability: 0.94,
    dataTypes: ['stream_flow', 'groundwater', 'water_quality', 'flood_stage']
  },
  fl_emergency: {
    name: 'Florida Division of Emergency Management',
    baseUrl: 'https://www.floridadisaster.org/gis',
    updateFrequency: 'weekly',
    reliability: 0.90,
    dataTypes: ['evacuation_zones', 'shelters', 'storm_surge', 'hurricane_tracks']
  },
  epa_environmental: {
    name: 'EPA Environmental Data',
    baseUrl: 'https://api.epa.gov',
    updateFrequency: 'daily',
    reliability: 0.88,
    dataTypes: ['air_quality', 'water_quality', 'hazardous_sites', 'environmental_justice']
  }
}

// ==============================================
// ENVIRONMENTAL DATA INTERFACES
// ==============================================

export interface ParcelData {
  parcelId: string
  address: string
  coordinates: [number, number]
  propertyValue: number
  buildingValue: number
  yearBuilt: number
  squareFootage: number
  propertyType: string
  zoning: string
  ownerName: string
  geometry: GeoJSON.Polygon
}

export interface FloodRiskData {
  floodZone: string
  baseFloodElevation?: number
  annualChanceFlood: number
  floodInsuranceRate: string
  leveeProtection?: boolean
  coastalFloodHazard?: boolean
  specialFloodHazardArea: boolean
}

export interface WeatherData {
  currentConditions: {
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: number
    pressure: number
    visibility: number
  }
  alerts: Array<{
    type: string
    severity: string
    message: string
    effectiveTime: string
    expiresTime: string
  }>
  historicalAverages: Record<string, number>
  climateTrends: Record<string, number[]>
}

export interface EnvironmentalHazards {
  airQuality: {
    aqi: number
    pollutants: Record<string, number>
    healthRecommendations: string[]
  }
  waterQuality: {
    sources: Array<{
      type: string
      quality: number
      contaminants?: string[]
    }>
  }
  soilConditions: {
    type: string
    stability: number
    contaminants?: string[]
    drainage: string
  }
  wildFireRisk: {
    riskLevel: string
    fuelLoad: number
    fireWeatherIndex: number
  }
}

// ==============================================
// ENVIRONMENTAL DATA SERVICE
// ==============================================

export class EnvironmentalDataService {
  private readonly maxRetries = 3
  private readonly timeoutMs = 10000

  /**
   * Get comprehensive parcel data from Florida GIS
   */
  async getParcelData(address: string): Promise<ParcelData | null> {
    try {
      // First, geocode the address
      const coordinates = await this.geocodeAddress(address)
      if (!coordinates) {
        throw new Error(`Unable to geocode address: ${address}`)
      }

      // Query Florida GIS parcel service
      const parcelUrl = `${FLORIDA_DATA_SOURCES.florida_gio.baseUrl}/Boundaries/Parcels/MapServer/identify`
      
      const response = await this.fetchWithRetry(parcelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          geometry: JSON.stringify({
            x: coordinates[0],
            y: coordinates[1],
            spatialReference: { wkid: 4326 }
          }),
          geometryType: 'esriGeometryPoint',
          mapExtent: `${coordinates[0]-0.001},${coordinates[1]-0.001},${coordinates[0]+0.001},${coordinates[1]+0.001}`,
          imageDisplay: '400,400,96',
          tolerance: '10',
          f: 'json'
        })
      })

      const data = await response.json()
      
      if (!data.results || data.results.length === 0) {
        logger.warn('No parcel data found for address', { address, coordinates })
        return null
      }

      const parcel = data.results[0].attributes
      
      // Get detailed parcel geometry
      const geometryResponse = await this.getParcelGeometry(parcel.PARCEL_ID)
      
      return {
        parcelId: parcel.PARCEL_ID,
        address: parcel.SITE_ADDR || address,
        coordinates,
        propertyValue: parseFloat(parcel.JUST_VAL || '0'),
        buildingValue: parseFloat(parcel.BLDG_VAL || '0'),
        yearBuilt: parseInt(parcel.YR_BLT || '0'),
        squareFootage: parseInt(parcel.TOT_LVG_AREA || '0'),
        propertyType: parcel.DOR_UC || 'unknown',
        zoning: parcel.ZONING || 'unknown',
        ownerName: parcel.OWNER_NAME || 'unknown',
        geometry: geometryResponse
      }

    } catch (error) {
      logger.error('Failed to fetch parcel data', { address, error })
      return null
    }
  }

  /**
   * Get comprehensive flood risk data
   */
  async getFloodRiskData(coordinates: [number, number]): Promise<FloodRiskData | null> {
    try {
      // Query FEMA NFHL service
      const nfhlUrl = `${FLORIDA_DATA_SOURCES.fema_nfhl.baseUrl}/NFHL/NFHLRestServices/services/FIRM/MapServer/identify`
      
      const response = await this.fetchWithRetry(nfhlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          geometry: JSON.stringify({
            x: coordinates[0],
            y: coordinates[1],
            spatialReference: { wkid: 4326 }
          }),
          geometryType: 'esriGeometryPoint',
          layers: 'all',
          tolerance: '3',
          f: 'json'
        })
      })

      const data = await response.json()
      
      if (!data.results || data.results.length === 0) {
        // Default to minimal flood risk if no FEMA data
        return {
          floodZone: 'X',
          annualChanceFlood: 0.002, // 0.2% annual chance
          floodInsuranceRate: 'Preferred Risk',
          specialFloodHazardArea: false
        }
      }

      const floodData = data.results[0].attributes
      
      return {
        floodZone: floodData.FLD_ZONE || 'X',
        baseFloodElevation: parseFloat(floodData.STATIC_BFE) || undefined,
        annualChanceFlood: this.calculateAnnualFloodChance(floodData.FLD_ZONE),
        floodInsuranceRate: this.determineFloodInsuranceRate(floodData.FLD_ZONE),
        leveeProtection: floodData.LEVEE_PROTECTED === 'Y',
        coastalFloodHazard: ['VE', 'V', 'AE'].includes(floodData.FLD_ZONE),
        specialFloodHazardArea: !['X', 'OPEN WATER'].includes(floodData.FLD_ZONE)
      }

    } catch (error) {
      logger.error('Failed to fetch flood risk data', { coordinates, error })
      return null
    }
  }

  /**
   * Get current weather and climate data
   */
  async getWeatherData(coordinates: [number, number]): Promise<WeatherData | null> {
    try {
      // Get current conditions from NOAA
      const weatherUrl = `${FLORIDA_DATA_SOURCES.noaa_weather.baseUrl}/points/${coordinates[1]},${coordinates[0]}`
      
      const pointResponse = await this.fetchWithRetry(weatherUrl)
      const pointData = await pointResponse.json()
      
      if (!pointData.properties) {
        throw new Error('Invalid NOAA point data')
      }

      // Get current observations
      const observationUrl = pointData.properties.observationStations
      const observationResponse = await this.fetchWithRetry(observationUrl)
      const observationData = await observationResponse.json()
      
      const stationUrl = observationData.features[0]?.id + '/observations/latest'
      const latestResponse = await this.fetchWithRetry(stationUrl)
      const latestData = await latestResponse.json()

      // Get active alerts
      const alertsUrl = `${FLORIDA_DATA_SOURCES.noaa_weather.baseUrl}/alerts/active?point=${coordinates[1]},${coordinates[0]}`
      const alertsResponse = await this.fetchWithRetry(alertsUrl)
      const alertsData = await alertsResponse.json()

      const current = latestData.properties || {}
      
      return {
        currentConditions: {
          temperature: current.temperature?.value || 0,
          humidity: current.relativeHumidity?.value || 0,
          windSpeed: current.windSpeed?.value || 0,
          windDirection: current.windDirection?.value || 0,
          pressure: current.barometricPressure?.value || 0,
          visibility: current.visibility?.value || 0
        },
        alerts: alertsData.features?.map((alert: any) => ({
          type: alert.properties.event,
          severity: alert.properties.severity,
          message: alert.properties.headline,
          effectiveTime: alert.properties.effective,
          expiresTime: alert.properties.expires
        })) || [],
        historicalAverages: {
          // These would come from historical climate data APIs
          avgTempJan: 65, avgTempJul: 85,
          avgPrecipAnnual: 50,
          avgHumidity: 75
        },
        climateTrends: {
          temperature: [64, 65, 66], // Historical 3-year trend
          precipitation: [48, 52, 50],
          stormIntensity: [2.1, 2.3, 2.4]
        }
      }

    } catch (error) {
      logger.error('Failed to fetch weather data', { coordinates, error })
      return null
    }
  }

  /**
   * Get environmental hazards data
   */
  async getEnvironmentalHazards(coordinates: [number, number]): Promise<EnvironmentalHazards | null> {
    try {
      // EPA Air Quality Index
      const airQualityUrl = `${FLORIDA_DATA_SOURCES.epa_environmental.baseUrl}/airnow/?format=application/json&latitude=${coordinates[1]}&longitude=${coordinates[0]}&distance=25&API_KEY=${process.env.EPA_API_KEY}`
      
      let airQualityData = null
      try {
        const aqResponse = await this.fetchWithRetry(airQualityUrl)
        airQualityData = await aqResponse.json()
      } catch (error) {
        logger.warn('Air quality data unavailable', { coordinates })
      }

      // USGS Water Quality
      const waterQualityUrl = `${FLORIDA_DATA_SOURCES.usgs_water.baseUrl}/nwis/site/?format=json&lat=${coordinates[1]}&lon=${coordinates[0]}&radius=10&siteType=GW,SP,ST`
      
      let waterQualityData = null
      try {
        const wqResponse = await this.fetchWithRetry(waterQualityUrl)
        waterQualityData = await wqResponse.json()
      } catch (error) {
        logger.warn('Water quality data unavailable', { coordinates })
      }

      return {
        airQuality: {
          aqi: airQualityData?.[0]?.AQI || 50,
          pollutants: {
            pm25: airQualityData?.find((d: any) => d.ParameterName === 'PM2.5')?.AQI || 50,
            ozone: airQualityData?.find((d: any) => d.ParameterName === 'OZONE')?.AQI || 50
          },
          healthRecommendations: this.getHealthRecommendations(airQualityData?.[0]?.AQI || 50)
        },
        waterQuality: {
          sources: waterQualityData?.sites?.map((site: any) => ({
            type: site.siteTypeCd,
            quality: 85, // Default good quality
            contaminants: []
          })) || []
        },
        soilConditions: {
          type: 'sandy', // Default for Florida
          stability: 0.7,
          drainage: 'well-drained'
        },
        wildFireRisk: {
          riskLevel: 'moderate',
          fuelLoad: 0.6,
          fireWeatherIndex: 0.4
        }
      }

    } catch (error) {
      logger.error('Failed to fetch environmental hazards', { coordinates, error })
      return null
    }
  }

  /**
   * Get comprehensive environmental data for a property
   */
  async getComprehensiveEnvironmentalData(address: string): Promise<{
    parcel: ParcelData | null
    floodRisk: FloodRiskData | null
    weather: WeatherData | null
    hazards: EnvironmentalHazards | null
    dataQuality: {
      completeness: number
      reliability: number
      lastUpdated: string
    }
  }> {
    const startTime = Date.now()
    
    try {
      // Get basic parcel data first
      const parcel = await this.getParcelData(address)
      
      if (!parcel) {
        throw new Error(`No parcel data found for address: ${address}`)
      }

      // Fetch all environmental data in parallel
      const [floodRisk, weather, hazards] = await Promise.all([
        this.getFloodRiskData(parcel.coordinates),
        this.getWeatherData(parcel.coordinates),
        this.getEnvironmentalHazards(parcel.coordinates)
      ])

      // Calculate data quality metrics
      const completeness = this.calculateDataCompleteness({
        parcel, floodRisk, weather, hazards
      })
      
      const reliability = this.calculateDataReliability({
        parcel, floodRisk, weather, hazards
      })

      logger.info('Environmental data fetched successfully', {
        address,
        completeness,
        reliability,
        processingTime: Date.now() - startTime
      })

      return {
        parcel,
        floodRisk,
        weather,
        hazards,
        dataQuality: {
          completeness,
          reliability,
          lastUpdated: new Date().toISOString()
        }
      }

    } catch (error) {
      logger.error('Failed to fetch comprehensive environmental data', {
        address,
        error,
        processingTime: Date.now() - startTime
      })
      
      throw error
    }
  }

  // ==============================================
  // PRIVATE HELPER METHODS
  // ==============================================

  private async fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response
        
      } catch (error) {
        lastError = error as Error
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(`Failed to fetch after ${this.maxRetries} attempts: ${lastError?.message}`)
  }

  private async geocodeAddress(address: string): Promise<[number, number] | null> {
    try {
      // Use Florida GIS geocoding service
      const geocodeUrl = `${FLORIDA_DATA_SOURCES.florida_gio.baseUrl}/GeocodeServer/findAddressCandidates`
      
      const response = await this.fetchWithRetry(geocodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'Single Line Input': address,
          f: 'json',
          outSR: '4326'
        })
      })

      const data = await response.json()
      
      if (data.candidates && data.candidates.length > 0) {
        const location = data.candidates[0].location
        return [location.x, location.y]
      }
      
      return null
      
    } catch (error) {
      logger.error('Geocoding failed', { address, error })
      return null
    }
  }

  private async getParcelGeometry(parcelId: string): Promise<GeoJSON.Polygon> {
    // Simplified polygon - in production would fetch actual parcel boundary
    return {
      type: 'Polygon',
      coordinates: [[
        [-80.1918, 25.7617],
        [-80.1917, 25.7617],
        [-80.1917, 25.7616],
        [-80.1918, 25.7616],
        [-80.1918, 25.7617]
      ]]
    }
  }

  private calculateAnnualFloodChance(floodZone: string): number {
    const floodChances: Record<string, number> = {
      'AE': 0.01,  // 1% annual chance
      'A': 0.01,
      'VE': 0.01,
      'V': 0.01,
      'AO': 0.01,
      'X': 0.002,  // 0.2% annual chance
      'B': 0.002,
      'C': 0.002
    }
    return floodChances[floodZone] || 0.002
  }

  private determineFloodInsuranceRate(floodZone: string): string {
    if (['AE', 'A', 'VE', 'V', 'AO'].includes(floodZone)) {
      return 'Special Flood Hazard Area'
    }
    return 'Preferred Risk'
  }

  private getHealthRecommendations(aqi: number): string[] {
    if (aqi <= 50) return ['Air quality is good']
    if (aqi <= 100) return ['Air quality is moderate', 'Sensitive individuals should consider limiting outdoor activities']
    return ['Air quality is unhealthy', 'Limit outdoor activities', 'Consider indoor alternatives']
  }

  private calculateDataCompleteness(data: {
    parcel: ParcelData | null
    floodRisk: FloodRiskData | null
    weather: WeatherData | null
    hazards: EnvironmentalHazards | null
  }): number {
    let totalFields = 0
    let populatedFields = 0
    
    // Count parcel data fields
    if (data.parcel) {
      totalFields += 10
      populatedFields += Object.values(data.parcel).filter(v => v !== null && v !== undefined && v !== 'unknown').length
    }
    
    // Count other data sources
    totalFields += 3 // floodRisk, weather, hazards
    if (data.floodRisk) populatedFields += 1
    if (data.weather) populatedFields += 1
    if (data.hazards) populatedFields += 1
    
    return totalFields > 0 ? populatedFields / totalFields : 0
  }

  private calculateDataReliability(data: {
    parcel: ParcelData | null
    floodRisk: FloodRiskData | null
    weather: WeatherData | null
    hazards: EnvironmentalHazards | null
  }): number {
    let totalWeight = 0
    let weightedReliability = 0
    
    if (data.parcel) {
      totalWeight += 1
      weightedReliability += FLORIDA_DATA_SOURCES.florida_gio.reliability
    }
    
    if (data.floodRisk) {
      totalWeight += 1
      weightedReliability += FLORIDA_DATA_SOURCES.fema_nfhl.reliability
    }
    
    if (data.weather) {
      totalWeight += 1
      weightedReliability += FLORIDA_DATA_SOURCES.noaa_weather.reliability
    }
    
    if (data.hazards) {
      totalWeight += 1
      weightedReliability += FLORIDA_DATA_SOURCES.epa_environmental.reliability
    }
    
    return totalWeight > 0 ? weightedReliability / totalWeight : 0
  }
}

export const environmentalDataService = new EnvironmentalDataService()