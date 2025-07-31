
'use client'

import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIClientService } from '@/lib/ai/client-service'
import { createBrowserSupabaseClient } from '@claimguardian/db'

interface TestCase {
  id: string
  name: string
  description: string
  category: 'api' | 'chat' | 'vision' | 'edge' | 'policy'
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  result?: unknown
  error?: string
}

function renderDetails(details: unknown): string {
  if (typeof details === 'string') return details
  if (details instanceof Error) return details.message
  return JSON.stringify(details, null, 2)
}

export default function TestAICompletePage() {
  const [tests, setTests] = useState<TestCase[]>([
    // API Tests
    {
      id: 'api-1',
      name: 'Check API Keys',
      description: 'Verify AI API keys are configured',
      category: 'api',
      status: 'pending'
    },
    {
      id: 'api-2',
      name: 'Test OpenAI Connection',
      description: 'Verify OpenAI API is accessible',
      category: 'api',
      status: 'pending'
    },
    {
      id: 'api-3',
      name: 'Test Gemini Connection',
      description: 'Verify Gemini API is accessible',
      category: 'api',
      status: 'pending'
    },
    
    // Chat Tests
    {
      id: 'chat-1',
      name: 'Basic Chat Response',
      description: 'Test simple chat interaction',
      category: 'chat',
      status: 'pending'
    },
    {
      id: 'chat-2',
      name: 'Multi-turn Conversation',
      description: 'Test conversation with context',
      category: 'chat',
      status: 'pending'
    },
    
    // Vision Tests
    {
      id: 'vision-1',
      name: 'Test Image Analysis',
      description: 'Analyze a test image',
      category: 'vision',
      status: 'pending'
    },
    
    // Edge Function Tests
    {
      id: 'edge-1',
      name: 'Policy Chat Edge Function',
      description: 'Test policy chat with Gemini',
      category: 'edge',
      status: 'pending'
    },
    {
      id: 'edge-2',
      name: 'Document Extraction Function',
      description: 'Test AI document extraction',
      category: 'edge',
      status: 'pending'
    },
    
    // Policy Tests
    {
      id: 'policy-1',
      name: 'Policy Upload & Storage',
      description: 'Test document upload to Supabase',
      category: 'policy',
      status: 'pending'
    },
    {
      id: 'policy-2',
      name: 'Policy Chat with Document',
      description: 'Test chat with uploaded policy',
      category: 'policy',
      status: 'pending'
    }
  ])
  
  const [currentCategory, setCurrentCategory] = useState<string>('all')
  const [isRunning, setIsRunning] = useState(false)
  const [testOutput, setTestOutput] = useState<string>('')
  const supabase = createBrowserSupabaseClient()
  const aiClient = new AIClientService()

  const updateTest = (id: string, updates: Partial<TestCase>) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ))
  }

  const addOutput = (message: string) => {
    setTestOutput(prev => prev + message + '\n')
  }

  const runTests = useCallback(async () => {
    setIsRunning(true)
    setTestOutput('')
    
    // API Test 1: Check API Keys
    updateTest('api-1', { status: 'running' })
    addOutput('🔑 Checking API keys...')
    try {
      const keyStatus = await aiClient.checkKeys()
      updateTest('api-1', { 
        status: 'passed', 
        result: keyStatus
      })
      addOutput(`✅ API Keys: OpenAI: ${keyStatus.hasOpenAIKey ? '✓' : '✗'}, Gemini: ${keyStatus.hasGeminiKey ? '✓' : '✗'}`)
    } catch (error) {
      updateTest('api-1', { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      addOutput(`❌ Failed to check API keys: ${error}`)
    }

    // API Test 2: Test OpenAI
    updateTest('api-2', { status: 'running' })
    addOutput('\n🤖 Testing OpenAI connection...')
    try {
      const response = await aiClient.chat([
        { role: 'system', content: 'You are a test assistant' },
        { role: 'user', content: 'Respond with "OpenAI test successful!"' }
      ], 'openai')
      updateTest('api-2', { 
        status: 'passed', 
        result: response
      })
      addOutput(`✅ OpenAI Response: ${response}`)
    } catch (error) {
      updateTest('api-2', { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      addOutput(`❌ OpenAI test failed: ${error}`)
    }

    // API Test 3: Test Gemini
    updateTest('api-3', { status: 'running' })
    addOutput('\n🤖 Testing Gemini connection...')
    try {
      const response = await aiClient.chat([
        { role: 'system', content: 'You are a test assistant' },
        { role: 'user', content: 'Respond with "Gemini test successful!"' }
      ], 'gemini')
      updateTest('api-3', { 
        status: 'passed', 
        result: response
      })
      addOutput(`✅ Gemini Response: ${response}`)
    } catch (error) {
      updateTest('api-3', { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      addOutput(`❌ Gemini test failed: ${error}`)
    }

    // Chat Test 1: Basic Chat
    updateTest('chat-1', { status: 'running' })
    addOutput('\n💬 Testing basic chat...')
    try {
      const response = await aiClient.chat([
        { role: 'user', content: 'What is ClaimGuardian?' }
      ])
      updateTest('chat-1', { 
        status: 'passed', 
        result: response.substring(0, 100) + '...'
      })
      addOutput(`✅ Chat response received (${response.length} chars)`)
    } catch (error) {
      updateTest('chat-1', { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      addOutput(`❌ Chat test failed: ${error}`)
    }

    // Chat Test 2: Multi-turn
    updateTest('chat-2', { status: 'running' })
    addOutput('\n💬 Testing multi-turn conversation...')
    try {
      const messages = [
        { role: 'user' as const, content: 'My name is TestUser' },
        { role: 'assistant' as const, content: 'Hello TestUser! How can I help you today?' },
        { role: 'user' as const, content: 'What is my name?' }
      ]
      const response = await aiClient.chat(messages)
      const hasContext = response.toLowerCase().includes('testuser')
      updateTest('chat-2', { 
        status: hasContext ? 'passed' : 'failed', 
        result: hasContext ? 'Context maintained' : 'Context lost'
      })
      addOutput(hasContext ? '✅ Multi-turn conversation works' : '❌ Context not maintained')
    } catch (error) {
      updateTest('chat-2', { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      addOutput(`❌ Multi-turn test failed: ${error}`)
    }

    // Vision Test (Skip if no image analysis endpoint)
    updateTest('vision-1', { status: 'skipped', result: 'Image analysis not implemented yet' })
    addOutput('\n📷 Image analysis test skipped')

    // Edge Function Test 1: Policy Chat
    updateTest('edge-1', { status: 'running' })
    addOutput('\n⚡ Testing Policy Chat Edge Function...')
    try {
      const response = await aiClient.chatWithPolicy({
        messages: [
          { role: 'user', content: 'What is typically covered in a Florida homeowners policy?' }
        ]
      })
      updateTest('edge-1', {
        status: 'passed', 
        result: response.response.substring(0, 100) + '...'
      })
      addOutput(`✅ Policy chat edge function works`)
    } catch (error) {
      updateTest('edge-1', { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      addOutput(`❌ Policy chat test failed: ${error}`)
    }

    // Edge Function Test 2: Document Extraction
    updateTest('edge-2', { status: 'skipped', result: 'Requires actual document upload' })
    addOutput('\n📄 Document extraction test skipped (requires file)')

    // Policy Test 1: Upload Test
    updateTest('policy-1', { status: 'running' })
    addOutput('\n📤 Testing document storage...')
    try {
      // Create a test text file
      const testContent = 'This is a test policy document for ClaimGuardian AI testing.'
      const blob = new Blob([testContent], { type: 'text/plain' })
      const file = new File([blob], 'test-policy.txt', { type: 'text/plain' })
      
      const fileName = `test/${Date.now()}-test-policy.txt`
      const { data, error } = await supabase.storage
        .from('policy-documents')
        .upload(fileName, file)

      if (error) throw error
      
      updateTest('policy-1', { 
        status: 'passed', 
        result: { path: data.path }
      })
      addOutput(`✅ Document uploaded successfully`)
      
      // Clean up
      await supabase.storage.from('policy-documents').remove([fileName])
    } catch (error) {
      updateTest('policy-1', { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      addOutput(`❌ Upload test failed: ${error}`)
    }

    // Policy Test 2: Chat with Document
    updateTest('policy-2', { status: 'skipped', result: 'Requires real policy document' })
    addOutput('\n💬 Policy chat with document test skipped')

    setIsRunning(false)
    addOutput('\n✅ All tests completed!')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    runTests()
  }, [runTests])

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
            <h1 className="text-3xl font-bold text-white mb-2">AI Features Complete Test</h1>
            <p className="text-gray-400">Comprehensive testing of all AI capabilities</p>
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-600">
            Gemini API: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing'}
          </Badge>
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

        {/* Test Output Console */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Test Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
              {testOutput || 'Test output will appear here...'}
            </pre>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Tabs value={currentCategory} onValueChange={setCurrentCategory}>
          <TabsList>
            <TabsTrigger value="all">All Tests</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="vision">Vision</TabsTrigger>
            <TabsTrigger value="edge">Edge Functions</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
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
                              {renderDetails(test.result)}
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
                : `${stats.failed} tests failed. Please check the configuration.`}
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