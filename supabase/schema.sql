

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



CREATE TYPE "public"."claim_status" AS ENUM (
    'draft',
    'submitted',
    'acknowledged',
    'investigating',
    'approved',
    'denied',
    'settled',
    'closed',
    'reopened',
    'withdrawn'
);


ALTER TYPE "public"."claim_status" OWNER TO "postgres";


CREATE TYPE "public"."consent_action_type" AS ENUM (
    'accepted',
    'declined',
    'withdrawn',
    'updated'
);


ALTER TYPE "public"."consent_action_type" OWNER TO "postgres";


CREATE TYPE "public"."damage_severity" AS ENUM (
    'minor',
    'moderate',
    'major',
    'severe',
    'total_loss'
);


ALTER TYPE "public"."damage_severity" OWNER TO "postgres";


CREATE TYPE "public"."item_category" AS ENUM (
    'ELECTRONICS',
    'FURNITURE',
    'APPLIANCES',
    'JEWELRY',
    'CLOTHING',
    'TOOLS',
    'SPORTS',
    'COLLECTIBLES',
    'DOCUMENTS',
    'STRUCTURE',
    'SYSTEM',
    'OTHER'
);


ALTER TYPE "public"."item_category" OWNER TO "postgres";


CREATE TYPE "public"."legal_document_type" AS ENUM (
    'privacy_policy',
    'terms_of_service',
    'ai_use_agreement',
    'cookie_policy',
    'data_processing_agreement'
);


ALTER TYPE "public"."legal_document_type" OWNER TO "postgres";


CREATE TYPE "public"."occupancy_status" AS ENUM (
    'owner_occupied',
    'tenant_occupied',
    'vacant',
    'seasonal'
);


ALTER TYPE "public"."occupancy_status" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'single_family',
    'condo',
    'townhouse',
    'mobile_home',
    'multi_family',
    'commercial',
    'vacant_land'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_and_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  history_table TEXT;
  insert_query TEXT;
BEGIN
  history_table := TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME || '_history';
  
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    insert_query := format(
      'INSERT INTO %s SELECT $1.*, NOW() as archived_at, %L as operation',
      history_table,
      TG_OP
    );
    EXECUTE insert_query USING OLD;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$_$;


