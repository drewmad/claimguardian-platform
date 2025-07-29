

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


CREATE SCHEMA IF NOT EXISTS "contractor_connection";


ALTER SCHEMA "contractor_connection" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "core";


ALTER SCHEMA "core" OWNER TO "postgres";


COMMENT ON SCHEMA "core" IS 'Core business domain tables';



CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "etl";


ALTER SCHEMA "etl" OWNER TO "postgres";


COMMENT ON SCHEMA "etl" IS 'ETL staging and temporary tables';



CREATE SCHEMA IF NOT EXISTS "external";


ALTER SCHEMA "external" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "external_raw_fl";


ALTER SCHEMA "external_raw_fl" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "history";


ALTER SCHEMA "history" OWNER TO "postgres";


COMMENT ON SCHEMA "history" IS 'Historical and partitioned data';



CREATE SCHEMA IF NOT EXISTS "monitoring";


ALTER SCHEMA "monitoring" OWNER TO "postgres";


COMMENT ON SCHEMA "monitoring" IS 'System monitoring and operational tables';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "reference";


ALTER SCHEMA "reference" OWNER TO "postgres";


COMMENT ON SCHEMA "reference" IS 'Reference data and lookup tables';



CREATE SCHEMA IF NOT EXISTS "security";


ALTER SCHEMA "security" OWNER TO "postgres";


COMMENT ON SCHEMA "security" IS 'Security and audit logging tables';



CREATE SCHEMA IF NOT EXISTS "test";


ALTER SCHEMA "test" OWNER TO "postgres";


COMMENT ON SCHEMA "test" IS 'pgTAP test functions';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






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


CREATE TYPE "public"."processing_status_enum" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE "public"."processing_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'residential',
    'commercial',
    'land',
    'mixed_use'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role_enum" AS ENUM (
    'user',
    'contractor',
    'adjuster',
    'admin',
    'super_admin'
);


ALTER TYPE "public"."user_role_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."generate_claim_number"() RETURNS "text"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "core"."generate_claim_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."generate_uuid"() RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$;


ALTER FUNCTION "core"."generate_uuid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."refresh_summaries"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY core.property_claims_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY core.policy_coverage_summary;
END;
$$;


ALTER FUNCTION "core"."refresh_summaries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."set_claim_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.claim_number IS NULL THEN
        NEW.claim_number := core.generate_claim_number();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "core"."set_claim_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "core"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."user_has_role"("check_user_id" "uuid", "check_roles" "public"."user_role_enum"[]) RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
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


ALTER FUNCTION "core"."user_has_role"("check_user_id" "uuid", "check_roles" "public"."user_role_enum"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."validate_claim_timeline"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update claim status when timeline entry is added
    IF TG_OP = 'INSERT' THEN
        UPDATE core.claim 
        SET status = NEW.status 
        WHERE id = NEW.claim_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "core"."validate_claim_timeline"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."validate_email"("email" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$_$;


ALTER FUNCTION "core"."validate_email"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."validate_phone"("phone" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
    RETURN phone ~ '^\+?[1-9]\d{1,14}$';
END;
$_$;


ALTER FUNCTION "core"."validate_phone"("phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "monitoring"."analyze_table_sizes"() RETURNS TABLE("schema_name" "text", "table_name" "text", "total_size" "text", "table_size" "text", "indexes_size" "text", "row_estimate" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::TEXT as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename))::TEXT as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename))::TEXT as indexes_size,
        n_live_tup as row_estimate
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$;


ALTER FUNCTION "monitoring"."analyze_table_sizes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "monitoring"."check_data_quality"() RETURNS TABLE("rule_name" "text", "passed" boolean, "details" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rule RECORD;
    result INTEGER;
BEGIN
    FOR rule IN SELECT * FROM monitoring.data_quality_rule WHERE is_active = true LOOP
        EXECUTE rule.check_sql INTO result;
        
        INSERT INTO monitoring.data_quality_result (
            rule_id, 
            passed, 
            actual_result, 
            row_count
        ) VALUES (
            rule.id,
            result::TEXT = rule.expected_result,
            result::TEXT,
            result
        );
        
        RETURN QUERY SELECT 
            rule.rule_name,
            result::TEXT = rule.expected_result,
            CASE 
                WHEN result::TEXT = rule.expected_result THEN 'PASS'
                ELSE format('FAIL: Expected %s, got %s', rule.expected_result, result)
            END;
    END LOOP;
END;
$$;


ALTER FUNCTION "monitoring"."check_data_quality"() OWNER TO "postgres";


COMMENT ON FUNCTION "monitoring"."check_data_quality"() IS 'Run all active data quality checks';



CREATE OR REPLACE FUNCTION "monitoring"."find_slow_queries"("threshold_ms" integer DEFAULT 1000) RETURNS TABLE("query" "text", "calls" bigint, "total_time" numeric, "mean_time" numeric, "max_time" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        substr(query, 1, 100)::TEXT as query,
        calls,
        round(total_exec_time::numeric, 2) as total_time,
        round(mean_exec_time::numeric, 2) as mean_time,
        round(max_exec_time::numeric, 2) as max_time
    FROM pg_stat_statements
    WHERE mean_exec_time > threshold_ms
    ORDER BY mean_exec_time DESC
    LIMIT 20;
END;
$$;


ALTER FUNCTION "monitoring"."find_slow_queries"("threshold_ms" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "monitoring"."maintenance_vacuum_analyze"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    LOOP
        EXECUTE format('VACUUM ANALYZE %I.%I', r.schemaname, r.tablename);
    END LOOP;
END;
$$;


ALTER FUNCTION "monitoring"."maintenance_vacuum_analyze"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "security"."archive_old_logs"("months_to_keep" integer DEFAULT 6) RETURNS TABLE("archived_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - (months_to_keep || ' months')::INTERVAL;
    
    -- Archive to cold storage (placeholder - implement actual archival)
    -- In production, this would move data to cheaper storage
    
    -- Return count of records that would be archived
    RETURN QUERY
    SELECT COUNT(*) 
    FROM security.audit_log 
    WHERE created_at < cutoff_date;
END;
$$;


ALTER FUNCTION "security"."archive_old_logs"("months_to_keep" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "security"."check_rate_limit"("p_user_id" "uuid", "p_ip_address" "inet", "p_endpoint" "text", "p_limit" integer DEFAULT 60) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Get current count
    SELECT request_count INTO current_count
    FROM security.api_rate_limit
    WHERE user_id IS NOT DISTINCT FROM p_user_id
    AND ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND window_start = date_trunc('minute', CURRENT_TIMESTAMP);
    
    IF current_count IS NULL THEN
        -- First request in this window
        INSERT INTO security.api_rate_limit (user_id, ip_address, endpoint)
        VALUES (p_user_id, p_ip_address, p_endpoint)
        ON CONFLICT (user_id, ip_address, endpoint, window_start) 
        DO UPDATE SET request_count = api_rate_limit.request_count + 1;
        RETURN true;
    ELSIF current_count < p_limit THEN
        -- Under limit
        UPDATE security.api_rate_limit 
        SET request_count = request_count + 1
        WHERE user_id IS NOT DISTINCT FROM p_user_id
        AND ip_address = p_ip_address
        AND endpoint = p_endpoint
        AND window_start = date_trunc('minute', CURRENT_TIMESTAMP);
        RETURN true;
    ELSE
        -- Over limit
        RETURN false;
    END IF;
END;
$$;


ALTER FUNCTION "security"."check_rate_limit"("p_user_id" "uuid", "p_ip_address" "inet", "p_endpoint" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "security"."check_rate_limit"("p_user_id" "uuid", "p_ip_address" "inet", "p_endpoint" "text", "p_limit" integer) IS 'Check API rate limit for user/endpoint';



CREATE OR REPLACE FUNCTION "security"."create_audit_entry"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "security"."create_audit_entry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "security"."create_monthly_partitions"() RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "security"."create_monthly_partitions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "security"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean DEFAULT true, "p_failure_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "security"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "contractor_connection"."contractor_companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "license_number" "text" NOT NULL,
    "license_type" "text",
    "license_status" "text",
    "license_issued" "date",
    "license_expires" "date",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_sync_at" timestamp with time zone
);


ALTER TABLE "contractor_connection"."contractor_companies" OWNER TO "postgres";


COMMENT ON TABLE "contractor_connection"."contractor_companies" IS 'Master record for every contractor company we track. Updated weekly by merge_license_into_contractor().';



CREATE TABLE IF NOT EXISTS "core"."claim" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "claim_number" "text" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "policy_id" "uuid" NOT NULL,
    "status" "public"."claim_status_enum" DEFAULT 'draft'::"public"."claim_status_enum" NOT NULL,
    "type" "public"."damage_type_enum" NOT NULL,
    "incident_date" "date" NOT NULL,
    "reported_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "description" "text" NOT NULL,
    "deductible_amount" numeric(10,2),
    "claimed_amount" numeric(10,2),
    "approved_amount" numeric(10,2),
    "settlement_amount" numeric(10,2),
    "settlement_date" "date",
    "adjuster_name" "text",
    "adjuster_phone" "text",
    "adjuster_email" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "claim_number_format" CHECK (("claim_number" ~ '^CLM-[0-9]{4}-[0-9]{6}$'::"text")),
    CONSTRAINT "valid_amounts" CHECK (((("claimed_amount" IS NULL) OR ("claimed_amount" >= (0)::numeric)) AND (("approved_amount" IS NULL) OR ("approved_amount" >= (0)::numeric)) AND (("settlement_amount" IS NULL) OR ("settlement_amount" >= (0)::numeric)))),
    CONSTRAINT "valid_dates" CHECK (("incident_date" <= ("reported_date")::"date"))
);


ALTER TABLE "core"."claim" OWNER TO "postgres";


COMMENT ON TABLE "core"."claim" IS 'Insurance claims master table';



CREATE TABLE IF NOT EXISTS "core"."claim_damage" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "room_or_area" "text" NOT NULL,
    "damage_type" "public"."damage_type_enum" NOT NULL,
    "description" "text" NOT NULL,
    "estimated_cost" numeric(10,2),
    "approved_cost" numeric(10,2),
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "core"."claim_damage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."claim_document" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "core"."claim_document" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."claim_payment" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "payment_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_date" "date" NOT NULL,
    "check_number" "text",
    "payment_method" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "claim_payment_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "claim_payment_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['check'::"text", 'eft'::"text", 'wire'::"text", 'other'::"text"]))),
    CONSTRAINT "claim_payment_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['deductible'::"text", 'advance'::"text", 'settlement'::"text", 'supplement'::"text"])))
);


ALTER TABLE "core"."claim_payment" OWNER TO "postgres";


COMMENT ON TABLE "core"."claim_payment" IS 'Payment tracking for insurance claims';



CREATE TABLE IF NOT EXISTS "core"."claim_timeline" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "status" "public"."claim_status_enum" NOT NULL,
    "notes" "text",
    "changed_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "core"."claim_timeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."communication_log" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "direction" "text" NOT NULL,
    "communication_type" "text" NOT NULL,
    "subject" "text",
    "summary" "text" NOT NULL,
    "contact_name" "text",
    "contact_phone" "text",
    "contact_email" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "communication_log_communication_type_check" CHECK (("communication_type" = ANY (ARRAY['phone'::"text", 'email'::"text", 'letter'::"text", 'text'::"text", 'portal'::"text"]))),
    CONSTRAINT "communication_log_direction_check" CHECK (("direction" = ANY (ARRAY['inbound'::"text", 'outbound'::"text"]))),
    CONSTRAINT "communication_log_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['claim'::"text", 'property'::"text", 'policy'::"text"])))
);


ALTER TABLE "core"."communication_log" OWNER TO "postgres";


COMMENT ON TABLE "core"."communication_log" IS 'Universal communication tracking';



CREATE TABLE IF NOT EXISTS "core"."insurance_policy" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "policy_number" "text" NOT NULL,
    "policy_type" "public"."policy_type_enum" NOT NULL,
    "carrier_name" "text" NOT NULL,
    "carrier_phone" "text",
    "carrier_email" "text",
    "agent_name" "text",
    "agent_phone" "text",
    "agent_email" "text",
    "effective_date" "date" NOT NULL,
    "expiration_date" "date" NOT NULL,
    "premium_amount" numeric(10,2) NOT NULL,
    "deductible_hurricane" numeric(10,2),
    "deductible_wind" numeric(10,2),
    "deductible_other" numeric(10,2),
    "coverage_dwelling" numeric(12,2),
    "coverage_other_structures" numeric(12,2),
    "coverage_personal_property" numeric(12,2),
    "coverage_loss_of_use" numeric(12,2),
    "coverage_liability" numeric(12,2),
    "coverage_medical" numeric(12,2),
    "is_current" boolean DEFAULT true,
    "version_no" integer NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "irfs_filing_id" bigint,
    CONSTRAINT "policy_number_not_empty" CHECK (("length"(TRIM(BOTH FROM "policy_number")) > 0)),
    CONSTRAINT "valid_deductibles" CHECK (((("deductible_hurricane" IS NULL) OR ("deductible_hurricane" >= (0)::numeric)) AND (("deductible_wind" IS NULL) OR ("deductible_wind" >= (0)::numeric)) AND (("deductible_other" IS NULL) OR ("deductible_other" >= (0)::numeric)))),
    CONSTRAINT "valid_policy_dates" CHECK (("effective_date" < "expiration_date")),
    CONSTRAINT "valid_premium" CHECK (("premium_amount" >= (0)::numeric))
);


ALTER TABLE "core"."insurance_policy" OWNER TO "postgres";


COMMENT ON TABLE "core"."insurance_policy" IS 'Insurance policies with normalized coverage data';



CREATE SEQUENCE IF NOT EXISTS "core"."insurance_policy_version_no_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "core"."insurance_policy_version_no_seq" OWNER TO "postgres";


ALTER SEQUENCE "core"."insurance_policy_version_no_seq" OWNED BY "core"."insurance_policy"."version_no";



CREATE MATERIALIZED VIEW "core"."policy_coverage_summary" AS
 SELECT "id" AS "policy_id",
    "user_id",
    "property_id",
    "policy_type",
    "carrier_name",
    (("coverage_dwelling" + COALESCE("coverage_other_structures", (0)::numeric)) + COALESCE("coverage_personal_property", (0)::numeric)) AS "total_property_coverage",
    "coverage_liability" AS "liability_coverage",
    LEAST(COALESCE("deductible_hurricane", "deductible_other"), COALESCE("deductible_wind", "deductible_other"), "deductible_other") AS "min_deductible",
    "premium_amount",
    "expiration_date",
        CASE
            WHEN ("expiration_date" < ("now"())::"date") THEN 'expired'::"text"
            WHEN ("expiration_date" < (("now"())::"date" + '30 days'::interval)) THEN 'expiring_soon'::"text"
            ELSE 'active'::"text"
        END AS "status"
   FROM "core"."insurance_policy" "ip"
  WHERE ("is_current" = true)
  WITH NO DATA;


ALTER MATERIALIZED VIEW "core"."policy_coverage_summary" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "core"."policy_coverage_summary" IS 'Current policy coverage summary';



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



CREATE MATERIALIZED VIEW "core"."property_claims_summary" AS
 SELECT "p"."id" AS "property_id",
    "p"."name" AS "property_name",
    "count"(DISTINCT "c"."id") AS "total_claims",
    "count"(DISTINCT "c"."id") FILTER (WHERE ("c"."status" = 'settled'::"public"."claim_status_enum")) AS "settled_claims",
    "count"(DISTINCT "c"."id") FILTER (WHERE ("c"."status" = ANY (ARRAY['draft'::"public"."claim_status_enum", 'submitted'::"public"."claim_status_enum", 'under_review'::"public"."claim_status_enum"]))) AS "open_claims",
    "sum"("c"."claimed_amount") AS "total_claimed",
    "sum"("c"."settlement_amount") AS "total_settled",
    "max"("c"."incident_date") AS "last_incident_date",
    "avg"(
        CASE
            WHEN (("c"."status" = ANY (ARRAY['settled'::"public"."claim_status_enum", 'closed'::"public"."claim_status_enum"])) AND ("c"."settlement_date" IS NOT NULL)) THEN ("c"."settlement_date" - ("c"."reported_date")::"date")
            ELSE NULL::integer
        END) AS "avg_days_to_close"
   FROM ("public"."properties_old" "p"
     LEFT JOIN "core"."claim" "c" ON (("p"."id" = "c"."property_id")))
  GROUP BY "p"."id", "p"."name"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "core"."property_claims_summary" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "core"."property_claims_summary" IS 'Aggregated claims data by property';



CREATE TABLE IF NOT EXISTS "core"."property_expense" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "expense_type" "text" NOT NULL,
    "vendor_name" "text",
    "amount" numeric(10,2) NOT NULL,
    "expense_date" "date" NOT NULL,
    "description" "text",
    "receipt_url" "text",
    "claim_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "property_expense_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "core"."property_expense" OWNER TO "postgres";


COMMENT ON TABLE "core"."property_expense" IS 'Expense tracking for property maintenance and repairs';



CREATE TABLE IF NOT EXISTS "core"."property_feature" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "feature_type" "text" NOT NULL,
    "feature_value" "text",
    "installed_date" "date",
    "wind_mitigation_credit" boolean DEFAULT false,
    "notes" "text"
);


