/**
 * Admin API route for AI cost analytics
 */
import { NextRequest, NextResponse } from "next/server";
import { costTrackingService } from "@/services/cost-tracking";
import { withAdminAuth } from "@/lib/auth/admin-auth";

// Force Node.js runtime for AI operations (requires Supabase server client)
export const runtime = 'nodejs';

// Workspace guard: Ensure @claimguardian packages are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('[@claimguardian/ai-services] Supabase configuration required for AI operations');
}

export async function GET(request: NextRequest) {
  return withAdminAuth(async (user, profile) => {

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Get admin analytics
    const analytics = await costTrackingService.getAdminCostAnalytics(
      startDate,
      endDate,
    );

    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  });
}
