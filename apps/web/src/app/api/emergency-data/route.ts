import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface EmergencyDataRequest {
  lat?: number;
  lon?: number;
  propertyId?: string;
  state?: string;
  county?: string;
  radius?: number;
  includeWeather?: boolean;
  includeFEMA?: boolean;
  includeAlerts?: boolean;
  includePredictions?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client inside the function to avoid build-time issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body: EmergencyDataRequest = await req.json();

    const {
      lat,
      lon,
      propertyId,
      state = "FL",
      county,
      radius = 50,
      includeWeather = true,
      includeFEMA = true,
      includeAlerts = true,
      includePredictions = true,
    } = body;

    // Get coordinates from property if not provided
    let latitude = lat;
    let longitude = lon;
    let countyFips: string | undefined;

    if (propertyId && (!latitude || !longitude)) {
      const { data: property } = await supabase
        .from("properties")
        .select("latitude, longitude, county_fips")
        .eq("id", propertyId)
        .single();

      if (property) {
        latitude = property.latitude;
        longitude = property.longitude;
        countyFips = property.county_fips;
      }
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Location coordinates required" },
        { status: 400 });
    }

    const response: any = {
      location: { latitude, longitude },
      timestamp: new Date().toISOString(),
      data: {},
    };

    // =====================================================
    // WEATHER DATA
    // =====================================================

    if (includeWeather) {
      // Current conditions
      const { data: currentWeather } = await supabase.rpc(
        "get_current_conditions",
        { lat: latitude, lon: longitude });

      // 48-hour forecast
      const { data: forecast } = await supabase
        .from("weather.forecasts")
        .select("*")
        .gte("valid_time_start", new Date().toISOString())
        .lte(
          "valid_time_start",
          new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        )
        .order("valid_time_start")
        .limit(48);

      // Historical trends (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: historical } = await supabase
        .from("weather.hourly_stats")
        .select("*")
        .gte("hour", yesterday.toISOString())
        .order("hour");

      response.data.weather = {
        current: currentWeather,
        forecast: forecast || [],
        historical: historical || [],
        trends: analyzeWeatherTrends(historical || []),
      };
    }

    // =====================================================
    // FEMA DATA
    // =====================================================

    if (includeFEMA) {
      // Active disasters
      const { data: disasters } = await supabase
        .from("fema.disaster_declarations_v2")
        .select("*")
        .eq("state", state)
        .is("incident_end_date", null)
        .order("declaration_date", { ascending: false })
        .limit(10);

      // Public assistance projects nearby
      const { data: paProjects } = await supabase
        .rpc("search_pa_projects_nearby", {
          lat: latitude,
          lon: longitude,
          radius_miles: radius,
        })
        .limit(20);

      // Hazard mitigation in area
      const { data: hmProjects } = await supabase
        .from("fema.hma_projects_v3")
        .select("*")
        .eq("state", state)
        .eq("project_status", "Active")
        .limit(10);

      // Historical disaster statistics
      const { data: disasterStats } = await supabase
        .from("fema.monthly_disaster_stats")
        .select("*")
        .eq("state", state)
        .gte(
          "month",
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order("month", { ascending: false });

      response.data.fema = {
        activeDisasters: disasters || [],
        nearbyPAProjects: paProjects || [],
        hazardMitigation: hmProjects || [],
        statistics: calculateFEMAStatistics(disasterStats || []),
        riskScore: calculateDisasterRisk(disasters || [], disasterStats || []),
      };
    }

    // =====================================================
    // ALERTS & WARNINGS
    // =====================================================

    if (includeAlerts) {
      // Active weather alerts
      const { data: weatherAlerts } = await supabase
        .from("weather.alerts")
        .select("*")
        .gte("expires_time", new Date().toISOString())
        .order("severity")
        .order("urgency")
        .limit(10);

      // IPAWS emergency alerts
      const { data: ipawsAlerts } = await supabase
        .from("fema.ipaws_alerts_v1")
        .select("*")
        .gte("expires", new Date().toISOString())
        .order("severity")
        .order("sent", { ascending: false })
        .limit(10);

      // Combine and prioritize alerts
      const allAlerts = combineAndPrioritizeAlerts(
        weatherAlerts || [],
        ipawsAlerts || [],
      );

      response.data.alerts = {
        active: allAlerts,
        count: allAlerts.length,
        highestSeverity: getHighestSeverity(allAlerts),
        actionRequired: getRequiredActions(allAlerts),
      };
    }

    // =====================================================
    // PREDICTIVE ANALYTICS
    // =====================================================

    if (includePredictions) {
      const predictions = await generatePredictions({
        location: { latitude, longitude },
        weather: response.data.weather,
        fema: response.data.fema,
        alerts: response.data.alerts,
      });

      response.data.predictions = predictions;
    }

    // =====================================================
    // RISK ASSESSMENT
    // =====================================================

    const riskAssessment = calculateComprehensiveRisk({
      weather: response.data.weather,
      fema: response.data.fema,
      alerts: response.data.alerts,
      predictions: response.data.predictions,
    });

    response.riskAssessment = riskAssessment;

    // =====================================================
    // RECOMMENDATIONS
    // =====================================================

    const recommendations = generateRecommendations(
      riskAssessment,
      response.data,
    );
    response.recommendations = recommendations;

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Emergency data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch emergency data", details: error.message },
      { status: 500 });
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function analyzeWeatherTrends(historical: any[]): any {
  if (!historical || historical.length === 0) return null;

  const temps = historical.map((h) => h.avg_temp).filter((t) => t != null);
  const precipitation = historical
    .map((h) => h.total_precipitation)
    .filter((p) => p != null);

  return {
    temperatureTrend: calculateTrend(temps),
    precipitationTotal: precipitation.reduce((sum, p) => sum + p, 0),
    maxTemp: Math.max(...temps),
    minTemp: Math.min(...temps),
    averageTemp: temps.reduce((sum, t) => sum + t, 0) / temps.length,
  };
}

