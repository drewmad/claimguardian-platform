/**
 * @fileMetadata
 * @purpose "Comprehensive AI processing status dashboard with real-time updates"
 * @owner ai-team
 * @dependencies ["react", "framer-motion", "@/components/ui"]
 * @exports ["ProcessingStatusDashboard", "ProcessingQueue", "ProcessingMetrics"]
 * @complexity high
 * @tags ["ai", "processing", "dashboard", "status", "real-time"]
 * @status stable
 */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  FileText,
  Image,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Scan,
  Server,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Share,
  Settings,
  Filter,
  Search,
  Calendar,
  Target,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ProgressEnhanced,
  AIProcessingProgress,
  ProgressRing,
} from "@/components/ui/progress-enhanced";
import { useToast } from "@/components/notifications/toast-system";
import { useNotifications } from "@/components/notifications/notification-center";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

export type ProcessingJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "paused"
  | "cancelled";
export type ProcessingPriority = "low" | "normal" | "high" | "urgent";
export type AIModelType = "gpt-4" | "claude" | "gemini" | "custom";

export interface ProcessingJob {
  id: string;
  name: string;
  type:
    | "damage-analysis"
    | "document-extraction"
    | "inventory-scan"
    | "claim-processing";
  status: ProcessingJobStatus;
  priority: ProcessingPriority;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  filesProcessed: number;
  totalFiles: number;
  model: AIModelType;
  confidence?: number;
  error?: string;
  metadata?: Record<string, any>;
  userId: string;
  queuePosition?: number;
}

export interface ProcessingMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  queuedJobs: number;
  runningJobs: number;
  averageProcessingTime: number;
  successRate: number;
  totalFilesProcessed: number;
  systemLoad: number;
  throughput: number;
  uptime: number;
}

interface ProcessingStatusDashboardProps {
  jobs?: ProcessingJob[];
  metrics?: ProcessingMetrics;
  showQueue?: boolean;
  showMetrics?: boolean;
  showControls?: boolean;
  refreshInterval?: number;
  maxVisibleJobs?: number;
  onJobAction?: (
    jobId: string,
    action: "pause" | "resume" | "cancel" | "retry",
  ) => void;
  className?: string;
}

