/**
 * @fileMetadata
 * @purpose "Notification center with persistent notifications and management"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "@/components/ui"]
 * @exports ["NotificationCenter", "useNotifications", "NotificationBell"]
 * @complexity high
 * @tags ["notifications", "persistent", "center", "management"]
 * @status stable
 */
"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  X,
  Trash2,
  Mail as MarkAsUnread,
  Settings,
  Filter,
  Search,
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  User,
  Home,
  Zap,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getPriorityBadge } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface PersistentNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success" | "system" | "ai" | "property";
  priority: "low" | "medium" | "high" | "urgent";
  timestamp: number;
  read: boolean;
  archived: boolean;
  actionable: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  userId?: string;
  source: "system" | "ai" | "user" | "property" | "claim" | "maintenance";
  category?: string;
}

interface NotificationAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "destructive";
  handler: () => void | Promise<void>;
  requiresConfirmation?: boolean;
}

interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byType: Record<PersistentNotification["type"], number>;
  bySource: Record<PersistentNotification["source"], number>;
}

interface NotificationContextValue {
  notifications: PersistentNotification[];
  stats: NotificationStats;
  addNotification: (
    notification: Omit<PersistentNotification, "id" | "timestamp">,
  ) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  archiveNotification: (id: string) => void;
  clearAll: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<PersistentNotification[]>(
    [],
  );
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem(
      "claimguardian-notifications",
    );
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (error) {
        console.error("Failed to parse saved notifications:", error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "claimguardian-notifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  // Calculate stats
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    urgent: notifications.filter((n) => n.priority === "urgent").length,
    byType: notifications.reduce(
      (acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      },
      {} as Record<PersistentNotification["type"], number>,
    ),
    bySource: notifications.reduce(
      (acc, n) => {
        acc[n.source] = (acc[n.source] || 0) + 1;
        return acc;
      },
      {} as Record<PersistentNotification["source"], number>,
    ),
  };

  const addNotification = (
    notificationData: Omit<PersistentNotification, "id" | "timestamp">,
  ) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification: PersistentNotification = {
      ...notificationData,
      id,
      timestamp: Date.now(),
      read: false,
      archived: false,
    };

    setNotifications((prev) => [notification, ...prev.slice(0, 99)]); // Keep max 100 notifications

    return id;
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const archiveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: true } : n)),
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const contextValue: NotificationContextValue = {
    notifications,
    stats,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    clearAll,
    isOpen,
    setIsOpen,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

// Notification bell component for header
export function NotificationBell({ className }: { className?: string }) {
  const { stats, isOpen, setIsOpen } = useNotifications();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          <Bell className="w-5 h-5" />
          {stats.unread > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
            >
              {stats.unread > 99 ? "99+" : stats.unread}
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <NotificationCenter />
      </PopoverContent>
    </Popover>
  );
}

// Main notification center component
export function NotificationCenter() {
  const {
    notifications,
    stats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<
    PersistentNotification["type"] | "all"
  >("all");

  const filteredNotifications = notifications
    .filter((n) => !n.archived)
    .filter((n) => {
      if (filter === "unread") return !n.read;
      if (filter === "urgent") return n.priority === "urgent";
      return true;
    })
    .filter((n) => {
      if (selectedType === "all") return true;
      return n.type === selectedType;
    })
    .filter((n) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      );
    });

  const getTypeIcon = (type: PersistentNotification["type"]) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "error":
        return AlertTriangle;
      case "warning":
        return AlertTriangle;
      case "info":
        return Info;
      case "system":
        return Settings;
      case "ai":
        return Zap;
      case "property":
        return Home;
      default:
        return Bell;
    }
  };

  const getTypeColor = (type: PersistentNotification["type"]) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-orange-600";
      case "info":
        return "text-blue-600";
      case "system":
        return "text-gray-600";
      case "ai":
        return "text-purple-600";
      case "property":
        return "text-emerald-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <div className="flex items-center space-x-2">
            {stats.unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={clearAll}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>{stats.total} total</span>
          <span>{stats.unread} unread</span>
          {stats.urgent > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {stats.urgent} urgent
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-3 h-3 mr-1" />
                {filter === "all"
                  ? "All"
                  : filter === "unread"
                    ? "Unread"
                    : "Urgent"}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilter("all")}>
                All notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("unread")}>
                Unread only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("urgent")}>
                Urgent only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {selectedType === "all" ? "All Types" : selectedType}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedType("all")}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.keys(stats.byType).map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() =>
                    setSelectedType(type as PersistentNotification["type"])
                  }
                >
                  {type} ({stats.byType[type as keyof typeof stats.byType]})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {searchTerm || filter !== "all"
                ? "No matching notifications"
                : "No notifications yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual notification item
function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: PersistentNotification;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const Icon = getTypeIcon(notification.type);

  const handleActionClick = async (action: NotificationAction) => {
    if (actionLoading) return;

    setActionLoading(action.id);

    try {
      await action.handler();
      if (!notification.read) {
        onMarkRead();
      }
    } catch (error) {
      console.error("Notification action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300 }}
      className={cn(
        "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
        !notification.read && "bg-blue-50 dark:bg-blue-900/10",
      )}
    >
      <div className="flex items-start space-x-3">
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            !notification.read
              ? "bg-blue-100 dark:bg-blue-900/20"
              : "bg-gray-100 dark:bg-gray-800",
          )}
        >
          <Icon className={cn("w-4 h-4", getTypeColor(notification.type))} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4
                  className={cn(
                    "text-sm font-medium truncate",
                    !notification.read && "font-semibold",
                  )}
                >
                  {notification.title}
                </h4>
                {(() => {
                  const config = getPriorityBadge(notification.priority);
                  if (!config) return null;
                  return (
                    <Badge
                      variant={config.variant as any}
                      className={config.className}
                    >
                      {config.label}
                    </Badge>
                  );
                })()}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {notification.message}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(notification.timestamp)}
                </span>

                <div className="flex items-center space-x-1">
                  {notification.actions && notification.actions.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-xs"
                    >
                      Actions
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 ml-1 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </Button>
                  )}

                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onMarkRead}
                      className="text-xs"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable actions */}
          <AnimatePresence>
            {isExpanded && notification.actions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-wrap gap-2">
                  {notification.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant={
                        action.type === "destructive"
                          ? "destructive"
                          : action.type === "secondary"
                            ? "outline"
                            : "default"
                      }
                      size="sm"
                      onClick={() => handleActionClick(action)}
                      disabled={actionLoading !== null}
                      className="text-xs"
                    >
                      {actionLoading === action.id
                        ? "Loading..."
                        : action.label}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function getTypeIcon(type: PersistentNotification["type"]) {
  switch (type) {
    case "success":
      return CheckCircle;
    case "error":
      return AlertTriangle;
    case "warning":
      return AlertTriangle;
    case "info":
      return Info;
    case "system":
      return Settings;
    case "ai":
      return Zap;
    case "property":
      return Home;
    default:
      return Bell;
  }
}

function getTypeColor(type: PersistentNotification["type"]) {
  switch (type) {
    case "success":
      return "text-green-600";
    case "error":
      return "text-red-600";
    case "warning":
      return "text-orange-600";
    case "info":
      return "text-blue-600";
    case "system":
      return "text-gray-600";
    case "ai":
      return "text-purple-600";
    case "property":
      return "text-emerald-600";
    default:
      return "text-gray-600";
  }
}
