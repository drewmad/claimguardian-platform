/**
 * Cost tracking service for monitoring AI tool usage and expenses
 * Tracks OpenAI, Google Gemini, and other AI provider costs per tool
 */

import { createClient } from '@/lib/supabase/server'

export interface AIToolUsage {
  toolId: string
  toolName: string
  sessionId?: string
  requestType: 'text' | 'image' | 'audio' | 'multimodal'

  // Input metrics
  inputTokens: number
  inputTextLength: number
  inputImagesCount: number
  inputAudioSeconds: number

  // Output metrics
  outputTokens: number
  outputTextLength: number
  processingTimeMs: number

  // Cost breakdown
  costInput: number
  costOutput: number
  costImages: number
  costAudio: number

  // Context
  featureUsed?: string
  modelVersion?: string
  temperature?: number
  maxTokens?: number
  customParameters?: Record<string, any>

  success: boolean
  errorMessage?: string
}

export interface CostAnalytics {
  totalCost: number
  totalRequests: number
  uniqueUsers: number
  avgCostPerRequest: number
  costByTool: Record<string, {
    cost: number
    requests: number
    avgCost: number
    successRate: number
  }>
  costByDate: Record<string, {
    cost: number
    requests: number
    uniqueUsers: number
  }>
  topUsers: Array<{
    userId: string
    email: string
    cost: number
    requests: number
    avgCost: number
  }>
  modelPerformance: Record<string, {
    avgResponseTime: number
    successRate: number
    totalRequests: number
    avgInputTokens: number
    avgOutputTokens: number
  }>
}

export interface UserBudgetStatus {
  budgetExceeded: boolean
  currentSpend: number
  budgetAmount: number
  percentageUsed: number
  alertsNeeded: string[]
}

export interface AITool {
  id: string
  name: string
  displayName: string
  provider: 'openai' | 'google' | 'anthropic'
  modelName: string
  costPerInputToken: number
  costPerOutputToken: number
  costPerImage?: number
  costPerMinute?: number
  supportsImages: boolean
  supportsAudio: boolean
}

class CostTrackingService {
  private supabase = createClient()

  /**
   * Track AI tool usage and calculate costs
   */
  async trackUsage(usage: AIToolUsage, userIp?: string, userAgent?: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.warn('No authenticated user for cost tracking')
        return
      }

      // Get tool information to calculate costs
      const { data: tool } = await this.supabase
        .from('ai_tools')
        .select('*')
        .eq('name', usage.toolName)
        .single()

      if (!tool) {
        console.error(`AI tool '${usage.toolName}' not found in database`)
        return
      }

      // Calculate costs
      const costInput = usage.inputTokens * tool.cost_per_input_token
      const costOutput = usage.outputTokens * tool.cost_per_output_token
      const costImages = usage.inputImagesCount * (tool.cost_per_image || 0)
      const costAudio = usage.inputAudioSeconds * (tool.cost_per_minute || 0) / 60

      // Log usage
      const { error } = await this.supabase
        .from('ai_usage_logs')
        .insert({
          user_id: user.id,
          ai_tool_id: tool.id,
          session_id: usage.sessionId,
          request_type: usage.requestType,

          input_tokens: usage.inputTokens,
          input_text_length: usage.inputTextLength,
          input_images_count: usage.inputImagesCount,
          input_audio_seconds: usage.inputAudioSeconds,

          output_tokens: usage.outputTokens,
          output_text_length: usage.outputTextLength,
          processing_time_ms: usage.processingTimeMs,

          cost_input: costInput,
          cost_output: costOutput,
          cost_images: costImages,
          cost_audio: costAudio,

          request_ip: userIp,
          user_agent: userAgent,
          feature_used: usage.featureUsed,
          success: usage.success,
          error_message: usage.errorMessage,

          model_version: usage.modelVersion,
          temperature: usage.temperature,
          max_tokens: usage.maxTokens,
          custom_parameters: usage.customParameters || {}
        })

      if (error) {
        console.error('Failed to log AI usage:', error)
        return
      }

