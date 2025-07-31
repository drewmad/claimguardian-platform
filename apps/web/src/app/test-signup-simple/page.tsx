'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@claimguardian/db'

export default function TestSignupSimple() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const supabase = createBrowserSupabaseClient()

  const testSignup = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('[TEST SIGNUP] Starting signup test...')
      console.log('[TEST SIGNUP] Email:', email)
      console.log('[TEST SIGNUP] Password length:', password.length)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName: 'Test',
            lastName: 'User'
          }
        }
      })
      
      console.log('[TEST SIGNUP] Supabase response:', {
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        hasSession: !!data?.session,
        error: error ? {
          message: error.message,
          status: error.status,
          code: error.code
        } : null
      })
      
      if (error) {
        setResult(`ERROR: ${error.message} (Status: ${error.status})`)
      } else if (data.user) {
        setResult(`SUCCESS: User created with ID ${data.user.id}. Email: ${data.user.email}`)
      } else {
        setResult('UNKNOWN: No error but no user data returned')
      }
    } catch (err) {
      console.error('[TEST SIGNUP] Unexpected error:', err)
      setResult(`CATCH ERROR: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-md mx-auto bg-slate-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Test Signup Simple</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="password123"
            />
          </div>
          
          <button
            onClick={testSignup}
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </button>
        </div>
        
        {result && (
          <div className="mt-6 p-4 bg-slate-700 rounded">
            <h3 className="font-semibold text-white mb-2">Result:</h3>
            <p className={`text-sm ${result.startsWith('SUCCESS') ? 'text-green-400' : 'text-red-400'}`}>
              {result}
            </p>
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-400">
          <p>This tests direct Supabase client signup without the auth service layer.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
        <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-md">
          <p className="text-sm text-yellow-300">
            <span className="font-bold">Supabase Role Used:</span> The sign-up operation below is performed by the client using the{' '}
            <code className="px-1 py-0.5 bg-gray-700 rounded text-yellow-100 font-mono text-xs">anon</code> role. This role is granted by the public-facing{' '}
            <code className="px-1 py-0.5 bg-gray-700 rounded text-yellow-100 font-mono text-xs">SUPABASE_ANON_KEY</code> and has permission to create new users in the `auth.users` table.
          </p>
        </div>
      </div>
    </div>
  )
}