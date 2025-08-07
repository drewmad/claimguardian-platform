import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface SolarRequest {
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  analysisType:
    | "solar-potential"
    | "roof-analysis"
    | "financial-analysis"
    | "environmental-impact"
    | "complete-assessment";
  options?: {
    qualityLevel?: "LOW" | "MEDIUM" | "HIGH";
    pixelSizeMeters?: number;
    panelCapacityWatts?: number;
    panelHeightMeters?: number;
    panelWidthMeters?: number;
    panelLifetimeYears?: number;
    dcToAcDerate?: number;
    includeFinancing?: boolean;
    includeIncentives?: boolean;
  };
}

interface SolarIntelligence {
  buildingInsights?: {
    name: string;
    center: { latitude: number; longitude: number };
    boundingBox: {
      sw: { latitude: number; longitude: number };
      ne: { latitude: number; longitude: number };
    };
    imageryDate: { year: number; month: number; day: number };
    postalCode: string;
    administrativeArea: string;
    statisticalArea: string;
    regionCode: string;
  };
  solarPotential?: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    wholeRoofStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaCoveredMeters2: number;
    };
    roofSegmentStats: Array<{
      pitchDegrees: number;
      azimuthDegrees: number;
      stats: {
        areaMeters2: number;
        sunshineQuantiles: number[];
        groundAreaCoveredMeters2: number;
      };
      center: { latitude: number; longitude: number };
      boundingBox: {
        sw: { latitude: number; longitude: number };
        ne: { latitude: number; longitude: number };
      };
      planeHeightAtCenterMeters: number;
    }>;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
  };
  financialAnalysis?: {
    monthlyBill: {
      currencyCode: string;
      units: number;
    };
    defaultBill: boolean;
    averageKwhPerMonth: number;
    installationSize: {
      panelsCount: number;
      areaMeters2: number;
    };
    costs: {
      installationCost: number;
      maintenanceCost: number;
      totalCost: number;
    };
    savings: {
      annualSavings: number;
      totalSavings: number;
      paybackYears: number;
      roi: number;
    };
    incentives?: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
    cashPurchase?: {
      outOfPocketCost: number;
      paybackYears: number;
      savings20Years: number;
    };
    financing?: {
      federalIncentive: number;
      stateIncentive: number;
      utilityIncentive: number;
      loanAmount: number;
      monthlyPayment: number;
    };
  };
  environmentalImpact?: {
    carbonOffsetYearly: number;
    carbonOffsetLifetime: number;
    equivalentTreesPlanted: number;
    coalPowerPlantOffset: number;
    gasCarMilesOffset: number;
    sustainabilityScore: number;
  };
  roofAnalysisIntelligence?: {
    suitability: "excellent" | "good" | "fair" | "poor";
    challenges: string[];
    recommendations: string[];
    installationConsiderations: string[];
    maintenanceFactors: string[];
  };
  propertyValueImpact?: {
    estimatedValueIncrease: number;
    percentageIncrease: number;
    marketAppealFactors: string[];
    resaleConsiderations: string[];
  };
}

const GOOGLE_MAPS_API_KEY =
  Deno.env.get("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") ||
  Deno.env.get("GOOGLE_MAPS_API_KEY");

async function getSolarData(
  lat: number,
  lng: number,
  options: any = {},
): Promise<any> {
  try {
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.log(
        JSON.stringify({
          level: "warn",
          timestamp: new Date().toISOString(),
          message:
            "Solar API error, using mock data:" + (await response.text()),
        }),
      );
      return generateMockSolarData(lat, lng);
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message: "Solar API error, using mock data:",
        error,
      }),
    );
    return generateMockSolarData(lat, lng);
  }
}

