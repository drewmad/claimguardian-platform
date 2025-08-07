"use client";

/**
 * @fileMetadata
 * @owner @data-team
 * @purpose "Florida data platform analytics dashboard with comprehensive metrics"
 * @dependencies ["react", "@claimguardian/ui", "recharts"]
 * @status stable
 * @data-integration florida_parcels
 * @geospatial true
 * @analytics comprehensive
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Database,
  MapPin,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  Activity,
  Users,
  Home,
  DollarSign,
  Clock,
  Zap,
  RefreshCw,
  Eye,
  Settings,
  Download,
  Filter,
} from "lucide-react";
import { useSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CountyStats {
  county_code: number;
  county_name: string;
  total_parcels: number;
  residential_parcels: number;
  median_property_value: number;
  high_risk_parcels: number;
  calculation_date: string;
}

interface DataQualityMetric {
  table_name: string;
  total_records: number;
  completeness_rate: number;
  quality_issues: number;
  created_at: string;
}

interface PipelineStatus {
  data_sources: any[];
  recent_quality_metrics: DataQualityMetric[];
  health: {
    active_sources: number;
    total_sources: number;
    avg_quality_score: number;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function FloridaAnalyticsDashboard() {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [countyStats, setCountyStats] = useState<CountyStats[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(
    null,
  );
  const [selectedCounty, setSelectedCounty] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load county statistics
      const { data: counties } = await supabase
        .from("county_market_stats")
        .select("*")
        .order("total_parcels", { ascending: false })
        .limit(20);

      if (counties) {
        setCountyStats(counties);
      }

      // Simulate pipeline status for demo
      setPipelineStatus({
        data_sources: [
          { source_name: "Florida DOR", status: "ACTIVE" },
          { source_name: "County Records", status: "ACTIVE" },
          { source_name: "FEMA Flood Maps", status: "ACTIVE" },
          { source_name: "Market Data", status: "ERROR" },
        ],
        recent_quality_metrics: [
          {
            table_name: "florida_parcels",
            total_records: 9600000,
            completeness_rate: 96.5,
            quality_issues: 15,
            created_at: new Date().toISOString(),
          },
          {
            table_name: "property_risk_assessments",
            total_records: 245000,
            completeness_rate: 89.2,
            quality_issues: 8,
            created_at: new Date().toISOString(),
          },
          {
            table_name: "property_market_analysis",
            total_records: 180000,
            completeness_rate: 92.8,
            quality_issues: 3,
            created_at: new Date().toISOString(),
          },
        ],
        health: {
          active_sources: 3,
          total_sources: 4,
          avg_quality_score: 92.8,
        },
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Data refresh initiated successfully");
      await loadDashboardData();
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const totalParcels = countyStats.reduce(
    (sum, county) => sum + (county.total_parcels || 0),
    0,
  );
  const totalHighRisk = countyStats.reduce(
    (sum, county) => sum + (county.high_risk_parcels || 0),
    0,
  );
  const avgPropertyValue =
    countyStats.length > 0
      ? countyStats.reduce(
          (sum, county) => sum + (county.median_property_value || 0),
          0,
        ) / countyStats.length
      : 0;

  const riskDistribution = [
    { name: "Low Risk", value: totalParcels - totalHighRisk, color: "#00C49F" },
    { name: "High Risk", value: totalHighRisk, color: "#FF8042" },
  ];

  const topCountiesByValue = [...countyStats]
    .sort(
      (a, b) => (b.median_property_value || 0) - (a.median_property_value || 0),
    )
    .slice(0, 10);

  const topCountiesByParcels = [...countyStats]
    .sort((a, b) => (b.total_parcels || 0) - (a.total_parcels || 0))
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Florida Data Analytics
          </h1>
          <p className="text-gray-300">
            Comprehensive analysis of {totalParcels.toLocaleString()} Florida
            properties
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={refreshing}
            className="bg-gray-700 border-gray-600 hover:bg-gray-600"
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-700 border-gray-600 hover:bg-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  Total Properties
                </p>
                <p className="text-2xl font-bold text-white">
                  {totalParcels.toLocaleString()}
                </p>
              </div>
              <Home className="h-8 w-8 text-blue-400" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                67 Counties
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  Avg Property Value
                </p>
                <p className="text-2xl font-bold text-white">
                  ${Math.round(avgPropertyValue).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Market Analysis
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  High Risk Properties
                </p>
                <p className="text-2xl font-bold text-white">
                  {totalHighRisk.toLocaleString()}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <div className="mt-2">
              <Progress
                value={
                  totalParcels > 0 ? (totalHighRisk / totalParcels) * 100 : 0
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  Data Quality
                </p>
                <p className="text-2xl font-bold text-white">
                  {pipelineStatus?.health.avg_quality_score.toFixed(1)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
            <div className="mt-2">
              <Badge
                variant={
                  (pipelineStatus?.health.avg_quality_score || 0) > 80
                    ? "default"
                    : (pipelineStatus?.health.avg_quality_score || 0) > 60
                      ? "secondary"
                      : "destructive"
                }
                className="text-xs"
              >
                {(pipelineStatus?.health.avg_quality_score || 0) > 80
                  ? "Excellent"
                  : (pipelineStatus?.health.avg_quality_score || 0) > 60
                    ? "Good"
                    : "Needs Improvement"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="counties">Counties</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Risk Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Property Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value, percent }) =>
                        `${name}: ${value?.toLocaleString() ?? 0} (${((percent ?? 0) * 100).toFixed(1)}%)`
                      }
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Counties by Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCountiesByValue.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="county_name"
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                      }}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "Median Value",
                      ]}
                    />
                    <Bar dataKey="median_property_value" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* County Comparison */}
          <Card className="bg-gray-800/30 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top Counties by Property Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topCountiesByParcels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="county_name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                    }}
                    formatter={(value) => [
                      Number(value).toLocaleString(),
                      "Properties",
                    ]}
                  />
                  <Bar dataKey="total_parcels" fill="#00C49F" />
                  <Bar dataKey="high_risk_parcels" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counties" className="space-y-6">
          {/* County Details Table */}
          <Card className="bg-gray-800/30 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">County Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-gray-300">County</th>
                      <th className="text-right p-2 text-gray-300">
                        Properties
                      </th>
                      <th className="text-right p-2 text-gray-300">
                        Median Value
                      </th>
                      <th className="text-right p-2 text-gray-300">
                        High Risk
                      </th>
                      <th className="text-right p-2 text-gray-300">Risk %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countyStats.map((county) => (
                      <tr
                        key={county.county_code}
                        className="border-b border-gray-800 hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => setSelectedCounty(county.county_code)}
                      >
                        <td className="p-2 text-white font-medium">
                          {county.county_name}
                        </td>
                        <td className="p-2 text-right text-gray-300">
                          {county.total_parcels?.toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-gray-300">
                          ${county.median_property_value?.toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-orange-400">
                          {county.high_risk_parcels?.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          <Badge
                            variant={
                              county.total_parcels > 0 &&
                              county.high_risk_parcels / county.total_parcels >
                                0.3
                                ? "destructive"
                                : county.total_parcels > 0 &&
                                    county.high_risk_parcels /
                                      county.total_parcels >
                                      0.15
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {county.total_parcels > 0
                              ? (
                                  (county.high_risk_parcels /
                                    county.total_parcels) *
                                  100
                                ).toFixed(1) + "%"
                              : "0%"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          {/* Data Quality Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pipelineStatus?.recent_quality_metrics?.map((metric) => (
              <Card
                key={metric.table_name}
                className="bg-gray-800/50 border-gray-700"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">
                      {metric.table_name}
                    </h3>
                    <Database className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Records</span>
                      <span className="text-white">
                        {metric.total_records?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completeness</span>
                      <span className="text-white">
                        {metric.completeness_rate?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Issues</span>
                      <span
                        className={
                          metric.quality_issues > 10
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {metric.quality_issues}
                      </span>
                    </div>
                    <Progress
                      value={metric.completeness_rate}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          {/* Pipeline Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pipeline Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Sources</span>
                    <span className="text-white">
                      {pipelineStatus?.health.active_sources} /{" "}
                      {pipelineStatus?.health.total_sources}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Data Quality</span>
                    <Badge variant="default">
                      {pipelineStatus?.health.avg_quality_score?.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress
                    value={
                      ((pipelineStatus?.health.active_sources || 0) /
                        (pipelineStatus?.health.total_sources || 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pipelineStatus?.data_sources
                    ?.slice(0, 5)
                    .map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-300 text-sm">
                          {source.source_name}
                        </span>
                        <Badge
                          variant={
                            source.status === "ACTIVE"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {source.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
