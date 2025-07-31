'use client'

import { useState, useEffect, ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// --- Type Definitions ---

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

interface InfoRowProps {
  label: string;
  value: unknown;
  verbatim?: boolean;
}

interface LegalDoc {
    id: string;
    version: string;
}

// --- Helper Components ---

const getStatusColor = (status: PanelProps['status']) => {
  switch (status) {
    case 'running': return 'border-blue-500';
    case 'success': return 'border-green-500';
    case 'error': return 'border-red-500';
    default: return 'border-slate-700';
  }
}

const Panel = ({ title, children, className = '', status }: PanelProps) => (
  <div className={`bg-slate-800 rounded-lg p-4 flex flex-col border-t-4 ${getStatusColor(status)} ${className}`}>
    <h2 className="text-lg font-bold text-white mb-3 border-b border-slate-600 pb-2">{title}</h2>
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
          {value !== undefined && value !== null ? JSON.stringify(value, null, 2) : 'null'}
        </pre>
      ) : (
        <span className="text-gray-100 break-all">{value ?? 'null'}</span>
      )}
    </div>
  </div>
)

// --- Main Component ---

export default function TestSignupAdvancedDashboard() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState(`test-advanced-${Date.now()}@claimguardian.test`);
  const [password, setPassword] = useState('password123');
  const [firstName] = useState('Advanced');
  const [lastName] = useState('User');

  // Panel States
  const [panel1State, setPanel1State] = useState<Record<string, unknown> | null>(null);
  const [panel2State, setPanel2State] = useState<Record<string, unknown> | null>(null);
  const [panel3State, setPanel3State] = useState<Record<string, unknown> | null>(null);
  const [panel4State, setPanel4State] = useState<Record<string, unknown> | null>(null);

  const [panel1Status, setPanel1Status] = useState<PanelProps['status']>('pending');
  const [panel2Status, setPanel2Status] = useState<PanelProps['status']>('pending');
  const [panel3Status, setPanel3Status] = useState<PanelProps['status']>('pending');
  const [panel4Status, setPanel4Status] = useState<PanelProps['status']>('pending');

  useEffect(() => {
    try {
      const client = createBrowserSupabaseClient();
      setSupabase(client);
    } catch (error) {
      setInitError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const resetPanels = () => {
    setPanel1State(null);
    setPanel2State(null);
    setPanel3State(null);
    setPanel4State(null);
    setPanel1Status('pending');
    setPanel2Status('pending');
    setPanel3Status('pending');
    setPanel4Status('pending');
  };

  const runTest = async () => {
    if (!supabase) return;
    setLoading(true);
    resetPanels();

    let consentToken: string | null = null;
    let newUser: User | null = null;

    // --- Panel 1: Client-Side Data Capture ---
    setPanel1Status('running');
    const p1Data = {
      userInput: { email, password: '*** MASKED ***', firstName, lastName },
      metadata: { ipAddress: '127.0.0.1', userAgent: navigator.userAgent, deviceFingerprint: 'mock-fingerprint-adv' },
      legalDocs: await getActiveLegalDocs(supabase),
    };
    setPanel1State(p1Data);
    setPanel1Status('success');

    // --- Panel 2: Pre-Signup Anonymous Consent ---
    try {
      setPanel2Status('running');
      const consentPayload = {
        p_ip_address: p1Data.metadata.ipAddress,
        p_user_agent: p1Data.metadata.userAgent,
        p_device_fingerprint: p1Data.metadata.deviceFingerprint,
        p_accepted_documents: p1Data.legalDocs.map(d => d.id)
      };
      setPanel2State({ requestPayload: consentPayload });

      const { data, error } = await supabase.rpc('record_signup_consent', consentPayload);
      if (error) throw error;
      
      consentToken = data.consent_token;
      setPanel2State((prev) => ({ ...prev, response: { consent_token: consentToken } }));
      setPanel2Status('success');
    } catch (error) {
      setPanel2Status('error');
      setPanel2State((prev) => ({ ...prev, error: error instanceof Error ? error.message : String(error) }));
      setLoading(false);
      return;
    }

    // --- Panel 3: Core Authentication ---
    try {
      setPanel3Status('running');
      const signUpPayload = {
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: '123-456-7890',
            consent_token: consentToken, // Critical piece
            ...p1Data.metadata
          },
        },
      };
      setPanel3State({ requestPayload: { ...signUpPayload, password: '*** MASKED ***' } });

      const { data, error } = await supabase.auth.signUp(signUpPayload);
      if (error) throw error;
      if (!data.user) throw new Error('Signup successful but no user object returned.');

      newUser = data.user;
      setPanel3State((prev) => ({ ...prev, response: data }));
      setPanel3Status('success');
    } catch (error) {
      setPanel3Status('error');
      setPanel3State((prev) => ({ ...prev, error: error instanceof Error ? error.message : String(error) }));
      setLoading(false);
      return;
    }

    // --- Panel 4: Post-Signup Linking & Verification ---
    try {
      setPanel4Status('running');
      const finalState: Record<string, unknown> = {};

      // Action 1: Link consent
      const linkPayload = { p_user_id: newUser.id, p_consent_token: consentToken };
      finalState.linkRequest = linkPayload;
      const { error: linkError } = await supabase.rpc('link_consent_to_user', linkPayload);
      if (linkError) throw new Error(`Failed to link consent: ${linkError.message}`);
      finalState.linkResponse = { success: true };

      // Action 2: Verify final state
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', newUser.id).single();
      if (profileError) throw new Error(`Failed to fetch profile: ${profileError.message}`);
      finalState.profileRecord = profileData;

      const { data: consentData, error: consentError } = await supabase.from('user_consents').select('*').eq('user_id', newUser.id);
      if (consentError) throw new Error(`Failed to fetch consents: ${consentError.message}`);
      finalState.consentRecords = consentData;

      setPanel4State(finalState);
      setPanel4Status('success');
    } catch (error) {
      setPanel4Status('error');
      setPanel4State((prev) => ({ ...prev, error: error instanceof Error ? error.message : String(error) }));
    } finally {
      setLoading(false);
    }
  };
  
  const getActiveLegalDocs = async (client: SupabaseClient): Promise<LegalDoc[]> => {
    const { data, error } = await client.from('legal_documents').select('id, version').eq('is_active', true);
    if (error) {
        console.error("Failed to fetch active legal docs", error);
        return [];
    }
    return data;
  }

  if (initError) return <div className="text-red-500 p-8">{initError}</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h1 className="text-2xl font-bold text-white">Ultimate Signup & Compliance Debugger</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white" />
            <button onClick={runTest} disabled={loading || !supabase} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded">
              {loading ? 'Running Test...' : 'Run Compliance-First Signup Test'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Panel title="1. Client Data Capture" status={panel1Status}>
          {panel1State && <InfoRow label="Final Payload" value={panel1State} verbatim />}
        </Panel>
        <Panel title="2. Pre-Signup Consent" status={panel2Status}>
          {panel2State && <InfoRow label="RPC Call" value={panel2State} verbatim />}
        </Panel>
        <Panel title="3. Core Authentication" status={panel3Status}>
          {panel3State && <InfoRow label="auth.signUp()" value={panel3State} verbatim />}
        </Panel>
        <Panel title="4. Post-Signup State" status={panel4Status}>
          {panel4State && <InfoRow label="Final DB State" value={panel4State} verbatim />}
        </Panel>
      </div>
    </div>
  )
}