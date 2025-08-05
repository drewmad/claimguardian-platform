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
// AI configurations for the ClaimGuardian platform

export const AI_CONFIG = {
  gemini: {
    model: 'gemini-1.5-flash',
    maxTokens: 8192,
    temperature: 0.7,
  },
  openai: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 4096,
    temperature: 0.7,
  },
} as const

export type AIConfig = typeof AI_CONFIG

// Export prompt templates and schemas
export * from './prompts'
export * from './schemas'