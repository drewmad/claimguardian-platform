/**
 * @fileMetadata
 * @purpose "Debug page to diagnose authentication issues"
 * @dependencies ["@/components","@/lib","@claimguardian/ui","react"]
 * @owner frontend-team
 * @status stable
 */
"use client";

import { Card } from "@claimguardian/ui";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";

export default function AuthDebugPage() {
  const auth = useAuth();
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [apiDebug, setApiDebug] = useState<Record<string, unknown> | null>(
    null,
  );

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      // Check user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // Check session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // Test connection
      const { error: testError } = await supabase
        .from("_test")
        .select("*")
        .limit(1);

      setDebugInfo({
        timestamp: new Date().toISOString(),
        env: {
          supabaseUrl:
            process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        user: {
          exists: !!user,
          error: userError?.message,
          email: user?.email,
          id: user?.id,
        },
        session: {
          exists: !!session,
          error: sessionError?.message,
          expiresAt: session?.expires_at,
          user: session?.user?.email,
        },
        connection: {
          error: testError?.message,
          isConnected:
            !testError || testError.message.includes("does not exist"),
        },
        authContext: {
          user: auth.user?.email,
          loading: auth.loading,
          error: auth.error?.message,
          sessionWarning: auth.sessionWarning,
        },
      });

      // Fetch API debug info
      try {
        const response = await fetch("/api/auth/debug");
        const data = await response.json();
        setApiDebug(data);
      } catch {
        setApiDebug({ error: "Failed to fetch API debug info" });
      }
    };

    checkAuth();
  }, [auth]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          Auth Debug Information
        </h1>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Client-Side Debug
          </h2>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Server-Side Debug
          </h2>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(apiDebug, null, 2)}
          </pre>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => (window.location.href = "/auth/signin")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Sign In
            </button>

            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-4"
            >
              Clear Session
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
