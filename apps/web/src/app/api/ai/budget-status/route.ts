/**
 * API route for checking user's budget status
 */
import { NextRequest, NextResponse } from "next/server";
import { costTrackingService } from "@/services/cost-tracking";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const budgetStatus = await costTrackingService.checkBudgetStatus();

    return NextResponse.json(budgetStatus);
  } catch (error) {
    console.error("Failed to get budget status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 });
  }
}
