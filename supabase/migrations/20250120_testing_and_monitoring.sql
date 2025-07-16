-- Testing Framework, Monitoring, and Operational Excellence
-- This migration adds pgTAP testing, monitoring, and operational tools

-- ============================================================================
-- PART 0: CREATE REQUIRED SCHEMAS
-- ============================================================================

-- Create test schema for pgTAP functions
CREATE SCHEMA IF NOT EXISTS test;
GRANT USAGE ON SCHEMA test TO authenticated;

-- Create monitoring schema
CREATE SCHEMA IF NOT EXISTS monitoring;
GRANT USAGE ON SCHEMA monitoring TO authenticated;

-- ============================================================================
-- PART 1: ENABLE TESTING EXTENSIONS
-- ============================================================================

-- Enable pgTAP for database testing
-- Note: pgTAP may not be available in all Supabase environments
-- CREATE EXTENSION IF NOT EXISTS pgtap;

-- ============================================================================
-- PART 2: HEALTH CHECK AND MONITORING
-- ============================================================================

-- System health checks table
CREATE TABLE IF NOT EXISTS monitoring.health_check (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    check_name TEXT NOT NULL,
    check_type TEXT NOT NULL CHECK (check_type IN ('database', 'api', 'storage', 'auth')),
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    response_time_ms INTEGER,
    details JSONB,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS monitoring.performance_metric (
    id UUID DEFAULT core.generate_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT,
    tags JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create initial partitions for metrics
CREATE TABLE monitoring.performance_metric_2025_01 
PARTITION OF monitoring.performance_metric
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Database statistics view
CREATE OR REPLACE VIEW monitoring.database_stats AS
SELECT 
    'table_count' as metric,
    COUNT(*) as value
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
UNION ALL
SELECT 
    'total_size_mb' as metric,
    pg_database_size(current_database()) / 1024 / 1024 as value
UNION ALL
SELECT 
    'active_connections' as metric,
    COUNT(*) as value
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT 
    'index_count' as metric,
    COUNT(*) as value
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');

-- ============================================================================
-- PART 3: DATA QUALITY MONITORING
-- ============================================================================

-- Data quality rules table
CREATE TABLE IF NOT EXISTS monitoring.data_quality_rule (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    rule_name TEXT NOT NULL UNIQUE,
    table_name TEXT NOT NULL,
    check_sql TEXT NOT NULL,
    expected_result TEXT,
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Data quality check results
CREATE TABLE IF NOT EXISTS monitoring.data_quality_result (
    id UUID DEFAULT core.generate_uuid(),
    rule_id UUID NOT NULL,
    passed BOOLEAN NOT NULL,
    actual_result TEXT,
    row_count INTEGER,
    details JSONB,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, checked_at),
    FOREIGN KEY (rule_id) REFERENCES monitoring.data_quality_rule(id)
) PARTITION BY RANGE (checked_at);

-- Create partition
CREATE TABLE monitoring.data_quality_result_2025_01 
PARTITION OF monitoring.data_quality_result
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Insert data quality rules
-- Skipping - data already exists

-- ============================================================================
-- PART 4: PGTAP TEST FUNCTIONS
-- ============================================================================

-- Test functions commented out since pgTAP extension may not be available
-- Uncomment if pgTAP is installed

/*
-- Test schema structure
CREATE OR REPLACE FUNCTION test.tables_exist()
RETURNS SETOF TEXT AS $$
BEGIN
    RETURN NEXT has_table('public', 'properties', 'Properties table should exist');
    RETURN NEXT has_table('core', 'claim', 'Claims table should exist');
    RETURN NEXT has_table('core', 'insurance_policy', 'Insurance policy table should exist');
    RETURN NEXT has_table('security', 'login_activity', 'Login activity table should exist');
END;
$$ LANGUAGE plpgsql;

-- Test constraints
CREATE OR REPLACE FUNCTION test.constraints_valid()
RETURNS SETOF TEXT AS $$
BEGIN
    RETURN NEXT col_not_null('public', 'properties', 'name', 'Property name should not be null');
    RETURN NEXT col_has_check('core', 'claim', 'status', 'Claim status should have check constraint');
    RETURN NEXT fk_ok('core', 'claim', 'property_id', 'public', 'properties', 'id', 'Claim should reference property');
END;
$$ LANGUAGE plpgsql;

-- Test RLS policies
CREATE OR REPLACE FUNCTION test.rls_policies_exist()
RETURNS SETOF TEXT AS $$
BEGIN
    RETURN NEXT policy_exists('public', 'properties', 'Users can view own properties', 'SELECT');
    RETURN NEXT policy_exists('core', 'claim', 'Users can view own claims', 'SELECT');
    RETURN NEXT policy_exists('core', 'insurance_policy', 'Users can view own policies', 'SELECT');
END;
$$ LANGUAGE plpgsql;

-- Test functions
CREATE OR REPLACE FUNCTION test.functions_work()
RETURNS SETOF TEXT AS $$
DECLARE
    test_uuid UUID;
    test_claim_number TEXT;
BEGIN
    -- Test UUID generation
    test_uuid := core.generate_uuid();
    RETURN NEXT ok(test_uuid IS NOT NULL, 'UUID generation should work');
    
    -- Test claim number generation
    test_claim_number := core.generate_claim_number();
    RETURN NEXT matches(test_claim_number, '^CLM-[0-9]{4}-[0-9]{6}$', 'Claim number should match pattern');
    
    -- Test phone validation
    RETURN NEXT ok(core.validate_phone('+15551234567'), 'Valid phone should pass');
    RETURN NEXT ok(NOT core.validate_phone('invalid'), 'Invalid phone should fail');
    
    -- Test email validation
    RETURN NEXT ok(core.validate_email('test@example.com'), 'Valid email should pass');
    RETURN NEXT ok(NOT core.validate_email('invalid-email'), 'Invalid email should fail');
END;
$$ LANGUAGE plpgsql;

-- Master test runner
CREATE OR REPLACE FUNCTION test.run_all_tests()
RETURNS SETOF TEXT AS $$
BEGIN
    RETURN QUERY SELECT * FROM test.tables_exist();
    RETURN QUERY SELECT * FROM test.constraints_valid();
    RETURN QUERY SELECT * FROM test.rls_policies_exist();
    RETURN QUERY SELECT * FROM test.functions_work();
    RETURN NEXT diag('All tests completed');
END;
$$ LANGUAGE plpgsql;
*/

-- ============================================================================
-- PART 5: OPERATIONAL PROCEDURES
-- ============================================================================

-- Procedure to check data quality
CREATE OR REPLACE FUNCTION monitoring.check_data_quality()
RETURNS TABLE(rule_name TEXT, passed BOOLEAN, details TEXT) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Procedure to analyze table sizes
CREATE OR REPLACE FUNCTION monitoring.analyze_table_sizes()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    total_size TEXT,
    table_size TEXT,
    indexes_size TEXT,
    row_estimate BIGINT
) AS $$
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
$$ LANGUAGE plpgsql;

-- Procedure to find slow queries
CREATE OR REPLACE FUNCTION monitoring.find_slow_queries(threshold_ms INTEGER DEFAULT 1000)
RETURNS TABLE(
    query TEXT,
    calls BIGINT,
    total_time NUMERIC,
    mean_time NUMERIC,
    max_time NUMERIC
) AS $$
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: MAINTENANCE PROCEDURES
-- ============================================================================

-- Archive old audit logs
CREATE OR REPLACE FUNCTION security.archive_old_logs(months_to_keep INTEGER DEFAULT 6)
RETURNS TABLE(archived_count BIGINT) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vacuum and analyze all tables
CREATE OR REPLACE FUNCTION monitoring.maintenance_vacuum_analyze()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: ALERTING AND NOTIFICATIONS
-- ============================================================================

-- Alert rules table
CREATE TABLE IF NOT EXISTS monitoring.alert_rule (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    name TEXT NOT NULL UNIQUE,
    condition_sql TEXT NOT NULL,
    threshold NUMERIC NOT NULL,
    comparison_operator TEXT CHECK (comparison_operator IN ('>', '<', '>=', '<=', '=', '!=')),
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    notification_channels TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Alert history
CREATE TABLE IF NOT EXISTS monitoring.alert_history (
    id UUID DEFAULT core.generate_uuid(),
    rule_id UUID NOT NULL,
    triggered BOOLEAN NOT NULL,
    actual_value NUMERIC,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at),
    FOREIGN KEY (rule_id) REFERENCES monitoring.alert_rule(id)
) PARTITION BY RANGE (created_at);

CREATE TABLE monitoring.alert_history_2025_01 
PARTITION OF monitoring.alert_history
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Insert default alert rules
-- Skipping - data already exists

-- ============================================================================
-- PART 8: API RATE LIMITING
-- ============================================================================

-- API rate limit tracking
CREATE TABLE IF NOT EXISTS security.api_rate_limit (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', CURRENT_TIMESTAMP),
    UNIQUE(user_id, ip_address, endpoint, window_start)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION security.check_rate_limit(
    p_user_id UUID,
    p_ip_address INET,
    p_endpoint TEXT,
    p_limit INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 9: DEPLOYMENT TRACKING
-- ============================================================================

-- Deployment history
CREATE TABLE IF NOT EXISTS monitoring.deployment (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    version TEXT NOT NULL,
    git_commit TEXT,
    deployed_by TEXT,
    deployment_type TEXT CHECK (deployment_type IN ('migration', 'rollback', 'hotfix')),
    status TEXT CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    notes TEXT
);

-- ============================================================================
-- PART 10: GRANTS AND PERMISSIONS
-- ============================================================================

-- Create monitoring role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'monitoring_viewer') THEN
        CREATE ROLE monitoring_viewer;
    END IF;
END
$$;
GRANT USAGE ON SCHEMA monitoring TO monitoring_viewer;
GRANT SELECT ON ALL TABLES IN SCHEMA monitoring TO monitoring_viewer;

-- Create test role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_runner') THEN
        CREATE ROLE test_runner;
    END IF;
END
$$;
GRANT USAGE ON SCHEMA test TO test_runner;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test TO test_runner;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON SCHEMA monitoring IS 'System monitoring and operational tables';
COMMENT ON SCHEMA test IS 'pgTAP test functions';
-- COMMENT ON FUNCTION test.run_all_tests() IS 'Execute all pgTAP tests';
COMMENT ON FUNCTION monitoring.check_data_quality() IS 'Run all active data quality checks';
COMMENT ON FUNCTION security.check_rate_limit IS 'Check API rate limit for user/endpoint';