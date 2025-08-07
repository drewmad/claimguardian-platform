/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Real-time monitoring dashboard React component for ClaimGuardian"
 * @dependencies ["react", "recharts", "lucide-react"]
 * @status stable
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Globe, 
  Shield, 
  TrendingUp, 
  Users,
  Zap,
  AlertCircle,
  BarChart3,
  Cpu,
  Database,
  HardDrive,
  Wifi,
  XCircle
} from "lucide-react";

// Types from our monitoring system
interface SystemMetrics {
  performance: {
    responseTime: { avg: number; p50: number; p95: number; p99: number };
    throughput: { requestsPerSecond: number; requestsPerMinute: number; requestsPerHour: number };
    errorRate: number;
    uptime: number;
    memoryUsage: { used: number; total: number; percentage: number };
    cpuUsage: number;
  };
  business: {
    activeUsers: number;
    newSignups: number;
    aiRequestsToday: number;
    documentsProcessed: number;
    claimsCreated: number;
    revenue: { daily: number; monthly: number; annual: number };
    conversionRate: number;
  };
  ai: {
    openaiCosts: { today: number; thisMonth: number; totalTokens: number };
    geminiCosts: { today: number; thisMonth: number; totalTokens: number };
    averageResponseTime: number;
    successRate: number;
    costPerUser: number;
  };
  security: {
    failedLogins: number;
    suspiciousActivity: number;
    blockedIPs: number;
    rateLimitViolations: number;
    securityAlerts: number;
  };
  florida: {
    emergencyAlerts: Array<{
      county: string;
      type: "hurricane" | "flood" | "weather" | "fema";
      level: "watch" | "warning" | "emergency";
      timestamp: string;
    }>;
    emergencyTraffic: number;
    disasterClaims: number;
    affectedCounties: number;
  };
}

interface Alert {
  id: string;
  level: "info" | "warning" | "error" | "critical";
  category: "performance" | "security" | "business" | "ai" | "florida" | "system";
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, unknown>;
  actions?: Array<{
    label: string;
    action: string;
    severity: "low" | "medium" | "high";
  }>;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, {
    status: "pass" | "warn" | "fail";
    responseTime?: number;
    message?: string;
  }>;
  uptime: number;
  version: string;
  timestamp: string;
}

