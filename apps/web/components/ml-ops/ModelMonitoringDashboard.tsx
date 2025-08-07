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

import { Card } from "@claimguardian/ui";
import {
  AlertCircle,
  TrendingDown,
  CheckCircle,
  GitBranch,
} from "lucide-react";
import { useState, useEffect } from "react";

import { CardContent, CardHeader, CardTitle } from "../ui/card";

interface ModelMetrics {
  requestCount: number;
  averageLatency: number;
  p95Latency: number;
  errorRate: number;
  averageConfidence: number;
  healthScore: number;
}

interface DriftAnalysis {
  driftDetected: boolean;
  severity: string;
  metrics: {
    featureDrift: Record<string, number>;
    predictionDrift: number;
    conceptDrift: number;
  };
  recommendation: string;
}

interface ModelVersion {
  id: string;
  version: string;
  deploymentStatus: string;
  trafficPercentage: number;
  metrics: ModelMetrics;
}

export function ModelMonitoringDashboard() {
  const [activeModels, setActiveModels] = useState<ModelVersion[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [driftAnalysis, setDriftAnalysis] = useState<DriftAnalysis | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    fetchActiveModels();
    const interval = setInterval(fetchActiveModels, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    if (selectedModel) {
      fetchModelMetrics(selectedModel);
      checkModelDrift(selectedModel);
    }
  }, [selectedModel]);

  const fetchActiveModels = async () => {
    try {
      // Mock data - replace with actual API call
      setActiveModels([
        {
          id: "model-1",
          version: "v2.3.1",
          deploymentStatus: "active",
          trafficPercentage: 90,
          metrics: {
            requestCount: 12543,
            averageLatency: 87,
            p95Latency: 156,
            errorRate: 0.0012,
            averageConfidence: 0.89,
            healthScore: 95,
          },
        },
        {
          id: "model-2",
          version: "v2.4.0-beta",
          deploymentStatus: "canary",
          trafficPercentage: 10,
          metrics: {
            requestCount: 1392,
            averageLatency: 92,
            p95Latency: 178,
            errorRate: 0.0008,
            averageConfidence: 0.91,
            healthScore: 97,
          },
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setLoading(false);
    }
  };

  const fetchModelMetrics = async (modelId: string) => {
    try {
      const response = await fetch("/api/ml-model-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "monitor",
          data: { deploymentId: modelId },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMetrics(result.metrics);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  const checkModelDrift = async (modelId: string) => {
    try {
      const response = await fetch("/api/ml-model-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "drift_check",
          data: { modelVersionId: modelId, window: "7 days" },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setDriftAnalysis(result.driftAnalysis);
      }
    } catch (error) {
      console.error("Failed to check drift:", error);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-green-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeModels.map((model) => (
          <Card
            key={model.id}
            className={`cursor-pointer transition-all ${
              selectedModel === model.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setSelectedModel(model.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{model.version}</CardTitle>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    model.deploymentStatus === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {model.deploymentStatus}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Traffic</span>
                  <span className="font-medium">
                    {model.trafficPercentage}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Health</span>
                  <span
                    className={`font-medium ${getHealthColor(model.metrics.healthScore)}`}
                  >
                    {model.metrics.healthScore}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Requests</span>
                  <span className="font-medium">
                    {model.metrics.requestCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedModel && metrics && (
        <>
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-500">
                  Average Latency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.averageLatency}ms
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  P95: {metrics.p95Latency}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-500">
                  Error Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.errorRate * 100).toFixed(3)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.errorRate < 0.01 ? "Within SLA" : "Above threshold"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-500">
                  Model Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.averageConfidence * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Average prediction confidence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-500">
                  Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.requestCount / 3600)}/s
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Requests per second
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Drift Analysis */}
          {driftAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Model Drift Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {driftAnalysis.driftDetected ? (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <span className="font-medium">
                        {driftAnalysis.driftDetected
                          ? "Drift Detected"
                          : "No Drift Detected"}
                      </span>
                    </div>
                    {driftAnalysis.driftDetected && (
                      <span
                        className={`font-medium ${getSeverityColor(driftAnalysis.severity)}`}
                      >
                        {driftAnalysis.severity.toUpperCase()} severity
                      </span>
                    )}
                  </div>

                  {driftAnalysis.driftDetected && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Feature Drift</p>
                          <p className="text-lg font-bold">
                            {
                              Object.keys(driftAnalysis.metrics.featureDrift)
                                .length
                            }{" "}
                            features
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            Prediction Drift
                          </p>
                          <p className="text-lg font-bold">
                            {(
                              driftAnalysis.metrics.predictionDrift * 100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Concept Drift</p>
                          <p className="text-lg font-bold">
                            {(driftAnalysis.metrics.conceptDrift * 100).toFixed(
                              1,
                            )}
                            %
                          </p>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-3 rounded">
                        <p className="text-sm font-medium mb-1">
                          Recommendation:
                        </p>
                        <p className="text-sm text-gray-700">
                          {driftAnalysis.recommendation}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Model Lineage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Model Lineage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                      2.3
                    </div>
                    <div>
                      <p className="font-medium">v2.3.1 (Current)</p>
                      <p className="text-sm text-gray-500">
                        Deployed 2 days ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                      2.2
                    </div>
                    <div>
                      <p className="font-medium">v2.2.8</p>
                      <p className="text-sm text-gray-500">Accuracy: 91.2%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                      2.1
                    </div>
                    <div>
                      <p className="font-medium">v2.1.5</p>
                      <p className="text-sm text-gray-500">
                        Initial production release
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              View Full Analytics
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
              Download Report
            </button>
            {driftAnalysis?.driftDetected &&
              driftAnalysis.severity === "high" && (
                <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                  Initiate Retraining
                </button>
              )}
          </div>
        </>
      )}
    </div>
  );
}
