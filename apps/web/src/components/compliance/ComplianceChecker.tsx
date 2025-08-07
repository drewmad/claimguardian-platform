"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Gavel,
  BookOpen,
  FileCheck,
  AlertCircle,
  Download,
  RefreshCw,
  ChevronRight,
  Info,
  Scale,
  Calendar,
  DollarSign,
  User,
  Building,
} from "lucide-react";

interface ComplianceItem {
  id: string;
  category: "documentation" | "timeline" | "coverage" | "procedure" | "legal";
  requirement: string;
  description: string;
  reference: string;
  status: "compliant" | "non_compliant" | "warning" | "not_applicable";
  severity: "critical" | "high" | "medium" | "low";
  autoFixable: boolean;
  fix?: string;
}

interface ComplianceReport {
  claimId: string;
  overallScore: number;
  status: "compliant" | "non_compliant" | "needs_review";
  items: ComplianceItem[];
  criticalIssues: number;
  warnings: number;
  recommendations: string[];
  lastChecked: string;
  floridaStatutes: string[];
}

interface ComplianceCategory {
  name: string;
  icon: typeof Shield;
  description: string;
  itemCount: number;
  compliantCount: number;
}

const floridaStatutes = {
  "627.70131": "Insurer duties - Property loss claims",
  "627.7011": "Homeowners policies - Coverage requirements",
  "627.701": "Liability of insureds - Cooperation duties",
  "627.7074": "Alternative procedure for resolution of disputed claims",
  "627.428": "Attorney fees - Prevailing insured",
  "627.7152": "Assignment of benefits - Requirements",
  "627.7142": "Homeowner Claims Bill of Rights",
};

