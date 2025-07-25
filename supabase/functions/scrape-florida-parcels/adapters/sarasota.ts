// supabase/functions/scrape-florida-parcels/adapters/sarasota.ts

import { scrapeArcGIS } from '../utils/arcgis.ts';
import { ScrapeResult, ArcGISAdapterConfig } from '../types.ts';

const config: ArcGISAdapterConfig = {
  source: 'fl_sarasota_county',
  serviceUrl: 'https://gis.sc-pa.com/server/rest/services/Parcel/ParcelData/MapServer/1',
  fieldMap: {
    'OBJECTID': 'source_object_id',
    'PARCEL_ID': 'parcel_id',
    'OWNER_1': 'owner_name',
    'SITUS_ADDR': 'situs_address',
    'SITUS_CITY': 'situs_city',
    'SITUS_ZIP': 'situs_zip',
    'JV_TOTAL': 'just_value',
    'YR_BLT': 'year_built',
    'DOR_UC': 'property_use_code',
    'TOT_LVG_AR': 'heated_area_sqft',
  },
};

/**
 * Scrapes property data for Sarasota County using the generic ArcGIS utility.
 * @param lastObjectId The last OBJECTID processed in the previous run.
 * @returns A promise that resolves to a ScrapeResult.
 */
export default async function scrapeSarasota(lastObjectId: number): Promise<ScrapeResult> {
  return await scrapeArcGIS(config, lastObjectId);
}