      // Check budget status and send alerts if needed
      await this.checkBudgetStatus(user.id)

    } catch (error) {
      console.error('Cost tracking error:', error)
    }
  }

  /**
   * Get user's current month AI usage and costs
   */
  async getUserUsageCurrentMonth(userId?: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_ai_usage_current_month', {
        target_user_id: userId || undefined
      })

      if (error) throw error
      return data[0] || {
        total_requests: 0,
        total_cost: 0,
        cost_by_tool: {},
        daily_usage: {}
      }
    } catch (error) {
      console.error('Failed to get user usage:', error)
      return {
        total_requests: 0,
        total_cost: 0,
        cost_by_tool: {},
        daily_usage: {}
      }
    }
  }

  /**
   * Get admin cost analytics (admin only)
   */
  async getAdminCostAnalytics(
    startDate: string = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: string = new Date().toISOString().split('T')[0]
  ): Promise<CostAnalytics> {
    try {
      const { data, error } = await this.supabase.rpc('get_admin_cost_analytics', {
        start_date: startDate,
        end_date: endDate
      })

      if (error) throw error

      const result = data[0]
      return {
        totalCost: parseFloat(result?.total_cost || '0'),
        totalRequests: parseInt(result?.total_requests || '0'),
        uniqueUsers: parseInt(result?.unique_users || '0'),
        avgCostPerRequest: parseFloat(result?.avg_cost_per_request || '0'),
        costByTool: result?.cost_by_tool || {},
        costByDate: result?.cost_by_date || {},
        topUsers: result?.top_users || [],
        modelPerformance: result?.model_performance || {}
      }
    } catch (error) {
      console.error('Failed to get admin cost analytics:', error)
      return {
        totalCost: 0,
        totalRequests: 0,
        uniqueUsers: 0,
        avgCostPerRequest: 0,
        costByTool: {},
        costByDate: {},
        topUsers: [],
        modelPerformance: {}
      }
    }
  }

  /**
   * Check user's budget status and send alerts if needed
   */
  async checkBudgetStatus(userId?: string): Promise<UserBudgetStatus> {
    try {
      const { data, error } = await this.supabase.rpc('check_user_budget_status', {
        target_user_id: userId || undefined
      })

      if (error) throw error

      const result = data[0] || {
        budget_exceeded: false,
        current_spend: 0,
        budget_amount: 0,
        percentage_used: 0,
        alerts_needed: []
      }

      // Send alerts if needed
      if (result.alerts_needed && result.alerts_needed.length > 0) {
        await this.sendBudgetAlerts(userId, result)
      }

      return {
        budgetExceeded: result.budget_exceeded,
        currentSpend: parseFloat(result.current_spend || '0'),
        budgetAmount: parseFloat(result.budget_amount || '0'),
        percentageUsed: parseFloat(result.percentage_used || '0'),
        alertsNeeded: result.alerts_needed || []
      }
    } catch (error) {
      console.error('Failed to check budget status:', error)
      return {
        budgetExceeded: false,
        currentSpend: 0,
        budgetAmount: 0,
        percentageUsed: 0,
        alertsNeeded: []
      }
    }
  }

  /**
   * Get all available AI tools
   */
  async getAITools(): Promise<AITool[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_tools')
        .select('*')
        .eq('is_active', true)
        .order('display_name')

      if (error) throw error

      return data.map(tool => ({
        id: tool.id,
        name: tool.name,
        displayName: tool.display_name,
        provider: tool.provider,
        modelName: tool.model_name,
        costPerInputToken: parseFloat(tool.cost_per_input_token),
        costPerOutputToken: parseFloat(tool.cost_per_output_token),
        costPerImage: tool.cost_per_image ? parseFloat(tool.cost_per_image) : undefined,
        costPerMinute: tool.cost_per_minute ? parseFloat(tool.cost_per_minute) : undefined,
        supportsImages: tool.supports_images,
        supportsAudio: tool.supports_audio
      }))
    } catch (error) {
      console.error('Failed to get AI tools:', error)
      return []
    }
  }

  /**
   * Calculate estimated cost for a request before making it
   */
  calculateEstimatedCost(
    toolName: string,
    inputTokens: number,
    estimatedOutputTokens: number,
    imageCount: number = 0,
    audioSeconds: number = 0
  ): Promise<number> {
    return new Promise(async (resolve) => {
      try {
        const tools = await this.getAITools()
        const tool = tools.find(t => t.name === toolName)

        if (!tool) {
          resolve(0)
          return
        }

        const cost =
          (inputTokens * tool.costPerInputToken) +
          (estimatedOutputTokens * tool.costPerOutputToken) +
          (imageCount * (tool.costPerImage || 0)) +
          (audioSeconds * (tool.costPerMinute || 0) / 60)

        resolve(cost)
      } catch (error) {
        console.error('Failed to calculate estimated cost:', error)
        resolve(0)
      }
    })
  }

  /**
   * Get user's subscription limits and current usage
   */
  async getUserSubscriptionStatus(userId?: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscription_limits')
        .select('*')
        .eq('user_id', userId || (await this.supabase.auth.getUser()).data.user?.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is ok
        throw error
      }

      return data || {
        tier: 'free',
        monthly_ai_budget: 5.00,
        daily_request_limit: 50,
        monthly_request_limit: 1000,
        current_month_requests: 0,
        current_day_requests: 0
      }
    } catch (error) {
      console.error('Failed to get subscription status:', error)
      return null
    }
  }

  /**
   * Check if user can make a request based on limits
   */
  async canUserMakeRequest(toolName: string): Promise<{
    allowed: boolean
    reason?: string
    upgradeRequired?: boolean
  }> {
    try {
      const subscription = await this.getUserSubscriptionStatus()
      if (!subscription) {
        return { allowed: false, reason: 'Unable to verify subscription status' }
      }

      // Check daily limit
      if (subscription.current_day_requests >= subscription.daily_request_limit) {
        return {
          allowed: false,
          reason: `Daily limit of ${subscription.daily_request_limit} requests exceeded`,
          upgradeRequired: subscription.tier === 'free'
        }
      }

      // Check monthly limit
      if (subscription.current_month_requests >= subscription.monthly_request_limit) {
        return {
          allowed: false,
          reason: `Monthly limit of ${subscription.monthly_request_limit} requests exceeded`,
          upgradeRequired: subscription.tier === 'free'
        }
      }

      // Check if tool is enabled for user's tier
      const toolEnabledField = `${toolName.replace(/-/g, '_')}_enabled`
      if (subscription[toolEnabledField] === false) {
        return {
          allowed: false,
          reason: `${toolName} requires a higher subscription tier`,
          upgradeRequired: true
        }
      }

      // Check budget
      const budgetStatus = await this.checkBudgetStatus()
      if (budgetStatus.budgetExceeded) {
        return {
          allowed: false,
          reason: 'Monthly AI budget exceeded',
          upgradeRequired: false
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Failed to check user request limits:', error)
      return { allowed: false, reason: 'Unable to verify request limits' }
    }
  }

  /**
   * Send budget alert notifications
   */
  private async sendBudgetAlerts(userId: string | undefined, budgetStatus: any): Promise<void> {
    try {
      for (const alertLevel of budgetStatus.alerts_needed) {
        const alertType = alertLevel === 'critical' ? 'limit_reached' : 'threshold'
        const message = this.getBudgetAlertMessage(alertLevel, budgetStatus)

        await this.supabase
          .from('cost_alerts')
          .insert({
            user_id: userId,
            budget_id: null, // Will be filled by trigger
            alert_type: alertType,
            alert_level: alertLevel,
            message,
            current_spend: budgetStatus.current_spend,
            budget_amount: budgetStatus.budget_amount,
            percentage_used: budgetStatus.percentage_used,
            channels: ['dashboard', 'email']
          })
      }
    } catch (error) {
      console.error('Failed to send budget alerts:', error)
    }
  }

  private getBudgetAlertMessage(level: string, status: any): string {
    const percentage = Math.round(status.percentage_used)
    const spent = status.current_spend.toFixed(2)
    const budget = status.budget_amount.toFixed(2)

    switch (level) {
      case 'info':
        return `You've used ${percentage}% of your AI budget ($${spent} of $${budget})`
      case 'warning':
        return `Warning: You've used ${percentage}% of your AI budget ($${spent} of $${budget})`
      case 'critical':
        return `Critical: You've exceeded ${percentage}% of your AI budget ($${spent} of $${budget})`
      default:
        return `Budget alert: ${percentage}% used ($${spent} of $${budget})`
    }
  }

  /**
   * Update user's daily request count
   */
  async updateUserRequestCount(userId?: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) return

      // This would typically be done by a database trigger or scheduled function
      // For now, we'll increment the counter
      await this.supabase.rpc('increment_user_request_count', {
        user_id: targetUserId
      })
    } catch (error) {
      console.error('Failed to update request count:', error)
    }
  }
}

// Token estimation helpers for different AI providers
export class TokenEstimator {
  /**
   * Estimate tokens for OpenAI models (rough approximation)
   */
  static estimateOpenAITokens(text: string): number {
    // Rough estimate: ~4 characters per token for English text
    return Math.ceil(text.length / 4)
  }

  /**
   * Estimate tokens for Google Gemini models
   */
  static estimateGeminiTokens(text: string): number {
    // Similar token density to OpenAI
    return Math.ceil(text.length / 4)
  }

  /**
   * Estimate output tokens based on response type
   */
  static estimateOutputTokens(responseType: 'short' | 'medium' | 'long' | 'analysis'): number {
    switch (responseType) {
      case 'short': return 100
      case 'medium': return 300
      case 'long': return 800
      case 'analysis': return 1500
      default: return 300
    }
  }
}

export const costTrackingService = new CostTrackingService()
