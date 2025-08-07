/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Error tracking dashboard component for comprehensive error visualization and management"
 * @dependencies ["react", "lucide-react", "@/lib/error-tracking/error-tracker"]
 * @status stable
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  AlertTriangle,
  AlertCircle,
  Bug,
  Clock,
  Code,
  Database,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Download,
  BarChart3,
  Calendar,
} from "lucide-react";

// Types from our error tracking system
interface ErrorDetails {
  id: string;
  type: "javascript" | "api" | "database" | "ai" | "network" | "validation" | "security" | "business";
  severity: "low" | "medium" | "high" | "critical";
  name: string;
  message: string;
  stack?: string;
  source?: {
    file: string;
    line: number;
    column: number;
    function?: string;
  };
  context: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    timestamp: string;
    environment: string;
  };
  metadata: Record<string, unknown>;
  fingerprint: string;
  firstOccurrence: string;
  lastOccurrence: string;
  occurrenceCount: number;
  resolved: boolean;
  resolution?: {
    type: "auto" | "manual";
    description: string;
    timestamp: string;
    resolvedBy?: string;
  };
  tags: string[];
  breadcrumbs: Array<{
    timestamp: string;
    category: "navigation" | "user" | "http" | "console" | "query" | "auth";
    message: string;
    level: "info" | "warning" | "error";
    data?: Record<string, unknown>;
  }>;
}

interface ErrorAggregation {
  fingerprint: string;
  count: number;
  affectedUsers: number;
  firstSeen: string;
  lastSeen: string;
  trend: "increasing" | "decreasing" | "stable";
  errorRate: number;
  impact: "low" | "medium" | "high" | "critical";
  similarErrors: string[];
  suggestedActions: Array<{
    action: string;
    priority: "low" | "medium" | "high";
    automated: boolean;
    description: string;
  }>;
}

interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  criticalErrors: number;
  resolvedErrors: number;
  topErrorTypes: Array<{ type: string; count: number }>;
  errorTrend: "increasing" | "decreasing" | "stable";
  mttr: number;
  affectedUsers: number;
}

interface ErrorDashboardData {
  aggregations?: ErrorAggregation[];
  metrics?: ErrorMetrics;
  error?: ErrorDetails;
  meta: {
    timestamp: string;
    scope: string;
    timeRange: string;
    version: string;
  };
}

