'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Pause, AlertCircle, CheckCircle2, Clock, Database } from 'lucide-react';

interface CountyStatus {
  county_code: number;
  county_name: string;
  status: string;
  progress: number;
  actual_parcels: number;
  estimated_parcels: number;
  last_updated: string;
  errors: number;
}

interface DashboardSummary {
  total_parcels_processed: number;
  total_parcels_estimated: number;
  counties_completed: number;
  counties_processing: number;
  counties_with_errors: number;
  counties_pending: number;
  overall_progress: number;
}

export default function FloridaParcelsMonitor() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [counties, setCounties] = useState<CountyStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedView, setSelectedView] = useState<'all' | 'active' | 'errors'>('all');
  const supabase = createClient();

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('florida-parcels-monitor', {
        body: { view: 'dashboard' }
      });

      if (!error && data) {
        setSummary(data.summary);
        setCounties(data.counties);
        setIsProcessing(data.summary.counties_processing > 0);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const startProcessing = async (mode: 'priority' | 'all') => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('florida-parcels-orchestrator', {
        body: { action: 'start', mode }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'completed_with_errors':
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const filteredCounties = counties.filter(county => {
    if (selectedView === 'all') return true;
    if (selectedView === 'active') return county.status === 'processing';
    if (selectedView === 'errors') return county.status === 'error' || county.status === 'completed_with_errors';
    return true;
  });

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Florida Parcels Import Monitor</h1>
        <div className="flex gap-2">
          <Button onClick={fetchDashboard} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {!isProcessing ? (
            <>
              <Button onClick={() => startProcessing('priority')} size="sm">
                <Play className="w-4 h-4 mr-2" />
                Start Priority Counties
              </Button>
              <Button onClick={() => startProcessing('all')} variant="secondary" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Start All Counties
              </Button>
            </>
          ) : (
            <Button onClick={stopProcessing} variant="destructive" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Stop Processing
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overall_progress}%</div>
              <Progress value={summary.overall_progress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Parcels Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(summary.total_parcels_processed / 1000000).toFixed(2)}M
              </div>
              <p className="text-xs text-gray-500">
                of {(summary.total_parcels_estimated / 1000000).toFixed(2)}M
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.counties_completed}
              </div>
              <p className="text-xs text-gray-500">counties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.counties_processing}
              </div>
              <p className="text-xs text-gray-500">counties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">With Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.counties_with_errors}
              </div>
              <p className="text-xs text-gray-500">counties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {summary.counties_pending}
              </div>
              <p className="text-xs text-gray-500">counties</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Filter */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedView === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('all')}
        >
          All Counties ({counties.length})
        </Button>
        <Button
          variant={selectedView === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('active')}
        >
          Active ({counties.filter(c => c.status === 'processing').length})
        </Button>
        <Button
          variant={selectedView === 'errors' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('errors')}
        >
          Errors ({counties.filter(c => c.status === 'error' || c.status === 'completed_with_errors').length})
        </Button>
      </div>

      {/* County List */}
      <div className="grid gap-4">
        {filteredCounties.map((county) => (
          <Card key={county.county_code}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">{county.county_name}</h3>
                    <p className="text-sm text-gray-500">Code: {county.county_code}</p>
                  </div>
                  {getStatusBadge(county.status)}
                </div>
              </div>

              <div className="flex-1 mx-8">
                <div className="flex justify-between text-sm mb-1">
                  <span>{county.actual_parcels.toLocaleString()} parcels</span>
                  <span>{county.progress}%</span>
                </div>
                <Progress value={county.progress} className="h-2" />
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Est: {county.estimated_parcels.toLocaleString()}
                </p>
                {county.errors > 0 && (
                  <p className="text-sm text-red-500">{county.errors} errors</p>
                )}
                {county.last_updated && (
                  <p className="text-xs text-gray-400">
                    {new Date(county.last_updated).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}