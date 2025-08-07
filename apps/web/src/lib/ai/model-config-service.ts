/**
 * @fileMetadata
 * @purpose "AI Model Configuration Service - fetches admin-selected models for each feature"
 * @dependencies []
 * @owner ai-team
 * @status stable
 */

'use client'

interface FeatureModelMapping {
  featureId: string
  featureName: string
  currentModel: string
  fallbackModel: string
  category: 'analysis' | 'generation' | 'vision' | 'reasoning'
}

interface ModelConfig {
  featureMappings: FeatureModelMapping[]
  lastUpdated: string
}

interface ModelPerformanceData {
  requests: number
  cost: number
  avgTime: number
  successRate: number
  lastUsed: string
}

class AIModelConfigService {
  private configCache: ModelConfig | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get the current model configuration for a specific feature
   */
  async getModelForFeature(featureId: string): Promise<{ model: string; fallback: string } | null> {
    try {
      const config = await this.getConfig()
      const mapping = config.featureMappings.find(m => m.featureId === featureId)

      if (!mapping) {
        console.warn(`No model configuration found for feature: ${featureId}`)
        return null
      }

      return {
        model: mapping.currentModel,
        fallback: mapping.fallbackModel
      }
    } catch (error) {
      console.error('Failed to get model configuration:', error)
      return null
    }
  }

  /**
   * Get the full model configuration from admin settings
   */
  async getConfig(): Promise<ModelConfig> {
    // Check cache first
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache
    }

    try {
      const response = await fetch('/api/admin/ai-operations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success || !result.data?.feature_mappings) {
        throw new Error('Invalid response format from AI operations API')
      }

      // Convert API response to expected format
      const config: ModelConfig = {
        featureMappings: result.data.feature_mappings,
        lastUpdated: new Date().toISOString()
      }

      // Cache the config
      this.configCache = config
      this.cacheExpiry = Date.now() + this.CACHE_DURATION

      return this.configCache
    } catch (error) {
      console.error('Failed to fetch model configuration:', error)

      // Return default configuration if API fails
      return this.getDefaultConfig()
    }
  }

  /**
   * Clear the configuration cache (useful when admin updates settings)
   */
  clearCache(): void {
    this.configCache = null
    this.cacheExpiry = 0
  }

  /**
   * Get available models for a specific provider
   */
  getModelsForProvider(provider: 'openai' | 'gemini' | 'claude' | 'grok'): string[] {
    switch (provider) {
      case 'openai':
        return ['gpt-4-turbo', 'gpt-4-vision', 'gpt-4', 'gpt-3.5-turbo']
      case 'gemini':
        return ['gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-1.0-pro-vision']
      case 'claude':
        return ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
      case 'grok':
        return ['grok-beta']
      default:
        return []
    }
  }

  /**
   * Track model usage for performance monitoring
   */
  async trackModelUsage(data: {
    featureId: string
    model: string
    success: boolean
    responseTime: number
    cost?: number
    userId?: string
  }): Promise<void> {
    try {
      await fetch('/api/ai/track-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to track model usage:', error)
      // Don't throw - tracking shouldn't break the main flow
    }
  }

  /**
   * Get performance data for the admin dashboard
   */
  async getPerformanceData(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<Record<string, ModelPerformanceData>> {
    try {
      const response = await fetch(`/api/admin/ai-models/performance?range=${timeRange}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
      return {}
    }
  }

  /**
   * Default configuration fallback
   */
  private getDefaultConfig(): ModelConfig {
    return {
      featureMappings: [
        {
          featureId: 'damage-analyzer',
          featureName: 'Damage Analyzer',
          currentModel: 'gpt-4-vision',
          fallbackModel: 'gemini-1.5-pro',
          category: 'vision'
        },
        {
          featureId: 'policy-chat',
          featureName: 'Policy Chat',
          currentModel: 'gpt-4-turbo',
          fallbackModel: 'claude-3-sonnet',
          category: 'reasoning'
        },
        {
          featureId: 'claim-assistant',
          featureName: 'Claim Assistant',
          currentModel: 'gpt-4-turbo',
          fallbackModel: 'gemini-1.5-pro',
          category: 'reasoning'
        },
        {
          featureId: 'settlement-analyzer',
          featureName: 'Settlement Analyzer',
          currentModel: 'claude-3-opus',
          fallbackModel: 'gpt-4-turbo',
          category: 'analysis'
        },
        {
          featureId: 'communication-helper',
          featureName: 'Communication Helper',
          currentModel: 'claude-3-sonnet',
          fallbackModel: 'gpt-4-turbo',
          category: 'generation'
        },
        {
          featureId: 'document-generator',
          featureName: 'Document Generator',
          currentModel: 'gpt-4-turbo',
          fallbackModel: 'claude-3-sonnet',
          category: 'generation'
        },
        {
          featureId: 'evidence-organizer',
          featureName: 'Evidence Organizer',
          currentModel: 'gpt-4-vision',
          fallbackModel: 'gemini-1.5-pro',
          category: 'vision'
        },
        {
          featureId: 'inventory-scanner',
          featureName: 'Inventory Scanner',
          currentModel: 'gemini-1.5-pro',
          fallbackModel: 'gpt-4-vision',
          category: 'vision'
        }
      ],
      lastUpdated: new Date().toISOString()
    }
  }
}

// Export singleton instance
export const aiModelConfigService = new AIModelConfigService()

// Export types
export type { FeatureModelMapping, ModelConfig, ModelPerformanceData }
