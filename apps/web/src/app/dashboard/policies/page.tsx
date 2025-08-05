/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { Button } from '@claimguardian/ui'
import { format } from 'date-fns'
import { 
  FileText, Upload, Shield, DollarSign, 
  AlertCircle, Plus, Eye, Download,
  Home, Droplets, Wind, AlertTriangle
} from 'lucide-react'
import dynamic from 'next/dynamic'
import React, { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


const PolicyUpload = dynamic(
  () => import('@/components/policy/policy-upload').then(mod => ({ default: mod.PolicyUpload })),
  { 
    ssr: false,
    loading: () => <div className="text-gray-400">Loading upload component...</div>
  }
)
import { usePolicyData, formatCoverage, formatDeductible } from '@/hooks/use-policy-data'

function PoliciesContent() {
  const [showUpload, setShowUpload] = useState(false)
  const { policies, activePolicy, refetch } = usePolicyData(selectedPropertyId)

  const getCoverageIcon = (type: string) => {
    if (type.toLowerCase().includes('flood')) return <Droplets className="w-4 h-4" />
    if (type.toLowerCase().includes('hurricane') || type.toLowerCase().includes('wind')) return <Wind className="w-4 h-4" />
    if (type.toLowerCase().includes('sinkhole')) return <AlertTriangle className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Insurance Policies</h1>
              <p className="text-gray-400">Manage and review your property insurance coverage</p>
            </div>
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Policy
            </Button>
          </div>

          {/* Property Selector */}
          {properties.length > 1 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Select Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {properties.map(property => (
                    <button
                      key={property.id}
                      onClick={() => setSelectedPropertyId(property.id)}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedPropertyId === property.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-white'
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Home className="w-5 h-5 mb-2" />
                      <p className="font-medium">{property.name}</p>
                      <p className="text-sm opacity-75">
                        {property.address?.street || 'No address'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Policy Overview */}
          {activePolicy ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Active Policy Coverage
                  </CardTitle>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Policy Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Insurance Carrier</p>
                    <p className="text-xl font-semibold text-white">{activePolicy.carrier_name}</p>
                    <p className="text-sm text-gray-400 mt-1">Policy #{activePolicy.policy_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Policy Period</p>
                    <p className="text-white">
                      {activePolicy.effective_date && format(new Date(activePolicy.effective_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-white">
                      to {activePolicy.expiration_date && format(new Date(activePolicy.expiration_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Policy Type</p>
                    <p className="text-xl font-semibold text-white">{activePolicy.policy_type || 'HO3'}</p>
                  </div>
                </div>

                {/* Coverage Limits */}
                <div>
                  <h3 className="text-white font-medium mb-4">Coverage Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Home className="w-4 h-4" />
                        <span className="text-sm">Dwelling (Coverage A)</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formatCoverage(activePolicy.dwelling_coverage)}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm">Personal Property</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formatCoverage(activePolicy.personal_property_coverage)}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Liability</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formatCoverage(activePolicy.liability_coverage)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deductibles */}
                <div>
                  <h3 className="text-white font-medium mb-4">Deductibles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">All Other Perils</p>
                      <p className="text-xl font-semibold text-white">
                        {formatDeductible(activePolicy.standard_deductible)}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Hurricane/Wind</p>
                      <p className="text-xl font-semibold text-white">
                        {formatDeductible(activePolicy.hurricane_deductible)}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Flood</p>
                      <p className="text-xl font-semibold text-white">
                        {activePolicy.flood_deductible 
                          ? formatDeductible(activePolicy.flood_deductible)
                          : 'Not Covered'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Special Coverages */}
                {activePolicy.special_coverages && activePolicy.special_coverages.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-4">Special Coverages</h3>
                    <div className="space-y-2">
                      {activePolicy.special_coverages.map((coverage: { type: string; limit?: number }, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            {getCoverageIcon(coverage.type)}
                            <span className="text-white">{coverage.type}</span>
                          </div>
                          <span className="text-gray-300">
                            {coverage.limit && `$${coverage.limit.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button variant="secondary" className="border-gray-600 text-gray-300">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Policy
                  </Button>
                  <Button variant="secondary" className="border-gray-600 text-gray-300">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Active Policy Found</h3>
                <p className="text-gray-400 mb-6">
                  Upload your insurance policy to track coverage and analyze claims
                </p>
                <Button
                  onClick={() => setShowUpload(true)}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Policy
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Policy History */}
          {policies.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Policy History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {policies.map(policy => (
                    <div 
                      key={policy.id}
                      className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">{policy.carrier_name}</p>
                          <p className="text-sm text-gray-400">
                            Policy #{policy.policy_number} • Uploaded {format(new Date(policy.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {policy.id === activePolicy?.id ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Modal */}
          {showUpload && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Upload Insurance Policy</h2>
                    <button
                      onClick={() => setShowUpload(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <PolicyUpload
                    propertyId={selectedPropertyId}
                    onUploadComplete={() => {
                      setShowUpload(false)
                      refetch()
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PoliciesPage() {
  return (
    <ProtectedRoute>
      <PoliciesContent />
    </ProtectedRoute>
  )
}