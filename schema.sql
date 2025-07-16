

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



CREATE OR REPLACE FUNCTION "public"."fdot_merge_stage"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    /* Upsert latest snapshot */
    INSERT INTO public.fdot_parcels_latest (
        parcelno, asmnt_yr, objectid, dor_uc, pa_uc,
        jv, av, tv, own_name,
        phy_addr1, phy_city, phy_zipcd,
        sale_prc1, sale_yr1, sale_mo1, geom, last_refreshed_at
    )
    SELECT
        s.parcelno, s.asmnt_yr, s.objectid, s.dor_uc, s.pa_uc,
        s.jv, s.av, s.tv, s.own_name,
        s.phy_addr1, s.phy_city, s.phy_zipcd,
        s.sale_prc1, s.sale_yr1, s.sale_mo1, s.geom, now()
    FROM fdot_stage s
    ON CONFLICT (parcelno) DO UPDATE
    SET asmnt_yr          = EXCLUDED.asmnt_yr,
        objectid          = EXCLUDED.objectid,
        dor_uc            = EXCLUDED.dor_uc,
        pa_uc             = EXCLUDED.pa_uc,
        jv                = EXCLUDED.jv,
        av                = EXCLUDED.av,
        tv                = EXCLUDED.tv,
        own_name          = EXCLUDED.own_name,
        phy_addr1         = EXCLUDED.phy_addr1,
        phy_city          = EXCLUDED.phy_city,
        phy_zipcd         = EXCLUDED.phy_zipcd,
        sale_prc1         = EXCLUDED.sale_prc1,
        sale_yr1          = EXCLUDED.sale_yr1,
        sale_mo1          = EXCLUDED.sale_mo1,
        geom              = EXCLUDED.geom,
        last_refreshed_at = now();

    /* Insert into history only if (parcelno, asmnt_yr) is new */
    INSERT INTO public.fdot_parcels_hist (
        parcelno, asmnt_yr, objectid, dor_uc, pa_uc,
        jv, av, tv, own_name,
        phy_addr1, phy_city, phy_zipcd,
        sale_prc1, sale_yr1, sale_mo1, geom
    )
    SELECT
        s.parcelno, s.asmnt_yr, s.objectid, s.dor_uc, s.pa_uc,
        s.jv, s.av, s.tv, s.own_name,
        s.phy_addr1, s.phy_city, s.phy_zipcd,
        s.sale_prc1, s.sale_yr1, s.sale_mo1, s.geom
    FROM fdot_stage s
    ON CONFLICT (parcelno, asmnt_yr) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."fdot_merge_stage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fdot_stage_insert_one"("j" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    r RECORD;
BEGIN
    /* Map incoming JSON → table fields */
    SELECT
        (j->'properties')->>'PARCELNO'                         AS parcelno,
        ((j->'properties')->>'ASMNT_YR')::smallint             AS asmnt_yr,
        ((j->'properties')->>'OBJECTID')::bigint               AS objectid,
        (j->'properties')->>'DOR_UC'                           AS dor_uc,
        (j->'properties')->>'PA_UC'                            AS pa_uc,
        ((j->'properties')->>'JV')::numeric                    AS jv,
        ((j->'properties')->>'AV')::numeric                    AS av,
        ((j->'properties')->>'TV')::numeric                    AS tv,
        (j->'properties')->>'OWN_NAME'                         AS own_name,
        (j->'properties')->>'PHY_ADDR1'                        AS phy_addr1,
        (j->'properties')->>'PHY_CITY'                         AS phy_city,
        (j->'properties')->>'PHY_ZIPCD'                        AS phy_zipcd,
        ((j->'properties')->>'SALE_PRC1')::numeric             AS sale_prc1,
        ((j->'properties')->>'SALE_YR1')::smallint             AS sale_yr1,
        ((j->'properties')->>'SALE_MO1')::smallint             AS sale_mo1,
        ST_SetSRID(
          ST_GeomFromGeoJSON(j->>'geometry'),
          4326
        )                                                     AS geom
    INTO r;

    INSERT INTO public.fdot_stage (
        parcelno, asmnt_yr, objectid, dor_uc, pa_uc,
        jv, av, tv, own_name,
        phy_addr1, phy_city, phy_zipcd,
        sale_prc1, sale_yr1, sale_mo1, geom,
        last_refreshed_at
    )
    VALUES (
        r.parcelno, r.asmnt_yr, r.objectid, r.dor_uc, r.pa_uc,
        r.jv, r.av, r.tv, r.own_name,
        r.phy_addr1, r.phy_city, r.phy_zipcd,
        r.sale_prc1, r.sale_yr1, r.sale_mo1, r.geom,
        now()
    );
END;
$$;


ALTER FUNCTION "public"."fdot_stage_insert_one"("j" "jsonb") OWNER TO "postgres";

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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
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


CREATE OR REPLACE FUNCTION "public"."get_embedding"("input_text" "text") RETURNS "public"."vector"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    embedding_result vector(1536);
BEGIN
    -- This is a placeholder - you'll need to implement via Supabase Edge Function
    -- that calls OpenAI API with text-embedding-3-small model
    -- For now, return NULL
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."get_embedding"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_form_pdf"("form_id" "uuid") RETURNS TABLE("pdf_sha256" "text", "pdf_url" "text", "title" "text", "form_number" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Increment download counter if authenticated
    IF auth.uid() IS NOT NULL THEN
        UPDATE user_plans
        SET downloads_this_month = downloads_this_month + 1
        WHERE user_id = auth.uid()
        AND downloads_this_month < downloads_limit;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Download limit exceeded';
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT f.pdf_sha256, f.pdf_url, f.title, f.form_number
    FROM forms f
    WHERE f.id = get_form_pdf.form_id;
END;
$$;


ALTER FUNCTION "public"."get_form_pdf"("form_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    first_name,
    last_name,
    phone,
    avatar_url,
    member_since
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'firstName', ''),
    COALESCE(new.raw_user_meta_data->>'lastName', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'avatarUrl', ''),
    now()
  );
  RETURN new;
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


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- TODO: Replace with your admin check logic
    RETURN auth.jwt() ->> 'role' = 'admin';
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean DEFAULT true, "p_failure_reason" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.login_activity (
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
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;


ALTER FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
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


CREATE OR REPLACE FUNCTION "public"."reset_monthly_limits"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE user_plans
    SET 
        downloads_this_month = 0,
        api_calls_this_month = 0,
        reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE reset_at <= NOW();
END;
$$;


ALTER FUNCTION "public"."reset_monthly_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_forms"("query_text" "text", "limit_results" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "filing_id" "text", "form_number" "text", "edition_date" "date", "title" "text", "company" "text", "line_of_business" "text", "clause_text" "text", "relevance_score" double precision, "vector_score" double precision)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    query_embedding vector;
BEGIN
    -- TODO: Replace with actual embedding generation
    -- For now, using placeholder. In production, call OpenAI API
    -- query_embedding := get_embedding(query_text);
    
    RETURN QUERY
    WITH text_search AS (
        -- BM25 text search on forms
        SELECT 
            f.id,
            f.filing_id,
            f.form_number,
            f.edition_date,
            f.title,
            f.company,
            f.line_of_business,
            ts_rank(to_tsvector('english', f.title || ' ' || f.form_number), 
                    plainto_tsquery('english', query_text)) AS text_score
        FROM forms f
        WHERE to_tsvector('english', f.title || ' ' || f.form_number) @@ 
              plainto_tsquery('english', query_text)
        
        UNION ALL
        
        -- Text search on clauses
        SELECT DISTINCT
            f.id,
            f.filing_id,
            f.form_number,
            f.edition_date,
            f.title,
            f.company,
            f.line_of_business,
            ts_rank(to_tsvector('english', fc.text_content), 
                    plainto_tsquery('english', query_text)) * 0.8 AS text_score
        FROM forms f
        JOIN forms_clauses fc ON f.id = fc.form_id
        WHERE to_tsvector('english', fc.text_content) @@ 
              plainto_tsquery('english', query_text)
    ),
    aggregated AS (
        SELECT 
            id,
            filing_id,
            form_number,
            edition_date,
            title,
            company,
            line_of_business,
            MAX(text_score) AS max_text_score
        FROM text_search
        GROUP BY id, filing_id, form_number, edition_date, title, company, line_of_business
    )
    SELECT 
        a.*,
        fc.text_content AS clause_text,
        a.max_text_score AS relevance_score,
        0.0 AS vector_score -- Placeholder for vector similarity
    FROM aggregated a
    LEFT JOIN LATERAL (
        SELECT text_content
        FROM forms_clauses
        WHERE form_id = a.id
        AND to_tsvector('english', text_content) @@ plainto_tsquery('english', query_text)
        ORDER BY ts_rank(to_tsvector('english', text_content), 
                        plainto_tsquery('english', query_text)) DESC
        LIMIT 1
    ) fc ON true
    ORDER BY a.max_text_score DESC
    LIMIT limit_results;
END;
$$;


ALTER FUNCTION "public"."search_forms"("query_text" "text", "limit_results" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at := now();
    return new;
end $$;


ALTER FUNCTION "public"."trg_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accessory_structures" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "address_id" "uuid",
    "structure_code" character varying(50) NOT NULL,
    "structure_type" character varying(100),
    "year_built" integer,
    "area_sqft" integer,
    "permit_numbers" "text"[],
    "latitude" numeric(10,6),
    "longitude" numeric(10,6),
    "location" "public"."geography"(Point,4326) GENERATED ALWAYS AS ("public"."st_setsrid"("public"."st_makepoint"(("longitude")::double precision, ("latitude")::double precision), 4326)) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_accessory_structures_latitude" CHECK (((("latitude" >= 24.0) AND ("latitude" <= 31.5)) OR ("latitude" IS NULL))),
    CONSTRAINT "chk_accessory_structures_longitude" CHECK (((("longitude" >= '-88.5'::numeric) AND ("longitude" <= '-79.0'::numeric)) OR ("longitude" IS NULL)))
);


ALTER TABLE "public"."accessory_structures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_policies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "policy_code" character varying(50) NOT NULL,
    "policy_type" character varying(100),
    "carrier" character varying(255),
    "policy_number" character varying(50),
    "effective_date" "date",
    "expiration_date" "date",
    "insured_name" character varying(255),
    "address_id" "uuid",
    "premium_annual_usd" numeric(10,2),
    "payment_schedule" character varying(50),
    "deductibles" "jsonb",
    "coverage_limits_usd" "jsonb",
    "endorsements" "text"[],
    "risk_mitigation_credits" "jsonb",
    "previous_policy_version" character varying(255),
    "version_path" character varying(255),
    "is_current" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."insurance_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcels" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "strap_pid" character varying(50) NOT NULL,
    "alt_key" character varying(50),
    "legal_description" "text" NOT NULL,
    "state" character varying(2) NOT NULL,
    "latitude" numeric(10,6) NOT NULL,
    "longitude" numeric(10,6) NOT NULL,
    "location" "public"."geography"(Point,4326) GENERATED ALWAYS AS ("public"."st_setsrid"("public"."st_makepoint"(("longitude")::double precision, ("latitude")::double precision), 4326)) STORED,
    "acreage_platted" numeric(8,3),
    "acreage_surveyed" numeric(8,3),
    "homestead_exemption" boolean DEFAULT false,
    "save_our_homes_year_cap" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "county_id" integer NOT NULL,
    CONSTRAINT "chk_parcels_latitude" CHECK (((("latitude" >= 24.0) AND ("latitude" <= 31.5)) OR ("latitude" IS NULL))),
    CONSTRAINT "chk_parcels_longitude" CHECK (((("longitude" >= '-88.5'::numeric) AND ("longitude" <= '-79.0'::numeric)) OR ("longitude" IS NULL)))
);


