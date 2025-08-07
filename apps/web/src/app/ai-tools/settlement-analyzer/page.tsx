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

import {
  Calculator,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  BarChart,
  Sparkles,
  Scale,
  Target,
  Brain,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger/production-logger";
import { toError } from "@claimguardian/utils";

import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { enhancedAIClient } from "@/lib/ai/enhanced-client";

interface SettlementAnalysis {
  fairnessScore: number;
  recommendation: "accept" | "negotiate" | "reject";
  reasoning: string[];
  comparisons: {
    category: string;
    yourCase: number;
    average: number;
    difference: number;
  }[];
  negotiationPoints: string[];
  redFlags: string[];
  strengthsOfOffer: string[];
}

export default function SettlementAnalyzerPage() {
  const [claimAmount, setClaimAmount] = useState("");
  const [offeredAmount, setOfferedAmount] = useState("");
  const [damageType, setDamageType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  const [deductible, setDeductible] = useState("");
  const [analysis, setAnalysis] = useState<SettlementAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(true); // Assume available for now
  const [hasGeminiKey, setHasGeminiKey] = useState(true); // Assume available for now
  const { user } = useAuth();

  const analyzeSettlement = async () => {
    if (!claimAmount || !offeredAmount || !damageType) return;

    setIsAnalyzing(true);

    try {
      const claimValue = parseFloat(claimAmount);
      const offerValue = parseFloat(offeredAmount);
      const deductibleValue = parseFloat(deductible) || 0;
      const offerPercentage = (
        (offerValue / (claimValue - deductibleValue)) *
        100
      ).toFixed(1);

      const prompt = `Analyze this insurance settlement offer:

Property Type: ${propertyType || "Residential"}
Damage Type: ${damageType}
Original Claim Amount: $${claimValue.toLocaleString()}
Settlement Offer: $${offerValue.toLocaleString()}
Deductible: $${deductibleValue.toLocaleString()}
Offer Percentage: ${offerPercentage}% of claim after deductible

Damage Description: ${damageDescription}

Provide a detailed analysis in JSON format:
{
  "fairnessScore": [0-100 score based on offer fairness],
  "recommendation": "accept" | "negotiate" | "reject",
  "reasoning": ["list of reasons for the recommendation"],
  "comparisons": [
    {
      "category": "category name",
      "yourCase": numeric value,
      "average": typical value,
      "difference": percentage difference
    }
  ],
  "negotiationPoints": ["list of specific points to negotiate"],
  "redFlags": ["list of concerns about the offer"],
  "strengthsOfOffer": ["positive aspects of the offer"]
}

Consider Florida insurance law, typical settlements for similar claims, and the completeness of the offer.`;

      const messages = [
        {
          role: "system" as const,
          content:
            "You are an insurance settlement expert with deep knowledge of Florida property insurance claims and typical settlement patterns.",
        },
        { role: "user" as const, content: prompt },
      ];

      // Use enhanced AI client with automatic model selection and A/B testing
      const response = await enhancedAIClient.enhancedChat({
        messages,
        featureId: "settlement-analyzer",
      });

      try {
        const parsedAnalysis = JSON.parse(response);
        setAnalysis(parsedAnalysis);
      } catch {
        // Fallback if response isn't valid JSON
        const fallbackAnalysis: SettlementAnalysis = {
          fairnessScore:
            offerValue / claimValue > 0.8
              ? 75
              : offerValue / claimValue > 0.6
                ? 50
                : 25,
          recommendation:
            offerValue / claimValue > 0.8
              ? "accept"
              : offerValue / claimValue > 0.6
                ? "negotiate"
                : "reject",
          reasoning: [response],
          comparisons: [],
          negotiationPoints: [],
          redFlags: [],
          strengthsOfOffer: [],
        };
        setAnalysis(fallbackAnalysis);
      }

      toast.success("Settlement analysis complete!");
    } catch (error) {
      logger.error("Settlement analysis error:", {}, toError(error));
      toast.error("Failed to analyze settlement");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "accept":
        return "text-green-400";
      case "negotiate":
        return "text-yellow-400";
      case "reject":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "accept":
        return CheckCircle;
      case "negotiate":
        return Scale;
      case "reject":
        return XCircle;
      default:
        return Info;
    }
  };

  const isFormValid = claimAmount && offeredAmount && damageType;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Premium Header with Advanced Liquid Glass */}
            <div className="mb-8 relative">
              {/* Premium Background Orb */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-yellow-400/25 via-orange-500/20 to-amber-600/25 rounded-full blur-3xl animate-pulse opacity-40" />

              <div className="relative">
                <Link
                  href="/ai-tools"
                  className="text-yellow-400 hover:text-yellow-300 text-sm mb-6 inline-flex items-center gap-2 backdrop-blur-md bg-gray-800/50 px-3 py-2 rounded-lg border border-yellow-400/20 shadow-[0_8px_32px_rgba(245,158,11,0.15)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.25)] transition-all duration-300"
                >
                  ← Back to AI Tools
                </Link>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-yellow-600/30 to-orange-600/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(245,158,11,0.3)] hover:shadow-[0_25px_80px_rgba(245,158,11,0.4)] transition-all duration-700">
                    <Calculator className="h-8 w-8 text-yellow-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]">
                        Settlement Analyzer
                      </h1>
                      <Badge className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 text-yellow-300 border-yellow-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(245,158,11,0.2)]">
                        Beta
                      </Badge>
                    </div>
                    <p className="text-gray-300 max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                      Analyze settlement offers and compare with typical payouts
                      for similar claims. Get AI-powered insights to help you
                      make informed decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium API Key Check */}
            {!hasOpenAIKey && !hasGeminiKey && (
              <Alert className="bg-red-900/20 border-red-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(220,38,38,0.2)]">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  AI API keys required. Please configure OpenAI or Gemini API
                  keys to use this tool.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Premium Input Form */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-yellow-600/30 to-orange-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(245,158,11,0.2)]">
                        <DollarSign className="h-5 w-5 text-yellow-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                      </div>
                      Settlement Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        analyzeSettlement();
                      }}
                    >
                      <div>
                        <Label className="text-gray-300">
                          Original Claim Amount{" "}
                          <span className="text-red-400">*</span>
                        </Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            type="number"
                            value={claimAmount}
                            onChange={(e) => setClaimAmount(e.target.value)}
                            placeholder="50000"
                            className="pl-10 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-300">
                          Settlement Offer{" "}
                          <span className="text-red-400">*</span>
                        </Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            type="number"
                            value={offeredAmount}
                            onChange={(e) => setOfferedAmount(e.target.value)}
                            placeholder="35000"
                            className="pl-10 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-300">Deductible</Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            type="number"
                            value={deductible}
                            onChange={(e) => setDeductible(e.target.value)}
                            placeholder="2500"
                            className="pl-10 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-300">
                          Type of Damage <span className="text-red-400">*</span>
                        </Label>
                        <select
                          value={damageType}
                          onChange={(e) => setDamageType(e.target.value)}
                          className="mt-1 w-full bg-gray-700/50 border-gray-600/50 text-white rounded-md px-3 py-2 backdrop-blur-md"
                          required
                        >
                          <option value="">Select damage type</option>
                          <option value="hurricane">Hurricane</option>
                          <option value="flood">Flood</option>
                          <option value="wind">Wind</option>
                          <option value="hail">Hail</option>
                          <option value="water">Water/Leak</option>
                          <option value="fire">Fire</option>
                          <option value="theft">Theft</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-gray-300">Property Type</Label>
                        <select
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                          className="mt-1 w-full bg-gray-700/50 border-gray-600/50 text-white rounded-md px-3 py-2 backdrop-blur-md"
                        >
                          <option value="">Select property type</option>
                          <option value="single-family">
                            Single Family Home
                          </option>
                          <option value="condo">Condo</option>
                          <option value="townhouse">Townhouse</option>
                          <option value="mobile">Mobile Home</option>
                          <option value="commercial">Commercial</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-gray-300">
                          Damage Description
                        </Label>
                        <Textarea
                          value={damageDescription}
                          onChange={(e) => setDamageDescription(e.target.value)}
                          placeholder="Describe the damage and any relevant details..."
                          className="mt-1 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
                          rows={4}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={
                          !isFormValid ||
                          isAnalyzing ||
                          (!hasOpenAIKey && !hasGeminiKey)
                        }
                        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-[0_8px_32px_rgba(245,158,11,0.3)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.4)] transition-all duration-300 backdrop-blur-md border-0"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analyze Settlement
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Premium Analysis Results */}
              <div className="lg:col-span-2">
                {!analysis ? (
                  <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
                    <CardContent className="p-12 text-center">
                      <div className="p-4 bg-gradient-to-br from-yellow-600/30 to-orange-600/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(245,158,11,0.2)] mx-auto mb-4 w-fit">
                        <BarChart className="h-12 w-12 text-yellow-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                      </div>
                      <p className="text-gray-400">
                        Enter settlement details to see AI analysis
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Main Recommendation */}
                    <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)] transition-all duration-500">
                      <div
                        className={`p-6 bg-gradient-to-r ${
                          analysis.recommendation === "accept"
                            ? "from-green-900/20 to-green-800/20"
                            : analysis.recommendation === "negotiate"
                              ? "from-yellow-900/20 to-yellow-800/20"
                              : "from-red-900/20 to-red-800/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {(() => {
                              const Icon = getRecommendationIcon(
                                analysis.recommendation,
                              );
                              return (
                                <Icon
                                  className={`h-8 w-8 ${getRecommendationColor(analysis.recommendation)}`}
                                />
                              );
                            })()}
                            <div>
                              <h3 className="text-2xl font-bold text-white capitalize">
                                {analysis.recommendation} Offer
                              </h3>
                              <p className="text-gray-300 mt-1">
                                Based on comprehensive analysis
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">
                              {analysis.fairnessScore}%
                            </div>
                            <p className="text-sm text-gray-400">
                              Fairness Score
                            </p>
                          </div>
                        </div>
                      </div>
                      <CardContent className="pt-6">
                        <Progress
                          value={analysis.fairnessScore}
                          className="h-3 mb-6"
                        />

                        {/* Key Reasoning */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-white">
                            Key Analysis Points:
                          </h4>
                          {analysis.reasoning.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-300">{reason}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Premium Comparisons */}
                    {analysis.comparisons.length > 0 && (
                      <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(59,130,246,0.15)] transition-all duration-500">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-blue-600/30 to-cyan-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(59,130,246,0.2)]">
                              <BarChart className="h-5 w-5 text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                            </div>
                            Market Comparisons
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analysis.comparisons.map((comp, idx) => (
                              <div
                                key={idx}
                                className="border-b border-gray-700 pb-4 last:border-0"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-300">
                                    {comp.category}
                                  </span>
                                  <span
                                    className={`text-sm ${
                                      comp.difference > 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {comp.difference > 0 ? "+" : ""}
                                    {comp.difference}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">
                                      Your Case:{" "}
                                    </span>
                                    <span className="text-white font-medium">
                                      ${comp.yourCase.toLocaleString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">
                                      Average:{" "}
                                    </span>
                                    <span className="text-white font-medium">
                                      ${comp.average.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Premium Negotiation Points */}
                    {analysis.negotiationPoints.length > 0 && (
                      <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(34,197,94,0.15)] transition-all duration-500">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-green-600/30 to-emerald-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(34,197,94,0.2)]">
                              <Target className="h-5 w-5 text-green-300 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                            </div>
                            Negotiation Strategy
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.negotiationPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Scale className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-300">
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Premium Strengths and Red Flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {analysis.strengthsOfOffer.length > 0 && (
                        <Card className="bg-green-900/20 border-green-600/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(34,197,94,0.2)] hover:shadow-[0_20px_60px_rgba(34,197,94,0.3)] transition-all duration-500">
                          <CardHeader>
                            <CardTitle className="text-green-300 text-base">
                              Strengths of Offer
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {analysis.strengthsOfOffer.map(
                                (strength, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-300">
                                      {strength}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {analysis.redFlags.length > 0 && (
                        <Card className="bg-red-900/20 border-red-600/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(220,38,38,0.2)] hover:shadow-[0_20px_60px_rgba(220,38,38,0.3)] transition-all duration-500">
                          <CardHeader>
                            <CardTitle className="text-red-300 text-base">
                              Red Flags
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {analysis.redFlags.map((flag, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-300">
                                    {flag}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Settlement Tips */}
            <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 backdrop-blur-xl border-blue-600/40 shadow-[0_20px_60px_rgba(59,130,246,0.2)] hover:shadow-[0_25px_80px_rgba(59,130,246,0.3)] transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600/30 to-cyan-600/20 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(59,130,246,0.3)] flex-shrink-0">
                    <Brain className="h-6 w-6 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Settlement Tips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                      <ul className="space-y-1">
                        <li>• Never accept the first offer without analysis</li>
                        <li>• Document all communication with adjusters</li>
                        <li>• Get contractor estimates before accepting</li>
                      </ul>
                      <ul className="space-y-1">
                        <li>
                          • Consider hiring a public adjuster for large claims
                        </li>
                        <li>• Review your policy limits and coverage</li>
                        <li>• Don't sign releases until you're satisfied</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
