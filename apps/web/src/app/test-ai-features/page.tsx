'use client'

import { AlertCircle, Camera, CheckCircle, FileText, Loader2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AIClientService } from '@/lib/ai/client-service'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  details?: {
    hasOpenAIKey?: boolean
    hasGeminiKey?: boolean
    hasAnyKey?: boolean
  } | Error | unknown
}

export default function TestAIFeaturesPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Check API Keys', status: 'pending' },
    { name: 'Test Damage Analyzer Page Load', status: 'pending' },
    { name: 'Test Policy Chat Page Load', status: 'pending' },
    { name: 'Test AI Client Service', status: 'pending' },
    { name: 'Test Camera Permissions', status: 'pending' },
  ])
  
  const [currentTest, setCurrentTest] = useState(0)
  const [allTestsComplete, setAllTestsComplete] = useState(false)
  const aiClient = new AIClientService()

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ))
  }

  const runTests = useCallback(async () => {
    // Test 1: Check API Keys
    updateTest(0, { status: 'running' })
    try {
      const keyStatus = await aiClient.checkKeys()
      updateTest(0, { 
        status: 'success', 
        message: `OpenAI: ${keyStatus.hasOpenAIKey ? '✓' : '✗'}, Gemini: ${keyStatus.hasGeminiKey ? '✓' : '✗'}`,
        details: keyStatus
      })
    } catch (error) {
      updateTest(0, { 
        status: 'error', 
        message: 'Failed to check API keys',
        details: error
      })
    }

    // Test 2: Test Damage Analyzer Page
    updateTest(1, { status: 'running' })
    try {
      const response = await fetch('/ai-augmented/damage-analyzer')
      if (response.ok) {
        updateTest(1, { 
          status: 'success', 
          message: 'Page loads successfully'
        })
      } else {
        updateTest(1, { 
          status: 'error', 
          message: `Page returned status ${response.status}`
        })
      }
    } catch (error) {
      updateTest(1, { 
        status: 'error', 
        message: 'Failed to load damage analyzer',
        details: error
      })
    }

    // Test 3: Test Policy Chat Page
    updateTest(2, { status: 'running' })
    try {
      const response = await fetch('/ai-augmented/policy-chat')
      if (response.ok) {
        updateTest(2, { 
          status: 'success', 
          message: 'Page loads successfully'
        })
      } else {
        updateTest(2, { 
          status: 'error', 
          message: `Page returned status ${response.status}`
        })
      }
    } catch (error) {
      updateTest(2, { 
        status: 'error', 
        message: 'Failed to load policy chat',
        details: error
      })
    }

    // Test 4: Test AI Client Service
    updateTest(3, { status: 'running' })
    try {
      // Try a simple chat request
      const keyStatus = tests[0].details as { hasAnyKey?: boolean; hasOpenAI?: boolean }
      if (keyStatus?.hasAnyKey) {
        const response = await aiClient.chat([
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello, AI test successful!"' }
        ], keyStatus.hasOpenAIKey ? 'openai' : 'gemini')
        
        updateTest(3, { 
          status: 'success', 
          message: 'AI service is working',
          details: response
        })
      } else {
        updateTest(3, { 
          status: 'error', 
          message: 'No API keys configured'
        })
      }
    } catch (error) {
      updateTest(3, { 
        status: 'error', 
        message: 'AI service test failed',
        details: error
      })
    }

    // Test 5: Test Camera Permissions
    updateTest(4, { status: 'running' })
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        // Just check if the API exists, don't actually request permission
        updateTest(4, { 
          status: 'success', 
          message: 'Camera API available'
        })
      } else {
        updateTest(4, { 
          status: 'error', 
          message: 'Camera API not available'
        })
      }
    } catch (error) {
      updateTest(4, { 
        status: 'error', 
        message: 'Failed to check camera',
        details: error
      })
    }

    setAllTestsComplete(true)
  }, [updateTest, aiClient, tests])

  useEffect(() => {
    runTests()
  }, [runTests])

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length
  const progress = (successCount + errorCount) / tests.length * 100

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Features Test Suite</h1>
          <p className="text-gray-400">Testing AI features and dependencies</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Test Progress</CardTitle>
            <CardDescription>
              {successCount} passed, {errorCount} failed, {tests.filter(t => t.status === 'pending').length} pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {tests.map((test, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {test.status === 'pending' && <AlertCircle className="w-5 h-5 text-gray-500" />}
                      {test.status === 'running' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                      {test.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {test.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{test.name}</h3>
                      {test.message && (
                        <p className="text-sm text-gray-400 mt-1">{test.message}</p>
                      )}
                      {test.details && test.status === 'error' && (
                        <pre className="text-xs text-red-400 mt-2 p-2 bg-gray-900 rounded overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {allTestsComplete && (
          <Alert className={errorCount > 0 ? 'border-red-600' : 'border-green-600'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Test Complete</AlertTitle>
            <AlertDescription>
              {errorCount === 0 
                ? 'All tests passed! AI features are ready to use.' 
                : `${errorCount} test(s) failed. Please check the configuration.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button onClick={runTests} disabled={!allTestsComplete}>
            Run Tests Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/ai-augmented/damage-analyzer'}>
            <Camera className="w-4 h-4 mr-2" />
            Go to Damage Analyzer
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/ai-augmented/policy-chat'}>
            <FileText className="w-4 h-4 mr-2" />
            Go to Policy Chat
          </Button>
        </div>
      </div>
    </div>
  )
}