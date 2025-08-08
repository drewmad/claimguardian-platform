"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState = { ok: boolean; error: string | null };

export async function authenticateAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    
    if (!email || !password) {
      return { ok: false, error: "Email and password required" };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { ok: false, error: error.message };
    }

    // Cookie is set by Supabase SSR helper; now it's safe to redirect
    redirect("/dashboard");
  } catch (err: unknown) {
    // Let Next.js handle NEXT_REDIRECT properly
    if (err && typeof err === 'object' && 'digest' in err && err.digest === "NEXT_REDIRECT") {
      throw err;
    }
    
    // Handle other errors
    return { 
      ok: false, 
      error: err instanceof Error ? err.message : "Unexpected error occurred" 
    };
  }
}