ALTER FUNCTION "public"."audit_and_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."capture_signup_data"("p_user_id" "uuid", "p_tracking_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert or update user profile with signup tracking data
    INSERT INTO user_profiles (
        user_id,
        signup_ip_address,
        signup_user_agent,
        signup_device_fingerprint,
        signup_referrer,
        signup_landing_page,
        signup_utm_source,
        signup_utm_medium,
        signup_utm_campaign,
        signup_country,
        signup_region,
        signup_city,
        signup_postal_code,
        signup_timezone,
        signup_latitude,
        signup_longitude,
        signup_timestamp
    ) VALUES (
        p_user_id,
        p_tracking_data->>'ip_address',
        p_tracking_data->>'user_agent',
        p_tracking_data->>'device_fingerprint',
        p_tracking_data->>'referrer',
        p_tracking_data->>'landing_page',
        p_tracking_data->>'utm_source',
        p_tracking_data->>'utm_medium',
        p_tracking_data->>'utm_campaign',
        p_tracking_data->>'country',
        p_tracking_data->>'region',
        p_tracking_data->>'city',
        p_tracking_data->>'postal_code',
        p_tracking_data->>'timezone',
        (p_tracking_data->>'latitude')::FLOAT,
        (p_tracking_data->>'longitude')::FLOAT,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        signup_ip_address = EXCLUDED.signup_ip_address,
        signup_user_agent = EXCLUDED.signup_user_agent,
        signup_device_fingerprint = EXCLUDED.signup_device_fingerprint,
        signup_referrer = EXCLUDED.signup_referrer,
        signup_landing_page = EXCLUDED.signup_landing_page,
        signup_utm_source = EXCLUDED.signup_utm_source,
        signup_utm_medium = EXCLUDED.signup_utm_medium,
        signup_utm_campaign = EXCLUDED.signup_utm_campaign,
        signup_country = EXCLUDED.signup_country,
        signup_region = EXCLUDED.signup_region,
        signup_city = EXCLUDED.signup_city,
        signup_postal_code = EXCLUDED.signup_postal_code,
        signup_timezone = EXCLUDED.signup_timezone,
        signup_latitude = EXCLUDED.signup_latitude,
        signup_longitude = EXCLUDED.signup_longitude,
        signup_timestamp = EXCLUDED.signup_timestamp,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."capture_signup_data"("p_user_id" "uuid", "p_tracking_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_consent_status"("p_user_id" "uuid") RETURNS TABLE("document_type" "public"."legal_document_type", "is_accepted" boolean, "accepted_version" character varying, "accepted_at" timestamp with time zone, "needs_update" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH active_docs AS (
        SELECT DISTINCT ON (type) 
            id, type, version
        FROM legal_documents
        WHERE is_active = true AND requires_acceptance = true
        ORDER BY type, effective_date DESC
    ),
    user_consents_latest AS (
        SELECT DISTINCT ON (ld.type)
            ld.type,
            uc.action = 'accepted' AS is_accepted,
            ld.version AS accepted_version,
            uc.consented_at,
            uc.document_id
        FROM user_consents uc
        JOIN legal_documents ld ON ld.id = uc.document_id
        WHERE uc.user_id = p_user_id
            AND uc.is_current = true
        ORDER BY ld.type, uc.consented_at DESC
    )
    SELECT 
        ad.type AS document_type,
        COALESCE(ucl.is_accepted, false) AS is_accepted,
        ucl.accepted_version,
        ucl.consented_at AS accepted_at,
        CASE 
            WHEN ucl.document_id IS NULL THEN true
            WHEN ucl.document_id != ad.id THEN true
            ELSE false
        END AS needs_update
    FROM active_docs ad
    LEFT JOIN user_consents_latest ucl ON ucl.type = ad.type;
END;
$$;


ALTER FUNCTION "public"."get_user_consent_status"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert into profiles table
    INSERT INTO profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into user_profiles table
    INSERT INTO user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert into user_preferences table
    INSERT INTO user_preferences (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create profile with compliance data from user metadata
    INSERT INTO profiles (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        signup_ip_address,
        signup_user_agent,
        signup_device_fingerprint,
        signup_geolocation,
        signup_referrer,
        signup_utm_params,
        signup_timestamp,
        gdpr_consent,
        marketing_consent,
        data_processing_consent
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'firstName',
        NEW.raw_user_meta_data->>'lastName',
        NEW.raw_user_meta_data->>'phone',
        (NEW.raw_user_meta_data->>'signup_ip_address')::inet,
        NEW.raw_user_meta_data->>'signup_user_agent',
        NEW.raw_user_meta_data->>'signup_device_fingerprint',
        NEW.raw_user_meta_data->'signup_geolocation',
        NEW.raw_user_meta_data->>'signup_referrer',
        NEW.raw_user_meta_data->'signup_utm_params',
        NOW(),
        COALESCE((NEW.raw_user_meta_data->>'gdprConsent')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'marketingConsent')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'dataProcessingConsent')::boolean, false)
    );
    
    -- Log signup activity
    INSERT INTO login_activity (
        user_id,
        email,
        success,
        ip_address,
        user_agent,
        device_fingerprint,
        geolocation,
        attempt_type
    ) VALUES (
        NEW.id,
        NEW.email,
        true,
        (NEW.raw_user_meta_data->>'signup_ip_address')::inet,
        NEW.raw_user_meta_data->>'signup_user_agent',
        NEW.raw_user_meta_data->>'signup_device_fingerprint',
        NEW.raw_user_meta_data->'signup_geolocation',
        'signup'
    );
    
    -- Register device
    IF NEW.raw_user_meta_data->>'signup_device_fingerprint' IS NOT NULL THEN
        INSERT INTO user_devices (
            user_id,
            device_fingerprint,
            device_type,
            operating_system,
            browser
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'signup_device_fingerprint',
            CASE 
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%mobile%' THEN 'mobile'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%tablet%' THEN 'tablet'
                ELSE 'desktop'
            END,
            CASE
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%windows%' THEN 'Windows'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%mac%' THEN 'macOS'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%linux%' THEN 'Linux'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%android%' THEN 'Android'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%ios%' THEN 'iOS'
                ELSE 'Unknown'
            END,
            CASE
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%chrome%' THEN 'Chrome'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%firefox%' THEN 'Firefox'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%safari%' THEN 'Safari'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%edge%' THEN 'Edge'
                ELSE 'Unknown'
            END
        ) ON CONFLICT (user_id, device_fingerprint) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_tracking_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO login_activity (
        user_id,
        ip_address,
        user_agent,
        device_fingerprint,
        is_successful,
        failure_reason,
        country,
        region,
        city,
        postal_code,
        timezone,
        latitude,
        longitude
    ) VALUES (
        p_user_id,
        p_tracking_data->>'ip_address',
        p_tracking_data->>'user_agent',
        p_tracking_data->>'device_fingerprint',
        COALESCE((p_tracking_data->>'is_successful')::BOOLEAN, TRUE),
        p_tracking_data->>'failure_reason',
        p_tracking_data->>'country',
        p_tracking_data->>'region',
        p_tracking_data->>'city',
        p_tracking_data->>'postal_code',
        p_tracking_data->>'timezone',
        (p_tracking_data->>'latitude')::FLOAT,
        (p_tracking_data->>'longitude')::FLOAT
    );
END;
$$;


ALTER FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_tracking_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_session_id" "text", "p_activity_type" "text", "p_activity_name" "text", "p_activity_category" "text" DEFAULT NULL::"text", "p_activity_value" "jsonb" DEFAULT NULL::"jsonb", "p_page_url" "text" DEFAULT NULL::"text", "p_page_title" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO public.user_activity_log (
    user_id,
    session_id,
    activity_type,
    activity_name,
    activity_category,
    activity_value,
    page_url,
    page_title
  ) VALUES (
    p_user_id,
    p_session_id,
    p_activity_type,
    p_activity_name,
    p_activity_category,
    p_activity_value,
    p_page_url,
    p_page_title
  )
  RETURNING id INTO v_activity_id;
  
  -- Update last activity timestamp in tracking table
  UPDATE public.user_tracking
  SET last_activity_at = now()
  WHERE user_id = p_user_id AND session_id = p_session_id;
  
  RETURN v_activity_id;
END;
$$;


ALTER FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_session_id" "text", "p_activity_type" "text", "p_activity_name" "text", "p_activity_category" "text", "p_activity_value" "jsonb", "p_page_url" "text", "p_page_title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_user_consent"("p_user_id" "uuid", "p_document_id" "uuid", "p_action" "public"."consent_action_type", "p_ip_address" "inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_device_fingerprint" character varying DEFAULT NULL::character varying, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_consent_id UUID;
    v_document_type legal_document_type;
    v_document_version VARCHAR(20);
BEGIN
    -- Get document info
    SELECT type, version INTO v_document_type, v_document_version
    FROM legal_documents
    WHERE id = p_document_id;
    
    IF v_document_type IS NULL THEN
        RAISE EXCEPTION 'Document not found: %', p_document_id;
    END IF;
    
    -- Start transaction
    BEGIN
        -- Mark previous consents as not current
        UPDATE user_consents
        SET is_current = false
        WHERE user_id = p_user_id
            AND document_id IN (
                SELECT id FROM legal_documents WHERE type = v_document_type
            )
            AND is_current = true;
        
        -- Insert new consent record
        INSERT INTO user_consents (
            user_id, document_id, action, ip_address, 
            user_agent, device_fingerprint, metadata,
            consent_method
        ) VALUES (
            p_user_id, p_document_id, p_action, p_ip_address,
            p_user_agent, p_device_fingerprint, p_metadata,
            COALESCE(p_metadata->>'consent_method', 'manual')
        ) RETURNING id INTO v_consent_id;
        
        -- Update user profile
        UPDATE profiles
        SET 
            last_consent_update = NOW(),
            consent_ip_history = consent_ip_history || 
                jsonb_build_array(jsonb_build_object(
                    'ip', p_ip_address::text,
                    'timestamp', NOW(),
                    'action', p_action::text
                ))
        WHERE user_id = p_user_id;
        
        -- Log to audit
        INSERT INTO consent_audit_log (
            user_id, action, document_type, document_version,
            ip_address, user_agent, new_value
        ) VALUES (
            p_user_id, 
            'consent_' || p_action::text,
            v_document_type,
            v_document_version,
            p_ip_address,
            p_user_agent,
            jsonb_build_object(
                'document_id', p_document_id,
                'action', p_action,
                'metadata', p_metadata
            )
        );
        
        RETURN v_consent_id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$$;


ALTER FUNCTION "public"."record_user_consent"("p_user_id" "uuid", "p_document_id" "uuid", "p_action" "public"."consent_action_type", "p_ip_address" "inet", "p_user_agent" "text", "p_device_fingerprint" character varying, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_user_login"("p_user_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_referrer_url" "text" DEFAULT NULL::"text", "p_utm_source" "text" DEFAULT NULL::"text", "p_utm_medium" "text" DEFAULT NULL::"text", "p_utm_campaign" "text" DEFAULT NULL::"text", "p_login_method" "text" DEFAULT 'email'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_tracking_id uuid;
  v_is_first_login boolean;
BEGIN
  -- Check if this is user's first login
  SELECT NOT EXISTS(
    SELECT 1 FROM public.user_tracking 
    WHERE user_id = p_user_id
  ) INTO v_is_first_login;
  
  -- Insert tracking record
  INSERT INTO public.user_tracking (
    user_id,
    session_id,
    ip_address,
    user_agent,
    referrer_url,
    utm_source,
    utm_medium,
    utm_campaign,
    login_method,
    is_first_login
  ) VALUES (
    p_user_id,
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_referrer_url,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_login_method,
    v_is_first_login
  )
  RETURNING id INTO v_tracking_id;
  
  -- Create user preferences if first login
  IF v_is_first_login THEN
    INSERT INTO public.user_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN v_tracking_id;
END;
$$;


ALTER FUNCTION "public"."track_user_login"("p_user_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_referrer_url" "text", "p_utm_source" "text", "p_utm_medium" "text", "p_utm_campaign" "text", "p_login_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.version IS NOT NULL THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."fl_counties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "fips5" character(5) NOT NULL,
    "county_name" "text" NOT NULL,
    "county_seat" "text",
    "region" "text",
    "time_zone" "text" DEFAULT 'EST'::"text",
    "fema_region" "text" DEFAULT 'Region 4'::"text",
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
    "emergency_mgmt_phone" "text",
    "emergency_mgmt_website" "text",
    "emergency_hotline" "text",
    "building_code_version" "text" DEFAULT '2023 Florida Building Code'::"text",
    "wind_speed_requirement" integer,
    "flood_elevation_requirement" boolean DEFAULT false,
    "impact_glass_required" boolean DEFAULT false,
    "population" integer,
    "households" integer,
    "median_home_value" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."fl_counties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "property_id" "uuid",
    "policy_number" "text" NOT NULL,
    "carrier_name" "text" NOT NULL,
    "carrier_naic" "text",
    "policy_type" "text" DEFAULT 'HO3'::"text",
    "effective_date" "date" NOT NULL,
    "expiration_date" "date" NOT NULL,
    "annual_premium" numeric(10,2),
    "payment_frequency" "text" DEFAULT 'annual'::"text",
    "standard_deductible" numeric(10,2),
    "hurricane_deductible" "text",
    "flood_deductible" numeric(10,2),
    "dwelling_coverage" numeric(12,2),
    "other_structures_coverage" numeric(12,2),
    "personal_property_coverage" numeric(12,2),
    "loss_of_use_coverage" numeric(12,2),
    "liability_coverage" numeric(12,2),
    "medical_payments_coverage" numeric(12,2),
    "special_coverages" "jsonb" DEFAULT '[]'::"jsonb",
    "exclusions" "jsonb" DEFAULT '[]'::"jsonb",
    "endorsements" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "cancellation_date" "date",
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."policies" REPLICA IDENTITY FULL;


ALTER TABLE "public"."policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" DEFAULT 'FL'::"text",
    "zip_code" "text" NOT NULL,
    "county_fips" character(5),
    "property_type" "public"."property_type" DEFAULT 'single_family'::"public"."property_type",
    "occupancy_status" "public"."occupancy_status" DEFAULT 'owner_occupied'::"public"."occupancy_status",
    "year_built" integer,
    "square_footage" integer,
    "lot_size_acres" numeric(10,4),
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "stories" integer DEFAULT 1,
    "garage_spaces" integer DEFAULT 0,
    "pool" boolean DEFAULT false,
    "construction_type" "text",
    "roof_type" "text",
    "roof_year" integer,
    "hvac_year" integer,
    "plumbing_year" integer,
    "electrical_year" integer,
    "purchase_price" numeric(12,2),
    "purchase_date" "date",
    "current_value" numeric(12,2),
    "mortgage_balance" numeric(12,2),
    "coordinates" "public"."geography"(Point,4326),
    "parcel_number" "text",
    "legal_description" "text",
    "flood_zone" "text",
    "wind_zone" "text",
    "evacuation_zone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."properties" REPLICA IDENTITY FULL;


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_policies" AS
 SELECT "p"."id",
    "p"."user_id",
    "p"."property_id",
    "p"."policy_number",
    "p"."carrier_name",
    "p"."carrier_naic",
    "p"."policy_type",
    "p"."effective_date",
    "p"."expiration_date",
    "p"."annual_premium",
    "p"."payment_frequency",
    "p"."standard_deductible",
    "p"."hurricane_deductible",
    "p"."flood_deductible",
    "p"."dwelling_coverage",
    "p"."other_structures_coverage",
    "p"."personal_property_coverage",
    "p"."loss_of_use_coverage",
    "p"."liability_coverage",
    "p"."medical_payments_coverage",
    "p"."special_coverages",
    "p"."exclusions",
    "p"."endorsements",
    "p"."is_active",
    "p"."cancellation_date",
    "p"."cancellation_reason",
    "p"."created_at",
    "p"."updated_at",
    "p"."version",
    "p"."metadata",
    "prop"."address",
    "prop"."city",
    "prop"."zip_code",
    "c"."county_name"
   FROM (("public"."policies" "p"
     JOIN "public"."properties" "prop" ON (("p"."property_id" = "prop"."id")))
     LEFT JOIN "public"."fl_counties" "c" ON (("prop"."county_fips" = "c"."fips5")))
  WHERE (("p"."is_active" = true) AND ("p"."expiration_date" > CURRENT_DATE));


ALTER VIEW "public"."active_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claims" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "property_id" "uuid",
    "policy_id" "uuid",
    "claim_number" "text",
    "external_claim_number" "text",
    "status" "public"."claim_status" DEFAULT 'draft'::"public"."claim_status",
    "date_of_loss" "date" NOT NULL,
    "date_reported" "date" DEFAULT CURRENT_DATE,
    "damage_type" "text" NOT NULL,
    "damage_severity" "public"."damage_severity",
    "description" "text",
    "estimated_value" numeric(12,2),
    "deductible_applied" numeric(12,2),
    "approved_amount" numeric(12,2),
    "settled_value" numeric(12,2),
    "paid_amount" numeric(12,2) DEFAULT 0,
    "adjuster_name" "text",
    "adjuster_phone" "text",
    "adjuster_email" "text",
    "adjuster_company" "text",
    "inspection_date" "date",
    "approval_date" "date",
    "settlement_date" "date",
    "payment_date" "date",
    "closed_date" "date",
    "supporting_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "ai_damage_assessment" "jsonb",
    "ai_coverage_analysis" "jsonb",
    "ai_recommendations" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."claims" REPLICA IDENTITY FULL;


ALTER TABLE "public"."claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claims_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "property_id" "uuid",
    "policy_id" "uuid",
    "claim_number" "text",
    "external_claim_number" "text",
    "status" "public"."claim_status" DEFAULT 'draft'::"public"."claim_status",
    "date_of_loss" "date" NOT NULL,
    "date_reported" "date" DEFAULT CURRENT_DATE,
    "damage_type" "text" NOT NULL,
    "damage_severity" "public"."damage_severity",
    "description" "text",
    "estimated_value" numeric(12,2),
    "deductible_applied" numeric(12,2),
    "approved_amount" numeric(12,2),
    "settled_value" numeric(12,2),
    "paid_amount" numeric(12,2) DEFAULT 0,
    "adjuster_name" "text",
    "adjuster_phone" "text",
    "adjuster_email" "text",
    "adjuster_company" "text",
    "inspection_date" "date",
    "approval_date" "date",
    "settlement_date" "date",
    "payment_date" "date",
    "closed_date" "date",
    "supporting_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "ai_damage_assessment" "jsonb",
    "ai_coverage_analysis" "jsonb",
    "ai_recommendations" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "archived_at" timestamp with time zone DEFAULT "now"(),
    "operation" "text"
);


ALTER TABLE "public"."claims_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."claims_summary" AS
 SELECT "c"."id",
    "c"."user_id",
    "c"."property_id",
    "c"."policy_id",
    "c"."claim_number",
    "c"."external_claim_number",
    "c"."status",
    "c"."date_of_loss",
    "c"."date_reported",
    "c"."damage_type",
    "c"."damage_severity",
    "c"."description",
    "c"."estimated_value",
    "c"."deductible_applied",
    "c"."approved_amount",
    "c"."settled_value",
    "c"."paid_amount",
    "c"."adjuster_name",
    "c"."adjuster_phone",
    "c"."adjuster_email",
    "c"."adjuster_company",
    "c"."inspection_date",
    "c"."approval_date",
    "c"."settlement_date",
    "c"."payment_date",
    "c"."closed_date",
    "c"."supporting_documents",
    "c"."photos",
    "c"."notes",
    "c"."ai_damage_assessment",
    "c"."ai_coverage_analysis",
    "c"."ai_recommendations",
    "c"."created_at",
    "c"."updated_at",
    "c"."version",
    "c"."metadata",
    "p"."policy_number",
    "p"."carrier_name",
    "prop"."address",
    "prop"."city",
    "county"."county_name"
   FROM ((("public"."claims" "c"
     LEFT JOIN "public"."policies" "p" ON (("c"."policy_id" = "p"."id")))
     JOIN "public"."properties" "prop" ON (("c"."property_id" = "prop"."id")))
     LEFT JOIN "public"."fl_counties" "county" ON (("prop"."county_fips" = "county"."fips5")));


ALTER VIEW "public"."claims_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(100) NOT NULL,
    "document_type" "public"."legal_document_type",
    "document_version" character varying(20),
    "old_value" "jsonb",
    "new_value" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."consent_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coverage_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "typical_limit" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."coverage_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "public"."legal_document_type" NOT NULL,
    "version" character varying(20) NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "content" "text" NOT NULL,
    "summary" "text",
    "effective_date" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "is_active" boolean DEFAULT true,
    "requires_acceptance" boolean DEFAULT true,
    "parent_version_id" "uuid",
    "change_summary" "text",
    "storage_url" "text",
    "sha256_hash" character varying(64) NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."legal_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_activity" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "email" character varying(255),
    "success" boolean NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "device_fingerprint" character varying(255),
    "geolocation" "jsonb",
    "error_message" "text",
    "attempt_type" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."login_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_property" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "property_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "category" "public"."item_category" DEFAULT 'OTHER'::"public"."item_category",
    "subcategory" "text",
    "brand" "text",
    "model" "text",
    "serial_number" "text",
    "purchase_price" numeric(10,2),
    "purchase_date" "date",
    "current_value" numeric(10,2),
    "replacement_cost" numeric(10,2),
    "room" "text",
    "location_details" "text",
    "receipt_url" "text",
    "photo_urls" "text"[],
    "manual_url" "text",
    "warranty_info" "jsonb",
    "ai_detected_items" "jsonb",
    "ai_value_estimate" numeric(10,2),
    "ai_category_confidence" numeric(3,2),
    "is_active" boolean DEFAULT true,
    "disposed_date" "date",
    "disposal_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."personal_property" REPLICA IDENTITY FULL;


ALTER TABLE "public"."personal_property" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policies_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "property_id" "uuid",
    "policy_number" "text" NOT NULL,
    "carrier_name" "text" NOT NULL,
    "carrier_naic" "text",
    "policy_type" "text" DEFAULT 'HO3'::"text",
    "effective_date" "date" NOT NULL,
    "expiration_date" "date" NOT NULL,
    "annual_premium" numeric(10,2),
    "payment_frequency" "text" DEFAULT 'annual'::"text",
    "standard_deductible" numeric(10,2),
    "hurricane_deductible" "text",
    "flood_deductible" numeric(10,2),
    "dwelling_coverage" numeric(12,2),
    "other_structures_coverage" numeric(12,2),
    "personal_property_coverage" numeric(12,2),
    "loss_of_use_coverage" numeric(12,2),
    "liability_coverage" numeric(12,2),
    "medical_payments_coverage" numeric(12,2),
    "special_coverages" "jsonb" DEFAULT '[]'::"jsonb",
    "exclusions" "jsonb" DEFAULT '[]'::"jsonb",
    "endorsements" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "cancellation_date" "date",
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "archived_at" timestamp with time zone DEFAULT "now"(),
    "operation" "text"
);


ALTER TABLE "public"."policies_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" character varying(255),
    "full_name" character varying(255),
    "first_name" character varying(100),
    "last_name" character varying(100),
    "phone" character varying(20),
    "avatar_url" "text",
    "signup_ip_address" "inet",
    "signup_user_agent" "text",
    "signup_device_fingerprint" character varying(255),
    "signup_geolocation" "jsonb",
    "signup_referrer" "text",
    "signup_utm_params" "jsonb",
    "signup_timestamp" timestamp with time zone,
    "gdpr_consent" boolean DEFAULT false,
    "marketing_consent" boolean DEFAULT false,
    "data_processing_consent" boolean DEFAULT false,
    "last_consent_update" timestamp with time zone,
    "consent_ip_history" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" DEFAULT 'FL'::"text",
    "zip_code" "text" NOT NULL,
    "county_fips" character(5),
    "property_type" "public"."property_type" DEFAULT 'single_family'::"public"."property_type",
    "occupancy_status" "public"."occupancy_status" DEFAULT 'owner_occupied'::"public"."occupancy_status",
    "year_built" integer,
    "square_footage" integer,
    "lot_size_acres" numeric(10,4),
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "stories" integer DEFAULT 1,
    "garage_spaces" integer DEFAULT 0,
    "pool" boolean DEFAULT false,
    "construction_type" "text",
    "roof_type" "text",
    "roof_year" integer,
    "hvac_year" integer,
    "plumbing_year" integer,
    "electrical_year" integer,
    "purchase_price" numeric(12,2),
    "purchase_date" "date",
    "current_value" numeric(12,2),
    "mortgage_balance" numeric(12,2),
    "coordinates" "public"."geography"(Point,4326),
    "parcel_number" "text",
    "legal_description" "text",
    "flood_zone" "text",
    "wind_zone" "text",
    "evacuation_zone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "archived_at" timestamp with time zone DEFAULT "now"(),
    "operation" "text"
);


