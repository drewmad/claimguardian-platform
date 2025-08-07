/**
 * @fileMetadata
 * @purpose "Advanced comparison view for AI analysis results with side-by-side analysis"
 * @owner ai-team
 * @dependencies ["react", "framer-motion", "@/components/ui"]
 * @exports ["ResultsComparisonView", "ComparisonMetrics", "ComparisonChart"]
 * @complexity high
 * @tags ["ai", "results", "comparison", "analysis", "visualization"]
 * @status stable
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Equal,
  BarChart3,
  PieChart,
  Target,
  Clock,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Download,
  Share,
  Filter,
  Settings,
  Maximize,
  Eye,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIResult } from "./results-presentation-enhanced";
import { useToast } from "@/components/notifications/toast-system";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface ResultsComparisonViewProps {
  results: AIResult[];
  onResultSelect?: (result: AIResult) => void;
  onExport?: (comparisonData: any) => void;
  className?: string;
}

interface ComparisonData {
  metric: string;
  resultA: any;
  resultB: any;
  difference: number;
  trend: "up" | "down" | "equal";
  significance: "high" | "medium" | "low";
}

export function ResultsComparisonView({
  results,
  onResultSelect,
  onExport,
  className,
}: ResultsComparisonViewProps) {
  const [selectedResults, setSelectedResults] = useState<
    [AIResult | null, AIResult | null]
  >([null, null]);
  const [comparisonMode, setComparisonMode] = useState<
    "metrics" | "detailed" | "timeline"
  >("metrics");
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  const { success, info } = useToast();

  // Available results for comparison
  const availableResults = useMemo(() => {
    return results.filter((result) => result.status === "completed");
  }, [results]);

  // Generate comparison data
  const comparisonData = useMemo(() => {
    const [resultA, resultB] = selectedResults;
    if (!resultA || !resultB) return [];

    const comparisons: ComparisonData[] = [];

    // Confidence comparison
    comparisons.push({
      metric: "Confidence Score",
      resultA: resultA.confidence,
      resultB: resultB.confidence,
      difference: resultB.confidence - resultA.confidence,
      trend:
        resultB.confidence > resultA.confidence
          ? "up"
          : resultB.confidence < resultA.confidence
            ? "down"
            : "equal",
      significance:
        Math.abs(resultB.confidence - resultA.confidence) > 10
          ? "high"
          : Math.abs(resultB.confidence - resultA.confidence) > 5
            ? "medium"
            : "low",
    });

    // Processing time comparison
    comparisons.push({
      metric: "Processing Time",
      resultA: resultA.processingTime,
      resultB: resultB.processingTime,
      difference: resultB.processingTime - resultA.processingTime,
      trend:
        resultB.processingTime < resultA.processingTime
          ? "up"
          : resultB.processingTime > resultA.processingTime
            ? "down"
            : "equal",
      significance:
        Math.abs(resultB.processingTime - resultA.processingTime) > 5
          ? "high"
          : Math.abs(resultB.processingTime - resultA.processingTime) > 2
            ? "medium"
            : "low",
    });

    // Type-specific comparisons
    if (resultA.type === resultB.type) {
      switch (resultA.type) {
        case "damage-analysis":
          if (resultA.data.severityScore && resultB.data.severityScore) {
            comparisons.push({
              metric: "Damage Severity",
              resultA: resultA.data.severityScore,
              resultB: resultB.data.severityScore,
              difference:
                resultB.data.severityScore - resultA.data.severityScore,
              trend:
                resultB.data.severityScore > resultA.data.severityScore
                  ? "up"
                  : resultB.data.severityScore < resultA.data.severityScore
                    ? "down"
                    : "equal",
              significance:
                Math.abs(
                  resultB.data.severityScore - resultA.data.severityScore,
                ) > 20
                  ? "high"
                  : "medium",
            });
          }
          break;

        case "inventory-scan":
          if (resultA.data.itemCount && resultB.data.itemCount) {
            comparisons.push({
              metric: "Items Detected",
              resultA: resultA.data.itemCount,
              resultB: resultB.data.itemCount,
              difference: resultB.data.itemCount - resultA.data.itemCount,
              trend:
                resultB.data.itemCount > resultA.data.itemCount
                  ? "up"
                  : resultB.data.itemCount < resultA.data.itemCount
                    ? "down"
                    : "equal",
              significance:
                Math.abs(resultB.data.itemCount - resultA.data.itemCount) > 5
                  ? "high"
                  : "medium",
            });
          }
          break;
      }
    }

    return showDifferencesOnly
      ? comparisons.filter((c) => c.trend !== "equal")
      : comparisons;
  }, [selectedResults, showDifferencesOnly]);

  // Select result for comparison
  const selectResult = useCallback((result: AIResult, position: 0 | 1) => {
    setSelectedResults((prev) => {
      const newSelection: [AIResult | null, AIResult | null] = [...prev];
      newSelection[position] = result;
      return newSelection;
    });
  }, []);

  // Clear comparison
  const clearComparison = useCallback(() => {
    setSelectedResults([null, null]);
  }, []);

  // Export comparison
  const handleExport = useCallback(() => {
    const exportData = {
      comparisonDate: new Date().toISOString(),
      results: selectedResults,
      comparisons: comparisonData,
      summary: {
        totalComparisons: comparisonData.length,
        significantDifferences: comparisonData.filter(
          (c) => c.significance === "high",
        ).length,
      },
    };

    onExport?.(exportData);

    success("Comparison exported", {
      subtitle: "Comparison data saved for review",
    });

    logger.track("comparison_exported", {
      resultAId: selectedResults[0]?.id,
      resultBId: selectedResults[1]?.id,
      comparisons: comparisonData.length,
    });
  }, [selectedResults, comparisonData, onExport, success]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitCompare className="w-6 h-6" />
            Results Comparison
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Compare AI analysis results side-by-side to identify patterns and
            improvements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
          >
            <Filter className="w-4 h-4 mr-1" />
            {showDifferencesOnly ? "Show All" : "Differences Only"}
          </Button>

          {selectedResults[0] && selectedResults[1] && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={clearComparison}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Result Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultSelector
          title="Result A"
          selectedResult={selectedResults[0]}
          availableResults={availableResults.filter(
            (r) => r.id !== selectedResults[1]?.id,
          )}
          onSelect={(result) => selectResult(result, 0)}
          position="left"
        />

        <ResultSelector
          title="Result B"
          selectedResult={selectedResults[1]}
          availableResults={availableResults.filter(
            (r) => r.id !== selectedResults[0]?.id,
          )}
          onSelect={(result) => selectResult(result, 1)}
          position="right"
        />
      </div>

      {/* Comparison Content */}
      {selectedResults[0] && selectedResults[1] && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(["metrics", "detailed", "timeline"] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={comparisonMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setComparisonMode(mode)}
                    className="h-8 capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {/* Comparison Views */}
            {comparisonMode === "metrics" && (
              <ComparisonMetrics
                comparisons={comparisonData}
                resultA={selectedResults[0]}
                resultB={selectedResults[1]}
              />
            )}

            {comparisonMode === "detailed" && (
              <DetailedComparison
                resultA={selectedResults[0]}
                resultB={selectedResults[1]}
              />
            )}

            {comparisonMode === "timeline" && (
              <TimelineComparison
                resultA={selectedResults[0]}
                resultB={selectedResults[1]}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty State */}
      {!selectedResults[0] ||
        (!selectedResults[1] && (
          <Card>
            <CardContent className="p-8 text-center">
              <GitCompare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select Results to Compare
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose two completed analysis results to see detailed
                comparisons and insights.
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

// Result Selector Component
interface ResultSelectorProps {
  title: string;
  selectedResult: AIResult | null;
  availableResults: AIResult[];
  onSelect: (result: AIResult) => void;
  position: "left" | "right";
}

function ResultSelector({
  title,
  selectedResult,
  availableResults,
  onSelect,
  position,
}: ResultSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card
      className={cn(
        "relative",
        selectedResult && "ring-2 ring-blue-500 border-blue-300",
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {selectedResult ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{selectedResult.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedResult.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="ml-2"
              >
                Change
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {selectedResult.confidence}% confidence
              </Badge>
              <Badge variant="outline">
                {selectedResult.type.replace("-", " ")}
              </Badge>
            </div>

            <div className="text-xs text-gray-500">
              Processed: {selectedResult.timestamp.toLocaleString()}
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-32 border-dashed"
            onClick={() => setIsOpen(true)}
          >
            <div className="text-center">
              <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p>Select Result</p>
            </div>
          </Button>
        )}

        {/* Selection Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-64 overflow-auto">
            {availableResults.map((result) => (
              <div
                key={result.id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                onClick={() => {
                  onSelect(result);
                  setIsOpen(false);
                }}
              >
                <div className="font-medium text-sm">{result.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {result.description}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {result.confidence}%
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Comparison Metrics Component
interface ComparisonMetricsProps {
  comparisons: ComparisonData[];
  resultA: AIResult;
  resultB: AIResult;
}

function ComparisonMetrics({
  comparisons,
  resultA,
  resultB,
}: ComparisonMetricsProps) {
  const getTrendIcon = (trend: "up" | "down" | "equal") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "equal":
        return <Equal className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSignificanceColor = (significance: "high" | "medium" | "low") => {
    switch (significance) {
      case "high":
        return "text-red-600 bg-red-100 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-100 border-green-200";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisons.map((comparison, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{comparison.metric}</h4>
                  <div className="flex items-center gap-6 mt-2">
                    <div>
                      <span className="text-sm text-gray-600">Result A:</span>
                      <span className="ml-2 font-medium">
                        {comparison.resultA}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">Result B:</span>
                      <span className="ml-2 font-medium">
                        {comparison.resultB}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getTrendIcon(comparison.trend)}

                  <Badge
                    className={cn(
                      "text-xs border",
                      getSignificanceColor(comparison.significance),
                    )}
                  >
                    {comparison.significance}
                  </Badge>

                  {comparison.trend !== "equal" && (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        comparison.difference > 0
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    >
                      {comparison.difference > 0 ? "+" : ""}
                      {comparison.difference.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Detailed Comparison Component
function DetailedComparison({
  resultA,
  resultB,
}: {
  resultA: AIResult;
  resultB: AIResult;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Result A Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Insights</h4>
              <div className="space-y-1">
                {resultA.insights.map((insight, index) => (
                  <p
                    key={index}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {insight}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <div className="space-y-1">
                {resultA.recommendations.map((rec, index) => (
                  <p
                    key={index}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Result B Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Insights</h4>
              <div className="space-y-1">
                {resultB.insights.map((insight, index) => (
                  <p
                    key={index}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {insight}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <div className="space-y-1">
                {resultB.recommendations.map((rec, index) => (
                  <p
                    key={index}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Timeline Comparison Component
function TimelineComparison({
  resultA,
  resultB,
}: {
  resultA: AIResult;
  resultB: AIResult;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Processing Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Result A Timeline
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Processing Started:</span>
                  <span>{resultA.timestamp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{resultA.processingTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="outline">{resultA.status}</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Result B Timeline
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Processing Started:</span>
                  <span>{resultB.timestamp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{resultB.processingTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="outline">{resultB.status}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Performance Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600">Time Difference</p>
                <p className="text-lg font-medium">
                  {Math.abs(
                    resultB.processingTime - resultA.processingTime,
                  ).toFixed(1)}
                  s
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600">Faster Result</p>
                <p className="text-lg font-medium">
                  {resultA.processingTime < resultB.processingTime
                    ? "Result A"
                    : resultB.processingTime < resultA.processingTime
                      ? "Result B"
                      : "Equal"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ComparisonMetrics };
