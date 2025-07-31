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
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, model }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(errorData.error || `Chat API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<string> {
    const response = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(errorData.error || `Image analysis API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response
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