ALTER TABLE "public"."properties_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_systems" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid",
    "system_type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "manufacturer" "text",
    "model" "text",
    "serial_number" "text",
    "installation_date" "date",
    "installer_name" "text",
    "installer_phone" "text",
    "warranty_expiration" "date",
    "warranty_provider" "text",
    "warranty_phone" "text",
    "last_service_date" "date",
    "next_service_due" "date",
    "service_interval_months" integer,
    "service_provider" "text",
    "service_phone" "text",
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "condition" "text",
    "estimated_lifespan_years" integer,
    "replacement_cost" numeric(10,2),
    "manual_url" "text",
    "warranty_url" "text",
    "service_records" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."property_systems" REPLICA IDENTITY FULL;


ALTER TABLE "public"."property_systems" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "activity_type" "text" NOT NULL,
    "activity_name" "text" NOT NULL,
    "activity_category" "text",
    "activity_value" "jsonb",
    "page_url" "text",
    "page_title" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_consents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "action" "public"."consent_action_type" NOT NULL,
    "consented_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet" NOT NULL,
    "user_agent" "text",
    "device_fingerprint" character varying(255),
    "geolocation" "jsonb",
    "session_id" character varying(255),
    "consent_method" character varying(50) NOT NULL,
    "is_current" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "referrer_url" "text",
    "page_url" "text",
    "consent_flow" character varying(50)
);


