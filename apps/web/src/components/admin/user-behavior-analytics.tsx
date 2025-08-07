/**
 * @fileMetadata
 * @owner admin-team
 * @purpose "User Behavior Analytics Dashboard for retention metrics and feature adoption tracking"
 * @dependencies ["@/components", "@/lib", "recharts", "lucide-react"]
 * @status stable
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Activity,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  RefreshCw,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
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
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Funnel,
  FunnelChart,
} from "recharts";
import { createBrowserSupabaseClient } from "@claimguardian/db";

interface UserRetention {
  cohort_month: string;
  period: number;
  users: number;
  retained_users: number;
  retention_rate: number;
}

interface FeatureAdoption {
  feature_name: string;
  category: string;
  total_users: number;
  active_users_30d: number;
  adoption_rate: number;
  avg_usage_per_user: number;
  first_time_users_30d: number;
  power_users: number;
}

interface UserJourney {
  step: string;
  users: number;
  conversion_rate: number;
  drop_off_rate: number;
  avg_time_spent: number;
}

interface ActivityPattern {
  hour: number;
  day_of_week: string;
  active_users: number;
  sessions: number;
  avg_session_duration: number;
}

interface UserSegment {
  segment_name: string;
  user_count: number;
  avg_session_duration: number;
  pages_per_session: number;
  bounce_rate: number;
  conversion_rate: number;
  retention_7d: number;
  retention_30d: number;
}

interface ChurnRisk {
  user_id: string;
  email: string;
  tier: string;
  last_active: string;
  risk_score: number;
  risk_factors: string[];
  predicted_churn_date: string;
}

const FEATURE_COLORS = {
  Dashboard: "#3B82F6",
  "AI Tools": "#10B981",
  Properties: "#F59E0B",
  Claims: "#EF4444",
  Documents: "#8B5CF6",
  Reports: "#06B6D4",
};

const RISK_COLORS = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

export function UserBehaviorAnalytics() {
  const [retention, setRetention] = useState<UserRetention[]>([]);
  const [features, setFeatures] = useState<FeatureAdoption[]>([]);
  const [journey, setJourney] = useState<UserJourney[]>([]);
  const [patterns, setPatterns] = useState<ActivityPattern[]>([]);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [churnRisk, setChurnRisk] = useState<ChurnRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    loadBehaviorData();
  }, [timeRange]);

  const loadBehaviorData = async () => {
    try {
      setLoading(true);

      // Load all analytics data in parallel
      const [
        retentionData,
        featuresData,
        journeyData,
        patternsData,
        segmentsData,
        churnData,
      ] = await Promise.all([
        supabase.rpc("get_user_retention_cohorts"),
        supabase.rpc("get_feature_adoption_metrics"),
        supabase.rpc("get_user_journey_funnel"),
        supabase.rpc("get_activity_patterns", { days: parseInt(timeRange) }),
        supabase.rpc("get_user_segments"),
        supabase.rpc("get_churn_risk_analysis"),
      ]);

      if (retentionData.error) throw retentionData.error;
      if (featuresData.error) throw featuresData.error;
      if (journeyData.error) throw journeyData.error;
      if (patternsData.error) throw patternsData.error;
      if (segmentsData.error) throw segmentsData.error;
      if (churnData.error) throw churnData.error;

      setRetention(retentionData.data || []);
      setFeatures(featuresData.data || []);
      setJourney(journeyData.data || []);
      setPatterns(patternsData.data || []);
      setSegments(segmentsData.data || []);
      setChurnRisk(churnData.data || []);

      setError(null);
    } catch (err) {
      console.error("Error loading behavior data:", err);
      setError("Failed to load analytics data");

      // Mock data for development
      const mockRetention = [
        {
          cohort_month: "2024-10",
          period: 0,
          users: 234,
          retained_users: 234,
          retention_rate: 100,
        },
        {
          cohort_month: "2024-10",
          period: 1,
          users: 234,
          retained_users: 156,
          retention_rate: 66.7,
        },
        {
          cohort_month: "2024-10",
          period: 2,
          users: 234,
          retained_users: 123,
          retention_rate: 52.6,
        },
        {
          cohort_month: "2024-10",
          period: 3,
          users: 234,
          retained_users: 98,
          retention_rate: 41.9,
        },
        {
          cohort_month: "2024-11",
          period: 0,
          users: 312,
          retained_users: 312,
          retention_rate: 100,
        },
        {
          cohort_month: "2024-11",
          period: 1,
          users: 312,
          retained_users: 223,
          retention_rate: 71.5,
        },
        {
          cohort_month: "2024-11",
          period: 2,
          users: 312,
          retained_users: 187,
          retention_rate: 59.9,
        },
        {
          cohort_month: "2024-12",
          period: 0,
          users: 445,
          retained_users: 445,
          retention_rate: 100,
        },
        {
          cohort_month: "2024-12",
          period: 1,
          users: 445,
          retained_users: 334,
          retention_rate: 75.1,
        },
      ];
      setRetention(mockRetention);

      const mockFeatures = [
        {
          feature_name: "Damage Analyzer",
          category: "AI Tools",
          total_users: 1247,
          active_users_30d: 892,
          adoption_rate: 71.5,
          avg_usage_per_user: 4.2,
          first_time_users_30d: 156,
          power_users: 89,
        },
        {
          feature_name: "Policy Chat",
          category: "AI Tools",
          total_users: 1247,
          active_users_30d: 567,
          adoption_rate: 45.5,
          avg_usage_per_user: 2.8,
          first_time_users_30d: 123,
          power_users: 67,
        },
        {
          feature_name: "Property Management",
          category: "Properties",
          total_users: 1247,
          active_users_30d: 1098,
          adoption_rate: 88.1,
          avg_usage_per_user: 8.7,
          first_time_users_30d: 234,
          power_users: 234,
        },
        {
          feature_name: "Claims Tracking",
          category: "Claims",
          total_users: 1247,
          active_users_30d: 678,
          adoption_rate: 54.4,
          avg_usage_per_user: 3.4,
          first_time_users_30d: 145,
          power_users: 78,
        },
        {
          feature_name: "Document Upload",
          category: "Documents",
          total_users: 1247,
          active_users_30d: 945,
          adoption_rate: 75.8,
          avg_usage_per_user: 5.6,
          first_time_users_30d: 189,
          power_users: 123,
        },
        {
          feature_name: "Inventory Scanner",
          category: "AI Tools",
          total_users: 1247,
          active_users_30d: 445,
          adoption_rate: 35.7,
          avg_usage_per_user: 2.1,
          first_time_users_30d: 98,
          power_users: 45,
        },
      ];
      setFeatures(mockFeatures);

      const mockJourney = [
        {
          step: "Landing Page",
          users: 10000,
          conversion_rate: 100,
          drop_off_rate: 0,
          avg_time_spent: 45,
        },
        {
          step: "Sign Up Started",
          users: 2340,
          conversion_rate: 23.4,
          drop_off_rate: 76.6,
          avg_time_spent: 120,
        },
        {
          step: "Email Verified",
          users: 1789,
          conversion_rate: 76.5,
          drop_off_rate: 23.5,
          avg_time_spent: 60,
        },
        {
          step: "Profile Completed",
          users: 1456,
          conversion_rate: 81.4,
          drop_off_rate: 18.6,
          avg_time_spent: 180,
        },
        {
          step: "First Property Added",
          users: 1247,
          conversion_rate: 85.6,
          drop_off_rate: 14.4,
          avg_time_spent: 300,
        },
        {
          step: "First AI Tool Used",
          users: 892,
          conversion_rate: 71.5,
          drop_off_rate: 28.5,
          avg_time_spent: 420,
        },
        {
          step: "Subscription Upgrade",
          users: 234,
          conversion_rate: 26.2,
          drop_off_rate: 73.8,
          avg_time_spent: 240,
        },
      ];
      setJourney(mockJourney);

      // Generate mock activity patterns
      const mockPatterns = [];
      const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      for (const day of days) {
        for (let hour = 0; hour < 24; hour++) {
          const baseActivity =
            day === "Saturday" || day === "Sunday" ? 0.6 : 1.0;
          const hourMultiplier =
            hour >= 9 && hour <= 17
              ? 1.5
              : hour >= 18 && hour <= 22
                ? 1.2
                : 0.3;
          const activeUsers = Math.round(
            200 * baseActivity * hourMultiplier * (0.8 + Math.random() * 0.4),
          );

          mockPatterns.push({
            hour,
            day_of_week: day,
            active_users: activeUsers,
            sessions: Math.round(activeUsers * 1.3),
            avg_session_duration: 180 + Math.random() * 300,
          });
        }
      }
      setPatterns(mockPatterns);

      const mockSegments = [
        {
          segment_name: "New Users (< 30 days)",
          user_count: 456,
          avg_session_duration: 180,
          pages_per_session: 3.2,
          bounce_rate: 45.2,
          conversion_rate: 8.3,
          retention_7d: 78.5,
          retention_30d: 45.2,
        },
        {
          segment_name: "Active Users (30-90 days)",
          user_count: 334,
          avg_session_duration: 240,
          pages_per_session: 4.8,
          bounce_rate: 28.6,
          conversion_rate: 15.7,
          retention_7d: 89.2,
          retention_30d: 67.8,
        },
        {
          segment_name: "Loyal Users (90+ days)",
          user_count: 267,
          avg_session_duration: 320,
          pages_per_session: 6.4,
          bounce_rate: 15.3,
          conversion_rate: 28.4,
          retention_7d: 94.8,
          retention_30d: 82.1,
        },
        {
          segment_name: "Power Users (Daily Active)",
          user_count: 123,
          avg_session_duration: 480,
          pages_per_session: 12.3,
          bounce_rate: 8.9,
          conversion_rate: 45.7,
          retention_7d: 98.4,
          retention_30d: 94.3,
        },
        {
          segment_name: "At-Risk Users",
          user_count: 67,
          avg_session_duration: 90,
          pages_per_session: 1.8,
          bounce_rate: 72.4,
          conversion_rate: 2.1,
          retention_7d: 23.9,
          retention_30d: 8.7,
        },
      ];
      setSegments(mockSegments);

      const mockChurnRisk = [
        {
          user_id: "1",
          email: "user1@example.com",
          tier: "essential",
          last_active: "2024-12-20",
          risk_score: 85,
          risk_factors: ["Low engagement", "No recent AI usage"],
          predicted_churn_date: "2025-01-15",
        },
        {
          user_id: "2",
          email: "user2@example.com",
          tier: "plus",
          last_active: "2024-12-18",
          risk_score: 72,
          risk_factors: ["Decreased usage", "Support tickets"],
          predicted_churn_date: "2025-01-20",
        },
        {
          user_id: "3",
          email: "user3@example.com",
          tier: "pro",
          last_active: "2024-12-15",
          risk_score: 68,
          risk_factors: ["No recent login"],
          predicted_churn_date: "2025-01-25",
        },
      ];
      setChurnRisk(mockChurnRisk);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  const getRiskColor = (score: number) => {
    return RISK_COLORS[getRiskLevel(score)];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading user behavior data...</p>
        </div>
      </div>
    );
  }

  // Process retention data for heatmap
  const retentionMatrix = retention.reduce(
    (acc, item) => {
      if (!acc[item.cohort_month]) {
        acc[item.cohort_month] = {};
      }
      acc[item.cohort_month][item.period] = item.retention_rate;
      return acc;
    },
    {} as Record<string, Record<number, number>>,
  );

  // Calculate average retention rates
  const avgRetention = {
    week1:
      retention
        .filter((r) => r.period === 1)
        .reduce((sum, r) => sum + r.retention_rate, 0) /
        retention.filter((r) => r.period === 1).length || 0,
    month1:
      retention
        .filter((r) => r.period === 1)
        .reduce((sum, r) => sum + r.retention_rate, 0) /
        retention.filter((r) => r.period === 1).length || 0,
    month3:
      retention
        .filter((r) => r.period === 3)
        .reduce((sum, r) => sum + r.retention_rate, 0) /
        retention.filter((r) => r.period === 3).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            User Behavior Analytics
          </h1>
          <p className="text-gray-400 mt-1">
            Retention, engagement, and feature adoption insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={loadBehaviorData}
            className="border-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-900/20 border-red-900">
          <CardContent className="p-4">
            <p className="text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              7-Day Retention
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {avgRetention.week1.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Industry avg: 20-30%</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              30-Day Retention
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {avgRetention.month1.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Industry avg: 10-15%</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Feature Adoption
            </CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {features.length > 0
                ? (
                    features.reduce((sum, f) => sum + f.adoption_rate, 0) /
                    features.length
                  ).toFixed(1)
                : "0"}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg across {features.length} features
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              At-Risk Users
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {churnRisk.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">High churn risk score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="retention" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="retention">Retention Analysis</TabsTrigger>
          <TabsTrigger value="features">Feature Adoption</TabsTrigger>
          <TabsTrigger value="journey">User Journey</TabsTrigger>
          <TabsTrigger value="segments">User Segments</TabsTrigger>
          <TabsTrigger value="churn">Churn Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="retention" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Retention Curve */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Retention Curves by Cohort
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retention}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="period"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "none",
                      }}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Legend />
                    {Object.keys(retentionMatrix).map((cohort, idx) => (
                      <Line
                        key={cohort}
                        type="monotone"
                        dataKey="retention_rate"
                        data={retention.filter(
                          (r) => r.cohort_month === cohort,
                        )}
                        stroke={`hsl(${idx * 60}, 70%, 50%)`}
                        strokeWidth={2}
                        name={cohort}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Heatmap */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  User Activity Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-24 gap-px">
                  {patterns.slice(0, 168).map((pattern, idx) => {
                    const intensity = Math.min(pattern.active_users / 300, 1);
                    return (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                        }}
                        title={`${pattern.day_of_week} ${pattern.hour}:00 - ${pattern.active_users} users`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Less active</span>
                  <span>More active</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Feature Adoption Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Feature</th>
                      <th className="text-right py-2 text-gray-400">
                        Category
                      </th>
                      <th className="text-right py-2 text-gray-400">
                        Adoption Rate
                      </th>
                      <th className="text-right py-2 text-gray-400">
                        Active Users
                      </th>
                      <th className="text-right py-2 text-gray-400">
                        Avg Usage
                      </th>
                      <th className="text-right py-2 text-gray-400">
                        New Users
                      </th>
                      <th className="text-right py-2 text-gray-400">
                        Power Users
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3 text-gray-300 font-medium">
                          {feature.feature_name}
                        </td>
                        <td className="text-right py-3">
                          <Badge
                            variant="outline"
                            style={{
                              borderColor:
                                FEATURE_COLORS[
                                  feature.category as keyof typeof FEATURE_COLORS
                                ],
                              color:
                                FEATURE_COLORS[
                                  feature.category as keyof typeof FEATURE_COLORS
                                ],
                            }}
                          >
                            {feature.category}
                          </Badge>
                        </td>
                        <td className="text-right py-3">
                          <span
                            className={
                              feature.adoption_rate > 70
                                ? "text-green-400"
                                : feature.adoption_rate > 50
                                  ? "text-yellow-400"
                                  : "text-gray-400"
                            }
                          >
                            {feature.adoption_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 text-gray-300">
                          {feature.active_users_30d.toLocaleString()}
                        </td>
                        <td className="text-right py-3 text-gray-300">
                          {feature.avg_usage_per_user.toFixed(1)}
                        </td>
                        <td className="text-right py-3 text-gray-300">
                          {feature.first_time_users_30d}
                        </td>
                        <td className="text-right py-3 text-gray-300">
                          {feature.power_users}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">User Journey Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journey.map((step, idx) => (
                  <div key={idx} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 font-medium">
                          {step.step}
                        </span>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-300">
                            {step.users.toLocaleString()} users
                          </span>
                          <span className="text-green-400">
                            {step.conversion_rate.toFixed(1)}%
                          </span>
                          <span className="text-gray-500">
                            {Math.round(step.avg_time_spent)}s avg
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(step.users / journey[0].users) * 100}%`,
                          }}
                        />
                      </div>
                      {step.drop_off_rate > 0 && (
                        <p className="text-xs text-red-400 mt-1">
                          {step.drop_off_rate.toFixed(1)}% drop-off
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {segments.map((segment, idx) => (
              <Card key={idx} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    {segment.segment_name}
                  </CardTitle>
                  <p className="text-gray-400 text-sm">
                    {segment.user_count} users
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Avg Session Duration
                      </span>
                      <span className="text-gray-300">
                        {Math.round(segment.avg_session_duration)}s
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Pages per Session</span>
                      <span className="text-gray-300">
                        {segment.pages_per_session.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Bounce Rate</span>
                      <span
                        className={
                          segment.bounce_rate > 50
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {segment.bounce_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Conversion Rate</span>
                      <span className="text-blue-400">
                        {segment.conversion_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">30-Day Retention</span>
                      <span
                        className={
                          segment.retention_30d > 50
                            ? "text-green-400"
                            : "text-yellow-400"
                        }
                      >
                        {segment.retention_30d.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                High Churn Risk Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">User</th>
                      <th className="text-left py-2 text-gray-400">Tier</th>
                      <th className="text-left py-2 text-gray-400">
                        Last Active
                      </th>
                      <th className="text-left py-2 text-gray-400">
                        Risk Score
                      </th>
                      <th className="text-left py-2 text-gray-400">
                        Risk Factors
                      </th>
                      <th className="text-left py-2 text-gray-400">
                        Predicted Churn
                      </th>
                      <th className="text-left py-2 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnRisk.map((user, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3 text-gray-300">{user.email}</td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className="text-purple-400 border-purple-400"
                          >
                            {user.tier}
                          </Badge>
                        </td>
                        <td className="py-3 text-gray-300">
                          {new Date(user.last_active).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: getRiskColor(user.risk_score),
                              }}
                            />
                            <span className="text-gray-300">
                              {user.risk_score}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.risk_factors.map((factor, fidx) => (
                              <Badge
                                key={fidx}
                                variant="outline"
                                className="text-xs text-gray-400 border-gray-600"
                              >
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-gray-300">
                          {new Date(
                            user.predicted_churn_date,
                          ).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Contact
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Offer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