ALTER TABLE "core"."property_feature" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."user_role" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."user_role_enum" DEFAULT 'user'::"public"."user_role_enum" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "granted_by" "uuid",
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "core"."user_role" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "external"."fl_parcel_ingest_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ingest_batch_id" "uuid" NOT NULL,
    "source" "text" NOT NULL,
    "status" "text" NOT NULL,
    "record_count" integer,
    "error_message" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "metadata" "jsonb",
    CONSTRAINT "fl_parcel_ingest_events_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "external"."fl_parcel_ingest_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "external"."fl_parcels_raw" (
    "pk" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" NOT NULL,
    "source_url" "text" NOT NULL,
    "download_ts" timestamp with time zone DEFAULT "now"() NOT NULL,
    "county_fips" character varying(3) NOT NULL,
    "parcel_id" "text" NOT NULL,
    "geom" "public"."geometry"(Polygon,4326) NOT NULL,
    "attrs" "jsonb" NOT NULL,
    "ingest_batch_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fl_parcels_raw_source_check" CHECK (("source" = ANY (ARRAY['fgio'::"text", 'fdot'::"text", 'fgdl'::"text", 'dor'::"text"])))
);


ALTER TABLE "external"."fl_parcels_raw" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "external"."oir_clauses" (
    "clause_id" "uuid" NOT NULL,
    "doc_pk" "uuid",
    "clause_text" "text" NOT NULL,
    "clause_type" "text",
    "vec" "public"."vector"(1536) NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
)
PARTITION BY RANGE ("created_at");


ALTER TABLE "external"."oir_clauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "external"."oir_clauses_2025" (
    "clause_id" "uuid" NOT NULL,
    "doc_pk" "uuid",
    "clause_text" "text" NOT NULL,
    "clause_type" "text",
    "vec" "public"."vector"(1536) NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "external"."oir_clauses_2025" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "external"."oir_doc_hashes" (
    "hash" "text" NOT NULL,
    "pdf_blob_path" "text" NOT NULL,
    "ref_count" integer DEFAULT 1
);


ALTER TABLE "external"."oir_doc_hashes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "external"."oir_docs" (
    "pk" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "filing_id" bigint,
    "doc_id" bigint,
    "file_name" "text",
    "download_url" "text",
    "pdf_blob_path" "text",
    "txt" "text",
    "parsed_data" "jsonb",
    "vec" "public"."vector"(1536),
    "doc_type" "text" DEFAULT 'form'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "external"."oir_docs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "external"."oir_filings" (
    "filing_id" bigint NOT NULL,
    "file_log_nbr" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "lob" "text" NOT NULL,
    "filing_type" "text" NOT NULL,
    "closed_date" "date",
    "raw_meta" "jsonb",
    "docs_fetched" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "external"."oir_filings" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "external"."rate_summaries" AS
 SELECT "f"."filing_id",
    "f"."company_name",
    "jsonb_agg"("d"."parsed_data") AS "rate_factors"
   FROM ("external"."oir_filings" "f"
     JOIN "external"."oir_docs" "d" ON (("f"."filing_id" = "d"."filing_id")))
  WHERE (("f"."filing_type" = 'Rates'::"text") AND ("d"."parsed_data" IS NOT NULL))
  GROUP BY "f"."filing_id", "f"."company_name"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "external"."rate_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "external_raw_fl"."property_data" (
    "id" bigint NOT NULL,
    "source" "text" NOT NULL,
    "source_record_id" "text" NOT NULL,
    "raw_data" "jsonb" NOT NULL,
    "data_hash" "text" NOT NULL,
    "scraped_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "external_raw_fl"."property_data" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "external_raw_fl"."property_data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "external_raw_fl"."property_data_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "external_raw_fl"."property_data_id_seq" OWNED BY "external_raw_fl"."property_data"."id";



CREATE TABLE IF NOT EXISTS "monitoring"."alert_history" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "rule_id" "uuid" NOT NULL,
    "triggered" boolean NOT NULL,
    "actual_value" numeric,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
)
PARTITION BY RANGE ("created_at");


ALTER TABLE "monitoring"."alert_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."alert_history_2025_01" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "rule_id" "uuid" NOT NULL,
    "triggered" boolean NOT NULL,
    "actual_value" numeric,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "monitoring"."alert_history_2025_01" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."alert_rule" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "condition_sql" "text" NOT NULL,
    "threshold" numeric NOT NULL,
    "comparison_operator" "text",
    "severity" "text",
    "notification_channels" "text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "alert_rule_comparison_operator_check" CHECK (("comparison_operator" = ANY (ARRAY['>'::"text", '<'::"text", '>='::"text", '<='::"text", '='::"text", '!='::"text"]))),
    CONSTRAINT "alert_rule_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'critical'::"text"])))
);


ALTER TABLE "monitoring"."alert_rule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."data_quality_result" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "rule_id" "uuid" NOT NULL,
    "passed" boolean NOT NULL,
    "actual_result" "text",
    "row_count" integer,
    "details" "jsonb",
    "checked_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
)
PARTITION BY RANGE ("checked_at");


ALTER TABLE "monitoring"."data_quality_result" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."data_quality_result_2025_01" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "rule_id" "uuid" NOT NULL,
    "passed" boolean NOT NULL,
    "actual_result" "text",
    "row_count" integer,
    "details" "jsonb",
    "checked_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "monitoring"."data_quality_result_2025_01" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."data_quality_rule" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "rule_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "check_sql" "text" NOT NULL,
    "expected_result" "text",
    "severity" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "data_quality_rule_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'error'::"text", 'critical'::"text"])))
);


ALTER TABLE "monitoring"."data_quality_rule" OWNER TO "postgres";


CREATE OR REPLACE VIEW "monitoring"."database_stats" AS
 SELECT 'table_count'::"text" AS "metric",
    "count"(*) AS "value"
   FROM "information_schema"."tables"
  WHERE (("tables"."table_schema")::"name" <> ALL (ARRAY['pg_catalog'::"name", 'information_schema'::"name"]))
UNION ALL
 SELECT 'total_size_mb'::"text" AS "metric",
    (("pg_database_size"("current_database"()) / 1024) / 1024) AS "value"
UNION ALL
 SELECT 'active_connections'::"text" AS "metric",
    "count"(*) AS "value"
   FROM "pg_stat_activity"
  WHERE ("pg_stat_activity"."state" = 'active'::"text")
UNION ALL
 SELECT 'index_count'::"text" AS "metric",
    "count"(*) AS "value"
   FROM "pg_indexes"
  WHERE ("pg_indexes"."schemaname" <> ALL (ARRAY['pg_catalog'::"name", 'information_schema'::"name"]));


ALTER VIEW "monitoring"."database_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."deployment" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "version" "text" NOT NULL,
    "git_commit" "text",
    "deployed_by" "text",
    "deployment_type" "text",
    "status" "text",
    "started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completed_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "deployment_deployment_type_check" CHECK (("deployment_type" = ANY (ARRAY['migration'::"text", 'rollback'::"text", 'hotfix'::"text"]))),
    CONSTRAINT "deployment_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'completed'::"text", 'failed'::"text", 'rolled_back'::"text"])))
);


ALTER TABLE "monitoring"."deployment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."health_check" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "check_name" "text" NOT NULL,
    "check_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "response_time_ms" integer,
    "details" "jsonb",
    "checked_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "health_check_check_type_check" CHECK (("check_type" = ANY (ARRAY['database'::"text", 'api'::"text", 'storage'::"text", 'auth'::"text"]))),
    CONSTRAINT "health_check_status_check" CHECK (("status" = ANY (ARRAY['healthy'::"text", 'degraded'::"text", 'unhealthy'::"text"])))
);


ALTER TABLE "monitoring"."health_check" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."performance_metric" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric NOT NULL,
    "metric_unit" "text",
    "tags" "jsonb" DEFAULT '{}'::"jsonb",
    "recorded_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
)
PARTITION BY RANGE ("recorded_at");


ALTER TABLE "monitoring"."performance_metric" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "monitoring"."performance_metric_2025_01" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric NOT NULL,
    "metric_unit" "text",
    "tags" "jsonb" DEFAULT '{}'::"jsonb",
    "recorded_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "monitoring"."performance_metric_2025_01" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "carrier_name" "text" NOT NULL,
    "policy_number" "text" NOT NULL,
    "policy_type" "public"."policy_type_enum" NOT NULL,
    "effective_date" "date" NOT NULL,
    "expiration_date" "date" NOT NULL,
    "coverage_details" "jsonb" DEFAULT '{}'::"jsonb",
    "premium_amount" numeric(10,2),
    "deductible_amount" numeric(10,2),
    "wind_deductible_percentage" numeric(5,2),
    "flood_deductible_amount" numeric(10,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "irfs_filing_id" bigint
);


ALTER TABLE "public"."policies" OWNER TO "postgres";


COMMENT ON TABLE "public"."policies" IS 'Insurance policies associated with properties';



COMMENT ON COLUMN "public"."policies"."coverage_details" IS 'JSONB field for flexible storage of coverage limits, exclusions, and special conditions';



CREATE OR REPLACE VIEW "public"."active_policies" AS
 SELECT "p"."id",
    "p"."property_id",
    "p"."carrier_name",
    "p"."policy_number",
    "p"."policy_type",
    "p"."effective_date",
    "p"."expiration_date",
    "p"."coverage_details",
    "p"."premium_amount",
    "p"."deductible_amount",
    "p"."wind_deductible_percentage",
    "p"."flood_deductible_amount",
    "p"."is_active",
    "p"."created_at",
    "p"."updated_at",
    "p"."created_by",
    "prop"."name" AS "property_name",
    "prop"."street_address",
    "prop"."city",
    "prop"."state",
    "prop"."postal_code"
   FROM ("public"."policies" "p"
     JOIN "public"."properties_old" "prop" ON (("p"."property_id" = "prop"."id")))
  WHERE (("p"."is_active" = true) AND ("p"."expiration_date" >= CURRENT_DATE));


ALTER VIEW "public"."active_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "model_id" "uuid",
    "input_data" "jsonb" NOT NULL,
    "output_data" "jsonb" NOT NULL,
    "confidence_score" double precision,
    "processing_time_ms" integer,
    "input_embedding" "public"."vector"(1536),
    "output_embedding" "public"."vector"(1536),
    "tokens_used" integer,
    "cost_cents" integer,
    "status" "text" DEFAULT 'completed'::"text",
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_analyses_confidence_score_check" CHECK ((("confidence_score" >= (0)::double precision) AND ("confidence_score" <= (1)::double precision))),
    CONSTRAINT "ai_analyses_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."ai_analyses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "context_type" "text" NOT NULL,
    "context_id" "uuid",
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_message_at" timestamp with time zone,
    "total_messages" integer DEFAULT 0,
    "total_tokens" integer DEFAULT 0,
    "total_cost_cents" integer DEFAULT 0,
    "context_embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_conversations_context_type_check" CHECK (("context_type" = ANY (ARRAY['general'::"text", 'claim'::"text", 'property'::"text", 'policy'::"text", 'damage'::"text"])))
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "rating" integer,
    "was_accurate" boolean,
    "was_helpful" boolean,
    "corrections" "jsonb" DEFAULT '{}'::"jsonb",
    "additional_info" "jsonb" DEFAULT '{}'::"jsonb",
    "comments" "text",
    "resulted_in_model_update" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."ai_feedback" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."claim_communications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "communication_type" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "subject" "text",
    "content" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "claim_communications_communication_type_check" CHECK (("communication_type" = ANY (ARRAY['email'::"text", 'phone'::"text", 'letter'::"text", 'meeting'::"text", 'other'::"text"]))),
    CONSTRAINT "claim_communications_direction_check" CHECK (("direction" = ANY (ARRAY['incoming'::"text", 'outgoing'::"text"])))
);


ALTER TABLE "public"."claim_communications" OWNER TO "postgres";


COMMENT ON TABLE "public"."claim_communications" IS 'Communications log for claims';



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



CREATE OR REPLACE VIEW "public"."claims_overview" AS
 SELECT "c"."id",
    "c"."claim_number",
    "c"."property_id",
    "c"."policy_id",
    "c"."user_id",
    "c"."status",
    "c"."damage_type",
    "c"."date_of_loss",
    "c"."description",
    "c"."estimated_value",
    "c"."deductible_applied",
    "c"."created_at",
    "c"."updated_at",
    "prop"."name" AS "property_name",
    "prop"."street_address",
    "prop"."city",
    "prop"."state",
    "pol"."carrier_name",
    "pol"."policy_number",
    "pol"."policy_type"
   FROM (("public"."claims" "c"
     JOIN "public"."properties_old" "prop" ON (("c"."property_id" = "prop"."id")))
     JOIN "public"."policies" "pol" ON (("c"."policy_id" = "pol"."id")));


