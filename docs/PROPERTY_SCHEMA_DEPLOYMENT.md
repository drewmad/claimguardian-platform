# Property Schema Deployment Guide

## Overview

The comprehensive property data schema has been created and is ready for deployment. This schema implements a hierarchical property data model with versioning, security, and performance optimizations.

## Migration Files Created

1. **`20250724_complete_property_schema.sql`** - Combined migration file containing:
   - Core property tables and relationships
   - Versioning system with history tables
   - Row-Level Security (RLS) policies
   - Performance indexes and materialized views
   - Integration functions with existing data

## Deployment Options

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com/project/tmlrvecuwgppbaynesji
2. Navigate to the SQL Editor
3. Open the file: `supabase/migrations/20250724_complete_property_schema.sql`
4. Copy the entire contents
5. Paste into the SQL editor
6. Click "Run" to execute

### Option 2: Direct Database Connection

If you have direct database access:

```bash
# Using psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.tmlrvecuwgppbaynesji.supabase.co:5432/postgres" \
  -f supabase/migrations/20250724_complete_property_schema.sql

# Or using the connection string from .env
psql "$DATABASE_URL" -f supabase/migrations/20250724_complete_property_schema.sql
```

### Option 3: Supabase CLI (When Migration History is Fixed)

```bash
# Once migration history is repaired
supabase db push
```

## Schema Components

### Core Tables
- `properties` - Root property entity
- `property_land` - Land information
- `property_structures` - Buildings and structures
- `property_systems` - HVAC, electrical, etc.
- `property_insurance` - Insurance policies
- `property_claims` - Claim tracking
- `property_damage` - Damage assessments
- `property_contractors` - Repair contractors

### Features
- **Versioning**: Full history tracking on all tables
- **Security**: RLS policies for multi-tenant access
- **Performance**: Optimized indexes and materialized views
- **Integration**: Functions to link with Florida parcel data

## Post-Deployment Steps

1. **Verify Tables Created**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'property%'
   ORDER BY table_name;
   ```

2. **Check RLS is Enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename LIKE 'property%';
   ```

3. **Refresh Materialized View**:
   ```sql
   REFRESH MATERIALIZED VIEW property_overview;
   ```

4. **Test Basic Operations**:
   ```sql
   -- Test property creation (replace with your user_id)
   INSERT INTO properties (
     user_id, address, city, state, zip_code, county
   ) VALUES (
     auth.uid(), '123 Test St', 'Tampa', 'FL', '33601', 'Hillsborough'
   );
   ```

## Troubleshooting

### If Migration Fails

1. **Check for existing types**:
   ```sql
   DROP TYPE IF EXISTS property_type CASCADE;
   DROP TYPE IF EXISTS occupancy_status CASCADE;
   DROP TYPE IF EXISTS damage_severity CASCADE;
   DROP TYPE IF EXISTS claim_status CASCADE;
   ```

2. **Check for existing tables**:
   ```sql
   -- List existing property tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name LIKE 'property%';
   ```

3. **Apply in sections**:
   - First apply the core tables (hierarchy)
   - Then versioning triggers
   - Then RLS policies
   - Finally optimization and integration

### Common Issues

1. **Extension not available**: Ensure PostGIS is enabled in your Supabase project
2. **Type already exists**: Drop existing types before re-running
3. **Permission denied**: Ensure you're using service role key or admin access

## Next Steps

After successful deployment:

1. Update the application code to use the new schema
2. Migrate existing property data if any
3. Set up scheduled jobs for data maintenance
4. Configure monitoring for the new tables

## Support

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Review the individual migration files in `supabase/migrations/`
3. Contact the development team with specific error messages