function calculateTrend(values: number[]): string {
  if (values.length < 2) return "stable";

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (change > 5) return "increasing";
  if (change < -5) return "decreasing";
  return "stable";
}

function calculateFEMAStatistics(stats: any[]): any {
  if (!stats || stats.length === 0) return null;

  const totalDisasters = stats.reduce(
    (sum, s) => sum + (s.disaster_count || 0),
    0,
  );
  const totalIA = stats.reduce((sum, s) => sum + (s.ia_declarations || 0), 0);
  const totalPA = stats.reduce((sum, s) => sum + (s.pa_declarations || 0), 0);

  const disasterTypes = {
    hurricanes: stats.reduce((sum, s) => sum + (s.hurricanes || 0), 0),
    floods: stats.reduce((sum, s) => sum + (s.floods || 0), 0),
    fires: stats.reduce((sum, s) => sum + (s.fires || 0), 0),
    storms: stats.reduce((sum, s) => sum + (s.storms || 0), 0),
  };

  return {
    totalDisasters,
    totalIA,
    totalPA,
    disasterTypes,
    averagePerMonth: totalDisasters / stats.length,
    trend: calculateTrend(stats.map((s) => s.disaster_count)),
  };
}

function calculateDisasterRisk(disasters: any[], stats: any[]): number {
  let riskScore = 50; // Base risk

  // Active disasters increase risk
  if (disasters && disasters.length > 0) {
    riskScore += disasters.length * 10;
  }

  // Historical frequency increases risk
  if (stats && stats.length > 0) {
    const avgDisasters =
      stats.reduce((sum, s) => sum + s.disaster_count, 0) / stats.length;
    riskScore += Math.min(avgDisasters * 5, 30);
  }

  return Math.min(riskScore, 100);
}

