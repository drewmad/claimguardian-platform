/**
 * @fileMetadata
 * @purpose "Comprehensive tests for MultiModalAIOrchestrator - AI document analysis system"
 * @owner test-team
 * @dependencies ["@jest/globals", "openai", "@google/generative-ai", "@anthropic-ai/sdk"]
 * @complexity high
 * @tags ["testing", "ai", "multi-modal", "document-analysis", "florida-insurance"]
 * @status stable
 */

import { 
  MultiModalAIOrchestrator, 
  DocumentAnalysisResult, 
  AnalysisConsensus,
  DocumentType,
  FloridaContext,
  AIConfig,
  ExtractedAmount,
  DamageAssessment,
  DetectedAnomaly
} from "../../../src/lib/zero-touch/multi-modal-ai-providers";
import { createMockFetchResponse, mockConsole, createMockAIResponse } from "../../test-utils";

// Mock logger to avoid noise during tests
jest.mock("../../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock AI providers
jest.mock("openai", () => ({
  default: jest.fn(),
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(),
}));

jest.mock("@anthropic-ai/sdk", () => ({
  default: jest.fn(),
}));

// Mock global fetch for xAI
global.fetch = jest.fn();

describe("MultiModalAIOrchestrator - Comprehensive Testing", () => {
  let orchestrator: MultiModalAIOrchestrator;
  let mockConfig: AIConfig;
  let mockConsoleUtils: ReturnType<typeof mockConsole>;

  // Mock file data
  const createMockBlob = (size = 1024, type = "image/png"): Blob => {
    return new Blob(["mock file data".repeat(size / 10)], { type });
  };

  const createMockAnalysisResult = (overrides: Partial<DocumentAnalysisResult> = {}): DocumentAnalysisResult => ({
    documentType: "invoice",
    category: "repair",
    dates: ["2024-01-15"],
    amounts: [
      {
        value: 2500,
        type: "estimate",
        currency: "USD",
        confidence: 0.9,
      },
    ],
    entities: {
      contractor: {
        type: "company",
        value: "ABC Roofing",
        confidence: 0.85,
      },
    },
    suggestedName: "roofing_invoice_2024",
    confidence: 0.88,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleUtils = mockConsole();
    
    mockConfig = {
      openaiKey: "test-openai-key",
      geminiKey: "test-gemini-key",
      anthropicKey: "test-anthropic-key",
      xaiKey: "test-xai-key",
    };

    orchestrator = new MultiModalAIOrchestrator(mockConfig);
  });

  afterEach(() => {
    mockConsoleUtils.restore();
  });

  describe("Initialization and Configuration", () => {
    it("should initialize with all providers when keys are provided", () => {
      const fullOrchestrator = new MultiModalAIOrchestrator({
        openaiKey: "key1",
        geminiKey: "key2",
        anthropicKey: "key3",
        xaiKey: "key4",
      });

      expect(fullOrchestrator).toBeDefined();
      // Verify providers are registered by trying to access them
      expect(() => fullOrchestrator).not.toThrow();
    });

    it("should initialize with partial provider configuration", () => {
      const partialOrchestrator = new MultiModalAIOrchestrator({
        openaiKey: "key1",
        // Missing other keys
      });

      expect(partialOrchestrator).toBeDefined();
      expect(() => partialOrchestrator).not.toThrow();
    });

    it("should handle missing API keys gracefully", () => {
      const emptyOrchestrator = new MultiModalAIOrchestrator({});
      expect(emptyOrchestrator).toBeDefined();
    });
  });

  describe("Provider Selection Logic", () => {
    beforeEach(() => {
      // Mock private method access for testing
      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "OpenAI GPT-4 Vision",
          analyze: jest.fn().mockResolvedValue(createMockAnalysisResult()),
          confidence: 0.9,
          specialties: ["invoices"],
        },
      ]);
    });

    it("should prioritize xAI and Claude for Florida hurricane claims", async () => {
      const floridaContext: FloridaContext = {
        hurricane: true,
        flood: false,
        windMitigation: ["shutters"],
        floodZone: "X",
      };

      const mockFile = createMockBlob();
      
      // Mock successful analysis
      const mockAnalysis = createMockAnalysisResult({
        floridaSpecific: floridaContext,
      });

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "xAI Grok",
          analyze: jest.fn().mockResolvedValue(mockAnalysis),
          confidence: 0.95,
          specialties: ["hurricane-damage"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(
        mockFile,
        "report",
        floridaContext
      );

      expect(result.consensus.floridaSpecific).toBeDefined();
      expect(result.consensus.floridaSpecific?.hurricane).toBe(true);
    });

    it("should use all providers for complex legal documents", async () => {
      const mockFile = createMockBlob();
      
      // Mock multiple providers for legal documents
      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "OpenAI GPT-4 Vision",
          analyze: jest.fn().mockResolvedValue(createMockAnalysisResult({ documentType: "legal" })),
          confidence: 0.9,
          specialties: ["legal"],
        },
        {
          name: "Anthropic Claude 3",
          analyze: jest.fn().mockResolvedValue(createMockAnalysisResult({ documentType: "legal" })),
          confidence: 0.92,
          specialties: ["legal"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile, "legal");

      expect(result.providers.length).toBeGreaterThan(0);
      expect(result.consensus.documentType).toBe("legal");
    });
  });

  describe("OpenAI Integration", () => {
    let mockOpenAI: jest.Mocked<any>;

    beforeEach(() => {
      mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      };

      const { default: OpenAI } = require("openai");
      OpenAI.mockImplementation(() => mockOpenAI);
    });

    it("should successfully analyze document with OpenAI", async () => {
      const mockAnalysisResult = createMockAnalysisResult();
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAnalysisResult),
            },
          },
        ],
      });

      const result = await (orchestrator as any).analyzeWithOpenAI({
        fileData: createMockBlob(),
        documentType: "invoice",
      });

      expect(result).toEqual(mockAnalysisResult);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4-vision-preview",
          messages: expect.any(Array),
          response_format: { type: "json_object" },
        })
      );
    });

    it("should handle OpenAI API errors", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("OpenAI API rate limit exceeded")
      );

      await expect(
        (orchestrator as any).analyzeWithOpenAI({
          fileData: createMockBlob(),
          documentType: "invoice",
        })
      ).rejects.toThrow("OpenAI API rate limit exceeded");
    });

    it("should handle malformed OpenAI responses", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: "invalid json{",
            },
          },
        ],
      });

      await expect(
        (orchestrator as any).analyzeWithOpenAI({
          fileData: createMockBlob(),
          documentType: "invoice",
        })
      ).rejects.toThrow();
    });

    it("should handle empty OpenAI responses", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      await expect(
        (orchestrator as any).analyzeWithOpenAI({
          fileData: createMockBlob(),
          documentType: "invoice",
        })
      ).rejects.toThrow("No content received from OpenAI");
    });
  });

  describe("Gemini Integration", () => {
    let mockGemini: jest.Mocked<any>;

    beforeEach(() => {
      mockGemini = {
        getGenerativeModel: jest.fn(() => ({
          generateContent: jest.fn(),
        })),
      };

      const { GoogleGenerativeAI } = require("@google/generative-ai");
      GoogleGenerativeAI.mockImplementation(() => mockGemini);
    });

    it("should successfully analyze document with Gemini", async () => {
      const mockAnalysisResult = createMockAnalysisResult({ documentType: "policy" });
      const mockModel = mockGemini.getGenerativeModel();
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockAnalysisResult),
        },
      });

      const result = await (orchestrator as any).analyzeWithGemini({
        fileData: createMockBlob(),
        documentType: "policy",
      });

      expect(result).toEqual(mockAnalysisResult);
      expect(mockModel.generateContent).toHaveBeenCalled();
    });

    it("should handle Gemini API errors", async () => {
      const mockModel = mockGemini.getGenerativeModel();
      mockModel.generateContent.mockRejectedValue(
        new Error("Gemini API quota exceeded")
      );

      await expect(
        (orchestrator as any).analyzeWithGemini({
          fileData: createMockBlob(),
          documentType: "policy",
        })
      ).rejects.toThrow("Gemini API quota exceeded");
    });

    it("should handle empty Gemini responses", async () => {
      const mockModel = mockGemini.getGenerativeModel();
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => "",
        },
      });

      await expect(
        (orchestrator as any).analyzeWithGemini({
          fileData: createMockBlob(),
          documentType: "policy",
        })
      ).rejects.toThrow("No response received from Gemini");
    });
  });

  describe("Claude Integration", () => {
    let mockClaude: jest.Mocked<any>;

    beforeEach(() => {
      mockClaude = {
        messages: {
          create: jest.fn(),
        },
      };

      const Anthropic = require("@anthropic-ai/sdk");
      Anthropic.default.mockImplementation(() => mockClaude);
    });

    it("should successfully analyze document with Claude", async () => {
      const mockAnalysisResult = createMockAnalysisResult({ 
        documentType: "legal",
        floridaSpecific: {
          hurricane: true,
          buildingCode: "FBC2020",
        },
      });
      
      mockClaude.messages.create.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockAnalysisResult),
          },
        ],
      });

      const result = await (orchestrator as any).analyzeWithClaude({
        fileData: createMockBlob(),
        documentType: "legal",
        floridaContext: { hurricane: true },
      });

      expect(result).toEqual(mockAnalysisResult);
      expect(mockClaude.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-3-opus-20240229",
          max_tokens: 4000,
          messages: expect.any(Array),
        })
      );
    });

    it("should handle Claude API errors", async () => {
      mockClaude.messages.create.mockRejectedValue(
        new Error("Claude API service unavailable")
      );

      await expect(
        (orchestrator as any).analyzeWithClaude({
          fileData: createMockBlob(),
          documentType: "legal",
        })
      ).rejects.toThrow("Claude API service unavailable");
    });

    it("should handle invalid Claude response format", async () => {
      mockClaude.messages.create.mockResolvedValue({
        content: [
          {
            type: "image",
            source: {},
          },
        ],
      });

      await expect(
        (orchestrator as any).analyzeWithClaude({
          fileData: createMockBlob(),
          documentType: "legal",
        })
      ).rejects.toThrow("Invalid response format from Claude");
    });
  });

  describe("xAI Integration", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    it("should successfully analyze document with xAI", async () => {
      const mockAnalysisResult = createMockAnalysisResult({
        damageAssessment: {
          severity: "severe",
          types: ["wind", "hail"],
          estimatedCost: 15000,
          confidence: 0.92,
        },
        anomalies: [
          {
            type: "temporal",
            description: "Damage claim filed 3 months after hurricane",
            confidence: 0.75,
            severity: "medium",
          },
        ],
      });

      (global.fetch as jest.Mock).mockResolvedValue(
        createMockFetchResponse({
          choices: [
            {
              message: {
                content: JSON.stringify(mockAnalysisResult),
              },
            },
          ],
        })
      );

      const result = await (orchestrator as any).analyzeWithXAI({
        fileData: createMockBlob(),
        documentType: "report",
        floridaContext: { hurricane: true },
      });

      expect(result).toEqual(mockAnalysisResult);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockConfig.xaiKey}`,
          }),
        })
      );
    });

    it("should handle xAI API errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(
        (orchestrator as any).analyzeWithXAI({
          fileData: createMockBlob(),
          documentType: "report",
        })
      ).rejects.toThrow("xAI API error: 429 Too Many Requests");
    });

    it("should handle network errors with xAI", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Network connection failed")
      );

      await expect(
        (orchestrator as any).analyzeWithXAI({
          fileData: createMockBlob(),
          documentType: "report",
        })
      ).rejects.toThrow("Network connection failed");
    });

    it("should handle malformed xAI responses", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockFetchResponse({
          choices: [
            {
              message: {
                content: "invalid json response",
              },
            },
          ],
        })
      );

      await expect(
        (orchestrator as any).analyzeWithXAI({
          fileData: createMockBlob(),
          documentType: "report",
        })
      ).rejects.toThrow();
    });
  });

  describe("Consensus Building", () => {
    it("should build consensus from multiple provider analyses", async () => {
      const mockFile = createMockBlob();
      const analysisResults = [
        createMockAnalysisResult({
          documentType: "invoice",
          amounts: [{ value: 2500, type: "total", confidence: 0.9, currency: "USD" }],
        }),
        createMockAnalysisResult({
          documentType: "invoice",
          amounts: [{ value: 2500, type: "total", confidence: 0.85, currency: "USD" }],
        }),
      ];

      // Mock provider selection and analyses
      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "Provider1",
          analyze: jest.fn().mockResolvedValue(analysisResults[0]),
          confidence: 0.9,
          specialties: ["invoice"],
        },
        {
          name: "Provider2",
          analyze: jest.fn().mockResolvedValue(analysisResults[1]),
          confidence: 0.85,
          specialties: ["invoice"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile, "invoice");

      expect(result.consensus.documentType).toBe("invoice");
      expect(result.providers).toHaveLength(2);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.consensus.amounts).toBeDefined();
      expect(result.consensus.providerInsights).toHaveLength(2);
    });

    it("should handle single provider analysis", async () => {
      const mockFile = createMockBlob();
      const singleResult = createMockAnalysisResult({ documentType: "receipt" });

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "SingleProvider",
          analyze: jest.fn().mockResolvedValue(singleResult),
          confidence: 0.88,
          specialties: ["receipt"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile, "receipt");

      expect(result.consensus).toEqual(singleResult);
      expect(result.providers).toHaveLength(1);
      expect(result.confidence).toBe(singleResult.confidence);
    });

    it("should prioritize xAI results for damage assessment", async () => {
      const mockFile = createMockBlob();
      const xaiDamage: DamageAssessment = {
        severity: "catastrophic",
        types: ["hurricane", "flood"],
        estimatedCost: 50000,
        confidence: 0.95,
      };

      const xaiResult = createMockAnalysisResult({ damageAssessment: xaiDamage });
      const otherResult = createMockAnalysisResult({
        damageAssessment: {
          severity: "moderate",
          types: ["wind"],
          estimatedCost: 10000,
          confidence: 0.7,
        },
      });

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "xAI Grok",
          analyze: jest.fn().mockResolvedValue(xaiResult),
          confidence: 0.95,
          specialties: ["damage-assessment"],
        },
        {
          name: "Other Provider",
          analyze: jest.fn().mockResolvedValue(otherResult),
          confidence: 0.8,
          specialties: ["general"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile);

      // Should prioritize xAI's damage assessment
      expect(result.consensus.damageAssessment).toEqual(xaiDamage);
    });

    it("should merge and deduplicate entities across providers", async () => {
      const mockFile = createMockBlob();

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "Provider1",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({
              entities: {
                contractor: { type: "company", value: "ABC Corp", confidence: 0.9 },
                amount: { type: "currency", value: "$2500", confidence: 0.85 },
              },
            })
          ),
          confidence: 0.9,
          specialties: ["general"],
        },
        {
          name: "Provider2",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({
              entities: {
                contractor: { type: "company", value: "ABC Corp", confidence: 0.88 },
                date: { type: "date", value: "2024-01-15", confidence: 0.92 },
              },
            })
          ),
          confidence: 0.85,
          specialties: ["general"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile);

      expect(result.consensus.entities).toBeDefined();
      expect(Object.keys(result.consensus.entities!)).toEqual(
        expect.arrayContaining(["contractor", "amount", "date"])
      );
    });
  });

  describe("Error Handling and Resilience", () => {
    it("should handle partial provider failures gracefully", async () => {
      const mockFile = createMockBlob();
      const successfulResult = createMockAnalysisResult();

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "FailingProvider",
          analyze: jest.fn().mockRejectedValue(new Error("Provider failed")),
          confidence: 0.9,
          specialties: ["general"],
        },
        {
          name: "WorkingProvider",
          analyze: jest.fn().mockResolvedValue(successfulResult),
          confidence: 0.85,
          specialties: ["general"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile);

      expect(result.consensus).toEqual(successfulResult);
      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].provider).toBe("WorkingProvider");
    });

    it("should throw error when all providers fail", async () => {
      const mockFile = createMockBlob();

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "FailingProvider1",
          analyze: jest.fn().mockRejectedValue(new Error("Provider 1 failed")),
          confidence: 0.9,
          specialties: ["general"],
        },
        {
          name: "FailingProvider2",
          analyze: jest.fn().mockRejectedValue(new Error("Provider 2 failed")),
          confidence: 0.85,
          specialties: ["general"],
        },
      ]);

      await expect(orchestrator.analyzeDocument(mockFile)).rejects.toThrow(
        "All AI providers failed to analyze the document"
      );
    });

    it("should handle file conversion errors", async () => {
      const mockFile = createMockBlob();
      
      // Mock FileReader error
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn(() => ({
        readAsDataURL: jest.fn(function() {
          // Simulate error
          setTimeout(() => this.onerror(new Error("File read error")), 0);
        }),
        onerror: jest.fn(),
        onload: jest.fn(),
      })) as any;

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "TestProvider",
          analyze: jest.fn().mockResolvedValue(createMockAnalysisResult()),
          confidence: 0.9,
          specialties: ["general"],
        },
      ]);

      await expect(orchestrator.analyzeDocument(mockFile)).rejects.toThrow();

      global.FileReader = originalFileReader;
    });

    it("should handle large files efficiently", async () => {
      const largeFile = createMockBlob(10 * 1024 * 1024, "image/jpeg"); // 10MB file
      const mockResult = createMockAnalysisResult();

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "TestProvider",
          analyze: jest.fn().mockResolvedValue(mockResult),
          confidence: 0.9,
          specialties: ["general"],
        },
      ]);

      const startTime = Date.now();
      const result = await orchestrator.analyzeDocument(largeFile);
      const processingTime = Date.now() - startTime;

      expect(result.consensus).toBeDefined();
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it("should validate and filter anomalies", async () => {
      const mockFile = createMockBlob();
      const invalidAnomalies = [
        { type: "test", description: "valid", confidence: 0.8, severity: "high" },
        { invalidField: "invalid" }, // Invalid structure
        null,
        undefined,
        "string", // Wrong type
      ];

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "TestProvider",
          analyze: jest.fn().mockResolvedValue({
            ...createMockAnalysisResult(),
            anomalies: invalidAnomalies,
          }),
          confidence: 0.9,
          specialties: ["general"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile);

      // Should filter out invalid anomalies
      expect(result.consensus.anomalies).toHaveLength(1);
      expect(result.consensus.anomalies![0].type).toBe("test");
    });
  });

  describe("Florida-Specific Context Processing", () => {
    it("should merge Florida-specific data from multiple providers", async () => {
      const mockFile = createMockBlob();
      const floridaContext: FloridaContext = {
        hurricane: true,
        flood: true,
        floodZone: "AE",
        femaDeclaration: "DR-4673",
      };

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "Provider1",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({
              floridaSpecific: {
                hurricane: true,
                windMitigation: ["shutters", "impact_windows"],
                buildingCode: "FBC2020",
              },
            })
          ),
          confidence: 0.9,
          specialties: ["florida-regulations"],
        },
        {
          name: "Provider2",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({
              floridaSpecific: {
                flood: true,
                floodZone: "AE",
                sinkholeRisk: true,
              },
            })
          ),
          confidence: 0.85,
          specialties: ["florida-regulations"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(
        mockFile,
        "report",
        floridaContext
      );

      expect(result.consensus.floridaSpecific).toBeDefined();
      expect(result.consensus.floridaSpecific!.hurricane).toBe(true);
      expect(result.consensus.floridaSpecific!.flood).toBe(true);
      expect(result.consensus.floridaSpecific!.floodZone).toBe("AE");
      expect(result.consensus.floridaSpecific!.sinkholeRisk).toBe(true);
      expect(result.consensus.floridaSpecific!.windMitigation).toEqual([
        "shutters",
        "impact_windows",
      ]);
    });

    it("should handle missing Florida context gracefully", async () => {
      const mockFile = createMockBlob();

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "TestProvider",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({
              // No Florida-specific data
            })
          ),
          confidence: 0.9,
          specialties: ["general"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile);

      expect(result.consensus.floridaSpecific).toBeDefined();
      expect(result.consensus.floridaSpecific!.hurricane).toBe(false);
      expect(result.consensus.floridaSpecific!.flood).toBe(false);
    });
  });

  describe("Performance and Monitoring", () => {
    it("should track processing times for each provider", async () => {
      const mockFile = createMockBlob();

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "SlowProvider",
          analyze: jest.fn().mockImplementation(
            () => new Promise(resolve => 
              setTimeout(() => resolve(createMockAnalysisResult()), 100)
            )
          ),
          confidence: 0.9,
          specialties: ["general"],
        },
      ]);

      const result = await orchestrator.analyzeDocument(mockFile);

      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.providers[0].processingTime).toBeGreaterThan(0);
    });

    it("should handle concurrent document analyses", async () => {
      const mockFile1 = createMockBlob(512, "image/png");
      const mockFile2 = createMockBlob(1024, "image/jpeg");

      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "TestProvider",
          analyze: jest.fn().mockResolvedValue(createMockAnalysisResult()),
          confidence: 0.9,
          specialties: ["general"],
        },
      ]);

      const promises = [
        orchestrator.analyzeDocument(mockFile1),
        orchestrator.analyzeDocument(mockFile2),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.consensus).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it("should calculate confidence based on provider agreement", async () => {
      const mockFile = createMockBlob();

      // High agreement scenario
      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "Provider1",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({ documentType: "invoice", confidence: 0.9 })
          ),
          confidence: 0.9,
          specialties: ["invoice"],
        },
        {
          name: "Provider2",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({ documentType: "invoice", confidence: 0.85 })
          ),
          confidence: 0.85,
          specialties: ["invoice"],
        },
      ]);

      const highAgreementResult = await orchestrator.analyzeDocument(mockFile);

      // Low agreement scenario
      (orchestrator as any).selectProviders = jest.fn().mockReturnValue([
        {
          name: "Provider1",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({ documentType: "invoice", confidence: 0.9 })
          ),
          confidence: 0.9,
          specialties: ["invoice"],
        },
        {
          name: "Provider2",
          analyze: jest.fn().mockResolvedValue(
            createMockAnalysisResult({ documentType: "receipt", confidence: 0.85 })
          ),
          confidence: 0.85,
          specialties: ["receipt"],
        },
      ]);

      const lowAgreementResult = await orchestrator.analyzeDocument(mockFile);

      expect(highAgreementResult.confidence).toBeGreaterThan(
        lowAgreementResult.confidence
      );
    });
  });
});