import { GoogleGenerativeAI } from '@google/generative-ai';

import type { AIResponse } from '../types';
import { 
  AIRequest as NewAIRequest,
  AIResponse as NewAIResponse,
  ImageAnalysisRequest as NewImageAnalysisRequest 
} from '../types/index';

import { AIProvider } from './base';
import { GeminiProvider as NewGeminiProvider } from './gemini.provider';


/**
 * Adapter class that maintains backward compatibility while using the new provider
 */
export class GeminiProviderAdapter extends AIProvider {
  private newProvider: NewGeminiProvider;
  private client: GoogleGenerativeAI | null = null;

  constructor(apiKey?: string) {
    super(apiKey || process.env.GEMINI_API_KEY || '', 'gemini');
    
    // Initialize new provider
    this.newProvider = new NewGeminiProvider({
      apiKey: this.apiKey
    });
    
    if (this.apiKey) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  isAvailable(): boolean {
    return !!this.client && !!this.apiKey;
  }

  async extractDocument(fileUrl: string, prompt: string): Promise<AIResponse> {
    if (!this.isAvailable()) {
      return { success: false, error: 'Gemini API not configured' };
    }

    try {
      // Convert to new request format
      const request: NewImageAnalysisRequest = {
        imageUrl: fileUrl,
        prompt,
        userId: 'legacy-user', // Default for backward compatibility
        feature: 'document-extractor'
      };

      const response = await this.newProvider.analyzeImage(request);
      
      // Extract JSON from response if present
      let data: any;
      try {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          data = { content: response.text };
        }
      } catch {
        data = { content: response.text };
      }

      // Convert to old response format
      return {
        success: true,
        data,
        provider: this.name,
        processingTime: response.latency,
        confidence: data.confidence
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        provider: this.name,
        processingTime: 0
      };
    }
  }

  async generateText(prompt: string, context?: Record<string, any>): Promise<AIResponse<string>> {
    if (!this.isAvailable()) {
      return { success: false, error: 'Gemini API not configured' };
    }

    try {
      // Convert to new request format
      const request: NewAIRequest = {
        prompt,
        userId: 'legacy-user',
        feature: 'generic',
        metadata: context
      };

      const response = await this.newProvider.generateText(request);

      // Convert to old response format
      return {
        success: true,
        data: response.text,
        provider: this.name,
        processingTime: response.latency
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        provider: this.name,
        processingTime: 0
      };
    }
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<AIResponse> {
    if (!this.isAvailable()) {
      return { success: false, error: 'Gemini API not configured' };
    }

    try {
      // Convert to new request format
      const request: NewImageAnalysisRequest = {
        imageUrl,
        prompt,
        userId: 'legacy-user',
        feature: 'damage-analyzer'
      };

      const response = await this.newProvider.analyzeImage(request);

      // Convert to old response format
      return {
        success: true,
        data: response.text,
        provider: this.name,
        processingTime: response.latency
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        provider: this.name,
        processingTime: 0
      };
    }
  }
}