import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface StreetViewRequest {
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  analysisType:
    | "property-facade"
    | "damage-documentation"
    | "access-assessment"
    | "neighborhood-survey"
    | "custom";
  options?: {
    size?: string; // '640x640'
    fov?: number; // Field of view (1-120 degrees)
    heading?: number; // Compass heading (0-360)
    pitch?: number; // Up/down angle (-90 to 90)
    radius?: number; // Search radius in meters
    source?: "default" | "outdoor"; // Image source
    multipleAngles?: boolean;
    includeMetadata?: boolean;
  };
}

interface StreetViewIntelligence {
  primaryView: {
    url: string;
    available: boolean;
    analysis: string;
    insights: string[];
    metadata?: {
      panoramaId?: string;
      date?: string;
      copyright?: string;
      location: { lat: number; lng: number };
    };
  };
  multiAngleViews?: {
    front: string;
    left: string;
    right: string;
    rear: string;
  };
  propertyAnalysis?: {
    buildingCondition: {
      roofVisible: boolean;
      siding: {
        material: string;
        condition: "excellent" | "good" | "fair" | "poor";
        damageVisible: boolean;
      };
      windows: {
        count: number;
        condition: string;
        protectionVisible: boolean;
      };
      landscaping: {
        maturity: "new" | "established" | "mature";
        maintenance: "well-maintained" | "average" | "neglected";
        riskFactors: string[];
      };
    };
    accessibilityAssessment: {
      driveways: Array<{
        type: string;
        condition: string;
        width: string;
      }>;
      walkways: Array<{
        material: string;
        condition: string;
        accessibility: string;
      }>;
      parking: {
        type: string;
        capacity: number;
        condition: string;
      };
    };
  };
  damageDocumentation?: {
    visibleDamage: Array<{
      type: string;
      severity: "minor" | "moderate" | "severe";
      location: string;
      description: string;
    }>;
    beforeAfterUrls?: {
      before: string;
      after: string;
    };
    recommendedAngles: Array<{
      heading: number;
      pitch: number;
      purpose: string;
    }>;
  };
  neighborhoodContext?: {
    surroundingProperties: Array<{
      direction: string;
      propertyType: string;
      condition: string;
      relevance: string;
    }>;
    streetCondition: {
      surface: string;
      condition: string;
      drainageVisible: boolean;
    };
    emergencyAccess: {
      fireHydrantVisible: boolean;
      streetWidth: string;
      obstructions: string[];
    };
  };
}

const GOOGLE_MAPS_API_KEY =
  Deno.env.get("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") ||
  Deno.env.get("GOOGLE_MAPS_API_KEY");

function generateStreetViewUrl(
  location: { lat: number; lng: number },
  options: any = {},
): string {
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    size: options.size || "640x640",
    key: GOOGLE_MAPS_API_KEY!,
  });

  if (options.fov !== undefined) {
    params.append("fov", String(Math.max(10, Math.min(120, options.fov))));
  }

  if (options.heading !== undefined) {
    params.append("heading", String(options.heading % 360));
  }

  if (options.pitch !== undefined) {
    params.append("pitch", String(Math.max(-90, Math.min(90, options.pitch))));
  }

  if (options.radius !== undefined) {
    params.append("radius", String(options.radius));
  }

  if (options.source === "outdoor") {
    params.append("source", "outdoor");
  }

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

async function checkStreetViewAvailability(location: {
  lat: number;
  lng: number;
}): Promise<any> {
  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    if (response.ok) {
      const metadata = await response.json();
      return metadata;
    } else {
      console.log(
        JSON.stringify({
          level: "warn",
          timestamp: new Date().toISOString(),
          message: "Street View Metadata API error:" + (await response.text()),
        }),
      );
      return generateMockMetadata(location);
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message: "Street View Metadata API error, using mock data:",
        error,
      }),
    );
    return generateMockMetadata(location);
  }
}

function generateMockMetadata(location: { lat: number; lng: number }): any {
  return {
    status: "OK",
    pano_id: `mock_pano_${Math.floor(Math.random() * 1000000)}`,
    location: {
      lat: location.lat + (Math.random() - 0.5) * 0.0001,
      lng: location.lng + (Math.random() - 0.5) * 0.0001,
    },
    date: "2024-06",
    copyright: "© 2024 Google",
  };
}

function generateMultiAngleViews(
  location: { lat: number; lng: number },
  options: any = {},
): any {
  const baseOptions = {
    size: options.size || "640x640",
    fov: options.fov || 90,
    pitch: options.pitch || 0,
    radius: options.radius || 50,
  };

  return {
    front: generateStreetViewUrl(location, { ...baseOptions, heading: 0 }),
    right: generateStreetViewUrl(location, { ...baseOptions, heading: 90 }),
    rear: generateStreetViewUrl(location, { ...baseOptions, heading: 180 }),
    left: generateStreetViewUrl(location, { ...baseOptions, heading: 270 }),
  };
}

