/**
 * @fileMetadata
 * @purpose "Demo page showcasing PWA features including installation, offline support, and native capabilities"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["PWADemoPage"]
 * @complexity high
 * @tags ["pwa", "demo", "offline", "installation"]
 * @status stable
 */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Monitor,
  Download,
  Wifi,
  WifiOff,
  Bell,
  Share,
  FileText,
  Camera,
  Heart,
  Bookmark,
  Zap,
  Shield,
  Star,
  Globe,
  Cloud,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Home,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import {
  usePWA,
  useInstallPrompt,
  useOfflineStatus,
  useServiceWorker,
} from "@/hooks/use-pwa";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import {
  OfflineIndicator,
  SyncStatus,
} from "@/components/pwa/offline-indicator";
import { TouchButton } from "@/components/ui/touch-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pwaFeatures = [
  {
    icon: Download,
    title: "App Installation",
    description: "Install ClaimGuardian like a native app on any device",
    benefits: [
      "Home screen access",
      "Full-screen experience",
      "Faster launch times",
    ],
    status: "available",
  },
  {
    icon: WifiOff,
    title: "Offline Support",
    description: "Continue working even without an internet connection",
    benefits: [
      "Cached content access",
      "Offline data entry",
      "Auto-sync when online",
    ],
    status: "available",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Stay updated with property alerts and claim updates",
    benefits: [
      "Real-time alerts",
      "Background updates",
      "Customizable settings",
    ],
    status: "coming_soon",
  },
  {
    icon: Share,
    title: "Native Sharing",
    description: "Share content using your device's native share sheet",
    benefits: [
      "Share to any app",
      "Quick property sharing",
      "Document sharing",
    ],
    status: "available",
  },
  {
    icon: Camera,
    title: "File Handling",
    description: "Open images and PDFs directly in ClaimGuardian",
    benefits: [
      "Direct file access",
      "Drag & drop support",
      "Auto-categorization",
    ],
    status: "available",
  },
  {
    icon: Zap,
    title: "Background Sync",
    description: "Data syncs automatically in the background",
    benefits: ["Seamless updates", "Conflict resolution", "Battery efficient"],
    status: "available",
  },
];

const installStats = [
  { label: "Install Rate", value: "23%", change: "+5%" },
  { label: "Daily Active Users", value: "87%", change: "+12%" },
  { label: "Offline Usage", value: "41%", change: "+8%" },
  { label: "Performance Score", value: "98/100", change: "+3" },
];

const deviceSupport = [
  { platform: "iOS Safari", icon: Smartphone, support: "Full", color: "green" },
  {
    platform: "Android Chrome",
    icon: Smartphone,
    support: "Full",
    color: "green",
  },
  { platform: "Windows Edge", icon: Monitor, support: "Full", color: "green" },
  {
    platform: "macOS Safari",
    icon: Monitor,
    support: "Partial",
    color: "yellow",
  },
  {
    platform: "Chrome Desktop",
    icon: Monitor,
    support: "Full",
    color: "green",
  },
  {
    platform: "Firefox Desktop",
    icon: Monitor,
    support: "Partial",
    color: "yellow",
  },
];

