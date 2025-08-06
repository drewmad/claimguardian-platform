-- Fix item_category enum naming consistency
-- Convert ALL_CAPS values to lowercase to align with other enums
-- Safe to run because personal_property table was empty

-- Step 1: Create new enum with consistent lowercase naming
CREATE TYPE item_category_new AS ENUM (
  'electronics',
  'furniture', 
  'appliances',
  'jewelry',
  'clothing',
  'tools',
  'sports',
  'collectibles',
  'documents',
  'structure',
  'system',
  'other'
);

-- Step 2: Remove default constraint to allow type change
ALTER TABLE personal_property ALTER COLUMN category DROP DEFAULT;

-- Step 3: Update column to use new enum with value mapping
ALTER TABLE personal_property 
ALTER COLUMN category TYPE item_category_new 
USING CASE category::text
  WHEN 'ELECTRONICS' THEN 'electronics'::item_category_new
  WHEN 'FURNITURE' THEN 'furniture'::item_category_new
  WHEN 'APPLIANCES' THEN 'appliances'::item_category_new
  WHEN 'JEWELRY' THEN 'jewelry'::item_category_new
  WHEN 'CLOTHING' THEN 'clothing'::item_category_new
  WHEN 'TOOLS' THEN 'tools'::item_category_new
  WHEN 'SPORTS' THEN 'sports'::item_category_new
  WHEN 'COLLECTIBLES' THEN 'collectibles'::item_category_new
  WHEN 'DOCUMENTS' THEN 'documents'::item_category_new
  WHEN 'STRUCTURE' THEN 'structure'::item_category_new
  WHEN 'SYSTEM' THEN 'system'::item_category_new
  WHEN 'OTHER' THEN 'other'::item_category_new
END;

-- Step 4: Drop old enum type
DROP TYPE item_category;

-- Step 5: Rename new enum to original name
ALTER TYPE item_category_new RENAME TO item_category;

-- Verification: Check final enum values
SELECT 
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typname = 'item_category'
GROUP BY t.typname;