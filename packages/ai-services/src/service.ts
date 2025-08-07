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
import { CacheManager } from './cache/cache.manager';
import { SemanticCache } from './cache/semantic-cache';
import { CostTracker } from './monitoring/cost-tracker';
import { AIMonitoringDashboard } from './monitoring/dashboard';
import { AIOrchestrator } from './orchestrator/orchestrator';
import { GeminiProvider } from './providers/gemini.provider';
import { BaseAIProvider } from './providers/base.provider';
import type { AIRequest, ChatRequest, ImageAnalysisRequest } from './types/index';

// Singleton instance
let aiServiceInstance: AIService | null = null;

export class AIService {
  private orchestrator: AIOrchestrator;
  private cache: CacheManager;
  private costTracker: CostTracker;
  private monitoring: AIMonitoringDashboard;

  constructor() {
    // Initialize cache
    this.cache = new SemanticCache(
      process.env.REDIS_URL,
      process.env.AI_CACHE_ENABLED !== 'false'
    );

    // Initialize cost tracking
    this.costTracker = new CostTracker(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Initialize providers
    const providers: Record<string, BaseAIProvider> = {};

    // Add Gemini if configured
    if (process.env.GEMINI_API_KEY) {
      providers.gemini = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY
      });
    }

    // Add OpenAI if configured (to be implemented)
    // if (process.env.OPENAI_API_KEY) {
    //   providers.openai = new OpenAIProvider({
    //     apiKey: process.env.OPENAI_API_KEY
    //   });
    // }

    // Add Claude if configured (to be implemented)
    // if (process.env.ANTHROPIC_API_KEY) {
    //   providers.claude = new ClaudeProvider({
    //     apiKey: process.env.ANTHROPIC_API_KEY
    //   });
    // }

    // Initialize orchestrator
    this.orchestrator = new AIOrchestrator({
      providers,
      cache: this.cache,
      costTracker: this.costTracker,
      useSemanticCache: process.env.AI_SEMANTIC_CACHE === 'true',
      defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'gemini'
    });

    // Initialize monitoring
    this.monitoring = new AIMonitoringDashboard(
      this.costTracker,
      this.cache
    );

    console.log('[AIService] Initialized with providers:', Object.keys(providers));
  }

  // Delegate all methods to orchestrator
  async process(request: AIRequest) {
    return this.orchestrator.process(request);
  }

  async chat(request: ChatRequest) {
    return this.orchestrator.chat(request);
  }

  async analyzeImage(request: ImageAnalysisRequest) {
    return this.orchestrator.analyzeImage(request);
  }

  // Monitoring and management methods
  async getDashboard() {
    return this.monitoring.getDashboardData();
  }

  async getCacheStats() {
    return this.orchestrator.getCacheStats();
  }

  async clearCache() {
    return this.orchestrator.clearCache();
  }

  async getProviderStatus() {
    return this.orchestrator.getProviderStatus();
  }

  async getUserCosts(userId: string, period: 'day' | 'week' | 'month' = 'day') {
    return this.costTracker.getUserCosts(userId, period);
  }

  recordMetric(name: string, value: number) {
    this.monitoring.recordMetric(name, value);
  }

  async shutdown() {
    await this.cache.close();
    await this.costTracker.close();
  }
}

// Export singleton instance
export const aiService = (() => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
})();
