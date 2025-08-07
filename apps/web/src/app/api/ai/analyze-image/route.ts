/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI image analysis with automatic cost tracking"
 * @dependencies ["@/middleware/cost-tracking", "@/services/ai-client-tracked"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */

// Force Node.js runtime for AI operations (requires Supabase server client)
export const runtime = 'nodejs';

// Workspace guard: Ensure @claimguardian packages are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('[@claimguardian/ai-services] Supabase configuration required for AI operations');
}
import { NextRequest, NextResponse } from "next/server";

import { withCostTracking, withBudgetCheck } from "@/middleware/cost-tracking";
import { trackedAIClient, TrackedAIClient } from "@/services/ai-client-tracked";
import { withErrorHandling } from "@/lib/error-handling/async-error-handler";
import { logger } from "@/lib/logger";
import { inputSanitizer } from "@/lib/security/input-sanitizer";
import { withRateLimit, RateLimiter } from "@/lib/security/rate-limiter";

const costTrackingContext = {
  toolName: "damage-analyzer",
  toolDisplayName: "Damage Analyzer",
  featureUsed: "image_analysis",
};

export const POST = withBudgetCheck(
  withCostTracking(
    costTrackingContext,
    async (request: NextRequest): Promise<NextResponse> => {
      return withRateLimit(
        request,
        "ai-analyze-image",
        RateLimiter.configs.strict,
        async () => {
          const result = await withErrorHandling(async () => {
            const body = await request.json();

            // Sanitize input data
            const sanitizedData = inputSanitizer.sanitizeFormData(body);
            const {
              image,
              prompt,
              model = "openai",
              sessionId,
            } = sanitizedData;

            // Validate required fields
            if (!image || !prompt) {
              throw new Error("Image and prompt are required");
            }

            // Check if the selected provider is configured
            const provider = model as "openai" | "gemini";
            if (!TrackedAIClient.isConfigured(provider)) {
              throw new Error(`${provider} API key is not configured`);
            }

            // Validate model selection
            if (!["openai", "gemini"].includes(provider)) {
              throw new Error("Invalid model selection");
            }

            // Sanitize prompt
            const sanitizedPrompt = inputSanitizer.sanitizeText(
              prompt as string,
              5000,
            );
            if (!sanitizedPrompt) {
              throw new Error("Invalid prompt provided");
            }

            // Validate image data (basic checks)
            if (typeof image !== "string" || !image.startsWith("data:image/")) {
              throw new Error("Invalid image format");
            }

            // Use the tracked AI client for automatic cost tracking
            const response = await trackedAIClient.analyzeImage({
              provider,
              model: provider === "openai" ? "gpt-4o" : "gemini-pro-vision",
              prompt: sanitizedPrompt,
              images: [image],
              temperature: 0.3,
              maxTokens: 1000,
              toolContext: {
                ...costTrackingContext,
                sessionId: sessionId as string,
                modelVersion:
                  provider === "openai" ? "gpt-4o" : "gemini-pro-vision",
                temperature: 0.3,
                maxTokens: 1000,
              },
            });

            return {
              response: response.content,
              usage: response.usage,
              model: response.model,
            };
          }, "AI Image Analysis");

          if (!result.success) {
            logger.error(
              "AI Image Analysis failed",
              {},
              result.error instanceof Error
                ? result.error
                : new Error(String(result.error)),
            );

            // Determine appropriate status code based on error
            const status =
              result.error.message.includes("required") ||
              result.error.message.includes("Invalid")
                ? 400
                : 500;

            return NextResponse.json(
              { error: result.error.message },
              { status });
          }

          return NextResponse.json(result.data);
        },
      ) as Promise<NextResponse>;
    },
  ),
);
