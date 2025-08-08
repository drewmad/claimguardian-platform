"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function authenticateAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/auth/signin?message=Email%20and%20password%20required");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/auth/signin?message=${encodeURIComponent(error.message)}`);
  }

  // Cookie is set by Supabase SSR helper; now it's safe to hit protected pages.
  redirect("/dashboard");
}