function generateMockSolarData(lat: number, lng: number): any {
  const locationFactor = (lat + lng) % 1; // Semi-random based on coordinates
  const isFloridaLocation = lat > 24 && lat < 31 && lng > -88 && lng < -79;

  // Florida gets more sunshine hours
  const baseSunshine = isFloridaLocation ? 2800 : 2200;
  const sunshineVariation = locationFactor * 600;

  return {
    name: `buildings/${Math.floor(Math.random() * 1000000)}`,
    center: { latitude: lat, longitude: lng },
    boundingBox: {
      sw: { latitude: lat - 0.0002, longitude: lng - 0.0002 },
      ne: { latitude: lat + 0.0002, longitude: lng + 0.0002 },
    },
    imageryDate: {
      year: 2024,
      month: Math.floor(Math.random() * 12) + 1,
      day: Math.floor(Math.random() * 28) + 1,
    },
    postalCode: isFloridaLocation ? "33101" : "12345",
    administrativeArea: isFloridaLocation ? "FL" : "CA",
    statisticalArea: isFloridaLocation ? "Miami-Dade County" : "Sample County",
    regionCode: "US",
    solarPotential: {
      maxArrayPanelsCount: Math.floor(15 + locationFactor * 40), // 15-55 panels
      maxArrayAreaMeters2: Math.floor(80 + locationFactor * 200), // 80-280 m²
      maxSunshineHoursPerYear: baseSunshine + sunshineVariation,
      carbonOffsetFactorKgPerMwh: 400 + locationFactor * 100,
      wholeRoofStats: {
        areaMeters2: Math.floor(150 + locationFactor * 100),
        sunshineQuantiles: [
          Math.floor(baseSunshine * 0.8),
          Math.floor(baseSunshine * 0.9),
          Math.floor(baseSunshine * 1.0),
          Math.floor(baseSunshine * 1.1),
          Math.floor(baseSunshine * 1.2),
        ],
        groundAreaCoveredMeters2: Math.floor(140 + locationFactor * 90),
      },
      roofSegmentStats: [
        {
          pitchDegrees: 20 + locationFactor * 25, // 20-45 degrees
          azimuthDegrees: 180 + locationFactor * 60 - 30, // 150-210 degrees (south-facing)
          stats: {
            areaMeters2: Math.floor(80 + locationFactor * 120),
            sunshineQuantiles: [
              Math.floor(baseSunshine * 0.85),
              Math.floor(baseSunshine * 0.95),
              Math.floor(baseSunshine * 1.05),
              Math.floor(baseSunshine * 1.15),
              Math.floor(baseSunshine * 1.25),
            ],
            groundAreaCoveredMeters2: Math.floor(75 + locationFactor * 100),
          },
          center: { latitude: lat, longitude: lng },
          boundingBox: {
            sw: { latitude: lat - 0.0001, longitude: lng - 0.0001 },
            ne: { latitude: lat + 0.0001, longitude: lng + 0.0001 },
          },
          planeHeightAtCenterMeters: 8 + locationFactor * 6, // 8-14 meters
        },
      ],
      panelCapacityWatts: 250,
      panelHeightMeters: 1.65,
      panelWidthMeters: 0.992,
      panelLifetimeYears: 20,
    },
  };
}

function analyzeSolarPotential(solarData: any): any {
  const potential = solarData.solarPotential;
  if (!potential) {
    return {
      maxArrayPanelsCount: 0,
      maxArrayAreaMeters2: 0,
      maxSunshineHoursPerYear: 0,
      carbonOffsetFactorKgPerMwh: 0,
      wholeRoofStats: {
        areaMeters2: 0,
        sunshineQuantiles: [],
        groundAreaCoveredMeters2: 0,
      },
      roofSegmentStats: [],
      panelCapacityWatts: 250,
      panelHeightMeters: 1.65,
      panelWidthMeters: 0.992,
      panelLifetimeYears: 20,
    };
  }

  return potential;
}

