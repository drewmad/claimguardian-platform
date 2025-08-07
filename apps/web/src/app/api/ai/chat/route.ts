/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI chat interface with automatic cost tracking"
 * @dependencies ["@/middleware/cost-tracking", "@/services/ai-client-tracked"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { NextRequest, NextResponse } from 'next/server'
import { logger } from "@/lib/logger/production-logger"

import { withCostTracking, withBudgetCheck } from '@/middleware/cost-tracking'
import { trackedAIClient, TrackedAIClient } from '@/services/ai-client-tracked'
import { inputSanitizer } from '@/lib/security/input-sanitizer'
import { withRateLimit, RateLimiter } from '@/lib/security/rate-limiter'

const costTrackingContext = {
  toolName: 'policy-advisor',
  toolDisplayName: 'Policy Advisor',
  featureUsed: 'chat_consultation'
}

export const POST = withBudgetCheck(
  withCostTracking(
    costTrackingContext,
    async (request: NextRequest) => {
      return withRateLimit(
        request,
        'ai-chat',
        RateLimiter.configs.moderate,
        async () => {
          try {
            const body = await request.json()

            // Sanitize input data
            const sanitizedData = inputSanitizer.sanitizeFormData(body)
            const { messages, model = 'openai', sessionId, toolName = 'policy-advisor' } = sanitizedData

            // Update context based on toolName if provided
            const dynamicContext = {
              ...costTrackingContext,
              toolName: toolName as string,
              toolDisplayName: getToolDisplayName(toolName as string),
              sessionId: sessionId as string
            }

            // Validate messages
            if (!messages || !Array.isArray(messages)) {
              return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
              )
            }

            // Check if the selected provider is configured
            const provider = model as 'openai' | 'gemini'
            if (!['openai', 'gemini'].includes(provider)) {
              return NextResponse.json(
                { error: 'Invalid model selection. Only openai and gemini are supported.' },
                { status: 400 }
              )
            }

            if (!TrackedAIClient.isConfigured(provider)) {
              return NextResponse.json(
                { error: `${provider} API key is not configured` },
                { status: 503 }
              )
            }

            // Additional validation for messages structure
            const validMessages = messages.filter(msg =>
              typeof msg === 'object' &&
              msg !== null &&
              typeof msg.content === 'string' &&
              ['user', 'assistant', 'system'].includes(msg.role)
            ).map(msg => ({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: inputSanitizer.sanitizeText(msg.content, 10000) // Limit message length
            }))

            if (validMessages.length === 0) {
              return NextResponse.json(
                { error: 'No valid messages provided' },
                { status: 400 }
              )
            }

            // Use the tracked AI client for automatic cost tracking
            const response = await trackedAIClient.generateText({
              provider,
              model: provider === 'openai' ? 'gpt-4' : 'gemini-pro',
              messages: validMessages,
              temperature: 0.2,
              maxTokens: 1000,
              toolContext: {
                ...dynamicContext,
                modelVersion: provider === 'openai' ? 'gpt-4' : 'gemini-pro',
                temperature: 0.2,
                maxTokens: 1000
              }
            })

            return NextResponse.json({
              response: response.content,
              usage: response.usage,
              model: response.model
            })
          } catch (error) {
            // Don't log the error details in production to avoid information leakage
            if (process.env.NODE_ENV === 'development') {
              logger.error('AI Chat API error:', error)
            }

            return NextResponse.json(
              { error: 'Internal server error' },
              { status: 500 }
            )
          }
        }
      ) as Promise<NextResponse>
    }
  )
)

function getToolDisplayName(toolName: string): string {
  const toolNames: Record<string, string> = {
    'policy-advisor': 'Policy Advisor',
    'damage-analyzer': 'Damage Analyzer',
    'inventory-scanner': 'Inventory Scanner',
    'claim-assistant': 'Claim Assistant',
    'document-generator': 'Document Generator',
    'settlement-analyzer': 'Settlement Analyzer',
    'evidence-organizer': 'Evidence Organizer'
  }

  return toolNames[toolName] || 'AI Assistant'
}
