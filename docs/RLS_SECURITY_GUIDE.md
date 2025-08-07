# Row Level Security (RLS) Guide

## Overview

Row Level Security (RLS) is PostgreSQL's built-in mechanism for controlling data access at the row level. In ClaimGuardian, RLS ensures users can only access their own data, providing critical security isolation in our multi-tenant architecture.

## Current Security Status

### Tables with RLS Issues (14 tables)

These tables have RLS enabled but were missing policies:

1. **ai_processing_queue** - AI task queue
2. **ml_model_versions** - ML model registry
3. **ai_training_datasets** - Training data management
4. **federated_learning_rounds** - FL coordination
5. **ml_model_deployments** - Model deployment tracking
6. **claims_history** - Audit trail for claims
7. **policies_history** - Audit trail for policies
8. **properties_history** - Audit trail for properties
9. **ai_usage_logs** - AI usage tracking (may already have policies)
10. **error_logs** - Error tracking (may already have policies)
11. **audit_logs** - General audit logs (may already have policies)
12. **security_logs** - Security event logs
13. **maintenance_log** - System maintenance logs
14. **login_activity** - User login tracking

### Views with Security Issues (4 views)

These views use SECURITY DEFINER which can bypass RLS:

1. **claims_summary** - User claims overview
2. **active_policies** - Active insurance policies
3. **error_summary** - Recent errors
4. **community_statistics** - Aggregated community data

## RLS Policy Patterns

### Pattern 1: User Owns Resource

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own records" ON table_name
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON table_name
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON table_name
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON table_name
    FOR DELETE USING (auth.uid() = user_id);
```

### Pattern 2: User Owns Parent Resource

```sql
-- Users can access child records through parent ownership
CREATE POLICY "Users can view related records" ON child_table
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_table
            WHERE parent_table.id = child_table.parent_id
            AND parent_table.user_id = auth.uid()
        )
    );
```

### Pattern 3: Service Role Only

```sql
-- Only service role can access (for system tables)
CREATE POLICY "Service role full access" ON system_table
    FOR ALL TO service_role
    USING (true);
```

### Pattern 4: Public Read, Private Write

```sql
-- Anyone can read, only owners can modify
CREATE POLICY "Public read access" ON public_table
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Owner write access" ON public_table
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Implementation Steps

### 1. Apply Security Fixes

```bash
# Apply the comprehensive security fixes
./scripts/apply-security-fixes.sh

# This will:
# - Convert 4 SECURITY DEFINER views to security_invoker
# - Add policies to 14 tables missing them
# - Fix function search paths
```

### 2. Verify Security Status

```sql
-- Check tables with RLS but no policies
SELECT
    t.tablename,
    c.relrowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = 'public'
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true
GROUP BY t.tablename, c.relrowsecurity
HAVING COUNT(p.policyname) = 0;

-- Check views for SECURITY DEFINER
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%';
```

### 3. Test RLS Policies

```sql
-- Test as a specific user
SET SESSION AUTHORIZATION 'user_id_here';

-- Try to access data
SELECT * FROM properties; -- Should only see own properties
SELECT * FROM claims;     -- Should only see own claims

-- Reset session
RESET SESSION AUTHORIZATION;
```

## Policy Details by Table

### User Data Tables

#### properties

- **Policy**: Users can only CRUD their own properties
- **Key**: `user_id = auth.uid()`

#### claims

- **Policy**: Users can only CRUD their own claims
- **Key**: `user_id = auth.uid()`

#### policies (insurance)

- **Policy**: Users can manage policies for their properties
- **Key**: Property ownership check via JOIN

#### damage_assessments

- **Policy**: Users can manage assessments for their claims
- **Key**: Claim ownership check via JOIN

### AI/ML Tables

#### ai_processing_queue

- **Policy**: Users see/manage their own queue items
- **Key**: `user_id = auth.uid()`

#### ml_model_versions

- **Policy**: Authenticated users can view all models
- **Write**: Service role only

#### ai_training_datasets

- **Policy**: Users manage their own datasets
- **Key**: `user_id = auth.uid()`

### System Tables

#### audit_logs, error_logs

- **Policy**: Users see their own logs
- **Insert**: Service role only

#### security_logs, maintenance_log

- **Policy**: Service role only (no user access)

### History Tables

#### claims_history, policies_history, properties_history

- **Policy**: Read-only access to own resource history
- **Key**: JOIN to parent table for ownership

## Common Issues & Solutions

### Issue: "new row violates row-level security policy"

**Cause**: Trying to insert data for another user
**Solution**: Ensure `user_id` matches `auth.uid()` on insert

### Issue: Query returns no rows (but data exists)

**Cause**: RLS filtering out rows user doesn't own
**Solution**: Check data ownership, verify auth token

### Issue: Admin functions stopped working

**Cause**: RLS blocking service role access
**Solution**: Add explicit service role policies

### Issue: Performance degradation

**Cause**: Complex RLS policies with multiple JOINs
**Solution**: Simplify policies, add indexes on foreign keys

## Best Practices

1. **Always test RLS policies** after implementation
2. **Use security_invoker for views** unless DEFINER is required
3. **Index foreign keys** used in RLS policies
4. **Keep policies simple** - complex logic impacts performance
5. **Document policy logic** in comments
6. **Monitor for violations** in logs
7. **Test with different user roles** (user, admin, anon)

## Monitoring RLS

```sql
-- Monitor RLS violations
SELECT
    datname,
    usename,
    application_name,
    client_addr,
    backend_start,
    query_start,
    state,
    query
FROM pg_stat_activity
WHERE query LIKE '%row-level security%';

-- Check policy usage
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Emergency Procedures

If RLS is blocking critical operations:

```sql
-- Temporarily disable RLS (DANGEROUS - admin only)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Re-enable after fix
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Force policy reload
SELECT pg_reload_conf();
```

## Resources

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS Performance Tips](https://www.postgresql.org/docs/current/ddl-rowsecurity.html#DDL-ROWSECURITY-PERFORMANCE)
