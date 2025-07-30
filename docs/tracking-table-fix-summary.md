# User Tracking Table Fix Summary

## Problem
The error "column event_type does not exist" occurred when trying to run the `create-missing-tracking-table.sql` script. This happened because:

1. The `user_tracking` table already exists in the database
2. The existing table structure doesn't match what the tracking functions expect
3. The functions were written to use an `event_type` column that doesn't exist in the current schema

## Current Table Structure Analysis

### Existing `user_tracking` table (from schema.sql):
```sql
CREATE TABLE "user_tracking" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid,
    "session_id" text NOT NULL,
    "ip_address" inet,
    "ip_country" text,
    "ip_region" text,
    "ip_city" text,
    "ip_timezone" text,
    "user_agent" text,
    "device_type" text,
    "device_name" text,
    "browser_name" text,
    "browser_version" text,
    "os_name" text,
    "os_version" text,
    "referrer_url" text,
    "referrer_domain" text,
    "utm_source" text,
    "utm_medium" text,
    "utm_campaign" text,
    "utm_term" text,
    "utm_content" text,
    "landing_page" text,
    "login_method" text,
    "is_first_login" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT now(),
    "last_activity_at" timestamptz DEFAULT now()
);
```

### Missing Columns (needed by functions):
- `event_type` - Primary missing column causing the error
- `event_data` - JSONB field for storing event metadata
- `device_fingerprint` - Device identification
- `screen_resolution` - Screen size information
- `page_url` - Current page URL
- `latitude`/`longitude` - Geographic coordinates

## Solution Files Created

### 1. `/scripts/fix-user-tracking-table.sql`
- **Purpose**: Standalone SQL script to fix the table structure
- **Usage**: Run directly in Supabase SQL Editor
- **Features**:
  - Safely adds missing columns using `IF NOT EXISTS` checks
  - Updates tracking functions to work with current schema
  - Creates proper indexes for performance
  - Includes error handling to prevent authentication failures

### 2. `/supabase/migrations/20250131000003_fix_user_tracking_columns.sql`
- **Purpose**: Migration file for version control
- **Usage**: Applied via Supabase migration system
- **Benefits**: 
  - Tracks schema changes in version control
  - Can be applied to different environments consistently

### 3. `/scripts/run-tracking-fix.sh`
- **Purpose**: Helper script to display instructions
- **Usage**: `./scripts/run-tracking-fix.sh`
- **Features**:
  - Shows exactly what the fix will do
  - Provides step-by-step instructions for applying the fix

## How to Apply the Fix

### Option 1: Direct SQL Application (Recommended)
1. Go to your Supabase Dashboard SQL Editor
2. Navigate to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new
3. Copy and paste the contents of `/scripts/fix-user-tracking-table.sql`
4. Click "Run"

### Option 2: Using the Helper Script
```bash
./scripts/run-tracking-fix.sh
```
This will display the SQL and provide instructions for manual application.

### Option 3: Migration System
If you're using Supabase migrations:
```bash
supabase db push
```

## Expected Results After Fix

1. **Column Addition**: Missing columns will be added to `user_tracking` table
2. **Function Updates**: `track_user_login` and `log_user_activity` functions will work properly
3. **Index Creation**: Performance indexes will be created for `event_type` queries
4. **Error Resolution**: The "column event_type does not exist" error will be resolved

## Verification Query

After applying the fix, you can verify it worked with:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_tracking' 
  AND column_name IN ('event_type', 'event_data', 'device_fingerprint', 'page_url')
ORDER BY column_name;
```

## Key Design Decisions

1. **Safe Column Addition**: Uses `IF NOT EXISTS` to prevent errors if columns already exist
2. **Backward Compatibility**: Preserves existing data and table structure
3. **Dual Logging**: Functions log to both `user_tracking` and `login_activity` tables
4. **Error Handling**: Functions won't break authentication if tracking fails
5. **Performance**: Proper indexes added for common query patterns

## Related Tables

The fix also ensures compatibility with existing related tables:
- `login_activity` - Separate login tracking table
- `user_sessions` - Session management
- `user_profiles` - User profile data with signup tracking

## Files Modified/Created

-  `/scripts/fix-user-tracking-table.sql` - Main fix script
-  `/supabase/migrations/20250131000003_fix_user_tracking_columns.sql` - Migration file
-  `/scripts/run-tracking-fix.sh` - Helper script (updated)
-  `/docs/tracking-table-fix-summary.md` - This documentation

The fix is production-ready and safe to apply to your Supabase database.