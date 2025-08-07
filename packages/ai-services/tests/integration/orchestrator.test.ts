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
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AIOrchestrator } from "../../src/orchestrator/orchestrator";
import { GeminiProvider } from "../../src/providers/gemini.provider";
import { CacheManager } from "../../src/cache/cache.manager";
import { CostTracker } from "../../src/monitoring/cost-tracker";
import { AIRequest } from "../../src/types/index";

describe("AIOrchestrator Integration", () => {
  let orchestrator: AIOrchestrator;
  let cache: CacheManager;

  beforeAll(() => {
    // Use in-memory cache for tests
    cache = new CacheManager(undefined, false);

    // Create orchestrator with test configuration
    orchestrator = new AIOrchestrator({
      providers: {
        gemini: new GeminiProvider({
          apiKey: process.env.GEMINI_API_KEY || "test-key",
        }),
      },
      cache,
      useSemanticCache: false,
    });
  });

  afterAll(async () => {
    await cache.close();
  });

  it("should process a simple request", async () => {
    const request: AIRequest = {
      prompt: "What is 2+2?",
      userId: "test-user",
      feature: "generic",
    };

    const response = await orchestrator.process(request);

    expect(response).toBeDefined();
    expect(response.text).toBeTruthy();
    expect(response.provider).toBe("gemini");
    expect(response.cached).toBe(false);
  }, 10000);

  it("should cache responses", async () => {
    const request: AIRequest = {
      prompt: "What is the capital of France?",
      userId: "test-user",
      feature: "generic",
    };

    // First request - should not be cached
    const response1 = await orchestrator.process(request);
    expect(response1.cached).toBe(false);

    // Second request - should be cached
    const response2 = await orchestrator.process(request);
    expect(response2.cached).toBe(true);
    expect(response2.text).toBe(response1.text);
  }, 15000);

  it("should handle different features", async () => {
    const features: AIRequest["feature"][] = ["clara", "clarity", "max"];

    for (const feature of features) {
      const request: AIRequest = {
        prompt: "Test prompt",
        userId: "test-user",
        feature,
      };

      const response = await orchestrator.process(request);
      expect(response).toBeDefined();
      expect(response.orchestrated).toBe(true);
    }
  }, 20000);

  it("should get cache statistics", async () => {
    const stats = await orchestrator.getCacheStats();

    expect(stats).toBeDefined();
    expect(stats.hits).toBeGreaterThanOrEqual(0);
    expect(stats.misses).toBeGreaterThanOrEqual(0);
    expect(stats.hitRate).toBeGreaterThanOrEqual(0);
  });

  it("should check provider status", async () => {
    const status = await orchestrator.getProviderStatus();

    expect(status).toBeDefined();
    expect(status.gemini).toBeDefined();
  });
});
