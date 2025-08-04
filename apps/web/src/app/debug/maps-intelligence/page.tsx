'use client'

import { googleMapsService } from '@/lib/services/google-maps-unified'
import { AlertCircle, CheckCircle2, Clock, MapPin, Satellite, Zap, Wind, Sun, TreePine, Car, Mountain, Eye, Activity, Timer, Layers, CloudRain, Home, Camera, Siren } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createBrowserSupabaseClient } from '@claimguardian/db'

interface TestResult {
  api: string
  status: 'idle' | 'testing' | 'success' | 'error'
  duration?: number
  data?: any
  error?: string
  cached?: boolean
}

const API_TESTS = [
  // Google Maps APIs
  { key: 'address-validation', name: 'Address Validation', icon: MapPin, color: 'blue', category: 'Google Maps' },
  { key: 'aerial-view', name: 'Aerial View (Roof)', icon: Satellite, color: 'purple', category: 'Google Maps' },
  { key: 'weather', name: 'Weather Data', icon: Wind, color: 'cyan', category: 'Google Maps' },
  { key: 'pollen', name: 'Pollen Data', icon: TreePine, color: 'green', category: 'Google Maps' },
  { key: 'distance-matrix', name: 'Distance Matrix', icon: Car, color: 'orange', category: 'Google Maps' },
  { key: 'maps-static', name: 'Static Maps', icon: Layers, color: 'gray', category: 'Google Maps' },
  { key: 'elevation', name: 'Elevation Data', icon: Mountain, color: 'brown', category: 'Google Maps' },
  { key: 'street-view', name: 'Street View', icon: Eye, color: 'indigo', category: 'Google Maps' },
  { key: 'air-quality', name: 'Air Quality', icon: Activity, color: 'red', category: 'Google Maps' },
  { key: 'solar', name: 'Solar Potential', icon: Sun, color: 'yellow', category: 'Google Maps' },
  { key: 'timezone', name: 'Time Zone', icon: Timer, color: 'pink', category: 'Google Maps' },
  
  // Additional Intelligence APIs
  { key: 'noaa-weather', name: 'NOAA Weather Intelligence', icon: CloudRain, color: 'teal', category: 'Weather Intelligence' },
  { key: 'zillow-property', name: 'Zillow Property Intelligence', icon: Home, color: 'emerald', category: 'Property Intelligence' },
  { key: 'satellite-imagery', name: 'Satellite Imagery Analysis', icon: Camera, color: 'violet', category: 'Advanced Intelligence' },
  { key: 'emergency-alerts', name: 'Emergency Alert Monitoring', icon: Siren, color: 'rose', category: 'Advanced Intelligence' }
]

