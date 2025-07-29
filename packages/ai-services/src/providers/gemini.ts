import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider } from './base'
import type { AIResponse } from '../types'

export class GeminiProvider extends AIProvider {
  private client: GoogleGenerativeAI | null = null

  constructor(apiKey?: string) {
    super(apiKey || process.env.GEMINI_API_KEY || '', 'gemini')
    if (this.apiKey) {
      this.client = new GoogleGenerativeAI(this.apiKey)
    }
  }

  isAvailable(): boolean {
    return !!this.client && !!this.apiKey
  }

  async extractDocument(fileUrl: string, prompt: string): Promise<AIResponse> {
    if (!this.isAvailable()) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const startTime = Date.now()
    
    try {
      const model = this.client!.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      // Fetch the file
      const response = await fetch(fileUrl)
      const arrayBuffer = await response.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: response.headers.get('content-type') || 'application/pdf',
                data: base64
              }
            }
          ]
        }]
      })

      const text = result.response.text()
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      const data = JSON.parse(jsonMatch[0])
      
      return {
        success: true,
        data,
        provider: this.name,
        processingTime: Date.now() - startTime,
        confidence: data.confidence
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        processingTime: Date.now() - startTime
      }
    }
  }

  async generateText(prompt: string, context?: Record<string, any>): Promise<AIResponse<string>> {
    if (!this.isAvailable()) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const startTime = Date.now()

    try {
      const model = this.client!.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      let fullPrompt = prompt
      if (context) {
        fullPrompt = `Context: ${JSON.stringify(context)}\n\n${prompt}`
      }

      const result = await model.generateContent(fullPrompt)
      const text = result.response.text()

      return {
        success: true,
        data: text,
        provider: this.name,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        processingTime: Date.now() - startTime
      }
    }
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<AIResponse> {
    if (!this.isAvailable()) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const startTime = Date.now()

    try {
      const model = this.client!.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      // Fetch the image
      const response = await fetch(imageUrl)
      const arrayBuffer = await response.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: response.headers.get('content-type') || 'image/jpeg',
                data: base64
              }
            }
          ]
        }]
      })

      const text = result.response.text()

      return {
        success: true,
        data: text,
        provider: this.name,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        processingTime: Date.now() - startTime
      }
    }
  }
}