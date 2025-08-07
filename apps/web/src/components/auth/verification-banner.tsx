/**
 * @fileMetadata
 * @purpose "Email verification banner component for dashboard and other pages"
 * @owner auth-team
 * @dependencies ["react", "framer-motion", "@/hooks/use-email-verification"]
 * @exports ["VerificationBanner"]
 * @complexity medium
 * @tags ["auth", "verification", "banner", "component"]
 * @status stable
 */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  CheckCircle,
  X,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useEmailVerification } from "@/hooks/use-email-verification";
import { cn } from "@/lib/utils";

interface VerificationBannerProps {
  variant?: "default" | "compact" | "inline";
  showDismiss?: boolean;
  className?: string;
  onVerified?: () => void;
}

export function VerificationBanner({
  variant = "default",
  showDismiss = true,
  className,
  onVerified,
}: VerificationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    isVerified,
    email,
    isLoading,
    canResend,
    resendCooldown,
    attempts,
    error,
    resendEmail,
    clearError,
  } = useEmailVerification();

  // Don't show if verified, loading, dismissed, or no email
  if (isVerified || isLoading || isDismissed || !email) {
    return null;
  }

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      const success = await resendEmail();
      if (success && onVerified) {
        // Don't call onVerified immediately, but set up for when verification completes
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    clearError();
  };

  const openEmailClient = () => {
    const emailDomain = email.split("@")[1]?.toLowerCase() || "";
    const emailUrls: Record<string, string> = {
      "gmail.com": "https://gmail.com",
      "yahoo.com": "https://mail.yahoo.com",
      "outlook.com": "https://outlook.live.com",
      "hotmail.com": "https://outlook.live.com",
      "icloud.com": "https://icloud.com/mail",
    };
    const url = emailUrls[emailDomain] || `mailto:${email}`;
    window.open(url, "_blank");
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return "p-3";
      case "inline":
        return "p-4 rounded-lg";
      default:
        return "p-4 rounded-lg";
    }
  };

  const cooldownSeconds = Math.ceil(resendCooldown / 1000);

  if (variant === "compact") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800",
            getVariantStyles(),
            className,
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Please verify your email address
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-300">
                  {email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResend}
                disabled={!canResend || isResending}
                className="text-xs"
              >
                {isResending ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : cooldownSeconds > 0 ? (
                  `${cooldownSeconds}s`
                ) : (
                  "Resend"
                )}
              </Button>

              {showDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-orange-600 hover:text-orange-700 p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={cn(className)}
      >
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <AlertTriangle className="w-4 h-4 text-orange-600" />

          <div className="flex-1 min-w-0">
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">
                      Email Verification Required
                    </h4>
                    {attempts > 0 && (
                      <span className="text-xs text-orange-600 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded">
                        {attempts}/5 attempts
                      </span>
                    )}
                  </div>

                  <p className="text-orange-700 dark:text-orange-300 text-sm mb-3">
                    We sent a verification email to{" "}
                    <span className="font-medium">{email}</span>. Please check
                    your inbox and spam folder.
                  </p>

                  {error && (
                    <div className="mb-3">
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        {error}
                      </p>
                    </div>
                  )}

                  {cooldownSeconds > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-300">
                        <Clock className="w-4 h-4" />
                        <span>You can resend in {cooldownSeconds} seconds</span>
                      </div>
                      <Progress
                        value={((30 - cooldownSeconds) / 30) * 100}
                        className="h-1 mt-1 bg-orange-100 dark:bg-orange-900/40"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={handleResend}
                      disabled={!canResend || isResending}
                      variant={error ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-3 h-3 mr-1" />
                          {attempts === 0 ? "Send Email" : "Resend Email"}
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openEmailClient}
                      className="text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Check Email
                    </Button>
                  </div>
                </div>

                {showDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-orange-600 hover:text-orange-700 p-1 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </AlertDescription>
          </div>
        </Alert>

        {/* Help text */}
        <div className="mt-3 px-4">
          <details className="text-xs text-gray-600 dark:text-gray-400">
            <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
              Not receiving emails?
            </summary>
            <div className="mt-2 pl-4 space-y-1">
              <p>• Check your spam/junk folder</p>
              <p>• Make sure {email} is correct</p>
              <p>• Add noreply@claimguardianai.com to your contacts</p>
              <p>• Verification links expire after 24 hours</p>
            </div>
          </details>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Success banner when verification completes
export function VerificationSuccessBanner({
  onDismiss,
  className,
}: {
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(className)}
    >
      <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle className="w-4 h-4 text-green-600" />

        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                Email Verified Successfully!
              </h4>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Your account is now fully activated and you have access to all
                features.
              </p>
            </div>

            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-green-600 hover:text-green-700 p-1 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
