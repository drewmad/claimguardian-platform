'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Smile,
  Frown,
  Meh,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  BarChart3,
  Activity,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Sparkles
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
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SentimentScore {
  overall: number;
  positive: number;
  negative: number;
  neutral: number;
  confidence: number;
}

interface EmotionBreakdown {
  satisfaction: number;
  frustration: number;
  confusion: number;
  urgency: number;
  trust: number;
}

interface CommunicationAnalysis {
  id: string;
  type: 'email' | 'call' | 'chat' | 'review' | 'social';
  timestamp: string;
  content: string;
  sentiment: SentimentScore;
  emotions: EmotionBreakdown;
  topics: string[];
  actionRequired: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedResponse?: string;
}

interface SentimentTrend {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  volume: number;
}

interface TopicInsight {
  topic: string;
  mentions: number;
  sentiment: number;
  trend: 'improving' | 'declining' | 'stable';
}

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#64748b',
  satisfaction: '#3b82f6',
  frustration: '#f97316',
  confusion: '#eab308',
  urgency: '#dc2626',
  trust: '#10b981'
};

export function SentimentAnalysisDashboard() {
  const [analyzing, setAnalyzing] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [communications, setCommunications] = useState<CommunicationAnalysis[]>([]);
  const supabase = createClient();

  const [overallSentiment, setOverallSentiment] = useState<SentimentScore>({
    overall: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    confidence: 0
  });

  const [emotionalProfile, setEmotionalProfile] = useState<EmotionBreakdown>({
    satisfaction: 0,
    frustration: 0,
    confusion: 0,
    urgency: 0,
    trust: 0
  });

  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [topicInsights, setTopicInsights] = useState<TopicInsight[]>([]);
  const [recentCommunications, setRecentCommunications] = useState<CommunicationAnalysis[]>([]);
  const [channelDistribution, setChannelDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSentimentData();
  }, [selectedTimeRange]);

  const loadSentimentData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sentiment-analyzer', {
        body: { timeRange: selectedTimeRange }
      });

      if (error) throw error;

      if (data) {
        setOverallSentiment(data.overallSentiment || {
          overall: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          confidence: 0
        });
        setEmotionalProfile(data.emotionalProfile || {
          satisfaction: 0,
          frustration: 0,
          confusion: 0,
          urgency: 0,
          trust: 0
        });
        setSentimentTrends(data.trends || []);
        setTopicInsights(data.topics || []);
        setRecentCommunications(data.recentCommunications || []);
        setChannelDistribution(data.channels || []);
      }
    } catch (error) {
      console.error('Error loading sentiment data:', error);
      toast.error('Failed to load sentiment analysis data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = async () => {
    if (!testMessage.trim()) {
      toast.error('Please enter a message to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sentiment-analyzer', {
        body: { 
          message: testMessage,
          type: 'real-time'
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setCommunications(prev => [data.analysis, ...prev]);
        toast.success('Sentiment analysis complete');
        setTestMessage('');
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast.error('Failed to analyze sentiment');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 70) return <Smile className="h-5 w-5 text-green-500" />;
    if (score >= 40) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return <Badge className={colors[priority as keyof typeof colors]}>{priority}</Badge>;
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'review': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>Sentiment Analysis Dashboard</span>
          </h2>
          <p className="text-gray-600">AI-powered analysis of customer communications and feedback</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              {getSentimentIcon(overallSentiment.overall)}
              <Badge variant="outline">Overall</Badge>
            </div>
            <div className="space-y-2">
              <p className={`text-3xl font-bold ${getSentimentColor(overallSentiment.overall)}`}>
                {overallSentiment.overall}%
              </p>
              <p className="text-sm text-gray-500">Sentiment Score</p>
              <Progress value={overallSentiment.overall} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Smile className="h-5 w-5 text-green-500" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-500">{overallSentiment.positive}%</p>
            <p className="text-sm text-gray-500">Positive</p>
            <p className="text-xs text-green-600 mt-1">↑ 5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Frown className="h-5 w-5 text-red-500" />
              <TrendingDown className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">{overallSentiment.negative}%</p>
            <p className="text-sm text-gray-500">Negative</p>
            <p className="text-xs text-green-600 mt-1">↓ 3% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <Badge variant="outline">Volume</Badge>
            </div>
            <p className="text-3xl font-bold">312</p>
            <p className="text-sm text-gray-500">Communications</p>
            <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <Badge variant="outline">Response</Badge>
            </div>
            <p className="text-3xl font-bold">2.4h</p>
            <p className="text-sm text-gray-500">Avg Response Time</p>
            <p className="text-xs text-green-600 mt-1">30% faster</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="emotions">Emotions</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>7-day sentiment analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sentimentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="positive" stackId="1" stroke={COLORS.positive} fill={COLORS.positive} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="neutral" stackId="1" stroke={COLORS.neutral} fill={COLORS.neutral} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="negative" stackId="1" stroke={COLORS.negative} fill={COLORS.negative} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Communication channels breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.channel}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {channelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Trends Analysis</CardTitle>
              <CardDescription>Detailed sentiment patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={sentimentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="positive" stroke={COLORS.positive} strokeWidth={2} />
                  <Line type="monotone" dataKey="negative" stroke={COLORS.negative} strokeWidth={2} />
                  <Line type="monotone" dataKey="neutral" stroke={COLORS.neutral} strokeWidth={2} />
                  <Line type="monotone" dataKey="volume" stroke="#8884d8" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emotions">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Analysis</CardTitle>
              <CardDescription>Customer emotion breakdown from communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Emotion Levels</h4>
                  <div className="space-y-4">
                    {Object.entries(emotionalProfile).map(([emotion, value]) => (
                      <div key={emotion} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{emotion}</span>
                          <span className="font-medium">{value}%</span>
                        </div>
                        <Progress 
                          value={value} 
                          className="h-2"
                          style={{ 
                            '--progress-background': COLORS[emotion as keyof typeof COLORS] 
                          } as React.CSSProperties}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Emotion Radar</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="10%" 
                      outerRadius="90%" 
                      data={Object.entries(emotionalProfile).map(([key, value], index) => ({
                        name: key,
                        value,
                        fill: Object.values(COLORS)[index + 3]
                      }))}
                    >
                      <RadialBar dataKey="value" />
                      <Legend />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Topic Analysis</CardTitle>
              <CardDescription>Most discussed topics and their sentiment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topicInsights.map((topic) => (
                  <div key={topic.topic} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{topic.topic}</h4>
                        <Badge variant="outline">{topic.mentions} mentions</Badge>
                        <Badge variant={
                          topic.trend === 'improving' ? 'default' :
                          topic.trend === 'declining' ? 'destructive' :
                          'secondary'
                        }>
                          {topic.trend === 'improving' ? '↑' : topic.trend === 'declining' ? '↓' : '→'} {topic.trend}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getSentimentIcon(topic.sentiment)}
                          <span className={`text-sm font-medium ${getSentimentColor(topic.sentiment)}`}>
                            {topic.sentiment}% positive
                          </span>
                        </div>
                        <Progress value={topic.sentiment} className="flex-1 h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <div className="space-y-6">
            {/* Test Analyzer */}
            <Card>
              <CardHeader>
                <CardTitle>Test Sentiment Analyzer</CardTitle>
                <CardDescription>Enter a message to analyze its sentiment in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="test-message">Message to Analyze</Label>
                    <Textarea
                      id="test-message"
                      placeholder="Enter customer message, email, or feedback..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  <Button onClick={analyzeSentiment} disabled={analyzing}>
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze Sentiment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Communications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Communications</CardTitle>
                <CardDescription>Latest analyzed customer interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getChannelIcon(comm.type)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium capitalize">{comm.type}</span>
                              <span className="text-sm text-gray-500">{comm.timestamp}</span>
                              {comm.actionRequired && (
                                <Badge className="bg-orange-500">Action Required</Badge>
                              )}
                              {getPriorityBadge(comm.priority)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getSentimentIcon(comm.sentiment.overall)}
                          <span className={`font-bold ${getSentimentColor(comm.sentiment.overall)}`}>
                            {Math.round(comm.sentiment.overall)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{comm.content}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {comm.topics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Confidence: {Math.round(comm.sentiment.confidence)}%</span>
                        </div>
                      </div>

                      {comm.suggestedResponse && (
                        <Alert className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <span className="font-medium">Suggested Action:</span> {comm.suggestedResponse}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}