ALTER TABLE "public"."user_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_devices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_fingerprint" character varying(255) NOT NULL,
    "device_name" character varying(100),
    "device_type" character varying(50),
    "operating_system" character varying(50),
    "browser" character varying(50),
    "first_seen" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "is_trusted" boolean DEFAULT false,
    "is_blocked" boolean DEFAULT false,
    "trust_score" integer DEFAULT 50,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "user_devices_trust_score_check" CHECK ((("trust_score" >= 0) AND ("trust_score" <= 100)))
);


ALTER TABLE "public"."user_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_current_step" "text",
    "onboarding_skipped_at" timestamp with time zone,
    "has_primary_property" boolean DEFAULT false,
    "property_setup_completed" boolean DEFAULT false,
    "has_insurance_policy" boolean DEFAULT false,
    "insurance_setup_completed" boolean DEFAULT false,
    "preferred_theme" "text" DEFAULT 'dark'::"text",
    "email_notifications" boolean DEFAULT true,
    "sms_notifications" boolean DEFAULT false,
    "push_notifications" boolean DEFAULT true,
    "ai_features_enabled" boolean DEFAULT true,
    "preferred_ai_model" "text" DEFAULT 'openai'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "signup_ip_address" "text",
    "signup_user_agent" "text",
    "signup_device_fingerprint" "text",
    "signup_referrer" "text",
    "signup_landing_page" "text",
    "signup_utm_source" "text",
    "signup_utm_medium" "text",
    "signup_utm_campaign" "text",
    "signup_country" "text",
    "signup_region" "text",
    "signup_city" "text",
    "signup_postal_code" "text",
    "signup_timezone" "text",
    "signup_latitude" double precision,
    "signup_longitude" double precision,
    "signup_timestamp" timestamp with time zone
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" character varying(255) NOT NULL,
    "ip_address" "inet" NOT NULL,
    "user_agent" "text",
    "device_fingerprint" character varying(255),
    "geolocation" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "logout_at" timestamp with time zone,
    "logout_reason" character varying(50),
    "risk_score" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "user_sessions_risk_score_check" CHECK ((("risk_score" >= 0) AND ("risk_score" <= 100)))
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text" NOT NULL,
    "ip_address" "inet",
    "ip_country" "text",
    "ip_region" "text",
    "ip_city" "text",
    "ip_timezone" "text",
    "user_agent" "text",
    "device_type" "text",
    "device_name" "text",
    "browser_name" "text",
    "browser_version" "text",
    "os_name" "text",
    "os_version" "text",
    "referrer_url" "text",
    "referrer_domain" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_term" "text",
    "utm_content" "text",
    "landing_page" "text",
    "login_method" "text",
    "is_first_login" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_activity_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_tracking" OWNER TO "postgres";


