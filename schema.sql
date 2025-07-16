

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
    'photo',
    'video',
    'pdf',
    'estimate',
    'invoice',
    'report',
    'correspondence',
    'other'
);


ALTER TYPE "public"."document_type_enum" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "core"."generate_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "address" "jsonb",
    "type" "text",
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
    CONSTRAINT "properties_insurability_score_check" CHECK ((("insurability_score" >= 0) AND ("insurability_score" <= 100))),
    CONSTRAINT "valid_florida_bbox" CHECK ((("location" IS NULL) OR ((("public"."st_x"("location") >= ('-87.634896'::numeric)::double precision) AND ("public"."st_x"("location") <= ('-79.974306'::numeric)::double precision)) AND (("public"."st_y"("location") >= (24.396308)::double precision) AND ("public"."st_y"("location") <= (31.000888)::double precision))))),
    CONSTRAINT "valid_square_feet" CHECK (("square_feet" > 0)),
    CONSTRAINT "valid_year" CHECK ((("year_built" >= 1800) AND (("year_built")::numeric <= EXTRACT(year FROM CURRENT_DATE))))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


COMMENT ON COLUMN "public"."properties"."value" IS 'Estimated property value in USD';



COMMENT ON COLUMN "public"."properties"."insurability_score" IS 'Property insurability score (0-100)';



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


CREATE MATERIALIZED VIEW "public"."parcels" AS
 SELECT "fl_parcels_raw"."parcel_id",
    "fl_parcels_raw"."county_fips",
    ("fl_parcels_raw"."attrs" ->> 'situs_addr'::"text") AS "situs_address",
    ("fl_parcels_raw"."attrs" ->> 'landuse_code'::"text") AS "landuse_code",
    (("fl_parcels_raw"."attrs" ->> 'just_value'::"text"))::numeric AS "just_value",
    (("fl_parcels_raw"."attrs" ->> 'year_built'::"text"))::integer AS "year_built",
    ("fl_parcels_raw"."attrs" ->> 'owner_name'::"text") AS "owner_name",
    (("fl_parcels_raw"."attrs" ->> 'living_area'::"text"))::numeric AS "living_area",
    (("fl_parcels_raw"."attrs" ->> 'total_area'::"text"))::numeric AS "total_area",
    (("fl_parcels_raw"."attrs" ->> 'bedroom_count'::"text"))::integer AS "bedroom_count",
    (("fl_parcels_raw"."attrs" ->> 'bathroom_count'::"text"))::numeric AS "bathroom_count",
    "fl_parcels_raw"."geom",
    "fl_parcels_raw"."source",
    "fl_parcels_raw"."download_ts"
   FROM "external"."fl_parcels_raw"
  WHERE ("fl_parcels_raw"."source" = ANY (ARRAY['fgio'::"text", 'fdot'::"text"]))
  WITH NO DATA;


ALTER TABLE "public"."parcels" OWNER TO "postgres";


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


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractor_license_raw"
    ADD CONSTRAINT "contractor_license_raw_pkey" PRIMARY KEY ("license_number");



ALTER TABLE ONLY "public"."debug_user_creation_logs"
    ADD CONSTRAINT "debug_user_creation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_slug_effective_date_key" UNIQUE ("slug", "effective_date");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_slug_version_key" UNIQUE ("slug", "version");



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_logs"
    ADD CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_questions"
    ADD CONSTRAINT "security_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_questions"
    ADD CONSTRAINT "security_questions_question_key" UNIQUE ("question");



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



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_ip" ON "public"."audit_logs" USING "btree" ("ip_address");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_legal_documents_effective_date" ON "public"."legal_documents" USING "btree" ("effective_date" DESC);



