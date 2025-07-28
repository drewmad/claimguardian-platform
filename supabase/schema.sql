

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


CREATE TYPE "public"."occupancy_status" AS ENUM (
    'owner_occupied',
    'tenant_occupied',
    'vacant',
    'seasonal'
);


ALTER TYPE "public"."occupancy_status" OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."fdot_stage_insert_one"("j" "json") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO fdot_stage (feature) VALUES (j::JSONB);
END;
$$;


ALTER FUNCTION "public"."fdot_stage_insert_one"("j" "json") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_parcel_stats"() RETURNS "json"
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


CREATE OR REPLACE FUNCTION "public"."get_raw_data_counts_by_source"() RETURNS "json"
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


CREATE OR REPLACE FUNCTION "public"."queue_county_scraping"() RETURNS "json"
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



CREATE OR REPLACE FUNCTION "public"."update_document_extractions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_document_extractions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


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
    CONSTRAINT "valid_florida_bbox" CHECK ((("location" IS NULL) OR ((("public"."st_x"("location") >= ('-87.634896'::numeric)::double precision) AND ("public"."st_x"("location") <= ('-79.974306'::numeric)::double precision)) AND (("public"."st_y"("location") >= (24.396308)::double precision) AND ("public"."st_y"("location") <= (31.000888)::double precision))))),
    CONSTRAINT "valid_square_feet" CHECK (("square_feet" > 0)),
    CONSTRAINT "valid_year" CHECK ((("year_built" >= 1800) AND (("year_built")::numeric <= EXTRACT(year FROM CURRENT_DATE))))
);


ALTER TABLE "public"."properties_old" OWNER TO "postgres";


COMMENT ON COLUMN "public"."properties_old"."value" IS 'Estimated property value in USD';



COMMENT ON COLUMN "public"."properties_old"."insurability_score" IS 'Property insurability score (0-100)';



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


ALTER TABLE "public"."active_policies" OWNER TO "postgres";


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


ALTER TABLE "public"."cities_id_seq" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"()
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


ALTER TABLE "public"."claims_overview" OWNER TO "postgres";


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


ALTER TABLE "public"."counties_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."counties_id_seq" OWNED BY "public"."counties"."id";



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


ALTER TABLE "public"."fdot_history_id_seq" OWNER TO "postgres";


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


ALTER TABLE "public"."fdot_stage_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fdot_stage_id_seq" OWNED BY "public"."fdot_stage"."id";



CREATE TABLE IF NOT EXISTS "public"."florida_parcels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "objectid" bigint,
    "parcel_id" character varying(30),
    "co_no" integer,
    "asmnt_yr" integer,
    "jv" numeric,
    "av_sd" numeric,
    "av_nsd" numeric,
    "tv_sd" numeric,
    "tv_nsd" numeric,
    "dor_uc" character varying(4),
    "pa_uc" character varying(2),
    "land_val" numeric,
    "bldg_val" numeric,
    "tot_val" numeric,
    "act_yr_blt" integer,
    "eff_yr_blt" integer,
    "tot_lvg_ar" numeric,
    "land_sqfoot" numeric,
    "no_buldng" integer,
    "no_res_unt" integer,
    "own_name" character varying(255),
    "own_addr1" character varying(255),
    "own_addr2" character varying(255),
    "own_city" character varying(255),
    "own_state" character varying(50),
    "own_zipcd" character varying(10),
    "phy_addr1" character varying(255),
    "phy_addr2" character varying(255),
    "phy_city" character varying(255),
    "phy_zipcd" character varying(10),
    "s_legal" "text",
    "twn" character varying(3),
    "rng" character varying(3),
    "sec" character varying(3),
    "sale_prc1" numeric,
    "sale_yr1" integer,
    "sale_mo1" character varying(2),
    "sale_prc2" numeric,
    "sale_yr2" integer,
    "sale_mo2" character varying(2),
    "nbrhd_cd" character varying(10),
    "census_bk" character varying(16),
    "mkt_ar" character varying(3),
    "geom" "public"."geometry"(MultiPolygon,4326),
    "raw_data" "jsonb",
    "data_source" character varying(50) DEFAULT 'FDOR_2025'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."florida_parcels" OWNER TO "postgres";


COMMENT ON TABLE "public"."florida_parcels" IS 'Florida statewide cadastral parcel data from Department of Revenue';



COMMENT ON COLUMN "public"."florida_parcels"."co_no" IS 'County FIPS code (e.g., 15 for Charlotte)';



COMMENT ON COLUMN "public"."florida_parcels"."jv" IS 'Just Value - market value assessment';



