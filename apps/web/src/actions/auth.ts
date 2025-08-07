/**
 * @fileMetadata
 * @purpose "Authentication server actions for user management"
 * @owner auth-team
 * @dependencies ["@claimguardian/db", "next/headers"]
 * @exports ["signUp", "signIn", "signOut", "resetPassword"]
 * @complexity medium
 * @tags ["server-action", "auth", "user-management"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T22:00:00Z
 */

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export interface AuthResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    if (!email || !password) {
      return {
        success: false,
        error: "Email and password are required",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign up failed",
    };
  }
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return {
        success: false,
        error: "Email and password are required",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Redirect on successful sign in
    redirect("/");
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign in failed",
    };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Redirect to sign in page
    redirect("/auth/signin");
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign out failed",
    };
  }
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  try {
    const email = formData.get("email") as string;

    if (!email) {
      return {
        success: false,
        error: "Email is required",
      };
    }

    const supabase = await createClient();
    const headersList = await headers();
    const origin = headersList.get("origin");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: { message: "Password reset email sent" },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Password reset failed",
    };
  }
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  try {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
      return {
        success: false,
        error: "Password and confirmation are required",
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: "Passwords do not match",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: { message: "Password updated successfully" },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Password update failed",
    };
  }
}
