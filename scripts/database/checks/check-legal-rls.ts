#!/usr/bin/env tsx

/**
 * Check and fix RLS policies for legal documents
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

async function checkRLS() {
  console.log("🔍 Checking RLS policies for legal_documents table...\n");

  // First test with service role (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  console.log("1️⃣ Testing with service role key (bypasses RLS)...");
  const { data: adminData, error: adminError } = await adminClient
    .from("legal_documents")
    .select("id, type, title")
    .eq("is_active", true);

  if (adminError) {
    console.error("❌ Admin query failed:", adminError);
  } else {
    console.log(`✅ Admin can see ${adminData?.length || 0} documents`);
  }

  // Now test with anon key (respects RLS)
  const anonClient = createClient(supabaseUrl, anonKey);

  console.log("\n2️⃣ Testing with anon key (respects RLS)...");
  const { data: anonData, error: anonError } = await anonClient
    .from("legal_documents")
    .select("id, type, title")
    .eq("is_active", true);

  if (anonError) {
    console.error("❌ Anon query failed:", anonError);
    console.log("\n🔧 Attempting to fix RLS policy...");

    // Try to create/update the RLS policy
    const { error: policyError } = await adminClient
      .rpc("exec_sql", {
        sql: `
        -- Drop existing policy if any
        DROP POLICY IF EXISTS "Legal documents are viewable by everyone" ON legal_documents;
        DROP POLICY IF EXISTS "Anyone can view active legal documents" ON legal_documents;

        -- Create new policy for public read access
        CREATE POLICY "Anyone can view active legal documents"
        ON legal_documents
        FOR SELECT
        USING (is_active = true);

        -- Ensure RLS is enabled
        ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
      `,
      })
      .catch(async () => {
        // If exec_sql doesn't work, try manual approach
        console.log("📝 exec_sql not available, please run this SQL manually:");
        console.log(`
-- Fix RLS for legal_documents
DROP POLICY IF EXISTS "Legal documents are viewable by everyone" ON legal_documents;
DROP POLICY IF EXISTS "Anyone can view active legal documents" ON legal_documents;

CREATE POLICY "Anyone can view active legal documents"
ON legal_documents
FOR SELECT
USING (is_active = true);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
      `);
        return { error: "Manual fix required" };
      });

    if (!policyError) {
      console.log("✅ RLS policy updated, retesting...");

      // Retest
      const { data: retestData, error: retestError } = await anonClient
        .from("legal_documents")
        .select("id, type, title")
        .eq("is_active", true);

      if (retestError) {
        console.error("❌ Still failing after fix:", retestError);
      } else {
        console.log(`✅ Anon can now see ${retestData?.length || 0} documents`);
      }
    }
  } else {
    console.log(`✅ Anon can see ${anonData?.length || 0} documents`);
    if (anonData && anonData.length > 0) {
      console.log("📄 Documents visible to anonymous users:");
      anonData.forEach((doc) => {
        console.log(`   - ${doc.title} (${doc.type})`);
      });
    }
  }

  // Check for specific RLS policies
  console.log("\n3️⃣ Checking RLS policies in database...");
  const { data: policies } = await adminClient
    .from("pg_policies")
    .select("*")
    .eq("tablename", "legal_documents")
    .catch(() => ({ data: null }));

  if (policies) {
    console.log(`Found ${policies.length} policies:`);
    policies.forEach((p) => {
      console.log(
        `   - ${p.policyname}: ${p.cmd} (${p.permissive ? "PERMISSIVE" : "RESTRICTIVE"})`,
      );
    });
  }
}

// Run the check
console.log("🚀 RLS Check for Legal Documents");
console.log("================================\n");

checkRLS()
  .then(() => {
    console.log("\n✅ RLS check complete");
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });
