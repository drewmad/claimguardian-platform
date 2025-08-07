/**
 * AI Cost Monitoring Widget for Admin Dashboard
 * Quick overview of AI costs and alerts
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  ExternalLink,
} from "lucide-react";

interface QuickStats {
  todayCost: number;
  todayRequests: number;
  activeUsers: number;
  avgResponseTime: number;
  successRate: number;
  budgetAlertsCount: number;
  topCostTool: string;
  trend: {
    costChange: number;
    requestChange: number;
    isPositive: boolean;
  };
}

interface CostAlert {
  id: string;
  type: "budget_exceeded" | "high_usage" | "model_error";
  message: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
  affectedUsers?: number;
}

export function CostMonitoringWidget({
  onViewDetails,
}: {
  onViewDetails?: () => void;
}) {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickStats();
    fetchAlerts();

    // Refresh every 5 minutes
    const interval = setInterval(
      () => {
        fetchQuickStats();
        fetchAlerts();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  const fetchQuickStats = async () => {
    try {
      const response = await fetch("/api/admin/ai-costs/quick-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch quick stats:", error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/admin/ai-costs/alerts");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;
  const formatUsage = (usage: number) => {
    if (usage >= 1000000) return `${(usage / 1000000).toFixed(1)}M`;
    if (usage >= 1000) return `${(usage / 1000).toFixed(1)}K`;
    return usage.toString();
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            AI Cost Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-gray-700/50 rounded animate-pulse" />
            <div className="h-32 bg-gray-700/50 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter((alert) => alert.severity === "high");
  const warningAlerts = alerts.filter((alert) => alert.severity === "medium");

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            AI Cost Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalAlerts.length} critical
              </Badge>
            )}
            {warningAlerts.length > 0 && (
              <Badge
                variant="outline"
                className="text-yellow-400 border-yellow-400"
              >
                {warningAlerts.length} warnings
              </Badge>
            )}
            {alerts.length === 0 && (
              <Badge
                variant="outline"
                className="text-green-400 border-green-400"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                All good
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Real-time AI usage and cost monitoring
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {criticalAlerts.slice(0, 2).map((alert) => (
                  <div key={alert.id} className="text-sm">
                    {alert.message}
                  </div>
                ))}
                {criticalAlerts.length > 2 && (
                  <div className="text-xs text-red-400">
                    +{criticalAlerts.length - 2} more critical alerts
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Today's Overview */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-gray-400 text-sm">Today's Cost</div>
              <div className="text-white text-xl font-bold flex items-center gap-2">
                {formatCost(stats.todayCost)}
                {stats.trend.costChange !== 0 && (
                  <div
                    className={`flex items-center text-sm ${
                      stats.trend.isPositive ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {stats.trend.isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stats.trend.costChange).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-gray-400 text-sm">Requests</div>
              <div className="text-white text-xl font-bold flex items-center gap-2">
                {formatUsage(stats.todayRequests)}
                {stats.trend.requestChange !== 0 && (
                  <div
                    className={`flex items-center text-sm ${
                      stats.trend.requestChange > 0
                        ? "text-blue-400"
                        : "text-gray-400"
                    }`}
                  >
                    {stats.trend.requestChange > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stats.trend.requestChange).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {stats && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users
              </span>
              <span className="text-white font-medium">
                {stats.activeUsers}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Response
              </span>
              <span className="text-white font-medium">
                {stats.avgResponseTime}ms
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Success Rate</span>
                <span
                  className={`font-medium ${
                    stats.successRate > 0.95
                      ? "text-green-400"
                      : stats.successRate > 0.9
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {(stats.successRate * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={stats.successRate * 100} className="h-1" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Top Tool
              </span>
              <span className="text-white font-medium capitalize">
                {stats.topCostTool.replace(/-/g, " ")}
              </span>
            </div>
          </div>
        )}

        {/* Recent Warnings */}
        {warningAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-gray-400 text-sm font-medium">
              Recent Warnings
            </div>
            <div className="space-y-2">
              {warningAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20"
                >
                  <div className="text-yellow-400 text-sm">{alert.message}</div>
                  <div className="text-gray-400 text-xs mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                    {alert.affectedUsers &&
                      ` • ${alert.affectedUsers} users affected`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <div className="text-gray-400 text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex items-center gap-2"
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CostMonitoringWidget;
