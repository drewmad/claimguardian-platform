/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI-powered parcel intelligence page leveraging 9.6M Florida dataset"
 * @dependencies ["react", "@claimguardian/ui"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context properties
 * @florida-specific true
 */

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ParcelLookup } from '@/components/parcel/parcel-lookup'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, MapPin, TrendingUp, Shield } from 'lucide-react'

export default function ParcelIntelligencePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              Parcel Intelligence
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            AI-powered property analysis using Florida's complete 9.6M parcel dataset.
            Get instant insights on property values, risk factors, and market intelligence.
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Database className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">9.6M Records</h3>
              <p className="text-gray-400 text-sm">Complete Florida parcel database</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <MapPin className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">67 Counties</h3>
              <p className="text-gray-400 text-sm">Statewide coverage</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
              <p className="text-gray-400 text-sm">Automated risk assessment</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Insurance Ready</h3>
              <p className="text-gray-400 text-sm">Coverage optimization</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Parcel Lookup Interface */}
        <ParcelLookup />

        {/* Footer Information */}
        <Card className="bg-gray-800/30 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2">Security Features</h4>
                <ul className="space-y-1 text-gray-400 text-sm">
                  <li>• Row Level Security (RLS) enabled</li>
                  <li>• Comprehensive audit logging</li>
                  <li>• User permission-based access</li>
                  <li>• Real-time access monitoring</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Data Sources</h4>
                <ul className="space-y-1 text-gray-400 text-sm">
                  <li>• Florida Department of Revenue (DOR)</li>
                  <li>• County Property Appraiser data</li>
                  <li>• Updated cadastral information</li>
                  <li>• Real-time processing pipeline</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
              <Badge variant="secondary">Enterprise Security</Badge>
              <Badge variant="secondary">GDPR Compliant</Badge>
              <Badge variant="secondary">Audit Ready</Badge>
              <Badge variant="secondary">Real-time Updates</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
