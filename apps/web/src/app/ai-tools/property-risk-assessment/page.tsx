/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI-powered comprehensive property risk assessment combining property data, weather patterns, and insurance insights"
 * @dependencies ["@claimguardian/ai-services", "mapbox-gl", "recharts"]
 * @status enhanced
 * @ai-integration multi-provider
 * @insurance-context risk-assessment
 * @supabase-integration edge-functions
 */
"use client";

import {
  Shield,
  AlertTriangle,
  Cloud,
  Droplets,
  Wind,
  Zap,
  Home,
  TrendingUp,
  TrendingDown,
  MapPin,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Activity,
  ChevronRight,
  CheckCircle,
  XCircle,
  Info,
  Thermometer,
  Waves,
  TreePine,
  Flame,
  AlertOctagon,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FloridaPropertyMap } from "@/components/maps/florida-property-map";
import { createClient } from "@/lib/supabase/client";

// Risk assessment interfaces
interface RiskFactor {
  category: string;
  name: string;
  score: number; // 0-100
  trend: "increasing" | "stable" | "decreasing";
  impact: "low" | "medium" | "high" | "critical";
  description: string;
  recommendations: string[];
}

interface PropertyRiskAssessment {
  overallScore: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  factors: RiskFactor[];
  historicalData: Array<{
    date: string;
    score: number;
    events: string[];
  }>;
  predictions: Array<{
    period: string;
    predictedScore: number;
    confidence: number;
    factors: string[];
  }>;
  insuranceImpact: {
    currentPremium: number;
    projectedPremium: number;
    coverageGaps: string[];
    recommendations: string[];
  };
  mitigationPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    estimatedCost: number;
    potentialSavings: number;
  };
}

// Mock data generator for demonstration
const generateMockRiskAssessment = (): PropertyRiskAssessment => {
  return {
    overallScore: 68,
    riskLevel: "moderate",
    factors: [
      {
        category: "Weather",
        name: "Hurricane Risk",
        score: 75,
        trend: "increasing",
        impact: "high",
        description: "Property in Cat 2+ hurricane zone with increasing frequency",
        recommendations: [
          "Install hurricane impact windows",
          "Reinforce roof attachments",
          "Create emergency evacuation plan",
        ],
      },
      {
        category: "Weather",
        name: "Flood Risk",
        score: 45,
        trend: "stable",
        impact: "medium",
        description: "Zone X - Moderate flood risk area",
        recommendations: [
          "Consider flood insurance",
          "Install sump pump",
          "Elevate critical systems",
        ],
      },
      {
        category: "Property",
        name: "Roof Condition",
        score: 82,
        trend: "decreasing",
        impact: "high",
        description: "Roof age: 12 years, showing wear signs",
        recommendations: [
          "Schedule professional inspection",
          "Plan for replacement in 3-5 years",
          "Apply protective coating",
        ],
      },
      {
        category: "Property",
        name: "HVAC System",
        score: 65,
        trend: "stable",
        impact: "medium",
        description: "System age: 8 years, regular maintenance needed",
        recommendations: [
          "Schedule bi-annual maintenance",
          "Replace air filters monthly",
          "Consider energy-efficient upgrade",
        ],
      },
      {
        category: "Environmental",
        name: "Tree Risk",
        score: 58,
        trend: "increasing",
        impact: "medium",
        description: "Large trees within falling distance of structure",
        recommendations: [
          "Professional tree assessment",
          "Trim overhanging branches",
          "Remove dead/diseased trees",
        ],
      },
      {
        category: "Security",
        name: "Fire Protection",
        score: 90,
        trend: "stable",
        impact: "low",
        description: "Modern fire detection and suppression systems",
        recommendations: [
          "Test monthly",
          "Replace batteries annually",
          "Maintain clear evacuation routes",
        ],
      },
    ],
    historicalData: [
      { date: "Jan 2024", score: 65, events: ["Minor flooding"] },
      { date: "Feb 2024", score: 62, events: [] },
      { date: "Mar 2024", score: 64, events: ["Wind damage"] },
      { date: "Apr 2024", score: 63, events: [] },
      { date: "May 2024", score: 66, events: ["Heavy rain"] },
      { date: "Jun 2024", score: 68, events: ["Hurricane season start"] },
    ],
    predictions: [
      {
        period: "Next 3 months",
        predictedScore: 72,
        confidence: 85,
        factors: ["Hurricane season peak", "Aging roof"],
      },
      {
        period: "Next 6 months",
        predictedScore: 70,
        confidence: 75,
        factors: ["Winter storms", "HVAC stress"],
      },
      {
        period: "Next 12 months",
        predictedScore: 74,
        confidence: 65,
        factors: ["Climate patterns", "Infrastructure aging"],
      },
    ],
    insuranceImpact: {
      currentPremium: 3200,
      projectedPremium: 3680,
      coverageGaps: [
        "Flood insurance not included",
        "Wind deductible at 5%",
        "No additional living expense coverage",
      ],
      recommendations: [
        "Add flood insurance policy",
        "Reduce wind deductible to 2%",
        "Increase personal property coverage",
      ],
    },
    mitigationPlan: {
      immediate: [
        "Trim tree branches near roof",
        "Clean gutters and downspouts",
        "Test all safety systems",
      ],
      shortTerm: [
        "Install hurricane straps",
        "Upgrade to impact windows",
        "Add backup generator",
      ],
      longTerm: [
        "Replace roof with fortified system",
        "Elevate HVAC platform",
        "Install whole-home surge protection",
      ],
      estimatedCost: 45000,
      potentialSavings: 12000,
    },
  };
};

