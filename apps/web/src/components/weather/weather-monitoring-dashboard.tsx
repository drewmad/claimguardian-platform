'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  CloudRain,
  AlertTriangle,
  Wind,
  Thermometer,
  Droplets,
  Activity,
  MapPin,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, subHours, subDays } from 'date-fns';

interface WeatherData {
  current?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    precipitation: number;
    conditions: string;
    observedAt: string;
  };
  forecast?: Array<{
    time: string;
    temperature: number;
    precipProbability: number;
    windSpeed: number;
    conditions: string;
  }>;
  alerts?: Array<{
    id: string;
    event: string;
    severity: string;
    urgency: string;
    headline: string;
    expires: string;
  }>;
  historicalTrends?: Array<{
    hour: string;
    temperature: number;
    humidity: number;
    precipitation: number;
  }>;
}

interface FEMAData {
  activeDisasters?: Array<{
    disasterNumber: number;
    incidentType: string;
    title: string;
    declarationDate: string;
    programs: string[];
  }>;
  recentAlerts?: Array<{
    id: string;
    event: string;
    severity: string;
    headline: string;
    sent: string;
  }>;
  statistics?: {
    totalDisasters: number;
    activePAProjects: number;
    totalFunding: number;
    affectedCounties: number;
  };
}

interface SyncStatus {
  weatherLastSync?: string;
  weatherNextSync?: string;
  weatherRecords?: number;
  weatherStatus?: string;
  femaLastSync?: string;
  femaNextSync?: string;
  femaRecords?: number;
  femaStatus?: string;
}

