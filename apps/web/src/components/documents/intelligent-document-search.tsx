/**
 * @fileMetadata
 * @purpose "Intelligent Document Search UI with AI-powered search capabilities"
 * @owner ai-team
 * @dependencies ["react", "lucide-react", "@/lib/services/intelligent-document-search"]
 * @exports ["IntelligentDocumentSearchComponent"]
 * @complexity high
 * @tags ["ai", "search", "documents", "ui"]
 * @status stable
 * @ai-integration multi-provider
 */
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  FileText,
  Clock,
  Tag,
  Lightbulb,
  Download,
  Eye,
  Sparkles,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  documentSearch,
  DocumentSearchResult,
  SearchFilters,
  DocumentInsight,
} from "@/lib/services/intelligent-document-search";
import { logger } from "@/lib/logger";

interface SearchState {
  query: string;
  results: DocumentSearchResult[];
  insights: DocumentInsight[];
  isSearching: boolean;
  searchMode: "semantic" | "keyword" | "hybrid";
  filters: SearchFilters;
  error: string | null;
  searchStats: {
    totalResults: number;
    avgRelevanceScore: number;
    searchTime: number;
  } | null;
}

const DOCUMENT_TYPE_LABELS = {
  policy: {
    label: "Insurance Policy",
    icon: "🛡️",
    color: "bg-blue-100 text-blue-800",
  },
  claim: { label: "Claim", icon: "📋", color: "bg-green-100 text-green-800" },
  warranty: {
    label: "Warranty",
    icon: "🔧",
    color: "bg-purple-100 text-purple-800",
  },
  receipt: {
    label: "Receipt",
    icon: "🧾",
    color: "bg-yellow-100 text-yellow-800",
  },
  contract: {
    label: "Contract",
    icon: "📄",
    color: "bg-orange-100 text-orange-800",
  },
  correspondence: {
    label: "Email/Letter",
    icon: "✉️",
    color: "bg-pink-100 text-pink-800",
  },
  other: { label: "Other", icon: "📄", color: "bg-gray-100 text-gray-800" },
};

const SEARCH_MODE_OPTIONS = [
  {
    value: "hybrid",
    label: "Smart Search",
    description: "AI + Keywords",
    icon: Brain,
  },
  {
    value: "semantic",
    label: "AI Search",
    description: "Meaning-based",
    icon: Sparkles,
  },
  {
    value: "keyword",
    label: "Text Search",
    description: "Exact matches",
    icon: Search,
  },
];

