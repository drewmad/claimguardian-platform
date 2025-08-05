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
}

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
    const costs = MODEL_COSTS[provider as keyof typeof MODEL_COSTS]?.[model]
    if (!costs) {
      console.warn(`Unknown model: ${provider}/${model}`)
      return 0
    }

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
    } catch (err) {
      console.error('Error logging AI usage:', err)
    }
  }

  /**
   * Log OpenAI API usage
   */
  async logOpenAIUsage(
    userId: string,
    model: string,
    operationType: string,
    response: any,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const usage = response?.usage
    if (!usage) return

    const totalTokens = usage.total_tokens || 0
    const promptTokens = usage.prompt_tokens || 0
    const completionTokens = usage.completion_tokens || 0
    
    const estimatedCost = this.calculateCost(
      'openai',
      model,
      promptTokens,
      completionTokens
    )

    await this.logUsage({
      userId,
      provider: 'openai',
      model,
      operationType,
      tokensUsed: totalTokens,
      estimatedCost,
      success,
      errorMessage,
      metadata: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens
      }
    })
  }

  /**
   * Log Gemini API usage
   */
  async logGeminiUsage(
    userId: string,
    model: string,
    operationType: string,
    prompt: string,
    response: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    // Gemini doesn't return token counts, so we estimate
    const inputTokens = this.estimateTokens(prompt)
    const outputTokens = this.estimateTokens(response)
    const totalTokens = inputTokens + outputTokens
    
    const estimatedCost = this.calculateCost(
      'gemini',
      model,
      inputTokens,
      outputTokens
    )

    await this.logUsage({
      userId,
      provider: 'gemini',
      model,
      operationType,
      tokensUsed: totalTokens,
      estimatedCost,
      success,
      errorMessage,
      metadata: {
        estimated_input_tokens: inputTokens,
        estimated_output_tokens: outputTokens
      }
    })
  }

  /**
   * Get response time in milliseconds
   */
  getResponseTime(): number {
    return Date.now() - this.startTime
  }
}

/**
 * Helper function to extract user ID from auth token
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    return user.id
  } catch (err) {
    console.error('Error extracting user ID:', err)
    return null
  }
}