ALTER VIEW "public"."claims_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contractor_license_raw" (
    "license_number" "text" NOT NULL,
    "board" "text",
    "license_type" "text",
    "rank" "text",
    "qualifier_name" "text",
    "dba_name" "text",
    "city" "text",
    "county_name" "text",
    "status_primary" "text",
    "status_secondary" "text",
    "issue_date" "date",
    "expiry_date" "date",
    "bond_ind" boolean,
    "wc_exempt" boolean,
    "liability_ins" boolean,
    "discipline_flag" boolean,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contractor_license_raw" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."fdot_history" (
    "id" integer NOT NULL,
    "parcel_id" "text" NOT NULL,
    "co_no" numeric,
    "properties" "jsonb" NOT NULL,
    "geom" "public"."geometry"(Geometry,4326) NOT NULL,
    "archived_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."fdot_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fdot_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fdot_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fdot_history_id_seq" OWNED BY "public"."fdot_history"."id";



CREATE TABLE IF NOT EXISTS "public"."fdot_parcels" (
    "parcel_id" "text" NOT NULL,
    "co_no" numeric NOT NULL,
    "dor_uc" "text",
    "jv" numeric,
    "properties" "jsonb" NOT NULL,
    "geom" "public"."geometry"(Geometry,4326) NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."fdot_parcels" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."floir_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "data_type" "public"."floir_data_type" NOT NULL,
    "primary_key" "text" NOT NULL,
    "raw_data" "jsonb" NOT NULL,
    "normalized_data" "jsonb",
    "embedding" "public"."vector"(1536),
    "content_hash" "text",
    "source_url" "text",
    "pdf_content" "text",
    "extracted_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."floir_data" OWNER TO "postgres";


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



CREATE SEQUENCE IF NOT EXISTS "public"."florida_parcels_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."florida_parcels_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."florida_parcels_id_seq" OWNED BY "public"."florida_parcels"."id";



CREATE TABLE IF NOT EXISTS "public"."florida_counties2" (
    "id" bigint DEFAULT "nextval"('"public"."florida_parcels_id_seq"'::"regclass") NOT NULL,
    "county_fips" integer,
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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."florida_counties2" OWNER TO "postgres";


COMMENT ON TABLE "public"."florida_counties2" IS 'This is a duplicate of florida_parcels';



COMMENT ON COLUMN "public"."florida_counties2"."id" IS 'System ID - Auto-generated primary key';



COMMENT ON COLUMN "public"."florida_counties2"."county_fips" IS 'County FIPS Code - Federal Information Processing Standard code (12001-12133)';



COMMENT ON COLUMN "public"."florida_counties2"."CO_NO" IS 'County Number (1-67) - Sequential number assigned to each Florida county';



COMMENT ON COLUMN "public"."florida_counties2"."PARCEL_ID" IS 'Unique Parcel Identifier - Primary key for property identification across the county';



COMMENT ON COLUMN "public"."florida_counties2"."FILE_T" IS 'File Type - Indicates the source or type of property record';



COMMENT ON COLUMN "public"."florida_counties2"."ASMNT_YR" IS 'Assessment Year - Tax year for which the assessment applies';



COMMENT ON COLUMN "public"."florida_counties2"."BAS_STRT" IS 'Base Start Date - Beginning date for assessment calculations';



COMMENT ON COLUMN "public"."florida_counties2"."ATV_STRT" IS 'Active Start Date - Date when property became active in system';



COMMENT ON COLUMN "public"."florida_counties2"."GRP_NO" IS 'Group Number - Grouping code for similar properties';



COMMENT ON COLUMN "public"."florida_counties2"."DOR_UC" IS 'Department of Revenue Use Code - State-level property classification';



COMMENT ON COLUMN "public"."florida_counties2"."PA_UC" IS 'Property Appraiser Use Code - Local property classification';



COMMENT ON COLUMN "public"."florida_counties2"."SPASS_CD" IS 'Special Assessment Code - Indicates special assessment districts';



COMMENT ON COLUMN "public"."florida_counties2"."JV" IS 'Just Value (Market Value) - Fair market value as determined by Property Appraiser';



COMMENT ON COLUMN "public"."florida_counties2"."JV_CHNG" IS 'Just Value Change - Dollar amount change from previous year';



COMMENT ON COLUMN "public"."florida_counties2"."JV_CHNG_CD" IS 'Just Value Change Code - Reason code for value change';



COMMENT ON COLUMN "public"."florida_counties2"."AV_SD" IS 'Assessed Value School District - Taxable value for school district taxes';



COMMENT ON COLUMN "public"."florida_counties2"."AV_NSD" IS 'Assessed Value Non-School District - Taxable value for non-school taxes';



COMMENT ON COLUMN "public"."florida_counties2"."TV_SD" IS 'Taxable Value School District - Final taxable value after exemptions for schools';



COMMENT ON COLUMN "public"."florida_counties2"."TV_NSD" IS 'Taxable Value Non-School District - Final taxable value after exemptions for non-school';



COMMENT ON COLUMN "public"."florida_counties2"."JV_HMSTD" IS 'Just Value Homestead Portion - Market value of homestead portion';



COMMENT ON COLUMN "public"."florida_counties2"."AV_HMSTD" IS 'Assessed Value Homestead - Assessed value of homestead portion';



COMMENT ON COLUMN "public"."florida_counties2"."JV_NON_HMS" IS 'Just Value Non-Homestead - Market value of non-homestead portion';



COMMENT ON COLUMN "public"."florida_counties2"."AV_NON_HMS" IS 'Assessed Value Non-Homestead - Assessed value of non-homestead portion';



COMMENT ON COLUMN "public"."florida_counties2"."JV_RESD_NO" IS 'Just Value Residential Non-Homestead - Value of residential non-homestead property';



COMMENT ON COLUMN "public"."florida_counties2"."AV_RESD_NO" IS 'Assessed Value Residential Non-Homestead - Assessed value of residential non-homestead';



COMMENT ON COLUMN "public"."florida_counties2"."JV_CLASS_U" IS 'Just Value Classified Use - Value under classified use assessment';



COMMENT ON COLUMN "public"."florida_counties2"."AV_CLASS_U" IS 'Assessed Value Classified Use - Assessed value under classified use';



COMMENT ON COLUMN "public"."florida_counties2"."JV_H2O_REC" IS 'Just Value Water Recharge - Value of water recharge lands';



COMMENT ON COLUMN "public"."florida_counties2"."AV_H2O_REC" IS 'Assessed Value Water Recharge - Assessed value of water recharge lands';



COMMENT ON COLUMN "public"."florida_counties2"."JV_CONSRV_" IS 'Just Value Conservation - Value of conservation lands';



COMMENT ON COLUMN "public"."florida_counties2"."AV_CONSRV_" IS 'Assessed Value Conservation - Assessed value of conservation lands';



COMMENT ON COLUMN "public"."florida_counties2"."JV_HIST_CO" IS 'Just Value Historic Commercial - Value of historic commercial property';



COMMENT ON COLUMN "public"."florida_counties2"."AV_HIST_CO" IS 'Assessed Value Historic Commercial - Assessed value of historic commercial';



COMMENT ON COLUMN "public"."florida_counties2"."JV_HIST_SI" IS 'Just Value Historic Significant - Value of historically significant property';



COMMENT ON COLUMN "public"."florida_counties2"."AV_HIST_SI" IS 'Assessed Value Historic Significant - Assessed value of historic property';



COMMENT ON COLUMN "public"."florida_counties2"."JV_WRKNG_W" IS 'Just Value Working Waterfront - Value of working waterfront property';



COMMENT ON COLUMN "public"."florida_counties2"."AV_WRKNG_W" IS 'Assessed Value Working Waterfront - Assessed value of working waterfront';



COMMENT ON COLUMN "public"."florida_counties2"."NCONST_VAL" IS 'New Construction Value - Value of new construction added';



COMMENT ON COLUMN "public"."florida_counties2"."DEL_VAL" IS 'Deletion Value - Value of improvements removed or demolished';



COMMENT ON COLUMN "public"."florida_counties2"."PAR_SPLT" IS 'Parcel Split Indicator - Flag indicating if parcel was split';



COMMENT ON COLUMN "public"."florida_counties2"."DISTR_CD" IS 'District Code - Tax district code';



COMMENT ON COLUMN "public"."florida_counties2"."DISTR_YR" IS 'District Year - Year district was established';



COMMENT ON COLUMN "public"."florida_counties2"."LND_VAL" IS 'Land Value - Assessed value of land only (no improvements)';



COMMENT ON COLUMN "public"."florida_counties2"."LND_UNTS_C" IS 'Land Units Code - Unit of measurement for land (acres, sq ft, etc)';



COMMENT ON COLUMN "public"."florida_counties2"."NO_LND_UNT" IS 'Number of Land Units - Quantity of land in specified units';



COMMENT ON COLUMN "public"."florida_counties2"."LND_SQFOOT" IS 'Land Square Footage - Total square feet of land';



COMMENT ON COLUMN "public"."florida_counties2"."DT_LAST_IN" IS 'Date Last Inspected - Most recent property inspection date';



COMMENT ON COLUMN "public"."florida_counties2"."IMP_QUAL" IS 'Improvement Quality - Quality grade of improvements (1-9 scale)';



COMMENT ON COLUMN "public"."florida_counties2"."CONST_CLAS" IS 'Construction Class - Type of construction (frame, masonry, etc)';



COMMENT ON COLUMN "public"."florida_counties2"."EFF_YR_BLT" IS 'Effective Year Built - Adjusted year for depreciation calculations';



COMMENT ON COLUMN "public"."florida_counties2"."ACT_YR_BLT" IS 'Actual Year Built - Original construction year';



COMMENT ON COLUMN "public"."florida_counties2"."TOT_LVG_AR" IS 'Total Living Area - Heated/cooled square footage';



COMMENT ON COLUMN "public"."florida_counties2"."NO_BULDNG" IS 'Number of Buildings - Count of structures on parcel';



COMMENT ON COLUMN "public"."florida_counties2"."NO_RES_UNT" IS 'Number of Residential Units - Count of dwelling units';



COMMENT ON COLUMN "public"."florida_counties2"."SPEC_FEAT_" IS 'Special Features Value - Value of pools, outbuildings, etc';



COMMENT ON COLUMN "public"."florida_counties2"."M_PAR_SAL1" IS 'Multi-Parcel Sale 1 - Indicates if part of multi-parcel transaction';



COMMENT ON COLUMN "public"."florida_counties2"."QUAL_CD1" IS 'Qualification Code 1 - Sales qualification code (U=Unqualified, Q=Qualified)';



COMMENT ON COLUMN "public"."florida_counties2"."VI_CD1" IS 'Vacant/Improved Code 1 - V=Vacant, I=Improved at time of sale';



COMMENT ON COLUMN "public"."florida_counties2"."SALE_PRC1" IS 'Sale Price 1 - Most recent sale price in dollars';



COMMENT ON COLUMN "public"."florida_counties2"."SALE_YR1" IS 'Sale Year 1 - Year of most recent sale';



COMMENT ON COLUMN "public"."florida_counties2"."SALE_MO1" IS 'Sale Month 1 - Month of most recent sale (1-12)';



COMMENT ON COLUMN "public"."florida_counties2"."OR_BOOK1" IS 'Official Record Book 1 - Deed book number';



COMMENT ON COLUMN "public"."florida_counties2"."OR_PAGE1" IS 'Official Record Page 1 - Deed page number';



COMMENT ON COLUMN "public"."florida_counties2"."CLERK_NO1" IS 'Clerk Number 1 - Clerk instrument number';



COMMENT ON COLUMN "public"."florida_counties2"."S_CHNG_CD1" IS 'Sale Change Code 1 - Reason for ownership change';



COMMENT ON COLUMN "public"."florida_counties2"."M_PAR_SAL2" IS 'Multi-Parcel Sale 2 - Previous multi-parcel sale indicator';



COMMENT ON COLUMN "public"."florida_counties2"."QUAL_CD2" IS 'Qualification Code 2 - Previous sale qualification';



COMMENT ON COLUMN "public"."florida_counties2"."VI_CD2" IS 'Vacant/Improved Code 2 - Property status at previous sale';



COMMENT ON COLUMN "public"."florida_counties2"."SALE_PRC2" IS 'Sale Price 2 - Previous sale price';



COMMENT ON COLUMN "public"."florida_counties2"."SALE_YR2" IS 'Sale Year 2 - Year of previous sale';



COMMENT ON COLUMN "public"."florida_counties2"."SALE_MO2" IS 'Sale Month 2 - Month of previous sale';



COMMENT ON COLUMN "public"."florida_counties2"."OR_BOOK2" IS 'Official Record Book 2 - Previous deed book';



COMMENT ON COLUMN "public"."florida_counties2"."OR_PAGE2" IS 'Official Record Page 2 - Previous deed page';



COMMENT ON COLUMN "public"."florida_counties2"."CLERK_NO2" IS 'Clerk Number 2 - Previous clerk instrument number';



COMMENT ON COLUMN "public"."florida_counties2"."S_CHNG_CD2" IS 'Sale Change Code 2 - Previous ownership change reason';



COMMENT ON COLUMN "public"."florida_counties2"."OWN_NAME" IS 'Owner Name - Primary owner full name or entity';



COMMENT ON COLUMN "public"."florida_counties2"."OWN_ADDR1" IS 'Owner Address Line 1 - Mailing address first line';



COMMENT ON COLUMN "public"."florida_counties2"."OWN_ADDR2" IS 'Owner Address Line 2 - Mailing address second line';



COMMENT ON COLUMN "public"."florida_counties2"."OWN_CITY" IS 'Owner City - Mailing address city';



COMMENT ON COLUMN "public"."florida_counties2"."OWN_STATE" IS 'Owner State - Mailing address state code';



COMMENT ON COLUMN "public"."florida_counties2"."OWN_ZIPCD" IS 'Owner ZIP Code - Mailing address ZIP';



COMMENT ON COLUMN "public"."florida_counties2"."OWN_STATE_" IS 'Owner State Country - State/country for foreign addresses';



COMMENT ON COLUMN "public"."florida_counties2"."FIDU_NAME" IS 'Fiduciary Name - Trustee, executor, or agent name';



COMMENT ON COLUMN "public"."florida_counties2"."FIDU_ADDR1" IS 'Fiduciary Address 1 - Agent mailing address line 1';



COMMENT ON COLUMN "public"."florida_counties2"."FIDU_ADDR2" IS 'Fiduciary Address 2 - Agent mailing address line 2';



COMMENT ON COLUMN "public"."florida_counties2"."FIDU_CITY" IS 'Fiduciary City - Agent city';



COMMENT ON COLUMN "public"."florida_counties2"."FIDU_STATE" IS 'Fiduciary State - Agent state';



COMMENT ON COLUMN "public"."florida_counties2"."FIDU_ZIPCD" IS 'Fiduciary ZIP - Agent ZIP code';



COMMENT ON COLUMN "public"."florida_counties2"."FIDU_CD" IS 'Fiduciary Code - Type of fiduciary relationship';



COMMENT ON COLUMN "public"."florida_counties2"."S_LEGAL" IS 'Legal Description - Full legal description of property';



COMMENT ON COLUMN "public"."florida_counties2"."APP_STAT" IS 'Appraisal Status - Current appraisal status code';



COMMENT ON COLUMN "public"."florida_counties2"."CO_APP_STA" IS 'County Appraisal Status - County-specific status';



COMMENT ON COLUMN "public"."florida_counties2"."MKT_AR" IS 'Market Area - Market area code for comparables';



COMMENT ON COLUMN "public"."florida_counties2"."NBRHD_CD" IS 'Neighborhood Code - Neighborhood classification';



COMMENT ON COLUMN "public"."florida_counties2"."PUBLIC_LND" IS 'Public Land Indicator - Flag for government-owned property';



COMMENT ON COLUMN "public"."florida_counties2"."TAX_AUTH_C" IS 'Taxing Authority Code - Primary taxing authority';



COMMENT ON COLUMN "public"."florida_counties2"."TWN" IS 'Township - Township designation';



COMMENT ON COLUMN "public"."florida_counties2"."RNG" IS 'Range - Range designation';



COMMENT ON COLUMN "public"."florida_counties2"."SEC" IS 'Section - Section number (1-36)';



COMMENT ON COLUMN "public"."florida_counties2"."CENSUS_BK" IS 'Census Block - Census block identifier';



COMMENT ON COLUMN "public"."florida_counties2"."PHY_ADDR1" IS 'Physical Address Line 1 - Street address of property';



COMMENT ON COLUMN "public"."florida_counties2"."PHY_ADDR2" IS 'Physical Address Line 2 - Additional address information';



COMMENT ON COLUMN "public"."florida_counties2"."PHY_CITY" IS 'Physical City - City where property is located';



COMMENT ON COLUMN "public"."florida_counties2"."PHY_ZIPCD" IS 'Physical ZIP Code - ZIP code of property location';



COMMENT ON COLUMN "public"."florida_counties2"."ALT_KEY" IS 'Alternate Key - Alternative parcel identifier';



COMMENT ON COLUMN "public"."florida_counties2"."ASS_TRNSFR" IS 'Assessment Transfer - Related to Save Our Homes portability';



COMMENT ON COLUMN "public"."florida_counties2"."PREV_HMSTD" IS 'Previous Homestead - Previous homestead amount';



COMMENT ON COLUMN "public"."florida_counties2"."ASS_DIF_TR" IS 'Assessment Difference Transfer - Portable assessment difference';



COMMENT ON COLUMN "public"."florida_counties2"."CONO_PRV_H" IS 'County Number Previous Homestead - Previous homestead county';



COMMENT ON COLUMN "public"."florida_counties2"."PARCEL_ID_" IS 'Previous Parcel ID - ID before renumbering';



COMMENT ON COLUMN "public"."florida_counties2"."YR_VAL_TRN" IS 'Year Value Transfer - Year of value transfer';



COMMENT ON COLUMN "public"."florida_counties2"."SEQ_NO" IS 'Sequence Number - Record sequence identifier';



COMMENT ON COLUMN "public"."florida_counties2"."RS_ID" IS 'Roll Section ID - Tax roll section identifier';



COMMENT ON COLUMN "public"."florida_counties2"."MP_ID" IS 'Map ID - Mapping system identifier';



COMMENT ON COLUMN "public"."florida_counties2"."STATE_PAR_" IS 'State Parcel Number - Statewide parcel identifier';



COMMENT ON COLUMN "public"."florida_counties2"."SPC_CIR_CD" IS 'Special Circumstance Code - Code for special tax circumstances';



COMMENT ON COLUMN "public"."florida_counties2"."SPC_CIR_YR" IS 'Special Circumstance Year - Year special circumstance began';



COMMENT ON COLUMN "public"."florida_counties2"."SPC_CIR_TX" IS 'Special Circumstance Text - Description of special circumstance';



COMMENT ON COLUMN "public"."florida_counties2"."Shape_Length" IS 'Shape Length - Perimeter of parcel in map units';



COMMENT ON COLUMN "public"."florida_counties2"."Shape_Area" IS 'Shape Area - Area of parcel in map units';



COMMENT ON COLUMN "public"."florida_counties2"."geometry_wkt" IS 'Geometry WKT - Well-Known Text representation of parcel boundary';



COMMENT ON COLUMN "public"."florida_counties2"."county_id" IS 'County ID - Foreign key to florida_counties table';



COMMENT ON COLUMN "public"."florida_counties2"."created_at" IS 'Created At - Timestamp when record was created';



COMMENT ON COLUMN "public"."florida_counties2"."updated_at" IS 'Updated At - Timestamp when record was last modified';



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


CREATE TABLE IF NOT EXISTS "public"."florida_parcels_staging" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "objectid" "text",
    "parcel_id" "text",
    "co_no" "text",
    "asmnt_yr" "text",
    "jv" "text",
    "av_sd" "text",
    "av_nsd" "text",
    "tv_sd" "text",
    "tv_nsd" "text",
    "dor_uc" "text",
    "pa_uc" "text",
    "land_val" "text",
    "bldg_val" "text",
    "tot_val" "text",
    "act_yr_blt" "text",
    "eff_yr_blt" "text",
    "tot_lvg_ar" "text",
    "land_sqfoot" "text",
    "no_buldng" "text",
    "no_res_unt" "text",
    "own_name" "text",
    "own_addr1" "text",
    "own_addr2" "text",
    "own_city" "text",
    "own_state" "text",
    "own_zipcd" "text",
    "phy_addr1" "text",
    "phy_addr2" "text",
    "phy_city" "text",
    "phy_zipcd" "text",
    "s_legal" "text",
    "twn" "text",
    "rng" "text",
    "sec" "text",
    "sale_prc1" "text",
    "sale_yr1" "text",
    "sale_mo1" "text",
    "sale_prc2" "text",
    "sale_yr2" "text",
    "sale_mo2" "text",
    "nbrhd_cd" "text",
    "census_bk" "text",
    "mkt_ar" "text",
    "data_source" "text",
    "own_state2" "text",
    "own_zipcda" "text",
    "nbrhd_cd1" "text",
    "nbrhd_cd2" "text",
    "nbrhd_cd3" "text",
    "nbrhd_cd4" "text",
    "dor_cd1" "text",
    "dor_cd2" "text",
    "dor_cd3" "text",
    "dor_cd4" "text",
    "ag_val" "text",
    "qual_cd2_" "text",
    "vi_cd2_" "text",
    "sale_prc2_" "text",
    "sale_yr2_" "text",
    "sale_mo2_" "text",
    "or_book2_" "text",
    "or_page2_" "text",
    "clerk_n_2" "text",
    "imp_val" "text",
    "const_val" "text",
    "distr_no" "text",
    "front" "text",
    "depth" "text",
    "cap" "text",
    "cape_shpa" "text",
    "latitude" "text",
    "longitude" "text",
    "pin_1" "text",
    "pin_2" "text",
    "half_cd" "text",
    "sub" "text",
    "blk" "text",
    "lot" "text",
    "plat_book" "text",
    "plat_page" "text",
    "county_fips" "text",
    "file_t" "text",
    "bas_strt" "text",
    "atv_strt" "text",
    "grp_no" "text",
    "spass_cd" "text",
    "jv_chng" "text",
    "or_book1" "text",
    "or_page1" "text",
    "clerk_no1" "text",
    "vi_cd1" "text",
    "qual_cd1" "text",
    "or_book2" "text",
    "or_page2" "text",
    "clerk_no2" "text",
    "vi_cd2" "text",
    "qual_cd2" "text",
    "app_stat" "text",
    "co_app_sta" "text",
    "tax_auth_c" "text",
    "imp_qual" "text",
    "const_clas" "text",
    "spec_feat_" "text",
    "m_par_sal1" "text",
    "m_par_sal2" "text",
    "nconst_val" "text",
    "public_lnd" "text",
    "distr_cd" "text",
    "distr_yr" "text",
    "parcel_id_" "text",
    "yr_val_trn" "text",
    "seq_no" "text",
    "rs_id" "text",
    "mp_id" "text",
    "state_par_" "text",
    "spc_cir_cd" "text",
    "spc_cir_yr" "text",
    "spc_cir_tx" "text",
    "s_chng_cd1" "text",
    "s_chng_cd2" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "twp" "text"
);


ALTER TABLE "public"."florida_parcels_staging" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."parcel_import_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "data_source" "public"."parcel_data_source" NOT NULL,
    "status" "public"."import_status" DEFAULT 'pending'::"public"."import_status",
    "total_records" integer DEFAULT 0,
    "processed_records" integer DEFAULT 0,
    "valid_records" integer DEFAULT 0,
    "invalid_records" integer DEFAULT 0,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "duration_seconds" integer,
    "errors" "jsonb",
    "warnings" "jsonb"
);


ALTER TABLE "public"."parcel_import_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "source" "text" NOT NULL,
    "owner_name" "text",
    "situs_address" "text",
    "situs_city" "text",
    "situs_zip" "text",
    "property_use_code" "text",
    "year_built" integer,
    "just_value" numeric(15,2),
    "assessed_value" numeric(15,2),
    "living_area_sqft" integer,
    "geom" "public"."geometry"(Geometry,4326),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "raw_data_id" bigint
);


