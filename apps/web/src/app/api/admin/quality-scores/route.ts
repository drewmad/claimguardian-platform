/**
 * @fileMetadata
 * @purpose "Quality Scores API endpoints for admin panel"
 * @dependencies ["@/lib","next"]
 * @owner ai-team
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  AIQualityScore,
  CreateQualityScoreRequest,
  QualityMetricsSummary,
  AIOperationsResponse,
} from "@/types/ai-operations";

// GET /api/admin/quality-scores - Get quality scores and analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get("feature_id");
    const model = searchParams.get("model");
    const days = parseInt(searchParams.get("days") || "7");

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 },
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required", success: false },
        { status: 403 },
      );
    }

    // Build base query
    let query = supabase
      .from("ai_quality_scores")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("created_at", { ascending: false });

    if (featureId) {
      query = query.eq("feature_id", featureId);
    }

    if (model) {
      query = query.eq("model", model);
    }

    const { data: scores, error: scoresError } = await query;

    if (scoresError) {
      console.error("Error fetching quality scores:", scoresError);
      return NextResponse.json(
        { error: "Failed to fetch quality scores", success: false },
        { status: 500 },
      );
    }

    // Calculate summary metrics
    const summary: QualityMetricsSummary = {
      overall_rating: 0,
      total_ratings: scores?.length || 0,
      response_rate: 0,
      satisfaction_rate: 0,
      ratings_by_feature: {},
    };

    if (scores && scores.length > 0) {
      // Calculate overall rating
      const totalRating = scores.reduce(
        (sum, score) => sum + score.numeric_rating,
        0,
      );
      summary.overall_rating =
        Math.round((totalRating / scores.length) * 10) / 10;

      // Calculate satisfaction rate (ratings 4-5)
      const satisfiedRatings = scores.filter(
        (score) => score.numeric_rating >= 4,
      ).length;
      summary.satisfaction_rate = Math.round(
        (satisfiedRatings / scores.length) * 100,
      );

      // Group by feature
      const featureGroups: Record<string, AIQualityScore[]> = {};
      scores.forEach((score) => {
        if (!featureGroups[score.feature_id]) {
          featureGroups[score.feature_id] = [];
        }
        featureGroups[score.feature_id].push(score);
      });

      // Calculate metrics per feature
      Object.entries(featureGroups).forEach(([featureId, featureScores]) => {
        const featureRating =
          featureScores.reduce((sum, score) => sum + score.numeric_rating, 0) /
          featureScores.length;
        const latestFeedback =
          featureScores.find((score) => score.feedback)?.feedback || "";

        summary.ratings_by_feature[featureId] = {
          rating: Math.round(featureRating * 10) / 10,
          count: featureScores.length,
          latest_feedback: latestFeedback,
        };
      });

      // Calculate response rate (assuming we track total requests separately)
      // For now, use a placeholder calculation
      summary.response_rate = Math.min(
        100,
        Math.round((scores.length / Math.max(scores.length * 1.15, 1)) * 100),
      );
    }

    // Get recent feedback for display
    const recentFeedback =
      scores?.filter((score) => score.feedback).slice(0, 10) || [];

    return NextResponse.json({
      data: {
        summary,
        scores: scores || [],
        recent_feedback: recentFeedback,
      },
      success: true,
    });
  } catch (error) {
    console.error("Quality Scores GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 },
    );
  }
}

// POST /api/admin/quality-scores - Create quality score (typically called by AI tools)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateQualityScoreRequest = await request.json();

    // Get current user (can be regular user submitting feedback)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 },
      );
    }

    // Validate input
    if (
      !body.feature_id ||
      !body.model ||
      !body.rating ||
      !body.numeric_rating ||
      !body.response_time
    ) {
      return NextResponse.json(
        { error: "Missing required fields", success: false },
        { status: 400 },
      );
    }

    if (body.numeric_rating < 1 || body.numeric_rating > 5) {
      return NextResponse.json(
        { error: "Numeric rating must be between 1 and 5", success: false },
        { status: 400 },
      );
    }

    const validRatings = ["excellent", "good", "fair", "poor"];
    if (!validRatings.includes(body.rating)) {
      return NextResponse.json(
        { error: "Invalid rating value", success: false },
        { status: 400 },
      );
    }

    // Create quality score
    const { data: newScore, error: createError } = await supabase
      .from("ai_quality_scores")
      .insert({
        feature_id: body.feature_id,
        model: body.model,
        prompt_id: body.prompt_id || null,
        user_id: user.id,
        rating: body.rating,
        numeric_rating: body.numeric_rating,
        response_time: body.response_time,
        feedback: body.feedback || null,
        response_content: body.response_content || null,
        request_metadata: body.request_metadata || {},
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating quality score:", createError);
      return NextResponse.json(
        { error: "Failed to create quality score", success: false },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: newScore,
      success: true,
    });
  } catch (error) {
    console.error("Quality Scores POST error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 },
    );
  }
}
