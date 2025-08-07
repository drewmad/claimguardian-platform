/**
 * @fileMetadata
 * @purpose "Custom hook for PWA functionality including installation and offline detection"
 * @owner frontend-team
 * @dependencies ["react"]
 * @exports ["usePWA", "useInstallPrompt", "useOfflineStatus", "useServiceWorker"]
 * @complexity high
 * @tags ["pwa", "service-worker", "offline", "installation"]
 * @status stable
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  isSupported: boolean;
  platform: "ios" | "android" | "desktop" | "unknown";
  installSource: "browser" | "homescreen" | "unknown";
}

interface InstallPromptState {
  isVisible: boolean;
  event: BeforeInstallPromptEvent | null;
  hasBeenDismissed: boolean;
  installStatus: "idle" | "installing" | "installed" | "failed";
}

interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  offlineAt: Date | null;
  onlineAt: Date | null;
}

interface ServiceWorkerState {
  isRegistered: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

// Main PWA hook
export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    isSupported: false,
    platform: "unknown",
    installSource: "unknown",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkPWAStatus = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");

      const platform = getPlatform();
      const isSupported = "serviceWorker" in navigator;
      const isInstalled =
        isStandalone || localStorage.getItem("pwa-installed") === "true";

      setStatus({
        isInstalled,
        isStandalone,
        canInstall: !isInstalled && isSupported,
        isSupported,
        platform,
        installSource: getInstallSource(),
      });
    };

    checkPWAStatus();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkPWAStatus);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      localStorage.setItem("pwa-installed", "true");
      checkPWAStatus();
      logger.track("pwa_installed");
    });

    return () => {
      mediaQuery.removeEventListener("change", checkPWAStatus);
    };
  }, []);

  return status;
}

// Install prompt hook
export function useInstallPrompt() {
  const [state, setState] = useState<InstallPromptState>({
    isVisible: false,
    event: null,
    hasBeenDismissed: false,
    installStatus: "idle",
  });

  const promptShown = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed) {
      setState((prev) => ({ ...prev, hasBeenDismissed: true }));
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;

      setState((prev) => ({
        ...prev,
        event,
        isVisible: !prev.hasBeenDismissed && !promptShown.current,
      }));

      logger.track("install_prompt_available");
    };

    const handleAppInstalled = () => {
      setState((prev) => ({
        ...prev,
        isVisible: false,
        installStatus: "installed",
      }));

      localStorage.setItem("pwa-installed", "true");
      logger.track("pwa_installed_via_prompt");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const showInstallPrompt = useCallback(async () => {
    if (!state.event) return false;

    try {
      setState((prev) => ({ ...prev, installStatus: "installing" }));

      await state.event.prompt();
      const choiceResult = await state.event.userChoice;

      promptShown.current = true;

      if (choiceResult.outcome === "accepted") {
        logger.track("install_prompt_accepted", {
          platform: choiceResult.platform,
        });
        setState((prev) => ({
          ...prev,
          isVisible: false,
          installStatus: "installed",
        }));
        return true;
      } else {
        logger.track("install_prompt_dismissed", {
          platform: choiceResult.platform,
        });
        setState((prev) => ({
          ...prev,
          isVisible: false,
          hasBeenDismissed: true,
          installStatus: "failed",
        }));
        localStorage.setItem("install-prompt-dismissed", Date.now().toString());
        return false;
      }
    } catch (error) {
      logger.error("Install prompt failed", { error });
      setState((prev) => ({
        ...prev,
        installStatus: "failed",
      }));
      return false;
    }
  }, [state.event]);

  const hideInstallPrompt = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isVisible: false,
      hasBeenDismissed: true,
    }));
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
    logger.track("install_prompt_manually_dismissed");
  }, []);

  return {
    ...state,
    showInstallPrompt,
    hideInstallPrompt,
  };
}

// Offline status hook
export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: true,
    wasOffline: false,
    offlineAt: null,
    onlineAt: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      const now = new Date();

      setStatus((prev) => ({
        isOnline,
        wasOffline: prev.wasOffline || (!isOnline && prev.isOnline),
        offlineAt: !isOnline && prev.isOnline ? now : prev.offlineAt,
        onlineAt: isOnline && !prev.isOnline ? now : prev.onlineAt,
      }));

      if (isOnline) {
        logger.track("network_online");
      } else {
        logger.track("network_offline");
      }
    };

    // Set initial status
    updateOnlineStatus();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return status;
}

// Service worker hook
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isRegistered: false,
    isUpdating: false,
    hasUpdate: false,
    registration: null,
  });

  const updateServiceWorker = useCallback(() => {
    if (state.registration && state.registration.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, [state.registration]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        logger.track("service_worker_registered");

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          setState((prev) => ({ ...prev, isUpdating: true }));

          newWorker?.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setState((prev) => ({
                ...prev,
                isUpdating: false,
                hasUpdate: true,
              }));
              logger.track("service_worker_update_available");
            }
          });
        });

        // Listen for controlling service worker changes
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      } catch (error) {
        logger.error("Service worker registration failed", { error });
      }
    };

    registerServiceWorker();

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "UPDATE_AVAILABLE") {
        setState((prev) => ({ ...prev, hasUpdate: true }));
      }
    });
  }, []);

  return {
    ...state,
    updateServiceWorker,
  };
}

// Helper functions
function getPlatform(): PWAStatus["platform"] {
  if (typeof window === "undefined") return "unknown";

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  if (/android/.test(userAgent)) return "android";
  if (/win|mac|linux/.test(userAgent)) return "desktop";

  return "unknown";
}

function getInstallSource(): PWAStatus["installSource"] {
  if (typeof window === "undefined") return "unknown";

  if (document.referrer.includes("android-app://")) return "homescreen";
  if (window.matchMedia("(display-mode: standalone)").matches)
    return "homescreen";

  return "browser";
}

// Background sync utilities
export function requestBackgroundSync(tag: string, data?: any) {
  if (
    "serviceWorker" in navigator &&
    "sync" in window.ServiceWorkerRegistration.prototype
  ) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register(tag);
      })
      .catch((error) => {
        logger.error("Background sync registration failed", { error, tag });
      });
  }
}

// Cache data for offline use
export function cacheForOffline(key: string, data: any) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({
      type: "CACHE_DATA",
      key,
      data,
    });
  }
}
