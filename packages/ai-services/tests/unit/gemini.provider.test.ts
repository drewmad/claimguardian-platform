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
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiProvider } from '../../src/providers/gemini.provider';
import { AIRequest } from '../../src/types';

// Mock the Google Generative AI library
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Test response from Gemini'
        }
      })
    })
  }))
}));

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    provider = new GeminiProvider({
      apiKey: 'test-api-key'
    });
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const request: AIRequest = {
        prompt: 'Test prompt',
        userId: 'test-user',
        feature: 'generic'
      };

      const response = await provider.generateText(request);

      expect(response).toMatchObject({
        text: 'Test response from Gemini',
        provider: 'gemini',
        cached: false,
        model: expect.any(String),
        usage: {
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
          totalCost: expect.any(Number)
        }
      });
    });

    it('should handle system prompts', async () => {
      const request: AIRequest = {
        prompt: 'User prompt',
        systemPrompt: 'You are a helpful assistant',
        userId: 'test-user',
        feature: 'generic'
      };

      const response = await provider.generateText(request);

      expect(response.text).toBe('Test response from Gemini');
    });

    it('should select appropriate model based on feature', async () => {
      const features: AIRequest['feature'][] = ['clara', 'clarity', 'max'];

      for (const feature of features) {
        const request: AIRequest = {
          prompt: 'Test',
          userId: 'test-user',
          feature
        };

        const response = await provider.generateText(request);

        expect(response.model).toBeDefined();
        expect(response.provider).toBe('gemini');
      }
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost correctly for flash model', () => {
      const cost = provider.estimateCost(1000, 'gemini-1.5-flash');
      // $0.01 per 1M tokens = $0.00001 per 1K tokens
      expect(cost).toBe(0.00001);
    });

    it('should calculate cost correctly for pro model', () => {
      const cost = provider.estimateCost(1000, 'gemini-1.5-pro');
      // $0.05 per 1M tokens = $0.00005 per 1K tokens
      expect(cost).toBe(0.00005);
    });
  });

  describe('getAvailableModels', () => {
    it('should return list of available models', () => {
      const models = provider.getAvailableModels();

      expect(models).toContain('gemini-1.5-flash');
      expect(models).toContain('gemini-1.5-pro');
      expect(models.length).toBeGreaterThan(0);
    });
  });
});
