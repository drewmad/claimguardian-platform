import OpenAI from 'openai';

import type { 
  AIRequest, 
  AIResponse as NewAIResponse, 
  AIProviderConfig, 
  ChatRequest, 
  ChatResponse,
  ImageAnalysisRequest,
  ImageAnalysisResponse
} from '../types/index';

import { BaseAIProvider } from './base.provider';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;
  
  constructor(config: AIProviderConfig) {
    super(config);
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    });
    
    // Set up model mapping
    this.modelMapping = {
      'fast': 'gpt-4o-mini',
      'balanced': 'gpt-4o-mini',
      'powerful': 'gpt-4o'
    };
  }
  
  async generateText(request: AIRequest): Promise<NewAIResponse> {
    const start = Date.now();
    const model = this.selectModel(request);
    const prompt = this.buildPrompt(request);
    
    try {
      const completion = await this.withRetry(async () => {
        return await this.client.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7
        });
      });
      
      const text = completion.choices[0].message.content || '';
      const usage = completion.usage;
      
      const response: NewAIResponse = {
        text: this.sanitizeResponse(text),
        usage: this.createUsageMetrics(
          usage?.prompt_tokens || 0,
          usage?.completion_tokens || 0,
          model
        ),
        model,
        provider: 'openai',
        cached: false,
        latency: Date.now() - start,
        requestId: this.extractRequestId()
      };
      
      this.trackMetrics(start, request, response);
      return response;
      
    } catch (error) {
      this.handleError(error, request);
    }
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const model = this.selectModel(request);
    
    try {
      const completion = await this.withRetry(async () => {
        return await this.client.chat.completions.create({
          model,
          messages: request.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7
        });
      });
      
      const text = completion.choices[0].message.content || '';
      const usage = completion.usage;
      
      return {
        text: this.sanitizeResponse(text),
        usage: this.createUsageMetrics(
          usage?.prompt_tokens || 0,
          usage?.completion_tokens || 0,
          model
        ),
        model,
        provider: 'openai',
        cached: false,
        latency: Date.now() - start,
        requestId: this.extractRequestId(),
        role: 'assistant'
      };
      
    } catch (error) {
      this.handleError(error, request);
    }
  }
  
  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    const start = Date.now();
    const model = 'gpt-4o'; // Use vision model for images
    
    try {
      const completion = await this.withRetry(async () => {
        return await this.client.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: request.prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: request.imageUrl!
                  }
                }
              ]
            }
          ],
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.1
        });
      });
      
      const text = completion.choices[0].message.content || '';
      const usage = completion.usage;
      
      return {
        text: this.sanitizeResponse(text),
        usage: this.createUsageMetrics(
          usage?.prompt_tokens || 0,
          usage?.completion_tokens || 0,
          model
        ),
        model,
        provider: 'openai',
        cached: false,
        latency: Date.now() - start,
        requestId: this.extractRequestId(),
        analysis: {
          text: [text]
        }
      };
      
    } catch (error) {
      this.handleError(error, request);
    }
  }
  
  estimateCost(tokens: number, model: string): number {
    // OpenAI pricing per 1K tokens (as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };
    
    const prices = pricing[model] || pricing['gpt-4o-mini'];
    return (tokens / 1000) * prices.input; // Base cost for input tokens
  }
  
  validateResponse(response: any): boolean {
    return !!(
      response &&
      response.choices &&
      response.choices[0] &&
      response.choices[0].message &&
      response.choices[0].message.content
    );
  }
  
  getAvailableModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini'];
  }
}