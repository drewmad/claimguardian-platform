/**
 * Cost tracking middleware for AI API calls
 * Automatically tracks usage and costs for all AI tool interactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { costTrackingService, TokenEstimator, type AIToolUsage } from '@/services/cost-tracking'

export interface CostTrackingContext {
  toolName: string
  toolDisplayName: string
  sessionId?: string
  featureUsed?: string
  modelVersion?: string
  temperature?: number
  maxTokens?: number
}

export interface AIRequestData {
  messages?: Array<{ role: string; content: string }>
  prompt?: string
  input?: string
  images?: string[] | File[]
  audio?: File | Blob
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface AIResponseData {
  choices?: Array<{ message?: { content: string }; text?: string }>
  content?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  text?: string
  transcription?: string
}

/**
 * Middleware decorator for AI API route handlers
 */
export function withCostTracking(
  context: CostTrackingContext,
  handler: (request: NextRequest, trackingData?: AIRequestData) => Promise<NextResponse>
) {
  return async function trackedHandler(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    let requestData: AIRequestData = {}
    let responseData: AIResponseData = {}
    let success = false
    let errorMessage: string | undefined

    try {
      // Parse request data
      const body = await request.clone().json().catch(() => ({}))
      requestData = body

      // Execute the original handler
      const response = await handler(request, requestData)
      
      // Parse response data if successful
      if (response.ok) {
        success = true
        const responseBody = await response.clone().json().catch(() => ({}))
        responseData = responseBody
      } else {
        const errorBody = await response.clone().text().catch(() => 'Unknown error')
        errorMessage = errorBody
      }

      // Track the usage
      await trackAIUsage({
        context,
        requestData,
        responseData,
        processingTime: Date.now() - startTime,
        success,
        errorMessage,
        request
      })

      return response

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Track failed usage
      await trackAIUsage({
        context,
        requestData,
        responseData: {},
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage,
        request
      })

      throw error
    }
  }
}

/**
 * Track AI usage with comprehensive metrics
 */
async function trackAIUsage(params: {
  context: CostTrackingContext
  requestData: AIRequestData
  responseData: AIResponseData
  processingTime: number
  success: boolean
  errorMessage?: string
  request: NextRequest
}) {
  const {
    context,
    requestData,
    responseData,
    processingTime,
    success,
    errorMessage,
    request
  } = params

  try {
    // Extract input metrics
    const inputMetrics = extractInputMetrics(requestData)
    const outputMetrics = extractOutputMetrics(responseData)
    const costMetrics = calculateCostMetrics(inputMetrics, outputMetrics, context.toolName)

    // Create usage record
    const usage: AIToolUsage = {
      toolId: generateToolId(context.toolName),
      toolName: context.toolName,
      sessionId: context.sessionId || generateSessionId(request),
      requestType: determineRequestType(requestData),

      // Input metrics
      inputTokens: inputMetrics.tokens,
      inputTextLength: inputMetrics.textLength,
      inputImagesCount: inputMetrics.imagesCount,
      inputAudioSeconds: inputMetrics.audioSeconds,

      // Output metrics  
      outputTokens: outputMetrics.tokens,
      outputTextLength: outputMetrics.textLength,
      processingTimeMs: processingTime,

      // Cost breakdown
      costInput: costMetrics.input,
      costOutput: costMetrics.output,
      costImages: costMetrics.images,
      costAudio: costMetrics.audio,

      // Context
      featureUsed: context.featureUsed,
      modelVersion: context.modelVersion || requestData.model,
      temperature: context.temperature || requestData.temperature,
      maxTokens: context.maxTokens || requestData.maxTokens,

      success,
      errorMessage
    }

    // Get request metadata
    const userIp = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Track the usage
    await costTrackingService.trackUsage(usage, userIp, userAgent)

    console.log(`[CostTracking] ${context.toolName}: $${(usage.costInput + usage.costOutput + usage.costImages + usage.costAudio).toFixed(6)} (${usage.inputTokens}→${usage.outputTokens} tokens, ${processingTime}ms)`)

  } catch (trackingError) {
    console.error('Failed to track AI usage:', trackingError)
    // Don't throw - tracking failures shouldn't break the API
  }
}

/**
 * Extract input metrics from request data
 */
function extractInputMetrics(requestData: AIRequestData): {
  tokens: number
  textLength: number
  imagesCount: number
  audioSeconds: number
} {
  let text = ''
  let imagesCount = 0
  let audioSeconds = 0

  // Extract text from various formats
  if (requestData.messages) {
    text = requestData.messages
      .map(msg => msg.content)
      .filter(Boolean)
      .join(' ')
  } else if (requestData.prompt) {
    text = requestData.prompt
  } else if (requestData.input) {
    text = requestData.input
  }

  // Count images
  if (requestData.images) {
    imagesCount = Array.isArray(requestData.images) ? requestData.images.length : 1
  }

  // Estimate audio duration (rough estimate based on file size)
  if (requestData.audio) {
    if (requestData.audio instanceof File) {
      audioSeconds = Math.max(1, requestData.audio.size / 16000) // Rough estimate
    } else if (requestData.audio instanceof Blob) {
      audioSeconds = Math.max(1, requestData.audio.size / 16000)
    }
  }

  const tokens = TokenEstimator.estimateOpenAITokens(text)

  return {
    tokens,
    textLength: text.length,
    imagesCount,
    audioSeconds
  }
}

/**
 * Extract output metrics from response data
 */