interface MonitoringData {
  metrics?: SystemMetrics;
  alerts?: Alert[];
  health?: HealthStatus;
  rateLimits?: any;
  meta: {
    timestamp: string;
    scope: string;
    category?: string;
    timeRange: string;
    version: string;
  };
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"overview" | "performance" | "business" | "ai" | "security" | "florida">("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMonitoringData = useCallback(async () => {
    try {
      const response = await fetch("/api/monitoring/dashboard?scope=all");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const newData = await response.json();
      setData(newData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch monitoring data");
      console.error("Failed to fetch monitoring data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchMonitoringData, autoRefresh]);

  const resolveAlert = async (alertId: string, resolution?: string) => {
    try {
      const response = await fetch("/api/monitoring/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve_alert",
          alertId,
          resolution,
        }),
      });

      if (response.ok) {
        await fetchMonitoringData(); // Refresh data
      }
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">Failed to load monitoring dashboard</p>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchMonitoringData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ClaimGuardian Monitoring</h1>
            <p className="text-gray-400 text-sm">
              Last updated: {lastUpdated.toLocaleTimeString()} | Status: {data.health?.status || "Unknown"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-xs rounded ${
                autoRefresh 
                  ? "bg-green-600 text-white" 
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              Auto Refresh {autoRefresh ? "ON" : "OFF"}
            </button>
            <button
              onClick={fetchMonitoringData}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 px-6">
        <nav className="flex space-x-8">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "performance", label: "Performance", icon: Cpu },
            { key: "business", label: "Business", icon: TrendingUp },
            { key: "ai", label: "AI Services", icon: Zap },
            { key: "security", label: "Security", icon: Shield },
            { key: "florida", label: "Florida Emergency", icon: AlertTriangle },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as any)}
              className={`flex items-center space-x-2 py-4 border-b-2 ${
                selectedTab === key
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {selectedTab === "overview" && <OverviewTab data={data} />}
        {selectedTab === "performance" && <PerformanceTab data={data} />}
        {selectedTab === "business" && <BusinessTab data={data} />}
        {selectedTab === "ai" && <AITab data={data} />}
        {selectedTab === "security" && <SecurityTab data={data} />}
        {selectedTab === "florida" && <FloridaTab data={data} />}
      </div>

      {/* Alerts Sidebar */}
      <AlertsSidebar alerts={data.alerts || []} onResolve={resolveAlert} />
    </div>
  );
}

function OverviewTab({ data }: { data: MonitoringData }) {
  const metrics = data.metrics;
  const health = data.health;

  if (!metrics || !health) return <div>No overview data available</div>;

  return (
    <div className="space-y-6">
      {/* System Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatusCard
          title="System Health"
          value={health.status}
          icon={health.status === "healthy" ? CheckCircle : 
                health.status === "degraded" ? AlertTriangle : XCircle}
          color={health.status === "healthy" ? "green" : 
                 health.status === "degraded" ? "yellow" : "red"}
        />
        <StatusCard
          title="Uptime"
          value={`${metrics.performance.uptime.toFixed(2)}%`}
          icon={Clock}
          color="blue"
        />
        <StatusCard
          title="Active Users"
          value={metrics.business.activeUsers.toLocaleString()}
          icon={Users}
          color="purple"
        />
        <StatusCard
          title="Daily Revenue"
          value={`$${metrics.business.revenue.daily.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Response Time"
          value={`${metrics.performance.responseTime.avg.toFixed(0)}ms`}
          trend="+5%"
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.performance.errorRate.toFixed(2)}%`}
          trend="-12%"
          icon={AlertCircle}
          color={metrics.performance.errorRate > 5 ? "red" : "green"}
        />
        <MetricCard
          title="AI Requests Today"
          value={metrics.business.aiRequestsToday.toLocaleString()}
          trend="+23%"
          icon={Zap}
          color="orange"
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics.performance.memoryUsage.percentage.toFixed(1)}%`}
          trend="+3%"
          icon={HardDrive}
          color={metrics.performance.memoryUsage.percentage > 80 ? "red" : "green"}
        />
        <MetricCard
          title="AI Costs Today"
          value={`$${(metrics.ai.openaiCosts.today + metrics.ai.geminiCosts.today).toFixed(2)}`}
          trend="+18%"
          icon={DollarSign}
          color="yellow"
        />
        <MetricCard
          title="Claims Created"
          value={metrics.business.claimsCreated.toLocaleString()}
          trend="+7%"
          icon={Globe}
          color="indigo"
        />
      </div>

      {/* Health Checks */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Health Checks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(health.checks).map(([name, check]) => (
            <div key={name} className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${
                check.status === "pass" ? "bg-green-500" :
                check.status === "warn" ? "bg-yellow-500" : "bg-red-500"
              }`} />
              <span className="text-gray-300 capitalize">{name}</span>
              {check.responseTime && (
                <span className="text-gray-500 text-sm">
                  ({check.responseTime.toFixed(0)}ms)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PerformanceTab({ data }: { data: MonitoringData }) {
  const metrics = data.metrics?.performance;
  if (!metrics) return <div>No performance data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.responseTime.avg.toFixed(0)}ms`}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="P95 Response Time"
          value={`${metrics.responseTime.p95.toFixed(0)}ms`}
          icon={Activity}
          color="orange"
        />
        <MetricCard
          title="Requests/Second"
          value={metrics.throughput.requestsPerSecond.toFixed(1)}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
          icon={AlertCircle}
          color={metrics.errorRate > 5 ? "red" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resource Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Memory</span>
                <span className="text-gray-400">{metrics.memoryUsage.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.memoryUsage.percentage > 80 ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${metrics.memoryUsage.percentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">CPU</span>
                <span className="text-gray-400">{metrics.cpuUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.cpuUsage > 80 ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${metrics.cpuUsage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Response Time Percentiles</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">P50</span>
              <span className="text-white">{metrics.responseTime.p50.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">P95</span>
              <span className="text-white">{metrics.responseTime.p95.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">P99</span>
              <span className="text-white">{metrics.responseTime.p99.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessTab({ data }: { data: MonitoringData }) {
  const metrics = data.metrics?.business;
  if (!metrics) return <div>No business data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers.toLocaleString()}
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="New Signups"
          value={metrics.newSignups.toLocaleString()}
          icon={UserPlus}
          color="green"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard
          title="Claims Created"
          value={metrics.claimsCreated.toLocaleString()}
          icon={Globe}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Daily</span>
              <span className="text-green-400 font-semibold">
                ${metrics.revenue.daily.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Monthly</span>
              <span className="text-green-400 font-semibold">
                ${metrics.revenue.monthly.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Annual</span>
              <span className="text-green-400 font-semibold">
                ${metrics.revenue.annual.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">AI Requests</span>
              <span className="text-white">{metrics.aiRequestsToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Documents Processed</span>
              <span className="text-white">{metrics.documentsProcessed.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AITab({ data }: { data: MonitoringData }) {
  const metrics = data.metrics?.ai;
  if (!metrics) return <div>No AI data available</div>;

  const totalDailyCosts = metrics.openaiCosts.today + metrics.geminiCosts.today;
  const totalMonthlyCosts = metrics.openaiCosts.thisMonth + metrics.geminiCosts.thisMonth;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Daily AI Costs"
          value={`$${totalDailyCosts.toFixed(2)}`}
          icon={DollarSign}
          color="yellow"
        />
        <MetricCard
          title="Monthly AI Costs"
          value={`$${totalMonthlyCosts.toFixed(2)}`}
          icon={DollarSign}
          color="orange"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate.toFixed(1)}%`}
          icon={CheckCircle}
          color={metrics.successRate > 95 ? "green" : "yellow"}
        />
        <MetricCard
          title="Cost Per User"
          value={`$${metrics.costPerUser.toFixed(2)}`}
          icon={Users}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Provider Costs</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">OpenAI</span>
                <span className="text-white">${metrics.openaiCosts.today.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(metrics.openaiCosts.today / totalDailyCosts) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Gemini</span>
                <span className="text-white">${metrics.geminiCosts.today.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${(metrics.geminiCosts.today / totalDailyCosts) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Token Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">OpenAI Tokens</span>
              <span className="text-white">{metrics.openaiCosts.totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Gemini Tokens</span>
              <span className="text-white">{metrics.geminiCosts.totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Avg Response Time</span>
              <span className="text-white">{metrics.averageResponseTime.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityTab({ data }: { data: MonitoringData }) {
  const metrics = data.metrics?.security;
  if (!metrics) return <div>No security data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Failed Logins"
          value={metrics.failedLogins.toLocaleString()}
          icon={AlertTriangle}
          color={metrics.failedLogins > 100 ? "red" : "yellow"}
        />
        <MetricCard
          title="Blocked IPs"
          value={metrics.blockedIPs.toLocaleString()}
          icon={Shield}
          color="blue"
        />
        <MetricCard
          title="Rate Limit Violations"
          value={metrics.rateLimitViolations.toLocaleString()}
          icon={AlertCircle}
          color={metrics.rateLimitViolations > 500 ? "red" : "orange"}
        />
        <MetricCard
          title="Security Alerts"
          value={metrics.securityAlerts.toLocaleString()}
          icon={AlertTriangle}
          color={metrics.securityAlerts > 10 ? "red" : "green"}
        />
      </div>
    </div>
  );
}

function FloridaTab({ data }: { data: MonitoringData }) {
  const metrics = data.metrics?.florida;
  if (!metrics) return <div>No Florida emergency data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Alerts"
          value={metrics.emergencyAlerts.length.toString()}
          icon={AlertTriangle}
          color={metrics.emergencyAlerts.some(a => a.level === "emergency") ? "red" : "yellow"}
        />
        <MetricCard
          title="Emergency Traffic"
          value={`${metrics.emergencyTraffic}/min`}
          icon={Activity}
          color="orange"
        />
        <MetricCard
          title="Disaster Claims"
          value={metrics.disasterClaims.toLocaleString()}
          icon={Globe}
          color="blue"
        />
        <MetricCard
          title="Affected Counties"
          value={metrics.affectedCounties.toString()}
          icon={MapPin}
          color="purple"
        />
      </div>

      {metrics.emergencyAlerts.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Active Emergency Alerts</h3>
          <div className="space-y-3">
            {metrics.emergencyAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className={`h-3 w-3 rounded-full ${
                    alert.level === "emergency" ? "bg-red-500" :
                    alert.level === "warning" ? "bg-orange-500" : "bg-yellow-500"
                  }`} />
                  <span className="text-white font-medium">{alert.county} County</span>
                  <span className="text-gray-300 capitalize">{alert.type}</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertsSidebar({ alerts, onResolve }: { 
  alerts: Alert[]; 
  onResolve: (id: string, resolution?: string) => Promise<void>; 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const criticalAlerts = alerts.filter(a => a.level === "critical" && !a.resolved);
  const otherAlerts = alerts.filter(a => a.level !== "critical" && !a.resolved);

  return (
    <>
      {/* Alert Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-full text-sm font-medium ${
          criticalAlerts.length > 0 
            ? "bg-red-600 text-white animate-pulse" 
            : alerts.length > 0 
            ? "bg-yellow-600 text-white" 
            : "bg-gray-600 text-gray-300"
        }`}
      >
        <AlertTriangle className="h-4 w-4 inline mr-1" />
        {alerts.filter(a => !a.resolved).length}
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Alerts</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {criticalAlerts.length > 0 && (
              <div className="mb-6">
                <h4 className="text-red-400 font-medium mb-3">Critical Alerts</h4>
                <div className="space-y-3">
                  {criticalAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onResolve={onResolve} />
                  ))}
                </div>
              </div>
            )}

            {otherAlerts.length > 0 && (
              <div>
                <h4 className="text-yellow-400 font-medium mb-3">Other Alerts</h4>
                <div className="space-y-3">
                  {otherAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onResolve={onResolve} />
                  ))}
                </div>
              </div>
            )}

            {alerts.filter(a => !a.resolved).length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-300">No active alerts</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AlertCard({ alert, onResolve }: { 
  alert: Alert; 
  onResolve: (id: string, resolution?: string) => Promise<void>; 
}) {
  return (
    <div className={`p-3 rounded border-l-4 ${
      alert.level === "critical" ? "border-red-500 bg-red-900/20" :
      alert.level === "error" ? "border-red-400 bg-red-900/10" :
      alert.level === "warning" ? "border-yellow-500 bg-yellow-900/20" :
      "border-blue-500 bg-blue-900/20"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="text-white font-medium text-sm">{alert.title}</h5>
          <p className="text-gray-300 text-xs mt-1">{alert.message}</p>
          <p className="text-gray-500 text-xs mt-2">
            {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => onResolve(alert.id)}
          className="ml-2 text-gray-400 hover:text-white"
          title="Resolve alert"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      </div>

      {alert.actions && alert.actions.length > 0 && (
        <div className="mt-3 space-x-2">
          {alert.actions.map((action, index) => (
            <button
              key={index}
              className={`px-2 py-1 text-xs rounded ${
                action.severity === "high" ? "bg-red-600 text-white" :
                action.severity === "medium" ? "bg-yellow-600 text-white" :
                "bg-gray-600 text-gray-300"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusCard({ title, value, icon: Icon, color }: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const colorClasses = {
    green: "text-green-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center">
        <Icon className={`h-8 w-8 ${colorClasses[color as keyof typeof colorClasses]}`} />
        <div className="ml-4">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color }: {
  title: string;
  value: string;
  trend?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const colorClasses = {
    green: "text-green-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
    indigo: "text-indigo-400",
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <Icon className={`h-6 w-6 ${colorClasses[color as keyof typeof colorClasses]}`} />
        {trend && (
          <span className={`text-xs ${
            trend.startsWith("+") ? "text-green-400" : "text-red-400"
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// Mock icons for missing ones
const UserPlus = Users;
const MapPin = Globe;