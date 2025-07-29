

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."ai_analysis_type" AS ENUM (
    'EMBEDDING',
    'EXTRACTION',
    'RISK_SCORING',
    'VALUATION',
    'DAMAGE_DETECTION',
    'FRAUD_DETECTION',
    'RECOMMENDATION',
    'SUMMARY'
);


ALTER TYPE "public"."ai_analysis_type" OWNER TO "postgres";


CREATE TYPE "public"."ai_task_status" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'RETRY'
);


ALTER TYPE "public"."ai_task_status" OWNER TO "postgres";


CREATE TYPE "public"."claim_status_enum" AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'denied',
    'settled',
    'closed'
);


ALTER TYPE "public"."claim_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."condition_type" AS ENUM (
    'NEW',
    'LIKE_NEW',
    'GOOD',
    'FAIR',
    'POOR',
    'DAMAGED'
);


ALTER TYPE "public"."condition_type" OWNER TO "postgres";


CREATE TYPE "public"."coverage_type" AS ENUM (
    'dwelling',
    'other_structure',
    'personal_property',
    'loss_of_use',
    'personal_liability',
    'medical_payments',
    'scheduled_property',
    'flood',
    'wind',
    'earthquake',
    'other'
);


ALTER TYPE "public"."coverage_type" OWNER TO "postgres";


CREATE TYPE "public"."crawl_status" AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."crawl_status" OWNER TO "postgres";


CREATE TYPE "public"."damage_severity" AS ENUM (
    'minor',
    'moderate',
    'major',
    'total_loss'
);


ALTER TYPE "public"."damage_severity" OWNER TO "postgres";


CREATE TYPE "public"."damage_type_enum" AS ENUM (
    'hurricane',
    'flood',
    'fire',
    'theft',
    'vandalism',
    'water',
    'wind',
    'hail',
    'other'
);


ALTER TYPE "public"."damage_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."doc_type_master" AS ENUM (
    'PHOTO',
    'PERMIT',
    'WARRANTY',
    'MANUAL',
    'RECEIPT',
    'INSPECTION',
    'INVOICE',
    'APPRAISAL',
    'POLICY',
    'OTHER',
    'CLAIM_EVIDENCE',
    'LEGAL'
);


ALTER TYPE "public"."doc_type_master" OWNER TO "postgres";


CREATE TYPE "public"."document_type_enum" AS ENUM (
    'policy',
    'claim',
    'evidence'
);


ALTER TYPE "public"."document_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."floir_data_type" AS ENUM (
    'catastrophe',
    'industry_reports',
    'professional_liability',
    'data_call',
    'licensee_search',
    'rate_filings',
    'receivership',
    'financial_reports',
    'news_bulletins',
    'surplus_lines'
);


ALTER TYPE "public"."floir_data_type" OWNER TO "postgres";


CREATE TYPE "public"."household_member_role" AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);


ALTER TYPE "public"."household_member_role" OWNER TO "postgres";


CREATE TYPE "public"."import_status" AS ENUM (
    'pending',
    'downloading',
    'validating',
    'transforming',
    'importing',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."import_status" OWNER TO "postgres";


CREATE TYPE "public"."item_category" AS ENUM (
    'SYSTEM',
    'STRUCTURE'
);


ALTER TYPE "public"."item_category" OWNER TO "postgres";


CREATE TYPE "public"."notification_status" AS ENUM (
    'PENDING',
    'SENT',
    'READ',
    'DISMISSED',
    'FAILED'
);


ALTER TYPE "public"."notification_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'MAINTENANCE_DUE',
    'WARRANTY_EXPIRING',
    'PERMIT_EXPIRING',
    'INSPECTION_DUE',
    'SERVICE_OVERDUE',
    'DOCUMENT_MISSING',
    'CLAIM_UPDATE',
    'CUSTOM',
    'POLICY_RENEWAL'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."occupancy_status" AS ENUM (
    'owner_occupied',
    'tenant_occupied',
    'vacant',
    'seasonal'
);


ALTER TYPE "public"."occupancy_status" OWNER TO "postgres";


CREATE TYPE "public"."parcel_data_source" AS ENUM (
    'fl_dor_statewide',
    'fl_county_charlotte',
    'fl_county_lee',
    'fl_county_sarasota',
    'fl_county_miami_dade',
    'fl_county_broward',
    'fl_county_palm_beach',
    'fl_county_hillsborough',
    'fl_county_pinellas',
    'fl_county_orange',
    'fl_county_duval'
);


ALTER TYPE "public"."parcel_data_source" OWNER TO "postgres";


CREATE TYPE "public"."permit_status_type" AS ENUM (
    'ACTIVE',
    'CLOSED',
    'PENDING',
    'EXPIRED',
    'NONE',
    'UNKNOWN'
);


ALTER TYPE "public"."permit_status_type" OWNER TO "postgres";


CREATE TYPE "public"."permit_type" AS ENUM (
    'BUILDING',
    'ELECTRICAL',
    'PLUMBING',
    'MECHANICAL',
    'ROOFING',
    'POOL',
    'OTHER'
);


ALTER TYPE "public"."permit_type" OWNER TO "postgres";


CREATE TYPE "public"."plan_status_enum" AS ENUM (
    'active',
    'canceled',
    'suspended',
    'trial'
);


ALTER TYPE "public"."plan_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."plan_type_enum" AS ENUM (
    'free',
    'basic',
    'premium',
    'enterprise'
);


ALTER TYPE "public"."plan_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."policy_type_enum" AS ENUM (
    'homeowners',
    'flood',
    'windstorm',
    'umbrella',
    'auto',
    'other'
);


ALTER TYPE "public"."policy_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."priority_type" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE "public"."priority_type" OWNER TO "postgres";


CREATE TYPE "public"."processing_status_enum" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE "public"."processing_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."property_item_category" AS ENUM (
    'electronics',
    'furniture',
    'appliance',
    'jewelry',
    'art',
    'clothing',
    'tool',
    'vehicle',
    'misc',
    'collectible'
);


ALTER TYPE "public"."property_item_category" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'residential',
    'commercial',
    'land',
    'mixed_use'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."scraper_run_status" AS ENUM (
    'STARTED',
    'SUCCESS',
    'FAILED',
    'PARTIAL'
);


ALTER TYPE "public"."scraper_run_status" OWNER TO "postgres";


CREATE TYPE "public"."service_type" AS ENUM (
    'ROUTINE',
    'REPAIR',
    'EMERGENCY',
    'INSPECTION',
    'UPGRADE',
    'WARRANTY'
);


ALTER TYPE "public"."service_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role_enum" AS ENUM (
    'user',
    'contractor',
    'adjuster',
    'admin',
    'super_admin'
);


ALTER TYPE "public"."user_role_enum" OWNER TO "postgres";


CREATE TYPE "public"."warranty_status_type" AS ENUM (
    'IN_WARRANTY',
    'OUT_OF_WARRANTY',
    'UNKNOWN'
);


