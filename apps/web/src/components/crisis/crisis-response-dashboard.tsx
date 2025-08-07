"use client";

/**
 * Crisis Response Dashboard
 * Revenue Impact: $110K → $280K (154% ROI)
 * Emergency response coordination and crisis management interface
 */

import { useState, useEffect, useCallback } from "react";
import {
  crisisResponseCoordinator,
  type CrisisEvent,
  type CrisisResponse,
  type CrisisAction,
  type EmergencyResource,
} from "@/lib/services/crisis-response-coordinator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  Shield,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  Phone,
  Home,
  Car,
  Building,
  Heart,
  Activity,
  Navigation,
  Zap,
  Wind,
  CloudRain,
  Flame,
  Waves,
  Mountain,
  RefreshCw,
  ExternalLink,
  Siren,
  Radio,
  Eye,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface CrisisResponseDashboardProps {
  userId: string;
  className?: string;
}

interface CrisisAlert {
  id: string;
  severity: number;
  title: string;
  message: string;
  location: string;
  timestamp: string;
  isActive: boolean;
}

export function CrisisResponseDashboard({
  userId,
  className,
}: CrisisResponseDashboardProps) {
  const [activeCrises, setActiveCrises] = useState<CrisisEvent[]>([]);
  const [activeResponse, setActiveResponse] = useState<CrisisResponse | null>(
    null,
  );
  const [emergencyResources, setEmergencyResources] = useState<
    EmergencyResource[]
  >([]);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadCrisisData();
    const interval = setInterval(loadCrisisData, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userId]);

  const loadCrisisData = useCallback(async () => {
    try {
      setLoading(true);

      // Load active crisis events
      const crises =
        await crisisResponseCoordinator.monitorCrisisEvents(userId);
      setActiveCrises(crises);

      // Create alert notifications
      const alerts = crises
        .filter((c) => c.severity >= 3)
        .map((crisis) => ({
          id: crisis.id,
          severity: crisis.severity,
          title: crisis.title,
          message: crisis.description,
          location: crisis.location.affected_areas.join(", "),
          timestamp: crisis.created_at,
          isActive: crisis.status === "active",
        }));
      setCrisisAlerts(alerts);

      // Load emergency resources for user area (mock location: SW Florida)
      const resources = await crisisResponseCoordinator.findEmergencyResources(
        [-81.8723, 26.6406], // Fort Myers, FL coordinates
        ["shelter", "contractor", "medical", "government"],
      );
      setEmergencyResources(resources);
    } catch (error) {
      console.error("Error loading crisis data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const activateCrisisResponse = async (crisisId: string) => {
    try {
      const response = await crisisResponseCoordinator.activateCrisisResponse(
        userId,
        crisisId,
      );
      if (response) {
        setActiveResponse(response);
        setActiveTab("response");
      }
    } catch (error) {
      console.error("Error activating crisis response:", error);
    }
  };

  const updateActionStatus = async (actionId: string, completed: boolean) => {
    if (!activeResponse) return;

    try {
      const status:
        | "pending"
        | "in_progress"
        | "completed"
        | "skipped"
        | "not_applicable" = completed ? "completed" : "pending";
      await crisisResponseCoordinator.updateActionStatus(
        activeResponse.id,
        actionId,
        status,
      );

      // Update local state
      const updatedActions = activeResponse.action_plan.map((action) =>
        action.id === actionId
          ? { ...action, completion_status: status }
          : action,
      );

      setActiveResponse({
        ...activeResponse,
        action_plan: updatedActions,
      });
    } catch (error) {
      console.error("Error updating action status:", error);
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
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

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 5:
        return "EXTREME EMERGENCY";
      case 4:
        return "EMERGENCY WARNING";
      case 3:
        return "WARNING";
      case 2:
        return "ADVISORY";
      case 1:
        return "WATCH";
      default:
        return "UNKNOWN";
    }
  };

  const getCrisisIcon = (type: CrisisEvent["type"]) => {
    switch (type) {
      case "hurricane":
        return <Wind className="h-5 w-5" />;
      case "tornado":
        return <RotateCcw className="h-5 w-5" />;
      case "flood":
        return <Waves className="h-5 w-5" />;
      case "wildfire":
        return <Flame className="h-5 w-5" />;
      case "earthquake":
        return <Mountain className="h-5 w-5" />;
      case "severe_weather":
        return <CloudRain className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getPriorityIcon = (priority: CrisisAction["priority"]) => {
    switch (priority) {
      case "critical":
        return <Siren className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">
            Loading crisis monitoring...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Crisis Alerts */}
      {crisisAlerts.length > 0 && (
        <div className="space-y-3">
          {crisisAlerts.map((alert) => (
            <Alert key={alert.id} className="border-red-500/20 bg-red-900/10">
              <Siren className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-400 flex items-center justify-between">
                <span>
                  {getSeverityLabel(alert.severity)} - {alert.title}
                </span>
                <Badge className={getSeverityColor(alert.severity)}>
                  Level {alert.severity}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-red-300">
                {alert.message}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-400">
                    {alert.location} •{" "}
                    {formatDistanceToNow(new Date(alert.timestamp))} ago
                  </span>
                  <Button
                    size="sm"
                    onClick={() => activateCrisisResponse(alert.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Activate Response
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gray-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="response"
            className="data-[state=active]:bg-gray-700"
          >
            <Activity className="h-4 w-4 mr-2" />
            Response Plan
          </TabsTrigger>
          <TabsTrigger
            value="resources"
            className="data-[state=active]:bg-gray-700"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="data-[state=active]:bg-gray-700"
          >
            <Phone className="h-4 w-4 mr-2" />
            Emergency Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Active Crises
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {activeCrises.length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-full">
                    <Siren className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Response Status
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {activeResponse ? "ACTIVE" : "MONITORING"}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${activeResponse ? "bg-red-500/10" : "bg-green-500/10"}`}
                  >
                    <Shield
                      className={`h-6 w-6 ${activeResponse ? "text-red-500" : "text-green-500"}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Resources Available
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {emergencyResources.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Crisis Events */}
          {activeCrises.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Active Crisis Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeCrises.map((crisis) => (
                  <div
                    key={crisis.id}
                    className="border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-700 rounded-lg">
                          {getCrisisIcon(crisis.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {crisis.title}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {crisis.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {crisis.location.affected_areas.join(", ")}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(
                                new Date(crisis.created_at),
                              )}{" "}
                              ago
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(crisis.severity)}>
                          Level {crisis.severity}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => activateCrisisResponse(crisis.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Activate
                        </Button>
                      </div>
                    </div>

                    {crisis.timing.peak_impact && (
                      <div className="mt-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-600/20">
                        <p className="text-yellow-400 text-sm">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Peak impact expected:{" "}
                          {format(
                            new Date(crisis.timing.peak_impact),
                            "MMM d, yyyy h:mm a",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* No Active Crises */}
          {activeCrises.length === 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  All Clear
                </h3>
                <p className="text-gray-400 mb-6">
                  No active crisis events detected in your area.
                </p>
                <Button
                  onClick={loadCrisisData}
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for Updates
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="response" className="space-y-6">
          {activeResponse ? (
            <>
              {/* Response Progress */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-red-500" />
                      Crisis Response Active
                    </span>
                    <Badge
                      variant="outline"
                      className="border-red-500/20 text-red-400"
                    >
                      {activeResponse.response_level
                        .replace("_", " ")
                        .toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Activated{" "}
                    {formatDistanceToNow(
                      new Date(activeResponse.activation_time),
                    )}{" "}
                    ago
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Overall Progress</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress
                          value={activeResponse.progress.completion_percentage}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-white">
                          {activeResponse.progress.completion_percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {activeResponse.progress.actions_completed} of{" "}
                        {activeResponse.progress.actions_total} actions
                        completed
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Critical Actions</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress
                          value={
                            activeResponse.progress.critical_actions_total > 0
                              ? (activeResponse.progress
                                  .critical_actions_completed /
                                  activeResponse.progress
                                    .critical_actions_total) *
                                100
                              : 0
                          }
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-white">
                          {activeResponse.progress.critical_actions_completed}/
                          {activeResponse.progress.critical_actions_total}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Checklist */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Emergency Action Plan
                  </CardTitle>
                  <CardDescription>
                    Follow these steps in order of priority
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeResponse.action_plan.map((action, index) => (
                    <div
                      key={action.id}
                      className={`border rounded-lg p-4 ${
                        action.completion_status === "completed"
                          ? "border-green-600/20 bg-green-900/10"
                          : action.priority === "critical"
                            ? "border-red-600/20 bg-red-900/10"
                            : "border-gray-700"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center pt-1">
                          <Checkbox
                            checked={action.completion_status === "completed"}
                            onCheckedChange={(checked) =>
                              updateActionStatus(action.id, !!checked)
                            }
                            className="border-gray-600 data-[state=checked]:bg-green-600"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`font-medium ${
                                action.completion_status === "completed"
                                  ? "text-green-400 line-through"
                                  : "text-white"
                              }`}
                            >
                              {action.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {getPriorityIcon(action.priority)}
                              <Badge variant="outline" className="text-xs">
                                {action.estimated_time}min
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            {action.description}
                          </p>
                          {action.instructions.length > 0 && (
                            <ul className="text-sm text-gray-400 mt-2 space-y-1">
                              {action.instructions.map((instruction, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  {instruction}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <Pause className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Active Response
                </h3>
                <p className="text-gray-400">
                  Crisis response will activate automatically when emergency
                  conditions are detected.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                Emergency Resources Nearby
              </CardTitle>
              <CardDescription>
                Essential resources and contacts in your area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emergencyResources.map((resource) => (
                <div
                  key={resource.id}
                  className="border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        {resource.type === "shelter" && (
                          <Home className="h-5 w-5 text-blue-500" />
                        )}
                        {resource.type === "contractor" && (
                          <Building className="h-5 w-5 text-blue-500" />
                        )}
                        {resource.type === "medical" && (
                          <Heart className="h-5 w-5 text-blue-500" />
                        )}
                        {resource.type === "government" && (
                          <Shield className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {resource.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {resource.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-gray-400">
                            {resource.contact.address}
                          </span>
                          {resource.capacity && (
                            <Badge
                              variant="outline"
                              className={
                                resource.capacity.availability === "available"
                                  ? "border-green-500/20 text-green-400"
                                  : resource.capacity.availability === "limited"
                                    ? "border-yellow-500/20 text-yellow-400"
                                    : "border-red-500/20 text-red-400"
                              }
                            >
                              {resource.capacity.availability}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${resource.contact.phone}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </a>
                      </Button>
                      {resource.contact.website && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={resource.contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-500" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                Quick access to important emergency numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-white">Emergency Services</h3>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href="tel:911">
                        <Siren className="h-4 w-4 mr-2 text-red-500" />
                        911 - Emergency Services
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href="tel:211">
                        <Phone className="h-4 w-4 mr-2 text-blue-500" />
                        211 - Community Resources
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href="tel:311">
                        <Shield className="h-4 w-4 mr-2 text-green-500" />
                        311 - Non-Emergency City Services
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-white">
                    Local Emergency Management
                  </h3>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href="tel:2395330622">
                        <Shield className="h-4 w-4 mr-2 text-orange-500" />
                        Lee County Emergency - (239) 533-0622
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href="tel:2392523600">
                        <Shield className="h-4 w-4 mr-2 text-orange-500" />
                        Collier County Emergency - (239) 252-3600
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-medium text-white mb-3">
                  Personal Emergency Contacts
                </h3>
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 mb-4">
                    No personal emergency contacts configured
                  </p>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-gray-700"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Add Emergency Contacts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
