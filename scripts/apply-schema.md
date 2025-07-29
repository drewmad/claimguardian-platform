# Apply ClaimGuardian v1.1 Schema to Supabase

## Instructions

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql

2. Apply the migrations in this order:

### Step 1: Apply Complete Schema v1.1
Copy and paste the contents of:
```
supabase/migrations/20250130_complete_schema_v1.1.sql
```

This creates all the core tables with real Florida county data.

### Step 2: Apply User Tracking Tables
Copy and paste the contents of:
```
supabase/migrations/20250130_user_tracking.sql
```

This adds user tracking and analytics tables.

### Step 3: Apply Policy Documents Tables
Copy and paste the contents of:
```
supabase/migrations/20250130_policy_documents.sql
```

This adds policy document storage and AI extraction tables.

### Step 4: Create Storage Bucket
Copy and paste the contents of:
```
supabase/storage-setup.sql
```

This creates the storage bucket for policy documents.

## Verification

After applying all migrations, run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- fl_counties (67 rows of real Florida counties)
- coverage_types
- properties
- policies
- claims
- personal_property
- property_systems
- user_tracking
- user_preferences
- user_activity_log
- policy_documents_extended
- ... and more

## Enable Required Extensions

Make sure these extensions are enabled in your Supabase dashboard:
1. uuid-ossp
2. postgis
3. pg_trgm
4. vector

Go to: Database > Extensions and enable them if not already enabled.