ALTER TABLE "public"."parcels" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" DEFAULT 'FL'::"text" NOT NULL,
    "zip_code" "text" NOT NULL,
    "county" "text",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "location" "public"."geography"(Point,4326),
    "parcel_number" "text",
    "property_type" "public"."property_type" DEFAULT 'residential'::"public"."property_type",
    "year_built" integer,
    "square_footage" integer,
    "lot_size_acres" numeric(10,4),
    "occupancy_status" "public"."occupancy_status" DEFAULT 'owner_occupied'::"public"."occupancy_status",
    "purchase_date" "date",
    "purchase_price" numeric(12,2),
    "current_value" numeric(12,2),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "external_ids" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "ai_risk_score" double precision,
    "ai_risk_factors" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_market_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "property_embedding" "public"."vector"(1536),
    "last_ai_analysis_at" timestamp with time zone,
    "ai_insights" "jsonb" DEFAULT '[]'::"jsonb",
    "county_id" "uuid",
    "county_name" "text",
    CONSTRAINT "properties_ai_risk_score_check" CHECK ((("ai_risk_score" >= (0)::double precision) AND ("ai_risk_score" <= (100)::double precision))),
    CONSTRAINT "valid_location" CHECK (((("latitude" IS NULL) AND ("longitude" IS NULL)) OR (("latitude" IS NOT NULL) AND ("longitude" IS NOT NULL))))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."stg_properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" DEFAULT 'FL'::"text" NOT NULL,
    "zip_code" "text" NOT NULL,
    "county" "text",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "location" "public"."geography"(Point,4326),
    "parcel_number" "text",
    "property_type" "public"."property_type" DEFAULT 'residential'::"public"."property_type",
    "year_built" integer,
    "square_footage" integer,
    "lot_size_acres" numeric(10,4),
    "occupancy_status" "public"."occupancy_status" DEFAULT 'owner_occupied'::"public"."occupancy_status",
    "purchase_date" "date",
    "purchase_price" numeric(12,2),
    "current_value" numeric(12,2),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "external_ids" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "ai_risk_score" double precision,
    "ai_risk_factors" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_market_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "property_embedding" "public"."vector"(1536),
    "last_ai_analysis_at" timestamp with time zone,
    "ai_insights" "jsonb" DEFAULT '[]'::"jsonb",
    "county_id" "uuid",
    "county_name" "text",
    CONSTRAINT "properties_ai_risk_score_check" CHECK ((("ai_risk_score" >= (0)::double precision) AND ("ai_risk_score" <= (100)::double precision))),
    CONSTRAINT "valid_location" CHECK (((("latitude" IS NULL) AND ("longitude" IS NULL)) OR (("latitude" IS NOT NULL) AND ("longitude" IS NOT NULL))))
);


ALTER TABLE "public"."stg_properties" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "reference"."damage_category" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "category" "public"."damage_type_enum" NOT NULL,
    "subcategory" "text" NOT NULL,
    "description" "text",
    "typical_items" "text"[]
);


ALTER TABLE "reference"."damage_category" OWNER TO "postgres";


COMMENT ON TABLE "reference"."damage_category" IS 'Standardized damage categories and subcategories';



CREATE TABLE IF NOT EXISTS "reference"."email_template" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "body_html" "text" NOT NULL,
    "body_text" "text",
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "category" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "reference"."email_template" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "reference"."florida_county" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "county_name" "text" NOT NULL,
    "county_code" "text" NOT NULL,
    "region" "text" NOT NULL,
    "fips_code" "text",
    "population" integer,
    "coastal" boolean DEFAULT false
);


ALTER TABLE "reference"."florida_county" OWNER TO "postgres";


COMMENT ON TABLE "reference"."florida_county" IS 'Florida county reference data';



CREATE TABLE IF NOT EXISTS "reference"."insurance_carrier" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "website" "text",
    "claims_phone" "text",
    "claims_email" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "valid_claims_phone" CHECK ((("claims_phone" IS NULL) OR "core"."validate_phone"("claims_phone"))),
    CONSTRAINT "valid_email" CHECK ((("email" IS NULL) OR "core"."validate_email"("email"))),
    CONSTRAINT "valid_phone" CHECK ((("phone" IS NULL) OR "core"."validate_phone"("phone")))
);


ALTER TABLE "reference"."insurance_carrier" OWNER TO "postgres";


COMMENT ON TABLE "reference"."insurance_carrier" IS 'Master list of insurance carriers';



CREATE TABLE IF NOT EXISTS "reference"."irfs_carrier_mapping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "carrier_id" "uuid",
    "filing_id" bigint,
    "match_confidence" numeric(3,2),
    "matched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "reference"."irfs_carrier_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "security"."api_rate_limit" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid",
    "ip_address" "inet",
    "endpoint" "text" NOT NULL,
    "request_count" integer DEFAULT 1 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "date_trunc"('minute'::"text", CURRENT_TIMESTAMP) NOT NULL
);


ALTER TABLE "security"."api_rate_limit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "security"."audit_log" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "user_id" "uuid",
    "row_data" "jsonb" NOT NULL,
    "changed_fields" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "audit_log_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
)
PARTITION BY RANGE ("created_at");


ALTER TABLE "security"."audit_log" OWNER TO "postgres";


COMMENT ON TABLE "security"."audit_log" IS 'Partitioned audit trail for all changes';



CREATE TABLE IF NOT EXISTS "security"."audit_log_2025_01" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "user_id" "uuid",
    "row_data" "jsonb" NOT NULL,
    "changed_fields" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "audit_log_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "security"."audit_log_2025_01" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "security"."audit_log_2025_02" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "user_id" "uuid",
    "row_data" "jsonb" NOT NULL,
    "changed_fields" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "audit_log_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "security"."audit_log_2025_02" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "security"."login_activity" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "user_agent" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text",
    "location_city" "text",
    "location_country" "text",
    "location_region" "text",
    "success" boolean DEFAULT true NOT NULL,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "valid_failure" CHECK (((("success" = true) AND ("failure_reason" IS NULL)) OR (("success" = false) AND ("failure_reason" IS NOT NULL))))
)
PARTITION BY RANGE ("created_at");