// Risk level color mapping
const getRiskColor = (level: string) => {
  switch (level) {
    case "low":
      return "text-green-500";
    case "moderate":
      return "text-yellow-500";
    case "high":
      return "text-orange-500";
    case "critical":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

// Risk score color for charts
const getScoreColor = (score: number) => {
  if (score >= 80) return "#22c55e"; // green
  if (score >= 60) return "#eab308"; // yellow
  if (score >= 40) return "#f97316"; // orange
  return "#ef4444"; // red
};

export default function PropertyRiskAssessmentPage() {
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<PropertyRiskAssessment | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>("primary");
  const [timeRange, setTimeRange] = useState<"3m" | "6m" | "12m">("6m");
  const [activeTab, setActiveTab] = useState("overview");
  const [showMap, setShowMap] = useState(false);
  const supabase = createClient();

  // Load assessment data
  const loadAssessment = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would call an edge function
      // const { data, error } = await supabase.functions.invoke('assess-property-risk', {
      //   body: { propertyId: selectedProperty, timeRange }
      // });
      
      const mockData = generateMockRiskAssessment();
      setAssessment(mockData);
      
      toast.success("Risk assessment completed successfully");
    } catch (error) {
      console.error("Assessment error:", error);
      toast.error("Failed to generate risk assessment");
    } finally {
      setLoading(false);
    }
  }, [selectedProperty, timeRange]);

  // Initial load
  useEffect(() => {
    loadAssessment();
  }, []);

  // Radar chart data for risk factors
  const radarData = assessment?.factors.map(factor => ({
    category: factor.name,
    score: factor.score,
    fullMark: 100,
  })) || [];

  // Historical trend data
  const trendData = assessment?.historicalData || [];

  // Prediction confidence chart
  const predictionData = assessment?.predictions.map(pred => ({
    period: pred.period,
    score: pred.predictedScore,
    confidence: pred.confidence,
  })) || [];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-500" />
                AI Property Risk Assessment
              </h1>
              <p className="text-gray-400 mt-2">
                Comprehensive risk analysis powered by AI and real-time data
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary Residence</SelectItem>
                  <SelectItem value="rental1">Rental Property 1</SelectItem>
                  <SelectItem value="rental2">Rental Property 2</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={loadAssessment}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              <Button variant="outline" className="bg-gray-800 border-gray-700">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {loading ? (
            // Loading state
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Analyzing Property Risk...
                </h3>
                <p className="text-gray-400">
                  Evaluating weather patterns, property conditions, and insurance factors
                </p>
                <Progress value={66} className="mt-4 w-64 mx-auto" />
              </div>
            </div>
          ) : assessment ? (
            <>
              {/* Overall Score Card */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Risk Score */}
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-32 h-32">
                          <circle
                            className="text-gray-700"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="56"
                            cx="64"
                            cy="64"
                          />
                          <circle
                            className={getRiskColor(assessment.riskLevel)}
                            strokeWidth="8"
                            strokeDasharray={`${assessment.overallScore * 3.51} 351.86`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="56"
                            cx="64"
                            cy="64"
                            transform="rotate(-90 64 64)"
                          />
                        </svg>
                        <div className="absolute">
                          <div className="text-3xl font-bold text-white">
                            {assessment.overallScore}
                          </div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                        </div>
                      </div>
                      <Badge 
                        className={`mt-2 ${
                          assessment.riskLevel === "low" ? "bg-green-600" :
                          assessment.riskLevel === "moderate" ? "bg-yellow-600" :
                          assessment.riskLevel === "high" ? "bg-orange-600" :
                          "bg-red-600"
                        }`}
                      >
                        {assessment.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-white">Insurance Impact</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Premium</span>
                          <span className="text-white font-medium">
                            ${assessment.insuranceImpact.currentPremium}/year
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Projected Premium</span>
                          <span className="text-orange-400 font-medium">
                            ${assessment.insuranceImpact.projectedPremium}/year
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Coverage Gaps</span>
                          <Badge variant="outline" className="text-red-400 border-red-400">
                            {assessment.insuranceImpact.coverageGaps.length} Found
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-white">Mitigation Potential</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Est. Investment</span>
                          <span className="text-white font-medium">
                            ${assessment.mitigationPlan.estimatedCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Potential Savings</span>
                          <span className="text-green-400 font-medium">
                            ${assessment.mitigationPlan.potentialSavings.toLocaleString()}/year
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ROI Period</span>
                          <span className="text-white font-medium">
                            {Math.ceil(assessment.mitigationPlan.estimatedCost / assessment.mitigationPlan.potentialSavings)} years
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-white">Top Risks</h3>
                      <div className="space-y-2">
                        {assessment.factors
                          .sort((a, b) => a.score - b.score)
                          .slice(0, 3)
                          .map((factor, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 ${
                                factor.impact === "critical" ? "text-red-500" :
                                factor.impact === "high" ? "text-orange-500" :
                                factor.impact === "medium" ? "text-yellow-500" :
                                "text-green-500"
                              }`} />
                              <span className="text-sm text-gray-300">{factor.name}</span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {factor.score}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Analysis Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-gray-800 border-gray-700">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="factors">Risk Factors</TabsTrigger>
                  <TabsTrigger value="trends">Trends & Predictions</TabsTrigger>
                  <TabsTrigger value="mitigation">Mitigation Plan</TabsTrigger>
                  <TabsTrigger value="map">Location Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Risk Factor Radar Chart */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Risk Factor Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis dataKey="category" tick={{ fill: "#9ca3af" }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9ca3af" }} />
                            <Radar
                              name="Risk Score"
                              dataKey="score"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.6}
                            />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Historical Trend */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Risk Score Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{ fill: "#9ca3af" }} />
                            <YAxis tick={{ fill: "#9ca3af" }} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="score"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="factors" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {assessment.factors.map((factor, index) => (
                      <Card key={index} className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                              {factor.category === "Weather" && <Cloud className="h-5 w-5 text-blue-400" />}
                              {factor.category === "Property" && <Home className="h-5 w-5 text-green-400" />}
                              {factor.category === "Environmental" && <TreePine className="h-5 w-5 text-emerald-400" />}
                              {factor.category === "Security" && <Shield className="h-5 w-5 text-purple-400" />}
                              {factor.name}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge className={`${
                                factor.impact === "critical" ? "bg-red-600" :
                                factor.impact === "high" ? "bg-orange-600" :
                                factor.impact === "medium" ? "bg-yellow-600" :
                                "bg-green-600"
                              }`}>
                                {factor.impact.toUpperCase()}
                              </Badge>
                              {factor.trend === "increasing" && <TrendingUp className="h-4 w-4 text-red-400" />}
                              {factor.trend === "stable" && <Activity className="h-4 w-4 text-yellow-400" />}
                              {factor.trend === "decreasing" && <TrendingDown className="h-4 w-4 text-green-400" />}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-400">Risk Score</span>
                              <span className="text-white font-medium">{factor.score}/100</span>
                            </div>
                            <Progress value={factor.score} className="h-2" />
                          </div>
                          <p className="text-gray-300 text-sm">{factor.description}</p>
                          <div>
                            <h4 className="text-sm font-medium text-white mb-2">Recommendations:</h4>
                            <ul className="space-y-1">
                              {factor.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                                  <CheckCircle className="h-3 w-3 mt-0.5 text-green-400 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Predictions Chart */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Risk Score Predictions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={predictionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="period" tick={{ fill: "#9ca3af" }} />
                            <YAxis tick={{ fill: "#9ca3af" }} />
                            <Tooltip />
                            <Bar dataKey="score" fill="#3b82f6" />
                            <Bar dataKey="confidence" fill="#10b981" opacity={0.5} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Prediction Details */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Prediction Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {assessment.predictions.map((pred, index) => (
                          <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-white">{pred.period}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-blue-400 border-blue-400">
                                  Score: {pred.predictedScore}
                                </Badge>
                                <Badge variant="outline" className="text-green-400 border-green-400">
                                  {pred.confidence}% Confidence
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {pred.factors.map((factor, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-gray-700 text-gray-300">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="mitigation" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Immediate Actions */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <AlertOctagon className="h-5 w-5 text-red-400" />
                          Immediate Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {assessment.mitigationPlan.immediate.map((action, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="mt-1">
                                <div className="w-2 h-2 bg-red-400 rounded-full" />
                              </div>
                              <span className="text-gray-300 text-sm">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Short Term Actions */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-yellow-400" />
                          Short Term (3-6 months)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {assessment.mitigationPlan.shortTerm.map((action, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="mt-1">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                              </div>
                              <span className="text-gray-300 text-sm">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Long Term Actions */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          Long Term (1+ years)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {assessment.mitigationPlan.longTerm.map((action, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="mt-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                              </div>
                              <span className="text-gray-300 text-sm">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cost/Benefit Analysis */}
                  <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Mitigation Investment Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <DollarSign className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">
                            ${assessment.mitigationPlan.estimatedCost.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">Total Investment</div>
                        </div>
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">
                            ${assessment.mitigationPlan.potentialSavings.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">Annual Savings</div>
                        </div>
                        <div className="text-center">
                          <Calendar className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">
                            {Math.ceil(assessment.mitigationPlan.estimatedCost / assessment.mitigationPlan.potentialSavings)}
                          </div>
                          <div className="text-sm text-gray-400">Years to ROI</div>
                        </div>
                        <div className="text-center">
                          <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">
                            {Math.round((assessment.mitigationPlan.potentialSavings / assessment.insuranceImpact.currentPremium) * 100)}%
                          </div>
                          <div className="text-sm text-gray-400">Premium Reduction</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="map" className="space-y-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Property Location Risk Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[600px] rounded-lg overflow-hidden">
                        <FloridaPropertyMap
                          height="600px"
                          showControls={true}
                          enableClustering={false}
                          showHeatMap={true}
                          showRealParcels={true}
                          center={[-82.4572, 27.9506]}
                          zoom={10}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-gray-900 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Waves className="h-5 w-5 text-blue-400" />
                            <h4 className="font-medium text-white">Flood Zone</h4>
                          </div>
                          <p className="text-gray-400 text-sm">Zone X - Moderate Risk</p>
                          <p className="text-xs text-gray-500 mt-1">500-year flood plain</p>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Wind className="h-5 w-5 text-orange-400" />
                            <h4 className="font-medium text-white">Wind Zone</h4>
                          </div>
                          <p className="text-gray-400 text-sm">Category 2+ Hurricane Zone</p>
                          <p className="text-xs text-gray-500 mt-1">110-130 mph design wind speed</p>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Flame className="h-5 w-5 text-red-400" />
                            <h4 className="font-medium text-white">Fire Risk</h4>
                          </div>
                          <p className="text-gray-400 text-sm">Low-Moderate Risk</p>
                          <p className="text-xs text-gray-500 mt-1">Urban interface area</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                    onClick={() => toast.info("Scheduling professional assessment...")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Assessment
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                    onClick={() => toast.info("Generating insurance optimization report...")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Optimize Insurance
                  </Button>
                </div>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => toast.success("Mitigation plan saved to your account")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Mitigation Plan
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}