export default function MapsIntelligencePage() {
  const [testLocation, setTestLocation] = useState({
    address: '123 Main St, Miami, FL 33101',
    lat: 25.7617,
    lng: -80.1918
  })
  
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [isRunningAll, setIsRunningAll] = useState(false)
  const [unifiedResults, setUnifiedResults] = useState<any>(null)
  const [supabase] = useState(() => createBrowserSupabaseClient())

  const updateTestResult = (api: string, update: Partial<TestResult>) => {
    setTestResults(prev => ({
      ...prev,
      [api]: { ...prev[api], api, ...update }
    }))
  }

  const runSingleTest = async (apiKey: string) => {
    updateTestResult(apiKey, { status: 'testing' })
    const startTime = Date.now()

    try {
      let result
      
      switch (apiKey) {
        case 'address-validation':
          result = await googleMapsService.validateAddress(testLocation.address)
          break
        case 'aerial-view':
          result = await googleMapsService.analyzeRoofFromAerial(testLocation)
          break
        case 'weather':
          result = await googleMapsService.getWeatherForClaims(testLocation)
          break
        case 'pollen':
          result = await googleMapsService.getPollenData(testLocation)
          break
        case 'distance-matrix':
          // Test with a few sample destinations
          result = await googleMapsService.getDistancesToServices(testLocation, [
            { lat: 25.7907, lng: -80.1300, address: 'Miami Beach' },
            { lat: 25.7359, lng: -80.2693, address: 'Coral Gables' }
          ])
          break
        case 'maps-static':
          result = {
            success: true,
            data: { url: googleMapsService.generateStaticMap(testLocation, { zoom: 15 }) },
            apiUsed: 'maps-static',
            timestamp: new Date().toISOString()
          }
          break
        case 'elevation':
          result = await googleMapsService.getElevationData([testLocation])
          break
        case 'street-view':
          result = {
            success: true,
            data: { url: googleMapsService.generateStreetView(testLocation) },
            apiUsed: 'street-view',
            timestamp: new Date().toISOString()
          }
          break
        case 'air-quality':
          result = await googleMapsService.getAirQuality(testLocation)
          break
        case 'solar':
          result = await googleMapsService.getSolarPotential(testLocation)
          break
        case 'timezone':
          result = await googleMapsService.getTimezone(testLocation)
          break
        case 'noaa-weather':
          // Test NOAA Weather Intelligence Edge Function
          result = await supabase.functions.invoke('noaa-weather-intelligence', {
            body: {
              location: {
                lat: testLocation.lat,
                lng: testLocation.lng,
                address: testLocation.address
              },
              analysisType: 'complete-weather-intel',
              options: {
                includeHourly: true,
                alertSeverity: 'moderate'
              }
            }
          })
          break
        case 'zillow-property':
          // Test Zillow Property Intelligence Edge Function
          result = await supabase.functions.invoke('zillow-property-intelligence', {
            body: {
              location: {
                address: testLocation.address,
                lat: testLocation.lat,
                lng: testLocation.lng
              },
              analysisType: 'complete-property-intel',
              options: {
                radius: 1,
                includeOffMarket: true,
                maxComps: 5,
                includePriceHistory: true,
                includeRentalEstimates: true
              }
            }
          })
          break
        case 'satellite-imagery':
          // Test Satellite Imagery Intelligence Edge Function
          result = await supabase.functions.invoke('satellite-imagery-intelligence', {
            body: {
              location: {
                lat: testLocation.lat,
                lng: testLocation.lng,
                address: testLocation.address
              },
              analysisType: 'complete-satellite-intel',
              options: {
                resolution: 'high',
                includeHistorical: true,
                damageTypes: ['hurricane', 'flood'],
                analysisRadius: 1,
                includeChangeDetection: true
              }
            }
          })
          break
        case 'emergency-alerts':
          // Test Emergency Alert Intelligence Edge Function
          result = await supabase.functions.invoke('emergency-alert-intelligence', {
            body: {
              location: {
                lat: testLocation.lat,
                lng: testLocation.lng,
                address: testLocation.address,
                state: 'FL'
              },
              monitoringType: 'comprehensive-monitoring',
              options: {
                radius: 25,
                severityFilter: 'all',
                alertTypes: ['hurricane', 'tornado', 'flood', 'fire'],
                timeframe: 24,
                includeWatch: true,
                includeAdvisory: true
              }
            }
          })
          break
        default:
          throw new Error(`Unknown API: ${apiKey}`)
      }

      const duration = Date.now() - startTime
      
      // Handle different response formats
      let success, data, error, cached
      
      if (apiKey === 'noaa-weather' || apiKey === 'zillow-property' || apiKey === 'satellite-imagery' || apiKey === 'emergency-alerts') {
        // Supabase function response format
        success = !result.error && result.data?.success !== false
        data = result.data
        error = result.error?.message || result.data?.error
        cached = false
      } else {
        // Google Maps service response format
        success = (result as any).success
        data = (result as any).data
        error = (result as any).error
        cached = (result as any).cached
      }
      
      updateTestResult(apiKey, {
        status: success ? 'success' : 'error',
        duration,
        data,
        error,
        cached
      })

    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult(apiKey, {
        status: 'error',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const runAllTests = async () => {
    setIsRunningAll(true)
    
    // Reset all results
    const resetResults: Record<string, TestResult> = {}
    API_TESTS.forEach(test => {
      resetResults[test.key] = { api: test.key, status: 'idle' }
    })
    setTestResults(resetResults)

    // Run all tests in parallel
    const promises = API_TESTS.map(test => runSingleTest(test.key))
    await Promise.allSettled(promises)
    
    setIsRunningAll(false)
  }

  const runUnifiedIntelligence = async () => {
    setUnifiedResults({ status: 'loading' })
    
    try {
      const result = await googleMapsService.getCompletePropertyIntelligence(testLocation)
      setUnifiedResults(result)
    } catch (error) {
      setUnifiedResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing': return <Clock className="w-4 h-4 animate-spin text-blue-500" />
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'testing': return 'border-blue-500 bg-blue-50'
      case 'success': return 'border-green-500 bg-green-50'
      case 'error': return 'border-red-500 bg-red-50'
      default: return 'border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600/30 to-purple-600/20 backdrop-blur-md rounded-xl border border-white/10">
              <Zap className="h-8 w-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Property Intelligence Testing Hub</h1>
              <p className="text-gray-400">Comprehensive testing for Google Maps APIs, NOAA Weather, Zillow Property Intelligence, Satellite Imagery Analysis, and Emergency Alert Monitoring</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="individual">Individual API Tests</TabsTrigger>
            <TabsTrigger value="unified">Unified Intelligence</TabsTrigger>
            <TabsTrigger value="monitoring">Performance & Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-6">
            {/* Test Configuration */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-300">Address</Label>
                    <Input
                      value={testLocation.address}
                      onChange={(e) => setTestLocation(prev => ({ ...prev, address: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Latitude</Label>
                    <Input
                      type="number"
                      value={testLocation.lat}
                      onChange={(e) => setTestLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Longitude</Label>
                    <Input
                      type="number"
                      value={testLocation.lng}
                      onChange={(e) => setTestLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <Button
                  onClick={runAllTests}
                  disabled={isRunningAll}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isRunningAll ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Running All Tests...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Run All API Tests
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Individual API Tests - Organized by Category */}
            {['Google Maps', 'Weather Intelligence', 'Property Intelligence', 'Advanced Intelligence'].map(category => {
              const categoryTests = API_TESTS.filter(test => test.category === category)
              if (categoryTests.length === 0) return null
              
              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTests.map((test) => {
                      const Icon = test.icon
                      const result = testResults[test.key]
                      
                      return (
                        <Card key={test.key} className={`bg-gray-800 border-gray-700 ${getStatusColor(result?.status)} transition-all`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-white">
                              <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                {test.name}
                              </div>
                              {getStatusIcon(result?.status)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Button
                              onClick={() => runSingleTest(test.key)}
                              disabled={result?.status === 'testing'}
                              size="sm"
                              className="w-full"
                            >
                              {result?.status === 'testing' ? 'Testing...' : 'Test API'}
                            </Button>
                            
                            {result && (
                              <div className="space-y-2 text-xs">
                                {result.duration && (
                                  <div className="text-gray-400">
                                    Duration: {result.duration}ms {result.cached && '(cached)'}
                                  </div>
                                )}
                                
                                {result.status === 'success' && result.data && (
                                  <details className="text-gray-300">
                                    <summary className="cursor-pointer text-green-400">View Response</summary>
                                    <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                  </details>
                                )}
                                
                                {result.status === 'error' && result.error && (
                                  <div className="text-red-400 p-2 bg-red-900/20 rounded">
                                    {result.error}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            
          </TabsContent>

          <TabsContent value="unified" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Complete Property Intelligence</CardTitle>
                <p className="text-gray-400">Test all APIs in one coordinated request for comprehensive property analysis</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={runUnifiedIntelligence}
                  disabled={unifiedResults?.status === 'loading'}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {unifiedResults?.status === 'loading' ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Gathering Intelligence...
                    </>
                  ) : (
                    <>
                      <Satellite className="w-4 h-4 mr-2" />
                      Run Complete Analysis
                    </>
                  )}
                </Button>

                {unifiedResults && unifiedResults.status !== 'loading' && (
                  <div className="space-y-4">
                    {unifiedResults.success ? (
                      <div className="space-y-4">
                        <div className="text-green-400 font-semibold">✅ Complete Intelligence Gathered Successfully</div>
                        
                        {/* Static Map Preview */}
                        {unifiedResults.data?.staticMapUrl && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Property Satellite View:</h4>
                            <img 
                              src={unifiedResults.data.staticMapUrl} 
                              alt="Property satellite view"
                              className="rounded-lg border border-gray-600"
                            />
                          </div>
                        )}

                        {/* Street View Preview */}
                        {unifiedResults.data?.streetViewUrl && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Street View:</h4>
                            <img 
                              src={unifiedResults.data.streetViewUrl} 
                              alt="Property street view"
                              className="rounded-lg border border-gray-600"
                            />
                          </div>
                        )}

                        {/* Intelligence Summary */}
                        <details className="text-gray-300">
                          <summary className="cursor-pointer text-white font-medium">View Complete Intelligence Data</summary>
                          <pre className="mt-2 p-4 bg-gray-900 rounded text-xs overflow-x-auto">
                            {JSON.stringify(unifiedResults.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ) : (
                      <div className="text-red-400 p-4 bg-red-900/20 rounded">
                        ❌ Error: {unifiedResults.error}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cache Stats */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Cache Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-gray-300">
                    <div>Cache Size: {googleMapsService.getCacheStats().size} entries</div>
                    <div>APIs Cached: {googleMapsService.getCacheStats().apis.join(', ')}</div>
                    <Button
                      onClick={() => googleMapsService.clearCache()}
                      size="sm"
                      variant="outline"
                      className="mt-2"
                    >
                      Clear All Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limits */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Rate Limit Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    {Object.entries(googleMapsService.getRateLimitStatus()).map(([api, status]) => (
                      <div key={api} className="flex justify-between text-gray-300">
                        <span>{api}:</span>
                        <span>{status.used} / {status.limit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}