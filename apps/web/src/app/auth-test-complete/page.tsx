'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

export default function AuthTestCompletePage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  
  const supabase = createBrowserSupabaseClient()
  
  const addTestResult = (test: string, success: boolean, details: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      details,
      timestamp: new Date().toISOString()
    }])
  }
  
  const clearResults = () => {
    setTestResults([])
  }
  
  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    return user
  }
  
  useEffect(() => {
    checkCurrentUser()
  }, [])
  
  const runCompleteAuthTest = async () => {
    setLoading(true)
    clearResults()
    
    try {
      // Test 1: Check current auth state
      addTestResult('Check Current Auth State', true, {
        authenticated: !!user,
        userId: user?.id,
        email: user?.email
      })
      
      // If already signed in, sign out first
      if (user) {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) {
          addTestResult('Sign Out', false, { error: signOutError.message })
        } else {
          addTestResult('Sign Out', true, { message: 'Successfully signed out' })
          setUser(null)
        }
      }
      
      // Test 2: Create new account
      const uniqueEmail = testEmail || `test-${Date.now()}@example.com`
      const password = testPassword || 'TestPassword123!'
      
      addTestResult('Test Credentials', true, {
        email: uniqueEmail,
        passwordLength: password.length
      })
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password: password,
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
      
      if (signUpError) {
        addTestResult('Sign Up', false, { error: signUpError.message })
        setLoading(false)
        return
      }
      
      addTestResult('Sign Up', true, {
        userId: signUpData.user?.id,
        email: signUpData.user?.email,
        emailConfirmed: signUpData.user?.email_confirmed_at ? 'Yes' : 'No',
        session: signUpData.session ? 'Created' : 'Not created'
      })
      
      // Test 3: Sign in with created account
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: uniqueEmail,
        password: password
      })
      
      if (signInError) {
        addTestResult('Sign In', false, { error: signInError.message })
      } else {
        addTestResult('Sign In', true, {
          userId: signInData.user?.id,
          session: signInData.session ? 'Active' : 'No session',
          expiresAt: signInData.session?.expires_at
        })
        setUser(signInData.user)
      }
      
      // Test 4: Check profile
      if (signInData?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single()
        
        if (profileError) {
          addTestResult('Profile Check', false, { 
            error: profileError.message,
            hint: 'Profile table might not exist or trigger not set up'
          })
        } else {
          addTestResult('Profile Check', true, profile)
        }
      }
      
      // Test 5: Test protected API route
      const response = await fetch('/api/auth/session')
      const sessionData = await response.json()
      
      addTestResult('API Session Check', response.ok, {
        status: response.status,
        data: sessionData
      })
      
    } catch (error) {
      addTestResult('Unexpected Error', false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Complete Auth Test Suite</h1>
          </div>
          <p className="text-gray-400">Comprehensive authentication flow testing</p>
        </div>
        
        {/* Test Controls */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Test Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testEmail" className="text-gray-300">Test Email (optional)</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Leave empty for auto-generated"
                  />
                </div>
                <div>
                  <Label htmlFor="testPassword" className="text-gray-300">Test Password (optional)</Label>
                  <Input
                    id="testPassword"
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Default: TestPassword123!"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={runCompleteAuthTest}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Running Tests...
                    </>
                  ) : (
                    'Run Complete Auth Test'
                  )}
                </Button>
                <Button
                  onClick={clearResults}
                  variant="outline"
                  className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                >
                  Clear Results
                </Button>
                <Button
                  onClick={checkCurrentUser}
                  variant="outline"
                  className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh User
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Current User Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current User Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Authentication Status:</span>
              <Badge className={user ? "bg-green-600/20 text-green-400 border-green-600/30" : "bg-gray-600/20 text-gray-400 border-gray-600/30"}>
                {user ? `Authenticated as ${user.email}` : 'Not Authenticated'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Results */}
        {testResults.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{result.test}</span>
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Instructions */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-300">
              <p>This test suite performs the following checks:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Checks current authentication state</li>
                <li>Signs out if currently authenticated</li>
                <li>Creates a new test account</li>
                <li>Signs in with the created account</li>
                <li>Checks if profile was created</li>
                <li>Tests protected API routes</li>
              </ol>
              <p className="text-sm text-gray-400 mt-4">
                You can optionally provide your own test email and password, or let the system generate unique ones.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}