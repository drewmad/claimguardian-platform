/**
 * @fileMetadata
 * @purpose "Unit tests for MultiModalAIOrchestrator - verifying TypeScript fixes and AI provider functionality"
 * @owner test-engineer
 * @dependencies ["@jest/globals", "@/lib/zero-touch/multi-modal-ai-providers"]
 * @exports []
 * @complexity high
 * @tags ["ai", "document-analysis", "multi-modal", "testing", "typescript-fixes"]
 * @status active
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  MultiModalAIOrchestrator,
  DocumentType,
  FloridaContext,
  DocumentAnalysisResult,
  AnalysisConsensus,
  ExtractedAmount,
  ExtractedEntity,
  DamageAssessment,
  DetectedAnomaly,
} from '@/lib/zero-touch/multi-modal-ai-providers';

// Mock AI SDKs
jest.mock('openai');
jest.mock('@google/generative-ai');
jest.mock('@anthropic-ai/sdk');

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch for xAI
global.fetch = jest.fn();

describe('MultiModalAIOrchestrator', () => {
  let orchestrator: MultiModalAIOrchestrator;
  let mockBlob: Blob;

  beforeEach(() => {
    orchestrator = new MultiModalAIOrchestrator({
      openaiKey: 'test-openai-key',
      geminiKey: 'test-gemini-key',
      anthropicKey: 'test-anthropic-key',
      xaiKey: 'test-xai-key',
    });

    // Create a test blob
    mockBlob = new Blob(['test image data'], { type: 'image/jpeg' });
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with all providers when keys are provided', () => {
      expect(orchestrator).toBeDefined();
    });

    it('should initialize with subset of providers based on available keys', () => {
      const partialOrchestrator = new MultiModalAIOrchestrator({
        openaiKey: 'test-key',
        // Only OpenAI key provided
      });
      
      expect(partialOrchestrator).toBeDefined();
    });

    it('should handle initialization with no keys', () => {
      const emptyOrchestrator = new MultiModalAIOrchestrator({});
      expect(emptyOrchestrator).toBeDefined();
    });
  });

  describe('document analysis types', () => {
    it('should handle all document types correctly', async () => {
      const documentTypes: DocumentType[] = [
        'invoice',
        'receipt', 
        'policy',
        'contract',
        'report',
        'legal',
        'medical',
        'general'
      ];

      for (const docType of documentTypes) {
        expect(() => {
          // Type checking - should compile without errors
          const _: DocumentType = docType;
        }).not.toThrow();
      }
    });

    it('should handle Florida-specific context properly', () => {
      const floridaContext: FloridaContext = {
        hurricane: true,
        flood: false,
        windMitigation: ['hip-roof', 'shutters'],
        floodZone: 'AE',
        femaDeclaration: 'DR-4564-FL',
        buildingCode: '2020-FBC',
        sinkholeRisk: true,
      };

      expect(floridaContext.hurricane).toBe(true);
      expect(floridaContext.windMitigation).toHaveLength(2);
      expect(floridaContext.sinkholeRisk).toBe(true);
    });
  });

  describe('analysis result structures', () => {
    it('should properly type ExtractedAmount', () => {
      const amount: ExtractedAmount = {
        value: 15000.50,
        type: 'damage-estimate',
        currency: 'USD',
        confidence: 0.92,
      };

      expect(amount.value).toBe(15000.50);
      expect(amount.type).toBe('damage-estimate');
      expect(amount.confidence).toBe(0.92);
    });

    it('should properly type ExtractedEntity', () => {
      const entity: ExtractedEntity = {
        type: 'policy-number',
        value: 'POL-123456789',
        confidence: 0.95,
      };

      expect(entity.type).toBe('policy-number');
      expect(entity.value).toBe('POL-123456789');
      expect(entity.confidence).toBe(0.95);
    });

    it('should properly type DamageAssessment', () => {
      const damage: DamageAssessment = {
        severity: 'moderate',
        types: ['water', 'wind'],
        estimatedCost: 25000,
        confidence: 0.88,
      };

      expect(damage.severity).toBe('moderate');
      expect(damage.types).toContain('water');
      expect(damage.estimatedCost).toBe(25000);
    });

    it('should properly type DetectedAnomaly', () => {
      const anomaly: DetectedAnomaly = {
        type: 'inconsistent-dates',
        description: 'Claim date is before policy effective date',
        confidence: 0.94,
        severity: 'high',
      };

      expect(anomaly.type).toBe('inconsistent-dates');
      expect(anomaly.severity).toBe('high');
      expect(anomaly.confidence).toBe(0.94);
    });
  });

  describe('document analysis', () => {
    it('should handle successful analysis with multiple providers', async () => {
      // Mock successful responses from all providers
      const mockResult: DocumentAnalysisResult = {
        documentType: 'invoice',
        category: 'contractor-estimate',
        dates: ['2024-01-15'],
        amounts: [{
          value: 15000,
          type: 'total',
          currency: 'USD',
          confidence: 0.95
        }],
        entities: {
          'contractor': {
            type: 'company',
            value: 'ABC Roofing',
            confidence: 0.90
          }
        },
        confidence: 0.92,
      };

      // Mock the private methods that would be called
      jest.spyOn(orchestrator as any, 'analyzeWithOpenAI').mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, 'analyzeWithGemini').mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, 'analyzeWithClaude').mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, 'analyzeWithXAI').mockResolvedValue(mockResult);

      const result = await orchestrator.analyzeDocument(mockBlob, 'invoice');

      expect(result).toBeDefined();
      expect(result.consensus).toBeDefined();
      expect(result.providers).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle analysis failure gracefully', async () => {
      // Mock all providers to fail
      jest.spyOn(orchestrator as any, 'analyzeWithOpenAI').mockRejectedValue(new Error('OpenAI failed'));
      jest.spyOn(orchestrator as any, 'analyzeWithGemini').mockRejectedValue(new Error('Gemini failed'));
      jest.spyOn(orchestrator as any, 'analyzeWithClaude').mockRejectedValue(new Error('Claude failed'));
      jest.spyOn(orchestrator as any, 'analyzeWithXAI').mockRejectedValue(new Error('xAI failed'));

      await expect(orchestrator.analyzeDocument(mockBlob))
        .rejects.toThrow('All AI providers failed to analyze the document');
    });

    it('should handle partial provider failures', async () => {
      const mockResult: DocumentAnalysisResult = {
        documentType: 'report',
        category: 'damage-assessment',
        confidence: 0.85,
      };

      // Mock some providers to succeed, others to fail
      jest.spyOn(orchestrator as any, 'analyzeWithOpenAI').mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, 'analyzeWithGemini').mockRejectedValue(new Error('Gemini failed'));
      jest.spyOn(orchestrator as any, 'analyzeWithClaude').mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, 'analyzeWithXAI').mockRejectedValue(new Error('xAI failed'));

      const result = await orchestrator.analyzeDocument(mockBlob);

      expect(result).toBeDefined();
      expect(result.providers.length).toBeGreaterThan(0);
      expect(result.consensus).toBeDefined();
    });

    it('should handle Florida hurricane context correctly', async () => {
      const floridaContext: FloridaContext = {
        hurricane: true,
        flood: true,
        windMitigation: ['shutters'],
        floodZone: 'X',
      };

      const mockResult: DocumentAnalysisResult = {
        documentType: 'report',
        floridaSpecific: floridaContext,
        damageAssessment: {
          severity: 'severe',
          types: ['hurricane', 'flood'],
          estimatedCost: 75000,
          confidence: 0.93,
        },
        confidence: 0.90,
      };

      jest.spyOn(orchestrator as any, 'analyzeWithXAI').mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, 'analyzeWithClaude').mockResolvedValue(mockResult);

      const result = await orchestrator.analyzeDocument(
        mockBlob,
        'report',
        floridaContext
      );

      expect(result.consensus.floridaSpecific).toBeDefined();
      expect(result.consensus.damageAssessment?.types).toContain('hurricane');
    });
  });

  describe('consensus building', () => {
    it('should build proper consensus from multiple providers', async () => {
      const provider1Result: DocumentAnalysisResult = {
        documentType: 'invoice',
        amounts: [{
          value: 10000,
          type: 'labor',
          confidence: 0.9
        }],
        entities: {
          'contractor': {
            type: 'company',
            value: 'ABC Corp',
            confidence: 0.85
          }
        }
      };

      const provider2Result: DocumentAnalysisResult = {
        documentType: 'invoice',
        amounts: [{
          value: 5000,
          type: 'materials',
          confidence: 0.88
        }],
        entities: {
          'contractor': {
            type: 'company', 
            value: 'ABC Corp',
            confidence: 0.90
          }
        }
      };

      jest.spyOn(orchestrator as any, 'analyzeWithOpenAI').mockResolvedValue(provider1Result);
      jest.spyOn(orchestrator as any, 'analyzeWithGemini').mockResolvedValue(provider2Result);

      const result = await orchestrator.analyzeDocument(mockBlob);

      expect(result.consensus.documentType).toBe('invoice');
      expect(result.consensus.amounts).toBeDefined();
      expect(result.consensus.entities).toBeDefined();
      expect(result.providers).toHaveLength(2);
    });

    it('should handle single provider result', async () => {
      const singleProviderOrchestrator = new MultiModalAIOrchestrator({
        openaiKey: 'test-key'
      });

      const mockResult: DocumentAnalysisResult = {
        documentType: 'receipt',
        confidence: 0.87,
      };

      jest.spyOn(singleProviderOrchestrator as any, 'analyzeWithOpenAI')
        .mockResolvedValue(mockResult);

      const result = await singleProviderOrchestrator.analyzeDocument(mockBlob);

      expect(result.consensus).toEqual(mockResult);
      expect(result.providers).toHaveLength(1);
      expect(result.confidence).toBe(0.87);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle invalid blob data', async () => {
      const invalidBlob = new Blob([], { type: 'text/plain' });

      jest.spyOn(orchestrator as any, 'analyzeWithOpenAI')
        .mockRejectedValue(new Error('Invalid image format'));

      await expect(orchestrator.analyzeDocument(invalidBlob))
        .rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      jest.spyOn(orchestrator as any, 'analyzeWithOpenAI')
        .mockRejectedValue(new Error('Network error'));
      jest.spyOn(orchestrator as any, 'analyzeWithGemini')
        .mockRejectedValue(new Error('Network error'));

      await expect(orchestrator.analyzeDocument(mockBlob))
        .rejects.toThrow();
    });
  });

  describe('type safety validation', () => {
    it('should ensure proper typing of analysis result', () => {
      const result: DocumentAnalysisResult = {
        documentType: 'policy',
        category: 'homeowners',
        dates: ['2024-01-01', '2024-12-31'],
        amounts: [{
          value: 500000,
          type: 'dwelling-coverage',
          confidence: 0.96
        }],
        entities: {
          'insurer': {
            type: 'company',
            value: 'State Farm',
            confidence: 0.94
          },
          'policy-number': {
            type: 'identifier',
            value: 'SF-123-456-789',
            confidence: 0.98
          }
        },
        floridaSpecific: {
          windMitigation: ['hip-roof', 'impact-windows'],
          buildingCode: '2020-FBC'
        },
        confidence: 0.93
      };

      // Type assertions to ensure proper typing
      expect(result.documentType).toBe('policy');
      expect(Array.isArray(result.dates)).toBe(true);
      expect(Array.isArray(result.amounts)).toBe(true);
      expect(typeof result.entities).toBe('object');
      expect(typeof result.confidence).toBe('number');
    });

    it('should ensure proper typing of consensus result', () => {
      const consensus: AnalysisConsensus = {
        consensus: {
          documentType: 'contract',
          confidence: 0.89
        },
        providers: [{
          provider: 'OpenAI GPT-4 Vision',
          result: {
            documentType: 'contract',
            confidence: 0.89
          },
          processingTime: 1500
        }],
        confidence: 0.89,
        processingTime: 2000
      };

      expect(consensus.consensus.documentType).toBe('contract');
      expect(Array.isArray(consensus.providers)).toBe(true);
      expect(typeof consensus.confidence).toBe('number');
      expect(typeof consensus.processingTime).toBe('number');
    });
  });
});