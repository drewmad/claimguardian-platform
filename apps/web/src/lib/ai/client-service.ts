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
}