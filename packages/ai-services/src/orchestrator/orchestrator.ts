import { BaseAIProvider } from '../providers/base.provider';
import { CacheManager } from '../cache/cache.manager';
import { SemanticCache } from '../cache/semantic-cache';
import { CostTracker } from '../monitoring/cost-tracker';
import {
  AIRequest,
  AIResponse,
  ChatRequest,
  ChatResponse,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  AIServiceError
} from '../types/index';

interface OrchestratorConfig {
  providers: Record<string, BaseAIProvider>;
  cache?: CacheManager;
  costTracker?: CostTracker;
  useSemanticCache?: boolean;
  defaultProvider?: string;
}

export class AIOrchestrator {
  private providers: Map<string, BaseAIProvider>;
  private cache: CacheManager | SemanticCache;
  private costTracker?: CostTracker;
  private defaultProvider: string;
  
  constructor(config: OrchestratorConfig) {
    this.providers = new Map(Object.entries(config.providers));
    
    // Use semantic cache if requested
    if (config.useSemanticCache) {
      this.cache = new SemanticCache(
        process.env.REDIS_URL,
        config.cache !== undefined
      );
    } else {
      this.cache = config.cache || new CacheManager(process.env.REDIS_URL, false);
    }
    
    this.costTracker = config.costTracker;
    this.defaultProvider = config.defaultProvider || 'gemini';
    
    // Validate at least one provider exists
    if (this.providers.size === 0) {
      throw new Error('At least one AI provider must be configured');
    }
  }
  
  async process(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    
    // 1. Check cache
    const cached = await this.checkCache(request);
    if (cached) {
      console.log(`[Orchestrator] Cache hit for ${request.feature}`);
      return cached;
    }
    
    // 2. Select provider
    const provider = this.selectProvider(request);
    if (!provider) {
      throw new AIServiceError(
        'No suitable provider available',
        'NO_PROVIDER',
        'orchestrator'
      );
    }
    
    // 3. Process request with fallback
    let response: AIResponse;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`[Orchestrator] Processing with ${provider.constructor.name}`);
        response = await provider.generateText(request);
        break;
      } catch (error) {
        attempts++;
        console.error(`[Orchestrator] Provider failed (attempt ${attempts}):`, error);
        
        if (attempts >= maxAttempts) {
          // Try fallback provider
          const fallback = this.getFallbackProvider(provider);
          if (fallback) {
            console.log(`[Orchestrator] Trying fallback provider ${fallback.constructor.name}`);
            response = await fallback.generateText(request);
          } else {
            throw error;
          }
        }
      }
    }
    
    // 4. Track costs
    if (this.costTracker && response!) {
      await this.costTracker.track(
        request.userId,
        response.usage,
        request.feature,
        response.provider
      );
    }
    
    // 5. Cache response
    await this.cacheResponse(request, response!);
    
    // 6. Add orchestration metadata
    return {
      ...response!,
      orchestrated: true,
      totalLatency: Date.now() - start
    };
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    
    // Check cache for chat (less likely to hit due to conversation context)
    const cached = await this.checkCache(request);
    if (cached) {
      return cached as ChatResponse;
    }
    
    const provider = this.selectProvider(request);
    if (!provider) {
      throw new AIServiceError(
        'No suitable provider available for chat',
        'NO_PROVIDER',
        'orchestrator'
      );
    }
    
    const response = await provider.chat(request);
    
    // Track costs
    if (this.costTracker) {
      await this.costTracker.track(
        request.userId,
        response.usage,
        request.feature,
        response.provider
      );
    }
    
    // Cache if appropriate (short TTL for conversations)
    await this.cacheResponse(request, response, 300); // 5 minutes
    
    return {
      ...response,
      orchestrated: true,
      totalLatency: Date.now() - start
    };
  }
  
  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    const provider = this.selectProvider(request);
    if (!provider) {
      throw new AIServiceError(
        'No suitable provider available for image analysis',
        'NO_PROVIDER',
        'orchestrator'
      );
    }
    
    const response = await provider.analyzeImage(request);
    
    // Track costs
    if (this.costTracker) {
      await this.costTracker.track(
        request.userId,
        response.usage,
        request.feature,
        response.provider
      );
    }
    
    return response;
  }
  
  private async checkCache(request: AIRequest | ChatRequest): Promise<AIResponse | null> {
    if (this.cache instanceof SemanticCache && 'prompt' in request) {
      // Generate embedding for semantic search
      const embedding = await this.cache.generateEmbedding(request.prompt);
      return await this.cache.findSimilar(request, embedding);
    } else {
      return await this.cache.get(request);
    }
  }
  
  private async cacheResponse(
    request: AIRequest | ChatRequest,
    response: AIResponse,
    ttlOverride?: number
  ): Promise<void> {
    if (this.cache instanceof SemanticCache && 'prompt' in request) {
      const embedding = await this.cache.generateEmbedding(request.prompt);
      await this.cache.setWithEmbedding(request, response, embedding, ttlOverride);
    } else {
      await this.cache.set(request, response, ttlOverride);
    }
  }
  
  private selectProvider(request: AIRequest | ChatRequest | ImageAnalysisRequest): BaseAIProvider | null {
    // Provider selection logic based on:
    // 1. Feature requirements
    // 2. Provider capabilities
    // 3. Cost optimization
    // 4. Current availability
    
    const preferredProviders: Record<string, string[]> = {
      'clara': ['claude', 'gemini', 'openai'],      // Claude best for empathy
      'clarity': ['gemini', 'openai', 'claude'],    // Gemini good for analysis
      'max': ['openai', 'gemini', 'claude'],        // OpenAI best for reasoning
      'sentinel': ['gemini', 'openai', 'claude'],   // Any fast model
      'damage-analyzer': ['gemini', 'openai'],      // Vision capabilities
      'document-extractor': ['gemini', 'openai'],   // Document processing
      'generic': ['gemini', 'openai', 'claude']     // Default order
    };
    
    const feature = 'feature' in request ? request.feature : 'generic';
    const preferred = preferredProviders[feature] || preferredProviders.generic;
    
    // Try providers in preferred order
    for (const providerName of preferred) {
      const provider = this.providers.get(providerName);
      if (provider) {
        return provider;
      }
    }
    
    // Return default provider if available
    return this.providers.get(this.defaultProvider) || this.providers.values().next().value;
  }
  
  private getFallbackProvider(primary: BaseAIProvider): BaseAIProvider | null {
    // Find a different provider as fallback
    for (const [name, provider] of this.providers) {
      if (provider !== primary) {
        return provider;
      }
    }
    return null;
  }
  
  async getProviderStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers) {
      try {
        // Simple health check - try to get available models
        const models = provider.getAvailableModels();
        status[name] = models.length > 0;
      } catch {
        status[name] = false;
      }
    }
    
    return status;
  }
  
  async getCacheStats() {
    return await this.cache.getStats();
  }
  
  async clearCache() {
    await this.cache.clear();
  }
}