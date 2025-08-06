'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Zap,
  TrendingUp,
  TrendingDown,
  Server,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SystemMetric {
  name: string;
  value: number | string;
  unit?: string;
  status: 'healthy' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

interface EdgeFunctionStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastRun?: string;
  executions: number;
  avgResponseTime: number;
  errorRate: number;
}

interface DatabaseMetric {
  connections: number;
  maxConnections: number;
  queryTime: number;
  cacheHitRate: number;
  storageUsed: number;
  storageLimit: number;
}

export function SystemMonitoringDashboard() {
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds
  const supabase = createClient();

  // Mock data for demonstration
  const systemMetrics: SystemMetric[] = [
    { name: 'API Uptime', value: '99.98%', status: 'healthy', trend: 'stable' },
    { name: 'Response Time', value: 142, unit: 'ms', status: 'healthy', trend: 'down', change: -8 },
    { name: 'Active Users', value: 1284, status: 'healthy', trend: 'up', change: 12 },
    { name: 'Error Rate', value: '0.02%', status: 'healthy', trend: 'stable' },
  ];

  const edgeFunctions: EdgeFunctionStatus[] = [
    { 
      name: 'smart-notification-engine', 
      status: 'active', 
      lastRun: '2 min ago',
      executions: 15420,
      avgResponseTime: 89,
      errorRate: 0.01
    },
    { 
      name: 'community-intelligence', 
      status: 'active', 
      lastRun: '5 min ago',
      executions: 8234,
      avgResponseTime: 234,
      errorRate: 0.02
    },
    { 
      name: 'damage-doc-copilot', 
      status: 'active', 
      lastRun: '12 min ago',
      executions: 5621,
      avgResponseTime: 456,
      errorRate: 0.03
    },
    { 
      name: 'policy-chat', 
      status: 'active', 
      lastRun: '18 min ago',
      executions: 3412,
      avgResponseTime: 312,
      errorRate: 0.01
    }
  ];

  const performanceData = [
    { time: '00:00', requests: 245, responseTime: 120, errors: 2 },
    { time: '04:00', requests: 189, responseTime: 115, errors: 1 },
    { time: '08:00', requests: 456, responseTime: 135, errors: 3 },
    { time: '12:00', requests: 678, responseTime: 142, errors: 4 },
    { time: '16:00', requests: 589, responseTime: 138, errors: 2 },
    { time: '20:00', requests: 412, responseTime: 125, errors: 1 },
    { time: '24:00', requests: 234, responseTime: 118, errors: 1 },
  ];

  const databaseMetrics: DatabaseMetric = {
    connections: 42,
    maxConnections: 100,
    queryTime: 23,
    cacheHitRate: 94.5,
    storageUsed: 2.4,
    storageLimit: 8
  };

  useEffect(() => {
    loadMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(loadMonitoringData, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refreshInterval]);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      // Load actual monitoring data from Supabase
      // This would connect to your monitoring infrastructure
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
      case 'error':
        return 'text-red-500';
      case 'inactive':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <Badge className="bg-green-500">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'critical':
      case 'error':
        return <Badge className="bg-red-500">Critical</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-gray-600">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadMonitoringData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Now
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Report
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className={`h-5 w-5 ${getStatusColor(metric.status)}`} />
                {metric.trend && (
                  <div className="flex items-center space-x-1">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-500" />
                    )}
                    {metric.change && (
                      <span className="text-sm font-medium">
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {metric.value}{metric.unit && <span className="text-lg text-gray-500 ml-1">{metric.unit}</span>}
                </p>
                <p className="text-sm text-gray-500">{metric.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Monitoring Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                Request volume and response times over the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="requests"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Requests"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#82ca9d"
                    name="Response Time (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edge-functions">
          <Card>
            <CardHeader>
              <CardTitle>Edge Functions Status</CardTitle>
              <CardDescription>
                Monitor the health and performance of deployed Edge Functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {edgeFunctions.map((func) => (
                  <div key={func.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Zap className={`h-5 w-5 ${getStatusColor(func.status)}`} />
                        <div>
                          <p className="font-medium">{func.name}</p>
                          <p className="text-sm text-gray-500">Last run: {func.lastRun}</p>
                        </div>
                      </div>
                      {getStatusBadge(func.status)}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Executions</p>
                        <p className="font-medium">{func.executions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Response</p>
                        <p className="font-medium">{func.avgResponseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Error Rate</p>
                        <p className="font-medium">{func.errorRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Metrics</CardTitle>
              <CardDescription>
                Supabase database performance and resource utilization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Connections</span>
                    <span className="text-sm text-gray-500">
                      {databaseMetrics.connections} / {databaseMetrics.maxConnections}
                    </span>
                  </div>
                  <Progress value={(databaseMetrics.connections / databaseMetrics.maxConnections) * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Storage Used</span>
                    <span className="text-sm text-gray-500">
                      {databaseMetrics.storageUsed}GB / {databaseMetrics.storageLimit}GB
                    </span>
                  </div>
                  <Progress value={(databaseMetrics.storageUsed / databaseMetrics.storageLimit) * 100} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Avg Query Time</span>
                    </div>
                    <span className="text-xl font-bold">{databaseMetrics.queryTime}ms</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Cache Hit Rate</span>
                    </div>
                    <span className="text-xl font-bold">{databaseMetrics.cacheHitRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Recent alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">High API Usage</p>
                    <p className="text-sm text-yellow-700">
                      API usage at 85% of monthly limit. Consider upgrading plan.
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Database Backup Complete</p>
                    <p className="text-sm text-green-700">
                      Daily backup completed successfully.
                    </p>
                    <p className="text-xs text-green-600 mt-1">6 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Edge Functions Deployed</p>
                    <p className="text-sm text-blue-700">
                      2 new Edge Functions deployed successfully.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Just now</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}