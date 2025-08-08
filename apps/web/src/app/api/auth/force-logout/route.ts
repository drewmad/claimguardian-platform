import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut(); // clears the HttpOnly cookie
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return POST();
}