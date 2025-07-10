import { NextRequest, NextResponse } from 'next/server'
import { AIClient } from '@/lib/ai/client'
import { inputSanitizer } from '@/lib/security/input-sanitizer'
import { withRateLimit, rateLimiter } from '@/lib/security/rate-limiter'
import { withErrorHandling } from '@/lib/error-handling/async-error-handler'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    'ai-analyze-image',
    rateLimiter.configs.strict, // 5 requests per 15 minutes for image analysis
    async () => {
      const result = await withErrorHandling(async () => {
        const body = await request.json()
        
        // Sanitize input data
        const sanitizedData = inputSanitizer.sanitizeFormData(body)
        const { image, prompt, model = 'openai' } = sanitizedData

        // Validate required fields
        if (!image || !prompt) {
          throw new Error('Image and prompt are required')
        }

        // Validate model selection
        if (!['openai', 'gemini'].includes(model)) {
          throw new Error('Invalid model selection')
        }

        // Sanitize prompt
        const sanitizedPrompt = inputSanitizer.sanitizeText(prompt, 5000)
        if (!sanitizedPrompt) {
          throw new Error('Invalid prompt provided')
        }

        // Validate image data (basic checks)
        if (typeof image !== 'string' || !image.startsWith('data:image/')) {
          throw new Error('Invalid image format')
        }

        const aiClient = new AIClient()
        const response = await aiClient.analyzeImage({ 
          image, 
          prompt: sanitizedPrompt, 
          model 
        })

        return { response }
      }, 'AI Image Analysis')

      if (!result.success) {
        logger.error('AI Image Analysis failed', result.error)
        
        // Determine appropriate status code based on error
        const status = result.error.message.includes('required') || 
                      result.error.message.includes('Invalid') ? 400 : 500
        
        return NextResponse.json(
          { error: result.error.message },
          { status }
        )
      }

      return NextResponse.json(result.data)
    }
  )
}