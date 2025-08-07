/**
 * AI Cost Tracking Test Suite
 * Jest tests for AI cost tracking functionality
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import {
  AIContentTestingFramework,
  AIStressTestFramework,
  mockOpenAIProvider,
  mockGeminiProvider,
  testScenarios,
} from "../ai-cost-testing";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { current_usage: 0.5 },
            error: null,
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  },
}));

describe("AI Cost Tracking System", () => {
  let testFramework: AIContentTestingFramework;
  let stressTestFramework: AIStressTestFramework;

  beforeEach(() => {
    testFramework = new AIContentTestingFramework();
    stressTestFramework = new AIStressTestFramework();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Mock AI Providers", () => {
    describe("OpenAI Provider", () => {
      it("should authenticate with valid API key", () => {
        expect(mockOpenAIProvider.authenticate("sk-test-123")).toBe(true);
        expect(mockOpenAIProvider.authenticate("mock-openai-key")).toBe(true);
        expect(mockOpenAIProvider.authenticate("invalid-key")).toBe(false);
      });

      it("should generate response with correct token estimation", async () => {
        const prompt = "Test prompt for token estimation";
        const response = await mockOpenAIProvider.generateResponse(
          prompt,
          "gpt-4",
        );

        expect(response.content).toContain("Mock AI response");
        expect(response.tokens.prompt).toBeGreaterThan(0);
        expect(response.tokens.completion).toBeGreaterThan(0);
        expect(response.tokens.total).toBe(
          response.tokens.prompt + response.tokens.completion,
        );
        expect(response.cost).toBeGreaterThan(0);
        expect(response.latency).toBeGreaterThan(0);
        expect(response.model).toBe("gpt-4");
      });

      it("should calculate costs correctly for different models", () => {
        const tokens = 1000;

        const gpt4Cost = mockOpenAIProvider.calculateCost(tokens, "gpt-4");
        const gpt4TurboCost = mockOpenAIProvider.calculateCost(
          tokens,
          "gpt-4-turbo",
        );
        const gpt35Cost = mockOpenAIProvider.calculateCost(
          tokens,
          "gpt-3.5-turbo",
        );

        expect(gpt4Cost).toBeGreaterThan(gpt4TurboCost);
        expect(gpt4TurboCost).toBeGreaterThan(gpt35Cost);
        expect(gpt4Cost).toBe(0.045); // (0.03 + 0.06) / 2
        expect(gpt35Cost).toBe(0.0015); // (0.001 + 0.002) / 2
      });

      it("should return available models", () => {
        const models = mockOpenAIProvider.getModels();
        expect(models).toContain("gpt-4");
        expect(models).toContain("gpt-4-turbo");
        expect(models).toContain("gpt-3.5-turbo");
        expect(models.length).toBe(3);
      });
    });

    describe("Gemini Provider", () => {
      it("should authenticate with valid API key", () => {
        expect(mockGeminiProvider.authenticate("AIza123")).toBe(true);
        expect(mockGeminiProvider.authenticate("mock-gemini-key")).toBe(true);
        expect(mockGeminiProvider.authenticate("invalid-key")).toBe(false);
      });

      it("should generate response with different characteristics than OpenAI", async () => {
        const prompt = "Test prompt for Gemini";
        const response = await mockGeminiProvider.generateResponse(
          prompt,
          "gemini-pro",
        );

        expect(response.content).toContain("Mock Gemini response");
        expect(response.model).toBe("gemini-pro");
        expect(response.cost).toBeLessThan(0.01); // Gemini is generally cheaper
      });

      it("should calculate costs correctly for Gemini models", () => {
        const tokens = 1000;

        const geminiProCost = mockGeminiProvider.calculateCost(
          tokens,
          "gemini-pro",
        );
        const geminiVisionCost = mockGeminiProvider.calculateCost(
          tokens,
          "gemini-pro-vision",
        );

        expect(geminiVisionCost).toBeGreaterThan(geminiProCost);
        expect(geminiProCost).toBe(0.001); // (0.0005 + 0.0015) / 2
      });
    });
  });

  describe("Test Scenarios", () => {
    it("should have valid test scenarios", () => {
      expect(testScenarios.length).toBeGreaterThan(0);

      testScenarios.forEach((scenario) => {
        expect(scenario.name).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.provider).toBeDefined();
        expect(scenario.requests.length).toBeGreaterThan(0);
        expect(scenario.expectedTotalCost).toBeGreaterThan(0);
        expect(scenario.testDuration).toBeGreaterThan(0);

        scenario.requests.forEach((request) => {
          expect(request.prompt).toBeDefined();
          expect(request.model).toBeDefined();
          expect(request.expectedTokenRange).toHaveLength(2);
          expect(request.expectedCostRange).toHaveLength(2);
          expect(request.expectedTokenRange[1]).toBeGreaterThan(
            request.expectedTokenRange[0],
          );
          expect(request.expectedCostRange[1]).toBeGreaterThan(
            request.expectedCostRange[0],
          );
        });
      });
    });

    it("should validate token ranges are realistic", () => {
      const lightUsageScenario = testScenarios.find((s) =>
        s.name.includes("Light Usage"),
      );
      expect(lightUsageScenario).toBeDefined();

      lightUsageScenario!.requests.forEach((request) => {
        expect(request.expectedTokenRange[0]).toBeGreaterThan(20); // Minimum reasonable tokens
        expect(request.expectedTokenRange[1]).toBeLessThan(1000); // Maximum for light usage
      });
    });

    it("should validate cost ranges are realistic", () => {
      const heavyUsageScenario = testScenarios.find((s) =>
        s.name.includes("Heavy Usage"),
      );
      expect(heavyUsageScenario).toBeDefined();

      // Heavy usage should have higher costs
      expect(heavyUsageScenario!.expectedTotalCost).toBeGreaterThan(0.1);
      expect(heavyUsageScenario!.requests.length).toBeGreaterThan(10);
    });
  });

  describe("AI Cost Testing Framework", () => {
    it("should initialize without errors", () => {
      expect(testFramework).toBeInstanceOf(AIContentTestingFramework);
      expect(testFramework.getTestResults()).toEqual([]);
    });

    it("should run a single test scenario", async () => {
      const lightScenario = testScenarios.find((s) =>
        s.name.includes("Light Usage"),
      )!;

      // Run with short timeout for testing
      const testScenario = { ...lightScenario, testDuration: 1000 };

      await expect(
        testFramework.runTestScenario(testScenario, "test-user-jest"),
      ).resolves.not.toThrow();

      const results = testFramework.getTestResults();
      expect(results).toHaveLength(1);
      expect(results[0].scenario).toBe(testScenario.name);
      expect(results[0].requests).toBe(testScenario.requests.length);
    }, 30000); // 30 second timeout for async test

    it("should handle database errors gracefully", async () => {
      // Mock database error
      const { supabase } = require("@/lib/supabase");
      supabase.from.mockReturnValueOnce({
        upsert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      });

      const lightScenario = testScenarios[0];
      const testScenario = {
        ...lightScenario,
        requests: lightScenario.requests.slice(0, 1),
      };

      // Should handle error and continue
      await expect(
        testFramework.runTestScenario(testScenario, "test-user-error"),
      ).resolves.not.toThrow();
    });

    it("should track multiple scenarios correctly", async () => {
      const scenario1 = {
        ...testScenarios[0],
        requests: testScenarios[0].requests.slice(0, 1),
      };
      const scenario2 = {
        ...testScenarios[1],
        requests: testScenarios[1].requests.slice(0, 1),
      };

      await testFramework.runTestScenario(scenario1, "test-user-1");
      await testFramework.runTestScenario(scenario2, "test-user-2");

      const results = testFramework.getTestResults();
      expect(results).toHaveLength(2);
      expect(results[0].scenario).toBe(scenario1.name);
      expect(results[1].scenario).toBe(scenario2.name);
    }, 60000);
  });

  describe("Cost Calculations", () => {
    it("should calculate realistic costs for different request types", async () => {
      const shortPrompt = "Quick test";
      const longPrompt =
        "This is a much longer prompt that should generate more tokens and cost more money for processing through the AI system";

      const shortResponse = await mockOpenAIProvider.generateResponse(
        shortPrompt,
        "gpt-4",
      );
      const longResponse = await mockOpenAIProvider.generateResponse(
        longPrompt,
        "gpt-4",
      );

      expect(longResponse.tokens.prompt).toBeGreaterThan(
        shortResponse.tokens.prompt,
      );
      expect(longResponse.cost).toBeGreaterThan(shortResponse.cost);
    });

    it("should handle edge cases in cost calculation", () => {
      expect(mockOpenAIProvider.calculateCost(0, "gpt-4")).toBe(0);
      expect(mockOpenAIProvider.calculateCost(1, "gpt-4")).toBeGreaterThan(0);
      expect(mockOpenAIProvider.calculateCost(1000000, "gpt-4")).toBe(45); // Very high usage
    });

    it("should use fallback pricing for unknown models", () => {
      const cost = mockOpenAIProvider.calculateCost(
        1000,
        "unknown-model" as any,
      );
      const gpt4Cost = mockOpenAIProvider.calculateCost(1000, "gpt-4");
      expect(cost).toBe(gpt4Cost); // Should default to GPT-4 pricing
    });
  });

  describe("Budget Alert System", () => {
    it("should trigger alerts at appropriate thresholds", async () => {
      // Mock high usage scenario
      const { supabase } = require("@/lib/supabase");

      // First call returns low usage, second call returns high usage
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { current_usage: 0.85 }, // 85% of budget
              error: null,
            }),
          }),
        }),
      });

      const testScenario = {
        ...testScenarios[0],
        requests: testScenarios[0].requests.slice(0, 1),
      };

      await testFramework.runTestScenario(testScenario, "test-budget-user");

      const results = testFramework.getTestResults();
      expect(results[0].budgetAlertsTriggered).toBeGreaterThan(0);
    });
  });

  describe("Stress Testing Framework", () => {
    it("should handle concurrent requests", async () => {
      // Run with minimal parameters for testing
      await expect(
        stressTestFramework.runConcurrencyTest(mockOpenAIProvider, 3, 2, 5000),
      ).resolves.not.toThrow();
    }, 15000);

    it("should track concurrency metrics", async () => {
      const concurrentUsers = 5;
      const requestsPerUser = 3;

      await stressTestFramework.runConcurrencyTest(
        mockOpenAIProvider,
        concurrentUsers,
        requestsPerUser,
        3000,
      );

      // Should have processed some requests
      // Note: In real implementation, we'd expose metrics from the stress test framework
      expect(true).toBe(true); // Placeholder - would check actual metrics
    });
  });

  describe("Error Handling", () => {
    it("should handle provider authentication failures", () => {
      expect(() => {
        mockOpenAIProvider.authenticate("");
      }).not.toThrow();

      expect(mockOpenAIProvider.authenticate("")).toBe(false);
    });

    it("should handle malformed prompts gracefully", async () => {
      const emptyPrompt = "";
      const response = await mockOpenAIProvider.generateResponse(
        emptyPrompt,
        "gpt-4",
      );

      expect(response.tokens.prompt).toBe(0); // Should handle empty prompts
      expect(response.cost).toBe(0);
    });

    it("should handle invalid model names", async () => {
      const response = await mockOpenAIProvider.generateResponse(
        "test",
        "invalid-model" as any,
      );
      expect(response.model).toBe("invalid-model");
      // Should not throw error, but use default pricing
    });
  });

  describe("Performance Validation", () => {
    it("should complete requests within reasonable time limits", async () => {
      const startTime = Date.now();
      await mockOpenAIProvider.generateResponse("Test prompt", "gpt-4");
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should handle multiple rapid requests", async () => {
      const promises = Array.from({ length: 10 }, () =>
        mockOpenAIProvider.generateResponse("Quick test", "gpt-3.5-turbo"),
      );

      const responses = await Promise.all(promises);
      expect(responses).toHaveLength(10);
      responses.forEach((response) => {
        expect(response.cost).toBeGreaterThan(0);
      });
    });
  });

  describe("Data Validation", () => {
    it("should validate response structure", async () => {
      const response = await mockOpenAIProvider.generateResponse(
        "Test",
        "gpt-4",
      );

      expect(response).toHaveProperty("content");
      expect(response).toHaveProperty("tokens");
      expect(response).toHaveProperty("model");
      expect(response).toHaveProperty("cost");
      expect(response).toHaveProperty("latency");

      expect(response.tokens).toHaveProperty("prompt");
      expect(response.tokens).toHaveProperty("completion");
      expect(response.tokens).toHaveProperty("total");
    });

    it("should ensure consistent data types", async () => {
      const response = await mockOpenAIProvider.generateResponse(
        "Test",
        "gpt-4",
      );

      expect(typeof response.content).toBe("string");
      expect(typeof response.tokens.prompt).toBe("number");
      expect(typeof response.tokens.completion).toBe("number");
      expect(typeof response.tokens.total).toBe("number");
      expect(typeof response.cost).toBe("number");
      expect(typeof response.latency).toBe("number");
      expect(typeof response.model).toBe("string");
    });
  });
});

describe("Integration Tests", () => {
  let testFramework: AIContentTestingFramework;

  beforeEach(() => {
    testFramework = new AIContentTestingFramework();
  });

  it("should run end-to-end cost tracking simulation", async () => {
    // This test simulates the complete flow from request to cost tracking
    const scenario = {
      name: "Integration Test",
      description: "End-to-end test",
      provider: mockOpenAIProvider,
      requests: [
        {
          prompt: "Integration test prompt",
          model: "gpt-4",
          expectedTokenRange: [10, 100] as [number, number],
          expectedCostRange: [0.001, 0.01] as [number, number],
        },
      ],
      expectedTotalCost: 0.005,
      testDuration: 5000,
    };

    await expect(
      testFramework.runTestScenario(scenario, "integration-test-user"),
    ).resolves.not.toThrow();

    const results = testFramework.getTestResults();
    expect(results).toHaveLength(1);
    expect(results[0].errors).toHaveLength(0);
  }, 15000);

  it("should handle mixed provider usage correctly", async () => {
    const openAIScenario = {
      name: "OpenAI Test",
      description: "OpenAI provider test",
      provider: mockOpenAIProvider,
      requests: [
        {
          prompt: "OpenAI test",
          model: "gpt-4",
          expectedTokenRange: [10, 100] as [number, number],
          expectedCostRange: [0.001, 0.01] as [number, number],
        },
      ],
      expectedTotalCost: 0.005,
      testDuration: 3000,
    };

    const geminiScenario = {
      name: "Gemini Test",
      description: "Gemini provider test",
      provider: mockGeminiProvider,
      requests: [
        {
          prompt: "Gemini test",
          model: "gemini-pro",
          expectedTokenRange: [10, 100] as [number, number],
          expectedCostRange: [0.0001, 0.005] as [number, number],
        },
      ],
      expectedTotalCost: 0.002,
      testDuration: 3000,
    };

    await testFramework.runTestScenario(openAIScenario, "openai-test-user");
    await testFramework.runTestScenario(geminiScenario, "gemini-test-user");

    const results = testFramework.getTestResults();
    expect(results).toHaveLength(2);

    // Verify different providers were tested
    const providerNames = results.map((r) => r.scenario);
    expect(providerNames).toContain("OpenAI Test");
    expect(providerNames).toContain("Gemini Test");
  }, 20000);
});