COMMENT ON COLUMN "public"."florida_parcels"."dor_uc" IS 'Department of Revenue Use Code';



COMMENT ON COLUMN "public"."florida_parcels"."tot_lvg_ar" IS 'Total Living Area in square feet';



CREATE OR REPLACE VIEW "public"."florida_parcels_summary" AS
 SELECT "florida_parcels"."co_no",
    "public"."get_county_name"("florida_parcels"."co_no") AS "county_name",
    "count"(*) AS "parcel_count",
    "sum"("florida_parcels"."jv") AS "total_just_value",
    "avg"("florida_parcels"."jv") AS "avg_just_value",
    "count"(DISTINCT "florida_parcels"."own_name") AS "unique_owners"
   FROM "public"."florida_parcels"
  GROUP BY "florida_parcels"."co_no"
  ORDER BY "florida_parcels"."co_no";


ALTER TABLE "public"."florida_parcels_summary" OWNER TO "postgres";


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


ALTER TABLE "public"."policy_clauses" OWNER TO "postgres";


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
 SELECT "user_profiles"."id",
    "user_profiles"."first_name",
    "user_profiles"."last_name",
    "user_profiles"."phone",
    "user_profiles"."avatar_url",
    "user_profiles"."member_since" AS "created_at",
    "user_profiles"."member_since" AS "updated_at"
   FROM "public"."user_profiles";


ALTER TABLE "public"."profiles" OWNER TO "postgres";


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
    "version" integer DEFAULT 1
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
 SELECT "la"."id",
    "la"."user_id",
    "la"."ip_address",
    "la"."user_agent",
    "la"."device_type",
    "la"."browser",
    "la"."os",
    "la"."location_city",
    "la"."location_country",
    "la"."location_region",
    "la"."success",
    "la"."failure_reason",
    "la"."created_at",
    "count"(*) OVER (PARTITION BY "la"."user_id") AS "total_logins",
    "count"(*) FILTER (WHERE ("la"."success" = false)) OVER (PARTITION BY "la"."user_id") AS "failed_attempts"
   FROM "public"."login_activity" "la"
  WHERE ("la"."created_at" > ("now"() - '30 days'::interval));


ALTER TABLE "public"."recent_login_activity" OWNER TO "postgres";


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


ALTER TABLE "public"."states_id_seq" OWNER TO "postgres";


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


ALTER TABLE "public"."zip_codes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."zip_codes_id_seq" OWNED BY "public"."zip_codes"."id";



ALTER TABLE ONLY "public"."cities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."counties" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."counties_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fdot_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fdot_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fdot_stage" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fdot_stage_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."states" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."states_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."zip_codes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."zip_codes_id_seq"'::"regclass");



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



ALTER TABLE ONLY "public"."debug_user_creation_logs"
    ADD CONSTRAINT "debug_user_creation_logs_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."florida_parcels"
    ADD CONSTRAINT "unique_parcel_county" UNIQUE ("parcel_id", "co_no");



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



CREATE INDEX "idx_claim_communications_claim_id" ON "public"."claim_communications" USING "btree" ("claim_id");



CREATE INDEX "idx_claim_status_history_claim_id" ON "public"."claim_status_history" USING "btree" ("claim_id");



CREATE INDEX "idx_claims_claim_number" ON "public"."claims" USING "btree" ("claim_number");



CREATE INDEX "idx_claims_date_of_loss" ON "public"."claims" USING "btree" ("date_of_loss");



CREATE INDEX "idx_claims_policy_id" ON "public"."claims" USING "btree" ("policy_id");



CREATE INDEX "idx_claims_property_id" ON "public"."claims" USING "btree" ("property_id");



CREATE INDEX "idx_claims_status" ON "public"."claims" USING "btree" ("status");



CREATE INDEX "idx_claims_user_id" ON "public"."claims" USING "btree" ("user_id");



CREATE INDEX "idx_counties_fips" ON "public"."counties" USING "btree" ("fips_code");



CREATE INDEX "idx_counties_state_id" ON "public"."counties" USING "btree" ("state_id");



CREATE INDEX "idx_document_extractions_confidence" ON "public"."document_extractions" USING "btree" ("confidence_score" DESC);



CREATE INDEX "idx_document_extractions_created_at" ON "public"."document_extractions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_document_extractions_document_id" ON "public"."document_extractions" USING "btree" ("document_id");



CREATE INDEX "idx_document_extractions_processed_by" ON "public"."document_extractions" USING "btree" ("processed_by");



