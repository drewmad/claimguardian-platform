/**
 * Cost Tracking Integration Example
 * Demonstrates how to use all the AI cost tracking components together
 */

"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Import all the cost tracking components
import { AdminCostAnalytics } from "@/components/admin/ai-cost-analytics";
import { CostMonitoringWidget } from "@/components/admin/cost-monitoring-widget";
import { AICostSettings } from "@/components/admin/ai-cost-settings";
import { LiveCostDashboard } from "@/components/admin/live-cost-dashboard";
import { useLiveCostMonitor } from "@/hooks/use-live-cost-monitor";

import {
  BarChart3,
  Settings,
  Activity,
  DollarSign,
  TrendingUp,
  Zap,
  AlertTriangle,
} from "lucide-react";

export function CostTrackingIntegrationExample() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Use the live cost monitor hook
  const {
    metrics,
    alerts,
    connectionStatus,
    isLoading,
    error,
    connect,
    disconnect,
    reconnect,
    acknowledgeAlert,
    clearAllAlerts,
    sendTestAlert,
  } = useLiveCostMonitor({
    autoConnect: true,
    soundEnabled: true,
    maxAlerts: 50,
  });

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            AI Cost Tracking System
          </h1>
          <p className="text-gray-400">
            Comprehensive real-time AI cost monitoring, analytics, and
            management
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant={connectionStatus.isConnected ? "default" : "destructive"}
          >
            {connectionStatus.isConnected ? "Live Connected" : "Disconnected"}
          </Badge>
          <Button variant="outline" onClick={reconnect}>
            Reconnect
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Today's Cost
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCost(metrics.totalCostToday)}
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatCost(metrics.costPerMinute)}/min
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Active Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {alerts.filter((a) => !a.acknowledged).length}
            </div>
            <div className="text-xs text-gray-400">
              {alerts.filter((a) => a.severity === "critical").length} critical
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Requests Today
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.requestsToday.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              {metrics.requestsPerMinute}/min
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Top Tool
              </CardTitle>
              <Zap className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white capitalize">
              {metrics.topCostTool.replace(/-/g, " ")}
            </div>
            <div className="text-xs text-gray-400">Highest cost today</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="widget" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Widget
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Features</CardTitle>
                <CardDescription>
                  Complete AI cost tracking system capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white">
                      Real-time WebSocket cost monitoring
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white">
                      Automatic budget alerts and thresholds
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white">
                      Multi-channel alert delivery (email, Slack, webhook)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white">
                      Comprehensive cost analytics and reporting
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white">
                      Usage spike and anomaly detection
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white">
                      Per-user and per-tool cost tracking
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white">
                      Enterprise-grade admin dashboard
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Integration Status</CardTitle>
                <CardDescription>
                  Component integration and health status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">WebSocket Monitor</span>
                    <Badge
                      variant={
                        connectionStatus.isConnected ? "default" : "destructive"
                      }
                    >
                      {connectionStatus.connectionState}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Alert Delivery System</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      Cost Tracking Middleware
                    </span>
                    <Badge variant="default">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Database Functions</span>
                    <Badge variant="default">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Admin Components</span>
                    <Badge variant="default">Loaded</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">API Endpoints</span>
                    <Badge variant="default">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">System Testing</CardTitle>
              <CardDescription>
                Test various components of the cost tracking system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => sendTestAlert("info")}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Test Info Alert
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTestAlert("warning")}
                  className="flex items-center gap-2 text-yellow-400 border-yellow-400"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Test Warning Alert
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTestAlert("critical")}
                  className="flex items-center gap-2 text-red-400 border-red-400"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Test Critical Alert
                </Button>
              </div>

              <div className="mt-4 flex gap-4">
                <Button variant="outline" onClick={clearAllAlerts}>
                  Clear All Alerts
                </Button>
                <Button variant="outline" onClick={reconnect}>
                  Reconnect WebSocket
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Dashboard Tab */}
        <TabsContent value="live">
          <LiveCostDashboard />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AdminCostAnalytics />
        </TabsContent>

        {/* Widget Tab */}
        <TabsContent value="widget" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CostMonitoringWidget
              onViewDetails={() => setSelectedTab("analytics")}
            />

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Widget Integration</CardTitle>
                <CardDescription>
                  How to integrate the cost monitoring widget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-300">
                    The CostMonitoringWidget can be embedded in any admin
                    dashboard:
                  </p>
                  <pre className="bg-gray-900 p-4 rounded text-sm text-green-400 overflow-x-auto">
                    {`import { CostMonitoringWidget } from '@/components/admin/cost-monitoring-widget'

function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CostMonitoringWidget
        onViewDetails={() => router.push('/admin/cost-analytics')}
      />
      {/* Other dashboard widgets */}
    </div>
  )
}`}
                  </pre>
                  <p className="text-gray-400 text-sm">
                    The widget automatically refreshes every 5 minutes and shows
                    critical alerts immediately.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <AICostSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CostTrackingIntegrationExample;