function combineAndPrioritizeAlerts(
  weatherAlerts: any[],
  ipawsAlerts: any[],
): any[] {
  const allAlerts = [
    ...(weatherAlerts || []).map((a) => ({ ...a, source: "NWS" })),
    ...(ipawsAlerts || []).map((a) => ({ ...a, source: "IPAWS" })),
  ];

  // Sort by severity and urgency
  return allAlerts.sort((a, b) => {
    const severityOrder = {
      extreme: 0,
      severe: 1,
      moderate: 2,
      minor: 3,
      unknown: 4,
    };
    const urgencyOrder = {
      immediate: 0,
      expected: 1,
      future: 2,
      past: 3,
      unknown: 4,
    };

    const aSeverity =
      severityOrder[a.severity?.toLowerCase() as keyof typeof severityOrder] ??
      4;
    const bSeverity =
      severityOrder[b.severity?.toLowerCase() as keyof typeof severityOrder] ??
      4;

    if (aSeverity !== bSeverity) return aSeverity - bSeverity;

    const aUrgency =
      urgencyOrder[a.urgency?.toLowerCase() as keyof typeof urgencyOrder] ?? 4;
    const bUrgency =
      urgencyOrder[b.urgency?.toLowerCase() as keyof typeof urgencyOrder] ?? 4;

    return aUrgency - bUrgency;
  });
}

function getHighestSeverity(alerts: any[]): string {
  if (!alerts || alerts.length === 0) return "none";

  const severities = alerts
    .map((a) => a.severity?.toLowerCase())
    .filter(Boolean);

  if (severities.includes("extreme")) return "extreme";
  if (severities.includes("severe")) return "severe";
  if (severities.includes("moderate")) return "moderate";
  if (severities.includes("minor")) return "minor";

  return "unknown";
}

function getRequiredActions(alerts: any[]): string[] {
  const actions = new Set<string>();

  alerts.forEach((alert) => {
    if (alert.severity === "extreme" || alert.severity === "severe") {
      actions.add("Monitor emergency communications");
    }

    if (
      alert.event?.includes("Hurricane") ||
      alert.event?.includes("Tornado")
    ) {
      actions.add("Review evacuation plans");
      actions.add("Secure property");
    }

    if (alert.event?.includes("Flood")) {
      actions.add("Move valuables to higher ground");
      actions.add("Avoid flood-prone areas");
    }

    if (alert.instruction) {
      actions.add(alert.instruction);
    }
  });

  return Array.from(actions);
}

async function generatePredictions(data: any): Promise<any> {
  const predictions: any = {
    shortTerm: {},
    mediumTerm: {},
    longTerm: {},
  };

  // Short-term (24-48 hours)
  if (data.weather?.forecast) {
    const severeWeatherRisk = data.weather.forecast.some(
      (f: any) => f.precipitation_probability > 70 || f.wind_speed > 30,
    );

    predictions.shortTerm.severeWeatherLikely = severeWeatherRisk;
    predictions.shortTerm.confidence = 0.85;
  }

  // Medium-term (1 week)
  predictions.mediumTerm.disasterProbability =
    calculateDisasterProbability(data);
  predictions.mediumTerm.confidence = 0.7;

  // Long-term (1 month)
  predictions.longTerm.seasonalRisk = calculateSeasonalRisk(new Date());
  predictions.longTerm.confidence = 0.6;

  return predictions;
}

function calculateDisasterProbability(data: any): number {
  let probability = 0.1; // Base 10%

  // Weather factors
  if (data.weather?.current?.wind_speed_mph > 40) probability += 0.2;
  if (data.weather?.trends?.precipitationTotal > 5) probability += 0.15;

  // Active alerts increase probability
  if (data.alerts?.count > 0) {
    probability += data.alerts.count * 0.1;
  }

  // Historical patterns
  if (data.fema?.statistics?.trend === "increasing") {
    probability += 0.15;
  }

  return Math.min(probability, 0.95);
}

function calculateSeasonalRisk(date: Date): string {
  const month = date.getMonth();

  // Hurricane season (June-November)
  if (month >= 5 && month <= 10) {
    return "high";
  }

  // Winter storms (December-February)
  if (month >= 11 || month <= 1) {
    return "moderate";
  }

  return "low";
}

