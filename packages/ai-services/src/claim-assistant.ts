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
import pRetry from 'p-retry'

import { BaseAIProvider } from './providers/base.provider'
import { GeminiProvider } from './providers/gemini.provider'
import { OpenAIProvider } from './providers/openai.provider'
import type { ClaimAssistantContext, AIResponse } from './types'

interface ClaimStep {
  id: string
  title: string
  description: string
  completed: boolean
  requiredDocuments?: string[]
  tips?: string[]
}

interface ClaimGuidance {
  currentStep: string
  steps: ClaimStep[]
  nextActions: string[]
  estimatedTimeRemaining?: string
  warnings?: string[]
}

export class ClaimAssistant {
  private providers: Map<string, BaseAIProvider> = new Map()

  constructor() {
    // Initialize providers
    if (process.env.GEMINI_API_KEY) {
      const gemini = new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY })
      if (this.isAvailable(gemini)) {
        this.providers.set('gemini', gemini)
      }
    }

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY })
      if (this.isAvailable(openai)) {
        this.providers.set('openai', openai)
      }
    }
  }

  private isAvailable(provider: BaseAIProvider): boolean {
    return provider.getAvailableModels().length > 0
  }

  private selectProvider(): BaseAIProvider | undefined {
    // Prefer Gemini for cost efficiency, fallback to OpenAI
    return this.providers.get('gemini') || this.providers.get('openai')
  }

  async getClaimGuidance(
    context: ClaimAssistantContext,
    userQuestion?: string
  ): Promise<AIResponse> {
    const provider = this.selectProvider()
    if (!provider) {
      throw new Error('No AI providers available')
    }

    const prompt = this.buildGuidancePrompt(context, userQuestion)

    try {
      const result = await pRetry(
        async () => {
          const response = await provider.generateText({
            prompt,
            userId: context.userId,
            feature: 'document-categorizer'
          })

          // Parse the response into structured guidance
          const guidance = this.parseGuidanceResponse(response.text)

          return {
            success: true,
            data: JSON.stringify(guidance),
            provider: response.provider
          }
        },
        {
          retries: 2,
          onFailedAttempt: error => {
            console.warn(`Guidance generation attempt ${error.attemptNumber} failed:`, error.message)
          }
        }
      )

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate guidance')
    }
  }

  private buildGuidancePrompt(
    context: ClaimAssistantContext,
    userQuestion?: string
  ): string {
    let prompt = `You are an expert Florida insurance claim assistant helping a property owner navigate their claim process.

Context:
- User ID: ${context.userId}
${context.propertyId ? `- Property ID: ${context.propertyId}` : ''}
${context.claimId ? `- Claim ID: ${context.claimId}` : ''}

Previous conversation:
${context.previousMessages?.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n') || 'No previous messages'}

Please provide step-by-step guidance for the insurance claim process in Florida. Include:
1. Current recommended step
2. List of all steps with completion status
3. Next actions to take
4. Required documents for current step
5. Helpful tips and warnings
6. Estimated time remaining

Format your response as a structured guide that's easy to follow.`

    if (userQuestion) {
      prompt += `\n\nUser's specific question: ${userQuestion}`
    }

    return prompt
  }

  private parseGuidanceResponse(text: string): ClaimGuidance {
    // Default structure if parsing fails
    const defaultGuidance: ClaimGuidance = {
      currentStep: 'initial-documentation',
      steps: [
        {
          id: 'initial-documentation',
          title: 'Gather Initial Documentation',
          description: 'Collect all necessary documents for your claim',
          completed: false,
          requiredDocuments: ['Policy documents', 'Photos of damage', 'Receipts']
        }
      ],
      nextActions: ['Take photos of all damage', 'Contact your insurance company']
    }

    try {
      // Attempt to extract structured data from the AI response
      // This is a simplified parser - you might want to use more sophisticated parsing
      const lines = text.split('\n')
      const guidance: ClaimGuidance = { ...defaultGuidance }

      // Parse the response (simplified example)
      lines.forEach(line => {
        if (line.includes('Current Step:')) {
          guidance.currentStep = line.replace('Current Step:', '').trim()
        }
        // Add more parsing logic as needed
      })

      return guidance
    } catch (error) {
      console.error('Failed to parse guidance response:', error)
      return defaultGuidance
    }
  }

  async generateDocument(
    templateType: 'demand-letter' | 'appeal' | 'complaint',
    context: Record<string, unknown>
  ): Promise<AIResponse> {
    const provider = this.selectProvider()
    if (!provider) {
      throw new Error('No AI providers available')
    }

    const prompt = this.buildDocumentPrompt(templateType, context)

    try {
      const response = await pRetry(
        async () => provider.generateText({
          prompt,
          userId: context.userId as string,
          feature: 'document-categorizer'
        }),
        { retries: 2 }
      )

      return {
        success: true,
        data: response.text,
        provider: response.provider
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate document')
    }
  }

  private buildDocumentPrompt(
    templateType: string,
    context: Record<string, unknown>
  ): string {
    const templates: Record<string, string> = {
      'demand-letter': `Generate a professional demand letter for an insurance claim with the following details:
- Claim number: ${context.claimNumber}
- Policy number: ${context.policyNumber}
- Date of loss: ${context.dateOfLoss}
- Description of damage: ${context.damageDescription}
- Amount claimed: ${context.amountClaimed}

Include all necessary legal language and formatting for Florida insurance claims.`,

      'appeal': `Generate an appeal letter for a denied insurance claim with the following details:
- Original claim number: ${context.claimNumber}
- Denial reason: ${context.denialReason}
- Supporting evidence: ${context.evidence}

Make it professional and compelling, citing relevant Florida insurance statutes.`,

      'complaint': `Generate a formal complaint letter to the Florida Department of Financial Services regarding:
- Insurance company: ${context.insurerName}
- Issue: ${context.issue}
- Attempts to resolve: ${context.resolutionAttempts}

Follow the official complaint format required by Florida regulators.`
    }

    return (templates as Record<string, string>)[templateType] || 'Generate a professional insurance document.'
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }
}
