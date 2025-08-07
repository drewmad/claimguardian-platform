#!/usr/bin/env node

/**
 * Script to create the policy-documents storage bucket in Supabase
 * Run with: node scripts/create-storage-bucket.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );
  console.error("Make sure your .env.local file contains these variables");
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createPolicyDocumentsBucket() {
  console.log("🚀 Creating policy-documents storage bucket...");

  try {
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(
      "policy-documents",
      {
        public: false,
        fileSizeLimit: 52428800, // 50MB in bytes
        allowedMimeTypes: [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/jpg",
        ],
      },
    );

    if (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Bucket already exists, updating configuration...");

        // Update bucket configuration if it exists
        const { error: updateError } = await supabase.storage.updateBucket(
          "policy-documents",
          {
            public: false,
            fileSizeLimit: 52428800,
            allowedMimeTypes: [
              "application/pdf",
              "image/png",
              "image/jpeg",
              "image/jpg",
            ],
          },
        );

        if (updateError) {
          console.error("❌ Failed to update bucket:", updateError.message);
          return false;
        }

        console.log("✅ Bucket configuration updated successfully");
      } else {
        console.error("❌ Failed to create bucket:", error.message);
        return false;
      }
    } else {
      console.log("✅ Bucket created successfully");
    }

    // Note: Storage RLS policies must be created via SQL in the Dashboard
    console.log("\n📝 Storage RLS policies need to be created via SQL.");
    console.log("Run the following SQL in your Supabase Dashboard:");
    console.log("\n--- SQL TO RUN IN DASHBOARD ---");
    console.log(`
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
    `);
    console.log("--- END SQL ---\n");

    return true;
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return false;
  }
}

// Run the script
createPolicyDocumentsBucket().then((success) => {
  if (success) {
    console.log("\n✨ Storage bucket setup complete!");
    console.log(
      "👉 Next step: Run the SQL above in your Supabase Dashboard to create RLS policies",
    );
  } else {
    console.log("\n❌ Storage bucket setup failed");
  }
  process.exit(success ? 0 : 1);
});
