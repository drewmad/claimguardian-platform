-- Comprehensive Schema Rebuild for ClaimGuardian
-- This migration implements enterprise-grade patterns, standardization, and performance optimizations

-- ============================================================================
-- PART 1: ENUMS AND REFERENCE DATA
-- ============================================================================

-- Create custom types for consistent data validation
CREATE TYPE claim_status_enum AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'denied', 'settled', 'closed');
CREATE TYPE policy_type_enum AS ENUM ('homeowners', 'flood', 'windstorm', 'umbrella', 'auto', 'other');
CREATE TYPE plan_type_enum AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE plan_status_enum AS ENUM ('active', 'canceled', 'suspended', 'trial');
CREATE TYPE user_role_enum AS ENUM ('user', 'contractor', 'adjuster', 'admin', 'super_admin');
CREATE TYPE damage_type_enum AS ENUM ('hurricane', 'flood', 'fire', 'theft', 'vandalism', 'water', 'wind', 'hail', 'other');
CREATE TYPE document_type_enum AS ENUM ('photo', 'video', 'pdf', 'estimate', 'invoice', 'report', 'correspondence', 'other');

-- ============================================================================
-- PART 2: MODULAR SCHEMA ORGANIZATION
-- ============================================================================

-- Create logical schema separations
CREATE SCHEMA IF NOT EXISTS core;        -- Main business tables
CREATE SCHEMA IF NOT EXISTS reference;   -- Lookup/enum tables
CREATE SCHEMA IF NOT EXISTS history;     -- Partitioned historical data
CREATE SCHEMA IF NOT EXISTS security;    -- Audit and security logs
CREATE SCHEMA IF NOT EXISTS etl;         -- Staging and import tables

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA core TO authenticated;
GRANT USAGE ON SCHEMA reference TO authenticated;
GRANT USAGE ON SCHEMA history TO authenticated;
GRANT USAGE ON SCHEMA security TO authenticated;  -- Grant usage, then control table access

-- ============================================================================
-- PART 3: STANDARDIZED UUID FUNCTIONS
-- ============================================================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create reusable UUID default function
CREATE OR REPLACE FUNCTION core.generate_uuid()
RETURNS uuid AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PART 4: UNIVERSAL TRIGGER FUNCTIONS
-- ============================================================================

-- Consolidated updated_at trigger function
CREATE OR REPLACE FUNCTION core.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit trail function
CREATE OR REPLACE FUNCTION security.create_audit_entry()
RETURNS trigger AS $$
BEGIN
    INSERT INTO security.audit_log (
        table_name,
        operation,
        user_id,
        row_data,
        changed_fields
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        to_jsonb(NEW),
        CASE 
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) - to_jsonb(OLD)
            ELSE NULL
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: CORE TABLES WITH STANDARDIZATION
-- ============================================================================

-- User roles table for RBAC
CREATE TABLE IF NOT EXISTS core.user_role (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'user',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

-- Standardize user_profiles with proper constraints
ALTER TABLE public.user_profiles 
    ALTER COLUMN id SET DEFAULT core.generate_uuid(),
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS role user_role_enum DEFAULT 'user',
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add phone constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'phone_format' AND conrelid = 'public.user_profiles'::regclass) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT phone_format CHECK (phone ~ '^\+?[1-9]\d{1,14}$' OR phone IS NULL);
    END IF;
END
$$;

-- Standardize properties table
ALTER TABLE public.properties
    ALTER COLUMN id SET DEFAULT core.generate_uuid(),
    ADD COLUMN IF NOT EXISTS property_type TEXT,
    ADD COLUMN IF NOT EXISTS parcel_id TEXT,
    ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_year') THEN
        ALTER TABLE public.properties ADD CONSTRAINT valid_year CHECK (year_built BETWEEN 1800 AND EXTRACT(YEAR FROM CURRENT_DATE));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_square_feet') THEN
        ALTER TABLE public.properties ADD CONSTRAINT valid_square_feet CHECK (square_feet > 0);
    END IF;
END
$$;

