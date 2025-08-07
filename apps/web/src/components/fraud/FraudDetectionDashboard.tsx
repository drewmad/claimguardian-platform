"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Brain,
  Activity,
  FileSearch,
  UserX,
  MapPin,
  Clock,
  DollarSign,
  Camera,
  FileText,
  RefreshCw,
  Download,
  Eye,
  Info,
  Zap,
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FraudIndicator {
  id: string;
  type: "behavioral" | "documentary" | "pattern" | "network";
  severity: "low" | "medium" | "high" | "critical";
  indicator: string;
  description: string;
  evidence: string[];
  confidence: number;
}

interface FraudAlert {
  id: string;
  claimId: string;
  riskScore: number;
  status: "pending" | "investigating" | "cleared" | "confirmed";
  indicators: FraudIndicator[];
  timestamp: string;
  reviewedBy?: string;
  resolution?: string;
}

interface FraudMetrics {
  totalScreened: number;
  flaggedClaims: number;
  confirmedFraud: number;
  falsePositives: number;
  avgRiskScore: number;
  savedAmount: number;
}

interface RiskProfile {
  behavioral: number;
  documentary: number;
  pattern: number;
  network: number;
  overall: number;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export function FraudDetectionDashboard() {
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [metrics, setMetrics] = useState<FraudMetrics>({
    totalScreened: 15234,
    flaggedClaims: 342,
    confirmedFraud: 28,
    falsePositives: 89,
    avgRiskScore: 32,
    savedAmount: 2847500,
  });
  const supabase = createClient();

  // Mock data for demonstration
  const recentAlerts: FraudAlert[] = [
    {
      id: "1",
      claimId: "CLM-2024-0892",
      riskScore: 87,
      status: "investigating",
      timestamp: "2 hours ago",
      indicators: [
        {
          id: "1",
          type: "documentary",
          severity: "high",
          indicator: "Image Manipulation Detected",
          description: "EXIF data shows photos edited after incident date",
          evidence: [
            "Photo metadata altered",
            "Photoshop traces found",
            "Lighting inconsistencies",
          ],
          confidence: 92,
        },
        {
          id: "2",
          type: "behavioral",
          severity: "medium",
          indicator: "Rapid Claim Submission",
          description: "Claim filed within 1 hour of policy activation",
          evidence: ["Policy: 14:23", "Incident: 14:45", "Claim: 15:12"],
          confidence: 78,
        },
        {
          id: "3",
          type: "pattern",
          severity: "high",
          indicator: "Similar Claims Pattern",
          description: "3 similar claims from linked addresses in 6 months",
          evidence: [
            "Same damage type",
            "Related parties",
            "Sequential timing",
          ],
          confidence: 85,
        },
      ],
    },
    {
      id: "2",
      claimId: "CLM-2024-0887",
      riskScore: 62,
      status: "pending",
      timestamp: "5 hours ago",
      indicators: [
        {
          id: "4",
          type: "network",
          severity: "medium",
          indicator: "Contractor Connection",
          description: "Contractor linked to multiple suspicious claims",
          evidence: [
            "8 claims in 3 months",
            "All high-value",
            "Same estimator",
          ],
          confidence: 71,
        },
        {
          id: "5",
          type: "documentary",
          severity: "low",
          indicator: "Invoice Anomalies",
          description: "Unusually high repair estimates compared to damage",
          evidence: ["200% above average", "Round numbers", "No itemization"],
          confidence: 65,
        },
      ],
    },
    {
      id: "3",
      claimId: "CLM-2024-0881",
      riskScore: 34,
      status: "cleared",
      timestamp: "1 day ago",
      resolution: "Verified legitimate - unusual circumstances explained",
      reviewedBy: "Sarah Johnson",
      indicators: [
        {
          id: "6",
          type: "behavioral",
          severity: "low",
          indicator: "Multiple Claims History",
          description: "Claimant has 4 claims in 2 years",
          evidence: [
            "Weather-related",
            "Different properties",
            "Documented storms",
          ],
          confidence: 45,
        },
      ],
    },
  ];

  const riskDistribution = [
    { range: "0-20", count: 8234, color: "#22c55e" },
    { range: "21-40", count: 5123, color: "#3b82f6" },
    { range: "41-60", count: 1456, color: "#eab308" },
    { range: "61-80", count: 287, color: "#f97316" },
    { range: "81-100", count: 134, color: "#ef4444" },
  ];

  const fraudTrends = [
    { month: "Jan", detected: 28, prevented: 24, falsePositive: 12 },
    { month: "Feb", detected: 32, prevented: 28, falsePositive: 15 },
    { month: "Mar", detected: 35, prevented: 31, falsePositive: 10 },
    { month: "Apr", detected: 29, prevented: 26, falsePositive: 8 },
    { month: "May", detected: 38, prevented: 34, falsePositive: 11 },
    { month: "Jun", detected: 42, prevented: 37, falsePositive: 14 },
  ];

  const fraudTypes = [
    { type: "Staged Damage", value: 35, cases: 12 },
    { type: "Inflated Claims", value: 28, cases: 10 },
    { type: "False Documentation", value: 20, cases: 7 },
    { type: "Identity Fraud", value: 10, cases: 3 },
    { type: "Contractor Fraud", value: 7, cases: 2 },
  ];

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async () => {
    setLoading(true);
    try {
      // Load actual fraud detection data from Supabase
      const { data: fraudAlerts, error } = await supabase
        .from("fraud_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (fraudAlerts) {
        // Process and set real alerts
      }

      // For demo, use mock data
      setAlerts(recentAlerts);
    } catch (error) {
      console.error("Error loading fraud data:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeClaim = async (claimId: string) => {
    setAnalyzing(true);
    setSelectedClaim(claimId);

    try {
      // Call fraud detection Edge Function
      const response = await fetch("/api/fraud-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Fraud analysis complete");
        loadFraudData();
      }
    } catch (error) {
      console.error("Error analyzing claim:", error);
      toast.error("Failed to analyze claim");
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-yellow-500";
    if (score >= 20) return "text-blue-500";
    return "text-green-500";
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-500">Critical Risk</Badge>;
    if (score >= 60) return <Badge className="bg-orange-500">High Risk</Badge>;
    if (score >= 40)
      return <Badge className="bg-yellow-500">Medium Risk</Badge>;
    if (score >= 20) return <Badge className="bg-blue-500">Low Risk</Badge>;
    return <Badge className="bg-green-500">Minimal Risk</Badge>;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Info className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Fraud Detection System</span>
          </h2>
          <p className="text-gray-600">
            AI-powered fraud detection and prevention
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadFraudData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileSearch className="h-5 w-5 text-gray-500" />
              <Badge variant="outline">Total</Badge>
            </div>
            <p className="text-2xl font-bold">
              {metrics.totalScreened.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Claims Screened</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <Badge className="bg-yellow-500">Flagged</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.flaggedClaims}</p>
            <p className="text-xs text-gray-500">Suspicious Claims</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <Badge className="bg-red-500">Confirmed</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.confirmedFraud}</p>
            <p className="text-xs text-gray-500">Fraud Cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <Badge className="bg-green-500">Cleared</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.falsePositives}</p>
            <p className="text-xs text-gray-500">False Positives</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <Badge className="bg-blue-500">Avg</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.avgRiskScore}%</p>
            <p className="text-xs text-gray-500">Risk Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <Badge className="bg-green-500">Saved</Badge>
            </div>
            <p className="text-2xl font-bold">
              ${(metrics.savedAmount / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-gray-500">Prevented Loss</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Fraud Patterns</TabsTrigger>
          <TabsTrigger value="network">Network Graph</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Active Fraud Alerts</CardTitle>
              <CardDescription>
                Claims flagged for potential fraudulent activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold">{alert.claimId}</h4>
                          {getRiskBadge(alert.riskScore)}
                          <Badge
                            variant={
                              alert.status === "investigating"
                                ? "default"
                                : alert.status === "confirmed"
                                  ? "destructive"
                                  : alert.status === "cleared"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {alert.timestamp}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-3xl font-bold ${getRiskColor(alert.riskScore)}`}
                        >
                          {alert.riskScore}%
                        </p>
                        <p className="text-xs text-gray-500">Risk Score</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {alert.indicators.map((indicator) => (
                        <div
                          key={indicator.id}
                          className="flex items-start space-x-2 p-2 bg-gray-50 rounded"
                        >
                          {getSeverityIcon(indicator.severity)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">
                                {indicator.indicator}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {indicator.type}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {indicator.confidence}% confidence
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {indicator.description}
                            </p>
                            {indicator.evidence.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">
                                  Evidence:
                                </p>
                                <ul className="text-xs text-gray-600 ml-4 mt-1">
                                  {indicator.evidence.map((e, i) => (
                                    <li key={i} className="list-disc">
                                      {e}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {alert.status === "cleared" && alert.resolution && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Resolution:</span>{" "}
                          {alert.resolution}
                        </p>
                        {alert.reviewedBy && (
                          <p className="text-xs text-green-600 mt-1">
                            Reviewed by {alert.reviewedBy}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end mt-3 space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {alert.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Investigate
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Score Distribution</CardTitle>
                <CardDescription>Claims grouped by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count">
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fraud Type Breakdown</CardTitle>
                <CardDescription>
                  Distribution of detected fraud types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={fraudTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.type}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fraudTypes.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Pattern Recognition</CardTitle>
              <CardDescription>
                AI-identified patterns and anomalies across claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium mb-2">Behavioral Patterns</h4>
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Quick Claim Pattern</div>
                      <div className="text-sm mt-1">
                        23 claims filed within 48 hours of policy activation
                      </div>
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Time-based Clustering</div>
                      <div className="text-sm mt-1">
                        Unusual spike in claims every 3rd Friday of month
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium mb-2">Network Patterns</h4>
                  <Alert>
                    <UserX className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Contractor Network</div>
                      <div className="text-sm mt-1">
                        5 contractors linked to 78% of flagged claims
                      </div>
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Geographic Cluster</div>
                      <div className="text-sm mt-1">
                        Abnormal claim density in ZIP codes 33101-33105
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Network Visualization</CardTitle>
              <CardDescription>
                Connections between suspicious claims, contractors, and
                addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Interactive network graph</p>
                  <p className="text-sm text-gray-500">
                    Visualizes relationships between claims, parties, and
                    contractors
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Trends</CardTitle>
              <CardDescription>
                Historical fraud detection and prevention metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={fraudTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="detected"
                    stroke="#ef4444"
                    name="Detected"
                  />
                  <Line
                    type="monotone"
                    dataKey="prevented"
                    stroke="#22c55e"
                    name="Prevented"
                  />
                  <Line
                    type="monotone"
                    dataKey="falsePositive"
                    stroke="#3b82f6"
                    name="False Positives"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">94%</p>
                  <p className="text-sm text-gray-600">Detection Accuracy</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">2.3 hrs</p>
                  <p className="text-sm text-gray-600">Avg Detection Time</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">$2.8M</p>
                  <p className="text-sm text-gray-600">Total Saved YTD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
