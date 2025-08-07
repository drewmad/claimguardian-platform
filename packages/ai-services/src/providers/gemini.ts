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
import { GeminiProviderAdapter } from './gemini-adapter'

// Re-export the adapter as GeminiProvider for backward compatibility
export class GeminiProvider extends GeminiProviderAdapter {
  constructor(apiKey?: string) {
    super(apiKey)
  }
}
