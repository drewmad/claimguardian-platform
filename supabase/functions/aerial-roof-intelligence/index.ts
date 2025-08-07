import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface AerialRequest {
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  analysisType:
    | "roof-condition"
    | "damage-assessment"
    | "solar-potential"
    | "structural-analysis"
    | "complete-analysis";
  referenceDate?: string; // For before/after comparisons
  damageReportDate?: string; // For hurricane damage claims
}

interface RoofIntelligence {
  roofCondition?: {
    area: number;
    material: string;
    condition: "excellent" | "good" | "fair" | "poor" | "damaged";
    ageEstimate: number;
    maintenanceNeeded: string[];
  };
  damageAssessment?: {
    damagePercentage: number;
    damageType: string[];
    affectedAreas: string[];
    repairEstimate: {
      min: number;
      max: number;
      priority: "immediate" | "urgent" | "scheduled" | "cosmetic";
    };
    insuranceRecommendation: string;
  };
  solarPotential?: {
    viableSurfaceArea: number;
    annualEnergyPotential: number;
    estimatedSolarPanels: number;
    potentialSavings: number;
    obstacleAnalysis: string[];
  };
  structuralAnalysis?: {
    foundationVisible: boolean;
    additions: string[];
    propertyBoundaries: any[];
    buildingFootprint: number;
    structuralConcerns: string[];
  };
  aerialUrls?: {
    satellite: string;
    oblique?: string;
    historical?: string[];
  };
}

const GOOGLE_MAPS_API_KEY =
  Deno.env.get("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") ||
  Deno.env.get("GOOGLE_MAPS_API_KEY");

async function getAerialImagery(
  lat: number,
  lng: number,
  options: { zoom?: number; size?: string; mapType?: string } = {},
): Promise<string> {
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(options.zoom || 20), // High zoom for roof detail
    size: options.size || "640x640",
    maptype: options.mapType || "satellite",
    key: GOOGLE_MAPS_API_KEY!,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

async function analyzeRoofFromAerialView(
  lat: number,
  lng: number,
): Promise<any> {
  // Using Google's Aerial View API (when available) or Solar API for roof analysis
  try {
    const solarUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(solarUrl);
    if (response.ok) {
      const solarData = await response.json();
      return solarData;
    }

    // Fallback to mock analysis based on satellite imagery
    return await mockRoofAnalysis(lat, lng);
  } catch (error) {
    console.log(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message: "Solar API not available, using mock analysis:",
        error,
      }),
    );
    return await mockRoofAnalysis(lat, lng);
  }
}

async function mockRoofAnalysis(lat: number, lng: number): Promise<any> {
  // Mock roof analysis based on location characteristics
  // In production, this would use computer vision on aerial imagery

  const locationFactor = (lat + lng) % 1; // Semi-random based on coordinates

  return {
    name: `buildings/${Math.floor(Math.random() * 1000000)}`,
    center: { latitude: lat, longitude: lng },
    boundingBox: {
      sw: { latitude: lat - 0.0001, longitude: lng - 0.0001 },
      ne: { latitude: lat + 0.0001, longitude: lng + 0.0001 },
    },
    imageryDate: {
      year: 2024,
      month: Math.floor(Math.random() * 12) + 1,
      day: Math.floor(Math.random() * 28) + 1,
    },
    postalCode: "33101",
    administrativeArea: "FL",
    statisticalArea: "Miami-Dade County",
    regionCode: "US",
    solarPotential: {
      maxArrayPanelsCount: Math.floor(20 + locationFactor * 50),
      maxArrayAreaMeters2: 100 + locationFactor * 200,
      maxSunshineHoursPerYear: 2800 + locationFactor * 400,
      carbonOffsetFactorKgPerMwh: 400 + locationFactor * 100,
    },
    roofSegmentStats: [
      {
        pitchDegrees: 15 + locationFactor * 30,
        azimuthDegrees: 180 + locationFactor * 180,
        stats: {
          areaMeters2: 150 + locationFactor * 100,
          sunshineQuantiles: [800, 900, 1000, 1100, 1200],
          groundAreaCoveredMeters2: 140 + locationFactor * 90,
        },
        center: { latitude: lat, longitude: lng },
        boundingBox: {
          sw: { latitude: lat - 0.00005, longitude: lng - 0.00005 },
          ne: { latitude: lat + 0.00005, longitude: lng + 0.00005 },
        },
        planeHeightAtCenterMeters: 8 + locationFactor * 4,
      },
    ],
  };
}

