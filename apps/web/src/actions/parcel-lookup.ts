/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI-powered parcel lookup and property enrichment using Florida 9.6M dataset"
 * @dependencies ["@supabase/supabase-js", "@claimguardian/utils"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context properties
 * @supabase-integration database
 * @florida-specific true
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger/production-logger";
import { toError } from "@claimguardian/utils";

export interface ParcelSearchParams {
  address?: string;
  county?: string;
  owner?: string;
  parcelId?: string;
  limit?: number;
}

// Raw database interface
interface RawParcelData {
  parcel_id: string;
  own_name: string;
  phy_addr1: string;
  phy_city: string;
  county_fips: string;
  lnd_val: number;
  imp_val: number;
  del_val: number;
  yr_blt: number;
  act_yr_blt: number;
  no_bdrm: number;
  no_bath: number;
  tot_lvg_area: number;
  geometry?: unknown;
}

// Transformed interface for frontend use
export interface ParcelData {
  id: string;
  parcelId: string;
  address: string;
  owner: string;
  county: string;
  landUse: string;
  totalValue: number;
  buildingValue: number;
  landValue: number;
  yearBuilt?: number;
  squareFeet?: number;
  acreage?: number;
  floodZone?: string;
  hurricaneZone?: string;
  riskFactors?: string[];
}

// County FIPS to name mapping
const COUNTY_NAMES: Record<string, string> = {
  "12001": "Alachua",
  "12003": "Baker",
  "12005": "Bay",
  "12007": "Bradford",
  "12009": "Brevard",
  "12011": "Broward",
  "12013": "Calhoun",
  "12015": "Charlotte",
  "12017": "Citrus",
  "12019": "Clay",
  "12021": "Collier",
  "12023": "Columbia",
  "12025": "DeSoto",
  "12027": "Dixie",
  "12029": "Duval",
  "12031": "Escambia",
  "12033": "Flagler",
  "12035": "Franklin",
  "12037": "Gadsden",
  "12039": "Gilchrist",
  "12041": "Glades",
  "12043": "Gulf",
  "12045": "Hamilton",
  "12047": "Hardee",
  "12049": "Hendry",
  "12051": "Hernando",
  "12053": "Highlands",
  "12055": "Hillsborough",
  "12057": "Holmes",
  "12059": "Indian River",
  "12061": "Jackson",
  "12063": "Jefferson",
  "12065": "Lafayette",
  "12067": "Lake",
  "12069": "Lee",
  "12071": "Leon",
  "12073": "Levy",
  "12075": "Liberty",
  "12077": "Madison",
  "12079": "Manatee",
  "12081": "Marion",
  "12083": "Martin",
  "12085": "Miami-Dade",
  "12087": "Monroe",
  "12089": "Nassau",
  "12091": "Okaloosa",
  "12093": "Okeechobee",
  "12095": "Orange",
  "12097": "Osceola",
  "12099": "Palm Beach",
  "12101": "Pasco",
  "12103": "Pinellas",
  "12105": "Polk",
  "12107": "Putnam",
  "12109": "St. Johns",
  "12111": "St. Lucie",
  "12113": "Santa Rosa",
  "12115": "Sarasota",
  "12117": "Seminole",
  "12119": "Sumter",
  "12121": "Suwannee",
  "12123": "Taylor",
  "12125": "Union",
  "12127": "Volusia",
  "12129": "Wakulla",
  "12131": "Walton",
  "12133": "Washington",
};

/**
 * Transform raw parcel data to frontend format
 */
function transformParcelData(raw: RawParcelData): ParcelData {
  return {
    id: raw.parcel_id,
    parcelId: raw.parcel_id,
    address: `${raw.phy_addr1}, ${raw.phy_city || "Unknown City"}`,
    owner: raw.own_name || "Unknown Owner",
    county: COUNTY_NAMES[raw.county_fips] || raw.county_fips,
    landUse: "Residential", // Default - could be enriched from additional data
    totalValue: (raw.lnd_val || 0) + (raw.imp_val || 0),
    buildingValue: raw.imp_val || 0,
    landValue: raw.lnd_val || 0,
    yearBuilt: raw.yr_blt || raw.act_yr_blt || undefined,
    squareFeet: raw.tot_lvg_area || undefined,
    // Mock data for fields not in database
    acreage: undefined,
    floodZone: undefined,
    hurricaneZone: undefined,
    riskFactors: [],
  };
}

/**
 * Search Florida parcels by various criteria
 * Uses service role access to bypass RLS
 */
export async function searchParcels(params: ParcelSearchParams) {
  try {
    const supabase = await createClient();

    logger.info("[PARCEL SEARCH] Starting search with params:", params);

    let query = supabase
      .from("florida_parcels")
      .select(
        `
        parcel_id,
        own_name,
        phy_addr1,
        phy_city,
        county_fips,
        lnd_val,
        imp_val,
        del_val,
        yr_blt,
        act_yr_blt,
        no_bdrm,
        no_bath,
        tot_lvg_area
      `,
      )
      .limit(params.limit || 10);

    // Apply filters based on search parameters
    if (params.address) {
      query = query.ilike("phy_addr1", `%${params.address}%`);
    }

    if (params.county) {
      query = query.eq("county_fips", params.county);
    }

    if (params.owner) {
      query = query.ilike("own_name", `%${params.owner}%`);
    }

    if (params.parcelId) {
      query = query.eq("parcel_id", params.parcelId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("[PARCEL SEARCH] Database error:", error);
      throw error;
    }

    logger.info(`[PARCEL SEARCH] Found ${data?.length || 0} parcels`);

    // Transform raw data to frontend format
    const transformedData = data
      ? (data as RawParcelData[]).map(transformParcelData)
      : [];

    return { data: transformedData, error: null };
  } catch (error) {
    logger.error("[PARCEL SEARCH] Error:", toError(error));
    return { data: null, error: error as Error };
  }
}

/**
 * Get parcel details by specific parcel ID
 */
export async function getParcelDetails(parcelId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("florida_parcels")
      .select("*")
      .eq("parcel_id", parcelId)
      .single();

    if (error) throw error;

    // Transform raw data to frontend format
    const transformedData = data
      ? transformParcelData(data as RawParcelData)
      : null;

    return { data: transformedData, error: null };
  } catch (error) {
    logger.error("[PARCEL DETAILS] Error:", toError(error));
    return { data: null, error: error as Error };
  }
}

/**
 * Get county statistics
 */
export async function getCountyStats(countyFips: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_county_statistics", {
      county_fips: countyFips,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    logger.error("[COUNTY STATS] Error:", toError(error));
    return { data: null, error: error as Error };
  }
}