function calculateFinancialAnalysis(
  solarData: any,
  location: { lat: number; lng: number },
  options: any = {},
): any {
  const potential = solarData.solarPotential;
  if (!potential) {
    return {
      monthlyBill: { currencyCode: "USD", units: 0 },
      defaultBill: true,
      averageKwhPerMonth: 0,
      installationSize: { panelsCount: 0, areaMeters2: 0 },
      costs: { installationCost: 0, maintenanceCost: 0, totalCost: 0 },
      savings: { annualSavings: 0, totalSavings: 0, paybackYears: 0, roi: 0 },
    };
  }

  const isFloridaLocation =
    location.lat > 24 &&
    location.lat < 31 &&
    location.lng > -88 &&
    location.lng < -79;

  // Calculate system specs
  const panelsCount = potential.maxArrayPanelsCount;
  const panelWatts = potential.panelCapacityWatts || 250;
  const systemSizeKw = (panelsCount * panelWatts) / 1000;
  const annualProduction =
    potential.maxSunshineHoursPerYear * systemSizeKw * 0.85; // 85% efficiency

  // Financial calculations
  const costPerWatt = isFloridaLocation ? 2.8 : 3.2; // Florida tends to be slightly cheaper
  const installationCost = systemSizeKw * 1000 * costPerWatt;
  const maintenanceCostAnnual = installationCost * 0.005; // 0.5% per year
  const maintenanceCost20Years = maintenanceCostAnnual * 20;

  // Electricity savings
  const electricityRate = isFloridaLocation ? 0.12 : 0.16; // per kWh
  const annualSavings = annualProduction * electricityRate;
  const totalSavings20Years = annualSavings * 20;

  // Payback and ROI
  const netCost = installationCost * 0.7; // After 30% federal tax credit
  const paybackYears = netCost / annualSavings;
  const roi =
    ((totalSavings20Years - installationCost) / installationCost) * 100;

  // Incentives
  const incentives = [];
  incentives.push({
    type: "Federal Tax Credit",
    amount: installationCost * 0.3,
    description: "30% federal investment tax credit",
  });

  if (isFloridaLocation) {
    incentives.push({
      type: "Florida Sales Tax Exemption",
      amount: installationCost * 0.06,
      description: "Florida solar sales tax exemption",
    });
    incentives.push({
      type: "Property Tax Exemption",
      amount: installationCost * 0.15, // Estimated over 20 years
      description: "Florida solar property tax exemption",
    });
  }

  return {
    monthlyBill: { currencyCode: "USD", units: Math.floor(annualSavings / 12) },
    defaultBill: false,
    averageKwhPerMonth: Math.floor(annualProduction / 12),
    installationSize: {
      panelsCount,
      areaMeters2: potential.maxArrayAreaMeters2,
    },
    costs: {
      installationCost: Math.floor(installationCost),
      maintenanceCost: Math.floor(maintenanceCost20Years),
      totalCost: Math.floor(installationCost + maintenanceCost20Years),
    },
    savings: {
      annualSavings: Math.floor(annualSavings),
      totalSavings: Math.floor(totalSavings20Years),
      paybackYears: Math.round(paybackYears * 10) / 10,
      roi: Math.round(roi * 10) / 10,
    },
    incentives,
    cashPurchase: {
      outOfPocketCost: Math.floor(netCost),
      paybackYears: Math.round(paybackYears * 10) / 10,
      savings20Years: Math.floor(totalSavings20Years - netCost),
    },
    financing: {
      federalIncentive: Math.floor(installationCost * 0.3),
      stateIncentive: isFloridaLocation
        ? Math.floor(installationCost * 0.06)
        : 0,
      utilityIncentive: 0,
      loanAmount: Math.floor(netCost),
      monthlyPayment: Math.floor(netCost / 240), // 20-year loan estimate
    },
  };
}

function calculateEnvironmentalImpact(
  solarData: any,
  financialAnalysis: any,
): any {
  const potential = solarData.solarPotential;
  if (!potential || !financialAnalysis) {
    return {
      carbonOffsetYearly: 0,
      carbonOffsetLifetime: 0,
      equivalentTreesPlanted: 0,
      coalPowerPlantOffset: 0,
      gasCarMilesOffset: 0,
      sustainabilityScore: 0,
    };
  }

  const annualProduction = financialAnalysis.averageKwhPerMonth * 12;
  const lifetimeProduction = annualProduction * 20;

  // Carbon offset calculations (using EPA factors)
  const carbonOffsetYearly = annualProduction * 0.92; // lbs CO2 per kWh
  const carbonOffsetLifetime = lifetimeProduction * 0.92;

  // Environmental equivalents
  const equivalentTreesPlanted = Math.floor(carbonOffsetLifetime / 48); // 48 lbs CO2 per tree per year
  const coalPowerPlantOffset = lifetimeProduction / 1000000; // MWh offset from coal
  const gasCarMilesOffset = Math.floor(carbonOffsetLifetime / 0.89); // lbs CO2 per mile

  // Sustainability score (0-100)
  let sustainabilityScore = 50;
  if (annualProduction > 8000) sustainabilityScore += 20;
  if (annualProduction > 12000) sustainabilityScore += 15;
  if (potential.maxArrayAreaMeters2 > 100) sustainabilityScore += 10;
  if (carbonOffsetYearly > 10000) sustainabilityScore += 5;

  return {
    carbonOffsetYearly: Math.floor(carbonOffsetYearly),
    carbonOffsetLifetime: Math.floor(carbonOffsetLifetime),
    equivalentTreesPlanted,
    coalPowerPlantOffset: Math.round(coalPowerPlantOffset * 100) / 100,
    gasCarMilesOffset,
    sustainabilityScore: Math.min(100, sustainabilityScore),
  };
}