CREATE INDEX "idx_legal_documents_slug_active" ON "public"."legal_documents" USING "btree" ("slug", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_login_activity_created_at" ON "public"."login_activity" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_login_activity_user_created" ON "public"."login_activity" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_login_activity_user_id" ON "public"."login_activity" USING "btree" ("user_id");



CREATE INDEX "idx_parcels_county" ON "public"."parcels" USING "btree" ("county_fips");



CREATE INDEX "idx_parcels_geom" ON "public"."parcels" USING "gist" ("geom");



CREATE INDEX "idx_parcels_landuse" ON "public"."parcels" USING "btree" ("landuse_code");



CREATE INDEX "idx_parcels_value" ON "public"."parcels" USING "btree" ("just_value");



CREATE INDEX "idx_properties_location" ON "public"."properties" USING "gist" ("location");



CREATE INDEX "idx_properties_user" ON "public"."properties" USING "btree" ("user_id");



CREATE INDEX "idx_security_logs_action" ON "public"."security_logs" USING "btree" ("action");



CREATE INDEX "idx_security_logs_created_at" ON "public"."security_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_security_logs_ip" ON "public"."security_logs" USING "btree" ("ip_address");



CREATE INDEX "idx_security_logs_user_id" ON "public"."security_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_legal_acceptance_accepted_at" ON "public"."user_legal_acceptance" USING "btree" ("accepted_at" DESC);



CREATE INDEX "idx_user_legal_acceptance_user_id" ON "public"."user_legal_acceptance" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_id" ON "public"."user_profiles" USING "btree" ("id");



CREATE INDEX "idx_user_security_answers_question_id" ON "public"."user_security_answers" USING "btree" ("question_id");



CREATE INDEX "idx_user_security_answers_user_id" ON "public"."user_security_answers" USING "btree" ("user_id");



CREATE UNIQUE INDEX "parcels_parcel_id_idx" ON "public"."parcels" USING "btree" ("parcel_id");



CREATE OR REPLACE TRIGGER "on_profile_updated" AFTER UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_profile_update"();



COMMENT ON TRIGGER "on_profile_updated" ON "public"."user_profiles" IS 'Syncs user profile changes back to auth.users metadata';



CREATE OR REPLACE TRIGGER "trigger_prevent_backdating" BEFORE INSERT OR UPDATE ON "public"."legal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_backdating"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_plans_updated_at" BEFORE UPDATE ON "public"."user_plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



CREATE POLICY "Legal documents are viewable by everyone" ON "public"."legal_documents" FOR SELECT USING (true);



CREATE POLICY "Security questions are viewable by everyone" ON "public"."security_questions" FOR SELECT USING (true);



CREATE POLICY "Service role can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can insert security logs" ON "public"."security_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can delete own properties" ON "public"."properties" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own security answers" ON "public"."user_security_answers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own legal acceptances" ON "public"."user_legal_acceptance" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own properties" ON "public"."properties" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own security answers" ON "public"."user_security_answers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own plan" ON "public"."user_plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own properties" ON "public"."properties" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own security answers" ON "public"."user_security_answers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own legal acceptances" ON "public"."user_legal_acceptance" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own plan" ON "public"."user_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own properties" ON "public"."properties" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own security answers" ON "public"."user_security_answers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_legal_acceptance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_security_answers" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_demo_property"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."legal_documents" TO "anon";
GRANT ALL ON TABLE "public"."legal_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_documents" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parcel_stats"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_parcels_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_parcels_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_parcels_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."contractor_license_raw" TO "anon";
GRANT ALL ON TABLE "public"."contractor_license_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_license_raw" TO "service_role";



GRANT ALL ON TABLE "public"."debug_user_creation_logs" TO "anon";
GRANT ALL ON TABLE "public"."debug_user_creation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."debug_user_creation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."login_activity" TO "anon";
GRANT ALL ON TABLE "public"."login_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."login_activity" TO "service_role";



GRANT ALL ON TABLE "public"."parcels" TO "anon";
GRANT ALL ON TABLE "public"."parcels" TO "authenticated";
GRANT ALL ON TABLE "public"."parcels" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recent_login_activity" TO "anon";
GRANT ALL ON TABLE "public"."recent_login_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_login_activity" TO "service_role";



GRANT ALL ON TABLE "public"."security_logs" TO "anon";
GRANT ALL ON TABLE "public"."security_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."security_logs" TO "service_role";



GRANT ALL ON TABLE "public"."security_questions" TO "anon";
GRANT ALL ON TABLE "public"."security_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."security_questions" TO "service_role";



GRANT ALL ON TABLE "public"."user_legal_acceptance" TO "anon";
GRANT ALL ON TABLE "public"."user_legal_acceptance" TO "authenticated";
GRANT ALL ON TABLE "public"."user_legal_acceptance" TO "service_role";



GRANT ALL ON TABLE "public"."user_plans" TO "anon";
GRANT ALL ON TABLE "public"."user_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."user_plans" TO "service_role";



GRANT ALL ON TABLE "public"."user_security_answers" TO "anon";
GRANT ALL ON TABLE "public"."user_security_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."user_security_answers" TO "service_role";



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
