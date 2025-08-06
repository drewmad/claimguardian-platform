--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Homebrew)
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
-- Name: util; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA util;


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: api_execution_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.api_execution_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'cached'
);


--
-- Name: api_execution_trigger; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.api_execution_trigger AS ENUM (
    'onboarding',
    'scheduled',
    'storm_event',
    'claim_filing',
    'manual'
);


--
-- Name: error_log_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.error_log_status AS ENUM (
    'new',
    'acknowledged',
    'resolved',
    'ignored'
);


--
-- Name: maps_api_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maps_api_type AS ENUM (
    'address_validation',
    'aerial_roof',
    'weather_claims',
    'environmental',
    'maps_static',
    'street_view',
    'solar',
    'unified_intelligence'
);


--
-- Name: aggregate_ai_metrics(interval, interval); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.aggregate_ai_metrics(window_interval interval DEFAULT '00:15:00'::interval, lookback_period interval DEFAULT '01:00:00'::interval) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  window_start TIMESTAMPTZ;
  window_end TIMESTAMPTZ;
  current_window TIMESTAMPTZ;
BEGIN
  -- Calculate aggregation window
  window_end := date_trunc('minute', NOW() - INTERVAL '1 minute');
  window_start := window_end - lookback_period;
  current_window := date_trunc(
    CASE 
      WHEN window_interval = '1 minute' THEN 'minute'
      WHEN window_interval = '5 minutes' THEN 'minute'
      WHEN window_interval = '15 minutes' THEN 'minute'
      WHEN window_interval = '1 hour' THEN 'hour'
      WHEN window_interval = '1 day' THEN 'day'
      ELSE 'minute'
    END,
    window_start
  );
  
  -- Aggregate metrics for each time bucket
  WHILE current_window < window_end LOOP
    INSERT INTO ai_metrics_aggregated (
      time_bucket,
      window_size,
      metric_name,
      count,
      sum_value,
      avg_value,
      min_value,
      max_value,
      stddev_value,
      percentile_50,
      percentile_95,
      percentile_99,
      feature_id,
      model_name,
      provider,
      metadata
    )
    SELECT
      current_window as time_bucket,
      window_interval as window_size,
      metric_name,
      COUNT(*) as count,
      SUM(metric_value) as sum_value,
      AVG(metric_value) as avg_value,
      MIN(metric_value) as min_value,
      MAX(metric_value) as max_value,
      STDDEV(metric_value) as stddev_value,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as percentile_50,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as percentile_95,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as percentile_99,
      feature_id,
      model_name,
      provider,
      jsonb_build_object(
        'aggregated_at', NOW(),
        'source_count', COUNT(*)
      ) as metadata
    FROM ai_performance_metrics
    WHERE timestamp >= current_window 
      AND timestamp < current_window + window_interval
      AND metric_value IS NOT NULL
    GROUP BY metric_name, feature_id, model_name, provider
    ON CONFLICT (time_bucket, window_size, metric_name, feature_id, model_name, provider)
    DO UPDATE SET
      count = EXCLUDED.count,
      sum_value = EXCLUDED.sum_value,
      avg_value = EXCLUDED.avg_value,
      min_value = EXCLUDED.min_value,
      max_value = EXCLUDED.max_value,
      stddev_value = EXCLUDED.stddev_value,
      percentile_50 = EXCLUDED.percentile_50,
      percentile_95 = EXCLUDED.percentile_95,
      percentile_99 = EXCLUDED.percentile_99,
      metadata = EXCLUDED.metadata;
    
    current_window := current_window + window_interval;
  END LOOP;
  
  RAISE NOTICE 'Aggregated metrics from % to % with % window', 
    window_start, window_end, window_interval;
END;
$$;