ALTER TABLE ONLY "public"."claims_history"
    ADD CONSTRAINT "claims_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_audit_log"
    ADD CONSTRAINT "consent_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coverage_types"
    ADD CONSTRAINT "coverage_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coverage_types"
    ADD CONSTRAINT "coverage_types_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_county_name_key" UNIQUE ("county_name");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_fips5_key" UNIQUE ("fips5");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_property"
    ADD CONSTRAINT "personal_property_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policies_history"
    ADD CONSTRAINT "policies_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."properties_history"
    ADD CONSTRAINT "properties_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_systems"
    ADD CONSTRAINT "property_systems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "unique_active_document_type" EXCLUDE USING "btree" ("type" WITH =) WHERE (("is_active" = true));



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "unique_document_version" UNIQUE ("type", "version");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "unique_user_device" UNIQUE ("user_id", "device_fingerprint");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."user_tracking"
    ADD CONSTRAINT "user_tracking_pkey" PRIMARY KEY ("id");



CREATE INDEX "claims_history_date_of_loss_idx" ON "public"."claims_history" USING "btree" ("date_of_loss");



CREATE INDEX "claims_history_policy_id_idx" ON "public"."claims_history" USING "btree" ("policy_id");



CREATE INDEX "claims_history_property_id_idx" ON "public"."claims_history" USING "btree" ("property_id");



