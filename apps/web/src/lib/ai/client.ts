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
  private claudeKey: string | null = null
  private grokKey: string | null = null

  constructor() {
    // On server-side, load keys from environment variables
    if (typeof window === 'undefined') {
      this.openaiKey = process.env.OPENAI_API_KEY || null
      this.geminiKey = process.env.GEMINI_API_KEY || null
      this.claudeKey = process.env.ANTHROPIC_API_KEY || null
      this.grokKey = process.env.XAI_API_KEY || null
    }
  }

  async chat(messages: ChatMessage[], model: 'openai' | 'gemini' | 'claude' | 'grok' = 'openai') {
    switch (model) {
      case 'openai':
        return this.openAIChat(messages)
      case 'gemini':
        return this.geminiChat(messages)
      case 'claude':
        return this.claudeChat(messages)
      case 'grok':
        return this.grokChat(messages)
      default:
        throw new Error(`Unsupported model: ${model}`)
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

  private async openAIChat(messages: ChatMessage[], retries = 3): Promise<string> {
    if (!this.openaiKey) throw new Error('OpenAI API key not configured')

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
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
          const errorData = await response.json().catch(() => ({}))
          
          // Handle specific error types
          if (response.status === 429) {
            // Rate limit - wait before retry
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
              continue
            }
            throw new Error('Rate limit exceeded. Please try again in a few minutes.')
          } else if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenAI configuration.')
          } else if (response.status >= 500) {
            // Server error - retry
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
              continue
            }
            throw new Error('OpenAI service is temporarily unavailable. Please try again later.')
          }
          
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from OpenAI')
        }
        
        return data.choices[0].message.content
      } catch (error) {
        if (attempt === retries) {
          throw error
        }
        
        // Only retry on network errors or server errors
        if (error instanceof TypeError || error.message.includes('fetch')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        
        throw error
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  private async geminiChat(messages: ChatMessage[], retries = 3): Promise<string> {
    if (!this.geminiKey) throw new Error('Gemini API key not configured')

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
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
          const errorData = await response.json().catch(() => ({}))
          
          // Handle specific error types
          if (response.status === 429) {
            // Rate limit - wait before retry
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
              continue
            }
            throw new Error('Rate limit exceeded. Please try again in a few minutes.')
          } else if (response.status === 403) {
            throw new Error('Invalid API key or insufficient permissions for Gemini.')
          } else if (response.status >= 500) {
            // Server error - retry
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
              continue
            }
            throw new Error('Gemini service is temporarily unavailable. Please try again later.')
          }
          
          throw new Error(errorData.error?.message || `Gemini API error: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response format from Gemini')
        }
        
        return data.candidates[0].content.parts[0].text
      } catch (error) {
        if (attempt === retries) {
          throw error
        }
        
        // Only retry on network errors or server errors
        if (error instanceof TypeError || error.message.includes('fetch')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        
        throw error
      }
    }
    
    throw new Error('Max retries exceeded')
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

  private async claudeChat(messages: ChatMessage[], retries = 3): Promise<string> {
    if (!this.claudeKey) throw new Error('Claude API key not configured')

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Convert messages to Claude format
        const systemMessage = messages.find(m => m.role === 'system')?.content || ''
        const conversationMessages = messages.filter(m => m.role !== 'system')

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            system: systemMessage,
            messages: conversationMessages.map(m => ({
              role: m.role,
              content: m.content
            }))
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          
          // Handle specific error types
          if (response.status === 429) {
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
              continue
            }
            throw new Error('Rate limit exceeded. Please try again in a few minutes.')
          } else if (response.status === 401) {
            throw new Error('Invalid Claude API key. Please check your Anthropic configuration.')
          } else if (response.status >= 500) {
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
              continue
            }
            throw new Error('Claude service is temporarily unavailable. Please try again later.')
          }
          
          throw new Error(errorData.error?.message || `Claude API error: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
          throw new Error('Invalid response format from Claude')
        }
        
        return data.content[0].text
      } catch (error) {
        if (attempt === retries) {
          throw error
        }
        
        // Only retry on network errors or server errors
        if (error instanceof TypeError || error.message.includes('fetch')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        
        throw error
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  private async grokChat(messages: ChatMessage[], retries = 3): Promise<string> {
    if (!this.grokKey) throw new Error('Grok API key not configured')

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.grokKey}`,
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            temperature: 0.7,
            max_tokens: 1000,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          
          // Handle specific error types
          if (response.status === 429) {
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
              continue
            }
            throw new Error('Rate limit exceeded. Please try again in a few minutes.')
          } else if (response.status === 401) {
            throw new Error('Invalid Grok API key. Please check your X.AI configuration.')
          } else if (response.status >= 500) {
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
              continue
            }
            throw new Error('Grok service is temporarily unavailable. Please try again later.')
          }
          
          throw new Error(errorData.error?.message || `Grok API error: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from Grok')
        }
        
        return data.choices[0].message.content
      } catch (error) {
        if (attempt === retries) {
          throw error
        }
        
        // Only retry on network errors or server errors
        if (error instanceof TypeError || error.message.includes('fetch')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        
        throw error
      }
    }
    
    throw new Error('Max retries exceeded')
  }
}