ALTER TABLE "public"."parcels" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_insurance" AS
 SELECT "p"."strap_pid",
    "ip"."policy_code",
    "ip"."policy_type",
    "ip"."carrier",
    "ip"."policy_number",
    "ip"."effective_date",
    "ip"."expiration_date",
    "ip"."premium_annual_usd",
    "ip"."coverage_limits_usd"
   FROM ("public"."parcels" "p"
     JOIN "public"."insurance_policies" "ip" ON (("p"."id" = "ip"."parcel_id")))
  WHERE (("ip"."is_current" = true) AND ("ip"."expiration_date" >= CURRENT_DATE));


ALTER TABLE "public"."active_insurance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "street_number" "text" NOT NULL,
    "street_predirection" "text",
    "street_name" "text" NOT NULL,
    "street_suffix" "text" NOT NULL,
    "street_postdirection" "text",
    "unit_number" "text",
    "city" "text" NOT NULL,
    "state" character varying(2) NOT NULL,
    "postal_code" character varying(10) NOT NULL,
    "country_code" character varying(2) DEFAULT 'US'::character varying NOT NULL,
    "latitude" numeric(10,6),
    "longitude" numeric(10,6),
    "geom" "public"."geography"(Point,4326) GENERATED ALWAYS AS ("public"."st_setsrid"("public"."st_makepoint"(("longitude")::double precision, ("latitude")::double precision), 4326)) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "county_id" integer NOT NULL,
    CONSTRAINT "chk_addresses_latitude" CHECK (((("latitude" >= 24.0) AND ("latitude" <= 31.5)) OR ("latitude" IS NULL))),
    CONSTRAINT "chk_addresses_longitude" CHECK (((("longitude" >= '-88.5'::numeric) AND ("longitude" <= '-79.0'::numeric)) OR ("longitude" IS NULL)))
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."buildings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "address_id" "uuid",
    "building_code" character varying(50) NOT NULL,
    "building_name" character varying(255),
    "primary_use" character varying(100),
    "gross_area_sqft" integer,
    "heated_area_sqft" integer,
    "stories" integer,
    "year_built" integer,
    "effective_year" integer,
    "construction_type_ibc" character varying(50),
    "wind_design_speed_3s_mph" integer,
    "elevation_cert_date" "date",
    "latitude" numeric(10,6),
    "longitude" numeric(10,6),
    "location" "public"."geography"(Point,4326) GENERATED ALWAYS AS ("public"."st_setsrid"("public"."st_makepoint"(("longitude")::double precision, ("latitude")::double precision), 4326)) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_buildings_latitude" CHECK (((("latitude" >= 24.0) AND ("latitude" <= 31.5)) OR ("latitude" IS NULL))),
    CONSTRAINT "chk_buildings_longitude" CHECK (((("longitude" >= '-88.5'::numeric) AND ("longitude" <= '-79.0'::numeric)) OR ("longitude" IS NULL)))
);


ALTER TABLE "public"."buildings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claims" (
    "claim_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "claim_code" character varying(50) NOT NULL,
    "policy_id" "uuid",
    "date_of_loss" "date" NOT NULL,
    "cause_of_loss" character varying(100),
    "status" character varying(50),
    "gross_claim_usd" numeric(10,2),
    "net_settlement_usd" numeric(10,2),
    "deductible_applied_usd" numeric(10,2),
    "rooms_impacted" "text"[],
    "systems_impacted" "text"[],
    "adjuster_name" character varying(255),
    "adjuster_contact" character varying(255),
    "public_adjuster" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."county_resources" (
    "id" integer NOT NULL,
    "county_id" integer NOT NULL,
    "resource_type_id" integer NOT NULL,
    "url" "text" NOT NULL
);


ALTER TABLE "public"."county_resources" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."county_resources_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."county_resources_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."county_resources_id_seq" OWNED BY "public"."county_resources"."id";



CREATE TABLE IF NOT EXISTS "public"."county_sources" (
    "county_fips" character(5) NOT NULL,
    "county_name" "text" NOT NULL,
    "state_code" character(2) DEFAULT 'FL'::"bpchar" NOT NULL,
    "vendor" "text" NOT NULL,
    "base_url" "text" NOT NULL,
    "api_key_secret" "text",
    "last_pull_utc" timestamp with time zone
);


ALTER TABLE "public"."county_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coverage_details" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "policy_id" "uuid",
    "coverage_type" character varying(100) NOT NULL,
    "limit_usd" numeric(12,2),
    "valuation_basis" character varying(50),
    "deductible" "jsonb",
    "causes_of_loss" "text"[],
    "special_conditions" "text",
    "last_updated" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coverage_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crawler_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "message" "text",
    "forms_processed" integer DEFAULT 0,
    "errors" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crawler_logs_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'success'::"text", 'failed'::"text", 'retry'::"text"])))
);


ALTER TABLE "public"."crawler_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."development_potential" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "excess_land_sqft" integer,
    "unused_density_du" numeric(5,2),
    "tdr_eligible" boolean DEFAULT false,
    "utility_capacity_available" boolean DEFAULT true,
    "school_concurrency_clearance" boolean DEFAULT true,
    "fdot_access_permit_status" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."development_potential" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documentation_records" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "source_type" character varying(50),
    "file_path" "text",
    "retrieved_by" character varying(100),
    "retrieved_on" "date",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."documentation_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."easements_rights" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "total_easements_count" integer DEFAULT 0,
    "last_easement_recorded" "date",
    "has_utility_servitudes" boolean DEFAULT false,
    "mineral_rights_status" character varying(50),
    "air_rights_status" character varying(50),
    "water_rights_status" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."easements_rights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "equipment_code" character varying(50) NOT NULL,
    "system_id" "uuid",
    "equipment_category" character varying(50),
    "equipment_type" character varying(100),
    "make" character varying(100),
    "model" character varying(100),
    "year" integer,
    "serial_no" character varying(100),
    "id_no" character varying(50),
    "display_name" character varying(255),
    "description" "text",
    "attachments" "text"[],
    "latitude" numeric(10,6),
    "longitude" numeric(10,6),
    "location" "public"."geography"(Point,4326) GENERATED ALWAYS AS ("public"."st_setsrid"("public"."st_makepoint"(("longitude")::double precision, ("latitude")::double precision), 4326)) STORED,
    "equipment_photo" character varying(255),
    "specification_information" "jsonb",
    "general_information" "jsonb",
    "telematics_provider_information" "jsonb",
    "change_history" "jsonb"[],
    "projects" "jsonb"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_equipment_latitude" CHECK (((("latitude" >= 24.0) AND ("latitude" <= 31.5)) OR ("latitude" IS NULL))),
    CONSTRAINT "chk_equipment_longitude" CHECK (((("longitude" >= '-88.5'::numeric) AND ("longitude" <= '-79.0'::numeric)) OR ("longitude" IS NULL)))
);