CREATE INDEX "idx_document_extractions_property_id" ON "public"."document_extractions" USING "btree" ("property_id");



CREATE INDEX "idx_document_extractions_status" ON "public"."document_extractions" USING "btree" ("processing_status");



CREATE INDEX "idx_fdot_parcels_geom" ON "public"."fdot_parcels" USING "gist" ("geom");



CREATE INDEX "idx_fdot_stage_geom" ON "public"."fdot_stage" USING "gist" ("geom");



CREATE INDEX "idx_florida_parcels_co_no" ON "public"."florida_parcels" USING "btree" ("co_no");



CREATE INDEX "idx_florida_parcels_dor_uc" ON "public"."florida_parcels" USING "btree" ("dor_uc");



CREATE INDEX "idx_florida_parcels_geom" ON "public"."florida_parcels" USING "gist" ("geom");



CREATE INDEX "idx_florida_parcels_jv" ON "public"."florida_parcels" USING "btree" ("jv");



CREATE INDEX "idx_florida_parcels_owner_name" ON "public"."florida_parcels" USING "btree" ("own_name");



CREATE INDEX "idx_florida_parcels_parcel_id" ON "public"."florida_parcels" USING "btree" ("parcel_id");



CREATE INDEX "idx_florida_parcels_phy_city" ON "public"."florida_parcels" USING "btree" ("phy_city");



CREATE INDEX "idx_florida_parcels_phy_zipcd" ON "public"."florida_parcels" USING "btree" ("phy_zipcd");



CREATE INDEX "idx_florida_parcels_sale_yr1" ON "public"."florida_parcels" USING "btree" ("sale_yr1");



CREATE INDEX "idx_legal_documents_effective_date" ON "public"."legal_documents" USING "btree" ("effective_date" DESC);



