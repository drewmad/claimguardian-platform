-- Web scraper and monitoring infrastructure
-- Handles automated data collection and system monitoring

-- Scraper runs tracking
CREATE TABLE IF NOT EXISTS public.scraper_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scraper_name TEXT NOT NULL,
  run_type TEXT NOT NULL, -- 'scheduled', 'manual', 'triggered'
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Scraper logs for detailed tracking
CREATE TABLE IF NOT EXISTS public.scraper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES public.scraper_runs(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- 'debug', 'info', 'warning', 'error'
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Geographic data monitoring
CREATE TABLE IF NOT EXISTS public.geographic_coverage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL DEFAULT 'FL',
  county_code TEXT NOT NULL,
  county_name TEXT NOT NULL,
  total_parcels INTEGER,
  scraped_parcels INTEGER DEFAULT 0,
  last_scraped_at TIMESTAMPTZ,
  scraper_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(state_code, county_code)
);

-- System health metrics
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create monitoring functions
CREATE OR REPLACE FUNCTION public.log_scraper_activity(
  p_run_id UUID,
  p_level TEXT,
  p_message TEXT,
  p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.scraper_logs (run_id, level, message, context)
  VALUES (p_run_id, p_level, p_message, p_context)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update scraper run statistics
CREATE OR REPLACE FUNCTION public.update_scraper_stats(
  p_run_id UUID,
  p_processed INTEGER DEFAULT 0,
  p_created INTEGER DEFAULT 0,
  p_updated INTEGER DEFAULT 0,
  p_failed INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.scraper_runs
  SET 
    records_processed = records_processed + p_processed,
    records_created = records_created + p_created,
    records_updated = records_updated + p_updated,
    records_failed = records_failed + p_failed
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete scraper run
CREATE OR REPLACE FUNCTION public.complete_scraper_run(
  p_run_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.scraper_runs
  SET 
    status = p_status,
    completed_at = CURRENT_TIMESTAMP,
    duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER,
    error_message = p_error_message
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job for monitoring
CREATE OR REPLACE FUNCTION public.monitor_system_health()
RETURNS VOID AS $$
DECLARE
  v_total_users INTEGER;
  v_active_claims INTEGER;
  v_db_size NUMERIC;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_total_users FROM public.user_profiles;
  INSERT INTO public.system_metrics (metric_name, metric_value, metric_unit, tags)
  VALUES ('total_users', v_total_users, 'count', '{"type": "user_stats"}');
  
  -- Count active claims
  SELECT COUNT(*) INTO v_active_claims 
  FROM public.insurance_claims 
  WHERE status NOT IN ('closed', 'denied');
  INSERT INTO public.system_metrics (metric_name, metric_value, metric_unit, tags)
  VALUES ('active_claims', v_active_claims, 'count', '{"type": "claim_stats"}');
  
  -- Database size
  SELECT pg_database_size(current_database())::NUMERIC / (1024*1024) INTO v_db_size;
  INSERT INTO public.system_metrics (metric_name, metric_value, metric_unit, tags)
  VALUES ('database_size', v_db_size, 'MB', '{"type": "infrastructure"}');
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Service role only access for scraper tables
CREATE POLICY "Service role only" ON public.scraper_runs
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON public.scraper_logs
  USING (auth.role() = 'service_role');

-- Public read for coverage data
CREATE POLICY "Public read access" ON public.geographic_coverage
  FOR SELECT USING (true);

CREATE POLICY "Service role manage" ON public.geographic_coverage
  USING (auth.role() = 'service_role');

-- Service role only for metrics
CREATE POLICY "Service role only" ON public.system_metrics
  USING (auth.role() = 'service_role');

-- Add triggers
CREATE TRIGGER set_updated_at_geographic_coverage
  BEFORE UPDATE ON public.geographic_coverage
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- Create indexes
CREATE INDEX idx_scraper_runs_status ON public.scraper_runs(status, started_at);
CREATE INDEX idx_scraper_runs_name ON public.scraper_runs(scraper_name);
CREATE INDEX idx_scraper_logs_run ON public.scraper_logs(run_id);
CREATE INDEX idx_scraper_logs_level ON public.scraper_logs(level);
CREATE INDEX idx_scraper_logs_created ON public.scraper_logs(created_at);
CREATE INDEX idx_geographic_coverage_county ON public.geographic_coverage(state_code, county_code);
CREATE INDEX idx_system_metrics_name ON public.system_metrics(metric_name, recorded_at);

-- Insert Florida counties for coverage tracking
INSERT INTO public.geographic_coverage (state_code, county_code, county_name, is_active)
VALUES 
  ('FL', '015', 'Charlotte', true),
  ('FL', '071', 'Lee', true),
  ('FL', '115', 'Sarasota', true),
  ('FL', '021', 'Collier', true),
  ('FL', '027', 'DeSoto', true),
  ('FL', '049', 'Hardee', true),
  ('FL', '051', 'Hendry', true),
  ('FL', '081', 'Manatee', true)
ON CONFLICT (state_code, county_code) DO NOTHING;