CREATE INDEX "claims_history_status_idx" ON "public"."claims_history" USING "btree" ("status");



CREATE INDEX "claims_history_user_id_idx" ON "public"."claims_history" USING "btree" ("user_id");



CREATE INDEX "idx_claims_date_of_loss" ON "public"."claims" USING "btree" ("date_of_loss");



CREATE INDEX "idx_claims_policy_id" ON "public"."claims" USING "btree" ("policy_id");



CREATE INDEX "idx_claims_property_id" ON "public"."claims" USING "btree" ("property_id");



CREATE INDEX "idx_claims_status" ON "public"."claims" USING "btree" ("status");



CREATE INDEX "idx_claims_user_id" ON "public"."claims" USING "btree" ("user_id");



CREATE INDEX "idx_consent_audit_action" ON "public"."consent_audit_log" USING "btree" ("action");



CREATE INDEX "idx_consent_audit_created" ON "public"."consent_audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_consent_audit_log_user_id" ON "public"."consent_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_consent_audit_user" ON "public"."consent_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_legal_documents_active" ON "public"."legal_documents" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_legal_documents_effective_date" ON "public"."legal_documents" USING "btree" ("effective_date");



CREATE INDEX "idx_legal_documents_parent" ON "public"."legal_documents" USING "btree" ("parent_version_id");



CREATE INDEX "idx_legal_documents_slug" ON "public"."legal_documents" USING "btree" ("slug");



CREATE INDEX "idx_legal_documents_type" ON "public"."legal_documents" USING "btree" ("type");



CREATE INDEX "idx_login_activity_created" ON "public"."login_activity" USING "btree" ("created_at");



CREATE INDEX "idx_login_activity_email" ON "public"."login_activity" USING "btree" ("email");



CREATE INDEX "idx_login_activity_ip" ON "public"."login_activity" USING "btree" ("ip_address");



CREATE INDEX "idx_login_activity_success" ON "public"."login_activity" USING "btree" ("success");



