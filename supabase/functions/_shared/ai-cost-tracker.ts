import { createClient } from 'jsr:@supabase/supabase-js@2'

interface AIUsageLog {
  userId: string
  provider: 'openai' | 'gemini' | 'anthropic' | 'xai'
  model: string
  operationType: string
  tokensUsed: number
  estimatedCost: number
  responseTimeMs?: number
  success: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}

// Model cost rates per 1K tokens (input/output)
const MODEL_COSTS = {
  openai: {
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-vision': { input: 0.01, output: 0.03 },
    'gpt-4-vision-preview': { input: 0.01, output: 0.03 }
  },
  gemini: {
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
    'gemini-pro-vision': { input: 0.00025, output: 0.00125 }
  },
  anthropic: {
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 }
  },
  xai: {
    'grok-2': { input: 0.002, output: 0.008 },
    'grok-1': { input: 0.001, output: 0.004 }
  }
} as const

type Provider = keyof typeof MODEL_COSTS
type Model<P extends Provider> = keyof typeof MODEL_COSTS[P]

export class AICostTracker {
  private supabase: any
  private startTime: number

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    this.startTime = Date.now()
  }

  /**
   * Calculate cost based on model and token usage
   */
  calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Type-safe provider check
    if (!(provider in MODEL_COSTS)) {
      console.warn(`Unknown provider: ${provider}`)
      return 0
    }

    const providerCosts = MODEL_COSTS[provider as Provider]
    if (!providerCosts || !(model in providerCosts)) {
      console.warn(`Unknown model: ${provider}/${model}`)
      return 0
    }

    // Now TypeScript knows this is safe
    const costs = (providerCosts as any)[model]
    const inputCost = (inputTokens / 1000) * costs.input
    const outputCost = (outputTokens / 1000) * costs.output
    return inputCost + outputCost
  }

  /**
   * Estimate tokens from text (rough approximation)
   * OpenAI: ~4 chars per token
   * Other models may vary
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Log AI usage to database
   */
  async logUsage(log: AIUsageLog): Promise<void> {
    try {
      const responseTimeMs = log.responseTimeMs || (Date.now() - this.startTime)
      
      const { error } = await this.supabase.rpc('log_ai_usage', {
        p_user_id: log.userId,
        p_provider: log.provider,
        p_model: log.model,
        p_operation_type: log.operationType,
        p_tokens_used: log.tokensUsed,
        p_estimated_cost: log.estimatedCost,
        p_response_time_ms: responseTimeMs,
        p_success: log.success,
        p_error_message: log.errorMessage,
        p_metadata: log.metadata || {}
      })

      if (error) {
        console.error('Failed to log AI usage:', error)
      }
    } catch (error) {
      console.error('Error logging AI usage:', error)
    }
  }

  /**
   * Track AI operation with automatic logging
   */
  async trackOperation<T>(
    userId: string,
    provider: AIUsageLog['provider'],
    model: string,
    operationType: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    let success = false
    let errorMessage: string | undefined
    let result: T

    try {
      result = await operation()
      success = true
      return result
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      const responseTimeMs = Date.now() - startTime
      
      // Log the usage
      await this.logUsage({
        userId,
        provider,
        model,
        operationType,
        tokensUsed: 0, // Should be set by the operation
        estimatedCost: 0, // Should be calculated based on actual usage
        responseTimeMs,
        success,
        errorMessage
      })
    }
  }

  /**
   * Helper method for logging Gemini usage
   */
  async logGeminiUsage(
    userId: string,
    model: string,
    operationType: string,
    prompt: string,
    response: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const inputTokens = this.estimateTokens(prompt)
    const outputTokens = this.estimateTokens(response)
    const estimatedCost = this.calculateCost('gemini', model, inputTokens, outputTokens)

    await this.logUsage({
      userId,
      provider: 'gemini',
      model,
      operationType,
      tokensUsed: inputTokens + outputTokens,
      estimatedCost,
      success,
      errorMessage,
      metadata: {
        inputTokens,
        outputTokens
      }
    })
  }

  /**
   * Helper method for logging OpenAI usage
   */
  async logOpenAIUsage(
    userId: string,
    model: string,
    operationType: string,
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const estimatedCost = this.calculateCost('openai', model, usage.prompt_tokens, usage.completion_tokens)

    await this.logUsage({
      userId,
      provider: 'openai',
      model,
      operationType,
      tokensUsed: usage.total_tokens,
      estimatedCost,
      success,
      errorMessage,
      metadata: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens
      }
    })
  }

  /**
   * Get total cost for a user
   */
  async getUserTotalCost(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('ai_usage_logs')
        .select('estimated_cost')
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to get user total cost:', error)
        return 0
      }

      return data?.reduce((total: number, log: any) => total + (log.estimated_cost || 0), 0) || 0
    } catch (error) {
      console.error('Error getting user total cost:', error)
      return 0
    }
  }
}