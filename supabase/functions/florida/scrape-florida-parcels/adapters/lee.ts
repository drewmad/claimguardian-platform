// supabase/functions/scrape-florida-parcels/adapters/lee.ts

import { scrapeArcGIS } from "../utils/arcgis.ts";
import { ScrapeResult, ArcGISAdapterConfig } from "../types.ts";

const config: ArcGISAdapterConfig = {
  source: "fl_lee_county",
  serviceUrl:
    "https://maps.leepa.org/arcgis/rest/services/Leegis/SecureParcels/MapServer/0",
  fieldMap: {
    OBJECTID: "source_object_id",
    STRAP: "parcel_id",
    OWNER_NAME: "owner_name",
    SITE_ADDRESS_LINE1: "situs_address",
    SITE_ADDRESS_CITY: "situs_city",
    SITE_ADDRESS_ZIP: "situs_zip",
    TOTAL_ASSESSED_VALUE: "assessed_value",
    JUST_MARKET_VALUE: "just_value",
    YEAR_BUILT: "year_built",
    USE_CODE: "property_use_code",
    TOTAL_LIVING_AREA: "heated_area_sqft",
  },
};

/**
 * Scrapes property data for Lee County using the generic ArcGIS utility.
 * @param lastObjectId The last OBJECTID processed in the previous run.
 * @returns A promise that resolves to a ScrapeResult.
 */
export default async function scrapeLee(
  lastObjectId: number,
): Promise<ScrapeResult> {
  return await scrapeArcGIS(config, lastObjectId);
}
