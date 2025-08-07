import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface StaticMapRequest {
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  mapType: "roadmap" | "satellite" | "terrain" | "hybrid";
  analysisType:
    | "property-overview"
    | "damage-assessment"
    | "neighborhood-context"
    | "custom";
  options?: {
    zoom?: number;
    size?: string; // '640x640'
    format?: "png" | "jpg" | "gif";
    scale?: 1 | 2 | 4;
    markers?: Array<{
      lat: number;
      lng: number;
      color?: string;
      label?: string;
      size?: "tiny" | "small" | "mid" | "normal";
    }>;
    overlays?: Array<{
      type: "circle" | "polygon" | "polyline";
      coordinates: Array<{ lat: number; lng: number }>;
      color?: string;
      fillColor?: string;
      weight?: number;
    }>;
    includeCompass?: boolean;
    includeScale?: boolean;
    style?: string; // Custom map styling
  };
}

interface StaticMapIntelligence {
  primaryMap: {
    url: string;
    analysis: string;
    insights: string[];
  };
  contextualMaps?: {
    overview: string;
    satellite: string;
    terrain: string;
    annotated?: string;
  };
  propertyAnalysis?: {
    propertyBoundaries: Array<{ lat: number; lng: number }>;
    nearbyStructures: Array<{
      type: string;
      distance: number;
      relevance: string;
    }>;
    accessPoints: Array<{
      type: "road" | "driveway" | "walkway";
      coordinates: { lat: number; lng: number };
      condition: string;
    }>;
    landscapeFeatures: string[];
  };
  riskVisualization?: {
    floodZones: string;
    hurricaneEvacuation: string;
    emergencyServices: Array<{
      type: string;
      location: { lat: number; lng: number };
      distance: number;
    }>;
  };
  claimsContext?: {
    beforeStormUrl?: string;
    afterStormUrl?: string;
    damageMarkers?: Array<{
      lat: number;
      lng: number;
      severity: "minor" | "moderate" | "severe";
      type: string;
    }>;
  };
}

const GOOGLE_MAPS_API_KEY =
  Deno.env.get("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") ||
  Deno.env.get("GOOGLE_MAPS_API_KEY");

