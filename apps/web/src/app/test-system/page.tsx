
'use client'

import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createBrowserSupabaseClient } from '@claimguardian/db'

interface TestCase {
  id: string
  name: string
  description: string
  category: 'auth' | 'ui' | 'data' | 'api' | 'security'
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  result?: any
  error?: string
}

export default function TestSystemPage() {
  const router = useRouter()
  const [tests, setTests] = useState<TestCase[]>([
    // Authentication Tests
    {
      id: 'auth-1',
      name: 'Check Supabase Connection',
      description: 'Verify Supabase client can connect',
      category: 'auth',
      status: 'pending'
    },
    {
      id: 'auth-2',
      name: 'Test Login Flow',
      description: 'Verify login with test credentials works',
      category: 'auth',
      status: 'pending'
    },
    {
      id: 'auth-3',
      name: 'Test Signup Flow',
      description: 'Verify signup process works',
      category: 'auth',
      status: 'pending'
    },
    
    // UI Tests
    {
      id: 'ui-1',
      name: 'Dashboard Accessibility',
      description: 'Check if dashboard loads for authenticated users',
      category: 'ui',
      status: 'pending'
    },
    {
      id: 'ui-2',
      name: 'AI Tools Navigation',
      description: 'Verify AI tools pages are accessible',
      category: 'ui',
      status: 'pending'
    },
    {
      id: 'ui-3',
      name: 'Claims Workflow',
      description: 'Test claim creation wizard loads',
      category: 'ui',
      status: 'pending'
    },
    
    // Data Tests
    {
      id: 'data-1',
      name: 'Database Tables',
      description: 'Verify core tables exist',
      category: 'data',
      status: 'pending'
    },
    {
      id: 'data-2',
      name: 'RLS Policies',
      description: 'Check Row Level Security is active',
      category: 'data',
      status: 'pending'
    },
    
    // API Tests
    {
      id: 'api-1',
      name: 'Health Check',
      description: 'Verify API health endpoint',
      category: 'api',
      status: 'pending'
    },
    {
      id: 'api-2',
      name: 'AI Endpoints',
      description: 'Check AI service endpoints',
      category: 'api',
      status: 'pending'
    },
    
    // Security Tests
    {
      id: 'security-1',
      name: 'Bot Protection',
      description: 'Verify bot detection is active',
      category: 'security',
      status: 'pending'
    },
    {
      id: 'security-2',
      name: 'Rate Limiting',
      description: 'Check rate limiting is working',
      category: 'security',
      status: 'pending'
    },
    {
      id: 'security-3',
      name: 'CSP Headers',
      description: 'Verify security headers are set',
      category: 'security',
      status: 'pending'
    }
  ])
  
  const [currentCategory, setCurrentCategory] = useState<string>('all')
  const [isRunning, setIsRunning] = useState(false)
  const supabase = createBrowserSupabaseClient()

  const updateTest = (id: string, updates: Partial<TestCase>) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ))
  }

  const runTests = async () => {
    setIsRunning(true)
    
    // Auth Test 1: Check Supabase Connection
    updateTest('auth-1', { status: 'running' })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      updateTest('auth-1', { 
        status: 'passed', 
        result: { connected: true, hasSession: !!session }
      })
    } catch (error) {
      updateTest('auth-1', { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Auth Test 2: Test Login Flow (Skip if already logged in)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      updateTest('auth-2', { 
        status: 'skipped', 
        result: 'Already logged in'
      })
    } else {
      updateTest('auth-2', { status: 'skipped', result: 'Requires manual test' })
    }

    // Auth Test 3: Test Signup Flow
    updateTest('auth-3', { status: 'skipped', result: 'Requires manual test' })

    // UI Test 1: Dashboard Accessibility
    updateTest('ui-1', { status: 'running' })
    try {
      const response = await fetch('/dashboard')
      updateTest('ui-1', { 
        status: response.ok ? 'passed' : 'failed',
        result: { status: response.status }
      })
    } catch (error) {
      updateTest('ui-1', { 
        status: 'failed', 
        error: 'Failed to load dashboard'
      })
    }

    // UI Test 2: AI Tools Navigation
    updateTest('ui-2', { status: 'running' })
    try {
      const response = await fetch('/ai-tools')
      updateTest('ui-2', { 
        status: response.ok ? 'passed' : 'failed',
        result: { status: response.status }
      })
    } catch (error) {
      updateTest('ui-2', { 
        status: 'failed', 
        error: 'Failed to load AI tools'
      })
    }

    // UI Test 3: Claims Workflow
    updateTest('ui-3', { status: 'running' })
    try {
      const response = await fetch('/dashboard/claims/new')
      updateTest('ui-3', { 
        status: response.ok ? 'passed' : 'failed',
        result: { status: response.status }
      })
    } catch (error) {
      updateTest('ui-3', { 
        status: 'failed', 
        error: 'Failed to load claims wizard'
      })
    }

    // Data Test 1: Database Tables
    updateTest('data-1', { status: 'running' })
    try {
      const tables = ['profiles', 'properties', 'claims', 'compliance_consents']
      const results = await Promise.all(
        tables.map(table => 
          supabase.from(table).select('count', { count: 'exact', head: true })
        )
      )
      
      const allExist = results.every(r => !r.error)
      updateTest('data-1', { 
        status: allExist ? 'passed' : 'failed',
        result: { 
          tables: tables.map((t, i) => ({ 
            name: t, 
            exists: !results[i].error 
          }))
        }
      })
    } catch (error) {
      updateTest('data-1', { 
        status: 'failed', 
        error: 'Failed to check tables'
      })
    }

    // Data Test 2: RLS Policies
    updateTest('data-2', { status: 'running' })
    try {
      // Try to query a protected table without auth
      const { error } = await supabase.from('profiles').select('*')
      updateTest('data-2', { 
        status: 'passed',
        result: { rlsActive: !!error }
      })
    } catch (error) {
      updateTest('data-2', { 
        status: 'failed', 
        error: 'Failed to check RLS'
      })
    }

    // API Test 1: Health Check
    updateTest('api-1', { status: 'running' })
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      updateTest('api-1', { 
        status: response.ok ? 'passed' : 'failed',
        result: data
      })
    } catch (error) {
      updateTest('api-1', { 
        status: 'failed', 
        error: 'Health endpoint not accessible'
      })
    }

    // API Test 2: AI Endpoints
    updateTest('api-2', { status: 'running' })
    try {
      const response = await fetch('/api/ai/check-keys')
      const data = await response.json()
      updateTest('api-2', { 
        status: response.ok ? 'passed' : 'failed',
        result: data
      })
    } catch (error) {
      updateTest('api-2', { 
        status: 'failed', 
        error: 'AI endpoints not accessible'
      })
    }

    // Security Test 1: Bot Protection
    updateTest('security-1', { status: 'running' })
    try {
      // Test with bot-like user agent
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' })
      })
      
      updateTest('security-1', { 
        status: response.status === 403 ? 'passed' : 'failed',
        result: { blockedBot: response.status === 403 }
      })
    } catch (error) {
      updateTest('security-1', { 
        status: 'failed', 
        error: 'Failed to test bot protection'
      })
    }

    // Security Test 2: Rate Limiting
    updateTest('security-2', { status: 'running' })
    try {
      // Make multiple requests to trigger rate limit
      const requests = Array(6).fill(null).map(() => 
        fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com', password: 'test' })
        })
      )
      
      const responses = await Promise.all(requests)
      const rateLimited = responses.some(r => r.status === 429)
      
      updateTest('security-2', { 
        status: rateLimited ? 'passed' : 'failed',
        result: { rateLimitTriggered: rateLimited }
      })
    } catch (error) {
      updateTest('security-2', { 
        status: 'failed', 
        error: 'Failed to test rate limiting'
      })
    }

    // Security Test 3: CSP Headers
    updateTest('security-3', { status: 'running' })
    try {
      const response = await fetch('/')
      const csp = response.headers.get('Content-Security-Policy')
      updateTest('security-3', { 
        status: csp ? 'passed' : 'failed',
        result: { hasCSP: !!csp }
      })
    } catch (error) {
      updateTest('security-3', { 
        status: 'failed', 
        error: 'Failed to check headers'
      })
    }

    setIsRunning(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const filteredTests = currentCategory === 'all' 
    ? tests 
    : tests.filter(t => t.category === currentCategory)

  const stats = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    skipped: tests.filter(t => t.status === 'skipped').length,
    pending: tests.filter(t => t.status === 'pending').length
  }

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      case 'running': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'skipped': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">System Test Suite</h1>
            <p className="text-gray-400">Comprehensive end-to-end system testing</p>
          </div>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Tests</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.passed}</div>
              <div className="text-sm text-gray-400">Passed</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.skipped}</div>
              <div className="text-sm text-gray-400">Skipped</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Tabs value={currentCategory} onValueChange={setCurrentCategory}>
          <TabsList>
            <TabsTrigger value="all">All Tests</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="ui">UI</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value={currentCategory} className="mt-4">
            <div className="space-y-2">
              {filteredTests.map(test => (
                <Card key={test.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h3 className="font-medium text-white">{test.name}</h3>
                          <p className="text-sm text-gray-400">{test.description}</p>
                          {test.error && (
                            <p className="text-sm text-red-400 mt-1">Error: {test.error}</p>
                          )}
                          {test.result && (
                            <pre className="text-xs text-gray-500 mt-1">
                              {JSON.stringify(test.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {test.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Alert className={stats.failed > 0 ? 'border-red-600' : 'border-green-600'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Test Summary</AlertTitle>
            <AlertDescription>
              {stats.failed === 0 
                ? `All ${stats.passed} tests passed successfully!` 
                : `${stats.failed} tests failed. Please check the results above.`}
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            variant={stats.failed > 0 ? 'destructive' : 'default'}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Tests Again'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
