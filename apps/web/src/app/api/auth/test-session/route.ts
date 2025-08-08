/**
 * @fileMetadata
 * @purpose "Test API endpoint to verify persistent session cookies are working"
 * @dependencies ["@/lib/supabase/server-auth","next"]
 * @owner backend-team
 * @status testing
 */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No session found - cookies not set or expired",
          cookiesReceived: Object.keys(Object.fromEntries(request.cookies))
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Persistent session working correctly",
      sessionData: {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at,
        isValid: true
      },
      cookiesReceived: Object.keys(Object.fromEntries(request.cookies))
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: "Error checking session",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}