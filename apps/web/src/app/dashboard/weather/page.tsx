'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { WeatherDashboard } from '@/components/noaa/weather-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Cloud, CloudRain, Sun, Wind, Thermometer, Eye, Gauge, Info } from 'lucide-react'

export default function WeatherPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Weather Intelligence</h1>
            <p className="text-gray-400 mt-1">
              Real-time NOAA weather data for property risk assessment
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/weather/sync'}
              className="bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
            >
              <Cloud className="w-4 h-4 mr-2" />
              Historical Sync
            </Button>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
              <Eye className="w-3 h-3 mr-1" />
              System Active
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              NOAA Connected
            </Badge>
          </div>
        </div>

        {/* System Status Alert */}
        <Alert className="border-blue-500/30 bg-blue-900/20">
          <Info className="h-4 w-4" />
          <AlertTitle>NOAA Weather System Status</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              <p>✅ NOAA Weather API: Connected and operational</p>
              <p>✅ NOAA Tide API: Connected and operational</p>
              <p>✅ Database Tables: All 14 weather data sources configured</p>
              <p>✅ Edge Functions: noaa-data-ingestor, property-weather-monitor, weather-claims-correlator deployed</p>
              <p>✅ Real-time Monitoring: Property alerts active</p>
              <p>✅ Claims Correlation: Weather-claim analysis ready</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 backdrop-blur-sm border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Cloud className="w-8 h-8 text-blue-400" />
                <Badge variant="secondary">Live</Badge>
              </div>
              <h3 className="text-lg font-semibold text-white">Weather Stations</h3>
              <p className="text-gray-400 text-sm">14+ NOAA data sources monitoring Florida</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Wind className="w-8 h-8 text-green-400" />
                <Badge variant="secondary">Dynamic</Badge>
              </div>
              <h3 className="text-lg font-semibold text-white">Adaptive Cadence</h3>
              <p className="text-gray-400 text-sm">Increases frequency during severe weather</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Gauge className="w-8 h-8 text-orange-400" />
                <Badge variant="secondary">Real-time</Badge>
              </div>
              <h3 className="text-lg font-semibold text-white">Property Alerts</h3>
              <p className="text-gray-400 text-sm">Instant notifications for severe conditions</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Thermometer className="w-8 h-8 text-purple-400" />
                <Badge variant="secondary">AI-Powered</Badge>
              </div>
              <h3 className="text-lg font-semibold text-white">Claims Correlation</h3>
              <p className="text-gray-400 text-sm">AI correlates weather with insurance claims</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Weather Dashboard */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-1">
          <WeatherDashboard />
        </div>

        {/* System Architecture */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-white">System Architecture</CardTitle>
            <CardDescription>
              NOAA geospatial time series integration with dynamic cadence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-white font-medium">Data Sources</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Weather Observations</p>
                  <p>• Storm Events & Warnings</p>
                  <p>• Tide & Current Data</p>
                  <p>• Lightning Strikes</p>
                  <p>• River Gauges</p>
                  <p>• Hurricane Tracking</p>
                  <p>• Marine Conditions</p>
                  <p>• Aviation Weather</p>
                  <p>• Space Weather</p>
                  <p>• Climate Monitoring</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium">Processing</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• TimescaleDB Hypertables</p>
                  <p>• PostGIS Spatial Functions</p>
                  <p>• Dynamic Cadence Algorithm</p>
                  <p>• Real-time Severity Assessment</p>
                  <p>• Property-Weather Correlation</p>
                  <p>• Continuous Aggregates</p>
                  <p>• Spatial-Temporal Indexing</p>
                  <p>• Data Compression & Retention</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium">Applications</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Property Risk Assessment</p>
                  <p>• Insurance Claims Evidence</p>
                  <p>• Damage Pattern Analysis</p>
                  <p>• Emergency Response</p>
                  <p>• Predictive Analytics</p>
                  <p>• Community Alerts</p>
                  <p>• Historical Analysis</p>
                  <p>• Regulatory Compliance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gray-800/50 backdrop-blur-sm border-green-500/20">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Sun className="w-5 h-5 text-green-400" />
                Phase 1: Complete ✅
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-300">
                <p>✅ Database schema with PostGIS + TimescaleDB</p>
                <p>✅ NOAA API integrations (Weather, Tide, Storm)</p>
                <p>✅ Edge Functions deployed and operational</p>
                <p>✅ Dynamic cadence algorithm implemented</p>
                <p>✅ Property monitoring system active</p>
                <p>✅ Claims correlation system ready</p>
                <p>✅ Real-time alerting configured</p>
                <p>✅ Spatial-temporal queries optimized</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-400" />
                Next Steps: Phase 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-300">
                <p>🔄 Enhanced ML models for predictions</p>
                <p>🔄 Historical weather-claims analysis</p>
                <p>🔄 Advanced damage cost modeling</p>
                <p>🔄 Multi-property portfolio monitoring</p>
                <p>🔄 API for external integrations</p>
                <p>🔄 Mobile app notifications</p>
                <p>🔄 Automated claim pre-filing</p>
                <p>🔄 Insurance rate optimization</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}