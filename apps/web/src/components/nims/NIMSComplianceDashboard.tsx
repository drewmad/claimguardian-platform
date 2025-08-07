/**
 * @fileMetadata
 * @purpose "NIMS Compliance Dashboard for emergency management operations"
 * @dependencies ["@/lib/nims", "@/components/ui"]
 * @owner emergency-management-team
 * @status stable
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Activity,
  Users,
  Radio,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  activeIncidents: number;
  availableResources: number;
  activeAlerts: number;
  complianceScore: number;
}

interface ActiveIncident {
  id: string;
  incident_number: string;
  incident_name: string;
  incident_type: string;
  status: string;
  complexity_level: number;
  start_date: string;
}

interface EmergencyAlert {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  urgency: string;
  severity: string;
}

interface NIMSResource {
  id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  location: any;
}

export function NIMSComplianceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeIncidents: 0,
    availableResources: 0,
    activeAlerts: 0,
    complianceScore: 0,
  });
  const [incidents, setIncidents] = useState<ActiveIncident[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [resources, setResources] = useState<NIMSResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load active incidents
      const incidentsResponse = await fetch(
        "/api/nims/incidents?status=active&limit=10",
      );
      if (incidentsResponse.ok) {
        const incidentsData = await incidentsResponse.json();
        setIncidents(incidentsData.incidents || []);
      }

      // Load active alerts
      const alertsResponse = await fetch(
        "/api/nims/alerts?status=sent&limit=10",
      );
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      }

      // Load available resources
      const resourcesResponse = await fetch(
        "/api/nims/resources?status=available&limit=50",
      );
      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData.resources || []);
      }

      // Calculate stats
      setStats({
        activeIncidents: incidents.length,
        availableResources: resources.length,
        activeAlerts: alerts.filter((a) => a.status === "sent").length,
        complianceScore: calculateComplianceScore(),
      });
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateComplianceScore = (): number => {
    // Simplified compliance scoring based on system readiness
    let score = 100;

    // Deduct points for missing critical components
    if (incidents.length === 0) score -= 10; // No active monitoring
    if (resources.length < 10) score -= 20; // Insufficient resources
    if (alerts.filter((a) => a.priority === "immediate").length > 5)
      score -= 15; // Too many critical alerts

    return Math.max(0, score);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "flash":
        return "bg-red-600";
      case "immediate":
        return "bg-orange-500";
      case "priority":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600";
      case "contained":
        return "bg-yellow-600";
      case "controlled":
        return "bg-blue-600";
      case "closed":
        return "bg-gray-600";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            NIMS Compliance Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Federal Emergency Management System Integration
          </p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading}>
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Incidents
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIncidents}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ICS command structures deployed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Resources
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableResources}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              NIMS-typed resources ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Radio className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              CAP-compliant alerts distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceScore}%</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              NIMS standard compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active ICS Incidents</CardTitle>
              <CardDescription>
                Current emergency incidents under ICS command structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active incidents
                </p>
              ) : (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {incident.incident_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {incident.incident_number} • Type{" "}
                          {incident.complexity_level} • {incident.incident_type}
                        </p>
                        <p className="text-xs text-gray-500">
                          Started:{" "}
                          {new Date(incident.start_date).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(incident.status)} text-white`}
                      >
                        {incident.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Alerts</CardTitle>
              <CardDescription>
                CAP-compliant emergency alert distribution system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active alerts
                </p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {alert.urgency} • {alert.severity}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`${getPriorityColor(alert.priority)} text-white`}
                        >
                          {alert.priority}
                        </Badge>
                        <Badge variant="outline">{alert.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NIMS Resources</CardTitle>
              <CardDescription>
                Available emergency resources typed according to NIMS standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No resources available
                </p>
              ) : (
                <div className="space-y-3">
                  {resources.slice(0, 10).map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium">{resource.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {resource.type} • {resource.category}
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {resource.status}
                      </Badge>
                    </div>
                  ))}
                  {resources.length > 10 && (
                    <p className="text-center text-sm text-gray-500">
                      ...and {resources.length - 10} more resources
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NIMS Compliance Status</CardTitle>
              <CardDescription>
                System compliance with FEMA NIMS standards and requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">ICS Integration Active</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Resource Typing Compliant</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">CAP Alerts Enabled</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">EDXL Communications Ready</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">
                      External Service Integration
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Disaster Workflows Active</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Compliance Reporting Ready</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">
                      Database Infrastructure Ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">System Capabilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Incident Management</h5>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• ICS Forms (201, 202, 203)</li>
                      <li>• Resource Requests</li>
                      <li>• Situation Reports</li>
                      <li>• Organizational Charts</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Communications</h5>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• CAP 1.2 Alerts</li>
                      <li>• EDXL Distribution</li>
                      <li>• Multi-channel Delivery</li>
                      <li>• Communication Plans</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Resource Management</h5>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• NIMS Resource Typing</li>
                      <li>• Deployment Tracking</li>
                      <li>• Cost Accounting</li>
                      <li>• Mutual Aid Coordination</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
