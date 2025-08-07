/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  TrendingUp,
  Lock,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClaimContribution {
  damageType: string;
  settlementAmount: number;
  timeToSettle: number;
  claimSuccess: boolean;
  county: string;
  propertyType: "residential" | "commercial";
  propertyValue: number;
  policyType: string;
}

interface PrivacyGuarantee {
  epsilon: number;
  delta: number;
  noiseAdded: boolean;
}

interface ClaimInsight {
  damageType: string;
  averageSettlement: number;
  medianSettlement: number;
  sampleSize: number;
  averageTimeToSettle: number;
  successRate: number;
  trend: "increasing" | "decreasing" | "stable";
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  privacyGuarantee: PrivacyGuarantee;
}

interface PrivacyPreservingAnalyticsProps {
  onInsightsUpdate?: (insights: ClaimInsight[]) => void;
}

export function PrivacyPreservingAnalytics({
  onInsightsUpdate,
}: PrivacyPreservingAnalyticsProps) {
  const supabase = createClient();
  const [insights, setInsights] = useState<ClaimInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<"high" | "standard">("high");
  const [contributionData, setContributionData] = useState<
    Partial<ClaimContribution>
  >({
    propertyType: "residential",
  });

  // Load insights on component mount
  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async (filters?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "community_analytics",
        {
          body: {
            action: "get_insights",
            filters: filters || {
              damageType: "all",
              timeframe: "12months",
            },
          },
        },
      );

      if (error) throw error;

      setInsights(data.insights || []);
      onInsightsUpdate?.(data.insights || []);

      toast.success(
        `Loaded ${data.insights?.length || 0} privacy-protected insights`,
      );
    } catch (error) {
      console.error("Failed to load insights:", error);
      toast.error("Failed to load community insights");
    } finally {
      setIsLoading(false);
    }
  };

  const contributeData = async () => {
    if (!contributionData.damageType || !contributionData.settlementAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsContributing(true);
    try {
      const contribution: ClaimContribution = {
        damageType: contributionData.damageType!,
        settlementAmount: contributionData.settlementAmount!,
        timeToSettle: contributionData.timeToSettle || 45,
        claimSuccess: contributionData.claimSuccess || true,
        county: contributionData.county || "unknown",
        propertyType: contributionData.propertyType || "residential",
        propertyValue: contributionData.propertyValue || 200000,
        policyType: contributionData.policyType || "standard",
      };

      const { data, error } = await supabase.functions.invoke(
        "community_analytics",
        {
          body: {
            action: "contribute",
            contribution,
          },
        },
      );

      if (error) throw error;

      toast.success(data.message);
      setShowContributionForm(false);
      setContributionData({ propertyType: "residential" });

      // Reload insights to include new contribution
      await loadInsights();
    } catch (error) {
      console.error("Failed to contribute data:", error);
      toast.error("Failed to contribute data");
    } finally {
      setIsContributing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "decreasing":
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  if (showContributionForm) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Contribute Your Claim Data
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Your data will be anonymized and protected with differential privacy
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Privacy Level Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Privacy Level
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setPrivacyLevel("high")}
                className={`flex-1 p-3 rounded-lg border ${
                  privacyLevel === "high"
                    ? "bg-green-600/20 border-green-500 text-green-300"
                    : "bg-gray-700 border-gray-600 text-gray-300"
                }`}
              >
                <Lock className="w-4 h-4 mb-1 mx-auto" />
                <div className="text-xs font-medium">High Privacy</div>
                <div className="text-xs opacity-75">ε = 0.5</div>
              </button>
              <button
                onClick={() => setPrivacyLevel("standard")}
                className={`flex-1 p-3 rounded-lg border ${
                  privacyLevel === "standard"
                    ? "bg-blue-600/20 border-blue-500 text-blue-300"
                    : "bg-gray-700 border-gray-600 text-gray-300"
                }`}
              >
                <Eye className="w-4 h-4 mb-1 mx-auto" />
                <div className="text-xs font-medium">Standard</div>
                <div className="text-xs opacity-75">ε = 1.0</div>
              </button>
            </div>
          </div>

          {/* Contribution Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Damage Type *
              </label>
              <select
                value={contributionData.damageType || ""}
                onChange={(e) =>
                  setContributionData((prev) => ({
                    ...prev,
                    damageType: e.target.value,
                  }))
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              >
                <option value="">Select damage type</option>
                <option value="water_damage">Water Damage</option>
                <option value="hurricane_damage">Hurricane Damage</option>
                <option value="flood_damage">Flood Damage</option>
                <option value="fire_damage">Fire Damage</option>
                <option value="theft_damage">Theft/Vandalism</option>
                <option value="other_damage">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Settlement Amount *
              </label>
              <input
                type="number"
                value={contributionData.settlementAmount || ""}
                onChange={(e) =>
                  setContributionData((prev) => ({
                    ...prev,
                    settlementAmount: parseInt(e.target.value),
                  }))
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g., 15000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Time to Settle (days)
              </label>
              <input
                type="number"
                value={contributionData.timeToSettle || ""}
                onChange={(e) =>
                  setContributionData((prev) => ({
                    ...prev,
                    timeToSettle: parseInt(e.target.value),
                  }))
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g., 45"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                County
              </label>
              <input
                type="text"
                value={contributionData.county || ""}
                onChange={(e) =>
                  setContributionData((prev) => ({
                    ...prev,
                    county: e.target.value,
                  }))
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g., Miami-Dade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Property Value
              </label>
              <input
                type="number"
                value={contributionData.propertyValue || ""}
                onChange={(e) =>
                  setContributionData((prev) => ({
                    ...prev,
                    propertyValue: parseInt(e.target.value),
                  }))
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g., 350000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Claim Success
              </label>
              <select
                value={contributionData.claimSuccess ? "true" : "false"}
                onChange={(e) =>
                  setContributionData((prev) => ({
                    ...prev,
                    claimSuccess: e.target.value === "true",
                  }))
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="true">Successful</option>
                <option value="false">Denied/Partial</option>
              </select>
            </div>
          </div>

          {/* Privacy Notice */}
          <Alert className="bg-green-900/20 border-green-600/30">
            <Shield className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <strong>Privacy Guarantee:</strong> Your data will be anonymized
              and noise will be added using differential privacy (ε ={" "}
              {privacyLevel === "high" ? "0.5" : "1.0"}). No personal
              information will be stored or shared.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={contributeData}
              disabled={
                isContributing ||
                !contributionData.damageType ||
                !contributionData.settlementAmount
              }
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isContributing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Contributing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Contribute Securely
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowContributionForm(false)}
              variant="outline"
              className="bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy-Protected Insights */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Privacy-Protected Community Insights
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-green-600/20 text-green-300 border-green-500/30"
              >
                <Lock className="w-3 h-3 mr-1" />
                Differential Privacy
              </Badge>
              <Button
                onClick={() => setShowContributionForm(true)}
                size="sm"
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Users className="w-4 h-4 mr-1" />
                Contribute
              </Button>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            All data is anonymized and protected with mathematical privacy
            guarantees
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400" />
              <span className="ml-3 text-gray-400">
                Loading privacy-protected insights...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {insight.damageType}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Sample size: {insight.sampleSize}</span>
                        <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                          ε = {insight.privacyGuarantee.epsilon}
                        </Badge>
                        {getTrendIcon(insight.trend)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Avg Settlement</p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(insight.averageSettlement)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ±
                        {formatCurrency(
                          insight.confidenceInterval.upper -
                            insight.averageSettlement,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Median Settlement</p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(insight.medianSettlement)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Success Rate</p>
                      <p className="text-lg font-semibold text-white">
                        {insight.successRate}%
                      </p>
                      <Progress
                        value={insight.successRate}
                        className="h-1 mt-1"
                      />
                    </div>
                    <div>
                      <p className="text-gray-400">Avg Time</p>
                      <p className="text-lg font-semibold text-white">
                        {insight.averageTimeToSettle} days
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {insights.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    No insights available yet
                  </p>
                  <Button
                    onClick={() => setShowContributionForm(true)}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    Be the first to contribute
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Explanation */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" />
            How Privacy Protection Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
              <h4 className="font-semibold text-gray-200 mb-2">
                Differential Privacy
              </h4>
              <p className="text-gray-400">
                Mathematical noise is added to all statistics, ensuring
                individual contributions cannot be identified while maintaining
                statistical accuracy.
              </p>
            </div>
            <div>
              <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
              <h4 className="font-semibold text-gray-200 mb-2">
                Data Anonymization
              </h4>
              <p className="text-gray-400">
                All personal identifiers are removed and data is grouped into
                broad categories before any processing or storage occurs.
              </p>
            </div>
            <div>
              <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
              <h4 className="font-semibold text-gray-200 mb-2">
                Privacy Budget
              </h4>
              <p className="text-gray-400">
                Each query consumes a privacy budget (ε), ensuring total privacy
                loss is mathematically bounded and controlled.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
