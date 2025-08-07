/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const results = {
    status: "checking",
    tables: {
      properties: false,
      user_profiles: false,
      audit_logs: false,
      legal_documents: false,
      login_activity: false,
    },
    summary: "",
  };

  try {
    // Test each table
    const { error: propError } = await supabase
      .from("properties")
      .select("count")
      .limit(0);
    results.tables.properties = !propError;

    const { error: profError } = await supabase
      .from("user_profiles")
      .select("count")
      .limit(0);
    results.tables.user_profiles = !profError;

    const { error: auditError } = await supabase
      .from("audit_logs")
      .select("count")
      .limit(0);
    results.tables.audit_logs = !auditError;

    const { error: legalError } = await supabase
      .from("legal_documents")
      .select("count")
      .limit(0);
    results.tables.legal_documents = !legalError;

    const { error: loginError } = await supabase
      .from("login_activity")
      .select("count")
      .limit(0);
    results.tables.login_activity = !loginError;

    const workingTables = Object.values(results.tables).filter((v) => v).length;
    const totalTables = Object.keys(results.tables).length;

    results.status = workingTables === totalTables ? "success" : "partial";
    results.summary = `${workingTables}/${totalTables} tables accessible`;

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        results,
      },
      { status: 500 });
  }
}
