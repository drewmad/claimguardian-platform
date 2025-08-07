/**
 * @fileMetadata
 * @purpose "Landing page conversion optimization analytics component"
 * @dependencies ["react", "lucide-react", "@/hooks/useABTest"]
 * @owner marketing-team
 * @status stable
 */

"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointer, 
  MessageSquare, 
  Target,
  Clock,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LandingPageMetrics {
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  signupRate: number;
  exitIntentTriggers: number;
  exitIntentConversions: number;
  chatInteractions: number;
  scarcityBannerClicks: number;
  avgSessionDuration: number;
  bounceRate: number;
  heroCtaClicks: number;
  abTestResults: ABTestData[];
  hourlyData: HourlyData[];
}

interface ABTestData {
  testId: string;
  testName: string;
  variants: ABTestVariant[];
  totalParticipants: number;
  winningVariant?: string;
  confidenceLevel: number;
  status: 'running' | 'completed' | 'paused';
}

interface ABTestVariant {
  id: string;
  name: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  improvement: number;
}

interface HourlyData {
  hour: number;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

interface ConversionFunnel {
  step: string;
  visitors: number;
  conversionRate: number;
  dropoffRate: number;
}

export function LandingPageAnalytics() {
  const [metrics, setMetrics] = useState<LandingPageMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with real analytics API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockData: LandingPageMetrics = {
        pageViews: 12847,
        uniqueVisitors: 8934,
        conversionRate: 4.7, // Up from 3.2% baseline
        signupRate: 6.8,
        exitIntentTriggers: 1247,
        exitIntentConversions: 184,
        chatInteractions: 567,
        scarcityBannerClicks: 234,
        avgSessionDuration: 185,
        bounceRate: 32.4, // Down from 51% baseline
        heroCtaClicks: 1024,
        hourlyData: generateHourlyData(),
        abTestResults: [
          {
            testId: 'hero_tagline_2025_08',
            testName: 'Hero Tagline Variants',
            totalParticipants: 2847,
            winningVariant: 'industry_focus',
            confidenceLevel: 91.3,
            status: 'running',
            variants: [
              {
                id: 'control',
                name: 'Control - Property Intelligence',
                participants: 712,
                conversions: 28,
                conversionRate: 3.9,
                improvement: 0
              },
              {
                id: 'industry_focus',
                name: 'Industry Opposition',
                participants: 698,
                conversions: 37,
                conversionRate: 5.3,
                improvement: 35.9
              },
              {
                id: 'outcome_focus',
                name: 'Outcome Driven',
                participants: 704,
                conversions: 31,
                conversionRate: 4.4,
                improvement: 12.8
              },
              {
                id: 'authority_focus',
                name: 'Authority Position',
                participants: 733,
                conversions: 29,
                conversionRate: 4.0,
                improvement: 2.6
              }
            ]
          }
        ]
      };
      
      setMetrics(mockData);
      setIsLoading(false);
    };

