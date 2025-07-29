export * from './types'
export { DocumentExtractor } from './document-extractor'
export { ClaimAssistant } from './claim-assistant'
export { GeminiProvider } from './providers/gemini'
export { OpenAIProvider } from './providers/openai'

// Singleton instances for convenience
import { DocumentExtractor } from './document-extractor'
import { ClaimAssistant } from './claim-assistant'

let documentExtractorInstance: DocumentExtractor | null = null
let claimAssistantInstance: ClaimAssistant | null = null

export function getDocumentExtractor(): DocumentExtractor {
  if (!documentExtractorInstance) {
    documentExtractorInstance = new DocumentExtractor()
  }
  return documentExtractorInstance
}

export function getClaimAssistant(): ClaimAssistant {
  if (!claimAssistantInstance) {
    claimAssistantInstance = new ClaimAssistant()
  }
  return claimAssistantInstance
}