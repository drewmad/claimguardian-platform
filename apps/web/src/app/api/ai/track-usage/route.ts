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

// Force Node.js runtime for AI operations (requires Supabase server client)
export const runtime = 'nodejs';

// Workspace guard: Ensure @claimguardian packages are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('[@claimguardian/ai-services] Supabase configuration required for AI operations');
}
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger/production-logger";
import { createClient } from "@/lib/supabase/server";

interface UsageTrackingData {
  featureId: string;
  model: string;
  success: boolean;
  responseTime: number;
  cost?: number;
  userId?: string;
  timestamp: string;
  promptId?: string;
  requestMetadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: UsageTrackingData = await request.json();
    const {
      featureId,
      model,
      success,
      responseTime,
      cost,
      userId,
      timestamp,
      promptId,
      requestMetadata,
    } = body;

    // Validate required fields
    if (
      !featureId ||
      !model ||
      typeof success !== "boolean" ||
      typeof responseTime !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: featureId, model, success, responseTime",
        },
        { status: 400 });
    }

    const supabase = await createClient();

    // Get current user if not provided
    let trackingUserId = userId;
    if (!trackingUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      trackingUserId = user?.id || "anonymous";
    }

    // Store usage data in database
    const { error } = await supabase.from("ai_usage_tracking").insert({
      feature_id: featureId,
      model: model,
      success,
      response_time: responseTime,
      cost: cost || 0,
      user_id: trackingUserId,
      prompt_id: promptId || null,
      request_metadata: requestMetadata || {},
      created_at: timestamp,
    });

    if (error) {
      throw error;
    }

    logger.info("AI usage tracked", {
      featureId,
      model,
      success,
      responseTime,
      cost,
      userId: trackingUserId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to track AI usage:", {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 });
  }
}
