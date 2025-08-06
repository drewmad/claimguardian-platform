'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import {
  MapPin,
  TrendingUp,
  AlertTriangle,
  Users,
  Shield,
  Activity,
  Home,
  DollarSign,
  Clock,
  BarChart3,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CommunityMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: typeof TrendingUp;
}

interface PrivacySettings {
  shareLocation: boolean;
  shareClaimStatus: boolean;
  shareDamageReports: boolean;
  anonymousOnly: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CommunityInsightsDashboard() {
  const [loading, setLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    shareLocation: true,
    shareClaimStatus: false,
    shareDamageReports: true,
    anonymousOnly: true
  });
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const supabase = createClient();

  // Mock data for demonstration
  const metrics: CommunityMetric[] = [
    { label: 'Active Claims', value: 42, change: 12, trend: 'up', icon: Shield },
    { label: 'Avg Settlement Time', value: '14 days', change: -3, trend: 'down', icon: Clock },
    { label: 'Community Members', value: 1284, change: 8, trend: 'up', icon: Users },
    { label: 'Avg Claim Value', value: '$12,450', change: 5, trend: 'up', icon: DollarSign }
  ];

  const claimTrends = [
    { month: 'Jan', claims: 35, settled: 28, denied: 7 },
    { month: 'Feb', claims: 42, settled: 35, denied: 7 },
    { month: 'Mar', claims: 58, settled: 48, denied: 10 },
    { month: 'Apr', claims: 45, settled: 38, denied: 7 },
    { month: 'May', claims: 52, settled: 44, denied: 8 },
    { month: 'Jun', claims: 48, settled: 42, denied: 6 }
  ];

  const damageTypes = [
    { name: 'Wind Damage', value: 35, color: COLORS[0] },
    { name: 'Water Damage', value: 28, color: COLORS[1] },
    { name: 'Roof Damage', value: 20, color: COLORS[2] },
    { name: 'Structural', value: 12, color: COLORS[3] },
    { name: 'Other', value: 5, color: COLORS[4] }
  ];

  const neighborhoodActivity = [
    { area: 'Downtown', activity: 85, claims: 12 },
    { area: 'Riverside', activity: 72, claims: 8 },
    { area: 'Westside', activity: 68, claims: 6 },
    { area: 'Eastside', activity: 45, claims: 4 },
    { area: 'Northside', activity: 38, claims: 3 }
  ];

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      // Load actual community data from Supabase
      // This would fetch aggregated, anonymized data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacySetting = (setting: keyof PrivacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Privacy Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Privacy-First Community Insights</p>
              <p className="text-sm text-blue-700">
                All data is anonymized and aggregated. Your personal information is never shared.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
            className="text-blue-600 border-blue-300"
          >
            <Info className="h-4 w-4 mr-1" />
            Privacy Settings
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Settings Panel */}
      {showPrivacyInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Controls</CardTitle>
            <CardDescription>
              Choose what anonymous data you're comfortable sharing with the community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(privacySettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {value ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <Button
                  variant={value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePrivacySetting(key as keyof PrivacySettings)}
                >
                  {value ? 'Sharing' : 'Not Sharing'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 text-gray-400" />
                  <Badge variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}>
                    {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}{Math.abs(metric.change)}%
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-gray-500">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Claim Trends</TabsTrigger>
          <TabsTrigger value="damage">Damage Types</TabsTrigger>
          <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Community Claim Trends</CardTitle>
              <CardDescription>
                Anonymized claim activity in your area over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={claimTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="claims" stroke="#8884d8" name="Total Claims" />
                  <Line type="monotone" dataKey="settled" stroke="#82ca9d" name="Settled" />
                  <Line type="monotone" dataKey="denied" stroke="#ff7c7c" name="Denied" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="damage">
          <Card>
            <CardHeader>
              <CardTitle>Common Damage Types</CardTitle>
              <CardDescription>
                Most frequent claim types in your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={damageTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {damageTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-4">
                  {damageTypes.map((type) => (
                    <div key={type.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: type.color }} />
                        <span>{type.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={type.value} className="w-20" />
                        <span className="text-sm font-medium">{type.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neighborhood">
          <Card>
            <CardHeader>
              <CardTitle>Neighborhood Activity</CardTitle>
              <CardDescription>
                Claim activity levels by area (anonymized)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={neighborhoodActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activity" fill="#8884d8" name="Activity Score" />
                  <Bar dataKey="claims" fill="#82ca9d" name="Active Claims" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-6 space-y-3">
                {neighborhoodActivity.map((area) => (
                  <div key={area.area} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{area.area}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{area.activity}% active</span>
                      </div>
                      <Badge variant="outline">{area.claims} claims</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Community Insights</CardTitle>
              <CardDescription>
                Patterns and predictions based on anonymized community data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Seasonal Pattern Detected</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Wind damage claims typically increase 40% in your area during hurricane season (June-November).
                      Consider reviewing your coverage before June.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Settlement Trend</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Claims with complete photo documentation settle 62% faster in your area. 
                      Average settlement time: 14 days vs 36 days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Prevention Opportunity</h4>
                    <p className="text-sm text-green-700 mt-1">
                      78% of roof damage claims in your neighborhood could be prevented with annual inspections.
                      Schedule your free inspection today.
                    </p>
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