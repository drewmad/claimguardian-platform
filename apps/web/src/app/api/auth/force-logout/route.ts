import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut(); // clears the HttpOnly cookie
    return NextResponse.json({ ok: true, message: "Successfully logged out" });
  } catch (error) {
    console.error("Force logout error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to logout" }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}