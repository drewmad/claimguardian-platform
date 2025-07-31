'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@claimguardian/db'

export default function TestSignupComplete() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [step, setStep] = useState('')
  const supabase = createBrowserSupabaseClient()

  const testCompleteSignup = async () => {
    setLoading(true)
    setResult('')
    setStep('')
    
    try {
      setStep('1. Starting signup...')
      console.log('[TEST COMPLETE] Starting complete signup test...')
      
      const testEmail = email || `test${Date.now()}@example.com`
      const testPassword = password || 'password123'
      
      setStep('2. Creating user account...')
      console.log('[TEST COMPLETE] Creating user with email:', testEmail)
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            firstName: 'Test',
            lastName: 'User'
          }
        }
      })
      
      console.log('[TEST COMPLETE] Signup response:', {
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
        setResult(`❌ SIGNUP FAILED: ${error.message} (Status: ${error.status})`)
        setStep('')
        return
      }
      
      if (!data.user) {
        setResult('❌ SIGNUP FAILED: No user data returned')
        setStep('')
        return
      }
      
      setStep('3. Checking profile creation...')
      
      // Wait a moment for triggers to complete
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      console.log('[TEST COMPLETE] Profile check:', { profile, profileError })
      
      setStep('4. Checking user_profiles creation...')
      
      // Check if user_profiles was created
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()
      
      console.log('[TEST COMPLETE] User profile check:', { userProfile, userProfileError })
      
      setStep('5. Complete!')
      
      let resultMessage = `✅ SIGNUP SUCCESS!\n\n`
      resultMessage += `👤 User ID: ${data.user.id}\n`
      resultMessage += `📧 Email: ${data.user.email}\n`
      resultMessage += `📝 Profile Created: ${profile ? '✅ Yes' : '❌ No'}\n`
      resultMessage += `📋 User Profile: ${userProfile ? '✅ Yes' : '❌ No'}\n`
      resultMessage += `🔐 Email Confirmed: ${data.user.email_confirmed_at ? '✅ Yes' : '⏳ Pending'}\n`
      
      if (profile) {
        resultMessage += `\n👤 Profile Data:\n`
        resultMessage += `- Full Name: ${profile.full_name || 'Not set'}\n`
        resultMessage += `- Updated: ${profile.updated_at}\n`
      }
      
      setResult(resultMessage)
      
    } catch (err) {
      console.error('[TEST COMPLETE] Unexpected error:', err)
      setResult(`❌ CATCH ERROR: ${err instanceof Error ? err.message : String(err)}`)
      setStep('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Test Complete Signup Flow</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email (optional - will generate random):
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="Leave empty for auto-generated email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password (optional - defaults to 'password123'):
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
            onClick={testCompleteSignup}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-4 rounded font-semibold"
          >
            {loading ? 'Testing Complete Flow...' : 'Test Complete Signup Flow'}
          </button>
        </div>
        
        {step && (
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded">
            <p className="text-blue-300 font-medium">Current Step:</p>
            <p className="text-white">{step}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-6 p-4 bg-slate-700 rounded">
            <h3 className="font-semibold text-white mb-3">Complete Test Result:</h3>
            <pre className={`text-sm whitespace-pre-wrap ${result.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {result}
            </pre>
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-400 space-y-1">
          <p>• This tests the complete signup flow including database triggers</p>
          <p>• Checks profile creation, user_profiles, and all related tables</p>
          <p>• Check the browser console for detailed logs</p>
          <p>• Uses RLS-aware queries to verify data was created properly</p>
        </div>
      </div>
    </div>
  )
}