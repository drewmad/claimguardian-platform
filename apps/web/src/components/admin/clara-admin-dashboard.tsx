/**
 * @fileMetadata
 * @owner @admin-team
 * @purpose "Clara AI Companion Admin Dashboard - emotional support monitoring (ADMIN ONLY)"
 * @dependencies ["react", "date-fns", "lucide-react", "@/lib/services/clara-ai-companion"]
 * @status stable
 * @ai-integration clara-companion
 * @insurance-context emotional-support
 * @security-level admin-only
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  AlertTriangle,
  MessageCircle,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Brain,
  Phone,
  PhoneCall,
  Activity,
  BarChart3,
  Eye,
  UserX,
  CheckCircle,
  Send,
  Bot,
  User,
  Calendar,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import {
  claraAICompanionService,
  type ClaraSession,
  type ClaraMessage,
  type CrisisAlert,
} from "@/lib/services/clara-ai-companion";
import { toast } from "sonner";

export function ClaraAdminDashboard() {
  const [sessions, setSessions] = useState<ClaraSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClaraSession | null>(
    null,
  );
  const [messages, setMessages] = useState<ClaraMessage[]>([]);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [testUserId, setTestUserId] = useState("");
  const [testMessage, setTestMessage] = useState("");

  // Mock admin ID - replace with actual auth
  const adminId = "current-admin-id";

  useEffect(() => {
    loadSessions();
    loadCrisisAlerts();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSessionMessages(selectedSession.id);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const allSessions = await claraAICompanionService.getAdminSessions(
        adminId,
        { limit: 50 },
      );
      setSessions(allSessions);
    } catch (error) {
      console.error("Error loading Clara sessions:", error);
      toast.error("Failed to load Clara sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const sessionMessages = await claraAICompanionService.getSessionMessages(
        sessionId,
        adminId,
      );
      setMessages(sessionMessages);
    } catch (error) {
      console.error("Error loading session messages:", error);
      toast.error("Failed to load session messages");
    }
  };

  const loadCrisisAlerts = async () => {
    try {
      // Mock crisis alerts - implement based on your database structure
      setCrisisAlerts([]);
    } catch (error) {
      console.error("Error loading crisis alerts:", error);
    }
  };

  const startTestSession = async () => {
    if (!testUserId || !testMessage) {
      toast.error("Please provide both user ID and initial message");
      return;
    }

    try {
      const session = await claraAICompanionService.startAdminSession(
        testUserId,
        adminId,
        testMessage,
      );

      if (session) {
        toast.success("Clara session started");
        setSelectedSession(session);
        await loadSessions();
        setTestUserId("");
        setTestMessage("");
      } else {
        toast.error("Failed to start Clara session");
      }
    } catch (error) {
      console.error("Error starting test session:", error);
      toast.error("Error starting session");
    }
  };

  const continueConversation = async () => {
    if (!selectedSession || !newMessage) return;

    try {
      const response = await claraAICompanionService.continueConversation(
        selectedSession.id,
        adminId,
        newMessage,
      );

      if (response) {
        toast.success("Message sent");
        setNewMessage("");
        await loadSessionMessages(selectedSession.id);
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error continuing conversation:", error);
      toast.error("Error sending message");
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      const success = await claraAICompanionService.endSession(
        sessionId,
        adminId,
        "Session ended by admin",
      );

      if (success) {
        toast.success("Session ended");
        await loadSessions();
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
      } else {
        toast.error("Failed to end session");
      }
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Error ending session");
    }
  };

  const getCrisisLevelColor = (level: ClaraSession["crisis_level"]) => {
    switch (level) {
      case 5:
        return "bg-red-600 text-white";
      case 4:
        return "bg-red-500 text-white";
      case 3:
        return "bg-orange-500 text-white";
      case 2:
        return "bg-yellow-500 text-black";
      case 1:
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getEmotionalStateColor = (state: ClaraSession["emotional_state"]) => {
    switch (state) {
      case "distressed":
        return "text-red-400 bg-red-900/20";
      case "anxious":
        return "text-orange-400 bg-orange-900/20";
      case "frustrated":
        return "text-yellow-400 bg-yellow-900/20";
      case "overwhelmed":
        return "text-purple-400 bg-purple-900/20";
      case "hopeful":
        return "text-green-400 bg-green-900/20";
      case "positive":
        return "text-emerald-400 bg-emerald-900/20";
      default:
        return "text-gray-400 bg-gray-900/20";
    }
  };

  const activeSessions = sessions.filter((s) => !s.ended_at);
  const crisisSessions = sessions.filter((s) => s.crisis_level >= 3);
  const todaySessions = sessions.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString(),
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
          <div className="p-2 bg-pink-600/20 rounded-lg">
            <Heart className="h-6 w-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Clara AI Companion
            </h1>
            <p className="text-gray-400">
              24/7 Emotional Support & Crisis Intervention (Admin Only)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-pink-600/20 text-pink-400 border-pink-600/30">
            <Brain className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
            <Shield className="h-3 w-3 mr-1" />
            Admin Only
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Sessions</p>
                <p className="text-2xl font-bold text-white">
                  {activeSessions.length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Crisis Alerts</p>
                <p className="text-2xl font-bold text-red-400">
                  {crisisSessions.length}
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
                <p className="text-sm text-gray-400">Today's Sessions</p>
                <p className="text-2xl font-bold text-blue-400">
                  {todaySessions.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold text-white">
                  {sessions.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {/* Crisis Alerts */}
          {crisisSessions.length > 0 && (
            <Card className="bg-red-950/20 border-red-900/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Crisis Alerts - Immediate Attention Required
                </CardTitle>
                <CardDescription className="text-red-300/70">
                  These sessions have triggered crisis intervention protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crisisSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getCrisisLevelColor(
                              session.crisis_level,
                            )}
                          >
                            Level {session.crisis_level}
                          </Badge>
                          <Badge
                            className={getEmotionalStateColor(
                              session.emotional_state,
                            )}
                          >
                            {session.emotional_state}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            User: {session.user_id}
                          </h4>
                          <p className="text-sm text-red-300">
                            Started{" "}
                            {format(
                              new Date(session.created_at),
                              "MMM d, HH:mm",
                            )}
                            {session.intervention_triggered &&
                              " • Crisis intervention active"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Monitor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400"
                        >
                          <PhoneCall className="h-4 w-4 mr-1" />
                          Alert Team
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Sessions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">All Clara Sessions</CardTitle>
              <CardDescription>
                {sessions.length} total session
                {sessions.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session) => {
                  const duration = session.ended_at
                    ? differenceInMinutes(
                        new Date(session.ended_at),
                        new Date(session.created_at),
                      )
                    : differenceInMinutes(
                        new Date(),
                        new Date(session.created_at),
                      );

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={getCrisisLevelColor(
                              session.crisis_level,
                            )}
                            variant="outline"
                          >
                            Crisis: {session.crisis_level}
                          </Badge>
                          <Badge
                            className={getEmotionalStateColor(
                              session.emotional_state,
                            )}
                            variant="outline"
                          >
                            {session.emotional_state}
                          </Badge>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white">
                              User: {session.user_id}
                            </h4>
                            <Badge
                              variant="outline"
                              className={
                                session.ended_at
                                  ? "text-gray-400"
                                  : "text-green-400"
                              }
                            >
                              {session.ended_at ? "Ended" : "Active"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 mb-1">
                            Type: {session.session_type} • Duration: {duration}m
                          </p>
                          <p className="text-xs text-gray-400">
                            Started:{" "}
                            {format(
                              new Date(session.created_at),
                              "MMM d, yyyy HH:mm",
                            )}
                            {session.ended_at &&
                              ` • Ended: ${format(new Date(session.ended_at), "HH:mm")}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSession(session)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!session.ended_at && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => endSession(session.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {sessions.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No Clara sessions found</p>
                    <p className="text-sm text-gray-500">
                      Start a test session to see Clara in action
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversation" className="space-y-4">
          {selectedSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Session Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Session Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">User ID</p>
                    <p className="text-sm text-white">
                      {selectedSession.user_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Crisis Level</p>
                    <Badge
                      className={getCrisisLevelColor(
                        selectedSession.crisis_level,
                      )}
                    >
                      Level {selectedSession.crisis_level}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Emotional State</p>
                    <Badge
                      className={getEmotionalStateColor(
                        selectedSession.emotional_state,
                      )}
                    >
                      {selectedSession.emotional_state}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedSession.ended_at
                          ? "text-gray-400"
                          : "text-green-400"
                      }
                    >
                      {selectedSession.ended_at ? "Ended" : "Active"}
                    </Badge>
                  </div>
                  {selectedSession.intervention_triggered && (
                    <div className="p-2 bg-red-900/20 rounded border border-red-800/30">
                      <p className="text-xs text-red-400 font-medium">
                        Crisis Intervention Active
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation */}
              <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 h-96 overflow-y-auto mb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "clara" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`flex items-start gap-2 max-w-[80%] ${message.role === "clara" ? "flex-row" : "flex-row-reverse"}`}
                        >
                          <div
                            className={`p-2 rounded-full ${message.role === "clara" ? "bg-pink-600" : "bg-blue-600"}`}
                          >
                            {message.role === "clara" ? (
                              <Bot className="h-4 w-4 text-white" />
                            ) : (
                              <User className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg ${message.role === "clara" ? "bg-gray-700" : "bg-blue-600"}`}
                          >
                            <p className="text-sm text-white">
                              {message.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(message.timestamp), "HH:mm")}
                              {message.intervention_flag && (
                                <span className="ml-2 text-red-400">
                                  ⚠️ Crisis Flag
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Continue Conversation */}
                  {!selectedSession.ended_at && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Continue conversation as user..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && continueConversation()
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button
                        onClick={continueConversation}
                        disabled={!newMessage}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No Session Selected
                </h3>
                <p className="text-gray-400">
                  Select a session from the Active Sessions tab to view the
                  conversation
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Test Clara AI Companion
              </CardTitle>
              <CardDescription>
                Start a test session to evaluate Clara's responses (Admin Only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Test User ID
                  </label>
                  <Input
                    placeholder="test-user-123"
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Initial Message
                  </label>
                  <Textarea
                    placeholder="I'm feeling overwhelmed with my insurance claim..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={3}
                  />
                </div>
              </div>

              <Button
                onClick={startTestSession}
                disabled={!testUserId || !testMessage}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Heart className="h-4 w-4 mr-2" />
                Start Clara Session
              </Button>
            </CardContent>
          </Card>

          {/* Test Scenarios */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Common Test Scenarios
              </CardTitle>
              <CardDescription>
                Click to auto-fill test scenarios for different emotional states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTestUserId("test-user-stressed");
                    setTestMessage(
                      "I'm so overwhelmed with this insurance claim. I don't know what to do and I'm feeling really anxious about everything.",
                    );
                  }}
                  className="h-auto p-4 text-left flex-col items-start border-orange-600/30 hover:bg-orange-600/10"
                >
                  <span className="font-medium text-orange-400">
                    High Stress Scenario
                  </span>
                  <span className="text-sm text-gray-400">
                    Overwhelmed with claim process
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setTestUserId("test-user-crisis");
                    setTestMessage(
                      "I can't handle this anymore. Everything is falling apart and I feel like giving up. What's the point?",
                    );
                  }}
                  className="h-auto p-4 text-left flex-col items-start border-red-600/30 hover:bg-red-600/10"
                >
                  <span className="font-medium text-red-400">
                    Crisis Scenario
                  </span>
                  <span className="text-sm text-gray-400">
                    Potential crisis intervention needed
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setTestUserId("test-user-progress");
                    setTestMessage(
                      "I wanted to share some good news - I got approval on my claim! Thank you for the support, Clara.",
                    );
                  }}
                  className="h-auto p-4 text-left flex-col items-start border-green-600/30 hover:bg-green-600/10"
                >
                  <span className="font-medium text-green-400">
                    Positive Progress
                  </span>
                  <span className="text-sm text-gray-400">
                    Celebrating progress
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setTestUserId("test-user-normal");
                    setTestMessage(
                      "Hi Clara, I just have some questions about my claim timeline. Can you help me understand what to expect?",
                    );
                  }}
                  className="h-auto p-4 text-left flex-col items-start border-blue-600/30 hover:bg-blue-600/10"
                >
                  <span className="font-medium text-blue-400">
                    Normal Support
                  </span>
                  <span className="text-sm text-gray-400">
                    Standard information request
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
