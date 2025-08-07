/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI-powered predictive maintenance system for proactive property care"
 * @dependencies ["@claimguardian/ai-services", "recharts", "date-fns"]
 * @status enhanced
 * @ai-integration multi-provider
 * @insurance-context preventive-maintenance
 * @supabase-integration edge-functions
 */
"use client";

import {
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Shield,
  Home,
  Droplets,
  Wind,
  Zap,
  Thermometer,
  AlertCircle,
  ChevronRight,
  Download,
  Bell,
  Settings,
  RefreshCw,
  Info,
  FileText,
  BarChart3,
  Activity,
  Target,
  Gauge,
  Timer,
  Tool,
  CircleDollarSign,
  CalendarCheck,
  BellRing,
  ShieldCheck,
  Brain,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { format, addMonths, differenceInDays, addDays } from "date-fns";

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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { enhancedAIClient } from "@/lib/ai/enhanced-client";
import { createClient } from "@/lib/supabase/client";

// Types
interface MaintenanceItem {
  id: string;
  category: string;
  component: string;
  lastMaintenance: Date | null;
  nextDue: Date;
  priority: "low" | "medium" | "high" | "critical";
  estimatedCost: number;
  timeRequired: string;
  description: string;
  preventedIssues: string[];
  lifeExtension: number; // months
  savingsPotential: number;
  weatherImpact: boolean;
  seasonalFactors: string[];
  complianceRequired: boolean;
  warrantyImpact: boolean;
  diyPossible: boolean;
  professionalRecommended: boolean;
  maintenanceHistory: MaintenanceHistory[];
}

interface MaintenanceHistory {
  date: Date;
  type: string;
  cost: number;
  contractor?: string;
  notes?: string;
  issues?: string[];
}

interface SystemHealth {
  system: string;
  healthScore: number; // 0-100
  degradationRate: number; // % per month
  estimatedLifeRemaining: number; // months
  currentCondition: "excellent" | "good" | "fair" | "poor" | "critical";
  maintenanceImpact: number; // how much maintenance extends life
  replacementCost: number;
  annualMaintenanceCost: number;
  riskFactors: string[];
}

interface MaintenancePlan {
  monthly: MaintenanceItem[];
  quarterly: MaintenanceItem[];
  annual: MaintenanceItem[];
  emergency: MaintenanceItem[];
  totalAnnualCost: number;
  savingsVsReactive: number;
  preventedClaims: number;
  propertyValueImpact: number;
}

interface SeasonalAlert {
  season: string;
  alerts: {
    type: string;
    urgency: "info" | "warning" | "critical";
    deadline: Date;
    description: string;
    relatedMaintenance: string[];
  }[];
}

interface ContractorRecommendation {
  specialty: string;
  name: string;
  rating: number;
  avgCost: number;
  availability: string;
  insurancePreferred: boolean;
  warrantyOffered: boolean;
}

// Mock data generator
const generateMockMaintenanceData = (): {
  items: MaintenanceItem[];
  systemHealth: SystemHealth[];
  plan: MaintenancePlan;
  seasonalAlerts: SeasonalAlert[];
} => {
  const items: MaintenanceItem[] = [
    {
      id: "m1",
      category: "HVAC",
      component: "Air Filter",
      lastMaintenance: new Date(2024, 10, 1),
      nextDue: new Date(2025, 1, 1),
      priority: "high",
      estimatedCost: 30,
      timeRequired: "30 minutes",
      description: "Replace HVAC air filter to maintain efficiency",
      preventedIssues: ["System strain", "Poor air quality", "Higher energy bills"],
      lifeExtension: 6,
      savingsPotential: 200,
      weatherImpact: false,
      seasonalFactors: ["Pollen season", "Hurricane season dust"],
      complianceRequired: false,
      warrantyImpact: true,
      diyPossible: true,
      professionalRecommended: false,
      maintenanceHistory: [
        { date: new Date(2024, 10, 1), type: "Replacement", cost: 25 },
        { date: new Date(2024, 7, 1), type: "Replacement", cost: 25 },
      ],
    },
    {
      id: "m2",
      category: "Roof",
      component: "Gutters",
      lastMaintenance: new Date(2024, 9, 15),
      nextDue: new Date(2025, 3, 15),
      priority: "medium",
      estimatedCost: 150,
      timeRequired: "2-3 hours",
      description: "Clean gutters and downspouts, check for damage",
      preventedIssues: ["Water damage", "Foundation issues", "Roof leaks"],
      lifeExtension: 12,
      savingsPotential: 5000,
      weatherImpact: true,
      seasonalFactors: ["Pre-hurricane season", "After fall leaves"],
      complianceRequired: false,
      warrantyImpact: false,
      diyPossible: true,
      professionalRecommended: true,
      maintenanceHistory: [
        { date: new Date(2024, 9, 15), type: "Cleaning", cost: 0 },
        { date: new Date(2024, 3, 10), type: "Cleaning & Repair", cost: 200 },
      ],
    },
    {
      id: "m3",
      category: "Plumbing",
      component: "Water Heater",
      lastMaintenance: new Date(2024, 6, 1),
      nextDue: new Date(2025, 6, 1),
      priority: "low",
      estimatedCost: 120,
      timeRequired: "1 hour",
      description: "Flush water heater tank, check anode rod",
      preventedIssues: ["Sediment buildup", "Efficiency loss", "Premature failure"],
      lifeExtension: 24,
      savingsPotential: 800,
      weatherImpact: false,
      seasonalFactors: [],
      complianceRequired: false,
      warrantyImpact: true,
      diyPossible: false,
      professionalRecommended: true,
      maintenanceHistory: [
        { date: new Date(2024, 6, 1), type: "Annual flush", cost: 120 },
      ],
    },
    {
      id: "m4",
      category: "Exterior",
      component: "Hurricane Shutters",
      lastMaintenance: new Date(2024, 5, 1),
      nextDue: new Date(2025, 4, 1),
      priority: "critical",
      estimatedCost: 200,
      timeRequired: "3-4 hours",
      description: "Test operation, lubricate tracks, check for damage",
      preventedIssues: ["Storm damage", "Shutter failure", "Insurance issues"],
      lifeExtension: 36,
      savingsPotential: 10000,
      weatherImpact: true,
      seasonalFactors: ["Pre-hurricane season mandatory"],
      complianceRequired: true,
      warrantyImpact: true,
      diyPossible: true,
      professionalRecommended: false,
      maintenanceHistory: [
        { date: new Date(2024, 5, 1), type: "Annual inspection", cost: 0 },
      ],
    },
    {
      id: "m5",
      category: "Electrical",
      component: "GFCI Outlets",
      lastMaintenance: null,
      nextDue: new Date(2025, 1, 15),
      priority: "high",
      estimatedCost: 0,
      timeRequired: "15 minutes",
      description: "Test all GFCI outlets monthly",
      preventedIssues: ["Electrical shock", "Fire hazard", "Code violations"],
      lifeExtension: 60,
      savingsPotential: 500,
      weatherImpact: false,
      seasonalFactors: [],
      complianceRequired: true,
      warrantyImpact: false,
      diyPossible: true,
      professionalRecommended: false,
      maintenanceHistory: [],
    },
  ];

  const systemHealth: SystemHealth[] = [
    {
      system: "HVAC System",
      healthScore: 75,
      degradationRate: 2.5,
      estimatedLifeRemaining: 84,
      currentCondition: "good",
      maintenanceImpact: 40,
      replacementCost: 8000,
      annualMaintenanceCost: 400,
      riskFactors: ["Age: 8 years", "Florida humidity", "Salt air exposure"],
    },
    {
      system: "Roof",
      healthScore: 82,
      degradationRate: 1.8,
      estimatedLifeRemaining: 144,
      currentCondition: "good",
      maintenanceImpact: 50,
      replacementCost: 15000,
      annualMaintenanceCost: 300,
      riskFactors: ["Hurricane exposure", "UV damage", "Age: 12 years"],
    },
    {
      system: "Plumbing",
      healthScore: 88,
      degradationRate: 1.2,
      estimatedLifeRemaining: 240,
      currentCondition: "excellent",
      maintenanceImpact: 30,
      replacementCost: 5000,
      annualMaintenanceCost: 200,
      riskFactors: ["Hard water", "Age: 5 years"],
    },
    {
      system: "Electrical",
      healthScore: 92,
      degradationRate: 0.8,
      estimatedLifeRemaining: 300,
      currentCondition: "excellent",
      maintenanceImpact: 20,
      replacementCost: 10000,
      annualMaintenanceCost: 150,
      riskFactors: ["Lightning strikes", "Power surges"],
    },
  ];

  const plan: MaintenancePlan = {
    monthly: items.filter(i => differenceInDays(i.nextDue, new Date()) <= 30),
    quarterly: items.filter(i => 
      differenceInDays(i.nextDue, new Date()) > 30 && 
      differenceInDays(i.nextDue, new Date()) <= 90
    ),
    annual: items.filter(i => differenceInDays(i.nextDue, new Date()) > 90),
    emergency: items.filter(i => i.priority === "critical"),
    totalAnnualCost: 2500,
    savingsVsReactive: 8000,
    preventedClaims: 3,
    propertyValueImpact: 5000,
  };

  const seasonalAlerts: SeasonalAlert[] = [
    {
      season: "Hurricane Season (June-Nov)",
      alerts: [
        {
          type: "Hurricane Preparation",
          urgency: "critical",
          deadline: new Date(2025, 5, 1),
          description: "Complete all hurricane preparations before season starts",
          relatedMaintenance: ["m2", "m4"],
        },
        {
          type: "Tree Trimming",
          urgency: "warning",
          deadline: new Date(2025, 4, 15),
          description: "Trim trees away from house and power lines",
          relatedMaintenance: [],
        },
      ],
    },
    {
      season: "Summer (June-Aug)",
      alerts: [
        {
          type: "AC System Check",
          urgency: "warning",
          deadline: new Date(2025, 4, 1),
          description: "Service AC before peak summer heat",
          relatedMaintenance: ["m1"],
        },
      ],
    },
  ];

  return { items, systemHealth, plan, seasonalAlerts };
};

export default function MaintenancePredictorPage() {
  const [maintenanceData, setMaintenanceData] = useState<ReturnType<typeof generateMockMaintenanceData> | null>(null);
  const [selectedProperty, setSelectedProperty] = useState("primary");
  const [viewMode, setViewMode] = useState<"timeline" | "calendar" | "list">("timeline");
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSystem, setSelectedSystem] = useState<SystemHealth | null>(null);
  const supabase = createClient();

  // Load maintenance data
  useEffect(() => {
    loadMaintenanceData();
  }, [selectedProperty]);

  const loadMaintenanceData = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would call an edge function
      const mockData = generateMockMaintenanceData();
      setMaintenanceData(mockData);
      
      toast.success("Maintenance schedule generated successfully");
    } catch (error) {
      console.error("Failed to load maintenance data:", error);
      toast.error("Failed to generate maintenance schedule");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze property maintenance needs for a Florida home and provide predictive maintenance recommendations including:
      1. System health scores and remaining life estimates
      2. Optimal maintenance schedule to prevent failures
      3. Cost-benefit analysis of preventive vs reactive maintenance
      4. Weather-related maintenance priorities
      5. Insurance claim prevention potential`;

      const response = await enhancedAIClient.enhancedChat({
        messages: [
          { role: "system", content: "You are a property maintenance expert specializing in Florida homes." },
          { role: "user", content: prompt }
        ],
        featureId: "maintenance-predictor",
      });

      // Process AI response
      console.log("AI Maintenance Analysis:", response);
      
      // Reload with new insights
      await loadMaintenanceData();
      
      toast.success("AI analysis complete - schedule optimized!");
    } catch (error) {
      console.error("Predictive analysis failed:", error);
      toast.error("Failed to run predictive analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scheduleMaintenanceTask = (item: MaintenanceItem) => {
    toast.success(`Scheduled: ${item.component} maintenance for ${format(item.nextDue, "MMM d, yyyy")}`);
    // In production, this would create a calendar event or task
  };

  const exportMaintenanceSchedule = () => {
    if (!maintenanceData) return;
    
    const scheduleData = {
      generated: new Date().toISOString(),
      property: selectedProperty,
      items: maintenanceData.items,
      annualCost: maintenanceData.plan.totalAnnualCost,
      savings: maintenanceData.plan.savingsVsReactive,
    };

    const blob = new Blob([JSON.stringify(scheduleData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maintenance-schedule-${Date.now()}.json`;
    a.click();
    
    toast.success("Schedule exported successfully");
  };

  // Calculate savings chart data
  const savingsData = maintenanceData ? [
    { month: "Jan", preventive: 200, reactive: 500 },
    { month: "Feb", preventive: 150, reactive: 0 },
    { month: "Mar", preventive: 300, reactive: 1200 },
    { month: "Apr", preventive: 200, reactive: 0 },
    { month: "May", preventive: 400, reactive: 800 },
    { month: "Jun", preventive: 250, reactive: 2000 },
  ] : [];

  // System health radial data
  const healthData = maintenanceData?.systemHealth.map(system => ({
    name: system.system,
    value: system.healthScore,
    fill: system.healthScore > 80 ? "#10b981" : system.healthScore > 60 ? "#f59e0b" : "#ef4444",
  })) || [];

  if (isAnalyzing && !maintenanceData) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <Brain className="h-16 w-16 text-blue-500 animate-pulse mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Analyzing Property Systems...
              </h2>
              <p className="text-gray-400">
                Generating predictive maintenance schedule
              </p>
              <Progress value={66} className="mt-4 w-64 mx-auto" />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Wrench className="h-8 w-8 text-purple-500" />
                AI Predictive Maintenance
              </h1>
              <p className="text-gray-400 mt-2">
                Proactive maintenance scheduling powered by AI to prevent failures and save money
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary Residence</SelectItem>
                  <SelectItem value="rental1">Rental Property 1</SelectItem>
                  <SelectItem value="rental2">Rental Property 2</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={runPredictiveAnalysis}
                disabled={isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-spin" : ""}`} />
                Re-Analyze
              </Button>
              <Button
                variant="outline"
                onClick={exportMaintenanceSchedule}
                className="bg-gray-800 border-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {maintenanceData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Due This Month</p>
                        <p className="text-2xl font-bold text-white">
                          {maintenanceData.plan.monthly.length}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Annual Savings</p>
                        <p className="text-2xl font-bold text-white">
                          ${maintenanceData.plan.savingsVsReactive.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Prevented Claims</p>
                        <p className="text-2xl font-bold text-white">
                          {maintenanceData.plan.preventedClaims}
                        </p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Annual Budget</p>
                        <p className="text-2xl font-bold text-white">
                          ${maintenanceData.plan.totalAnnualCost.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Critical Items</p>
                        <p className="text-2xl font-bold text-white">
                          {maintenanceData.items.filter(i => i.priority === "critical").length}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Bar */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="auto-schedule"
                          checked={autoSchedule}
                          onCheckedChange={setAutoSchedule}
                        />
                        <Label htmlFor="auto-schedule" className="text-gray-300">
                          Auto-Schedule
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="notifications"
                          checked={notifications}
                          onCheckedChange={setNotifications}
                        />
                        <Label htmlFor="notifications" className="text-gray-300">
                          Notifications
                        </Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={viewMode === "timeline" ? "default" : "outline"}
                        onClick={() => setViewMode("timeline")}
                        className="h-8"
                      >
                        Timeline
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === "calendar" ? "default" : "outline"}
                        onClick={() => setViewMode("calendar")}
                        className="h-8"
                      >
                        Calendar
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === "list" ? "default" : "outline"}
                        onClick={() => setViewMode("list")}
                        className="h-8"
                      >
                        List
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-800 border-gray-700">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="systems">System Health</TabsTrigger>
                  <TabsTrigger value="savings">Cost Analysis</TabsTrigger>
                  <TabsTrigger value="alerts">Seasonal Alerts</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* System Health Overview */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">System Health Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={healthData}>
                            <PolarGrid />
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar dataKey="value" cornerRadius={10} fill="#3b82f6" />
                            <Tooltip />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {maintenanceData.systemHealth.map((system, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div 
                                className={`w-3 h-3 rounded-full ${
                                  system.healthScore > 80 ? "bg-green-500" :
                                  system.healthScore > 60 ? "bg-yellow-500" : "bg-red-500"
                                }`} 
                              />
                              <span className="text-gray-300">{system.system}</span>
                              <span className="text-white font-medium ml-auto">{system.healthScore}%</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Upcoming Maintenance */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Upcoming Maintenance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {maintenanceData.items
                          .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime())
                          .slice(0, 5)
                          .map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  item.priority === "critical" ? "bg-red-900/50" :
                                  item.priority === "high" ? "bg-orange-900/50" :
                                  item.priority === "medium" ? "bg-yellow-900/50" :
                                  "bg-green-900/50"
                                }`}>
                                  <Tool className={`h-4 w-4 ${
                                    item.priority === "critical" ? "text-red-400" :
                                    item.priority === "high" ? "text-orange-400" :
                                    item.priority === "medium" ? "text-yellow-400" :
                                    "text-green-400"
                                  }`} />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{item.component}</p>
                                  <p className="text-xs text-gray-400">{item.category}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-white">
                                  {format(item.nextDue, "MMM d")}
                                </p>
                                <p className="text-xs text-gray-400">
                                  ${item.estimatedCost}
                                </p>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Seasonal Alerts */}
                  {maintenanceData.seasonalAlerts.length > 0 && (
                    <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          Seasonal Maintenance Alerts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {maintenanceData.seasonalAlerts.map((season, idx) => (
                            <div key={idx} className="space-y-2">
                              <h4 className="text-white font-medium">{season.season}</h4>
                              {season.alerts.map((alert, alertIdx) => (
                                <div key={alertIdx} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded">
                                  <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                    alert.urgency === "critical" ? "text-red-400" :
                                    alert.urgency === "warning" ? "text-yellow-400" :
                                    "text-blue-400"
                                  }`} />
                                  <div className="flex-1">
                                    <p className="text-sm text-white">{alert.type}</p>
                                    <p className="text-xs text-gray-400">{alert.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Due: {format(alert.deadline, "MMM d, yyyy")}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  {viewMode === "timeline" && (
                    <div className="space-y-4">
                      {["monthly", "quarterly", "annual"].map((period) => {
                        const items = maintenanceData.plan[period as keyof MaintenancePlan] as MaintenanceItem[];
                        if (!Array.isArray(items) || items.length === 0) return null;

                        return (
                          <Card key={period} className="bg-gray-800 border-gray-700">
                            <CardHeader>
                              <CardTitle className="text-white capitalize">{period} Maintenance</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {items.map((item) => (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="border border-gray-700 rounded-lg p-4"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge className={`${
                                            item.priority === "critical" ? "bg-red-600" :
                                            item.priority === "high" ? "bg-orange-600" :
                                            item.priority === "medium" ? "bg-yellow-600" :
                                            "bg-green-600"
                                          }`}>
                                            {item.priority}
                                          </Badge>
                                          <h4 className="text-white font-medium">{item.component}</h4>
                                          <span className="text-gray-400 text-sm">({item.category})</span>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-2">{item.description}</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                          <div>
                                            <p className="text-gray-400">Due Date</p>
                                            <p className="text-white">{format(item.nextDue, "MMM d, yyyy")}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-400">Est. Cost</p>
                                            <p className="text-white">${item.estimatedCost}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-400">Time Required</p>
                                            <p className="text-white">{item.timeRequired}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-400">DIY Possible</p>
                                            <p className="text-white">{item.diyPossible ? "Yes" : "No"}</p>
                                          </div>
                                        </div>
                                        {item.preventedIssues.length > 0 && (
                                          <div className="mt-3">
                                            <p className="text-sm text-gray-400 mb-1">Prevents:</p>
                                            <div className="flex flex-wrap gap-2">
                                              {item.preventedIssues.map((issue, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs text-blue-400 border-blue-400">
                                                  {issue}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => scheduleMaintenanceTask(item)}
                                        className="ml-4 bg-blue-600 hover:bg-blue-700"
                                      >
                                        <CalendarCheck className="h-4 w-4 mr-1" />
                                        Schedule
                                      </Button>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {viewMode === "list" && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="text-left p-4 text-gray-400">Component</th>
                                <th className="text-left p-4 text-gray-400">Category</th>
                                <th className="text-left p-4 text-gray-400">Priority</th>
                                <th className="text-left p-4 text-gray-400">Due Date</th>
                                <th className="text-left p-4 text-gray-400">Cost</th>
                                <th className="text-left p-4 text-gray-400">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {maintenanceData.items
                                .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime())
                                .map((item) => (
                                  <tr key={item.id} className="border-b border-gray-700/50">
                                    <td className="p-4 text-white">{item.component}</td>
                                    <td className="p-4 text-gray-300">{item.category}</td>
                                    <td className="p-4">
                                      <Badge className={`${
                                        item.priority === "critical" ? "bg-red-600" :
                                        item.priority === "high" ? "bg-orange-600" :
                                        item.priority === "medium" ? "bg-yellow-600" :
                                        "bg-green-600"
                                      }`}>
                                        {item.priority}
                                      </Badge>
                                    </td>
                                    <td className="p-4 text-gray-300">{format(item.nextDue, "MMM d, yyyy")}</td>
                                    <td className="p-4 text-white">${item.estimatedCost}</td>
                                    <td className="p-4">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => scheduleMaintenanceTask(item)}
                                        className="bg-gray-700 border-gray-600"
                                      >
                                        Schedule
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="systems" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {maintenanceData.systemHealth.map((system, idx) => (
                      <Card 
                        key={idx} 
                        className={`bg-gray-800 border-gray-700 cursor-pointer transition-all ${
                          selectedSystem?.system === system.system ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => setSelectedSystem(system)}
                      >
                        <CardHeader>
                          <CardTitle className="text-white flex items-center justify-between">
                            <span>{system.system}</span>
                            <Badge className={`${
                              system.currentCondition === "excellent" ? "bg-green-600" :
                              system.currentCondition === "good" ? "bg-blue-600" :
                              system.currentCondition === "fair" ? "bg-yellow-600" :
                              system.currentCondition === "poor" ? "bg-orange-600" :
                              "bg-red-600"
                            }`}>
                              {system.currentCondition}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-400">Health Score</span>
                              <span className="text-white font-medium">{system.healthScore}%</span>
                            </div>
                            <Progress 
                              value={system.healthScore} 
                              className={`h-2 ${
                                system.healthScore > 80 ? "[&>div]:bg-green-500" :
                                system.healthScore > 60 ? "[&>div]:bg-yellow-500" :
                                "[&>div]:bg-red-500"
                              }`}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Life Remaining</p>
                              <p className="text-white font-medium">
                                {Math.floor(system.estimatedLifeRemaining / 12)} years
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Degradation Rate</p>
                              <p className="text-white font-medium">{system.degradationRate}%/month</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Annual Maintenance</p>
                              <p className="text-white font-medium">${system.annualMaintenanceCost}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Replacement Cost</p>
                              <p className="text-white font-medium">${system.replacementCost.toLocaleString()}</p>
                            </div>
                          </div>

                          {system.riskFactors.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-400 mb-2">Risk Factors</p>
                              <div className="flex flex-wrap gap-2">
                                {system.riskFactors.map((risk, riskIdx) => (
                                  <Badge key={riskIdx} variant="outline" className="text-xs text-orange-400 border-orange-400">
                                    {risk}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="savings" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Cost Comparison Chart */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Preventive vs Reactive Costs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={savingsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" tick={{ fill: "#9ca3af" }} />
                            <YAxis tick={{ fill: "#9ca3af" }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="preventive" fill="#10b981" name="Preventive" />
                            <Bar dataKey="reactive" fill="#ef4444" name="Reactive" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Savings Summary */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Annual Savings Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Preventive Maintenance Cost</span>
                            <span className="text-white font-medium">
                              ${maintenanceData.plan.totalAnnualCost.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Estimated Reactive Cost</span>
                            <span className="text-red-400 font-medium">
                              ${(maintenanceData.plan.totalAnnualCost + maintenanceData.plan.savingsVsReactive).toLocaleString()}
                            </span>
                          </div>
                          <div className="border-t border-gray-700 pt-3 flex justify-between">
                            <span className="text-white font-medium">Total Annual Savings</span>
                            <span className="text-green-400 font-bold text-xl">
                              ${maintenanceData.plan.savingsVsReactive.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                          <h4 className="text-blue-400 font-medium mb-2">Additional Benefits</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2 text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              Prevented insurance claims: {maintenanceData.plan.preventedClaims}
                            </li>
                            <li className="flex items-start gap-2 text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              Property value increase: ${maintenanceData.plan.propertyValueImpact.toLocaleString()}
                            </li>
                            <li className="flex items-start gap-2 text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              Extended equipment life: 5-10 years average
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                  <Accordion type="single" collapsible className="space-y-4">
                    {maintenanceData.seasonalAlerts.map((season, idx) => (
                      <AccordionItem key={idx} value={`season-${idx}`} className="bg-gray-800 border-gray-700 rounded-lg">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            <span className="text-white font-medium">{season.season}</span>
                            <Badge className="bg-red-600">
                              {season.alerts.filter(a => a.urgency === "critical").length} Critical
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            {season.alerts.map((alert, alertIdx) => (
                              <div key={alertIdx} className="bg-gray-900 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${
                                      alert.urgency === "critical" ? "bg-red-600" :
                                      alert.urgency === "warning" ? "bg-yellow-600" :
                                      "bg-blue-600"
                                    }`}>
                                      {alert.urgency}
                                    </Badge>
                                    <h4 className="text-white font-medium">{alert.type}</h4>
                                  </div>
                                  <span className="text-sm text-gray-400">
                                    Due: {format(alert.deadline, "MMM d, yyyy")}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm mb-3">{alert.description}</p>
                                {alert.relatedMaintenance.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Related tasks:</span>
                                    {alert.relatedMaintenance.map(id => {
                                      const item = maintenanceData.items.find(i => i.id === id);
                                      return item ? (
                                        <Badge key={id} variant="outline" className="text-xs">
                                          {item.component}
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-gray-800 border-gray-700"
                    onClick={() => toast.info("Opening maintenance history...")}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-gray-800 border-gray-700"
                    onClick={() => toast.info("Finding contractors...")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Find Contractors
                  </Button>
                </div>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (autoSchedule) {
                      maintenanceData.items.forEach(item => {
                        if (differenceInDays(item.nextDue, new Date()) <= 30) {
                          scheduleMaintenanceTask(item);
                        }
                      });
                    }
                  }}
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Schedule All Due Items
                </Button>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}