function calculateComprehensiveRisk(data: any): any {
  const weights = {
    weather: 0.3,
    disasters: 0.25,
    alerts: 0.25,
    predictions: 0.2,
  };

  let totalRisk = 0;
  const factors: any = {};

  // Weather risk
  if (data.weather) {
    const weatherRisk = calculateWeatherRisk(data.weather);
    factors.weather = weatherRisk;
    totalRisk += weatherRisk * weights.weather;
  }

  // Disaster risk
  if (data.fema) {
    const disasterRisk = data.fema.riskScore || 50;
    factors.disasters = disasterRisk;
    totalRisk += disasterRisk * weights.disasters;
  }

  // Alert risk
  if (data.alerts) {
    const alertRisk = calculateAlertRisk(data.alerts);
    factors.alerts = alertRisk;
    totalRisk += alertRisk * weights.alerts;
  }

  // Prediction risk
  if (data.predictions) {
    const predictionRisk =
      data.predictions.mediumTerm.disasterProbability * 100;
    factors.predictions = predictionRisk;
    totalRisk += predictionRisk * weights.predictions;
  }

  return {
    overallRisk: Math.round(totalRisk),
    riskLevel: getRiskLevel(totalRisk),
    factors,
    primaryConcern: getPrimaryConcern(factors),
  };
}

function calculateWeatherRisk(weather: any): number {
  let risk = 30; // Base weather risk

  if (weather.current) {
    if (weather.current.wind_speed_mph > 30) risk += 20;
    if (weather.current.precipitation > 2) risk += 15;
  }

  if (weather.trends?.temperatureTrend === "increasing") risk += 10;
  if (weather.trends?.precipitationTotal > 5) risk += 15;

  return Math.min(risk, 100);
}

function calculateAlertRisk(alerts: any): number {
  if (!alerts.active || alerts.active.length === 0) return 20;

  const severityScores = {
    extreme: 100,
    severe: 75,
    moderate: 50,
    minor: 30,
    unknown: 20,
  };

  const highestSeverity = alerts.highestSeverity || "unknown";
  return severityScores[highestSeverity as keyof typeof severityScores] || 20;
}

function getRiskLevel(risk: number): string {
  if (risk >= 80) return "critical";
  if (risk >= 60) return "high";
  if (risk >= 40) return "moderate";
  if (risk >= 20) return "low";
  return "minimal";
}

function getPrimaryConcern(factors: any): string {
  const concerns = Object.entries(factors).sort(
    (a, b) => (b[1] as number) - (a[1] as number),
  );

  if (concerns.length === 0) return "none";

  const [concern, value] = concerns[0];

  if ((value as number) < 30) return "none";

  switch (concern) {
    case "weather":
      return "Severe weather conditions";
    case "disasters":
      return "Active disaster declarations";
    case "alerts":
      return "Emergency alerts active";
    case "predictions":
      return "High probability of future events";
    default:
      return "General elevated risk";
  }
}

function generateRecommendations(riskAssessment: any, data: any): any {
  const recommendations = {
    immediate: [] as string[],
    shortTerm: [] as string[],
    longTerm: [] as string[],
  };

  // Immediate actions based on risk level
  if (
    riskAssessment.riskLevel === "critical" ||
    riskAssessment.riskLevel === "high"
  ) {
    recommendations.immediate.push(
      "Review and update emergency contact information",
    );
    recommendations.immediate.push("Ensure emergency supplies are stocked");
    recommendations.immediate.push("Document current property condition");
  }

  // Alert-based recommendations
  if (data.alerts?.active?.length > 0) {
    recommendations.immediate.push("Monitor official emergency communications");

    data.alerts.actionRequired?.forEach((action: string) => {
      recommendations.immediate.push(action);
    });
  }

  // Weather-based recommendations
  if (data.weather?.current?.wind_speed_mph > 25) {
    recommendations.shortTerm.push("Secure outdoor furniture and loose items");
  }

  if (data.weather?.trends?.precipitationTotal > 3) {
    recommendations.shortTerm.push("Clear gutters and storm drains");
    recommendations.shortTerm.push("Check sump pump operation");
  }

  // FEMA-based recommendations
  if (data.fema?.activeDisasters?.length > 0) {
    recommendations.shortTerm.push("Review insurance coverage and deductibles");
    recommendations.shortTerm.push(
      "Register with FEMA if eligible for assistance",
    );
  }

  // Long-term recommendations
  recommendations.longTerm.push(
    "Consider flood insurance if not currently covered",
  );
  recommendations.longTerm.push(
    "Develop comprehensive emergency preparedness plan",
  );
  recommendations.longTerm.push(
    "Explore hazard mitigation grant opportunities",
  );

  return recommendations;
}