export function IntelligentDocumentSearchComponent() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    results: [],
    insights: [],
    isSearching: false,
    searchMode: "hybrid",
    filters: {
      includeSummary: true,
      includeActionItems: true,
      minRelevanceScore: 0.3,
    },
    error: null,
    searchStats: null,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] =
    useState<DocumentSearchResult | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchState.query.trim()) return;

    setSearchState((prev) => ({
      ...prev,
      isSearching: true,
      error: null,
      searchStats: null,
    }));

    const startTime = Date.now();

    try {
      logger.info("Starting intelligent document search", {
        query: searchState.query,
        mode: searchState.searchMode,
      });

      const results = await documentSearch.searchDocuments({
        query: searchState.query,
        searchMode: searchState.searchMode,
        filters: searchState.filters,
        maxResults: 20,
      });

      const searchTime = Date.now() - startTime;
      const avgRelevanceScore =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.relevanceScore, 0) /
            results.length
          : 0;

      setSearchState((prev) => ({
        ...prev,
        results,
        searchStats: {
          totalResults: results.length,
          avgRelevanceScore,
          searchTime,
        },
      }));

      // Track search event
      logger.track("document_search_completed", {
        query: searchState.query,
        mode: searchState.searchMode,
        resultsCount: results.length,
        searchTime,
        avgRelevanceScore,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error("Document search failed", { errorMessage });
      setSearchState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Search failed. Please try again.",
      }));
    } finally {
      setSearchState((prev) => ({ ...prev, isSearching: false }));
    }
  }, [searchState.query, searchState.searchMode, searchState.filters]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  // Load insights on component mount
  useEffect(() => {
    const loadInsights = async () => {
      try {
        // Mock user ID - in production, get from auth context
        const insights =
          await documentSearch.generateDocumentInsights("mock-user-id");
        setSearchState((prev) => ({ ...prev, insights }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error("Failed to load document insights", { errorMessage });
      }
    };

    loadInsights();
  }, []);

  const relevanceColor = useMemo(
    () => (score: number) => {
      if (score >= 0.8) return "text-green-600 bg-green-50";
      if (score >= 0.6) return "text-blue-600 bg-blue-50";
      if (score >= 0.4) return "text-yellow-600 bg-yellow-50";
      return "text-gray-600 bg-gray-50";
    },
    [],
  );

  const insightSeverityColor = useMemo(
    () => (severity: string) => {
      switch (severity) {
        case "critical":
          return "border-red-500 bg-red-50";
        case "high":
          return "border-orange-500 bg-orange-50";
        case "medium":
          return "border-yellow-500 bg-yellow-50";
        case "low":
          return "border-blue-500 bg-blue-50";
        default:
          return "border-gray-500 bg-gray-50";
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Intelligent Document Search
        </h1>
        <p className="text-gray-400">
          AI-powered search across all your insurance documents
        </p>
      </div>

      {/* Search Interface */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-400" />
            <CardTitle className="text-white">Smart Search</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Find documents using natural language or specific terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search for 'hurricane damage coverage' or 'warranty for HVAC system'..."
              value={searchState.query}
              onChange={(e) =>
                setSearchState((prev) => ({ ...prev, query: e.target.value }))
              }
              onKeyPress={handleKeyPress}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-lg py-3"
            />
          </div>

          {/* Search Mode and Controls */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              {SEARCH_MODE_OPTIONS.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Button
                    key={mode.value}
                    variant={
                      searchState.searchMode === mode.value
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setSearchState((prev) => ({
                        ...prev,
                        searchMode: mode.value as any,
                      }))
                    }
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {mode.label}
                  </Button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button
                onClick={handleSearch}
                disabled={!searchState.query.trim() || searchState.isSearching}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {searchState.isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>
          </div>

          {/* Search Stats */}
          {searchState.searchStats && (
            <div className="flex items-center gap-6 text-sm text-gray-400 border-t border-gray-700 pt-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {searchState.searchStats.totalResults} results
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {searchState.searchStats.searchTime}ms
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {Math.round(searchState.searchStats.avgRelevanceScore * 100)}%
                avg relevance
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {searchState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{searchState.error}</AlertDescription>
        </Alert>
      )}

      {/* Document Insights */}
      {searchState.insights.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <CardTitle className="text-white">Document Insights</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              AI-generated insights from your document collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchState.insights.map((insight) => (
                <div
                  key={insight.title}
                  className={`p-4 rounded-lg border-l-4 ${insightSeverityColor(insight.severity)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {insight.description}
                      </p>
                      {insight.actionItems &&
                        insight.actionItems.length > 0 && (
                          <div className="space-y-1">
                            {insight.actionItems.map((action, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm text-gray-700"
                              >
                                <ArrowRight className="w-3 h-3" />
                                {action}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {insight.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchState.results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Search Results</h2>

          <div className="grid gap-4">
            {searchState.results.map((result) => {
              const docType =
                DOCUMENT_TYPE_LABELS[result.documentType] ||
                DOCUMENT_TYPE_LABELS.other;

              return (
                <Card
                  key={result.id}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
                  onClick={() => setSelectedResult(result)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">{docType.icon}</span>
                          <h3 className="font-semibold text-white text-lg">
                            {result.title}
                          </h3>
                          <Badge className={docType.color}>
                            {docType.label}
                          </Badge>
                        </div>

                        {/* Relevance Score */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-400">
                            Relevance:
                          </span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={result.relevanceScore * 100}
                              className="w-20 h-2"
                            />
                            <span
                              className={`text-sm px-2 py-1 rounded ${relevanceColor(result.relevanceScore)}`}
                            >
                              {Math.round(result.relevanceScore * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Summary */}
                        {result.summary && (
                          <p className="text-gray-300 mb-3 line-clamp-2">
                            {result.summary}
                          </p>
                        )}

                        {/* Highlights */}
                        {result.highlights.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {result.highlights
                              .slice(0, 2)
                              .map((highlight, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-400 bg-gray-700/50 p-2 rounded"
                                >
                                  "...{highlight}..."
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Actionable Items */}
                        {result.actionableItems &&
                          result.actionableItems.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {result.actionableItems
                                .slice(0, 3)
                                .map((action, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {action}
                                  </Badge>
                                ))}
                            </div>
                          )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(
                              result.metadata.dateCreated,
                            ).toLocaleDateString()}
                          </div>
                          {result.metadata.fileSize && (
                            <div>
                              {(result.metadata.fileSize / 1024).toFixed(1)} KB
                            </div>
                          )}
                          {result.metadata.keyTerms.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {result.metadata.keyTerms.slice(0, 3).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchState.isSearching &&
        searchState.query &&
        searchState.results.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-400 mb-4">
                Try adjusting your search terms or using different keywords
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  setSearchState((prev) => ({ ...prev, query: "" }))
                }
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Getting Started */}
      {!searchState.query && searchState.results.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-12">
            <Brain className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Intelligent Document Search
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Upload your insurance documents and use AI-powered search to
              quickly find information. Search using natural language like
              "What's my hurricane deductible?" or "Show me all warranties that
              expire this year."
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-green-600 hover:bg-green-700">
                Upload Documents
              </Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
