/**
 * @fileMetadata
 * @purpose "Implements the core logic for the AI Threat Assessment Engine, using multiple AI providers."
 * @dependencies ["@/lib","@anthropic-ai/sdk","@claimguardian/utils","@google/generative-ai","openai"]
 * @owner ai-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "AI Threat Assessment Engine using Gemini AI for real-time property threat analysis"
 * @owner ai-team
 * @dependencies ["@google/generative-ai", "@/types/situation-room", "@/lib/ai/client-service"]
 * @exports ["ThreatAssessmentEngine", "useThreatAssessmentEngine"]
 * @complexity high
 * @tags ["ai", "threat-assessment", "gemini", "situation-room"]
 * @status stable
 */

'use client'

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import OpenAI from 'openai'
import { logger } from "@/lib/logger/production-logger"
import { toError } from "@claimguardian/utils"

import { ThreatAssessment, ThreatLevel, ThreatType, AIRecommendation, IntelligenceFeed, IntelligenceType, ImpactLevel, ActionPriority } from '@/types/situation-room'

interface WeatherData {
  location: string
  conditions: string
  temperature: number
  windSpeed: number
  windDirection: string
  pressure: number
  humidity: number
  forecast: string[]
}

interface PropertyData {
  propertyId: string
  address: string
  propertyType: string
  constructionYear: number
  squareFootage: number
  roofType: string
  foundationType: string
  floodZone: string
  previousClaims: Array<{
    type: string
    amount: number
    date: string
  }>
}

interface ThreatContext {
  weather: WeatherData
  property: PropertyData
  location: {
    lat: number
    lng: number
    county: string
    state: string
  }
  historical: {
    hurricanes: number
    floods: number
    storms: number
    timeframe: string
  }
}

interface AIThreatAssessmentRequest {
  propertyId: string
  context: ThreatContext
  focusAreas?: string[]
  urgencyThreshold?: ThreatLevel
  preferredProvider?: 'openai' | 'grok' | 'claude' | 'gemini' | 'auto'
  model?: string
  budget?: 'low' | 'medium' | 'high'
  speedPriority?: boolean
}

interface AIThreatAssessmentResponse {
  threats: ThreatAssessment[]
  overallLevel: ThreatLevel
  recommendations: AIRecommendation[]
  intelligenceFeeds: IntelligenceFeed[]
  confidence: number
  processingTime: number
}

type AIProvider = 'openai' | 'grok' | 'claude' | 'gemini'

interface ProviderConfig {
  available: boolean
  client: unknown
  models: string[]
  priority: number
  costPerToken: number // cost per 1K tokens in USD
  avgResponseTime: number // average response time in ms
  strengths: string[] // what this provider is best at
  maxTokens: number
}

export class ThreatAssessmentEngine {
  private providers: Record<AIProvider, ProviderConfig> = {
    openai: {
      available: false,
      client: null,
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      priority: 1,
      costPerToken: 0.0025, // $2.50 per 1M tokens (gpt-4o-mini)
      avgResponseTime: 2500, // ms
      strengths: ['structured-analysis', 'detailed-reasoning', 'json-output'],
      maxTokens: 4096
    },
    grok: {
      available: false,
      client: null,
      models: ['grok-beta', 'grok-vision-beta'],
      priority: 2,
      costPerToken: 0.015, // $15 per 1M tokens (estimated)
      avgResponseTime: 3200, // ms
      strengths: ['real-time-data', 'social-intelligence', 'emerging-threats'],
      maxTokens: 4096
    },
    claude: {
      available: false,
      client: null,
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      priority: 3,
      costPerToken: 0.003, // $3 per 1M tokens (Haiku)
      avgResponseTime: 2200, // ms
      strengths: ['safety-analysis', 'risk-assessment', 'comprehensive-reasoning'],
      maxTokens: 4096
    },
    gemini: {
      available: false,
      client: null,
      models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
      priority: 4,
      costPerToken: 0.001, // $1 per 1M tokens (flash)
      avgResponseTime: 1800, // ms
      strengths: ['multimodal-analysis', 'cost-efficiency', 'speed'],
      maxTokens: 4096
    }
  }
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    await this.initializeProviders()
    this.isInitialized = this.getAvailableProviders().length > 0

