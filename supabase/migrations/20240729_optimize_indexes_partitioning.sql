-- Database Optimization: Indexes and Partitioning
-- This migration adds performance-critical indexes and sets up partitioning for large tables

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Claims table indexes
CREATE INDEX IF NOT EXISTS idx_claims_user_status 
ON public.claims(user_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_claims_property_id 
ON public.claims(property_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_claims_created_at 
ON public.claims(created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_claims_damage_type 
ON public.claims(damage_type) 
WHERE deleted_at IS NULL;

-- Properties table indexes (with GIS optimization)
CREATE INDEX IF NOT EXISTS idx_properties_user_id 
ON public.properties(user_id) 
WHERE deleted_at IS NULL;

-- Spatial index for geographic queries
CREATE INDEX IF NOT EXISTS idx_properties_location 
ON public.properties USING GIST(location) 
WHERE location IS NOT NULL;

-- Composite index for property searches
CREATE INDEX IF NOT EXISTS idx_properties_search 
ON public.properties(state, county, city, property_type) 
WHERE deleted_at IS NULL;

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_uploadable 
ON public.documents(uploadable_type, uploadable_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_user_id 
ON public.documents(user_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_type_status 
ON public.documents(document_type, processing_status) 
WHERE deleted_at IS NULL;

-- Damage assessments indexes
CREATE INDEX IF NOT EXISTS idx_damage_assessments_claim_id 
ON public.damage_assessments(claim_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_damage_assessments_created_at 
ON public.damage_assessments(created_at DESC) 
WHERE deleted_at IS NULL;

-- Florida properties data indexes
CREATE INDEX IF NOT EXISTS idx_florida_properties_parcel 
ON public.florida_properties(parcel_id);

CREATE INDEX IF NOT EXISTS idx_florida_properties_owner 
ON public.florida_properties(owner_name);

CREATE INDEX IF NOT EXISTS idx_florida_properties_address 
ON public.florida_properties(site_addr);

-- GIS index for Florida properties
CREATE INDEX IF NOT EXISTS idx_florida_properties_geom 
ON public.florida_properties USING GIST(geom) 
WHERE geom IS NOT NULL;

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles(role) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription 
ON public.profiles(subscription_status, subscription_tier) 
WHERE deleted_at IS NULL;

-- ============================================
-- TABLE PARTITIONING
-- ============================================

-- Create partitioned table for damage_assessments (by created_at)
-- This helps with query performance on large datasets

-- First, rename existing table
ALTER TABLE IF EXISTS public.damage_assessments 
RENAME TO damage_assessments_old;

-- Create new partitioned table
CREATE TABLE public.damage_assessments (
    LIKE public.damage_assessments_old INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month (example for 2024)
CREATE TABLE public.damage_assessments_2024_01 
PARTITION OF public.damage_assessments 
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE public.damage_assessments_2024_02 
PARTITION OF public.damage_assessments 
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE public.damage_assessments_2024_03 
PARTITION OF public.damage_assessments 
FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

CREATE TABLE public.damage_assessments_2024_04 
PARTITION OF public.damage_assessments 
FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

CREATE TABLE public.damage_assessments_2024_05 
PARTITION OF public.damage_assessments 
FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

CREATE TABLE public.damage_assessments_2024_06 
PARTITION OF public.damage_assessments 
FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE public.damage_assessments_2024_07 
PARTITION OF public.damage_assessments 
FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

CREATE TABLE public.damage_assessments_2024_08 
PARTITION OF public.damage_assessments 
FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

-- Create default partition for future data
CREATE TABLE public.damage_assessments_default 
PARTITION OF public.damage_assessments DEFAULT;

-- Copy data from old table to new partitioned table
INSERT INTO public.damage_assessments 
SELECT * FROM public.damage_assessments_old;

-- Drop old table
DROP TABLE public.damage_assessments_old;

-- ============================================
-- FUNCTION FOR AUTOMATIC PARTITION CREATION
-- ============================================

CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    -- Get the start of next month
    start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
    end_date := start_date + interval '1 month';
    partition_name := 'damage_assessments_' || to_char(start_date, 'YYYY_MM');
    
    -- Check if partition already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = partition_name
    ) THEN
        -- Create the partition
        EXECUTE format(
            'CREATE TABLE public.%I PARTITION OF public.damage_assessments FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            start_date,
            end_date
        );
        
        RAISE NOTICE 'Created partition %', partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly partition creation (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('create-monthly-partitions', '0 0 1 * *', 'SELECT create_monthly_partition();');

-- ============================================
-- QUERY PERFORMANCE VIEWS
-- ============================================

-- Create a view for monitoring slow queries
CREATE OR REPLACE VIEW public.slow_queries AS
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time,
    min_exec_time,
    max_exec_time,
    stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Create a view for monitoring table sizes
CREATE OR REPLACE VIEW public.table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- PERFORMANCE OPTIMIZATION SETTINGS
-- ============================================

-- Update table statistics for better query planning
ANALYZE public.claims;
ANALYZE public.properties;
ANALYZE public.documents;
ANALYZE public.damage_assessments;
ANALYZE public.florida_properties;

-- Add comments for documentation
COMMENT ON INDEX idx_claims_user_status IS 'Optimizes user claim queries by status';
COMMENT ON INDEX idx_properties_location IS 'Spatial index for geographic property searches';
COMMENT ON INDEX idx_florida_properties_geom IS 'GIS index for Florida parcel geometry data';
COMMENT ON FUNCTION create_monthly_partition() IS 'Automatically creates monthly partitions for damage_assessments table';