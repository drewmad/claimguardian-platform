# Production Fix for "Service temporarily unavailable" Error

## Issue
The signup flow is failing with "Service temporarily unavailable" because the tracking tables and functions are missing in production.

## Solution Applied
1. **Code Fix (Already Deployed)**: Made all tracking operations non-blocking with fallbacks
2. **Database Fix (Needs to be Applied)**: Create missing tables and functions

## How to Apply Database Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `scripts/apply-tracking-functions.sql`
4. Paste and run the SQL

### Option 2: Using Supabase CLI
```bash
# Make sure you're linked to production
supabase link --project-ref tmlrvecuwgppbaynesji

# Apply the migration
supabase db push scripts/apply-tracking-functions.sql
```

## What This Fixes
- Creates `user_profiles` table for tracking signup data
- Creates `user_preferences` table for consent management
- Creates `consent_audit_log` table for GDPR compliance
- Creates `capture_signup_data` function
- Sets up proper Row Level Security (RLS)

## Testing After Fix
1. Try creating a new account on production
2. Check browser console for any errors
3. Verify the account is created successfully

## Fallback Behavior
Even if the database migration isn't applied, the signup will still work because:
- All tracking operations are wrapped in try-catch
- The code falls back to direct table inserts
- Tracking failures don't block signup completion

## Additional Debugging
If issues persist:
1. Check Vercel function logs for detailed error messages
2. Run `node scripts/test-supabase-connection.js` locally with production env vars
3. Check Supabase logs in the dashboard
