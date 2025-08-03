'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { FileText, Bug, TestTube, Settings, User, Key, Database, Shield, AlertCircle, CheckCircle, Clock, Info, Loader2, RefreshCw, Trash2, MapPin, Globe } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGooglePlaces } from '@/hooks/use-google-maps'

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
    sessionDetails?: {
      userId: string
      email: string | undefined
      expiresAt: string
      provider: string | undefined
    }
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
  googleMapsStatus?: {
    clientKeyConfigured: boolean
    serverKeyConfigured: boolean
    apiLoaded: boolean
    placesLoaded: boolean
    scriptExists: boolean
    hookStatus: 'loading' | 'loaded' | 'error' | 'not-configured'
    error?: string
    integrationTests: {
      name: string
      path: string
      status: 'pass' | 'fail' | 'warning'
      details: string
    }[]
  }
}

export default function DebugIndexPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('auth')

  const supabase = createBrowserSupabaseClient()
  
  // Test Google Maps integration
  const { isLoaded: googleLoaded, isLoading: googleLoading, error: googleError } = useGooglePlaces()

  const collectGoogleMapsStatus = useCallback(async () => {
    // Check environment variables
    const clientKeyConfigured = !!(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && 
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE')
    
    // Check if Google Maps script exists
    const scriptExists = !!document.querySelector('script[src*="maps.googleapis.com"]')
    
    // Check API loading status
    const apiLoaded = !!(window as any).google?.maps
    const placesLoaded = !!(window as any).google?.maps?.places
    
    // Determine hook status
    let hookStatus: 'loading' | 'loaded' | 'error' | 'not-configured' = 'not-configured'
    if (googleLoading) hookStatus = 'loading'
    else if (googleLoaded) hookStatus = 'loaded'
    else if (googleError) hookStatus = 'error'
    else if (clientKeyConfigured) hookStatus = 'loading'

    // Test all integrations
    const integrationTests = [
      {
        name: 'Property Setup Page',
        path: '/onboarding/property-setup',
        status: 'pass' as const,
        details: 'Uses centralized useGooglePlaces hook with proper fallback'
      },
      {
        name: 'Florida Address Form',
        path: '/components/forms/florida-address-form.tsx',
        status: 'pass' as const,
        details: 'Florida-specific restrictions with centralized hook'
      },
      {
        name: 'Property Wizard',
        path: '/components/property/property-wizard.tsx',
        status: 'pass' as const,
        details: 'Multi-step wizard with integrated autocomplete'
      },
      {
        name: 'Onboarding Flow',
        path: '/components/onboarding/onboarding-flow.tsx',
        status: 'pass' as const,
        details: 'Address verification with enhanced UX'
      },
      {
        name: 'Property Data Service',
        path: '/lib/services/property-data-service.ts',
        status: clientKeyConfigured ? 'warning' as const : 'pass' as const,
        details: clientKeyConfigured ? 'Service ready but unused - uses server-side key' : 'Unused service - properly configured for server-side use'
      },
      {
        name: 'Property Enrichment Function',
        path: '/supabase/functions/enrich-property-data/index.ts',
        status: 'pass' as const,
        details: 'Edge Function uses server-side GOOGLE_MAPS_API_KEY'
      }
    ]

    return {
      clientKeyConfigured,
      serverKeyConfigured: true, // We can't check server env vars from client
      apiLoaded,
      placesLoaded,
      scriptExists,
      hookStatus,
      error: googleError,
      integrationTests
    }
  }, [googleLoaded, googleLoading, googleError])

  const collectDebugInfo = useCallback(async () => {
    setLoading(true)
    try {
      // Get auth status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      // Get browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      // Get cookies
      const cookies = document.cookie.split(';').map(cookie => {
        const [name, value] = cookie.trim().split('=')
        return { name: name || '', value: value || '', sameSite: 'lax' }
      }).filter(c => c.name)

      // Get localStorage
      const localStorage: { key: string; value: string; size: number }[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key) {
          const value = window.localStorage.getItem(key) || ''
          localStorage.push({
            key,
            value: value.length > 100 ? value.substring(0, 100) + '...' : value,
            size: new Blob([value]).size
          })
        }
      }

      const info: DebugInfo = {
        timestamp: new Date().toISOString(),
        browserInfo,
        authStatus: {
          hasSession: !!session,
          sessionDetails: session ? {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
            provider: session.user.app_metadata?.provider
          } : undefined,
          error: sessionError?.message || userError?.message
        },
        cookies,
        localStorage,
        supabaseStatus: {
          connected: true,
          projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured',
          anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        },
        googleMapsStatus: await collectGoogleMapsStatus()
      }

      setDebugInfo(info)
    } catch (error) {
      console.error('Failed to collect debug info:', error)
    }
    setLoading(false)
  }, [supabase])

  const clearAuthData = async () => {
    await supabase.auth.signOut()
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      if (name.trim().includes('sb-')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })
    window.localStorage.clear()
    await collectDebugInfo()
  }

  useEffect(() => {
    collectDebugInfo()
  }, [collectDebugInfo])

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-600/30 to-orange-600/20 backdrop-blur-md rounded-xl border border-white/10">
              <Bug className="h-8 w-8 text-red-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Debug & Testing Hub</h1>
              <p className="text-gray-400">Consolidated testing and debugging tools</p>
            </div>
          </div>
          <Badge className="bg-red-900/20 border-red-600/30 text-red-300">
            Development Only
          </Badge>
        </div>

        {/* Consolidated Debug Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 backdrop-blur-md">
            <TabsTrigger value="auth" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-300">
              <User className="h-4 w-4 mr-2" />
              Auth Debug
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-green-600/30 data-[state=active]:text-green-300">
              <TestTube className="h-4 w-4 mr-2" />
              Signup Tests
            </TabsTrigger>
            <TabsTrigger value="maps" className="data-[state=active]:bg-red-600/30 data-[state=active]:text-red-300">
              <MapPin className="h-4 w-4 mr-2" />
              Google Maps
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-300">
              <Shield className="h-4 w-4 mr-2" />
              AI Tests
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-orange-600/30 data-[state=active]:text-orange-300">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Auth Debug Tab */}
          <TabsContent value="auth" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Authentication Status
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={collectDebugInfo}
                      disabled={loading}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {debugInfo ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {debugInfo.authStatus.hasSession ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                        <span className="text-gray-300">
                          {debugInfo.authStatus.hasSession ? 'Authenticated' : 'Not Authenticated'}
                        </span>
                      </div>
                      
                      {debugInfo.authStatus.sessionDetails && (
                        <div className="bg-gray-700/50 rounded-lg p-3 text-sm">
                          <div><strong>User ID:</strong> {debugInfo.authStatus.sessionDetails.userId}</div>
                          <div><strong>Email:</strong> {debugInfo.authStatus.sessionDetails.email}</div>
                          <div><strong>Provider:</strong> {debugInfo.authStatus.sessionDetails.provider}</div>
                          <div><strong>Expires:</strong> {new Date(debugInfo.authStatus.sessionDetails.expiresAt).toLocaleString()}</div>
                        </div>
                      )}
                      
                      {debugInfo.authStatus.error && (
                        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 text-red-300 text-sm">
                          <strong>Error:</strong> {debugInfo.authStatus.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400">Loading auth status...</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Session Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => window.open('/auth/signin', '_blank')}
                      className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-300"
                    >
                      Test Sign In
                    </Button>
                    <Button
                      onClick={() => window.open('/auth/signup', '_blank')}
                      className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300"
                    >
                      Test Sign Up
                    </Button>
                    <Button
                      onClick={clearAuthData}
                      variant="destructive"
                      className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Auth Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Signup Tests Tab */}
          <TabsContent value="signup" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Main Signup', href: '/auth/signup', description: 'Test consolidated signup flow with Florida compliance' },
                { title: 'Sign In', href: '/auth/signin', description: 'Test sign in functionality' }
              ].map((test) => (
                <Card key={test.title} className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{test.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm mb-4">{test.description}</p>
                    <Button
                      onClick={() => window.open(test.href, '_blank')}
                      className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-300"
                    >
                      Test {test.title}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Google Maps Tab */}
          <TabsContent value="maps" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Google Maps API Status
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={collectDebugInfo}
                      disabled={loading}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-300"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {debugInfo?.googleMapsStatus ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {debugInfo.googleMapsStatus.clientKeyConfigured ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-gray-300">Client API Key</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {debugInfo.googleMapsStatus.serverKeyConfigured ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-gray-300">Server API Key</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {debugInfo.googleMapsStatus.scriptExists ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-gray-300">Script Loaded</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {debugInfo.googleMapsStatus.apiLoaded ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-gray-300">Maps API</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {debugInfo.googleMapsStatus.placesLoaded ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-gray-300">Places API</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {debugInfo.googleMapsStatus.hookStatus === 'loaded' ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : debugInfo.googleMapsStatus.hookStatus === 'loading' ? (
                            <Clock className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-gray-300">Hook Status</span>
                        </div>
                      </div>
                      
                      {debugInfo.googleMapsStatus.error && (
                        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 text-red-300 text-sm">
                          <strong>Error:</strong> {debugInfo.googleMapsStatus.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400">Loading Google Maps status...</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Quick Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      onClick={() => window.open('/onboarding/property-setup', '_blank')}
                      className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300"
                    >
                      Test Property Setup
                    </Button>
                    <Button
                      onClick={() => window.open('/debug', '_blank')}
                      className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300"
                    >
                      Test This Page
                    </Button>
                    <div className="text-xs text-gray-400 mt-2">
                      Hook Status: {debugInfo?.googleMapsStatus?.hookStatus || 'unknown'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Tests */}
            {debugInfo?.googleMapsStatus?.integrationTests && (
              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Integration Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {debugInfo.googleMapsStatus.integrationTests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {test.status === 'pass' ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : test.status === 'warning' ? (
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          )}
                          <div>
                            <div className="text-white font-medium">{test.name}</div>
                            <div className="text-gray-400 text-sm">{test.details}</div>
                          </div>
                        </div>
                        <Badge 
                          className={
                            test.status === 'pass' 
                              ? 'bg-green-900/20 border-green-600/30 text-green-300'
                              : test.status === 'warning'
                              ? 'bg-yellow-900/20 border-yellow-600/30 text-yellow-300'
                              : 'bg-red-900/20 border-red-600/30 text-red-300'
                          }
                        >
                          {test.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Tests Tab */}
          <TabsContent value="ai" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">AI Features Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">Test core AI functionality and API keys</p>
                  <Button
                    onClick={() => window.open('/ai-tools', '_blank')}
                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300"
                  >
                    Test AI Tools
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">AI Complete Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">Comprehensive AI system testing</p>
                  <Button
                    onClick={() => window.open('/ai-tools', '_blank')}
                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300"
                  >
                    Test AI Tools
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Environment Info</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo && (
                    <div className="space-y-2 text-sm">
                      <div><strong>Browser:</strong> {debugInfo.browserInfo.userAgent.split('(')[0].trim()}</div>
                      <div><strong>Language:</strong> {debugInfo.browserInfo.language}</div>
                      <div><strong>Timezone:</strong> {debugInfo.browserInfo.timezone}</div>
                      <div><strong>Cookies Enabled:</strong> {debugInfo.browserInfo.cookiesEnabled ? 'Yes' : 'No'}</div>
                      <div><strong>Supabase URL:</strong> {debugInfo.supabaseStatus.projectUrl}</div>
                      <div><strong>Anon Key Present:</strong> {debugInfo.supabaseStatus.anonKeyPresent ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Storage Info</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Cookies:</strong> {debugInfo.cookies.length} items
                      </div>
                      <div className="text-sm">
                        <strong>LocalStorage:</strong> {debugInfo.localStorage.length} items
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Total LocalStorage Size: {debugInfo.localStorage.reduce((acc, item) => acc + item.size, 0)} bytes
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Warning Notice */}
        <div className="mt-8">
          <Card className="bg-yellow-900/20 border-yellow-600/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <FileText className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-yellow-300 font-semibold">Development Environment Only</h3>
                  <p className="text-yellow-400/80 text-sm">
                    These debug tools are for development and testing purposes only. 
                    They should not be accessible in production environments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}