#!/usr/bin/env tsx

/**
 * Simple investigation of RLS issue
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function investigate() {
  console.log("🔍 Investigating RLS issue...\n");

  // Test with service role (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // First, let's check what happens with a direct query
  console.log("1️⃣ Direct query with service role:");
  const { data: adminData, error: adminError } = await adminClient
    .from("legal_documents")
    .select("id, type, title")
    .limit(3);

  console.log(
    "Result:",
    adminError
      ? `Error: ${adminError.message}`
      : `Success (${adminData?.length} rows)`,
  );

  // Now with anon key
  console.log("\n2️⃣ Direct query with anon key:");
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: anonData, error: anonError } = await anonClient
    .from("legal_documents")
    .select("id, type, title")
    .limit(3);

  console.log(
    "Result:",
    anonError
      ? `Error: ${anonError.message}`
      : `Success (${anonData?.length} rows)`,
  );

  if (anonError?.message.includes("users")) {
    console.log(
      '\n⚠️  The error mentions "users" table even though we\'re querying legal_documents!',
    );
    console.log("This suggests there might be:");
    console.log("  - A view that joins with users");
    console.log("  - A RLS policy that references users");
    console.log("  - A trigger that accesses users");

    // Let's check if we can access auth.users directly
    console.log("\n3️⃣ Testing direct access to auth.users with anon key:");
    const { error: usersError } = await anonClient
      .from("users")
      .select("id")
      .limit(1);

    console.log(
      "Result:",
      usersError ? `Error: ${usersError.message}` : "Success",
    );

    // Check public schema for a users view
    console.log("\n4️⃣ Checking if there's a public.users view:");
    const { data: tables } = await adminClient
      .rpc("exec_sql", {
        sql: `
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('users', 'legal_documents')
      `,
      })
      .then((r) => r)
      .catch(() => ({ data: null }));

    if (tables) {
      console.log("Tables found:");
      tables.forEach((t: any) => {
        console.log(`  - ${t.table_name}: ${t.table_type}`);
      });
    }
  }

  // Let's also check what the actual error details are
  console.log("\n5️⃣ Detailed error information:");
  const { error: detailError } = await anonClient
    .from("legal_documents")
    .select()
    .single();

  if (detailError) {
    console.log("Error details:");
    console.log("  Code:", detailError.code);
    console.log("  Message:", detailError.message);
    console.log("  Details:", detailError.details);
    console.log("  Hint:", detailError.hint);
  }
}

investigate().catch(console.error);
