/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import { Cookie, X, Settings, Check } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

const COOKIE_CONSENT_KEY = "claimguardian_cookie_consent";
const COOKIE_CONSENT_VERSION = "1.0";

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true, // Always true
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  });

  // Check for existing consent
  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (!storedConsent) {
      // No consent found, show banner
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(storedConsent) as CookieConsent;

        // Check if consent version is current
        if (parsed.version !== COOKIE_CONSENT_VERSION) {
          // Version mismatch, show banner again
          setShowBanner(true);
        } else {
          // Valid consent found
          setConsent(parsed);
          applyCookieSettings(parsed);
        }
      } catch {
        // Invalid consent data, show banner
        setShowBanner(true);
      }
    }
  }, []);

  // Apply cookie settings
  const applyCookieSettings = (settings: CookieConsent) => {
    // Essential cookies are always enabled

    // Analytics cookies
    if (settings.analytics) {
      // Enable Google Analytics or other analytics
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
        });
      }
    } else {
      // Disable analytics
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
        });
      }
    }

    // Marketing cookies
    if (settings.marketing) {
      // Enable marketing cookies
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          ad_storage: "granted",
        });
      }
    } else {
      // Disable marketing cookies
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          ad_storage: "denied",
        });
      }
    }
  };

  // Save consent
  const saveConsent = (newConsent: CookieConsent) => {
    // Save to localStorage
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));

    // Apply settings
    applyCookieSettings(newConsent);

    // Hide banner
    setShowBanner(false);
    setShowSettings(false);

    // Track consent (if analytics enabled)
    if (newConsent.analytics && typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "cookie_consent", {
        essential: newConsent.essential,
        analytics: newConsent.analytics,
        marketing: newConsent.marketing,
      });
    }
  };

  // Accept all cookies
  const acceptAll = () => {
    const newConsent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    };

    setConsent(newConsent);
    saveConsent(newConsent);
  };

  // Accept only essential
  const acceptEssential = () => {
    const newConsent: CookieConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    };

    setConsent(newConsent);
    saveConsent(newConsent);
  };

  // Save custom settings
  const saveSettings = () => {
    const newConsent: CookieConsent = {
      ...consent,
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    };

    saveConsent(newConsent);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {!showSettings ? (
              /* Main Banner */
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Cookie className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Cookie Preferences
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      We use cookies to enhance your experience on
                      ClaimGuardian. Essential cookies help our site function
                      properly, while optional cookies help us understand how
                      you use our services and show you relevant content.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={acceptAll}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Accept All
                      </Button>
                      <Button onClick={acceptEssential} variant="outline">
                        Essential Only
                      </Button>
                      <Button
                        onClick={() => setShowSettings(true)}
                        variant="ghost"
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Customize
                      </Button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Settings Panel */
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cookie Settings
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Choose which cookies you want to accept. Essential cookies
                    cannot be disabled as they are required for the site to
                    function.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Essential Cookies */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">
                        Essential Cookies
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Required for the website to function properly. These
                        include security, authentication, and session
                        management.
                      </p>
                    </div>
                    <div className="ml-4 flex items-center">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-500 ml-2">
                        Always On
                      </span>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <Label
                        htmlFor="analytics"
                        className="text-base font-medium"
                      >
                        Analytics Cookies
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Help us understand how you use our website so we can
                        improve your experience. All data is anonymized.
                      </p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={consent.analytics}
                      onCheckedChange={(checked: boolean) =>
                        setConsent({ ...consent, analytics: checked })
                      }
                      className="ml-4"
                    />
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <Label
                        htmlFor="marketing"
                        className="text-base font-medium"
                      >
                        Marketing Cookies
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Used to show you relevant advertisements and measure the
                        effectiveness of our marketing campaigns.
                      </p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={consent.marketing}
                      onCheckedChange={(checked: boolean) =>
                        setConsent({ ...consent, marketing: checked })
                      }
                      className="ml-4"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="ghost"
                  >
                    Back
                  </Button>
                  <div className="flex gap-3">
                    <Button onClick={acceptEssential} variant="outline">
                      Reject Optional
                    </Button>
                    <Button
                      onClick={saveSettings}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Utility hook for checking cookie consent
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent) {
      try {
        setConsent(JSON.parse(storedConsent));
      } catch {
        setConsent(null);
      }
    }
  }, []);

  return {
    hasConsent: !!consent,
    consent,
    hasAnalytics: consent?.analytics ?? false,
    hasMarketing: consent?.marketing ?? false,
  };
}
