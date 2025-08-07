/**
 * @fileMetadata
 * @purpose "Offline status indicator with connectivity management and sync features"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["OfflineIndicator", "SyncStatus"]
 * @complexity medium
 * @tags ["pwa", "offline", "connectivity", "sync"]
 * @status stable
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WifiOff,
  Wifi,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { useOfflineStatus } from "@/hooks/use-pwa";
import { TouchButton } from "@/components/ui/touch-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requestBackgroundSync } from "@/hooks/use-pwa";
import { logger } from "@/lib/logger";

interface OfflineIndicatorProps {
  position?: "top" | "bottom";
  variant?: "minimal" | "detailed";
  showReconnectButton?: boolean;
  onReconnect?: () => void;
}

interface SyncStatusProps {
  pendingItems?: number;
  lastSync?: Date;
  onSync?: () => void;
}

export function OfflineIndicator({
  position = "top",
  variant = "minimal",
  showReconnectButton = true,
  onReconnect,
}: OfflineIndicatorProps) {
  const { isOnline, wasOffline, offlineAt } = useOfflineStatus();
  const [showDetails, setShowDetails] = useState(false);
  const [isManualReconnect, setIsManualReconnect] = useState(false);

  // Auto-hide success message after coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      toast.success("Connection restored! Syncing your data...");

      // Trigger background sync for pending data
      requestBackgroundSync("property-sync");
      requestBackgroundSync("claim-sync");

      logger.track("connection_restored");
    }
  }, [isOnline, wasOffline]);

  const handleManualReconnect = async () => {
    setIsManualReconnect(true);
    onReconnect?.();

    // Simulate reconnection attempt
    setTimeout(() => {
      setIsManualReconnect(false);
      if (navigator.onLine) {
        toast.success("Reconnection successful!");
      } else {
        toast.error("Still offline. Please check your connection.");
      }
    }, 2000);
  };

  const formatOfflineTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  };

  if (isOnline && !wasOffline) {
    return null;
  }

  const renderMinimal = () => (
    <motion.div
      initial={{ y: position === "top" ? -50 : 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: position === "top" ? -50 : 50, opacity: 0 }}
      className={`fixed ${position === "top" ? "top-4" : "bottom-4"} left-1/2 transform -translate-x-1/2 z-50`}
    >
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className={`px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm ${
          isOnline
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 mr-2" />
            Back Online
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 mr-2" />
            Offline Mode
          </>
        )}
      </Badge>
    </motion.div>
  );

  const renderDetailed = () => (
    <motion.div
      initial={{ y: position === "top" ? -100 : 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: position === "top" ? -100 : 100, opacity: 0 }}
      className={`fixed ${position === "top" ? "top-4" : "bottom-4"} left-4 right-4 z-50 max-w-sm mx-auto`}
    >
      <Card
        className={`shadow-lg backdrop-blur-sm border-2 ${
          isOnline
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isOnline
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                {isOnline ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>

              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    isOnline
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {isOnline ? "Connection Restored" : "You're Offline"}
                </h3>

                <p
                  className={`text-sm mt-1 ${
                    isOnline
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {isOnline
                    ? "Your data is syncing automatically"
                    : "Some features may be limited"}
                </p>

                {!isOnline && offlineAt && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Offline since {formatOfflineTime(offlineAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isOnline && showReconnectButton && (
                <TouchButton
                  size="sm"
                  variant="outline"
                  onClick={handleManualReconnect}
                  loading={isManualReconnect}
                  className="text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/30"
                >
                  {isManualReconnect ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </TouchButton>
              )}

              {isOnline && (
                <TouchButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetails(false)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <X className="w-3 h-3" />
                </TouchButton>
              )}
            </div>
          </div>

          {showDetails && !isOnline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-red-200 dark:border-red-700"
            >
              <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Available offline:</p>
                <ul className="space-y-1 ml-4">
                  <li>• View saved properties</li>
                  <li>• Access cached documents</li>
                  <li>• Create new records</li>
                  <li>• Take photos</li>
                </ul>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Changes will sync when you're back online
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {(!isOnline || (isOnline && wasOffline)) && (
        <>
          {variant === "minimal" && renderMinimal()}
          {variant === "detailed" && renderDetailed()}
        </>
      )}
    </AnimatePresence>
  );
}

export function SyncStatus({
  pendingItems = 0,
  lastSync,
  onSync,
}: SyncStatusProps) {
  const { isOnline } = useOfflineStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      await onSync?.();
      requestBackgroundSync("property-sync");
      requestBackgroundSync("claim-sync");

      toast.success("Data synced successfully");
      logger.track("manual_sync_completed");
    } catch (error) {
      toast.error("Sync failed. Please try again.");
      logger.error("Manual sync failed", { error });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <CloudOff className="w-4 h-4 text-gray-400" />
        )}

        <div className="text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {isOnline ? "Synced" : "Offline"}
            </span>

            {pendingItems > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingItems} pending
              </Badge>
            )}
          </div>

          {lastSync && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last sync: {formatLastSync(lastSync)}
            </p>
          )}
        </div>
      </div>

      {isOnline && pendingItems > 0 && (
        <TouchButton
          size="sm"
          variant="outline"
          onClick={handleSync}
          loading={isSyncing}
          disabled={!isOnline}
          className="ml-auto"
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </TouchButton>
      )}
    </div>
  );
}
