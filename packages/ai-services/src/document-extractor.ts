import pRetry from 'p-retry'

import { GeminiProvider } from './providers/gemini'
import { OpenAIProvider } from './providers/openai'
import type { 
  DocumentExtractionRequest, 
  ExtractedPolicyData, 
  AIResponse 
} from './types'

export class DocumentExtractor {
  private providers: Map<string, any> = new Map()
  private cache: Map<string, AIResponse<ExtractedPolicyData>> = new Map()
  private cacheTTL = 3600000 // 1 hour

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

  private buildExtractionPrompt(): string {
    return `
You are an AI assistant specialized in extracting structured data from insurance policy documents. 

Please analyze this insurance policy document and extract the following information in JSON format:

{
  "policyNumber": "string - The policy number",
  "carrierName": "string - Insurance company name",
  "policyType": "string - Type of policy (HO3, HO5, etc.)",
  "coverageAmount": "number - Total coverage amount in dollars",
  "deductible": "number - Standard deductible amount",
  "windDeductible": "string|number - Wind/hurricane deductible (percentage or dollar amount)",
  "floodDeductible": "number - Flood deductible if applicable",
  "effectiveDate": "string - Policy effective date (YYYY-MM-DD)",
  "expirationDate": "string - Policy expiration date (YYYY-MM-DD)",
  "propertyAddress": "string - Insured property address",
  "namedInsured": "string - Primary insured person/entity",
  "premiumAmount": "number - Annual premium amount",
  "additionalCoverages": ["array of strings - Additional coverage types"],
  "confidence": "number - Your confidence in the extraction (0-1)"
}

Rules:
- Only include fields you can clearly identify in the document
- For dates, use YYYY-MM-DD format
- For monetary amounts, use numbers without currency symbols
- If uncertain about a field, omit it rather than guessing
- Provide a confidence score between 0 and 1
    `.trim()
  }

  private getCacheKey(request: DocumentExtractionRequest): string {
    return `${request.fileUrl}-${request.apiProvider || 'auto'}`
  }

  private checkCache(key: string): AIResponse<ExtractedPolicyData> | null {
    const cached = this.cache.get(key)
    if (cached && cached.cached) {
      const age = Date.now() - (cached.processingTime || 0)
      if (age < this.cacheTTL) {
        return { ...cached, cached: true }
      }
      this.cache.delete(key)
    }
    return null
  }

  async extract(
    request: DocumentExtractionRequest
  ): Promise<AIResponse<ExtractedPolicyData>> {
    // Check cache
    const cacheKey = this.getCacheKey(request)
    const cached = this.checkCache(cacheKey)
    if (cached) return cached

    // Select provider
    let provider
    if (request.apiProvider) {
      provider = this.providers.get(request.apiProvider)
      if (!provider) {
        return {
          success: false,
          error: `Provider ${request.apiProvider} not available`
        }
      }
    } else {
      // Use first available provider
      provider = this.providers.values().next().value
      if (!provider) {
        return {
          success: false,
          error: 'No AI providers available'
        }
      }
    }

    // Extract with retry
    try {
      const result = await pRetry(
        async () => {
          const response = await provider.extractDocument(
            request.fileUrl,
            this.buildExtractionPrompt()
          )
          
          if (!response.success) {
            throw new Error(response.error)
          }
          
          return response
        },
        {
          retries: 3,
          onFailedAttempt: error => {
            console.warn(`Extraction attempt ${error.attemptNumber} failed:`, error.message)
          }
        }
      )

      // Validate confidence threshold
      if (request.confidenceThreshold && result.data?.confidence) {
        if (result.data.confidence < request.confidenceThreshold) {
          console.warn('Extraction confidence below threshold', {
            confidence: result.data.confidence,
            threshold: request.confidenceThreshold
          })
        }
      }

      // Cache result
      this.cache.set(cacheKey, { ...result, cached: true })

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed'
      }
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  clearCache(): void {
    this.cache.clear()
  }
}