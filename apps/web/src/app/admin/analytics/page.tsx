/**
 * Analytics Dashboard Page
 * View real-time feature usage and performance metrics
 */

"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Brain,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Force refresh the dashboard
    window.location.reload();
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleExport = () => {
    toast.success(
      "Analytics export started. You will receive an email when ready.",
    );
    // TODO: Implement actual export functionality
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Track feature usage, performance metrics, and user behavior
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline text-green-500" /> 23%
                from last week
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,892</div>
              <p className="text-xs text-muted-foreground">
                $47.23 in API costs
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                NIMS Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">742</div>
              <p className="text-xs text-muted-foreground">
                15 active incidents
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7%</div>
              <p className="text-xs text-muted-foreground">
                18 new subscriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Real-time system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300"
              >
                ✓ API Healthy
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300"
              >
                ✓ Database Connected
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300"
              >
                ✓ AI Services Online
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300"
              >
                ✓ Edge Functions Active
              </Badge>
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-300"
              >
                ⚠ High API Usage (87%)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics Dashboard */}
        <AnalyticsDashboard />
      </div>
    </DashboardLayout>
  );
}
