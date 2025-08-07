/**
 * @fileMetadata
 * @purpose "Server actions for authentication operations"
 * @dependencies ["@/lib","next"]
 * @owner backend-team
 * @status stable
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authLogger } from "@/lib/logger";
import { createAuthClient, serverSignOut } from "@/lib/supabase/server-auth";

/**
 * Server action to sign out the user
 * Clears session and redirects to home
 */
export async function signOutAction() {
  try {
    await serverSignOut();
    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    authLogger.error("Sign out action failed", {}, error as Error);
    // Still redirect even if sign out fails
    redirect("/");
  }
}

/**
 * Server action to validate current session
 * Returns true if session is valid
 */
export async function validateSessionAction(): Promise<boolean> {
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return !error && !!user;
  } catch (error) {
    authLogger.error("Session validation failed", {}, error as Error);
    return false;
  }
}

/**
 * Server action to refresh the current session
 * Returns true if refresh was successful
 */
export async function refreshSessionAction(): Promise<boolean> {
  try {
    const supabase = await createAuthClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error || !session) {
      authLogger.error("Session refresh failed", {}, error || undefined);
      return false;
    }

    revalidatePath("/", "layout");
    return true;
  } catch (error) {
    authLogger.error("Session refresh action failed", {}, error as Error);
    return false;
  }
}

/**
 * Server action to get session expiry time
 * Returns the expiry timestamp or null if no session
 */
export async function getSessionExpiryAction(): Promise<number | null> {
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.expires_at || null;
  } catch (error) {
    authLogger.error("Get session expiry failed", {}, error as Error);
    return null;
  }
}

/**
 * Server action to resend email verification
 * Returns success status and any error message
 */
export async function resendVerificationAction(email: string): Promise<{
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}> {
  try {
    authLogger.info("Resending verification email", { email });

    const supabase = await createAuthClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/verify-enhanced`,
      },
    });

    if (error) {
      if (
        error.message.includes("rate limit") ||
        error.message.includes("too many")
      ) {
        authLogger.warn("Email verification rate limited", {
          email,
          error: error.message,
        });
        return {
          success: false,
          rateLimited: true,
          error:
            "Too many attempts. Please wait before requesting another email.",
        };
      }

      authLogger.error("Failed to resend verification email", { email }, error);
      return {
        success: false,
        error: error.message,
      };
    }

    authLogger.info("Verification email sent successfully", { email });
    return { success: true };
  } catch (error) {
    authLogger.error(
      "Unexpected error resending verification email",
      { email },
      error as Error,
    );
    return {
      success: false,
      error: "An unexpected error occurred while sending verification email",
    };
  }
}

/**
 * Server action to check email verification status
 * Returns the current user's verification status
 */
export async function checkVerificationStatusAction(): Promise<{
  isVerified: boolean;
  email?: string;
  user?: any;
}> {
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { isVerified: false };
    }

    return {
      isVerified: !!user.email_confirmed_at,
      email: user.email,
      user,
    };
  } catch (error) {
    authLogger.error("Failed to check verification status", {}, error as Error);
    return { isVerified: false };
  }
}
