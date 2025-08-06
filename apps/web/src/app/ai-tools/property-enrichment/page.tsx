'use client'

/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI-powered property enrichment page with comprehensive analysis dashboard"
 * @dependencies ["react", "@claimguardian/ui"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context properties
 * @florida-specific true
 */

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { PropertyEnrichmentUI } from '@/components/property/property-enrichment-ui'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Shield, Lightbulb, Database, MapPin } from 'lucide-react'

export default function PropertyEnrichmentPage() {
  // Demo parcel ID - in production would come from URL params or user selection
  const demoParcelId = "03-23-43-00000.0010"

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Property Enrichment
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Get comprehensive AI-powered property analysis combining market data, risk assessment, 
            investment metrics, and strategic insights from the complete Florida 9.6M parcel dataset.
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Market Analysis</h3>
              <p className="text-gray-400 text-sm">
                Comparable sales, price trends, appreciation rates, and market conditions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Risk Assessment</h3>
              <p className="text-gray-400 text-sm">
                Flood, hurricane, fire, crime, environmental, and seismic risk analysis
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Lightbulb className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">AI Insights</h3>
              <p className="text-gray-400 text-sm">
                SWOT analysis, investment recommendations, and strategic action items
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Modules */}
        <Card className="bg-gray-800/30 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analysis Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Market Intelligence</h4>
                <ul className="space-y-1 text-gray-400 text-sm">
                  <li>• Comparable sales analysis</li>
                  <li>• Price per sqft trends</li>
                  <li>• Market appreciation rates</li>
                  <li>• Days on market metrics</li>
                </ul>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Investment Metrics</h4>
                <ul className="space-y-1 text-gray-400 text-sm">
                  <li>• Rental yield estimates</li>
                  <li>• Capitalization rates</li>
                  <li>• Cash-on-cash returns</li>
                  <li>• Renovation ROI analysis</li>
                </ul>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Insurance Analysis</h4>
                <ul className="space-y-1 text-gray-400 text-sm">
                  <li>• Premium estimates</li>
                  <li>• Coverage recommendations</li>
                  <li>• Discount opportunities</li>
                  <li>• Carrier suggestions</li>
                </ul>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Compliance Status</h4>
                <ul className="space-y-1 text-gray-400 text-sm">
                  <li>• Building code compliance</li>
                  <li>• Zoning regulations</li>
                  <li>• Environmental factors</li>
                  <li>• Legal status checks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Property Enrichment Interface */}
        <PropertyEnrichmentUI 
          parcelId={demoParcelId}
          onEnrichmentComplete={(result) => {
            console.log('Enrichment completed:', result)
          }}
        />

        {/* Data Sources & Methodology */}
        <Card className="bg-gray-800/30 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Sources & Methodology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Primary Data Sources</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    Florida Department of Revenue (DOR) - 9.6M parcels
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    County Property Appraiser records
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-yellow-400" />
                    Real estate market data and MLS
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    FEMA flood maps and risk data
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    Hurricane and weather pattern analysis
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-3">AI Analysis Methods</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>• Machine learning risk modeling</li>
                  <li>• Comparative market analysis algorithms</li>
                  <li>• Investment performance prediction</li>
                  <li>• Natural language insight generation</li>
                  <li>• Multi-factor correlation analysis</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
              <Badge variant="secondary">Real-time Analysis</Badge>
              <Badge variant="secondary">67 Counties Covered</Badge>
              <Badge variant="secondary">9.6M Parcel Database</Badge>
              <Badge variant="secondary">AI-Powered Insights</Badge>
              <Badge variant="secondary">Investment Grade Analysis</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}