--
-- Name: analyze_partition_stats(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.analyze_partition_stats(table_pattern text) RETURNS TABLE(partition_name text, row_count bigint, size_bytes bigint, size_pretty text, last_analyzed timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::TEXT as partition_name,
    c.reltuples::BIGINT as row_count,
    pg_relation_size(c.oid) as size_bytes,
    pg_size_pretty(pg_relation_size(c.oid)) as size_pretty,
    s.last_analyze
  FROM pg_class c
  LEFT JOIN pg_stat_user_tables s ON c.oid = s.relid
  WHERE c.relname LIKE table_pattern
  AND c.relkind = 'r'
  ORDER BY c.relname;
END;
$$;


--
-- Name: anonymize_claim_for_community(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.anonymize_claim_for_community(claim_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  claim_record RECORD;
  user_consent BOOLEAN;
BEGIN
  -- Check user consent
  SELECT anonymous_sharing INTO user_consent
  FROM data_sharing_consent
  WHERE user_id = (SELECT user_id FROM claims WHERE id = claim_id);
  
  IF NOT user_consent THEN
    RETURN;
  END IF;
  
  -- Get claim data
  SELECT 
    c.damage_type,
    LEFT(p.zip, 3) as county_indicator,
    FLOOR(c.settlement_amount / 10000) * 10000 as settlement_bracket,
    EXTRACT(DAY FROM c.settled_at - c.created_at) as days_to_settle,
    EXTRACT(YEAR FROM c.created_at) as claim_year,
    EXTRACT(MONTH FROM c.created_at) as claim_month
  INTO claim_record
  FROM claims c
  JOIN properties p ON c.property_id = p.id
  WHERE c.id = claim_id
  AND c.status = 'settled';
  
  -- Insert anonymized data
  INSERT INTO community_claims (
    damage_type,
    county,
    settlement_bracket,
    days_to_settle,
    claim_year,
    claim_month
  ) VALUES (
    claim_record.damage_type,
    claim_record.county_indicator,
    claim_record.settlement_bracket,
    claim_record.days_to_settle,
    claim_record.claim_year,
    claim_record.claim_month
  );
END;
$$;


--
-- Name: auto_apply_extraction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_apply_extraction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Only auto-apply if confidence is very high and no validation errors
  IF NEW.confidence_score >= 0.9 
     AND array_length(NEW.validation_errors, 1) IS NULL
     AND NEW.processing_status = 'completed' THEN
    
    -- Create or update policy record
    INSERT INTO policies (
      property_id,
      policy_number,
      carrier_name,
      policy_type,
      effective_date,
      expiration_date,
      coverage_limits,
      premium_amount,
      deductible_amount,
      ai_extracted,
      extraction_confidence,
      created_by
    )
    SELECT
      NEW.property_id,
      NEW.extracted_data->>'policyNumber',
      NEW.extracted_data->>'carrierName',
      (NEW.extracted_data->>'policyType')::policy_type,
      (NEW.extracted_data->>'effectiveDate')::DATE,
      (NEW.extracted_data->>'expirationDate')::DATE,
      jsonb_build_object(
        'dwelling', (NEW.extracted_data->>'dwellingCoverage')::NUMERIC,
        'personal_property', (NEW.extracted_data->>'personalPropertyCoverage')::NUMERIC,
        'liability', (NEW.extracted_data->>'personalLiabilityCoverage')::NUMERIC
      ),
      (NEW.extracted_data->>'annualPremium')::NUMERIC,
      (NEW.extracted_data->>'allPerilsDeductible')::NUMERIC,
      TRUE,
      NEW.confidence_score,
      NEW.processed_by
    WHERE NEW.extracted_data->>'policyNumber' IS NOT NULL
      AND NEW.extracted_data->>'carrierName' IS NOT NULL
    ON CONFLICT (property_id, policy_number, policy_type) 
    DO UPDATE SET
      coverage_limits = EXCLUDED.coverage_limits,
      premium_amount = EXCLUDED.premium_amount,
      deductible_amount = EXCLUDED.deductible_amount,
      extraction_confidence = EXCLUDED.extraction_confidence,
      updated_at = NOW()
    RETURNING id INTO NEW.policy_id;
    
    -- Mark as applied
    NEW.applied_to_property := TRUE;
    NEW.applied_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: award_achievement_points(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.award_achievement_points(p_user_id uuid, p_event_type text, p_points integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  achievement RECORD;
  current_achievement RECORD;
  new_level INT;
BEGIN
  -- Record the event
  INSERT INTO achievement_events (user_id, event_type, points_earned, event_data)
  VALUES (p_user_id, p_event_type, p_points, '{}');
  
  -- Find relevant achievements
  FOR achievement IN 
    SELECT * FROM achievement_definitions 
    WHERE category = p_event_type OR code = p_event_type
  LOOP
    -- Get or create user achievement record
    INSERT INTO user_achievements (user_id, achievement_id, current_points)
    VALUES (p_user_id, achievement.id, 0)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Update points
    UPDATE user_achievements
    SET 
      current_points = current_points + p_points,
      updated_at = NOW()
    WHERE user_id = p_user_id AND achievement_id = achievement.id
    RETURNING * INTO current_achievement;
    
    -- Check for level up
    FOR i IN 1..array_length(achievement.points_per_level, 1) LOOP
      IF current_achievement.current_points >= achievement.points_per_level[i] 
         AND current_achievement.current_level < i THEN
        -- Level up!
        UPDATE user_achievements
        SET 
          current_level = i,
          earned_at = array_append(earned_at, NOW())
        WHERE user_id = p_user_id AND achievement_id = achievement.id;
        
        -- Send notification
        INSERT INTO notifications (user_id, type, subject, body, urgency)
        VALUES (
          p_user_id,
          'achievement',
          'Achievement Unlocked!',
          format('You reached %s level in %s!', achievement.level_names[i], achievement.name),
          3
        );
      END IF;
    END LOOP;
  END LOOP;
  
  -- Update user stats
  UPDATE user_gamification_stats
  SET 
    total_points = total_points + p_points,
    last_activity = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;


--
-- Name: calculate_optimal_send_time(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_optimal_send_time(user_id uuid, urgency integer) RETURNS timestamp with time zone
    LANGUAGE plpgsql
    AS $$
DECLARE
  user_prefs RECORD;
  engagement_pattern JSONB;
  optimal_hour INT;
BEGIN
  -- Get user preferences
  SELECT * INTO user_prefs
  FROM notification_preferences
  WHERE notification_preferences.user_id = calculate_optimal_send_time.user_id;
  
  -- High urgency = send immediately
  IF urgency >= 9 THEN
    RETURN NOW();
  END IF;
  
  -- Use engagement pattern if available
  IF user_prefs.engagement_pattern IS NOT NULL THEN
    -- Get best hour from ML pattern
    optimal_hour := (user_prefs.engagement_pattern->>'best_hour')::INT;
  ELSE
    -- Default to 10 AM in user's timezone
    optimal_hour := 10;
  END IF;
  
  -- Calculate next occurrence of optimal hour
  RETURN (CURRENT_DATE + INTERVAL '1 day' + optimal_hour * INTERVAL '1 hour')
    AT TIME ZONE COALESCE(user_prefs.timezone, 'America/New_York');
END;
$$;


--
-- Name: check_organization_limit(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_organization_limit(org_id uuid, limit_type text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
BEGIN
  SELECT 
    CASE limit_type
      WHEN 'users' THEN current_users
      WHEN 'properties' THEN current_properties
      WHEN 'claims' THEN current_claims
      WHEN 'ai_requests' THEN current_ai_requests
    END,
    CASE limit_type
      WHEN 'users' THEN user_limit
      WHEN 'properties' THEN property_limit
      WHEN 'claims' THEN claim_limit
      WHEN 'ai_requests' THEN ai_request_limit
    END
  INTO current_usage, usage_limit
  FROM enterprise_organizations
  WHERE id = org_id;
  
  RETURN current_usage < usage_limit;
END;
$$;


--
-- Name: check_property_weather_alerts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_property_weather_alerts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  affected_property RECORD;
BEGIN
  -- Check if any properties are affected by severe conditions
  FOR affected_property IN 
    SELECT 
      p.id,
      p.user_id,
      p.address,
      NEW.measurements
    FROM properties p
    WHERE ST_DWithin(p.location, NEW.location, 50000) -- 50km radius
      AND (
        (NEW.measurements->>'wind_speed')::float > 50 OR
        (NEW.measurements->>'wind_gust')::float > 70 OR
        (NEW.measurements->>'wave_height')::float > 4 OR
        (NEW.measurements->>'water_level')::float > 3
      )
  LOOP
    -- Insert alert record
    INSERT INTO property_weather_alerts (
      property_id,
      user_id,
      alert_type,
      severity,
      measurements,
      created_at
    ) VALUES (
      affected_property.id,
      affected_property.user_id,
      CASE 
        WHEN (NEW.measurements->>'wind_speed')::float > 50 THEN 'high_wind'
        WHEN (NEW.measurements->>'wave_height')::float > 4 THEN 'high_seas'
        WHEN (NEW.measurements->>'water_level')::float > 3 THEN 'coastal_flood'
        ELSE 'severe_weather'
      END,
      CASE 
        WHEN (NEW.measurements->>'wind_speed')::float > 74 THEN 'extreme'
        WHEN (NEW.measurements->>'wind_speed')::float > 50 THEN 'severe'
        ELSE 'moderate'
      END,
      NEW.measurements,
      NOW()
    );
    
    -- Notify via pg_notify for real-time updates
    PERFORM pg_notify(
      'property_weather_alert',
      json_build_object(
        'property_id', affected_property.id,
        'user_id', affected_property.user_id,
        'address', affected_property.address,
        'conditions', NEW.measurements
      )::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;


--
-- Name: cleanup_expired_insights_cache(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_insights_cache() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM community_insights_cache 
  WHERE expires_at < NOW();
END;
$$;


--
-- Name: cleanup_expired_intelligence_cache(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_intelligence_cache() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.unified_intelligence_cache 
    WHERE expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_old_analytics_partitions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_analytics_partitions() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  partition_name TEXT;
  cutoff_date DATE;
BEGIN
  cutoff_date := CURRENT_DATE - INTERVAL '7 days';
  
  FOR partition_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'analytics_events_%'
    AND tablename < 'analytics_events_' || to_char(cutoff_date, 'YYYY_MM_DD')
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', partition_name);
    RAISE NOTICE 'Dropped partition: %', partition_name;
  END LOOP;
END;
$$;


--
-- Name: create_analytics_partition(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_analytics_partition(partition_date date) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  partition_name := 'analytics_events_' || to_char(partition_date, 'YYYY_MM_DD');
  start_date := partition_date;
  end_date := partition_date + INTERVAL '1 day';
  
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF analytics_events FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );
  
  RAISE NOTICE 'Created partition: %', partition_name;
END;
$$;


--
-- Name: create_organization_schema(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_organization_schema(org_code text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  schema_name TEXT := 'org_' || org_code;
BEGIN
  -- Create schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Grant usage to authenticated users
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
  
  -- Create tenant-specific tables
  
  -- Properties table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.properties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      organization_id UUID NOT NULL,
      property_name TEXT NOT NULL,
      property_type TEXT NOT NULL,
      address JSONB NOT NULL,
      property_details JSONB DEFAULT ''{}''::jsonb,
      images TEXT[],
      value DECIMAL(12,2),
      square_footage INTEGER,
      year_built INTEGER,
      insurability_score DECIMAL(3,2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (organization_id) REFERENCES enterprise_organizations(id),
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
    )', schema_name);
  
  -- Claims table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      property_id UUID NOT NULL,
      user_id UUID NOT NULL,
      claim_number TEXT NOT NULL,
      claim_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT ''draft'',
      incident_date DATE NOT NULL,
      reported_date TIMESTAMPTZ DEFAULT NOW(),
      estimated_amount DECIMAL(12,2),
      settled_amount DECIMAL(12,2),
      description TEXT,
      damage_categories TEXT[],
      documents TEXT[],
      communications JSONB DEFAULT ''[]''::jsonb,
      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (organization_id) REFERENCES enterprise_organizations(id),
      FOREIGN KEY (property_id) REFERENCES %I.properties(id),
      FOREIGN KEY (user_id) REFERENCES auth.users(id),
      UNIQUE(organization_id, claim_number)
    )', schema_name, schema_name);
  
  -- Policies table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.policies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      property_id UUID NOT NULL,
      user_id UUID NOT NULL,
      policy_number TEXT NOT NULL,
      carrier_name TEXT NOT NULL,
      policy_type TEXT NOT NULL,
      coverage_amount DECIMAL(12,2),
      deductible DECIMAL(12,2),
      premium_amount DECIMAL(12,2),
      effective_date DATE NOT NULL,
      expiration_date DATE NOT NULL,
      status TEXT DEFAULT ''active'',
      policy_details JSONB DEFAULT ''{}''::jsonb,
      documents TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (organization_id) REFERENCES enterprise_organizations(id),
      FOREIGN KEY (property_id) REFERENCES %I.properties(id),
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
    )', schema_name, schema_name);
  
  -- AI usage tracking
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.ai_usage_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      user_id UUID NOT NULL,
      feature_id TEXT NOT NULL,
      model_name TEXT,
      provider TEXT,
      request_tokens INTEGER,
      response_tokens INTEGER,
      cost DECIMAL(10,6),
      success BOOLEAN,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (organization_id) REFERENCES enterprise_organizations(id),
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
    )', schema_name);
  
  -- Create indexes for tenant tables
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_properties_org ON %I.properties(organization_id)', org_code, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_properties_user ON %I.properties(user_id)', org_code, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_claims_org ON %I.claims(organization_id)', org_code, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_claims_property ON %I.claims(property_id)', org_code, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_policies_org ON %I.policies(organization_id)', org_code, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_ai_usage_org ON %I.ai_usage_log(organization_id)', org_code, schema_name);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


--
-- Name: detect_ai_anomalies(integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.detect_ai_anomalies(lookback_hours integer DEFAULT 24, sensitivity numeric DEFAULT 3.0) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  anomaly_count INTEGER := 0;
  metric_record RECORD;
  stats_record RECORD;
  z_score DECIMAL;
  anomaly_type TEXT;
  severity TEXT;
BEGIN
  -- Loop through recent metrics
  FOR metric_record IN 
    SELECT DISTINCT metric_name, feature_id, model_name, provider
    FROM ai_performance_metrics 
    WHERE timestamp >= NOW() - (lookback_hours || ' hours')::INTERVAL
  LOOP
    -- Calculate statistical thresholds for this metric combination
    SELECT 
      AVG(metric_value) as mean_value,
      STDDEV(metric_value) as stddev_value,
      COUNT(*) as sample_count
    INTO stats_record
    FROM ai_performance_metrics
    WHERE metric_name = metric_record.metric_name
      AND COALESCE(feature_id, '') = COALESCE(metric_record.feature_id, '')
      AND COALESCE(model_name, '') = COALESCE(metric_record.model_name, '')
      AND COALESCE(provider, '') = COALESCE(metric_record.provider, '')
      AND timestamp >= NOW() - (lookback_hours * 2 || ' hours')::INTERVAL
      AND timestamp < NOW() - (lookback_hours || ' hours')::INTERVAL;
    
    -- Skip if insufficient historical data
    IF stats_record.sample_count < 10 OR stats_record.stddev_value IS NULL OR stats_record.stddev_value = 0 THEN
      CONTINUE;
    END IF;
    
    -- Check recent data points for anomalies
    FOR metric_record IN
      SELECT timestamp, metric_value, user_id
      FROM ai_performance_metrics
      WHERE metric_name = metric_record.metric_name
        AND COALESCE(feature_id, '') = COALESCE(metric_record.feature_id, '')
        AND COALESCE(model_name, '') = COALESCE(metric_record.model_name, '')
        AND COALESCE(provider, '') = COALESCE(metric_record.provider, '')
        AND timestamp >= NOW() - '1 hour'::INTERVAL
      ORDER BY timestamp DESC
    LOOP
      -- Calculate z-score
      z_score := ABS(metric_record.metric_value - stats_record.mean_value) / stats_record.stddev_value;
      
      -- Check if anomaly
      IF z_score > sensitivity THEN
        -- Determine anomaly type and severity
        IF metric_record.metric_value > stats_record.mean_value THEN
          anomaly_type := 'spike';
        ELSE
          anomaly_type := 'drop';
        END IF;
        
        IF z_score > 5 THEN
          severity := 'critical';
        ELSIF z_score > 4 THEN
          severity := 'high';
        ELSIF z_score > 3.5 THEN
          severity := 'medium';
        ELSE
          severity := 'low';
        END IF;
        
        -- Insert anomaly record
        INSERT INTO ai_anomalies (
          metric_name,
          timestamp_detected,
          observed_value,
          expected_value,
          deviation_score,
          anomaly_type,
          severity,
          confidence_score,
          feature_id,
          model_name,
          provider,
          user_id,
          detection_algorithm,
          algorithm_parameters
        ) VALUES (
          metric_record.metric_name,
          metric_record.timestamp,
          metric_record.metric_value,
          stats_record.mean_value,
          z_score,
          anomaly_type,
          severity,
          LEAST(z_score / 5.0, 1.0),
          metric_record.feature_id,
          metric_record.model_name,
          metric_record.provider,
          metric_record.user_id,
          'z_score',
          jsonb_build_object(
            'sensitivity', sensitivity,
            'lookback_hours', lookback_hours,
            'z_score', z_score,
            'sample_mean', stats_record.mean_value,
            'sample_stddev', stats_record.stddev_value
          )
        )
        ON CONFLICT DO NOTHING; -- Prevent duplicate anomalies
        
        anomaly_count := anomaly_count + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN anomaly_count;
END;
$$;


--
-- Name: drop_old_partitions(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.drop_old_partitions(retention_days integer DEFAULT 90) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  partition RECORD;
  cutoff_date DATE;
BEGIN
  cutoff_date := CURRENT_DATE - retention_days;
  
  -- Find and drop old analytics_events partitions
  FOR partition IN 
    SELECT 
      schemaname,
      tablename 
    FROM pg_tables 
    WHERE tablename LIKE 'analytics_events_%'
    AND tablename < 'analytics_events_' || to_char(cutoff_date, 'YYYY_MM_DD')
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', partition.schemaname, partition.tablename);
    RAISE NOTICE 'Dropped old partition: %.%', partition.schemaname, partition.tablename;
  END LOOP;
END;
$$;


--
-- Name: estimate_sync_completion(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.estimate_sync_completion(sync_id text) RETURNS timestamp with time zone
    LANGUAGE plpgsql
    AS $$
DECLARE
  sync_record RECORD;
  avg_days_per_hour FLOAT;
  remaining_days INTEGER;
  estimated_hours FLOAT;
BEGIN
  SELECT * INTO sync_record
  FROM noaa_sync_progress
  WHERE id = sync_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  IF sync_record.status = 'completed' THEN
    RETURN sync_record.updated_at;
  END IF;
  
  IF sync_record.completed_days = 0 THEN
    -- No progress yet, use default estimate (assume 1 day per hour)
    RETURN NOW() + INTERVAL '1 hour' * sync_record.total_days;
  END IF;
  
  -- Calculate processing rate
  avg_days_per_hour := sync_record.completed_days::float / 
    EXTRACT(EPOCH FROM (sync_record.updated_at - sync_record.created_at)) * 3600;
  
  remaining_days := sync_record.total_days - sync_record.completed_days;
  estimated_hours := remaining_days / GREATEST(avg_days_per_hour, 0.1); -- Prevent division by zero
  
  RETURN NOW() + INTERVAL '1 hour' * estimated_hours;
END;
$$;


--
-- Name: execute_raw_sql(text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.execute_raw_sql(query text, params text[] DEFAULT '{}'::text[]) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow admin users to execute raw SQL
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Execute query and return results
  EXECUTE query USING params INTO result;
  RETURN result;
END;
$$;


--
-- Name: find_nearest_weather_station(numeric, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_nearest_weather_station(user_lat numeric, user_lon numeric, max_distance_km integer DEFAULT 50) RETURNS TABLE(station_id text, station_name text, distance_km numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.station_id,
    s.station_name,
    ST_Distance(s.location, ST_MakePoint(user_lon, user_lat)::geography) / 1000 AS distance_km
  FROM noaa_weather_stations s
  WHERE s.active = true
    AND ST_DWithin(
      s.location,
      ST_MakePoint(user_lon, user_lat)::geography,
      max_distance_km * 1000
    )
  ORDER BY distance_km
  LIMIT 5;
END;
$$;


--
-- Name: get_aggregated_insights(text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_aggregated_insights(p_damage_type text DEFAULT NULL::text, p_county_region text DEFAULT NULL::text, p_months_back integer DEFAULT 12, p_min_sample_size integer DEFAULT 10) RETURNS TABLE(damage_type text, sample_size bigint, avg_settlement_bucket text, avg_time_bucket text, success_rate numeric, region text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (anonymized_data->>'damage_type')::TEXT as damage_type,
    COUNT(*) as sample_size,
    MODE() WITHIN GROUP (ORDER BY anonymized_data->>'settlement_bucket') as avg_settlement_bucket,
    MODE() WITHIN GROUP (ORDER BY anonymized_data->>'time_bucket') as avg_time_bucket,
    ROUND(
      COUNT(*) FILTER (WHERE anonymized_data->>'success' = 'true')::NUMERIC / 
      COUNT(*)::NUMERIC * 100, 
      1
    ) as success_rate,
    (anonymized_data->>'county_region')::TEXT as region
  FROM community_contributions
  WHERE 
    contributed_at >= NOW() - (p_months_back || ' months')::INTERVAL
    AND privacy_level = 'differential_privacy'
    AND (p_damage_type IS NULL OR anonymized_data->>'damage_type' = p_damage_type)
    AND (p_county_region IS NULL OR anonymized_data->>'county_region' = p_county_region)
  GROUP BY 
    anonymized_data->>'damage_type',
    anonymized_data->>'county_region'
  HAVING COUNT(*) >= p_min_sample_size
  ORDER BY sample_size DESC;
END;
$$;


--
-- Name: get_expansion_readiness(character); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_expansion_readiness(target_state_code character) RETURNS TABLE(state_code character, readiness_score numeric, regulatory_score numeric, technical_score numeric, market_score numeric, operational_score numeric, blockers text[], recommendations text[])
    LANGUAGE plpgsql
    AS $$
DECLARE
  config_exists BOOLEAN;
  reg_compliance_count INTEGER;
  data_source_count INTEGER;
  market_analysis_exists BOOLEAN;
  total_score DECIMAL(5,2) := 0;
  reg_score DECIMAL(5,2) := 0;
  tech_score DECIMAL(5,2) := 0;
  mkt_score DECIMAL(5,2) := 0;
  ops_score DECIMAL(5,2) := 0;
  blocker_list TEXT[] := '{}';
  rec_list TEXT[] := '{}';
BEGIN
  -- Check if state configuration exists
  SELECT EXISTS(
    SELECT 1 FROM state_configurations 
    WHERE state_configurations.state_code = target_state_code
  ) INTO config_exists;
  
  IF NOT config_exists THEN
    blocker_list := array_append(blocker_list, 'State configuration not initialized');
    rec_list := array_append(rec_list, 'Initialize state configuration');
    
    RETURN QUERY SELECT 
      target_state_code,
      0.00::DECIMAL(5,2),
      0.00::DECIMAL(5,2),
      0.00::DECIMAL(5,2),
      0.00::DECIMAL(5,2),
      0.00::DECIMAL(5,2),
      blocker_list,
      rec_list;
    RETURN;
  END IF;
  
  -- Calculate regulatory score (0-25 points)
  SELECT COUNT(*) INTO reg_compliance_count
  FROM state_regulatory_requirements 
  WHERE state_regulatory_requirements.state_code = target_state_code 
    AND compliance_status = 'compliant';
  
  reg_score := LEAST(reg_compliance_count * 5, 25);
  
  IF reg_score < 15 THEN
    blocker_list := array_append(blocker_list, 'Insufficient regulatory compliance');
    rec_list := array_append(rec_list, 'Complete regulatory requirements');
  END IF;
  
  -- Calculate technical score (0-25 points)
  SELECT COUNT(*) INTO data_source_count
  FROM state_data_sources 
  WHERE state_data_sources.state_code = target_state_code 
    AND status = 'active';
  
  tech_score := LEAST(data_source_count * 8, 25);
  
  IF tech_score < 15 THEN
    rec_list := array_append(rec_list, 'Establish required data source integrations');
  END IF;
  
  -- Calculate market score (0-25 points)
  SELECT EXISTS(
    SELECT 1 FROM state_market_analysis 
    WHERE state_market_analysis.state_code = target_state_code
      AND analysis_date >= CURRENT_DATE - INTERVAL '6 months'
  ) INTO market_analysis_exists;
  
  IF market_analysis_exists THEN
    mkt_score := 20;
    
    -- Additional points for market penetration analysis
    IF EXISTS(
      SELECT 1 FROM state_market_analysis 
      WHERE state_market_analysis.state_code = target_state_code 
        AND target_penetration > 0
    ) THEN
      mkt_score := mkt_score + 5;
    END IF;
  ELSE
    rec_list := array_append(rec_list, 'Conduct market analysis');
  END IF;
  
  -- Calculate operational score (0-25 points)
  IF EXISTS(
    SELECT 1 FROM state_configurations 
    WHERE state_configurations.state_code = target_state_code 
      AND deployment_status IN ('testing', 'staging', 'production')
  ) THEN
    ops_score := 15;
    
    IF EXISTS(
      SELECT 1 FROM state_configurations 
      WHERE state_configurations.state_code = target_state_code 
        AND deployment_status = 'production'
    ) THEN
      ops_score := 25;
    END IF;
  ELSE
    rec_list := array_append(rec_list, 'Begin deployment preparation');
  END IF;
  
  total_score := reg_score + tech_score + mkt_score + ops_score;
  
  RETURN QUERY SELECT 
    target_state_code,
    total_score,
    reg_score,
    tech_score,
    mkt_score,
    ops_score,
    blocker_list,
    rec_list;
END;
$$;


--
-- Name: get_extraction_statistics(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_extraction_statistics(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30) RETURNS TABLE(total_extractions bigint, successful_extractions bigint, failed_extractions bigint, average_confidence numeric, average_processing_time_ms numeric, auto_applied_count bigint, review_required_count bigint, total_fields_extracted bigint, most_used_provider text, most_used_model text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_extractions,
    COUNT(*) FILTER (WHERE processing_status = 'completed')::BIGINT as successful_extractions,
    COUNT(*) FILTER (WHERE processing_status = 'failed')::BIGINT as failed_extractions,
    ROUND(AVG(confidence_score), 2) as average_confidence,
    ROUND(AVG(processing_time_ms), 0) as average_processing_time_ms,
    COUNT(*) FILTER (WHERE applied_to_property = TRUE)::BIGINT as auto_applied_count,
    COUNT(*) FILTER (WHERE processing_status = 'review_required')::BIGINT as review_required_count,
    SUM(array_length(extracted_fields, 1))::BIGINT as total_fields_extracted,
    MODE() WITHIN GROUP (ORDER BY provider_used) as most_used_provider,
    MODE() WITHIN GROUP (ORDER BY model_used) as most_used_model
  FROM document_extractions_enhanced
  WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
    AND (p_user_id IS NULL OR processed_by = p_user_id);
END;
$$;


--
-- Name: get_property_intelligence_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_property_intelligence_summary(p_property_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result jsonb := '{}';
    property_data record;
BEGIN
    -- Check if user owns this property
    SELECT * INTO property_data 
    FROM public.properties 
    WHERE id = p_property_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN '{"error": "Property not found or access denied"}'::jsonb;
    END IF;
    
    -- Build summary from various intelligence tables
    result := jsonb_build_object(
        'property_id', p_property_id,
        'address', property_data.address,
        'last_updated', now(),
        'intelligence_types', jsonb_build_object(
            'address_validation', EXISTS(SELECT 1 FROM public.address_intelligence WHERE property_id = p_property_id),
            'weather_analysis', EXISTS(SELECT 1 FROM public.weather_intelligence WHERE property_id = p_property_id),
            'aerial_analysis', EXISTS(SELECT 1 FROM public.aerial_intelligence WHERE property_id = p_property_id),
            'environmental_data', EXISTS(SELECT 1 FROM public.environmental_intelligence WHERE property_id = p_property_id),
            'street_view_data', EXISTS(SELECT 1 FROM public.street_view_intelligence WHERE property_id = p_property_id),
            'solar_analysis', EXISTS(SELECT 1 FROM public.solar_intelligence WHERE property_id = p_property_id),
            'static_maps_data', EXISTS(SELECT 1 FROM public.static_maps_intelligence WHERE property_id = p_property_id)
        )
    );
    
    RETURN result;
END;
$$;


--
-- Name: get_session_completion_percentage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_session_completion_percentage(session_uuid uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  total_required INTEGER := 5; -- overview, close_up, context, surrounding_area, supporting_evidence
  completed_count INTEGER;
BEGIN
  SELECT COALESCE(jsonb_array_length(session_progress->'completedAngles'), 0)
  INTO completed_count
  FROM public.damage_copilot_sessions
  WHERE session_id = session_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN LEAST(100, (completed_count * 100) / total_required);
END;
$$;


--
-- Name: get_user_organization(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_organization() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM organization_users
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1;
  
  RETURN org_id;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Ensure user profile exists
  INSERT INTO public.user_profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Grant default user role
  INSERT INTO core.user_role (user_id, role, is_active, created_at)
  VALUES (NEW.id, 'user', true, NOW())
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the signup activity
  INSERT INTO public.login_activity (
    user_id,
    activity_type,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    NEW.id,
    'signup',
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', '0.0.0.0'),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'Unknown'),
    NOW()
  );

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION handle_new_user(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates user profile and assigns default permissions on signup';


--
-- Name: increment_feature_usage(text, numeric, numeric, boolean, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_feature_usage(p_feature_id text, p_cost numeric, p_response_time numeric, p_cache_hit boolean, p_error boolean, p_user_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update feature usage
  INSERT INTO feature_usage_analytics (
    feature_id,
    date,
    total_requests,
    unique_users,
    total_cost,
    avg_response_time,
    cache_hit_rate,
    error_count
  ) VALUES (
    p_feature_id,
    CURRENT_DATE,
    1,
    CASE WHEN p_user_id IS NOT NULL THEN 1 ELSE 0 END,
    p_cost,
    p_response_time,
    CASE WHEN p_cache_hit THEN 100 ELSE 0 END,
    CASE WHEN p_error THEN 1 ELSE 0 END
  )
  ON CONFLICT (feature_id, date) DO UPDATE SET
    total_requests = feature_usage_analytics.total_requests + 1,
    unique_users = CASE 
      WHEN p_user_id IS NOT NULL AND NOT (
        feature_usage_analytics.metadata->>'user_ids' @> to_jsonb(p_user_id::text)
      )
      THEN feature_usage_analytics.unique_users + 1
      ELSE feature_usage_analytics.unique_users
    END,
    total_cost = feature_usage_analytics.total_cost + p_cost,
    avg_response_time = (
      (feature_usage_analytics.avg_response_time * feature_usage_analytics.total_requests) + p_response_time
    ) / (feature_usage_analytics.total_requests + 1),
    cache_hit_rate = (
      (feature_usage_analytics.cache_hit_rate * feature_usage_analytics.total_requests) + 
      CASE WHEN p_cache_hit THEN 100 ELSE 0 END
    ) / (feature_usage_analytics.total_requests + 1),
    error_count = feature_usage_analytics.error_count + CASE WHEN p_error THEN 1 ELSE 0 END,
    metadata = CASE
      WHEN p_user_id IS NOT NULL THEN
        jsonb_set(
          COALESCE(feature_usage_analytics.metadata, '{}'),
          '{user_ids}',
          COALESCE(feature_usage_analytics.metadata->'user_ids', '[]') || to_jsonb(p_user_id)
        )
      ELSE feature_usage_analytics.metadata
    END;

  -- Update user summary if user_id provided
  IF p_user_id IS NOT NULL THEN
    INSERT INTO user_analytics_summary (
      user_id,
      date,
      total_requests,
      features_used,
      total_cost,
      avg_response_time,
      cache_hit_rate
    ) VALUES (
      p_user_id,
      CURRENT_DATE,
      1,
      ARRAY[p_feature_id],
      p_cost,
      p_response_time,
      CASE WHEN p_cache_hit THEN 100 ELSE 0 END
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      total_requests = user_analytics_summary.total_requests + 1,
      features_used = CASE
        WHEN p_feature_id = ANY(user_analytics_summary.features_used)
        THEN user_analytics_summary.features_used
        ELSE array_append(user_analytics_summary.features_used, p_feature_id)
      END,
      total_cost = user_analytics_summary.total_cost + p_cost,
      avg_response_time = (
        (user_analytics_summary.avg_response_time * user_analytics_summary.total_requests) + p_response_time
      ) / (user_analytics_summary.total_requests + 1),
      cache_hit_rate = (
        (user_analytics_summary.cache_hit_rate * user_analytics_summary.total_requests) + 
        CASE WHEN p_cache_hit THEN 100 ELSE 0 END
      ) / (user_analytics_summary.total_requests + 1);
  END IF;
END;
$$;


--
-- Name: initialize_organization(text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_organization(org_name text, org_code text, domain text, owner_email text, subscription_tier text DEFAULT 'standard'::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  new_org_id UUID;
  owner_user_id UUID;
BEGIN
  -- Create organization
  INSERT INTO enterprise_organizations (
    organization_name,
    organization_code,
    domain,
    primary_contact_email,
    subscription_tier,
    subscription_status,
    trial_start_date,
    trial_end_date,
    created_by
  ) VALUES (
    org_name,
    org_code,
    domain,
    owner_email,
    subscription_tier,
    'trial',
    NOW(),
    NOW() + INTERVAL '30 days',
    'system'
  ) RETURNING id INTO new_org_id;
  
  -- Create organization schema
  PERFORM create_organization_schema(org_code);
  
  -- Find or create owner user
  SELECT id INTO owner_user_id FROM auth.users WHERE email = owner_email;
  
  IF owner_user_id IS NOT NULL THEN
    -- Add owner to organization
    INSERT INTO organization_users (
      user_id,
      organization_id,
      role,
      status
    ) VALUES (
      owner_user_id,
      new_org_id,
      'owner',
      'active'
    );
  END IF;
  
  -- Create default customizations
  INSERT INTO organization_customizations (
    organization_id,
    theme,
    enabled_features,
    created_by
  ) VALUES (
    new_org_id,
    '{"primaryColor": "#0ea5e9", "secondaryColor": "#64748b"}',
    ARRAY['basic_claims', 'damage_analysis', 'document_management'],
    'system'
  );
  
  RETURN new_org_id;
END;
$$;


--
-- Name: is_property_in_alert_zone(numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_property_in_alert_zone(property_lat numeric, property_lon numeric) RETURNS TABLE(event_id text, event_type text, severity text, headline text, expires timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.event_id,
    e.event_type,
    e.severity,
    e.headline,
    e.expires
  FROM noaa_storm_events e
  WHERE e.active = true
    AND e.expires > NOW()
    AND ST_Contains(
      e.geometry,
      ST_MakePoint(property_lon, property_lat)::geography
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
    user_agent,
    status
  ) VALUES (
    auth.uid(),
    p_error_type,
    p_error_code,
    p_error_message,
    p_error_stack,
    p_context,
    p_severity,
    p_url,
    p_user_agent,
    'new'
  ) RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$$;


--
-- Name: log_extraction_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_extraction_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO extraction_history (
      extraction_id, action, new_values, performed_by
    ) VALUES (
      NEW.id, 'created', to_jsonb(NEW), NEW.processed_by
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine what action was taken
    DECLARE
      v_action TEXT;
    BEGIN
      IF OLD.reviewed_at IS NULL AND NEW.reviewed_at IS NOT NULL THEN
        v_action := 'reviewed';
      ELSIF OLD.approved_at IS NULL AND NEW.approved_at IS NOT NULL THEN
        v_action := 'approved';
      ELSIF OLD.applied_to_property = FALSE AND NEW.applied_to_property = TRUE THEN
        v_action := 'applied';
      ELSE
        v_action := 'updated';
      END IF;
      
      INSERT INTO extraction_history (
        extraction_id, action, previous_values, new_values, performed_by
      ) VALUES (
        NEW.id, v_action, to_jsonb(OLD), to_jsonb(NEW), COALESCE(NEW.reviewed_by, NEW.approved_by, NEW.processed_by)
      );
    END;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: maintenance_cleanup_maps_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.maintenance_cleanup_maps_data() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    cleanup_summary text;
    expired_cache_count integer;
    old_executions_count integer;
BEGIN
    -- Clean up expired cache entries
    SELECT public.cleanup_expired_intelligence_cache() INTO expired_cache_count;
    
    -- Clean up old failed API executions (older than 30 days)
    DELETE FROM public.maps_api_executions 
    WHERE status = 'failed' 
    AND created_at < now() - interval '30 days';
    
    GET DIAGNOSTICS old_executions_count = ROW_COUNT;
    
    -- Build summary
    cleanup_summary := format(
        'Cleanup completed: %s expired cache entries removed, %s old failed executions removed',
        expired_cache_count,
        old_executions_count
    );
    
    RETURN cleanup_summary;
END;
$$;


--
-- Name: properties_in_hurricane_path(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.properties_in_hurricane_path(storm_id_param text) RETURNS TABLE(property_id uuid, address text, distance_from_center numeric, wind_speed_category text, surge_risk text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.address,
    ST_Distance(
      p.location::geography,
      h.current_location
    ) / 1000 AS distance_from_center,
    CASE 
      WHEN ST_Distance(p.location::geography, h.current_location) < 50000 THEN 'extreme'
      WHEN ST_Distance(p.location::geography, h.current_location) < 100000 THEN 'high'
      WHEN ST_Distance(p.location::geography, h.current_location) < 200000 THEN 'moderate'
      ELSE 'low'
    END AS wind_speed_category,
    CASE 
      WHEN p.elevation < 10 AND ST_Distance(p.location::geography, h.current_location) < 100000 THEN 'extreme'
      WHEN p.elevation < 20 AND ST_Distance(p.location::geography, h.current_location) < 200000 THEN 'high'
      ELSE 'moderate'
    END AS surge_risk
  FROM properties p
  CROSS JOIN noaa_hurricane_tracks h
  WHERE h.storm_id = storm_id_param
    AND ST_DWithin(
      p.location::geography,
      h.cone_of_uncertainty,
      0
    )
  ORDER BY distance_from_center;
END;
$$;


--
-- Name: refresh_ai_metrics_realtime(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_ai_metrics_realtime() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_metrics_realtime;
END;
$$;


--
-- Name: refresh_expansion_dashboard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_expansion_dashboard() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY expansion_dashboard_summary;
END;
$$;


--
-- Name: update_organization_usage(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_organization_usage(org_id uuid, usage_type text, increment_by integer DEFAULT 1) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  CASE usage_type
    WHEN 'users' THEN
      UPDATE enterprise_organizations 
      SET current_users = current_users + increment_by
      WHERE id = org_id;
    WHEN 'properties' THEN
      UPDATE enterprise_organizations 
      SET current_properties = current_properties + increment_by
      WHERE id = org_id;
    WHEN 'claims' THEN
      UPDATE enterprise_organizations 
      SET current_claims = current_claims + increment_by
      WHERE id = org_id;
    WHEN 'ai_requests' THEN
      UPDATE enterprise_organizations 
      SET current_ai_requests = current_ai_requests + increment_by
      WHERE id = org_id;
  END CASE;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


--
-- Name: update_policy_extraction(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_policy_extraction(p_document_id uuid, p_extracted_data jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_policy_id UUID;
  v_property_id UUID;
BEGIN
  -- Get the associated policy and property IDs
  SELECT policy_id, property_id INTO v_policy_id, v_property_id
  FROM public.policy_documents
  WHERE id = p_document_id;

  -- Insert or update the extraction record
  INSERT INTO public.document_extractions (
    document_id,
    property_id,
    extracted_data,
    processing_status,
    confidence_score,
    processed_at,
    processed_by
  ) VALUES (
    p_document_id,
    v_property_id,
    p_extracted_data,
    'completed',
    COALESCE((p_extracted_data->>'confidence')::float, 0.8),
    NOW(),
    'ai-document-extraction'
  )
  ON CONFLICT (document_id) DO UPDATE SET
    extracted_data = EXCLUDED.extracted_data,
    processing_status = EXCLUDED.processing_status,
    confidence_score = EXCLUDED.confidence_score,
    processed_at = EXCLUDED.processed_at,
    processed_by = EXCLUDED.processed_by;

  -- If we have a policy_id, update the policy with extracted data
  IF v_policy_id IS NOT NULL AND p_extracted_data IS NOT NULL THEN
    UPDATE public.policies
    SET 
      carrier_name = COALESCE(p_extracted_data->>'carrier', carrier_name),
      policy_number = COALESCE(p_extracted_data->>'policyNumber', policy_number),
      effective_date = COALESCE((p_extracted_data->>'effectiveDate')::date, effective_date),
      expiration_date = COALESCE((p_extracted_data->>'expirationDate')::date, expiration_date),
      annual_premium = COALESCE((p_extracted_data->>'premium')::decimal(10,2), annual_premium),
      coverage_details = COALESCE(
        jsonb_build_object(
          'dwelling', p_extracted_data->>'coverageDwelling',
          'other_structures', p_extracted_data->>'coverageOtherStructures',
          'personal_property', p_extracted_data->>'coveragePersonalProperty',
          'loss_of_use', p_extracted_data->>'coverageLossOfUse',
          'liability', p_extracted_data->>'coverageLiability',
          'medical_payments', p_extracted_data->>'coverageMedicalPayments'
        ),
        coverage_details
      ),
      deductibles = COALESCE(
        jsonb_build_object(
          'standard', p_extracted_data->>'standardDeductible',
          'hurricane', p_extracted_data->>'hurricaneDeductible',
          'flood', p_extracted_data->>'floodDeductible'
        ),
        deductibles
      ),
      updated_at = NOW()
    WHERE id = v_policy_id;
  END IF;
END;
$$;


--
-- Name: update_policy_recommendations_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_policy_recommendations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_state_configuration(character, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_state_configuration(target_state_code character, config_data jsonb) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO state_configurations (
    state_code,
    state_name,
    is_active,
    insurance_regulations,
    data_sources,
    market_data,
    operations,
    features,
    deployment_status,
    updated_at,
    last_modified_by
  )
  VALUES (
    target_state_code,
    config_data->>'state_name',
    (config_data->>'is_active')::BOOLEAN,
    COALESCE(config_data->'insurance_regulations', '{}'),
    COALESCE(config_data->'data_sources', '{}'),
    COALESCE(config_data->'market_data', '{}'),
    COALESCE(config_data->'operations', '{}'),
    COALESCE(config_data->'features', '{}'),
    COALESCE(config_data->>'deployment_status', 'planning'),
    NOW(),
    COALESCE(config_data->>'last_modified_by', 'system')
  )
  ON CONFLICT (state_code) 
  DO UPDATE SET
    state_name = EXCLUDED.state_name,
    is_active = EXCLUDED.is_active,
    insurance_regulations = EXCLUDED.insurance_regulations,
    data_sources = EXCLUDED.data_sources,
    market_data = EXCLUDED.market_data,
    operations = EXCLUDED.operations,
    features = EXCLUDED.features,
    deployment_status = EXCLUDED.deployment_status,
    updated_at = EXCLUDED.updated_at,
    last_modified_by = EXCLUDED.last_modified_by;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: user_has_permission(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_permission(permission_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  user_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM organization_users
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1;
  
  -- Check role-based permissions
  CASE user_role
    WHEN 'owner' THEN has_permission := TRUE;
    WHEN 'admin' THEN 
      has_permission := permission_name NOT LIKE 'billing%' OR permission_name LIKE 'billing.view';
    WHEN 'manager' THEN
      has_permission := permission_name IN ('properties.read', 'properties.write', 'claims.read', 'claims.write', 'users.read');
    WHEN 'member' THEN
      has_permission := permission_name IN ('properties.read', 'claims.read', 'claims.write');
    WHEN 'viewer' THEN
      has_permission := permission_name IN ('properties.read', 'claims.read');
  END CASE;
  
  RETURN has_permission;
END;
$$;


--
-- Name: autofix_signup_privileges(); Type: FUNCTION; Schema: util; Owner: -
--

CREATE FUNCTION util.autofix_signup_privileges() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  r RECORD;
BEGIN
  -- Fix any users that don't have profiles
  FOR r IN 
    SELECT u.id, u.email 
    FROM auth.users u
    LEFT JOIN public.user_profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.user_profiles (id, email, created_at, updated_at)
    VALUES (r.id, r.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Also ensure they have a role
    INSERT INTO core.user_role (user_id, role, is_active, created_at)
    VALUES (r.id, 'user', true, NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END;
$$;


--
-- Name: FUNCTION autofix_signup_privileges(); Type: COMMENT; Schema: util; Owner: -
--

COMMENT ON FUNCTION util.autofix_signup_privileges() IS 'Batch function to fix users without profiles - can be called by pg_cron';


SET default_table_access_method = heap;

--
-- Name: achievement_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievement_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    icon text,
    points_per_level integer[] NOT NULL,
    level_names text[],
    rewards jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_forecasts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_forecasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    forecast_horizon interval NOT NULL,
    metric_name text NOT NULL,
    forecast_timestamps timestamp with time zone[] NOT NULL,
    forecast_values numeric(15,6)[] NOT NULL,
    confidence_intervals jsonb,
    forecasting_model text DEFAULT 'linear_regression'::text NOT NULL,
    model_parameters jsonb DEFAULT '{}'::jsonb,
    training_period_start timestamp with time zone NOT NULL,
    training_period_end timestamp with time zone NOT NULL,
    mae numeric(10,6),
    rmse numeric(10,6),
    mape numeric(5,2),
    feature_id text,
    model_name text,
    provider text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_metrics_aggregated; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_metrics_aggregated (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    time_bucket timestamp with time zone NOT NULL,
    window_size interval NOT NULL,
    metric_name text NOT NULL,
    count bigint DEFAULT 0 NOT NULL,
    sum_value numeric(20,6) DEFAULT 0 NOT NULL,
    avg_value numeric(15,6) DEFAULT 0 NOT NULL,
    min_value numeric(15,6),
    max_value numeric(15,6),
    stddev_value numeric(15,6),
    percentile_50 numeric(15,6),
    percentile_95 numeric(15,6),
    percentile_99 numeric(15,6),
    feature_id text,
    model_name text,
    provider text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: analytics_aggregated; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_aggregated (
    "timestamp" timestamp with time zone NOT NULL,
    "interval" text NOT NULL,
    total_requests integer DEFAULT 0 NOT NULL,
    cache_hit_rate numeric(5,2) DEFAULT 0,
    avg_response_time numeric(10,2) DEFAULT 0,
    total_cost numeric(10,4) DEFAULT 0,
    error_rate numeric(5,2) DEFAULT 0,
    active_users integer DEFAULT 0,
    top_features jsonb DEFAULT '[]'::jsonb,
    model_performance jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT analytics_aggregated_interval_check CHECK (("interval" = ANY (ARRAY['1m'::text, '5m'::text, '1h'::text, '1d'::text])))
);


--
-- Name: community_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    damage_type text NOT NULL,
    county text NOT NULL,
    state text DEFAULT 'FL'::text,
    settlement_bracket integer,
    days_to_settle integer,
    claim_year integer,
    claim_month integer,
    success_factors jsonb,
    insurance_company_type text,
    property_type text,
    total_samples integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: community_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    insight_type text NOT NULL,
    damage_type text,
    geographic_area text,
    insight_data jsonb NOT NULL,
    confidence_score numeric(3,2),
    sample_size integer NOT NULL,
    valid_from date DEFAULT CURRENT_DATE,
    valid_until date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_insights_confidence_score_check CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))
);


--
-- Name: community_insights_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_insights_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cache_key text NOT NULL,
    insights_data jsonb NOT NULL,
    privacy_guarantee jsonb NOT NULL,
    filters_applied jsonb,
    generated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cost_analysis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.cost_analysis AS
 SELECT date_trunc('day'::text, "timestamp") AS date,
    sum(total_cost) AS daily_cost,
    avg(cache_hit_rate) AS avg_cache_hit_rate,
    sum(total_requests) AS daily_requests,
    avg(avg_response_time) AS avg_response_time
   FROM public.analytics_aggregated
  WHERE ("interval" = '1h'::text)
  GROUP BY (date_trunc('day'::text, "timestamp"))
  ORDER BY (date_trunc('day'::text, "timestamp")) DESC;


--
-- Name: crisis_action_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crisis_action_templates (
    id text NOT NULL,
    crisis_type text NOT NULL,
    severity_min integer NOT NULL,
    severity_max integer NOT NULL,
    category text NOT NULL,
    priority text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    instructions jsonb DEFAULT '[]'::jsonb NOT NULL,
    estimated_time integer DEFAULT 0 NOT NULL,
    requires_assistance boolean DEFAULT false NOT NULL,
    dependencies text[] DEFAULT '{}'::text[],
    conditions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crisis_action_templates_category_check CHECK ((category = ANY (ARRAY['immediate'::text, 'preparation'::text, 'during_event'::text, 'post_event'::text, 'recovery'::text]))),
    CONSTRAINT crisis_action_templates_priority_check CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT crisis_action_templates_severity_max_check CHECK (((severity_max >= 1) AND (severity_max <= 5))),
    CONSTRAINT crisis_action_templates_severity_min_check CHECK (((severity_min >= 1) AND (severity_min <= 5)))
);


--
-- Name: enterprise_organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enterprise_organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_name text NOT NULL,
    organization_code text NOT NULL,
    domain text NOT NULL,
    additional_domains text[],
    subscription_tier text DEFAULT 'standard'::text NOT NULL,
    billing_cycle text DEFAULT 'monthly'::text NOT NULL,
    subscription_status text DEFAULT 'active'::text NOT NULL,
    user_limit integer DEFAULT 50,
    property_limit integer DEFAULT 1000,
    claim_limit integer DEFAULT 5000,
    ai_request_limit integer DEFAULT 10000,
    storage_limit_gb integer DEFAULT 100,
    current_users integer DEFAULT 0,
    current_properties integer DEFAULT 0,
    current_claims integer DEFAULT 0,
    current_ai_requests integer DEFAULT 0,
    current_storage_gb numeric(10,2) DEFAULT 0,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    feature_flags jsonb DEFAULT '{}'::jsonb NOT NULL,
    branding jsonb DEFAULT '{}'::jsonb NOT NULL,
    integrations jsonb DEFAULT '{}'::jsonb NOT NULL,
    allowed_states text[] DEFAULT ARRAY['FL'::text] NOT NULL,
    primary_state character(2) DEFAULT 'FL'::bpchar NOT NULL,
    primary_contact_email text NOT NULL,
    billing_email text,
    technical_contact_email text,
    phone text,
    address jsonb DEFAULT '{}'::jsonb,
    trial_start_date timestamp with time zone,
    trial_end_date timestamp with time zone,
    subscription_start_date timestamp with time zone,
    next_billing_date timestamp with time zone,
    sso_enabled boolean DEFAULT false,
    sso_provider text,
    sso_configuration jsonb DEFAULT '{}'::jsonb,
    require_2fa boolean DEFAULT false,
    ip_whitelist text[],
    data_region text DEFAULT 'us-east-1'::text NOT NULL,
    compliance_requirements text[] DEFAULT '{}'::text[],
    data_retention_policy jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by text,
    last_modified_by text,
    notes text,
    CONSTRAINT enterprise_organizations_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'annual'::text]))),
    CONSTRAINT enterprise_organizations_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'suspended'::text, 'cancelled'::text]))),
    CONSTRAINT enterprise_organizations_subscription_tier_check CHECK ((subscription_tier = ANY (ARRAY['standard'::text, 'professional'::text, 'enterprise'::text, 'custom'::text])))
);


--
-- Name: state_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.state_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_code character(2) NOT NULL,
    state_name text NOT NULL,
    is_active boolean DEFAULT false,
    insurance_regulations jsonb DEFAULT '{}'::jsonb NOT NULL,
    data_sources jsonb DEFAULT '{}'::jsonb NOT NULL,
    market_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    operations jsonb DEFAULT '{}'::jsonb NOT NULL,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    deployment_status text DEFAULT 'planning'::text,
    launch_date timestamp with time zone,
    migration_complete boolean DEFAULT false,
    data_load_status jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by text,
    last_modified_by text,
    notes text,
    CONSTRAINT state_configurations_deployment_status_check CHECK ((deployment_status = ANY (ARRAY['planning'::text, 'development'::text, 'testing'::text, 'staging'::text, 'production'::text])))
);


--
-- Name: state_data_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.state_data_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_code character(2) NOT NULL,
    source_type text NOT NULL,
    provider_name text NOT NULL,
    provider_contact jsonb DEFAULT '{}'::jsonb,
    integration_type text NOT NULL,
    endpoint_url text,
    authentication jsonb DEFAULT '{}'::jsonb,
    data_format text,
    update_frequency text,
    cost_structure jsonb DEFAULT '{}'::jsonb,
    data_volume_estimate bigint,
    reliability_score numeric(3,2),
    data_quality_score numeric(3,2),
    last_successful_sync timestamp with time zone,
    sync_failure_count integer DEFAULT 0,
    status text DEFAULT 'inactive'::text,
    activated_at timestamp with time zone,
    deactivated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by text,
    notes text,
    CONSTRAINT state_data_sources_data_format_check CHECK ((data_format = ANY (ARRAY['json'::text, 'xml'::text, 'csv'::text, 'xlsx'::text, 'shp'::text, 'geojson'::text]))),
    CONSTRAINT state_data_sources_data_quality_score_check CHECK (((data_quality_score >= (0)::numeric) AND (data_quality_score <= (1)::numeric))),
    CONSTRAINT state_data_sources_integration_type_check CHECK ((integration_type = ANY (ARRAY['api'::text, 'ftp'::text, 'sftp'::text, 'email'::text, 'manual'::text, 'scraping'::text]))),
    CONSTRAINT state_data_sources_reliability_score_check CHECK (((reliability_score >= (0)::numeric) AND (reliability_score <= (1)::numeric))),
    CONSTRAINT state_data_sources_source_type_check CHECK ((source_type = ANY (ARRAY['parcel_data'::text, 'courthouse_data'::text, 'weather_data'::text, 'insurance_data'::text, 'census_data'::text]))),
    CONSTRAINT state_data_sources_status_check CHECK ((status = ANY (ARRAY['inactive'::text, 'testing'::text, 'active'::text, 'deprecated'::text, 'failed'::text]))),
    CONSTRAINT state_data_sources_update_frequency_check CHECK ((update_frequency = ANY (ARRAY['real_time'::text, 'hourly'::text, 'daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'annual'::text])))
);


--
-- Name: state_deployment_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.state_deployment_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_code character(2) NOT NULL,
    deployment_phase text NOT NULL,
    task_name text NOT NULL,
    task_description text,
    task_category text,
    planned_start_date timestamp with time zone,
    planned_end_date timestamp with time zone,
    actual_start_date timestamp with time zone,
    actual_end_date timestamp with time zone,
    dependencies text[],
    blocking_tasks text[],
    status text DEFAULT 'pending'::text,
    completion_percentage numeric(5,2) DEFAULT 0,
    assigned_team text,
    estimated_effort_hours numeric(8,2),
    actual_effort_hours numeric(8,2),
    budget_allocated numeric(12,2),
    budget_spent numeric(12,2),
    risk_level text DEFAULT 'low'::text,
    current_issues jsonb DEFAULT '[]'::jsonb,
    mitigation_actions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by text,
    last_updated_by text,
    notes text,
    CONSTRAINT state_deployment_tracking_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT state_deployment_tracking_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'blocked'::text, 'cancelled'::text]))),
    CONSTRAINT state_deployment_tracking_task_category_check CHECK ((task_category = ANY (ARRAY['regulatory'::text, 'technical'::text, 'operational'::text, 'marketing'::text, 'legal'::text, 'data'::text])))
);


--
-- Name: state_market_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.state_market_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_code character(2) NOT NULL,
    analysis_date date NOT NULL,
    total_market_size numeric(15,2),
    addressable_market numeric(15,2),
    current_penetration numeric(5,4),
    target_penetration numeric(5,4),
    major_competitors jsonb DEFAULT '[]'::jsonb,
    market_leaders jsonb DEFAULT '[]'::jsonb,
    competitive_advantages jsonb DEFAULT '[]'::jsonb,
    threats jsonb DEFAULT '[]'::jsonb,
    customer_segments jsonb DEFAULT '[]'::jsonb,
    target_demographics jsonb DEFAULT '{}'::jsonb,
    customer_acquisition_cost numeric(10,2),
    lifetime_value numeric(10,2),
    regulatory_complexity text,
    market_maturity text,
    seasonal_factors jsonb DEFAULT '{}'::jsonb,
    economic_indicators jsonb DEFAULT '{}'::jsonb,
    market_risks jsonb DEFAULT '[]'::jsonb,
    operational_risks jsonb DEFAULT '[]'::jsonb,
    regulatory_risks jsonb DEFAULT '[]'::jsonb,
    market_entry_strategy text,
    recommended_features jsonb DEFAULT '[]'::jsonb,
    pricing_strategy jsonb DEFAULT '{}'::jsonb,
    marketing_strategy text,
    analyst text,
    confidence_score numeric(3,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    notes text,
    CONSTRAINT state_market_analysis_confidence_score_check CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric))),
    CONSTRAINT state_market_analysis_market_maturity_check CHECK ((market_maturity = ANY (ARRAY['emerging'::text, 'growing'::text, 'mature'::text, 'declining'::text]))),
    CONSTRAINT state_market_analysis_regulatory_complexity_check CHECK ((regulatory_complexity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: state_regulatory_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.state_regulatory_requirements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    state_code character(2) NOT NULL,
    requirement_type text NOT NULL,
    requirement_name text NOT NULL,
    description text,
    issuing_authority text NOT NULL,
    contact_information jsonb DEFAULT '{}'::jsonb,
    is_mandatory boolean DEFAULT true,
    application_process text,
    required_documents text[],
    fees jsonb DEFAULT '{}'::jsonb,
    processing_time_days integer,
    validity_period_days integer,
    renewal_required boolean DEFAULT false,
    advance_notice_days integer,
    prerequisites text[],
    dependent_requirements uuid[],
    compliance_status text DEFAULT 'not_started'::text,
    application_date timestamp with time zone,
    approval_date timestamp with time zone,
    expiry_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by text,
    notes text,
    CONSTRAINT state_regulatory_requirements_compliance_status_check CHECK ((compliance_status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'pending_approval'::text, 'compliant'::text, 'expired'::text, 'rejected'::text]))),
    CONSTRAINT state_regulatory_requirements_requirement_type_check CHECK ((requirement_type = ANY (ARRAY['license'::text, 'certification'::text, 'bond'::text, 'insurance'::text, 'registration'::text, 'disclosure'::text, 'reporting'::text])))
);


--
-- Name: us_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.us_states (
    state_code character(2) NOT NULL,
    state_name text NOT NULL,
    region text NOT NULL,
    population integer,
    gdp bigint,
    insurance_market_size numeric(15,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: expansion_dashboard_summary; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.expansion_dashboard_summary AS
 SELECT s.state_code,
    s.state_name,
    s.region,
    s.population,
    s.insurance_market_size,
    COALESCE(sc.is_active, false) AS is_active,
    COALESCE(sc.deployment_status, 'planning'::text) AS deployment_status,
    COALESCE(( SELECT count(*) AS count
           FROM public.state_regulatory_requirements srr
          WHERE ((srr.state_code = s.state_code) AND (srr.compliance_status = 'compliant'::text))), (0)::bigint) AS regulatory_compliance_count,
    COALESCE(( SELECT count(*) AS count
           FROM public.state_data_sources sds
          WHERE ((sds.state_code = s.state_code) AND (sds.status = 'active'::text))), (0)::bigint) AS active_data_sources,
    (EXISTS ( SELECT 1
           FROM public.state_market_analysis sma
          WHERE ((sma.state_code = s.state_code) AND (sma.analysis_date >= (CURRENT_DATE - '6 mons'::interval))))) AS has_recent_market_analysis,
    COALESCE(( SELECT avg(sdt.completion_percentage) AS avg
           FROM public.state_deployment_tracking sdt
          WHERE (sdt.state_code = s.state_code)), (0)::numeric) AS avg_deployment_progress,
    COALESCE(sc.updated_at, s.updated_at) AS last_updated
   FROM (public.us_states s
     LEFT JOIN public.state_configurations sc ON ((s.state_code = sc.state_code)))
  ORDER BY s.state_name
  WITH NO DATA;


--
-- Name: expansion_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expansion_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phase integer NOT NULL,
    states text[] NOT NULL,
    timeline_start timestamp with time zone NOT NULL,
    timeline_end timestamp with time zone NOT NULL,
    milestones jsonb DEFAULT '[]'::jsonb,
    resources jsonb DEFAULT '{}'::jsonb,
    risks jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'planned'::text,
    completion_percentage numeric(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by text,
    notes text,
    CONSTRAINT expansion_plans_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: feature_usage_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_usage_analytics (
    feature_id text NOT NULL,
    date date NOT NULL,
    total_requests integer DEFAULT 0,
    unique_users integer DEFAULT 0,
    total_cost numeric(10,4) DEFAULT 0,
    avg_response_time numeric(10,2) DEFAULT 0,
    cache_hit_rate numeric(5,2) DEFAULT 0,
    error_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: model_performance_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_performance_analytics (
    model_name text NOT NULL,
    provider text NOT NULL,
    date date NOT NULL,
    total_requests integer DEFAULT 0,
    avg_response_time numeric(10,2) DEFAULT 0,
    error_rate numeric(5,2) DEFAULT 0,
    total_cost numeric(10,4) DEFAULT 0,
    fallback_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: noaa_climate_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_climate_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    station_id text,
    station_name text,
    record_date date,
    record_type text,
    value numeric,
    normal_value numeric,
    departure_from_normal numeric,
    percentile_rank integer,
    historical_rank integer,
    period text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: noaa_drought_monitor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_drought_monitor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    county_fips text,
    county_name text,
    state text DEFAULT 'FL'::text,
    drought_level text,
    percent_area numeric,
    population_affected integer,
    valid_date date,
    impacts text[],
    outlook text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: noaa_fire_weather; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_fire_weather (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    zone_id text,
    zone_name text,
    fire_danger_rating text,
    relative_humidity numeric,
    wind_speed numeric,
    temperature numeric,
    fuel_moisture_1hr numeric,
    fuel_moisture_10hr numeric,
    fuel_moisture_100hr numeric,
    keetch_byram_index integer,
    haines_index integer,
    red_flag_warning boolean DEFAULT false,
    fire_weather_watch boolean DEFAULT false,
    prescribed_burn_conditions text,
    valid_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: noaa_forecasts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_forecasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_name text,
    latitude numeric,
    longitude numeric,
    period_name text,
    period_number integer,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    is_daytime boolean,
    temperature integer,
    temperature_unit text,
    temperature_trend text,
    wind_speed text,
    wind_direction text,
    short_forecast text,
    detailed_forecast text,
    icon_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: noaa_ingestion_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_ingestion_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data_type text NOT NULL,
    severity_level text,
    records_processed integer,
    records_failed integer,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    duration_ms integer,
    error_details jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: noaa_marine_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_marine_conditions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    zone_id text NOT NULL,
    zone_name text,
    wave_height numeric,
    wave_period numeric,
    wave_direction integer,
    dominant_wave_period numeric,
    swell_height numeric,
    swell_direction integer,
    swell_period numeric,
    wind_wave_height numeric,
    wind_speed text,
    wind_direction text,
    sea_state text,
    water_temperature numeric,
    rip_current_risk text,
    small_craft_advisory boolean DEFAULT false,
    gale_warning boolean DEFAULT false,
    storm_warning boolean DEFAULT false,
    hurricane_warning boolean DEFAULT false,
    forecast_text text,
    valid_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: noaa_radar_imagery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_radar_imagery (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id text,
    site_name text,
    base_reflectivity text,
    base_velocity text,
    storm_relative_motion text,
    one_hour_precipitation text,
    composite_reflectivity text,
    echo_tops text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: noaa_space_weather; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_space_weather (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alert_type text,
    severity text,
    scale_value text,
    onset_time timestamp with time zone,
    peak_time timestamp with time zone,
    end_time timestamp with time zone,
    affected_systems text[],
    kp_index numeric,
    solar_flux numeric,
    proton_flux numeric,
    electron_flux numeric,
    description text,
    impacts text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: noaa_tide_and_current_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noaa_tide_and_current_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    station_id text NOT NULL,
    station_name text,
    observation_time timestamp with time zone NOT NULL,
    water_level numeric,
    water_temperature numeric,
    salinity numeric,
    current_speed numeric,
    current_direction integer,
    data_type text,
    datum text,
    quality text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    channels jsonb DEFAULT '["email"]'::jsonb,
    subject_template text,
    body_template text NOT NULL,
    variables jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: organization_billing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_billing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    users_count integer DEFAULT 0 NOT NULL,
    properties_count integer DEFAULT 0 NOT NULL,
    claims_count integer DEFAULT 0 NOT NULL,
    ai_requests_count integer DEFAULT 0 NOT NULL,
    storage_gb numeric(10,2) DEFAULT 0 NOT NULL,
    base_cost numeric(12,2) DEFAULT 0 NOT NULL,
    overage_costs jsonb DEFAULT '{}'::jsonb,
    total_cost numeric(12,2) DEFAULT 0 NOT NULL,
    invoice_status text DEFAULT 'draft'::text NOT NULL,
    invoice_number text,
    invoice_date date,
    due_date date,
    paid_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT organization_billing_invoice_status_check CHECK ((invoice_status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: organization_customizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_customizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    theme jsonb DEFAULT '{}'::jsonb,
    logo_url text,
    favicon_url text,
    custom_css text,
    enabled_features text[] DEFAULT '{}'::text[],
    disabled_features text[] DEFAULT '{}'::text[],
    feature_limits jsonb DEFAULT '{}'::jsonb,
    claim_workflow jsonb DEFAULT '{}'::jsonb,
    approval_workflows jsonb DEFAULT '{}'::jsonb,
    notification_preferences jsonb DEFAULT '{}'::jsonb,
    webhook_urls jsonb DEFAULT '{}'::jsonb,
    api_keys jsonb DEFAULT '{}'::jsonb,
    external_integrations jsonb DEFAULT '{}'::jsonb,
    security_policies jsonb DEFAULT '{}'::jsonb,
    data_export_settings jsonb DEFAULT '{}'::jsonb,
    audit_settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by text
);


--
-- Name: partition_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.partition_status AS
 SELECT n.nspname AS schema_name,
    c.relname AS table_name,
    p.relname AS partition_name,
    pg_size_pretty(pg_relation_size((c.oid)::regclass)) AS size,
    (c.reltuples)::bigint AS estimated_rows,
        CASE
            WHEN (c.relname ~~ '%analytics_events%'::text) THEN 'time-series'::text
            WHEN (c.relname ~~ '%florida_parcels%'::text) THEN 'geographic'::text
            WHEN (c.relname ~~ '%claims%'::text) THEN 'composite'::text
            WHEN (c.relname ~~ '%hash%'::text) THEN 'hash'::text
            ELSE 'other'::text
        END AS partition_type
   FROM (((pg_class c
     JOIN pg_inherits i ON ((c.oid = i.inhrelid)))
     JOIN pg_class p ON ((i.inhparent = p.oid)))
     JOIN pg_namespace n ON ((c.relnamespace = n.oid)))
  WHERE (c.relkind = 'r'::"char")
  ORDER BY p.relname, c.relname;


--
-- Name: real_time_metrics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.real_time_metrics AS
 SELECT "interval",
    "timestamp",
    total_requests,
    cache_hit_rate,
    avg_response_time,
    total_cost,
    error_rate,
    active_users
   FROM public.analytics_aggregated
  WHERE ("timestamp" > (now() - '24:00:00'::interval))
  ORDER BY "timestamp" DESC;


--
-- Name: service_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    company_name text NOT NULL,
    contact_name text,
    email text,
    phone text,
    website text,
    service_areas jsonb,
    specialties jsonb,
    rating numeric(3,2),
    review_count integer DEFAULT 0,
    commission_type text,
    commission_details jsonb,
    disclosure_text text NOT NULL,
    is_active boolean DEFAULT true,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_config (
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    damage_type text,
    steps jsonb NOT NULL,
    success_criteria jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_triggers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trigger_type text NOT NULL,
    trigger_config jsonb NOT NULL,
    template_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: achievement_definitions achievement_definitions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievement_definitions
    ADD CONSTRAINT achievement_definitions_code_key UNIQUE (code);


--
-- Name: achievement_definitions achievement_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievement_definitions
    ADD CONSTRAINT achievement_definitions_pkey PRIMARY KEY (id);


--
-- Name: ai_forecasts ai_forecasts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_forecasts
    ADD CONSTRAINT ai_forecasts_pkey PRIMARY KEY (id);


--
-- Name: ai_metrics_aggregated ai_metrics_aggregated_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_metrics_aggregated
    ADD CONSTRAINT ai_metrics_aggregated_pkey PRIMARY KEY (id);


--
-- Name: ai_metrics_aggregated ai_metrics_aggregated_time_bucket_window_size_metric_name_f_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_metrics_aggregated
    ADD CONSTRAINT ai_metrics_aggregated_time_bucket_window_size_metric_name_f_key UNIQUE (time_bucket, window_size, metric_name, feature_id, model_name, provider);


--
-- Name: analytics_aggregated analytics_aggregated_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_aggregated
    ADD CONSTRAINT analytics_aggregated_pkey PRIMARY KEY ("timestamp", "interval");


--
-- Name: community_claims community_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_claims
    ADD CONSTRAINT community_claims_pkey PRIMARY KEY (id);


--
-- Name: community_insights_cache community_insights_cache_cache_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_insights_cache
    ADD CONSTRAINT community_insights_cache_cache_key_key UNIQUE (cache_key);


--
-- Name: community_insights_cache community_insights_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_insights_cache
    ADD CONSTRAINT community_insights_cache_pkey PRIMARY KEY (id);


--
-- Name: community_insights community_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_insights
    ADD CONSTRAINT community_insights_pkey PRIMARY KEY (id);


--
-- Name: crisis_action_templates crisis_action_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crisis_action_templates
    ADD CONSTRAINT crisis_action_templates_pkey PRIMARY KEY (id);


--
-- Name: enterprise_organizations enterprise_organizations_organization_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_organizations
    ADD CONSTRAINT enterprise_organizations_organization_code_key UNIQUE (organization_code);


--
-- Name: enterprise_organizations enterprise_organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_organizations
    ADD CONSTRAINT enterprise_organizations_pkey PRIMARY KEY (id);


--
-- Name: expansion_plans expansion_plans_phase_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expansion_plans
    ADD CONSTRAINT expansion_plans_phase_key UNIQUE (phase);


--
-- Name: expansion_plans expansion_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expansion_plans
    ADD CONSTRAINT expansion_plans_pkey PRIMARY KEY (id);


--
-- Name: feature_usage_analytics feature_usage_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_usage_analytics
    ADD CONSTRAINT feature_usage_analytics_pkey PRIMARY KEY (feature_id, date);


--
-- Name: model_performance_analytics model_performance_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_performance_analytics
    ADD CONSTRAINT model_performance_analytics_pkey PRIMARY KEY (model_name, provider, date);


--
-- Name: noaa_climate_records noaa_climate_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_climate_records
    ADD CONSTRAINT noaa_climate_records_pkey PRIMARY KEY (id);


--
-- Name: noaa_drought_monitor noaa_drought_monitor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_drought_monitor
    ADD CONSTRAINT noaa_drought_monitor_pkey PRIMARY KEY (id);


--
-- Name: noaa_fire_weather noaa_fire_weather_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_fire_weather
    ADD CONSTRAINT noaa_fire_weather_pkey PRIMARY KEY (id);


--
-- Name: noaa_forecasts noaa_forecasts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_forecasts
    ADD CONSTRAINT noaa_forecasts_pkey PRIMARY KEY (id);


--
-- Name: noaa_ingestion_logs noaa_ingestion_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_ingestion_logs
    ADD CONSTRAINT noaa_ingestion_logs_pkey PRIMARY KEY (id);


--
-- Name: noaa_marine_conditions noaa_marine_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_marine_conditions
    ADD CONSTRAINT noaa_marine_conditions_pkey PRIMARY KEY (id);


--
-- Name: noaa_radar_imagery noaa_radar_imagery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_radar_imagery
    ADD CONSTRAINT noaa_radar_imagery_pkey PRIMARY KEY (id);


--
-- Name: noaa_space_weather noaa_space_weather_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_space_weather
    ADD CONSTRAINT noaa_space_weather_pkey PRIMARY KEY (id);


--
-- Name: noaa_tide_and_current_data noaa_tide_and_current_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noaa_tide_and_current_data
    ADD CONSTRAINT noaa_tide_and_current_data_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: organization_billing organization_billing_organization_id_billing_period_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_billing
    ADD CONSTRAINT organization_billing_organization_id_billing_period_start_key UNIQUE (organization_id, billing_period_start);


--
-- Name: organization_billing organization_billing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_billing
    ADD CONSTRAINT organization_billing_pkey PRIMARY KEY (id);


--
-- Name: organization_customizations organization_customizations_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_customizations
    ADD CONSTRAINT organization_customizations_organization_id_key UNIQUE (organization_id);


--
-- Name: organization_customizations organization_customizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_customizations
    ADD CONSTRAINT organization_customizations_pkey PRIMARY KEY (id);


--
-- Name: service_providers service_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_providers
    ADD CONSTRAINT service_providers_pkey PRIMARY KEY (id);


--
-- Name: state_configurations state_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_configurations
    ADD CONSTRAINT state_configurations_pkey PRIMARY KEY (id);


--
-- Name: state_configurations state_configurations_state_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_configurations
    ADD CONSTRAINT state_configurations_state_code_key UNIQUE (state_code);


--
-- Name: state_data_sources state_data_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_data_sources
    ADD CONSTRAINT state_data_sources_pkey PRIMARY KEY (id);


--
-- Name: state_data_sources state_data_sources_state_code_source_type_provider_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_data_sources
    ADD CONSTRAINT state_data_sources_state_code_source_type_provider_name_key UNIQUE (state_code, source_type, provider_name);


--
-- Name: state_deployment_tracking state_deployment_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_deployment_tracking
    ADD CONSTRAINT state_deployment_tracking_pkey PRIMARY KEY (id);


--
-- Name: state_market_analysis state_market_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_market_analysis
    ADD CONSTRAINT state_market_analysis_pkey PRIMARY KEY (id);


--
-- Name: state_market_analysis state_market_analysis_state_code_analysis_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_market_analysis
    ADD CONSTRAINT state_market_analysis_state_code_analysis_date_key UNIQUE (state_code, analysis_date);


--
-- Name: state_regulatory_requirements state_regulatory_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_regulatory_requirements
    ADD CONSTRAINT state_regulatory_requirements_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (key);


--
-- Name: us_states us_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.us_states
    ADD CONSTRAINT us_states_pkey PRIMARY KEY (state_code);


--
-- Name: workflow_templates workflow_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_templates
    ADD CONSTRAINT workflow_templates_pkey PRIMARY KEY (id);


--
-- Name: workflow_triggers workflow_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_triggers
    ADD CONSTRAINT workflow_triggers_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_forecasts_generated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_forecasts_generated_at ON public.ai_forecasts USING btree (generated_at DESC);


--
-- Name: idx_ai_forecasts_metric_horizon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_forecasts_metric_horizon ON public.ai_forecasts USING btree (metric_name, forecast_horizon, generated_at DESC);


--
-- Name: idx_ai_metrics_aggregated_feature_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_metrics_aggregated_feature_model ON public.ai_metrics_aggregated USING btree (feature_id, model_name, time_bucket DESC);


--
-- Name: idx_ai_metrics_aggregated_time_metric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_metrics_aggregated_time_metric ON public.ai_metrics_aggregated USING btree (time_bucket DESC, metric_name);


--
-- Name: idx_ai_metrics_aggregated_window; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_metrics_aggregated_window ON public.ai_metrics_aggregated USING btree (window_size, time_bucket DESC);


--
-- Name: idx_analytics_aggregated_interval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_aggregated_interval ON public.analytics_aggregated USING btree ("interval");


--
-- Name: idx_analytics_aggregated_timestamp_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_aggregated_timestamp_desc ON public.analytics_aggregated USING btree ("timestamp" DESC);


--
-- Name: idx_community_claims_settlement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_claims_settlement ON public.community_claims USING btree (settlement_bracket);


--
-- Name: idx_community_claims_type_county; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_claims_type_county ON public.community_claims USING btree (damage_type, county);


--
-- Name: idx_community_insights_cache_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_insights_cache_expires_at ON public.community_insights_cache USING btree (expires_at);


--
-- Name: idx_community_insights_cache_generated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_insights_cache_generated_at ON public.community_insights_cache USING btree (generated_at);


--
-- Name: idx_community_insights_cache_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_insights_cache_key ON public.community_insights_cache USING btree (cache_key);


--
-- Name: idx_community_insights_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_insights_type ON public.community_insights USING btree (insight_type, damage_type);


--
-- Name: idx_deployment_tracking_state_phase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deployment_tracking_state_phase ON public.state_deployment_tracking USING btree (state_code, deployment_phase);


--
-- Name: idx_deployment_tracking_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deployment_tracking_status ON public.state_deployment_tracking USING btree (status, planned_end_date);


--
-- Name: idx_deployment_tracking_timeline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deployment_tracking_timeline ON public.state_deployment_tracking USING btree (planned_start_date, planned_end_date);


--
-- Name: idx_drought_county; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drought_county ON public.noaa_drought_monitor USING btree (county_fips, valid_date DESC);


--
-- Name: idx_enterprise_orgs_billing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_orgs_billing ON public.enterprise_organizations USING btree (next_billing_date) WHERE (subscription_status = 'active'::text);


--
-- Name: idx_enterprise_orgs_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_orgs_code ON public.enterprise_organizations USING btree (organization_code);


--
-- Name: idx_enterprise_orgs_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_orgs_domain ON public.enterprise_organizations USING btree (domain);


--
-- Name: idx_enterprise_orgs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_orgs_status ON public.enterprise_organizations USING btree (subscription_status, subscription_tier);


--
-- Name: idx_expansion_dashboard_summary_state; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_expansion_dashboard_summary_state ON public.expansion_dashboard_summary USING btree (state_code);


--
-- Name: idx_expansion_plans_phase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expansion_plans_phase ON public.expansion_plans USING btree (phase);


--
-- Name: idx_expansion_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expansion_plans_status ON public.expansion_plans USING btree (status, timeline_start);


--
-- Name: idx_feature_usage_cost; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feature_usage_cost ON public.feature_usage_analytics USING btree (total_cost DESC);


--
-- Name: idx_feature_usage_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feature_usage_date ON public.feature_usage_analytics USING btree (date DESC);


--
-- Name: idx_fire_zone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fire_zone ON public.noaa_fire_weather USING btree (zone_id, valid_time DESC);


--
-- Name: idx_forecasts_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forecasts_location ON public.noaa_forecasts USING btree (location_name, start_time DESC);


--
-- Name: idx_forecasts_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forecasts_time ON public.noaa_forecasts USING btree (start_time DESC);


--
-- Name: idx_marine_zone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marine_zone ON public.noaa_marine_conditions USING btree (zone_id, valid_time DESC);


--
-- Name: idx_market_analysis_penetration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_analysis_penetration ON public.state_market_analysis USING btree (target_penetration DESC, state_code);


--
-- Name: idx_market_analysis_state_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_analysis_state_date ON public.state_market_analysis USING btree (state_code, analysis_date DESC);


--
-- Name: idx_model_performance_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_model_performance_date ON public.model_performance_analytics USING btree (date DESC);


--
-- Name: idx_model_performance_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_model_performance_provider ON public.model_performance_analytics USING btree (provider);


--
-- Name: idx_org_billing_organization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_billing_organization ON public.organization_billing USING btree (organization_id, billing_period_start DESC);


--
-- Name: idx_org_billing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_billing_status ON public.organization_billing USING btree (invoice_status, due_date);


--
-- Name: idx_regulatory_requirements_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regulatory_requirements_expiry ON public.state_regulatory_requirements USING btree (expiry_date) WHERE (expiry_date IS NOT NULL);


--
-- Name: idx_regulatory_requirements_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regulatory_requirements_state ON public.state_regulatory_requirements USING btree (state_code, requirement_type);


--
-- Name: idx_regulatory_requirements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regulatory_requirements_status ON public.state_regulatory_requirements USING btree (compliance_status, state_code);


--
-- Name: idx_state_configurations_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_configurations_active ON public.state_configurations USING btree (is_active, state_code);


--
-- Name: idx_state_configurations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_configurations_status ON public.state_configurations USING btree (deployment_status, state_code);


--
-- Name: idx_state_configurations_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_configurations_updated ON public.state_configurations USING btree (updated_at DESC);


--
-- Name: idx_state_data_sources_state_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_data_sources_state_type ON public.state_data_sources USING btree (state_code, source_type);


--
-- Name: idx_state_data_sources_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_data_sources_status ON public.state_data_sources USING btree (status, state_code);


--
-- Name: idx_state_data_sources_sync; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_state_data_sources_sync ON public.state_data_sources USING btree (last_successful_sync DESC) WHERE (status = 'active'::text);


--
-- Name: idx_tide_station_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tide_station_time ON public.noaa_tide_and_current_data USING btree (station_id, observation_time DESC);


--
-- Name: idx_tide_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tide_time ON public.noaa_tide_and_current_data USING btree (observation_time DESC);


--
-- Name: state_deployment_tracking update_deployment_tracking_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deployment_tracking_updated_at BEFORE UPDATE ON public.state_deployment_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: enterprise_organizations update_enterprise_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_enterprise_organizations_updated_at BEFORE UPDATE ON public.enterprise_organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expansion_plans update_expansion_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_expansion_plans_updated_at BEFORE UPDATE ON public.expansion_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: state_market_analysis update_market_analysis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_market_analysis_updated_at BEFORE UPDATE ON public.state_market_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organization_billing update_organization_billing_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organization_billing_updated_at BEFORE UPDATE ON public.organization_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organization_customizations update_organization_customizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organization_customizations_updated_at BEFORE UPDATE ON public.organization_customizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: state_regulatory_requirements update_regulatory_requirements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_regulatory_requirements_updated_at BEFORE UPDATE ON public.state_regulatory_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: state_configurations update_state_configurations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_state_configurations_updated_at BEFORE UPDATE ON public.state_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: state_data_sources update_state_data_sources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_state_data_sources_updated_at BEFORE UPDATE ON public.state_data_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_config update_system_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organization_billing organization_billing_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_billing
    ADD CONSTRAINT organization_billing_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE;


--
-- Name: organization_customizations organization_customizations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_customizations
    ADD CONSTRAINT organization_customizations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE;


--
-- Name: state_configurations state_configurations_state_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_configurations
    ADD CONSTRAINT state_configurations_state_code_fkey FOREIGN KEY (state_code) REFERENCES public.us_states(state_code);


--
-- Name: state_data_sources state_data_sources_state_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_data_sources
    ADD CONSTRAINT state_data_sources_state_code_fkey FOREIGN KEY (state_code) REFERENCES public.us_states(state_code);


--
-- Name: state_deployment_tracking state_deployment_tracking_state_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_deployment_tracking
    ADD CONSTRAINT state_deployment_tracking_state_code_fkey FOREIGN KEY (state_code) REFERENCES public.us_states(state_code);


--
-- Name: state_market_analysis state_market_analysis_state_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_market_analysis
    ADD CONSTRAINT state_market_analysis_state_code_fkey FOREIGN KEY (state_code) REFERENCES public.us_states(state_code);


--
-- Name: state_regulatory_requirements state_regulatory_requirements_state_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_regulatory_requirements
    ADD CONSTRAINT state_regulatory_requirements_state_code_fkey FOREIGN KEY (state_code) REFERENCES public.us_states(state_code);


--
-- Name: workflow_triggers workflow_triggers_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_triggers
    ADD CONSTRAINT workflow_triggers_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workflow_templates(id);


--
-- Name: community_claims Community data is public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community data is public" ON public.community_claims FOR SELECT USING (true);


--
-- Name: community_insights Community insights are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community insights are public" ON public.community_insights FOR SELECT USING (true);


--
-- Name: noaa_climate_records Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.noaa_climate_records FOR SELECT USING (true);


--
-- Name: noaa_drought_monitor Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.noaa_drought_monitor FOR SELECT USING (true);


--
-- Name: noaa_fire_weather Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.noaa_fire_weather FOR SELECT USING (true);


--
-- Name: noaa_marine_conditions Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.noaa_marine_conditions FOR SELECT USING (true);


--
-- Name: noaa_space_weather Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.noaa_space_weather FOR SELECT USING (true);


--
-- Name: noaa_forecasts Public read access to forecasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to forecasts" ON public.noaa_forecasts FOR SELECT USING (true);


--
-- Name: noaa_radar_imagery Public read access to radar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to radar" ON public.noaa_radar_imagery FOR SELECT USING (true);


--
-- Name: noaa_tide_and_current_data Public read access to tide data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to tide data" ON public.noaa_tide_and_current_data FOR SELECT USING (true);


--
-- Name: analytics_aggregated Public read aggregated analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read aggregated analytics" ON public.analytics_aggregated FOR SELECT USING (true);


--
-- Name: ai_forecasts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_forecasts ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_metrics_aggregated; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_metrics_aggregated ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_aggregated; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_aggregated ENABLE ROW LEVEL SECURITY;

--
-- Name: community_insights_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_insights_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: enterprise_organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enterprise_organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: expansion_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expansion_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_usage_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_usage_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: model_performance_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.model_performance_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_climate_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_climate_records ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_drought_monitor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_drought_monitor ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_fire_weather; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_fire_weather ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_forecasts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_forecasts ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_ingestion_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_ingestion_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_marine_conditions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_marine_conditions ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_radar_imagery; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_radar_imagery ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_space_weather; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_space_weather ENABLE ROW LEVEL SECURITY;

--
-- Name: noaa_tide_and_current_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noaa_tide_and_current_data ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_billing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_billing ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_customizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_customizations ENABLE ROW LEVEL SECURITY;

--
-- Name: state_configurations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.state_configurations ENABLE ROW LEVEL SECURITY;

--
-- Name: state_data_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.state_data_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: state_deployment_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.state_deployment_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: state_market_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.state_market_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: state_regulatory_requirements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.state_regulatory_requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: system_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