/**
 * AI-powered property risk assessment
 */
export async function assessPropertyRisk(parcelId: string) {
  try {
    const parcelResult = await getParcelDetails(parcelId);
    if (parcelResult.error || !parcelResult.data) {
      throw new Error("Parcel not found");
    }

    const parcel = parcelResult.data;

    // AI risk analysis based on parcel data
    // Need to get county FIPS from county name mapping
    const countyFips =
      Object.keys(COUNTY_NAMES).find(
        (fips) => COUNTY_NAMES[fips] === parcel.county,
      ) || "12000";

    const riskFactors: RiskFactors = {
      floodRisk: calculateFloodRisk(countyFips),
      hurricaneRisk: calculateHurricaneRisk(countyFips),
      ageRisk: calculateAgeRisk(parcel.yearBuilt || 0),
      valueRisk: calculateValueRisk(parcel.totalValue || 0),
      locationRisk: calculateLocationRisk(
        parcel.address.split(",")[1]?.trim() || "",
      ),
    };

    const overallRisk =
      Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / 5;

    return {
      data: {
        parcelId,
        riskFactors,
        overallRisk: Math.round(overallRisk * 100) / 100,
        recommendations: generateRiskRecommendations(riskFactors),
      },
      error: null,
    };
  } catch (error) {
    logger.error("[RISK ASSESSMENT] Error:", toError(error));
    return { data: null, error: error as Error };
  }
}

// Helper functions for risk calculation
function calculateFloodRisk(countyFips: string): number {
  // Florida coastal counties have higher flood risk
  const coastalCounties = ["12015", "12071", "12081", "12103", "12057"];
  return coastalCounties.includes(countyFips) ? 0.8 : 0.4;
}

function calculateHurricaneRisk(countyFips: string): number {
  // All Florida counties have hurricane risk, coastal higher
  const coastalCounties = ["12015", "12071", "12081", "12103", "12057"];
  return coastalCounties.includes(countyFips) ? 0.9 : 0.7;
}

function calculateAgeRisk(yearBuilt: number): number {
  if (!yearBuilt) return 0.5;
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;

  if (age > 50) return 0.8;
  if (age > 30) return 0.6;
  if (age > 20) return 0.4;
  return 0.2;
}

function calculateValueRisk(totalValue: number): number {
  if (!totalValue) return 0.5;

  // Higher value properties have higher risk exposure
  if (totalValue > 1000000) return 0.8;
  if (totalValue > 500000) return 0.6;
  if (totalValue > 250000) return 0.4;
  return 0.2;
}

function calculateLocationRisk(city: string): number {
  // Coastal cities have higher location risk
  const coastalCities = [
    "NAPLES",
    "FORT MYERS",
    "SARASOTA",
    "ST PETERSBURG",
    "TAMPA",
  ];
  return coastalCities.some((coastal) => city?.toUpperCase().includes(coastal))
    ? 0.7
    : 0.3;
}

interface RiskFactors {
  floodRisk: number;
  hurricaneRisk: number;
  ageRisk: number;
  valueRisk: number;
  locationRisk: number;
}

function generateRiskRecommendations(riskFactors: RiskFactors): string[] {
  const recommendations = [];

  if (riskFactors.floodRisk > 0.6) {
    recommendations.push("Consider flood insurance coverage");
    recommendations.push("Evaluate flood mitigation measures");
  }

  if (riskFactors.hurricaneRisk > 0.7) {
    recommendations.push("Ensure hurricane shutters or impact windows");
    recommendations.push("Review windstorm coverage limits");
  }

  if (riskFactors.ageRisk > 0.6) {
    recommendations.push("Schedule comprehensive property inspection");
    recommendations.push("Consider electrical and plumbing upgrades");
  }

  if (riskFactors.valueRisk > 0.6) {
    recommendations.push("Review coverage limits for adequate protection");
    recommendations.push("Consider umbrella insurance policy");
  }

  return recommendations;
}
