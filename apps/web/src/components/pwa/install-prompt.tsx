/**
 * @fileMetadata
 * @purpose "PWA installation prompt component with platform-specific messaging"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["InstallPrompt"]
 * @complexity medium
 * @tags ["pwa", "installation", "modal", "mobile"]
 * @status stable
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Monitor,
  Download,
  X,
  Share,
  Plus,
  Home,
  Zap,
  Shield,
  Star,
  ArrowRight,
} from "lucide-react";

import { useInstallPrompt, usePWA } from "@/hooks/use-pwa";
import { TouchButton } from "@/components/ui/touch-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";

interface InstallPromptProps {
  variant?: "banner" | "modal" | "inline";
  showBenefits?: boolean;
  autoShow?: boolean;
  delay?: number;
  onInstall?: () => void;
  onDismiss?: () => void;
}

const platformInstructions = {
  ios: {
    icon: Smartphone,
    steps: [
      "Tap the Share button in Safari",
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" to install ClaimGuardian',
    ],
    shareIcon: Share,
  },
  android: {
    icon: Smartphone,
    steps: [
      'Tap "Install" when prompted',
      'Or tap the menu (⋮) and select "Add to Home Screen"',
      "Confirm installation to add ClaimGuardian to your home screen",
    ],
    shareIcon: Download,
  },
  desktop: {
    icon: Monitor,
    steps: [
      'Click "Install" when prompted',
      "Or click the install icon in the address bar",
      "Confirm installation to add ClaimGuardian to your applications",
    ],
    shareIcon: Download,
  },
};

const benefits = [
  {
    icon: Zap,
    title: "Faster Access",
    description: "Launch instantly from your home screen",
  },
  {
    icon: Shield,
    title: "Offline Ready",
    description: "Access your properties even without internet",
  },
  {
    icon: Star,
    title: "Native Experience",
    description: "Enjoy a full-screen, app-like experience",
  },
];

export function InstallPrompt({
  variant = "modal",
  showBenefits = true,
  autoShow = true,
  delay = 3000,
  onInstall,
  onDismiss,
}: InstallPromptProps) {
  const { isVisible, installStatus, showInstallPrompt, hideInstallPrompt } =
    useInstallPrompt();
  const { platform, isInstalled, canInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const platformInfo =
    platformInstructions[platform] || platformInstructions.desktop;
  const PlatformIcon = platformInfo.icon;
  const ShareIcon = platformInfo.shareIcon;

  useEffect(() => {
    if (!autoShow || isInstalled || !canInstall) return;

    const timer = setTimeout(() => {
      if (isVisible && !hasInteracted) {
        setShowPrompt(true);
        logger.track("install_prompt_auto_shown", { platform, variant });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    autoShow,
    delay,
    isInstalled,
    canInstall,
    isVisible,
    hasInteracted,
    platform,
    variant,
  ]);

  const handleInstall = async () => {
    setHasInteracted(true);

    if (platform === "ios") {
      // For iOS, we can't programmatically trigger installation
      // Just show instructions
      logger.track("install_prompt_ios_instructions_shown");
      return;
    }

    const success = await showInstallPrompt();

    if (success) {
      onInstall?.();
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setHasInteracted(true);
    setShowPrompt(false);
    hideInstallPrompt();
    onDismiss?.();
  };

  if (isInstalled || !canInstall || (!isVisible && !showPrompt)) {
    return null;
  }

  const renderBanner = () => (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlatformIcon className="w-6 h-6" />
          <div>
            <p className="font-medium">Install ClaimGuardian</p>
            <p className="text-sm opacity-90">Get the full app experience</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TouchButton
            size="sm"
            variant="outline"
            onClick={handleInstall}
            className="text-white border-white/30 hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </TouchButton>

          <TouchButton
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </TouchButton>
        </div>
      </div>
    </motion.div>
  );

  const renderModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4"
      >
        <div className="absolute top-4 right-4">
          <TouchButton
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </TouchButton>
        </div>

        <div className="p-6 pt-8">
          <div className="text-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full w-fit mx-auto mb-4">
              <PlatformIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Install ClaimGuardian
            </h2>

            <p className="text-gray-600 dark:text-gray-400">
              Get the best experience with our app
            </p>
          </div>

          {showBenefits && (
            <div className="space-y-3 mb-6">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {benefit.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {platform === "ios" ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <ShareIcon className="w-4 h-4" />
                  Installation Steps
                </p>
                <ol className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  {platformInfo.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <TouchButton
                onClick={handleDismiss}
                className="w-full"
                variant="outline"
              >
                Got it!
              </TouchButton>
            </div>
          ) : (
            <div className="flex gap-3">
              <TouchButton
                onClick={handleInstall}
                disabled={installStatus === "installing"}
                loading={installStatus === "installing"}
                loadingText="Installing..."
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </TouchButton>

              <TouchButton variant="outline" onClick={handleDismiss}>
                Later
              </TouchButton>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  const renderInline = () => (
    <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <PlatformIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Install ClaimGuardian</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get offline access and faster performance
              </p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          >
            PWA
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Fast
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Offline
            </span>
            <span className="flex items-center gap-1">
              <Home className="w-3 h-3" />
              Home Screen
            </span>
          </div>

          <TouchButton
            size="sm"
            onClick={handleInstall}
            disabled={installStatus === "installing"}
            loading={installStatus === "installing"}
          >
            {platform === "ios" ? "Learn How" : "Install"}
            <ArrowRight className="w-3 h-3 ml-1" />
          </TouchButton>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {variant === "banner" && renderBanner()}
          {variant === "modal" && renderModal()}
          {variant === "inline" && renderInline()}
        </>
      )}
    </AnimatePresence>
  );
}
