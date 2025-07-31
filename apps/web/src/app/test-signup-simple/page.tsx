'use client'

import { useState, useEffect, ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import type { SupabaseClient, AuthError } from '@supabase/supabase-js'

// --- Type Definitions ---

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
}

interface InfoRowProps {
  label: string;
  value: unknown;
  verbatim?: boolean;
}

interface CurlCommandProps {
  curl: string;
}

interface ClientInfoState {
  timestamp: string;
  appBuildSha: string;
  supabaseUrl: string;
  anonKeySnippet: string;
  supabaseJsVersion: string;
  signupPayload: object;
  browserUa: string;
  networkStatus: string;
  signUpResponse?: { data: unknown; error: AuthError | null };
}

interface NetworkInfoState {
  method: string;
  url: string;
  roundTripTime: string;
  requestHeaders: object;
  requestBody: object;
  responseBody: unknown;
  statusCode: number;
  curlReplay: string;
}

interface LogsInfoState {
  requestId: string;
  logflareLink: string;
}

interface RlsInfoState {
  error?: string;
  jwt_role?: string;
  db_user?: string;
  can_insert_auth_users?: boolean;
  rls_active_auth_users?: boolean;
  insert_policy_auth_users?: string;
}


// --- Helper Components ---

const Panel = ({ title, children, className = '' }: PanelProps) => (
  <div className={`bg-slate-800 rounded-lg p-4 flex flex-col ${className}`}>
    <h2 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-2">{title}</h2>
    <div className="flex-grow overflow-y-auto text-xs text-gray-300 space-y-2 pretty-scrollbar">
      {children}
    </div>
  </div>
)

const InfoRow = ({ label, value, verbatim = false }: InfoRowProps) => (
  <div className="grid grid-cols-3 gap-2 items-start">
    <strong className="text-gray-400 font-medium col-span-1">{label}:</strong>
    <div className="col-span-2">
      {verbatim ? (
        <pre className="bg-slate-900 p-2 rounded text-xs whitespace-pre-wrap break-all">
          {value ?? 'null'}
        </pre>
      ) : (
        <span className="text-gray-100 break-all">{value ?? 'null'}</span>
      )}
    </div>
  </div>
)

const CurlCommand = ({ curl }: CurlCommandProps) => (
  <div>
    <strong className="text-gray-400 font-medium">cURL Replay:</strong>
    <pre className="bg-slate-900 p-2 rounded text-xs whitespace-pre-wrap break-all mt-1 text-green-300">
      {curl}
    </pre>
  </div>
)

// --- Main Component ---

