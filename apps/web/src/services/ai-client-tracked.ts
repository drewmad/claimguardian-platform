/**
 * AI client wrapper with automatic cost tracking
 * Provides unified interface for all AI providers with built-in usage tracking
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { trackManualUsage, type CostTrackingContext } from '@/middleware/cost-tracking'
import { TokenEstimator } from './cost-tracking'

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key')

export interface TrackedAIRequest {
  provider: 'openai' | 'gemini'
  model: string
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  prompt?: string
  images?: string[] | File[]
  maxTokens?: number
  temperature?: number
  toolContext: CostTrackingContext
}

export interface TrackedAIResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  finishReason?: string
}

/**
 * Tracked AI Client - automatically tracks all API calls
 */
export class TrackedAIClient {

  /**
   * Generate text completion with automatic cost tracking
   */
  async generateText(request: TrackedAIRequest): Promise<TrackedAIResponse> {
    const startTime = Date.now()

    try {
      let response: TrackedAIResponse

      if (request.provider === 'openai') {
        response = await this.generateOpenAIText(request)
      } else if (request.provider === 'gemini') {
        response = await this.generateGeminiText(request)
      } else {
        throw new Error(`Unsupported provider: ${request.provider}`)
      }

      // Track successful usage
      await this.trackUsage(request, response, Date.now() - startTime, true)

      return response

    } catch (error) {
      // Track failed usage
      await this.trackUsage(
        request,
        { content: '', model: request.model },
        Date.now() - startTime,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  /**
   * Generate image analysis with automatic cost tracking
   */
  async analyzeImage(request: TrackedAIRequest & { images: string[] }): Promise<TrackedAIResponse> {
    const startTime = Date.now()

    try {
      let response: TrackedAIResponse

      if (request.provider === 'openai') {
        response = await this.analyzeOpenAIImage(request)
      } else if (request.provider === 'gemini') {
        response = await this.analyzeGeminiImage(request)
      } else {
        throw new Error(`Unsupported provider for image analysis: ${request.provider}`)
      }

      // Track successful usage
      await this.trackUsage(request, response, Date.now() - startTime, true)

      return response

    } catch (error) {
      // Track failed usage
      await this.trackUsage(
        request,
        { content: '', model: request.model },
        Date.now() - startTime,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  /**
   * Check if AI API keys are configured
   */
  static isConfigured(provider: 'openai' | 'gemini'): boolean {
    if (provider === 'openai') {
      return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key'
    } else if (provider === 'gemini') {
      return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-key'
    }
    return false
  }

  /**
   * Get available models for a provider
   */
  static getAvailableModels(provider: 'openai' | 'gemini'): string[] {
    if (provider === 'openai') {
      return ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo']
    } else if (provider === 'gemini') {
      return ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro']
    }
    return []
  }

  private async generateOpenAIText(request: TrackedAIRequest): Promise<TrackedAIResponse> {
    const messages = request.messages || [
      { role: 'user' as const, content: request.prompt || '' }
    ]

    const completion = await openai.chat.completions.create({
      model: request.model,
      messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
    })

    const choice = completion.choices[0]
    const usage = completion.usage

    return {
      content: choice.message.content || '',
      usage: usage ? {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      } : undefined,
      model: completion.model,
      finishReason: choice.finish_reason || undefined
    }
  }

  private async generateGeminiText(request: TrackedAIRequest): Promise<TrackedAIResponse> {
    const model = genai.getGenerativeModel({ model: request.model })

    const prompt = request.messages
      ? request.messages.map(m => m.content).join('\n')
      : (request.prompt || '')

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Estimate tokens since Gemini doesn't provide exact usage
    const inputTokens = TokenEstimator.estimateGeminiTokens(prompt)
    const outputTokens = TokenEstimator.estimateGeminiTokens(text)

    return {
      content: text,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      model: request.model,
      finishReason: 'stop'
    }
  }

  private async analyzeOpenAIImage(request: TrackedAIRequest & { images: string[] }): Promise<TrackedAIResponse> {
    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: request.prompt || 'Analyze this image.'
          },
          ...request.images.map(image => ({
            type: 'image_url' as const,
            image_url: { url: image }
          }))
        ]
      }
    ]

    const completion = await openai.chat.completions.create({
      model: request.model,
      messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
    })

    const choice = completion.choices[0]
    const usage = completion.usage

    return {
      content: choice.message.content || '',
      usage: usage ? {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      } : undefined,
      model: completion.model,
      finishReason: choice.finish_reason || undefined
    }
  }

  private async analyzeGeminiImage(request: TrackedAIRequest & { images: string[] }): Promise<TrackedAIResponse> {
    const model = genai.getGenerativeModel({ model: request.model })

    // Convert base64 images to Gemini format
    const imageParts = request.images.map(image => {
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '')
      return {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg' // Assume JPEG, could be smarter
        }
      }
    })

    const prompt = request.prompt || 'Analyze this image.'
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const text = response.text()

    // Estimate tokens
    const inputTokens = TokenEstimator.estimateGeminiTokens(prompt) + (request.images.length * 85) // Rough image token estimate
    const outputTokens = TokenEstimator.estimateGeminiTokens(text)

    return {
      content: text,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      model: request.model,
      finishReason: 'stop'
    }
  }