export function WeatherMonitoringDashboard({ propertyId }: { propertyId: string }) {
  const [weatherData, setWeatherData] = useState<WeatherData>({});
  const [femaData, setFEMAData] = useState<FEMAData>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [propertyId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get property location
      const { data: property } = await supabase
        .from('properties')
        .select('latitude, longitude, county_fips')
        .eq('id', propertyId)
        .single();

      if (!property) return;

      // Load weather data
      await loadWeatherData(property.latitude, property.longitude);
      
      // Load FEMA data
      await loadFEMAData(property.county_fips);
      
      // Load sync status
      await loadSyncStatus();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeatherData = async (lat: number, lon: number) => {
    // Get current conditions
    const { data: current } = await supabase
      .rpc('get_current_conditions', { lat, lon });

    // Get forecast
    const { data: forecast } = await supabase
      .from('weather.forecasts')
      .select('*')
      .gte('valid_time_start', new Date().toISOString())
      .order('valid_time_start')
      .limit(24);

    // Get active alerts
    const { data: alerts } = await supabase
      .from('weather.alerts')
      .select('*')
      .gte('expires_time', new Date().toISOString())
      .order('severity');

    // Get historical trends (last 24 hours)
    const { data: historical } = await supabase
      .from('weather.hourly_stats')
      .select('*')
      .gte('hour', subHours(new Date(), 24).toISOString())
      .order('hour');

    setWeatherData({
      current: current ? {
        temperature: current.temperature_f,
        humidity: current.humidity_percent,
        windSpeed: current.wind_speed_mph,
        pressure: 0,
        precipitation: current.precipitation_in || 0,
        conditions: current.conditions?.[0] || 'Clear',
        observedAt: current.observed_at
      } : undefined,
      forecast: forecast?.map(f => ({
        time: f.valid_time_start,
        temperature: f.temperature_value,
        precipProbability: f.precipitation_probability || 0,
        windSpeed: parseFloat(f.wind_speed?.split(' ')[0] || '0'),
        conditions: f.weather_condition
      })),
      alerts: alerts?.map(a => ({
        id: a.alert_id,
        event: a.event,
        severity: a.severity,
        urgency: a.urgency,
        headline: a.headline,
        expires: a.expires_time
      })),
      historicalTrends: historical?.map(h => ({
        hour: h.hour,
        temperature: h.avg_temp,
        humidity: h.avg_humidity,
        precipitation: h.total_precipitation
      }))
    });
  };

  const loadFEMAData = async (countyFips: string) => {
    // Get active disasters
    const { data: disasters } = await supabase
      .from('fema.disaster_declarations')
      .select('*')
      .eq('county_fips', countyFips)
      .is('incident_end_date', null)
      .order('declaration_date', { ascending: false })
      .limit(5);

    // Get recent IPAWS alerts
    const { data: alerts } = await supabase
      .from('fema.ipaws_alerts')
      .select('*')
      .gte('sent', subDays(new Date(), 7).toISOString())
      .order('sent', { ascending: false })
      .limit(10);

    // Get statistics
    const { data: stats } = await supabase
      .from('fema.monthly_disaster_stats')
      .select('*')
      .eq('state', 'FL')
      .gte('month', subDays(new Date(), 365).toISOString())
      .order('month', { ascending: false });

    const totalDisasters = stats?.reduce((sum, s) => sum + s.disaster_count, 0) || 0;
    const affectedCounties = new Set(stats?.map(s => s.affected_counties).flat()).size;

    setFEMAData({
      activeDisasters: disasters?.map(d => ({
        disasterNumber: d.disaster_number,
        incidentType: d.incident_type,
        title: d.title,
        declarationDate: d.declaration_date,
        programs: [
          d.ia_program_declared && 'Individual Assistance',
          d.pa_program_declared && 'Public Assistance',
          d.hm_program_declared && 'Hazard Mitigation'
        ].filter(Boolean) as string[]
      })),
      recentAlerts: alerts?.map(a => ({
        id: a.alert_id,
        event: a.event,
        severity: a.severity,
        headline: a.headline,
        sent: a.sent
      })),
      statistics: {
        totalDisasters,
        activePAProjects: 0,
        totalFunding: 0,
        affectedCounties
      }
    });
  };

  const loadSyncStatus = async () => {
    const { data } = await supabase
      .from('weather.sync_status')
      .select('*')
      .in('sync_type', ['weather', 'fema'])
      .order('last_sync_at', { ascending: false });

    const weatherSync = data?.find(s => s.sync_type === 'weather');
    const femaSync = data?.find(s => s.sync_type === 'fema');

    setSyncStatus({
      weatherLastSync: weatherSync?.last_sync_at,
      weatherNextSync: weatherSync?.next_sync_at,
      weatherRecords: weatherSync?.metadata?.records || 0,
      weatherStatus: weatherSync?.status,
      femaLastSync: femaSync?.last_sync_at,
      femaNextSync: femaSync?.next_sync_at,
      femaRecords: femaSync?.metadata?.records || 0,
      femaStatus: femaSync?.status
    });
  };

  const triggerSync = async (type: 'weather' | 'fema' | 'all') => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('weather-sync-orchestrator', {
        body: { type, scope: 'incremental' }
      });

      if (error) throw error;

      // Reload data after sync
      await loadDashboardData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'extreme': return 'text-red-500';
      case 'severe': return 'text-orange-500';
      case 'moderate': return 'text-yellow-500';
      case 'minor': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Weather & Emergency Monitoring</h2>
          <p className="text-gray-600">Real-time weather and FEMA emergency data</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerSync('all')}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync All Data
          </Button>
        </div>
      </div>

      {/* Sync Status Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Weather:</span>
                <Badge variant={syncStatus.weatherStatus === 'active' ? 'success' : 'secondary'}>
                  {syncStatus.weatherStatus || 'Unknown'}
                </Badge>
                {syncStatus.weatherLastSync && (
                  <span className="text-gray-500">
                    Last sync: {format(parseISO(syncStatus.weatherLastSync), 'HH:mm')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">FEMA:</span>
                <Badge variant={syncStatus.femaStatus === 'active' ? 'success' : 'secondary'}>
                  {syncStatus.femaStatus || 'Unknown'}
                </Badge>
                {syncStatus.femaLastSync && (
                  <span className="text-gray-500">
                    Last sync: {format(parseISO(syncStatus.femaLastSync), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="fema">FEMA</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Conditions */}
          {weatherData.current && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5" />
                  Current Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{weatherData.current.temperature}°F</p>
                      <p className="text-sm text-gray-500">Temperature</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{weatherData.current.humidity}%</p>
                      <p className="text-sm text-gray-500">Humidity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-2xl font-bold">{weatherData.current.windSpeed} mph</p>
                      <p className="text-sm text-gray-500">Wind Speed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudRain className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{weatherData.current.precipitation}"</p>
                      <p className="text-sm text-gray-500">Precipitation</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{weatherData.current.conditions}</p>
                    <p className="text-sm text-gray-500">
                      Updated: {format(parseISO(weatherData.current.observedAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Alerts Summary */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Weather Alerts ({weatherData.alerts?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherData.alerts && weatherData.alerts.length > 0 ? (
                  <div className="space-y-2">
                    {weatherData.alerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className="border-l-4 border-yellow-500 pl-3 py-1">
                        <p className={`font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.event}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-1">{alert.headline}</p>
                        <p className="text-xs text-gray-500">
                          Expires: {format(parseISO(alert.expires), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No active weather alerts</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Active Disasters ({femaData.activeDisasters?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {femaData.activeDisasters && femaData.activeDisasters.length > 0 ? (
                  <div className="space-y-2">
                    {femaData.activeDisasters.slice(0, 3).map(disaster => (
                      <div key={disaster.disasterNumber} className="border-l-4 border-red-500 pl-3 py-1">
                        <p className="font-medium">{disaster.incidentType}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">{disaster.title}</p>
                        <div className="flex gap-1 mt-1">
                          {disaster.programs.map(program => (
                            <Badge key={program} variant="secondary" className="text-xs">
                              {program}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No active disasters</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          {/* Temperature Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Temperature Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weatherData.historicalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(value) => format(parseISO(value), 'HH:mm')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(parseISO(value as string), 'MMM d, HH:mm')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#ef4444" 
                    name="Temperature (°F)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="#3b82f6" 
                    name="Humidity (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>48-Hour Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weatherData.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={(value) => format(parseISO(value), 'MMM d, HH:mm')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(parseISO(value as string), 'MMM d, HH:mm')}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.3}
                    name="Temperature (°F)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="precipProbability" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    name="Precip Chance (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Weather Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Active Weather Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {weatherData.alerts && weatherData.alerts.length > 0 ? (
                <div className="space-y-3">
                  {weatherData.alerts.map(alert => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className={`font-semibold ${getSeverityColor(alert.severity)}`}>
                            {alert.event}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.headline}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <Badge variant="outline">
                              Severity: {alert.severity}
                            </Badge>
                            <Badge variant="outline">
                              Urgency: {alert.urgency}
                            </Badge>
                            <span className="text-gray-500">
                              Expires: {format(parseISO(alert.expires), 'MMM d, HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active weather alerts</p>
              )}
            </CardContent>
          </Card>

          {/* IPAWS Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent IPAWS Emergency Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {femaData.recentAlerts && femaData.recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {femaData.recentAlerts.map(alert => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className={`font-semibold ${getSeverityColor(alert.severity)}`}>
                            {alert.event}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.headline}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <Badge variant="outline">
                              {alert.severity}
                            </Badge>
                            <span className="text-gray-500">
                              Sent: {format(parseISO(alert.sent), 'MMM d, HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent IPAWS alerts</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fema" className="space-y-4">
          {/* FEMA Statistics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{femaData.statistics?.totalDisasters || 0}</div>
                <p className="text-sm text-gray-500">Total Disasters (12 mo)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{femaData.statistics?.affectedCounties || 0}</div>
                <p className="text-sm text-gray-500">Affected Counties</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{femaData.activeDisasters?.length || 0}</div>
                <p className="text-sm text-gray-500">Active Disasters</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{femaData.recentAlerts?.length || 0}</div>
                <p className="text-sm text-gray-500">Recent Alerts</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Disasters Detail */}
          <Card>
            <CardHeader>
              <CardTitle>Active Disaster Declarations</CardTitle>
            </CardHeader>
            <CardContent>
              {femaData.activeDisasters && femaData.activeDisasters.length > 0 ? (
                <div className="space-y-3">
                  {femaData.activeDisasters.map(disaster => (
                    <div key={disaster.disasterNumber} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            DR-{disaster.disasterNumber}: {disaster.incidentType}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{disaster.title}</p>
                          <div className="flex gap-2 mt-2">
                            {disaster.programs.map(program => (
                              <Badge key={program} variant="secondary">
                                {program}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Declared: {format(parseISO(disaster.declarationDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active disaster declarations</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}