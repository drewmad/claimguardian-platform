-- Remove unused objectid column from florida_parcels table

-- Drop the unused function first
DROP FUNCTION IF EXISTS "public"."max_objectid_for_county"("cnty_layer" integer);

-- Drop the objectid column from florida_parcels table
ALTER TABLE "public"."florida_parcels" 
DROP COLUMN IF EXISTS "objectid";

-- Also remove objectid from staging table if it exists
ALTER TABLE "public"."florida_parcels_staging" 
DROP COLUMN IF EXISTS "objectid";