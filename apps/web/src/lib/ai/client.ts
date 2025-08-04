import { AI_MODELS, AI_ENDPOINTS } from './config'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ImageAnalysisRequest {
  image: string // base64 or URL
  prompt: string
  model?: 'openai' | 'gemini'
}

export class AIClient {
  private openaiKey: string | null = null
  private geminiKey: string | null = null

  constructor() {
    // WARNING: API key moved to server-side - use /api/ai endpoint instead
    // Initialize keys as null since they're now server-side only
  }

  async chat(messages: ChatMessage[], model: 'openai' | 'gemini' = 'openai') {
    if (model === 'openai') {
      return this.openAIChat(messages)
    } else {
      return this.geminiChat(messages)
    }
  }

  async analyzeImage(request: ImageAnalysisRequest) {
    const { model = 'openai' } = request
    
    if (model === 'openai') {
      return this.openAIVision(request)
    } else {
      return this.geminiVision(request)
    }
  }

  private async openAIChat(messages: ChatMessage[]) {
    if (!this.openaiKey) throw new Error('OpenAI API key not configured')

    const response = await fetch(`${AI_ENDPOINTS.OPENAI}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODELS.OPENAI.CHAT,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async geminiChat(messages: ChatMessage[]) {
    if (!this.geminiKey) throw new Error('Gemini API key not configured')

    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    // Add system prompt as first user message if exists
    const systemMessage = messages.find(m => m.role === 'system')
    if (systemMessage) {
      contents.unshift({
        role: 'user',
        parts: [{ text: `System: ${systemMessage.content}\n\nUser: ${contents[0]?.parts[0]?.text || ''}` }],
      })
      contents.splice(1, 1) // Remove duplicate user message
    }

    const response = await fetch(
      `${AI_ENDPOINTS.GEMINI}/models/${AI_MODELS.GEMINI.PRO}:generateContent?key=${this.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  private async openAIVision(request: ImageAnalysisRequest) {
    if (!this.openaiKey) throw new Error('OpenAI API key not configured')

    const response = await fetch(`${AI_ENDPOINTS.OPENAI}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODELS.OPENAI.VISION,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: request.prompt },
              {
                type: 'image_url',
                image_url: {
                  url: request.image.startsWith('data:') 
                    ? request.image 
                    : `data:image/jpeg;base64,${request.image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI Vision API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async geminiVision(request: ImageAnalysisRequest) {
    if (!this.geminiKey) throw new Error('Gemini API key not configured')

    const response = await fetch(
      `${AI_ENDPOINTS.GEMINI}/models/${AI_MODELS.GEMINI.VISION}:generateContent?key=${this.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: request.prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: request.image.split(',')[1] || request.image,
                },
              },
            ],
          }],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini Vision API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }
}