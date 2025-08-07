/**
 * @fileMetadata
 * @purpose "PWA Provider component that manages app installation prompts and offline indicators"
 * @owner frontend-team
 * @dependencies ["react", "@/components/pwa/install-prompt", "@/components/pwa/offline-indicator"]
 * @exports ["PWAProvider"]
 * @complexity medium
 * @tags ["pwa", "provider", "installation", "offline"]
 * @status stable
 */
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { InstallPrompt } from "./install-prompt";
import { OfflineIndicator } from "./offline-indicator";
import { usePWA, useOfflineStatus } from "@/hooks/use-pwa";

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const pathname = usePathname();
  const { isInstalled, canInstall, platform } = usePWA();
  const { isOnline } = useOfflineStatus();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Determine if we should show install prompt on this page
  const shouldShowInstallPrompt = () => {
    // Don't show on certain pages
    const excludedPaths = [
      "/offline",
      "/pwa-demo",
      "/modal-demo",
      "/touch-demo",
    ];
    if (excludedPaths.some((path) => pathname.includes(path))) return false;

    // Show on dashboard pages for authenticated users
    const dashboardPaths = ["/dashboard"];
    return dashboardPaths.some((path) => pathname.includes(path));
  };

  useEffect(() => {
    // Show install prompt after user has been on the site for a while
    if (!isInstalled && canInstall && shouldShowInstallPrompt()) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000); // Show after 5 seconds on dashboard

      return () => clearTimeout(timer);
    }
  }, [isInstalled, canInstall, pathname]);

  return (
    <>
      {children}

      {/* Install Prompt */}
      {showInstallPrompt && !isInstalled && canInstall && (
        <InstallPrompt
          variant={platform === "desktop" ? "banner" : "inline"}
          autoShow={false}
          onInstall={() => setShowInstallPrompt(false)}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}

      {/* Offline Indicator */}
      <OfflineIndicator variant="detailed" position="top" />
    </>
  );
}