export function ErrorDashboard() {
  const [data, setData] = useState<ErrorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"overview" | "aggregations" | "details">("overview");
  const [filters, setFilters] = useState({
    timeRange: "24h",
    errorType: "",
    severity: "",
    resolved: "",
    searchQuery: "",
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const fetchErrorData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        scope: selectedTab === "details" && selectedError ? "details" : "all",
        timeRange: filters.timeRange,
        ...(filters.errorType && { type: filters.errorType }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.resolved && { resolved: filters.resolved }),
        ...(selectedError && { errorId: selectedError }),
      });

      const response = await fetch(`/api/errors?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const newData = await response.json();
      setData(newData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch error data");
      console.error("Failed to fetch error data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTab, selectedError, filters]);

  useEffect(() => {
    fetchErrorData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchErrorData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchErrorData, autoRefresh]);

  const resolveError = async (errorId: string, resolution?: string) => {
    try {
      const response = await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve_error",
          errorId,
          resolution,
        }),
      });

      if (response.ok) {
        await fetchErrorData(); // Refresh data
      }
    } catch (err) {
      console.error("Failed to resolve error:", err);
    }
  };

  const exportErrors = async () => {
    try {
      // Generate CSV export
      const csvData = data?.aggregations?.map(agg => ({
        fingerprint: agg.fingerprint,
        count: agg.count,
        affectedUsers: agg.affectedUsers,
        trend: agg.trend,
        impact: agg.impact,
        firstSeen: agg.firstSeen,
        lastSeen: agg.lastSeen,
      })) || [];

      const csv = [
        Object.keys(csvData[0] || {}).join(","),
        ...csvData.map(row => Object.values(row).join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `error-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export errors:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading error dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">Failed to load error dashboard</p>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchErrorData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Bug className="h-8 w-8 text-red-500 mr-3" />
              Error Tracking Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              Last updated: {lastUpdated.toLocaleTimeString()} | 
              Total Errors: {data.metrics?.totalErrors.toLocaleString() || 0}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportErrors}
              className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
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
              onClick={fetchErrorData}
              className="flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4 text-gray-400" />
            <select
              value={filters.errorType}
              onChange={(e) => setFilters({ ...filters, errorType: e.target.value })}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value="">All Types</option>
              <option value="javascript">JavaScript</option>
              <option value="api">API</option>
              <option value="database">Database</option>
              <option value="ai">AI Services</option>
              <option value="network">Network</option>
              <option value="validation">Validation</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-gray-400" />
            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value="">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search errors..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm flex-1 max-w-md"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 px-6">
        <nav className="flex space-x-8">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "aggregations", label: "Error Groups", icon: Bug },
            { key: "details", label: "Error Details", icon: Eye },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setSelectedTab(key as any);
                if (key !== "details") setSelectedError(null);
              }}
              className={`flex items-center space-x-2 py-4 border-b-2 ${
                selectedTab === key
                  ? "border-red-500 text-red-400"
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
        {selectedTab === "aggregations" && (
          <AggregationsTab 
            data={data} 
            onSelectError={setSelectedError} 
            onResolveError={resolveError}
          />
        )}
        {selectedTab === "details" && (
          <DetailsTab 
            data={data} 
            selectedError={selectedError}
            onResolveError={resolveError}
          />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: ErrorDashboardData }) {
  const metrics = data.metrics;
  if (!metrics) return <div className="text-gray-400">No metrics data available</div>;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Errors"
          value={metrics.totalErrors.toLocaleString()}
          trend={metrics.errorTrend}
          icon={AlertCircle}
          color="red"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
          trend={metrics.errorTrend}
          icon={TrendingUp}
          color={metrics.errorRate > 5 ? "red" : "yellow"}
        />
        <MetricCard
          title="Critical Errors"
          value={metrics.criticalErrors.toLocaleString()}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="MTTR"
          value={`${metrics.mttr.toFixed(1)}min`}
          icon={Clock}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resolution Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resolution Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Resolved</span>
              <span className="text-green-400 font-semibold">
                {metrics.resolvedErrors.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Unresolved</span>
              <span className="text-red-400 font-semibold">
                {(metrics.totalErrors - metrics.resolvedErrors).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Affected Users</span>
              <span className="text-orange-400 font-semibold">
                {metrics.affectedUsers.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Top Error Types */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Error Types</h3>
          <div className="space-y-3">
            {metrics.topErrorTypes.map(({ type, count }) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-gray-300 capitalize">{type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-red-500"
                      style={{ 
                        width: `${(count / Math.max(...metrics.topErrorTypes.map(t => t.count))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-white text-sm w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AggregationsTab({ 
  data, 
  onSelectError, 
  onResolveError 
}: { 
  data: ErrorDashboardData; 
  onSelectError: (errorId: string) => void;
  onResolveError: (errorId: string, resolution?: string) => Promise<void>;
}) {
  const aggregations = data.aggregations;
  if (!aggregations) return <div className="text-gray-400">No aggregation data available</div>;

  return (
    <div className="space-y-4">
      {aggregations.map((agg) => (
        <ErrorAggregationCard 
          key={agg.fingerprint} 
          aggregation={agg}
          onSelect={onSelectError}
          onResolve={onResolveError}
        />
      ))}
    </div>
  );
}

function DetailsTab({ 
  data, 
  selectedError,
  onResolveError 
}: { 
  data: ErrorDashboardData; 
  selectedError: string | null;
  onResolveError: (errorId: string, resolution?: string) => Promise<void>;
}) {
  const errorDetails = data.error;

  if (!selectedError) {
    return (
      <div className="text-center py-12">
        <Bug className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Select an error from the Error Groups tab to view details</p>
      </div>
    );
  }

  if (!errorDetails) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <p className="text-gray-400">Error details not found</p>
      </div>
    );
  }

  return <ErrorDetailsCard error={errorDetails} onResolve={onResolveError} />;
}

function MetricCard({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  color 
}: {
  title: string;
  value: string;
  trend?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const colorClasses = {
    red: "text-red-400",
    yellow: "text-yellow-400", 
    blue: "text-blue-400",
    green: "text-green-400",
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <Icon className={`h-6 w-6 ${colorClasses[color as keyof typeof colorClasses]}`} />
        {trend && (
          <div className={`flex items-center text-xs ${
            trend === "increasing" ? "text-red-400" :
            trend === "decreasing" ? "text-green-400" : "text-gray-400"
          }`}>
            {trend === "increasing" ? <TrendingUp className="h-3 w-3 mr-1" /> :
             trend === "decreasing" ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function ErrorAggregationCard({ 
  aggregation, 
  onSelect,
  onResolve
}: { 
  aggregation: ErrorAggregation;
  onSelect: (errorId: string) => void;
  onResolve: (errorId: string, resolution?: string) => Promise<void>;
}) {
  const getSeverityColor = (impact: string) => {
    switch (impact) {
      case "critical": return "border-red-500 bg-red-900/20";
      case "high": return "border-orange-500 bg-orange-900/20";
      case "medium": return "border-yellow-500 bg-yellow-900/20";
      default: return "border-blue-500 bg-blue-900/20";
    }
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getSeverityColor(aggregation.impact)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-white font-medium">Error Group #{aggregation.fingerprint.slice(0, 8)}</h4>
            <span className={`px-2 py-1 text-xs rounded ${
              aggregation.impact === "critical" ? "bg-red-600 text-white" :
              aggregation.impact === "high" ? "bg-orange-600 text-white" :
              aggregation.impact === "medium" ? "bg-yellow-600 text-black" :
              "bg-blue-600 text-white"
            }`}>
              {aggregation.impact}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Count:</span>
              <span className="text-white ml-2">{aggregation.count}</span>
            </div>
            <div>
              <span className="text-gray-400">Affected Users:</span>
              <span className="text-white ml-2">{aggregation.affectedUsers}</span>
            </div>
            <div>
              <span className="text-gray-400">Error Rate:</span>
              <span className="text-white ml-2">{aggregation.errorRate.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Trend:</span>
              <span className={`ml-2 ${
                aggregation.trend === "increasing" ? "text-red-400" :
                aggregation.trend === "decreasing" ? "text-green-400" : "text-gray-300"
              }`}>
                {aggregation.trend}
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-400">
            First seen: {new Date(aggregation.firstSeen).toLocaleString()} | 
            Last seen: {new Date(aggregation.lastSeen).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onSelect(aggregation.fingerprint)}
            className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </button>
          <button
            onClick={() => onResolve(aggregation.fingerprint)}
            className="flex items-center px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolve
          </button>
        </div>
      </div>

      {aggregation.suggestedActions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-400 mb-2">Suggested Actions:</p>
          <div className="flex flex-wrap gap-2">
            {aggregation.suggestedActions.slice(0, 3).map((action, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs rounded ${
                  action.priority === "high" ? "bg-red-600 text-white" :
                  action.priority === "medium" ? "bg-orange-600 text-white" :
                  "bg-gray-600 text-gray-300"
                }`}
              >
                {action.action}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorDetailsCard({ 
  error, 
  onResolve 
}: { 
  error: ErrorDetails;
  onResolve: (errorId: string, resolution?: string) => Promise<void>;
}) {
  const [showStack, setShowStack] = useState(false);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(false);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "high": return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "medium": return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              {getSeverityIcon(error.severity)}
              <h2 className="text-xl font-bold text-white">{error.name}</h2>
              <span className={`px-2 py-1 text-xs rounded ${
                error.severity === "critical" ? "bg-red-600 text-white" :
                error.severity === "high" ? "bg-orange-600 text-white" :
                error.severity === "medium" ? "bg-yellow-600 text-black" :
                "bg-blue-600 text-white"
              }`}>
                {error.severity}
              </span>
              {error.resolved && (
                <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                  Resolved
                </span>
              )}
            </div>
            <p className="text-gray-300 mb-4">{error.message}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="text-white ml-2 capitalize">{error.type}</span>
              </div>
              <div>
                <span className="text-gray-400">Occurrences:</span>
                <span className="text-white ml-2">{error.occurrenceCount}</span>
              </div>
              <div>
                <span className="text-gray-400">First Seen:</span>
                <span className="text-white ml-2">
                  {new Date(error.firstOccurrence).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Last Seen:</span>
                <span className="text-white ml-2">
                  {new Date(error.lastOccurrence).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {!error.resolved && (
            <button
              onClick={() => onResolve(error.id)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve Error
            </button>
          )}
        </div>
      </div>

      {/* Context Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Context</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {error.context.url && (
            <div>
              <span className="text-gray-400">URL:</span>
              <span className="text-white ml-2 font-mono text-xs">{error.context.url}</span>
            </div>
          )}
          {error.context.userId && (
            <div>
              <span className="text-gray-400">User ID:</span>
              <span className="text-white ml-2 font-mono">{error.context.userId}</span>
            </div>
          )}
          {error.context.userAgent && (
            <div>
              <span className="text-gray-400">User Agent:</span>
              <span className="text-white ml-2 font-mono text-xs">{error.context.userAgent}</span>
            </div>
          )}
          <div>
            <span className="text-gray-400">Environment:</span>
            <span className="text-white ml-2">{error.context.environment}</span>
          </div>
        </div>
      </div>

      {/* Source Location */}
      {error.source && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Source Location</h3>
          <div className="font-mono text-sm">
            <div className="text-blue-400">
              {error.source.file}:{error.source.line}:{error.source.column}
            </div>
            {error.source.function && (
              <div className="text-gray-300 mt-1">
                in function: <span className="text-yellow-400">{error.source.function}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stack Trace */}
      {error.stack && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Stack Trace</h3>
            <button
              onClick={() => setShowStack(!showStack)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {showStack ? "Hide" : "Show"} Stack Trace
            </button>
          </div>
          {showStack && (
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-x-auto">
              <code className="text-gray-300">{error.stack}</code>
            </pre>
          )}
        </div>
      )}

      {/* Breadcrumbs */}
      {error.breadcrumbs.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Breadcrumbs</h3>
            <button
              onClick={() => setShowBreadcrumbs(!showBreadcrumbs)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {showBreadcrumbs ? "Hide" : "Show"} Breadcrumbs ({error.breadcrumbs.length})
            </button>
          </div>
          {showBreadcrumbs && (
            <div className="space-y-2">
              {error.breadcrumbs.map((breadcrumb, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-500 text-xs font-mono">
                    {new Date(breadcrumb.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    breadcrumb.level === "error" ? "bg-red-600 text-white" :
                    breadcrumb.level === "warning" ? "bg-yellow-600 text-black" :
                    "bg-blue-600 text-white"
                  }`}>
                    {breadcrumb.category}
                  </span>
                  <span className="text-gray-300">{breadcrumb.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags and Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {error.tags.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {error.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            {JSON.stringify(error.metadata, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}