ALTER TYPE "public"."warranty_status_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_add_column_if_absent"("p_table" "text", "p_column" "text", "p_type" "text", "p_default" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = p_table
          AND column_name  = p_column
    ) THEN
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN %I %s %s;',
            p_table, p_column, p_type,
            COALESCE('DEFAULT ' || p_default, '')
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."_add_column_if_absent"("p_table" "text", "p_column" "text", "p_type" "text", "p_default" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_add_jsonb_col"("p_table" "text", "p_col" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = p_table
          AND column_name  = p_col
    ) THEN
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN %I JSONB DEFAULT ''{}''::jsonb;',
            p_table, p_col
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."_add_jsonb_col"("p_table" "text", "p_col" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_and_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    hist_table TEXT := TG_TABLE_NAME || '_history';
BEGIN
    /* Insert OLD row into history on UPDATE or DELETE */
    IF TG_OP IN ('UPDATE','DELETE') THEN
        EXECUTE format('INSERT INTO public.%I SELECT ($1).* , $2, NULL', hist_table)
        USING OLD, NOW();
    END IF;

    IF TG_OP = 'UPDATE' THEN
        NEW.version    := COALESCE(OLD.version,0) + 1;
        NEW.updated_at := NOW();
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        NEW.updated_at := NOW();
        RETURN NEW;
    ELSE
        RETURN OLD;  -- DELETE
    END IF;
END;
$_$;


ALTER FUNCTION "public"."audit_and_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_populate_county"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_county_name TEXT;
    v_county_id UUID;
BEGIN
    -- Only process if county_id is not already set
    IF NEW.county_id IS NULL AND NEW.address IS NOT NULL THEN
        -- Extract county name from address
        v_county_name := extract_county_from_address(NEW.address);
        
        -- Look up county_id
        IF v_county_name IS NOT NULL THEN
            SELECT id INTO v_county_id
            FROM florida_counties
            WHERE county_name = v_county_name
            OR county_name = v_county_name || ' County'
            OR county_name = REPLACE(v_county_name, ' County', '')
            LIMIT 1;
            
            IF v_county_id IS NOT NULL THEN
                NEW.county_id := v_county_id;
                NEW.county_name := v_county_name;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_populate_county"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_florida_parcels_duplicates"() RETURNS TABLE("parcel_id" "text", "duplicate_count" bigint, "first_created" timestamp with time zone, "last_created" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.parcel_id::TEXT,
        COUNT(*)::BIGINT as duplicate_count,
        MIN(fp.created_at) as first_created,
        MAX(fp.created_at) as last_created
    FROM florida_parcels fp
    WHERE fp.parcel_id IS NOT NULL
    GROUP BY fp.parcel_id
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, fp.parcel_id;
END;
$$;


ALTER FUNCTION "public"."check_florida_parcels_duplicates"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_florida_parcels_duplicates"() IS 'Diagnostic function to check for any duplicate parcel_id values that may exist in the database.';



CREATE OR REPLACE FUNCTION "public"."check_florida_parcels_status"() RETURNS TABLE("table_status" "text", "total_rows" bigint, "counties_with_data" bigint, "indexes_count" bigint, "has_rls" boolean, "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'florida_parcels table ready for data import'::TEXT as table_status,
        COUNT(*)::BIGINT as total_rows,
        COUNT(DISTINCT county_fips)::BIGINT as counties_with_data,
        (SELECT COUNT(*)::BIGINT FROM pg_indexes WHERE tablename = 'florida_parcels') as indexes_count,
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'florida_parcels') as has_rls,
        MAX(created_at) as last_updated
    FROM florida_parcels;
END;
$$;


ALTER FUNCTION "public"."check_florida_parcels_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_demo_property"("user_uuid" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    property_id UUID;
BEGIN
    -- Generate a new UUID for the property
    property_id := gen_random_uuid();
    
    -- Insert the demo property
    INSERT INTO public.properties (
        id,
        user_id,
        name,
        address,
        type,
        year_built,
        square_feet,
        value,
        insurability_score,
        details,
        created_at,
        updated_at
    ) VALUES (
        property_id,
        user_uuid,
        'Main Residence',
        '{"street": "1234 Main Street, Austin, TX 78701"}',
        'Single Family Home',
        2010,
        2800,
        450000.00,
        92,
        '{"bedrooms": 4, "bathrooms": 3, "lot_size": 0.25}',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN property_id;
END;
$$;


ALTER FUNCTION "public"."create_demo_property"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."extract_county_from_address"("p_address" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_county_name TEXT;
    v_address_upper TEXT;
BEGIN
    -- Convert to uppercase for easier matching
    v_address_upper := UPPER(p_address);
    
    -- Try to extract county name from address
    -- Pattern 1: "City, County County, FL"
    IF v_address_upper ~ ', [A-Z\s]+ COUNTY,' THEN
        v_county_name := REGEXP_REPLACE(v_address_upper, '.*,\s*([A-Z\s]+)\s+COUNTY,.*', '\1', 'g');
        v_county_name := TRIM(v_county_name);
    -- Pattern 2: Look for county names in the address
    ELSE
        -- Check each county name
        SELECT county_name INTO v_county_name
        FROM florida_counties
        WHERE v_address_upper LIKE '%' || UPPER(county_name) || '%'
        LIMIT 1;
    END IF;
    
    -- Clean up the county name
    IF v_county_name IS NOT NULL THEN
        -- Proper case the county name
        v_county_name := INITCAP(LOWER(v_county_name));
        -- Remove extra spaces
        v_county_name := REGEXP_REPLACE(v_county_name, '\s+', ' ', 'g');
    END IF;
    
    RETURN v_county_name;
END;
$$;


ALTER FUNCTION "public"."extract_county_from_address"("p_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fdot_merge_stage"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Create temp table for extracted data
  CREATE TEMP TABLE temp_extracted AS
  SELECT
    (feature->'properties'->>'PARCEL_ID')::TEXT AS parcel_id,
    (feature->'properties'->>'CO_NO')::NUMERIC AS co_no,
    (feature->'properties'->>'DOR_UC')::TEXT AS dor_uc,  -- Example extracted field
    (feature->'properties'->>'JV')::NUMERIC AS jv,      -- Example
    feature->'properties' AS properties,
    ST_GeomFromGeoJSON(feature -> 'geometry') AS geom
  FROM fdot_stage;

  -- Archive changes (insert old versions where updates occur)
  INSERT INTO fdot_history (parcel_id, co_no, properties, geom)
  SELECT p.parcel_id, p.co_no, p.properties, p.geom
  FROM fdot_parcels p
  INNER JOIN temp_extracted e ON p.parcel_id = e.parcel_id AND p.co_no = e.co_no
  WHERE p.properties IS DISTINCT FROM e.properties OR p.geom IS DISTINCT FROM e.geom;

  -- Bulk UPSERT into main
  INSERT INTO fdot_parcels (parcel_id, co_no, dor_uc, jv, properties, geom)
  SELECT parcel_id, co_no, dor_uc, jv, properties, geom FROM temp_extracted
  ON CONFLICT (parcel_id, co_no) DO UPDATE SET
    dor_uc = EXCLUDED.dor_uc,
    jv = EXCLUDED.jv,
    properties = EXCLUDED.properties,
    geom = EXCLUDED.geom,
    updated_at = CURRENT_TIMESTAMP;

  -- Clean up
  DROP TABLE temp_extracted;
  TRUNCATE fdot_stage;
END;
$$;


ALTER FUNCTION "public"."fdot_merge_stage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fdot_stage_insert_one"("j" json) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO fdot_stage (feature) VALUES (j::JSONB);
END;
$$;


ALTER FUNCTION "public"."fdot_stage_insert_one"("j" json) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_similar_properties"("p_property_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("property_id" "uuid", "similarity" double precision, "address" "text", "property_type" "public"."property_type", "square_footage" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_embedding vector(1536);
BEGIN
    -- Get the embedding for the source property
    SELECT property_embedding INTO v_embedding
    FROM properties
    WHERE id = p_property_id;
    
    IF v_embedding IS NULL THEN
        RETURN;
    END IF;
    
    -- Find similar properties
    RETURN QUERY
    SELECT 
        p.id,
        1 - (p.property_embedding <=> v_embedding) as similarity,
        p.address,
        p.property_type,
        p.square_footage
    FROM properties p
    WHERE p.id != p_property_id
    AND p.property_embedding IS NOT NULL
    ORDER BY p.property_embedding <=> v_embedding
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_similar_properties"("p_property_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_claim_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    year_prefix text;
    sequence_number int;
    new_claim_number text;
BEGIN
    -- Get current year
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(claim_number FROM 6 FOR 6) AS INTEGER
        )
    ), 0) + 1
    INTO sequence_number
    FROM public.claims
    WHERE claim_number LIKE year_prefix || '-%';
    
    -- Generate claim number: YYYY-NNNNNN
    new_claim_number := year_prefix || '-' || LPAD(sequence_number::text, 6, '0');
    
    NEW.claim_number := new_claim_number;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_claim_number"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."legal_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "version" "text" NOT NULL,
    "effective_date" "date" NOT NULL,
    "sha256_hash" "text" NOT NULL,
    "storage_url" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "legal_documents_effective_date_check" CHECK (("effective_date" >= CURRENT_DATE))
);


ALTER TABLE "public"."legal_documents" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_legal_documents"() RETURNS SETOF "public"."legal_documents"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT *
  FROM public.legal_documents
  WHERE is_active = true
  ORDER BY slug, effective_date DESC
$$;


ALTER FUNCTION "public"."get_active_legal_documents"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ai_usage_stats"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_start_date" timestamp with time zone DEFAULT ("now"() - '30 days'::interval), "p_end_date" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("total_analyses" bigint, "total_tokens" bigint, "total_cost_cents" bigint, "avg_confidence" double precision, "analyses_by_type" "jsonb", "models_used" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH stats_data AS (
        SELECT 
            a.*,
            m.model_name,
            COUNT(*) OVER (PARTITION BY a.analysis_type) as type_count,
            COUNT(*) OVER (PARTITION BY m.model_name) as model_count
        FROM ai_analyses a
        LEFT JOIN ai_models m ON a.model_id = m.id
        WHERE a.created_at BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR a.user_id = p_user_id)
    ),
    type_agg AS (
        SELECT jsonb_object_agg(analysis_type, type_count) as analyses_by_type
        FROM (SELECT DISTINCT analysis_type, type_count FROM stats_data WHERE analysis_type IS NOT NULL) t
    ),
    model_agg AS (
        SELECT jsonb_object_agg(model_name, model_count) as models_used  
        FROM (SELECT DISTINCT model_name, model_count FROM stats_data WHERE model_name IS NOT NULL) m
    )
    SELECT 
        COUNT(*)::BIGINT as total_analyses,
        COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
        COALESCE(SUM(cost_cents), 0)::BIGINT as total_cost_cents,
        AVG(confidence_score)::FLOAT as avg_confidence,
        COALESCE((SELECT analyses_by_type FROM type_agg), '{}'::jsonb),
        COALESCE((SELECT models_used FROM model_agg), '{}'::jsonb)
    FROM stats_data;
END;
$$;


ALTER FUNCTION "public"."get_ai_usage_stats"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."florida_counties" (
    "county_code" "text" NOT NULL,
    "id" "uuid" NOT NULL,
    "county_name" "text" NOT NULL,
    "county_seat" "text" NOT NULL,
    "region" "text" NOT NULL,
    "time_zone" "text" NOT NULL,
    "fema_region" "text",
    "coastal_county" boolean DEFAULT false,
    "building_dept_name" "text",
    "building_dept_phone" "text",
    "building_dept_email" "text",
    "building_dept_address" "text",
    "building_dept_website" "text",
    "permit_search_url" "text",
    "online_permit_system" boolean DEFAULT false,
    "property_appraiser_name" "text",
    "property_appraiser_phone" "text",
    "property_appraiser_email" "text",
    "property_appraiser_website" "text",
    "property_search_url" "text",
    "gis_url" "text",
    "parcel_data_url" "text",
    "tax_collector_name" "text",
    "tax_collector_phone" "text",
    "tax_collector_email" "text",
    "tax_collector_website" "text",
    "emergency_mgmt_name" "text",
    "emergency_mgmt_phone" "text",
    "emergency_mgmt_email" "text",
    "emergency_mgmt_website" "text",
    "emergency_hotline" "text",
    "citizens_service_center" "text",
    "flood_zone_maps_url" "text",
    "windstorm_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "building_code_version" "text",
    "wind_speed_requirement" integer,
    "flood_elevation_requirement" boolean DEFAULT false,
    "impact_glass_required" boolean DEFAULT false,
    "permit_expiration_days" integer DEFAULT 180,
    "permit_fee_structure" "jsonb" DEFAULT '{}'::"jsonb",
    "reinspection_fee" numeric(10,2),
    "hurricane_evacuation_zone_url" "text",
    "storm_surge_planning_zone_url" "text",
    "fema_flood_zone_url" "text",
    "claim_filing_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "supplemental_claim_deadline_days" integer DEFAULT 365,
    "aob_restrictions" "jsonb" DEFAULT '{}'::"jsonb",
    "contractor_license_search_url" "text",
    "contractor_license_verification_phone" "text",
    "unlicensed_contractor_limit" numeric(10,2) DEFAULT 2500.00,
    "population" integer,
    "households" integer,
    "median_home_value" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_verified_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."florida_counties" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_coastal_counties"() RETURNS SETOF "public"."florida_counties"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM florida_counties
    WHERE coastal_county = TRUE
    ORDER BY county_name;
END;
$$;


ALTER FUNCTION "public"."get_coastal_counties"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_coastal_counties"() IS 'Get all coastal counties in Florida';



CREATE OR REPLACE FUNCTION "public"."get_counties_by_region"("p_region" "text") RETURNS SETOF "public"."florida_counties"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM florida_counties
    WHERE region = p_region
    ORDER BY county_name;
END;
$$;


ALTER FUNCTION "public"."get_counties_by_region"("p_region" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_counties_by_region"("p_region" "text") IS 'Get all counties in a specific Florida region';



CREATE OR REPLACE FUNCTION "public"."get_county_building_requirements"("p_county_identifier" "text") RETURNS TABLE("county_name" "text", "building_code_version" "text", "wind_speed_requirement" integer, "flood_elevation_requirement" boolean, "impact_glass_required" boolean, "permit_expiration_days" integer, "coastal_county" boolean)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fc.county_name,
        fc.building_code_version,
        fc.wind_speed_requirement,
        fc.flood_elevation_requirement,
        fc.impact_glass_required,
        fc.permit_expiration_days,
        fc.coastal_county
    FROM get_florida_county(p_county_identifier) fc;
END;
$$;


ALTER FUNCTION "public"."get_county_building_requirements"("p_county_identifier" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_county_building_requirements"("p_county_identifier" "text") IS 'Get building code requirements for a specific county';



CREATE OR REPLACE FUNCTION "public"."get_county_for_property"("p_property_id" "uuid") RETURNS SETOF "public"."florida_counties"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT fc.*
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id;
END;
$$;


ALTER FUNCTION "public"."get_county_for_property"("p_property_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_county_for_property"("p_property_id" "uuid") IS 'Get the Florida county associated with a property';



CREATE OR REPLACE FUNCTION "public"."get_county_name"("fips_code" integer) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CASE fips_code
        WHEN 1 THEN 'Alachua'
        WHEN 3 THEN 'Baker'
        WHEN 5 THEN 'Bay'
        WHEN 7 THEN 'Bradford'
        WHEN 9 THEN 'Brevard'
        WHEN 11 THEN 'Broward'
        WHEN 13 THEN 'Calhoun'
        WHEN 15 THEN 'Charlotte'
        WHEN 17 THEN 'Citrus'
        WHEN 19 THEN 'Clay'
        WHEN 21 THEN 'Collier'
        WHEN 23 THEN 'Columbia'
        WHEN 27 THEN 'DeSoto'
        WHEN 29 THEN 'Dixie'
        WHEN 31 THEN 'Duval'
        WHEN 33 THEN 'Escambia'
        WHEN 35 THEN 'Flagler'
        WHEN 37 THEN 'Franklin'
        WHEN 39 THEN 'Gadsden'
        WHEN 41 THEN 'Gilchrist'
        WHEN 43 THEN 'Glades'
        WHEN 45 THEN 'Gulf'
        WHEN 47 THEN 'Hamilton'
        WHEN 49 THEN 'Hardee'
        WHEN 51 THEN 'Hendry'
        WHEN 53 THEN 'Hernando'
        WHEN 55 THEN 'Highlands'
        WHEN 57 THEN 'Hillsborough'
        WHEN 59 THEN 'Holmes'
        WHEN 61 THEN 'Indian River'
        WHEN 63 THEN 'Jackson'
        WHEN 65 THEN 'Jefferson'
        WHEN 67 THEN 'Lafayette'
        WHEN 69 THEN 'Lake'
        WHEN 71 THEN 'Lee'
        WHEN 73 THEN 'Leon'
        WHEN 75 THEN 'Levy'
        WHEN 77 THEN 'Liberty'
        WHEN 79 THEN 'Madison'
        WHEN 81 THEN 'Manatee'
        WHEN 83 THEN 'Marion'
        WHEN 85 THEN 'Martin'
        WHEN 86 THEN 'Miami-Dade'
        WHEN 87 THEN 'Monroe'
        WHEN 89 THEN 'Nassau'
        WHEN 91 THEN 'Okaloosa'
        WHEN 93 THEN 'Okeechobee'
        WHEN 95 THEN 'Orange'
        WHEN 97 THEN 'Osceola'
        WHEN 99 THEN 'Palm Beach'
        WHEN 101 THEN 'Pasco'
        WHEN 103 THEN 'Pinellas'
        WHEN 105 THEN 'Polk'
        WHEN 107 THEN 'Putnam'
        WHEN 109 THEN 'St. Johns'
        WHEN 111 THEN 'St. Lucie'
        WHEN 113 THEN 'Santa Rosa'
        WHEN 115 THEN 'Sarasota'
        WHEN 117 THEN 'Seminole'
        WHEN 119 THEN 'Sumter'
        WHEN 121 THEN 'Suwannee'
        WHEN 123 THEN 'Taylor'
        WHEN 125 THEN 'Union'
        WHEN 127 THEN 'Volusia'
        WHEN 129 THEN 'Wakulla'
        WHEN 131 THEN 'Walton'
        WHEN 133 THEN 'Washington'
        ELSE 'Unknown'
    END;
END;
$$;


ALTER FUNCTION "public"."get_county_name"("fips_code" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_county_property_appraiser"("p_county_identifier" "text") RETURNS TABLE("county_name" "text", "property_appraiser_website" "text", "property_search_url" "text", "gis_url" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fc.county_name,
        fc.property_appraiser_website,
        fc.property_search_url,
        fc.gis_url
    FROM get_florida_county(p_county_identifier) fc;
END;
$$;


ALTER FUNCTION "public"."get_county_property_appraiser"("p_county_identifier" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_county_property_appraiser"("p_county_identifier" "text") IS 'Get property appraiser contact info and URLs for a county';



CREATE OR REPLACE FUNCTION "public"."get_florida_county"("p_identifier" "text") RETURNS SETOF "public"."florida_counties"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM florida_counties
    WHERE county_code = p_identifier
       OR county_name ILIKE p_identifier
       OR county_name ILIKE p_identifier || '%'
       OR county_name ILIKE '%' || p_identifier || '%'
    ORDER BY 
        CASE 
            WHEN county_code = p_identifier THEN 1
            WHEN county_name = p_identifier THEN 2
            WHEN county_name ILIKE p_identifier || '%' THEN 3
            ELSE 4
        END
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_florida_county"("p_identifier" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_florida_county"("p_identifier" "text") IS 'Get Florida county by code, name, or partial match';



CREATE OR REPLACE FUNCTION "public"."get_my_claim_details"("p_claim_id" "uuid") RETURNS TABLE("claim_number" "text", "property_name" "text", "carrier_name" "text", "user_email" "text", "user_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  BEGIN
      -- Only return data if the user is authenticated
      IF auth.uid() IS NULL THEN
          RETURN;
      END IF;

      RETURN QUERY
      SELECT
          c.claim_number,
          prop.name as property_name,
          pol.carrier_name,
          u.email as user_email,
          u.raw_user_meta_data->>'full_name' as user_name
      FROM public.claims c
      JOIN public.properties prop ON c.property_id = prop.id
      JOIN public.policies pol ON c.policy_id = pol.id
      JOIN auth.users u ON c.user_id = u.id
      WHERE c.id = p_claim_id
      AND c.user_id = auth.uid();
  END;
  $$;


ALTER FUNCTION "public"."get_my_claim_details"("p_claim_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_parcel_counts_by_county"() RETURNS TABLE("county_name" "text", "county_code" "text", "parcel_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.county_name,
        c.county_code,
        COUNT(p.id) as parcel_count
    FROM florida_counties c
    LEFT JOIN florida_parcels p ON c.id = p.county_id
    GROUP BY c.county_name, c.county_code
    ORDER BY c.county_name;
END;
$$;


ALTER FUNCTION "public"."get_parcel_counts_by_county"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_parcel_stats"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
  result json;
begin
  with source_counts as (
    select 
      source,
      count(*) as count
    from external.fl_parcels_raw
    group by source
  ),
  county_counts as (
    select 
      county_fips,
      count(*) as count
    from external.fl_parcels_raw
    group by county_fips
  ),
  latest_update as (
    select max(download_ts) as last_updated
    from external.fl_parcels_raw
  )
  select json_build_object(
    'total_parcels', (select count(*) from external.fl_parcels_raw),
    'by_source', (
      select json_object_agg(source, count)
      from source_counts
    ),
    'by_county', (
      select json_object_agg(county_fips, count)
      from county_counts
    ),
    'last_updated', (select last_updated from latest_update)
  ) into result;
  
  return result;
end;
$$;


ALTER FUNCTION "public"."get_parcel_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_parcel_stats_by_county"("p_county_code" "text" DEFAULT NULL::"text") RETURNS TABLE("county_name" "text", "total_parcels" bigint, "total_just_value" double precision, "avg_just_value" double precision, "total_land_value" double precision, "residential_units" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.county_name,
        COUNT(p.id)::BIGINT as total_parcels,
        COALESCE(SUM(p.jv), 0)::DOUBLE PRECISION as total_just_value,
        COALESCE(AVG(p.jv), 0)::DOUBLE PRECISION as avg_just_value,
        COALESCE(SUM(p.lnd_val), 0)::DOUBLE PRECISION as total_land_value,
        COALESCE(SUM(p.no_res_unt), 0)::BIGINT as residential_units
    FROM florida_counties c
    LEFT JOIN florida_parcels p ON c.id = p.county_id
    WHERE p_county_code IS NULL OR c.county_code = p_county_code
    GROUP BY c.county_name
    ORDER BY c.county_name;
END;
$$;


ALTER FUNCTION "public"."get_parcel_stats_by_county"("p_county_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_parcel_with_county"("p_parcel_id" character varying) RETURNS TABLE("parcel_id" character varying, "owner_name" "text", "physical_address" "text", "just_value" double precision, "land_value" double precision, "county_name" "text", "property_appraiser_url" "text", "gis_url" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p."PARCEL_ID",
        p."OWN_NAME" as owner_name,
        CONCAT(p."PHY_ADDR1", ' ', p."PHY_CITY") as physical_address,
        p."JV" as just_value,
        p."LND_VAL" as land_value,
        c.county_name,
        c.property_search_url as property_appraiser_url,
        c.gis_url
    FROM florida_parcels p
    LEFT JOIN florida_counties c ON p.county_id = c.id
    WHERE p."PARCEL_ID" = p_parcel_id;
END;
$$;


ALTER FUNCTION "public"."get_parcel_with_county"("p_parcel_id" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_parcels_column_stats"() RETURNS TABLE("category" "text", "column_count" bigint, "example_columns" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        category,
        COUNT(*) as column_count,
        STRING_AGG(column_name, ', ' ORDER BY column_name) 
            FILTER (WHERE row_num <= 3) as example_columns
    FROM (
        SELECT 
            category,
            column_name,
            ROW_NUMBER() OVER (PARTITION BY category ORDER BY column_name) as row_num
        FROM florida_parcels_column_analysis
    ) t
    GROUP BY category
    ORDER BY column_count DESC;
END;
$$;


ALTER FUNCTION "public"."get_parcels_column_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") RETURNS TABLE("requirement_type" "text", "requirement_value" "text", "requirement_details" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Wind Speed Requirement' as requirement_type,
        fc.wind_speed_requirement || ' mph' as requirement_value,
        jsonb_build_object(
            'coastal_county', fc.coastal_county,
            'region', fc.region
        ) as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id
    
    UNION ALL
    
    SELECT 
        'Impact Glass Required' as requirement_type,
        CASE WHEN fc.impact_glass_required THEN 'Yes' ELSE 'No' END as requirement_value,
        jsonb_build_object(
            'wind_speed', fc.wind_speed_requirement
        ) as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id
    
    UNION ALL
    
    SELECT 
        'Flood Elevation Required' as requirement_type,
        CASE WHEN fc.flood_elevation_requirement THEN 'Yes' ELSE 'No' END as requirement_value,
        jsonb_build_object(
            'flood_zone_maps_url', fc.flood_zone_maps_url
        ) as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id
    
    UNION ALL
    
    SELECT 
        'Building Code Version' as requirement_type,
        fc.building_code_version as requirement_value,
        NULL as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id
    
    UNION ALL
    
    SELECT 
        'Permit Expiration' as requirement_type,
        fc.permit_expiration_days || ' days' as requirement_value,
        NULL as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id;
END;
$$;


ALTER FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") IS 'Get all county-specific building and insurance requirements for a property';



CREATE OR REPLACE FUNCTION "public"."get_raw_data_counts_by_source"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(t)
    FROM (
      SELECT source, count(*) as record_count
      FROM external_raw_fl.property_data
      GROUP BY source
    ) t
  );
END;
$$;


ALTER FUNCTION "public"."get_raw_data_counts_by_source"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    error_detail TEXT;
    user_metadata JSONB;
BEGIN
    -- Log start of user creation
    PERFORM public.log_user_creation_debug(
        NEW.id,
        'trigger_start',
        true,
        NULL,
        jsonb_build_object(
            'email', NEW.email,
            'created_at', NEW.created_at,
            'raw_user_meta_data', NEW.raw_user_meta_data
        )
    );

    -- Extract user metadata for easier access
    user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

    -- Try to insert into user_profiles table
    BEGIN
        INSERT INTO public.user_profiles (
            id,
            first_name,
            last_name,
            phone,
            avatar_url,
            x_handle,
            is_x_connected,
            member_since
        )
        VALUES (
            NEW.id,
            COALESCE(user_metadata->>'firstName', ''),
            COALESCE(user_metadata->>'lastName', ''),
            COALESCE(user_metadata->>'phone', ''),
            COALESCE(user_metadata->>'avatarUrl', ''),
            COALESCE(user_metadata->>'xHandle', ''),
            COALESCE((user_metadata->>'isXConnected')::boolean, false),
            NOW()
        );

        -- Log successful profile creation
        PERFORM public.log_user_creation_debug(
            NEW.id,
            'user_profile_created',
            true,
            NULL,
            jsonb_build_object(
                'first_name', COALESCE(user_metadata->>'firstName', ''),
                'last_name', COALESCE(user_metadata->>'lastName', ''),
                'phone', COALESCE(user_metadata->>'phone', '')
            )
        );

    EXCEPTION 
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_detail = PG_EXCEPTION_DETAIL;
            
            -- Log profile creation error
            PERFORM public.log_user_creation_debug(
                NEW.id,
                'user_profile_error',
                false,
                SQLSTATE || ': ' || SQLERRM,
                jsonb_build_object(
                    'error_detail', error_detail,
                    'user_metadata', user_metadata
                )
            );
            
            -- Don't fail the entire user creation for profile errors
            RAISE WARNING 'Failed to create user profile for user %: % (Detail: %)', NEW.id, SQLERRM, error_detail;
    END;

    -- Try to insert default plan if table exists
    BEGIN
        INSERT INTO public.user_plans (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;

        -- Log successful plan creation
        PERFORM public.log_user_creation_debug(
            NEW.id,
            'user_plan_created',
            true,
            NULL,
            NULL
        );

    EXCEPTION 
        WHEN undefined_table THEN
            -- user_plans table doesn't exist yet, log but don't fail
            PERFORM public.log_user_creation_debug(
                NEW.id,
                'user_plan_skipped',
                true,
                'user_plans table does not exist',
                NULL
            );
            
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_detail = PG_EXCEPTION_DETAIL;
            
            -- Log plan creation error but don't fail user creation
            PERFORM public.log_user_creation_debug(
                NEW.id,
                'user_plan_error',
                false,
                SQLSTATE || ': ' || SQLERRM,
                jsonb_build_object('error_detail', error_detail)
            );
            
            RAISE WARNING 'Failed to create user plan for user %: % (Detail: %)', NEW.id, SQLERRM, error_detail;
    END;

    -- Log successful completion
    PERFORM public.log_user_creation_debug(
        NEW.id,
        'trigger_complete',
        true,
        NULL,
        NULL
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_profile_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update the auth user's metadata when profile is updated
  UPDATE auth.users 
  SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object(
      'firstName', NEW.first_name,
      'lastName', NEW.last_name,
      'phone', NEW.phone
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_profile_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_florida_parcels_uppercase"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_county_fips INTEGER;
BEGIN
    -- Derive county_fips from CO_NO if not provided
    IF NEW.county_fips IS NULL AND NEW."CO_NO" IS NOT NULL THEN
        IF NEW."CO_NO" >= 1 AND NEW."CO_NO" <= 67 THEN
            v_county_fips := 12000 + (NEW."CO_NO"::INTEGER * 2) - 1;
        ELSE
            v_county_fips := NULL;
        END IF;
    ELSE
        v_county_fips := NEW.county_fips;
    END IF;

    -- Check if parcel exists
    IF EXISTS (SELECT 1 FROM florida_parcels WHERE parcel_id = NEW."PARCEL_ID") THEN
        -- Update existing record
        UPDATE florida_parcels SET
            co_no = NEW."CO_NO",
            county_fips = v_county_fips,
            file_t = NEW."FILE_T",
            asmnt_yr = NEW."ASMNT_YR",
            jv = NEW."JV",
            lnd_val = NEW."LND_VAL",
            own_name = NEW."OWN_NAME",
            phy_addr1 = NEW."PHY_ADDR1",
            phy_city = NEW."PHY_CITY",
            updated_at = NOW()
        WHERE parcel_id = NEW."PARCEL_ID";
    ELSE
        -- Insert new record
        INSERT INTO florida_parcels (
            county_fips, co_no, parcel_id, file_t, asmnt_yr, bas_strt, atv_strt,
            grp_no, dor_uc, pa_uc, spass_cd, jv, jv_chng, jv_chng_cd,
            av_sd, av_nsd, tv_sd, tv_nsd, jv_hmstd, av_hmstd, jv_non_hms,
            av_non_hms, jv_resd_no, av_resd_no, jv_class_u, av_class_u,
            jv_h2o_rec, av_h2o_rec, jv_consrv_, av_consrv_, jv_hist_co,
            av_hist_co, jv_hist_si, av_hist_si, jv_wrkng_w, av_wrkng_w,
            nconst_val, del_val, par_splt, distr_cd, distr_yr, lnd_val,
            lnd_unts_c, no_lnd_unt, lnd_sqfoot, dt_last_in, imp_qual,
            const_clas, eff_yr_blt, act_yr_blt, tot_lvg_ar, no_buldng,
            no_res_unt, spec_feat_, m_par_sal1, qual_cd1, vi_cd1,
            sale_prc1, sale_yr1, sale_mo1, or_book1, or_page1, clerk_no1,
            s_chng_cd1, m_par_sal2, qual_cd2, vi_cd2, sale_prc2, sale_yr2,
            sale_mo2, or_book2, or_page2, clerk_no2, s_chng_cd2, own_name,
            own_addr1, own_addr2, own_city, own_state, own_zipcd, own_state_,
            fidu_name, fidu_addr1, fidu_addr2, fidu_city, fidu_state,
            fidu_zipcd, fidu_cd, s_legal, app_stat, co_app_sta, mkt_ar,
            nbrhd_cd, public_lnd, tax_auth_c, twn, rng, sec, census_bk,
            phy_addr1, phy_addr2, phy_city, phy_zipcd, alt_key, ass_trnsfr,
            prev_hmstd, ass_dif_tr, cono_prv_h, parcel_id_, yr_val_trn,
            seq_no, rs_id, mp_id, state_par_, spc_cir_cd, spc_cir_yr,
            spc_cir_tx, shape_length, shape_area, geometry_wkt
        ) VALUES (
            v_county_fips,
            NEW."CO_NO", NEW."PARCEL_ID", NEW."FILE_T", NEW."ASMNT_YR", NEW."BAS_STRT", NEW."ATV_STRT",
            NEW."GRP_NO", NEW."DOR_UC", NEW."PA_UC", NEW."SPASS_CD", NEW."JV", NEW."JV_CHNG", NEW."JV_CHNG_CD",
            NEW."AV_SD", NEW."AV_NSD", NEW."TV_SD", NEW."TV_NSD", NEW."JV_HMSTD", NEW."AV_HMSTD", NEW."JV_NON_HMS",
            NEW."AV_NON_HMS", NEW."JV_RESD_NO", NEW."AV_RESD_NO", NEW."JV_CLASS_U", NEW."AV_CLASS_U",
            NEW."JV_H2O_REC", NEW."AV_H2O_REC", NEW."JV_CONSRV_", NEW."AV_CONSRV_", NEW."JV_HIST_CO",
            NEW."AV_HIST_CO", NEW."JV_HIST_SI", NEW."AV_HIST_SI", NEW."JV_WRKNG_W", NEW."AV_WRKNG_W",
            NEW."NCONST_VAL", NEW."DEL_VAL", NEW."PAR_SPLT", NEW."DISTR_CD", NEW."DISTR_YR", NEW."LND_VAL",
            NEW."LND_UNTS_C", NEW."NO_LND_UNT", NEW."LND_SQFOOT", NEW."DT_LAST_IN", NEW."IMP_QUAL",
            NEW."CONST_CLAS", NEW."EFF_YR_BLT", NEW."ACT_YR_BLT", NEW."TOT_LVG_AR", NEW."NO_BULDNG",
            NEW."NO_RES_UNT", NEW."SPEC_FEAT_", NEW."M_PAR_SAL1", NEW."QUAL_CD1", NEW."VI_CD1",
            NEW."SALE_PRC1", NEW."SALE_YR1", NEW."SALE_MO1", NEW."OR_BOOK1", NEW."OR_PAGE1", NEW."CLERK_NO1",
            NEW."S_CHNG_CD1", NEW."M_PAR_SAL2", NEW."QUAL_CD2", NEW."VI_CD2", NEW."SALE_PRC2", NEW."SALE_YR2",
            NEW."SALE_MO2", NEW."OR_BOOK2", NEW."OR_PAGE2", NEW."CLERK_NO2", NEW."S_CHNG_CD2", NEW."OWN_NAME",
            NEW."OWN_ADDR1", NEW."OWN_ADDR2", NEW."OWN_CITY", NEW."OWN_STATE", NEW."OWN_ZIPCD", NEW."OWN_STATE_",
            NEW."FIDU_NAME", NEW."FIDU_ADDR1", NEW."FIDU_ADDR2", NEW."FIDU_CITY", NEW."FIDU_STATE",
            NEW."FIDU_ZIPCD", NEW."FIDU_CD", NEW."S_LEGAL", NEW."APP_STAT", NEW."CO_APP_STA", NEW."MKT_AR",
            NEW."NBRHD_CD", NEW."PUBLIC_LND", NEW."TAX_AUTH_C", NEW."TWN", NEW."RNG", NEW."SEC", NEW."CENSUS_BK",
            NEW."PHY_ADDR1", NEW."PHY_ADDR2", NEW."PHY_CITY", NEW."PHY_ZIPCD", NEW."ALT_KEY", NEW."ASS_TRNSFR",
            NEW."PREV_HMSTD", NEW."ASS_DIF_TR", NEW."CONO_PRV_H", NEW."PARCEL_ID_", NEW."YR_VAL_TRN",
            NEW."SEQ_NO", NEW."RS_ID", NEW."MP_ID", NEW."STATE_PAR_", NEW."SPC_CIR_CD", NEW."SPC_CIR_YR",
            NEW."SPC_CIR_TX", NEW."Shape_Length", NEW."Shape_Area", NEW."geometry_wkt"
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_florida_parcels_uppercase"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_parcel_to_county"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Link to county based on county_fips
    IF NEW.county_fips IS NOT NULL AND NEW.county_id IS NULL THEN
        SELECT id INTO NEW.county_id
        FROM florida_counties
        WHERE county_code = LPAD(NEW.county_fips::TEXT, 5, '0')
        LIMIT 1;
    END IF;
    
    -- Derive county_fips from CO_NO if not provided
    IF NEW.county_fips IS NULL AND NEW."CO_NO" IS NOT NULL THEN
        IF NEW."CO_NO" >= 1 AND NEW."CO_NO" <= 67 THEN
            NEW.county_fips := 12000 + (NEW."CO_NO"::INTEGER * 2) - 1;
            -- Also link to county
            SELECT id INTO NEW.county_id
            FROM florida_counties
            WHERE county_code = LPAD(NEW.county_fips::TEXT, 5, '0')
            LIMIT 1;
        END IF;
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."link_parcel_to_county"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean DEFAULT true, "p_failure_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO login_activity (
        user_id,
        ip_address,
        user_agent,
        success,
        failure_reason
    ) VALUES (
        p_user_id,
        p_ip_address,
        p_user_agent,
        p_success,
        p_failure_reason
    );
END;
$$;


ALTER FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") IS 'Logs user login attempts with IP address, user agent, and success/failure status';



CREATE OR REPLACE FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text" DEFAULT NULL::"text", "p_resource_id" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_metadata
    );
END;
$$;


ALTER FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_creation_debug"("p_user_id" "uuid", "p_step" "text", "p_success" boolean, "p_error_message" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.debug_user_creation_logs (
        user_id, step, success, error_message, metadata, created_at
    ) VALUES (
        p_user_id, p_step, p_success, p_error_message, p_metadata, NOW()
    );
END;
$$;


ALTER FUNCTION "public"."log_user_creation_debug"("p_user_id" "uuid", "p_step" "text", "p_success" boolean, "p_error_message" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."max_objectid_for_county"("cnty_layer" integer) RETURNS TABLE("max" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  return query
  select max((attrs->>'objectid')::int)
  from external.fl_parcels_raw
  where source = 'fdot'
    and (attrs->>'layerid')::int = cnty_layer;
end $$;


ALTER FUNCTION "public"."max_objectid_for_county"("cnty_layer" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_license_into_contractor"() RETURNS "void"
    LANGUAGE "sql"
    AS $$
insert into contractor_connection.contractor_companies (
    license_number,
    company_name,
    license_type,
    license_status,
    license_issued,
    license_expires,
    last_sync_at
)
select
    raw.license_number,
    coalesce(raw.dba_name, raw.qualifier_name),
    raw.license_type,
    raw.status_primary,
    raw.issue_date,
    raw.expiry_date,
    now()
from contractor_license_raw as raw
on conflict (license_number)
do update set
  company_name      = excluded.company_name,
  license_type      = excluded.license_type,
  license_status    = excluded.license_status,
  license_issued    = excluded.license_issued,
  license_expires   = excluded.license_expires,
  last_sync_at      = excluded.last_sync_at;
$$;


ALTER FUNCTION "public"."merge_license_into_contractor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."needs_reaccept"("uid" "uuid") RETURNS SETOF "public"."legal_documents"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT ld.*
  FROM public.legal_documents ld
  WHERE ld.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_legal_acceptance ula
      WHERE ula.user_id = uid
        AND ula.legal_id = ld.id
        AND ula.revoked_at IS NULL
    )
$$;


ALTER FUNCTION "public"."needs_reaccept"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_scraper_webhook"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    payload json;
BEGIN
    -- Only trigger for new pending requests
    IF NEW.status = 'pending' AND (TG_OP = 'INSERT' OR OLD.status != 'pending') THEN
        payload = json_build_object(
            'id', NEW.id,
            'source', NEW.source,
            'last_object_id', NEW.last_object_id,
            'webhook_url', 'https://your-external-scraper.vercel.app/api/scrape'
        );
        
        -- This would typically call pg_net to make HTTP request
        -- For now, we'll use NOTIFY to simulate
        PERFORM pg_notify('scraper_request', payload::text);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_scraper_webhook"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_backdating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.effective_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot set effective_date in the past';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_backdating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_county_scraping"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result json;
BEGIN
    -- Get last run info and queue new requests
    INSERT INTO public.scraper_queue (source, last_object_id)
    SELECT 
        s.source,
        COALESCE(sr.last_object_id, 0)
    FROM (VALUES 
        ('fl_charlotte_county'),
        ('fl_lee_county'),
        ('fl_sarasota_county')
    ) AS s(source)
    LEFT JOIN public.scraper_runs sr ON s.source = sr.source
    ON CONFLICT DO NOTHING;
    
    -- Return queued items
    SELECT json_agg(row_to_json(q)) INTO result
    FROM (
        SELECT id, source, status, created_at 
        FROM public.scraper_queue 
        WHERE created_at > now() - interval '1 minute'
    ) q;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;


ALTER FUNCTION "public"."queue_county_scraping"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_acceptance_id UUID;
BEGIN
  INSERT INTO public.user_legal_acceptance (
    user_id,
    legal_id,
    ip_address,
    user_agent,
    signature_data
  ) VALUES (
    p_user_id,
    p_legal_id,
    p_ip_address,
    p_user_agent,
    p_signature_data
  ) ON CONFLICT (user_id, legal_id) 
  DO UPDATE SET
    accepted_at = NOW(),
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent,
    signature_data = EXCLUDED.signature_data,
    revoked_at = NULL
  RETURNING user_id INTO v_acceptance_id;
  
  RETURN v_acceptance_id;
END;
$$;


ALTER FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_parcels_view"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  refresh materialized view concurrently public.parcels;
end $$;


ALTER FUNCTION "public"."refresh_parcels_view"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_floir_data"("query_embedding" "public"."vector", "data_types" "public"."floir_data_type"[] DEFAULT NULL::"public"."floir_data_type"[], "match_threshold" double precision DEFAULT 0.5, "match_count" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "data_type" "public"."floir_data_type", "primary_key" "text", "normalized_data" "jsonb", "source_url" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.data_type,
        f.primary_key,
        f.normalized_data,
        f.source_url,
        1 - (f.embedding <=> query_embedding) as similarity
    FROM public.floir_data f
    WHERE 
        f.embedding IS NOT NULL
        AND (data_types IS NULL OR f.data_type = ANY(data_types))
        AND 1 - (f.embedding <=> query_embedding) > match_threshold
    ORDER BY f.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."search_floir_data"("query_embedding" "public"."vector", "data_types" "public"."floir_data_type"[], "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_parcels_by_owner"("p_owner_name" "text", "p_county_fips" integer DEFAULT NULL::integer, "p_limit" integer DEFAULT 100) RETURNS TABLE("parcel_id" character varying, "owner_name" "text", "physical_address" "text", "city" character varying, "county_name" "text", "just_value" double precision, "assessment_year" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p."PARCEL_ID",
        p."OWN_NAME" as owner_name,
        p."PHY_ADDR1" as physical_address,
        p."PHY_CITY" as city,
        c.county_name,
        p."JV" as just_value,
        p."ASMNT_YR" as assessment_year
    FROM florida_parcels p
    LEFT JOIN florida_counties c ON p.county_id = c.id
    WHERE UPPER(p."OWN_NAME") LIKE UPPER('%' || p_owner_name || '%')
    AND (p_county_fips IS NULL OR p.county_fips = p_county_fips)
    ORDER BY p."OWN_NAME", p."JV" DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_parcels_by_owner"("p_owner_name" "text", "p_county_fips" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_updated_at"() IS 'Universal function to update the updated_at timestamp on any table';



CREATE OR REPLACE FUNCTION "public"."suggest_type_optimizations"() RETURNS TABLE("column_name" "text", "current_type" "text", "suggested_type" "text", "reason" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    -- Year columns that are FLOAT but should be INTEGER
    SELECT 
        a.attname::TEXT,
        'FLOAT'::TEXT as current_type,
        'INTEGER'::TEXT as suggested_type,
        'Year values should be whole numbers'::TEXT as reason
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'florida_parcels'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND pg_catalog.format_type(a.atttypid, a.atttypmod) = 'double precision'
    AND (a.attname LIKE '%YR%' OR a.attname LIKE '%_MO%' OR 
         a.attname IN ('CO_NO', 'NO_BULDNG', 'NO_RES_UNT', 'SEC'))
    
    UNION ALL
    
    -- ZIP code columns that are FLOAT but should be VARCHAR
    SELECT 
        a.attname::TEXT,
        'FLOAT'::TEXT,
        'VARCHAR(10)'::TEXT,
        'ZIP codes should be text to preserve leading zeros'::TEXT
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'florida_parcels'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND pg_catalog.format_type(a.atttypid, a.atttypmod) = 'double precision'
    AND a.attname LIKE '%ZIPCD%'
    
    ORDER BY column_name;
END;
$$;


ALTER FUNCTION "public"."suggest_type_optimizations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_florida_parcels_staging"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert from staging to main table with proper conflict resolution
    INSERT INTO florida_parcels (
        parcel_id, co_no, asmnt_yr, jv, av_sd, av_nsd, tv_sd, tv_nsd,
        dor_uc, pa_uc, land_val, bldg_val, tot_val, act_yr_blt, eff_yr_blt,
        tot_lvg_ar, land_sqfoot, no_buldng, no_res_unt, own_name, own_addr1,
        own_addr2, own_city, own_state, own_zipcd, phy_addr1, phy_addr2,
        phy_city, phy_zipcd, s_legal, twn, rng, sec, sale_prc1, sale_yr1,
        sale_mo1, sale_prc2, sale_yr2, sale_mo2, nbrhd_cd, census_bk, mkt_ar,
        data_source, own_state2, own_zipcda, nbrhd_cd1, nbrhd_cd2, nbrhd_cd3,
        nbrhd_cd4, dor_cd1, dor_cd2, dor_cd3, dor_cd4, ag_val, qual_cd2_,
        vi_cd2_, sale_prc2_, sale_yr2_, sale_mo2_, or_book2_, or_page2_,
        clerk_n_2, imp_val, const_val, distr_no, front, depth, cap, cape_shpa,
        latitude, longitude, pin_1, pin_2, half_cd, twp, sub, blk, lot,
        plat_book, plat_page
    )
    SELECT
        NULLIF(trim(parcel_id), ''),
        CASE WHEN trim(co_no) IN ('', ' ') THEN NULL ELSE co_no::integer END,
        CASE WHEN trim(asmnt_yr) IN ('', ' ') THEN NULL ELSE asmnt_yr::integer END,
        NULLIF(trim(jv), ''),
        CASE WHEN trim(av_sd) IN ('', ' ') THEN NULL ELSE av_sd::numeric END,
        CASE WHEN trim(av_nsd) IN ('', ' ') THEN NULL ELSE av_nsd::numeric END,
        CASE WHEN trim(tv_sd) IN ('', ' ') THEN NULL ELSE tv_sd::numeric END,
        CASE WHEN trim(tv_nsd) IN ('', ' ') THEN NULL ELSE tv_nsd::numeric END,
        NULLIF(trim(dor_uc), ''),
        NULLIF(trim(pa_uc), ''),
        CASE WHEN trim(land_val) IN ('', ' ') THEN NULL ELSE land_val::numeric END,
        CASE WHEN trim(bldg_val) IN ('', ' ') THEN NULL ELSE bldg_val::numeric END,
        CASE WHEN trim(tot_val) IN ('', ' ') THEN NULL ELSE tot_val::numeric END,
        CASE WHEN trim(act_yr_blt) IN ('', ' ') THEN NULL ELSE act_yr_blt::integer END,
        CASE WHEN trim(eff_yr_blt) IN ('', ' ') THEN NULL ELSE eff_yr_blt::integer END,
        CASE WHEN trim(tot_lvg_ar) IN ('', ' ') THEN NULL ELSE tot_lvg_ar::numeric END,
        CASE WHEN trim(land_sqfoot) IN ('', ' ') THEN NULL ELSE land_sqfoot::numeric END,
        CASE WHEN trim(no_buldng) IN ('', ' ') THEN NULL ELSE no_buldng::integer END,
        CASE WHEN trim(no_res_unt) IN ('', ' ') THEN NULL ELSE no_res_unt::integer END,
        NULLIF(trim(own_name), ''),
        NULLIF(trim(own_addr1), ''),
        NULLIF(trim(own_addr2), ''),
        NULLIF(trim(own_city), ''),
        NULLIF(trim(own_state), ''),
        NULLIF(trim(own_zipcd), ''),
        NULLIF(trim(phy_addr1), ''),
        NULLIF(trim(phy_addr2), ''),
        NULLIF(trim(phy_city), ''),
        NULLIF(trim(phy_zipcd), ''),
        NULLIF(trim(s_legal), ''),
        NULLIF(trim(twn), ''),
        NULLIF(trim(rng), ''),
        NULLIF(trim(sec), ''),
        CASE WHEN trim(sale_prc1) IN ('', ' ') THEN NULL ELSE sale_prc1::numeric END,
        CASE WHEN trim(sale_yr1) IN ('', ' ') THEN NULL ELSE sale_yr1::integer END,
        NULLIF(trim(sale_mo1), ''),
        CASE WHEN trim(sale_prc2) IN ('', ' ') THEN NULL ELSE sale_prc2::numeric END,
        CASE WHEN trim(sale_yr2) IN ('', ' ') THEN NULL ELSE sale_yr2::integer END,
        NULLIF(trim(sale_mo2), ''),
        NULLIF(trim(nbrhd_cd), ''),
        NULLIF(trim(census_bk), ''),
        NULLIF(trim(mkt_ar), ''),
        COALESCE(NULLIF(trim(data_source), ''), 'CSV_IMPORT'),
        NULLIF(trim(own_state2), ''),
        NULLIF(trim(own_zipcda), ''),
        NULLIF(trim(nbrhd_cd1), ''),
        NULLIF(trim(nbrhd_cd2), ''),
        NULLIF(trim(nbrhd_cd3), ''),
        NULLIF(trim(nbrhd_cd4), ''),
        NULLIF(trim(dor_cd1), ''),
        NULLIF(trim(dor_cd2), ''),
        NULLIF(trim(dor_cd3), ''),
        NULLIF(trim(dor_cd4), ''),
        CASE WHEN trim(ag_val) IN ('', ' ') THEN NULL ELSE ag_val::numeric END,
        NULLIF(trim(qual_cd2_), ''),
        NULLIF(trim(vi_cd2_), ''),
        CASE WHEN trim(sale_prc2_) IN ('', ' ') THEN NULL ELSE sale_prc2_::numeric END,
        CASE WHEN trim(sale_yr2_) IN ('', ' ') THEN NULL ELSE sale_yr2_::integer END,
        CASE WHEN trim(sale_mo2_) IN ('', ' ') THEN NULL ELSE sale_mo2_::integer END,
        NULLIF(trim(or_book2_), ''),
        NULLIF(trim(or_page2_), ''),
        NULLIF(trim(clerk_n_2), ''),
        CASE WHEN trim(imp_val) IN ('', ' ') THEN NULL ELSE imp_val::numeric END,
        CASE WHEN trim(const_val) IN ('', ' ') THEN NULL ELSE const_val::numeric END,
        NULLIF(trim(distr_no), ''),
        CASE WHEN trim(front) IN ('', ' ') THEN NULL ELSE front::numeric END,
        CASE WHEN trim(depth) IN ('', ' ') THEN NULL ELSE depth::numeric END,
        NULLIF(trim(cap), ''),
        NULLIF(trim(cape_shpa), ''),
        CASE WHEN trim(latitude) IN ('', ' ') THEN NULL ELSE latitude::numeric END,
        CASE WHEN trim(longitude) IN ('', ' ') THEN NULL ELSE longitude::numeric END,
        NULLIF(trim(pin_1), ''),
        NULLIF(trim(pin_2), ''),
        NULLIF(trim(half_cd), ''),
        NULLIF(trim(twp), ''),
        NULLIF(trim(sub), ''),
        NULLIF(trim(blk), ''),
        NULLIF(trim(lot), ''),
        NULLIF(trim(plat_book), ''),
        NULLIF(trim(plat_page), '')
    FROM florida_parcels_staging
    WHERE NULLIF(trim(parcel_id), '') IS NOT NULL
    ON CONFLICT (parcel_id) DO UPDATE SET
        co_no = EXCLUDED.co_no,
        asmnt_yr = EXCLUDED.asmnt_yr,
        jv = EXCLUDED.jv,
        av_sd = EXCLUDED.av_sd,
        av_nsd = EXCLUDED.av_nsd,
        tv_sd = EXCLUDED.tv_sd,
        tv_nsd = EXCLUDED.tv_nsd,
        dor_uc = EXCLUDED.dor_uc,
        pa_uc = EXCLUDED.pa_uc,
        land_val = EXCLUDED.land_val,
        bldg_val = EXCLUDED.bldg_val,
        tot_val = EXCLUDED.tot_val,
        act_yr_blt = EXCLUDED.act_yr_blt,
        eff_yr_blt = EXCLUDED.eff_yr_blt,
        tot_lvg_ar = EXCLUDED.tot_lvg_ar,
        land_sqfoot = EXCLUDED.land_sqfoot,
        no_buldng = EXCLUDED.no_buldng,
        no_res_unt = EXCLUDED.no_res_unt,
        own_name = EXCLUDED.own_name,
        own_addr1 = EXCLUDED.own_addr1,
        own_addr2 = EXCLUDED.own_addr2,
        own_city = EXCLUDED.own_city,
        own_state = EXCLUDED.own_state,
        own_zipcd = EXCLUDED.own_zipcd,
        phy_addr1 = EXCLUDED.phy_addr1,
        phy_addr2 = EXCLUDED.phy_addr2,
        phy_city = EXCLUDED.phy_city,
        phy_zipcd = EXCLUDED.phy_zipcd,
        s_legal = EXCLUDED.s_legal,
        twn = EXCLUDED.twn,
        rng = EXCLUDED.rng,
        sec = EXCLUDED.sec,
        sale_prc1 = EXCLUDED.sale_prc1,
        sale_yr1 = EXCLUDED.sale_yr1,
        sale_mo1 = EXCLUDED.sale_mo1,
        sale_prc2 = EXCLUDED.sale_prc2,
        sale_yr2 = EXCLUDED.sale_yr2,
        sale_mo2 = EXCLUDED.sale_mo2,
        nbrhd_cd = EXCLUDED.nbrhd_cd,
        census_bk = EXCLUDED.census_bk,
        mkt_ar = EXCLUDED.mkt_ar,
        data_source = EXCLUDED.data_source,
        own_state2 = EXCLUDED.own_state2,
        own_zipcda = EXCLUDED.own_zipcda,
        nbrhd_cd1 = EXCLUDED.nbrhd_cd1,
        nbrhd_cd2 = EXCLUDED.nbrhd_cd2,
        nbrhd_cd3 = EXCLUDED.nbrhd_cd3,
        nbrhd_cd4 = EXCLUDED.nbrhd_cd4,
        dor_cd1 = EXCLUDED.dor_cd1,
        dor_cd2 = EXCLUDED.dor_cd2,
        dor_cd3 = EXCLUDED.dor_cd3,
        dor_cd4 = EXCLUDED.dor_cd4,
        ag_val = EXCLUDED.ag_val,
        qual_cd2_ = EXCLUDED.qual_cd2_,
        vi_cd2_ = EXCLUDED.vi_cd2_,
        sale_prc2_ = EXCLUDED.sale_prc2_,
        sale_yr2_ = EXCLUDED.sale_yr2_,
        sale_mo2_ = EXCLUDED.sale_mo2_,
        or_book2_ = EXCLUDED.or_book2_,
        or_page2_ = EXCLUDED.or_page2_,
        clerk_n_2 = EXCLUDED.clerk_n_2,
        imp_val = EXCLUDED.imp_val,
        const_val = EXCLUDED.const_val,
        distr_no = EXCLUDED.distr_no,
        front = EXCLUDED.front,
        depth = EXCLUDED.depth,
        cap = EXCLUDED.cap,
        cape_shpa = EXCLUDED.cape_shpa,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        pin_1 = EXCLUDED.pin_1,
        pin_2 = EXCLUDED.pin_2,
        half_cd = EXCLUDED.half_cd,
        sub = EXCLUDED.sub,
        blk = EXCLUDED.blk,
        lot = EXCLUDED.lot,
        plat_book = EXCLUDED.plat_book,
        plat_page = EXCLUDED.plat_page,
        updated_at = NOW();
    
    -- Clear staging table after successful transfer
    TRUNCATE florida_parcels_staging;
END;
$$;


ALTER FUNCTION "public"."transfer_florida_parcels_staging"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."transfer_florida_parcels_staging"() IS 'Transfers all data from staging table to main florida_parcels table with proper type conversion and UPSERT logic. Handles all DOR columns and empty string normalization.';



CREATE OR REPLACE FUNCTION "public"."update_all_property_counties"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_property RECORD;
    v_county_name TEXT;
    v_county_id UUID;
    v_updated INTEGER := 0;
BEGIN
    -- Loop through all properties without county_id
    FOR v_property IN 
        SELECT id, address 
        FROM properties 
        WHERE county_id IS NULL AND address IS NOT NULL
    LOOP
        -- Extract county from address
        v_county_name := extract_county_from_address(v_property.address);
        
        IF v_county_name IS NOT NULL THEN
            -- Look up county_id
            SELECT id INTO v_county_id
            FROM florida_counties
            WHERE county_name = v_county_name
            OR county_name = v_county_name || ' County'
            OR county_name = REPLACE(v_county_name, ' County', '')
            LIMIT 1;
            
            -- Update property
            IF v_county_id IS NOT NULL THEN
                UPDATE properties
                SET county_id = v_county_id,
                    county_name = v_county_name
                WHERE id = v_property.id;
                
                v_updated := v_updated + 1;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % properties with county information', v_updated;
END;
$$;


ALTER FUNCTION "public"."update_all_property_counties"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_extractions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_document_extractions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_florida_counties_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_florida_counties_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_property_embedding"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mark for embedding update (handled by application)
    NEW.property_embedding = NULL;
    NEW.last_ai_analysis_at = NULL;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_property_embedding"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_parcel_data"("p_parcel_id" character varying) RETURNS TABLE("field_name" "text", "issue" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check for missing required data
    IF NOT EXISTS (SELECT 1 FROM florida_parcels WHERE "PARCEL_ID" = p_parcel_id) THEN
        RETURN QUERY SELECT 'PARCEL_ID'::TEXT, 'Parcel not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check for data quality issues
    RETURN QUERY
    WITH parcel AS (
        SELECT * FROM florida_parcels WHERE "PARCEL_ID" = p_parcel_id
    )
    SELECT 'JV'::TEXT, 'Just Value is zero or null'::TEXT
    FROM parcel WHERE "JV" IS NULL OR "JV" = 0
    UNION ALL
    SELECT 'OWN_NAME'::TEXT, 'Owner name is missing'::TEXT
    FROM parcel WHERE "OWN_NAME" IS NULL OR "OWN_NAME" = ''
    UNION ALL
    SELECT 'PHY_ADDR1'::TEXT, 'Physical address is missing'::TEXT
    FROM parcel WHERE "PHY_ADDR1" IS NULL OR "PHY_ADDR1" = ''
    UNION ALL
    SELECT 'SALE_YR1'::TEXT, 'Sale year is in the future'::TEXT
    FROM parcel WHERE "SALE_YR1" > EXTRACT(YEAR FROM CURRENT_DATE)
    UNION ALL
    SELECT 'ACT_YR_BLT'::TEXT, 'Year built is in the future'::TEXT
    FROM parcel WHERE "ACT_YR_BLT" > EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$;


ALTER FUNCTION "public"."validate_parcel_data"("p_parcel_id" character varying) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties_old" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "address" "jsonb",
    "year_built" integer,
    "square_feet" integer,
    "details" "jsonb",
    "insurance_carrier" "text",
    "insurance_policy_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "property_type" "text",
    "parcel_id" "text",
    "location" "public"."geometry"(Point,4326),
    "value" numeric(15,2),
    "insurability_score" integer DEFAULT 0,
    "street_address" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "county" "text",
    "country" "text" DEFAULT 'USA'::"text",
    CONSTRAINT "properties_insurability_score_check" CHECK ((("insurability_score" >= 0) AND ("insurability_score" <= 100))),
    CONSTRAINT "valid_florida_bbox" CHECK ((("location" IS NULL) OR (("public"."st_x"("location") >= ('-87.634896'::numeric)::double precision) AND ("public"."st_x"("location") <= ('-79.974306'::numeric)::double precision) AND (("public"."st_y"("location") >= (24.396308)::double precision) AND ("public"."st_y"("location") <= (31.000888)::double precision))))),
    CONSTRAINT "valid_square_feet" CHECK (("square_feet" > 0)),
    CONSTRAINT "valid_year" CHECK ((("year_built" >= 1800) AND (("year_built")::numeric <= EXTRACT(year FROM CURRENT_DATE))))
);


ALTER TABLE "public"."properties_old" OWNER TO "postgres";


COMMENT ON COLUMN "public"."properties_old"."value" IS 'Estimated property value in USD';



COMMENT ON COLUMN "public"."properties_old"."insurability_score" IS 'Property insurability score (0-100)';



CREATE TABLE IF NOT EXISTS "public"."ai_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_name" "text" NOT NULL,
    "model_type" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "model_version" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "capabilities" "jsonb" DEFAULT '[]'::"jsonb",
    "context_window" integer,
    "max_tokens" integer,
    "cost_per_1k_tokens" numeric(10,4),
    "cost_per_image" numeric(10,4),
    "is_active" boolean DEFAULT true,
    "deprecated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_models_model_type_check" CHECK (("model_type" = ANY (ARRAY['vision'::"text", 'language'::"text", 'embedding'::"text", 'classification'::"text", 'generation'::"text"]))),
    CONSTRAINT "ai_models_provider_check" CHECK (("provider" = ANY (ARRAY['openai'::"text", 'anthropic'::"text", 'google'::"text", 'replicate'::"text", 'huggingface'::"text", 'local'::"text"])))
);


ALTER TABLE "public"."ai_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "typical_sublimit" numeric(10,2),
    "depreciation_rate" numeric(4,2),
    "requires_appraisal_threshold" numeric(10,2),
    "documentation_requirements" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_classification_hints" "text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "last_verified_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);

ALTER TABLE ONLY "public"."categories" REPLICA IDENTITY FULL;


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "typical_sublimit" numeric(10,2),
    "depreciation_rate" numeric(4,2),
    "requires_appraisal_threshold" numeric(10,2),
    "documentation_requirements" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_classification_hints" "text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "valid_from" timestamp with time zone,
    "valid_to" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."categories_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cities" (
    "id" integer NOT NULL,
    "county_id" integer,
    "state_id" integer,
    "name" character varying(100) NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cities" OWNER TO "postgres";


COMMENT ON TABLE "public"."cities" IS 'Cities linked to counties and states';



CREATE SEQUENCE IF NOT EXISTS "public"."cities_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cities_id_seq" OWNED BY "public"."cities"."id";



CREATE TABLE IF NOT EXISTS "public"."claim_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "previous_status" "public"."claim_status_enum",
    "new_status" "public"."claim_status_enum" NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."claim_status_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."claim_status_history" IS 'Audit trail of claim status changes';



CREATE TABLE IF NOT EXISTS "public"."claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_number" "text",
    "property_id" "uuid" NOT NULL,
    "policy_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."claim_status_enum" DEFAULT 'draft'::"public"."claim_status_enum" NOT NULL,
    "damage_type" "public"."damage_type_enum" NOT NULL,
    "date_of_loss" "date" NOT NULL,
    "date_reported" "date" DEFAULT CURRENT_DATE,
    "description" "text",
    "estimated_value" numeric(15,2),
    "deductible_applied" numeric(15,2),
    "settled_value" numeric(15,2),
    "settlement_date" "date",
    "adjuster_name" "text",
    "adjuster_phone" "text",
    "adjuster_email" "text",
    "claim_notes" "text",
    "supporting_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ai_complexity_score" double precision,
    "ai_fraud_risk_score" double precision,
    "ai_settlement_prediction" "jsonb" DEFAULT '{}'::"jsonb",
    "claim_embedding" "public"."vector"(1536),
    "ai_recommended_actions" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."claims" OWNER TO "postgres";


COMMENT ON TABLE "public"."claims" IS 'Insurance claims filed for property damage';



COMMENT ON COLUMN "public"."claims"."supporting_documents" IS 'Array of document references (URLs or file paths)';



COMMENT ON COLUMN "public"."claims"."metadata" IS 'Flexible JSONB field for additional claim data';



CREATE TABLE IF NOT EXISTS "public"."counties" (
    "id" integer NOT NULL,
    "state_id" integer,
    "name" character varying(100) NOT NULL,
    "fips_code" character(5) NOT NULL,
    "state_fips" character(2) NOT NULL,
    "county_fips" character(3) NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."counties" OWNER TO "postgres";


COMMENT ON TABLE "public"."counties" IS 'Counties with FIPS codes for geographic standardization';



COMMENT ON COLUMN "public"."counties"."fips_code" IS 'Full 5-digit FIPS code (state + county)';



COMMENT ON COLUMN "public"."counties"."state_fips" IS '2-digit state FIPS code';



COMMENT ON COLUMN "public"."counties"."county_fips" IS '3-digit county FIPS code';



CREATE SEQUENCE IF NOT EXISTS "public"."counties_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."counties_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."counties_id_seq" OWNED BY "public"."counties"."id";



CREATE TABLE IF NOT EXISTS "public"."coverage_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "typical_limit" numeric(12,2),
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "last_verified_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);

ALTER TABLE ONLY "public"."coverage_types" REPLICA IDENTITY FULL;


ALTER TABLE "public"."coverage_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coverage_types_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "typical_limit" numeric(12,2),
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "valid_from" timestamp with time zone,
    "valid_to" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."coverage_types_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crawl_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "data_type" "public"."floir_data_type" NOT NULL,
    "status" "public"."crawl_status" DEFAULT 'pending'::"public"."crawl_status",
    "records_processed" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "records_created" integer DEFAULT 0,
    "errors" "jsonb",
    "error_count" integer DEFAULT 0,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "duration_seconds" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."crawl_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."damage_ai_detections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "damage_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "image_embedding" "public"."vector"(1536),
    "detected_objects" "jsonb" DEFAULT '[]'::"jsonb",
    "damage_types" "jsonb" DEFAULT '[]'::"jsonb",
    "material_types" "jsonb" DEFAULT '[]'::"jsonb",
    "estimated_area_sqft" double precision,
    "severity_score" double precision,
    "model_id" "uuid",
    "analysis_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."damage_ai_detections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."debug_user_creation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "step" "text" NOT NULL,
    "success" boolean NOT NULL,
    "error_message" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."debug_user_creation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_ai_extractions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid",
    "document_type" "text",
    "extracted_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "key_terms" "jsonb" DEFAULT '[]'::"jsonb",
    "important_dates" "jsonb" DEFAULT '[]'::"jsonb",
    "coverage_items" "jsonb" DEFAULT '[]'::"jsonb",
    "exclusions" "jsonb" DEFAULT '[]'::"jsonb",
    "summary" "text",
    "key_points" "jsonb" DEFAULT '[]'::"jsonb",
    "content_embedding" "public"."vector"(1536),
    "summary_embedding" "public"."vector"(1536),
    "extraction_confidence" double precision,
    "requires_review" boolean DEFAULT false,
    "review_notes" "text",
    "model_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_ai_extractions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_extractions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "processed_by" "uuid" NOT NULL,
    "processing_status" "public"."processing_status_enum" DEFAULT 'pending'::"public"."processing_status_enum" NOT NULL,
    "error_message" "text",
    "processing_time_ms" integer,
    "extracted_data" "jsonb" DEFAULT '{}'::"jsonb",
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "applied_to_property" boolean DEFAULT false,
    "applied_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "document_extractions_confidence_score_check" CHECK ((("confidence_score" >= 0.0) AND ("confidence_score" <= 1.0))),
    CONSTRAINT "document_extractions_processing_time_ms_check" CHECK (("processing_time_ms" >= 0))
);


ALTER TABLE "public"."document_extractions" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_extractions" IS 'Stores AI extraction results from policy documents';



COMMENT ON COLUMN "public"."document_extractions"."processing_status" IS 'Current status of AI processing';



COMMENT ON COLUMN "public"."document_extractions"."extracted_data" IS 'JSON object containing extracted policy data';



COMMENT ON COLUMN "public"."document_extractions"."confidence_score" IS 'AI confidence score between 0.0 and 1.0';



COMMENT ON COLUMN "public"."document_extractions"."applied_to_property" IS 'Whether extracted data has been applied to property/policy';



CREATE TABLE IF NOT EXISTS "public"."fdot_stage" (
    "id" integer NOT NULL,
    "feature" "jsonb" NOT NULL,
    "geom" "public"."geometry"(Geometry,4326) GENERATED ALWAYS AS ("public"."st_geomfromgeojson"(("feature" -> 'geometry'::"text"))) STORED
);


ALTER TABLE "public"."fdot_stage" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fdot_stage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fdot_stage_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fdot_stage_id_seq" OWNED BY "public"."fdot_stage"."id";



CREATE TABLE IF NOT EXISTS "public"."fl_counties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "fips5" character(5) NOT NULL,
    "county_name" "text" NOT NULL,
    "county_seat" "text",
    "region" "text",
    "time_zone" "text",
    "fema_region" "text",
    "coastal_county" boolean DEFAULT false,
    "building_dept_name" "text",
    "building_dept_phone" "text",
    "building_dept_email" "text",
    "building_dept_address" "text",
    "building_dept_website" "text",
    "permit_search_url" "text",
    "online_permit_system" boolean DEFAULT false,
    "property_appraiser_name" "text",
    "property_appraiser_phone" "text",
    "property_appraiser_email" "text",
    "property_appraiser_website" "text",
    "property_search_url" "text",
    "gis_url" "text",
    "parcel_data_url" "text",
    "tax_collector_name" "text",
    "tax_collector_phone" "text",
    "tax_collector_email" "text",
    "tax_collector_website" "text",
    "emergency_mgmt_name" "text",
    "emergency_mgmt_phone" "text",
    "emergency_mgmt_email" "text",
    "emergency_mgmt_website" "text",
    "emergency_hotline" "text",
    "citizens_service_center" "text",
    "flood_zone_maps_url" "text",
    "windstorm_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "building_code_version" "text",
    "wind_speed_requirement" integer,
    "flood_elevation_requirement" boolean DEFAULT false,
    "impact_glass_required" boolean DEFAULT false,
    "permit_expiration_days" integer DEFAULT 180,
    "permit_fee_structure" "jsonb" DEFAULT '{}'::"jsonb",
    "reinspection_fee" numeric(10,2),
    "hurricane_evacuation_zone_url" "text",
    "storm_surge_planning_zone_url" "text",
    "fema_flood_zone_url" "text",
    "claim_filing_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "supplemental_claim_deadline_days" integer DEFAULT 365,
    "aob_restrictions" "jsonb" DEFAULT '{}'::"jsonb",
    "contractor_license_search_url" "text",
    "contractor_license_verification_phone" "text",
    "unlicensed_contractor_limit" numeric(10,2) DEFAULT 2500.00,
    "population" integer,
    "households" integer,
    "median_home_value" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "last_verified_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."fl_counties" REPLICA IDENTITY FULL;


ALTER TABLE "public"."fl_counties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fl_counties_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "fips5" character(5) NOT NULL,
    "county_name" "text" NOT NULL,
    "county_seat" "text",
    "region" "text",
    "time_zone" "text",
    "fema_region" "text",
    "coastal_county" boolean DEFAULT false,
    "building_dept_name" "text",
    "building_dept_phone" "text",
    "building_dept_email" "text",
    "building_dept_address" "text",
    "building_dept_website" "text",
    "permit_search_url" "text",
    "online_permit_system" boolean DEFAULT false,
    "property_appraiser_name" "text",
    "property_appraiser_phone" "text",
    "property_appraiser_email" "text",
    "property_appraiser_website" "text",
    "property_search_url" "text",
    "gis_url" "text",
    "parcel_data_url" "text",
    "tax_collector_name" "text",
    "tax_collector_phone" "text",
    "tax_collector_email" "text",
    "tax_collector_website" "text",
    "emergency_mgmt_name" "text",
    "emergency_mgmt_phone" "text",
    "emergency_mgmt_email" "text",
    "emergency_mgmt_website" "text",
    "emergency_hotline" "text",
    "citizens_service_center" "text",
    "flood_zone_maps_url" "text",
    "windstorm_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "building_code_version" "text",
    "wind_speed_requirement" integer,
    "flood_elevation_requirement" boolean DEFAULT false,
    "impact_glass_required" boolean DEFAULT false,
    "permit_expiration_days" integer DEFAULT 180,
    "permit_fee_structure" "jsonb" DEFAULT '{}'::"jsonb",
    "reinspection_fee" numeric(10,2),
    "hurricane_evacuation_zone_url" "text",
    "storm_surge_planning_zone_url" "text",
    "fema_flood_zone_url" "text",
    "claim_filing_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "supplemental_claim_deadline_days" integer DEFAULT 365,
    "aob_restrictions" "jsonb" DEFAULT '{}'::"jsonb",
    "contractor_license_search_url" "text",
    "contractor_license_verification_phone" "text",
    "unlicensed_contractor_limit" numeric(10,2) DEFAULT 2500.00,
    "population" integer,
    "households" integer,
    "median_home_value" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "valid_from" timestamp with time zone,
    "valid_to" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "notes" "text",
    "custom_attributes" "jsonb"
);


ALTER TABLE "public"."fl_counties_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."floir_data_types_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "source_url" "text",
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "valid_from" timestamp with time zone,
    "valid_to" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."floir_data_types_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."florida_parcels" (
    "id" bigint NOT NULL,
    "CO_NO" double precision,
    "PARCEL_ID" character varying(50),
    "FILE_T" character varying(20),
    "ASMNT_YR" double precision,
    "BAS_STRT" character varying(20),
    "ATV_STRT" character varying(20),
    "GRP_NO" double precision,
    "DOR_UC" character varying(20),
    "PA_UC" character varying(20),
    "SPASS_CD" character varying(20),
    "JV" double precision,
    "JV_CHNG" double precision,
    "JV_CHNG_CD" double precision,
    "AV_SD" double precision,
    "AV_NSD" double precision,
    "TV_SD" double precision,
    "TV_NSD" double precision,
    "JV_HMSTD" double precision,
    "AV_HMSTD" double precision,
    "JV_NON_HMS" double precision,
    "AV_NON_HMS" double precision,
    "JV_RESD_NO" double precision,
    "AV_RESD_NO" double precision,
    "JV_CLASS_U" double precision,
    "AV_CLASS_U" double precision,
    "JV_H2O_REC" double precision,
    "AV_H2O_REC" double precision,
    "JV_CONSRV_" double precision,
    "AV_CONSRV_" double precision,
    "JV_HIST_CO" double precision,
    "AV_HIST_CO" double precision,
    "JV_HIST_SI" double precision,
    "AV_HIST_SI" double precision,
    "JV_WRKNG_W" double precision,
    "AV_WRKNG_W" double precision,
    "NCONST_VAL" double precision,
    "DEL_VAL" double precision,
    "PAR_SPLT" double precision,
    "DISTR_CD" character varying(20),
    "DISTR_YR" double precision,
    "LND_VAL" double precision,
    "LND_UNTS_C" double precision,
    "NO_LND_UNT" double precision,
    "LND_SQFOOT" double precision,
    "DT_LAST_IN" double precision,
    "IMP_QUAL" double precision,
    "CONST_CLAS" double precision,
    "EFF_YR_BLT" double precision,
    "ACT_YR_BLT" double precision,
    "TOT_LVG_AR" double precision,
    "NO_BULDNG" double precision,
    "NO_RES_UNT" double precision,
    "SPEC_FEAT_" double precision,
    "M_PAR_SAL1" character varying(50),
    "QUAL_CD1" character varying(20),
    "VI_CD1" character varying(20),
    "SALE_PRC1" double precision,
    "SALE_YR1" double precision,
    "SALE_MO1" double precision,
    "OR_BOOK1" character varying(20),
    "OR_PAGE1" character varying(20),
    "CLERK_NO1" character varying(20),
    "S_CHNG_CD1" character varying(20),
    "M_PAR_SAL2" character varying(50),
    "QUAL_CD2" character varying(20),
    "VI_CD2" character varying(20),
    "SALE_PRC2" double precision,
    "SALE_YR2" double precision,
    "SALE_MO2" double precision,
    "OR_BOOK2" character varying(20),
    "OR_PAGE2" character varying(20),
    "CLERK_NO2" character varying(20),
    "S_CHNG_CD2" character varying(20),
    "OWN_NAME" "text",
    "OWN_ADDR1" "text",
    "OWN_ADDR2" "text",
    "OWN_CITY" character varying(100),
    "OWN_STATE" character varying(50),
    "OWN_ZIPCD" double precision,
    "OWN_STATE_" character varying(20),
    "FIDU_NAME" "text",
    "FIDU_ADDR1" "text",
    "FIDU_ADDR2" "text",
    "FIDU_CITY" character varying(100),
    "FIDU_STATE" character varying(20),
    "FIDU_ZIPCD" double precision,
    "FIDU_CD" double precision,
    "S_LEGAL" "text",
    "APP_STAT" character varying(50),
    "CO_APP_STA" character varying(50),
    "MKT_AR" character varying(50),
    "NBRHD_CD" character varying(50),
    "PUBLIC_LND" character varying(50),
    "TAX_AUTH_C" character varying(50),
    "TWN" character varying(20),
    "RNG" character varying(20),
    "SEC" double precision,
    "CENSUS_BK" character varying(50),
    "PHY_ADDR1" "text",
    "PHY_ADDR2" "text",
    "PHY_CITY" character varying(100),
    "PHY_ZIPCD" double precision,
    "ALT_KEY" character varying(100),
    "ASS_TRNSFR" character varying(50),
    "PREV_HMSTD" double precision,
    "ASS_DIF_TR" double precision,
    "CONO_PRV_H" double precision,
    "PARCEL_ID_" character varying(50),
    "YR_VAL_TRN" double precision,
    "SEQ_NO" double precision,
    "RS_ID" character varying(50),
    "MP_ID" character varying(50),
    "STATE_PAR_" character varying(50),
    "SPC_CIR_CD" double precision,
    "SPC_CIR_YR" double precision,
    "SPC_CIR_TX" character varying(50),
    "Shape_Length" double precision,
    "Shape_Area" double precision,
    "geometry_wkt" "text",
    "county_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "own_state2" character varying(10),
    "own_zipcda" character varying(20),
    "nbrhd_cd1" character varying(50),
    "nbrhd_cd2" character varying(50),
    "nbrhd_cd3" character varying(50),
    "nbrhd_cd4" character varying(50),
    "dor_cd1" character varying(10),
    "dor_cd2" character varying(10),
    "dor_cd3" character varying(10),
    "dor_cd4" character varying(10),
    "ag_val" double precision,
    "qual_cd2_" character varying(10),
    "vi_cd2_" character varying(10),
    "sale_prc2_" double precision,
    "sale_yr2_" double precision,
    "sale_mo2_" double precision,
    "or_book2_" character varying(20),
    "or_page2_" character varying(20),
    "clerk_n_2" character varying(20),
    "imp_val" double precision,
    "const_val" double precision,
    "distr_no" character varying(20),
    "front" double precision,
    "depth" double precision,
    "latitude" double precision,
    "longitude" double precision,
    "pin_1" character varying(50),
    "pin_2" character varying(50),
    "half_cd" character varying(10),
    "twp" character varying(10),
    "sub" character varying(50),
    "blk" character varying(20),
    "lot" character varying(20),
    "plat_book" character varying(20),
    "plat_page" character varying(20),
    "PLAT_BOOK" "text",
    "objectid" bigint,
    "parcel_id" character varying(50),
    "co_no" integer,
    "asmnt_yr" integer,
    "jv" numeric,
    "av_sd" numeric,
    "av_nsd" numeric,
    "tv_sd" numeric,
    "tv_nsd" numeric,
    "dor_uc" character varying(10),
    "pa_uc" character varying(10),
    "land_val" numeric,
    "bldg_val" numeric,
    "tot_val" numeric,
    "act_yr_blt" integer,
    "eff_yr_blt" integer,
    "tot_lvg_ar" numeric,
    "land_sqfoot" numeric,
    "no_buldng" integer,
    "no_res_unt" integer,
    "own_name" "text",
    "own_addr1" "text",
    "own_addr2" "text",
    "own_city" "text",
    "own_state" character varying(10),
    "own_zipcd" character varying(20),
    "phy_addr1" "text",
    "phy_addr2" "text",
    "phy_city" "text",
    "phy_zipcd" character varying(20),
    "s_legal" "text",
    "twn" character varying(10),
    "rng" character varying(10),
    "sec" character varying(10),
    "sale_prc1" numeric,
    "sale_yr1" integer,
    "sale_mo1" character varying(10),
    "sale_prc2" numeric,
    "sale_yr2" integer,
    "sale_mo2" character varying(10),
    "nbrhd_cd" character varying(50),
    "census_bk" character varying(50),
    "mkt_ar" character varying(50),
    "data_source" character varying(50),
    "file_t" character varying(10),
    "bas_strt" character varying(50),
    "atv_strt" character varying(50),
    "grp_no" character varying(10),
    "spass_cd" character varying(10),
    "jv_chng" character varying(10),
    "or_book1" character varying(20),
    "or_page1" character varying(20),
    "clerk_no1" character varying(20),
    "vi_cd1" character varying(10),
    "qual_cd1" character varying(10),
    "or_book2" character varying(20),
    "or_page2" character varying(20),
    "clerk_no2" character varying(20),
    "vi_cd2" character varying(10),
    "qual_cd2" character varying(10),
    "app_stat" character varying(10),
    "co_app_sta" character varying(10),
    "tax_auth_c" character varying(10),
    "imp_qual" character varying(10),
    "const_clas" character varying(10),
    "spec_feat_" character varying(20),
    "m_par_sal1" character varying(10),
    "m_par_sal2" character varying(10),
    "nconst_val" numeric,
    "public_lnd" character varying(10),
    "distr_cd" character varying(20),
    "distr_yr" integer,
    "parcel_id_" character varying(50),
    "yr_val_trn" integer,
    "seq_no" character varying(20),
    "rs_id" character varying(20),
    "mp_id" character varying(20),
    "state_par_" character varying(50),
    "spc_cir_cd" character varying(10),
    "spc_cir_yr" integer,
    "spc_cir_tx" "text",
    "s_chng_cd1" character varying(10),
    "s_chng_cd2" character varying(10),
    "cap" numeric,
    "cape_shpa" numeric,
    "county_fips" integer
);


ALTER TABLE "public"."florida_parcels" OWNER TO "postgres";


COMMENT ON TABLE "public"."florida_parcels" IS 'Florida statewide parcel data with UPPERCASE column names matching CSV import format. Automatically derives county_fips from CO_NO field.';



COMMENT ON COLUMN "public"."florida_parcels"."id" IS 'System ID - Auto-generated primary key';



COMMENT ON COLUMN "public"."florida_parcels"."CO_NO" IS 'County Number (1-67) - Sequential number assigned to each Florida county';



COMMENT ON COLUMN "public"."florida_parcels"."PARCEL_ID" IS 'Unique Parcel Identifier - Primary key for property identification across the county';



COMMENT ON COLUMN "public"."florida_parcels"."FILE_T" IS 'File Type - Indicates the source or type of property record';



COMMENT ON COLUMN "public"."florida_parcels"."ASMNT_YR" IS 'Assessment Year - Tax year for which the assessment applies';



COMMENT ON COLUMN "public"."florida_parcels"."BAS_STRT" IS 'Base Start Date - Beginning date for assessment calculations';



COMMENT ON COLUMN "public"."florida_parcels"."ATV_STRT" IS 'Active Start Date - Date when property became active in system';



COMMENT ON COLUMN "public"."florida_parcels"."GRP_NO" IS 'Group Number - Grouping code for similar properties';



COMMENT ON COLUMN "public"."florida_parcels"."DOR_UC" IS 'Department of Revenue Use Code - State-level property classification';



COMMENT ON COLUMN "public"."florida_parcels"."PA_UC" IS 'Property Appraiser Use Code - Local property classification';



COMMENT ON COLUMN "public"."florida_parcels"."SPASS_CD" IS 'Special Assessment Code - Indicates special assessment districts';



COMMENT ON COLUMN "public"."florida_parcels"."JV" IS 'Just Value (Market Value) - Fair market value as determined by Property Appraiser';



COMMENT ON COLUMN "public"."florida_parcels"."JV_CHNG" IS 'Just Value Change - Dollar amount change from previous year';



COMMENT ON COLUMN "public"."florida_parcels"."JV_CHNG_CD" IS 'Just Value Change Code - Reason code for value change';



COMMENT ON COLUMN "public"."florida_parcels"."AV_SD" IS 'Assessed Value School District - Taxable value for school district taxes';



COMMENT ON COLUMN "public"."florida_parcels"."AV_NSD" IS 'Assessed Value Non-School District - Taxable value for non-school taxes';



COMMENT ON COLUMN "public"."florida_parcels"."TV_SD" IS 'Taxable Value School District - Final taxable value after exemptions for schools';



COMMENT ON COLUMN "public"."florida_parcels"."TV_NSD" IS 'Taxable Value Non-School District - Final taxable value after exemptions for non-school';



COMMENT ON COLUMN "public"."florida_parcels"."JV_HMSTD" IS 'Just Value Homestead Portion - Market value of homestead portion';



COMMENT ON COLUMN "public"."florida_parcels"."AV_HMSTD" IS 'Assessed Value Homestead - Assessed value of homestead portion';



COMMENT ON COLUMN "public"."florida_parcels"."JV_NON_HMS" IS 'Just Value Non-Homestead - Market value of non-homestead portion';



COMMENT ON COLUMN "public"."florida_parcels"."AV_NON_HMS" IS 'Assessed Value Non-Homestead - Assessed value of non-homestead portion';



COMMENT ON COLUMN "public"."florida_parcels"."JV_RESD_NO" IS 'Just Value Residential Non-Homestead - Value of residential non-homestead property';



COMMENT ON COLUMN "public"."florida_parcels"."AV_RESD_NO" IS 'Assessed Value Residential Non-Homestead - Assessed value of residential non-homestead';



COMMENT ON COLUMN "public"."florida_parcels"."JV_CLASS_U" IS 'Just Value Classified Use - Value under classified use assessment';



COMMENT ON COLUMN "public"."florida_parcels"."AV_CLASS_U" IS 'Assessed Value Classified Use - Assessed value under classified use';



COMMENT ON COLUMN "public"."florida_parcels"."JV_H2O_REC" IS 'Just Value Water Recharge - Value of water recharge lands';



COMMENT ON COLUMN "public"."florida_parcels"."AV_H2O_REC" IS 'Assessed Value Water Recharge - Assessed value of water recharge lands';



COMMENT ON COLUMN "public"."florida_parcels"."JV_CONSRV_" IS 'Just Value Conservation - Value of conservation lands';



COMMENT ON COLUMN "public"."florida_parcels"."AV_CONSRV_" IS 'Assessed Value Conservation - Assessed value of conservation lands';



COMMENT ON COLUMN "public"."florida_parcels"."JV_HIST_CO" IS 'Just Value Historic Commercial - Value of historic commercial property';



COMMENT ON COLUMN "public"."florida_parcels"."AV_HIST_CO" IS 'Assessed Value Historic Commercial - Assessed value of historic commercial';



COMMENT ON COLUMN "public"."florida_parcels"."JV_HIST_SI" IS 'Just Value Historic Significant - Value of historically significant property';



COMMENT ON COLUMN "public"."florida_parcels"."AV_HIST_SI" IS 'Assessed Value Historic Significant - Assessed value of historic property';



COMMENT ON COLUMN "public"."florida_parcels"."JV_WRKNG_W" IS 'Just Value Working Waterfront - Value of working waterfront property';



COMMENT ON COLUMN "public"."florida_parcels"."AV_WRKNG_W" IS 'Assessed Value Working Waterfront - Assessed value of working waterfront';



COMMENT ON COLUMN "public"."florida_parcels"."NCONST_VAL" IS 'New Construction Value - Value of new construction added';



COMMENT ON COLUMN "public"."florida_parcels"."DEL_VAL" IS 'Deletion Value - Value of improvements removed or demolished';



COMMENT ON COLUMN "public"."florida_parcels"."PAR_SPLT" IS 'Parcel Split Indicator - Flag indicating if parcel was split';



COMMENT ON COLUMN "public"."florida_parcels"."DISTR_CD" IS 'District Code - Tax district code';



COMMENT ON COLUMN "public"."florida_parcels"."DISTR_YR" IS 'District Year - Year district was established';



COMMENT ON COLUMN "public"."florida_parcels"."LND_VAL" IS 'Land Value - Assessed value of land only (no improvements)';



COMMENT ON COLUMN "public"."florida_parcels"."LND_UNTS_C" IS 'Land Units Code - Unit of measurement for land (acres, sq ft, etc)';



COMMENT ON COLUMN "public"."florida_parcels"."NO_LND_UNT" IS 'Number of Land Units - Quantity of land in specified units';



COMMENT ON COLUMN "public"."florida_parcels"."LND_SQFOOT" IS 'Land Square Footage - Total square feet of land';



COMMENT ON COLUMN "public"."florida_parcels"."DT_LAST_IN" IS 'Date Last Inspected - Most recent property inspection date';



COMMENT ON COLUMN "public"."florida_parcels"."IMP_QUAL" IS 'Improvement Quality - Quality grade of improvements (1-9 scale)';



COMMENT ON COLUMN "public"."florida_parcels"."CONST_CLAS" IS 'Construction Class - Type of construction (frame, masonry, etc)';



COMMENT ON COLUMN "public"."florida_parcels"."EFF_YR_BLT" IS 'Effective Year Built - Adjusted year for depreciation calculations';



COMMENT ON COLUMN "public"."florida_parcels"."ACT_YR_BLT" IS 'Actual Year Built - Original construction year';



COMMENT ON COLUMN "public"."florida_parcels"."TOT_LVG_AR" IS 'Total Living Area - Heated/cooled square footage';



COMMENT ON COLUMN "public"."florida_parcels"."NO_BULDNG" IS 'Number of Buildings - Count of structures on parcel';



COMMENT ON COLUMN "public"."florida_parcels"."NO_RES_UNT" IS 'Number of Residential Units - Count of dwelling units';



COMMENT ON COLUMN "public"."florida_parcels"."SPEC_FEAT_" IS 'Special Features Value - Value of pools, outbuildings, etc';



COMMENT ON COLUMN "public"."florida_parcels"."M_PAR_SAL1" IS 'Multi-Parcel Sale 1 - Indicates if part of multi-parcel transaction';



COMMENT ON COLUMN "public"."florida_parcels"."QUAL_CD1" IS 'Qualification Code 1 - Sales qualification code (U=Unqualified, Q=Qualified)';



COMMENT ON COLUMN "public"."florida_parcels"."VI_CD1" IS 'Vacant/Improved Code 1 - V=Vacant, I=Improved at time of sale';



COMMENT ON COLUMN "public"."florida_parcels"."SALE_PRC1" IS 'Sale Price 1 - Most recent sale price in dollars';



COMMENT ON COLUMN "public"."florida_parcels"."SALE_YR1" IS 'Sale Year 1 - Year of most recent sale';



COMMENT ON COLUMN "public"."florida_parcels"."SALE_MO1" IS 'Sale Month 1 - Month of most recent sale (1-12)';



COMMENT ON COLUMN "public"."florida_parcels"."OR_BOOK1" IS 'Official Record Book 1 - Deed book number';



COMMENT ON COLUMN "public"."florida_parcels"."OR_PAGE1" IS 'Official Record Page 1 - Deed page number';



COMMENT ON COLUMN "public"."florida_parcels"."CLERK_NO1" IS 'Clerk Number 1 - Clerk instrument number';



COMMENT ON COLUMN "public"."florida_parcels"."S_CHNG_CD1" IS 'Sale Change Code 1 - Reason for ownership change';



COMMENT ON COLUMN "public"."florida_parcels"."M_PAR_SAL2" IS 'Multi-Parcel Sale 2 - Previous multi-parcel sale indicator';



COMMENT ON COLUMN "public"."florida_parcels"."QUAL_CD2" IS 'Qualification Code 2 - Previous sale qualification';



COMMENT ON COLUMN "public"."florida_parcels"."VI_CD2" IS 'Vacant/Improved Code 2 - Property status at previous sale';



COMMENT ON COLUMN "public"."florida_parcels"."SALE_PRC2" IS 'Sale Price 2 - Previous sale price';



COMMENT ON COLUMN "public"."florida_parcels"."SALE_YR2" IS 'Sale Year 2 - Year of previous sale';



COMMENT ON COLUMN "public"."florida_parcels"."SALE_MO2" IS 'Sale Month 2 - Month of previous sale';



COMMENT ON COLUMN "public"."florida_parcels"."OR_BOOK2" IS 'Official Record Book 2 - Previous deed book';



COMMENT ON COLUMN "public"."florida_parcels"."OR_PAGE2" IS 'Official Record Page 2 - Previous deed page';



COMMENT ON COLUMN "public"."florida_parcels"."CLERK_NO2" IS 'Clerk Number 2 - Previous clerk instrument number';



COMMENT ON COLUMN "public"."florida_parcels"."S_CHNG_CD2" IS 'Sale Change Code 2 - Previous ownership change reason';



COMMENT ON COLUMN "public"."florida_parcels"."OWN_NAME" IS 'Owner Name - Primary owner full name or entity';



COMMENT ON COLUMN "public"."florida_parcels"."OWN_ADDR1" IS 'Owner Address Line 1 - Mailing address first line';



COMMENT ON COLUMN "public"."florida_parcels"."OWN_ADDR2" IS 'Owner Address Line 2 - Mailing address second line';



COMMENT ON COLUMN "public"."florida_parcels"."OWN_CITY" IS 'Owner City - Mailing address city';



COMMENT ON COLUMN "public"."florida_parcels"."OWN_STATE" IS 'Owner State - Mailing address state code';



COMMENT ON COLUMN "public"."florida_parcels"."OWN_ZIPCD" IS 'Owner ZIP Code - Mailing address ZIP';



COMMENT ON COLUMN "public"."florida_parcels"."OWN_STATE_" IS 'Owner State Country - State/country for foreign addresses';



COMMENT ON COLUMN "public"."florida_parcels"."FIDU_NAME" IS 'Fiduciary Name - Trustee, executor, or agent name';



COMMENT ON COLUMN "public"."florida_parcels"."FIDU_ADDR1" IS 'Fiduciary Address 1 - Agent mailing address line 1';



COMMENT ON COLUMN "public"."florida_parcels"."FIDU_ADDR2" IS 'Fiduciary Address 2 - Agent mailing address line 2';



COMMENT ON COLUMN "public"."florida_parcels"."FIDU_CITY" IS 'Fiduciary City - Agent city';



COMMENT ON COLUMN "public"."florida_parcels"."FIDU_STATE" IS 'Fiduciary State - Agent state';



COMMENT ON COLUMN "public"."florida_parcels"."FIDU_ZIPCD" IS 'Fiduciary ZIP - Agent ZIP code';



COMMENT ON COLUMN "public"."florida_parcels"."FIDU_CD" IS 'Fiduciary Code - Type of fiduciary relationship';



COMMENT ON COLUMN "public"."florida_parcels"."S_LEGAL" IS 'Legal Description - Full legal description of property';



COMMENT ON COLUMN "public"."florida_parcels"."APP_STAT" IS 'Appraisal Status - Current appraisal status code';



COMMENT ON COLUMN "public"."florida_parcels"."CO_APP_STA" IS 'County Appraisal Status - County-specific status';



COMMENT ON COLUMN "public"."florida_parcels"."MKT_AR" IS 'Market Area - Market area code for comparables';



COMMENT ON COLUMN "public"."florida_parcels"."NBRHD_CD" IS 'Neighborhood Code - Neighborhood classification';



COMMENT ON COLUMN "public"."florida_parcels"."PUBLIC_LND" IS 'Public Land Indicator - Flag for government-owned property';



COMMENT ON COLUMN "public"."florida_parcels"."TAX_AUTH_C" IS 'Taxing Authority Code - Primary taxing authority';



COMMENT ON COLUMN "public"."florida_parcels"."TWN" IS 'Township - Township designation';



COMMENT ON COLUMN "public"."florida_parcels"."RNG" IS 'Range - Range designation';



COMMENT ON COLUMN "public"."florida_parcels"."SEC" IS 'Section - Section number (1-36)';



COMMENT ON COLUMN "public"."florida_parcels"."CENSUS_BK" IS 'Census Block - Census block identifier';



COMMENT ON COLUMN "public"."florida_parcels"."PHY_ADDR1" IS 'Physical Address Line 1 - Street address of property';



COMMENT ON COLUMN "public"."florida_parcels"."PHY_ADDR2" IS 'Physical Address Line 2 - Additional address information';



COMMENT ON COLUMN "public"."florida_parcels"."PHY_CITY" IS 'Physical City - City where property is located';



COMMENT ON COLUMN "public"."florida_parcels"."PHY_ZIPCD" IS 'Physical ZIP Code - ZIP code of property location';



COMMENT ON COLUMN "public"."florida_parcels"."ALT_KEY" IS 'Alternate Key - Alternative parcel identifier';



COMMENT ON COLUMN "public"."florida_parcels"."ASS_TRNSFR" IS 'Assessment Transfer - Related to Save Our Homes portability';



COMMENT ON COLUMN "public"."florida_parcels"."PREV_HMSTD" IS 'Previous Homestead - Previous homestead amount';



COMMENT ON COLUMN "public"."florida_parcels"."ASS_DIF_TR" IS 'Assessment Difference Transfer - Portable assessment difference';



COMMENT ON COLUMN "public"."florida_parcels"."CONO_PRV_H" IS 'County Number Previous Homestead - Previous homestead county';



COMMENT ON COLUMN "public"."florida_parcels"."PARCEL_ID_" IS 'Previous Parcel ID - ID before renumbering';



COMMENT ON COLUMN "public"."florida_parcels"."YR_VAL_TRN" IS 'Year Value Transfer - Year of value transfer';



COMMENT ON COLUMN "public"."florida_parcels"."SEQ_NO" IS 'Sequence Number - Record sequence identifier';



COMMENT ON COLUMN "public"."florida_parcels"."RS_ID" IS 'Roll Section ID - Tax roll section identifier';



COMMENT ON COLUMN "public"."florida_parcels"."MP_ID" IS 'Map ID - Mapping system identifier';



COMMENT ON COLUMN "public"."florida_parcels"."STATE_PAR_" IS 'State Parcel Number - Statewide parcel identifier';



COMMENT ON COLUMN "public"."florida_parcels"."SPC_CIR_CD" IS 'Special Circumstance Code - Code for special tax circumstances';



COMMENT ON COLUMN "public"."florida_parcels"."SPC_CIR_YR" IS 'Special Circumstance Year - Year special circumstance began';



COMMENT ON COLUMN "public"."florida_parcels"."SPC_CIR_TX" IS 'Special Circumstance Text - Description of special circumstance';



COMMENT ON COLUMN "public"."florida_parcels"."Shape_Length" IS 'Shape Length - Perimeter of parcel in map units';



COMMENT ON COLUMN "public"."florida_parcels"."Shape_Area" IS 'Shape Area - Area of parcel in map units';



COMMENT ON COLUMN "public"."florida_parcels"."geometry_wkt" IS 'Geometry WKT - Well-Known Text representation of parcel boundary';



COMMENT ON COLUMN "public"."florida_parcels"."county_id" IS 'County ID - Foreign key to florida_counties table';



COMMENT ON COLUMN "public"."florida_parcels"."created_at" IS 'Created At - Timestamp when record was created';



COMMENT ON COLUMN "public"."florida_parcels"."updated_at" IS 'Updated At - Timestamp when record was last modified';



COMMENT ON COLUMN "public"."florida_parcels"."own_state2" IS 'Secondary owner state';



COMMENT ON COLUMN "public"."florida_parcels"."own_zipcda" IS 'Owner ZIP code with additional digits';



COMMENT ON COLUMN "public"."florida_parcels"."nbrhd_cd1" IS 'Neighborhood code 1';



COMMENT ON COLUMN "public"."florida_parcels"."nbrhd_cd2" IS 'Neighborhood code 2';



COMMENT ON COLUMN "public"."florida_parcels"."nbrhd_cd3" IS 'Neighborhood code 3';



COMMENT ON COLUMN "public"."florida_parcels"."nbrhd_cd4" IS 'Neighborhood code 4';



COMMENT ON COLUMN "public"."florida_parcels"."dor_cd1" IS 'Department of Revenue code 1';



COMMENT ON COLUMN "public"."florida_parcels"."dor_cd2" IS 'Department of Revenue code 2';



COMMENT ON COLUMN "public"."florida_parcels"."dor_cd3" IS 'Department of Revenue code 3';



COMMENT ON COLUMN "public"."florida_parcels"."dor_cd4" IS 'Department of Revenue code 4';



COMMENT ON COLUMN "public"."florida_parcels"."ag_val" IS 'Agricultural value';



COMMENT ON COLUMN "public"."florida_parcels"."imp_val" IS 'Improvement value';



COMMENT ON COLUMN "public"."florida_parcels"."const_val" IS 'Construction value';



COMMENT ON COLUMN "public"."florida_parcels"."distr_no" IS 'District number';



COMMENT ON COLUMN "public"."florida_parcels"."front" IS 'Property frontage in feet';



COMMENT ON COLUMN "public"."florida_parcels"."depth" IS 'Property depth in feet';



COMMENT ON COLUMN "public"."florida_parcels"."latitude" IS 'Property latitude coordinate';



COMMENT ON COLUMN "public"."florida_parcels"."longitude" IS 'Property longitude coordinate';



COMMENT ON COLUMN "public"."florida_parcels"."pin_1" IS 'Parcel identification number 1';



COMMENT ON COLUMN "public"."florida_parcels"."pin_2" IS 'Parcel identification number 2';



COMMENT ON COLUMN "public"."florida_parcels"."half_cd" IS 'Half code';



COMMENT ON COLUMN "public"."florida_parcels"."twp" IS 'Township (additional field)';



COMMENT ON COLUMN "public"."florida_parcels"."sub" IS 'Subdivision';



COMMENT ON COLUMN "public"."florida_parcels"."blk" IS 'Block';



COMMENT ON COLUMN "public"."florida_parcels"."lot" IS 'Lot';



COMMENT ON COLUMN "public"."florida_parcels"."plat_book" IS 'Plat book reference';



COMMENT ON COLUMN "public"."florida_parcels"."plat_page" IS 'Plat page reference';



CREATE OR REPLACE VIEW "public"."florida_parcels_column_analysis" AS
 WITH "column_info" AS (
         SELECT "a"."attname" AS "column_name",
            "format_type"("a"."atttypid", "a"."atttypmod") AS "data_type",
            "a"."attnotnull" AS "not_null",
            "col_description"("pgc"."oid", ("a"."attnum")::integer) AS "description",
                CASE
                    WHEN (("a"."attname" ~~ '%YR%'::"text") OR ("a"."attname" = ANY (ARRAY['ASMNT_YR'::"name", 'DISTR_YR'::"name", 'ACT_YR_BLT'::"name", 'EFF_YR_BLT'::"name"]))) THEN 'Year'::"text"
                    WHEN (("a"."attname" ~~ '%VAL%'::"text") OR ("a"."attname" ~~ '%PRC%'::"text") OR ("a"."attname" ~~ 'JV%'::"text") OR ("a"."attname" ~~ 'AV%'::"text") OR ("a"."attname" ~~ 'TV%'::"text")) THEN 'Financial'::"text"
                    WHEN (("a"."attname" ~~ '%ADDR%'::"text") OR ("a"."attname" ~~ '%CITY%'::"text") OR ("a"."attname" ~~ '%STATE%'::"text") OR ("a"."attname" ~~ '%ZIP%'::"text")) THEN 'Address'::"text"
                    WHEN (("a"."attname" ~~ 'OWN_%'::"text") OR ("a"."attname" ~~ 'FIDU_%'::"text")) THEN 'Owner'::"text"
                    WHEN (("a"."attname" ~~ 'SALE_%'::"text") OR ("a"."attname" ~~ 'OR_%'::"text") OR ("a"."attname" ~~ 'CLERK%'::"text")) THEN 'Sales'::"text"
                    WHEN (("a"."attname" ~~ '%CD'::"text") OR ("a"."attname" ~~ '%UC'::"text") OR ("a"."attname" ~~ '%STAT%'::"text")) THEN 'Code'::"text"
                    WHEN ("a"."attname" = ANY (ARRAY['TWN'::"name", 'RNG'::"name", 'SEC'::"name", 'Shape_Length'::"name", 'Shape_Area'::"name", 'geometry_wkt'::"name"])) THEN 'Geographic'::"text"
                    WHEN ("a"."attname" = ANY (ARRAY['id'::"name", 'created_at'::"name", 'updated_at'::"name", 'county_id'::"name", 'county_fips'::"name"])) THEN 'System'::"text"
                    ELSE 'Other'::"text"
                END AS "category",
                CASE
                    WHEN ("format_type"("a"."atttypid", "a"."atttypmod") = 'double precision'::"text") THEN 'Numeric - Decimal'::"text"
                    WHEN ("format_type"("a"."atttypid", "a"."atttypmod") ~~ 'character varying%'::"text") THEN 'Text - Variable'::"text"
                    WHEN ("format_type"("a"."atttypid", "a"."atttypmod") = 'text'::"text") THEN 'Text - Unlimited'::"text"
                    WHEN ("format_type"("a"."atttypid", "a"."atttypmod") = 'bigint'::"text") THEN 'Numeric - Large Integer'::"text"
                    WHEN ("format_type"("a"."atttypid", "a"."atttypmod") = 'integer'::"text") THEN 'Numeric - Integer'::"text"
                    WHEN ("format_type"("a"."atttypid", "a"."atttypmod") ~~ 'timestamp%'::"text") THEN 'Date/Time'::"text"
                    WHEN ("format_type"("a"."atttypid", "a"."atttypmod") = 'uuid'::"text") THEN 'Unique Identifier'::"text"
                    ELSE "format_type"("a"."atttypid", "a"."atttypmod")
                END AS "type_category"
           FROM ("pg_attribute" "a"
             JOIN "pg_class" "pgc" ON (("pgc"."oid" = "a"."attrelid")))
          WHERE (("pgc"."relname" = 'florida_parcels'::"name") AND ("a"."attnum" > 0) AND (NOT "a"."attisdropped"))
        )
 SELECT "column_name",
    "data_type",
    "type_category",
    "category",
    "not_null",
    "description"
   FROM "column_info"
  ORDER BY
        CASE "category"
            WHEN 'System'::"text" THEN 1
            WHEN 'Financial'::"text" THEN 2
            WHEN 'Owner'::"text" THEN 3
            WHEN 'Address'::"text" THEN 4
            WHEN 'Sales'::"text" THEN 5
            WHEN 'Geographic'::"text" THEN 6
            WHEN 'Code'::"text" THEN 7
            ELSE 8
        END, "column_name";


ALTER VIEW "public"."florida_parcels_column_analysis" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."florida_parcels_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."florida_parcels_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."florida_parcels_id_seq" OWNED BY "public"."florida_parcels"."id";



CREATE OR REPLACE VIEW "public"."florida_parcels_summary" AS
 SELECT "p"."PARCEL_ID" AS "parcel_id",
    "p"."OWN_NAME" AS "owner_name",
    "p"."PHY_ADDR1" AS "physical_address",
    "p"."PHY_CITY" AS "city",
    "c"."county_name",
    "p"."JV" AS "just_value",
    "p"."LND_VAL" AS "land_value",
    "p"."NO_BULDNG" AS "building_count",
    "p"."TOT_LVG_AR" AS "total_living_area",
    "p"."ACT_YR_BLT" AS "year_built",
    "p"."SALE_PRC1" AS "last_sale_price",
    "p"."SALE_YR1" AS "last_sale_year",
    "c"."property_search_url",
    "c"."gis_url"
   FROM ("public"."florida_parcels" "p"
     LEFT JOIN "public"."florida_counties" "c" ON (("p"."county_id" = "c"."id")));


ALTER VIEW "public"."florida_parcels_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_companies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "naic_code" "text",
    "fl_code" "text",
    "name" "text",
    "company_type" "text",
    "status" "text",
    "lines_of_business" "text"[],
    "addresses" "jsonb",
    "contacts" "jsonb",
    "first_seen" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "raw" "xml",
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "last_verified_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);

ALTER TABLE ONLY "public"."insurance_companies" REPLICA IDENTITY FULL;


ALTER TABLE "public"."insurance_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_companies_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "naic_code" "text",
    "fl_code" "text",
    "name" "text",
    "company_type" "text",
    "status" "text",
    "lines_of_business" "text"[],
    "addresses" "jsonb",
    "contacts" "jsonb",
    "first_seen" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "raw" "xml",
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "valid_from" timestamp with time zone,
    "valid_to" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."insurance_companies_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."item_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "last_verified_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);

ALTER TABLE ONLY "public"."item_categories" REPLICA IDENTITY FULL;


ALTER TABLE "public"."item_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."item_categories_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "valid_from" timestamp with time zone,
    "valid_to" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."item_categories_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."item_types_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "label" "text" NOT NULL,
    "category" "uuid" NOT NULL,
    "icon" "text",
    "permit_required" boolean DEFAULT false,
    "typical_lifespan_years" integer,
    "maintenance_interval_months" integer,
    "insurance_relevant" boolean DEFAULT false,
    "insurance_fields" "text"[],
    "description" "text",
    "keywords" "text"[],
    "embedding" "public"."vector"(1536),
    "display_order" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "valid_from" timestamp with time zone,
    "valid_to" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "notes" "text",
    "custom_attributes" "jsonb"
);


ALTER TABLE "public"."item_types_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_activity" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "ip_address" "text",
    "user_agent" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text",
    "location_city" "text",
    "location_country" "text",
    "location_region" "text",
    "success" boolean DEFAULT false NOT NULL,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."login_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permit_types_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "florida_specific" boolean DEFAULT true,
    "custom_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "valid_from" timestamp with time zone,
    "valid_to" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."permit_types_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."physical_sites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "metadata" "jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."physical_sites" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."policy_clauses" AS
 SELECT "c"."clause_id",
    "d"."filing_id",
    "d"."file_name",
    "c"."clause_text",
    "c"."vec",
    "f"."company_name",
    "f"."filing_type"
   FROM (("external"."oir_clauses" "c"
     JOIN "external"."oir_docs" "d" ON (("c"."doc_pk" = "d"."pk")))
     JOIN "external"."oir_filings" "f" ON (("d"."filing_id" = "f"."filing_id")))
  WHERE ("c"."vec" IS NOT NULL);


ALTER VIEW "public"."policy_clauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "policy_id" "uuid",
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "file_type" "text" NOT NULL,
    "document_type" "public"."document_type_enum" DEFAULT 'policy'::"public"."document_type_enum" NOT NULL,
    "description" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "uploaded_by" "uuid" NOT NULL,
    CONSTRAINT "valid_file_size" CHECK ((("file_size" > 0) AND ("file_size" <= 52428800))),
    CONSTRAINT "valid_file_type" CHECK (("file_type" = ANY (ARRAY['application/pdf'::"text", 'image/png'::"text", 'image/jpeg'::"text", 'image/jpg'::"text"])))
);


ALTER TABLE "public"."policy_documents" OWNER TO "postgres";


COMMENT ON TABLE "public"."policy_documents" IS 'Stores metadata for uploaded policy documents';



COMMENT ON COLUMN "public"."policy_documents"."file_path" IS 'Path to file in Supabase Storage bucket';



COMMENT ON COLUMN "public"."policy_documents"."file_size" IS 'File size in bytes (max 50MB)';



COMMENT ON COLUMN "public"."policy_documents"."document_type" IS 'Type of document: policy, claim, or evidence';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "avatar_url" "text",
    "member_since" timestamp with time zone DEFAULT "now"(),
    "role" "public"."user_role_enum" DEFAULT 'user'::"public"."user_role_enum",
    "is_verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "x_handle" "text",
    "is_x_connected" boolean DEFAULT false,
    CONSTRAINT "phone_format" CHECK ((("phone" ~ '^\+?[1-9]\d{1,14}$'::"text") OR ("phone" IS NULL)))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_profiles"."x_handle" IS 'X (Twitter) handle without @ symbol';



COMMENT ON COLUMN "public"."user_profiles"."is_x_connected" IS 'Whether user has connected their X account';



CREATE OR REPLACE VIEW "public"."profiles" AS
 SELECT "id",
    "first_name",
    "last_name",
    "phone",
    "avatar_url",
    "member_since" AS "created_at",
    "member_since" AS "updated_at"
   FROM "public"."user_profiles";


ALTER VIEW "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties_backup_20250724" (
    "id" "uuid",
    "user_id" "uuid",
    "name" "text",
    "address" "jsonb",
    "year_built" integer,
    "square_feet" integer,
    "details" "jsonb",
    "insurance_carrier" "text",
    "insurance_policy_number" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "property_type" "text",
    "parcel_id" "text",
    "location" "public"."geometry"(Point,4326),
    "value" numeric(15,2),
    "insurability_score" integer,
    "street_address" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "county" "text",
    "country" "text"
);


ALTER TABLE "public"."properties_backup_20250724" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_ai_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "insight_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "predictions" "jsonb" DEFAULT '{}'::"jsonb",
    "recommendations" "jsonb" DEFAULT '[]'::"jsonb",
    "confidence_score" double precision,
    "data_sources" "jsonb" DEFAULT '[]'::"jsonb",
    "calculations" "jsonb" DEFAULT '{}'::"jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "model_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "property_ai_insights_insight_type_check" CHECK (("insight_type" = ANY (ARRAY['risk'::"text", 'value'::"text", 'maintenance'::"text", 'market'::"text", 'insurance'::"text"])))
);


ALTER TABLE "public"."property_ai_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_contractors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "claim_id" "uuid",
    "damage_id" "uuid",
    "company_name" "text" NOT NULL,
    "contact_name" "text",
    "license_number" "text",
    "phone" "text",
    "email" "text",
    "work_type" "text" NOT NULL,
    "scope_of_work" "text",
    "estimate_date" "date",
    "start_date" "date",
    "completion_date" "date",
    "warranty_expiration" "date",
    "estimate_amount" numeric(12,2),
    "contract_amount" numeric(12,2),
    "paid_amount" numeric(12,2),
    "estimate_url" "text",
    "contract_url" "text",
    "invoice_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "permit_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "work_quality_rating" integer,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    CONSTRAINT "property_contractors_work_quality_rating_check" CHECK ((("work_quality_rating" >= 1) AND ("work_quality_rating" <= 5)))
);


ALTER TABLE "public"."property_contractors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_damage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "claim_id" "uuid",
    "structure_id" "uuid",
    "assessment_date" "date" NOT NULL,
    "assessor_name" "text",
    "assessor_type" "text",
    "damage_type" "text" NOT NULL,
    "damage_severity" "public"."damage_severity" NOT NULL,
    "damage_description" "text",
    "location_description" "text",
    "affected_rooms" "jsonb" DEFAULT '[]'::"jsonb",
    "affected_systems" "jsonb" DEFAULT '[]'::"jsonb",
    "photo_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "video_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "report_url" "text",
    "estimated_repair_cost" numeric(12,2),
    "actual_repair_cost" numeric(12,2),
    "repair_completed_date" "date",
    "measurements" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "ai_severity_score" double precision,
    "ai_repair_estimate_low" numeric(12,2),
    "ai_repair_estimate_high" numeric(12,2),
    "ai_detected_materials" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_detected_damages" "jsonb" DEFAULT '[]'::"jsonb",
    "damage_embedding" "public"."vector"(1536),
    CONSTRAINT "property_damage_ai_severity_score_check" CHECK ((("ai_severity_score" >= (0)::double precision) AND ("ai_severity_score" <= (10)::double precision)))
);


ALTER TABLE "public"."property_damage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_insurance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "carrier_name" "text",
    "policy_number" "text",
    "policy_type" "text" DEFAULT 'homeowners'::"text",
    "effective_date" "date",
    "expiration_date" "date",
    "dwelling_coverage" numeric(12,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."property_insurance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_land" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "zoning_code" "text",
    "zoning_description" "text",
    "land_use_code" "text",
    "flood_zone" "text",
    "elevation_feet" numeric(8,2),
    "legal_description" "text",
    "assessed_land_value" numeric(12,2),
    "assessment_year" integer,
    "gis_data" "jsonb" DEFAULT '{}'::"jsonb",
    "environmental_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."property_land" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_structures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "structure_type" "text" NOT NULL,
    "structure_name" "text",
    "square_footage" integer,
    "stories" integer,
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "construction_type" "text",
    "foundation_type" "text",
    "exterior_walls" "text",
    "roof_type" "text",
    "roof_material" "text",
    "roof_age_years" integer,
    "overall_condition" "text",
    "last_renovation_date" "date",
    "construction_details" "jsonb" DEFAULT '{}'::"jsonb",
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."property_structures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_systems" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "structure_id" "uuid" NOT NULL,
    "system_type" "text" NOT NULL,
    "system_name" "text",
    "manufacturer" "text",
    "model_number" "text",
    "serial_number" "text",
    "install_date" "date",
    "warranty_expiration" "date",
    "last_inspection_date" "date",
    "last_service_date" "date",
    "condition_rating" integer,
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "maintenance_history" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    CONSTRAINT "property_systems_condition_rating_check" CHECK ((("condition_rating" >= 1) AND ("condition_rating" <= 10)))
);


ALTER TABLE "public"."property_systems" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."recent_login_activity" AS
 SELECT "id",
    "user_id",
    "ip_address",
    "user_agent",
    "device_type",
    "browser",
    "os",
    "location_city",
    "location_country",
    "location_region",
    "success",
    "failure_reason",
    "created_at",
    "count"(*) OVER (PARTITION BY "user_id") AS "total_logins",
    "count"(*) FILTER (WHERE ("success" = false)) OVER (PARTITION BY "user_id") AS "failed_attempts"
   FROM "public"."login_activity" "la"
  WHERE ("created_at" > ("now"() - '30 days'::interval));


ALTER VIEW "public"."recent_login_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scraper_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" NOT NULL,
    "level" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scraper_logs_level_check" CHECK (("level" = ANY (ARRAY['INFO'::"text", 'WARN'::"text", 'ERROR'::"text", 'DEBUG'::"text"])))
);


ALTER TABLE "public"."scraper_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scraper_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "last_object_id" bigint DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "records_processed" integer DEFAULT 0,
    CONSTRAINT "scraper_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."scraper_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scraper_runs" (
    "source" "text" NOT NULL,
    "last_object_id" bigint DEFAULT 0,
    "last_run_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."scraper_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "action" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."security_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."security_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."states" (
    "id" integer NOT NULL,
    "code" character(2) NOT NULL,
    "name" character varying(100) NOT NULL,
    "fips_code" character(2) NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."states" OWNER TO "postgres";


COMMENT ON TABLE "public"."states" IS 'US states with FIPS codes';



CREATE SEQUENCE IF NOT EXISTS "public"."states_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."states_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."states_id_seq" OWNED BY "public"."states"."id";



CREATE TABLE IF NOT EXISTS "public"."user_legal_acceptance" (
    "user_id" "uuid" NOT NULL,
    "legal_id" "uuid" NOT NULL,
    "accepted_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet",
    "user_agent" "text",
    "signature_data" "jsonb",
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."user_legal_acceptance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_type" "text" DEFAULT 'free'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_plans_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "user_plans_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."user_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_security_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "answer_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_security_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zip_codes" (
    "id" integer NOT NULL,
    "zip_code" character(5) NOT NULL,
    "city_id" integer,
    "county_id" integer,
    "state_id" integer,
    "primary_city" character varying(100) NOT NULL,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."zip_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."zip_codes" IS 'ZIP codes with geographic relationships';



CREATE SEQUENCE IF NOT EXISTS "public"."zip_codes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."zip_codes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."zip_codes_id_seq" OWNED BY "public"."zip_codes"."id";



ALTER TABLE ONLY "public"."cities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."counties" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."counties_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fdot_stage" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fdot_stage_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."florida_parcels" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."florida_parcels_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."states" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."states_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."zip_codes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."zip_codes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_models"
    ADD CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories_history"
    ADD CONSTRAINT "categories_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories_history"
    ADD CONSTRAINT "categories_history_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_status_history"
    ADD CONSTRAINT "claim_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counties"
    ADD CONSTRAINT "counties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counties"
    ADD CONSTRAINT "counties_state_id_fips_code_key" UNIQUE ("state_id", "fips_code");



ALTER TABLE ONLY "public"."coverage_types_history"
    ADD CONSTRAINT "coverage_types_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coverage_types_history"
    ADD CONSTRAINT "coverage_types_history_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."coverage_types"
    ADD CONSTRAINT "coverage_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coverage_types"
    ADD CONSTRAINT "coverage_types_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."crawl_runs"
    ADD CONSTRAINT "crawl_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."damage_ai_detections"
    ADD CONSTRAINT "damage_ai_detections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."debug_user_creation_logs"
    ADD CONSTRAINT "debug_user_creation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_ai_extractions"
    ADD CONSTRAINT "document_ai_extractions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_extractions"
    ADD CONSTRAINT "document_extractions_document_id_key" UNIQUE ("document_id");



ALTER TABLE ONLY "public"."document_extractions"
    ADD CONSTRAINT "document_extractions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fdot_stage"
    ADD CONSTRAINT "fdot_stage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_county_name_key" UNIQUE ("county_name");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_fips5_key" UNIQUE ("fips5");



ALTER TABLE ONLY "public"."fl_counties_history"
    ADD CONSTRAINT "fl_counties_history_county_name_key" UNIQUE ("county_name");



ALTER TABLE ONLY "public"."fl_counties_history"
    ADD CONSTRAINT "fl_counties_history_fips5_key" UNIQUE ("fips5");



ALTER TABLE ONLY "public"."fl_counties_history"
    ADD CONSTRAINT "fl_counties_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."floir_data_types_history"
    ADD CONSTRAINT "floir_data_types_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."floir_data_types_history"
    ADD CONSTRAINT "floir_data_types_history_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."florida_counties"
    ADD CONSTRAINT "florida_counties_county_code_key" UNIQUE ("county_code");



ALTER TABLE ONLY "public"."florida_counties"
    ADD CONSTRAINT "florida_counties_county_name_key" UNIQUE ("county_name");



ALTER TABLE ONLY "public"."florida_counties"
    ADD CONSTRAINT "florida_counties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."florida_parcels"
    ADD CONSTRAINT "florida_parcels_parcel_id_key" UNIQUE ("PARCEL_ID");



ALTER TABLE ONLY "public"."florida_parcels"
    ADD CONSTRAINT "florida_parcels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_companies_history"
    ADD CONSTRAINT "insurance_companies_history_naic_code_key" UNIQUE ("naic_code");



ALTER TABLE ONLY "public"."insurance_companies_history"
    ADD CONSTRAINT "insurance_companies_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_companies"
    ADD CONSTRAINT "insurance_companies_naic_code_key" UNIQUE ("naic_code");



ALTER TABLE ONLY "public"."insurance_companies"
    ADD CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."item_categories_history"
    ADD CONSTRAINT "item_categories_history_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."item_categories_history"
    ADD CONSTRAINT "item_categories_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."item_categories"
    ADD CONSTRAINT "item_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."item_categories"
    ADD CONSTRAINT "item_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."item_types_history"
    ADD CONSTRAINT "item_types_history_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."item_types_history"
    ADD CONSTRAINT "item_types_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_slug_effective_date_key" UNIQUE ("slug", "effective_date");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_slug_version_key" UNIQUE ("slug", "version");



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permit_types_history"
    ADD CONSTRAINT "permit_types_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permit_types_history"
    ADD CONSTRAINT "permit_types_history_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."physical_sites"
    ADD CONSTRAINT "physical_sites_parcel_id_key" UNIQUE ("parcel_id");



ALTER TABLE ONLY "public"."physical_sites"
    ADD CONSTRAINT "physical_sites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties_old"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_ai_insights"
    ADD CONSTRAINT "property_ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_contractors"
    ADD CONSTRAINT "property_contractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_damage"
    ADD CONSTRAINT "property_damage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_insurance"
    ADD CONSTRAINT "property_insurance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_land"
    ADD CONSTRAINT "property_land_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_structures"
    ADD CONSTRAINT "property_structures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_systems"
    ADD CONSTRAINT "property_systems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scraper_logs"
    ADD CONSTRAINT "scraper_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scraper_queue"
    ADD CONSTRAINT "scraper_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scraper_runs"
    ADD CONSTRAINT "scraper_runs_pkey" PRIMARY KEY ("source");



ALTER TABLE ONLY "public"."security_logs"
    ADD CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_questions"
    ADD CONSTRAINT "security_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_questions"
    ADD CONSTRAINT "security_questions_question_key" UNIQUE ("question");



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_models"
    ADD CONSTRAINT "unique_model_version" UNIQUE ("model_name", "model_version");



ALTER TABLE ONLY "public"."property_land"
    ADD CONSTRAINT "unique_property_land" UNIQUE ("property_id");



ALTER TABLE ONLY "public"."user_legal_acceptance"
    ADD CONSTRAINT "user_legal_acceptance_pkey" PRIMARY KEY ("user_id", "legal_id");



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_user_id_question_id_key" UNIQUE ("user_id", "question_id");



ALTER TABLE ONLY "public"."zip_codes"
    ADD CONSTRAINT "zip_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zip_codes"
    ADD CONSTRAINT "zip_codes_zip_code_city_id_key" UNIQUE ("zip_code", "city_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_ip" ON "public"."audit_logs" USING "btree" ("ip_address");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_cities_county_id" ON "public"."cities" USING "btree" ("county_id");



CREATE INDEX "idx_cities_state_id" ON "public"."cities" USING "btree" ("state_id");



CREATE INDEX "idx_claim_status_history_claim_id" ON "public"."claim_status_history" USING "btree" ("claim_id");



CREATE INDEX "idx_claims_claim_number" ON "public"."claims" USING "btree" ("claim_number");



CREATE INDEX "idx_claims_date_of_loss" ON "public"."claims" USING "btree" ("date_of_loss");



CREATE INDEX "idx_claims_policy_id" ON "public"."claims" USING "btree" ("policy_id");



CREATE INDEX "idx_claims_property_id" ON "public"."claims" USING "btree" ("property_id");



CREATE INDEX "idx_claims_status" ON "public"."claims" USING "btree" ("status");



CREATE INDEX "idx_claims_user_id" ON "public"."claims" USING "btree" ("user_id");



CREATE INDEX "idx_counties_fips" ON "public"."counties" USING "btree" ("fips_code");



CREATE INDEX "idx_counties_state_id" ON "public"."counties" USING "btree" ("state_id");



CREATE INDEX "idx_damage_detections_damage" ON "public"."damage_ai_detections" USING "btree" ("damage_id");



CREATE INDEX "idx_document_extractions_confidence" ON "public"."document_extractions" USING "btree" ("confidence_score" DESC);



CREATE INDEX "idx_document_extractions_created_at" ON "public"."document_extractions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_document_extractions_document" ON "public"."document_ai_extractions" USING "btree" ("document_id");



CREATE INDEX "idx_document_extractions_document_id" ON "public"."document_extractions" USING "btree" ("document_id");



CREATE INDEX "idx_document_extractions_processed_by" ON "public"."document_extractions" USING "btree" ("processed_by");



CREATE INDEX "idx_document_extractions_property_id" ON "public"."document_extractions" USING "btree" ("property_id");



CREATE INDEX "idx_document_extractions_status" ON "public"."document_extractions" USING "btree" ("processing_status");



CREATE INDEX "idx_fdot_stage_geom" ON "public"."fdot_stage" USING "gist" ("geom");



CREATE INDEX "idx_florida_counties_coastal" ON "public"."florida_counties" USING "btree" ("coastal_county");



CREATE INDEX "idx_florida_counties_code" ON "public"."florida_counties" USING "btree" ("county_code");



CREATE INDEX "idx_florida_counties_fema_region" ON "public"."florida_counties" USING "btree" ("fema_region");



CREATE INDEX "idx_florida_counties_gis_url" ON "public"."florida_counties" USING "btree" ("gis_url") WHERE ("gis_url" IS NOT NULL);



CREATE INDEX "idx_florida_counties_name" ON "public"."florida_counties" USING "btree" ("county_name");



CREATE INDEX "idx_florida_counties_property_search_url" ON "public"."florida_counties" USING "btree" ("property_search_url") WHERE ("property_search_url" IS NOT NULL);



CREATE INDEX "idx_florida_counties_region" ON "public"."florida_counties" USING "btree" ("region");



CREATE INDEX "idx_florida_parcels_asmnt_yr" ON "public"."florida_parcels" USING "btree" ("ASMNT_YR");



CREATE INDEX "idx_florida_parcels_co_no" ON "public"."florida_parcels" USING "btree" ("co_no");



CREATE INDEX "idx_florida_parcels_county_id" ON "public"."florida_parcels" USING "btree" ("county_id");



CREATE INDEX "idx_florida_parcels_created_at" ON "public"."florida_parcels" USING "btree" ("created_at");



CREATE INDEX "idx_florida_parcels_data_source" ON "public"."florida_parcels" USING "btree" ("data_source");



CREATE INDEX "idx_florida_parcels_dor_uc" ON "public"."florida_parcels" USING "btree" ("DOR_UC");



CREATE INDEX "idx_florida_parcels_jv" ON "public"."florida_parcels" USING "btree" ("JV");



CREATE INDEX "idx_florida_parcels_latitude" ON "public"."florida_parcels" USING "btree" ("latitude");



CREATE INDEX "idx_florida_parcels_longitude" ON "public"."florida_parcels" USING "btree" ("longitude");



CREATE INDEX "idx_florida_parcels_nbrhd_cd1" ON "public"."florida_parcels" USING "btree" ("nbrhd_cd1");



CREATE INDEX "idx_florida_parcels_objectid" ON "public"."florida_parcels" USING "btree" ("objectid");



CREATE INDEX "idx_florida_parcels_own_name" ON "public"."florida_parcels" USING "btree" ("OWN_NAME");



CREATE INDEX "idx_florida_parcels_own_state" ON "public"."florida_parcels" USING "btree" ("OWN_STATE");



CREATE INDEX "idx_florida_parcels_parcel_id" ON "public"."florida_parcels" USING "btree" ("PARCEL_ID");



CREATE INDEX "idx_florida_parcels_parcel_id_duplicates" ON "public"."florida_parcels" USING "btree" ("parcel_id") WHERE ("parcel_id" IS NOT NULL);



CREATE INDEX "idx_florida_parcels_phy_addr" ON "public"."florida_parcels" USING "btree" ("PHY_ADDR1");



CREATE INDEX "idx_florida_parcels_phy_city" ON "public"."florida_parcels" USING "btree" ("PHY_CITY");



CREATE INDEX "idx_florida_parcels_pin_1" ON "public"."florida_parcels" USING "btree" ("pin_1");



CREATE INDEX "idx_florida_parcels_sale_prc" ON "public"."florida_parcels" USING "btree" ("SALE_PRC1") WHERE ("SALE_PRC1" > (0)::double precision);



CREATE INDEX "idx_florida_parcels_sale_yr1" ON "public"."florida_parcels" USING "btree" ("SALE_YR1");



CREATE INDEX "idx_legal_documents_effective_date" ON "public"."legal_documents" USING "btree" ("effective_date" DESC);



CREATE INDEX "idx_legal_documents_slug_active" ON "public"."legal_documents" USING "btree" ("slug", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_login_activity_created_at" ON "public"."login_activity" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_login_activity_user_created" ON "public"."login_activity" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_login_activity_user_id" ON "public"."login_activity" USING "btree" ("user_id");



CREATE INDEX "idx_physical_sites_parcel_id" ON "public"."physical_sites" USING "btree" ("parcel_id");



CREATE INDEX "idx_policy_documents_document_type" ON "public"."policy_documents" USING "btree" ("document_type");



CREATE INDEX "idx_policy_documents_policy_id" ON "public"."policy_documents" USING "btree" ("policy_id");



CREATE INDEX "idx_policy_documents_property_id" ON "public"."policy_documents" USING "btree" ("property_id");



CREATE INDEX "idx_policy_documents_uploaded_at" ON "public"."policy_documents" USING "btree" ("uploaded_at" DESC);



CREATE INDEX "idx_policy_documents_uploaded_by" ON "public"."policy_documents" USING "btree" ("uploaded_by");



CREATE INDEX "idx_properties_city_state" ON "public"."properties_old" USING "btree" ("city", "state");



CREATE INDEX "idx_properties_location" ON "public"."properties_old" USING "gist" ("location");



CREATE INDEX "idx_properties_postal_code" ON "public"."properties_old" USING "btree" ("postal_code");



CREATE INDEX "idx_properties_street_address" ON "public"."properties_old" USING "btree" ("street_address");



CREATE INDEX "idx_properties_user" ON "public"."properties_old" USING "btree" ("user_id");



CREATE INDEX "idx_property_contractors_property" ON "public"."property_contractors" USING "btree" ("property_id");



CREATE INDEX "idx_property_damage_property" ON "public"."property_damage" USING "btree" ("property_id");



CREATE INDEX "idx_property_insights_active" ON "public"."property_ai_insights" USING "btree" ("is_active", "expires_at");



CREATE INDEX "idx_property_insights_property" ON "public"."property_ai_insights" USING "btree" ("property_id");



CREATE INDEX "idx_property_insights_type" ON "public"."property_ai_insights" USING "btree" ("insight_type");



CREATE INDEX "idx_property_land_property" ON "public"."property_land" USING "btree" ("property_id");



CREATE INDEX "idx_property_structures_property" ON "public"."property_structures" USING "btree" ("property_id");



CREATE INDEX "idx_property_systems_structure" ON "public"."property_systems" USING "btree" ("structure_id");



CREATE INDEX "idx_scraper_logs_level" ON "public"."scraper_logs" USING "btree" ("level");



CREATE INDEX "idx_scraper_logs_source" ON "public"."scraper_logs" USING "btree" ("source");



CREATE INDEX "idx_scraper_logs_timestamp" ON "public"."scraper_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_security_logs_action" ON "public"."security_logs" USING "btree" ("action");



CREATE INDEX "idx_security_logs_created_at" ON "public"."security_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_security_logs_ip" ON "public"."security_logs" USING "btree" ("ip_address");



CREATE INDEX "idx_security_logs_user_id" ON "public"."security_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_legal_acceptance_accepted_at" ON "public"."user_legal_acceptance" USING "btree" ("accepted_at" DESC);



CREATE INDEX "idx_user_legal_acceptance_user_id" ON "public"."user_legal_acceptance" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_id" ON "public"."user_profiles" USING "btree" ("id");



CREATE INDEX "idx_user_security_answers_question_id" ON "public"."user_security_answers" USING "btree" ("question_id");



CREATE INDEX "idx_user_security_answers_user_id" ON "public"."user_security_answers" USING "btree" ("user_id");



CREATE INDEX "idx_zip_codes_county_id" ON "public"."zip_codes" USING "btree" ("county_id");



CREATE INDEX "idx_zip_codes_state_id" ON "public"."zip_codes" USING "btree" ("state_id");



CREATE INDEX "idx_zip_codes_zip" ON "public"."zip_codes" USING "btree" ("zip_code");



CREATE OR REPLACE TRIGGER "generate_claim_number_trigger" BEFORE INSERT ON "public"."claims" FOR EACH ROW WHEN (("new"."claim_number" IS NULL)) EXECUTE FUNCTION "public"."generate_claim_number"();



CREATE OR REPLACE TRIGGER "on_profile_updated" AFTER UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_profile_update"();



COMMENT ON TRIGGER "on_profile_updated" ON "public"."user_profiles" IS 'Syncs user profile changes back to auth.users metadata';



CREATE OR REPLACE TRIGGER "on_scraper_request" AFTER INSERT OR UPDATE ON "public"."scraper_queue" FOR EACH ROW EXECUTE FUNCTION "public"."notify_scraper_webhook"();



CREATE OR REPLACE TRIGGER "trg_categories_audit" BEFORE INSERT OR DELETE OR UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."audit_and_version"();



CREATE OR REPLACE TRIGGER "trg_coverage_types_audit" BEFORE INSERT OR DELETE OR UPDATE ON "public"."coverage_types" FOR EACH ROW EXECUTE FUNCTION "public"."audit_and_version"();



CREATE OR REPLACE TRIGGER "trg_fl_counties_audit" BEFORE INSERT OR DELETE OR UPDATE ON "public"."fl_counties" FOR EACH ROW EXECUTE FUNCTION "public"."audit_and_version"();



CREATE OR REPLACE TRIGGER "trg_insurance_companies_audit" BEFORE INSERT OR DELETE OR UPDATE ON "public"."insurance_companies" FOR EACH ROW EXECUTE FUNCTION "public"."audit_and_version"();



CREATE OR REPLACE TRIGGER "trg_item_categories_audit" BEFORE INSERT OR DELETE OR UPDATE ON "public"."item_categories" FOR EACH ROW EXECUTE FUNCTION "public"."audit_and_version"();



CREATE OR REPLACE TRIGGER "trigger_link_parcel_to_county" BEFORE INSERT OR UPDATE ON "public"."florida_parcels" FOR EACH ROW EXECUTE FUNCTION "public"."link_parcel_to_county"();



CREATE OR REPLACE TRIGGER "trigger_prevent_backdating" BEFORE INSERT OR UPDATE ON "public"."legal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_backdating"();



CREATE OR REPLACE TRIGGER "trigger_update_document_extractions_updated_at" BEFORE UPDATE ON "public"."document_extractions" FOR EACH ROW EXECUTE FUNCTION "public"."update_document_extractions_updated_at"();



CREATE OR REPLACE TRIGGER "update_claims_updated_at" BEFORE UPDATE ON "public"."claims" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties_old" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_property_insurance_updated_at" BEFORE UPDATE ON "public"."property_insurance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_property_land_updated_at" BEFORE UPDATE ON "public"."property_land" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_property_structures_updated_at" BEFORE UPDATE ON "public"."property_structures" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_plans_updated_at" BEFORE UPDATE ON "public"."user_plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claim_status_history"
    ADD CONSTRAINT "claim_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."claim_status_history"
    ADD CONSTRAINT "claim_status_history_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."counties"
    ADD CONSTRAINT "counties_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."damage_ai_detections"
    ADD CONSTRAINT "damage_ai_detections_damage_id_fkey" FOREIGN KEY ("damage_id") REFERENCES "public"."property_damage"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."damage_ai_detections"
    ADD CONSTRAINT "damage_ai_detections_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id");



ALTER TABLE ONLY "public"."document_ai_extractions"
    ADD CONSTRAINT "document_ai_extractions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."policy_documents"("id");



ALTER TABLE ONLY "public"."document_ai_extractions"
    ADD CONSTRAINT "document_ai_extractions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id");



ALTER TABLE ONLY "public"."document_extractions"
    ADD CONSTRAINT "document_extractions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."policy_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_extractions"
    ADD CONSTRAINT "document_extractions_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_extractions"
    ADD CONSTRAINT "document_extractions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."florida_parcels"
    ADD CONSTRAINT "florida_parcels_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."florida_counties"("id");



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."properties_old"
    ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_ai_insights"
    ADD CONSTRAINT "property_ai_insights_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id");



ALTER TABLE ONLY "public"."property_contractors"
    ADD CONSTRAINT "property_contractors_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_contractors"
    ADD CONSTRAINT "property_contractors_damage_id_fkey" FOREIGN KEY ("damage_id") REFERENCES "public"."property_damage"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_damage"
    ADD CONSTRAINT "property_damage_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_damage"
    ADD CONSTRAINT "property_damage_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "public"."property_structures"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_systems"
    ADD CONSTRAINT "property_systems_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "public"."property_structures"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_logs"
    ADD CONSTRAINT "security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_legal_acceptance"
    ADD CONSTRAINT "user_legal_acceptance_legal_id_fkey" FOREIGN KEY ("legal_id") REFERENCES "public"."legal_documents"("id");



ALTER TABLE ONLY "public"."user_legal_acceptance"
    ADD CONSTRAINT "user_legal_acceptance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."security_questions"("id");



ALTER TABLE ONLY "public"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zip_codes"
    ADD CONSTRAINT "zip_codes_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zip_codes"
    ADD CONSTRAINT "zip_codes_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zip_codes"
    ADD CONSTRAINT "zip_codes_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE;



CREATE POLICY "Allow service_role full access to scraper_runs" ON "public"."scraper_runs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Anon users can insert scraper logs" ON "public"."scraper_logs" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon users can read scraper logs" ON "public"."scraper_logs" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Authenticated users full access" ON "public"."scraper_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Counties are viewable by all users" ON "public"."florida_counties" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."florida_parcels" FOR SELECT USING (true);



CREATE POLICY "Enable update for admin users" ON "public"."florida_parcels" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Enable write for authenticated users" ON "public"."florida_parcels" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Legal documents are viewable by everyone" ON "public"."legal_documents" FOR SELECT USING (true);



CREATE POLICY "Only admins can modify counties" ON "public"."florida_counties" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Public read access to cities" ON "public"."cities" FOR SELECT USING (true);



CREATE POLICY "Public read access to counties" ON "public"."counties" FOR SELECT USING (true);



CREATE POLICY "Public read access to states" ON "public"."states" FOR SELECT USING (true);



CREATE POLICY "Public read access to zip codes" ON "public"."zip_codes" FOR SELECT USING (true);



CREATE POLICY "Security questions are viewable by everyone" ON "public"."security_questions" FOR SELECT USING (true);



CREATE POLICY "Service role can do everything" ON "public"."physical_sites" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can insert security logs" ON "public"."security_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can manage scraper queue" ON "public"."scraper_queue" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."scraper_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create their own claims" ON "public"."claims" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own properties" ON "public"."properties_old" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own security answers" ON "public"."user_security_answers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own documents" ON "public"."policy_documents" FOR DELETE USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can delete their own extractions" ON "public"."document_extractions" FOR DELETE USING (("processed_by" = "auth"."uid"()));



CREATE POLICY "Users can insert own legal acceptances" ON "public"."user_legal_acceptance" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own properties" ON "public"."properties_old" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own security answers" ON "public"."user_security_answers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own documents" ON "public"."policy_documents" FOR INSERT WITH CHECK (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can insert their own extractions" ON "public"."document_extractions" FOR INSERT WITH CHECK (("processed_by" = "auth"."uid"()));



CREATE POLICY "Users can update own plan" ON "public"."user_plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own properties" ON "public"."properties_old" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own security answers" ON "public"."user_security_answers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own claims" ON "public"."claims" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own documents" ON "public"."policy_documents" FOR UPDATE USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own extractions" ON "public"."document_extractions" FOR UPDATE USING (("processed_by" = "auth"."uid"()));



CREATE POLICY "Users can view own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own legal acceptances" ON "public"."user_legal_acceptance" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own plan" ON "public"."user_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own properties" ON "public"."properties_old" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own security answers" ON "public"."user_security_answers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view status history for their claims" ON "public"."claim_status_history" FOR SELECT USING (("claim_id" IN ( SELECT "claims"."id"
   FROM "public"."claims"
  WHERE ("claims"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own claims" ON "public"."claims" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own documents" ON "public"."policy_documents" FOR SELECT USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own extractions" ON "public"."document_extractions" FOR SELECT USING (("processed_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."counties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coverage_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crawl_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."damage_ai_detections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_ai_extractions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_extractions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fl_counties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."florida_counties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."florida_parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."item_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."physical_sites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties_old" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_damage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_insurance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_land" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_structures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_systems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scraper_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scraper_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scraper_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sel_categories_active" ON "public"."categories" FOR SELECT TO "authenticated" USING ((NOT "is_deleted"));



CREATE POLICY "sel_coverage_types_active" ON "public"."coverage_types" FOR SELECT TO "authenticated" USING ((NOT "is_deleted"));



CREATE POLICY "sel_fl_counties_active" ON "public"."fl_counties" FOR SELECT TO "authenticated" USING ((NOT "is_deleted"));



CREATE POLICY "sel_insurance_companies_active" ON "public"."insurance_companies" FOR SELECT TO "authenticated" USING ((NOT "is_deleted"));



CREATE POLICY "sel_item_categories_active" ON "public"."item_categories" FOR SELECT TO "authenticated" USING ((NOT "is_deleted"));



ALTER TABLE "public"."states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_legal_acceptance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_security_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zip_codes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TYPE "public"."crawl_status" TO "anon";
GRANT ALL ON TYPE "public"."crawl_status" TO "authenticated";
GRANT ALL ON TYPE "public"."crawl_status" TO "service_role";



GRANT ALL ON TYPE "public"."floir_data_type" TO "anon";
GRANT ALL ON TYPE "public"."floir_data_type" TO "authenticated";
GRANT ALL ON TYPE "public"."floir_data_type" TO "service_role";



GRANT ALL ON TYPE "public"."import_status" TO "anon";
GRANT ALL ON TYPE "public"."import_status" TO "authenticated";
GRANT ALL ON TYPE "public"."import_status" TO "service_role";



GRANT ALL ON TYPE "public"."parcel_data_source" TO "anon";
GRANT ALL ON TYPE "public"."parcel_data_source" TO "authenticated";
GRANT ALL ON TYPE "public"."parcel_data_source" TO "service_role";



GRANT ALL ON FUNCTION "public"."_add_column_if_absent"("p_table" "text", "p_column" "text", "p_type" "text", "p_default" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_add_column_if_absent"("p_table" "text", "p_column" "text", "p_type" "text", "p_default" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_add_column_if_absent"("p_table" "text", "p_column" "text", "p_type" "text", "p_default" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_add_jsonb_col"("p_table" "text", "p_col" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_add_jsonb_col"("p_table" "text", "p_col" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_add_jsonb_col"("p_table" "text", "p_col" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_and_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_and_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_and_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_populate_county"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_populate_county"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_populate_county"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_florida_parcels_duplicates"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_florida_parcels_duplicates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_florida_parcels_duplicates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_florida_parcels_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_florida_parcels_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_florida_parcels_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."extract_county_from_address"("p_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_county_from_address"("p_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_county_from_address"("p_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "anon";
GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" json) TO "anon";
GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" json) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_similar_properties"("p_property_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_similar_properties"("p_property_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_similar_properties"("p_property_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."legal_documents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."legal_documents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."legal_documents" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_usage_stats"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_usage_stats"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_usage_stats"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_counties" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_counties" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_counties" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_coastal_counties"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_coastal_counties"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_coastal_counties"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_counties_by_region"("p_region" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_counties_by_region"("p_region" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_counties_by_region"("p_region" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_county_building_requirements"("p_county_identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_county_building_requirements"("p_county_identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_county_building_requirements"("p_county_identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_county_for_property"("p_property_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_county_for_property"("p_property_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_county_for_property"("p_property_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_county_name"("fips_code" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_county_name"("fips_code" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_county_name"("fips_code" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_county_property_appraiser"("p_county_identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_county_property_appraiser"("p_county_identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_county_property_appraiser"("p_county_identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_florida_county"("p_identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_florida_county"("p_identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_florida_county"("p_identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_claim_details"("p_claim_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_claim_details"("p_claim_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_claim_details"("p_claim_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_parcel_counts_by_county"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_parcel_counts_by_county"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parcel_counts_by_county"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_parcel_stats_by_county"("p_county_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_parcel_stats_by_county"("p_county_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parcel_stats_by_county"("p_county_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_parcel_with_county"("p_parcel_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_parcel_with_county"("p_parcel_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parcel_with_county"("p_parcel_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_parcels_column_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_parcels_column_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parcels_column_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_florida_parcels_uppercase"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_florida_parcels_uppercase"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_florida_parcels_uppercase"() TO "service_role";



GRANT ALL ON FUNCTION "public"."link_parcel_to_county"() TO "anon";
GRANT ALL ON FUNCTION "public"."link_parcel_to_county"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_parcel_to_county"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_creation_debug"("p_user_id" "uuid", "p_step" "text", "p_success" boolean, "p_error_message" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_creation_debug"("p_user_id" "uuid", "p_step" "text", "p_success" boolean, "p_error_message" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_creation_debug"("p_user_id" "uuid", "p_step" "text", "p_success" boolean, "p_error_message" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."max_objectid_for_county"("cnty_layer" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."max_objectid_for_county"("cnty_layer" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."max_objectid_for_county"("cnty_layer" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."merge_license_into_contractor"() TO "anon";
GRANT ALL ON FUNCTION "public"."merge_license_into_contractor"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_license_into_contractor"() TO "service_role";



GRANT ALL ON FUNCTION "public"."needs_reaccept"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."needs_reaccept"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."needs_reaccept"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_scraper_webhook"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_scraper_webhook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_scraper_webhook"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."queue_county_scraping"() TO "anon";
GRANT ALL ON FUNCTION "public"."queue_county_scraping"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_county_scraping"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_parcels_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_parcels_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_parcels_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_floir_data"("query_embedding" "public"."vector", "data_types" "public"."floir_data_type"[], "match_threshold" double precision, "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_floir_data"("query_embedding" "public"."vector", "data_types" "public"."floir_data_type"[], "match_threshold" double precision, "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_floir_data"("query_embedding" "public"."vector", "data_types" "public"."floir_data_type"[], "match_threshold" double precision, "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_parcels_by_owner"("p_owner_name" "text", "p_county_fips" integer, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_parcels_by_owner"("p_owner_name" "text", "p_county_fips" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_parcels_by_owner"("p_owner_name" "text", "p_county_fips" integer, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."suggest_type_optimizations"() TO "anon";
GRANT ALL ON FUNCTION "public"."suggest_type_optimizations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."suggest_type_optimizations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_florida_parcels_staging"() TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_florida_parcels_staging"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_florida_parcels_staging"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_all_property_counties"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_all_property_counties"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_all_property_counties"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_extractions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_extractions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_extractions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_florida_counties_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_florida_counties_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_florida_counties_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_property_embedding"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_property_embedding"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_property_embedding"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_parcel_data"("p_parcel_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_parcel_data"("p_parcel_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_parcel_data"("p_parcel_id" character varying) TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_old" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_old" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_old" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."categories_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cities" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cities" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_status_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_status_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_status_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."counties" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."counties" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."counties" TO "service_role";



GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."coverage_types" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."coverage_types" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."coverage_types" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."coverage_types_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."coverage_types_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."coverage_types_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."crawl_runs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."crawl_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."crawl_runs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."damage_ai_detections" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."damage_ai_detections" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."damage_ai_detections" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."debug_user_creation_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."debug_user_creation_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."debug_user_creation_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."document_ai_extractions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."document_ai_extractions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."document_ai_extractions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."document_extractions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."document_extractions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."document_extractions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_stage" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_stage" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_stage" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fl_counties" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fl_counties" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fl_counties" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fl_counties_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fl_counties_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fl_counties_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."floir_data_types_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."floir_data_types_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."floir_data_types_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_column_analysis" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_column_analysis" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_column_analysis" TO "service_role";



GRANT ALL ON SEQUENCE "public"."florida_parcels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."florida_parcels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."florida_parcels_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_summary" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_summary" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_summary" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_companies" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_companies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_companies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_companies_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_companies_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_companies_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_categories" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_categories" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_categories" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_categories_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_categories_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_categories_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_types_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_types_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."item_types_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."login_activity" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."login_activity" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."login_activity" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."permit_types_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."permit_types_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."permit_types_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."physical_sites" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."physical_sites" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."physical_sites" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_clauses" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_clauses" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_clauses" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_documents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_documents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_documents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_backup_20250724" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_backup_20250724" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_backup_20250724" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_ai_insights" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_ai_insights" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_ai_insights" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_contractors" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_contractors" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_contractors" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_damage" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_damage" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_damage" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_insurance" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_insurance" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_insurance" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_land" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_land" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_land" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_structures" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_structures" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_structures" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_systems" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_systems" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_systems" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."recent_login_activity" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."recent_login_activity" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."recent_login_activity" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_queue" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_queue" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_queue" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_runs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_runs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."scraper_runs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_questions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_questions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_questions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."states" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."states" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."states" TO "service_role";



GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_legal_acceptance" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_legal_acceptance" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_legal_acceptance" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_plans" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_plans" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_plans" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_security_answers" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_security_answers" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_security_answers" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."zip_codes" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."zip_codes" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."zip_codes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."zip_codes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."zip_codes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."zip_codes_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";






RESET ALL;
