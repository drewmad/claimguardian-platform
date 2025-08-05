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
// Export types
export * from './types/index';

// Export providers
export { AIProvider } from './providers/base';
export { GeminiProvider } from './providers/gemini';
export { OpenAIProvider } from './providers/openai';

// Export services
export { DocumentExtractor } from './document-extractor';
export { ClaimAssistant } from './claim-assistant';

// Export new architecture components (as they're implemented)
export { BaseAIProvider } from './providers/base.provider';
export { GeminiProvider as NewGeminiProvider } from './providers/gemini.provider';

// Export orchestrator and services
export { AIOrchestrator } from './orchestrator/orchestrator';
export { CacheManager } from './cache/cache.manager';
export { SemanticCache } from './cache/semantic-cache';
export { CostTracker } from './monitoring/cost-tracker';
export { AIMonitoringDashboard } from './monitoring/dashboard';

// Export main service
export { AIService, aiService } from './service';

// Export feature services
export { ClarityService } from './features/clarity/clarity.service';
export { SentinelService } from './features/sentinel/sentinel.service';
export { DocumentCategorizerService } from './features/categorizer/document-categorizer.service';