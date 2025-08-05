# Policy Upload Error Resolution Guide

## Database Status Update (Current)

**Latest Check**: All previously missing database objects have been resolved.

### ✅ Database Objects Status (All Fixed)

1. **policy_documents_extended** view → ✅ **EXISTS**
   - Previously: `GET /rest/v1/policy_documents_extended` → 404
   - Current: View is deployed and functional
   - Impact: AI document processing now operational

2. **recent_login_activity** table → ✅ **EXISTS**
   - Previously: `GET /rest/v1/recent_login_activity` → 404  
   - Current: Table exists for security monitoring
   - Impact: User activity tracking restored

3. **learnings** table and **search_learnings** RPC → ✅ **EXISTS**
   - Previously: `GET /rest/v1/learnings` → 404, `POST /rest/v1/rpc/search_learnings` → 404
   - Current: Both table and RPC function deployed
   - Impact: Claude Learning System now functional

4. **Claude Learning System Infrastructure** → ✅ **COMPLETE**
   - Tables: `claude_errors`, `claude_learnings` both exist
   - Functions: `search_learnings` RPC available
   - Status: Full learning system operational

### ⚠️ Remaining Issues to Investigate

**User Profile Access Issues** (Still Occurring):
- **Pattern**: GET/PATCH requests to `user_profiles` may still have RLS policy issues
- **User**: `950dc54e-52a0-436a-a30b-15ebd2ecaeb3` (drewamad@gmail.com)
- **Status**: User exists in auth.users but profile access needs investigation
- **Root Cause**: Likely RLS policy restrictions or column-level permissions

### ✅ Storage Configuration Status

**Policy Documents Storage** → ✅ **CONFIGURED**
- **Bucket**: `policy-documents` exists and is properly configured
- **Path Structure**: `/storage/v1/object/policy-documents/{user_id}/{timestamp}.pdf`
- **Status**: Storage infrastructure is operational

## Original Issue
When trying to upload insurance policy documents, you're getting the error:
"Failed to upload policy document: new row violates row-level security policy"

## Comprehensive Root Causes Analysis
1. Missing database views and tables identified in production logs
2. Storage bucket `policy-documents` configuration issues
3. RLS policies on tables need verification
4. Authentication token handling in server actions
5. Claude Learning System database infrastructure incomplete

## Quick Fix (Run in Supabase Dashboard)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the following SQL commands:

```sql
-- Step 1: Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'policy-documents',
  'policy-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop and recreate storage policies
DROP POLICY IF EXISTS "Users can upload their own policy documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own policy documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own policy documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own policy documents" ON storage.objects;

-- Step 3: Create new storage policies
CREATE POLICY "Users can upload their own policy documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'policy-documents' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own policy documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'policy-documents' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own policy documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'policy-documents' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own policy documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'policy-documents' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
```

## Verify the Fix

After running the above SQL, test by:
1. Refreshing your browser page
2. Trying to upload a policy document again

## Alternative: Manual Bucket Creation

If the SQL approach doesn't work:

1. Go to Supabase Dashboard > Storage
2. Click "New Bucket"
3. Name: `policy-documents`
4. Public: **UNCHECKED** (keep it private)
5. File size limit: 52428800 (50MB)
6. Allowed MIME types: `application/pdf,image/png,image/jpeg,image/jpg`
7. Click "Create"

Then add RLS policies:
1. Click on the bucket
2. Go to "Policies" tab
3. Add the following policies:

**INSERT Policy**:
- Name: "Users can upload their own policy documents"
- Target roles: authenticated
- WITH CHECK expression: `(auth.uid())::text = (storage.foldername(name))[1]`

**SELECT Policy**:
- Name: "Users can view their own policy documents"
- Target roles: authenticated
- USING expression: `(auth.uid())::text = (storage.foldername(name))[1]`

**DELETE Policy**:
- Name: "Users can delete their own policy documents"
- Target roles: authenticated
- USING expression: `(auth.uid())::text = (storage.foldername(name))[1]`

**UPDATE Policy**:
- Name: "Users can update their own policy documents"
- Target roles: authenticated
- USING expression: `(auth.uid())::text = (storage.foldername(name))[1]`

## Debugging

To check if everything is set up correctly, run this in SQL Editor:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'policy-documents';

-- Check storage policies
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check table RLS policies
SELECT * FROM pg_policies WHERE tablename = 'policy_documents';

-- Test authentication
SELECT auth.uid(), auth.role();
```

## Common Issues

1. **"User not authenticated"**: Make sure you're logged in
2. **"File type not allowed"**: Only PDF, PNG, JPG/JPEG files are allowed
3. **"File size exceeds limit"**: Maximum file size is 50MB
4. **Storage bucket not found**: Run the SQL commands above to create it

# Current Status Summary

## ✅ Resolved Issues
1. **Database Objects**: All missing tables, views, and functions have been deployed
2. **Storage Configuration**: policy-documents bucket is properly configured
3. **Claude Learning System**: Full infrastructure is operational

## ⚠️ Remaining Actions

### 1. Investigate User Profile RLS Policies
```sql
-- Check RLS policies on user_profiles table
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Test user profile access for specific user
SELECT id FROM user_profiles WHERE id = '950dc54e-52a0-436a-a30b-15ebd2ecaeb3';
```

### 2. Enhanced Error Monitoring
- **Integrate into Claude Learning System**: Log user profile access patterns
- **Dashboard Alerts**: Monitor 400 error rates for profile operations
- **Health Checks**: Regular validation of RLS policy effectiveness

## Updated Priority Actions
1. **HIGH**: Investigate user profile RLS policy issues (only remaining 400 errors)
2. **MEDIUM**: Implement proactive monitoring for user profile access patterns  
3. **LOW**: Continue monitoring for any new error patterns

## Need More Help?

If the issue persists:
1. Check browser console for errors
2. Check network tab for failed requests
3. Review production error logs for patterns
4. Contact support with the exact error message