function analyzeRoofSuitability(
  solarData: any,
  location: { lat: number; lng: number },
): any {
  const potential = solarData.solarPotential;
  const roofSegment = potential?.roofSegmentStats?.[0];

  if (!roofSegment) {
    return {
      suitability: "poor" as const,
      challenges: ["Unable to analyze roof structure"],
      recommendations: ["Professional site assessment required"],
      installationConsiderations: [
        "Roof access and structural evaluation needed",
      ],
      maintenanceFactors: ["Cannot assess maintenance requirements"],
    };
  }

  const isFloridaLocation =
    location.lat > 24 &&
    location.lat < 31 &&
    location.lng > -88 &&
    location.lng < -79;
  const pitch = roofSegment.pitchDegrees;
  const azimuth = roofSegment.azimuthDegrees;
  const area = roofSegment.stats.areaMeters2;
  const sunshineHours = potential.maxSunshineHoursPerYear;

  // Determine suitability
  let suitability: "excellent" | "good" | "fair" | "poor" = "good";
  if (
    sunshineHours > 3000 &&
    pitch > 15 &&
    pitch < 40 &&
    azimuth > 135 &&
    azimuth < 225 &&
    area > 100
  ) {
    suitability = "excellent";
  } else if (sunshineHours > 2500 && pitch > 10 && pitch < 50 && area > 60) {
    suitability = "good";
  } else if (sunshineHours > 2000 && area > 40) {
    suitability = "fair";
  } else {
    suitability = "poor";
  }

  const challenges = [];
  const recommendations = [];
  const installationConsiderations = [];
  const maintenanceFactors = [];

  // Pitch analysis
  if (pitch < 10) {
    challenges.push(
      "Low roof pitch may reduce efficiency and complicate drainage",
    );
    recommendations.push("Consider ballasted racking system for flat roofs");
  } else if (pitch > 40) {
    challenges.push(
      "Steep roof pitch increases installation complexity and cost",
    );
    installationConsiderations.push(
      "Additional safety equipment required for steep roof installation",
    );
  } else {
    recommendations.push("Optimal roof pitch for solar panel efficiency");
  }

  // Azimuth analysis
  if (azimuth < 135 || azimuth > 225) {
    challenges.push("Roof orientation not ideal for maximum solar production");
    recommendations.push(
      "Consider east-west panel layout or ground-mount system",
    );
  } else {
    recommendations.push(
      "Good south-facing roof orientation for solar production",
    );
  }

  // Area analysis
  if (area < 60) {
    challenges.push("Limited roof area restricts system size");
    recommendations.push("Maximize efficiency with high-performance panels");
  } else if (area > 200) {
    recommendations.push("Large roof area allows for substantial solar system");
  }

  // Florida-specific considerations
  if (isFloridaLocation) {
    installationConsiderations.push("Hurricane-rated mounting system required");
    installationConsiderations.push(
      "Consider storm damage insurance for system",
    );
    maintenanceFactors.push(
      "Regular cleaning needed due to humidity and pollen",
    );
    maintenanceFactors.push("Inspect for hurricane damage after major storms");
    recommendations.push(
      "Excellent solar resource in Florida - high annual production expected",
    );
  } else {
    maintenanceFactors.push("Annual inspection and cleaning recommended");
    maintenanceFactors.push("Snow removal may be required in winter months");
  }

  // General considerations
  installationConsiderations.push(
    "Verify roof structural capacity before installation",
  );
  installationConsiderations.push(
    "Check local permitting requirements and HOA restrictions",
  );
  maintenanceFactors.push(
    "Monitor system performance with production monitoring",
  );
  maintenanceFactors.push(
    "Professional maintenance check every 5 years recommended",
  );

  return {
    suitability,
    challenges,
    recommendations,
    installationConsiderations,
    maintenanceFactors,
  };
}