function extractOutputMetrics(responseData: AIResponseData): {
  tokens: number
  textLength: number
} {
  let outputText = ''

  // Extract output text from various formats
  if (responseData.choices && responseData.choices.length > 0) {
    const choice = responseData.choices[0]
    outputText = choice.message?.content || choice.text || ''
  } else if (responseData.content) {
    outputText = responseData.content
  } else if (responseData.text) {
    outputText = responseData.text
  } else if (responseData.transcription) {
    outputText = responseData.transcription
  }

  // Use actual token usage if provided, otherwise estimate
  let tokens = 0
  if (responseData.usage?.completion_tokens) {
    tokens = responseData.usage.completion_tokens
  } else if (outputText) {
    tokens = TokenEstimator.estimateOpenAITokens(outputText)
  }

  return {
    tokens,
    textLength: outputText.length
  }
}

/**
 * Calculate cost metrics based on input/output data
 */
async function calculateCostMetrics(
  inputMetrics: ReturnType<typeof extractInputMetrics>,
  outputMetrics: ReturnType<typeof extractOutputMetrics>,
  toolName: string
): Promise<{
  input: number
  output: number
  images: number
  audio: number
}> {
  try {
    const tools = await costTrackingService.getAITools()
    const tool = tools.find(t => t.name === toolName)

    if (!tool) {
      console.warn(`AI tool '${toolName}' not found in cost tracking database`)
      return { input: 0, output: 0, images: 0, audio: 0 }
    }

    return {
      input: inputMetrics.tokens * tool.costPerInputToken,
      output: outputMetrics.tokens * tool.costPerOutputToken,
      images: inputMetrics.imagesCount * (tool.costPerImage || 0),
      audio: inputMetrics.audioSeconds * (tool.costPerMinute || 0) / 60
    }
  } catch (error) {
    console.error('Failed to calculate cost metrics:', error)
    return { input: 0, output: 0, images: 0, audio: 0 }
  }
}

/**
 * Determine request type based on input data
 */
function determineRequestType(requestData: AIRequestData): AIToolUsage['requestType'] {
  if (requestData.images && requestData.images.length > 0) {
    if (requestData.audio || (requestData.messages && requestData.prompt)) {
      return 'multimodal'
    }
    return 'image'
  }
  
  if (requestData.audio) {
    return 'audio'
  }
  
  return 'text'
}

/**
 * Generate unique tool ID for tracking
 */
function generateToolId(toolName: string): string {
  return `${toolName}-${Date.now()}`
}

/**
 * Generate session ID from request if not provided
 */
function generateSessionId(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const ip = request.ip || 'unknown'
  return `session_${btoa(`${ip}_${userAgent}`).slice(0, 12)}_${Date.now()}`
}

/**
 * Helper for manual usage tracking (for non-API route scenarios)
 */
export async function trackManualUsage(
  toolName: string,
  data: {
    inputText?: string
    outputText?: string
    imageCount?: number
    audioSeconds?: number
    processingTime?: number
    success?: boolean
    errorMessage?: string
    featureUsed?: string
    sessionId?: string
  }
) {
  const inputMetrics = {
    tokens: data.inputText ? TokenEstimator.estimateOpenAITokens(data.inputText) : 0,
    textLength: data.inputText?.length || 0,
    imagesCount: data.imageCount || 0,
    audioSeconds: data.audioSeconds || 0
  }

  const outputMetrics = {
    tokens: data.outputText ? TokenEstimator.estimateOpenAITokens(data.outputText) : 0,
    textLength: data.outputText?.length || 0
  }

  const costMetrics = await calculateCostMetrics(inputMetrics, outputMetrics, toolName)

  const usage: AIToolUsage = {
    toolId: generateToolId(toolName),
    toolName,
    sessionId: data.sessionId || `manual_${Date.now()}`,
    requestType: data.imageCount ? 'image' : data.audioSeconds ? 'audio' : 'text',

    inputTokens: inputMetrics.tokens,
    inputTextLength: inputMetrics.textLength,
    inputImagesCount: inputMetrics.imagesCount,
    inputAudioSeconds: inputMetrics.audioSeconds,

    outputTokens: outputMetrics.tokens,
    outputTextLength: outputMetrics.textLength,
    processingTimeMs: data.processingTime || 0,

    costInput: costMetrics.input,
    costOutput: costMetrics.output,
    costImages: costMetrics.images,
    costAudio: costMetrics.audio,

    featureUsed: data.featureUsed,
    success: data.success !== false,
    errorMessage: data.errorMessage
  }

  await costTrackingService.trackUsage(usage)
}

/**
 * Budget check middleware - prevents API calls if budget exceeded
 */
export function withBudgetCheck(handler: Function) {
  return async function budgetCheckedHandler(request: NextRequest) {
    try {
      // Check if user can make requests
      const canMakeRequest = await costTrackingService.canUserMakeRequest('general')
      
      if (!canMakeRequest.allowed) {
        return NextResponse.json(
          {
            error: 'Request blocked',
            reason: canMakeRequest.reason,
            upgradeRequired: canMakeRequest.upgradeRequired
          },
          { status: canMakeRequest.upgradeRequired ? 402 : 429 }
        )
      }

      // Update request count
      await costTrackingService.updateUserRequestCount()

      return await handler(request)
    } catch (error) {
      console.error('Budget check failed:', error)
      // Allow request to proceed if budget check fails
      return await handler(request)
    }
  }
}