-- Standardize insurance_policies with extracted fields (moved up before claims)
CREATE TABLE IF NOT EXISTS core.insurance_policy (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    policy_number TEXT NOT NULL,
    policy_type policy_type_enum NOT NULL,
    carrier_name TEXT NOT NULL,
    carrier_phone TEXT,
    carrier_email TEXT,
    agent_name TEXT,
    agent_phone TEXT,
    agent_email TEXT,
    effective_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    premium_amount DECIMAL(10,2) NOT NULL,
    deductible_hurricane DECIMAL(10,2),
    deductible_wind DECIMAL(10,2),
    deductible_other DECIMAL(10,2),
    coverage_dwelling DECIMAL(12,2),
    coverage_other_structures DECIMAL(12,2),
    coverage_personal_property DECIMAL(12,2),
    coverage_loss_of_use DECIMAL(12,2),
    coverage_liability DECIMAL(12,2),
    coverage_medical DECIMAL(12,2),
    is_current BOOLEAN DEFAULT true,
    version_no SERIAL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_policy_dates CHECK (effective_date < expiration_date),
    CONSTRAINT valid_premium CHECK (premium_amount >= 0),
    CONSTRAINT valid_deductibles CHECK (
        (deductible_hurricane IS NULL OR deductible_hurricane >= 0) AND
        (deductible_wind IS NULL OR deductible_wind >= 0) AND
        (deductible_other IS NULL OR deductible_other >= 0)
    )
);

-- Create partial unique index for current policies
CREATE UNIQUE INDEX idx_current_policy ON core.insurance_policy(user_id, property_id, policy_type) 
WHERE is_current = true;

-- Create comprehensive claims schema
CREATE TABLE IF NOT EXISTS core.claim (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    claim_number TEXT UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    policy_id UUID NOT NULL REFERENCES core.insurance_policy(id) ON DELETE RESTRICT,
    status claim_status_enum NOT NULL DEFAULT 'draft',
    type damage_type_enum NOT NULL,
    incident_date DATE NOT NULL,
    reported_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    deductible_amount DECIMAL(10,2),
    claimed_amount DECIMAL(10,2),
    approved_amount DECIMAL(10,2),
    settlement_amount DECIMAL(10,2),
    settlement_date DATE,
    adjuster_name TEXT,
    adjuster_phone TEXT,
    adjuster_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (incident_date <= reported_date::date),
    CONSTRAINT valid_amounts CHECK (
        (claimed_amount IS NULL OR claimed_amount >= 0) AND
        (approved_amount IS NULL OR approved_amount >= 0) AND
        (settlement_amount IS NULL OR settlement_amount >= 0)
    )
);

