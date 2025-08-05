/**
 * @fileMetadata
 * @purpose Interface Definitions and Base Structures for AI-Powered Learning Features
 * @owner ai-team
 * @status active
 * @description Defines contracts for LLM synthesis, semantic matching, and AI suggestions
 * @notes These interfaces will be implemented by Opus for advanced AI capabilities
 */

import { SharedPattern } from './claude-shared-patterns'

/**
 * LLM-POWERED LEARNING SYNTHESIS INTERFACES
 */
export interface LLMSynthesisConfig {
  enabled: boolean
  provider: 'openai' | 'anthropic' | 'local'
  model: string
  temperature: number
  maxTokens: number
  apiKey?: string
  endpoint?: string
}

export interface MetaPattern {
  id: string
  name: string
  description: string
  derivedFrom: string[] // Learning IDs this pattern was synthesized from
  abstractionLevel: 'concrete' | 'abstract' | 'meta'
  commonalities: CommonalityAnalysis
  synthesis: string // Natural language synthesis
  confidence: number
  applicabilityScore: number
  timestamp: Date
}

export interface CommonalityAnalysis {
  sharedConcepts: string[]
  sharedMistakes: string[]
  sharedSolutions: string[]
  frequency: number
  categories: string[]
  contextSimilarity: number
}

export interface SynthesisRequest {
  learningIds: string[]
  minCommonality: number
  abstractionLevel?: 'concrete' | 'abstract' | 'meta'
  focusAreas?: string[]
  language?: string
}

export interface SynthesisResponse {
  success: boolean
  metaPatterns: MetaPattern[]
  insights: string[]
  recommendations: string[]
  processingTime: number
  tokensUsed?: number
}

/**
 * SEMANTIC SIMILARITY INTERFACES
 */
export interface SemanticEmbedding {
  id: string
  content: string
  embedding: number[]
  model: string
  timestamp: Date
}

export interface SimilaritySearchRequest {
  query: string
  threshold: number
  limit: number
  searchIn: ('learnings' | 'patterns' | 'both')[]
  filters?: {
    category?: string[]
    minConfidence?: number
    dateRange?: { from: Date; to: Date }
  }
}

export interface SimilarityMatch {
  id: string
  type: 'learning' | 'pattern'
  content: string
  similarity: number
  relevanceScore: number
  context: any
}

export interface SemanticIndex {
  learnings: Map<string, SemanticEmbedding>
  patterns: Map<string, SemanticEmbedding>
  lastUpdated: Date
  modelVersion: string
}

/**
 * NATURAL LANGUAGE DESCRIPTION INTERFACES
 */
export interface NLDescription {
  id: string
  targetId: string // Learning or Pattern ID
  targetType: 'learning' | 'pattern'
  shortDescription: string
  longDescription: string
  keyPoints: string[]
  useCases: string[]
  prerequisites: string[]
  outcomes: string[]
  language: string
  readabilityScore: number
}

export interface NLGenerationRequest {
  targetId: string
  targetType: 'learning' | 'pattern'
  style: 'technical' | 'simple' | 'executive'
  length: 'short' | 'medium' | 'long'
  includeExamples: boolean
  language?: string
}

export interface NLGenerationResponse {
  success: boolean
  description: NLDescription
  alternativeVersions?: NLDescription[]
  confidence: number
}

/**
 * AI-POWERED BOTTLENECK RESOLUTION INTERFACES
 */
export interface Bottleneck {
  id: string
  type: BottleneckType
  description: string
  impact: BottleneckImpact
  frequency: number
  affectedAreas: string[]
  detectedAt: Date
  status: 'active' | 'resolved' | 'mitigated'
}

export type BottleneckType = 
  | 'performance'
  | 'error_rate'
  | 'development_speed'
  | 'code_quality'
  | 'testing_coverage'
  | 'deployment_frequency'
  | 'knowledge_gap'

export interface BottleneckImpact {
  severity: 'low' | 'medium' | 'high' | 'critical'
  timeWasted: number // hours per week
  errorIncrease: number // percentage
  velocityReduction: number // percentage
  teamMorale: number // 1-10 scale
}

export interface ResolutionSuggestion {
  id: string
  bottleneckId: string
  title: string
  description: string
  steps: ResolutionStep[]
  estimatedImpact: {
    timeRecovery: number
    errorReduction: number
    confidenceLevel: number
  }
  requiredResources: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  automationPotential: number // 0-1 scale
}

export interface ResolutionStep {
  order: number
  action: string
  details: string
  automated: boolean
  toolsRequired: string[]
  estimatedTime: number // minutes
  verification: string
}

export interface BottleneckAnalysisRequest {
  timeframe: 'day' | 'week' | 'month'
  includeHistorical: boolean
  focusAreas?: string[]
  minSeverity?: 'low' | 'medium' | 'high'
}

export interface BottleneckAnalysisResponse {
  bottlenecks: Bottleneck[]
  suggestions: ResolutionSuggestion[]
  trends: {
    improving: string[]
    worsening: string[]
    stable: string[]
  }
  recommendedActions: string[]
}

/**
 * BASE ABSTRACT CLASSES FOR IMPLEMENTATION
 */
export abstract class AILearningService {
  protected config: LLMSynthesisConfig

