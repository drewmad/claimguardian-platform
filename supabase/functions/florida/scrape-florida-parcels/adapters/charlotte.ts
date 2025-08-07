// supabase/functions/scrape-florida-parcels/adapters/charlotte.ts

import { scrapeArcGIS } from "../utils/arcgis.ts";
import { ScrapeResult, ArcGISAdapterConfig } from "../types.ts";

const config: ArcGISAdapterConfig = {
  source: "fl_charlotte_county",
  serviceUrl:
    "https://ccgis.charlottecountyfl.gov/arcgis/rest/services/WEB_Parcels/MapServer/0",
  fieldMap: {
    OBJECTID: "source_object_id",
    Strap: "parcel_id",
    Owner: "owner_name",
    Situs_Addr: "situs_address",
    Situs_City: "situs_city",
    Situs_Zip: "situs_zip",
    Total_Just: "just_value",
    Year_Built: "year_built",
    Prop_Use_C: "property_use_code",
    Heated_Are: "heated_area_sqft",
  },
};

/**
 * Scrapes property data for Charlotte County using the generic ArcGIS utility.
 * @param lastObjectId The last OBJECTID processed in the previous run.
 * @returns A promise that resolves to a ScrapeResult.
 */
export default async function scrapeCharlotte(
  lastObjectId: number,
): Promise<ScrapeResult> {
  return await scrapeArcGIS(config, lastObjectId);
}
