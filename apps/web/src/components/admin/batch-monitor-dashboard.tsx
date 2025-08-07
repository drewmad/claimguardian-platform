/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Pause,
  BarChart3,
  Timer,
  Users,
  TrendingUp,
  Package,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { aiBatchProcessor } from "@/lib/ai/batch-processor";
import type { BatchMetrics } from "@/lib/ai/batch-processor";
import { toast } from "sonner";

const PRIORITY_COLORS = {
  high: "#EF4444",
  normal: "#3B82F6",
  low: "#10B981",
};

const FEATURE_COLORS = {
  "damage-analyzer": "#8B5CF6",
  "policy-chat": "#F59E0B",
  "settlement-analyzer": "#06B6D4",
  "claim-assistant": "#10B981",
  "document-generator": "#EF4444",
  "communication-helper": "#F97316",
};

export function BatchMonitorDashboard() {
  const [metrics, setMetrics] = useState<BatchMetrics & any>({
    totalRequests: 0,
    batchesProcessed: 0,
    avgBatchSize: 0,
    avgProcessingTime: 0,
    costSavings: 0,
    cacheHitRate: 0,
    queueLength: 0,
    isProcessing: false,
    estimatedWaitTime: 0,
  });

  const [queueStatus, setQueueStatus] = useState<any>({
    pending: 0,
    processing: 0,
    byPriority: {},
    byFeature: {},
    oldestRequest: null,
  });

  const [config, setConfig] = useState({
    maxBatchSize: 10,
    maxWaitTime: 2000,
    priorityProcessing: true,
    enableCaching: true,
    costOptimization: true,
  });

  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateData = () => {
      try {
        const currentMetrics = aiBatchProcessor.getMetrics();
        const currentQueueStatus = aiBatchProcessor.getQueueStatus();
        const currentConfig = aiBatchProcessor.getConfig();

        setMetrics(currentMetrics);
        setQueueStatus(currentQueueStatus);
        setConfig(currentConfig);

        // Add to historical data for charts
        setHistoricalData((prev) => {
          const newData = {
            time: new Date().toLocaleTimeString("en-US", {
              hour12: false,
              minute: "2-digit",
              second: "2-digit",
            }),
            queueLength: currentMetrics.queueLength,
            avgProcessingTime: Math.round(currentMetrics.avgProcessingTime),
            avgBatchSize: parseFloat(currentMetrics.avgBatchSize.toFixed(1)),
            costSavings: parseFloat(currentMetrics.costSavings.toFixed(2)),
          };

          return [...prev, newData].slice(-30); // Keep last 30 data points
        });

        setLoading(false);
      } catch (error) {
        console.error("Error updating batch monitor data:", error);
        toast.error("Failed to update batch monitoring data");
      }
    };

    updateData();
    const interval = setInterval(updateData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleConfigUpdate = (key: string, value: unknown) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    aiBatchProcessor.updateConfig(newConfig);
    toast.success(`Updated ${key} to ${value}`);
  };

  const handleClearQueue = () => {
    const clearedCount = aiBatchProcessor.clearQueue();
    toast.success(`Cleared ${clearedCount} requests from queue`);
  };

  // Prepare chart data
  const priorityData = Object.entries(queueStatus.byPriority).map(
    ([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count as number,
      color:
        PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || "#6B7280",
    }),
  );

  const featureData = Object.entries(queueStatus.byFeature).map(
    ([feature, count]) => ({
      name: feature.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count as number,
      color:
        FEATURE_COLORS[feature as keyof typeof FEATURE_COLORS] || "#6B7280",
    }),
  );

  const efficiencyScore = Math.round(
    (metrics.avgBatchSize / Math.max(config.maxBatchSize, 1)) *
      (1 - Math.min(metrics.avgProcessingTime / 5000, 1)) *
      100,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading batch monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layers className="h-7 w-7 text-purple-400" />
            Batch Processing Monitor
          </h2>
          <p className="text-gray-400">
            Monitor and manage AI request batching system
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearQueue}
            disabled={queueStatus.pending === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Queue
          </Button>
          <Badge variant={metrics.isProcessing ? "default" : "outline"}>
            {metrics.isProcessing ? (
              <>
                <Activity className="mr-1 h-3 w-3 animate-pulse" />
                Processing
              </>
            ) : (
              <>
                <Pause className="mr-1 h-3 w-3" />
                Idle
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Alert for high queue length */}
      {queueStatus.pending > 20 && (
        <Alert className="bg-yellow-900/20 border-yellow-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High queue length detected ({queueStatus.pending} requests).
            Consider adjusting batch configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Queue Length
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {queueStatus.pending}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {queueStatus.processing} processing
            </p>
            {metrics.estimatedWaitTime > 0 && (
              <Progress
                value={Math.max(
                  0,
                  100 - (metrics.estimatedWaitTime / config.maxWaitTime) * 100,
                )}
                className="h-2 mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Batches Processed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.batchesProcessed}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalRequests} total requests
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Avg Batch Size
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.avgBatchSize.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max: {config.maxBatchSize}
            </p>
            <Progress
              value={(metrics.avgBatchSize / config.maxBatchSize) * 100}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Efficiency Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {efficiencyScore}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.avgProcessingTime.toFixed(0)}ms avg time
            </p>
            <Progress value={efficiencyScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queue">Queue Status</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Length Trend */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Queue Length Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "none",
                      }}
                      labelStyle={{ color: "#9CA3AF" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="queueLength"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Processing Time */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Processing Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "none",
                      }}
                      labelStyle={{ color: "#9CA3AF" }}
                      formatter={(value: number) => [
                        `${value}ms`,
                        "Processing Time",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgProcessingTime"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Batch Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Batch Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Fill Rate:</span>
                  <span className="text-white font-medium">
                    {(
                      (metrics.avgBatchSize / config.maxBatchSize) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Wait:</span>
                  <span className="text-white font-medium">
                    {(config.maxWaitTime / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Throughput:</span>
                  <span className="text-white font-medium">
                    {(
                      metrics.totalRequests /
                      Math.max(metrics.batchesProcessed, 1)
                    ).toFixed(1)}{" "}
                    req/batch
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Batch Savings:</span>
                  <span className="text-green-400 font-medium">
                    ${metrics.costSavings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Hit Rate:</span>
                  <span className="text-green-400 font-medium">
                    {metrics.cacheHitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Optimized:</span>
                  <span className="text-green-400 font-medium">
                    {(
                      (metrics.costSavings /
                        Math.max(metrics.totalRequests * 0.025, 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Queue Status:</span>
                  <Badge
                    variant={
                      queueStatus.pending < 10 ? "default" : "destructive"
                    }
                  >
                    {queueStatus.pending < 10 ? "Normal" : "High Load"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Processing:</span>
                  <Badge variant={metrics.isProcessing ? "default" : "outline"}>
                    {metrics.isProcessing ? "Active" : "Idle"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Oldest Request:</span>
                  <span className="text-white font-medium">
                    {queueStatus.oldestRequest
                      ? `${Math.round(queueStatus.oldestRequest / 1000)}s ago`
                      : "None"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Queue Status Tab */}
        <TabsContent value="queue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Queue by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "none",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No requests in queue</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Queue by Feature</CardTitle>
              </CardHeader>
              <CardContent>
                {featureData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={featureData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "none",
                        }}
                      />
                      <Bar dataKey="value">
                        {featureData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No feature data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Size Trend */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Batch Size Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "none",
                      }}
                      labelStyle={{ color: "#9CA3AF" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgBatchSize"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Savings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Savings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "none",
                      }}
                      labelStyle={{ color: "#9CA3AF" }}
                      formatter={(value: number) => [
                        `$${value.toFixed(2)}`,
                        "Cost Saved",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="costSavings"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Batch Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Batch Size: {config.maxBatchSize}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={config.maxBatchSize}
                    onChange={(e) =>
                      handleConfigUpdate(
                        "maxBatchSize",
                        parseInt(e.target.value),
                      )
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Wait Time: {(config.maxWaitTime / 1000).toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={config.maxWaitTime}
                    onChange={(e) =>
                      handleConfigUpdate(
                        "maxWaitTime",
                        parseInt(e.target.value),
                      )
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5s</span>
                    <span>10s</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      Priority Processing
                    </label>
                    <button
                      onClick={() =>
                        handleConfigUpdate(
                          "priorityProcessing",
                          !config.priorityProcessing,
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        config.priorityProcessing
                          ? "bg-blue-600"
                          : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.priorityProcessing
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      Enable Caching
                    </label>
                    <button
                      onClick={() =>
                        handleConfigUpdate(
                          "enableCaching",
                          !config.enableCaching,
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        config.enableCaching ? "bg-blue-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.enableCaching
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      Cost Optimization
                    </label>
                    <button
                      onClick={() =>
                        handleConfigUpdate(
                          "costOptimization",
                          !config.costOptimization,
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        config.costOptimization ? "bg-blue-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.costOptimization
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {efficiencyScore < 60 && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">
                          Low Efficiency
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Consider increasing max batch size or reducing wait time
                        for better throughput.
                      </p>
                    </div>
                  )}

                  {queueStatus.pending > config.maxBatchSize * 2 && (
                    <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">
                          High Queue Load
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Queue length is high. Consider increasing batch size or
                        reducing wait time.
                      </p>
                    </div>
                  )}

                  {metrics.avgProcessingTime > 3000 && (
                    <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="h-4 w-4 text-red-400" />
                        <span className="text-red-400 font-medium">
                          Slow Processing
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Average processing time is high. Check system resources
                        or reduce batch size.
                      </p>
                    </div>
                  )}

                  {efficiencyScore >= 80 && (
                    <div className="p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 font-medium">
                          Optimal Performance
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Batch processing is running efficiently. Current
                        configuration is well-tuned.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <h5 className="font-medium text-white mb-2">
                      Performance Tips
                    </h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Higher batch sizes reduce API overhead</li>
                      <li>• Lower wait times improve responsiveness</li>
                      <li>
                        • Priority processing handles urgent requests faster
                      </li>
                      <li>• Caching significantly reduces costs and latency</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
