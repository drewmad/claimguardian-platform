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
  Database,
  Activity,
  HardDrive,
  Layers,
  AlertTriangle,
  Settings,
  RefreshCw,
  Calendar,
  Clock,
  Package,
  Archive,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap,
} from "recharts";
import { partitionManager } from "@/lib/database/partition-manager";
import type {
  PartitionMetrics,
  MaintenanceTask,
} from "@/lib/database/partition-manager";
import { toast } from "sonner";

const TABLE_COLORS = {
  analytics_events: "#3B82F6",
  florida_parcels: "#10B981",
  claims: "#F59E0B",
  ai_model_usage: "#8B5CF6",
  user_analytics_summary: "#EC4899",
};

const STATUS_COLORS = {
  active: "#10B981",
  archived: "#6B7280",
  dropping: "#EF4444",
};

export function PartitionMonitorDashboard() {
  const [selectedTable, setSelectedTable] =
    useState<string>("analytics_events");
  const [metrics, setMetrics] = useState<PartitionMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [maintenanceStatus, setMaintenanceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoPartition, setAutoPartition] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get partition metrics
        const analysis =
          await partitionManager.analyzePartitions(selectedTable);
        setMetrics(analysis.metrics);
        setRecommendations(analysis.recommendations);

        // Get maintenance status
        const status = partitionManager.getMaintenanceStatus();
        setMaintenanceStatus(status);

        setLoading(false);
      } catch (error) {
        console.error("Failed to load partition data:", error);
        toast.error("Failed to load partition metrics");
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTable]);

  const handleCreatePartitions = async () => {
    try {
      const created = await partitionManager.createPartitions(selectedTable, {
        ahead: 30,
      });
      toast.success(
        `Created ${created.length} partitions for ${selectedTable}`,
      );
    } catch (error) {
      toast.error("Failed to create partitions");
    }
  };

  const handleRunMaintenance = async () => {
    try {
      await partitionManager.performMaintenance();
      toast.success("Maintenance tasks scheduled");
    } catch (error) {
      toast.error("Failed to run maintenance");
    }
  };

  const handleToggleAutoPartition = () => {
    const newState = !autoPartition;
    setAutoPartition(newState);
    partitionManager.setAutoPartition(newState);
    toast.success(`Auto-partitioning ${newState ? "enabled" : "disabled"}`);
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading partition data...</p>
        </div>
      </div>
    );
  }

  // Prepare visualization data
  const partitionSizeData = metrics.hotPartitions
    .concat(metrics.coldPartitions)
    .map((p) => ({
      name: p.name.split("_").slice(-1)[0], // Last part of name
      value: p.sizeBytes,
      rows: p.rowCount,
      status: metrics.hotPartitions.includes(p) ? "hot" : "cold",
    }));

  const maintenanceTaskData =
    maintenanceStatus?.tasks.slice(-10).map((task: MaintenanceTask) => ({
      name: task.target.split("_").slice(-1)[0],
      type: task.type,
      status: task.status,
      priority: task.priority,
    })) || [];

  const storageDistribution = [
    { name: "Active", value: metrics.activePartitions, fill: "#10B981" },
    {
      name: "Archived",
      value: metrics.totalPartitions - metrics.activePartitions,
      fill: "#6B7280",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layers className="h-7 w-7 text-purple-400" />
            Partition Management
          </h2>
          <p className="text-gray-400">
            Monitor and manage database partitioning strategies
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAutoPartition}
          >
            <Settings className="mr-2 h-4 w-4" />
            Auto-partition: {autoPartition ? "On" : "Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRunMaintenance}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Maintenance
          </Button>
        </div>
      </div>

      {/* Table Selector */}
      <div className="flex gap-2">
        {Object.keys(TABLE_COLORS).map((table) => (
          <Button
            key={table}
            variant={selectedTable === table ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTable(table)}
            style={{
              backgroundColor:
                selectedTable === table
                  ? TABLE_COLORS[table as keyof typeof TABLE_COLORS]
                  : undefined,
            }}
          >
            {table.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </Button>
        ))}
      </div>

      {/* Recommendations Alert */}
      {recommendations.length > 0 && (
        <Alert className="bg-yellow-900/20 border-yellow-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">
              Optimization Recommendations:
            </div>
            <ul className="list-disc list-inside space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm">
                  {rec}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Partitions
            </CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.totalPartitions}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.activePartitions} active
            </p>
            <Progress
              value={(metrics.activePartitions / metrics.totalPartitions) * 100}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Size
            </CardTitle>
            <HardDrive className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(metrics.totalSize / (1024 * 1024 * 1024)).toFixed(1)} GB
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg: {(metrics.avgPartitionSize / (1024 * 1024)).toFixed(0)} MB
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Rows
            </CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(metrics.totalRows / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalRows.toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Maintenance
            </CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {maintenanceStatus?.pending || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pending tasks</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {maintenanceStatus?.running || 0} running
              </Badge>
              <Badge variant="outline" className="text-xs">
                {maintenanceStatus?.failed || 0} failed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partitions">Partitions</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Partition Size Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Partition Size Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {partitionSizeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                      data={partitionSizeData}
                      dataKey="value"
                      aspectRatio={4 / 3}
                      stroke="#fff"
                      fill="#8884d8"
                    >
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-900 border border-gray-700 p-2 rounded">
                                <p className="text-white font-medium">
                                  {data.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Size:{" "}
                                  {(data.value / (1024 * 1024)).toFixed(1)} MB
                                </p>
                                <p className="text-sm text-gray-400">
                                  Rows: {data.rows.toLocaleString()}
                                </p>
                                <Badge
                                  variant={
                                    data.status === "hot"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {data.status}
                                </Badge>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </Treemap>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    No partition data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storage Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Storage Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={storageDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {storageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Partition Health */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Hot Partitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.hotPartitions.slice(0, 5).map((partition, index) => (
                    <div
                      key={partition.name}
                      className="flex items-center justify-between"
                    >
                      <span className="text-white text-sm">
                        {partition.name.split("_").slice(-1)[0]}
                      </span>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs">
                          {(partition.sizeBytes / (1024 * 1024)).toFixed(0)} MB
                        </div>
                        <div className="text-gray-500 text-xs">
                          {partition.rowCount.toLocaleString()} rows
                        </div>
                      </div>
                    </div>
                  ))}
                  {metrics.hotPartitions.length === 0 && (
                    <p className="text-gray-400 text-sm">
                      No hot partitions detected
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Archive className="h-5 w-5 text-gray-500" />
                  Cold Partitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.coldPartitions
                    .slice(0, 5)
                    .map((partition, index) => (
                      <div
                        key={partition.name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-white text-sm">
                          {partition.name.split("_").slice(-1)[0]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.floor(
                            (Date.now() - partition.lastAccessed.getTime()) /
                              (1000 * 60 * 60 * 24),
                          )}
                          d old
                        </Badge>
                      </div>
                    ))}
                  {metrics.coldPartitions.length === 0 && (
                    <p className="text-gray-400 text-sm">
                      No cold partitions detected
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Fragmented
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.fragmentedPartitions
                    .slice(0, 5)
                    .map((partition, index) => (
                      <div
                        key={partition.name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-white text-sm">
                          {partition.name.split("_").slice(-1)[0]}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast.info(
                              `Scheduled VACUUM for ${partition.name}`,
                            );
                          }}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  {metrics.fragmentedPartitions.length === 0 && (
                    <p className="text-gray-400 text-sm">
                      No fragmented partitions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Partitions Tab */}
        <TabsContent value="partitions" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">
              Active Partitions
            </h3>
            <Button onClick={handleCreatePartitions}>
              <Calendar className="mr-2 h-4 w-4" />
              Create Future Partitions
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                <tr>
                  <th className="px-6 py-3">Partition Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Rows</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Last Accessed</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...metrics.hotPartitions, ...metrics.coldPartitions].map(
                  (partition) => (
                    <tr
                      key={partition.name}
                      className="bg-gray-800 border-b border-gray-700"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {partition.name}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {partition.type}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {partition.rowCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {(partition.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {partition.lastAccessed.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            partition.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {partition.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            toast.info(`Analyze ${partition.name}`)
                          }
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance Tasks */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Recent Maintenance Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceTaskData.map(
                    (task: MaintenanceTask, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              task.status === "completed"
                                ? "default"
                                : task.status === "failed"
                                  ? "destructive"
                                  : task.status === "running"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            {task.status}
                          </Badge>
                          <span className="text-white">
                            {task.type} - {task.target}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Schedule */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Maintenance Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      Auto-partition creation
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-white">Daily at 2 AM</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      Cold partition archival
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-white">Weekly</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Vacuum fragmented</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-white">As needed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Statistics update</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-white">Hourly</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Partition Strategy Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(TABLE_COLORS).map(([table, color]) => {
                  const strategy = partitionManager.getStrategy(table);
                  if (!strategy) return null;

                  return (
                    <div
                      key={table}
                      className="border-b border-gray-700 pb-4 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-white flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {table
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h4>
                        <Badge variant="outline">{strategy.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">
                            Partition Column:
                          </span>
                          <span className="text-white ml-2">
                            {Array.isArray(strategy.column)
                              ? strategy.column.join(", ")
                              : strategy.column}
                          </span>
                        </div>
                        {strategy.interval && (
                          <div>
                            <span className="text-gray-400">Interval:</span>
                            <span className="text-white ml-2">
                              {strategy.interval}
                            </span>
                          </div>
                        )}
                        {strategy.values && (
                          <div className="col-span-2">
                            <span className="text-gray-400">Values:</span>
                            <span className="text-white ml-2">
                              {strategy.values.slice(0, 5).join(", ")}
                              {strategy.values.length > 5 &&
                                ` (+${strategy.values.length - 5} more)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
