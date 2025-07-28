-- Step-by-step migration commands
-- Run each section in Supabase SQL Editor

-- STEP 1: Backup existing data
-- ============================
CREATE TABLE IF NOT EXISTS properties_backup_20250724 AS 
SELECT * FROM properties;

CREATE TABLE IF NOT EXISTS claims_backup_20250724 AS 
SELECT * FROM claims;

-- Verify backups
SELECT 'Properties backup count:', COUNT(*) FROM properties_backup_20250724
UNION ALL
SELECT 'Claims backup count:', COUNT(*) FROM claims_backup_20250724;

-- STEP 2: Create missing types
-- ============================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
        CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'land', 'mixed_use');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'occupancy_status') THEN
        CREATE TYPE occupancy_status AS ENUM ('owner_occupied', 'tenant_occupied', 'vacant', 'seasonal');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'damage_severity') THEN
        CREATE TYPE damage_severity AS ENUM ('minor', 'moderate', 'major', 'total_loss');
    END IF;
END $$;

-- Verify types created
SELECT typname FROM pg_type 
WHERE typname IN ('property_type', 'occupancy_status', 'damage_severity');

-- STEP 3: Check what needs migration
-- ==================================
SELECT 
    'Current properties structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;