CREATE INDEX "idx_legal_documents_slug_active" ON "public"."legal_documents" USING "btree" ("slug", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_login_activity_created_at" ON "public"."login_activity" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_login_activity_user_created" ON "public"."login_activity" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_login_activity_user_id" ON "public"."login_activity" USING "btree" ("user_id");



CREATE INDEX "idx_parcels_geom" ON "public"."parcels" USING "gist" ("geom");



CREATE UNIQUE INDEX "idx_parcels_parcel_id_source" ON "public"."parcels" USING "btree" ("parcel_id", "source");



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



CREATE INDEX "idx_properties_location" ON "public"."properties_old" USING "gist" ("location");



CREATE INDEX "idx_properties_postal_code" ON "public"."properties_old" USING "btree" ("postal_code");



CREATE INDEX "idx_properties_street_address" ON "public"."properties_old" USING "btree" ("street_address");



CREATE INDEX "idx_properties_user" ON "public"."properties_old" USING "btree" ("user_id");



CREATE INDEX "idx_properties_user_id" ON "public"."properties" USING "btree" ("user_id");



CREATE INDEX "idx_property_contractors_property" ON "public"."property_contractors" USING "btree" ("property_id");



CREATE INDEX "idx_property_damage_property" ON "public"."property_damage" USING "btree" ("property_id");



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



CREATE OR REPLACE TRIGGER "on_parcels_update" BEFORE UPDATE ON "public"."parcels" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "on_profile_updated" AFTER UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_profile_update"();



COMMENT ON TRIGGER "on_profile_updated" ON "public"."user_profiles" IS 'Syncs user profile changes back to auth.users metadata';



CREATE OR REPLACE TRIGGER "on_scraper_request" AFTER INSERT OR UPDATE ON "public"."scraper_queue" FOR EACH ROW EXECUTE FUNCTION "public"."notify_scraper_webhook"();



CREATE OR REPLACE TRIGGER "trigger_prevent_backdating" BEFORE INSERT OR UPDATE ON "public"."legal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_backdating"();



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



ALTER TABLE ONLY "public"."document_extractions"
    ADD CONSTRAINT "document_extractions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."policy_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_extractions"
    ADD CONSTRAINT "document_extractions_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_extractions"
    ADD CONSTRAINT "document_extractions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_old"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."properties_old"
    ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



CREATE POLICY "Allow public read-only access to parcels" ON "public"."parcels" FOR SELECT USING (true);



CREATE POLICY "Allow service_role full access to parcels" ON "public"."parcels" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Allow service_role full access to scraper_runs" ON "public"."scraper_runs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Anon users can insert scraper logs" ON "public"."scraper_logs" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anon users can read scraper logs" ON "public"."scraper_logs" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Authenticated users full access" ON "public"."scraper_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Legal documents are viewable by everyone" ON "public"."legal_documents" FOR SELECT USING (true);



CREATE POLICY "Public read access to cities" ON "public"."cities" FOR SELECT USING (true);



CREATE POLICY "Public read access to counties" ON "public"."counties" FOR SELECT USING (true);



CREATE POLICY "Public read access to florida parcels" ON "public"."florida_parcels" FOR SELECT USING (true);



CREATE POLICY "Public read access to states" ON "public"."states" FOR SELECT USING (true);



CREATE POLICY "Public read access to zip codes" ON "public"."zip_codes" FOR SELECT USING (true);



CREATE POLICY "Security questions are viewable by everyone" ON "public"."security_questions" FOR SELECT USING (true);



CREATE POLICY "Service role can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can insert security logs" ON "public"."security_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can manage scraper queue" ON "public"."scraper_queue" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."scraper_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to florida parcels" ON "public"."florida_parcels" TO "service_role" USING (true) WITH CHECK (true);



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



CREATE POLICY "Users can view their own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own claims" ON "public"."claims" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own documents" ON "public"."policy_documents" FOR SELECT USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own extractions" ON "public"."document_extractions" FOR SELECT USING (("processed_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_communications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."counties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_extractions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."florida_parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties_old" ENABLE ROW LEVEL SECURITY;


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


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "anon";
GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" "json") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "service_role";



GRANT ALL ON TABLE "public"."legal_documents" TO "anon";
GRANT ALL ON TABLE "public"."legal_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_documents" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_county_name"("fips_code" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_county_name"("fips_code" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_county_name"("fips_code" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_claim_details"("p_claim_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_claim_details"("p_claim_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_claim_details"("p_claim_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_raw_data_counts_by_source"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_extractions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_extractions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_extractions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."properties_old" TO "anon";
GRANT ALL ON TABLE "public"."properties_old" TO "authenticated";
GRANT ALL ON TABLE "public"."properties_old" TO "service_role";



GRANT ALL ON TABLE "public"."policies" TO "anon";
GRANT ALL ON TABLE "public"."policies" TO "authenticated";
GRANT ALL ON TABLE "public"."policies" TO "service_role";



GRANT ALL ON TABLE "public"."active_policies" TO "anon";
GRANT ALL ON TABLE "public"."active_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."active_policies" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."cities" TO "anon";
GRANT ALL ON TABLE "public"."cities" TO "authenticated";
GRANT ALL ON TABLE "public"."cities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."claim_communications" TO "anon";
GRANT ALL ON TABLE "public"."claim_communications" TO "authenticated";
GRANT ALL ON TABLE "public"."claim_communications" TO "service_role";



GRANT ALL ON TABLE "public"."claim_status_history" TO "anon";
GRANT ALL ON TABLE "public"."claim_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."claim_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."claims" TO "anon";
GRANT ALL ON TABLE "public"."claims" TO "authenticated";
GRANT ALL ON TABLE "public"."claims" TO "service_role";



GRANT ALL ON TABLE "public"."claims_overview" TO "anon";
GRANT ALL ON TABLE "public"."claims_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."claims_overview" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_license_raw" TO "anon";
GRANT ALL ON TABLE "public"."contractor_license_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_license_raw" TO "service_role";



GRANT ALL ON TABLE "public"."counties" TO "anon";
GRANT ALL ON TABLE "public"."counties" TO "authenticated";
GRANT ALL ON TABLE "public"."counties" TO "service_role";



GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."counties_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."debug_user_creation_logs" TO "anon";
GRANT ALL ON TABLE "public"."debug_user_creation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."debug_user_creation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."document_extractions" TO "anon";
GRANT ALL ON TABLE "public"."document_extractions" TO "authenticated";
GRANT ALL ON TABLE "public"."document_extractions" TO "service_role";



GRANT ALL ON TABLE "public"."fdot_history" TO "anon";
GRANT ALL ON TABLE "public"."fdot_history" TO "authenticated";
GRANT ALL ON TABLE "public"."fdot_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fdot_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fdot_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fdot_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fdot_parcels" TO "anon";
GRANT ALL ON TABLE "public"."fdot_parcels" TO "authenticated";
GRANT ALL ON TABLE "public"."fdot_parcels" TO "service_role";



GRANT ALL ON TABLE "public"."fdot_stage" TO "anon";
GRANT ALL ON TABLE "public"."fdot_stage" TO "authenticated";
GRANT ALL ON TABLE "public"."fdot_stage" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fdot_stage_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."florida_parcels" TO "anon";
GRANT ALL ON TABLE "public"."florida_parcels" TO "authenticated";
GRANT ALL ON TABLE "public"."florida_parcels" TO "service_role";



GRANT ALL ON TABLE "public"."florida_parcels_summary" TO "anon";
GRANT ALL ON TABLE "public"."florida_parcels_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."florida_parcels_summary" TO "service_role";



GRANT ALL ON TABLE "public"."login_activity" TO "anon";
GRANT ALL ON TABLE "public"."login_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."login_activity" TO "service_role";



GRANT ALL ON TABLE "public"."parcels" TO "anon";
GRANT ALL ON TABLE "public"."parcels" TO "authenticated";
GRANT ALL ON TABLE "public"."parcels" TO "service_role";



GRANT ALL ON TABLE "public"."policy_clauses" TO "anon";
GRANT ALL ON TABLE "public"."policy_clauses" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_clauses" TO "service_role";



GRANT ALL ON TABLE "public"."policy_documents" TO "anon";
GRANT ALL ON TABLE "public"."policy_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_documents" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."properties_backup_20250724" TO "anon";
GRANT ALL ON TABLE "public"."properties_backup_20250724" TO "authenticated";
GRANT ALL ON TABLE "public"."properties_backup_20250724" TO "service_role";



GRANT ALL ON TABLE "public"."property_contractors" TO "anon";
GRANT ALL ON TABLE "public"."property_contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."property_contractors" TO "service_role";



GRANT ALL ON TABLE "public"."property_damage" TO "anon";
GRANT ALL ON TABLE "public"."property_damage" TO "authenticated";
GRANT ALL ON TABLE "public"."property_damage" TO "service_role";



GRANT ALL ON TABLE "public"."property_insurance" TO "anon";
GRANT ALL ON TABLE "public"."property_insurance" TO "authenticated";
GRANT ALL ON TABLE "public"."property_insurance" TO "service_role";



GRANT ALL ON TABLE "public"."property_land" TO "anon";
GRANT ALL ON TABLE "public"."property_land" TO "authenticated";
GRANT ALL ON TABLE "public"."property_land" TO "service_role";



GRANT ALL ON TABLE "public"."property_structures" TO "anon";
GRANT ALL ON TABLE "public"."property_structures" TO "authenticated";
GRANT ALL ON TABLE "public"."property_structures" TO "service_role";



GRANT ALL ON TABLE "public"."property_systems" TO "anon";
GRANT ALL ON TABLE "public"."property_systems" TO "authenticated";
GRANT ALL ON TABLE "public"."property_systems" TO "service_role";



GRANT ALL ON TABLE "public"."recent_login_activity" TO "anon";
GRANT ALL ON TABLE "public"."recent_login_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_login_activity" TO "service_role";



GRANT ALL ON TABLE "public"."scraper_logs" TO "anon";
GRANT ALL ON TABLE "public"."scraper_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."scraper_logs" TO "service_role";



GRANT ALL ON TABLE "public"."scraper_queue" TO "anon";
GRANT ALL ON TABLE "public"."scraper_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."scraper_queue" TO "service_role";



GRANT ALL ON TABLE "public"."scraper_runs" TO "anon";
GRANT ALL ON TABLE "public"."scraper_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."scraper_runs" TO "service_role";



GRANT ALL ON TABLE "public"."security_logs" TO "anon";
GRANT ALL ON TABLE "public"."security_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."security_logs" TO "service_role";



GRANT ALL ON TABLE "public"."security_questions" TO "anon";
GRANT ALL ON TABLE "public"."security_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."security_questions" TO "service_role";



GRANT ALL ON TABLE "public"."states" TO "anon";
GRANT ALL ON TABLE "public"."states" TO "authenticated";
GRANT ALL ON TABLE "public"."states" TO "service_role";



GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_legal_acceptance" TO "anon";
GRANT ALL ON TABLE "public"."user_legal_acceptance" TO "authenticated";
GRANT ALL ON TABLE "public"."user_legal_acceptance" TO "service_role";



GRANT ALL ON TABLE "public"."user_plans" TO "anon";
GRANT ALL ON TABLE "public"."user_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."user_plans" TO "service_role";



GRANT ALL ON TABLE "public"."user_security_answers" TO "anon";
GRANT ALL ON TABLE "public"."user_security_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."user_security_answers" TO "service_role";



GRANT ALL ON TABLE "public"."zip_codes" TO "anon";
GRANT ALL ON TABLE "public"."zip_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."zip_codes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."zip_codes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."zip_codes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."zip_codes_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
