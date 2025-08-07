import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documentText, documentId } = body;

    if (!documentText) {
      return NextResponse.json(
        { error: "Document text is required" },
        { status: 400 });
    }

    // Call our Edge Function for deadline analysis
    const { data, error } = await supabase.functions.invoke(
      "proactive-deadline-guardian",
      {
        body: {
          documentText,
          documentId,
          userId: user.id,
          analysisType: "full",
        },
      },
    );

    if (error) {
      console.error("Edge function error:", error);
      return NextResponse.json(
        { error: "Deadline analysis failed" },
        { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Deadline analysis API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 });
  }
}