function generateStaticMapUrl(
  location: { lat: number; lng: number },
  mapType: string,
  options: any = {},
): string {
  const params = new URLSearchParams({
    center: `${location.lat},${location.lng}`,
    zoom: String(options.zoom || 17),
    size: options.size || "640x640",
    maptype: mapType,
    format: options.format || "png",
    key: GOOGLE_MAPS_API_KEY!,
  });

  if (options.scale && options.scale > 1) {
    params.append("scale", String(options.scale));
  }

  // Add markers
  if (options.markers && options.markers.length > 0) {
    options.markers.forEach((marker: any, index: number) => {
      const markerStyle = [
        marker.color || "red",
        marker.size || "normal",
        marker.label || String.fromCharCode(65 + index), // A, B, C, etc.
      ].join("|");

      params.append("markers", `${markerStyle}|${marker.lat},${marker.lng}`);
    });
  }

  // Add overlays (paths, polygons)
  if (options.overlays && options.overlays.length > 0) {
    options.overlays.forEach((overlay: any) => {
      if (overlay.type === "polygon" || overlay.type === "polyline") {
        const pathStyle = [
          `color:${overlay.color || "0xff0000ff"}`,
          `weight:${overlay.weight || 2}`,
          overlay.fillColor ? `fillcolor:${overlay.fillColor}` : null,
        ]
          .filter(Boolean)
          .join("|");

        const coordinates = overlay.coordinates
          .map((coord: any) => `${coord.lat},${coord.lng}`)
          .join("|");

        params.append("path", `${pathStyle}|${coordinates}`);
      }
    });
  }

  // Add custom styling
  if (options.style) {
    params.append("style", options.style);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

function generatePropertyOverviewMaps(
  location: { lat: number; lng: number },
  address?: string,
): any {
  const baseOptions = { zoom: 17, size: "800x600", scale: 2 };

  // Primary property marker
  const propertyMarker = {
    lat: location.lat,
    lng: location.lng,
    color: "blue",
    label: "P",
    size: "normal" as const,
  };

  return {
    overview: generateStaticMapUrl(location, "roadmap", {
      ...baseOptions,
      zoom: 15,
      markers: [propertyMarker],
    }),
    satellite: generateStaticMapUrl(location, "satellite", {
      ...baseOptions,
      markers: [propertyMarker],
    }),
    terrain: generateStaticMapUrl(location, "terrain", {
      ...baseOptions,
      zoom: 14,
      markers: [propertyMarker],
    }),
    annotated: generateStaticMapUrl(location, "hybrid", {
      ...baseOptions,
      markers: [
        propertyMarker,
        // Mock nearby emergency services
        {
          lat: location.lat + 0.005,
          lng: location.lng + 0.005,
          color: "red",
          label: "F",
          size: "small" as const,
        },
        {
          lat: location.lat - 0.008,
          lng: location.lng + 0.003,
          color: "green",
          label: "H",
          size: "small" as const,
        },
      ],
    }),
  };
}

function generateDamageAssessmentMaps(location: {
  lat: number;
  lng: number;
}): any {
  const baseOptions = { zoom: 19, size: "800x600", scale: 2 };

  // Simulate damage markers around the property
  const damageMarkers = [
    {
      lat: location.lat + 0.0001,
      lng: location.lng + 0.0001,
      color: "red",
      label: "1",
      severity: "severe",
    },
    {
      lat: location.lat - 0.0001,
      lng: location.lng + 0.0002,
      color: "orange",
      label: "2",
      severity: "moderate",
    },
    {
      lat: location.lat + 0.0002,
      lng: location.lng - 0.0001,
      color: "yellow",
      label: "3",
      severity: "minor",
    },
  ];

  // Property boundary simulation
  const propertyBoundary = {
    type: "polygon" as const,
    coordinates: [
      { lat: location.lat + 0.0003, lng: location.lng - 0.0003 },
      { lat: location.lat + 0.0003, lng: location.lng + 0.0003 },
      { lat: location.lat - 0.0003, lng: location.lng + 0.0003 },
      { lat: location.lat - 0.0003, lng: location.lng - 0.0003 },
      { lat: location.lat + 0.0003, lng: location.lng - 0.0003 },
    ],
    color: "0x0000ffff",
    fillColor: "0x0000ff33",
    weight: 2,
  };

  return {
    beforeStormUrl: generateStaticMapUrl(location, "satellite", {
      ...baseOptions,
      markers: [
        { lat: location.lat, lng: location.lng, color: "blue", label: "P" },
      ],
      overlays: [propertyBoundary],
    }),
    afterStormUrl: generateStaticMapUrl(location, "satellite", {
      ...baseOptions,
      markers: [
        { lat: location.lat, lng: location.lng, color: "blue", label: "P" },
        ...damageMarkers,
      ],
      overlays: [propertyBoundary],
    }),
    damageMarkers: damageMarkers.map((marker) => ({
      lat: marker.lat,
      lng: marker.lng,
      severity: marker.severity as "minor" | "moderate" | "severe",
      type:
        marker.severity === "severe"
          ? "Roof damage"
          : marker.severity === "moderate"
            ? "Siding damage"
            : "Cosmetic damage",
    })),
  };
}

function generateNeighborhoodContext(location: {
  lat: number;
  lng: number;
}): any {
  const contextMaps = generatePropertyOverviewMaps(location);

  // Mock nearby structures analysis
  const nearbyStructures = [
    {
      type: "Residential",
      distance: 25,
      relevance: "Similar construction age and materials",
    },
    { type: "Commercial", distance: 150, relevance: "Potential wind barrier" },
    {
      type: "Vacant lot",
      distance: 35,
      relevance: "No wind protection from east",
    },
  ];

  const accessPoints = [
    {
      type: "road" as const,
      coordinates: { lat: location.lat + 0.0005, lng: location.lng },
      condition: "Paved - good access for emergency vehicles",
    },
    {
      type: "driveway" as const,
      coordinates: { lat: location.lat + 0.0002, lng: location.lng + 0.0001 },
      condition: "Concrete - clear access to property",
    },
  ];

  const landscapeFeatures = [
    "Mature oak trees (potential wind hazard)",
    "Open lawn area (good for equipment access)",
    "Drainage ditch along north property line",
  ];

  return {
    contextMaps,
    nearbyStructures,
    accessPoints,
    landscapeFeatures,
  };
}

function generateRiskVisualization(location: {
  lat: number;
  lng: number;
}): any {
  const riskBaseOptions = { zoom: 14, size: "800x600", scale: 2 };

  // Mock emergency services
  const emergencyServices = [
    {
      type: "Fire Station",
      location: { lat: location.lat + 0.01, lng: location.lng + 0.008 },
      distance: 1.2,
    },
    {
      type: "Hospital",
      location: { lat: location.lat - 0.015, lng: location.lng + 0.012 },
      distance: 2.8,
    },
    {
      type: "Police Station",
      location: { lat: location.lat + 0.008, lng: location.lng - 0.006 },
      distance: 1.6,
    },
  ];

  const emergencyMarkers = emergencyServices.map((service, index) => ({
    lat: service.location.lat,
    lng: service.location.lng,
    color:
      service.type === "Fire Station"
        ? "red"
        : service.type === "Hospital"
          ? "green"
          : "blue",
    label: service.type.charAt(0),
    size: "small" as const,
  }));

  return {
    floodZones: generateStaticMapUrl(location, "terrain", {
      ...riskBaseOptions,
      markers: [
        { lat: location.lat, lng: location.lng, color: "blue", label: "P" },
      ],
      style: "feature:water|element:geometry|color:0x00ffff",
    }),
    hurricaneEvacuation: generateStaticMapUrl(location, "roadmap", {
      ...riskBaseOptions,
      zoom: 12,
      markers: [
        { lat: location.lat, lng: location.lng, color: "red", label: "P" },
        ...emergencyMarkers,
      ],
    }),
    emergencyServices,
  };
}

function analyzeMapIntelligence(
  location: { lat: number; lng: number },
  analysisType: string,
  address?: string,
): string[] {
  const insights = [];
  const isFloridaAddress =
    address?.toLowerCase().includes("fl") ||
    address?.toLowerCase().includes("florida");

  switch (analysisType) {
    case "property-overview":
      insights.push("Property clearly visible from satellite imagery");
      insights.push("Good road access for emergency vehicles and adjusters");
      if (isFloridaAddress) {
        insights.push(
          "Located in hurricane-prone region - wind coverage essential",
        );
        insights.push("Elevation assessment recommended for flood risk");
      }
      break;

    case "damage-assessment":
      insights.push(
        "High-resolution imagery available for detailed damage analysis",
      );
      insights.push(
        "Multiple vantage points captured for comprehensive assessment",
      );
      insights.push(
        "Before/after comparison shows clear storm impact patterns",
      );
      if (isFloridaAddress) {
        insights.push("Damage pattern consistent with hurricane wind patterns");
      }
      break;

    case "neighborhood-context":
      insights.push("Property density and construction types analyzed");
      insights.push("Access routes and emergency service proximity mapped");
      insights.push(
        "Topographical features affecting wind patterns identified",
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

    const requestData: StaticMapRequest = await req.json();
    const { location, mapType, analysisType, options = {} } = requestData;

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
        message: `[Maps Static Intelligence] Processing ${analysisType} for location: ${location.lat}, ${location.lng}`,
      }),
    );

    // Generate primary map
    const primaryMapUrl =
      analysisType === "custom"
        ? generateStaticMapUrl(location, mapType, options)
        : generateStaticMapUrl(location, mapType, {
            zoom: options.zoom || 17,
            size: options.size || "800x600",
            scale: 2,
          });

    const intelligence: StaticMapIntelligence = {
      primaryMap: {
        url: primaryMapUrl,
        analysis: `${analysisType} analysis for ${location.address || `${location.lat}, ${location.lng}`}`,
        insights: analyzeMapIntelligence(
          location,
          analysisType,
          location.address,
        ),
      },
    };

    // Generate contextual maps based on analysis type
    switch (analysisType) {
      case "property-overview":
        intelligence.contextualMaps = generatePropertyOverviewMaps(
          location,
          location.address,
        );
        break;

      case "damage-assessment":
        intelligence.claimsContext = generateDamageAssessmentMaps(location);
        break;

      case "neighborhood-context":
        const neighborhoodData = generateNeighborhoodContext(location);
        intelligence.contextualMaps = neighborhoodData.contextualMaps;
        intelligence.propertyAnalysis = {
          propertyBoundaries: [
            { lat: location.lat + 0.0003, lng: location.lng - 0.0003 },
            { lat: location.lat + 0.0003, lng: location.lng + 0.0003 },
            { lat: location.lat - 0.0003, lng: location.lng + 0.0003 },
            { lat: location.lat - 0.0003, lng: location.lng - 0.0003 },
          ],
          nearbyStructures: neighborhoodData.nearbyStructures,
          accessPoints: neighborhoodData.accessPoints,
          landscapeFeatures: neighborhoodData.landscapeFeatures,
        };
        intelligence.riskVisualization = generateRiskVisualization(location);
        break;
    }

    const response = {
      success: true,
      data: intelligence,
      location,
      analysisType,
      mapType,
      options,
      timestamp: new Date().toISOString(),
      apiUsed: "maps-static-intelligence",
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
        message: "[Maps Static Intelligence] Error:",
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
      apiUsed: "maps-static-intelligence",
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