CREATE INDEX "idx_login_activity_user" ON "public"."login_activity" USING "btree" ("user_id");



CREATE INDEX "idx_login_activity_user_id" ON "public"."login_activity" USING "btree" ("user_id");



CREATE INDEX "idx_personal_property_category" ON "public"."personal_property" USING "btree" ("category");



CREATE INDEX "idx_personal_property_property_id" ON "public"."personal_property" USING "btree" ("property_id");



CREATE INDEX "idx_personal_property_user_id" ON "public"."personal_property" USING "btree" ("user_id");



CREATE INDEX "idx_policies_active" ON "public"."policies" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_policies_expiration" ON "public"."policies" USING "btree" ("expiration_date");



CREATE INDEX "idx_policies_property_id" ON "public"."policies" USING "btree" ("property_id");



CREATE INDEX "idx_policies_user_id" ON "public"."policies" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_active" ON "public"."profiles" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at");



CREATE INDEX "idx_profiles_device_fingerprint" ON "public"."profiles" USING "btree" ("signup_device_fingerprint");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_profiles_signup_ip" ON "public"."profiles" USING "btree" ("signup_ip_address");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_properties_coordinates" ON "public"."properties" USING "gist" ("coordinates");



CREATE INDEX "idx_properties_county" ON "public"."properties" USING "btree" ("county_fips");



CREATE INDEX "idx_properties_user_id" ON "public"."properties" USING "btree" ("user_id");



CREATE INDEX "idx_property_systems_property_id" ON "public"."property_systems" USING "btree" ("property_id");



CREATE INDEX "idx_property_systems_type" ON "public"."property_systems" USING "btree" ("system_type");



CREATE INDEX "idx_user_activity_log_activity_type" ON "public"."user_activity_log" USING "btree" ("activity_type");



CREATE INDEX "idx_user_activity_log_created_at" ON "public"."user_activity_log" USING "btree" ("created_at");



CREATE INDEX "idx_user_activity_log_session_id" ON "public"."user_activity_log" USING "btree" ("session_id");



CREATE INDEX "idx_user_activity_log_user_id" ON "public"."user_activity_log" USING "btree" ("user_id");



CREATE INDEX "idx_user_consents_action" ON "public"."user_consents" USING "btree" ("action");



CREATE INDEX "idx_user_consents_consented_at" ON "public"."user_consents" USING "btree" ("consented_at");



CREATE INDEX "idx_user_consents_current" ON "public"."user_consents" USING "btree" ("user_id", "is_current") WHERE ("is_current" = true);



CREATE INDEX "idx_user_consents_document_id" ON "public"."user_consents" USING "btree" ("document_id");



CREATE INDEX "idx_user_consents_user_id" ON "public"."user_consents" USING "btree" ("user_id");



CREATE INDEX "idx_user_devices_blocked" ON "public"."user_devices" USING "btree" ("is_blocked") WHERE ("is_blocked" = true);



CREATE INDEX "idx_user_devices_fingerprint" ON "public"."user_devices" USING "btree" ("device_fingerprint");



CREATE INDEX "idx_user_devices_last_seen" ON "public"."user_devices" USING "btree" ("last_seen");



CREATE INDEX "idx_user_devices_trusted" ON "public"."user_devices" USING "btree" ("is_trusted") WHERE ("is_trusted" = true);



CREATE INDEX "idx_user_devices_user" ON "public"."user_devices" USING "btree" ("user_id");



CREATE INDEX "idx_user_preferences_user_id" ON "public"."user_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_sessions_active" ON "public"."user_sessions" USING "btree" ("is_active", "expires_at") WHERE ("is_active" = true);



CREATE INDEX "idx_user_sessions_created_at" ON "public"."user_sessions" USING "btree" ("created_at");



CREATE INDEX "idx_user_sessions_ip" ON "public"."user_sessions" USING "btree" ("ip_address");



CREATE INDEX "idx_user_sessions_token" ON "public"."user_sessions" USING "btree" ("session_token");



CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_user_tracking_created_at" ON "public"."user_tracking" USING "btree" ("created_at");



CREATE INDEX "idx_user_tracking_ip_address" ON "public"."user_tracking" USING "btree" ("ip_address");



CREATE INDEX "idx_user_tracking_session_id" ON "public"."user_tracking" USING "btree" ("session_id");



CREATE INDEX "idx_user_tracking_user_id" ON "public"."user_tracking" USING "btree" ("user_id");



CREATE INDEX "policies_history_expiration_date_idx" ON "public"."policies_history" USING "btree" ("expiration_date");



CREATE INDEX "policies_history_is_active_idx" ON "public"."policies_history" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "policies_history_property_id_idx" ON "public"."policies_history" USING "btree" ("property_id");



CREATE INDEX "policies_history_user_id_idx" ON "public"."policies_history" USING "btree" ("user_id");



CREATE INDEX "properties_history_coordinates_idx" ON "public"."properties_history" USING "gist" ("coordinates");



CREATE INDEX "properties_history_county_fips_idx" ON "public"."properties_history" USING "btree" ("county_fips");



CREATE INDEX "properties_history_user_id_idx" ON "public"."properties_history" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "claims_audit_trigger" AFTER DELETE OR UPDATE ON "public"."claims" FOR EACH ROW EXECUTE FUNCTION "public"."audit_and_version"();



CREATE OR REPLACE TRIGGER "policies_audit_trigger" AFTER DELETE OR UPDATE ON "public"."policies" FOR EACH ROW EXECUTE FUNCTION "public"."audit_and_version"();



CREATE OR REPLACE TRIGGER "properties_audit_trigger" AFTER DELETE OR UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."audit_and_version"();