ALTER TABLE "security"."login_activity" OWNER TO "postgres";


COMMENT ON TABLE "security"."login_activity" IS 'Partitioned user login tracking';



CREATE TABLE IF NOT EXISTS "security"."login_activity_2025_01" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "user_agent" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text",
    "location_city" "text",
    "location_country" "text",
    "location_region" "text",
    "success" boolean DEFAULT true NOT NULL,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "valid_failure" CHECK (((("success" = true) AND ("failure_reason" IS NULL)) OR (("success" = false) AND ("failure_reason" IS NOT NULL))))
);


ALTER TABLE "security"."login_activity_2025_01" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "security"."login_activity_2025_02" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "user_agent" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text",
    "location_city" "text",
    "location_country" "text",
    "location_region" "text",
    "success" boolean DEFAULT true NOT NULL,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "valid_failure" CHECK (((("success" = true) AND ("failure_reason" IS NULL)) OR (("success" = false) AND ("failure_reason" IS NOT NULL))))
);


ALTER TABLE "security"."login_activity_2025_02" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "security"."login_activity_2025_03" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "user_agent" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text",
    "location_city" "text",
    "location_country" "text",
    "location_region" "text",
    "success" boolean DEFAULT true NOT NULL,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "valid_failure" CHECK (((("success" = true) AND ("failure_reason" IS NULL)) OR (("success" = false) AND ("failure_reason" IS NOT NULL))))
);


ALTER TABLE "security"."login_activity_2025_03" OWNER TO "postgres";


ALTER TABLE ONLY "external"."oir_clauses" ATTACH PARTITION "external"."oir_clauses_2025" FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');



ALTER TABLE ONLY "monitoring"."alert_history" ATTACH PARTITION "monitoring"."alert_history_2025_01" FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2025-02-01 00:00:00+00');



ALTER TABLE ONLY "monitoring"."data_quality_result" ATTACH PARTITION "monitoring"."data_quality_result_2025_01" FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2025-02-01 00:00:00+00');



ALTER TABLE ONLY "monitoring"."performance_metric" ATTACH PARTITION "monitoring"."performance_metric_2025_01" FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2025-02-01 00:00:00+00');



ALTER TABLE ONLY "security"."audit_log" ATTACH PARTITION "security"."audit_log_2025_01" FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2025-02-01 00:00:00+00');



ALTER TABLE ONLY "security"."audit_log" ATTACH PARTITION "security"."audit_log_2025_02" FOR VALUES FROM ('2025-02-01 00:00:00+00') TO ('2025-03-01 00:00:00+00');



ALTER TABLE ONLY "security"."login_activity" ATTACH PARTITION "security"."login_activity_2025_01" FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2025-02-01 00:00:00+00');



ALTER TABLE ONLY "security"."login_activity" ATTACH PARTITION "security"."login_activity_2025_02" FOR VALUES FROM ('2025-02-01 00:00:00+00') TO ('2025-03-01 00:00:00+00');



ALTER TABLE ONLY "security"."login_activity" ATTACH PARTITION "security"."login_activity_2025_03" FOR VALUES FROM ('2025-03-01 00:00:00+00') TO ('2025-04-01 00:00:00+00');



ALTER TABLE ONLY "core"."insurance_policy" ALTER COLUMN "version_no" SET DEFAULT "nextval"('"core"."insurance_policy_version_no_seq"'::"regclass");



ALTER TABLE ONLY "external_raw_fl"."property_data" ALTER COLUMN "id" SET DEFAULT "nextval"('"external_raw_fl"."property_data_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."counties" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."counties_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fdot_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fdot_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fdot_stage" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fdot_stage_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."florida_parcels" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."florida_parcels_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."states" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."states_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."zip_codes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."zip_codes_id_seq"'::"regclass");



ALTER TABLE ONLY "contractor_connection"."contractor_companies"
    ADD CONSTRAINT "contractor_companies_license_number_key" UNIQUE ("license_number");



ALTER TABLE ONLY "contractor_connection"."contractor_companies"
    ADD CONSTRAINT "contractor_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."claim"
    ADD CONSTRAINT "claim_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "core"."claim_damage"
    ADD CONSTRAINT "claim_damage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."claim_document"
    ADD CONSTRAINT "claim_document_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."claim_payment"
    ADD CONSTRAINT "claim_payment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."claim"
    ADD CONSTRAINT "claim_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."claim_timeline"
    ADD CONSTRAINT "claim_timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."communication_log"
    ADD CONSTRAINT "communication_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."insurance_policy"
    ADD CONSTRAINT "insurance_policy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."property_expense"
    ADD CONSTRAINT "property_expense_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."property_feature"
    ADD CONSTRAINT "property_feature_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."property_feature"
    ADD CONSTRAINT "property_feature_property_id_feature_type_key" UNIQUE ("property_id", "feature_type");



ALTER TABLE ONLY "core"."user_role"
    ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."user_role"
    ADD CONSTRAINT "user_role_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "external"."fl_parcel_ingest_events"
    ADD CONSTRAINT "fl_parcel_ingest_events_ingest_batch_id_key" UNIQUE ("ingest_batch_id");



ALTER TABLE ONLY "external"."fl_parcel_ingest_events"
    ADD CONSTRAINT "fl_parcel_ingest_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "external"."fl_parcels_raw"
    ADD CONSTRAINT "fl_parcels_raw_pkey" PRIMARY KEY ("pk");



ALTER TABLE ONLY "external"."oir_clauses"
    ADD CONSTRAINT "oir_clauses_pkey" PRIMARY KEY ("clause_id", "created_at");



ALTER TABLE ONLY "external"."oir_clauses_2025"
    ADD CONSTRAINT "oir_clauses_2025_pkey" PRIMARY KEY ("clause_id", "created_at");



ALTER TABLE ONLY "external"."oir_doc_hashes"
    ADD CONSTRAINT "oir_doc_hashes_pkey" PRIMARY KEY ("hash");



ALTER TABLE ONLY "external"."oir_docs"
    ADD CONSTRAINT "oir_docs_pkey" PRIMARY KEY ("pk");



ALTER TABLE ONLY "external"."oir_filings"
    ADD CONSTRAINT "oir_filings_pkey" PRIMARY KEY ("filing_id");



ALTER TABLE ONLY "external"."fl_parcels_raw"
    ADD CONSTRAINT "unique_source_parcel" UNIQUE ("source", "parcel_id");



ALTER TABLE ONLY "external_raw_fl"."property_data"
    ADD CONSTRAINT "property_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "external_raw_fl"."property_data"
    ADD CONSTRAINT "property_data_source_record_id_unique" UNIQUE ("source", "source_record_id");



ALTER TABLE ONLY "monitoring"."alert_history"
    ADD CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "monitoring"."alert_history_2025_01"
    ADD CONSTRAINT "alert_history_2025_01_pkey" PRIMARY KEY ("id", "created_at");



ALTER TABLE ONLY "monitoring"."alert_rule"
    ADD CONSTRAINT "alert_rule_name_key" UNIQUE ("name");



ALTER TABLE ONLY "monitoring"."alert_rule"
    ADD CONSTRAINT "alert_rule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "monitoring"."data_quality_result"
    ADD CONSTRAINT "data_quality_result_pkey" PRIMARY KEY ("id", "checked_at");



ALTER TABLE ONLY "monitoring"."data_quality_result_2025_01"
    ADD CONSTRAINT "data_quality_result_2025_01_pkey" PRIMARY KEY ("id", "checked_at");



ALTER TABLE ONLY "monitoring"."data_quality_rule"
    ADD CONSTRAINT "data_quality_rule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "monitoring"."data_quality_rule"
    ADD CONSTRAINT "data_quality_rule_rule_name_key" UNIQUE ("rule_name");



ALTER TABLE ONLY "monitoring"."deployment"
    ADD CONSTRAINT "deployment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "monitoring"."health_check"
    ADD CONSTRAINT "health_check_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "monitoring"."performance_metric"
    ADD CONSTRAINT "performance_metric_pkey" PRIMARY KEY ("id", "recorded_at");



ALTER TABLE ONLY "monitoring"."performance_metric_2025_01"
    ADD CONSTRAINT "performance_metric_2025_01_pkey" PRIMARY KEY ("id", "recorded_at");



ALTER TABLE ONLY "public"."ai_analyses"
    ADD CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_feedback"
    ADD CONSTRAINT "ai_feedback_analysis_id_user_id_key" UNIQUE ("analysis_id", "user_id");



ALTER TABLE ONLY "public"."ai_feedback"
    ADD CONSTRAINT "ai_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_models"
    ADD CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_communications"
    ADD CONSTRAINT "claim_communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_status_history"
    ADD CONSTRAINT "claim_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractor_license_raw"
    ADD CONSTRAINT "contractor_license_raw_pkey" PRIMARY KEY ("license_number");



ALTER TABLE ONLY "public"."counties"
    ADD CONSTRAINT "counties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counties"
    ADD CONSTRAINT "counties_state_id_fips_code_key" UNIQUE ("state_id", "fips_code");



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



ALTER TABLE ONLY "public"."fdot_history"
    ADD CONSTRAINT "fdot_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fdot_parcels"
    ADD CONSTRAINT "fdot_parcels_pkey" PRIMARY KEY ("parcel_id", "co_no");



ALTER TABLE ONLY "public"."fdot_stage"
    ADD CONSTRAINT "fdot_stage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."floir_data"
    ADD CONSTRAINT "floir_data_data_type_primary_key_key" UNIQUE ("data_type", "primary_key");



ALTER TABLE ONLY "public"."floir_data"
    ADD CONSTRAINT "floir_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."florida_counties2"
    ADD CONSTRAINT "florida_counties2_PARCEL_ID_key" UNIQUE ("PARCEL_ID");



ALTER TABLE ONLY "public"."florida_counties2"
    ADD CONSTRAINT "florida_counties2_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_slug_effective_date_key" UNIQUE ("slug", "effective_date");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_slug_version_key" UNIQUE ("slug", "version");



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcel_import_batches"
    ADD CONSTRAINT "parcel_import_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."physical_sites"
    ADD CONSTRAINT "physical_sites_parcel_id_key" UNIQUE ("parcel_id");



ALTER TABLE ONLY "public"."physical_sites"
    ADD CONSTRAINT "physical_sites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_property_id_policy_number_policy_type_key" UNIQUE ("property_id", "policy_number", "policy_type");



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties_old"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey1" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."stg_properties"
    ADD CONSTRAINT "stg_properties_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "reference"."damage_category"
    ADD CONSTRAINT "damage_category_category_subcategory_key" UNIQUE ("category", "subcategory");



ALTER TABLE ONLY "reference"."damage_category"
    ADD CONSTRAINT "damage_category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "reference"."email_template"
    ADD CONSTRAINT "email_template_code_key" UNIQUE ("code");



ALTER TABLE ONLY "reference"."email_template"
    ADD CONSTRAINT "email_template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "reference"."florida_county"
    ADD CONSTRAINT "florida_county_county_code_key" UNIQUE ("county_code");



ALTER TABLE ONLY "reference"."florida_county"
    ADD CONSTRAINT "florida_county_county_name_key" UNIQUE ("county_name");



ALTER TABLE ONLY "reference"."florida_county"
    ADD CONSTRAINT "florida_county_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "reference"."insurance_carrier"
    ADD CONSTRAINT "insurance_carrier_name_key" UNIQUE ("name");



ALTER TABLE ONLY "reference"."insurance_carrier"
    ADD CONSTRAINT "insurance_carrier_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "reference"."irfs_carrier_mapping"
    ADD CONSTRAINT "irfs_carrier_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "security"."api_rate_limit"
    ADD CONSTRAINT "api_rate_limit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "security"."api_rate_limit"
    ADD CONSTRAINT "api_rate_limit_user_id_ip_address_endpoint_window_start_key" UNIQUE ("user_id", "ip_address", "endpoint", "window_start");



CREATE UNIQUE INDEX "contractor_companies_license_idx" ON "contractor_connection"."contractor_companies" USING "btree" ("license_number");



CREATE INDEX "idx_active_policies" ON "core"."insurance_policy" USING "btree" ("user_id", "property_id") WHERE ("is_current" = true);



CREATE INDEX "idx_claim_damage_claim" ON "core"."claim_damage" USING "btree" ("claim_id");



CREATE INDEX "idx_claim_document_claim" ON "core"."claim_document" USING "btree" ("claim_id");



CREATE INDEX "idx_claim_payment_claim" ON "core"."claim_payment" USING "btree" ("claim_id");



CREATE INDEX "idx_claim_policy" ON "core"."claim" USING "btree" ("policy_id");



CREATE INDEX "idx_claim_property" ON "core"."claim" USING "btree" ("property_id");



CREATE INDEX "idx_claim_status_date" ON "core"."claim" USING "btree" ("status", "incident_date" DESC);



CREATE INDEX "idx_claim_timeline_claim" ON "core"."claim_timeline" USING "btree" ("claim_id", "created_at" DESC);



CREATE INDEX "idx_communication_log_entity" ON "core"."communication_log" USING "btree" ("entity_type", "entity_id");



CREATE UNIQUE INDEX "idx_current_policy" ON "core"."insurance_policy" USING "btree" ("user_id", "property_id", "policy_type") WHERE ("is_current" = true);



CREATE INDEX "idx_insurance_policy_property" ON "core"."insurance_policy" USING "btree" ("property_id");



CREATE INDEX "idx_insurance_policy_user" ON "core"."insurance_policy" USING "btree" ("user_id");



CREATE INDEX "idx_open_claims" ON "core"."claim" USING "btree" ("property_id", "status") WHERE ("status" <> ALL (ARRAY['settled'::"public"."claim_status_enum", 'closed'::"public"."claim_status_enum", 'denied'::"public"."claim_status_enum"]));



CREATE UNIQUE INDEX "idx_policy_coverage_summary" ON "core"."policy_coverage_summary" USING "btree" ("policy_id");



CREATE UNIQUE INDEX "idx_property_claims_summary_property" ON "core"."property_claims_summary" USING "btree" ("property_id");



CREATE INDEX "idx_property_expense_claim" ON "core"."property_expense" USING "btree" ("claim_id");



CREATE INDEX "idx_property_expense_property" ON "core"."property_expense" USING "btree" ("property_id");



CREATE INDEX "idx_property_feature_property" ON "core"."property_feature" USING "btree" ("property_id");



CREATE INDEX "idx_user_role_active" ON "core"."user_role" USING "btree" ("is_active", "role") WHERE ("is_active" = true);



CREATE INDEX "idx_user_role_user" ON "core"."user_role" USING "btree" ("user_id");



CREATE INDEX "idx_fl_parcels_raw_attrs" ON "external"."fl_parcels_raw" USING "gin" ("attrs");



CREATE INDEX "idx_fl_parcels_raw_county_fips" ON "external"."fl_parcels_raw" USING "btree" ("county_fips");



