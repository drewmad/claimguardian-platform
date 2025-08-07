-- ClaimGuardian Database Enum Improvements
-- Pragmatic approach: Add only what's missing, fix inconsistencies
-- Run via Supabase Dashboard SQL Editor

-- ========================================
-- 1. ADD CRITICAL MISSING ENUMS
-- ========================================

-- Florida-specific disaster types for claims tracking
CREATE TYPE disaster_type AS ENUM (
  'hurricane',
  'tropical_storm',
  'flood',
  'sinkhole',
  'tornado',
  'wind_damage',
  'lightning',
  'wildfire'
);

-- Insurance policy types common in Florida
CREATE TYPE policy_type AS ENUM (
  'ho3',        -- Homeowners (most common)
  'ho6',        -- Condo owners
  'dp3',        -- Dwelling/rental property
  'flood',      -- NFIP flood insurance
  'wind_only',  -- Wind-only policies
  'excess',     -- Excess/umbrella coverage
  'commercial', -- Commercial property
  'mobile_home' -- Manufactured/mobile home
);

-- ========================================
-- 2. ADD MISSING PERMISSION TYPES
-- ========================================

-- Add critical missing permissions to existing enum
ALTER TYPE permission_type ADD VALUE 'api_access';
ALTER TYPE permission_type ADD VALUE 'team_management';
ALTER TYPE permission_type ADD VALUE 'emergency_access';

-- Note: Cannot remove enum values in PostgreSQL without dropping/recreating
-- Mark for future cleanup: 'white_label', 'advanced_reports'

-- ========================================
-- 3. ADD MISSING USER TIER
-- ========================================

-- Add contractor tier for Florida construction professionals
ALTER TYPE user_tier ADD VALUE 'contractor';

-- ========================================
-- 4. ADD MISSING PROPERTY TYPES
-- ========================================

-- Florida-specific property types
ALTER TYPE property_type ADD VALUE 'manufactured_home';
ALTER TYPE property_type ADD VALUE 'duplex';

-- ========================================
-- 5. FIX ITEM_CATEGORY INCONSISTENCY
-- ========================================

-- Note: PostgreSQL doesn't support renaming enum values directly
-- This would require creating new enum and migrating data
-- For now, document the inconsistency and address in future migration

-- TODO for future migration:
-- CREATE TYPE item_category_new AS ENUM (
--   'electronics', 'furniture', 'appliances', 'jewelry', 'clothing',
--   'tools', 'sports', 'collectibles', 'documents', 'structure',
--   'system', 'other'
-- );

-- ========================================
-- 6. VERIFICATION QUERIES
-- ========================================

-- Check all enum types and their values
SELECT
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- Verify new enums were created
\dT+ disaster_type;
\dT+ policy_type;

-- Verify new values were added
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'permission_type'::regtype
ORDER BY enumsortorder;