CREATE OR REPLACE TRIGGER "update_claims_timestamp" BEFORE UPDATE ON "public"."claims" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "update_coverage_types_timestamp" BEFORE UPDATE ON "public"."coverage_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "update_fl_counties_timestamp" BEFORE UPDATE ON "public"."fl_counties" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "update_legal_documents_updated_at" BEFORE UPDATE ON "public"."legal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_personal_property_timestamp" BEFORE UPDATE ON "public"."personal_property" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "update_policies_timestamp" BEFORE UPDATE ON "public"."policies" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_timestamp" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "update_property_systems_timestamp" BEFORE UPDATE ON "public"."property_systems" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_audit_log"
    ADD CONSTRAINT "consent_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "public"."legal_documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_property"
    ADD CONSTRAINT "personal_property_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_property"
    ADD CONSTRAINT "personal_property_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_county_fips_fkey" FOREIGN KEY ("county_fips") REFERENCES "public"."fl_counties"("fips5");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_systems"
    ADD CONSTRAINT "property_systems_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."legal_documents"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tracking"
    ADD CONSTRAINT "user_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view active legal documents" ON "public"."legal_documents" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Only admins can manage legal documents" ON "public"."legal_documents" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Profiles are viewable by owner" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Service role can insert consent logs" ON "public"."consent_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can insert login activity" ON "public"."login_activity" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create own consent records" ON "public"."user_consents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own activity" ON "public"."user_activity_log" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own devices" ON "public"."user_devices" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own audit logs" ON "public"."consent_audit_log" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own consent history" ON "public"."consent_audit_log" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own consent records" ON "public"."user_consents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own devices" ON "public"."user_devices" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own login history" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own sessions" ON "public"."user_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own activity" ON "public"."user_activity_log" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tracking data" ON "public"."user_tracking" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "claims_user_all" ON "public"."claims" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."consent_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coverage_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coverage_types_read_all" ON "public"."coverage_types" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."fl_counties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fl_counties_read_all" ON "public"."fl_counties" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."legal_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_property" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "personal_property_user_all" ON "public"."personal_property" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."policies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "policies_user_all" ON "public"."policies" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "properties_user_all" ON "public"."properties" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."property_systems" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "property_systems_user_all" ON "public"."property_systems" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_systems"."property_id") AND ("properties"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_systems"."property_id") AND ("properties"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."user_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tracking" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_and_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_and_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_and_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."capture_signup_data"("p_user_id" "uuid", "p_tracking_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."capture_signup_data"("p_user_id" "uuid", "p_tracking_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."capture_signup_data"("p_user_id" "uuid", "p_tracking_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_consent_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_consent_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_consent_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_tracking_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_tracking_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_tracking_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_session_id" "text", "p_activity_type" "text", "p_activity_name" "text", "p_activity_category" "text", "p_activity_value" "jsonb", "p_page_url" "text", "p_page_title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_session_id" "text", "p_activity_type" "text", "p_activity_name" "text", "p_activity_category" "text", "p_activity_value" "jsonb", "p_page_url" "text", "p_page_title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_session_id" "text", "p_activity_type" "text", "p_activity_name" "text", "p_activity_category" "text", "p_activity_value" "jsonb", "p_page_url" "text", "p_page_title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_user_consent"("p_user_id" "uuid", "p_document_id" "uuid", "p_action" "public"."consent_action_type", "p_ip_address" "inet", "p_user_agent" "text", "p_device_fingerprint" character varying, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_user_consent"("p_user_id" "uuid", "p_document_id" "uuid", "p_action" "public"."consent_action_type", "p_ip_address" "inet", "p_user_agent" "text", "p_device_fingerprint" character varying, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_user_consent"("p_user_id" "uuid", "p_document_id" "uuid", "p_action" "public"."consent_action_type", "p_ip_address" "inet", "p_user_agent" "text", "p_device_fingerprint" character varying, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_user_login"("p_user_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_referrer_url" "text", "p_utm_source" "text", "p_utm_medium" "text", "p_utm_campaign" "text", "p_login_method" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_user_login"("p_user_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_referrer_url" "text", "p_utm_source" "text", "p_utm_medium" "text", "p_utm_campaign" "text", "p_login_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_user_login"("p_user_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_referrer_url" "text", "p_utm_source" "text", "p_utm_medium" "text", "p_utm_campaign" "text", "p_login_method" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fl_counties" TO "anon";
GRANT ALL ON TABLE "public"."fl_counties" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fl_counties" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policies" TO "anon";
GRANT ALL ON TABLE "public"."policies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."active_policies" TO "anon";
GRANT ALL ON TABLE "public"."active_policies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."active_policies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims" TO "anon";
GRANT ALL ON TABLE "public"."claims" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims_history" TO "anon";
GRANT ALL ON TABLE "public"."claims_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims_summary" TO "anon";
GRANT ALL ON TABLE "public"."claims_summary" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."claims_summary" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."consent_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."consent_audit_log" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."consent_audit_log" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."coverage_types" TO "anon";
GRANT ALL ON TABLE "public"."coverage_types" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."coverage_types" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."legal_documents" TO "anon";
GRANT ALL ON TABLE "public"."legal_documents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."legal_documents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."login_activity" TO "anon";
GRANT ALL ON TABLE "public"."login_activity" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."login_activity" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."personal_property" TO "anon";
GRANT ALL ON TABLE "public"."personal_property" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."personal_property" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policies_history" TO "anon";
GRANT ALL ON TABLE "public"."policies_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policies_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_history" TO "anon";
GRANT ALL ON TABLE "public"."properties_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."properties_history" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_systems" TO "anon";
GRANT ALL ON TABLE "public"."property_systems" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."property_systems" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_log" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_activity_log" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_consents" TO "anon";
GRANT ALL ON TABLE "public"."user_consents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_consents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_devices" TO "anon";
GRANT ALL ON TABLE "public"."user_devices" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_devices" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_preferences" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_sessions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_tracking" TO "anon";
GRANT ALL ON TABLE "public"."user_tracking" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_tracking" TO "service_role";



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
