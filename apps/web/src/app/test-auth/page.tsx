'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, XCircle, User, Mail, Key, Database, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserSupabaseClient()
  
  const checkAuth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      setSession(currentSession)
      
      // Get user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      setUser(currentUser)
      
      // Try to get profile if user exists
      if (currentUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile fetch warning:', profileError)
        }
        setProfile(profileData)
      }
    } catch (err) {
      console.error('Auth check error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    checkAuth()
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event)
      checkAuth()
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      setError(error.message)
    } else {
      setUser(null)
      setSession(null)
      setProfile(null)
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Authentication Test Page</h1>
          </div>
          <p className="text-gray-400">Verify that authentication is working correctly</p>
        </div>
        
        {/* Status Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Authentication Status</CardTitle>
              <Button 
                onClick={checkAuth} 
                variant="outline" 
                size="sm"
                className="bg-gray-700 hover:bg-gray-600 border-gray-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-400">Checking authentication...</p>
            ) : error ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400">Error: {error}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Auth Status */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-gray-400" />
                    <span className="text-white">Authentication</span>
                  </div>
                  <Badge className={user ? "bg-green-600/20 text-green-400 border-green-600/30" : "bg-red-600/20 text-red-400 border-red-600/30"}>
                    {user ? 'Authenticated' : 'Not Authenticated'}
                  </Badge>
                </div>
                
                {/* Session Status */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-gray-400" />
                    <span className="text-white">Session</span>
                  </div>
                  <Badge className={session ? "bg-green-600/20 text-green-400 border-green-600/30" : "bg-gray-600/20 text-gray-400 border-gray-600/30"}>
                    {session ? 'Active' : 'No Session'}
                  </Badge>
                </div>
                
                {/* User Details */}
                {user && (
                  <div className="space-y-3 pt-3 border-t border-gray-700">
                    <h3 className="text-white font-medium">User Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">ID:</span>
                        <span className="text-sm text-white font-mono">{user.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Email:</span>
                        <span className="text-sm text-white">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Email Verified:</span>
                        <Badge className={user.email_confirmed_at ? "bg-green-600/20 text-green-400 border-green-600/30" : "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"}>
                          {user.email_confirmed_at ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Profile Details */}
                {profile && (
                  <div className="space-y-3 pt-3 border-t border-gray-700">
                    <h3 className="text-white font-medium">Profile Details</h3>
                    <div className="bg-gray-900 rounded-lg p-3">
                      <pre className="text-xs text-gray-300 overflow-auto">
                        {JSON.stringify(profile, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Actions */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleSignOut}
                    variant="outline"
                    className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button 
                      variant="outline"
                      className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Debug Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Supabase URL:</p>
                <code className="text-xs text-green-400 bg-gray-900 px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set'}
                </code>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Time:</p>
                <code className="text-xs text-blue-400 bg-gray-900 px-2 py-1 rounded">
                  {new Date().toISOString()}
                </code>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Session Token (first 20 chars):</p>
                <code className="text-xs text-yellow-400 bg-gray-900 px-2 py-1 rounded">
                  {session?.access_token?.substring(0, 20) || 'No Token'}...
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}