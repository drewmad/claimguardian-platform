import OpenAI from 'openai'

import type { AIResponse } from '../types'

import { AIProvider } from './base'

export class OpenAIProvider extends AIProvider {
  private client: OpenAI | null = null

  constructor(apiKey?: string) {
    super(apiKey || process.env.OPENAI_API_KEY || '', 'openai')
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey })
    }
  }

  isAvailable(): boolean {
    return !!this.client && !!this.apiKey
  }

  async extractDocument(fileUrl: string, prompt: string): Promise<AIResponse> {
    if (!this.isAvailable()) {
      return { success: false, error: 'OpenAI API not configured' }
    }

    const startTime = Date.now()

    try {
      // Fetch the file
      const response = await fetch(fileUrl)
      const arrayBuffer = await response.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      const completion = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${response.headers.get('content-type') || 'application/pdf'};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })

      const text = completion.choices[0].message.content || ''
      
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
      return { success: false, error: 'OpenAI API not configured' }
    }

    const startTime = Date.now()

    try {
      const messages: any[] = []
      
      if (context) {
        messages.push({
          role: 'system',
          content: `Context: ${JSON.stringify(context)}`
        })
      }
      
      messages.push({
        role: 'user',
        content: prompt
      })

      const completion = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })

      const text = completion.choices[0].message.content || ''

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
      return { success: false, error: 'OpenAI API not configured' }
    }

    const startTime = Date.now()

    try {
      // Fetch the image
      const response = await fetch(imageUrl)
      const arrayBuffer = await response.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      const completion = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })

      const text = completion.choices[0].message.content || ''

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