CREATE INDEX "idx_fl_parcels_raw_geom" ON "external"."fl_parcels_raw" USING "gist" ("geom");



CREATE INDEX "idx_fl_parcels_raw_parcel_id" ON "external"."fl_parcels_raw" USING "btree" ("parcel_id");



CREATE INDEX "idx_fl_parcels_raw_source" ON "external"."fl_parcels_raw" USING "btree" ("source");



CREATE INDEX "idx_oir_clauses_vec" ON ONLY "external"."oir_clauses" USING "hnsw" ("vec" "public"."vector_cosine_ops");



CREATE INDEX "idx_oir_docs_filing_id" ON "external"."oir_docs" USING "btree" ("filing_id");



CREATE INDEX "idx_oir_filings_company_type" ON "external"."oir_filings" USING "btree" ("company_name", "filing_type");



CREATE INDEX "idx_rate_summaries_company" ON "external"."rate_summaries" USING "btree" ("company_name");



CREATE INDEX "oir_clauses_2025_vec_idx" ON "external"."oir_clauses_2025" USING "hnsw" ("vec" "public"."vector_cosine_ops");



CREATE INDEX "florida_counties2_DOR_UC_idx" ON "public"."florida_counties2" USING "btree" ("DOR_UC");



CREATE INDEX "florida_counties2_OWN_STATE_idx" ON "public"."florida_counties2" USING "btree" ("OWN_STATE");



CREATE INDEX "florida_counties2_SALE_YR1_idx" ON "public"."florida_counties2" USING "btree" ("SALE_YR1");



CREATE INDEX "florida_counties2_asmnt_yr_idx" ON "public"."florida_counties2" USING "btree" ("ASMNT_YR");



CREATE INDEX "florida_counties2_county_fips_idx" ON "public"."florida_counties2" USING "btree" ("county_fips");



CREATE INDEX "florida_counties2_county_id_idx" ON "public"."florida_counties2" USING "btree" ("county_id");



CREATE INDEX "florida_counties2_jv_idx" ON "public"."florida_counties2" USING "btree" ("JV");



CREATE INDEX "florida_counties2_own_name_idx" ON "public"."florida_counties2" USING "btree" ("OWN_NAME");



CREATE INDEX "florida_counties2_parcel_id_idx" ON "public"."florida_counties2" USING "btree" ("PARCEL_ID");



CREATE INDEX "florida_counties2_phy_addr1_idx" ON "public"."florida_counties2" USING "btree" ("PHY_ADDR1");



CREATE INDEX "florida_counties2_phy_city_idx" ON "public"."florida_counties2" USING "btree" ("PHY_CITY");



CREATE INDEX "florida_counties2_sale_prc1_idx" ON "public"."florida_counties2" USING "btree" ("SALE_PRC1") WHERE ("SALE_PRC1" > (0)::double precision);



CREATE INDEX "idx_ai_analyses_created" ON "public"."ai_analyses" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ai_analyses_entity" ON "public"."ai_analyses" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_ai_analyses_input_embedding" ON "public"."ai_analyses" USING "ivfflat" ("input_embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_ai_analyses_user" ON "public"."ai_analyses" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_ip" ON "public"."audit_logs" USING "btree" ("ip_address");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_cities_county_id" ON "public"."cities" USING "btree" ("county_id");



CREATE INDEX "idx_cities_state_id" ON "public"."cities" USING "btree" ("state_id");



CREATE INDEX "idx_claim_communications_claim_id" ON "public"."claim_communications" USING "btree" ("claim_id");



CREATE INDEX "idx_claim_status_history_claim_id" ON "public"."claim_status_history" USING "btree" ("claim_id");



CREATE INDEX "idx_claims_claim_number" ON "public"."claims" USING "btree" ("claim_number");



CREATE INDEX "idx_claims_date_of_loss" ON "public"."claims" USING "btree" ("date_of_loss");



CREATE INDEX "idx_claims_policy_id" ON "public"."claims" USING "btree" ("policy_id");



CREATE INDEX "idx_claims_property_id" ON "public"."claims" USING "btree" ("property_id");



CREATE INDEX "idx_claims_status" ON "public"."claims" USING "btree" ("status");



CREATE INDEX "idx_claims_user_id" ON "public"."claims" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_active" ON "public"."ai_conversations" USING "btree" ("is_active", "last_message_at" DESC);



CREATE INDEX "idx_conversations_context" ON "public"."ai_conversations" USING "btree" ("context_type", "context_id");



CREATE INDEX "idx_conversations_user" ON "public"."ai_conversations" USING "btree" ("user_id");



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



CREATE INDEX "idx_fdot_parcels_geom" ON "public"."fdot_parcels" USING "gist" ("geom");



CREATE INDEX "idx_fdot_stage_geom" ON "public"."fdot_stage" USING "gist" ("geom");



CREATE INDEX "idx_feedback_analysis" ON "public"."ai_feedback" USING "btree" ("analysis_id");



CREATE INDEX "idx_feedback_user" ON "public"."ai_feedback" USING "btree" ("user_id");



CREATE INDEX "idx_floir_data_extracted_at" ON "public"."floir_data" USING "btree" ("extracted_at" DESC);



CREATE INDEX "idx_floir_data_type" ON "public"."floir_data" USING "btree" ("data_type");



CREATE INDEX "idx_floir_embedding_vector" ON "public"."floir_data" USING "hnsw" ("embedding" "public"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



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



CREATE INDEX "idx_parcels_geom" ON "public"."parcels" USING "gist" ("geom");



CREATE UNIQUE INDEX "idx_parcels_parcel_id_source" ON "public"."parcels" USING "btree" ("parcel_id", "source");



CREATE INDEX "idx_physical_sites_parcel_id" ON "public"."physical_sites" USING "btree" ("parcel_id");



CREATE INDEX "idx_policies_carrier_name" ON "public"."policies" USING "btree" ("carrier_name");



CREATE INDEX "idx_policies_expiration_date" ON "public"."policies" USING "btree" ("expiration_date");



CREATE INDEX "idx_policies_is_active" ON "public"."policies" USING "btree" ("is_active");



CREATE INDEX "idx_policies_property_id" ON "public"."policies" USING "btree" ("property_id");



CREATE INDEX "idx_policy_documents_document_type" ON "public"."policy_documents" USING "btree" ("document_type");



CREATE INDEX "idx_policy_documents_policy_id" ON "public"."policy_documents" USING "btree" ("policy_id");



CREATE INDEX "idx_policy_documents_property_id" ON "public"."policy_documents" USING "btree" ("property_id");



CREATE INDEX "idx_policy_documents_uploaded_at" ON "public"."policy_documents" USING "btree" ("uploaded_at" DESC);



CREATE INDEX "idx_policy_documents_uploaded_by" ON "public"."policy_documents" USING "btree" ("uploaded_by");



CREATE INDEX "idx_properties_city_state" ON "public"."properties_old" USING "btree" ("city", "state");



CREATE INDEX "idx_properties_county" ON "public"."properties" USING "btree" ("county_id");



CREATE INDEX "idx_properties_county_name" ON "public"."properties" USING "btree" ("county_name");



CREATE INDEX "idx_properties_location" ON "public"."properties_old" USING "gist" ("location");



CREATE INDEX "idx_properties_postal_code" ON "public"."properties_old" USING "btree" ("postal_code");



CREATE INDEX "idx_properties_street_address" ON "public"."properties_old" USING "btree" ("street_address");



CREATE INDEX "idx_properties_user" ON "public"."properties_old" USING "btree" ("user_id");



CREATE INDEX "idx_properties_user_id" ON "public"."properties" USING "btree" ("user_id");



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



CREATE INDEX "stg_properties_county_id_idx" ON "public"."stg_properties" USING "btree" ("county_id");



CREATE INDEX "stg_properties_county_name_idx" ON "public"."stg_properties" USING "btree" ("county_name");



CREATE INDEX "stg_properties_user_id_idx" ON "public"."stg_properties" USING "btree" ("user_id");



CREATE INDEX "idx_audit_log_user_table" ON ONLY "security"."audit_log" USING "btree" ("user_id", "table_name", "created_at" DESC);



CREATE INDEX "audit_log_2025_01_user_id_table_name_created_at_idx" ON "security"."audit_log_2025_01" USING "btree" ("user_id", "table_name", "created_at" DESC);



CREATE INDEX "audit_log_2025_02_user_id_table_name_created_at_idx" ON "security"."audit_log_2025_02" USING "btree" ("user_id", "table_name", "created_at" DESC);



CREATE INDEX "idx_login_2025_01_user" ON "security"."login_activity_2025_01" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_login_2025_02_user" ON "security"."login_activity_2025_02" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_login_2025_03_user" ON "security"."login_activity_2025_03" USING "btree" ("user_id", "created_at" DESC);



ALTER INDEX "external"."oir_clauses_pkey" ATTACH PARTITION "external"."oir_clauses_2025_pkey";



ALTER INDEX "external"."idx_oir_clauses_vec" ATTACH PARTITION "external"."oir_clauses_2025_vec_idx";



ALTER INDEX "monitoring"."alert_history_pkey" ATTACH PARTITION "monitoring"."alert_history_2025_01_pkey";



ALTER INDEX "monitoring"."data_quality_result_pkey" ATTACH PARTITION "monitoring"."data_quality_result_2025_01_pkey";



ALTER INDEX "monitoring"."performance_metric_pkey" ATTACH PARTITION "monitoring"."performance_metric_2025_01_pkey";



ALTER INDEX "security"."idx_audit_log_user_table" ATTACH PARTITION "security"."audit_log_2025_01_user_id_table_name_created_at_idx";



ALTER INDEX "security"."idx_audit_log_user_table" ATTACH PARTITION "security"."audit_log_2025_02_user_id_table_name_created_at_idx";



CREATE OR REPLACE TRIGGER "audit_claims" AFTER INSERT OR DELETE OR UPDATE ON "core"."claim" FOR EACH ROW EXECUTE FUNCTION "security"."create_audit_entry"();



CREATE OR REPLACE TRIGGER "audit_policies" AFTER INSERT OR DELETE OR UPDATE ON "core"."insurance_policy" FOR EACH ROW EXECUTE FUNCTION "security"."create_audit_entry"();



CREATE OR REPLACE TRIGGER "generate_claim_number" BEFORE INSERT ON "core"."claim" FOR EACH ROW EXECUTE FUNCTION "core"."set_claim_number"();



CREATE OR REPLACE TRIGGER "update_claim_status_from_timeline" AFTER INSERT ON "core"."claim_timeline" FOR EACH ROW EXECUTE FUNCTION "core"."validate_claim_timeline"();



CREATE OR REPLACE TRIGGER "generate_claim_number_trigger" BEFORE INSERT ON "public"."claims" FOR EACH ROW WHEN (("new"."claim_number" IS NULL)) EXECUTE FUNCTION "public"."generate_claim_number"();



CREATE OR REPLACE TRIGGER "on_parcels_update" BEFORE UPDATE ON "public"."parcels" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "on_profile_updated" AFTER UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_profile_update"();



COMMENT ON TRIGGER "on_profile_updated" ON "public"."user_profiles" IS 'Syncs user profile changes back to auth.users metadata';



CREATE OR REPLACE TRIGGER "on_scraper_request" AFTER INSERT OR UPDATE ON "public"."scraper_queue" FOR EACH ROW EXECUTE FUNCTION "public"."notify_scraper_webhook"();



CREATE OR REPLACE TRIGGER "trigger_auto_populate_county_insert" BEFORE INSERT ON "public"."properties" FOR EACH ROW WHEN (("new"."county_id" IS NULL)) EXECUTE FUNCTION "public"."auto_populate_county"();



CREATE OR REPLACE TRIGGER "trigger_auto_populate_county_update" BEFORE UPDATE ON "public"."properties" FOR EACH ROW WHEN ((("new"."address" IS DISTINCT FROM "old"."address") OR ("new"."county_id" IS NULL))) EXECUTE FUNCTION "public"."auto_populate_county"();



CREATE OR REPLACE TRIGGER "trigger_link_parcel_to_county" BEFORE INSERT OR UPDATE ON "public"."florida_parcels" FOR EACH ROW EXECUTE FUNCTION "public"."link_parcel_to_county"();



CREATE OR REPLACE TRIGGER "trigger_prevent_backdating" BEFORE INSERT OR UPDATE ON "public"."legal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_backdating"();



CREATE OR REPLACE TRIGGER "trigger_property_embedding_update" BEFORE UPDATE ON "public"."properties" FOR EACH ROW WHEN ((("old"."address" IS DISTINCT FROM "new"."address") OR ("old"."property_type" IS DISTINCT FROM "new"."property_type") OR ("old"."square_footage" IS DISTINCT FROM "new"."square_footage") OR ("old"."year_built" IS DISTINCT FROM "new"."year_built"))) EXECUTE FUNCTION "public"."update_property_embedding"();



CREATE OR REPLACE TRIGGER "trigger_update_document_extractions_updated_at" BEFORE UPDATE ON "public"."document_extractions" FOR EACH ROW EXECUTE FUNCTION "public"."update_document_extractions_updated_at"();



CREATE OR REPLACE TRIGGER "update_claims_updated_at" BEFORE UPDATE ON "public"."claims" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_policies_updated_at" BEFORE UPDATE ON "public"."policies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties_old" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_property_insurance_updated_at" BEFORE UPDATE ON "public"."property_insurance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_property_land_updated_at" BEFORE UPDATE ON "public"."property_land" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_property_structures_updated_at" BEFORE UPDATE ON "public"."property_structures" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_plans_updated_at" BEFORE UPDATE ON "public"."user_plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "core"."claim_damage"
    ADD CONSTRAINT "claim_damage_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "core"."claim"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."claim_document"
    ADD CONSTRAINT "claim_document_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "core"."claim"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."claim_document"
    ADD CONSTRAINT "claim_document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "core"."claim_payment"
    ADD CONSTRAINT "claim_payment_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "core"."claim"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."claim_payment"
    ADD CONSTRAINT "claim_payment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "core"."claim"
    ADD CONSTRAINT "claim_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "core"."insurance_policy"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "core"."claim"
    ADD CONSTRAINT "claim_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "core"."claim_timeline"
    ADD CONSTRAINT "claim_timeline_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "core"."claim_timeline"
    ADD CONSTRAINT "claim_timeline_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "core"."claim"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."communication_log"
    ADD CONSTRAINT "communication_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "core"."insurance_policy"
    ADD CONSTRAINT "insurance_policy_irfs_filing_id_fkey" FOREIGN KEY ("irfs_filing_id") REFERENCES "external"."oir_filings"("filing_id");



ALTER TABLE ONLY "core"."insurance_policy"
    ADD CONSTRAINT "insurance_policy_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "core"."insurance_policy"
    ADD CONSTRAINT "insurance_policy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."property_expense"
    ADD CONSTRAINT "property_expense_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "core"."claim"("id");



ALTER TABLE ONLY "core"."property_expense"
    ADD CONSTRAINT "property_expense_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."property_feature"
    ADD CONSTRAINT "property_feature_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."user_role"
    ADD CONSTRAINT "user_role_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "core"."user_role"
    ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "external"."oir_clauses"
    ADD CONSTRAINT "oir_clauses_doc_pk_fkey" FOREIGN KEY ("doc_pk") REFERENCES "external"."oir_docs"("pk") ON DELETE CASCADE;



ALTER TABLE ONLY "external"."oir_docs"
    ADD CONSTRAINT "oir_docs_filing_id_fkey" FOREIGN KEY ("filing_id") REFERENCES "external"."oir_filings"("filing_id") ON DELETE CASCADE;



ALTER TABLE "monitoring"."alert_history"
    ADD CONSTRAINT "alert_history_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "monitoring"."alert_rule"("id");



ALTER TABLE "monitoring"."data_quality_result"
    ADD CONSTRAINT "data_quality_result_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "monitoring"."data_quality_rule"("id");



ALTER TABLE ONLY "public"."ai_analyses"
    ADD CONSTRAINT "ai_analyses_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id");



ALTER TABLE ONLY "public"."ai_analyses"
    ADD CONSTRAINT "ai_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_feedback"
    ADD CONSTRAINT "ai_feedback_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "public"."ai_analyses"("id");



ALTER TABLE ONLY "public"."ai_feedback"
    ADD CONSTRAINT "ai_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claim_communications"
    ADD CONSTRAINT "claim_communications_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claim_communications"
    ADD CONSTRAINT "claim_communications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."claim_status_history"
    ADD CONSTRAINT "claim_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."claim_status_history"
    ADD CONSTRAINT "claim_status_history_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."counties"
    ADD CONSTRAINT "counties_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."damage_ai_detections"
    ADD CONSTRAINT "damage_ai_detections_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "public"."ai_analyses"("id");



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



ALTER TABLE ONLY "public"."florida_counties2"
    ADD CONSTRAINT "florida_counties2_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."florida_counties"("id");



ALTER TABLE ONLY "public"."florida_parcels"
    ADD CONSTRAINT "florida_parcels_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."florida_counties"("id");



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_raw_data_id_fkey" FOREIGN KEY ("raw_data_id") REFERENCES "external_raw_fl"."property_data"("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_irfs_filing_id_fkey" FOREIGN KEY ("irfs_filing_id") REFERENCES "external"."oir_filings"("filing_id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."florida_counties"("id");



ALTER TABLE ONLY "public"."properties_old"
    ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_ai_insights"
    ADD CONSTRAINT "property_ai_insights_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id");



