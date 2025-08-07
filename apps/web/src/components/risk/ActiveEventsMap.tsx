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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flame, CloudRain, Wind, MapPin, Clock, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ActiveEvent } from "@/actions/geospatial";

// Using ActiveEvent from geospatial actions

interface ActiveEventsMapProps {
  activeEvents: ActiveEvent[];
  propertyLocation?: string;
}

export function ActiveEventsMap({
  activeEvents,
  propertyLocation,
}: ActiveEventsMapProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "wildfire":
        return <Flame className="h-4 w-4" />;
      case "flood":
        return <CloudRain className="h-4 w-4" />;
      case "hurricane":
        return <Wind className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "wildfire":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "flood":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "hurricane":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="text-xs">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="secondary" className="text-xs">
            Low
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {severity}
          </Badge>
        );
    }
  };

  if (activeEvents.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No active hazard events in your area</p>
          <p className="text-sm text-gray-500 mt-2">
            We're monitoring for wildfires, floods, and other hazards within 10
            miles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-yellow-900/20 border-yellow-600/50">
        <Activity className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-200">
          {activeEvents.length} active hazard event
          {activeEvents.length > 1 ? "s" : ""} detected near your property
        </AlertDescription>
      </Alert>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Active Events</CardTitle>
            {propertyLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>Within 10 miles of property</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-gray-900 rounded-lg border border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${getEventColor(event.eventType)}`}
                    >
                      {getEventIcon(event.eventType)}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {event.eventName}
                      </h4>
                      <p className="text-sm text-gray-400 capitalize">
                        {event.eventType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        event.status === "active" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {event.status}
                    </Badge>
                    {getSeverityBadge(event.severity)}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Started {formatDistanceToNow(new Date(event.startTime))}{" "}
                      ago
                    </span>
                  </div>
                </div>

                {/* Event-specific details could go here */}
                {event.eventType === "wildfire" && (
                  <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                    <p className="text-xs text-gray-400">
                      Monitor local authorities for evacuation orders and air
                      quality updates.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map placeholder - in production, integrate with mapping library */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div className="h-64 bg-gray-900 rounded-b-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Interactive map coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