ALTER TABLE "public"."equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."home_systems" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "system_code" character varying(50) NOT NULL,
    "system_type" character varying(50) NOT NULL,
    "service_zone" character varying(100),
    "manufacturer" character varying(100),
    "model" character varying(100),
    "install_date" "date",
    "warranty_expires" "date",
    "primary_permit" character varying(50),
    "maint_provider" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."home_systems" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."equipment_maintenance_schedule" AS
 SELECT "e"."equipment_code",
    "e"."display_name",
    "e"."equipment_type",
    "e"."make",
    "e"."model",
    "hs"."system_type",
    "hs"."warranty_expires",
    "hs"."maint_provider",
    "p"."strap_pid"
   FROM (("public"."equipment" "e"
     JOIN "public"."home_systems" "hs" ON (("e"."system_id" = "hs"."id")))
     JOIN "public"."parcels" "p" ON (("hs"."parcel_id" = "p"."id")))
  WHERE ("hs"."warranty_expires" >= CURRENT_DATE)
  ORDER BY "hs"."warranty_expires";


ALTER TABLE "public"."equipment_maintenance_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_api_data_fields" (
    "id" integer NOT NULL,
    "url" "text" NOT NULL,
    "description" "text" NOT NULL,
    "how_to" "text" NOT NULL,
    "field" "text" NOT NULL
);


ALTER TABLE "public"."external_api_data_fields" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."external_api_data_fields_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."external_api_data_fields_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."external_api_data_fields_id_seq" OWNED BY "public"."external_api_data_fields"."id";



CREATE TABLE IF NOT EXISTS "public"."fdot_parcels" (
    "objectid" bigint NOT NULL,
    "parcelno" "text",
    "own_name" "text",
    "asmnt_yr" smallint,
    "dor_uc" "text",
    "pa_uc" "text",
    "jv" numeric,
    "av" numeric,
    "tv" numeric,
    "phy_addr1" "text",
    "phy_city" "text",
    "phy_zipcd" "text",
    "sale_prc1" numeric,
    "sale_yr1" smallint,
    "sale_mo1" smallint,
    "geom" "public"."geometry"(MultiPolygon,4326)
);


ALTER TABLE "public"."fdot_parcels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fdot_parcels_hist" (
    "parcel_id" bigint NOT NULL,
    "parcelno" "text" NOT NULL,
    "asmnt_yr" smallint NOT NULL,
    "objectid" bigint NOT NULL,
    "dor_uc" "text",
    "pa_uc" "text",
    "jv" numeric,
    "av" numeric,
    "tv" numeric,
    "own_name" "text",
    "phy_addr1" "text",
    "phy_city" "text",
    "phy_zipcd" "text",
    "sale_prc1" numeric,
    "sale_yr1" smallint,
    "sale_mo1" smallint,
    "geom" "public"."geometry"(MultiPolygon,4326),
    "load_ts" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fdot_parcels_hist" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fdot_parcels_hist_parcel_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."fdot_parcels_hist_parcel_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fdot_parcels_hist_parcel_id_seq" OWNED BY "public"."fdot_parcels_hist"."parcel_id";



CREATE TABLE IF NOT EXISTS "public"."fdot_parcels_latest" (
    "parcel_id" bigint NOT NULL,
    "parcelno" "text" NOT NULL,
    "asmnt_yr" smallint NOT NULL,
    "objectid" bigint NOT NULL,
    "dor_uc" "text",
    "pa_uc" "text",
    "jv" numeric,
    "av" numeric,
    "tv" numeric,
    "own_name" "text",
    "phy_addr1" "text",
    "phy_city" "text",
    "phy_zipcd" "text",
    "sale_prc1" numeric,
    "sale_yr1" smallint,
    "sale_mo1" smallint,
    "geom" "public"."geometry"(MultiPolygon,4326) NOT NULL,
    "last_refreshed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fdot_parcels_latest" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fdot_parcels_latest_parcel_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."fdot_parcels_latest_parcel_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fdot_parcels_latest_parcel_id_seq" OWNED BY "public"."fdot_parcels_latest"."parcel_id";



CREATE TABLE IF NOT EXISTS "public"."financial_tax_records" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "fiscal_year" integer NOT NULL,
    "market_value_usd" numeric(12,2),
    "assessed_value_usd" numeric(12,2),
    "taxable_value_usd" numeric(12,2),
    "millage_rate" numeric(6,4),
    "total_tax_usd" numeric(10,2),
    "non_ad_valorem_usd" numeric(10,2),
    "mortgage_balance_usd" numeric(12,2),
    "insurance_premium_total" numeric(10,2),
    "capex_spend_usd" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."financial_tax_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fl_counties" (
    "id" integer NOT NULL,
    "fips5" character(5) NOT NULL,
    "county_name" "text" NOT NULL
);


ALTER TABLE "public"."fl_counties" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fl_counties_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."fl_counties_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fl_counties_id_seq" OWNED BY "public"."fl_counties"."id";



CREATE TABLE IF NOT EXISTS "public"."floors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "building_id" "uuid",
    "floor_code" character varying(50) NOT NULL,
    "floor_number" integer,
    "elevation_ft" numeric(6,2),
    "gross_area_sqft" integer,
    "rooms_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."floors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "filing_id" "text" NOT NULL,
    "form_number" "text" NOT NULL,
    "edition_date" "date",
    "title" "text",
    "company" "text" NOT NULL,
    "line_of_business" "text",
    "status" "text",
    "pdf_url" "text",
    "pdf_sha256" "text",
    "file_size_bytes" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_crawled_at" timestamp with time zone
);


ALTER TABLE "public"."forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forms_clauses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "form_id" "uuid",
    "clause_number" integer NOT NULL,
    "text_content" "text" NOT NULL,
    "page_number" integer,
    "bbox" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forms_clauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forms_embeddings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "clause_id" "uuid",
    "embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forms_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hoa_poa" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "association_name" character varying(255),
    "legal_entity_id" character varying(50),
    "address_id" "uuid",
    "management_company" character varying(255),
    "annual_assessment_usd" numeric(10,2),
    "assessment_frequency" character varying(50),
    "reserves_balance_usd" numeric(12,2),
    "amendment_requirements_pct" integer,
    "estoppel_needed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hoa_poa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."land_use_zoning" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "current_zoning" character varying(50),
    "future_land_use" character varying(100),
    "overlay_districts" "text"[],
    "max_density_du_per_acre" numeric(5,2),
    "max_far" numeric(4,2),
    "primary_setbacks_ft" "jsonb",
    "zoning_letter_issue_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."land_use_zoning" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."operations_maintenance" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "om_schema_version" character varying(20),
    "asset_count" integer DEFAULT 0,
    "active_service_contracts" integer DEFAULT 0,
    "next_major_inspection" "date",
    "utility_consumption_tracking" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."operations_maintenance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permit_status_history" (
    "history_id" bigint NOT NULL,
    "permit_id" bigint,
    "old_status" "text",
    "new_status" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permit_status_history" OWNER TO "postgres";


ALTER TABLE "public"."permit_status_history" ALTER COLUMN "history_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."permit_status_history_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."permits" (
    "permit_id" bigint NOT NULL,
    "county_fips" character(5),
    "permit_number" "text" NOT NULL,
    "address" "text",
    "parcel_number" "text",
    "work_desc" "text",
    "applicant" "text",
    "status" "text" NOT NULL,
    "status_ts" timestamp with time zone,
    "issued_ts" timestamp with time zone,
    "expires_ts" timestamp with time zone,
    "raw_json" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permits_approvals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "total_permits" integer DEFAULT 0,
    "open_permits" integer DEFAULT 0,
    "latest_permit_type" character varying(100),
    "latest_permit_issue_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."permits_approvals" OWNER TO "postgres";


ALTER TABLE "public"."permits" ALTER COLUMN "permit_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."permits_permit_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."personal_property" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "item_code" character varying(50) NOT NULL,
    "room_id" "uuid",
    "category" character varying(100),
    "description" "text",
    "serial_number" character varying(100),
    "model_number" character varying(100),
    "purchase_price_usd" numeric(10,2),
    "purchase_date" "date",
    "current_value_usd" numeric(10,2),
    "warranty_expiration" "date",
    "scheduled" boolean DEFAULT false,
    "insurance_policy_id" character varying(50),
    "photos" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personal_property" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."physical_sites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "site_latitude" numeric(10,6),
    "site_longitude" numeric(10,6),
    "site_location" "public"."geography"(Point,4326) GENERATED ALWAYS AS ("public"."st_setsrid"("public"."st_makepoint"(("site_longitude")::double precision, ("site_latitude")::double precision), 4326)) STORED,
    "lidar_source" character varying(255),
    "flood_zone" character varying(10),
    "bfe_ft_ngvd88" numeric(6,2),
    "sea_level_rise_2050_ft" numeric(4,2),
    "wetlands_present" boolean DEFAULT false,
    "sinkhole_risk" character varying(50),
    "environmental_hazards" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "county_id" integer NOT NULL,
    CONSTRAINT "chk_physical_sites_site_latitude" CHECK (((("site_latitude" >= 24.0) AND ("site_latitude" <= 31.5)) OR ("site_latitude" IS NULL))),
    CONSTRAINT "chk_physical_sites_site_longitude" CHECK (((("site_longitude" >= '-88.5'::numeric) AND ("site_longitude" <= '-79.0'::numeric)) OR ("site_longitude" IS NULL)))
);


ALTER TABLE "public"."physical_sites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "carrier" "text",
    "form_series" "text",
    "edition_date" "date",
    "type" "text",
    "pdf_url" "text",
    "policy_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."policy_forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_change_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "change_timestamp" timestamp with time zone DEFAULT "now"(),
    "change_type" "text",
    "field_changed" "text",
    "old_value" "text",
    "new_value" "text",
    "note" "text"
);


ALTER TABLE "public"."pp_change_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "doc_type" "text",
    "file_path" "text" NOT NULL,
    "uploaded_on" timestamp with time zone DEFAULT "now"(),
    "note" "text"
);