-- Claims damage details
CREATE TABLE IF NOT EXISTS core.claim_damage (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    claim_id UUID NOT NULL REFERENCES core.claim(id) ON DELETE CASCADE,
    room_or_area TEXT NOT NULL,
    damage_type damage_type_enum NOT NULL,
    description TEXT NOT NULL,
    estimated_cost DECIMAL(10,2),
    approved_cost DECIMAL(10,2),
    photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Claims documents
CREATE TABLE IF NOT EXISTS core.claim_document (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    claim_id UUID NOT NULL REFERENCES core.claim(id) ON DELETE CASCADE,
    document_type document_type_enum NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Claims timeline/status history
CREATE TABLE IF NOT EXISTS core.claim_timeline (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    claim_id UUID NOT NULL REFERENCES core.claim(id) ON DELETE CASCADE,
    status claim_status_enum NOT NULL,
    notes TEXT,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insurance policy table already created above

-- ============================================================================
-- PART 6: SECURITY AND AUDIT TABLES WITH PARTITIONING
-- ============================================================================

-- Partitioned login activity table
CREATE TABLE IF NOT EXISTS security.login_activity (
    id UUID NOT NULL DEFAULT core.generate_uuid(),
    user_id UUID NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    location_city TEXT,
    location_country TEXT,
    location_region TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_failure CHECK (
        (success = true AND failure_reason IS NULL) OR
        (success = false AND failure_reason IS NOT NULL)
    )
) PARTITION BY RANGE (created_at);

-- Create partitions for login_activity
CREATE TABLE security.login_activity_2025_01 PARTITION OF security.login_activity
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE security.login_activity_2025_02 PARTITION OF security.login_activity
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE security.login_activity_2025_03 PARTITION OF security.login_activity
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
-- Add more partitions as needed

-- Create indexes on partitions
CREATE INDEX idx_login_2025_01_user ON security.login_activity_2025_01(user_id, created_at DESC);
CREATE INDEX idx_login_2025_02_user ON security.login_activity_2025_02(user_id, created_at DESC);
CREATE INDEX idx_login_2025_03_user ON security.login_activity_2025_03(user_id, created_at DESC);

-- Unified audit log with partitioning
CREATE TABLE IF NOT EXISTS security.audit_log (
    id UUID NOT NULL DEFAULT core.generate_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID,
    row_data JSONB NOT NULL,
    changed_fields JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create audit log partitions
CREATE TABLE security.audit_log_2025_01 PARTITION OF security.audit_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE security.audit_log_2025_02 PARTITION OF security.audit_log
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ============================================================================
-- PART 7: GEOSPATIAL STANDARDIZATION
-- ============================================================================

-- Add PostGIS if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- Standardize all geometry columns
ALTER TABLE public.properties 
    ADD COLUMN IF NOT EXISTS location geometry(Point, 4326),
    ADD CONSTRAINT valid_florida_bbox CHECK (
        location IS NULL OR (
            ST_X(location) BETWEEN -87.634896 AND -79.974306 AND
            ST_Y(location) BETWEEN 24.396308 AND 31.000888
        )
    );

-- Create spatial indexes
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties USING GIST(location);

-- ============================================================================
-- PART 8: COMPREHENSIVE INDEXES
-- ============================================================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_claim_property ON core.claim(property_id);
CREATE INDEX IF NOT EXISTS idx_claim_policy ON core.claim(policy_id);
CREATE INDEX IF NOT EXISTS idx_claim_status_date ON core.claim(status, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_claim_damage_claim ON core.claim_damage(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_document_claim ON core.claim_document(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_claim ON core.claim_timeline(claim_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_policy_user ON core.insurance_policy(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policy_property ON core.insurance_policy(property_id);
CREATE INDEX IF NOT EXISTS idx_user_role_user ON core.user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_active ON core.user_role(is_active, role) WHERE is_active = true;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_properties_user ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_table ON security.audit_log(user_id, table_name, created_at DESC);

-- ============================================================================
-- PART 9: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE core.claim ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.claim_damage ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.claim_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.claim_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.insurance_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.audit_log ENABLE ROW LEVEL SECURITY;

-- User role policies
CREATE POLICY "Users can view own roles" ON core.user_role
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM core.user_role ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'super_admin')
        AND ur.is_active = true
    ));

-- Claims policies with role-based access
CREATE POLICY "Users can view own claims" ON core.claim
    FOR SELECT USING (
        property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM core.user_role ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('adjuster', 'admin', 'super_admin')
            AND ur.is_active = true
        )
    );

CREATE POLICY "Users can create own claims" ON core.claim
    FOR INSERT WITH CHECK (
        property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own claims" ON core.claim
    FOR UPDATE USING (
        property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
        AND status NOT IN ('approved', 'settled', 'closed')
    );

-- Insurance policy policies
CREATE POLICY "Users can view own policies" ON core.insurance_policy
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own policies" ON core.insurance_policy
    FOR ALL USING (user_id = auth.uid());

-- Audit log policies (read-only for users)
CREATE POLICY "Users can view own audit logs" ON security.audit_log
    FOR SELECT USING (user_id = auth.uid());

-- Login activity policies
CREATE POLICY "Users can view own login activity" ON security.login_activity
    FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- PART 10: TRIGGERS APPLICATION
-- ============================================================================

-- Apply updated_at triggers to all tables with that column
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT c.table_schema, c.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
        WHERE c.column_name = 'updated_at' 
        AND c.table_schema IN ('public', 'core', 'reference')
        AND t.table_type = 'BASE TABLE'  -- Exclude views
    LOOP
        EXECUTE format('
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON %I.%I
            FOR EACH ROW
            EXECUTE FUNCTION core.set_updated_at()',
            r.table_schema, r.table_name
        );
    END LOOP;
END;
$$;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_claims
    AFTER INSERT OR UPDATE OR DELETE ON core.claim
    FOR EACH ROW EXECUTE FUNCTION security.create_audit_entry();

CREATE TRIGGER audit_policies
    AFTER INSERT OR UPDATE OR DELETE ON core.insurance_policy
    FOR EACH ROW EXECUTE FUNCTION security.create_audit_entry();

-- ============================================================================
-- PART 11: FUNCTIONS AND STORED PROCEDURES
-- ============================================================================

-- Fixed log_login_activity function
CREATE OR REPLACE FUNCTION security.log_login_activity(
    p_user_id UUID,
    p_ip_address TEXT,
    p_user_agent TEXT,
    p_success BOOLEAN DEFAULT true,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO security.login_activity (
        user_id,
        ip_address,
        user_agent,
        success,
        failure_reason
    ) VALUES (
        p_user_id,
        p_ip_address::inet,
        p_user_agent,
        p_success,
        p_failure_reason
    );
END;
$$;

-- Role check function for RLS
CREATE OR REPLACE FUNCTION core.user_has_role(check_user_id UUID, check_roles user_role_enum[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM core.user_role 
        WHERE user_id = check_user_id 
        AND role = ANY(check_roles)
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    );
END;
$$;

-- Create claim number generator
CREATE OR REPLACE FUNCTION core.generate_claim_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT;
    v_sequence INTEGER;
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COUNT(*) + 1 INTO v_sequence
    FROM core.claim
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    RETURN 'CLM-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
END;
$$;

-- ============================================================================
-- PART 12: PERMISSIONS AND SECURITY
-- ============================================================================

-- Revoke dangerous permissions
REVOKE INSERT, UPDATE, DELETE ON security.audit_log FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON security.login_activity FROM authenticated;

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA core TO authenticated;
GRANT INSERT, UPDATE, DELETE ON core.claim, core.claim_damage, core.claim_document, core.claim_timeline TO authenticated;
GRANT INSERT, UPDATE, DELETE ON core.insurance_policy TO authenticated;

-- ============================================================================
-- PART 13: MIGRATION HELPERS
-- ============================================================================

-- Migrate existing data to new structure
-- This section would contain data migration logic specific to your existing data

-- ============================================================================
-- PART 14: FUTURE PARTITION CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION security.create_monthly_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for next 3 months
    FOR i IN 0..2 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
        end_date := start_date + INTERVAL '1 month';
        
        -- Login activity partitions
        partition_name := 'login_activity_' || TO_CHAR(start_date, 'YYYY_MM');
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'security' 
            AND tablename = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE security.%I PARTITION OF security.login_activity
                FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
            
            EXECUTE format(
                'CREATE INDEX idx_%I_user ON security.%I(user_id, created_at DESC)',
                partition_name, partition_name
            );
        END IF;
        
        -- Audit log partitions
        partition_name := 'audit_log_' || TO_CHAR(start_date, 'YYYY_MM');
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'security' 
            AND tablename = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE security.%I PARTITION OF security.audit_log
                FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
        END IF;
    END LOOP;
END;
$$;

-- Schedule partition creation (requires pg_cron extension)
-- SELECT cron.schedule('create-partitions', '0 0 1 * *', 'SELECT security.create_monthly_partitions()');

-- ============================================================================
-- PART 15: COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA core IS 'Core business domain tables';
COMMENT ON SCHEMA security IS 'Security and audit logging tables';
COMMENT ON SCHEMA reference IS 'Reference data and lookup tables';
COMMENT ON SCHEMA history IS 'Historical and partitioned data';
COMMENT ON SCHEMA etl IS 'ETL staging and temporary tables';

COMMENT ON TABLE core.claim IS 'Insurance claims master table';
COMMENT ON TABLE core.insurance_policy IS 'Insurance policies with normalized coverage data';
COMMENT ON TABLE security.login_activity IS 'Partitioned user login tracking';
COMMENT ON TABLE security.audit_log IS 'Partitioned audit trail for all changes';

-- ============================================================================
-- CLEANUP: Remove deprecated objects
-- ============================================================================

-- Drop redundant functions
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.trg_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;

-- Drop old triggers before recreation
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT DISTINCT trigger_name, event_object_schema, event_object_table
        FROM information_schema.triggers
        WHERE trigger_name LIKE '%updated_at%'
        AND event_object_schema IN ('public', 'core')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I',
            r.trigger_name, r.event_object_schema, r.event_object_table
        );
    END LOOP;
END;
$$;