/**
 * @fileMetadata
 * @owner @dashboard-team
 * @purpose "Enhanced dashboard widgets with real-time updates and advanced visualizations"
 * @dependencies ["recharts", "framer-motion", "date-fns"]
 * @status enhanced
 */
"use client";

import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  Zap,
  Droplets,
  Wind,
  Cloud,
  Sun,
  CloudRain,
  Bell,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Users,
  FileText,
  Gauge,
  Brain,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronRight,
  Info,
  Eye,
  ThermometerSun,
  Waves,
  Wrench,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
} from "recharts";
import { format, subDays, addDays, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Types
interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "stable";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sparklineData?: number[];
}

interface ActivityItem {
  id: string;
  type: "claim" | "maintenance" | "alert" | "document" | "ai";
  title: string;
  description: string;
  timestamp: Date;
  status?: "success" | "warning" | "error" | "info";
  icon?: React.ComponentType<{ className?: string }>;
}

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
  }>;
  alerts: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
}

// Real-time metric card with sparkline
export function MetricCard({ metric }: { metric: MetricCard }) {
  const Icon = metric.icon;
  const isPositive = metric.trend === "up" && metric.change > 0;
  const TrendIcon = metric.trend === "up" ? ArrowUp : metric.trend === "down" ? ArrowDown : ArrowRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`bg-gradient-to-br ${metric.color} border-gray-700 overflow-hidden relative`}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Icon className="w-full h-full" />
        </div>
        <CardContent className="p-4 relative z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <Badge 
              className={`${
                isPositive ? "bg-green-500/20 text-green-400" : 
                metric.trend === "down" ? "bg-red-500/20 text-red-400" :
                "bg-gray-500/20 text-gray-400"
              }`}
            >
              <TrendIcon className="h-3 w-3 mr-1" />
              {Math.abs(metric.change)}%
            </Badge>
          </div>
          <div>
            <p className="text-gray-300 text-sm">{metric.title}</p>
            <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
          </div>
          {metric.sparklineData && (
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metric.sparklineData.map((value, i) => ({ value, index: i }))}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="rgba(255,255,255,0.4)" 
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Activity feed with real-time updates
export function ActivityFeed({ limit = 5 }: { limit?: number }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadActivities();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('activity-feed')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'audit_logs' 
      }, (payload: any) => {
        // Add new activity to the feed
        const newData = payload.new as Record<string, any> | null;
        if (newData) {
          const newActivity: ActivityItem = {
            id: newData.id || Date.now().toString(),
            type: "alert",
            title: "New Activity",
            description: newData.action || "System event",
            timestamp: new Date(),
            status: "info",
          };
          setActivities(prev => [newActivity, ...prev].slice(0, limit));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [limit, supabase]);

  const loadActivities = async () => {
    try {
      // Mock data for demonstration
      const mockActivities: ActivityItem[] = [
        {
          id: "1",
          type: "ai",
          title: "AI Risk Assessment Complete",
          description: "Property risk score updated to 72/100",
          timestamp: new Date(),
          status: "success",
          icon: Brain,
        },
        {
          id: "2",
          type: "maintenance",
          title: "Maintenance Scheduled",
          description: "HVAC filter replacement scheduled for next week",
          timestamp: subDays(new Date(), 1),
          status: "info",
          icon: Calendar,
        },
        {
          id: "3",
          type: "alert",
          title: "Weather Alert",
          description: "Tropical storm watch issued for your area",
          timestamp: subDays(new Date(), 2),
          status: "warning",
          icon: CloudRain,
        },
        {
          id: "4",
          type: "document",
          title: "Document Uploaded",
          description: "Insurance policy renewal document saved",
          timestamp: subDays(new Date(), 3),
          status: "success",
          icon: FileText,
        },
        {
          id: "5",
          type: "claim",
          title: "Claim Status Update",
          description: "Claim #CL-2024-001 approved for $3,500",
          timestamp: subDays(new Date(), 4),
          status: "success",
          icon: CheckCircle,
        },
      ];

      setActivities(mockActivities.slice(0, limit));
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activity: ActivityItem) => {
    const Icon = activity.icon || Activity;
    const colorClass = 
      activity.status === "success" ? "text-green-400" :
      activity.status === "warning" ? "text-yellow-400" :
      activity.status === "error" ? "text-red-400" :
      "text-blue-400";
    
    return <Icon className={`h-4 w-4 ${colorClass}`} />;
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Recent Activity</span>
          <Badge className="bg-blue-600">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 group cursor-pointer hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
              >
                <div className="p-2 bg-gray-700 rounded-full">
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{activity.title}</p>
                  <p className="text-gray-400 text-xs mt-1">{activity.description}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {format(activity.timestamp, "MMM d, h:mm a")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-4 text-gray-400 hover:text-white"
          onClick={() => toast.info("Activity history coming soon!")}
        >
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
}

// Weather widget with alerts
export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock weather data - in production, this would call a weather API
    setTimeout(() => {
      setWeather({
        temp: 82,
        condition: "Partly Cloudy",
        humidity: 65,
        windSpeed: 12,
        forecast: [
          { day: "Today", high: 85, low: 72, condition: "Partly Cloudy", precipitation: 20 },
          { day: "Tomorrow", high: 87, low: 74, condition: "Thunderstorms", precipitation: 60 },
          { day: "Friday", high: 83, low: 71, condition: "Cloudy", precipitation: 40 },
          { day: "Saturday", high: 81, low: 69, condition: "Sunny", precipitation: 10 },
          { day: "Sunday", high: 84, low: 72, condition: "Partly Cloudy", precipitation: 30 },
        ],
        alerts: [
          { type: "Hurricane Watch", severity: "high", message: "Tropical system developing in the Atlantic" },
        ],
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny": return Sun;
      case "cloudy": return Cloud;
      case "partly cloudy": return Cloud;
      case "thunderstorms": return CloudRain;
      case "rain": return Droplets;
      default: return Sun;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-700 rounded w-1/2" />
            <div className="h-20 bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Weather & Alerts</span>
          {weather.alerts.length > 0 && (
            <Badge className="bg-red-600 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Alert
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Weather */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <WeatherIcon className="h-12 w-12 text-yellow-400" />
            <div>
              <p className="text-3xl font-bold text-white">{weather.temp}°F</p>
              <p className="text-gray-400">{weather.condition}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Droplets className="h-4 w-4" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 mt-1">
              <Wind className="h-4 w-4" />
              <span>{weather.windSpeed} mph</span>
            </div>
          </div>
        </div>

        {/* Weather Alerts */}
        {weather.alerts.length > 0 && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            {weather.alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">{alert.type}</p>
                  <p className="text-xs text-gray-400">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5-Day Forecast */}
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-2">5-Day Forecast</p>
          <div className="grid grid-cols-5 gap-2">
            {weather.forecast.map((day, idx) => {
              const DayIcon = getWeatherIcon(day.condition);
              return (
                <div key={idx} className="text-center">
                  <p className="text-xs text-gray-400 mb-1">{day.day}</p>
                  <DayIcon className="h-6 w-6 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs text-white">{day.high}°</p>
                  <p className="text-xs text-gray-500">{day.low}°</p>
                  {day.precipitation > 40 && (
                    <p className="text-xs text-blue-400 mt-1">{day.precipitation}%</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Property health score widget
export function PropertyHealthWidget() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production would come from AI analysis
    setTimeout(() => {
      setHealthData({
        overallScore: 78,
        trend: "up",
        change: 3,
        categories: [
          { name: "Structure", score: 85, status: "good" },
          { name: "Systems", score: 72, status: "fair" },
          { name: "Safety", score: 90, status: "excellent" },
          { name: "Maintenance", score: 65, status: "attention" },
        ],
        recommendations: [
          "Schedule HVAC maintenance",
          "Clean gutters before hurricane season",
          "Test smoke detectors",
        ],
      });
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-700 rounded w-1/2" />
            <div className="h-32 bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-400";
      case "good": return "text-blue-400";
      case "fair": return "text-yellow-400";
      case "attention": return "text-orange-400";
      default: return "text-gray-400";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Property Health</span>
          <div className="flex items-center gap-2">
            <Badge className={`${healthData.trend === "up" ? "bg-green-600" : "bg-red-600"}`}>
              {healthData.trend === "up" ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {healthData.change}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Score */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <ResponsiveContainer width={120} height={120}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={[{ value: healthData.overallScore, fill: "#10b981" }]}>
                <RadialBar dataKey="value" cornerRadius={10} fill="#10b981" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{healthData.overallScore}</p>
                <p className="text-xs text-gray-400">Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="space-y-3 mb-4">
          {healthData.categories.map((category: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{category.name}</span>
              <div className="flex items-center gap-2">
                <Progress value={category.score} className="w-20 h-2" />
                <span className={`text-sm font-medium ${getStatusColor(category.status)}`}>
                  {category.score}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="border-t border-gray-700 pt-3">
          <p className="text-sm text-gray-400 mb-2">Recommendations</p>
          <ul className="space-y-1">
            {healthData.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Insurance overview widget
export function InsuranceOverviewWidget() {
  const [insuranceData] = useState({
    policies: [
      { type: "Homeowners", provider: "State Farm", premium: 2400, status: "active" },
      { type: "Flood", provider: "NFIP", premium: 800, status: "active" },
      { type: "Wind", provider: "Citizens", premium: 1200, status: "pending" },
    ],
    totalPremium: 4400,
    nextPayment: addDays(new Date(), 15),
    coverage: {
      dwelling: 500000,
      personal: 250000,
      liability: 300000,
    },
    claims: {
      total: 2,
      approved: 1,
      pending: 1,
      totalPayout: 8500,
    },
  });

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Insurance Overview</span>
          <Shield className="h-5 w-5 text-purple-400" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="policies" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full bg-gray-800">
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="policies" className="space-y-3">
            {insuranceData.policies.map((policy, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">{policy.type}</p>
                  <p className="text-gray-400 text-xs">{policy.provider}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">${policy.premium}/yr</p>
                  <Badge className={`text-xs ${
                    policy.status === "active" ? "bg-green-600" : "bg-yellow-600"
                  }`}>
                    {policy.status}
                  </Badge>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Annual Premium</span>
                <span className="text-white font-bold">${insuranceData.totalPremium}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Next Payment</span>
                <span className="text-yellow-400">{format(insuranceData.nextPayment, "MMM d")}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Dwelling</span>
                <span className="text-white font-medium">${insuranceData.coverage.dwelling.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Personal Property</span>
                <span className="text-white font-medium">${insuranceData.coverage.personal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Liability</span>
                <span className="text-white font-medium">${insuranceData.coverage.liability.toLocaleString()}</span>
              </div>
            </div>
            <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p className="text-blue-400 text-sm font-medium mb-1">Coverage Tip</p>
              <p className="text-xs text-gray-300">
                Consider increasing dwelling coverage by 10% to account for inflation and construction costs.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="claims" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{insuranceData.claims.total}</p>
                <p className="text-xs text-gray-400">Total Claims</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-400">${insuranceData.claims.totalPayout.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Total Payout</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Approved</span>
                <Badge className="bg-green-600">{insuranceData.claims.approved}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Pending</span>
                <Badge className="bg-yellow-600">{insuranceData.claims.pending}</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// AI Insights Widget
export function AIInsightsWidget() {
  const [insights] = useState([
    {
      type: "risk",
      title: "Hurricane Season Preparation",
      description: "Your property risk score increases by 15% during hurricane season. Consider these preparations.",
      priority: "high",
      actionable: true,
    },
    {
      type: "savings",
      title: "Potential Premium Reduction",
      description: "Installing impact windows could reduce your wind insurance by $400/year.",
      priority: "medium",
      actionable: true,
    },
    {
      type: "maintenance",
      title: "Preventive Maintenance Alert",
      description: "AC system showing 20% efficiency loss. Service recommended to prevent failure.",
      priority: "high",
      actionable: true,
    },
  ]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "risk": return AlertTriangle;
      case "savings": return DollarSign;
      case "maintenance": return Wrench;
      default: return Brain;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-600";
      case "medium": return "bg-yellow-600";
      case "low": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/20 border-indigo-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-400" />
          AI Insights
          <Badge className="bg-indigo-600 ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            3 New
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = getInsightIcon(insight.type);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-900/50 rounded-lg">
                    <Icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium text-sm">{insight.title}</p>
                      <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs">{insight.description}</p>
                    {insight.actionable && (
                      <Button size="sm" className="mt-2 h-7 text-xs bg-indigo-600 hover:bg-indigo-700">
                        Take Action
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}