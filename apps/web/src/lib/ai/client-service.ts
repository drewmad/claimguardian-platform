/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ImageAnalysisRequest {
  image: string // base64 or URL
  prompt: string
  model?: 'openai' | 'gemini'
}

interface AIKeysStatus {
  hasOpenAIKey: boolean
  hasGeminiKey: boolean
  hasAnyKey: boolean
}

interface PolicyChatRequest {
  messages: ChatMessage[]
  policyDocument?: {
    fileUrl?: string
    content?: string
    type?: string
  }
}

interface PolicyChatResponse {
  response: string
  citations?: Array<{
    section: string
    content: string
  }>
}

export class AIClientService {
  async checkKeys(): Promise<AIKeysStatus> {
    const response = await fetch('/api/ai/check-keys')
    if (!response.ok) {
      throw new Error(`Failed to check API keys: ${response.statusText}`)
    }
    return response.json()
  }

  async chat(messages: ChatMessage[], model: 'openai' | 'gemini' = 'openai'): Promise<string> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, model }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))

        // Provide user-friendly error messages
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.')
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('AI service unavailable. Please try again later or contact support.')
        } else if (response.status >= 500) {
          throw new Error('AI service is temporarily down. Please try again in a few minutes.')
        } else if (response.status === 400) {
          throw new Error('Invalid request. Please check your input and try again.')
        }

        throw new Error(errorData.error || 'AI processing failed. Please try again.')
      }

      const data = await response.json()

      if (!data.response) {
        throw new Error('Invalid response from AI service. Please try again.')
      }

      return data.response
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<string> {
    try {
      const response = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))

        // Provide user-friendly error messages for image analysis
        if (response.status === 429) {
          throw new Error('Too many image analysis requests. Please wait a moment and try again.')
        } else if (response.status === 413) {
          throw new Error('Image is too large. Please use a smaller image and try again.')
        } else if (response.status === 400) {
          throw new Error('Invalid image format. Please use JPG or PNG images.')
        } else if (response.status >= 500) {
          throw new Error('Image analysis service is temporarily down. Please try again in a few minutes.')
        }

        throw new Error(errorData.error || 'Image analysis failed. Please try again with a different image.')
      }

      const data = await response.json()

      if (!data.response) {
        throw new Error('No analysis results received. Please try again.')
      }

      return data.response
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  async chatWithPolicy(request: PolicyChatRequest): Promise<PolicyChatResponse> {
    // Get Supabase URL and anon key from window for client-side
    const supabaseUrl = typeof window !== 'undefined'
      ? window.location.origin.includes('localhost')
        ? process.env.NEXT_PUBLIC_SUPABASE_URL
        : process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/policy-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(errorData.error || `Policy chat API error: ${response.statusText}`)
    }

    return response.json()
  }
}
