import { NextRequest, NextResponse } from 'next/server'
import { logger } from "@/lib/logger/production-logger"

import { AIClient } from '@/lib/ai/client'
import { inputSanitizer } from '@/lib/security/input-sanitizer'
import { withRateLimit, RateLimiter } from '@/lib/security/rate-limiter'

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    'ai-chat',
    RateLimiter.configs.moderate, // 50 requests per 15 minutes
    async () => {
      try {
        const body = await request.json()
        
        // Sanitize input data
        const sanitizedData = inputSanitizer.sanitizeFormData(body)
        const { messages, model = 'openai' } = sanitizedData

        // Validate messages
        if (!messages || !Array.isArray(messages)) {
          return NextResponse.json(
            { error: 'Messages array is required' },
            { status: 400 }
          )
        }

        // Validate model selection
        if (!['openai', 'gemini'].includes(model as string)) {
          return NextResponse.json(
            { error: 'Invalid model selection' },
            { status: 400 }
          )
        }

        // Additional validation for messages structure
        const validMessages = messages.filter(msg => 
          typeof msg === 'object' && 
          msg !== null && 
          typeof msg.content === 'string' &&
          ['user', 'assistant', 'system'].includes(msg.role)
        ).map(msg => ({
          role: msg.role,
          content: inputSanitizer.sanitizeText(msg.content, 10000) // Limit message length
        }))

        if (validMessages.length === 0) {
          return NextResponse.json(
            { error: 'No valid messages provided' },
            { status: 400 }
          )
        }

        const aiClient = new AIClient()
        const response = await aiClient.chat(validMessages, model as 'openai' | 'gemini')

        return NextResponse.json({ response })
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
  )
}