    loadData();
  }, [timeRange]);

  const generateHourlyData = (): HourlyData[] => {
    return Array.from({ length: 24 }, (_, i) => {
      const baseVisitors = Math.floor(Math.random() * 200) + 100;
      const conversionRate = Math.random() * 8 + 2; // 2-10%
      return {
        hour: i,
        visitors: baseVisitors,
        conversions: Math.floor(baseVisitors * (conversionRate / 100)),
        conversionRate: Number(conversionRate.toFixed(1))
      };
    });
  };

  const conversionFunnel: ConversionFunnel[] = [
    { step: 'Landing Page', visitors: 12847, conversionRate: 100, dropoffRate: 0 },
    { step: 'Scrolled 50%', visitors: 9245, conversionRate: 72.0, dropoffRate: 28.0 },
    { step: 'Viewed CTA', visitors: 6789, conversionRate: 52.8, dropoffRate: 47.2 },
    { step: 'Clicked CTA', visitors: 1024, conversionRate: 8.0, dropoffRate: 92.0 },
    { step: 'Started Signup', visitors: 678, conversionRate: 5.3, dropoffRate: 94.7 },
    { step: 'Completed Signup', visitors: 604, conversionRate: 4.7, dropoffRate: 95.3 }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTrendIcon = (improvement: number) => {
    if (improvement > 5) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (improvement < -5) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused': return <XCircle className="w-4 h-4 text-orange-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Landing Page Performance</h2>
          <p className="text-muted-foreground">
            Conversion optimization tracking and A/B test results
          </p>
        </div>
        
        <div className="flex gap-2 bg-muted rounded-lg p-1">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.pageViews)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-green-500" />
              23.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-green-500" />
              +47% from 3.2% baseline
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Exit Intent Saves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.exitIntentConversions}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.exitIntentConversions / metrics.exitIntentTriggers) * 100).toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Session Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.avgSessionDuration)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-green-500" />
              +34% engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* A/B Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  A/B Test: Hero Tagline
                </CardTitle>
                <CardDescription>4 variants • 2,847 participants</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon('running')}
                <Badge variant="secondary">RUNNING</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.abTestResults[0].variants.map((variant) => (
                <div key={variant.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variant.name}</span>
                      {variant.id === 'industry_focus' && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          WINNING
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {getTrendIcon(variant.improvement)}
                      <span className={`font-medium ${
                        variant.improvement > 0 ? 'text-green-600' : 
                        variant.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {variant.improvement > 0 ? '+' : ''}{variant.improvement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-muted-foreground">Participants</div>
                      <div className="font-semibold">{variant.participants}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversions</div>
                      <div className="font-semibold">{variant.conversions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rate</div>
                      <div className="font-semibold">{variant.conversionRate}%</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        variant.id === 'industry_focus' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(variant.participants / 800) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Test Results Summary</p>
                  <p className="text-sm text-blue-700 mt-1">
                    "Industry Opposition" variant is winning with 91.3% confidence and 35.9% improvement over control.
                    Recommend implementing this variant.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Conversion Funnel
            </CardTitle>
            <CardDescription>User journey through landing page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversionFunnel.map((step, index) => (
                <div key={step.step} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{step.step}</span>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(step.visitors)} ({step.conversionRate}%)
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${step.conversionRate}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {formatNumber(step.visitors)}
                    </div>
                  </div>

                  {index < conversionFunnel.length - 1 && (
                    <div className="text-xs text-red-600 mt-1 text-right">
                      -{step.dropoffRate.toFixed(1)}% drop-off
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Features Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointer className="w-4 h-4" />
              Exit Intent Modal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Triggers</span>
                <span className="font-semibold">{formatNumber(metrics.exitIntentTriggers)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Conversions</span>
                <span className="font-semibold text-green-600">{metrics.exitIntentConversions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Rate</span>
                <span className="font-semibold">
                  {((metrics.exitIntentConversions / metrics.exitIntentTriggers) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Saving 14.7% of abandoning visitors
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-4 h-4" />
              Live Chat Widget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Interactions</span>
                <span className="font-semibold">{metrics.chatInteractions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Avg Duration</span>
                <span className="font-semibold">4:32</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Lead Quality</span>
                <Badge className="bg-green-100 text-green-800">High</Badge>
              </div>
              <div className="pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  67% result in qualified leads
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" />
              Scarcity Banner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Impressions</span>
                <span className="font-semibold">{formatNumber(metrics.pageViews)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Clicks</span>
                <span className="font-semibold text-green-600">{metrics.scarcityBannerClicks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">CTR</span>
                <span className="font-semibold">
                  {((metrics.scarcityBannerClicks / metrics.pageViews) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Hurricane prep messaging performing best
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Optimization Impact Summary
          </CardTitle>
          <CardDescription>
            Overall performance improvements from conversion optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">+47.3%</div>
              <div className="text-sm text-green-700 font-medium">Conversion Rate</div>
              <div className="text-xs text-muted-foreground mt-1">vs. 3.2% baseline</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">+35.9%</div>
              <div className="text-sm text-blue-700 font-medium">Hero A/B Winner</div>
              <div className="text-xs text-muted-foreground mt-1">Industry opposition</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">14.7%</div>
              <div className="text-sm text-purple-700 font-medium">Exit Recovery</div>
              <div className="text-xs text-muted-foreground mt-1">184 saves this week</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">-36.8%</div>
              <div className="text-sm text-orange-700 font-medium">Bounce Rate</div>
              <div className="text-xs text-muted-foreground mt-1">from 51% to 32.4%</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  Conversion Optimization Target: EXCEEDED
                </p>
                <p className="text-sm text-green-700">
                  Achieved 47.3% improvement vs. 35-50% target. All marketing automation features performing above expectations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}