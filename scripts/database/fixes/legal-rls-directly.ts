#!/usr/bin/env tsx

/**
 * Fix RLS permissions directly
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixRLS() {
  console.log("🔧 Fixing RLS for legal_documents...\n");

  try {
    // Execute SQL to fix RLS
    const sql = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Legal documents are viewable by everyone" ON legal_documents;
      DROP POLICY IF EXISTS "Anyone can view active legal documents" ON legal_documents;
      DROP POLICY IF EXISTS "Public can read legal documents" ON legal_documents;
      DROP POLICY IF EXISTS "Authenticated users can read legal documents" ON legal_documents;

      -- Disable RLS temporarily
      ALTER TABLE legal_documents DISABLE ROW LEVEL SECURITY;

      -- Re-enable with proper policy
      ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

      -- Create a permissive policy for everyone
      CREATE POLICY "Anyone can read legal documents"
      ON legal_documents
      FOR SELECT
      USING (true);

      -- Grant permissions
      GRANT USAGE ON SCHEMA public TO anon;
      GRANT SELECT ON legal_documents TO anon;
      GRANT SELECT ON legal_documents TO authenticated;
    `;

    // Use multiple queries since Supabase doesn't support multi-statement SQL
    const queries = sql
      .split(";")
      .filter((q) => q.trim())
      .map((q) => q.trim() + ";");

    for (const query of queries) {
      console.log("Executing:", query.split("\n")[0].substring(0, 60) + "...");

      // Try to execute via rpc if available, otherwise skip
      try {
        const { error } = await supabase.rpc("exec_sql", { sql: query });
        if (error) {
          console.log("  ⚠️  RPC not available, manual execution needed");
        } else {
          console.log("  ✅ Success");
        }
      } catch (e) {
        console.log("  ⚠️  Manual execution required");
      }
    }

    // Test access with anon key
    console.log("\n🧪 Testing access with anon key...");
    const anonClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await anonClient
      .from("legal_documents")
      .select("id, type, title")
      .eq("is_active", true);

    if (error) {
      console.log("❌ Still failing:", error.message);
      console.log(
        "\n📝 Please execute this SQL manually in Supabase SQL Editor:",
      );
      console.log("```sql");
      console.log(sql);
      console.log("```");
    } else {
      console.log("✅ Success! Found", data?.length, "documents");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

fixRLS().catch(console.error);
