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

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RiskScoreCard } from "./RiskScoreCard";
import { HazardZonesList } from "./HazardZonesList";
import { ActiveEventsMap } from "./ActiveEventsMap";
import {
  getParcelRiskAssessment,
  getPropertyHazardZones,
  getActiveEventsNearProperty,
  RiskAssessment as GeospatialRiskAssessment,
  HazardZone,
  ActiveEvent,
} from "@/actions/geospatial";
import {
  Building2,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface RiskAssessment {
  id: string;
  propertyId: string;
  overallRiskScore: number;
  riskLevel: "low" | "moderate" | "high" | "extreme";
  factors: {
    flood: number;
    fire: number;
    wind: number;
    earthquake: number;
    surge: number;
  };
  recommendations: string[];
  lastUpdated: Date;
  methodology: string;
  confidence: number;
}

// Using GeospatialHazardZone from geospatial actions

// Using GeospatialActiveEvent from geospatial actions

interface PropertyRiskDashboardProps {
  propertyId: string;
  propertyName: string;
  parcelId?: string;
  address?: string;
}

export function PropertyRiskDashboard({
  propertyId,
  propertyName,
  parcelId,
  address,
}: PropertyRiskDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskAssessment, setRiskAssessment] =
    useState<GeospatialRiskAssessment | null>(null);
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRiskData();
  }, [propertyId, parcelId]);

  const loadRiskData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load risk assessment if parcel is linked
      if (parcelId) {
        const [riskResult, hazardResult, eventsResult] = await Promise.all([
          getParcelRiskAssessment({ parcelId }),
          getPropertyHazardZones({ propertyId }),
          getActiveEventsNearProperty({ propertyId }),
        ]);

        if (riskResult.error) {
          setError(riskResult.error);
        } else {
          setRiskAssessment(riskResult.data);
        }

        if (!hazardResult.error && hazardResult.data) {
          setHazardZones(hazardResult.data);
        }

        if (!eventsResult.error && eventsResult.data) {
          setActiveEvents(eventsResult.data);
        }
      } else {
        setError(
          "Property not linked to a parcel. Link to a parcel to view risk assessment.",
        );
      }
    } catch (err) {
      setError("Failed to load risk data");
      console.error("Error loading risk data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRiskData();
    setRefreshing(false);
  };

  const exportRiskReport = () => {
    // Generate and download risk report
    const report = {
      property: propertyName,
      address,
      assessmentDate: riskAssessment?.assessmentDate,
      riskScores: {
        composite: riskAssessment?.compositeRiskScore,
        flood: riskAssessment?.floodRiskScore,
        wildfire: riskAssessment?.wildfireRiskScore,
        wind: riskAssessment?.windRiskScore,
        surge: riskAssessment?.surgeRiskScore,
      },
      hazardZones,
      activeEvents,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${propertyName.replace(/\s+/g, "_")}_risk_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading risk assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !parcelId) {
    return (
      <Alert className="bg-gray-800 border-gray-700">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-gray-300">{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Risk Assessment
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                {address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {address}
                  </span>
                )}
                {riskAssessment && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Updated{" "}
                    {format(
                      new Date(riskAssessment.assessmentDate),
                      "MMM d, yyyy",
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="bg-gray-700 border-gray-600 hover:bg-gray-600"
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")}
                />
                Refresh
              </Button>
              <Button
                onClick={exportRiskReport}
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 hover:bg-gray-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {riskAssessment ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hazards">Hazard Zones</TabsTrigger>
            <TabsTrigger value="events">Active Events</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Composite Risk Score */}
            <RiskScoreCard
              title="Overall Risk Score"
              score={riskAssessment.compositeRiskScore}
              category="composite"
              description="Combined assessment of all risk factors"
              className="col-span-full"
            />

            {/* Individual Risk Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <RiskScoreCard
                title="Flood Risk"
                score={riskAssessment.floodRiskScore}
                category="flood"
              />
              <RiskScoreCard
                title="Wildfire Risk"
                score={riskAssessment.wildfireRiskScore}
                category="wildfire"
              />
              <RiskScoreCard
                title="Wind Risk"
                score={riskAssessment.windRiskScore}
                category="wind"
              />
              <RiskScoreCard
                title="Storm Surge Risk"
                score={riskAssessment.surgeRiskScore}
                category="surge"
              />
            </div>

            {/* Quick Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Hazard Zones</p>
                    <p className="text-2xl font-bold text-white">
                      {riskAssessment.riskFactors.hazardZones.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">
                      Fire Station Distance
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {(
                        riskAssessment.riskFactors.fireStationDistance / 1609.34
                      ).toFixed(1)}{" "}
                      mi
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Hospital Distance</p>
                    <p className="text-2xl font-bold text-white">
                      {(
                        riskAssessment.riskFactors.hospitalDistance / 1609.34
                      ).toFixed(1)}{" "}
                      mi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hazards">
            <HazardZonesList hazardZones={hazardZones} />
          </TabsContent>

          <TabsContent value="events">
            <ActiveEventsMap
              activeEvents={activeEvents}
              propertyLocation={address}
            />
          </TabsContent>

          <TabsContent value="details">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Detailed Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-gray-300 overflow-auto bg-gray-900 p-4 rounded">
                  {JSON.stringify(riskAssessment.riskFactors, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Alert className="bg-gray-800 border-gray-700">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-gray-300">
            No risk assessment available.{" "}
            {error || "Link property to a parcel to generate assessment."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
