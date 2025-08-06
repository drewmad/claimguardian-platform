/**
 * @fileMetadata
 * @owner @frontend-team
 * @purpose "Tabbed interface for policy details page"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
'use client'

import { useState } from 'react'
import { Shield, FileText, DollarSign, Clock, AlertTriangle, Phone, Building, TrendingUp, Download, Edit, Calendar } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-variants'
import { Badge } from '@/components/ui/badge'
import { InsuranceBadge } from '@/components/ui/insurance-badges'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

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
    monthly?: number
    paymentMethod: string
    nextPaymentDate?: string
  }
  contacts: {
    agentName?: string
    agentPhone?: string
    agentEmail?: string
    claimsPhone?: string
    customerServicePhone?: string
  }
  mortgage: {
    lenderName?: string
    loanNumber?: string
    escrowAccount?: boolean
  }
  riders: string[]
  documents: Array<{
    id: string
    name: string
    type: string
    size: number
    uploadedAt: string
  }>
  claims: Array<{
    id: string
    claimNumber: string
    date: string
    type: string
    amount: number
    status: 'open' | 'closed' | 'approved' | 'denied'
  }>
  paymentHistory: Array<{
    id: string
    date: string
    amount: number
    method: string
    status: 'paid' | 'pending' | 'failed'
  }>
}

interface PolicyTabsProps {
  policy: PolicyDetails
  onEdit?: () => void
  className?: string
}

export function PolicyTabs({ policy, onEdit, className }: PolicyTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalCoverage = Object.values(policy.coverages).reduce((sum, val) => sum + val, 0)
  const daysUntilExpiration = Math.ceil(
    (new Date(policy.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={className}>
      <TabsList className="bg-gray-800 border-gray-700 p-1 flex-wrap h-auto">
        <TabsTrigger value="overview" className="gap-2">
          <Shield className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="coverage" className="gap-2">
          <Shield className="w-4 h-4" />
          Coverage Details
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-2">
          <FileText className="w-4 h-4" />
          Documents
          {policy.documents.length > 0 && (
            <Badge className="ml-1 bg-gray-700 text-gray-300">
              {policy.documents.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="claims" className="gap-2">
          <AlertTriangle className="w-4 h-4" />
          Claims History
          {policy.claims.length > 0 && (
            <Badge className="ml-1 bg-yellow-600/20 text-yellow-400">
              {policy.claims.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="payments" className="gap-2">
          <DollarSign className="w-4 h-4" />
          Payments
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Coverage</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalCoverage)}</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Annual Premium</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(policy.premium.annual)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Expires In</p>
                    <p className="text-2xl font-bold text-white">{daysUntilExpiration} days</p>
                  </div>
                  <Calendar className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <InsuranceBadge variant="active" className="mt-1">Active</InsuranceBadge>
                  </div>
                  <Clock className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Policy Information */}
          <Card variant="insurance" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Policy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Policy Number</p>
                  <p className="text-white font-medium">{policy.policyNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Policy Type</p>
                  <p className="text-white font-medium">{policy.policyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Carrier</p>
                  <p className="text-white font-medium">{policy.carrier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Property Address</p>
                  <p className="text-white font-medium">{policy.propertyAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Effective Date</p>
                  <p className="text-white font-medium">{new Date(policy.effectiveDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Expiration Date</p>
                  <p className="text-white font-medium">{new Date(policy.expirationDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="insurance">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Phone className="w-4 h-4" />
                Contact Agent
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <AlertTriangle className="w-4 h-4" />
                File a Claim
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Download Policy
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Edit className="w-4 h-4" />
                Request Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Coverage Details Tab */}
      <TabsContent value="coverage" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="insurance">
            <CardHeader>
              <CardTitle>Coverage Amounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(policy.coverages).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-white font-semibold">{formatCurrency(value)}</span>
                  </div>
                  <Progress 
                    value={(value / totalCoverage) * 100} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card variant="insurance">
            <CardHeader>
              <CardTitle>Deductibles</CardTitle>
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
              
              {policy.riders.length > 0 && (
                <>
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-3">Riders & Endorsements</p>
                    <div className="space-y-2">
                      {policy.riders.map((rider, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {rider}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Documents Tab */}
      <TabsContent value="documents" className="mt-6">
        <Card variant="insurance">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Policy Documents</CardTitle>
            <Button size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Download All
            </Button>
          </CardHeader>
          <CardContent>
            {policy.documents.length > 0 ? (
              <div className="space-y-3">
                {policy.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-400">
                          {doc.type} • {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No documents uploaded yet</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Claims History Tab */}
      <TabsContent value="claims" className="mt-6">
        <Card variant="insurance">
          <CardHeader>
            <CardTitle>Claims History</CardTitle>
          </CardHeader>
          <CardContent>
            {policy.claims.length > 0 ? (
              <div className="space-y-3">
                {policy.claims.map((claim) => (
                  <div key={claim.id} className="p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">Claim #{claim.claimNumber}</p>
                        <p className="text-sm text-gray-400">{claim.type} • {new Date(claim.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{formatCurrency(claim.amount)}</p>
                        <InsuranceBadge variant={`claim-${claim.status}`}>{claim.status}</InsuranceBadge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No claims filed</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payments Tab */}
      <TabsContent value="payments" className="mt-6">
        <Card variant="insurance">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {policy.paymentHistory && policy.paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {policy.paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                    <div>
                      <p className="text-white">{new Date(payment.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">{payment.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(payment.amount)}</p>
                      <Badge className={cn(
                        payment.status === 'paid' ? 'bg-green-600/20 text-green-400' :
                        payment.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-red-600/20 text-red-400'
                      )}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No payment history available</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}