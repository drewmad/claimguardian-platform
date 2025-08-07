/**
 * Admin AI Cost Analytics Dashboard
 * Comprehensive cost monitoring and optimization tools for administrators
 */

"use client";

import React, { useState, useEffect } from "react";
import { useAdminCostAnalytics } from "@/hooks/use-ai-cost-tracking";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Search,
} from "lucide-react";

interface CostOptimizationSuggestion {
  type: "model" | "usage" | "budget";
  title: string;
  description: string;
  potentialSavings: number;
  priority: "high" | "medium" | "low";
}

export function AdminCostAnalytics() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const { analytics, loading, error, fetchAnalytics } = useAdminCostAnalytics();

  // Fetch analytics when date range changes
  useEffect(() => {
    fetchAnalytics(dateRange.startDate, dateRange.endDate);
  }, [dateRange, fetchAnalytics]);

  // Calculate optimization suggestions
  const generateOptimizationSuggestions = (): CostOptimizationSuggestion[] => {
    if (!analytics) return [];

    const suggestions: CostOptimizationSuggestion[] = [];

    // High cost per request tools
    Object.entries(analytics.costByTool).forEach(([tool, data]) => {
      if (data.avgCost > 0.05) {
        suggestions.push({
          type: "model",
          title: `Optimize ${tool} model selection`,
          description: `This tool has high average cost (${data.avgCost.toFixed(4)}). Consider using a more cost-effective model.`,
          potentialSavings: data.cost * 0.3,
          priority: "high",
        });
      }
    });

    // Low success rate tools
    Object.entries(analytics.costByTool).forEach(([tool, data]) => {
      if (data.successRate < 0.95) {
        suggestions.push({
          type: "usage",
          title: `Improve ${tool} reliability`,
          description: `Success rate is ${(data.successRate * 100).toFixed(1)}%. Failed requests waste budget.`,
          potentialSavings: data.cost * (1 - data.successRate),
          priority: "medium",
        });
      }
    });

    // High usage users needing optimization
    analytics.topUsers.slice(0, 3).forEach((user) => {
      if (user.avgCost > 0.08) {
        suggestions.push({
          type: "usage",
          title: `User optimization opportunity`,
          description: `${user.email} has high average cost per request (${user.avgCost.toFixed(4)})`,
          potentialSavings: user.cost * 0.2,
          priority: "low",
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const optimizationSuggestions = generateOptimizationSuggestions();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-800/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-800/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-gray-800/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-500 bg-red-500/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load cost analytics: {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() =>
              fetchAnalytics(dateRange.startDate, dateRange.endDate)
            }
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-400">
        No analytics data available for the selected date range
      </div>
    );
  }

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;
  const formatUsage = (usage: number) => {
    if (usage >= 1000000) return `${(usage / 1000000).toFixed(1)}M`;
    if (usage >= 1000) return `${(usage / 1000).toFixed(1)}K`;
    return usage.toString();
  };

  const exportData = () => {
    const data = {
      period: `${dateRange.startDate} to ${dateRange.endDate}`,
      summary: {
        totalCost: analytics.totalCost,
        totalRequests: analytics.totalRequests,
        uniqueUsers: analytics.uniqueUsers,
        avgCostPerRequest: analytics.avgCostPerRequest,
      },
      costByTool: analytics.costByTool,
      topUsers: analytics.topUsers,
      modelPerformance: analytics.modelPerformance,
      optimizationSuggestions,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-cost-analytics-${dateRange.startDate}-to-${dateRange.endDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Cost Analytics</h1>
          <p className="text-gray-400">
            Monitor and optimize AI usage across the platform
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="text-sm text-gray-400">
              From
            </Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-auto bg-gray-800 border-gray-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="endDate" className="text-sm text-gray-400">
              To
            </Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-auto bg-gray-800 border-gray-700"
            />
          </div>

          <Button
            variant="outline"
            onClick={() =>
              fetchAnalytics(dateRange.startDate, dateRange.endDate)
            }
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={exportData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCost(analytics.totalCost)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Avg: {formatCost(analytics.avgCostPerRequest)} per request
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatUsage(analytics.totalRequests)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Across all AI tools</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.uniqueUsers}
            </div>
            <p className="text-xs text-gray-400 mt-1">Used AI features</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Potential Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatCost(
                optimizationSuggestions.reduce(
                  (sum, s) => sum + s.potentialSavings,
                  0,
                ),
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">From optimization</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tools" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="optimize" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Optimize
          </TabsTrigger>
        </TabsList>

        {/* Tools Analysis */}
        <TabsContent value="tools" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Cost by AI Tool
              </CardTitle>
              <CardDescription>
                Usage and cost breakdown across all AI features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.costByTool)
                  .sort(([, a], [, b]) => b.cost - a.cost)
                  .map(([tool, data]) => {
                    const costPercentage =
                      analytics.totalCost > 0
                        ? (data.cost / analytics.totalCost) * 100
                        : 0;
                    const requestPercentage =
                      analytics.totalRequests > 0
                        ? (data.requests / analytics.totalRequests) * 100
                        : 0;

                    return (
                      <div
                        key={tool}
                        className="space-y-3 p-4 rounded-lg bg-gray-700/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-medium capitalize">
                              {tool.replace(/-/g, " ")}
                            </h3>
                            <Badge
                              variant={
                                data.successRate > 0.95
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {(data.successRate * 100).toFixed(1)}% success
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">
                              {formatCost(data.cost)}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {costPercentage.toFixed(1)}% of total
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Requests</div>
                            <div className="text-white font-medium">
                              {formatUsage(data.requests)}
                            </div>
                            <Progress
                              value={requestPercentage}
                              className="h-1 mt-1"
                            />
                          </div>
                          <div>
                            <div className="text-gray-400">Avg Cost</div>
                            <div className="text-white font-medium">
                              {formatCost(data.avgCost)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Success Rate</div>
                            <div className="text-white font-medium">
                              {(data.successRate * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Analysis */}
        <TabsContent value="users" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Users by Cost
                  </CardTitle>
                  <CardDescription>
                    Highest spending users and their usage patterns
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topUsers
                  .filter(
                    (user) =>
                      searchTerm === "" ||
                      user.email
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                  )
                  .map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-700/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {user.email}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {formatUsage(user.requests)} requests • Avg:{" "}
                            {formatCost(user.avgCost)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {formatCost(user.cost)}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {analytics.totalCost > 0
                            ? ((user.cost / analytics.totalCost) * 100).toFixed(
                                1,
                              )
                            : 0}
                          % of total
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analysis */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Model Performance
              </CardTitle>
              <CardDescription>
                Response times, success rates, and token usage by AI model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.modelPerformance).map(
                  ([model, performance]) => (
                    <div key={model} className="p-4 rounded-lg bg-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">{model}</h3>
                        <Badge
                          variant={
                            performance.successRate > 0.95
                              ? "default"
                              : "destructive"
                          }
                        >
                          {(performance.successRate * 100).toFixed(1)}% success
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Avg Response Time</div>
                          <div className="text-white font-medium">
                            {performance.avgResponseTime.toFixed(0)}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Total Requests</div>
                          <div className="text-white font-medium">
                            {formatUsage(performance.totalRequests)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Avg Input Tokens</div>
                          <div className="text-white font-medium">
                            {Math.round(performance.avgInputTokens)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Avg Output Tokens</div>
                          <div className="text-white font-medium">
                            {Math.round(performance.avgOutputTokens)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Analysis */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Daily Cost Trends
              </CardTitle>
              <CardDescription>
                Daily usage patterns and cost evolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.costByDate)
                  .sort(
                    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
                  )
                  .slice(-14) // Last 14 days
                  .map(([date, data]) => {
                    const maxCost = Math.max(
                      ...Object.values(analytics.costByDate).map((d) => d.cost),
                    );
                    const costPercentage =
                      maxCost > 0 ? (data.cost / maxCost) * 100 : 0;

                    return (
                      <div
                        key={date}
                        className="flex items-center justify-between p-3 rounded bg-gray-700/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-300 min-w-[100px]">
                            {new Date(date).toLocaleDateString()}
                          </div>
                          <div className="flex-1">
                            <Progress value={costPercentage} className="h-2" />
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="text-white font-medium">
                            {formatCost(data.cost)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {formatUsage(data.requests)} requests •{" "}
                            {data.uniqueUsers} users
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Suggestions */}
        <TabsContent value="optimize" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Cost Optimization Opportunities
              </CardTitle>
              <CardDescription>
                AI-powered suggestions to reduce costs and improve efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationSuggestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      No optimization opportunities found
                    </h3>
                    <p>Your AI usage is already well-optimized!</p>
                  </div>
                ) : (
                  optimizationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-gray-700/50 border-l-4 border-l-blue-500"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              suggestion.priority === "high"
                                ? "destructive"
                                : suggestion.priority === "medium"
                                  ? "default"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {suggestion.priority} priority
                          </Badge>
                          <h3 className="text-white font-medium">
                            {suggestion.title}
                          </h3>
                        </div>
                        <div className="text-green-400 font-bold">
                          Save {formatCost(suggestion.potentialSavings)}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminCostAnalytics;