  private async trackUsage(
    request: TrackedAIRequest,
    response: TrackedAIResponse,
    processingTime: number,
    success: boolean,
    errorMessage?: string
  ) {
    const inputText = request.messages
      ? request.messages.map(m => m.content).join(' ')
      : (request.prompt || '')

    await trackManualUsage(request.toolContext.toolName, {
      inputText,
      outputText: response.content,
      imageCount: request.images?.length || 0,
      processingTime,
      success,
      errorMessage,
      featureUsed: request.toolContext.featureUsed,
      sessionId: request.toolContext.sessionId
    })
  }
}

// Export singleton instance
export const trackedAIClient = new TrackedAIClient()

/**
 * Convenience functions for specific AI tools
 */

export async function analyzeDamageWithTracking(
  images: string[],
  customPrompt?: string,
  sessionId?: string
): Promise<string> {
  const prompt = customPrompt || `
    Analyze this property damage image and provide a detailed assessment including:
    1. Type and severity of damage
    2. Location and affected areas
    3. Estimated repair complexity
    4. Safety concerns if any
    5. Recommended next steps

    Format as a structured analysis with clear sections.
  `

  const response = await trackedAIClient.analyzeImage({
    provider: 'openai',
    model: 'gpt-4o',
    prompt,
    images,
    temperature: 0.3,
    maxTokens: 1000,
    toolContext: {
      toolName: 'damage-analyzer',
      toolDisplayName: 'Damage Analyzer',
      sessionId,
      featureUsed: 'damage_analysis',
      modelVersion: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1000
    }
  })

  return response.content
}

export async function generatePolicyAdviceWithTracking(
  documents: string[],
  question: string,
  sessionId?: string
): Promise<string> {
  const prompt = `
    Based on the insurance policy documents provided, please answer the following question:
    ${question}

    Provide a clear, accurate answer based on the policy terms and conditions. Include relevant section references where applicable.
  `

  const response = await trackedAIClient.generateText({
    provider: 'openai',
    model: 'gpt-4',
    prompt,
    temperature: 0.2,
    maxTokens: 800,
    toolContext: {
      toolName: 'policy-advisor',
      toolDisplayName: 'Policy Advisor',
      sessionId,
      featureUsed: 'policy_analysis',
      modelVersion: 'gpt-4',
      temperature: 0.2,
      maxTokens: 800
    }
  })

  return response.content
}

export async function generateInventoryItemsWithTracking(
  images: string[],
  roomType?: string,
  sessionId?: string
): Promise<string> {
  const prompt = `
    Analyze this image and identify all visible personal property items for insurance inventory purposes.
    ${roomType ? `This is a ${roomType}.` : ''}

    For each item, provide:
    1. Item name and description
    2. Estimated value range
    3. Condition assessment
    4. Recommended documentation needs

    Format as a structured list.
  `

  const response = await trackedAIClient.analyzeImage({
    provider: 'openai',
    model: 'gpt-4o',
    prompt,
    images,
    temperature: 0.4,
    maxTokens: 1200,
    toolContext: {
      toolName: 'inventory-scanner',
      toolDisplayName: 'Inventory Scanner',
      sessionId,
      featureUsed: 'inventory_analysis',
      modelVersion: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 1200
    }
  })

  return response.content
}
