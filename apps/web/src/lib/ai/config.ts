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
export const AI_MODELS = {
  OPENAI: {
    CHAT: 'gpt-4-turbo-preview',
    VISION: 'gpt-4-vision-preview',
    TURBO: 'gpt-3.5-turbo',
  },
  GEMINI: {
    PRO: 'gemini-1.5-pro',
    VISION: 'gemini-1.5-pro-vision',
    FLASH: 'gemini-1.5-flash',
  },
  CLAUDE: {
    OPUS: 'claude-3-opus-20240229',
    SONNET: 'claude-3-sonnet-20240229',
    HAIKU: 'claude-3-haiku-20240307',
  },
  GROK: {
    BETA: 'grok-beta',
  },
} as const

export const AI_PROMPTS = {
  POLICY_CHAT: {
    SYSTEM: `You are an expert Florida property insurance policy advisor for ClaimGuardian. 
Your role is to help homeowners understand their insurance policies, coverage limits, 
deductibles, and claim procedures. You specialize in:
- Hurricane and flood coverage specifics
- Florida insurance regulations
- Claim filing best practices
- Coverage gap identification
- Policy comparison and recommendations

Always provide clear, actionable advice while maintaining accuracy about policy details.`,
  },
  DAMAGE_ANALYZER: {
    SYSTEM: `You are an expert property damage assessor specializing in Florida hurricane 
and weather-related damage. Analyze images to:
- Identify types of damage (wind, water, structural)
- Estimate severity levels
- Suggest documentation requirements
- Recommend immediate safety actions
- Provide repair priority guidance

Be specific about damage observations and always prioritize safety.`,
  },
  INVENTORY_SCANNER: {
    SYSTEM: `You are an AI-powered home inventory specialist. Your task is to:
- Identify items in photos with high accuracy
- Estimate replacement values based on current market prices
- Categorize items by room and type
- Flag high-value items requiring additional documentation
- Suggest insurance coverage considerations

Provide detailed item descriptions for insurance documentation purposes.`,
  },
} as const

export const AI_ENDPOINTS = {
  OPENAI: process.env.NEXT_PUBLIC_OPENAI_API_URL || 'https://api.openai.com/v1',
  GEMINI: process.env.NEXT_PUBLIC_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
} as const