export default function TestSignupDebugDashboard() {
  console.log('[Debug Dashboard] Component rendering started.');

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(`test-user-${Date.now()}@claimguardian.test`)
  const [password, setPassword] = useState('password123')

  // State for each panel
  const [clientInfo, setClientInfo] = useState<ClientInfoState | null>(null)
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoState | null>(null)
  const [logsInfo, setLogsInfo] = useState<LogsInfoState | null>(null)
  const [rlsInfo, setRlsInfo] = useState<RlsInfoState | null>(null)

  useEffect(() => {
    console.log('[Debug Dashboard] useEffect triggered for initialization.');
    try {
      // Verify environment variables are available on the client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Debug Dashboard] Supabase environment variables are missing!');
        throw new Error('Supabase URL or Anon Key is not configured. Check your .env.local file and ensure variables are prefixed with NEXT_PUBLIC_.');
      }
      
      console.log('[Debug Dashboard] Environment variables found. Creating Supabase client.');
      const client = createBrowserSupabaseClient();
      setSupabase(client);
      console.log('[Debug Dashboard] Supabase client created successfully.');

    } catch (error) {
      console.error('[Debug Dashboard] Error during initialization:', error);
      setInitError(error instanceof Error ? error.message : String(error));
    }
  }, []);


  const resetState = () => {
    setClientInfo(null)
    setNetworkInfo(null)
    setLogsInfo(null)
    setRlsInfo(null)
  }

  const getCurlCommand = (url: string, headers: object, body: object): string => {
    const headersString = Object.entries(headers)
      .map(([key, value]) => `  -H '${key}: ${value}'`)
      .join(' \
')

    return `curl -v -X POST '${url}' \
${headersString} \
  -d '${JSON.stringify(body, null, 2)}'`
  }

  const testSignup = async () => {
    if (!supabase) {
      console.error('[Debug Dashboard] testSignup called before Supabase client was initialized.');
      setInitError('Cannot run test: Supabase client is not available.');
      return;
    }
    console.log('[Debug Dashboard] testSignup function started.');
    setLoading(true)
    resetState()

    const startTime = performance.now()
    const signupPayload = {
      email,
      password,
      options: { data: { full_name: 'Test User Simple' } },
    }

    // --- 1. Client Layer Info ---
    const anonKey = (supabase.auth as unknown as { supabaseKey: string }).supabaseKey
    const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
    
    const clientData: ClientInfoState = {
      timestamp: new Date().toISOString(),
      appBuildSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'N/A (local)',
      supabaseUrl: supabaseUrl,
      anonKeySnippet: `${anonKey?.slice(0, 8)}...`,
      supabaseJsVersion: (supabase as unknown as { realtime?: { client: { version: string } } }).realtime?.client.version ?? 'N/A',
      signupPayload: { ...signupPayload, password: '*** MASKED ***' },
      browserUa: navigator.userAgent,
      networkStatus: navigator.onLine ? 'online' : 'offline',
    }
    setClientInfo(clientData)
    console.log('[Debug Dashboard] Panel 1 data captured.');

    // --- 4. RLS Audit (Run immediately to check pre-request state) ---
    try {
        const { data: rlsData, error: rlsError } = await supabase.functions.invoke('debug-rls-audit')
        if (rlsError) throw rlsError
        setRlsInfo(rlsData.data[0])
        console.log('[Debug Dashboard] Panel 4 data captured.');
    } catch (err) {
        console.error('[Debug Dashboard] RLS Audit Error:', err);
        setRlsInfo({ error: err instanceof Error ? err.message : String(err) })
    }

    // --- 2. Network Request ---
    const { data, error } = await supabase.auth.signUp(signupPayload)
    const endTime = performance.now()

    const requestUrl = `${supabaseUrl}/auth/v1/signup`
    const requestHeaders = {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'x-client-info': `supabase-js/${(supabase as unknown as { realtime?: { client: { version: string } } }).realtime?.client.version ?? 'N/A'}`,
      'Content-Type': 'application/json'
    }

    setClientInfo(prev => ({ ...prev!, signUpResponse: { data, error } }))

    const networkData: NetworkInfoState = {
      method: 'POST',
      url: requestUrl,
      roundTripTime: (endTime - startTime).toFixed(2),
      requestHeaders,
      requestBody: { ...signupPayload, password: '*** MASKED ***' },
      responseBody: error ?? data,
      statusCode: error?.status ?? 200,
      curlReplay: getCurlCommand(requestUrl, requestHeaders, { ...signupPayload, password: '*** MASKED ***' }),
    }
    setNetworkInfo(networkData)
    console.log('[Debug Dashboard] Panel 2 data captured.');

    // --- 3. Logs Snapshot ---
    const projectId = (supabase as unknown as { projectId: string }).projectId
    const requestId = (error as unknown as { code?: string })?.code
    const logLink = `https://app.supabase.com/project/${projectId}/logs/edge-logs`
    setLogsInfo({
      requestId: requestId ?? 'Not found in response',
      logflareLink: requestId ? `${logLink}?q=request_id%3D%22${requestId}%22` : logLink,
    })
    console.log('[Debug Dashboard] Panel 3 data captured.');

    setLoading(false)
    console.log('[Debug Dashboard] testSignup function finished.');
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-red-900 text-white p-8 flex items-center justify-center">
        <div className="max-w-2xl bg-red-800 p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Initialization Error</h1>
          <p className="mb-4">The debug dashboard could not be loaded. This is often due to missing environment variables.</p>
          <pre className="bg-gray-900 p-4 rounded text-sm whitespace-pre-wrap">{initError}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h1 className="text-2xl font-bold text-white">Complete Debug Dashboard: Simple Signup</h1>
          <div className="flex gap-4 mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="test@example.com"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-1/3 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="password123"
            />
            <button
              onClick={testSignup}
              disabled={loading || !supabase}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded"
            >
              {loading ? 'Testing...' : 'Run Signup Test'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Panel title="1. Browser → Supabase Client">
          {clientInfo && (
            <>
              <InfoRow label="Timestamp" value={clientInfo.timestamp} />
              <InfoRow label="App Build SHA" value={clientInfo.appBuildSha} />
              <InfoRow label="Supabase URL" value={clientInfo.supabaseUrl} />
              <InfoRow label="Anon Key Snippet" value={clientInfo.anonKeySnippet} />
              <InfoRow label="supabase-js" value={clientInfo.supabaseJsVersion} />
              <InfoRow label="Browser UA" value={clientInfo.browserUa} />
              <InfoRow label="Network Status" value={clientInfo.networkStatus} />
              <InfoRow label="Sign-up Payload" value={JSON.stringify(clientInfo.signupPayload, null, 2)} verbatim />
              <InfoRow label="signUp() Response" value={JSON.stringify(clientInfo.signUpResponse, null, 2)} verbatim />
            </>
          )}
        </Panel>

        <Panel title="2. Network Request (HAR-style)">
          {networkInfo && (
            <>
              <InfoRow label="Method / URL" value={`${networkInfo.method} ${networkInfo.url}`} />
              <InfoRow label="Status Code" value={networkInfo.statusCode} />
              <InfoRow label="Round-trip (ms)" value={networkInfo.roundTripTime} />
              <InfoRow label="Request Headers" value={JSON.stringify(networkInfo.requestHeaders, null, 2)} verbatim />
              <InfoRow label="Request Body" value={JSON.stringify(networkInfo.requestBody, null, 2)} verbatim />
              <InfoRow label="Response Body" value={JSON.stringify(networkInfo.responseBody, null, 2)} verbatim />
              <CurlCommand curl={networkInfo.curlReplay} />
            </>
          )}
        </Panel>

        <Panel title="3. Supabase Edge Logs Snapshot">
          {logsInfo && (
            <>
              <InfoRow label="Request ID" value={logsInfo.requestId} />
              <div className="space-y-2">
                <p>Live log streaming from the client is not feasible. Use the link below to view logs for this request.</p>
                <a
                  href={logsInfo.logflareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline break-all"
                >
                  View Logs in Supabase Dashboard
                </a>
                <p className="text-gray-400">You may need to refresh the log view for 20-30 seconds after the request is made.</p>
              </div>
            </>
          )}
        </Panel>

        <Panel title="4. DB Privilege / RLS Audit">
          {rlsInfo ? (
            rlsInfo.error ? (
              <InfoRow label="Error" value={rlsInfo.error} verbatim />
            ) : (
              <>
                <InfoRow label="JWT Role" value={rlsInfo.jwt_role} />
                <InfoRow label="DB User" value={rlsInfo.db_user} />
                <InfoRow label="Can INSERT auth.users" value={String(rlsInfo.can_insert_auth_users)} />
                <InfoRow label="RLS Active on auth.users" value={String(rlsInfo.rls_active_auth_users)} />
                <InfoRow label="INSERT Policy" value={rlsInfo.insert_policy_auth_users} />
              </>
            )
          ) : (
             <p>Awaiting test run...</p>
          )}
        </Panel>
      </div>
    </div>
  )
}