ALTER TABLE "public"."pp_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_insurance_link" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "policy_id" "uuid" NOT NULL,
    "coverage_type" "text",
    "limit_usd" numeric(12,2),
    "deductible_usd" numeric(12,2)
);


ALTER TABLE "public"."pp_insurance_link" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_location_hist" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "from_room_id" "uuid",
    "to_room_id" "uuid",
    "from_coords" "public"."geography"(Point,4326),
    "to_coords" "public"."geography"(Point,4326),
    "moved_by_user" "uuid",
    "moved_on" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."pp_location_hist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_maintenance" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "service_date" "date" NOT NULL,
    "provider_entity" "text",
    "action_taken" "text",
    "cost_usd" numeric(10,2),
    "next_due_date" "date",
    "attachments" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pp_maintenance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_photos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "shoot_date" "date",
    "is_primary" boolean DEFAULT false,
    "label" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pp_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_telematics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "provider_name" "text",
    "device_id" "text",
    "data_payload" "jsonb",
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pp_telematics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_valuation_hist" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "valuation_date" "date" NOT NULL,
    "valuation_source" "text",
    "market_value_usd" numeric(12,2),
    "depreciation_value_usd" numeric(12,2),
    "insured_value_usd" numeric(12,2),
    "extras" "jsonb"
);


ALTER TABLE "public"."pp_valuation_hist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pp_warranty" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pp_id" "uuid" NOT NULL,
    "provider_name" "text",
    "contract_number" "text",
    "start_date" "date",
    "end_date" "date",
    "coverage_details" "jsonb",
    "contact_phone" "text",
    "contact_email" "text",
    "document_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pp_warranty" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "avatar_url" "text",
    "member_since" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


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
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_access" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "parcel_id" "uuid",
    "access_level" character varying(50) DEFAULT 'read'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."property_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_data_points" (
    "id" integer NOT NULL,
    "point_code" "text" NOT NULL,
    "description" "text" NOT NULL,
    "primary_source" "text",
    "api_reference" "text"
);


ALTER TABLE "public"."property_data_points" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."property_data_points_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."property_data_points_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."property_data_points_id_seq" OWNED BY "public"."property_data_points"."id";



CREATE OR REPLACE VIEW "public"."property_overview" AS
 SELECT "p"."id",
    "p"."strap_pid",
    "p"."legal_description",
    "c"."county_name" AS "county",
    "p"."state",
    "p"."acreage_surveyed",
    "ps"."flood_zone",
    "ps"."bfe_ft_ngvd88",
    "luz"."current_zoning",
    "luz"."future_land_use",
    "count"(DISTINCT "b"."id") AS "building_count",
    "sum"("b"."gross_area_sqft") AS "total_building_sqft",
    "max"("ftr"."fiscal_year") AS "latest_tax_year",
    "max"("ftr"."market_value_usd") AS "latest_market_value"
   FROM ((((("public"."parcels" "p"
     JOIN "public"."fl_counties" "c" ON (("c"."id" = "p"."county_id")))
     LEFT JOIN "public"."physical_sites" "ps" ON (("ps"."parcel_id" = "p"."id")))
     LEFT JOIN "public"."land_use_zoning" "luz" ON (("luz"."parcel_id" = "p"."id")))
     LEFT JOIN "public"."buildings" "b" ON (("b"."parcel_id" = "p"."id")))
     LEFT JOIN "public"."financial_tax_records" "ftr" ON (("ftr"."parcel_id" = "p"."id")))
  GROUP BY "p"."id", "p"."strap_pid", "p"."legal_description", "c"."county_name", "p"."state", "p"."acreage_surveyed", "ps"."flood_zone", "ps"."bfe_ft_ngvd88", "luz"."current_zoning", "luz"."future_land_use";


ALTER TABLE "public"."property_overview" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."ref_pp_category" (
    "id" integer NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL
);


ALTER TABLE "public"."ref_pp_category" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ref_pp_category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ref_pp_category_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ref_pp_category_id_seq" OWNED BY "public"."ref_pp_category"."id";



CREATE TABLE IF NOT EXISTS "public"."ref_pp_condition" (
    "id" integer NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL
);


ALTER TABLE "public"."ref_pp_condition" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ref_pp_condition_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ref_pp_condition_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ref_pp_condition_id_seq" OWNED BY "public"."ref_pp_condition"."id";



CREATE TABLE IF NOT EXISTS "public"."ref_pp_depreciation_method" (
    "id" integer NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL
);


ALTER TABLE "public"."ref_pp_depreciation_method" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ref_pp_depreciation_method_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ref_pp_depreciation_method_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ref_pp_depreciation_method_id_seq" OWNED BY "public"."ref_pp_depreciation_method"."id";



CREATE TABLE IF NOT EXISTS "public"."ref_pp_status" (
    "id" integer NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL
);


ALTER TABLE "public"."ref_pp_status" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ref_pp_status_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ref_pp_status_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ref_pp_status_id_seq" OWNED BY "public"."ref_pp_status"."id";



CREATE TABLE IF NOT EXISTS "public"."ref_resource_type" (
    "id" integer NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL
);


ALTER TABLE "public"."ref_resource_type" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ref_resource_type_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ref_resource_type_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ref_resource_type_id_seq" OWNED BY "public"."ref_resource_type"."id";



CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "room_code" character varying(50) NOT NULL,
    "building_id" "uuid",
    "floor_id" "uuid",
    "name" character varying(100) NOT NULL,
    "space_type" character varying(100),
    "dimensions_ft" "jsonb",
    "area_sqft" integer,
    "finish_floor" character varying(255),
    "finish_wall" character varying(255),
    "finish_ceiling" character varying(255),
    "occupancy_type" character varying(100),
    "hvac_supply_cfm" integer,
    "hvac_return_cfm" integer,
    "plumbing_fixtures" "text"[],
    "electrical_circuits" "text"[],
    "personal_property_items" "text"[],
    "latitude" numeric(10,6),
    "longitude" numeric(10,6),
    "location" "public"."geography"(Point,4326) GENERATED ALWAYS AS ("public"."st_setsrid"("public"."st_makepoint"(("longitude")::double precision, ("latitude")::double precision), 4326)) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_rooms_latitude" CHECK (((("latitude" >= 24.0) AND ("latitude" <= 31.5)) OR ("latitude" IS NULL))),
    CONSTRAINT "chk_rooms_longitude" CHECK (((("longitude" >= '-88.5'::numeric) AND ("longitude" <= '-79.0'::numeric)) OR ("longitude" IS NULL)))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "query" "text" NOT NULL,
    "results_count" integer,
    "clicked_result_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."search_logs" OWNER TO "postgres";


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
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."user_legal_acceptance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_plans" (
    "user_id" "uuid" NOT NULL,
    "plan_type" "text" DEFAULT 'free'::"text" NOT NULL,
    "downloads_this_month" integer DEFAULT 0,
    "downloads_limit" integer DEFAULT 10,
    "api_calls_this_month" integer DEFAULT 0,
    "reset_at" timestamp with time zone DEFAULT ("date_trunc"('month'::"text", "now"()) + '1 mon'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_plans_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text"])))
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


CREATE TABLE IF NOT EXISTS "public"."utilities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "address_id" "uuid",
    "utility_code" character varying(50) NOT NULL,
    "service_type" character varying(50) NOT NULL,
    "provider_name" character varying(255),
    "account_number" character varying(50),
    "rate_schedule" character varying(100),
    "meter_number" character varying(50),
    "service_start_date" "date",
    "autopay" boolean DEFAULT false,
    "priority_capacity" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."utilities" OWNER TO "postgres";


ALTER TABLE ONLY "public"."county_resources" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."county_resources_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."external_api_data_fields" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."external_api_data_fields_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fdot_parcels_hist" ALTER COLUMN "parcel_id" SET DEFAULT "nextval"('"public"."fdot_parcels_hist_parcel_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fdot_parcels_latest" ALTER COLUMN "parcel_id" SET DEFAULT "nextval"('"public"."fdot_parcels_latest_parcel_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fl_counties" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fl_counties_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."property_data_points" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."property_data_points_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ref_pp_category" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ref_pp_category_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ref_pp_condition" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ref_pp_condition_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ref_pp_depreciation_method" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ref_pp_depreciation_method_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ref_pp_status" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ref_pp_status_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ref_resource_type" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ref_resource_type_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."accessory_structures"
    ADD CONSTRAINT "accessory_structures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accessory_structures"
    ADD CONSTRAINT "accessory_structures_structure_code_key" UNIQUE ("structure_code");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buildings"
    ADD CONSTRAINT "buildings_building_code_key" UNIQUE ("building_code");



ALTER TABLE ONLY "public"."buildings"
    ADD CONSTRAINT "buildings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_claim_code_key" UNIQUE ("claim_code");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("claim_id");



ALTER TABLE ONLY "public"."county_resources"
    ADD CONSTRAINT "county_resources_county_id_resource_type_id_key" UNIQUE ("county_id", "resource_type_id");



ALTER TABLE ONLY "public"."county_resources"
    ADD CONSTRAINT "county_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."county_sources"
    ADD CONSTRAINT "county_sources_pkey" PRIMARY KEY ("county_fips");



ALTER TABLE ONLY "public"."coverage_details"
    ADD CONSTRAINT "coverage_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crawler_logs"
    ADD CONSTRAINT "crawler_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."development_potential"
    ADD CONSTRAINT "development_potential_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documentation_records"
    ADD CONSTRAINT "documentation_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."easements_rights"
    ADD CONSTRAINT "easements_rights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_equipment_code_key" UNIQUE ("equipment_code");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_api_data_fields"
    ADD CONSTRAINT "external_api_data_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fdot_parcels_hist"
    ADD CONSTRAINT "fdot_parcels_hist_pk" PRIMARY KEY ("parcelno", "asmnt_yr");



ALTER TABLE ONLY "public"."fdot_parcels_latest"
    ADD CONSTRAINT "fdot_parcels_latest_parcelno_key" UNIQUE ("parcelno");



ALTER TABLE ONLY "public"."fdot_parcels_latest"
    ADD CONSTRAINT "fdot_parcels_latest_pkey" PRIMARY KEY ("parcel_id");



ALTER TABLE ONLY "public"."fdot_parcels"
    ADD CONSTRAINT "fdot_parcels_pkey" PRIMARY KEY ("objectid");



ALTER TABLE ONLY "public"."financial_tax_records"
    ADD CONSTRAINT "financial_tax_records_parcel_id_fiscal_year_key" UNIQUE ("parcel_id", "fiscal_year");



ALTER TABLE ONLY "public"."financial_tax_records"
    ADD CONSTRAINT "financial_tax_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_county_name_key" UNIQUE ("county_name");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_fips5_key" UNIQUE ("fips5");



ALTER TABLE ONLY "public"."fl_counties"
    ADD CONSTRAINT "fl_counties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."floors"
    ADD CONSTRAINT "floors_floor_code_key" UNIQUE ("floor_code");



ALTER TABLE ONLY "public"."floors"
    ADD CONSTRAINT "floors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forms_clauses"
    ADD CONSTRAINT "forms_clauses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forms_embeddings"
    ADD CONSTRAINT "forms_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_filing_id_key" UNIQUE ("filing_id");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_pdf_sha256_key" UNIQUE ("pdf_sha256");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hoa_poa"
    ADD CONSTRAINT "hoa_poa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_systems"
    ADD CONSTRAINT "home_systems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."home_systems"
    ADD CONSTRAINT "home_systems_system_code_key" UNIQUE ("system_code");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_policy_code_version_path_key" UNIQUE ("policy_code", "version_path");



ALTER TABLE ONLY "public"."land_use_zoning"
    ADD CONSTRAINT "land_use_zoning_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_documents"
    ADD CONSTRAINT "legal_documents_slug_version_key" UNIQUE ("slug", "version");



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operations_maintenance"
    ADD CONSTRAINT "operations_maintenance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_strap_pid_key" UNIQUE ("strap_pid");



ALTER TABLE ONLY "public"."permit_status_history"
    ADD CONSTRAINT "permit_status_history_pkey" PRIMARY KEY ("history_id");



ALTER TABLE ONLY "public"."permits_approvals"
    ADD CONSTRAINT "permits_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permits"
    ADD CONSTRAINT "permits_county_fips_permit_number_key" UNIQUE ("county_fips", "permit_number");



ALTER TABLE ONLY "public"."permits"
    ADD CONSTRAINT "permits_pkey" PRIMARY KEY ("permit_id");



ALTER TABLE ONLY "public"."personal_property"
    ADD CONSTRAINT "personal_property_item_code_key" UNIQUE ("item_code");



ALTER TABLE ONLY "public"."personal_property"
    ADD CONSTRAINT "personal_property_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."physical_sites"
    ADD CONSTRAINT "physical_sites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_forms"
    ADD CONSTRAINT "policy_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_change_log"
    ADD CONSTRAINT "pp_change_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_documents"
    ADD CONSTRAINT "pp_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_insurance_link"
    ADD CONSTRAINT "pp_insurance_link_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_insurance_link"
    ADD CONSTRAINT "pp_insurance_link_pp_id_policy_id_key" UNIQUE ("pp_id", "policy_id");



ALTER TABLE ONLY "public"."pp_location_hist"
    ADD CONSTRAINT "pp_location_hist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_maintenance"
    ADD CONSTRAINT "pp_maintenance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_photos"
    ADD CONSTRAINT "pp_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_telematics"
    ADD CONSTRAINT "pp_telematics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_valuation_hist"
    ADD CONSTRAINT "pp_valuation_hist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pp_valuation_hist"
    ADD CONSTRAINT "pp_valuation_hist_pp_id_valuation_date_key" UNIQUE ("pp_id", "valuation_date");



ALTER TABLE ONLY "public"."pp_warranty"
    ADD CONSTRAINT "pp_warranty_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_user_id_parcel_id_key" UNIQUE ("user_id", "parcel_id");



ALTER TABLE ONLY "public"."property_data_points"
    ADD CONSTRAINT "property_data_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_data_points"
    ADD CONSTRAINT "property_data_points_point_code_key" UNIQUE ("point_code");



ALTER TABLE ONLY "public"."ref_pp_category"
    ADD CONSTRAINT "ref_pp_category_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ref_pp_category"
    ADD CONSTRAINT "ref_pp_category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_pp_condition"
    ADD CONSTRAINT "ref_pp_condition_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ref_pp_condition"
    ADD CONSTRAINT "ref_pp_condition_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_pp_depreciation_method"
    ADD CONSTRAINT "ref_pp_depreciation_method_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ref_pp_depreciation_method"
    ADD CONSTRAINT "ref_pp_depreciation_method_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_pp_status"
    ADD CONSTRAINT "ref_pp_status_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ref_pp_status"
    ADD CONSTRAINT "ref_pp_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_resource_type"
    ADD CONSTRAINT "ref_resource_type_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ref_resource_type"
    ADD CONSTRAINT "ref_resource_type_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_room_code_key" UNIQUE ("room_code");



ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_logs"
    ADD CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_questions"
    ADD CONSTRAINT "security_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_questions"
    ADD CONSTRAINT "security_questions_question_key" UNIQUE ("question");



ALTER TABLE ONLY "public"."forms_clauses"
    ADD CONSTRAINT "unique_form_clause" UNIQUE ("form_id", "clause_number");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "unique_form_version" UNIQUE ("form_number", "edition_date", "company");



ALTER TABLE ONLY "public"."user_legal_acceptance"
    ADD CONSTRAINT "user_legal_acceptance_pkey" PRIMARY KEY ("user_id", "legal_id");



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_security_answers"
    ADD CONSTRAINT "user_security_answers_user_id_question_id_key" UNIQUE ("user_id", "question_id");



ALTER TABLE ONLY "public"."utilities"
    ADD CONSTRAINT "utilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."utilities"
    ADD CONSTRAINT "utilities_utility_code_key" UNIQUE ("utility_code");



CREATE INDEX "fdot_parcels_geom_idx" ON "public"."fdot_parcels" USING "gist" ("geom");



CREATE INDEX "fdot_parcels_hist_geom_idx" ON "public"."fdot_parcels_hist" USING "gist" ("geom");



CREATE INDEX "fdot_parcels_hist_load_idx" ON "public"."fdot_parcels_hist" USING "btree" ("load_ts");



CREATE INDEX "fdot_parcels_latest_geom_idx" ON "public"."fdot_parcels_latest" USING "gist" ("geom");



CREATE INDEX "fdot_parcels_latest_owner_idx" ON "public"."fdot_parcels_latest" USING "btree" ("own_name");



CREATE INDEX "fdot_parcels_latest_year_idx" ON "public"."fdot_parcels_latest" USING "btree" ("asmnt_yr");



CREATE INDEX "idx_acc_struct_location" ON "public"."accessory_structures" USING "gist" ("location");



CREATE INDEX "idx_acc_struct_parcel" ON "public"."accessory_structures" USING "btree" ("parcel_id");



CREATE INDEX "idx_addresses_county_id" ON "public"."addresses" USING "btree" ("county_id");



CREATE INDEX "idx_addresses_geom" ON "public"."addresses" USING "gist" ("geom");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_ip" ON "public"."audit_logs" USING "btree" ("ip_address");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_buildings_address" ON "public"."buildings" USING "btree" ("address_id");



CREATE INDEX "idx_buildings_location" ON "public"."buildings" USING "gist" ("location");



CREATE INDEX "idx_buildings_parcel" ON "public"."buildings" USING "btree" ("parcel_id");



CREATE INDEX "idx_claims_date" ON "public"."claims" USING "btree" ("date_of_loss");



CREATE INDEX "idx_claims_policy" ON "public"."claims" USING "btree" ("policy_id");



CREATE INDEX "idx_clauses_text_fts" ON "public"."forms_clauses" USING "gin" ("to_tsvector"('"english"'::"regconfig", "text_content"));



CREATE INDEX "idx_embeddings_vector" ON "public"."forms_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_equipment_location" ON "public"."equipment" USING "gist" ("location");



CREATE INDEX "idx_equipment_system" ON "public"."equipment" USING "btree" ("system_id");



CREATE INDEX "idx_financial_tax_year" ON "public"."financial_tax_records" USING "btree" ("parcel_id", "fiscal_year");



CREATE INDEX "idx_floors_building" ON "public"."floors" USING "btree" ("building_id");



CREATE INDEX "idx_forms_company" ON "public"."forms" USING "btree" ("company");



CREATE INDEX "idx_forms_edition_date" ON "public"."forms" USING "btree" ("edition_date" DESC);



CREATE INDEX "idx_forms_form_number" ON "public"."forms" USING "btree" ("form_number");



CREATE INDEX "idx_forms_line_of_business" ON "public"."forms" USING "btree" ("line_of_business");



CREATE INDEX "idx_forms_pdf_sha256" ON "public"."forms" USING "btree" ("pdf_sha256");



CREATE INDEX "idx_forms_title_fts" ON "public"."forms" USING "gin" ("to_tsvector"('"english"'::"regconfig", "title"));



CREATE INDEX "idx_insurance_current" ON "public"."insurance_policies" USING "btree" ("parcel_id", "is_current") WHERE "is_current";



CREATE INDEX "idx_legal_documents_effective_date" ON "public"."legal_documents" USING "btree" ("effective_date" DESC);



CREATE INDEX "idx_legal_documents_slug_active" ON "public"."legal_documents" USING "btree" ("slug", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_login_activity_created_at" ON "public"."login_activity" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_login_activity_user_created" ON "public"."login_activity" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_login_activity_user_id" ON "public"."login_activity" USING "btree" ("user_id");



CREATE INDEX "idx_parcels_county_id" ON "public"."parcels" USING "btree" ("county_id");



CREATE INDEX "idx_parcels_location" ON "public"."parcels" USING "gist" ("location");



CREATE INDEX "idx_personal_property_room" ON "public"."personal_property" USING "btree" ("room_id");



CREATE INDEX "idx_physical_sites_county_id" ON "public"."physical_sites" USING "btree" ("county_id");



CREATE INDEX "idx_physical_sites_location" ON "public"."physical_sites" USING "gist" ("site_location");



CREATE INDEX "idx_pp_room" ON "public"."personal_property" USING "btree" ("room_id");



CREATE INDEX "idx_rooms_building" ON "public"."rooms" USING "btree" ("building_id");



CREATE INDEX "idx_rooms_floor" ON "public"."rooms" USING "btree" ("floor_id");



CREATE INDEX "idx_rooms_location" ON "public"."rooms" USING "gist" ("location");



CREATE INDEX "idx_security_logs_action" ON "public"."security_logs" USING "btree" ("action");



CREATE INDEX "idx_security_logs_created_at" ON "public"."security_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_security_logs_ip" ON "public"."security_logs" USING "btree" ("ip_address");



CREATE INDEX "idx_security_logs_user_id" ON "public"."security_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_legal_acceptance_accepted_at" ON "public"."user_legal_acceptance" USING "btree" ("accepted_at" DESC);



CREATE INDEX "idx_user_legal_acceptance_user_id" ON "public"."user_legal_acceptance" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_id" ON "public"."user_profiles" USING "btree" ("id");



CREATE INDEX "idx_user_security_answers_question_id" ON "public"."user_security_answers" USING "btree" ("question_id");



CREATE INDEX "idx_user_security_answers_user_id" ON "public"."user_security_answers" USING "btree" ("user_id");



CREATE INDEX "idx_utilities_address" ON "public"."utilities" USING "btree" ("address_id");



CREATE INDEX "idx_utilities_parcel" ON "public"."utilities" USING "btree" ("parcel_id");



CREATE OR REPLACE TRIGGER "forms_updated_at" BEFORE UPDATE ON "public"."forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "on_profile_updated" AFTER UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_profile_update"();



CREATE OR REPLACE TRIGGER "set_accessory_structures_updated" BEFORE UPDATE ON "public"."accessory_structures" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_addresses_updated" BEFORE UPDATE ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_buildings_updated" BEFORE UPDATE ON "public"."buildings" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_claims_updated" BEFORE UPDATE ON "public"."claims" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_development_potential_updated" BEFORE UPDATE ON "public"."development_potential" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_easements_rights_updated" BEFORE UPDATE ON "public"."easements_rights" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_equipment_updated" BEFORE UPDATE ON "public"."equipment" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_financial_tax_records_updated" BEFORE UPDATE ON "public"."financial_tax_records" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_floors_updated" BEFORE UPDATE ON "public"."floors" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_forms_updated" BEFORE UPDATE ON "public"."forms" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_hoa_poa_updated" BEFORE UPDATE ON "public"."hoa_poa" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_home_systems_updated" BEFORE UPDATE ON "public"."home_systems" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_insurance_policies_updated" BEFORE UPDATE ON "public"."insurance_policies" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_land_use_zoning_updated" BEFORE UPDATE ON "public"."land_use_zoning" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_operations_maintenance_updated" BEFORE UPDATE ON "public"."operations_maintenance" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_parcels_updated" BEFORE UPDATE ON "public"."parcels" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_permits_approvals_updated" BEFORE UPDATE ON "public"."permits_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_personal_property_updated" BEFORE UPDATE ON "public"."personal_property" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_physical_sites_updated" BEFORE UPDATE ON "public"."physical_sites" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_rooms_updated" BEFORE UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_user_plans_updated" BEFORE UPDATE ON "public"."user_plans" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_utilities_updated" BEFORE UPDATE ON "public"."utilities" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_prevent_backdating" BEFORE INSERT OR UPDATE ON "public"."legal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_backdating"();



CREATE OR REPLACE TRIGGER "trigger_update_legal_documents_updated_at" BEFORE UPDATE ON "public"."legal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "user_plans_updated_at" BEFORE UPDATE ON "public"."user_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."accessory_structures"
    ADD CONSTRAINT "accessory_structures_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."accessory_structures"
    ADD CONSTRAINT "accessory_structures_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_county_fk" FOREIGN KEY ("county_id") REFERENCES "public"."fl_counties"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buildings"
    ADD CONSTRAINT "buildings_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."buildings"
    ADD CONSTRAINT "buildings_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."insurance_policies"("id");



ALTER TABLE ONLY "public"."county_resources"
    ADD CONSTRAINT "county_resources_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."fl_counties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."county_resources"
    ADD CONSTRAINT "county_resources_resource_type_id_fkey" FOREIGN KEY ("resource_type_id") REFERENCES "public"."ref_resource_type"("id");



ALTER TABLE ONLY "public"."coverage_details"
    ADD CONSTRAINT "coverage_details_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."insurance_policies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."development_potential"
    ADD CONSTRAINT "development_potential_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documentation_records"
    ADD CONSTRAINT "documentation_records_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."easements_rights"
    ADD CONSTRAINT "easements_rights_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."home_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_tax_records"
    ADD CONSTRAINT "financial_tax_records_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."floors"
    ADD CONSTRAINT "floors_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forms_clauses"
    ADD CONSTRAINT "forms_clauses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forms_embeddings"
    ADD CONSTRAINT "forms_embeddings_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "public"."forms_clauses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hoa_poa"
    ADD CONSTRAINT "hoa_poa_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."hoa_poa"
    ADD CONSTRAINT "hoa_poa_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."home_systems"
    ADD CONSTRAINT "home_systems_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."land_use_zoning"
    ADD CONSTRAINT "land_use_zoning_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."login_activity"
    ADD CONSTRAINT "login_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operations_maintenance"
    ADD CONSTRAINT "operations_maintenance_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_county_fk" FOREIGN KEY ("county_id") REFERENCES "public"."fl_counties"("id");



ALTER TABLE ONLY "public"."permit_status_history"
    ADD CONSTRAINT "permit_status_history_permit_id_fkey" FOREIGN KEY ("permit_id") REFERENCES "public"."permits"("permit_id");



ALTER TABLE ONLY "public"."permits_approvals"
    ADD CONSTRAINT "permits_approvals_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."permits"
    ADD CONSTRAINT "permits_county_fips_fkey" FOREIGN KEY ("county_fips") REFERENCES "public"."county_sources"("county_fips");



ALTER TABLE ONLY "public"."personal_property"
    ADD CONSTRAINT "personal_property_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."physical_sites"
    ADD CONSTRAINT "physical_sites_county_fk" FOREIGN KEY ("county_id") REFERENCES "public"."fl_counties"("id");



ALTER TABLE ONLY "public"."physical_sites"
    ADD CONSTRAINT "physical_sites_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_change_log"
    ADD CONSTRAINT "pp_change_log_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_documents"
    ADD CONSTRAINT "pp_documents_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_insurance_link"
    ADD CONSTRAINT "pp_insurance_link_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."insurance_policies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_insurance_link"
    ADD CONSTRAINT "pp_insurance_link_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_location_hist"
    ADD CONSTRAINT "pp_location_hist_from_room_id_fkey" FOREIGN KEY ("from_room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."pp_location_hist"
    ADD CONSTRAINT "pp_location_hist_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_location_hist"
    ADD CONSTRAINT "pp_location_hist_to_room_id_fkey" FOREIGN KEY ("to_room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."pp_maintenance"
    ADD CONSTRAINT "pp_maintenance_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_photos"
    ADD CONSTRAINT "pp_photos_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_telematics"
    ADD CONSTRAINT "pp_telematics_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_valuation_hist"
    ADD CONSTRAINT "pp_valuation_hist_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pp_warranty"
    ADD CONSTRAINT "pp_warranty_pp_id_fkey" FOREIGN KEY ("pp_id") REFERENCES "public"."personal_property"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "search_logs_clicked_result_id_fkey" FOREIGN KEY ("clicked_result_id") REFERENCES "public"."forms"("id");



ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



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



ALTER TABLE ONLY "public"."utilities"
    ADD CONSTRAINT "utilities_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."utilities"
    ADD CONSTRAINT "utilities_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



CREATE POLICY "Form clauses are viewable by everyone" ON "public"."forms_clauses" FOR SELECT USING (true);



CREATE POLICY "Forms are viewable by everyone" ON "public"."forms" FOR SELECT USING (true);



CREATE POLICY "Legal documents are viewable by everyone" ON "public"."legal_documents" FOR SELECT USING (true);



CREATE POLICY "Only admins can view crawler logs" ON "public"."crawler_logs" USING ("public"."is_admin"());



CREATE POLICY "Security questions are viewable by everyone" ON "public"."security_questions" FOR SELECT USING (true);



CREATE POLICY "Service role can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can insert security logs" ON "public"."security_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can delete own properties" ON "public"."properties" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own security answers" ON "public"."user_security_answers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own legal acceptances" ON "public"."user_legal_acceptance" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own properties" ON "public"."properties" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own search logs" ON "public"."search_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own security answers" ON "public"."user_security_answers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own properties" ON "public"."properties" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own security answers" ON "public"."user_security_answers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own legal acceptances" ON "public"."user_legal_acceptance" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own plan" ON "public"."user_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own properties" ON "public"."properties" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own search logs" ON "public"."search_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own security answers" ON "public"."user_security_answers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own login activity" ON "public"."login_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."accessory_structures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buildings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."county_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coverage_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crawler_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."development_potential" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documentation_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."easements_rights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "etl_rw" ON "public"."policy_forms" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."fdot_parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_tax_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."floors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forms_clauses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forms_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hoa_poa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."home_systems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."land_use_zoning" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."operations_maintenance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parcel read access" ON "public"."parcels" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."property_access"
  WHERE (("property_access"."parcel_id" = "parcels"."id") AND ("property_access"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permit_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permits_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_property" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."physical_sites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_change_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_insurance_link" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_location_hist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_maintenance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_telematics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_valuation_hist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pp_warranty" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_legal_acceptance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_security_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."utilities" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "anon";
GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fdot_merge_stage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fdot_stage_insert_one"("j" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."legal_documents" TO "anon";
GRANT ALL ON TABLE "public"."legal_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_documents" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_legal_documents"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_embedding"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_embedding"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_embedding"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_form_pdf"("form_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_form_pdf"("form_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_form_pdf"("form_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_profile_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_login_activity"("p_user_id" "uuid", "p_ip_address" "text", "p_user_agent" "text", "p_success" boolean, "p_failure_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_action"("p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."needs_reaccept"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."needs_reaccept"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."needs_reaccept"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_backdating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_legal_acceptance"("p_user_id" "uuid", "p_legal_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text", "p_signature_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_forms"("query_text" "text", "limit_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_forms"("query_text" "text", "limit_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_forms"("query_text" "text", "limit_results" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."accessory_structures" TO "anon";
GRANT ALL ON TABLE "public"."accessory_structures" TO "authenticated";
GRANT ALL ON TABLE "public"."accessory_structures" TO "service_role";



GRANT ALL ON TABLE "public"."insurance_policies" TO "anon";
GRANT ALL ON TABLE "public"."insurance_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."insurance_policies" TO "service_role";



GRANT ALL ON TABLE "public"."parcels" TO "anon";
GRANT ALL ON TABLE "public"."parcels" TO "authenticated";
GRANT ALL ON TABLE "public"."parcels" TO "service_role";



GRANT ALL ON TABLE "public"."active_insurance" TO "anon";
GRANT ALL ON TABLE "public"."active_insurance" TO "authenticated";
GRANT ALL ON TABLE "public"."active_insurance" TO "service_role";



GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."buildings" TO "anon";
GRANT ALL ON TABLE "public"."buildings" TO "authenticated";
GRANT ALL ON TABLE "public"."buildings" TO "service_role";



GRANT ALL ON TABLE "public"."claims" TO "anon";
GRANT ALL ON TABLE "public"."claims" TO "authenticated";
GRANT ALL ON TABLE "public"."claims" TO "service_role";



GRANT ALL ON TABLE "public"."county_resources" TO "anon";
GRANT ALL ON TABLE "public"."county_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."county_resources" TO "service_role";



GRANT ALL ON SEQUENCE "public"."county_resources_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."county_resources_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."county_resources_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."county_sources" TO "anon";
GRANT ALL ON TABLE "public"."county_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."county_sources" TO "service_role";



GRANT ALL ON TABLE "public"."coverage_details" TO "anon";
GRANT ALL ON TABLE "public"."coverage_details" TO "authenticated";
GRANT ALL ON TABLE "public"."coverage_details" TO "service_role";



GRANT ALL ON TABLE "public"."crawler_logs" TO "anon";
GRANT ALL ON TABLE "public"."crawler_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."crawler_logs" TO "service_role";



GRANT ALL ON TABLE "public"."development_potential" TO "anon";
GRANT ALL ON TABLE "public"."development_potential" TO "authenticated";
GRANT ALL ON TABLE "public"."development_potential" TO "service_role";



GRANT ALL ON TABLE "public"."documentation_records" TO "anon";
GRANT ALL ON TABLE "public"."documentation_records" TO "authenticated";
GRANT ALL ON TABLE "public"."documentation_records" TO "service_role";



GRANT ALL ON TABLE "public"."easements_rights" TO "anon";
GRANT ALL ON TABLE "public"."easements_rights" TO "authenticated";
GRANT ALL ON TABLE "public"."easements_rights" TO "service_role";



GRANT ALL ON TABLE "public"."equipment" TO "anon";
GRANT ALL ON TABLE "public"."equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment" TO "service_role";



GRANT ALL ON TABLE "public"."home_systems" TO "anon";
GRANT ALL ON TABLE "public"."home_systems" TO "authenticated";
GRANT ALL ON TABLE "public"."home_systems" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_maintenance_schedule" TO "anon";
GRANT ALL ON TABLE "public"."equipment_maintenance_schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_maintenance_schedule" TO "service_role";



GRANT ALL ON TABLE "public"."external_api_data_fields" TO "anon";
GRANT ALL ON TABLE "public"."external_api_data_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."external_api_data_fields" TO "service_role";



GRANT ALL ON SEQUENCE "public"."external_api_data_fields_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."external_api_data_fields_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."external_api_data_fields_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fdot_parcels" TO "anon";
GRANT ALL ON TABLE "public"."fdot_parcels" TO "authenticated";
GRANT ALL ON TABLE "public"."fdot_parcels" TO "service_role";



GRANT ALL ON TABLE "public"."fdot_parcels_hist" TO "anon";
GRANT ALL ON TABLE "public"."fdot_parcels_hist" TO "authenticated";
GRANT ALL ON TABLE "public"."fdot_parcels_hist" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fdot_parcels_hist_parcel_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fdot_parcels_hist_parcel_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fdot_parcels_hist_parcel_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fdot_parcels_latest" TO "anon";
GRANT ALL ON TABLE "public"."fdot_parcels_latest" TO "authenticated";
GRANT ALL ON TABLE "public"."fdot_parcels_latest" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fdot_parcels_latest_parcel_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fdot_parcels_latest_parcel_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fdot_parcels_latest_parcel_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."financial_tax_records" TO "anon";
GRANT ALL ON TABLE "public"."financial_tax_records" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_tax_records" TO "service_role";



GRANT ALL ON TABLE "public"."fl_counties" TO "anon";
GRANT ALL ON TABLE "public"."fl_counties" TO "authenticated";
GRANT ALL ON TABLE "public"."fl_counties" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fl_counties_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fl_counties_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fl_counties_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."floors" TO "anon";
GRANT ALL ON TABLE "public"."floors" TO "authenticated";
GRANT ALL ON TABLE "public"."floors" TO "service_role";



GRANT ALL ON TABLE "public"."forms" TO "anon";
GRANT ALL ON TABLE "public"."forms" TO "authenticated";
GRANT ALL ON TABLE "public"."forms" TO "service_role";



GRANT ALL ON TABLE "public"."forms_clauses" TO "anon";
GRANT ALL ON TABLE "public"."forms_clauses" TO "authenticated";
GRANT ALL ON TABLE "public"."forms_clauses" TO "service_role";



GRANT ALL ON TABLE "public"."forms_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."forms_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."forms_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."hoa_poa" TO "anon";
GRANT ALL ON TABLE "public"."hoa_poa" TO "authenticated";
GRANT ALL ON TABLE "public"."hoa_poa" TO "service_role";



GRANT ALL ON TABLE "public"."land_use_zoning" TO "anon";
GRANT ALL ON TABLE "public"."land_use_zoning" TO "authenticated";
GRANT ALL ON TABLE "public"."land_use_zoning" TO "service_role";



GRANT ALL ON TABLE "public"."login_activity" TO "anon";
GRANT ALL ON TABLE "public"."login_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."login_activity" TO "service_role";



GRANT ALL ON TABLE "public"."operations_maintenance" TO "anon";
GRANT ALL ON TABLE "public"."operations_maintenance" TO "authenticated";
GRANT ALL ON TABLE "public"."operations_maintenance" TO "service_role";



GRANT ALL ON TABLE "public"."permit_status_history" TO "anon";
GRANT ALL ON TABLE "public"."permit_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."permit_status_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permit_status_history_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permit_status_history_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permit_status_history_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permits" TO "anon";
GRANT ALL ON TABLE "public"."permits" TO "authenticated";
GRANT ALL ON TABLE "public"."permits" TO "service_role";



GRANT ALL ON TABLE "public"."permits_approvals" TO "anon";
GRANT ALL ON TABLE "public"."permits_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."permits_approvals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permits_permit_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permits_permit_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permits_permit_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."personal_property" TO "anon";
GRANT ALL ON TABLE "public"."personal_property" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_property" TO "service_role";



GRANT ALL ON TABLE "public"."physical_sites" TO "anon";
GRANT ALL ON TABLE "public"."physical_sites" TO "authenticated";
GRANT ALL ON TABLE "public"."physical_sites" TO "service_role";



GRANT ALL ON TABLE "public"."policy_forms" TO "anon";
GRANT ALL ON TABLE "public"."policy_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_forms" TO "service_role";



GRANT ALL ON TABLE "public"."pp_change_log" TO "anon";
GRANT ALL ON TABLE "public"."pp_change_log" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_change_log" TO "service_role";



GRANT ALL ON TABLE "public"."pp_documents" TO "anon";
GRANT ALL ON TABLE "public"."pp_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_documents" TO "service_role";



GRANT ALL ON TABLE "public"."pp_insurance_link" TO "anon";
GRANT ALL ON TABLE "public"."pp_insurance_link" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_insurance_link" TO "service_role";



GRANT ALL ON TABLE "public"."pp_location_hist" TO "anon";
GRANT ALL ON TABLE "public"."pp_location_hist" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_location_hist" TO "service_role";



GRANT ALL ON TABLE "public"."pp_maintenance" TO "anon";
GRANT ALL ON TABLE "public"."pp_maintenance" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_maintenance" TO "service_role";



GRANT ALL ON TABLE "public"."pp_photos" TO "anon";
GRANT ALL ON TABLE "public"."pp_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_photos" TO "service_role";



GRANT ALL ON TABLE "public"."pp_telematics" TO "anon";
GRANT ALL ON TABLE "public"."pp_telematics" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_telematics" TO "service_role";



GRANT ALL ON TABLE "public"."pp_valuation_hist" TO "anon";
GRANT ALL ON TABLE "public"."pp_valuation_hist" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_valuation_hist" TO "service_role";



GRANT ALL ON TABLE "public"."pp_warranty" TO "anon";
GRANT ALL ON TABLE "public"."pp_warranty" TO "authenticated";
GRANT ALL ON TABLE "public"."pp_warranty" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_access" TO "anon";
GRANT ALL ON TABLE "public"."property_access" TO "authenticated";
GRANT ALL ON TABLE "public"."property_access" TO "service_role";



GRANT ALL ON TABLE "public"."property_data_points" TO "anon";
GRANT ALL ON TABLE "public"."property_data_points" TO "authenticated";
GRANT ALL ON TABLE "public"."property_data_points" TO "service_role";



GRANT ALL ON SEQUENCE "public"."property_data_points_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."property_data_points_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."property_data_points_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."property_overview" TO "anon";
GRANT ALL ON TABLE "public"."property_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."property_overview" TO "service_role";



GRANT ALL ON TABLE "public"."recent_login_activity" TO "anon";
GRANT ALL ON TABLE "public"."recent_login_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_login_activity" TO "service_role";



GRANT ALL ON TABLE "public"."ref_pp_category" TO "anon";
GRANT ALL ON TABLE "public"."ref_pp_category" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_pp_category" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ref_pp_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ref_pp_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ref_pp_category_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ref_pp_condition" TO "anon";
GRANT ALL ON TABLE "public"."ref_pp_condition" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_pp_condition" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ref_pp_condition_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ref_pp_condition_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ref_pp_condition_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ref_pp_depreciation_method" TO "anon";
GRANT ALL ON TABLE "public"."ref_pp_depreciation_method" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_pp_depreciation_method" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ref_pp_depreciation_method_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ref_pp_depreciation_method_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ref_pp_depreciation_method_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ref_pp_status" TO "anon";
GRANT ALL ON TABLE "public"."ref_pp_status" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_pp_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ref_pp_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ref_pp_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ref_pp_status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ref_resource_type" TO "anon";
GRANT ALL ON TABLE "public"."ref_resource_type" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_resource_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ref_resource_type_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ref_resource_type_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ref_resource_type_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."search_logs" TO "anon";
GRANT ALL ON TABLE "public"."search_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."search_logs" TO "service_role";



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



GRANT ALL ON TABLE "public"."utilities" TO "anon";
GRANT ALL ON TABLE "public"."utilities" TO "authenticated";
GRANT ALL ON TABLE "public"."utilities" TO "service_role";



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