export function ProcessingStatusDashboard({
  jobs = [],
  metrics,
  showQueue = true,
  showMetrics = true,
  showControls = true,
  refreshInterval = 5000,
  maxVisibleJobs = 10,
  onJobAction,
  className,
}: ProcessingStatusDashboardProps) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProcessingJobStatus | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const { success, error, info } = useToast();
  const { addNotification } = useNotifications();

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((job) => job.status === filterStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.name.toLowerCase().includes(query) ||
          job.type.toLowerCase().includes(query) ||
          job.id.toLowerCase().includes(query),
      );
    }

    // Sort by priority and creation time
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0);
    });

    return filtered.slice(0, maxVisibleJobs);
  }, [jobs, filterStatus, searchQuery, maxVisibleJobs]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // In real app, this would trigger a data refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Handle job actions
  const handleJobAction = useCallback(
    (jobId: string, action: "pause" | "resume" | "cancel" | "retry") => {
      onJobAction?.(jobId, action);

      const job = jobs.find((j) => j.id === jobId);
      const actionMessages = {
        pause: "Job paused",
        resume: "Job resumed",
        cancel: "Job cancelled",
        retry: "Job retrying",
      };

      success(actionMessages[action], {
        subtitle: job?.name || `Job ${jobId}`,
        actions:
          action === "cancel"
            ? []
            : [
                {
                  label: "View Details",
                  onClick: () => setSelectedJob(jobId),
                },
              ],
      });

      logger.track(`processing_job_${action}`, {
        jobId,
        jobType: job?.type,
        status: job?.status,
      });
    },
    [jobs, onJobAction, success],
  );

  // Refresh data manually
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate refresh delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLastUpdate(new Date());

      info("Data refreshed", {
        subtitle: "Processing status updated",
      });
    } catch (err) {
      error("Refresh failed", {
        subtitle: "Could not update processing status",
      });
    } finally {
      setIsLoading(false);
    }
  }, [info, error]);

  const getJobIcon = (type: ProcessingJob["type"]) => {
    switch (type) {
      case "damage-analysis":
        return Scan;
      case "document-extraction":
        return FileText;
      case "inventory-scan":
        return Image;
      case "claim-processing":
        return BarChart3;
    }
  };

  const getStatusColor = (status: ProcessingJobStatus) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "running":
        return "text-blue-600 bg-blue-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "paused":
        return "text-yellow-600 bg-yellow-100";
      case "queued":
        return "text-gray-600 bg-gray-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: ProcessingPriority) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "normal":
        return "border-l-blue-500 bg-blue-50";
      case "low":
        return "border-l-gray-500 bg-gray-50";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Processing Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of AI processing jobs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>

          {showControls && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Overview */}
      {showMetrics && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold">{metrics.runningJobs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {Math.round(metrics.successRate)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Throughput</p>
                  <p className="text-2xl font-bold">{metrics.throughput}/h</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Load</p>
                  <p className="text-2xl font-bold">
                    {Math.round(metrics.systemLoad)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm font-medium">
                    {Math.round(metrics.systemLoad)}%
                  </span>
                </div>
                <Progress value={metrics.systemLoad} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium">
                    {Math.round(metrics.successRate)}%
                  </span>
                </div>
                <Progress value={metrics.successRate} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Queue Utilization</span>
                  <span className="text-sm font-medium">
                    {Math.round(
                      (metrics.runningJobs /
                        (metrics.runningJobs + metrics.queuedJobs)) *
                        100,
                    ) || 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    Math.round(
                      (metrics.runningJobs /
                        (metrics.runningJobs + metrics.queuedJobs)) *
                        100,
                    ) || 0
                  }
                  className="h-2"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Uptime</p>
                <p className="font-medium">
                  {Math.round(metrics.uptime / 3600)}h
                </p>
              </div>

              <div className="text-center">
                <p className="text-gray-600">Completed</p>
                <p className="font-medium">{metrics.completedJobs}</p>
              </div>

              <div className="text-center">
                <p className="text-gray-600">Failed</p>
                <p className="font-medium text-red-600">{metrics.failedJobs}</p>
              </div>

              <div className="text-center">
                <p className="text-gray-600">Avg Time</p>
                <p className="font-medium">
                  {Math.round(metrics.averageProcessingTime)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Queue */}
      {showQueue && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Processing Queue ({filteredJobs.length})
              </CardTitle>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-48"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as ProcessingJobStatus | "all",
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="queued">Queued</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {jobs.length === 0
                  ? "No processing jobs found"
                  : "No jobs match your filters"}
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredJobs.map((job) => {
                    const JobIcon = getJobIcon(job.type);

                    return (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                          "border-l-4 rounded-lg p-4 transition-all",
                          getPriorityColor(job.priority),
                          selectedJob === job.id && "ring-2 ring-blue-500",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <JobIcon className="w-5 h-5 text-gray-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">
                                  {job.name}
                                </h4>

                                <Badge
                                  className={cn(
                                    "text-xs",
                                    getStatusColor(job.status),
                                  )}
                                >
                                  {job.status}
                                </Badge>

                                <Badge variant="outline" className="text-xs">
                                  {job.priority}
                                </Badge>

                                <Badge variant="outline" className="text-xs">
                                  {job.model}
                                </Badge>
                              </div>

                              <p className="text-sm text-gray-600 mb-2 capitalize">
                                {job.type.replace("-", " ")} •{" "}
                                {job.filesProcessed}/{job.totalFiles} files
                              </p>

                              {job.status === "running" && (
                                <div className="space-y-2 mb-2">
                                  <Progress
                                    value={job.progress}
                                    className="h-2"
                                  />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>
                                      {Math.round(job.progress)}% complete
                                    </span>
                                    {job.confidence && (
                                      <span>{job.confidence}% confidence</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {job.status === "failed" && job.error && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  <AlertDescription className="text-xs">
                                    {job.error}
                                  </AlertDescription>
                                </Alert>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                {job.startTime && (
                                  <span>
                                    Started:{" "}
                                    {job.startTime.toLocaleTimeString()}
                                  </span>
                                )}

                                {job.duration && (
                                  <span>
                                    Duration: {Math.round(job.duration)}s
                                  </span>
                                )}

                                {job.queuePosition && (
                                  <span>Queue: #{job.queuePosition}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Job Controls */}
                          <div className="flex items-center gap-2">
                            {job.status === "running" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleJobAction(job.id, "pause")}
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                            )}

                            {job.status === "paused" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleJobAction(job.id, "resume")
                                }
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}

                            {job.status === "failed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleJobAction(job.id, "retry")}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}

                            {(job.status === "running" ||
                              job.status === "queued" ||
                              job.status === "paused") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleJobAction(job.id, "cancel")
                                }
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedJob(
                                  selectedJob === job.id ? null : job.id,
                                )
                              }
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {selectedJob === job.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Job ID</p>
                                  <p className="font-mono text-xs">{job.id}</p>
                                </div>

                                <div>
                                  <p className="text-gray-600">User</p>
                                  <p className="font-mono text-xs">
                                    {job.userId}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-600">Model</p>
                                  <p className="font-medium">{job.model}</p>
                                </div>

                                <div>
                                  <p className="text-gray-600">Priority</p>
                                  <p className="font-medium capitalize">
                                    {job.priority}
                                  </p>
                                </div>
                              </div>

                              {job.metadata && (
                                <div className="mt-3">
                                  <p className="text-gray-600 text-sm mb-2">
                                    Metadata
                                  </p>
                                  <div className="bg-gray-50 rounded p-2 text-xs font-mono">
                                    {JSON.stringify(job.metadata, null, 2)}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