export function ComplianceChecker() {
  const [checking, setChecking] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string>("");
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [autoFix, setAutoFix] = useState(false);
  const supabase = createClient();

  // Mock compliance report for demonstration
  const mockReport: ComplianceReport = {
    claimId: "CLM-2024-0892",
    overallScore: 78,
    status: "needs_review",
    criticalIssues: 2,
    warnings: 5,
    lastChecked: new Date().toISOString(),
    floridaStatutes: ["627.70131", "627.7011", "627.7142"],
    items: [
      {
        id: "1",
        category: "documentation",
        requirement: "Proof of Loss Statement",
        description:
          "Sworn proof of loss must be submitted within 60 days (FL Statute 627.70131)",
        reference: "627.70131(5)(a)",
        status: "non_compliant",
        severity: "critical",
        autoFixable: true,
        fix: "Generate and submit proof of loss statement",
      },
      {
        id: "2",
        category: "timeline",
        requirement: "Initial Acknowledgment",
        description: "Insurer must acknowledge claim within 14 days",
        reference: "627.70131(1)(a)",
        status: "compliant",
        severity: "high",
        autoFixable: false,
      },
      {
        id: "3",
        category: "timeline",
        requirement: "Investigation Timeline",
        description: "Investigation must begin within 10 days of proof of loss",
        reference: "627.70131(1)(b)",
        status: "warning",
        severity: "medium",
        autoFixable: false,
        fix: "Follow up with insurer on investigation status",
      },
      {
        id: "4",
        category: "coverage",
        requirement: "Hurricane Deductible Disclosure",
        description: "Hurricane deductible must be clearly disclosed",
        reference: "627.701(4)(a)",
        status: "compliant",
        severity: "medium",
        autoFixable: false,
      },
      {
        id: "5",
        category: "procedure",
        requirement: "Mediation Rights Notice",
        description: "Claimant must be notified of mediation rights",
        reference: "627.7074",
        status: "non_compliant",
        severity: "critical",
        autoFixable: true,
        fix: "Send mediation rights notification to claimant",
      },
      {
        id: "6",
        category: "legal",
        requirement: "Assignment of Benefits",
        description: "AOB must contain required disclosures per FL law",
        reference: "627.7152",
        status: "warning",
        severity: "high",
        autoFixable: true,
        fix: "Update AOB with required statutory language",
      },
      {
        id: "7",
        category: "documentation",
        requirement: "Estimate Documentation",
        description: "Detailed estimates required for repairs over $2,500",
        reference: "627.70131(5)(c)",
        status: "compliant",
        severity: "medium",
        autoFixable: false,
      },
      {
        id: "8",
        category: "timeline",
        requirement: "Payment Timeline",
        description: "Payment due within 90 days unless disputed",
        reference: "627.70131(5)(a)",
        status: "warning",
        severity: "high",
        autoFixable: false,
        fix: "Track payment deadline: 45 days remaining",
      },
    ],
    recommendations: [
      "Submit sworn proof of loss statement immediately to avoid claim denial",
      "Request mediation if settlement negotiations stall",
      "Document all communications with insurer in writing",
      "Consider hiring a public adjuster if claim exceeds $20,000",
      "Review Homeowner Claims Bill of Rights (FL Statute 627.7142)",
    ],
  };

  const runComplianceCheck = async () => {
    setChecking(true);

    try {
      // Simulate compliance check
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would call the compliance Edge Function
      setReport(mockReport);

      if (mockReport.criticalIssues > 0) {
        toast.error(
          `${mockReport.criticalIssues} critical compliance issues found`,
        );
      } else if (mockReport.warnings > 0) {
        toast.warning(`${mockReport.warnings} warnings require attention`);
      } else {
        toast.success("Claim is fully compliant");
      }
    } catch (error) {
      console.error("Error checking compliance:", error);
      toast.error("Failed to check compliance");
    } finally {
      setChecking(false);
    }
  };

  const applyAutoFixes = async () => {
    const fixableItems =
      report?.items.filter(
        (item) => item.autoFixable && item.status !== "compliant",
      ) || [];

    if (fixableItems.length === 0) {
      toast.info("No auto-fixable issues found");
      return;
    }

    toast.success(`Applying ${fixableItems.length} automatic fixes...`);

    // Simulate applying fixes
    setTimeout(() => {
      toast.success("Automatic fixes applied successfully");
      runComplianceCheck(); // Re-run check
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "text-green-500";
      case "non_compliant":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "not_applicable":
        return "text-gray-400";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "non_compliant":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "not_applicable":
        return <Info className="h-4 w-4 text-gray-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "documentation":
        return FileText;
      case "timeline":
        return Clock;
      case "coverage":
        return Shield;
      case "procedure":
        return FileCheck;
      case "legal":
        return Gavel;
      default:
        return FileText;
    }
  };

  const categories: ComplianceCategory[] = report
    ? [
        {
          name: "Documentation",
          icon: FileText,
          description: "Required forms and evidence",
          itemCount: report.items.filter((i) => i.category === "documentation")
            .length,
          compliantCount: report.items.filter(
            (i) => i.category === "documentation" && i.status === "compliant",
          ).length,
        },
        {
          name: "Timeline",
          icon: Clock,
          description: "Statutory deadlines and timeframes",
          itemCount: report.items.filter((i) => i.category === "timeline")
            .length,
          compliantCount: report.items.filter(
            (i) => i.category === "timeline" && i.status === "compliant",
          ).length,
        },
        {
          name: "Coverage",
          icon: Shield,
          description: "Policy coverage requirements",
          itemCount: report.items.filter((i) => i.category === "coverage")
            .length,
          compliantCount: report.items.filter(
            (i) => i.category === "coverage" && i.status === "compliant",
          ).length,
        },
        {
          name: "Procedure",
          icon: FileCheck,
          description: "Claim handling procedures",
          itemCount: report.items.filter((i) => i.category === "procedure")
            .length,
          compliantCount: report.items.filter(
            (i) => i.category === "procedure" && i.status === "compliant",
          ).length,
        },
        {
          name: "Legal",
          icon: Gavel,
          description: "Legal and regulatory requirements",
          itemCount: report.items.filter((i) => i.category === "legal").length,
          compliantCount: report.items.filter(
            (i) => i.category === "legal" && i.status === "compliant",
          ).length,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scale className="h-5 w-5" />
            <span>Florida Insurance Compliance Checker</span>
          </CardTitle>
          <CardDescription>
            Ensure your claim meets all Florida statutory requirements and
            insurance regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="claim-select">Select Claim to Check</Label>
                <select
                  id="claim-select"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={selectedClaim}
                  onChange={(e) => setSelectedClaim(e.target.value)}
                >
                  <option value="">Choose a claim...</option>
                  <option value="CLM-2024-0892">
                    CLM-2024-0892 - Wind Damage
                  </option>
                  <option value="CLM-2024-0887">
                    CLM-2024-0887 - Water Damage
                  </option>
                  <option value="CLM-2024-0881">
                    CLM-2024-0881 - Fire Damage
                  </option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-fix"
                  checked={autoFix}
                  onCheckedChange={(checked) => setAutoFix(checked as boolean)}
                />
                <Label htmlFor="auto-fix">Enable Auto-Fix</Label>
              </div>
            </div>

            <Button
              onClick={runComplianceCheck}
              disabled={checking || !selectedClaim}
              className="w-full"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking Compliance...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Run Compliance Check
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Report */}
      {report && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`text-4xl font-bold ${
                      report.overallScore >= 90
                        ? "text-green-500"
                        : report.overallScore >= 70
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {report.overallScore}%
                  </div>
                  <Shield className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium">Compliance Score</p>
                <Progress value={report.overallScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-red-500">
                    {report.criticalIssues}
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-sm font-medium">Critical Issues</p>
                <p className="text-xs text-gray-500 mt-1">
                  Require immediate action
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-yellow-500">
                    {report.warnings}
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-sm font-medium">Warnings</p>
                <p className="text-xs text-gray-500 mt-1">
                  Should be addressed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    className={
                      report.status === "compliant"
                        ? "bg-green-500"
                        : report.status === "needs_review"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }
                  >
                    {report.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <FileCheck className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium">Overall Status</p>
                <p className="text-xs text-gray-500 mt-1">
                  Last checked:{" "}
                  {new Date(report.lastChecked).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Issues Alert */}
          {report.criticalIssues > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">
                Critical Compliance Issues Detected
              </AlertTitle>
              <AlertDescription className="text-red-700">
                Your claim has {report.criticalIssues} critical compliance
                issues that must be resolved immediately to avoid claim denial
                or legal complications.
                {autoFix && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600 border-red-300"
                    onClick={applyAutoFixes}
                  >
                    Apply Available Auto-Fixes
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Compliance Items */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="procedure">Procedure</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>All Compliance Items</CardTitle>
                  <CardDescription>
                    Complete compliance checklist based on Florida insurance law
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.items.map((item) => {
                      const Icon = getCategoryIcon(item.category);
                      return (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">
                                    {item.requirement}
                                  </h4>
                                  {getStatusIcon(item.status)}
                                  <Badge
                                    variant={
                                      item.severity === "critical"
                                        ? "destructive"
                                        : item.severity === "high"
                                          ? "default"
                                          : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {item.severity}
                                  </Badge>
                                  {item.autoFixable && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Auto-fixable
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.description}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Reference: FL Statute {item.reference}
                                </p>
                                {item.fix && item.status !== "compliant" && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded">
                                    <p className="text-sm text-blue-800">
                                      <span className="font-medium">
                                        Action Required:
                                      </span>{" "}
                                      {item.fix}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {[
              "documentation",
              "timeline",
              "coverage",
              "procedure",
              "legal",
            ].map((category) => (
              <TabsContent key={category} value={category}>
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {category} Requirements
                    </CardTitle>
                    <CardDescription>
                      Compliance items related to {category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.items
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">
                                    {item.requirement}
                                  </h4>
                                  {getStatusIcon(item.status)}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.description}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Reference: FL Statute {item.reference}
                                </p>
                                {item.fix && item.status !== "compliant" && (
                                  <Alert className="mt-2">
                                    <AlertDescription className="text-sm">
                                      {item.fix}
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Florida Statutes Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Relevant Florida Statutes</span>
              </CardTitle>
              <CardDescription>
                Key insurance laws applicable to your claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.floridaStatutes.map((statute) => (
                  <div
                    key={statute}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">§ {statute}</p>
                      <p className="text-sm text-gray-600">
                        {
                          floridaStatutes[
                            statute as keyof typeof floridaStatutes
                          ]
                        }
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Recommendations</CardTitle>
              <CardDescription>
                Actions to improve compliance and strengthen your claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Compliance Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
