/**
 * @fileMetadata
 * @purpose Configuration for Florida parcels ETL pipeline
 * @owner data-team
 * @dependencies []
 * @exports ["FGIO_ITEM_ID", "FGIO_REST", "FDOT_SERVICE", "FGDL_ROOT", "DOR_PORTAL", "COUNTY_IDS"]
 * @complexity low
 * @tags ["etl", "config", "parcels"]
 * @status active
 */

// FGIO (Florida Geographic Information Office) - Quarterly updates
export const FGIO_ITEM_ID = "efa909d6b1c841d298b0a649e7f71cf2";
export const FGIO_REST = 
  `https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/Florida_Statewide_Parcels/FeatureServer/0`;

// FDOT (Florida Department of Transportation) - Annual updates with weekly deltas
export const FDOT_SERVICE = 
  "https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer";

// FGDL (Florida Geographic Data Library) - Yearly archives
export const FGDL_ROOT = 
  "https://fgdl.org/metadataexplorer/explorer/zip/";

// DOR (Department of Revenue) - Official tax roll shapes
export const DOR_PORTAL = 
  "https://floridarevenue.com/property/Pages/Cofficial_GIS.aspx";

// Florida county IDs (1-67)
export const COUNTY_IDS = Array.from({ length: 67 }, (_, i) => i + 1);

// County FIPS codes mapping
export const COUNTY_FIPS_MAP: Record<number, string> = {
  1: "001", // Alachua
  2: "003", // Baker
  3: "005", // Bay
  4: "007", // Bradford
  5: "009", // Brevard
  6: "011", // Broward
  7: "013", // Calhoun
  8: "015", // Charlotte
  9: "017", // Citrus
  10: "019", // Clay
  11: "021", // Collier
  12: "023", // Columbia
  13: "027", // DeSoto
  14: "029", // Dixie
  15: "031", // Duval
  16: "033", // Escambia
  17: "035", // Flagler
  18: "037", // Franklin
  19: "039", // Gadsden
  20: "041", // Gilchrist
  21: "043", // Glades
  22: "045", // Gulf
  23: "047", // Hamilton
  24: "049", // Hardee
  25: "051", // Hendry
  26: "053", // Hernando
  27: "055", // Highlands
  28: "057", // Hillsborough
  29: "059", // Holmes
  30: "061", // Indian River
  31: "063", // Jackson
  32: "065", // Jefferson
  33: "067", // Lafayette
  34: "069", // Lake
  35: "071", // Lee
  36: "073", // Leon
  37: "075", // Levy
  38: "077", // Liberty
  39: "079", // Madison
  40: "081", // Manatee
  41: "083", // Marion
  42: "085", // Martin
  43: "086", // Miami-Dade
  44: "087", // Monroe
  45: "089", // Nassau
  46: "091", // Okaloosa
  47: "093", // Okeechobee
  48: "095", // Orange
  49: "097", // Osceola
  50: "099", // Palm Beach
  51: "101", // Pasco
  52: "103", // Pinellas
  53: "105", // Polk
  54: "107", // Putnam
  55: "109", // St. Johns
  56: "111", // St. Lucie
  57: "113", // Santa Rosa
  58: "115", // Sarasota
  59: "117", // Seminole
  60: "119", // Sumter
  61: "121", // Suwannee
  62: "123", // Taylor
  63: "125", // Union
  64: "127", // Volusia
  65: "129", // Wakulla
  66: "131", // Walton
  67: "133"  // Washington
};

// Request configuration
export const REQUEST_CONFIG = {
  maxRecordCount: 2000, // FGIO max records per request
  fdotPageSize: 1000,   // FDOT page size
  timeout: 300000,      // 5 minute timeout for large requests
  retryAttempts: 3,
  retryDelay: 5000
};