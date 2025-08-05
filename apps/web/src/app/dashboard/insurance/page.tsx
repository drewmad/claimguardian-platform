/**
 * @fileMetadata
 * @purpose "Insurance policies and coverage management dashboard"
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "insurance", "policies"]
 * @status stable
 */
'use client'

import { Shield, FileText, DollarSign, CheckCircle, TrendingUp, Phone, Download, Plus, ChevronRight, Home, Car, Heart, Umbrella, AlertTriangle, Info, Building, Users, FileCheck, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'


interface Policy {
  id: string
  type: string
  carrier: string
  policyNumber: string
  premium: number
  deductible: number
  coverage: number
  status: 'active' | 'pending' | 'expired'
  effectiveDate: string
  expirationDate: string
  nextPayment: string
  documents: number
  claims: number
}

interface Coverage {
  type: string
  limit: number
  used: number
  deductible: number
  icon: unknown
}

function InsuranceDashboardContent() {
  const router = useRouter()
  
  // Mock data
  const [policies] = useState<Policy[]>([
    {
      id: '1',
      type: 'Homeowners',
      carrier: 'State Farm',
      policyNumber: 'HO-2024-784512',
      premium: 2400,
      deductible: 2500,
      coverage: 450000,
      status: 'active',
      effectiveDate: '2024-03-15',
      expirationDate: '2025-03-15',
      nextPayment: '2025-02-15',
      documents: 12,
      claims: 2
    },
    {
      id: '2',
      type: 'Flood',
      carrier: 'FEMA NFIP',
      policyNumber: 'FL-2024-125478',
      premium: 1800,
      deductible: 5000,
      coverage: 250000,
      status: 'active',
      effectiveDate: '2024-06-01',
      expirationDate: '2025-06-01',
      nextPayment: '2025-05-01',
      documents: 5,
      claims: 0
    },
    {
      id: '3',
      type: 'Auto',
      carrier: 'Progressive',
      policyNumber: 'AU-2024-963852',
      premium: 1600,
      deductible: 1000,
      coverage: 50000,
      status: 'active',
      effectiveDate: '2024-01-10',
      expirationDate: '2025-01-10',
      nextPayment: '2024-12-10',
      documents: 8,
      claims: 1
    }
  ])

  const [coverages] = useState<Coverage[]>([
    {
      type: 'Dwelling',
      limit: 450000,
      used: 0,
      deductible: 2500,
      icon: Home
    },
    {
      type: 'Personal Property',
      limit: 225000,
      used: 15000,
      deductible: 2500,
      icon: Package
    },
    {
      type: 'Liability',
      limit: 500000,
      used: 0,
      deductible: 0,
      icon: Shield
    },
    {
      type: 'Medical Payments',
      limit: 5000,
      used: 0,
      deductible: 0,
      icon: Heart
    }
  ])

  const totalPremium = policies.reduce((sum, policy) => sum + policy.premium, 0)
  const totalCoverage = policies.reduce((sum, policy) => sum + policy.coverage, 0)
  const activePolicies = policies.filter(p => p.status === 'active').length
  const totalClaims = policies.reduce((sum, policy) => sum + policy.claims, 0)

  const getPolicyIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'homeowners': return Home
      case 'flood': return Umbrella
      case 'auto': return Car
      default: return Shield
    }
  }

  // Removed unused function - getStatusColor

  const getDaysUntil = (date: string) => {
    const target = new Date(date)
    const today = new Date()
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Insurance Coverage</h1>
              <p className="text-gray-400">Manage your policies and track coverage</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Policy
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{activePolicies}</p>
                <p className="text-sm text-gray-400">Active Policies</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-gray-400">/year</span>
                </div>
                <p className="text-2xl font-bold text-white">${totalPremium.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Premium</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Building className="w-5 h-5 text-cyan-400" />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">${(totalCoverage/1000000).toFixed(1)}M</p>
                <p className="text-sm text-gray-400">Total Coverage</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-orange-400">{totalClaims} Total</span>
                </div>
                <p className="text-2xl font-bold text-white">1</p>
                <p className="text-sm text-gray-400">Open Claims</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="bg-orange-900/20 border border-orange-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-300 mb-1">Auto Policy Renewal Soon</h3>
                    <p className="text-sm text-gray-300 mb-2">
                      Your Progressive auto policy expires in {getDaysUntil('2025-01-10')} days. 
                      Review your coverage and compare rates.
                    </p>
                    <button className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1">
                      Review Policy <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/20 border border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-300 mb-1">Coverage Gap Detected</h3>
                    <p className="text-sm text-gray-300 mb-2">
                      Your personal property coverage may be insufficient. Consider increasing from $225k to $300k.
                    </p>
                    <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      Update Coverage <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Policies */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Active Policies</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {policies.filter(p => p.status === 'active').map((policy) => {
                const Icon = getPolicyIcon(policy.type)
                const daysUntilRenewal = getDaysUntil(policy.expirationDate)
                
                return (
                  <Card key={policy.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{policy.type}</h3>
                            <p className="text-sm text-gray-400">{policy.carrier}</p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Policy #</span>
                          <span className="text-gray-300 font-mono">{policy.policyNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Coverage</span>
                          <span className="text-white font-medium">${policy.coverage.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Premium</span>
                          <span className="text-white">${policy.premium}/year</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Deductible</span>
                          <span className="text-gray-300">${policy.deductible.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Renewal in {daysUntilRenewal} days</span>
                          <span className="text-gray-400">{new Date(policy.expirationDate).toLocaleDateString()}</span>
                        </div>
                        <Progress 
                          value={((365 - daysUntilRenewal) / 365) * 100} 
                          className="h-1.5"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex gap-3 text-xs">
                          <span className="flex items-center gap-1 text-gray-400">
                            <FileText className="w-3 h-3" />
                            {policy.documents} docs
                          </span>
                          <span className="flex items-center gap-1 text-gray-400">
                            <FileCheck className="w-3 h-3" />
                            {policy.claims} claims
                          </span>
                        </div>
                        <button className="text-blue-400 hover:text-blue-300">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Coverage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Coverage Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coverages.map((coverage) => {
                    const Icon = coverage.icon
                    const utilization = (coverage.used / coverage.limit) * 100
                    
                    return (
                      <div key={coverage.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-white">{coverage.type}</span>
                          </div>
                          <span className="text-sm text-gray-300">
                            ${coverage.used.toLocaleString()} / ${coverage.limit.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={utilization} className="h-2" />
                        {coverage.deductible > 0 && (
                          <p className="text-xs text-gray-400">
                            Deductible: ${coverage.deductible.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/dashboard/claims')}
                    className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white">File a Claim</p>
                        <p className="text-sm text-gray-400">Start a new insurance claim</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white">Download Documents</p>
                        <p className="text-sm text-gray-400">Get all policy documents</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">Contact Agent</p>
                        <p className="text-sm text-gray-400">Speak with your insurance agent</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button 
                    onClick={() => router.push('/ai-tools/policy-chat')}
                    className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="font-medium text-white">Policy Advisor</p>
                        <p className="text-sm text-gray-400">AI-powered policy assistance</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function InsuranceDashboardPage() {
  return (
    <ProtectedRoute>
      <InsuranceDashboardContent />
    </ProtectedRoute>
  )
}