/**
 * @fileMetadata
 * @purpose "Dashboard widget for accessing learning insights"
 * @dependencies ["@/lib","@claimguardian/ui","lucide-react","react"]
 * @owner dev-tools-team
 * @status stable
 */

"use client";

import { Button } from "@claimguardian/ui";
import {
  Brain,
  Search,
  Lightbulb,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import React, { useState } from "react";
import { logger } from "@/lib/logger/production-logger";

import { learningAssistant } from "@/lib/learning/learning-assistant";

interface LearningResult {
  id?: string;
  title: string;
  problem: string;
  solution: string;
  category: string;
  confidence: number;
}

export function LearningWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LearningResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    totalIssues: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    recentTrends: string;
  } | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await learningAssistant.searchLearnings({ query });
      setResults(searchResults);
    } catch (error) {
      logger.error("Failed to search learnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const weeklyStats = await learningAssistant.getStats("week");
      setStats(weeklyStats);
    } catch (error) {
      logger.error("Failed to load stats:", error);
    }
  };

  React.useEffect(() => {
    if (isOpen && !stats) {
      loadStats();
    }
  }, [isOpen, stats]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-all group"
        title="Learning Assistant"
      >
        <Brain className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">
            Learning Assistant
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for errors or solutions..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="p-4 border-b border-gray-700 bg-gray-700/50">
          <div className="text-sm text-gray-400 mb-2">This Week</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Issues:</span>
              <span className="text-white ml-1 font-medium">
                {stats.totalIssues}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Trend:</span>
              <span
                className={`ml-1 font-medium ${
                  stats.recentTrends === "increasing"
                    ? "text-orange-400"
                    : stats.recentTrends === "decreasing"
                      ? "text-green-400"
                      : "text-gray-300"
                }`}
              >
                {stats.recentTrends}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
            <p className="mt-2">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="p-2">
            {results.map((result, index) => (
              <div
                key={result.id || index}
                className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">
                      {result.title}
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      {result.problem}
                    </p>
                    <div className="bg-gray-700 rounded p-2">
                      <p className="text-xs text-green-400">
                        {result.solution}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {result.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(result.confidence * 100)}% match
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="p-8 text-center text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>No results found</p>
            <p className="text-xs mt-1">Try different keywords</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-2">
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    Quick Reference Guide
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                </div>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    Error Pattern Guide
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                </div>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    VS Code Snippets
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