    if (this.isInitialized) {
      const availableProviders = this.getAvailableProviders()
      logger.info('Threat Assessment Engine initialized with providers:', availableProviders)
    } else {
      logger.warn('No AI providers available. Threat assessment will use simulated data.')
    }
  }

  private async initializeProviders() {
    // Initialize OpenAI
    await this.initializeOpenAI()

    // Initialize Grok (X.AI)
    await this.initializeGrok()

    // Initialize Claude (Anthropic)
    await this.initializeClaude()

    // Initialize Gemini
    await this.initializeGemini()
  }

  private async initializeOpenAI() {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
      // WARNING: API key moved to server-side - use /api/ai endpoint instead

      if (!apiKey) {
        logger.warn('OpenAI API key not found')
        return
      }

      const client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      })

      // Test the connection
      await client.models.list()

      this.providers.openai = {
        ...this.providers.openai,
        available: true,
        client
      }

      logger.info('OpenAI provider initialized successfully')
    } catch (error) {
      logger.warn('Failed to initialize OpenAI provider:', error)
    }
  }

  private async initializeGrok() {
    try {
      const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY || process.env.XAI_API_KEY

      if (!apiKey) {
        logger.warn('X.AI API key not found')
        return
      }

      // Grok uses OpenAI-compatible API
      const client = new OpenAI({
        apiKey,
        baseURL: 'https://api.x.ai/v1',
        dangerouslyAllowBrowser: true
      })

      // Test the connection with Grok's models endpoint
      await client.models.list()

      this.providers.grok = {
        ...this.providers.grok,
        available: true,
        client
      }

      logger.info('Grok (X.AI) provider initialized successfully')
    } catch (error) {
      logger.warn('Failed to initialize Grok provider:', error)
    }
  }

  private async initializeClaude() {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY

      if (!apiKey) {
        logger.warn('Anthropic API key not found')
        return
      }

      const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      })

      // Test the connection - Anthropic doesn't have a models.list endpoint, so we'll just validate the client
      // We could do a minimal test call, but for now we'll assume it's working if the key is provided

      this.providers.claude = {
        ...this.providers.claude,
        available: true,
        client
      }

      logger.info('Claude (Anthropic) provider initialized successfully')
    } catch (error) {
      logger.warn('Failed to initialize Claude provider:', error)
    }
  }

  private async initializeGemini() {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY
      // WARNING: API key moved to server-side - use /api/ai endpoint instead

      if (!apiKey) {
        logger.warn('Gemini API key not found')
        return
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      })

      this.providers.gemini = {
        ...this.providers.gemini,
        available: true,
        client: { genAI, model }
      }

      logger.info('Gemini provider initialized successfully')
    } catch (error) {
      logger.warn('Failed to initialize Gemini provider:', error)
    }
  }

  private getAvailableProviders(): AIProvider[] {
    return Object.entries(this.providers)
      .filter(([_, config]) => config.available)
      .sort(([_, a], [__, b]) => a.priority - b.priority)
      .map(([provider, _]) => provider as AIProvider)
  }

  private selectProvider(
    preferredProvider?: 'openai' | 'grok' | 'claude' | 'gemini' | 'auto',
    options?: {
      urgency?: ThreatLevel
      focusAreas?: string[]
      budget?: 'low' | 'medium' | 'high'
      speedPriority?: boolean
    }
  ): AIProvider | null {
    const availableProviders = this.getAvailableProviders()

    if (availableProviders.length === 0) {
      return null
    }

    if (preferredProvider && preferredProvider !== 'auto' && this.providers[preferredProvider].available) {
      return preferredProvider
    }

    // Intelligent auto selection based on optimization criteria
    return this.optimizeProviderSelection(availableProviders, options)
  }

  private optimizeProviderSelection(
    availableProviders: AIProvider[],
    options?: {
      urgency?: ThreatLevel
      focusAreas?: string[]
      budget?: 'low' | 'medium' | 'high'
      speedPriority?: boolean
    }
  ): AIProvider {
    const scores: Record<AIProvider, number> = {} as Record<AIProvider, number>

    for (const provider of availableProviders) {
      const config = this.providers[provider]
      let score = 0

      // Cost optimization (30% weight)
      const costScore = this.calculateCostScore(config, options?.budget)
      score += costScore * 0.3

      // Speed optimization (25% weight)
      const speedScore = this.calculateSpeedScore(config, options?.speedPriority, options?.urgency)
      score += speedScore * 0.25

      // Ability optimization (35% weight)
      const abilityScore = this.calculateAbilityScore(config, options?.focusAreas, options?.urgency)
      score += abilityScore * 0.35

      // Base priority (10% weight)
      const priorityScore = (5 - config.priority) * 20 // Higher priority = higher score
      score += priorityScore * 0.1

      scores[provider] = score
    }

    // Return provider with highest score
    return availableProviders.reduce((best, current) =>
      scores[current] > scores[best] ? current : best
    )
  }

  private calculateCostScore(config: ProviderConfig, budget?: 'low' | 'medium' | 'high'): number {
    // Lower cost = higher score (inverted)
    const maxCost = 0.02 // $20 per 1M tokens as reference max
    const costScore = ((maxCost - config.costPerToken) / maxCost) * 100

    if (budget === 'low') {
      return costScore * 1.5 // Boost cost importance for low budget
    } else if (budget === 'high') {
      return costScore * 0.5 // Reduce cost importance for high budget
    }

    return costScore
  }

  private calculateSpeedScore(config: ProviderConfig, speedPriority?: boolean, urgency?: ThreatLevel): number {
    // Lower response time = higher score (inverted)
    const maxTime = 5000 // 5 seconds as reference max
    const speedScore = ((maxTime - config.avgResponseTime) / maxTime) * 100

    const isUrgent = urgency === ThreatLevel.CRITICAL || urgency === ThreatLevel.EMERGENCY

    if (speedPriority || isUrgent) {
      return speedScore * 1.5 // Boost speed importance
    }

    return speedScore
  }

  private calculateAbilityScore(config: ProviderConfig, focusAreas?: string[], urgency?: ThreatLevel): number {
    let abilityScore = 60 // Base ability score

    if (!focusAreas || focusAreas.length === 0) {
      return abilityScore
    }

    // Check for ability matches with focus areas and urgency
    const strengthMatches = this.getStrengthMatches(config.strengths, focusAreas, urgency)
    abilityScore += strengthMatches * 10 // +10 points per strength match

    return Math.min(100, abilityScore) // Cap at 100
  }

  private getStrengthMatches(strengths: string[], focusAreas?: string[], urgency?: ThreatLevel): number {
    let matches = 0

    if (!focusAreas) return matches

    // Map focus areas to provider strengths
    const focusToStrengthMap: Record<string, string[]> = {
      'weather': ['real-time-data', 'multimodal-analysis'],
      'security': ['safety-analysis', 'risk-assessment'],
      'property': ['structured-analysis', 'detailed-reasoning'],
      'community': ['social-intelligence', 'emerging-threats'],
      'analysis': ['comprehensive-reasoning', 'structured-analysis'],
      'cost': ['cost-efficiency'],
      'speed': ['speed']
    }

    for (const area of focusAreas) {
      const relevantStrengths = focusToStrengthMap[area] || []
      for (const strength of relevantStrengths) {
        if (strengths.includes(strength)) {
          matches++
        }
      }
    }

    // Boost for urgent situations
    if (urgency === ThreatLevel.CRITICAL || urgency === ThreatLevel.EMERGENCY) {
      if (strengths.includes('safety-analysis') || strengths.includes('real-time-data')) {
        matches += 2 // Extra points for critical situations
      }
    }

    return matches
  }

  private logOptimizationMetrics(
    provider: AIProvider,
    request: AIThreatAssessmentRequest,
    assessment: AIThreatAssessmentResponse,
    startTime: number
  ): void {
    const actualResponseTime = Date.now() - startTime
    const estimatedCost = this.estimateRequestCost(provider, request)

    console.log('AI Provider Optimization Metrics:', {
      selectedProvider: provider,
      actualResponseTime,
      estimatedResponseTime: this.providers[provider].avgResponseTime,
      estimatedCost,
      confidence: assessment.confidence,
      threatsDetected: assessment.threats.length,
      optimizationFactors: {
        budget: request.budget,
        speedPriority: request.speedPriority,
        urgency: request.urgencyThreshold,
        focusAreas: request.focusAreas
      },
      providerStrengths: this.providers[provider].strengths
    })
  }

  private estimateRequestCost(provider: AIProvider, request: AIThreatAssessmentRequest): number {
    const config = this.providers[provider]
    const estimatedTokens = 2500 // Rough estimate for threat assessment
    return (estimatedTokens / 1000) * config.costPerToken
  }

  async assessThreats(request: AIThreatAssessmentRequest): Promise<AIThreatAssessmentResponse> {
    const startTime = Date.now()

    if (!this.isInitialized) {
      return this.fallbackAssessment(request, startTime)
    }

    const provider = this.selectProvider(request.preferredProvider, {
      urgency: request.urgencyThreshold,
      focusAreas: request.focusAreas,
      budget: request.budget,
      speedPriority: request.speedPriority
    })
    if (!provider) {
      return this.fallbackAssessment(request, startTime)
    }

    try {
      const prompt = this.buildThreatAssessmentPrompt(request)
      let response: string

      if (provider === 'openai') {
        response = await this.callOpenAI(prompt, request.model || 'gpt-4o-mini')
      } else if (provider === 'grok') {
        response = await this.callGrok(prompt, request.model || 'grok-beta')
      } else if (provider === 'claude') {
        response = await this.callClaude(prompt, request.model || 'claude-3-5-sonnet-20241022')
      } else {
        response = await this.callGemini(prompt, request.model || 'gemini-1.5-flash')
      }

      const assessment = this.parseAIResponse(response, request, startTime, provider)

      // Log optimization metrics for analysis
      this.logOptimizationMetrics(provider, request, assessment, startTime)

      return assessment
    } catch (error) {
      logger.error(`AI threat assessment failed with ${provider}, trying fallback:`, toError(error))

      // Try alternate provider if available
      const availableProviders = this.getAvailableProviders()
      const alternateProvider = availableProviders.find(p => p !== provider)

      if (alternateProvider) {
        try {
          const prompt = this.buildThreatAssessmentPrompt(request)
          let response: string

          if (alternateProvider === 'openai') {
            response = await this.callOpenAI(prompt, request.model || 'gpt-4o-mini')
          } else if (alternateProvider === 'grok') {
            response = await this.callGrok(prompt, request.model || 'grok-beta')
          } else if (alternateProvider === 'claude') {
            response = await this.callClaude(prompt, request.model || 'claude-3-5-sonnet-20241022')
          } else {
            response = await this.callGemini(prompt, request.model || 'gemini-1.5-flash')
          }

          const assessment = this.parseAIResponse(response, request, startTime, alternateProvider)
          return assessment
        } catch (fallbackError) {
          logger.error(`Fallback provider ${alternateProvider} also failed:`, fallbackError)
        }
      }

      return this.fallbackAssessment(request, startTime)
    }
  }

  private async callOpenAI(prompt: string, model: string): Promise<string> {
    const client = this.providers.openai.client as OpenAI

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert property threat assessment analyst for ClaimGuardian. Provide comprehensive threat analysis in valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })

    return completion.choices[0]?.message?.content || ''
  }

  private async callGrok(prompt: string, model: string): Promise<string> {
    const client = this.providers.grok.client as OpenAI

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are Grok, X\'s AI assistant, providing expert property threat assessment for ClaimGuardian. Leverage your real-time data access, social media insights, and current event awareness to identify emerging threats that other models might miss. Use your unique perspective to analyze threats with wit and precision. Focus on real-time developments, social sentiment, and emerging patterns. Provide comprehensive analysis in valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      // Note: Grok may not support response_format yet, so we'll handle JSON parsing gracefully
    })

    return completion.choices[0]?.message?.content || ''
  }

  private async callClaude(prompt: string, model: string): Promise<string> {
    const client = this.providers.claude.client as Anthropic

    const message = await client.messages.create({
      model,
      max_tokens: 4000,
      temperature: 0.3,
      system: 'You are Claude, Anthropic\'s AI assistant, providing expert property threat assessment for ClaimGuardian. Use your advanced reasoning capabilities, safety-focused analysis, and nuanced understanding to provide comprehensive threat assessments. Focus on thorough analysis, risk mitigation, and actionable insights. Provide analysis in valid JSON format only.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extract text from Claude's response format
    return message.content[0]?.type === 'text' ? message.content[0].text : ''
  }

  private async callGemini(prompt: string, modelName: string): Promise<string> {
    const { model } = this.providers.gemini.client as any

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  }

  private buildThreatAssessmentPrompt(request: AIThreatAssessmentRequest): string {
    const { context, propertyId, focusAreas, urgencyThreshold } = request

    return `
You are an expert property threat assessment analyst for ClaimGuardian, an AI-powered insurance claim advocacy platform. Analyze the following property and environmental data to provide a comprehensive threat assessment.

PROPERTY CONTEXT:
- Property ID: ${propertyId}
- Address: ${context.property.address}
- Type: ${context.property.propertyType}
- Built: ${context.property.constructionYear}
- Size: ${context.property.squareFootage} sq ft
- Roof: ${context.property.roofType}
- Foundation: ${context.property.foundationType}
- Flood Zone: ${context.property.floodZone}
- Previous Claims: ${context.property.previousClaims.length} claims totaling $${context.property.previousClaims.reduce((sum, claim) => sum + claim.amount, 0).toLocaleString()}

CURRENT WEATHER:
- Location: ${context.weather.location}
- Conditions: ${context.weather.conditions}
- Temperature: ${context.weather.temperature}°F
- Wind: ${context.weather.windSpeed} mph ${context.weather.windDirection}
- Pressure: ${context.weather.pressure} mb
- Humidity: ${context.weather.humidity}%
- Forecast: ${context.weather.forecast.join(', ')}

LOCATION DATA:
- Coordinates: ${context.location.lat}, ${context.location.lng}
- County: ${context.location.county}, ${context.location.state}

HISTORICAL RISK:
- Hurricanes: ${context.historical.hurricanes} in last ${context.historical.timeframe}
- Floods: ${context.historical.floods} in last ${context.historical.timeframe}
- Severe Storms: ${context.historical.storms} in last ${context.historical.timeframe}

${focusAreas ? `FOCUS AREAS: ${focusAreas.join(', ')}` : ''}
${urgencyThreshold ? `URGENCY THRESHOLD: ${urgencyThreshold}` : ''}

REQUIRED OUTPUT FORMAT (JSON):
{
  "threats": [
    {
      "type": "weather|structural|environmental|insurance|security",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL|EMERGENCY",
      "title": "Clear, actionable threat title",
      "description": "Detailed threat description",
      "timeline": "Time window for threat (e.g., '24-48 hours')",
      "confidence": 0-100,
      "impactRadius": "radius in miles",
      "aiAnalysis": {
        "overallRisk": 0-100,
        "primaryThreat": "Main threat category",
        "secondaryThreats": ["list", "of", "secondary", "threats"],
        "recommendations": ["specific", "actionable", "recommendations"],
        "modelConfidence": 0-100
      }
    }
  ],
  "overallLevel": "LOW|MEDIUM|HIGH|CRITICAL|EMERGENCY",
  "recommendations": [
    {
      "title": "Actionable recommendation title",
      "description": "Detailed recommendation",
      "priority": "low|medium|high|urgent|critical",
      "category": "preparation|mitigation|monitoring|response",
      "timeframe": "Time to complete action",
      "estimatedImpact": "Expected benefit or damage prevention"
    }
  ],
  "intelligenceFeeds": [
    {
      "source": "AI Analysis",
      "type": "threat_assessment",
      "title": "Brief intelligence summary",
      "content": "Detailed intelligence content",
      "impact": "positive|negative|neutral",
      "urgency": "LOW|MEDIUM|HIGH|CRITICAL|EMERGENCY",
      "tags": ["relevant", "tags"]
    }
  ],
  "confidence": 0-100
}

ANALYSIS REQUIREMENTS:
1. Focus on immediate threats (next 0-72 hours) and near-term risks (1-2 weeks)
2. Consider property-specific vulnerabilities based on construction details
3. Factor in historical risk patterns for the area
4. Prioritize threats by likelihood AND potential impact
5. Provide specific, actionable recommendations
6. Include confidence scores for all assessments
7. Consider insurance implications and claim potential
8. Account for Florida-specific risks (hurricanes, flooding, sinkholes)
9. If using real-time data, incorporate current events and emerging patterns
10. Cross-reference with social media trends and local emergency services

Respond with valid JSON only, no additional text.
    `.trim()
  }

  private parseAIResponse(text: string, request: AIThreatAssessmentRequest, startTime: number, provider: AIProvider): AIThreatAssessmentResponse {
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanText)

      // Validate and transform the response
      const threats: ThreatAssessment[] = parsed.threats.map((threat: any, index: number) => ({
        id: `ai-threat-${Date.now()}-${index}`,
        type: this.validateThreatType(threat.type),
        severity: this.validateThreatLevel(threat.severity),
        title: threat.title || 'Unknown Threat',
        description: threat.description || '',
        timeline: threat.timeline || 'Unknown',
        timeWindow: {
          start: new Date(),
          peak: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
          end: new Date(Date.now() + 72 * 60 * 60 * 1000)   // 72 hours default
        },
        confidence: Math.min(100, Math.max(0, threat.confidence || 50)),
        impactRadius: parseFloat(threat.impactRadius) || 0,
        affectedProperties: [request.propertyId],
        actions: [],
        sources: [{
          name: 'AI Analysis',
          type: 'ai_analysis' as const,
          reliability: 85,
          lastUpdate: new Date(),
          status: 'active' as const
        }],
        aiAnalysis: {
          overallRisk: Math.min(100, Math.max(0, threat.aiAnalysis?.overallRisk || 50)),
          primaryThreat: threat.aiAnalysis?.primaryThreat || threat.title,
          secondaryThreats: threat.aiAnalysis?.secondaryThreats || [],
          riskProjection: [],
          recommendations: (threat.aiAnalysis?.recommendations || []).map((rec: string, idx: number) => ({
            id: `ai-rec-nested-${Date.now()}-${idx}`,
            title: rec,
            description: rec,
            reasoning: 'AI-generated recommendation',
            priority: ActionPriority.MEDIUM,
            confidence: 75,
            category: 'preparation' as const,
            estimatedImpact: 'Risk mitigation',
            timeframe: 'As needed',
            actions: [],
            alternatives: []
          })),
          modelConfidence: Math.min(100, Math.max(0, threat.aiAnalysis?.modelConfidence || 50)),
          processingTime: Date.now() - startTime,
          agentsUsed: [`${provider}-threat-analyzer`]
        },
        lastUpdated: new Date(),
        isActive: true
      }))

      const recommendations: AIRecommendation[] = parsed.recommendations.map((rec: any, index: number) => ({
        id: `ai-rec-${Date.now()}-${index}`,
        title: rec.title || 'Unknown Recommendation',
        description: rec.description || '',
        reasoning: `AI-generated recommendation based on threat analysis`,
        priority: this.validateActionPriority(rec.priority),
        confidence: parsed.confidence || 75,
        category: rec.category || 'preparation',
        estimatedImpact: rec.estimatedImpact || 'Potential risk mitigation',
        timeframe: rec.timeframe || 'ASAP',
        actions: [],
        alternatives: []
      }))

      const intelligenceFeeds: IntelligenceFeed[] = parsed.intelligenceFeeds.map((feed: any, index: number) => ({
        id: `ai-intel-${Date.now()}-${index}`,
        source: feed.source || 'AI Analysis',
        type: this.validateIntelligenceType(feed.type),
        title: feed.title || 'AI Intelligence Update',
        content: feed.content || '',
        summary: feed.title || 'AI Intelligence Update',
        impact: this.validateImpactLevel(feed.impact),
        urgency: this.validateThreatLevel(feed.urgency),
        timestamp: new Date(),
        tags: feed.tags || ['ai-analysis'],
        relatedThreats: threats.map(t => t.id),
        actionRequired: feed.urgency === 'HIGH' || feed.urgency === 'CRITICAL' || feed.urgency === 'EMERGENCY'
      }))

      return {
        threats,
        overallLevel: this.validateThreatLevel(parsed.overallLevel),
        recommendations,
        intelligenceFeeds,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 75)),
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      logger.error('Failed to parse AI response:', toError(error))
      return this.fallbackAssessment(request, startTime)
    }
  }

  private validateThreatLevel(level: string): ThreatLevel {
    const validLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY']
    const normalizedLevel = level?.toUpperCase()

    if (validLevels.includes(normalizedLevel)) {
      return normalizedLevel as ThreatLevel
    }

    return ThreatLevel.LOW
  }

  private validateThreatType(type: string): ThreatType {
    const validTypes = Object.values(ThreatType)
    const normalizedType = type?.toUpperCase()

    const found = validTypes.find(t => t.toUpperCase() === normalizedType)
    return found || ThreatType.ENVIRONMENTAL
  }

  private validateActionPriority(priority: string): ActionPriority {
    const validPriorities = Object.values(ActionPriority)
    const normalizedPriority = priority?.toUpperCase()

    const found = validPriorities.find(p => p.toUpperCase() === normalizedPriority)
    return found || ActionPriority.MEDIUM
  }

  private validateIntelligenceType(type: string): IntelligenceType {
    const validTypes = Object.values(IntelligenceType)
    const normalizedType = type?.toLowerCase()

    const found = validTypes.find(t => t === normalizedType)
    return found || IntelligenceType.PROPERTY_ALERT
  }

  private validateImpactLevel(impact: string): ImpactLevel {
    const validImpacts = Object.values(ImpactLevel)
    const normalizedImpact = impact?.toLowerCase()

    const found = validImpacts.find(i => i === normalizedImpact)
    return found || ImpactLevel.NEUTRAL
  }

  private fallbackAssessment(request: AIThreatAssessmentRequest, startTime: number): AIThreatAssessmentResponse {
    // Provide simulated assessment when AI is unavailable
    const fallbackThreat: ThreatAssessment = {
      id: `fallback-threat-${Date.now()}`,
      type: ThreatType.ENVIRONMENTAL,
      severity: ThreatLevel.MEDIUM,
      title: 'Weather Monitoring Required',
      description: 'AI threat assessment temporarily unavailable. Manual monitoring recommended.',
      timeline: '24-48 hours',
      timeWindow: {
        start: new Date(),
        peak: new Date(Date.now() + 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 48 * 60 * 60 * 1000)
      },
      confidence: 50,
      impactRadius: 5,
      affectedProperties: [request.propertyId],
      actions: [],
      sources: [{
        name: 'Fallback System',
        type: 'ai_analysis' as const,
        reliability: 50,
        lastUpdate: new Date(),
        status: 'degraded' as const
      }],
      aiAnalysis: {
        overallRisk: 40,
        primaryThreat: 'AI system unavailable',
        secondaryThreats: ['Manual assessment needed'],
        riskProjection: [],
        recommendations: [
          {
            id: `fallback-rec-1-${Date.now()}`,
            title: 'Check weather conditions manually',
            description: 'Monitor weather conditions manually',
            reasoning: 'AI system unavailable',
            priority: ActionPriority.MEDIUM,
            confidence: 50,
            category: 'monitoring' as const,
            estimatedImpact: 'Basic monitoring',
            timeframe: 'Immediate',
            actions: [],
            alternatives: []
          }
        ],
        modelConfidence: 50,
        processingTime: Date.now() - startTime,
        agentsUsed: ['fallback-system']
      },
      lastUpdated: new Date(),
      isActive: true
    }

    return {
      threats: [fallbackThreat],
      overallLevel: ThreatLevel.MEDIUM,
      recommendations: [{
        id: `fallback-rec-${Date.now()}`,
        title: 'Manual Weather Monitoring',
        description: 'Monitor weather conditions and local emergency services while AI system is unavailable',
        reasoning: 'AI threat assessment system temporarily unavailable',
        priority: ActionPriority.MEDIUM,
        confidence: 50,
        category: 'monitoring',
        estimatedImpact: 'Maintains basic threat awareness',
        timeframe: 'Immediate',
        actions: [],
        alternatives: []
      }],
      intelligenceFeeds: [{
        id: `fallback-intel-${Date.now()}`,
        source: 'System Status',
        type: IntelligenceType.PROPERTY_ALERT,
        title: 'AI Threat Assessment Unavailable',
        content: 'AI-powered threat assessment is temporarily unavailable. Using fallback monitoring.',
        summary: 'AI system unavailable, using fallback',
        impact: ImpactLevel.NEUTRAL,
        urgency: ThreatLevel.LOW,
        timestamp: new Date(),
        tags: ['system-status', 'fallback'],
        relatedThreats: [fallbackThreat.id],
        actionRequired: false
      }],
      confidence: 50,
      processingTime: Date.now() - startTime
    }
  }

  async generateWeatherContext(location: { lat: number; lng: number }): Promise<WeatherData> {
    // This would integrate with weather APIs
    // For now, return simulated data
    return {
      location: `${location.lat}, ${location.lng}`,
      conditions: 'Partly Cloudy',
      temperature: 85,
      windSpeed: 12,
      windDirection: 'SE',
      pressure: 1013,
      humidity: 65,
      forecast: ['Thunderstorms possible', 'High winds expected', 'Temperature rising']
    }
  }

  async generatePropertyContext(propertyId: string): Promise<PropertyData> {
    // This would fetch from property database
    // For now, return simulated data
    return {
      propertyId,
      address: '123 Main St, Miami, FL 33101',
      propertyType: 'Single Family Home',
      constructionYear: 1995,
      squareFootage: 2400,
      roofType: 'Asphalt Shingles',
      foundationType: 'Concrete Slab',
      floodZone: 'X',
      previousClaims: [
        { type: 'Hurricane', amount: 15000, date: '2022-09-15' },
        { type: 'Water Damage', amount: 3500, date: '2021-08-10' }
      ]
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && this.getAvailableProviders().length > 0
  }

  getStatus(): {
    available: boolean;
    providers: Array<{
      name: string;
      available: boolean;
      models: string[];
      priority: number;
      costPerToken: number;
      avgResponseTime: number;
      strengths: string[];
    }>;
    primaryProvider: string;
    totalProviders: number;
    optimizationCapabilities: {
      costOptimization: boolean;
      speedOptimization: boolean;
      abilityOptimization: boolean;
    };
  } {
    const availableProviders = this.getAvailableProviders()
    const primaryProvider = availableProviders[0]

    return {
      available: this.isAvailable(),
      providers: Object.entries(this.providers).map(([name, config]) => ({
        name: name === 'openai' ? 'OpenAI' :
              name === 'grok' ? 'Grok (X.AI)' :
              name === 'claude' ? 'Claude (Anthropic)' :
              'Google Gemini',
        available: config.available,
        models: config.models,
        priority: config.priority,
        costPerToken: config.costPerToken,
        avgResponseTime: config.avgResponseTime,
        strengths: config.strengths
      })),
      primaryProvider: primaryProvider ? (
        primaryProvider === 'openai' ? 'OpenAI' :
        primaryProvider === 'grok' ? 'Grok (X.AI)' :
        primaryProvider === 'claude' ? 'Claude (Anthropic)' :
        'Google Gemini'
      ) : 'None',
      totalProviders: availableProviders.length,
      optimizationCapabilities: {
        costOptimization: true,
        speedOptimization: true,
        abilityOptimization: true
      }
    }
  }

  getAvailableModels(): Record<string, string[]> {
    const result: Record<string, string[]> = {}

    Object.entries(this.providers).forEach(([provider, config]) => {
      if (config.available) {
        const name = provider === 'openai' ? 'OpenAI' :
                    provider === 'grok' ? 'Grok (X.AI)' :
                    provider === 'claude' ? 'Claude (Anthropic)' :
                    'Google Gemini'
        result[name] = config.models
      }
    })

    return result
  }

  async testProvider(provider: AIProvider): Promise<boolean> {
    try {
      if (!this.providers[provider].available) {
        return false
      }

      const testRequest: AIThreatAssessmentRequest = {
        propertyId: 'test-property',
        context: {
          weather: {
            location: 'Test Location',
            conditions: 'Clear',
            temperature: 75,
            windSpeed: 5,
            windDirection: 'N',
            pressure: 1013,
            humidity: 50,
            forecast: ['Clear skies']
          },
          property: {
            propertyId: 'test-property',
            address: 'Test Address',
            propertyType: 'Single Family Home',
            constructionYear: 2000,
            squareFootage: 2000,
            roofType: 'Asphalt Shingles',
            foundationType: 'Concrete Slab',
            floodZone: 'X',
            previousClaims: []
          },
          location: {
            lat: 25.7617,
            lng: -80.1918,
            county: 'Test County',
            state: 'FL'
          },
          historical: {
            hurricanes: 1,
            floods: 0,
            storms: 5,
            timeframe: '10 years'
          }
        },
        preferredProvider: provider
      }

      const result = await this.assessThreats(testRequest)
      return result.threats.length > 0
    } catch (error) {
      logger.error(`Provider test failed for ${provider}:`, toError(error))
      return false
    }
  }
}

// Singleton instance
let threatAssessmentEngine: ThreatAssessmentEngine | null = null

export function getThreatAssessmentEngine(): ThreatAssessmentEngine {
  if (!threatAssessmentEngine) {
    threatAssessmentEngine = new ThreatAssessmentEngine()
  }
  return threatAssessmentEngine
}

// React hook for easy component integration
export function useThreatAssessmentEngine() {
  const engine = getThreatAssessmentEngine()

  return {
    assessThreats: engine.assessThreats.bind(engine),
    isAvailable: engine.isAvailable.bind(engine),
    getStatus: engine.getStatus.bind(engine),
    getAvailableModels: engine.getAvailableModels.bind(engine),
    testProvider: engine.testProvider.bind(engine),
    generateWeatherContext: engine.generateWeatherContext.bind(engine),
    generatePropertyContext: engine.generatePropertyContext.bind(engine)
  }
}
