/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Google Gemini AI provider implementation with latest models support"
 * @dependencies ["@google/generative-ai"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { 
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold
} from '@google/generative-ai';

import {
  AIRequest,
  AIResponse,
  AIProviderConfig,
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  AIServiceError,
  InvalidResponseError
} from '../types/index';

import { BaseAIProvider } from './base.provider';

export class GeminiProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI;
  
  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
    
    // Model mapping for different use cases - Updated to latest Gemini models (Jan 2025)
    this.modelMapping = {
      'fast': 'gemini-2.0-flash-exp',        // Latest flash model with improved speed
      'balanced': 'gemini-1.5-pro-002',      // Latest stable Pro with better performance
      'powerful': 'gemini-1.5-pro-002',      // Same as balanced for consistency
      'vision': 'gemini-2.0-flash-exp'       // Flash 2.0 has excellent vision capabilities
    };
  }
  
  async generateText(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const requestId = this.extractRequestId();
    
    try {
      const model = this.selectModel(request);
      const genAI = this.client.getGenerativeModel({ model });
      
      const prompt = this.buildPrompt(request);
      
      const result = await this.withRetry(async () => {
        return await genAI.generateContent({
          contents: [{ 
            role: 'user', 
            parts: [{ text: prompt }] 
          }],
          generationConfig: {
            maxOutputTokens: request.maxTokens || 8192,  // Increased default for better responses
            temperature: request.temperature || 0.7,
            topP: 0.95,
            topK: model.includes('2.0') ? 64 : 40,  // Higher topK for Gemini 2.0
            candidateCount: 1
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            }
          ]
        });
      });
      
      const response = await result.response;
      const text = response.text();
      
      // Validate response
      if (!this.validateResponse(text)) {
        throw new InvalidResponseError('gemini', 'Empty or invalid response');
      }
      
      // If JSON format requested, validate JSON
      if (request.responseFormat === 'json' && !this.isValidJSON(text)) {
        throw new InvalidResponseError('gemini', 'Invalid JSON response');
      }
      
      // Extract token usage (Gemini doesn't provide exact counts, so we estimate)
      const usage = this.estimateTokenUsage(prompt, text);
      
      this.trackMetrics(start, request, { model });
      
      return {
        text: this.sanitizeResponse(text),
        usage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalCost: this.calculateTokenCost(
            usage.promptTokens,
            usage.completionTokens,
            model
          )
        },
        model,
        provider: 'gemini',
        cached: false,
        latency: Date.now() - start,
        requestId
      };
    } catch (error) {
      this.handleError(error, request);
    }
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const requestId = this.extractRequestId();
    
    try {
      const model = this.selectModel(request);
      const genAI = this.client.getGenerativeModel({ model });
      
      // Convert chat messages to Gemini format
      const contents = this.convertMessagesToGeminiFormat(request.messages);
      
      const result = await this.withRetry(async () => {
        return await genAI.generateContent({
          contents,
          generationConfig: {
            maxOutputTokens: request.maxTokens || 8192,  // Increased default
            temperature: request.temperature || 0.7,
            topP: 0.95,
            topK: model.includes('2.0') ? 64 : 40,  // Higher topK for Gemini 2.0
            candidateCount: 1
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            }
          ]
        });
      });
      
      const response = await result.response;
      const text = response.text();
      
      if (!this.validateResponse(text)) {
        throw new InvalidResponseError('gemini', 'Empty or invalid response');
      }
      
      const usage = this.estimateTokenUsage(
        request.messages.map(m => m.content).join(' '),
        text
      );
      
      this.trackMetrics(start, request, { model });
      
      return {
        text: this.sanitizeResponse(text),
        role: 'assistant',
        usage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalCost: this.calculateTokenCost(
            usage.promptTokens,
            usage.completionTokens,
            model
          )
        },
        model,
        provider: 'gemini',
        cached: false,
        latency: Date.now() - start,
        requestId
      };
    } catch (error) {
      this.handleError(error, request);
    }
  }
  
  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    const start = Date.now();
    const requestId = this.extractRequestId();
    
    try {
      const model = this.modelMapping.vision;
      const genAI = this.client.getGenerativeModel({ model });
      
      // Get image data
      const imageData = await this.getImageData(request);
      
      const result = await this.withRetry(async () => {
        return await genAI.generateContent({
          contents: [{
            role: 'user',
            parts: [
              { text: request.prompt },
              {
                inlineData: {
                  mimeType: imageData.mimeType,
                  data: imageData.base64
                }
              }
            ]
          }],
          generationConfig: {
            maxOutputTokens: request.maxTokens || 8192,
            temperature: request.temperature || 0.4,  // Lower temp for vision tasks
            topP: 0.95,
            topK: model.includes('2.0') ? 64 : 40
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            }
          ]
        });
      });
      
      const response = await result.response;
      const text = response.text();
      
      if (!this.validateResponse(text)) {
        throw new InvalidResponseError('gemini', 'Empty or invalid response');
      }
      
      // Parse analysis result
      const analysis = this.parseImageAnalysis(text);
      
      const usage = this.estimateTokenUsage(request.prompt, text);
      
      return {
        text,
        analysis: analysis as Record<string, unknown>,
        usage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalCost: this.calculateTokenCost(
            usage.promptTokens,
            usage.completionTokens,
            model
          )
        },
        model,
        provider: 'gemini',
        cached: false,
        latency: Date.now() - start,
        requestId
      };
    } catch (error) {
      this.handleError(error, request);
    }
  }
  
  estimateCost(tokens: number, model: string): number {
    // Gemini pricing as of Jan 2025 (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-2.0-flash-exp': { 
        input: 0.00000,   // Free during experimental period
        output: 0.00000   // Free during experimental period
      },
      'gemini-1.5-flash': { 
        input: 0.00001,   // $0.01 per 1M tokens
        output: 0.00003   // $0.03 per 1M tokens
      },
      'gemini-1.5-pro-002': { 
        input: 0.00005,   // $0.05 per 1M tokens
        output: 0.00015   // $0.15 per 1M tokens
      },
      'gemini-1.5-pro': { 
        input: 0.00005,   // $0.05 per 1M tokens
        output: 0.00015   // $0.15 per 1M tokens
      }
    };
    
    const modelPricing = pricing[model] || pricing['gemini-1.5-pro-002'];
    return (tokens / 1000) * modelPricing.input; // Simplified - assumes input tokens
  }
  
  validateResponse(response: unknown): boolean {
    return typeof response === 'string' && response.trim().length > 0;
  }
  
  getAvailableModels(): string[] {
    return Object.values(this.modelMapping);
  }
  
  // Helper methods specific to Gemini
  
  private convertMessagesToGeminiFormat(messages: ChatMessage[]): any[] {
    const contents: any[] = [];
    
    // Gemini doesn't have a system role, so we prepend it to the first user message
    let systemPrompt = '';
    
    for (const message of messages) {
      if (message.role === 'system') {
        systemPrompt += message.content + '\n\n';
      } else if (message.role === 'user') {
        const content = systemPrompt + message.content;
        systemPrompt = ''; // Clear after first use
        contents.push({
          role: 'user',
          parts: [{ text: content }]
        });
      } else if (message.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: message.content }]
        });
      }
    }
    
    return contents;
  }
  
  private async getImageData(request: ImageAnalysisRequest): Promise<{
    base64: string;
    mimeType: string;
  }> {
    if (request.imageBase64) {
      // Assume JPEG if not specified
      return {
        base64: request.imageBase64,
        mimeType: 'image/jpeg'
      };
    }
    
    if (request.imageUrl) {
      const response = await fetch(request.imageUrl);
      if (!response.ok) {
        throw new AIServiceError(
          'Failed to fetch image',
          'IMAGE_FETCH_ERROR',
          'gemini'
        );
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      
      return { base64, mimeType };
    }
    
    throw new AIServiceError(
      'No image data provided',
      'INVALID_REQUEST',
      'gemini'
    );
  }
  
  private parseImageAnalysis(text: string): unknown {
    // Try to extract structured data from the response
    try {
      // Look for JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, return structured text analysis
    }
    
    // Basic text analysis if no JSON found
    return {
      description: text,
      labels: this.extractLabels(text),
      text: this.extractText(text)
    };
  }
  
  private extractLabels(text: string): string[] {
    // Simple label extraction - in production, this would be more sophisticated
    const labelMatches = text.match(/(?:contains?|shows?|depicts?|includes?):\s*([^.]+)/gi);
    if (labelMatches) {
      return labelMatches.map(match => 
        match.replace(/(?:contains?|shows?|depicts?|includes?):\s*/i, '').trim()
      );
    }
    return [];
  }
  
  private extractText(text: string): string[] {
    // Extract unknown quoted text or text mentions
    const textMatches = text.match(/"([^"]+)"/g);
    if (textMatches) {
      return textMatches.map(match => match.replace(/"/g, ''));
    }
    return [];
  }
  
  private estimateTokenUsage(prompt: string, response: string): {
    promptTokens: number;
    completionTokens: number;
  } {
    // Rough estimation: ~1 token per 4 characters for English text
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(response.length / 4);
    
    return { promptTokens, completionTokens };
  }
  
  // Override error handling for Gemini-specific errors
  protected handleError(error: unknown, request: AIRequest | ChatRequest): never {
    const err = error as Error;
    console.error('[GeminiProvider] Error:', {
      error: err.message || error,
      feature: request.feature,
      userId: request.userId,
      model: this.selectModel(request)
    });
    
    // Handle Gemini-specific errors
    if (err.message?.includes('API key not valid')) {
      throw new AIServiceError(
        'Invalid Gemini API key',
        'AUTH_ERROR',
        'gemini',
        false
      );
    }
    
    if (err.message?.includes('Resource has been exhausted')) {
      throw new AIServiceError(
        'Gemini quota exceeded',
        'QUOTA_EXCEEDED',
        'gemini',
        true
      );
    }
    
    if (err.message?.includes('SAFETY') || err.message?.includes('blocked')) {
      throw new AIServiceError(
        'Content blocked by safety filters',
        'SAFETY_BLOCK',
        'gemini',
        false
      );
    }
    
    // Gemini 2.0 specific errors
    if (err.message?.includes('model not found') || err.message?.includes('not available')) {
      throw new AIServiceError(
        'Model not available - falling back to stable version',
        'MODEL_NOT_FOUND',
        'gemini',
        true  // Retryable with different model
      );
    }
    
    if (err.message?.includes('context length exceeded')) {
      throw new AIServiceError(
        'Context length exceeded - try reducing input size',
        'CONTEXT_LENGTH_EXCEEDED',
        'gemini',
        false
      );
    }
    
    // Fall back to base error handling
    super.handleError(error, request);
  }
}