ALTER TABLE ONLY "public"."property_ai_insights"
    ADD CONSTRAINT "property_ai_insights_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_contractors"
    ADD CONSTRAINT "property_contractors_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_contractors"
    ADD CONSTRAINT "property_contractors_damage_id_fkey" FOREIGN KEY ("damage_id") REFERENCES "public"."property_damage"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_contractors"
    ADD CONSTRAINT "property_contractors_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_damage"
    ADD CONSTRAINT "property_damage_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_damage"
    ADD CONSTRAINT "property_damage_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_damage"
    ADD CONSTRAINT "property_damage_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "public"."property_structures"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_insurance"
    ADD CONSTRAINT "property_insurance_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_land"
    ADD CONSTRAINT "property_land_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_structures"
    ADD CONSTRAINT "property_structures_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "reference"."irfs_carrier_mapping"
    ADD CONSTRAINT "irfs_carrier_mapping_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "reference"."insurance_carrier"("id");



ALTER TABLE ONLY "reference"."irfs_carrier_mapping"
    ADD CONSTRAINT "irfs_carrier_mapping_filing_id_fkey" FOREIGN KEY ("filing_id") REFERENCES "external"."oir_filings"("filing_id");



ALTER TABLE ONLY "security"."api_rate_limit"
    ADD CONSTRAINT "api_rate_limit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Users can create own claims" ON "core"."claim" FOR INSERT WITH CHECK (("property_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage own policies" ON "core"."insurance_policy" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own property expenses" ON "core"."property_expense" USING (("property_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage own property features" ON "core"."property_feature" USING (("property_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own claims" ON "core"."claim" FOR UPDATE USING ((("property_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"()))) AND ("status" <> ALL (ARRAY['approved'::"public"."claim_status_enum", 'settled'::"public"."claim_status_enum", 'closed'::"public"."claim_status_enum"]))));



CREATE POLICY "Users can view own claims" ON "core"."claim" FOR SELECT USING ((("property_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "core"."user_role" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['adjuster'::"public"."user_role_enum", 'admin'::"public"."user_role_enum", 'super_admin'::"public"."user_role_enum"])) AND ("ur"."is_active" = true))))));



CREATE POLICY "Users can view own communications" ON "core"."communication_log" FOR SELECT USING (((("entity_type" = 'claim'::"text") AND ("entity_id" IN ( SELECT "c"."id"
   FROM ("core"."claim" "c"
     JOIN "public"."properties_old" "p" ON (("c"."property_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"())))) OR (("entity_type" = 'property'::"text") AND ("entity_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"())))) OR (("entity_type" = 'policy'::"text") AND ("entity_id" IN ( SELECT "insurance_policy"."id"
   FROM "core"."insurance_policy"
  WHERE ("insurance_policy"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view own policies" ON "core"."insurance_policy" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own roles" ON "core"."user_role" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "core"."user_role" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"public"."user_role_enum", 'super_admin'::"public"."user_role_enum"])) AND ("ur"."is_active" = true))))));



CREATE POLICY "Users can view payments for own claims" ON "core"."claim_payment" FOR SELECT USING (("claim_id" IN ( SELECT "c"."id"
   FROM ("core"."claim" "c"
     JOIN "public"."properties_old" "p" ON (("c"."property_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))));



ALTER TABLE "core"."claim" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."claim_damage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."claim_document" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."claim_payment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."claim_timeline" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."communication_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."insurance_policy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."property_expense" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."property_feature" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."user_role" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow_read_oir_clauses" ON "external"."oir_clauses" FOR SELECT USING (true);



CREATE POLICY "allow_read_oir_docs" ON "external"."oir_docs" FOR SELECT USING (true);



CREATE POLICY "allow_read_oir_filings" ON "external"."oir_filings" FOR SELECT USING (true);



ALTER TABLE "external"."oir_clauses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "external"."oir_docs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "external"."oir_filings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow public read-only access to parcels" ON "public"."parcels" FOR SELECT USING (true);



CREATE POLICY "Allow service_role full access to parcels" ON "public"."parcels" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Allow service_role full access to scraper_runs" ON "public"."scraper_runs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Anon users can insert scraper logs" ON "public"."scraper_logs" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon users can read scraper logs" ON "public"."scraper_logs" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Authenticated users full access" ON "public"."scraper_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Counties are viewable by all users" ON "public"."florida_counties" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."florida_parcels" FOR SELECT USING (true);



CREATE POLICY "Enable update for admin users" ON "public"."florida_parcels" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Enable write for authenticated users" ON "public"."florida_parcels" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Global FLOIR data read access" ON "public"."floir_data" FOR SELECT USING (true);



CREATE POLICY "Legal documents are viewable by everyone" ON "public"."legal_documents" FOR SELECT USING (true);



CREATE POLICY "Only admins can modify counties" ON "public"."florida_counties" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Public read access to cities" ON "public"."cities" FOR SELECT USING (true);



CREATE POLICY "Public read access to counties" ON "public"."counties" FOR SELECT USING (true);



CREATE POLICY "Public read access to properties" ON "public"."properties" FOR SELECT USING (true);



CREATE POLICY "Public read access to states" ON "public"."states" FOR SELECT USING (true);



CREATE POLICY "Public read access to zip codes" ON "public"."zip_codes" FOR SELECT USING (true);



CREATE POLICY "Security questions are viewable by everyone" ON "public"."security_questions" FOR SELECT USING (true);



CREATE POLICY "Service role FLOIR data write access" ON "public"."floir_data" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can do everything" ON "public"."physical_sites" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can insert security logs" ON "public"."security_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can manage scraper queue" ON "public"."scraper_queue" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."scraper_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role write access to properties" ON "public"."properties" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can create AI analyses" ON "public"."ai_analyses" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create communications for their claims" ON "public"."claim_communications" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("claim_id" IN ( SELECT "claims"."id"
   FROM "public"."claims"
  WHERE ("claims"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create own properties" ON "public"."properties" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create policies for their properties" ON "public"."policies" FOR INSERT WITH CHECK (("property_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create their own claims" ON "public"."claims" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own properties" ON "public"."properties" FOR DELETE USING (("user_id" = "auth"."uid"()));



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



CREATE POLICY "Users can manage their own feedback" ON "public"."ai_feedback" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own plan" ON "public"."user_plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own properties" ON "public"."properties" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own properties" ON "public"."properties_old" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own security answers" ON "public"."user_security_answers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update policies for their properties" ON "public"."policies" FOR UPDATE USING (("property_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own claims" ON "public"."claims" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own documents" ON "public"."policy_documents" FOR UPDATE USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own extractions" ON "public"."document_extractions" FOR UPDATE USING (("processed_by" = "auth"."uid"()));



CREATE POLICY "Users can view communications for their claims" ON "public"."claim_communications" FOR SELECT USING (("claim_id" IN ( SELECT "claims"."id"
   FROM "public"."claims"
  WHERE ("claims"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own legal acceptances" ON "public"."user_legal_acceptance" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own plan" ON "public"."user_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own properties" ON "public"."properties" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own properties" ON "public"."properties_old" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own security answers" ON "public"."user_security_answers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view policies for their properties" ON "public"."policies" FOR SELECT USING (("property_id" IN ( SELECT "properties_old"."id"
   FROM "public"."properties_old"
  WHERE ("properties_old"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view status history for their claims" ON "public"."claim_status_history" FOR SELECT USING (("claim_id" IN ( SELECT "claims"."id"
   FROM "public"."claims"
  WHERE ("claims"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own AI analyses" ON "public"."ai_analyses" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own claims" ON "public"."claims" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own conversations" ON "public"."ai_conversations" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own documents" ON "public"."policy_documents" FOR SELECT USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own extractions" ON "public"."document_extractions" FOR SELECT USING (("processed_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_communications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."counties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crawl_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."damage_ai_detections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_ai_extractions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_extractions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."floir_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."florida_counties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."florida_counties2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."florida_parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parcel_import_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."physical_sites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


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


ALTER TABLE "public"."states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_legal_acceptance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_security_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zip_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view own audit logs" ON "security"."audit_log" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own login activity" ON "security"."login_activity" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "security"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "security"."login_activity" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "core" TO "authenticated";






GRANT USAGE ON SCHEMA "external_raw_fl" TO "anon";
GRANT USAGE ON SCHEMA "external_raw_fl" TO "authenticated";
GRANT USAGE ON SCHEMA "external_raw_fl" TO "service_role";



GRANT USAGE ON SCHEMA "history" TO "authenticated";



GRANT USAGE ON SCHEMA "monitoring" TO "authenticated";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "reference" TO "authenticated";



GRANT USAGE ON SCHEMA "security" TO "authenticated";



GRANT USAGE ON SCHEMA "test" TO "authenticated";



GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d_out"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2df_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2df_out"("public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d_out"("public"."box3d") TO "service_role";



GRANT ALL ON TYPE "public"."crawl_status" TO "anon";
GRANT ALL ON TYPE "public"."crawl_status" TO "authenticated";
GRANT ALL ON TYPE "public"."crawl_status" TO "service_role";



GRANT ALL ON TYPE "public"."floir_data_type" TO "anon";
GRANT ALL ON TYPE "public"."floir_data_type" TO "authenticated";
GRANT ALL ON TYPE "public"."floir_data_type" TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_analyze"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_out"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_send"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_typmod_out"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_analyze"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_out"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_recv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_send"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_typmod_out"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gidx_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gidx_out"("public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON TYPE "public"."import_status" TO "anon";
GRANT ALL ON TYPE "public"."import_status" TO "authenticated";
GRANT ALL ON TYPE "public"."import_status" TO "service_role";



GRANT ALL ON TYPE "public"."parcel_data_source" TO "anon";
GRANT ALL ON TYPE "public"."parcel_data_source" TO "authenticated";
GRANT ALL ON TYPE "public"."parcel_data_source" TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spheroid_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spheroid_out"("public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("public"."geography", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("public"."geometry", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."json"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."jsonb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."path"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."point"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."polygon"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("path") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("path") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("point") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("point") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("polygon") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_deprecate"("oldname" "text", "newname" "text", "version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_index_extent"("tbl" "regclass", "col" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_join_selectivity"("regclass", "text", "regclass", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_pgsql_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_scripts_pgsql_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_selectivity"("tbl" "regclass", "att_name" "text", "geom" "public"."geometry", "mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_postgis_stats"("tbl" "regclass", "att_name" "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_asgml"(integer, "public"."geometry", integer, integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_asx3d"(integer, "public"."geometry", integer, integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_bestsrid"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distancetree"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_distanceuncached"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_dwithinuncached"("public"."geography", "public"."geography", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_expand"("public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_geomfromgml"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_pointoutside"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_sortablehash"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_voronoi"("g1" "public"."geometry", "clip" "public"."geometry", "tolerance" double precision, "return_polygons" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."addauth"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."addauth"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer, "new_type" character varying, "new_dim" integer, "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_populate_county"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_populate_county"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_populate_county"() TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."box3dtobox"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_florida_parcels_duplicates"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_florida_parcels_duplicates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_florida_parcels_duplicates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_florida_parcels_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_florida_parcels_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_florida_parcels_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauth"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "postgres";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkauthtrigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."contains_2d"("public"."geometry", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "postgres";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disablelongtransactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrycolumn"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("schema_name" character varying, "table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dropgeometrytable"("catalog_name" character varying, "schema_name" character varying, "table_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "postgres";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enablelongtransactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_srid"(character varying, character varying, character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geog_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_cmp"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_distance_knn"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_eq"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_ge"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_consistent"("internal", "public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_distance"("internal", "public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_same"("public"."box2d", "public"."box2d", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gist_union"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_gt"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_le"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_lt"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_overlaps"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_choose_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_config_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_inner_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_leaf_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geography_spgist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom2d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom3d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geom4d_brin_inclusion_add_value"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_above"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_below"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_cmp"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contained_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_contains_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_box"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_centroid_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_distance_cpa"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_eq"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_ge"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_2d"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_consistent_nd"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_decompress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_2d"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_distance_nd"("internal", "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_2d"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_penalty_nd"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_2d"("geom1" "public"."geometry", "geom2" "public"."geometry", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_same_nd"("public"."geometry", "public"."geometry", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_sortsupport_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_2d"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gist_union_nd"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_gt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_hash"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_le"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_left"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_lt"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overabove"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overbelow"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overlaps_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overleft"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_overright"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_right"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same_3d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_same_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_sortsupport"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_choose_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_2d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_3d"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_compress_nd"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_config_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_inner_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_leaf_consistent_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_2d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_3d"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_spgist_picksplit_nd"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometry_within_nd"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geometrytype"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geomfromewkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."geomfromewkt"("text") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_proj4_from_srid"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_property_county_requirements"("p_property_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "postgres";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "anon";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."gettransactionid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_2d"("internal", "oid", "internal", smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_joinsel_nd"("internal", "oid", "internal", smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_2d"("internal", "oid", "internal", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gserialized_gist_sel_nd"("internal", "oid", "internal", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_florida_parcels_uppercase"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_florida_parcels_uppercase"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_florida_parcels_uppercase"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_contained_2d"("public"."geometry", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_parcel_to_county"() TO "anon";
GRANT ALL ON FUNCTION "public"."link_parcel_to_county"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_parcel_to_county"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lockrow"("text", "text", "text", "text", timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_creation_debug"("p_user_id" "uuid", "p_step" "text", "p_success" boolean, "p_error_message" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_creation_debug"("p_user_id" "uuid", "p_step" "text", "p_success" boolean, "p_error_message" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_creation_debug"("p_user_id" "uuid", "p_step" "text", "p_success" boolean, "p_error_message" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "postgres";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "anon";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."longtransactionsenabled"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."box2df", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_2d"("public"."geometry", "public"."box2df") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."geography", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_geog"("public"."gidx", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."geometry", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "postgres";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "anon";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "authenticated";
GRANT ALL ON FUNCTION "public"."overlaps_nd"("public"."gidx", "public"."gidx") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asflatgeobuf_transfn"("internal", "anyelement", boolean, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asgeobuf_transfn"("internal", "anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_combinefn"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_deserialfn"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_serialfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_asmvt_transfn"("internal", "anyelement", "text", integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_accum_transfn"("internal", "public"."geometry", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterintersecting_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_clusterwithin_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_collect_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_makeline_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_polygonize_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_combinefn"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_deserialfn"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_finalfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_serialfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgis_geometry_union_parallel_transfn"("internal", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_geometry_columns"("tbl_oid" "oid", "use_typmod" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_addbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_cache_bbox"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_dims"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_srid"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_constraint_type"("geomschema" "text", "geomtable" "text", "geomcolumn" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_dropbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_extensions_upgrade"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_full_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_geos_noop"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_geos_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_getbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_hasbbox"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_index_supportfn"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_build_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_revision"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_lib_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libjson_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_liblwgeom_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libprotobuf_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_libxml_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_noop"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_proj_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_build_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_installed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_scripts_released"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_svn_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_transform_geometry"("geom" "public"."geometry", "text", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_type_name"("geomname" character varying, "coord_dimension" integer, "use_new_name" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_dims"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_srid"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_typmod_type"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "postgres";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."postgis_wagyu_version"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dclosestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3ddwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dintersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlength"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlineinterpolatepoint"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dlongestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dmakebox"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dmaxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dperimeter"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dshortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addmeasure"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_addpoint"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_affine"("public"."geometry", double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_angle"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_angle"("pt1" "public"."geometry", "pt2" "public"."geometry", "pt3" "public"."geometry", "pt4" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_area2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geography", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asbinary"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asencodedpolyline"("geom" "public"."geometry", "nprecision" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkb"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asewkt"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeojson"("r" "record", "geom_column" "text", "maxdecimaldigits" integer, "pretty_bool" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geog" "public"."geography", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgml"("version" integer, "geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer, "nprefix" "text", "id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ashexewkb"("public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("geog" "public"."geography", "maxdecimaldigits" integer, "nprefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_askml"("geom" "public"."geometry", "maxdecimaldigits" integer, "nprefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_aslatlontext"("geom" "public"."geometry", "tmpl" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmarc21"("geom" "public"."geometry", "format" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvtgeom"("geom" "public"."geometry", "bounds" "public"."box2d", "extent" integer, "buffer" integer, "clip_geom" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("geog" "public"."geography", "rel" integer, "maxdecimaldigits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_assvg"("geom" "public"."geometry", "rel" integer, "maxdecimaldigits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geography", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astext"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry", "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_astwkb"("geom" "public"."geometry"[], "ids" bigint[], "prec" integer, "prec_z" integer, "prec_m" integer, "with_sizes" boolean, "with_boxes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asx3d"("geom" "public"."geometry", "maxdecimaldigits" integer, "options" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_azimuth"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_bdmpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_bdpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_boundary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_boundingdiagonal"("geom" "public"."geometry", "fits" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_box2dfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("text", double precision, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("public"."geography", double precision, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "quadsegs" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buffer"("geom" "public"."geometry", "radius" double precision, "options" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_buildarea"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_centroid"("public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_chaikinsmoothing"("public"."geometry", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_cleangeometry"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clipbybox2d"("geom" "public"."geometry", "box" "public"."box2d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_closestpoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_closestpointofapproach"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterdbscan"("public"."geometry", "eps" double precision, "minpoints" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterkmeans"("geom" "public"."geometry", "k" integer, "max_radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry"[], double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionextract"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collectionhomogenize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box2d", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_combinebbox"("public"."box3d", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_concavehull"("param_geom" "public"."geometry", "param_pctconvex" double precision, "param_allow_holes" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_contains"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_containsproperly"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_convexhull"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coorddim"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_coveredby"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_covers"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_cpawithin"("public"."geometry", "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_crosses"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_curvetoline"("geom" "public"."geometry", "tol" double precision, "toltype" integer, "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_delaunaytriangles"("g1" "public"."geometry", "tolerance" double precision, "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dfullywithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_difference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dimension"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_disjoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distance"("geog1" "public"."geography", "geog2" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancecpa"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancesphere"("geom1" "public"."geometry", "geom2" "public"."geometry", "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_distancespheroid"("geom1" "public"."geometry", "geom2" "public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dump"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumppoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumprings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dumpsegments"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("text", "text", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_dwithin"("geog1" "public"."geography", "geog2" "public"."geography", "tolerance" double precision, "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_endpoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_envelope"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_equals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_estimatedextent"("text", "text", "text", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box2d", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."box3d", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box2d", "dx" double precision, "dy" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("box" "public"."box3d", "dx" double precision, "dy" double precision, "dz" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_expand"("geom" "public"."geometry", "dx" double precision, "dy" double precision, "dz" double precision, "dm" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_exteriorring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_filterbym"("public"."geometry", double precision, double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_findextent"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_flipcoordinates"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3d"("geom" "public"."geometry", "zvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3dm"("geom" "public"."geometry", "mvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force3dz"("geom" "public"."geometry", "zvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_force4d"("geom" "public"."geometry", "zvalue" double precision, "mvalue" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcecollection"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcecurve"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcepolygonccw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcepolygoncw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcerhr"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_forcesfs"("public"."geometry", "version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_frechetdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuf"("anyelement", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_fromflatgeobuftotable"("text", "text", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_generatepoints"("area" "public"."geometry", "npoints" integer, "seed" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geogfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geogfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geographyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geohash"("geog" "public"."geography", "maxchars" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geohash"("geom" "public"."geometry", "maxchars" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomcollfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometricmedian"("g" "public"."geometry", "tolerance" double precision, "max_iter" integer, "fail_if_not_converged" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometryn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geometrytype"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromewkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromewkt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"(json) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgeojson"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromgml"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromkml"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfrommarc21"("marc21xml" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromtwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_geomfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_gmltosql"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hasarc"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hausdorffdistance"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hexagon"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_hexagongrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_interiorringn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_interpolatepoint"("line" "public"."geometry", "point" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("public"."geography", "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersection"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("geog1" "public"."geography", "geog2" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_intersects"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isclosed"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_iscollection"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isempty"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ispolygonccw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ispolygoncw"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_issimple"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalid"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvaliddetail"("geom" "public"."geometry", "flags" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidreason"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_isvalidtrajectory"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_length2dspheroid"("public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "anon";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lengthspheroid"("public"."geometry", "public"."spheroid") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "anon";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_letters"("letters" "text", "font" json) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linecrossingdirection"("line1" "public"."geometry", "line2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromencodedpolyline"("txtin" "text", "nprecision" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefrommultipoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linefromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoint"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_lineinterpolatepoints"("public"."geometry", double precision, "repeat" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linelocatepoint"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linemerge"("public"."geometry", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linestringfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linesubstring"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_linetocurve"("geometry" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatealong"("geometry" "public"."geometry", "measure" double precision, "leftrightoffset" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatebetween"("geometry" "public"."geometry", "frommeasure" double precision, "tomeasure" double precision, "leftrightoffset" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_locatebetweenelevations"("geometry" "public"."geometry", "fromelevation" double precision, "toelevation" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_longestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_m"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makebox2d"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeenvelope"(double precision, double precision, double precision, double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepoint"(double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepointm"(double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makepolygon"("public"."geometry", "public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makevalid"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makevalid"("geom" "public"."geometry", "params" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_maxdistance"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_maximuminscribedcircle"("public"."geometry", OUT "center" "public"."geometry", OUT "nearest" "public"."geometry", OUT "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memsize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumboundingcircle"("inputgeom" "public"."geometry", "segs_per_quarter" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumboundingradius"("public"."geometry", OUT "center" "public"."geometry", OUT "radius" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumclearance"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_minimumclearanceline"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mlinefromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_mpolyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multi"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinefromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multilinestringfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_multipolygonfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ndims"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_node"("g" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_normalize"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_npoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_nrings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numgeometries"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numinteriorring"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numinteriorrings"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numpatches"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_numpoints"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_offsetcurve"("line" "public"."geometry", "distance" double precision, "params" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_orderingequals"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_orientedenvelope"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_overlaps"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_patchn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter"("geog" "public"."geography", "use_spheroid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_perimeter2d"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_point"(double precision, double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromgeohash"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointinsidecircle"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointm"("xcoordinate" double precision, "ycoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointn"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointonsurface"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_points"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointz"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_pointzm"("xcoordinate" double precision, "ycoordinate" double precision, "zcoordinate" double precision, "mcoordinate" double precision, "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polyfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygon"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromtext"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonfromwkb"("bytea", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_project"("geog" "public"."geography", "distance" double precision, "azimuth" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_quantizecoordinates"("g" "public"."geometry", "prec_x" integer, "prec_y" integer, "prec_z" integer, "prec_m" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_reduceprecision"("geom" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relate"("geom1" "public"."geometry", "geom2" "public"."geometry", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_relatematch"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_removepoint"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_removerepeatedpoints"("geom" "public"."geometry", "tolerance" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_reverse"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotate"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatex"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatey"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_rotatez"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", "public"."geometry", "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scale"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_scroll"("public"."geometry", "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_segmentize"("geog" "public"."geography", "max_segment_length" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_segmentize"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_seteffectivearea"("public"."geometry", double precision, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setpoint"("public"."geometry", integer, "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geog" "public"."geography", "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_setsrid"("geom" "public"."geometry", "srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_sharedpaths"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_shiftlongitude"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_shortestline"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplify"("public"."geometry", double precision, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifypolygonhull"("geom" "public"."geometry", "vertex_fraction" double precision, "is_outer" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifypreservetopology"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_simplifyvw"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snap"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_snaptogrid"("geom1" "public"."geometry", "geom2" "public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_split"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_square"("size" double precision, "cell_i" integer, "cell_j" integer, "origin" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_squaregrid"("size" double precision, "bounds" "public"."geometry", OUT "geom" "public"."geometry", OUT "i" integer, OUT "j" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_srid"("geog" "public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_srid"("geom" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_startpoint"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_subdivide"("geom" "public"."geometry", "maxvertices" integer, "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "anon";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geography") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_summary"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_swapordinates"("geom" "public"."geometry", "ords" "cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_symdifference"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_symmetricdifference"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_tileenvelope"("zoom" integer, "x" integer, "y" integer, "bounds" "public"."geometry", "margin" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_touches"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("public"."geometry", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "to_proj" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_srid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transform"("geom" "public"."geometry", "from_proj" "text", "to_proj" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_translate"("public"."geometry", double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_transscale"("public"."geometry", double precision, double precision, double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_triangulatepolygon"("g1" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_unaryunion"("public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("geom1" "public"."geometry", "geom2" "public"."geometry", "gridsize" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_voronoilines"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_voronoipolygons"("g1" "public"."geometry", "tolerance" double precision, "extend_to" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_within"("geom1" "public"."geometry", "geom2" "public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wkbtosql"("wkb" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wkttosql"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_wrapx"("geom" "public"."geometry", "wrap" double precision, "move" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_x"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_xmax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_xmin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_y"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ymax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_ymin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_z"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmax"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmflag"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "anon";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_zmin"("public"."box3d") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."suggest_type_optimizations"() TO "anon";
GRANT ALL ON FUNCTION "public"."suggest_type_optimizations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."suggest_type_optimizations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_florida_parcels_staging"() TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_florida_parcels_staging"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_florida_parcels_staging"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlockrows"("text") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"(character varying, character varying, character varying, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."updategeometrysrid"("catalogn_name" character varying, "schema_name" character varying, "table_name" character varying, "column_name" character varying, "new_srid_in" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_parcel_data"("p_parcel_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_parcel_data"("p_parcel_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_parcel_data"("p_parcel_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_3dextent"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asflatgeobuf"("anyelement", boolean, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asgeobuf"("anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_asmvt"("anyelement", "text", integer, "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterintersecting"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_clusterwithin"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_collect"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_extent"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_makeline"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memcollect"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_memunion"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_polygonize"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry") TO "service_role";



GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."st_union"("public"."geometry", double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "core"."claim" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "core"."claim_damage" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "core"."claim_document" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "core"."claim_timeline" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "core"."insurance_policy" TO "authenticated";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_old" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_old" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_old" TO "service_role";



GRANT SELECT ON TABLE "core"."user_role" TO "authenticated";












GRANT SELECT,INSERT,UPDATE ON TABLE "external"."fl_parcel_ingest_events" TO "service_role";



GRANT SELECT,INSERT ON TABLE "external"."fl_parcels_raw" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "external_raw_fl"."property_data" TO "service_role";



GRANT ALL ON SEQUENCE "external_raw_fl"."property_data_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policies" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."active_policies" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."active_policies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."active_policies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_analyses" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_analyses" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_analyses" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_conversations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_conversations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_feedback" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_feedback" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_feedback" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cities" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cities" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_communications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_communications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_communications" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_status_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_status_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claim_status_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims_overview" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims_overview" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims_overview" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contractor_license_raw" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contractor_license_raw" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contractor_license_raw" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."counties" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."counties" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."counties" TO "service_role";



GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "service_role";



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



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fdot_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fdot_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fdot_history_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_parcels" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_parcels" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_parcels" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_stage" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_stage" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fdot_stage" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."floir_data" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."floir_data" TO "authenticated";
GRANT ALL ON TABLE "public"."floir_data" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."florida_parcels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."florida_parcels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."florida_parcels_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_counties2" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_counties2" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_counties2" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_column_analysis" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_column_analysis" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_column_analysis" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_staging" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_staging" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_staging" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_summary" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_summary" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."florida_parcels_summary" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."login_activity" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."login_activity" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."login_activity" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."parcel_import_batches" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."parcel_import_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."parcel_import_batches" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."parcels" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."parcels" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."parcels" TO "service_role";



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



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



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



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stg_properties" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stg_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."stg_properties" TO "service_role";



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
