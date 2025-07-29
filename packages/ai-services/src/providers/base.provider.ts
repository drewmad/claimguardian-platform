import { 
  AIRequest, 
  AIResponse, 
  AIProviderConfig, 
  ChatRequest, 
  ChatResponse,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  AIServiceError
} from '../types/index';

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;
  protected modelMapping: Record<string, string> = {};
  
  constructor(config: AIProviderConfig) {
    this.config = config;
    this.validateConfig();
  }
  
  // Core methods that must be implemented
  abstract generateText(request: AIRequest): Promise<AIResponse>;
  abstract chat(request: ChatRequest): Promise<ChatResponse>;
  abstract estimateCost(tokens: number, model: string): number;
  abstract validateResponse(response: any): boolean;
  abstract getAvailableModels(): string[];
  
  // Optional methods with default implementations
  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    throw new AIServiceError(
      `Image analysis not supported by ${this.constructor.name}`,
      'FEATURE_NOT_SUPPORTED',
      this.constructor.name
    );
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    throw new AIServiceError(
      `Embeddings not supported by ${this.constructor.name}`,
      'FEATURE_NOT_SUPPORTED',
      this.constructor.name
    );
  }
  
  // Helper methods available to all providers
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if it's not retryable
        if (error instanceof AIServiceError && !error.retryable) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        if (i < maxRetries - 1) {
          const delay = Math.min(Math.pow(2, i) * 1000, 10000); // Max 10 seconds
          await this.delay(delay);
        }
      }
    }
    
    throw lastError!;
  }
  
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new AIServiceError(
        'API key is required',
        'INVALID_CONFIG',
        this.constructor.name
      );
    }
  }
  
  protected trackMetrics(start: number, request: AIRequest | ChatRequest, response: any): void {
    const latency = Date.now() - start;
    
    // In production, this would emit to a metrics collector
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.constructor.name}] Request completed`, {
        feature: request.feature,
        latency: `${latency}ms`,
        model: response.model || 'unknown',
        cached: false
      });
    }
  }
  
  protected buildPrompt(request: AIRequest): string {
    let prompt = '';
    
    // Add system prompt if provided
    if (request.systemPrompt) {
      prompt += request.systemPrompt + '\n\n';
    }
    
    // Add examples if provided
    if (request.examples && request.examples.length > 0) {
      prompt += 'Examples:\n';
      request.examples.forEach((example, i) => {
        prompt += `Example ${i + 1}:\n`;
        prompt += `Input: ${example.input}\n`;
        prompt += `Output: ${example.output}\n\n`;
      });
    }
    
    // Add the main prompt
    prompt += request.prompt;
    
    return prompt;
  }
  
  protected extractRequestId(): string {
    return `${this.constructor.name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Cost estimation helpers
  protected calculateTokenCost(
    promptTokens: number, 
    completionTokens: number, 
    model: string
  ): number {
    const costPerToken = this.estimateCost(1, model);
    
    // Most models charge different rates for input vs output
    const inputCost = promptTokens * costPerToken;
    const outputCost = completionTokens * costPerToken * 3; // Output typically 3x more expensive
    
    return Number((inputCost + outputCost).toFixed(6));
  }
  
  // Feature-specific model selection
  protected selectModel(request: AIRequest | ChatRequest): string {
    const feature = request.feature;
    const modelPreferences: Record<string, string> = {
      'clara': 'balanced',     // Empathetic responses need balance
      'clarity': 'fast',       // Calculations can use faster model
      'max': 'powerful',       // Analysis needs best model
      'sentinel': 'fast',      // Simple notifications
      'generic': 'balanced'    // Default to balanced
    };
    
    const preference = modelPreferences[feature] || 'balanced';
    return this.modelMapping[preference] || this.config.defaultModel || 'default';
  }
  
  // Response validation helpers
  protected isValidJSON(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }
  
  protected sanitizeResponse(text: string): string {
    // Remove any potential harmful content
    // In production, this would be more sophisticated
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
      .trim();
  }
  
  // Error handling
  protected handleError(error: any, request: AIRequest | ChatRequest): never {
    console.error(`[${this.constructor.name}] Error:`, {
      error: error.message || error,
      feature: request.feature,
      userId: request.userId
    });
    
    // Transform provider-specific errors to our error types
    if (error.message?.includes('rate limit')) {
      throw new AIServiceError(
        'Rate limit exceeded',
        'RATE_LIMIT',
        this.constructor.name,
        true
      );
    }
    
    if (error.message?.includes('timeout')) {
      throw new AIServiceError(
        'Request timed out',
        'TIMEOUT',
        this.constructor.name,
        true
      );
    }
    
    if (error.message?.includes('invalid api key')) {
      throw new AIServiceError(
        'Invalid API key',
        'AUTH_ERROR',
        this.constructor.name,
        false
      );
    }
    
    // Generic error
    throw new AIServiceError(
      error.message || 'Unknown error',
      'PROVIDER_ERROR',
      this.constructor.name,
      true
    );
  }
  
  // Usage tracking
  protected createUsageMetrics(
    promptTokens: number,
    completionTokens: number,
    model: string
  ) {
    return {
      promptTokens,
      completionTokens,
      totalCost: this.calculateTokenCost(promptTokens, completionTokens, model)
    };
  }
}