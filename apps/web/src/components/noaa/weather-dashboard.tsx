"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Cloud,
  Wind,
  Droplets,
  AlertTriangle,
  MapPin,
  Gauge,
  Thermometer,
  Eye,
  Clock,
} from "lucide-react";

interface WeatherObservation {
  station_id: string;
  observation_time: string;
  temperature: number;
  wind_speed: number;
  wind_direction: number;
  barometric_pressure: number;
  relative_humidity: number;
  visibility: number;
}

interface StormAlert {
  event_id: string;
  event_type: string;
  severity: string;
  headline: string;
  expires: string;
  affected_zones: string[];
}

interface TideData {
  station_name: string;
  observation_time: string;
  water_level: number;
  quality: string;
}

interface SeverityStatus {
  level: "normal" | "elevated" | "severe" | "extreme";
  multiplier: number;
  metrics: {
    maxWindSpeed: number;
    alertCount: number;
    maxSurge: number;
  };
}

export function WeatherDashboard() {
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [alerts, setAlerts] = useState<StormAlert[]>([]);
  const [tides, setTides] = useState<TideData[]>([]);
  const [severity, setSeverity] = useState<SeverityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      // Get latest observations
      const { data: obsData } = await supabase
        .from("noaa_weather_observations")
        .select("*")
        .order("observation_time", { ascending: false })
        .limit(10);

      if (obsData) setObservations(obsData);

      // Get active alerts
      const { data: alertData } = await supabase
        .from("noaa_storm_events")
        .select("*")
        .eq("active", true)
        .order("severity", { ascending: false })
        .limit(5);

      if (alertData) setAlerts(alertData);

      // Get latest tide data
      const { data: tideData } = await supabase
        .from("noaa_tide_and_current_data")
        .select("*")
        .order("observation_time", { ascending: false })
        .limit(8);

      if (tideData) setTides(tideData);

      // Get severity status
      const { data: configData } = await supabase
        .from("system_config")
        .select("*")
        .eq("key", "noaa_ingestion_severity")
        .single();

      if (configData?.value) {
        setSeverity(configData.value);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error loading weather data:", error);
      setLoading(false);
    }
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case "extreme":
        return "bg-red-500";
      case "severe":
        return "bg-orange-500";
      case "elevated":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getWindCategory = (speed: number) => {
    if (speed >= 74) return { label: "Hurricane", color: "text-red-600" };
    if (speed >= 39)
      return { label: "Tropical Storm", color: "text-orange-600" };
    if (speed >= 25) return { label: "Strong Wind", color: "text-yellow-600" };
    return { label: "Normal", color: "text-green-600" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Severity Status Bar */}
      {severity && (
        <Alert
          className={`border-2 ${
            severity.level === "extreme"
              ? "border-red-500"
              : severity.level === "severe"
                ? "border-orange-500"
                : severity.level === "elevated"
                  ? "border-yellow-500"
                  : "border-green-500"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            Weather Severity: {severity.level.toUpperCase()}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="flex items-center gap-4 text-sm">
              <span>Max Wind: {severity.metrics.maxWindSpeed} kts</span>
              <span>Active Alerts: {severity.metrics.alertCount}</span>
              <span>
                Update Frequency:{" "}
                {severity.multiplier === 1
                  ? "Normal"
                  : `${Math.round(1 / severity.multiplier)}x`}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Active Weather Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Active Weather Alerts
          </h3>
          {alerts.map((alert) => (
            <Alert
              key={alert.event_id}
              className="border-orange-200 bg-orange-50"
            >
              <AlertTitle className="text-orange-900">
                {alert.event_type} - {alert.severity}
              </AlertTitle>
              <AlertDescription className="text-orange-800">
                {alert.headline}
                <div className="mt-2 text-xs">
                  Expires: {new Date(alert.expires).toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="observations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="tides">Tides & Surge</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="observations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {observations.map((obs) => {
              const windCat = getWindCategory(obs.wind_speed || 0);
              return (
                <Card key={`${obs.station_id}-${obs.observation_time}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {obs.station_id}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(obs.observation_time).toLocaleTimeString()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-blue-500" />
                        <span>{obs.temperature?.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wind className={`h-4 w-4 ${windCat.color}`} />
                        <span>{obs.wind_speed?.toFixed(1)} kts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="h-4 w-4 text-gray-500" />
                        <span>{obs.barometric_pressure?.toFixed(1)} mb</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-4 w-4 text-cyan-500" />
                        <span>{obs.relative_humidity?.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Badge
                        className={windCat.color
                          .replace("text-", "bg-")
                          .replace("600", "100")}
                      >
                        {windCat.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tides" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tides.map((tide, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{tide.station_name}</CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(tide.observation_time).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <span className="text-lg font-semibold">
                        {tide.water_level?.toFixed(2)} ft
                      </span>
                    </div>
                    <Badge
                      variant={tide.quality === "v" ? "default" : "secondary"}
                    >
                      {tide.quality === "v" ? "Verified" : "Predicted"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Forecast</CardTitle>
              <CardDescription>
                Enhanced forecast data coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Forecast data will be integrated with the next update
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Update */}
      {lastUpdate && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