  constructor(config: LLMSynthesisConfig) {
    this.config = config
  }

  // LLM Synthesis methods
  abstract synthesizeLearnings(request: SynthesisRequest): Promise<SynthesisResponse>
  abstract identifyMetaPatterns(learningIds: string[]): Promise<MetaPattern[]>
  abstract generateInsights(patterns: MetaPattern[]): Promise<string[]>

  // Semantic Similarity methods
  abstract createEmbedding(content: string): Promise<number[]>
  abstract findSimilar(request: SimilaritySearchRequest): Promise<SimilarityMatch[]>
  abstract updateSemanticIndex(): Promise<void>

  // Natural Language methods
  abstract generateDescription(request: NLGenerationRequest): Promise<NLGenerationResponse>
  abstract simplifyPattern(pattern: SharedPattern, style: string): Promise<string>
  abstract translateDescription(description: NLDescription, targetLanguage: string): Promise<NLDescription>

  // Bottleneck Resolution methods
  abstract analyzeBottlenecks(request: BottleneckAnalysisRequest): Promise<BottleneckAnalysisResponse>
  abstract generateResolutions(bottleneck: Bottleneck): Promise<ResolutionSuggestion[]>
  abstract prioritizeActions(suggestions: ResolutionSuggestion[]): Promise<ResolutionSuggestion[]>
}

/**
 * UTILITY TYPES FOR AI FEATURES
 */
export interface AIOperationMetrics {
  operationId: string
  operationType: string
  startTime: Date
  endTime?: Date
  tokensUsed?: number
  cost?: number
  success: boolean
  error?: string
}

export interface AIModelConfig {
  provider: string
  model: string
  version: string
  capabilities: string[]
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
  costPerToken: number
}

export interface AIFeatureFlags {
  llmSynthesisEnabled: boolean
  semanticSearchEnabled: boolean
  nlGenerationEnabled: boolean
  bottleneckAnalysisEnabled: boolean
  autoFixEnabled: boolean
  proactiveSuggestionsEnabled: boolean
}

/**
 * MOCK IMPLEMENTATIONS FOR TESTING
 */
export class MockAILearningService extends AILearningService {
  async synthesizeLearnings(request: SynthesisRequest): Promise<SynthesisResponse> {
    // Mock implementation
    return {
      success: true,
      metaPatterns: [],
      insights: ['Mock insight 1', 'Mock insight 2'],
      recommendations: ['Mock recommendation'],
      processingTime: 100
    }
  }

  async identifyMetaPatterns(learningIds: string[]): Promise<MetaPattern[]> {
    return []
  }

  async generateInsights(patterns: MetaPattern[]): Promise<string[]> {
    return ['Mock insight']
  }

  async createEmbedding(content: string): Promise<number[]> {
    // Return mock embedding
    return Array(768).fill(0).map(() => Math.random())
  }

  async findSimilar(request: SimilaritySearchRequest): Promise<SimilarityMatch[]> {
    return []
  }

  async updateSemanticIndex(): Promise<void> {
    // Mock update
  }

  async generateDescription(request: NLGenerationRequest): Promise<NLGenerationResponse> {
    return {
      success: true,
      description: {
        id: 'mock_desc_1',
        targetId: request.targetId,
        targetType: request.targetType,
        shortDescription: 'Mock short description',
        longDescription: 'Mock long description with more details',
        keyPoints: ['Point 1', 'Point 2'],
        useCases: ['Use case 1'],
        prerequisites: ['Prerequisite 1'],
        outcomes: ['Outcome 1'],
        language: 'en',
        readabilityScore: 8.5
      },
      confidence: 0.9
    }
  }

  async simplifyPattern(pattern: SharedPattern, style: string): Promise<string> {
    return `Simplified ${style} description of ${pattern.name}`
  }

  async translateDescription(description: NLDescription, targetLanguage: string): Promise<NLDescription> {
    return {
      ...description,
      language: targetLanguage,
      shortDescription: `[${targetLanguage}] ${description.shortDescription}`
    }
  }

  async analyzeBottlenecks(request: BottleneckAnalysisRequest): Promise<BottleneckAnalysisResponse> {
    return {
      bottlenecks: [],
      suggestions: [],
      trends: {
        improving: ['Performance'],
        worsening: ['Error rate'],
        stable: ['Development speed']
      },
      recommendedActions: ['Review error handling patterns']
    }
  }

  async generateResolutions(bottleneck: Bottleneck): Promise<ResolutionSuggestion[]> {
    return []
  }

  async prioritizeActions(suggestions: ResolutionSuggestion[]): Promise<ResolutionSuggestion[]> {
    return suggestions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
}

// Export all types
export type {
  LLMSynthesisConfig,
  MetaPattern,
  CommonalityAnalysis,
  SynthesisRequest,
  SynthesisResponse,
  SemanticEmbedding,
  SimilaritySearchRequest,
  SimilarityMatch,
  SemanticIndex,
  NLDescription,
  NLGenerationRequest,
  NLGenerationResponse,
  Bottleneck,
  BottleneckType,
  BottleneckImpact,
  ResolutionSuggestion,
  ResolutionStep,
  BottleneckAnalysisRequest,
  BottleneckAnalysisResponse,
  AIOperationMetrics,
  AIModelConfig,
  AIFeatureFlags
}