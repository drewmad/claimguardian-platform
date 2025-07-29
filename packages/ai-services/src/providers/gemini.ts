import { GeminiProviderAdapter } from './gemini-adapter'

// Re-export the adapter as GeminiProvider for backward compatibility
export class GeminiProvider extends GeminiProviderAdapter {
  constructor(apiKey?: string) {
    super(apiKey)
  }
}