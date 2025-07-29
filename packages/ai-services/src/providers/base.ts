import type { AIResponse } from '../types'

export abstract class AIProvider {
  protected apiKey: string
  protected name: string

  constructor(apiKey: string, name: string) {
    this.apiKey = apiKey
    this.name = name
  }

  abstract isAvailable(): boolean
  
  abstract extractDocument(
    fileUrl: string,
    prompt: string
  ): Promise<AIResponse>
  
  abstract generateText(
    prompt: string,
    context?: Record<string, any>
  ): Promise<AIResponse<string>>
  
  abstract analyzeImage(
    imageUrl: string,
    prompt: string
  ): Promise<AIResponse>

  getName(): string {
    return this.name
  }
}