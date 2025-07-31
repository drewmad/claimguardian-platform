'use client'

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TestResult {
  step: string
  success: boolean
  message: string
  details?: unknown
}

export default function TestSignupPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [overallSuccess, setOverallSuccess] = useState<boolean | null>(null)

  const runConsentFlowTest = async () => {
    setLoading(true)
    setResults([])
    setOverallSuccess(null)
    
    try {
      const response = await fetch('/api/test-consent-flow')
      const data = await response.json()
      
      const testResults: TestResult[] = []
      
      // Parse results
      if (data.success) {
        testResults.push({
          step: 'Record Consent',
          success: true,
          message: `Consent token generated: ${data.steps.record_consent.consent_token.substring(0, 16)}...`,
          details: data.steps.record_consent
        })
        
        testResults.push({
          step: 'Validate Consent',
          success: true,
          message: `Consent validated successfully. All required consents: ${data.steps.validate_consent.has_required_consents}`,
          details: data.steps.validate_consent
        })
        
        testResults.push({
          step: 'Link Consent (Test)',
          success: true,
          message: 'Link function exists and was called (expected to fail with test user)',
          details: data.steps.link_consent
        })
        
        testResults.push({
          step: 'Functions Check',
          success: true,
          message: 'All required functions exist in database',
          details: data.functions_check
        })
        
        setOverallSuccess(true)
      } else {
        testResults.push({
          step: data.step || 'Unknown',
          success: false,
          message: data.error || 'Test failed',
          details: data.details
        })
        setOverallSuccess(false)
      }
      
      setResults(testResults)
    } catch (error) {
      setResults([{
        step: 'API Call',
        success: false,
        message: error instanceof Error ? error.message : 'Failed to run test',
        details: error
      }])
      setOverallSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const testRealSignup = () => {
    // Open signup modal
    window.location.href = '/?modal=signup'
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Signup Consent Flow Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-400">
                This page tests the consent tracking functions required for user signup.
              </p>
              
              <div className="flex gap-4">
                <Button
                  onClick={runConsentFlowTest}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    'Run Consent Flow Test'
                  )}
                </Button>
                
                <Button
                  onClick={testRealSignup}
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800"
                >
                  Test Real Signup Modal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                Test Results
                {overallSuccess === true && (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                {overallSuccess === false && (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? 'bg-green-900/20 border-green-800'
                        : 'bg-red-900/20 border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{result.step}</h3>
                        <p className="text-sm text-gray-300 mt-1">{result.message}</p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs text-gray-400 overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {overallSuccess && (
                <div className="mt-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                  <h3 className="font-semibold text-green-400 mb-2">✅ All Tests Passed!</h3>
                  <p className="text-sm text-green-300">
                    The consent tracking infrastructure is working correctly. You can now test the actual signup flow.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">What This Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">1.</span>
                <span><strong>record_signup_consent</strong> - Records user consent before account creation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">2.</span>
                <span><strong>validate_signup_consent</strong> - Validates the consent token is valid</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">3.</span>
                <span><strong>link_consent_to_user</strong> - Links consent to user after signup</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">4.</span>
                <span><strong>update_user_consent_preferences</strong> - Updates consent preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">5.</span>
                <span><strong>track_user_consent</strong> - Tracks consent actions for audit</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}