/**
 * @fileMetadata
 * @owner frontend-team
 * @purpose "Detailed policy view page with comprehensive coverage information"
 * @dependencies ["react", "next", "lucide-react"]
 * @status stable
 */
'use client'

import { ArrowLeft, Shield, DollarSign, Calendar, User, Phone, Building, FileText, AlertTriangle, ChevronDown, Edit, Loader2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface PolicyDetails {
  id: string
  carrier: string
  policyNumber: string
  policyType: string
  effectiveDate: string
  expirationDate: string
  propertyAddress: string
  coverages: {
    dwelling: number
    otherStructures: number
    personalProperty: number
    lossOfUse: number
    personalLiability: number
    medicalPayments: number
  }
  deductibles: {
    standard: number
    windHurricane?: number
    windHurricanePercent?: number
  }
  premium: {
    annual: number
    paymentMethod: string
  }
  contacts: {
    agentName?: string
    agentPhone?: string
    claimsPhone?: string
  }
  mortgage: {
    lenderName?: string
    loanNumber?: string
  }
  riders: string[]
}

function PolicyDetailsContent() {
  const router = useRouter()
  const params = useParams()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [policy, setPolicy] = useState<PolicyDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // TODO: Fetch policy details from database
  useEffect(() => {
    // This would be replaced with actual API call
    setIsLoading(false)
  }, [params.id])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gray-900 min-h-screen">
          <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!policy) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gray-900 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/dashboard/insurance')}
              className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Insurance
            </button>
            
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Policy Not Found</h3>
                <p className="text-gray-400">This policy could not be found or you don't have access to view it.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const totalCoverage = Object.values(policy.coverages).reduce((sum, val) => sum + val, 0)
  const coveredAmount = policy.coverages.personalProperty
  const coveragePercent = (coveredAmount / totalCoverage) * 100

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/insurance')}
              className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Asset
            </button>
            
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">{policy.carrier}</h1>
                      <p className="text-gray-400">POLICY #{policy.policyNumber}</p>
                    </div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Policy
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coverages */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Coverages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">A: Dwelling</span>
                    <span className="text-white font-semibold">{formatCurrency(policy.coverages.dwelling)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">B: Other Structures</span>
                    <span className="text-white font-semibold">{formatCurrency(policy.coverages.otherStructures)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">C: Personal Property</span>
                    <span className="text-white font-semibold">{formatCurrency(policy.coverages.personalProperty)}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Covered: {formatCurrency(coveredAmount)}</span>
                      <span>Total Value: {formatCurrency(10500)}</span>
                    </div>
                    <Progress value={coveragePercent} className="h-2 bg-gray-700">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${coveragePercent}%` }} />
                    </Progress>
                  </div>
                  
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">D: Loss of Use</span>
                    <span className="text-white font-semibold">{formatCurrency(policy.coverages.lossOfUse)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Personal Liability</span>
                    <span className="text-white font-semibold">{formatCurrency(policy.coverages.personalLiability)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Medical Payments</span>
                    <span className="text-white font-semibold">{formatCurrency(policy.coverages.medicalPayments)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Info */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Key Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Policy Type</p>
                    <p className="text-white font-medium">{policy.policyType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Effective Date</p>
                    <p className="text-white font-medium">{new Date(policy.effectiveDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Expiration Date</p>
                    <p className="text-white font-medium">{new Date(policy.expirationDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Premium
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Annual Premium</span>
                      <span className="text-white font-semibold">{formatCurrency(policy.premium.annual)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Payment Method</span>
                      <span className="text-white">{policy.premium.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deductibles */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  Deductibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Standard Deductible</span>
                  <span className="text-white font-semibold">{formatCurrency(policy.deductibles.standard)}</span>
                </div>
                {policy.deductibles.windHurricane && (
                  <div className="flex justify-between">
                    <span className="text-gray-300 flex items-center gap-2">
                      Wind/Hurricane Deductible
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </span>
                    <span className="text-yellow-400 font-semibold">
                      {policy.deductibles.windHurricanePercent}% ({formatCurrency(policy.deductibles.windHurricane)})
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Agent Name</p>
                  <p className="text-white font-medium">{policy.contacts.agentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Agent Phone</p>
                  <p className="text-white font-medium">{policy.contacts.agentPhone || 'N/A'}</p>
                </div>
                {policy.contacts.claimsPhone && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Claims Phone</p>
                    <p className="text-white font-medium">{policy.contacts.claimsPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Riders & Endorsements */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Riders & Endorsements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {policy.riders.map((rider, index) => (
                    <Badge key={index} className="bg-gray-700 text-gray-300 mr-2">
                      {rider}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mortgagee */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-400" />
                  Mortgagee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Lender Name</p>
                  <p className="text-white font-medium">{policy.mortgage.lenderName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Loan Number</p>
                  <p className="text-white font-medium">{policy.mortgage.loanNumber || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Policy Documents */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Policy Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div 
                  className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === 'lifecycle' ? null : 'lifecycle')}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white">Policy Lifecycle (1)</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'lifecycle' ? 'rotate-180' : ''}`} />
                  </div>
                  {expandedSection === 'lifecycle' && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm text-gray-400">
                        • Policy Declaration Page
                      </div>
                    </div>
                  )}
                </div>
                
                <div 
                  className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === 'regulatory' ? null : 'regulatory')}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white">Regulatory, Legal, and Financial (1)</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'regulatory' ? 'rotate-180' : ''}`} />
                  </div>
                  {expandedSection === 'regulatory' && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm text-gray-400">
                        • Terms and Conditions
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PolicyDetailsPage() {
  return (
    <ProtectedRoute>
      <PolicyDetailsContent />
    </ProtectedRoute>
  )
}