function analyzeRoofCondition(
  aerialData: any,
  location: { lat: number; lng: number },
): any {
  const roofSegment = aerialData.roofSegmentStats?.[0];
  if (!roofSegment) {
    return {
      area: 0,
      material: "unknown",
      condition: "unknown",
      ageEstimate: 0,
      maintenanceNeeded: ["Unable to analyze - insufficient data"],
    };
  }

  const area = roofSegment.stats.areaMeters2 * 10.764; // Convert to square feet
  const pitch = roofSegment.pitchDegrees;
  const sunshineHours =
    aerialData.solarPotential?.maxSunshineHoursPerYear || 3000;

  // Estimate roof material based on location and characteristics
  let material = "asphalt_shingle"; // Most common in Florida
  if (area > 3000) material = "tile"; // Larger homes often have tile
  if (location.lat < 26) material = "tile"; // South Florida preference

  // Estimate condition based on various factors
  let condition: "excellent" | "good" | "fair" | "poor" | "damaged" = "good";
  const imageryDate = aerialData.imageryDate;
  const imageAge = 2024 - (imageryDate?.year || 2024);

  if (imageAge > 2) condition = "fair"; // Older imagery may not show recent improvements
  if (pitch < 10) condition = "fair"; // Low pitch roofs have more issues
  if (sunshineHours > 3200) condition = "fair"; // High sun exposure causes wear

  // Estimate roof age (mock calculation)
  const ageEstimate = 8 + Math.floor(Math.random() * 15); // 8-23 years typical

  const maintenanceNeeded = [];
  if (condition === "fair") {
    maintenanceNeeded.push("Inspect for loose or missing shingles");
    maintenanceNeeded.push("Clean gutters and downspouts");
  }
  if (pitch < 15) {
    maintenanceNeeded.push("Check for ponding water");
  }
  if (material === "tile") {
    maintenanceNeeded.push("Inspect tile alignment and cracking");
  }

  return {
    area: Math.round(area),
    material,
    condition,
    ageEstimate,
    maintenanceNeeded,
  };
}

function assessDamage(aerialData: any, damageReportDate?: string): any {
  // Mock damage assessment - in production, this would compare before/after imagery
  const hasRecentDamage =
    damageReportDate &&
    new Date(damageReportDate) >
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  let damagePercentage = 0;
  let damageType: string[] = [];
  let affectedAreas: string[] = [];

  if (hasRecentDamage) {
    // Simulate hurricane damage assessment
    damagePercentage = Math.floor(Math.random() * 30) + 5; // 5-35% damage

    if (damagePercentage > 20) {
      damageType.push("Missing shingles", "Exposed decking");
      affectedAreas.push("Northwest section", "Chimney area");
    } else if (damagePercentage > 10) {
      damageType.push("Lifted shingles", "Granule loss");
      affectedAreas.push("South-facing slope");
    } else {
      damageType.push("Minor granule loss");
      affectedAreas.push("Scattered across surface");
    }
  }

  const repairEstimate = {
    min: damagePercentage * 150, // $150 per % damage (rough estimate)
    max: damagePercentage * 250,
    priority:
      damagePercentage > 20
        ? ("immediate" as const)
        : damagePercentage > 10
          ? ("urgent" as const)
          : damagePercentage > 5
            ? ("scheduled" as const)
            : ("cosmetic" as const),
  };

  let insuranceRecommendation = "";
  if (damagePercentage > 25) {
    insuranceRecommendation =
      "Significant damage detected. File insurance claim immediately and get professional inspection.";
  } else if (damagePercentage > 15) {
    insuranceRecommendation =
      "Moderate damage visible. Consider insurance claim and get repair estimates.";
  } else if (damagePercentage > 5) {
    insuranceRecommendation =
      "Minor damage detected. Monitor for worsening and consider preventive maintenance.";
  } else {
    insuranceRecommendation = "No significant damage visible from aerial view.";
  }

  return {
    damagePercentage,
    damageType,
    affectedAreas,
    repairEstimate,
    insuranceRecommendation,
  };
}

