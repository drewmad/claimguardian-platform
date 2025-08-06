'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import {
  AlertTriangle,
  CloudRain,
  Wind,
  Thermometer,
  Shield,
  Activity,
  TrendingUp,
  MapPin,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Home,
  DollarSign,
  Users,
  Zap,
  ChevronRight,
  ExternalLink,
  Bell,
  Info
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

interface EmergencyData {
  location: { latitude: number; longitude: number };
  timestamp: string;
  data: {
    weather?: any;
    fema?: any;
    alerts?: any;
    predictions?: any;
  };
  riskAssessment?: any;
  recommendations?: any;
}

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  moderate: '#eab308',
  low: '#22c55e',
  minimal: '#10b981'
};

const SEVERITY_COLORS = {
  extreme: '#dc2626',
  severe: '#ea580c',
  moderate: '#f59e0b',
  minor: '#3b82f6',
  unknown: '#6b7280'
};

export default function EmergencyCenter() {
  const [data, setData] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [propertyId] = useState('current-property-id'); // Get from context/session

  const fetchEmergencyData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch('/api/emergency-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          includeWeather: true,
          includeFEMA: true,
          includeAlerts: true,
          includePredictions: true
        })
      });

      if (!response.ok) throw new Error('Failed to fetch emergency data');
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching emergency data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchEmergencyData();

    // Auto-refresh every 5 minutes
    const interval = autoRefresh ? setInterval(() => {
      fetchEmergencyData(false);
    }, 5 * 60 * 1000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchEmergencyData, autoRefresh]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading emergency data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const riskLevel = data?.riskAssessment?.riskLevel || 'unknown';
  const riskScore = data?.riskAssessment?.overallRisk || 0;
  const activeAlerts = data?.data?.alerts?.active || [];
  const weather = data?.data?.weather;
  const fema = data?.data?.fema;
  const predictions = data?.data?.predictions;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Emergency Command Center</h1>
            <p className="text-gray-400 mt-1">
              Real-time monitoring • Last updated: {data ? format(parseISO(data.timestamp), 'MMM d, HH:mm') : 'Never'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'border-green-500' : ''}
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-500' : ''}`} />
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEmergencyData(false)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Critical Alerts */}
        {activeAlerts.length > 0 && (
          <Alert className={`border-2 ${
            activeAlerts[0].severity === 'extreme' ? 'border-red-500 bg-red-950' :
            activeAlerts[0].severity === 'severe' ? 'border-orange-500 bg-orange-950' :
            'border-yellow-500 bg-yellow-950'
          }`}>
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">
              {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                {activeAlerts.slice(0, 3).map((alert: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5">
                      {alert.severity}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold">{alert.event || alert.headline}</p>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {alert.description || alert.instruction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Overall Risk</p>
                  <p className="text-3xl font-bold text-white mt-1">{riskScore}%</p>
                  <Badge 
                    className="mt-2"
                    style={{ backgroundColor: RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] }}
                  >
                    {riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <Shield className={`h-12 w-12`} style={{ color: RISK_COLORS[riskLevel] }} />
              </div>
              <Progress value={riskScore} className="mt-4" />
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Alerts</p>
                  <p className="text-3xl font-bold text-white mt-1">{activeAlerts.length}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {data?.data?.alerts?.highestSeverity || 'None'}
                  </p>
                </div>
                <Bell className="h-12 w-12 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Disaster Risk</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {Math.round((predictions?.mediumTerm?.disasterProbability || 0) * 100)}%
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Next 7 days</p>
                </div>
                <AlertCircle className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Current Weather</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {weather?.current?.temperature_f || '--'}°F
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {weather?.current?.conditions || 'Unknown'}
                  </p>
                </div>
                <Thermometer className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="disasters">Disasters</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Risk Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Risk Factor Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { factor: 'Weather', value: data?.riskAssessment?.factors?.weather || 0 },
                    { factor: 'Disasters', value: data?.riskAssessment?.factors?.disasters || 0 },
                    { factor: 'Alerts', value: data?.riskAssessment?.factors?.alerts || 0 },
                    { factor: 'Predictions', value: data?.riskAssessment?.factors?.predictions || 0 }
                  ]}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="factor" stroke="#9ca3af" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                    <Radar name="Risk Level" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-4">
                  <p className="text-gray-400 text-sm">Primary Concern:</p>
                  <p className="text-white font-semibold">
                    {data?.riskAssessment?.primaryConcern || 'No immediate concerns'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weather Station</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Connected
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">FEMA Zone</span>
                      <span className="text-white">Active Monitoring</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Insurance</span>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        Verified
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    FEMA Programs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fema?.activeDisasters?.length > 0 ? (
                      fema.activeDisasters[0].programs?.map((program: string) => (
                        <div key={program} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-white">{program} Available</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">No active programs</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">County Disasters</span>
                      <span className="text-white">{fema?.statistics?.totalDisasters || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">PA Projects</span>
                      <span className="text-white">{fema?.nearbyPAProjects?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">HM Grants</span>
                      <span className="text-white">{fema?.hazardMitigation?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            {/* Current Conditions Detail */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Current Weather Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Temperature</p>
                    <p className="text-2xl font-bold text-white">
                      {weather?.current?.temperature_f || '--'}°F
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Wind Speed</p>
                    <p className="text-2xl font-bold text-white">
                      {weather?.current?.wind_speed_mph || '--'} mph
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Humidity</p>
                    <p className="text-2xl font-bold text-white">
                      {weather?.current?.humidity_percent || '--'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Precipitation</p>
                    <p className="text-2xl font-bold text-white">
                      {weather?.current?.precipitation || '0'}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weather Forecast Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">48-Hour Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weather?.forecast || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="valid_time_start" 
                      stroke="#9ca3af"
                      tickFormatter={(value) => format(parseISO(value), 'HH:mm')}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelFormatter={(value) => format(parseISO(value as string), 'MMM d, HH:mm')}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="temperature_value" 
                      stroke="#ef4444" 
                      name="Temperature (°F)"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="precipitation_probability" 
                      stroke="#3b82f6" 
                      name="Precip Chance (%)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Historical Trends */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">24-Hour Historical Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weather?.historical || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#9ca3af"
                      tickFormatter={(value) => format(parseISO(value), 'HH:mm')}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avg_temp" 
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.3}
                      name="Avg Temperature"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disasters" className="space-y-4">
            {/* Active Disasters */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Active Disaster Declarations</CardTitle>
              </CardHeader>
              <CardContent>
                {fema?.activeDisasters && fema.activeDisasters.length > 0 ? (
                  <div className="space-y-3">
                    {fema.activeDisasters.map((disaster: any) => (
                      <div key={disaster.disasterNumber} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">
                              DR-{disaster.disasterNumber}: {disaster.incidentType}
                            </h4>
                            <p className="text-sm text-gray-400 mt-1">{disaster.title}</p>
                            <div className="flex gap-2 mt-2">
                              {disaster.programs?.map((program: string) => (
                                <Badge key={program} variant="secondary">
                                  {program}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-orange-400 border-orange-400">
                            Active
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No active disaster declarations in your area</p>
                )}
              </CardContent>
            </Card>

            {/* Disaster Statistics */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">12-Month Disaster Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {fema?.statistics?.totalDisasters || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Total Disasters</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-400">
                      {fema?.statistics?.disasterTypes?.floods || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Floods</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-400">
                      {fema?.statistics?.disasterTypes?.hurricanes || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Hurricanes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-400">
                      {fema?.statistics?.disasterTypes?.fires || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Fires</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { type: 'Hurricanes', count: fema?.statistics?.disasterTypes?.hurricanes || 0 },
                    { type: 'Floods', count: fema?.statistics?.disasterTypes?.floods || 0 },
                    { type: 'Fires', count: fema?.statistics?.disasterTypes?.fires || 0 },
                    { type: 'Storms', count: fema?.statistics?.disasterTypes?.storms || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="type" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Bar dataKey="count" fill="#3b82f6">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            {/* Prediction Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">24-48 Hour Outlook</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Severe Weather</span>
                      <Badge variant={predictions?.shortTerm?.severeWeatherLikely ? 'destructive' : 'secondary'}>
                        {predictions?.shortTerm?.severeWeatherLikely ? 'Likely' : 'Unlikely'}
                      </Badge>
                    </div>
                    <Progress 
                      value={(predictions?.shortTerm?.confidence || 0) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-gray-400">
                      Confidence: {Math.round((predictions?.shortTerm?.confidence || 0) * 100)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">7-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Disaster Risk</span>
                      <span className="text-2xl font-bold text-white">
                        {Math.round((predictions?.mediumTerm?.disasterProbability || 0) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(predictions?.mediumTerm?.disasterProbability || 0) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-gray-400">
                      Confidence: {Math.round((predictions?.mediumTerm?.confidence || 0) * 100)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Seasonal Outlook</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Risk Level</span>
                      <Badge variant={
                        predictions?.longTerm?.seasonalRisk === 'high' ? 'destructive' :
                        predictions?.longTerm?.seasonalRisk === 'moderate' ? 'secondary' :
                        'outline'
                      }>
                        {predictions?.longTerm?.seasonalRisk || 'Unknown'}
                      </Badge>
                    </div>
                    <Progress 
                      value={(predictions?.longTerm?.confidence || 0) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-gray-400">
                      Confidence: {Math.round((predictions?.longTerm?.confidence || 0) * 100)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="bg-gray-900 border-gray-700">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Pattern Analysis</AlertTitle>
                    <AlertDescription>
                      Based on historical data and current conditions, the system has identified
                      {predictions?.mediumTerm?.disasterProbability > 0.5 ? ' elevated' : ' normal'}
                      {' '}risk patterns for your area. Primary factors include weather trends and 
                      seasonal patterns.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-900 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Risk Drivers</h4>
                      <ul className="space-y-1 text-sm text-gray-400">
                        {weather?.trends?.temperatureTrend === 'increasing' && (
                          <li>• Rising temperatures detected</li>
                        )}
                        {weather?.trends?.precipitationTotal > 3 && (
                          <li>• Above-average precipitation</li>
                        )}
                        {fema?.statistics?.trend === 'increasing' && (
                          <li>• Increasing disaster frequency</li>
                        )}
                        {activeAlerts.length > 0 && (
                          <li>• Active emergency alerts</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-gray-900 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Protective Factors</h4>
                      <ul className="space-y-1 text-sm text-gray-400">
                        <li>• Property monitoring active</li>
                        <li>• Insurance coverage verified</li>
                        <li>• Emergency plans in place</li>
                        <li>• FEMA programs available</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {/* Recommendations */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Immediate Actions */}
                  {data?.recommendations?.immediate?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Immediate Actions Required
                      </h4>
                      <div className="space-y-2">
                        {data.recommendations.immediate.map((action: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-red-950 rounded-lg">
                            <ChevronRight className="h-5 w-5 text-red-400 mt-0.5" />
                            <p className="text-white flex-1">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short-term Actions */}
                  {data?.recommendations?.shortTerm?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Short-term Actions (24-48 hours)
                      </h4>
                      <div className="space-y-2">
                        {data.recommendations.shortTerm.map((action: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-950 rounded-lg">
                            <ChevronRight className="h-5 w-5 text-yellow-400 mt-0.5" />
                            <p className="text-white flex-1">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Long-term Actions */}
                  {data?.recommendations?.longTerm?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Long-term Preparedness
                      </h4>
                      <div className="space-y-2">
                        {data.recommendations.longTerm.map((action: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-blue-950 rounded-lg">
                            <ChevronRight className="h-5 w-5 text-blue-400 mt-0.5" />
                            <p className="text-white flex-1">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button className="justify-start" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Check FEMA Eligibility
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Review Insurance Coverage
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Update Emergency Contacts
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Document Property Condition
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}