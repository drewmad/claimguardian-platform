--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: claim_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.claim_status AS ENUM (
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


--
-- Name: consent_action_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.consent_action_type AS ENUM (
    'accepted',
    'declined',
    'withdrawn',
    'updated',
    'rejected'
);


--
-- Name: damage_severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.damage_severity AS ENUM (
    'minor',
    'moderate',
    'major',
    'severe',
    'total_loss'
);


--
-- Name: item_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.item_category AS ENUM (
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


--
-- Name: legal_document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.legal_document_type AS ENUM (
    'privacy_policy',
    'terms_of_service',
    'ai_use_agreement',
    'cookie_policy',
    'data_processing_agreement'
);


--
-- Name: occupancy_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.occupancy_status AS ENUM (
    'owner_occupied',
    'tenant_occupied',
    'vacant',
    'seasonal'
);


--
-- Name: property_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.property_type AS ENUM (
    'single_family',
    'condo',
    'townhouse',
    'mobile_home',
    'multi_family',
    'commercial',
    'vacant_land'
);


--
-- Name: admin_get_user_usage_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_user_usage_stats(target_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_metadata JSONB;
  stats JSONB;
  current_tier TEXT;
BEGIN
  -- Check admin permissions or self-access
  IF target_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'role' = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Admin access required or access own stats only';
  END IF;

  -- Get user metadata
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO user_metadata
  FROM auth.users
  WHERE id = target_user_id;

  current_tier := COALESCE(user_metadata->>'subscription_tier', 'free');

  -- Build usage statistics
  stats := jsonb_build_object(
    'user_id', target_user_id,
    'subscription_tier', current_tier,
    'user_type', COALESCE(user_metadata->>'user_type', 'homeowner'),
    'ai_analyses_this_month', (
      SELECT count(*) FROM ai_analysis 
      WHERE user_id = target_user_id 
      AND created_at > NOW() - INTERVAL '1 month'
    ),
    'ai_analyses_total', (
      SELECT count(*) FROM ai_analysis 
      WHERE user_id = target_user_id
    ),
    'file_uploads_this_month', (
      SELECT count(*) FROM file_uploads 
      WHERE user_id = target_user_id 
      AND created_at > NOW() - INTERVAL '1 month'
    ),
    'total_properties', (
      SELECT count(*) FROM properties 
      WHERE user_id = target_user_id
    ),
    'active_claims', (
      SELECT count(*) FROM claims 
      WHERE user_id = target_user_id 
      AND status NOT IN ('closed', 'settled', 'denied')
    ),
    'total_claims', (
      SELECT count(*) FROM claims 
      WHERE user_id = target_user_id
    ),
    'limits_based_on_tier', 
    CASE current_tier
      WHEN 'free' THEN jsonb_build_object(
        'ai_analyses_per_month', 5,
        'file_uploads_per_month', 10,
        'max_file_size_mb', 5,
        'max_properties', 1,
        'max_active_claims', 2
      )
      WHEN 'pro' THEN jsonb_build_object(
        'ai_analyses_per_month', 100,
        'file_uploads_per_month', 100,
        'max_file_size_mb', 25,
        'max_properties', 5,
        'max_active_claims', 10
      )
      ELSE jsonb_build_object(
        'ai_analyses_per_month', 'unlimited',
        'file_uploads_per_month', 'unlimited',
        'max_file_size_mb', 100,
        'max_properties', 'unlimited',
        'max_active_claims', 'unlimited'
      )
    END
  );

  RETURN stats;
END;
$$;


--
-- Name: admin_set_user_subscription(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_set_user_subscription(target_user_id uuid, new_tier text, reason text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  old_metadata JSONB;
  new_metadata JSONB;
  old_tier TEXT;
BEGIN
  -- Check admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'role' = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Admin access required';
  END IF;

  -- Validate tier
  IF new_tier NOT IN ('free', 'pro', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid subscription tier: %', new_tier;
  END IF;

  -- Get current metadata
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO old_metadata
  FROM auth.users
  WHERE id = target_user_id;

  old_tier := old_metadata->>'subscription_tier';

  -- Build new metadata with updated tier and permissions
  new_metadata := old_metadata || jsonb_build_object(
    'subscription_tier', new_tier,
    'tier_updated_at', NOW()::text,
    'tier_updated_by', auth.uid()::text,
    'permissions', 
    CASE new_tier
      WHEN 'free' THEN jsonb_build_array('basic_claims', 'basic_analysis')
      WHEN 'pro' THEN jsonb_build_array('basic_claims', 'basic_analysis', 'ai_analysis', 'bulk_upload', 'premium_support')
      WHEN 'enterprise' THEN jsonb_build_array('basic_claims', 'basic_analysis', 'ai_analysis', 'bulk_upload', 'premium_support', 'api_access', 'custom_integrations')
    END
  );

  -- Update user metadata
  UPDATE auth.users
  SET raw_app_meta_data = new_metadata,
      updated_at = NOW()
  WHERE id = target_user_id;

  -- Log the tier change
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_by
  ) VALUES (
    target_user_id,
    'subscription_tier_changed',
    'user_subscription',
    target_user_id,
    jsonb_build_object(
      'old_tier', old_tier,
      'new_tier', new_tier,
      'reason', reason
    ),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_tier', old_tier,
    'new_tier', new_tier,
    'user_id', target_user_id
  );
END;
$$;


--
-- Name: admin_set_user_type(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_set_user_type(target_user_id uuid, new_user_type text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  old_metadata JSONB;
  new_metadata JSONB;
  old_user_type TEXT;
BEGIN
  -- Check admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'role' = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Admin access required';
  END IF;

  -- Validate user type
  IF new_user_type NOT IN ('homeowner', 'renter', 'landlord', 'contractor', 'adjuster', 'agent') THEN
    RAISE EXCEPTION 'Invalid user type: %', new_user_type;
  END IF;

  -- Get current metadata
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO old_metadata
  FROM auth.users
  WHERE id = target_user_id;

  old_user_type := old_metadata->>'user_type';

  -- Update metadata
  new_metadata := old_metadata || jsonb_build_object(
    'user_type', new_user_type,
    'user_type_updated_at', NOW()::text,
    'user_type_updated_by', auth.uid()::text
  );

  UPDATE auth.users
  SET raw_app_meta_data = new_metadata,
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'old_user_type', old_user_type,
    'new_user_type', new_user_type,
    'user_id', target_user_id
  );
END;
$$;


--
-- Name: audit_and_version(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_and_version() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  history_table TEXT;
  insert_query TEXT;
BEGIN
  history_table := TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME || '_history';
  
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    -- Check if history table exists before trying to insert
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = TG_TABLE_SCHEMA 
        AND table_name = TG_TABLE_NAME || '_history'
    ) THEN
        insert_query := format(
          'INSERT INTO %s SELECT $1.*, NOW() as archived_at, %L as operation',
          history_table,
          TG_OP
        );
        
        BEGIN
            EXECUTE insert_query USING OLD;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log warning but don't fail the original operation
                RAISE WARNING 'Failed to archive to history table %: %', history_table, SQLERRM;
        END;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$_$;


--
-- Name: capture_signup_data(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.capture_signup_data(p_user_id uuid, p_signup_metadata jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Update user profile with signup metadata
  UPDATE public.profiles
  SET 
    metadata = COALESCE(metadata, '{}'::jsonb) || p_signup_metadata,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;


--
-- Name: check_user_consent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_consent() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_has_consent boolean;
BEGIN
  -- Check if user has a linked consent record
  SELECT EXISTS(
    SELECT 1 FROM public.signup_consents 
    WHERE user_id = NEW.id
  ) INTO v_has_consent;
  
  -- For now, just log a warning if no consent found
  -- In production, you might want to raise an exception
  IF NOT v_has_consent THEN
    RAISE WARNING 'User % created without consent record', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: check_user_permission(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_permission(permission_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_metadata JSONB;
  permissions JSONB;
BEGIN
  -- Get current user metadata
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO user_metadata
  FROM auth.users
  WHERE id = auth.uid();

  -- Get permissions array
  permissions := user_metadata->'permissions';

  -- Check if permission exists in array
  RETURN permissions ? permission_name;
END;
$$;


--
-- Name: cleanup_expired_consents(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_consents() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.signup_consents
  WHERE expires_at < now() - interval '24 hours'
    AND user_id IS NULL;
END;
$$;


--
-- Name: create_user_preferences(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_user_preferences(p_user_id uuid, p_preferences jsonb DEFAULT '{}'::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, preferences, created_at, updated_at)
  VALUES (p_user_id, p_preferences, now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    preferences = EXCLUDED.preferences,
    updated_at = now();
END;
$$;


--
-- Name: get_user_consent_status(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_consent_status(p_user_id uuid) RETURNS TABLE(document_type public.legal_document_type, is_accepted boolean, accepted_version character varying, accepted_at timestamp with time zone, needs_update boolean)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: get_user_metadata(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_metadata(target_user_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_id_to_check UUID;
  metadata JSONB;
BEGIN
  -- Use provided user_id or current user
  user_id_to_check := COALESCE(target_user_id, auth.uid());

  -- Users can only access their own metadata unless they're admin
  IF target_user_id IS NOT NULL AND target_user_id != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() 
      AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'role' = 'super_admin')
    ) THEN
      RAISE EXCEPTION 'Permission denied: Can only access own metadata';
    END IF;
  END IF;

  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO metadata
  FROM auth.users
  WHERE id = user_id_to_check;

  RETURN metadata;
END;
$$;


--
-- Name: get_user_subscription_tier(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_subscription_tier() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_metadata JSONB;
  tier TEXT;
BEGIN
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO user_metadata
  FROM auth.users
  WHERE id = auth.uid();

  tier := user_metadata->>'subscription_tier';
  
  -- Default to 'free' if not set
  RETURN COALESCE(tier, 'free');
END;
$$;


--
-- Name: get_user_type(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_type() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_metadata JSONB;
  user_type TEXT;
BEGIN
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO user_metadata
  FROM auth.users
  WHERE id = auth.uid();

  user_type := user_metadata->>'user_type';
  
  -- Default to 'homeowner' if not set
  RETURN COALESCE(user_type, 'homeowner');
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$;


--
-- Name: handle_new_user_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Create basic profile with just the essential data
    INSERT INTO profiles (
        id,
        full_name,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(
            CASE 
                WHEN NEW.raw_user_meta_data->>'firstName' IS NOT NULL 
                     AND NEW.raw_user_meta_data->>'lastName' IS NOT NULL 
                THEN NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName'
                ELSE NEW.email
            END,
            NEW.email
        ),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Set default app metadata if not already set
    IF NEW.raw_app_meta_data IS NULL OR NEW.raw_app_meta_data = '{}'::jsonb THEN
        UPDATE auth.users
        SET raw_app_meta_data = jsonb_build_object(
            'subscription_tier', 'free',
            'user_type', 'homeowner',
            'permissions', jsonb_build_array('basic_claims', 'basic_analysis'),
            'signup_date', NOW()::text,
            'onboarding_completed', false
        )
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: link_consent_to_user(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.link_consent_to_user(p_user_id uuid, p_email text, p_consent_token text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_consent_record record;
  v_legal_doc_ids jsonb;
BEGIN
  -- Find the consent record with this token
  SELECT * INTO v_consent_record
  FROM signup_consents
  WHERE email = p_email
    AND consent_token = p_consent_token::uuid
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Consent record not found'
    );
  END IF;

  -- Update the signup_consents record with the user_id
  UPDATE signup_consents
  SET user_id = p_user_id
  WHERE id = v_consent_record.id;

  -- Get current legal document IDs
  SELECT jsonb_build_object(
    'terms_of_service', id
  ) INTO v_legal_doc_ids
  FROM legal_documents
  WHERE document_type = 'terms_of_service'
    AND is_current = true
  LIMIT 1;

  -- Insert user consent preferences
  INSERT INTO user_consents (
    id,
    user_id,
    gdpr_consent,
    ccpa_consent,
    marketing_consent,
    data_processing_consent,
    cookie_consent,
    terms_accepted,
    privacy_accepted,
    age_confirmed,
    ai_tools_consent,
    legal_document_versions,
    consent_given_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    v_consent_record.gdpr_consent,
    true, -- Default CCPA to true as it's not in signup_consents
    v_consent_record.marketing_consent,
    v_consent_record.data_processing_consent,
    true, -- Default cookie consent to true
    v_consent_record.terms_accepted,
    v_consent_record.privacy_accepted,
    v_consent_record.age_verified,
    true, -- Default AI tools consent to true
    COALESCE(v_legal_doc_ids, '{}'::jsonb),
    v_consent_record.consent_timestamp,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    gdpr_consent = EXCLUDED.gdpr_consent,
    ccpa_consent = EXCLUDED.ccpa_consent,
    marketing_consent = EXCLUDED.marketing_consent,
    data_processing_consent = EXCLUDED.data_processing_consent,
    cookie_consent = EXCLUDED.cookie_consent,
    terms_accepted = EXCLUDED.terms_accepted,
    privacy_accepted = EXCLUDED.privacy_accepted,
    age_confirmed = EXCLUDED.age_confirmed,
    ai_tools_consent = EXCLUDED.ai_tools_consent,
    legal_document_versions = EXCLUDED.legal_document_versions,
    consent_given_at = EXCLUDED.consent_given_at,
    updated_at = now();

  -- Log the linking action (only after user exists)
  INSERT INTO consent_audit_log (
    user_id,
    action,
    consent_type,
    method,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'consent_linked_to_user',
    'signup_consent',
    'web_form',
    jsonb_build_object(
      'email', p_email,
      'consent_record_id', v_consent_record.id,
      'linked_at', now()::text
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Consent successfully linked to user'
  );
END;
$$;


--
-- Name: log_error(character varying, character varying, text, text, jsonb, character varying, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_error(p_error_type character varying, p_error_code character varying, p_error_message text, p_error_stack text DEFAULT NULL::text, p_context jsonb DEFAULT '{}'::jsonb, p_severity character varying DEFAULT 'error'::character varying, p_url text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    error_code,
    error_message,
    error_stack,
    context,
    severity,
    url,
    user_agent
  ) VALUES (
    auth.uid(),
    p_error_type,
    p_error_code,
    p_error_message,
    p_error_stack,
    p_context,
    p_severity,
    p_url,
    p_user_agent
  ) RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$$;


--
-- Name: log_login_activity(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_login_activity(p_user_id uuid, p_tracking_data jsonb) RETURNS void
    LANGUAGE plpgsql
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


--
-- Name: log_security_event(text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_security_event(p_event_type text, p_severity text, p_action text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.security_logs (
        event_type,
        severity,
        user_id,
        action,
        metadata
    ) VALUES (
        p_event_type,
        p_severity,
        auth.uid(),
        p_action,
        p_metadata
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;


--
-- Name: log_user_action(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_user_action() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_action TEXT;
    v_metadata JSONB;
BEGIN
    -- Get the current user ID, handle NULL case gracefully
    v_user_id := auth.uid();
    
    -- Skip audit logging if no authenticated user (e.g., during signup)
    IF v_user_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- Determine the action based on TG_OP
    v_action := TG_TABLE_NAME || '.' || TG_OP;
    
    -- Build metadata
    v_metadata := jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
    );
    
    -- Add row data based on operation
    IF TG_OP = 'INSERT' THEN
        v_metadata := v_metadata || jsonb_build_object('new_data', row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        v_metadata := v_metadata || jsonb_build_object(
            'old_data', row_to_json(OLD)::jsonb,
            'new_data', row_to_json(NEW)::jsonb
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_metadata := v_metadata || jsonb_build_object('old_data', row_to_json(OLD)::jsonb);
    END IF;
    
    -- Insert audit log entry (wrapped in exception handling)
    BEGIN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            metadata
        ) VALUES (
            v_user_id,
            v_action,
            TG_TABLE_NAME,
            CASE
                WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
                ELSE NEW.id::TEXT
            END,
            v_metadata
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail the original operation
            RAISE WARNING 'Failed to log audit entry: %', SQLERRM;
    END;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


--
-- Name: log_user_activity(uuid, text, text, text, text, jsonb, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_user_activity(p_user_id uuid, p_session_id text, p_activity_type text, p_activity_name text, p_activity_category text DEFAULT NULL::text, p_activity_value jsonb DEFAULT NULL::jsonb, p_page_url text DEFAULT NULL::text, p_page_title text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: record_legal_acceptance(uuid, uuid, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_legal_acceptance(p_user_id uuid, p_legal_id uuid, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_signature_data jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO user_legal_acceptance (user_id, legal_id, ip_address, user_agent, signature_data)
  VALUES (p_user_id, p_legal_id, p_ip_address::inet, p_user_agent, p_signature_data)
  ON CONFLICT (user_id, legal_id) DO UPDATE SET
    accepted_at = now(),
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent,
    signature_data = EXCLUDED.signature_data;
END;
$$;


--
-- Name: record_signup_consent(text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_signup_consent(p_email text, p_gdpr_consent boolean, p_ccpa_consent boolean, p_marketing_consent boolean, p_data_processing_consent boolean, p_cookie_consent boolean, p_terms_accepted boolean, p_privacy_accepted boolean, p_age_confirmed boolean, p_ai_tools_consent boolean, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_fingerprint text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_consent_token uuid;
  v_consent_record_id uuid;
  v_result jsonb;
BEGIN
  -- Check that all required consents are provided
  IF NOT p_gdpr_consent OR NOT p_terms_accepted OR NOT p_privacy_accepted OR NOT p_age_confirmed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'All required consents must be accepted'
    );
  END IF;

  -- Generate a unique consent token
  v_consent_token := gen_random_uuid();
  
  -- Insert consent record into signup_consents table
  INSERT INTO signup_consents (
    id,
    email,
    consent_token,
    gdpr_consent,
    data_processing_consent,
    marketing_consent,
    terms_accepted,
    privacy_accepted,
    age_verified,
    ip_address,
    user_agent,
    device_fingerprint,
    consent_timestamp,
    expires_at,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_email,
    v_consent_token,
    p_gdpr_consent,
    p_data_processing_consent,
    p_marketing_consent,
    p_terms_accepted,
    p_privacy_accepted,
    p_age_confirmed,
    p_ip_address,
    p_user_agent,
    p_fingerprint,
    now(),
    now() + interval '1 hour',
    now()
  )
  RETURNING id INTO v_consent_record_id;

  -- Return success with consent token
  RETURN jsonb_build_object(
    'success', true,
    'consent_token', v_consent_token::text,
    'consent_record_id', v_consent_record_id,
    'expires_at', (now() + interval '1 hour')::text
  );
END;
$$;


--
-- Name: record_user_consent(uuid, uuid, public.consent_action_type, inet, text, character varying, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_user_consent(p_user_id uuid, p_document_id uuid, p_action public.consent_action_type, p_ip_address inet, p_user_agent text DEFAULT NULL::text, p_device_fingerprint character varying DEFAULT NULL::character varying, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: set_user_metadata(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_user_metadata(target_user_id uuid, metadata_updates jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  current_metadata JSONB;
  new_metadata JSONB;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'role' = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Admin access required';
  END IF;

  -- Get current metadata
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO current_metadata
  FROM auth.users
  WHERE id = target_user_id;

  -- Merge with updates
  new_metadata := current_metadata || metadata_updates;

  -- Update user metadata
  UPDATE auth.users
  SET raw_app_meta_data = new_metadata,
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN new_metadata;
END;
$$;


--
-- Name: show_current_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.show_current_role() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$ BEGIN RETURN current_user; END $$;


--
-- Name: show_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.show_role() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN current_user;
END; $$;


--
-- Name: sync_user_phone(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_user_phone() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Update profile with phone from user metadata if available
  IF NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
    UPDATE public.profiles
    SET phone = NEW.raw_user_meta_data->>'phone'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: track_user_consent(uuid, text, jsonb, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_user_consent(p_user_id uuid, p_action text, p_consent_data jsonb, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Insert tracking record
  INSERT INTO consent_audit_log (
    user_id,
    action,
    consent_type,
    method,
    ip_address,
    user_agent,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_action,
    'user_action',
    'api_call',
    p_ip_address::inet,
    p_user_agent,
    p_consent_data,
    now()
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', true,
    'log_id', v_log_id,
    'tracked_at', now()::text
  );
END;
$$;


--
-- Name: track_user_device(uuid, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_user_device(p_user_id uuid, p_device_fingerprint text, p_device_type text DEFAULT NULL::text, p_browser text DEFAULT NULL::text, p_os text DEFAULT NULL::text, p_ip_address text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_devices (
    user_id, 
    device_fingerprint, 
    device_type, 
    browser, 
    os, 
    ip_address, 
    last_seen,
    created_at
  )
  VALUES (
    p_user_id, 
    p_device_fingerprint, 
    p_device_type, 
    p_browser, 
    p_os, 
    p_ip_address, 
    now(),
    now()
  )
  ON CONFLICT (user_id, device_fingerprint) DO UPDATE
  SET 
    last_seen = now(),
    ip_address = COALESCE(EXCLUDED.ip_address, user_devices.ip_address),
    device_type = COALESCE(EXCLUDED.device_type, user_devices.device_type),
    browser = COALESCE(EXCLUDED.browser, user_devices.browser),
    os = COALESCE(EXCLUDED.os, user_devices.os);
END;
$$;


--
-- Name: track_user_login(uuid, text, inet, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_user_login(p_user_id uuid, p_session_id text, p_ip_address inet, p_user_agent text, p_referrer_url text DEFAULT NULL::text, p_utm_source text DEFAULT NULL::text, p_utm_medium text DEFAULT NULL::text, p_utm_campaign text DEFAULT NULL::text, p_login_method text DEFAULT 'email'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: update_email_status(character varying, character varying, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_email_status(p_resend_id character varying, p_status character varying, p_timestamp timestamp with time zone DEFAULT now()) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE email_logs
  SET 
    status = p_status,
    opened_at = CASE WHEN p_status = 'opened' THEN p_timestamp ELSE opened_at END,
    clicked_at = CASE WHEN p_status = 'clicked' THEN p_timestamp ELSE clicked_at END
  WHERE resend_id = p_resend_id;
END;
$$;


--
-- Name: update_property_enrichment(uuid, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_property_enrichment(p_property_id uuid, p_enrichment_data jsonb, p_previous_version integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Mark previous versions as not current
  UPDATE property_enrichments 
  SET is_current = false 
  WHERE property_id = p_property_id 
    AND is_current = true
    AND version = p_previous_version;

  -- Insert new enrichment record
  INSERT INTO property_enrichments (
    property_id,
    version,
    is_current,
    plus_code,
    neighborhood,
    census_tract,
    county,
    state_code,
    country_code,
    formatted_address,
    address_components,
    elevation_meters,
    elevation_resolution,
    flood_zone,
    flood_risk_score,
    street_view_data,
    aerial_view_data,
    imagery_captured_at,
    fire_protection,
    medical_services,
    police_services,
    distance_to_coast_meters,
    hurricane_evacuation_zone,
    storm_surge_zone,
    wind_zone,
    insurance_risk_factors,
    insurance_territory_code,
    source_apis,
    api_costs,
    enriched_at,
    expires_at
  )
  VALUES (
    p_property_id,
    (p_enrichment_data->>'version')::INTEGER,
    true,
    p_enrichment_data->>'plus_code',
    p_enrichment_data->>'neighborhood',
    p_enrichment_data->>'census_tract',
    p_enrichment_data->>'county',
    p_enrichment_data->>'state_code',
    p_enrichment_data->>'country_code',
    p_enrichment_data->>'formatted_address',
    p_enrichment_data->'address_components',
    (p_enrichment_data->>'elevation_meters')::DECIMAL,
    (p_enrichment_data->>'elevation_resolution')::DECIMAL,
    p_enrichment_data->>'flood_zone',
    (p_enrichment_data->>'flood_risk_score')::INTEGER,
    p_enrichment_data->'street_view_data',
    p_enrichment_data->'aerial_view_data',
    (p_enrichment_data->>'imagery_captured_at')::TIMESTAMPTZ,
    p_enrichment_data->'fire_protection',
    p_enrichment_data->'medical_services',
    p_enrichment_data->'police_services',
    (p_enrichment_data->>'distance_to_coast_meters')::INTEGER,
    p_enrichment_data->>'hurricane_evacuation_zone',
    p_enrichment_data->>'storm_surge_zone',
    p_enrichment_data->>'wind_zone',
    p_enrichment_data->'insurance_risk_factors',
    p_enrichment_data->>'insurance_territory_code',
    p_enrichment_data->'source_apis',
    p_enrichment_data->'api_costs',
    NOW(),
    (p_enrichment_data->>'expires_at')::TIMESTAMPTZ
  );
END;
$$;


--
-- Name: update_timestamp_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.version IS NOT NULL THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_consent_preferences(uuid, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_consent_preferences(p_user_id uuid, p_consent_type text, p_consent_value boolean) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  v_column_name text;
  v_old_value boolean;
  v_result jsonb;
BEGIN
  -- Map consent type to column name
  CASE p_consent_type
    WHEN 'gdpr' THEN v_column_name := 'gdpr_consent';
    WHEN 'ccpa' THEN v_column_name := 'ccpa_consent';
    WHEN 'marketing' THEN v_column_name := 'marketing_consent';
    WHEN 'data_processing' THEN v_column_name := 'data_processing_consent';
    WHEN 'cookies' THEN v_column_name := 'cookie_consent';
    WHEN 'ai_tools' THEN v_column_name := 'ai_tools_consent';
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid consent type'
      );
  END CASE;

  -- Get the old value for audit trail
  EXECUTE format('SELECT %I FROM user_consents WHERE user_id = $1', v_column_name)
  INTO v_old_value
  USING p_user_id;

  -- Update the consent
  EXECUTE format('UPDATE user_consents SET %I = $1, updated_at = now() WHERE user_id = $2', v_column_name)
  USING p_consent_value, p_user_id;

  -- Log the change
  INSERT INTO consent_audit_log (
    user_id,
    action,
    consent_type,
    method,
    old_value,
    new_value,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'consent_updated',
    p_consent_type || '_consent',
    'user_preference',
    jsonb_build_object('value', v_old_value),
    jsonb_build_object('value', p_consent_value),
    jsonb_build_object(
      'column_name', v_column_name,
      'updated_at', now()::text
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'consent_type', p_consent_type,
    'new_value', p_consent_value
  );
END;
$_$;


--
-- Name: update_user_phone(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_phone(p_user_id uuid, p_phone text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Update profile
  UPDATE public.profiles
  SET phone = p_phone,
      updated_at = now()
  WHERE id = p_user_id;
  
  -- Also update auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('phone', p_phone)
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;


--
-- Name: update_user_preference(uuid, text, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_preference(p_user_id uuid, p_preference_name text, p_preference_value boolean, p_ip_address text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  v_old_value boolean;
  v_consent_type text;
BEGIN
  -- Map preference names to consent types
  CASE p_preference_name
    WHEN 'gdpr_consent' THEN v_consent_type := 'gdpr_consent';
    WHEN 'marketing_emails' THEN v_consent_type := 'marketing_consent';
    WHEN 'data_processing_consent' THEN v_consent_type := 'data_processing_consent';
    WHEN 'ai_processing_consent' THEN v_consent_type := 'ai_processing_consent';
    ELSE v_consent_type := p_preference_name;
  END CASE;
  
  -- Get old value
  EXECUTE format('SELECT %I FROM public.user_preferences WHERE user_id = $1', p_preference_name)
  INTO v_old_value
  USING p_user_id;
  
  -- Update preference
  EXECUTE format('UPDATE public.user_preferences SET %I = $1, %I = $2, updated_at = now() WHERE user_id = $3',
    p_preference_name,
    CASE 
      WHEN p_preference_name LIKE '%_consent' THEN p_preference_name || '_date'
      ELSE 'updated_at'
    END
  )
  USING p_preference_value, 
    CASE WHEN p_preference_value THEN now() ELSE NULL END,
    p_user_id;
  
  -- Log consent change if value changed
  IF v_old_value IS DISTINCT FROM p_preference_value THEN
    INSERT INTO public.consent_audit_log (
      user_id,
      consent_type,
      action,
      old_value,
      new_value,
      ip_address,
      method
    ) VALUES (
      p_user_id,
      v_consent_type,
      CASE 
        WHEN p_preference_value THEN 'granted'
        WHEN NOT p_preference_value AND v_old_value THEN 'withdrawn'
        ELSE 'updated'
      END,
      to_jsonb(v_old_value),
      to_jsonb(p_preference_value),
      p_ip_address,
      'user_settings'
    );
  END IF;
END;
$_$;


--
-- Name: validate_signup_consent(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_signup_consent(p_email text, p_consent_token text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_consent_record record;
  v_has_required_consents boolean;
BEGIN
  -- Find the consent record with matching token
  SELECT * INTO v_consent_record
  FROM signup_consents
  WHERE email = p_email
    AND consent_token = p_consent_token::uuid
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if record exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired consent token'
    );
  END IF;

  -- Validate all required consents are true
  v_has_required_consents := 
    v_consent_record.gdpr_consent = true AND
    v_consent_record.terms_accepted = true AND
    v_consent_record.privacy_accepted = true AND
    v_consent_record.age_verified = true;

  IF NOT v_has_required_consents THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'All required consents must be accepted'
    );
  END IF;

  -- Return success with consent data
  RETURN jsonb_build_object(
    'success', true,
    'has_required_consents', v_has_required_consents,
    'consent_data', jsonb_build_object(
      'gdpr_consent', v_consent_record.gdpr_consent,
      'data_processing_consent', v_consent_record.data_processing_consent,
      'marketing_consent', v_consent_record.marketing_consent,
      'terms_accepted', v_consent_record.terms_accepted,
      'privacy_accepted', v_consent_record.privacy_accepted,
      'age_confirmed', v_consent_record.age_verified
    )
  );
END;
$$;


SET default_table_access_method = heap;

--
-- Name: FL_Companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FL_Companies" (
    "File Log Number" text,
    "Company Name * (* group filing)" text,
    "LOB Code" bigint,
    "Line of Business" text,
    "TOI Code" bigint,
    "Type of Insurance" text,
    "SubTOI Code" text,
    "Sub Type of Insurance" text,
    "Filing Type" text,
    "Date Closed" text,
    "Final Action" text
);


--
-- Name: fl_counties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fl_counties (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    fips5 character(5) NOT NULL,
    county_name text NOT NULL,
    county_seat text,
    region text,
    time_zone text DEFAULT 'EST'::text,
    fema_region text DEFAULT 'Region 4'::text,
    coastal_county boolean DEFAULT false,
    building_dept_name text,
    building_dept_phone text,
    building_dept_email text,
    building_dept_address text,
    building_dept_website text,
    permit_search_url text,
    online_permit_system boolean DEFAULT false,
    property_appraiser_name text,
    property_appraiser_phone text,
    property_appraiser_email text,
    property_appraiser_website text,
    property_search_url text,
    gis_url text,
    emergency_mgmt_phone text,
    emergency_mgmt_website text,
    emergency_hotline text,
    building_code_version text DEFAULT '2023 Florida Building Code'::text,
    wind_speed_requirement integer,
    flood_elevation_requirement boolean DEFAULT false,
    impact_glass_required boolean DEFAULT false,
    population integer,
    households integer,
    median_home_value numeric(12,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1
);


--
-- Name: policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    property_id uuid,
    policy_number text NOT NULL,
    carrier_name text NOT NULL,
    carrier_naic text,
    policy_type text DEFAULT 'HO3'::text,
    effective_date date NOT NULL,
    expiration_date date NOT NULL,
    annual_premium numeric(10,2),
    payment_frequency text DEFAULT 'annual'::text,
    standard_deductible numeric(10,2),
    hurricane_deductible text,
    flood_deductible numeric(10,2),
    dwelling_coverage numeric(12,2),
    other_structures_coverage numeric(12,2),
    personal_property_coverage numeric(12,2),
    loss_of_use_coverage numeric(12,2),
    liability_coverage numeric(12,2),
    medical_payments_coverage numeric(12,2),
    special_coverages jsonb DEFAULT '[]'::jsonb,
    exclusions jsonb DEFAULT '[]'::jsonb,
    endorsements jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    cancellation_date date,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY public.policies REPLICA IDENTITY FULL;


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text DEFAULT 'FL'::text,
    zip_code text NOT NULL,
    county_fips character(5),
    property_type public.property_type DEFAULT 'single_family'::public.property_type,
    occupancy_status public.occupancy_status DEFAULT 'owner_occupied'::public.occupancy_status,
    year_built integer,
    square_footage integer,
    lot_size_acres numeric(10,4),
    bedrooms integer,
    bathrooms numeric(3,1),
    stories integer DEFAULT 1,
    garage_spaces integer DEFAULT 0,
    pool boolean DEFAULT false,
    construction_type text,
    roof_type text,
    roof_year integer,
    hvac_year integer,
    plumbing_year integer,
    electrical_year integer,
    purchase_price numeric(12,2),
    purchase_date date,
    current_value numeric(12,2),
    mortgage_balance numeric(12,2),
    coordinates public.geography(Point,4326),
    parcel_number text,
    legal_description text,
    flood_zone text,
    wind_zone text,
    evacuation_zone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY public.properties REPLICA IDENTITY FULL;


--
-- Name: active_policies; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_policies AS
 SELECT p.id,
    p.user_id,
    p.property_id,
    p.policy_number,
    p.carrier_name,
    p.carrier_naic,
    p.policy_type,
    p.effective_date,
    p.expiration_date,
    p.annual_premium,
    p.payment_frequency,
    p.standard_deductible,
    p.hurricane_deductible,
    p.flood_deductible,
    p.dwelling_coverage,
    p.other_structures_coverage,
    p.personal_property_coverage,
    p.loss_of_use_coverage,
    p.liability_coverage,
    p.medical_payments_coverage,
    p.special_coverages,
    p.exclusions,
    p.endorsements,
    p.is_active,
    p.cancellation_date,
    p.cancellation_reason,
    p.created_at,
    p.updated_at,
    p.version,
    p.metadata,
    prop.address,
    prop.city,
    prop.zip_code,
    c.county_name
   FROM ((public.policies p
     JOIN public.properties prop ON ((p.property_id = prop.id)))
     LEFT JOIN public.fl_counties c ON ((prop.county_fips = c.fips5)))
  WHERE ((p.is_active = true) AND (p.expiration_date > CURRENT_DATE));


--
-- Name: ai_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    analysis_type text NOT NULL,
    input_data jsonb,
    result_data jsonb,
    tokens_used integer DEFAULT 0,
    processing_time_ms integer DEFAULT 0,
    status text DEFAULT 'completed'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    resource_type text,
    resource_id text,
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.claims (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    property_id uuid,
    policy_id uuid,
    claim_number text,
    external_claim_number text,
    status public.claim_status DEFAULT 'draft'::public.claim_status,
    date_of_loss date NOT NULL,
    date_reported date DEFAULT CURRENT_DATE,
    damage_type text NOT NULL,
    damage_severity public.damage_severity,
    description text,
    estimated_value numeric(12,2),
    deductible_applied numeric(12,2),
    approved_amount numeric(12,2),
    settled_value numeric(12,2),
    paid_amount numeric(12,2) DEFAULT 0,
    adjuster_name text,
    adjuster_phone text,
    adjuster_email text,
    adjuster_company text,
    inspection_date date,
    approval_date date,
    settlement_date date,
    payment_date date,
    closed_date date,
    supporting_documents jsonb DEFAULT '[]'::jsonb,
    photos jsonb DEFAULT '[]'::jsonb,
    notes text,
    ai_damage_assessment jsonb,
    ai_coverage_analysis jsonb,
    ai_recommendations jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY public.claims REPLICA IDENTITY FULL;


--
-- Name: claims_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.claims_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    property_id uuid,
    policy_id uuid,
    claim_number text,
    external_claim_number text,
    status public.claim_status DEFAULT 'draft'::public.claim_status,
    date_of_loss date NOT NULL,
    date_reported date DEFAULT CURRENT_DATE,
    damage_type text NOT NULL,
    damage_severity public.damage_severity,
    description text,
    estimated_value numeric(12,2),
    deductible_applied numeric(12,2),
    approved_amount numeric(12,2),
    settled_value numeric(12,2),
    paid_amount numeric(12,2) DEFAULT 0,
    adjuster_name text,
    adjuster_phone text,
    adjuster_email text,
    adjuster_company text,
    inspection_date date,
    approval_date date,
    settlement_date date,
    payment_date date,
    closed_date date,
    supporting_documents jsonb DEFAULT '[]'::jsonb,
    photos jsonb DEFAULT '[]'::jsonb,
    notes text,
    ai_damage_assessment jsonb,
    ai_coverage_analysis jsonb,
    ai_recommendations jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb,
    archived_at timestamp with time zone DEFAULT now(),
    operation text
);


--
-- Name: claims_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.claims_summary AS
 SELECT c.id,
    c.user_id,
    c.property_id,
    c.policy_id,
    c.claim_number,
    c.external_claim_number,
    c.status,
    c.date_of_loss,
    c.date_reported,
    c.damage_type,
    c.damage_severity,
    c.description,
    c.estimated_value,
    c.deductible_applied,
    c.approved_amount,
    c.settled_value,
    c.paid_amount,
    c.adjuster_name,
    c.adjuster_phone,
    c.adjuster_email,
    c.adjuster_company,
    c.inspection_date,
    c.approval_date,
    c.settlement_date,
    c.payment_date,
    c.closed_date,
    c.supporting_documents,
    c.photos,
    c.notes,
    c.ai_damage_assessment,
    c.ai_coverage_analysis,
    c.ai_recommendations,
    c.created_at,
    c.updated_at,
    c.version,
    c.metadata,
    p.policy_number,
    p.carrier_name,
    prop.address,
    prop.city,
    county.county_name
   FROM (((public.claims c
     LEFT JOIN public.policies p ON ((c.policy_id = p.id)))
     JOIN public.properties prop ON ((c.property_id = prop.id)))
     LEFT JOIN public.fl_counties county ON ((prop.county_fips = county.fips5)));


--
-- Name: consent_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_audit_log (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    document_type public.legal_document_type,
    document_version character varying(20),
    old_value jsonb,
    new_value jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    consent_type text,
    method text
);


--
-- Name: coverage_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coverage_types (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    type text NOT NULL,
    description text,
    typical_limit numeric(12,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1
);


--
-- Name: disaster_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disaster_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id text NOT NULL,
    type text,
    severity text,
    status text,
    headline text,
    description text,
    instruction text,
    effective_at timestamp with time zone,
    expires_at timestamp with time zone,
    sender_name text,
    affected_geography public.geometry(Geometry,4326),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email_type character varying(50) NOT NULL,
    recipient character varying(255) NOT NULL,
    subject character varying(500),
    status character varying(50) DEFAULT 'sent'::character varying NOT NULL,
    resend_id character varying(255),
    error_message text,
    metadata jsonb,
    sent_at timestamp with time zone DEFAULT now(),
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    CONSTRAINT valid_email_type CHECK (((email_type)::text = ANY ((ARRAY['welcome'::character varying, 'email_verification'::character varying, 'password_reset'::character varying, 'claim_update'::character varying, 'property_enrichment'::character varying, 'notification'::character varying, 'marketing'::character varying])::text[]))),
    CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'failed'::character varying, 'bounced'::character varying, 'delivered'::character varying, 'opened'::character varying, 'clicked'::character varying])::text[])))
);


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    error_type character varying(50) NOT NULL,
    error_code character varying(100),
    error_message text NOT NULL,
    error_stack text,
    context jsonb DEFAULT '{}'::jsonb,
    severity character varying(20) DEFAULT 'error'::character varying,
    url text,
    user_agent text,
    ip_address inet,
    session_id uuid,
    request_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_notes text
);


--
-- Name: error_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.error_summary AS
 SELECT error_type,
    error_code,
    severity,
    count(*) AS error_count,
    count(DISTINCT user_id) AS affected_users,
    max(created_at) AS last_occurrence,
    min(created_at) AS first_occurrence
   FROM public.error_logs
  WHERE (created_at > (now() - '7 days'::interval))
  GROUP BY error_type, error_code, severity
  ORDER BY (count(*)) DESC;


--
-- Name: file_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_size bigint NOT NULL,
    file_type text NOT NULL,
    storage_path text NOT NULL,
    upload_status text DEFAULT 'uploaded'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_documents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    type public.legal_document_type NOT NULL,
    version character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    content text NOT NULL,
    summary text,
    effective_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    is_active boolean DEFAULT true,
    requires_acceptance boolean DEFAULT true,
    parent_version_id uuid,
    change_summary text,
    storage_url text,
    sha256_hash character varying(64) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: login_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_activity (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    email character varying(255),
    success boolean NOT NULL,
    ip_address inet,
    user_agent text,
    device_fingerprint character varying(255),
    geolocation jsonb,
    error_message text,
    attempt_type character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: marketing_attribution; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_attribution (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    first_touch_source text,
    first_touch_medium text,
    first_touch_campaign text,
    first_touch_date timestamp with time zone,
    first_touch_landing_page text,
    last_touch_source text,
    last_touch_medium text,
    last_touch_campaign text,
    last_touch_date timestamp with time zone,
    last_touch_landing_page text,
    conversion_source text,
    conversion_medium text,
    conversion_campaign text,
    conversion_date timestamp with time zone,
    conversion_landing_page text,
    multi_touch_points jsonb DEFAULT '[]'::jsonb,
    total_touches integer DEFAULT 0,
    days_to_conversion integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: personal_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_property (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    property_id uuid,
    name text NOT NULL,
    description text,
    category public.item_category DEFAULT 'OTHER'::public.item_category,
    subcategory text,
    brand text,
    model text,
    serial_number text,
    purchase_price numeric(10,2),
    purchase_date date,
    current_value numeric(10,2),
    replacement_cost numeric(10,2),
    room text,
    location_details text,
    receipt_url text,
    photo_urls text[],
    manual_url text,
    warranty_info jsonb,
    ai_detected_items jsonb,
    ai_value_estimate numeric(10,2),
    ai_category_confidence numeric(3,2),
    is_active boolean DEFAULT true,
    disposed_date date,
    disposal_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY public.personal_property REPLICA IDENTITY FULL;


--
-- Name: policies_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policies_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    property_id uuid,
    policy_number text NOT NULL,
    carrier_name text NOT NULL,
    carrier_naic text,
    policy_type text DEFAULT 'HO3'::text,
    effective_date date NOT NULL,
    expiration_date date NOT NULL,
    annual_premium numeric(10,2),
    payment_frequency text DEFAULT 'annual'::text,
    standard_deductible numeric(10,2),
    hurricane_deductible text,
    flood_deductible numeric(10,2),
    dwelling_coverage numeric(12,2),
    other_structures_coverage numeric(12,2),
    personal_property_coverage numeric(12,2),
    loss_of_use_coverage numeric(12,2),
    liability_coverage numeric(12,2),
    medical_payments_coverage numeric(12,2),
    special_coverages jsonb DEFAULT '[]'::jsonb,
    exclusions jsonb DEFAULT '[]'::jsonb,
    endorsements jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    cancellation_date date,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb,
    archived_at timestamp with time zone DEFAULT now(),
    operation text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    username text,
    full_name text,
    avatar_url text,
    website text,
    phone text
);


--
-- Name: properties_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text DEFAULT 'FL'::text,
    zip_code text NOT NULL,
    county_fips character(5),
    property_type public.property_type DEFAULT 'single_family'::public.property_type,
    occupancy_status public.occupancy_status DEFAULT 'owner_occupied'::public.occupancy_status,
    year_built integer,
    square_footage integer,
    lot_size_acres numeric(10,4),
    bedrooms integer,
    bathrooms numeric(3,1),
    stories integer DEFAULT 1,
    garage_spaces integer DEFAULT 0,
    pool boolean DEFAULT false,
    construction_type text,
    roof_type text,
    roof_year integer,
    hvac_year integer,
    plumbing_year integer,
    electrical_year integer,
    purchase_price numeric(12,2),
    purchase_date date,
    current_value numeric(12,2),
    mortgage_balance numeric(12,2),
    coordinates public.geography(Point,4326),
    parcel_number text,
    legal_description text,
    flood_zone text,
    wind_zone text,
    evacuation_zone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb,
    archived_at timestamp with time zone DEFAULT now(),
    operation text
);


--
-- Name: property_systems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_systems (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    property_id uuid,
    system_type text NOT NULL,
    name text NOT NULL,
    description text,
    manufacturer text,
    model text,
    serial_number text,
    installation_date date,
    installer_name text,
    installer_phone text,
    warranty_expiration date,
    warranty_provider text,
    warranty_phone text,
    last_service_date date,
    next_service_due date,
    service_interval_months integer,
    service_provider text,
    service_phone text,
    specifications jsonb DEFAULT '{}'::jsonb,
    condition text,
    estimated_lifespan_years integer,
    replacement_cost numeric(10,2),
    manual_url text,
    warranty_url text,
    service_records jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY public.property_systems REPLICA IDENTITY FULL;


--
-- Name: security_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    severity text,
    user_id uuid,
    action text NOT NULL,
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT security_logs_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text])))
);


--
-- Name: recent_security_events; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.recent_security_events AS
 SELECT sl.id,
    sl.event_type,
    sl.severity,
    sl.user_id,
    sl.action,
    sl.ip_address,
    sl.user_agent,
    sl.metadata,
    sl.created_at,
    u.email AS user_email,
    (u.raw_user_meta_data ->> 'full_name'::text) AS user_name
   FROM (public.security_logs sl
     LEFT JOIN auth.users u ON ((u.id = sl.user_id)))
  WHERE (sl.created_at >= (now() - '7 days'::interval))
  ORDER BY sl.created_at DESC;


--
-- Name: signup_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signup_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    consent_token uuid DEFAULT gen_random_uuid() NOT NULL,
    gdpr_consent boolean DEFAULT false NOT NULL,
    data_processing_consent boolean DEFAULT false NOT NULL,
    marketing_consent boolean DEFAULT false NOT NULL,
    terms_accepted boolean DEFAULT false NOT NULL,
    privacy_accepted boolean DEFAULT false NOT NULL,
    ip_address text,
    user_agent text,
    device_fingerprint text,
    consent_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '01:00:00'::interval) NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    age_verified boolean DEFAULT false NOT NULL
);


--
-- Name: tidal_stations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tidal_stations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    station_id text NOT NULL,
    name text,
    state text,
    latitude real,
    longitude real,
    water_level real,
    unit text,
    observed_at timestamp with time zone,
    location public.geometry(Point,4326),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_id text,
    activity_type text NOT NULL,
    activity_name text NOT NULL,
    activity_category text,
    activity_value jsonb,
    page_url text,
    page_title text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_checklist_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_checklist_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_id text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    document_id uuid NOT NULL,
    action public.consent_action_type NOT NULL,
    consented_at timestamp with time zone DEFAULT now(),
    ip_address inet NOT NULL,
    user_agent text,
    device_fingerprint character varying(255),
    geolocation jsonb,
    session_id character varying(255),
    consent_method character varying(50) NOT NULL,
    is_current boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    referrer_url text,
    page_url text,
    consent_flow character varying(50)
);


--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_devices (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    device_fingerprint character varying(255) NOT NULL,
    device_name character varying(100),
    device_type character varying(50),
    operating_system character varying(50),
    browser character varying(50),
    first_seen timestamp with time zone DEFAULT now(),
    last_seen timestamp with time zone DEFAULT now(),
    is_trusted boolean DEFAULT false,
    is_blocked boolean DEFAULT false,
    trust_score integer DEFAULT 50,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT user_devices_trust_score_check CHECK (((trust_score >= 0) AND (trust_score <= 100)))
);


--
-- Name: user_legal_acceptance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_legal_acceptance (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    legal_id uuid NOT NULL,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address inet,
    user_agent text,
    signature_data jsonb
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    onboarding_completed boolean DEFAULT false,
    onboarding_current_step text,
    onboarding_skipped_at timestamp with time zone,
    has_primary_property boolean DEFAULT false,
    property_setup_completed boolean DEFAULT false,
    has_insurance_policy boolean DEFAULT false,
    insurance_setup_completed boolean DEFAULT false,
    preferred_theme text DEFAULT 'dark'::text,
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    push_notifications boolean DEFAULT true,
    ai_features_enabled boolean DEFAULT true,
    preferred_ai_model text DEFAULT 'openai'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_type text,
    property_address text,
    address_verified boolean DEFAULT false,
    professional_role text,
    has_insurance boolean DEFAULT false,
    insurance_provider text,
    profile_completed boolean DEFAULT false,
    insurance_completed boolean DEFAULT false,
    onboarding_completed_at timestamp with time zone,
    landlord_units text,
    property_stories integer,
    property_bedrooms integer,
    property_bathrooms integer,
    rooms_per_floor text,
    property_structures text,
    has_property_insurance boolean DEFAULT false,
    has_flood_insurance boolean DEFAULT false,
    has_other_insurance boolean DEFAULT false,
    gdpr_consent boolean DEFAULT false,
    marketing_consent boolean DEFAULT false,
    data_processing_consent boolean DEFAULT false,
    ai_processing_consent boolean DEFAULT false,
    ai_processing_consent_date timestamp with time zone
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    signup_ip_address text,
    signup_user_agent text,
    signup_device_fingerprint text,
    signup_referrer text,
    signup_landing_page text,
    signup_utm_source text,
    signup_utm_medium text,
    signup_utm_campaign text,
    signup_country text,
    signup_region text,
    signup_city text,
    signup_postal_code text,
    signup_timezone text,
    signup_latitude double precision,
    signup_longitude double precision,
    signup_timestamp timestamp with time zone,
    signup_completed_at timestamp with time zone,
    signup_source text,
    signup_device_type text,
    signup_utm_term text,
    signup_utm_content text,
    signup_country_code text,
    account_status text DEFAULT 'active'::text,
    account_type text DEFAULT 'free'::text,
    risk_score numeric DEFAULT 0,
    trust_level text DEFAULT 'new'::text,
    last_login_at timestamp with time zone,
    last_login_ip text,
    login_count integer DEFAULT 0,
    failed_login_count integer DEFAULT 0,
    last_failed_login_at timestamp with time zone,
    password_changed_at timestamp with time zone,
    email_verified_at timestamp with time zone,
    phone_verified_at timestamp with time zone,
    two_factor_enabled boolean DEFAULT false,
    two_factor_method text,
    preferences jsonb DEFAULT '{}'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    notes text,
    internal_notes text,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(255) NOT NULL,
    ip_address inet NOT NULL,
    user_agent text,
    device_fingerprint character varying(255),
    geolocation jsonb,
    created_at timestamp with time zone DEFAULT now(),
    last_activity timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    logout_at timestamp with time zone,
    logout_reason character varying(50),
    risk_score integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT user_sessions_risk_score_check CHECK (((risk_score >= 0) AND (risk_score <= 100)))
);


--
-- Name: user_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_id text NOT NULL,
    ip_address inet,
    ip_country text,
    ip_region text,
    ip_city text,
    ip_timezone text,
    user_agent text,
    device_type text,
    device_name text,
    browser_name text,
    browser_version text,
    os_name text,
    os_version text,
    referrer_url text,
    referrer_domain text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,
    landing_page text,
    login_method text,
    is_first_login boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    last_activity_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_analysis ai_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: claims_history claims_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims_history
    ADD CONSTRAINT claims_history_pkey PRIMARY KEY (id);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- Name: consent_audit_log consent_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_audit_log
    ADD CONSTRAINT consent_audit_log_pkey PRIMARY KEY (id);


--
-- Name: coverage_types coverage_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_types
    ADD CONSTRAINT coverage_types_pkey PRIMARY KEY (id);


--
-- Name: coverage_types coverage_types_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_types
    ADD CONSTRAINT coverage_types_type_key UNIQUE (type);


--
-- Name: disaster_events disaster_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disaster_events
    ADD CONSTRAINT disaster_events_event_id_key UNIQUE (event_id);


--
-- Name: disaster_events disaster_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disaster_events
    ADD CONSTRAINT disaster_events_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: file_uploads file_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);


--
-- Name: fl_counties fl_counties_county_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fl_counties
    ADD CONSTRAINT fl_counties_county_name_key UNIQUE (county_name);


--
-- Name: fl_counties fl_counties_fips5_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fl_counties
    ADD CONSTRAINT fl_counties_fips5_key UNIQUE (fips5);


--
-- Name: fl_counties fl_counties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fl_counties
    ADD CONSTRAINT fl_counties_pkey PRIMARY KEY (id);


--
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (id);


--
-- Name: legal_documents legal_documents_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_slug_key UNIQUE (slug);


--
-- Name: login_activity login_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_activity
    ADD CONSTRAINT login_activity_pkey PRIMARY KEY (id);


--
-- Name: marketing_attribution marketing_attribution_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_attribution
    ADD CONSTRAINT marketing_attribution_pkey PRIMARY KEY (id);


--
-- Name: personal_property personal_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_property
    ADD CONSTRAINT personal_property_pkey PRIMARY KEY (id);


--
-- Name: policies_history policies_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies_history
    ADD CONSTRAINT policies_history_pkey PRIMARY KEY (id);


--
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: properties_history properties_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties_history
    ADD CONSTRAINT properties_history_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: property_systems property_systems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_systems
    ADD CONSTRAINT property_systems_pkey PRIMARY KEY (id);


--
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- Name: signup_consents signup_consents_consent_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_consents
    ADD CONSTRAINT signup_consents_consent_token_key UNIQUE (consent_token);


--
-- Name: signup_consents signup_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_consents
    ADD CONSTRAINT signup_consents_pkey PRIMARY KEY (id);


--
-- Name: tidal_stations tidal_stations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tidal_stations
    ADD CONSTRAINT tidal_stations_pkey PRIMARY KEY (id);


--
-- Name: tidal_stations tidal_stations_station_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tidal_stations
    ADD CONSTRAINT tidal_stations_station_id_key UNIQUE (station_id);


--
-- Name: legal_documents unique_active_document_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT unique_active_document_type EXCLUDE USING btree (type WITH =) WHERE ((is_active = true));


--
-- Name: legal_documents unique_document_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT unique_document_version UNIQUE (type, version);


--
-- Name: user_devices unique_user_device; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT unique_user_device UNIQUE (user_id, device_fingerprint);


--
-- Name: user_activity_log user_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_pkey PRIMARY KEY (id);


--
-- Name: user_checklist_progress user_checklist_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_checklist_progress
    ADD CONSTRAINT user_checklist_progress_pkey PRIMARY KEY (id);


--
-- Name: user_checklist_progress user_checklist_progress_user_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_checklist_progress
    ADD CONSTRAINT user_checklist_progress_user_id_item_id_key UNIQUE (user_id, item_id);


--
-- Name: user_consents user_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_user_device_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_device_unique UNIQUE (user_id, device_fingerprint);


--
-- Name: user_legal_acceptance user_legal_acceptance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_legal_acceptance
    ADD CONSTRAINT user_legal_acceptance_pkey PRIMARY KEY (id);


--
-- Name: user_legal_acceptance user_legal_acceptance_user_id_legal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_legal_acceptance
    ADD CONSTRAINT user_legal_acceptance_user_id_legal_id_key UNIQUE (user_id, legal_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: user_tracking user_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tracking
    ADD CONSTRAINT user_tracking_pkey PRIMARY KEY (id);


--
-- Name: user_tracking user_tracking_user_session_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tracking
    ADD CONSTRAINT user_tracking_user_session_unique UNIQUE (user_id, session_id);


--
-- Name: claims_history_date_of_loss_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX claims_history_date_of_loss_idx ON public.claims_history USING btree (date_of_loss);


--
-- Name: claims_history_policy_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX claims_history_policy_id_idx ON public.claims_history USING btree (policy_id);


--
-- Name: claims_history_property_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX claims_history_property_id_idx ON public.claims_history USING btree (property_id);


--
-- Name: claims_history_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX claims_history_status_idx ON public.claims_history USING btree (status);


--
-- Name: claims_history_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX claims_history_user_id_idx ON public.claims_history USING btree (user_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_claims_date_of_loss; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_date_of_loss ON public.claims USING btree (date_of_loss);


--
-- Name: idx_claims_policy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_policy_id ON public.claims USING btree (policy_id);


--
-- Name: idx_claims_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_property_id ON public.claims USING btree (property_id);


--
-- Name: idx_claims_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_status ON public.claims USING btree (status);


--
-- Name: idx_claims_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_user_id ON public.claims USING btree (user_id);


--
-- Name: idx_consent_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_audit_action ON public.consent_audit_log USING btree (action);


--
-- Name: idx_consent_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_audit_created ON public.consent_audit_log USING btree (created_at);


--
-- Name: idx_consent_audit_log_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_audit_log_email ON public.consent_audit_log USING btree (((metadata ->> 'email'::text))) WHERE (consent_type = 'signup_consent'::text);


--
-- Name: idx_consent_audit_log_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_audit_log_token ON public.consent_audit_log USING btree (((metadata ->> 'consent_token'::text))) WHERE (consent_type = 'signup_consent'::text);


--
-- Name: idx_consent_audit_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_audit_log_user_id ON public.consent_audit_log USING btree (user_id);


--
-- Name: idx_consent_audit_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_audit_user ON public.consent_audit_log USING btree (user_id);


--
-- Name: idx_consent_audit_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_audit_user_id ON public.consent_audit_log USING btree (user_id);


--
-- Name: idx_disaster_events_geography; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disaster_events_geography ON public.disaster_events USING gist (affected_geography);


--
-- Name: idx_email_logs_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_recipient ON public.email_logs USING btree (recipient);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_email_logs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_type ON public.email_logs USING btree (email_type, sent_at DESC);


--
-- Name: idx_email_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_user ON public.email_logs USING btree (user_id, sent_at DESC);


--
-- Name: idx_error_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_created_at ON public.error_logs USING btree (created_at DESC);


--
-- Name: idx_error_logs_error_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_error_type ON public.error_logs USING btree (error_type);


--
-- Name: idx_error_logs_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_severity ON public.error_logs USING btree (severity);


--
-- Name: idx_error_logs_unresolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_unresolved ON public.error_logs USING btree (created_at DESC) WHERE (resolved_at IS NULL);


--
-- Name: idx_error_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_user_id ON public.error_logs USING btree (user_id);


--
-- Name: idx_legal_documents_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_documents_active ON public.legal_documents USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_legal_documents_effective_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_documents_effective_date ON public.legal_documents USING btree (effective_date);


--
-- Name: idx_legal_documents_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_documents_parent ON public.legal_documents USING btree (parent_version_id);


--
-- Name: idx_legal_documents_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_documents_slug ON public.legal_documents USING btree (slug);


--
-- Name: idx_legal_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_documents_type ON public.legal_documents USING btree (type);


--
-- Name: idx_login_activity_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_activity_created ON public.login_activity USING btree (created_at);


--
-- Name: idx_login_activity_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_activity_email ON public.login_activity USING btree (email);


--
-- Name: idx_login_activity_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_activity_ip ON public.login_activity USING btree (ip_address);


--
-- Name: idx_login_activity_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_activity_success ON public.login_activity USING btree (success);


--
-- Name: idx_login_activity_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_activity_user ON public.login_activity USING btree (user_id);


--
-- Name: idx_login_activity_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_activity_user_id ON public.login_activity USING btree (user_id);


--
-- Name: idx_marketing_attribution_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketing_attribution_user_id ON public.marketing_attribution USING btree (user_id);


--
-- Name: idx_personal_property_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_property_category ON public.personal_property USING btree (category);


--
-- Name: idx_personal_property_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_property_property_id ON public.personal_property USING btree (property_id);


--
-- Name: idx_personal_property_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_property_user_id ON public.personal_property USING btree (user_id);


--
-- Name: idx_policies_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policies_active ON public.policies USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_policies_expiration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policies_expiration ON public.policies USING btree (expiration_date);


--
-- Name: idx_policies_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policies_property_id ON public.policies USING btree (property_id);


--
-- Name: idx_policies_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policies_user_id ON public.policies USING btree (user_id);


--
-- Name: idx_profiles_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone);


--
-- Name: idx_properties_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_coordinates ON public.properties USING gist (coordinates);


--
-- Name: idx_properties_county; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_county ON public.properties USING btree (county_fips);


--
-- Name: idx_properties_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_user_id ON public.properties USING btree (user_id);


--
-- Name: idx_property_systems_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_systems_property_id ON public.property_systems USING btree (property_id);


--
-- Name: idx_property_systems_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_systems_type ON public.property_systems USING btree (system_type);


--
-- Name: idx_security_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_created_at ON public.security_logs USING btree (created_at DESC);


--
-- Name: idx_security_logs_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_event_type ON public.security_logs USING btree (event_type);


--
-- Name: idx_security_logs_ip_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_ip_address ON public.security_logs USING btree (ip_address);


--
-- Name: idx_security_logs_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_severity ON public.security_logs USING btree (severity);


--
-- Name: idx_security_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_user_id ON public.security_logs USING btree (user_id);


--
-- Name: idx_signup_consents_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signup_consents_email ON public.signup_consents USING btree (email);


--
-- Name: idx_signup_consents_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signup_consents_expires ON public.signup_consents USING btree (expires_at);


--
-- Name: idx_signup_consents_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signup_consents_token ON public.signup_consents USING btree (consent_token);


--
-- Name: idx_tidal_stations_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tidal_stations_location ON public.tidal_stations USING gist (location);


--
-- Name: idx_user_activity_log_activity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_log_activity_type ON public.user_activity_log USING btree (activity_type);


--
-- Name: idx_user_activity_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log USING btree (created_at);


--
-- Name: idx_user_activity_log_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_log_session_id ON public.user_activity_log USING btree (session_id);


--
-- Name: idx_user_activity_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log USING btree (user_id);


--
-- Name: idx_user_consents_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consents_action ON public.user_consents USING btree (action);


--
-- Name: idx_user_consents_consented_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consents_consented_at ON public.user_consents USING btree (consented_at);


--
-- Name: idx_user_consents_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consents_current ON public.user_consents USING btree (user_id, is_current) WHERE (is_current = true);


--
-- Name: idx_user_consents_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consents_document_id ON public.user_consents USING btree (document_id);


--
-- Name: idx_user_consents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consents_user_id ON public.user_consents USING btree (user_id);


--
-- Name: idx_user_devices_blocked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_devices_blocked ON public.user_devices USING btree (is_blocked) WHERE (is_blocked = true);


--
-- Name: idx_user_devices_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_devices_fingerprint ON public.user_devices USING btree (device_fingerprint);


--
-- Name: idx_user_devices_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_devices_last_seen ON public.user_devices USING btree (last_seen);


--
-- Name: idx_user_devices_trusted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_devices_trusted ON public.user_devices USING btree (is_trusted) WHERE (is_trusted = true);


--
-- Name: idx_user_devices_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_devices_user ON public.user_devices USING btree (user_id);


--
-- Name: idx_user_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_devices_user_id ON public.user_devices USING btree (user_id);


--
-- Name: idx_user_legal_acceptance_legal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_legal_acceptance_legal_id ON public.user_legal_acceptance USING btree (legal_id);


--
-- Name: idx_user_legal_acceptance_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_legal_acceptance_user_id ON public.user_legal_acceptance USING btree (user_id);


--
-- Name: idx_user_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);


--
-- Name: idx_user_profiles_signup_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_signup_completed ON public.user_profiles USING btree (signup_completed_at);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active, expires_at) WHERE (is_active = true);


--
-- Name: idx_user_sessions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_created_at ON public.user_sessions USING btree (created_at);


--
-- Name: idx_user_sessions_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_ip ON public.user_sessions USING btree (ip_address);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_user_tracking_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tracking_created_at ON public.user_tracking USING btree (created_at);


--
-- Name: idx_user_tracking_ip_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tracking_ip_address ON public.user_tracking USING btree (ip_address);


--
-- Name: idx_user_tracking_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tracking_session_id ON public.user_tracking USING btree (session_id);


--
-- Name: idx_user_tracking_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tracking_user_id ON public.user_tracking USING btree (user_id);


--
-- Name: policies_history_expiration_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX policies_history_expiration_date_idx ON public.policies_history USING btree (expiration_date);


--
-- Name: policies_history_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX policies_history_is_active_idx ON public.policies_history USING btree (is_active) WHERE (is_active = true);


--
-- Name: policies_history_property_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX policies_history_property_id_idx ON public.policies_history USING btree (property_id);


--
-- Name: policies_history_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX policies_history_user_id_idx ON public.policies_history USING btree (user_id);


--
-- Name: properties_history_coordinates_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_history_coordinates_idx ON public.properties_history USING gist (coordinates);


--
-- Name: properties_history_county_fips_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_history_county_fips_idx ON public.properties_history USING btree (county_fips);


--
-- Name: properties_history_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_history_user_id_idx ON public.properties_history USING btree (user_id);


--
-- Name: claims audit_claims; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_claims AFTER INSERT OR DELETE OR UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: policies audit_policies; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_policies AFTER INSERT OR DELETE OR UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: properties audit_properties; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_properties AFTER INSERT OR DELETE OR UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: claims claims_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER claims_audit_trigger AFTER DELETE OR UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.audit_and_version();


--
-- Name: user_checklist_progress on_checklist_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_checklist_update BEFORE UPDATE ON public.user_checklist_progress FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: tidal_stations on_tidal_stations_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_tidal_stations_update BEFORE UPDATE ON public.tidal_stations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: policies policies_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER policies_audit_trigger AFTER DELETE OR UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.audit_and_version();


--
-- Name: properties properties_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER properties_audit_trigger AFTER DELETE OR UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.audit_and_version();


--
-- Name: claims update_claims_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_claims_timestamp BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: coverage_types update_coverage_types_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_coverage_types_timestamp BEFORE UPDATE ON public.coverage_types FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: fl_counties update_fl_counties_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fl_counties_timestamp BEFORE UPDATE ON public.fl_counties FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: legal_documents update_legal_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: marketing_attribution update_marketing_attribution_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_marketing_attribution_updated_at BEFORE UPDATE ON public.marketing_attribution FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: personal_property update_personal_property_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_personal_property_timestamp BEFORE UPDATE ON public.personal_property FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: policies update_policies_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_policies_timestamp BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: properties update_properties_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_properties_timestamp BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: property_systems update_property_systems_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_property_systems_timestamp BEFORE UPDATE ON public.property_systems FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: user_preferences update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_profiles update_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_analysis ai_analysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: claims claims_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id);


--
-- Name: claims claims_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: claims claims_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: consent_audit_log consent_audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_audit_log
    ADD CONSTRAINT consent_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: email_logs email_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: error_logs error_logs_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: error_logs error_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: file_uploads file_uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: legal_documents legal_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: legal_documents legal_documents_parent_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES public.legal_documents(id) ON DELETE SET NULL;


--
-- Name: login_activity login_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_activity
    ADD CONSTRAINT login_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: marketing_attribution marketing_attribution_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_attribution
    ADD CONSTRAINT marketing_attribution_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: personal_property personal_property_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_property
    ADD CONSTRAINT personal_property_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: personal_property personal_property_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_property
    ADD CONSTRAINT personal_property_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: policies policies_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: policies policies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: properties properties_county_fips_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_county_fips_fkey FOREIGN KEY (county_fips) REFERENCES public.fl_counties(fips5);


--
-- Name: properties properties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: property_systems property_systems_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_systems
    ADD CONSTRAINT property_systems_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: security_logs security_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: signup_consents signup_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_consents
    ADD CONSTRAINT signup_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_activity_log user_activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_checklist_progress user_checklist_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_checklist_progress
    ADD CONSTRAINT user_checklist_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_consents user_consents_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.legal_documents(id) ON DELETE RESTRICT;


--
-- Name: user_consents user_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_legal_acceptance user_legal_acceptance_legal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_legal_acceptance
    ADD CONSTRAINT user_legal_acceptance_legal_id_fkey FOREIGN KEY (legal_id) REFERENCES public.legal_documents(id) ON DELETE CASCADE;


--
-- Name: user_legal_acceptance user_legal_acceptance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_legal_acceptance
    ADD CONSTRAINT user_legal_acceptance_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_tracking user_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tracking
    ADD CONSTRAINT user_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs Admins can view all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_app_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: security_logs Admins can view all security logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all security logs" ON public.security_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_app_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: disaster_events Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.disaster_events FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: tidal_stations Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.tidal_stations FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: user_checklist_progress Allow users to manage their own checklist progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow users to manage their own checklist progress" ON public.user_checklist_progress USING ((auth.uid() = user_id));


--
-- Name: signup_consents Anyone can create consent records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create consent records" ON public.signup_consents FOR INSERT WITH CHECK (true);


--
-- Name: legal_documents Anyone can view active legal documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active legal documents" ON public.legal_documents FOR SELECT USING ((is_active = true));


--
-- Name: FL_Companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."FL_Companies" ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_documents Legal documents are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Legal documents are publicly readable" ON public.legal_documents FOR SELECT USING ((is_active = true));


--
-- Name: legal_documents Only admins can manage legal documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage legal documents" ON public.legal_documents USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_app_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: profiles Public profiles are viewable by everyone.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT TO anon USING (true);


--
-- Name: audit_logs Service role can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: consent_audit_log Service role can insert consent logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert consent logs" ON public.consent_audit_log FOR INSERT WITH CHECK (true);


--
-- Name: login_activity Service role can insert login activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert login activity" ON public.login_activity FOR INSERT WITH CHECK (true);


--
-- Name: profiles Service role can insert profiles.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert profiles." ON public.profiles FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: security_logs Service role can insert security logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert security logs" ON public.security_logs FOR INSERT WITH CHECK (true);


--
-- Name: signup_consents Service role can manage signup consents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage signup consents." ON public.signup_consents TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_consents Service role can manage user consents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage user consents." ON public.user_consents TO service_role USING (true) WITH CHECK (true);


--
-- Name: email_logs Service role has full access to email logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to email logs" ON public.email_logs USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: error_logs Service role has full access to error_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to error_logs" ON public.error_logs USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: user_consents Users can create own consent records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own consent records" ON public.user_consents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: consent_audit_log Users can insert own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own audit logs" ON public.consent_audit_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_devices Users can insert own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own devices" ON public.user_devices FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_legal_acceptance Users can insert own legal acceptances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own legal acceptances" ON public.user_legal_acceptance FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_activity_log Users can insert their own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own activity" ON public.user_activity_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: user_legal_acceptance Users can read own legal acceptances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own legal acceptances" ON public.user_legal_acceptance FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_consents Users can update own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own consents" ON public.user_consents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_devices Users can update own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own devices" ON public.user_devices FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: user_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: marketing_attribution Users can view own attribution; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own attribution" ON public.marketing_attribution FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs Users can view own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: consent_audit_log Users can view own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audit logs" ON public.consent_audit_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: consent_audit_log Users can view own consent history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own consent history" ON public.consent_audit_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: signup_consents Users can view own consent records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own consent records" ON public.signup_consents FOR SELECT USING (((auth.uid() = user_id) OR (auth.uid() IS NULL)));


--
-- Name: user_consents Users can view own consent records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own consent records" ON public.user_consents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_consents Users can view own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own consents" ON public.user_consents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_devices Users can view own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own devices" ON public.user_devices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: login_activity Users can view own login activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own login activity" ON public.login_activity FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: login_activity Users can view own login history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own login history" ON public.login_activity FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: security_logs Users can view own security logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own security logs" ON public.security_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_sessions Users can view own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_activity_log Users can view their own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own activity" ON public.user_activity_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_consents Users can view their own consents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own consents." ON public.user_consents FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: email_logs Users can view their own email logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own email logs" ON public.email_logs FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: error_logs Users can view their own errors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own errors" ON public.error_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: signup_consents Users can view their own signup consents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own signup consents." ON public.signup_consents FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (email = auth.email())));


--
-- Name: ai_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_analysis ai_analysis_service_role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_analysis_service_role ON public.ai_analysis TO service_role USING (true) WITH CHECK (true);


--
-- Name: ai_analysis ai_analysis_tier_limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_analysis_tier_limits ON public.ai_analysis FOR INSERT TO authenticated WITH CHECK (
CASE
    WHEN (( SELECT COALESCE((users.raw_app_meta_data ->> 'subscription_tier'::text), 'free'::text) AS "coalesce"
       FROM auth.users
      WHERE (users.id = auth.uid())) = 'free'::text) THEN (( SELECT count(*) AS count
       FROM public.ai_analysis ai_analysis_1
      WHERE ((ai_analysis_1.user_id = auth.uid()) AND (ai_analysis_1.created_at > (now() - '1 mon'::interval)))) < 5)
    WHEN (( SELECT COALESCE((users.raw_app_meta_data ->> 'subscription_tier'::text), 'free'::text) AS "coalesce"
       FROM auth.users
      WHERE (users.id = auth.uid())) = 'pro'::text) THEN (( SELECT count(*) AS count
       FROM public.ai_analysis ai_analysis_1
      WHERE ((ai_analysis_1.user_id = auth.uid()) AND (ai_analysis_1.created_at > (now() - '1 mon'::interval)))) < 100)
    ELSE true
END);


--
-- Name: ai_analysis ai_analysis_view_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_analysis_view_own ON public.ai_analysis FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: signup_consents anon_can_insert_signup_consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_can_insert_signup_consents ON public.signup_consents FOR INSERT TO anon WITH CHECK (true);


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

--
-- Name: claims claims_tier_limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY claims_tier_limits ON public.claims FOR INSERT TO authenticated WITH CHECK (
CASE
    WHEN (( SELECT COALESCE((users.raw_app_meta_data ->> 'subscription_tier'::text), 'free'::text) AS "coalesce"
       FROM auth.users
      WHERE (users.id = auth.uid())) = 'free'::text) THEN (( SELECT count(*) AS count
       FROM public.claims claims_1
      WHERE ((claims_1.user_id = auth.uid()) AND (claims_1.status <> ALL (ARRAY['closed'::public.claim_status, 'settled'::public.claim_status, 'denied'::public.claim_status])))) < 2)
    WHEN (( SELECT COALESCE((users.raw_app_meta_data ->> 'subscription_tier'::text), 'free'::text) AS "coalesce"
       FROM auth.users
      WHERE (users.id = auth.uid())) = 'pro'::text) THEN (( SELECT count(*) AS count
       FROM public.claims claims_1
      WHERE ((claims_1.user_id = auth.uid()) AND (claims_1.status <> ALL (ARRAY['closed'::public.claim_status, 'settled'::public.claim_status, 'denied'::public.claim_status])))) < 10)
    ELSE true
END);


--
-- Name: claims claims_user_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY claims_user_all ON public.claims TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: consent_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: coverage_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coverage_types ENABLE ROW LEVEL SECURITY;

--
-- Name: coverage_types coverage_types_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coverage_types_read_all ON public.coverage_types FOR SELECT TO authenticated USING (true);


--
-- Name: disaster_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.disaster_events ENABLE ROW LEVEL SECURITY;

--
-- Name: email_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: error_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: file_uploads file_upload_tier_limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY file_upload_tier_limits ON public.file_uploads FOR INSERT TO authenticated WITH CHECK (
CASE
    WHEN (( SELECT COALESCE((users.raw_app_meta_data ->> 'subscription_tier'::text), 'free'::text) AS "coalesce"
       FROM auth.users
      WHERE (users.id = auth.uid())) = 'free'::text) THEN ((( SELECT count(*) AS count
       FROM public.file_uploads file_uploads_1
      WHERE ((file_uploads_1.user_id = auth.uid()) AND (file_uploads_1.created_at > (now() - '1 mon'::interval)))) < 10) AND (file_size < ((5 * 1024) * 1024)))
    WHEN (( SELECT COALESCE((users.raw_app_meta_data ->> 'subscription_tier'::text), 'free'::text) AS "coalesce"
       FROM auth.users
      WHERE (users.id = auth.uid())) = 'pro'::text) THEN ((( SELECT count(*) AS count
       FROM public.file_uploads file_uploads_1
      WHERE ((file_uploads_1.user_id = auth.uid()) AND (file_uploads_1.created_at > (now() - '1 mon'::interval)))) < 100) AND (file_size < ((25 * 1024) * 1024)))
    ELSE (file_size < ((100 * 1024) * 1024))
END);


--
-- Name: file_uploads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: file_uploads file_uploads_service_role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY file_uploads_service_role ON public.file_uploads TO service_role USING (true) WITH CHECK (true);


--
-- Name: file_uploads file_uploads_view_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY file_uploads_view_own ON public.file_uploads FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: fl_counties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fl_counties ENABLE ROW LEVEL SECURITY;

--
-- Name: fl_counties fl_counties_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fl_counties_read_all ON public.fl_counties FOR SELECT TO authenticated USING (true);


--
-- Name: legal_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: login_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: marketing_attribution; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketing_attribution ENABLE ROW LEVEL SECURITY;

--
-- Name: personal_property; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personal_property ENABLE ROW LEVEL SECURITY;

--
-- Name: personal_property personal_property_user_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY personal_property_user_all ON public.personal_property TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: policies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

--
-- Name: policies policies_user_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policies_user_all ON public.policies TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

--
-- Name: properties properties_tier_limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY properties_tier_limits ON public.properties FOR INSERT TO authenticated WITH CHECK (
CASE
    WHEN (( SELECT COALESCE((users.raw_app_meta_data ->> 'subscription_tier'::text), 'free'::text) AS "coalesce"
       FROM auth.users
      WHERE (users.id = auth.uid())) = 'free'::text) THEN (( SELECT count(*) AS count
       FROM public.properties properties_1
      WHERE (properties_1.user_id = auth.uid())) < 1)
    WHEN (( SELECT COALESCE((users.raw_app_meta_data ->> 'subscription_tier'::text), 'free'::text) AS "coalesce"
       FROM auth.users
      WHERE (users.id = auth.uid())) = 'pro'::text) THEN (( SELECT count(*) AS count
       FROM public.properties properties_1
      WHERE (properties_1.user_id = auth.uid())) < 5)
    ELSE true
END);


--
-- Name: properties properties_user_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY properties_user_all ON public.properties TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: property_systems; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.property_systems ENABLE ROW LEVEL SECURITY;

--
-- Name: property_systems property_systems_user_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY property_systems_user_all ON public.property_systems TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_systems.property_id) AND (properties.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_systems.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: security_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: signup_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.signup_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: signup_consents signup_consents_i_system; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY signup_consents_i_system ON public.signup_consents FOR INSERT TO authenticator, service_role, supabase_auth_admin WITH CHECK (true);


--
-- Name: tidal_stations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tidal_stations ENABLE ROW LEVEL SECURITY;

--
-- Name: user_checklist_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_checklist_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: user_devices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

--
-- Name: user_legal_acceptance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_legal_acceptance ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

