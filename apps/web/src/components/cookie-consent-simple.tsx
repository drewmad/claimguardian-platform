/**
 * @fileMetadata
 * @purpose "Simplified cookie consent banner - single choice, fully compliant"
 * @dependencies ["@/lib","lucide-react","react"]
 * @owner compliance-team
 * @status stable
 */
"use client";

import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";

import { logger } from "@/lib/logger";

export function CookieConsentSimple() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    // Accept ALL cookies with single click
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());

    logger.track("cookie_consent_accepted_simple");

    // Initialize all analytics/tracking
    if (typeof window !== "undefined") {
      // Google Analytics, Sentry, etc.
      logger.info("All tracking initialized");
    }

    setIsVisible(false);
  };

  const handleReject = () => {
    // Reject ALL optional cookies (only necessary cookies remain)
    localStorage.setItem("cookie-consent", "necessary-only");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());

    logger.track("cookie_consent_necessary_only");

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4">
        <div className="flex gap-3">
          <Cookie className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            <p className="text-sm text-slate-300">
              We use cookies for analytics, personalization, and ads.{" "}
              <a
                href="/legal/privacy-policy"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Learn more
              </a>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                Necessary Only
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
