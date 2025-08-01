/**
 * @fileMetadata
 * @purpose AI-powered spatial data processing and analysis service
 * @owner ai-team
 * @status active
 */

import { BaseAIProvider } from '../providers/base.provider'
import { GeminiProvider } from '../providers/gemini.provider'
import { OpenAIProvider } from '../providers/openai.provider'
import type { AIRequest, AIResponse } from '../types'

export interface PropertyEmbedding {
  spatial: number[]
  risk: number[]
  visual: number[]
  structural: number[]
}

export interface SpatialAnalysisResult {
  propertyId: string
  embeddings: PropertyEmbedding
  riskScores: Record<string, number>
  marketAnalysis: Record<string, unknown>
  damageSusceptibility: Record<string, number>
  confidence: number
}

export interface ImageAnalysisResult {
  detectedObjects: Array<{
    class: string
    confidence: number
    bbox: [number, number, number, number]
    embedding: number[]
  }>
  damageAssessment: {
    overall_condition: string
    damage_categories: Record<string, number>
    estimated_repair_cost: number
    urgency_level: string
  }
  materialDetection: Record<string, number>
  qualityMetrics: {
    technical_quality: number
    coverage_completeness: number
    lighting_adequacy: number
  }
}

export interface Environmental3DAnalysis {
  floodRisk: {
    baseFloodElevation: number
    propertyElevation: number
    floodDepthRisk: number
    drainageAnalysis: Record<string, unknown>
  }
  windRisk: {
    exposureCategory: string
    terrainRoughness: number
    windBorneDebrisRisk: number
    structuralVulnerability: number
  }
  accessibilityAnalysis: {
    emergencyAccess: number
    evacuationRoutes: Array<{
      route: string
      travelTime: number
      reliability: number
    }>
  }
}

export class SpatialAIService {
  private aiProvider: BaseAIProvider
  private embeddingProvider: BaseAIProvider

