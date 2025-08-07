// supabase/functions/scrape-florida-parcels/types.ts

export interface ScrapeResult {
  source: string;
  success: boolean;
  data: any[];
  error?: string;
  lastObjectId?: number;
}

export interface ArcGISAdapterConfig {
  source: string;
  serviceUrl: string;
  fieldMap: { [key: string]: string };
}

export interface ParcelRecord {
  source_object_id: string;
  parcel_id: string;
  owner_name?: string;
  situs_address?: string;
  situs_city?: string;
  situs_zip?: string;
  just_value?: string;
  assessed_value?: string;
  year_built?: string;
  property_use_code?: string;
  heated_area_sqft?: string;
  [key: string]: any; // Allow additional fields
}
