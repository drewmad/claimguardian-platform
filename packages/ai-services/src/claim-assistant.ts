import pRetry from 'p-retry'

import { GeminiProvider } from './providers/gemini'
import { OpenAIProvider } from './providers/openai'
import type { ClaimAssistantContext, AIResponse } from './types'
import { BaseProvider } from './providers/base.provider'

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
  private providers: Map<string, BaseProvider> = new Map()

  constructor() {
    // Initialize providers
    const gemini = new GeminiProvider()
    const openai = new OpenAIProvider()

    if (gemini.isAvailable()) {
      this.providers.set('gemini', gemini)
    }
    if (openai.isAvailable()) {
      this.providers.set('openai', openai)
    }
  }

  private selectProvider(): BaseProvider | undefined {
    // Prefer Gemini for cost efficiency, fallback to OpenAI
    return this.providers.get('gemini') || this.providers.get('openai')
  }

  async getClaimGuidance(
    context: ClaimAssistantContext,
    userQuestion?: string
  ): Promise<AIResponse<ClaimGuidance>> {
    const provider = this.selectProvider()
    if (!provider) {
      return {
        success: false,
        error: 'No AI providers available'
      }
    }

    const prompt = this.buildGuidancePrompt(context, userQuestion)

    try {
      const result = await pRetry(
        async () => {
          const response = await provider.generateText(prompt, {
            userId: context.userId,
            propertyId: context.propertyId,
            claimId: context.claimId
          })

          if (!response.success) {
            throw new Error(response.error)
          }

          // Parse the response into structured guidance
          const guidance = this.parseGuidanceResponse(response.data)
          
          return {
            ...response,
            data: guidance
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate guidance'
      }
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
  ): Promise<AIResponse<string>> {
    const provider = this.selectProvider()
    if (!provider) {
      return {
        success: false,
        error: 'No AI providers available'
      }
    }

    const prompt = this.buildDocumentPrompt(templateType, context)

    try {
      return await pRetry(
        async () => provider.generateText(prompt, context),
        { retries: 2 }
      )
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate document'
      }
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