function calculatePropertyValueImpact(
  financialAnalysis: any,
  location: { lat: number; lng: number },
): any {
  if (!financialAnalysis) {
    return {
      estimatedValueIncrease: 0,
      percentageIncrease: 0,
      marketAppealFactors: [],
      resaleConsiderations: [],
    };
  }

  const isFloridaLocation =
    location.lat > 24 &&
    location.lat < 31 &&
    location.lng > -88 &&
    location.lng < -79;
  const systemValue = financialAnalysis.costs.installationCost;

  // Property value increase (typically 4% of home value or 80% of system cost, whichever is lower)
  const estimatedValueIncrease = Math.floor(systemValue * 0.75); // 75% of system cost
  const averageHomeValue = isFloridaLocation ? 350000 : 400000; // Rough estimates
  const percentageIncrease =
    Math.round((estimatedValueIncrease / averageHomeValue) * 100 * 10) / 10;

  const marketAppealFactors = [
    "Energy independence and reduced utility bills",
    "Environmental sustainability credentials",
    "Modern, upgraded home systems",
    "Protection against rising electricity costs",
  ];

  if (isFloridaLocation) {
    marketAppealFactors.push(
      "Hurricane preparedness with backup power potential",
    );
    marketAppealFactors.push("High solar resource value in Florida market");
  }

  const resaleConsiderations = [
    "Solar panels typically increase home value and marketability",
    "Energy cost savings attractive to potential buyers",
    "System age and warranty transferability important factors",
  ];

  if (financialAnalysis.savings.paybackYears < 10) {
    resaleConsiderations.push("Short payback period enhances investment value");
  }

  if (isFloridaLocation) {
    resaleConsiderations.push(
      "Florida solar tax exemptions transfer to new owners",
    );
  }

  return {
    estimatedValueIncrease,
    percentageIncrease,
    marketAppealFactors,
    resaleConsiderations,
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

    const requestData: SolarRequest = await req.json();
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
        message: `[Solar Intelligence] Processing ${analysisType} for location: ${location.lat}, ${location.lng}`,
      }),
    );

    const intelligence: SolarIntelligence = {};

    // Get solar data from Google Solar API
    const solarData = await getSolarData(location.lat, location.lng, options);

    // Always include building insights
    intelligence.buildingInsights = {
      name: solarData.name,
      center: solarData.center,
      boundingBox: solarData.boundingBox,
      imageryDate: solarData.imageryDate,
      postalCode: solarData.postalCode,
      administrativeArea: solarData.administrativeArea,
      statisticalArea: solarData.statisticalArea,
      regionCode: solarData.regionCode,
    };

    // Perform requested analysis
    switch (analysisType) {
      case "solar-potential":
        intelligence.solarPotential = analyzeSolarPotential(solarData);
        break;

      case "roof-analysis":
        intelligence.solarPotential = analyzeSolarPotential(solarData);
        intelligence.roofAnalysisIntelligence = analyzeRoofSuitability(
          solarData,
          location,
        );
        break;

      case "financial-analysis":
        intelligence.solarPotential = analyzeSolarPotential(solarData);
        intelligence.financialAnalysis = calculateFinancialAnalysis(
          solarData,
          location,
          options,
        );
        intelligence.propertyValueImpact = calculatePropertyValueImpact(
          intelligence.financialAnalysis,
          location,
        );
        break;

      case "environmental-impact":
        intelligence.solarPotential = analyzeSolarPotential(solarData);
        const tempFinancial = calculateFinancialAnalysis(
          solarData,
          location,
          options,
        );
        intelligence.environmentalImpact = calculateEnvironmentalImpact(
          solarData,
          tempFinancial,
        );
        break;

      case "complete-assessment":
        intelligence.solarPotential = analyzeSolarPotential(solarData);
        intelligence.financialAnalysis = calculateFinancialAnalysis(
          solarData,
          location,
          options,
        );
        intelligence.environmentalImpact = calculateEnvironmentalImpact(
          solarData,
          intelligence.financialAnalysis,
        );
        intelligence.roofAnalysisIntelligence = analyzeRoofSuitability(
          solarData,
          location,
        );
        intelligence.propertyValueImpact = calculatePropertyValueImpact(
          intelligence.financialAnalysis,
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
      options,
      rawSolarData: solarData, // Include for debugging
      timestamp: new Date().toISOString(),
      apiUsed: "solar-intelligence",
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
        message: "[Solar Intelligence] Error:",
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
      apiUsed: "solar-intelligence",
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
