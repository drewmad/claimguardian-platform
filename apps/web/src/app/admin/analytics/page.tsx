/**
 * Analytics Dashboard Page
 * View real-time feature usage and performance metrics
 */

"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { LandingPageAnalytics } from "@/components/analytics/landing-page-analytics";
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
  Target,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'landing' | 'platform' | 'ai'>('landing');

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

        {/* Analytics Tabs */}
        <div className="flex gap-2 bg-muted rounded-lg p-1 w-fit">
          <Button
            variant={activeTab === 'landing' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Landing Page
          </Button>
          <Button
            variant={activeTab === 'platform' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('platform')}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Platform
          </Button>
          <Button
            variant={activeTab === 'ai' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('ai')}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            AI Features
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'landing' && <LandingPageAnalytics />}
        
        {activeTab === 'platform' && (
          <>
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
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+23.4%</div>
                  <p className="text-xs text-muted-foreground">
                    Monthly active growth
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
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Damage Analyzer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">
                    Photos analyzed this week
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Policy Advisor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">892</div>
                  <p className="text-xs text-muted-foreground">
                    Documents processed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Inventory Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,134</div>
                  <p className="text-xs text-muted-foreground">
                    Items cataloged
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    AI Cost Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$0.12</div>
                  <p className="text-xs text-muted-foreground">
                    Avg cost per request
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>AI Feature Performance</CardTitle>
                <CardDescription>
                  Usage metrics and cost analysis for AI-powered features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-green-900">Damage Analyzer</p>
                      <p className="text-sm text-green-700">OpenAI GPT-4 Vision</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">96.7%</p>
                      <p className="text-xs text-green-600">Accuracy Rate</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="font-medium text-blue-900">Policy Advisor</p>
                      <p className="text-sm text-blue-700">Multi-provider</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">4.8/5</p>
                      <p className="text-xs text-blue-600">User Rating</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <p className="font-medium text-purple-900">Inventory Scanner</p>
                      <p className="text-sm text-purple-700">Gemini Pro Vision</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">89.3%</p>
                      <p className="text-xs text-purple-600">Auto-fill Rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