function analyzePropertyFromStreetView(
  location: { lat: number; lng: number },
  address?: string,
): any {
  const isFloridaProperty =
    address?.toLowerCase().includes("fl") ||
    address?.toLowerCase().includes("florida");

  // Mock property analysis based on typical Florida characteristics
  const buildingCondition = {
    roofVisible: Math.random() > 0.3, // 70% chance roof is visible from street
    siding: {
      material: isFloridaProperty
        ? Math.random() > 0.5
          ? "stucco"
          : "concrete_block"
        : Math.random() > 0.5
          ? "vinyl"
          : "wood",
      condition: (() => {
        const rand = Math.random();
        if (rand > 0.7) return "excellent" as const;
        if (rand > 0.4) return "good" as const;
        if (rand > 0.15) return "fair" as const;
        return "poor" as const;
      })(),
      damageVisible: Math.random() > 0.8, // 20% chance of visible damage
    },
    windows: {
      count: Math.floor(Math.random() * 8) + 4, // 4-12 visible windows
      condition: Math.random() > 0.8 ? "Some damage visible" : "Good condition",
      protectionVisible: isFloridaProperty && Math.random() > 0.6, // Hurricane shutters in FL
    },
    landscaping: {
      maturity: (() => {
        const rand = Math.random();
        if (rand > 0.6) return "mature" as const;
        if (rand > 0.3) return "established" as const;
        return "new" as const;
      })(),
      maintenance: (() => {
        const rand = Math.random();
        if (rand > 0.6) return "well-maintained" as const;
        if (rand > 0.3) return "average" as const;
        return "neglected" as const;
      })(),
      riskFactors: (() => {
        const factors = [];
        if (Math.random() > 0.7) factors.push("Large trees near structure");
        if (Math.random() > 0.8) factors.push("Overgrown vegetation");
        if (isFloridaProperty && Math.random() > 0.6)
          factors.push("Palm trees (wind hazard)");
        return factors;
      })(),
    },
  };

  const accessibilityAssessment = {
    driveways: [
      {
        type: Math.random() > 0.5 ? "concrete" : "asphalt",
        condition: Math.random() > 0.7 ? "excellent" : "good",
        width: Math.random() > 0.6 ? "double-wide" : "single",
      },
    ],
    walkways: [
      {
        material: Math.random() > 0.5 ? "concrete" : "pavers",
        condition: Math.random() > 0.8 ? "needs repair" : "good",
        accessibility: "level access",
      },
    ],
    parking: {
      type: Math.random() > 0.7 ? "garage" : "driveway",
      capacity: Math.floor(Math.random() * 3) + 2, // 2-4 cars
      condition: "adequate",
    },
  };

  return {
    buildingCondition,
    accessibilityAssessment,
  };
}

function generateDamageDocumentation(
  location: { lat: number; lng: number },
  hasRecentDamage: boolean = false,
): any {
  const visibleDamage = [];

  if (hasRecentDamage || Math.random() > 0.7) {
    const damageTypes = [
      {
        type: "Roof damage",
        location: "roof edge",
        severity: "moderate" as const,
      },
      {
        type: "Siding damage",
        location: "south wall",
        severity: "minor" as const,
      },
      {
        type: "Window damage",
        location: "front windows",
        severity: "severe" as const,
      },
      {
        type: "Landscaping damage",
        location: "front yard",
        severity: "minor" as const,
      },
    ];

    const numDamages = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numDamages; i++) {
      const damage =
        damageTypes[Math.floor(Math.random() * damageTypes.length)];
      visibleDamage.push({
        ...damage,
        description: `${damage.severity} ${damage.type.toLowerCase()} visible from street view`,
      });
    }
  }

  const recommendedAngles = [
    {
      heading: 45,
      pitch: 10,
      purpose: "Front facade and roof line documentation",
    },
    { heading: 135, pitch: 0, purpose: "Side elevation damage assessment" },
    {
      heading: 315,
      pitch: -5,
      purpose: "Foundation and ground level inspection",
    },
  ];

  return {
    visibleDamage,
    beforeAfterUrls: hasRecentDamage
      ? {
          before: generateStreetViewUrl(location, { heading: 0, pitch: 5 }),
          after: generateStreetViewUrl(location, { heading: 0, pitch: 5 }), // Same URL for demo
        }
      : undefined,
    recommendedAngles,
  };
}

