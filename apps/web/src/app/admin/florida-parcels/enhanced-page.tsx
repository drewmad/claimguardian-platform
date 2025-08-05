'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, Play, Pause, AlertCircle, CheckCircle2, Clock, Database,
  Download, Upload, Zap, BarChart3, Map, Filter, Search, Settings,
  Activity, TrendingUp, FileText, AlertTriangle, Cpu, HardDrive,
  Globe, Users, Home, DollarSign, Layers, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface CountyStatus {
  county_code: number;
  county_name: string;
  status: string;
  progress: number;
  actual_parcels: number;
  estimated_parcels: number;
  last_updated: string;
  errors: number;
  processing_time?: number;
  parcels_per_minute?: number;
  population?: number;
}

interface DashboardSummary {
  total_parcels_processed: number;
  total_parcels_estimated: number;
  counties_completed: number;
  counties_processing: number;
  counties_with_errors: number;
  counties_pending: number;
  overall_progress: number;
  current_orchestrator_job?: any;
}

interface PerformanceMetrics {
  average_processing_time_minutes: number;
  average_parcels_per_minute: number;
  fastest_county: CountyStatus | null;
  slowest_county: CountyStatus | null;
}

interface TimelineEvent {
  timestamp: string;
  county_name: string;
  event_type: string;
  progress: number;
  parcels_processed: number;
}