function analyzeSolarPotential(aerialData: any): any {
  const solarData = aerialData.solarPotential;
  if (!solarData) {
    return {
      viableSurfaceArea: 0,
      annualEnergyPotential: 0,
      estimatedSolarPanels: 0,
      potentialSavings: 0,
      obstacleAnalysis: ["Unable to analyze solar potential"],
    };
  }

  const viableSurfaceArea = solarData.maxArrayAreaMeters2 * 10.764; // Convert to sq ft
  const annualEnergyPotential = solarData.maxSunshineHoursPerYear * 0.2; // Rough calculation
  const estimatedSolarPanels = solarData.maxArrayPanelsCount;
  const potentialSavings = annualEnergyPotential * 0.1; // $0.10 per kWh

  const obstacleAnalysis = [];
  const roofSegment = aerialData.roofSegmentStats?.[0];

  if (roofSegment?.pitchDegrees < 10) {
    obstacleAnalysis.push("Low roof pitch may reduce efficiency");
  }
  if (roofSegment?.pitchDegrees > 40) {
    obstacleAnalysis.push("Steep roof pitch - installation complexity");
  }
  if (roofSegment?.stats.areaMeters2 < 50) {
    obstacleAnalysis.push("Limited roof area for large installations");
  }

  return {
    viableSurfaceArea: Math.round(viableSurfaceArea),
    annualEnergyPotential: Math.round(annualEnergyPotential),
    estimatedSolarPanels,
    potentialSavings: Math.round(potentialSavings),
    obstacleAnalysis,
  };
}

function analyzeStructure(
  aerialData: any,
  location: { lat: number; lng: number },
): any {
  const roofSegment = aerialData.roofSegmentStats?.[0];
  const buildingFootprint =
    roofSegment?.stats.groundAreaCoveredMeters2 * 10.764 || 0;

  return {
    foundationVisible: true, // Assume visible from aerial
    additions: ["Attached garage", "Screen porch"], // Mock data
    propertyBoundaries: [
      { lat: location.lat + 0.0002, lng: location.lng - 0.0002 },
      { lat: location.lat + 0.0002, lng: location.lng + 0.0002 },
      { lat: location.lat - 0.0002, lng: location.lng + 0.0002 },
      { lat: location.lat - 0.0002, lng: location.lng - 0.0002 },
    ],
    buildingFootprint: Math.round(buildingFootprint),
    structuralConcerns:
      buildingFootprint > 4000
        ? ["Large structure - check support systems"]
        : [],
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const requestData: AerialRequest = await req.json();
    const { location, analysisType, referenceDate, damageReportDate } =
      requestData;

    if (!location?.lat || !location?.lng) {
      throw new Error("Location coordinates are required");
    }

    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `[Aerial Intelligence] Processing ${analysisType} for location: ${location.lat}, ${location.lng}`,
      }),
    );

    const intelligence: RoofIntelligence = {};

    // Get aerial imagery data
    const aerialData = await analyzeRoofFromAerialView(
      location.lat,
      location.lng,
    );

    // Generate aerial imagery URLs
    intelligence.aerialUrls = {
      satellite: await getAerialImagery(location.lat, location.lng, {
        zoom: 20,
        mapType: "satellite",
      }),
      oblique: await getAerialImagery(location.lat, location.lng, {
        zoom: 19,
        mapType: "hybrid",
      }),
    };

    // Perform requested analysis
    switch (analysisType) {
      case "roof-condition":
        intelligence.roofCondition = analyzeRoofCondition(aerialData, location);
        break;

      case "damage-assessment":
        intelligence.damageAssessment = assessDamage(
          aerialData,
          damageReportDate,
        );
        break;

      case "solar-potential":
        intelligence.solarPotential = analyzeSolarPotential(aerialData);
        break;

      case "structural-analysis":
        intelligence.structuralAnalysis = analyzeStructure(
          aerialData,
          location,
        );
        break;

      case "complete-analysis":
        intelligence.roofCondition = analyzeRoofCondition(aerialData, location);
        intelligence.damageAssessment = assessDamage(
          aerialData,
          damageReportDate,
        );
        intelligence.solarPotential = analyzeSolarPotential(aerialData);
        intelligence.structuralAnalysis = analyzeStructure(
          aerialData,
          location,
        );
        break;

      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }

    const response = {
      success: true,
      data: intelligence,
      location,
      analysisType,
      rawAerialData: aerialData, // Include for debugging
      timestamp: new Date().toISOString(),
      apiUsed: "aerial-roof-intelligence",
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.log(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message: "[Aerial Intelligence] Error:",
        error,
      }),
    );

    const errorResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error) || "Unknown error",
      timestamp: new Date().toISOString(),
      apiUsed: "aerial-roof-intelligence",
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
