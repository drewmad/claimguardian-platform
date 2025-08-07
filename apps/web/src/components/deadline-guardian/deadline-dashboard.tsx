/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Proactive Deadline Guardian dashboard - automated deadline management"
 * @dependencies ["react", "date-fns", "lucide-react", "@/lib/services/deadline-guardian"]
 * @status stable
 * @ai-integration deadline-detection
 * @insurance-context deadline-management
 */

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  FileText,
  Eye,
  Plus,
  Filter,
  BarChart3,
  Zap,
  Target,
  Shield,
} from "lucide-react";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import {
  deadlineGuardianService,
  type Deadline,
} from "@/lib/services/deadline-guardian";
import { toast } from "sonner";

interface DeadlineStats {
  total: number;
  upcoming: number;
  due_soon: number;
  overdue: number;
  completed: number;
  by_priority: Record<Deadline["priority"], number>;
}

export function DeadlineGuardianDashboard() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [stats, setStats] = useState<DeadlineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [filterPriority, setFilterPriority] = useState<
    Deadline["priority"] | "all"
  >("all");

  useEffect(() => {
    loadDeadlines();
    loadStats();
  }, []);

  const loadDeadlines = async () => {
    try {
      // Mock user ID - replace with actual auth
      const userId = "current-user-id";
      const userDeadlines = await deadlineGuardianService.getUserDeadlines(
        userId,
        {
          status: ["upcoming", "due_soon", "overdue"],
        },
      );
      setDeadlines(userDeadlines);
    } catch (error) {
      console.error("Error loading deadlines:", error);
      toast.error("Failed to load deadlines");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const userId = "current-user-id";
      const deadlineStats =
        await deadlineGuardianService.getDeadlineStats(userId);
      setStats(deadlineStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleCompleteDeadline = async (deadlineId: string) => {
    try {
      await deadlineGuardianService.completeDeadline(deadlineId);
      toast.success("Deadline marked as completed");
      loadDeadlines();
      loadStats();
    } catch (error) {
      console.error("Error completing deadline:", error);
      toast.error("Failed to update deadline");
    }
  };

  const handleDismissDeadline = async (deadlineId: string) => {
    try {
      await deadlineGuardianService.dismissDeadline(deadlineId);
      toast.success("Deadline dismissed");
      loadDeadlines();
      loadStats();
    } catch (error) {
      console.error("Error dismissing deadline:", error);
      toast.error("Failed to dismiss deadline");
    }
  };

  const getPriorityColor = (priority: Deadline["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-600";
      case "medium":
        return "bg-yellow-600";
      case "low":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusColor = (status: Deadline["status"]) => {
    switch (status) {
      case "overdue":
        return "text-red-400 bg-red-900/20";
      case "due_soon":
        return "text-orange-400 bg-orange-900/20";
      case "upcoming":
        return "text-blue-400 bg-blue-900/20";
      case "completed":
        return "text-green-400 bg-green-900/20";
      default:
        return "text-gray-400 bg-gray-900/20";
    }
  };

  const getDaysUntilDue = (dueDate: string): number => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const filteredDeadlines = deadlines.filter(
    (deadline) =>
      filterPriority === "all" || deadline.priority === filterPriority,
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-800 rounded-lg"></div>
        <div className="h-64 bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Deadline Guardian</h1>
            <p className="text-gray-400">
              Proactive deadline detection and management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Manual Deadline
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Deadlines</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Due Soon</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {stats.due_soon}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-400">
                    {stats.overdue}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deadlines">All Deadlines</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Critical Alerts */}
          {deadlines.filter(
            (d) =>
              d.status === "overdue" ||
              (d.status === "due_soon" && d.priority === "critical"),
          ).length > 0 && (
            <Card className="bg-red-950/20 border-red-900/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Alerts
                </CardTitle>
                <CardDescription className="text-red-300/70">
                  Immediate attention required
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deadlines
                    .filter(
                      (d) =>
                        d.status === "overdue" ||
                        (d.status === "due_soon" && d.priority === "critical"),
                    )
                    .map((deadline) => (
                      <div
                        key={deadline.id}
                        className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${getPriorityColor(deadline.priority)}`}
                          />
                          <div>
                            <h4 className="font-medium text-white">
                              {deadline.title}
                            </h4>
                            <p className="text-sm text-red-300">
                              {deadline.status === "overdue"
                                ? `${Math.abs(getDaysUntilDue(deadline.due_date))} days overdue`
                                : "Due today"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteDeadline(deadline.id)}
                            className="border-green-600 text-green-400 hover:bg-green-600/20"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismissDeadline(deadline.id)}
                            className="border-gray-600 text-gray-400 hover:bg-gray-600/20"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Deadlines */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deadlines
                  .filter((d) => {
                    const daysUntil = getDaysUntilDue(d.due_date);
                    return (
                      d.status === "upcoming" &&
                      daysUntil >= 0 &&
                      daysUntil <= 7
                    );
                  })
                  .slice(0, 5)
                  .map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${getPriorityColor(deadline.priority)}`}
                        />
                        <div>
                          <h4 className="font-medium text-white">
                            {deadline.title}
                          </h4>
                          <p className="text-sm text-gray-400">
                            Due{" "}
                            {format(new Date(deadline.due_date), "MMM d, yyyy")}{" "}
                            • {getDaysUntilDue(deadline.due_date)} days
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(deadline.status)}>
                        {deadline.priority}
                      </Badge>
                    </div>
                  ))}

                {deadlines.filter((d) => {
                  const daysUntil = getDaysUntilDue(d.due_date);
                  return (
                    d.status === "upcoming" && daysUntil >= 0 && daysUntil <= 7
                  );
                }).length === 0 && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">
                      No upcoming deadlines in the next 7 days
                    </p>
                    <p className="text-sm text-gray-500">
                      You're all caught up! 🎉
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          {/* Filter Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Priority:</span>
            </div>
            <div className="flex gap-2">
              {(["all", "critical", "high", "medium", "low"] as const).map(
                (priority) => (
                  <Button
                    key={priority}
                    size="sm"
                    variant={
                      filterPriority === priority ? "default" : "outline"
                    }
                    onClick={() => setFilterPriority(priority)}
                    className={
                      filterPriority === priority
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-gray-600 hover:bg-gray-700"
                    }
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Button>
                ),
              )}
            </div>
          </div>

          {/* All Deadlines List */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">All Deadlines</CardTitle>
              <CardDescription>
                {filteredDeadlines.length} deadline
                {filteredDeadlines.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredDeadlines.map((deadline) => {
                  const daysUntil = getDaysUntilDue(deadline.due_date);

                  return (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-3 h-3 rounded-full mt-1 ${getPriorityColor(deadline.priority)}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white">
                              {deadline.title}
                            </h4>
                            <Badge
                              className={getStatusColor(deadline.status)}
                              variant="outline"
                            >
                              {deadline.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {deadline.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>
                              Due:{" "}
                              {format(
                                new Date(deadline.due_date),
                                "MMM d, yyyy",
                              )}
                            </span>
                            <span>•</span>
                            <span
                              className={
                                daysUntil < 0
                                  ? "text-red-400"
                                  : daysUntil <= 3
                                    ? "text-orange-400"
                                    : "text-gray-400"
                              }
                            >
                              {daysUntil < 0
                                ? `${Math.abs(daysUntil)} days overdue`
                                : daysUntil === 0
                                  ? "Due today"
                                  : `${daysUntil} days remaining`}
                            </span>
                            <span>•</span>
                            <Badge className="text-xs" variant="outline">
                              {deadline.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCompleteDeadline(deadline.id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismissDeadline(deadline.id)}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filteredDeadlines.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No deadlines found</p>
                    <p className="text-sm text-gray-500">
                      Try adjusting your filters or add a new deadline
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Dashboard */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Priority Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.by_priority).map(
                      ([priority, count]) => (
                        <div
                          key={priority}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${getPriorityColor(priority as Deadline["priority"])}`}
                            />
                            <span className="text-white capitalize">
                              {priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <Progress
                                value={
                                  stats.total > 0
                                    ? (count / stats.total) * 100
                                    : 0
                                }
                                className="h-2 bg-gray-700"
                              />
                            </div>
                            <span className="text-sm text-gray-400 w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Completion Rate</span>
                      <span className="text-white font-medium">
                        {stats.total > 0
                          ? Math.round((stats.completed / stats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">On-Time Performance</span>
                      <span className="text-white font-medium">
                        {stats.total > 0
                          ? Math.round(
                              ((stats.completed + stats.upcoming) /
                                stats.total) *
                                100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Auto-Detected</span>
                      <span className="text-green-400 font-medium">
                        {
                          deadlines.filter((d) => d.source === "auto_detected")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">AI Confidence</span>
                      <span className="text-blue-400 font-medium">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
