#!/usr/bin/env tsx

/**
 * Investigate root cause of RLS issue with legal_documents table
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function investigateRLS() {
  console.log("🔍 Investigating RLS Root Cause for legal_documents\n");

  try {
    // 1. Check table structure
    console.log("1️⃣ Checking table structure...");
    const { data: columns } = await supabase
      .rpc("exec_sql", {
        sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'legal_documents'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `,
      })
      .catch(async () => {
        // Fallback if exec_sql doesn't exist
        const { data } = await supabase
          .from("legal_documents")
          .select()
          .limit(0);

        return {
          data: Object.keys(data?.[0] || {}).map((col) => ({
            column_name: col,
          })),
        };
      });

    console.log("Columns:", columns?.map((c) => c.column_name).join(", "));

    // 2. Check RLS status
    console.log("\n2️⃣ Checking RLS status...");
    const { data: rlsStatus } = await supabase
      .rpc("exec_sql", {
        sql: `
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'legal_documents'
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      `,
      })
      .catch(() => ({ data: [{ relrowsecurity: "unknown" }] }));

    console.log(
      "RLS Enabled:",
      rlsStatus?.[0]?.relrowsecurity === true ? "Yes" : "No",
    );

    // 3. Check existing policies
    console.log("\n3️⃣ Checking existing RLS policies...");
    const { data: policies } = await supabase
      .rpc("exec_sql", {
        sql: `
        SELECT
          polname as policy_name,
          polcmd as command,
          polpermissive as permissive,
          pg_get_expr(polqual, polrelid) as qual,
          pg_get_expr(polwithcheck, polrelid) as with_check
        FROM pg_policy
        WHERE polrelid = 'public.legal_documents'::regclass
      `,
      })
      .catch(() => ({ data: [] }));

    if (policies && policies.length > 0) {
      console.log("Found policies:");
      policies.forEach((p: any) => {
        console.log(
          `  - ${p.policy_name}: ${p.command} (${p.permissive ? "PERMISSIVE" : "RESTRICTIVE"})`,
        );
        console.log(`    USING: ${p.qual || "none"}`);
        if (p.with_check) console.log(`    WITH CHECK: ${p.with_check}`);
      });
    } else {
      console.log("No policies found!");
    }

    // 4. Check for views or functions
    console.log("\n4️⃣ Checking if legal_documents is a view...");
    const { data: tableType } = await supabase
      .rpc("exec_sql", {
        sql: `
        SELECT table_type
        FROM information_schema.tables
        WHERE table_name = 'legal_documents'
        AND table_schema = 'public'
      `,
      })
      .catch(() => ({ data: [{ table_type: "unknown" }] }));

    console.log("Table type:", tableType?.[0]?.table_type);

    // 5. Check for triggers
    console.log("\n5️⃣ Checking for triggers...");
    const { data: triggers } = await supabase
      .rpc("exec_sql", {
        sql: `
        SELECT
          tgname as trigger_name,
          proname as function_name
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE tgrelid = 'public.legal_documents'::regclass
      `,
      })
      .catch(() => ({ data: [] }));

    if (triggers && triggers.length > 0) {
      console.log("Found triggers:");
      triggers.forEach((t: any) => {
        console.log(`  - ${t.trigger_name} -> ${t.function_name}()`);
      });
    } else {
      console.log("No triggers found");
    }

    // 6. Test with different auth contexts
    console.log("\n6️⃣ Testing access with different auth contexts...");

    // Test with anon key
    const anonClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    console.log("\nTesting with anon key:");
    const { error: anonError } = await anonClient
      .from("legal_documents")
      .select("id")
      .limit(1);

    if (anonError) {
      console.log("❌ Anon access failed:", anonError.message);

      // Check if error mentions a specific table
      if (anonError.message.includes("users")) {
        console.log('\n⚠️  Error mentions "users" table!');
        console.log(
          "This suggests a policy or view is trying to access the users table",
        );

        // Check for policies that reference users
        console.log("\n7️⃣ Checking for policies that reference users table...");
        const { data: userPolicies } = await supabase
          .rpc("exec_sql", {
            sql: `
            SELECT
              n.nspname || '.' || c.relname as table_name,
              p.polname as policy_name,
              pg_get_expr(p.polqual, p.polrelid) as qual
            FROM pg_policy p
            JOIN pg_class c ON p.polrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE pg_get_expr(p.polqual, p.polrelid) LIKE '%users%'
            OR pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%users%'
          `,
          })
          .catch(() => ({ data: [] }));

        if (userPolicies && userPolicies.length > 0) {
          console.log("Found policies referencing users:");
          userPolicies.forEach((p: any) => {
            console.log(`  - ${p.table_name}.${p.policy_name}`);
            console.log(`    ${p.qual}`);
          });
        }
      }
    } else {
      console.log("✅ Anon access succeeded");
    }

    // 8. Check auth schema permissions
    console.log("\n8️⃣ Checking auth schema permissions...");
    const { data: authPerms } = await supabase
      .rpc("exec_sql", {
        sql: `
        SELECT
          grantee,
          privilege_type
        FROM information_schema.table_privileges
        WHERE table_schema = 'auth'
        AND table_name = 'users'
        AND grantee IN ('anon', 'authenticated', 'public')
      `,
      })
      .catch(() => ({ data: [] }));

    if (authPerms && authPerms.length > 0) {
      console.log("Auth.users permissions:");
      authPerms.forEach((p: any) => {
        console.log(`  - ${p.grantee}: ${p.privilege_type}`);
      });
    } else {
      console.log("No permissions found for anon/authenticated on auth.users");
    }
  } catch (error) {
    console.error("Investigation failed:", error);
  }
}

// Run investigation
investigateRLS()
  .then(() => {
    console.log("\n✅ Investigation complete");
  })
  .catch(console.error);