export default function PWADemoPage() {
  const pwaStatus = usePWA();
  const {
    isVisible: installVisible,
    showInstallPrompt,
    hideInstallPrompt,
  } = useInstallPrompt();
  const offlineStatus = useOfflineStatus();
  const { isRegistered, hasUpdate, updateServiceWorker } = useServiceWorker();

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [forceOfflineMode, setForceOfflineMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pendingSyncItems, setPendingSyncItems] = useState(3);

  const handleForceInstallPrompt = () => {
    if (pwaStatus.platform === "ios") {
      setShowInstallModal(true);
    } else {
      showInstallPrompt();
    }
  };

  const handleToggleOffline = () => {
    setForceOfflineMode(!forceOfflineMode);
    if (!forceOfflineMode) {
      toast.info("Simulating offline mode - some features will be limited");
    } else {
      toast.success("Back online - all features restored");
    }
  };

  const handleRequestNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");

      if (permission === "granted") {
        toast.success("Push notifications enabled!");

        // Show a demo notification
        new Notification("ClaimGuardian", {
          body: "You'll now receive important updates about your properties",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
        });
      } else {
        toast.error("Notification permission denied");
      }
    }
  };

  const handleShareExample = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ClaimGuardian - Property Protection",
          text: "Check out this AI-powered property insurance platform",
          url: window.location.origin,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        toast.error("Sharing cancelled");
      }
    } else {
      // Fallback for browsers without native sharing
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSyncDemo = () => {
    if (pendingSyncItems > 0) {
      setPendingSyncItems(0);
      toast.success("All data synced successfully!");
    } else {
      setPendingSyncItems(3);
      toast.info("Added demo items to sync queue");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-fit mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Progressive Web App Demo
          </h1>

          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Experience ClaimGuardian's PWA capabilities including offline
            support, native installation, and app-like features.
          </p>
        </motion.div>

        {/* PWA Status Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {pwaStatus.isInstalled ? "Installed" : "Browser"}
              </div>
              <div className="text-sm text-gray-300">App Status</div>
              <Badge
                className={`mt-2 ${pwaStatus.isInstalled ? "bg-green-600" : "bg-gray-600"}`}
              >
                {pwaStatus.platform}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {offlineStatus.isOnline && !forceOfflineMode
                  ? "Online"
                  : "Offline"}
              </div>
              <div className="text-sm text-gray-300">Connection</div>
              <Badge
                className={`mt-2 ${offlineStatus.isOnline && !forceOfflineMode ? "bg-green-600" : "bg-red-600"}`}
              >
                {offlineStatus.isOnline && !forceOfflineMode
                  ? "Connected"
                  : "Offline Mode"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {isRegistered ? "Active" : "None"}
              </div>
              <div className="text-sm text-gray-300">Service Worker</div>
              <Badge
                className={`mt-2 ${isRegistered ? "bg-green-600" : "bg-gray-600"}`}
              >
                {hasUpdate
                  ? "Update Available"
                  : isRegistered
                    ? "Registered"
                    : "Not Active"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {notificationsEnabled ? "Enabled" : "Disabled"}
              </div>
              <div className="text-sm text-gray-300">Notifications</div>
              <Badge
                className={`mt-2 ${notificationsEnabled ? "bg-green-600" : "bg-gray-600"}`}
              >
                {typeof window !== "undefined" && "Notification" in window
                  ? Notification.permission
                  : "default"}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Demo Controls */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Interactive Demo Controls
              </CardTitle>
              <p className="text-gray-300 text-sm">
                Try out different PWA features and see how they work
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <TouchButton
                  onClick={handleForceInstallPrompt}
                  disabled={pwaStatus.isInstalled}
                  className="flex-1"
                  variant="gradient"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {pwaStatus.isInstalled ? "Already Installed" : "Install App"}
                </TouchButton>

                <TouchButton
                  onClick={handleToggleOffline}
                  variant={forceOfflineMode ? "success" : "outline"}
                  className="flex-1"
                >
                  {forceOfflineMode ? (
                    <>
                      <Wifi className="w-4 h-4 mr-2" />
                      Go Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 mr-2" />
                      Go Offline
                    </>
                  )}
                </TouchButton>

                <TouchButton
                  onClick={handleRequestNotifications}
                  disabled={notificationsEnabled}
                  variant="outline"
                  className="flex-1"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {notificationsEnabled
                    ? "Notifications On"
                    : "Enable Notifications"}
                </TouchButton>

                <TouchButton
                  onClick={handleShareExample}
                  variant="outline"
                  className="flex-1"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Native Share
                </TouchButton>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* PWA Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {pwaFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="bg-white/10 border-white/20 backdrop-blur-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-blue-600/20 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <Badge
                      className={
                        feature.status === "available"
                          ? "bg-green-600"
                          : "bg-yellow-600"
                      }
                    >
                      {feature.status === "available"
                        ? "Available"
                        : "Coming Soon"}
                    </Badge>
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">
                    {feature.description}
                  </p>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-400 flex items-center gap-2"
                      >
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Device Support Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Device & Browser Support
              </CardTitle>
              <p className="text-gray-300 text-sm">
                PWA compatibility across different platforms and browsers
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deviceSupport.map((device) => {
                  const Icon = device.icon;
                  return (
                    <div
                      key={device.platform}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <span className="text-white font-medium">
                          {device.platform}
                        </span>
                      </div>
                      <Badge
                        className={
                          device.color === "green"
                            ? "bg-green-600"
                            : device.color === "yellow"
                              ? "bg-yellow-600"
                              : "bg-red-600"
                        }
                      >
                        {device.support}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Components */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-6"
        >
          {/* Sync Status */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Background Sync Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SyncStatus
                pendingItems={pendingSyncItems}
                lastSync={new Date(Date.now() - 300000)} // 5 minutes ago
                onSync={handleSyncDemo}
              />
            </CardContent>
          </Card>

          {/* Service Worker Update */}
          {hasUpdate && (
            <Card className="bg-blue-900/30 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">
                      App Update Available
                    </h3>
                    <p className="text-blue-200 text-sm">
                      A new version is ready to install
                    </p>
                  </div>
                  <TouchButton onClick={updateServiceWorker} size="sm">
                    Update Now
                  </TouchButton>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Install Prompt Demo */}
        {showInstallModal && (
          <InstallPrompt
            variant="modal"
            onInstall={() => setShowInstallModal(false)}
            onDismiss={() => setShowInstallModal(false)}
          />
        )}

        {/* Offline Indicator Demo */}
        {forceOfflineMode && (
          <OfflineIndicator
            variant="detailed"
            onReconnect={() => setForceOfflineMode(false)}
          />
        )}

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-8"
        >
          <TouchButton
            onClick={() => window.history.back()}
            variant="outline"
            className="text-white border-white/30"
          >
            ← Back to Dashboard
          </TouchButton>
        </motion.div>
      </div>
    </div>
  );
}