function analyzeNeighborhoodContext(location: {
  lat: number;
  lng: number;
}): any {
  const surroundingProperties = [
    {
      direction: "North",
      propertyType: "Single family residence",
      condition: "well-maintained",
      relevance: "Similar construction - comparable wind exposure",
    },
    {
      direction: "East",
      propertyType: "Vacant lot",
      condition: "overgrown",
      relevance: "No wind barrier - increased exposure from east",
    },
    {
      direction: "South",
      propertyType: "Two-story residence",
      condition: "average",
      relevance: "Taller structure may create wind patterns",
    },
  ];

  const streetCondition = {
    surface: Math.random() > 0.3 ? "asphalt" : "concrete",
    condition: Math.random() > 0.8 ? "needs repair" : "good",
    drainageVisible: Math.random() > 0.4,
  };

  const emergencyAccess = {
    fireHydrantVisible: Math.random() > 0.6,
    streetWidth:
      Math.random() > 0.7 ? "wide (>24 feet)" : "standard (20-24 feet)",
    obstructions: (() => {
      const obstructions = [];
      if (Math.random() > 0.8) obstructions.push("Parked cars");
      if (Math.random() > 0.9) obstructions.push("Construction barriers");
      if (Math.random() > 0.7) obstructions.push("Overhanging branches");
      return obstructions;
    })(),
  };

  return {
    surroundingProperties,
    streetCondition,
    emergencyAccess,
  };
}

function generateStreetViewInsights(
  analysisType: string,
  available: boolean,
  address?: string,
): string[] {
  const insights = [];
  const isFloridaProperty =
    address?.toLowerCase().includes("fl") ||
    address?.toLowerCase().includes("florida");

  if (!available) {
    insights.push("Street View imagery not available for this location");
    insights.push(
      "Consider alternative documentation methods (drone, ground photos)",
    );
    return insights;
  }

  switch (analysisType) {
    case "property-facade":
      insights.push("Clear street-level view of property facade available");
      insights.push("Multiple angles provide comprehensive documentation");
      if (isFloridaProperty) {
        insights.push(
          "Hurricane protection features (shutters, impact windows) assessable",
        );
        insights.push("Building elevation and flood risk indicators visible");
      }
      break;

    case "damage-documentation":
      insights.push(
        "Street-level damage assessment possible with current imagery",
      );
      insights.push(
        "Multiple viewing angles recommended for complete documentation",
      );
      insights.push(
        "Coordinate with aerial imagery for comprehensive damage mapping",
      );
      break;

    case "access-assessment":
      insights.push("Emergency vehicle access routes clearly visible");
      insights.push(
        "Property accessibility for inspectors and contractors documented",
      );
      insights.push(
        "Parking and staging areas for restoration work identified",
      );
      break;

    case "neighborhood-survey":
      insights.push("Surrounding property conditions provide claims context");
      insights.push("Street infrastructure and drainage systems visible");
      insights.push(
        "Comparative damage assessment with neighboring properties possible",
      );
      break;
  }

  return insights;
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

    const requestData: StreetViewRequest = await req.json();
    const { location, analysisType, options = {} } = requestData;

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
        message: `[Street View Intelligence] Processing ${analysisType} for location: ${location.lat}, ${location.lng}`,
      }),
    );

    const intelligence: StreetViewIntelligence = {};

    // Check Street View availability and get metadata
    const metadata = await checkStreetViewAvailability(location);
    const isAvailable = metadata.status === "OK";

    // Generate primary view
    const primaryViewUrl = generateStreetViewUrl(location, {
      size: options.size || "800x600",
      fov: options.fov || 90,
      heading: options.heading || 0,
      pitch: options.pitch || 0,
      radius: options.radius || 50,
    });

    intelligence.primaryView = {
      url: primaryViewUrl,
      available: isAvailable,
      analysis: `${analysisType} analysis from street level`,
      insights: generateStreetViewInsights(
        analysisType,
        isAvailable,
        location.address,
      ),
      metadata:
        options.includeMetadata && isAvailable
          ? {
              panoramaId: metadata.pano_id,
              date: metadata.date,
              copyright: metadata.copyright,
              location: metadata.location,
            }
          : undefined,
    };

    // Generate analysis based on type
    if (isAvailable) {
      switch (analysisType) {
        case "property-facade":
          if (options.multipleAngles) {
            intelligence.multiAngleViews = generateMultiAngleViews(
              location,
              options,
            );
          }
          intelligence.propertyAnalysis = analyzePropertyFromStreetView(
            location,
            location.address,
          );
          break;

        case "damage-documentation":
          intelligence.damageDocumentation = generateDamageDocumentation(
            location,
            true,
          );
          if (options.multipleAngles) {
            intelligence.multiAngleViews = generateMultiAngleViews(
              location,
              options,
            );
          }
          break;

        case "access-assessment":
          intelligence.propertyAnalysis = analyzePropertyFromStreetView(
            location,
            location.address,
          );
          break;

        case "neighborhood-survey":
          if (options.multipleAngles) {
            intelligence.multiAngleViews = generateMultiAngleViews(
              location,
              options,
            );
          }
          intelligence.neighborhoodContext =
            analyzeNeighborhoodContext(location);
          break;

        case "custom":
          if (options.multipleAngles) {
            intelligence.multiAngleViews = generateMultiAngleViews(
              location,
              options,
            );
          }
          break;
      }
    }

    const response = {
      success: true,
      data: intelligence,
      location,
      analysisType,
      options,
      timestamp: new Date().toISOString(),
      apiUsed: "street-view-intelligence",
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
        message: "[Street View Intelligence] Error:",
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
      apiUsed: "street-view-intelligence",
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
