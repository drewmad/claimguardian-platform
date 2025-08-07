# RLS Security Verification Checklist

## Pre-Deployment Verification

### 1. ✅ Apply Security Fixes

```bash
# Apply all RLS policies and view fixes
./scripts/apply-security-fixes.sh

# Verify application was successful
```

### 2. ✅ Run Security Tests

```bash
# Run comprehensive RLS tests
./scripts/test-rls-security.sh

# Check results in /tmp/rls-test-results.txt
```

### 3. ✅ Secure PostGIS Tables (if using spatial features)

```bash
# Only needed if using PostGIS features
./scripts/secure-postgis-tables.sh
```

## Manual Testing Checklist

### 1. Test User Data Isolation

#### Setup Test Users

```sql
-- Create two test users via Supabase Auth
-- User 1: test1@example.com
-- User 2: test2@example.com
```

#### Test Property Isolation

```javascript
// As User 1 - Create a property
const { data: property1 } = await supabase.from("properties").insert({
  address: "123 Test St",
  user_id: user1.id, // Should match auth.uid()
});

// As User 2 - Try to read User 1's property
const { data: properties, error } = await supabase
  .from("properties")
  .select("*");

// ✅ PASS: Should return empty array (no access to User 1's data)
// ❌ FAIL: If User 2 can see User 1's property
```

#### Test Claims Isolation

```javascript
// As User 1 - Create a claim
const { data: claim1 } = await supabase.from("claims").insert({
  claim_number: "TEST-001",
  property_id: property1.id,
  user_id: user1.id,
});

// As User 2 - Try to read User 1's claims
const { data: claims, error } = await supabase.from("claims").select("*");

// ✅ PASS: Should return empty array
// ❌ FAIL: If User 2 can see User 1's claims
```

#### Test Cross-User Updates (Should Fail)

```javascript
// As User 2 - Try to update User 1's property
const { error } = await supabase
  .from("properties")
  .update({ address: "Hacked!" })
  .eq("id", property1.id);

// ✅ PASS: Should get RLS policy violation error
// ❌ FAIL: If update succeeds
```

### 2. Verify Admin Functions

#### Test Service Role Access

```javascript
// Using service role key (server-side only)
const adminSupabase = createClient(url, serviceRoleKey);

// Should be able to see all data
const { data: allProperties } = await adminSupabase
  .from("properties")
  .select("*");

// ✅ PASS: Returns all properties across all users
// ❌ FAIL: If limited to single user
```

#### Test Admin Dashboard Features

- [ ] AI cost tracking shows all users
- [ ] Performance dashboard shows system-wide stats
- [ ] Error logs show all system errors
- [ ] Maintenance functions can run

### 3. Monitor RLS Violations

#### Check Error Logs

```sql
-- Look for RLS violations
SELECT
    created_at,
    error_code,
    error_message,
    user_id,
    metadata
FROM error_logs
WHERE error_message LIKE '%permission denied%'
   OR error_message LIKE '%row-level security%'
ORDER BY created_at DESC
LIMIT 50;
```

#### Check Audit Logs

```sql
-- Look for unauthorized access attempts
SELECT
    created_at,
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
FROM audit_logs
WHERE action LIKE '%denied%'
   OR action LIKE '%unauthorized%'
ORDER BY created_at DESC
LIMIT 50;
```

#### Set Up Monitoring Alerts

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW v_rls_violations AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as violation_count,
    COUNT(DISTINCT user_id) as unique_users,
    array_agg(DISTINCT error_message) as error_types
FROM error_logs
WHERE error_message LIKE '%permission denied%'
   OR error_message LIKE '%row-level security%'
GROUP BY DATE_TRUNC('hour', created_at)
HAVING COUNT(*) > 5;  -- Alert threshold
```

### 4. PostGIS Security (If Applicable)

#### Verify PostGIS Tables

```sql
-- Check RLS status
SELECT
    tablename,
    relrowsecurity as rls_enabled,
    policy_count
FROM (
    SELECT
        t.tablename,
        c.relrowsecurity,
        COUNT(p.policyname) as policy_count
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_policies p ON p.tablename = t.tablename
    WHERE t.tablename IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
    GROUP BY t.tablename, c.relrowsecurity
) postgis_tables;
```

#### Test Spatial Queries

```javascript
// Should work for authenticated users
const { data: spatialRef } = await supabase
  .from("spatial_ref_sys")
  .select("*")
  .limit(1);

// ✅ PASS: Returns coordinate system data
// ❌ FAIL: If access denied
```

## Production Monitoring Setup

### 1. Create RLS Monitoring Dashboard

Add these queries to your monitoring system:

```sql
-- Real-time violation tracking
CREATE OR REPLACE FUNCTION get_rls_violation_stats()
RETURNS TABLE (
    time_bucket TIMESTAMP,
    violations INTEGER,
    unique_users INTEGER,
    top_error TEXT
)
LANGUAGE sql
AS $$
    SELECT
        DATE_TRUNC('hour', created_at) as time_bucket,
        COUNT(*)::INTEGER as violations,
        COUNT(DISTINCT user_id)::INTEGER as unique_users,
        MODE() WITHIN GROUP (ORDER BY error_message) as top_error
    FROM error_logs
    WHERE created_at > NOW() - INTERVAL '24 hours'
        AND (
            error_message LIKE '%permission denied%'
            OR error_message LIKE '%row-level security%'
        )
    GROUP BY DATE_TRUNC('hour', created_at)
    ORDER BY time_bucket DESC;
$$;
```

### 2. Set Up Alerts

Configure alerts for:

- [ ] More than 10 RLS violations per hour
- [ ] New user attempting cross-user access
- [ ] Service role authentication failures
- [ ] Unexpected table access patterns

### 3. Regular Security Audits

Weekly checks:

- [ ] Review RLS violation logs
- [ ] Check for new tables without RLS
- [ ] Verify no SECURITY DEFINER views created
- [ ] Audit service role usage

## Troubleshooting Guide

### Common Issues

1. **Users see no data**
   - Check auth token is valid
   - Verify user_id matches in database
   - Check RLS policies exist

2. **Admin functions broken**
   - Verify using service role key
   - Check service role policies exist
   - Ensure not using user JWT

3. **Spatial queries fail**
   - Run PostGIS security script
   - Verify authenticated role has access
   - Check PostGIS extension installed

4. **Performance degradation**
   - Review complex RLS policies
   - Add indexes on user_id columns
   - Consider materialized views

## Sign-Off Checklist

Before marking RLS implementation complete:

- [ ] All security fixes applied successfully
- [ ] User isolation tested and verified
- [ ] Admin functions tested with service role
- [ ] RLS violation monitoring active
- [ ] PostGIS secured (if applicable)
- [ ] Documentation updated
- [ ] Team trained on RLS implications
- [ ] Backup plan for RLS issues

## Emergency Contacts

If RLS blocks critical operations:

1. Check error logs first
2. Test with service role key
3. Review recent schema changes
4. Contact: [Database Admin]

---

**Last Updated**: [Date]
**Verified By**: [Name]
**Next Review**: [Date + 30 days]
