/**
 * @fileoverview Unit tests for MultiModalAIOrchestrator
 * @purpose Test AI provider orchestration with proper type safety
 * @coverage ~80%
 */

import {
  MultiModalAIOrchestrator,
  AIProvider,
  DocumentAnalysisResult,
  AnalysisInput,
  FloridaContext,
  DocumentType,
  ExtractedAmount,
  DamageAssessment,
  DetectedAnomaly,
  AIConfig,
} from "../multi-modal-ai-providers";
import { logger } from "../../logger";

// Mock dependencies
jest.mock("openai");
jest.mock("@google/generative-ai");
jest.mock("@anthropic-ai/sdk");
jest.mock("@/lib/logger");

// Mock global fetch
global.fetch = jest.fn();

describe("MultiModalAIOrchestrator", () => {
  let orchestrator: MultiModalAIOrchestrator;
  let mockConfig: AIConfig;
  let mockBlob: Blob;
  let mockFloridaContext: FloridaContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      openaiKey: "test-openai-key",
      geminiKey: "test-gemini-key",
      anthropicKey: "test-anthropic-key",
      xaiKey: "test-xai-key",
    };

    mockBlob = new Blob(["test content"], { type: "image/jpeg" });
    
    mockFloridaContext = {
      hurricane: true,
      flood: false,
      windMitigation: ["shutters", "impact-windows"],
      floodZone: "AE",
      femaDeclaration: "DR-4468-FL",
      buildingCode: "2020 FBC",
      sinkholeRisk: false,
    };

    orchestrator = new MultiModalAIOrchestrator(mockConfig);
  });

  describe("Constructor", () => {
    it("should initialize with all providers when all keys provided", () => {
      expect(logger.info).toHaveBeenCalledWith(
        "MultiModalAIOrchestrator initialized",
        expect.objectContaining({
          module: "multi-modal-ai",
          providersCount: 4,
        })
      );
    });

    it("should initialize with fewer providers when some keys missing", () => {
      const partialConfig: AIConfig = {
        openaiKey: "test-key",
        // Missing other keys
      };
      
      const partialOrchestrator = new MultiModalAIOrchestrator(partialConfig);
      
      expect(logger.info).toHaveBeenCalledWith(
        "MultiModalAIOrchestrator initialized",
        expect.objectContaining({
          module: "multi-modal-ai",
          providersCount: 1,
        })
      );
    });
  });

  describe("Provider Selection", () => {
    it("should prioritize xAI and Claude for hurricane contexts", () => {
      const providers = (orchestrator as any).selectProviders(
        "invoice",
        { hurricane: true }
      );

      expect(providers).toHaveLength(3);
      expect(providers[0].name).toContain("xAI");
    });

    it("should use all providers for complex document types", () => {
      const providers = (orchestrator as any).selectProviders("policy");

      expect(providers).toHaveLength(4);
    });

    it("should use top 2 providers by default", () => {
      const providers = (orchestrator as any).selectProviders("invoice");

      expect(providers).toHaveLength(2);
      // Should be sorted by confidence (descending)
      expect(providers[0].confidence).toBeGreaterThanOrEqual(providers[1].confidence);
    });
  });

  describe("Document Analysis", () => {
    it("should successfully analyze document with multiple providers", async () => {
      // Mock successful responses from all providers
      const mockResult: DocumentAnalysisResult = {
        documentType: "invoice",
        category: "repair",
        dates: ["2024-01-15"],
        amounts: [{
          value: 1500,
          type: "total",
          currency: "USD",
          confidence: 0.9
        }],
        entities: {
          contractor: {
            type: "contractor",
            value: "ABC Roofing Inc",
            confidence: 0.95
          }
        },
        confidence: 0.9,
      };

      // Mock all provider methods to return successful results
      jest.spyOn(orchestrator as any, "analyzeWithOpenAI")
        .mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, "analyzeWithGemini")
        .mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, "analyzeWithClaude")
        .mockResolvedValue(mockResult);
      jest.spyOn(orchestrator as any, "analyzeWithXAI")
        .mockResolvedValue(mockResult);

      const result = await orchestrator.analyzeDocument(
        mockBlob,
        "invoice",
        mockFloridaContext
      );

      expect(result).toMatchObject({
        consensus: expect.objectContaining({
          documentType: "invoice",
          category: "repair",
        }),
        providers: expect.any(Array),
        confidence: expect.any(Number),
        processingTime: expect.any(Number),
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Document analysis completed",
        expect.objectContaining({
          module: "multi-modal-ai",
          totalProcessingTime: expect.any(Number),
        })
      );
    });

    it("should handle partial provider failures gracefully", async () => {
      const mockSuccessResult: DocumentAnalysisResult = {
        documentType: "invoice",
        category: "repair",
        confidence: 0.9,
      };

      // Mock one success and one failure
      jest.spyOn(orchestrator as any, "analyzeWithOpenAI")
        .mockResolvedValue(mockSuccessResult);
      jest.spyOn(orchestrator as any, "analyzeWithGemini")
        .mockRejectedValue(new Error("API Error"));

      const result = await orchestrator.analyzeDocument(
        mockBlob,
        "invoice"
      );

      expect(result.providers).toHaveLength(1);
      expect(result.consensus).toBeDefined();
    });

    it("should throw error when all providers fail", async () => {
      // Mock all providers to fail
      jest.spyOn(orchestrator as any, "analyzeWithOpenAI")
        .mockRejectedValue(new Error("OpenAI Error"));
      jest.spyOn(orchestrator as any, "analyzeWithGemini")
        .mockRejectedValue(new Error("Gemini Error"));

      await expect(orchestrator.analyzeDocument(mockBlob))
        .rejects.toThrow("All AI providers failed to analyze the document");

      expect(logger.error).toHaveBeenCalledWith(
        "Document analysis completely failed",
        expect.objectContaining({
          module: "multi-modal-ai",
        }),
        expect.any(Error)
      );
    });
  });

  describe("Consensus Building", () => {
    it("should build consensus from multiple analyses", () => {
      const analyses = [
        {
          provider: "OpenAI GPT-4 Vision",
          result: {
            documentType: "invoice" as DocumentType,
            category: "repair",
            dates: ["2024-01-15"],
            amounts: [{
              value: 1500,
              type: "total",
              currency: "USD",
              confidence: 0.9
            }],
          },
          processingTime: 1000,
        },
        {
          provider: "Anthropic Claude 3",
          result: {
            documentType: "invoice" as DocumentType,
            category: "repair",
            dates: ["2024-01-15", "2024-01-20"],
            amounts: [{
              value: 1500,
              type: "total",
              currency: "USD",
              confidence: 0.95
            }],
          },
          processingTime: 1200,
        },
      ];

      const consensus = (orchestrator as any).buildConsensus(analyses);

      expect(consensus).toMatchObject({
        documentType: "invoice",
        category: "repair",
        dates: expect.arrayContaining(["2024-01-15", "2024-01-20"]),
        amounts: expect.arrayContaining([
          expect.objectContaining({
            value: 1500,
            type: "total",
          })
        ]),
      });
    });

    it("should return single result when only one analysis", () => {
      const analyses = [
        {
          provider: "OpenAI GPT-4 Vision",
          result: {
            documentType: "invoice" as DocumentType,
            category: "repair",
          },
          processingTime: 1000,
        },
      ];

      const consensus = (orchestrator as any).buildConsensus(analyses);

      expect(consensus).toEqual(analyses[0].result);
    });
  });

  describe("Data Merging", () => {
    it("should merge dates correctly", () => {
      const analyses = [
        { result: { dates: ["2024-01-15", "2024-01-20"] } },
        { result: { dates: ["2024-01-15", "2024-01-25"] } },
      ];

      const mergedDates = (orchestrator as any).mergeDates(analyses);

      expect(mergedDates).toEqual(["2024-01-15", "2024-01-20", "2024-01-25"]);
    });

    it("should merge amounts without duplicates", () => {
      const analyses = [
        {
          result: {
            amounts: [
              { value: 1500, type: "total", confidence: 0.9 },
              { value: 300, type: "tax", confidence: 0.8 }
            ]
          }
        },
        {
          result: {
            amounts: [
              { value: 1500, type: "total", confidence: 0.95 }, // Duplicate
              { value: 100, type: "fee", confidence: 0.7 }
            ]
          }
        },
      ];

      const mergedAmounts = (orchestrator as any).mergeAmounts(analyses);

      expect(mergedAmounts).toHaveLength(3);
      expect(mergedAmounts.map((a: ExtractedAmount) => a.type))
        .toEqual(expect.arrayContaining(["total", "tax", "fee"]));
    });

    it("should prioritize xAI for damage assessments", () => {
      const xaiDamageAssessment: DamageAssessment = {
        severity: "severe",
        types: ["roof", "water"],
        estimatedCost: 25000,
        confidence: 0.95,
      };

      const analyses = [
        {
          provider: "OpenAI GPT-4 Vision",
          result: {
            damageAssessment: {
              severity: "moderate" as const,
              types: ["roof"],
              estimatedCost: 15000,
              confidence: 0.8,
            }
          }
        },
        {
          provider: "xAI Grok",
          result: {
            damageAssessment: xaiDamageAssessment
          }
        },
      ];

      const mergedAssessment = (orchestrator as any).mergeDamageAssessments(analyses);

      expect(mergedAssessment).toEqual(xaiDamageAssessment);
    });

    it("should deduplicate anomalies", () => {
      const anomalies: DetectedAnomaly[] = [
        { type: "inconsistency", description: "Date mismatch", confidence: 0.8, severity: "medium" },
        { type: "inconsistency", description: "Date mismatch", confidence: 0.8, severity: "medium" }, // Duplicate
        { type: "fraud", description: "Suspicious signature", confidence: 0.9, severity: "high" },
      ];

      const deduplicated = (orchestrator as any).deduplicateAnomalies(anomalies);

      expect(deduplicated).toHaveLength(2);
      expect(deduplicated.map((a: DetectedAnomaly) => a.type))
        .toEqual(expect.arrayContaining(["inconsistency", "fraud"]));
    });
  });

  describe("Error Handling", () => {
    it("should handle file conversion errors", async () => {
      const corruptBlob = new Blob([], { type: "invalid/type" });
      
      // Mock fileToBase64 to throw error
      jest.spyOn(orchestrator as any, "fileToBase64")
        .mockRejectedValue(new Error("Invalid file format"));

      await expect(orchestrator.analyzeDocument(corruptBlob))
        .rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle API response parsing errors", async () => {
      // Mock OpenAI to return invalid JSON
      jest.spyOn(orchestrator as any, "analyzeWithOpenAI")
        .mockRejectedValue(new Error("JSON parse error"));

      await expect(orchestrator.analyzeDocument(mockBlob))
        .rejects.toThrow();
    });
  });

  describe("Confidence Calculation", () => {
    it("should calculate confidence based on provider agreement", () => {
      const analyses = [
        {
          provider: "OpenAI GPT-4 Vision",
          result: {
            documentType: "invoice",
            category: "repair",
            dates: ["2024-01-15"],
            amounts: [{ value: 1500, type: "total", confidence: 0.9 }],
          }
        },
        {
          provider: "Anthropic Claude 3",
          result: {
            documentType: "invoice", // Agreement
            category: "repair", // Agreement
            dates: ["2024-01-15"], // Agreement
            amounts: [{ value: 1500, type: "total", confidence: 0.9 }], // Agreement
          }
        },
      ];

      const confidence = (orchestrator as any).calculateConfidence(analyses, {});

      expect(confidence).toBeGreaterThan(0.8); // High agreement should yield high confidence
    });

    it("should boost confidence when xAI is involved", () => {
      const analysesWithXAI = [
        {
          provider: "xAI Grok",
          result: { documentType: "invoice", category: "repair" }
        }
      ];

      const analysesWithoutXAI = [
        {
          provider: "OpenAI GPT-4 Vision",
          result: { documentType: "invoice", category: "repair" }
        }
      ];

      const confidenceWithXAI = (orchestrator as any).calculateConfidence(analysesWithXAI, {});
      const confidenceWithoutXAI = (orchestrator as any).calculateConfidence(analysesWithoutXAI, {});

      expect(confidenceWithXAI).toBeGreaterThan(confidenceWithoutXAI);
    });
  });

  describe("Florida-Specific Processing", () => {
    it("should merge Florida-specific data correctly", () => {
      const analyses = [
        {
          provider: "OpenAI GPT-4 Vision",
          result: {
            floridaSpecific: {
              hurricane: true,
              floodZone: "AE",
            }
          }
        },
        {
          provider: "Anthropic Claude 3",
          result: {
            floridaSpecific: {
              flood: true,
              femaDeclaration: "DR-4468-FL",
              windMitigation: ["shutters"],
            }
          }
        },
      ];

      const mergedFlorida = (orchestrator as any).mergeFloridaSpecific(analyses);

      expect(mergedFlorida).toMatchObject({
        hurricane: true,
        flood: true,
        floodZone: "AE",
        femaDeclaration: "DR-4468-FL",
        windMitigation: ["shutters"],
      });
    });
  });

  describe("Performance Metrics", () => {
    it("should track processing time for each provider", async () => {
      const mockResult: DocumentAnalysisResult = {
        documentType: "invoice",
        confidence: 0.9,
      };

      jest.spyOn(orchestrator as any, "analyzeWithOpenAI")
        .mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return mockResult;
        });

      const result = await orchestrator.analyzeDocument(mockBlob, "invoice");

      expect(result.providers[0].processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe("Type Safety", () => {
    it("should enforce proper DocumentType keys", () => {
      expect(() => {
        // This should compile without issues
        const input: AnalysisInput = {
          fileData: mockBlob,
          documentType: "invoice", // Valid key
          floridaContext: mockFloridaContext,
        };
      }).not.toThrow();
    });

    it("should enforce proper FloridaContext structure", () => {
      const validContext: FloridaContext = {
        hurricane: true,
        flood: false,
        windMitigation: ["impact-windows"],
        floodZone: "X",
        femaDeclaration: "DR-4468-FL",
        buildingCode: "2020 FBC",
        sinkholeRisk: true,
      };

      expect(validContext).toBeDefined();
    });
  });
});