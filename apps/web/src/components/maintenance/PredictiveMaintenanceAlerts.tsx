'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  Droplets,
  Zap,
  Wind,
  Thermometer,
  Shield,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Download,
  Bell,
  Settings
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface MaintenanceAlert {
  id: string;
  system: string;
  component: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  predictedFailure: string; // date
  currentCondition: number; // 0-100
  estimatedCost: number;
  preventiveCost: number;
  recommendation: string;
  lastInspection?: string;
  icon: typeof Home;
}

interface SystemHealth {
  system: string;
  health: number;
  trend: 'improving' | 'stable' | 'declining';
  lastMaintenance: string;
  nextScheduled: string;
}

interface MaintenanceHistory {
  date: string;
  system: string;
  type: 'preventive' | 'repair' | 'replacement';
  cost: number;
  prevented?: boolean;
}

interface RiskAssessment {
  category: string;
  current: number;
  predicted: number;
  optimal: number;
}

const systemIcons = {
  roof: Home,
  hvac: Thermometer,
  plumbing: Droplets,
  electrical: Zap,
  foundation: Shield,
  windows: Wind,
  appliances: Settings
};

export function PredictiveMaintenanceAlerts() {
  const [scanning, setScanning] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistory[]>([]);
  const [riskMatrix, setRiskMatrix] = useState<RiskAssessment[]>([]);

  const [maintenanceTimeline, setMaintenanceTimeline] = useState<any[]>([]);
  
  const totalSavings = maintenanceTimeline.reduce((sum, month) => sum + (month.saved || 0), 0);
  const totalPreventive = maintenanceTimeline.reduce((sum, month) => sum + (month.preventive || 0), 0);
  const totalRepairs = maintenanceTimeline.reduce((sum, month) => sum + (month.repairs || 0), 0);

  useEffect(() => {
    loadMaintenanceData();
  }, [selectedProperty]);

  const loadMaintenanceData = async () => {
    if (!selectedProperty) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-maintenance', {
        body: { property_id: selectedProperty }
      });

      if (error) throw error;

      if (data) {
        setAlerts(data.alerts || []);
        setSystemHealth(data.systemHealth || []);
        setMaintenanceTimeline(data.timeline || []);
        setRiskMatrix(data.riskMatrix || []);
        setMaintenanceHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading maintenance data:', error);
      // Set empty arrays on error
      setAlerts([]);
      setSystemHealth([]);
      setMaintenanceTimeline([]);
      setRiskMatrix([]);
      setMaintenanceHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const runPredictiveScan = async () => {
    if (!selectedProperty) {
      toast.error('Please select a property first');
      return;
    }
    
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-maintenance-scan', {
        body: { 
          property_id: selectedProperty,
          scan_type: 'comprehensive'
        }
      });

      if (error) throw error;

      if (data?.predictions) {
        setAlerts(data.predictions);
        toast.success(`Predictive scan complete - ${data.predictions.length} issues detected`);
      }
    } catch (error) {
      console.error('Error running scan:', error);
      toast.error('Failed to complete scan');
    } finally {
      setScanning(false);
    }
  };

  const scheduleMaintenanceuler = (alert: MaintenanceAlert) => {
    toast.success(`Maintenance scheduled for ${alert.component}`);
    // In production, this would create a calendar event and notify contractors
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return <Badge className={colors[urgency as keyof typeof colors]}>{urgency} priority</Badge>;
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#22c55e';
    if (health >= 60) return '#eab308';
    if (health >= 40) return '#f97316';
    return '#ef4444';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Wrench className="h-6 w-6" />
            <span>Predictive Maintenance System</span>
          </h2>
          <p className="text-gray-600">AI-powered predictions to prevent costly repairs</p>
        </div>
        <Button onClick={runPredictiveScan} disabled={scanning}>
          {scanning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Scanning Systems...
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Run Predictive Scan
            </>
          )}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <Badge className="bg-orange-500">{alerts.filter(a => a.urgency === 'high' || a.urgency === 'critical').length}</Badge>
            </div>
            <p className="text-2xl font-bold">{alerts.length}</p>
            <p className="text-sm text-gray-500">Active Alerts</p>
            <p className="text-xs text-orange-600 mt-1">
              {alerts.filter(a => a.urgency === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">${totalSavings.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Saved YTD</p>
            <p className="text-xs text-green-600 mt-1">Through prevention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <Badge variant="outline">Health</Badge>
            </div>
            <p className="text-2xl font-bold">
              {systemHealth.length > 0 ? Math.round(systemHealth.reduce((sum, s) => sum + s.health, 0) / systemHealth.length) : 0}%
            </p>
            <p className="text-sm text-gray-500">Overall Health</p>
            <Progress 
              value={systemHealth.length > 0 ? Math.round(systemHealth.reduce((sum, s) => sum + s.health, 0) / systemHealth.length) : 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <Badge variant="outline">Schedule</Badge>
            </div>
            <p className="text-2xl font-bold">8</p>
            <p className="text-sm text-gray-500">Upcoming Tasks</p>
            <p className="text-xs text-purple-600 mt-1">Next: Feb 20</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alert Banner */}
      {alerts.some(a => a.urgency === 'critical') && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Critical Maintenance Required</AlertTitle>
          <AlertDescription className="text-red-700">
            {alerts.filter(a => a.urgency === 'critical').length} system(s) require immediate attention to prevent failure.
            Estimated prevention savings: ${alerts
              .filter(a => a.urgency === 'critical')
              .reduce((sum, a) => sum + (a.estimatedCost - a.preventiveCost), 0)
              .toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="savings">Cost Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Maintenance Alerts</CardTitle>
              <CardDescription>
                AI-predicted failures and recommended preventive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const Icon = alert.icon;
                  const daysUntilFailure = Math.floor(
                    (new Date(alert.predictedFailure).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Icon className={`h-6 w-6 mt-1 ${getUrgencyColor(alert.urgency)}`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">{alert.system} - {alert.component}</h4>
                              {getUrgencyBadge(alert.urgency)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500">Condition</p>
                                <div className="flex items-center space-x-2">
                                  <Progress value={alert.currentCondition} className="flex-1 h-2" />
                                  <span className="text-sm font-medium">{alert.currentCondition}%</span>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Predicted Failure</p>
                                <p className="text-sm font-medium">
                                  {daysUntilFailure > 0 ? `In ${daysUntilFailure} days` : 'Imminent'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Cost to Prevent</p>
                                <p className="text-sm">
                                  <span className="font-bold text-green-600">${alert.preventiveCost}</span>
                                  <span className="text-gray-400 ml-2">vs ${alert.estimatedCost.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                            
                            <Alert className="mb-3">
                              <AlertDescription className="text-sm">
                                {alert.recommendation}
                              </AlertDescription>
                            </Alert>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                Last inspection: {alert.lastInspection || 'Never'}
                              </p>
                              
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => scheduleMaintenanceuler(alert)}
                                >
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Schedule
                                </Button>
                                <Button 
                                  size="sm"
                                  variant={alert.urgency === 'critical' ? 'destructive' : 'default'}
                                >
                                  <Wrench className="h-4 w-4 mr-1" />
                                  Fix Now
                                </Button>
                              </div>
                            </div>
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

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>System Health Overview</CardTitle>
              <CardDescription>
                Real-time health monitoring of all home systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((system) => {
                  const Icon = systemIcons[system.system.toLowerCase() as keyof typeof systemIcons] || Home;
                  
                  return (
                    <div key={system.system} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4 flex-1">
                        <Icon className="h-6 w-6 text-gray-500" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{system.system}</h4>
                            <div className="flex items-center space-x-2">
                              {getTrendIcon(system.trend)}
                              <span className="text-sm text-gray-500">{system.trend}</span>
                            </div>
                          </div>
                          <Progress 
                            value={system.health} 
                            className="h-3"
                            style={{ 
                              '--progress-background': getHealthColor(system.health) 
                            } as React.CSSProperties}
                          />
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Last: {system.lastMaintenance}</span>
                            <span>Next: {system.nextScheduled}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: getHealthColor(system.health) }}>
                            {system.health}%
                          </p>
                          <p className="text-xs text-gray-500">Health Score</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Timeline</CardTitle>
              <CardDescription>
                Preventive vs repair costs over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={maintenanceTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="preventive" 
                    stackId="1" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.6}
                    name="Preventive Costs"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="repairs" 
                    stackId="1" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6}
                    name="Repair Costs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saved" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Amount Saved"
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">${totalPreventive.toLocaleString()}</p>
                  <p className="text-sm text-green-700">Preventive Costs</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Wrench className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">${totalRepairs.toLocaleString()}</p>
                  <p className="text-sm text-red-700">Repair Costs</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">${totalSavings.toLocaleString()}</p>
                  <p className="text-sm text-blue-700">Total Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis Matrix</CardTitle>
              <CardDescription>
                Current vs predicted failure risk by system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={riskMatrix}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Current Risk" 
                    dataKey="current" 
                    stroke="#f97316" 
                    fill="#f97316" 
                    fillOpacity={0.6} 
                  />
                  <Radar 
                    name="Predicted Risk (6mo)" 
                    dataKey="predicted" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.4} 
                  />
                  <Radar 
                    name="Optimal Level" 
                    dataKey="optimal" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.3} 
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings">
          <Card>
            <CardHeader>
              <CardTitle>Cost Savings Analysis</CardTitle>
              <CardDescription>
                Financial impact of predictive maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Potential Savings This Month</h3>
                      <p className="text-sm text-green-700">By addressing all current alerts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">
                        ${alerts.reduce((sum, a) => sum + (a.estimatedCost - a.preventiveCost), 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-green-700">vs emergency repairs</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between py-2 border-t border-green-200">
                        <div className="flex items-center space-x-3">
                          <alert.icon className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">{alert.component}</span>
                        </div>
                        <div className="text-sm text-green-700">
                          Save ${(alert.estimatedCost - alert.preventiveCost).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Insurance Benefits</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Lower premiums with maintenance records
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Reduced claim denials
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Faster claim approvals
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Property Value Impact</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                        +5-10% property value retention
                      </li>
                      <li className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                        Better resale documentation
                      </li>
                      <li className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                        Extended system lifespans
                      </li>
                    </ul>
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