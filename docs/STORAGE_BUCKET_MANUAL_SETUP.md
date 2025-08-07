# Manual Storage Bucket Setup Guide

## Why Manual Setup is Required

Storage bucket creation requires special permissions that are only available through:
1. Supabase Dashboard UI
2. Supabase client SDK with service role key

The MCP SQL interface cannot create storage buckets directly.

## Option 1: Supabase Dashboard UI (Recommended)

### Step 1: Create the Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `tmlrvecuwgppbaynesji`
3. Navigate to **Storage** in the left sidebar
4. Click **Create Bucket** button
5. Configure the bucket:
   - **Name**: `policy-documents`
   - **Public bucket**: ❌ Unchecked (keep it private)
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**:
     ```
     application/pdf
     image/png
     image/jpeg
     image/jpg
     ```
6. Click **Create**

### Step 2: Create RLS Policies

After creating the bucket, you need to set up Row Level Security policies:

1. Still in the Storage section, click on the `policy-documents` bucket
2. Go to the **Policies** tab
3. Click **New Policy** and create these four policies:

#### Policy 1: Upload Policy
- **Name**: `Users can upload their own policy documents`
- **Policy Type**: `INSERT`
- **Target Roles**: `authenticated`
- **WITH CHECK expression**:
  ```sql
  (auth.uid())::text = (storage.foldername(name))[1]
  ```

#### Policy 2: View Policy
- **Name**: `Users can view their own policy documents`
- **Policy Type**: `SELECT`
- **Target Roles**: `authenticated`
- **USING expression**:
  ```sql
  (auth.uid())::text = (storage.foldername(name))[1]
  ```

#### Policy 3: Delete Policy
- **Name**: `Users can delete their own policy documents`
- **Policy Type**: `DELETE`
- **Target Roles**: `authenticated`
- **USING expression**:
  ```sql
  (auth.uid())::text = (storage.foldername(name))[1]
  ```

#### Policy 4: Update Policy
- **Name**: `Users can update their own policy documents`
- **Policy Type**: `UPDATE`
- **Target Roles**: `authenticated`
- **USING expression**:
  ```sql
  (auth.uid())::text = (storage.foldername(name))[1]
  ```

## Option 2: SQL Editor (Alternative)

If you prefer using SQL, go to SQL Editor in the Dashboard and run:

```sql
-- This SQL creates the storage policies
-- Note: You still need to create the bucket via UI first

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own policy documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own policy documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own policy documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own policy documents" ON storage.objects;

-- Create new policies
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

## Verification

After setup, verify everything is working:

1. Go to **Storage** → `policy-documents` bucket
2. Check that the bucket exists and shows the correct settings
3. Go to **Policies** tab and verify all 4 policies are created
4. Test by uploading a file through your application

## Common Issues

1. **"Storage bucket not found"**: The bucket hasn't been created yet
2. **"Row violates RLS policy"**: The policies aren't set up correctly
3. **"File type not allowed"**: Make sure the MIME types are configured correctly
4. **"File too large"**: File exceeds the 50MB limit

## Summary

The storage bucket setup cannot be automated via MCP and requires manual configuration through the Supabase Dashboard. This is a one-time setup that enables secure file uploads for policy documents.
