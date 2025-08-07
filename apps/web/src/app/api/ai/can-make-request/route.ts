/**
 * API route for checking if user can make an AI request
 */
import { NextRequest, NextResponse } from "next/server";
import { costTrackingService } from "@/services/cost-tracking";
import { createClient } from "@/lib/supabase/server";

// Force Node.js runtime for AI operations (requires Supabase server client)
export const runtime = 'nodejs';

// Workspace guard: Ensure @claimguardian packages are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('[@claimguardian/ai-services] Supabase configuration required for AI operations');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toolName = "general" } = body;

    const canMakeRequest =
      await costTrackingService.canUserMakeRequest(toolName);

    return NextResponse.json(canMakeRequest);
  } catch (error) {
    console.error("Failed to check request limits:", error);
    return NextResponse.json(
      {
        allowed: false,
        reason: "Unable to verify request limits",
      },
      { status: 500 });
  }
}
