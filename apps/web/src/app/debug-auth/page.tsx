'use client'

import { AlertCircle, CheckCircle, Clock, Info, Loader2, RefreshCw, Shield, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/auth/supabase-client'

interface DebugInfo {
  timestamp: string
  browserInfo: {
    userAgent: string
    language: string
    cookiesEnabled: boolean
    timezone: string
  }
  authStatus: {
    hasSession: boolean
    sessionDetails?: any
    error?: string
  }
  cookies: {
    name: string
    value: string
    sameSite?: string
  }[]
  localStorage: {
    key: string
    value: string
    size: number
  }[]
  supabaseStatus: {
    connected: boolean
    projectUrl: string
    anonKeyPresent: boolean
  }
  rateLimitEstimate: {
    emailsRemaining: number
    nextEmailReset: string
    attemptsRemaining: number
    nextAttemptReset: string
  }
}

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const supabase = createClient()

  const gatherDebugInfo = async () => {
    setLoading(true)
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Get all cookies
      const cookies = document.cookie.split(';').map(cookie => {
        const [name, value] = cookie.trim().split('=')
        return { name, value: value ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : '' }
      }).filter(c => c.name)

      // Get localStorage items related to auth
      const localStorageItems: { key: string; value: string; size: number }[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          const value = localStorage.getItem(key) || ''
          localStorageItems.push({
            key,
            value: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
            size: value.length
          })
        }
      }

      // Estimate rate limits based on localStorage tracking
      const now = new Date()
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      
      // Check for rate limit tracking in localStorage
      const emailAttempts = parseInt(localStorage.getItem('auth_email_attempts') || '0')
      const lastEmailAttempt = localStorage.getItem('auth_last_email_attempt')
      const loginAttempts = parseInt(localStorage.getItem('auth_login_attempts') || '0')
      const lastLoginAttempt = localStorage.getItem('auth_last_login_attempt')

      let emailsRemaining = 3
      let nextEmailReset = oneHourFromNow.toLocaleTimeString()
      if (lastEmailAttempt) {
        const lastAttemptTime = new Date(lastEmailAttempt)
        const hoursSinceLastAttempt = (now.getTime() - lastAttemptTime.getTime()) / (1000 * 60 * 60)
        if (hoursSinceLastAttempt < 1) {
          emailsRemaining = Math.max(0, 3 - emailAttempts)
          nextEmailReset = new Date(lastAttemptTime.getTime() + 60 * 60 * 1000).toLocaleTimeString()
        }
      }

      let attemptsRemaining = 30
      let nextAttemptReset = oneHourFromNow.toLocaleTimeString()
      if (lastLoginAttempt) {
        const lastAttemptTime = new Date(lastLoginAttempt)
        const hoursSinceLastAttempt = (now.getTime() - lastAttemptTime.getTime()) / (1000 * 60 * 60)
        if (hoursSinceLastAttempt < 1) {
          attemptsRemaining = Math.max(0, 30 - loginAttempts)
          nextAttemptReset = new Date(lastAttemptTime.getTime() + 60 * 60 * 1000).toLocaleTimeString()
        }
      }

      const info: DebugInfo = {
        timestamp: new Date().toISOString(),
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          cookiesEnabled: navigator.cookieEnabled,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        authStatus: {
          hasSession: !!session,
          sessionDetails: session ? {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
            provider: session.user.app_metadata?.provider
          } : undefined,
          error: sessionError?.message
        },
        cookies: cookies,
        localStorage: localStorageItems,
        supabaseStatus: {
          connected: !!supabase,
          projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured',
          anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        },
        rateLimitEstimate: {
          emailsRemaining,
          nextEmailReset,
          attemptsRemaining,
          nextAttemptReset
        }
      }

      setDebugInfo(info)
    } catch (error) {
      console.error('Debug info error:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearAllAuthData = async () => {
    setClearing(true)
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
        if (name) {
          // Clear for all possible paths and domains
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
        }
      })
      
      // Clear localStorage auth items
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Refresh debug info
      await gatherDebugInfo()
      
      // Show success message
      alert('All auth data cleared! You can try signing up again.')
    } catch (error) {
      console.error('Clear error:', error)
      alert('Error clearing auth data: ' + (error as Error).message)
    } finally {
      setClearing(false)
    }
  }

  const trackSignupAttempt = () => {
    const attempts = parseInt(localStorage.getItem('auth_email_attempts') || '0') + 1
    localStorage.setItem('auth_email_attempts', attempts.toString())
    localStorage.setItem('auth_last_email_attempt', new Date().toISOString())
    gatherDebugInfo()
  }

  useEffect(() => {
    gatherDebugInfo()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-500" />
              Auth Debug Dashboard
            </CardTitle>
            <CardDescription className="text-gray-400">
              Advanced debugging information for authentication issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={gatherDebugInfo}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Info
              </Button>
              <Button
                onClick={clearAllAuthData}
                disabled={clearing}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                {clearing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Auth Data
                  </>
                )}
              </Button>
              <Button
                onClick={trackSignupAttempt}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
              >
                Simulate Signup Attempt
              </Button>
            </div>
          </CardContent>
        </Card>

        {debugInfo && (
          <>
            {/* Rate Limit Status */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Rate Limit Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-lg border ${
                    debugInfo.rateLimitEstimate.emailsRemaining > 0 
                      ? 'bg-green-900/20 border-green-800' 
                      : 'bg-red-900/20 border-red-800'
                  }`}>
                    <h3 className="font-semibold text-white mb-2">Email Rate Limit</h3>
                    <p className="text-sm text-gray-300">
                      Emails remaining: <span className="font-mono font-bold">
                        {debugInfo.rateLimitEstimate.emailsRemaining}/3
                      </span>
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      Resets at: <span className="font-mono">
                        {debugInfo.rateLimitEstimate.nextEmailReset}
                      </span>
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${
                    debugInfo.rateLimitEstimate.attemptsRemaining > 0 
                      ? 'bg-green-900/20 border-green-800' 
                      : 'bg-red-900/20 border-red-800'
                  }`}>
                    <h3 className="font-semibold text-white mb-2">Login/Signup Rate Limit</h3>
                    <p className="text-sm text-gray-300">
                      Attempts remaining: <span className="font-mono font-bold">
                        {debugInfo.rateLimitEstimate.attemptsRemaining}/30
                      </span>
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      Resets at: <span className="font-mono">
                        {debugInfo.rateLimitEstimate.nextAttemptReset}
                      </span>
                    </p>
                  </div>
                </div>
                
                {(debugInfo.rateLimitEstimate.emailsRemaining === 0 || 
                  debugInfo.rateLimitEstimate.attemptsRemaining === 0) && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                    <h3 className="font-semibold text-red-400 mb-2">⚠️ Rate Limit Hit</h3>
                    <p className="text-sm text-red-300">
                      You've hit a rate limit. Options:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-red-300 list-disc list-inside">
                      <li>Wait until the reset time shown above</li>
                      <li>Use a different email address</li>
                      <li>Try from a different network/IP</li>
                      <li>Click "Clear All Auth Data" and try again</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auth Status */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  {debugInfo.authStatus.hasSession ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold">Session Active:</span>{' '}
                    <span className={debugInfo.authStatus.hasSession ? 'text-green-400' : 'text-yellow-400'}>
                      {debugInfo.authStatus.hasSession ? 'Yes' : 'No'}
                    </span>
                  </p>
                  {debugInfo.authStatus.sessionDetails && (
                    <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-400 font-mono">
                        User: {debugInfo.authStatus.sessionDetails.email}<br />
                        ID: {debugInfo.authStatus.sessionDetails.userId}<br />
                        Expires: {debugInfo.authStatus.sessionDetails.expiresAt}<br />
                        Provider: {debugInfo.authStatus.sessionDetails.provider}
                      </p>
                    </div>
                  )}
                  {debugInfo.authStatus.error && (
                    <p className="text-sm text-red-400">
                      Error: {debugInfo.authStatus.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supabase Status */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Supabase Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold">Connected:</span>{' '}
                    <span className={debugInfo.supabaseStatus.connected ? 'text-green-400' : 'text-red-400'}>
                      {debugInfo.supabaseStatus.connected ? 'Yes' : 'No'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold">Project URL:</span>{' '}
                    <span className="font-mono text-xs">{debugInfo.supabaseStatus.projectUrl}</span>
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold">Anon Key:</span>{' '}
                    <span className={debugInfo.supabaseStatus.anonKeyPresent ? 'text-green-400' : 'text-red-400'}>
                      {debugInfo.supabaseStatus.anonKeyPresent ? 'Present' : 'Missing'}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Cookies ({debugInfo.cookies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {debugInfo.cookies.length === 0 ? (
                  <p className="text-sm text-gray-400">No cookies found</p>
                ) : (
                  <div className="space-y-2">
                    {debugInfo.cookies
                      .filter(c => c.name.includes('sb-') || c.name.includes('auth'))
                      .map((cookie, index) => (
                        <div key={index} className="p-2 bg-gray-800 rounded text-xs font-mono">
                          <span className="text-blue-400">{cookie.name}:</span>{' '}
                          <span className="text-gray-400">{cookie.value}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LocalStorage */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  LocalStorage Auth Items ({debugInfo.localStorage.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {debugInfo.localStorage.length === 0 ? (
                  <p className="text-sm text-gray-400">No auth items in localStorage</p>
                ) : (
                  <div className="space-y-2">
                    {debugInfo.localStorage.map((item, index) => (
                      <div key={index} className="p-2 bg-gray-800 rounded">
                        <p className="text-xs font-mono text-blue-400">{item.key}</p>
                        <p className="text-xs font-mono text-gray-400 mt-1">
                          {item.value} ({item.size} bytes)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Browser Info */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">Browser Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="font-semibold">Cookies Enabled:</span>{' '}
                    <span className={debugInfo.browserInfo.cookiesEnabled ? 'text-green-400' : 'text-red-400'}>
                      {debugInfo.browserInfo.cookiesEnabled ? 'Yes' : 'No'}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">Language:</span> {debugInfo.browserInfo.language}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">Timezone:</span> {debugInfo.browserInfo.timezone}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">User Agent:</span>
                    <span className="block mt-1 text-xs font-mono text-gray-400">
                      {debugInfo.browserInfo.userAgent}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Debug Timestamp */}
            <div className="text-center text-sm text-gray-500">
              Debug info generated at: {new Date(debugInfo.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}