export default function EnhancedFloridaParcelsMonitor() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [counties, setCounties] = useState<CountyStatus[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedView, setSelectedView] = useState<'all' | 'active' | 'errors' | 'completed' | 'pending'>('all');
  const [selectedCounties, setSelectedCounties] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'parcels' | 'status'>('status');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [batchSize, setBatchSize] = useState(1000);
  const [parallelCounties, setParallelCounties] = useState(2);
  const [expandedCounty, setExpandedCounty] = useState<number | null>(null);
  
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchDashboard();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchDashboard, refreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshInterval]);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, timelineRes, performanceRes] = await Promise.all([
        supabase.functions.invoke('florida-parcels-monitor', {
          body: { view: 'dashboard' }
        }),
        supabase.functions.invoke('florida-parcels-monitor', {
          body: { view: 'timeline', limit: 20 }
        }),
        supabase.functions.invoke('florida-parcels-monitor', {
          body: { view: 'performance' }
        })
      ]);

      if (dashboardRes.data) {
        setSummary(dashboardRes.data.summary);
        setCounties(dashboardRes.data.counties);
        setPerformance(dashboardRes.data.performance);
        setIsProcessing(dashboardRes.data.summary.counties_processing > 0);
      }
      
      if (timelineRes.data) {
        setTimeline(timelineRes.data.timeline);
      }
      
      if (performanceRes.data) {
        setPerformance(performanceRes.data.summary);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const startProcessing = async (mode: 'priority' | 'all' | 'specific') => {
    try {
      setLoading(true);
      const body: any = { 
        action: 'start', 
        mode,
        batch_size: batchSize,
        parallel_counties: parallelCounties
      };
      
      if (mode === 'specific') {
        body.counties = selectedCounties;
      }
      
      const { data, error } = await supabase.functions.invoke('florida-parcels-orchestrator', {
        body
      });

      if (!error) {
        await fetchDashboard();
      } else {
        console.error('Error starting processing:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopProcessing = async () => {
    try {
      const { error } = await supabase.functions.invoke('florida-parcels-orchestrator', {
        body: { action: 'stop' }
      });

      if (!error) {
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Error stopping processing:', err);
    }
  };

  const resetCounty = async (countyCode: number) => {
    if (!confirm(`Reset all data for county ${countyCode}? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase.functions.invoke('florida-parcels-orchestrator', {
        body: { action: 'reset', counties: [countyCode] }
      });

      if (!error) {
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Error resetting county:', err);
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    const data = format === 'csv' 
      ? convertToCSV(counties)
      : JSON.stringify(counties, null, 2);
    
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `florida-parcels-status-${new Date().toISOString()}.${format}`;
    a.click();
  };

  const convertToCSV = (data: CountyStatus[]) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>,
      processing: <Badge className="bg-blue-500 animate-pulse"><Clock className="w-3 h-3 mr-1" />Processing</Badge>,
      error: <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>,
      completed_with_errors: <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Partial</Badge>,
      pending: <Badge variant="secondary">Pending</Badge>
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const filteredAndSortedCounties = counties
    .filter(county => {
      const matchesSearch = county.county_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          county.county_code.toString().includes(searchTerm);
      const matchesView = selectedView === 'all' ||
                         (selectedView === 'active' && county.status === 'processing') ||
                         (selectedView === 'errors' && (county.status === 'error' || county.status === 'completed_with_errors')) ||
                         (selectedView === 'completed' && county.status === 'completed') ||
                         (selectedView === 'pending' && county.status === 'pending');
      return matchesSearch && matchesView;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.county_name.localeCompare(b.county_name);
        case 'progress': return b.progress - a.progress;
        case 'parcels': return b.actual_parcels - a.actual_parcels;
        case 'status': {
          const order = { processing: 0, error: 1, completed_with_errors: 2, completed: 3, pending: 4 };
          return (order[a.status as keyof typeof order] ?? 5) - (order[b.status as keyof typeof order] ?? 5);
        }
        default: return 0;
      }
    });

  // Chart data preparation
  const progressData = counties
    .filter(c => c.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 10)
    .map(c => ({
      name: c.county_name.substring(0, 10),
      progress: c.progress,
      parcels: c.actual_parcels
    }));

  const statusData = [
    { name: 'Completed', value: summary?.counties_completed || 0, color: '#10b981' },
    { name: 'Processing', value: summary?.counties_processing || 0, color: '#3b82f6' },
    { name: 'Errors', value: summary?.counties_with_errors || 0, color: '#f59e0b' },
    { name: 'Pending', value: summary?.counties_pending || 0, color: '#6b7280' }
  ];

  const timelineData = timeline.slice(0, 10).map(event => ({
    time: new Date(event.timestamp).toLocaleTimeString(),
    county: event.county_name.substring(0, 10),
    parcels: event.parcels_processed
  }));

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Map className="w-8 h-8" />
              Florida Parcels Import Monitor
            </h1>
            <p className="text-gray-600 mt-1">Real-time monitoring and control for statewide parcel data processing</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={fetchDashboard} variant="outline" size="sm">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manual refresh dashboard</TooltipContent>
            </Tooltip>
            
            <Button onClick={() => setShowAdvanced(!showAdvanced)} variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Advanced
            </Button>
            
            <div className="flex gap-1">
              <Button onClick={() => exportData('csv')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button onClick={() => exportData('json')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
            
            {!isProcessing ? (
              <>
                <Button onClick={() => startProcessing('priority')} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Priority (20)
                </Button>
                <Button onClick={() => startProcessing('all')} variant="secondary" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Start All (67)
                </Button>
                {selectedCounties.length > 0 && (
                  <Button onClick={() => startProcessing('specific')} variant="default" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Start Selected ({selectedCounties.length})
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={stopProcessing} variant="destructive" size="sm" className="animate-pulse">
                <Pause className="w-4 h-4 mr-2" />
                Stop Processing
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="auto-refresh" 
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <label htmlFor="auto-refresh" className="text-sm">Auto-refresh</label>
                </div>
                
                <div>
                  <label className="text-sm">Refresh Interval (seconds)</label>
                  <Input
                    type="number"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    min={5}
                    max={60}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm">Batch Size</label>
                  <Input
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    min={100}
                    max={5000}
                    step={100}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm">Parallel Counties</label>
                  <Input
                    type="number"
                    value={parallelCounties}
                    onChange={(e) => setParallelCounties(parseInt(e.target.value))}
                    min={1}
                    max={10}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Job Alert */}
        {summary?.current_orchestrator_job && (
          <Alert className="border-blue-500 bg-blue-50">
            <Activity className="h-4 w-4" />
            <AlertTitle>Active Processing Job</AlertTitle>
            <AlertDescription>
              Processing {summary.current_orchestrator_job.total_counties} counties in {summary.current_orchestrator_job.mode} mode
              • Batch size: {summary.current_orchestrator_job.batch_size}
              • Parallel: {summary.current_orchestrator_job.parallel_counties}
              • Progress: {summary.current_orchestrator_job.processed_counties}/{summary.current_orchestrator_job.total_counties}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="counties">Counties</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            {summary && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Overall Progress
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{summary.overall_progress}%</div>
                      <Progress value={summary.overall_progress} className="mt-2 h-2" />
                      <p className="text-xs text-gray-500 mt-2">
                        {(summary.total_parcels_processed / 1000000).toFixed(2)}M of {(summary.total_parcels_estimated / 1000000).toFixed(2)}M parcels
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Processing Speed
                        <Zap className="w-4 h-4 text-yellow-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {performance?.average_parcels_per_minute || 0}
                      </div>
                      <p className="text-sm text-gray-600">parcels/minute</p>
                      {performance?.average_processing_time_minutes && (
                        <p className="text-xs text-gray-500 mt-2">
                          Avg time: {performance.average_processing_time_minutes} min/county
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Storage Usage
                        <HardDrive className="w-4 h-4 text-blue-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {((summary.total_parcels_processed * 2.5) / 1024 / 1024).toFixed(1)} GB
                      </div>
                      <p className="text-sm text-gray-600">estimated</p>
                      <p className="text-xs text-gray-500 mt-2">
                        ~2.5 KB per parcel
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Estimated Cost
                        <DollarSign className="w-4 h-4 text-green-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        ${((summary.total_parcels_processed / 1000000) * 0.5).toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-600">processing cost</p>
                      <p className="text-xs text-gray-500 mt-2">
                        $0.50 per million parcels
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* County Status Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">County Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Counties by Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={progressData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip />
                          <Bar dataKey="progress" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="counties" className="space-y-4">
            {/* Filters and Search */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search counties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties ({counties.length})</SelectItem>
                  <SelectItem value="active">Processing ({counties.filter(c => c.status === 'processing').length})</SelectItem>
                  <SelectItem value="completed">Completed ({counties.filter(c => c.status === 'completed').length})</SelectItem>
                  <SelectItem value="errors">With Errors ({counties.filter(c => c.status === 'error' || c.status === 'completed_with_errors').length})</SelectItem>
                  <SelectItem value="pending">Pending ({counties.filter(c => c.status === 'pending').length})</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="parcels">Parcels</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedCounties.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setSelectedCounties([])}>
                  Clear Selection ({selectedCounties.length})
                </Button>
              )}
            </div>

            {/* County List with Enhanced Details */}
            <div className="space-y-2">
              {filteredAndSortedCounties.map((county) => (
                <Card key={county.county_code} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedCounties.includes(county.county_code)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCounties([...selectedCounties, county.county_code]);
                              } else {
                                setSelectedCounties(selectedCounties.filter(c => c !== county.county_code));
                              }
                            }}
                          />
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {county.county_name}
                              <span className="text-sm text-gray-500">#{county.county_code}</span>
                            </h3>
                            {county.population && (
                              <p className="text-sm text-gray-500">
                                <Users className="inline w-3 h-3 mr-1" />
                                {county.population.toLocaleString()} residents
                              </p>
                            )}
                          </div>
                          {getStatusBadge(county.status)}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCounty(expandedCounty === county.county_code ? null : county.county_code)}
                        >
                          {expandedCounty === county.county_code ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{county.actual_parcels.toLocaleString()} / {county.estimated_parcels.toLocaleString()} parcels</span>
                          <span className="font-bold">{county.progress}%</span>
                        </div>
                        <Progress value={county.progress} className="h-3" />
                      </div>

                      {county.status === 'processing' && county.parcels_per_minute && (
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {county.parcels_per_minute} parcels/min
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{Math.round((county.estimated_parcels - county.actual_parcels) / county.parcels_per_minute)} min remaining
                          </span>
                        </div>
                      )}

                      {county.errors > 0 && (
                        <Alert className="mt-2 py-2">
                          <AlertTriangle className="h-3 w-3" />
                          <AlertDescription className="text-sm">
                            {county.errors} errors encountered
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {expandedCounty === county.county_code && (
                      <div className="border-t p-4 bg-gray-50 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="ml-2 font-medium">
                              {county.last_updated ? new Date(county.last_updated).toLocaleString() : 'Never'}
                            </span>
                          </div>
                          {county.processing_time && (
                            <div>
                              <span className="text-gray-600">Processing Time:</span>
                              <span className="ml-2 font-medium">{county.processing_time} minutes</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          {county.status === 'error' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startProcessing('specific')}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => resetCounty(county.county_code)}
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Reset
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Logs
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performance && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Speed</span>
                        <span className="font-bold">{performance.average_parcels_per_minute} parcels/min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Time per County</span>
                        <span className="font-bold">{performance.average_processing_time_minutes} minutes</span>
                      </div>
                      {performance.fastest_county && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Fastest County</span>
                          <span className="font-bold">{performance.fastest_county.county_name}</span>
                        </div>
                      )}
                      {performance.slowest_county && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Slowest County</span>
                          <span className="font-bold">{performance.slowest_county.county_name}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* System Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Edge Function CPU
                    </span>
                    <span className="font-bold">Normal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Database Load
                    </span>
                    <span className="font-bold text-green-600">Low</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Storage API
                    </span>
                    <span className="font-bold">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Throughput
                    </span>
                    <span className="font-bold">{batchSize * parallelCounties} records/batch</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Processing Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Activity (Last 10 Events)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="parcels" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="min-w-[100px] text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.county_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.event_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.parcels_processed.toLocaleString()} parcels processed ({event.progress}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}