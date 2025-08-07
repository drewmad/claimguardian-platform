/**
 * @fileMetadata
 * @purpose "Custom hook for email verification status and actions"
 * @owner auth-team
 * @dependencies ["react", "@/lib/supabase", "@/components/notifications"]
 * @exports ["useEmailVerification"]
 * @complexity medium
 * @tags ["hook", "auth", "verification", "email"]
 * @status stable
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/notifications/toast-system";
import { useNotifications } from "@/components/notifications/notification-center";
import { logger } from "@/lib/logger";

export interface EmailVerificationState {
  isVerified: boolean | null; // null = checking, boolean = known state
  email: string | null;
  user: any | null;
  isLoading: boolean;
  canResend: boolean;
  lastSentAt: number | null;
  resendCooldown: number;
  attempts: number;
  error: string | null;
}

export interface EmailVerificationActions {
  checkStatus: () => Promise<void>;
  resendEmail: (email?: string) => Promise<boolean>;
  clearError: () => void;
  resetCooldown: () => void;
}

const RESEND_COOLDOWN = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

export function useEmailVerification(): EmailVerificationState &
  EmailVerificationActions {
  const [state, setState] = useState<EmailVerificationState>({
    isVerified: null,
    email: null,
    user: null,
    isLoading: true,
    canResend: true,
    lastSentAt: null,
    resendCooldown: 0,
    attempts: 0,
    error: null,
  });

  const { success, error, info, loading: toastLoading } = useToast();
  const { addNotification } = useNotifications();

  // Check verification status
  const checkStatus = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setState((prev) => ({
          ...prev,
          isVerified: false,
          isLoading: false,
          error: "Failed to check verification status",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isVerified: !!user?.email_confirmed_at,
        email: user?.email || null,
        user,
        isLoading: false,
      }));

      logger.track("verification_status_checked", {
        isVerified: !!user?.email_confirmed_at,
        hasUser: !!user,
        email: user?.email,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Unexpected error checking verification status",
      }));
      logger.error("Failed to check verification status", {}, err as Error);
    }
  }, []);

  // Resend verification email
  const resendEmail = useCallback(
    async (email?: string): Promise<boolean> => {
      const targetEmail = email || state.email;
      if (!targetEmail) {
        error("No email address available for verification");
        return false;
      }

      if (!state.canResend) {
        error(
          `Please wait ${Math.ceil(state.resendCooldown / 1000)} seconds before resending`,
        );
        return false;
      }

      if (state.attempts >= MAX_ATTEMPTS) {
        error("Maximum resend attempts reached. Please contact support.");
        return false;
      }

      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const toastId = toastLoading("Sending verification email...", {
          persistent: true,
        });

        const supabase = createClient();
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: targetEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify-enhanced`,
          },
        });

        if (resendError) {
          let errorMessage = resendError.message;
          let isRateLimited = false;

          if (
            resendError.message.includes("rate limit") ||
            resendError.message.includes("too many")
          ) {
            errorMessage =
              "Too many attempts. Please wait before requesting another email.";
            isRateLimited = true;
          }

          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
            canResend: !isRateLimited,
            resendCooldown: isRateLimited ? RESEND_COOLDOWN * 2 : 0,
            lastSentAt: isRateLimited ? Date.now() : prev.lastSentAt,
          }));

          error(errorMessage, {
            actions: isRateLimited
              ? []
              : [
                  {
                    label: "Try Again",
                    onClick: () => resendEmail(targetEmail),
                  },
                ],
          });

          logger.warn(
            "Failed to resend verification email",
            { email: targetEmail },
            resendError,
          );
          return false;
        }

        const newAttempts = state.attempts + 1;
        const now = Date.now();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          canResend: false,
          lastSentAt: now,
          resendCooldown: RESEND_COOLDOWN,
          attempts: newAttempts,
          error: null,
        }));

        success("Verification email sent!", {
          subtitle: `Check your inbox at ${targetEmail}`,
          actions: [
            {
              label: "Open Email",
              onClick: () => {
                const emailDomain =
                  targetEmail.split("@")[1]?.toLowerCase() || "";
                const emailUrls: Record<string, string> = {
                  "gmail.com": "https://gmail.com",
                  "yahoo.com": "https://mail.yahoo.com",
                  "outlook.com": "https://outlook.live.com",
                  "hotmail.com": "https://outlook.live.com",
                  "icloud.com": "https://icloud.com/mail",
                };
                const url = emailUrls[emailDomain] || `mailto:${targetEmail}`;
                window.open(url, "_blank");
              },
            },
          ],
        });

        addNotification({
          title: "Verification Email Sent",
          message: `We've sent a verification email to ${targetEmail}. Please check your inbox and spam folder.`,
          type: "info",
          priority: "medium",
          source: "system",
          actionable: true,
          read: false,
          archived: false,
          actions: [
            {
              id: "check-email",
              label: "Check Email",
              type: "primary",
              handler: () => {
                const emailDomain =
                  targetEmail.split("@")[1]?.toLowerCase() || "";
                const url =
                  emailDomain === "gmail.com"
                    ? "https://gmail.com"
                    : `mailto:${targetEmail}`;
                window.open(url, "_blank");
              },
            },
          ],
        });

        logger.track("verification_email_sent", {
          email: targetEmail,
          attempt: newAttempts,
          totalAttempts: newAttempts,
        });

        // Start cooldown timer
        const cooldownInterval = setInterval(() => {
          setState((prev) => {
            const newCooldown = Math.max(0, prev.resendCooldown - 1000);
            return {
              ...prev,
              resendCooldown: newCooldown,
              canResend: newCooldown === 0 && prev.attempts < MAX_ATTEMPTS,
            };
          });
        }, 1000);

        // Clear interval after cooldown
        setTimeout(() => {
          clearInterval(cooldownInterval);
        }, RESEND_COOLDOWN + 1000);

        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Unexpected error sending verification email",
        }));

        error("Failed to send verification email", {
          subtitle: "Please try again in a moment",
        });

        logger.error(
          "Unexpected error resending verification email",
          { email: targetEmail },
          err as Error,
        );
        return false;
      }
    },
    [
      state.email,
      state.canResend,
      state.resendCooldown,
      state.attempts,
      error,
      toastLoading,
      success,
      addNotification,
    ],
  );

  // Clear error state
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Reset cooldown (for testing or special cases)
  const resetCooldown = useCallback(() => {
    setState((prev) => ({
      ...prev,
      canResend: prev.attempts < MAX_ATTEMPTS,
      resendCooldown: 0,
      lastSentAt: null,
    }));
  }, []);

  // Initial status check on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Auto-refresh status every 30 seconds if not verified
  useEffect(() => {
    if (state.isVerified || state.isLoading) return;

    const interval = setInterval(() => {
      checkStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [state.isVerified, state.isLoading, checkStatus]);

  return {
    ...state,
    checkStatus,
    resendEmail,
    clearError,
    resetCooldown,
  };
}

// Utility hook for components that just need to know verification status
export function useVerificationStatus() {
  const { isVerified, email, user, isLoading, checkStatus } =
    useEmailVerification();

  return {
    isVerified,
    email,
    user,
    isLoading,
    refresh: checkStatus,
  };
}