  constructor() {
    // Initialize AI providers with fallback
    if (process.env.GEMINI_API_KEY) {
      this.aiProvider = new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY })
      this.embeddingProvider = this.aiProvider
    } else if (process.env.OPENAI_API_KEY) {
      this.aiProvider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY })
      this.embeddingProvider = this.aiProvider
    } else {
      throw new Error('No AI provider available for spatial analysis')
    }
  }

  /**
   * Generate comprehensive property embeddings from multiple data sources
   */
  async generatePropertyEmbeddings(propertyData: {
    parcelData: Record<string, unknown>
    buildingData?: Record<string, unknown>
    environmentalData?: Record<string, unknown>
    historicalData?: Record<string, unknown>
    imageryData?: Record<string, unknown>
  }): Promise<PropertyEmbedding> {
    
    // Create comprehensive text representation for embedding
    const spatialText = this.buildSpatialDescription(propertyData)
    const riskText = this.buildRiskDescription(propertyData)
    const visualText = this.buildVisualDescription(propertyData)
    const structuralText = this.buildStructuralDescription(propertyData)

    const [spatialEmbedding, riskEmbedding, visualEmbedding, structuralEmbedding] = 
      await Promise.all([
        this.generateEmbedding(spatialText),
        this.generateEmbedding(riskText),
        this.generateEmbedding(visualText),
        this.generateEmbedding(structuralText)
      ])

    return {
      spatial: spatialEmbedding,
      risk: riskEmbedding,
      visual: visualEmbedding,
      structural: structuralEmbedding
    }
  }

  /**
   * Analyze property images using AI for damage detection and classification
   */
  async analyzePropertyImagery(imageUrls: string[], propertyContext: Record<string, unknown>): Promise<ImageAnalysisResult> {
    const analysisPrompt = `Analyze these property images for insurance claim assessment:

Property Context: ${JSON.stringify(propertyContext, null, 2)}

For each image, identify:
1. Structural elements (roof, walls, foundation, windows, doors)
2. Building materials (siding, roofing, trim)
3. Damage indicators (cracks, stains, missing materials, deformation)
4. Environmental factors (vegetation, drainage, proximity hazards)
5. Overall property condition

Provide detailed damage assessment with:
- Damage categories and severity (0-1 scale)
- Estimated repair costs
- Urgency level (immediate, high, medium, low)
- Detected objects with confidence scores

Return structured JSON response.`

    const response = await this.aiProvider.generateText({
      prompt: analysisPrompt,
      userId: 'system',
      feature: 'damage-analyzer',
      maxTokens: 2000,
      temperature: 0.1
    })

    try {
      const analysis = JSON.parse(response.text)
      
      // Enhance with embeddings for each detected object
      for (const object of analysis.detectedObjects || []) {
        object.embedding = await this.generateEmbedding(
          `${object.class} with ${object.confidence} confidence in property insurance context`
        )
      }

      return analysis
    } catch (error) {
      throw new Error(`Failed to parse image analysis: ${error}`)
    }
  }

  /**
   * Perform comprehensive environmental analysis using 3D data and GIS layers
   */
  async analyzeEnvironmental3D(propertyId: string, gisData: {
    elevation: Record<string, unknown>
    floodZones: Record<string, unknown>
    stormSurge: Record<string, unknown>
    infrastructure: Record<string, unknown>
    model3D?: Record<string, unknown>
  }): Promise<Environmental3DAnalysis> {

    const analysisPrompt = `Perform comprehensive environmental risk analysis for property:

Property ID: ${propertyId}
GIS Data: ${JSON.stringify(gisData, null, 2)}

Analyze:
1. Flood Risk Assessment:
   - Base flood elevation vs property elevation
   - Drainage patterns and stormwater management
   - Historical flood impacts
   - Future flood projections with climate change

2. Wind Risk Assessment:
   - Exposure category based on surrounding terrain
   - Wind-borne debris potential
   - Structural vulnerability to wind loads
   - Topographical wind effects

3. Accessibility Analysis:
   - Emergency vehicle access
   - Evacuation route analysis
   - Infrastructure dependency risks
   - Utility service reliability

Provide quantitative risk scores (0-1) and specific recommendations.
Return structured JSON with detailed analysis.`

    const response = await this.aiProvider.generateText({
      prompt: analysisPrompt,
      userId: 'system',
      feature: 'max', // Use most powerful model for complex analysis
      maxTokens: 2500,
      temperature: 0.1
    })

    try {
      return JSON.parse(response.text)
    } catch (error) {
      throw new Error(`Failed to parse environmental analysis: ${error}`)
    }
  }

  /**
   * Generate property risk assessment using multi-modal AI analysis
   */
  async generateRiskAssessment(propertyData: {
    digitalTwin: Record<string, unknown>
    imagery: Array<Record<string, unknown>>
    environmental: Record<string, unknown>
    historical: Record<string, unknown>
  }): Promise<SpatialAnalysisResult> {

    // Generate embeddings
    const embeddings = await this.generatePropertyEmbeddings({
      parcelData: propertyData.digitalTwin,
      environmentalData: propertyData.environmental,
      historicalData: propertyData.historical,
      imageryData: { imageCount: propertyData.imagery.length }
    })

    // Comprehensive risk analysis
    const riskPrompt = `Comprehensive property risk assessment:

Property Data: ${JSON.stringify(propertyData.digitalTwin, null, 2)}
Environmental Factors: ${JSON.stringify(propertyData.environmental, null, 2)}
Historical Claims: ${JSON.stringify(propertyData.historical, null, 2)}
Available Imagery: ${propertyData.imagery.length} images

Perform multi-hazard risk assessment covering:
1. Natural Disasters: Flood, wind, hail, wildfire, earthquake
2. Structural Risks: Foundation, roof, electrical, plumbing
3. Environmental: Soil conditions, drainage, vegetation
4. External: Crime, traffic, industrial hazards

For each risk category, provide:
- Risk score (0-1, where 1 is highest risk)
- Contributing factors
- Mitigation recommendations
- Cost impact estimates

Market Analysis:
- Property value estimation
- Market comparables consideration
- Risk-adjusted valuation
- Insurance implications

Damage Susceptibility:
- Most vulnerable building components
- Failure modes and probabilities
- Cascade effect analysis

Return structured JSON with confidence scores.`

    const response = await this.aiProvider.generateText({
      prompt: riskPrompt,
      userId: 'system',
      feature: 'max',
      maxTokens: 3000,
      temperature: 0.1
    })

    try {
      const analysis = JSON.parse(response.text)
      
      return {
        propertyId: propertyData.digitalTwin.property_id as string,
        embeddings,
        riskScores: analysis.riskScores || {},
        marketAnalysis: analysis.marketAnalysis || {},
        damageSusceptibility: analysis.damageSusceptibility || {},
        confidence: analysis.confidence || 0.8
      }
    } catch (error) {
      throw new Error(`Failed to parse risk assessment: ${error}`)
    }
  }

  /**
   * Find similar properties using embedding similarity
   */
  async findSimilarProperties(
    targetEmbedding: number[], 
    threshold: number = 0.8,
    maxResults: number = 10
  ): Promise<Array<{ propertyId: string; similarity: number; features: Record<string, unknown> }>> {
    
    // This would typically query the database using vector similarity
    // For now, return mock data structure
    const prompt = `Based on property embedding similarity analysis, identify key characteristics that make properties comparable for insurance risk assessment purposes.

Target embedding represents a property with specific risk and spatial characteristics.

Provide structured analysis of:
1. Key similarity factors for insurance purposes
2. Risk correlation patterns
3. Market value correlation factors
4. Geographic clustering significance

Return insights about property similarity matching for insurance applications.`

    const response = await this.aiProvider.generateText({
      prompt,
      userId: 'system',
      feature: 'generic',
      maxTokens: 1000,
      temperature: 0.2
    })

    // In production, this would query the database with vector similarity
    // and return actual similar properties
    return []
  }

  /**
   * Generate text embedding using AI provider
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // For now, return a mock embedding of the expected size
      // In production, this would use the AI provider's embedding capability
      return new Array(512).fill(0).map(() => Math.random() - 0.5)
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error}`)
    }
  }

  /**
   * Build spatial description for embedding
   */
  private buildSpatialDescription(propertyData: { parcelData: Record<string, unknown> }): string {
    const parcel = propertyData.parcelData
    return `Property located at ${parcel.property_address}. 
            ${parcel.lot_size_sqft} sqft lot, ${parcel.square_footage} building sqft.
            Zoned ${parcel.zoning_code}, ${parcel.property_type} property type.
            County: ${parcel.county_name}, built in ${parcel.year_built}.
            Property value: $${parcel.property_value}, building value: $${parcel.building_value}.`
  }

  /**
   * Build risk description for embedding
   */
  private buildRiskDescription(propertyData: { 
    parcelData: Record<string, unknown>
    environmentalData?: Record<string, unknown>
  }): string {
    const parcel = propertyData.parcelData
    const env = propertyData.environmentalData || {}
    
    return `Risk profile for ${parcel.property_type} property.
            Age: ${new Date().getFullYear() - (parcel.year_built as number)} years old.
            Construction: ${env.construction_type || 'unknown'}.
            Flood zone: ${env.flood_zone || 'unknown'}.
            Storm surge risk: ${env.storm_surge_zone || 'unknown'}.
            Environmental hazards: ${JSON.stringify(env.hazards || {})}.`
  }

  /**
   * Build visual description for embedding
   */
  private buildVisualDescription(propertyData: { 
    parcelData: Record<string, unknown>
    imageryData?: Record<string, unknown>
  }): string {
    const parcel = propertyData.parcelData
    const imagery = propertyData.imageryData || {}
    
    return `Visual characteristics: ${parcel.stories} story ${parcel.property_type}.
            Exterior materials: ${parcel.exterior_materials || 'unknown'}.
            Roof type: ${parcel.roof_type || 'unknown'}.
            ${imagery.imageCount || 0} reference images available.
            Landscaping: ${parcel.landscaping_type || 'unknown'}.`
  }

  /**
   * Build structural description for embedding
   */
  private buildStructuralDescription(propertyData: { 
    parcelData: Record<string, unknown>
    buildingData?: Record<string, unknown>
  }): string {
    const parcel = propertyData.parcelData
    const building = propertyData.buildingData || {}
    
    return `Structural details: ${building.construction_type || 'unknown'} construction.
            Foundation: ${building.foundation_type || 'unknown'}.
            ${parcel.bedrooms} bedrooms, ${parcel.bathrooms} bathrooms.
            HVAC: ${building.hvac_type || 'unknown'}.
            Electrical: ${building.electrical_age || 'unknown'} years old.
            Plumbing: ${building.plumbing_age || 'unknown'} years old.`
  }
}

export const spatialAIService = new SpatialAIService()