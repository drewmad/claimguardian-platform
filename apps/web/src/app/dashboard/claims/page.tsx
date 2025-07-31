/**
 * @fileMetadata
 * @purpose Claims tracking and management dashboard
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "claims", "insurance"]
 * @status active
 */
'use client'

import { 
  FileText, Plus, Clock, CheckCircle, AlertCircle, XCircle,
  DollarSign, Phone, Mail, Download, Upload,
  MessageSquare, Camera, TrendingUp, ChevronRight,
  Shield, Paperclip
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'


type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'paid'

interface Claim {
  id: string
  claimNumber: string
  type: string
  policy: string
  status: ClaimStatus
  dateOfLoss: string
  dateSubmitted?: string
  description: string
  estimatedAmount: number
  approvedAmount?: number
  paidAmount?: number
  deductible: number
  adjuster?: {
    name: string
    phone: string
    email: string
  }
  documents: number
  messages: number
  lastUpdate: string
  progress: number
}

interface ClaimActivity {
  id: string
  claimId: string
  date: string
  type: 'status_change' | 'document' | 'message' | 'payment'
  description: string
  user?: string
}

function ClaimsDashboardContent() {
  const router = useRouter()
  
  // Mock data
  const [claims] = useState<Claim[]>([
    {
      id: '1',
      claimNumber: 'CLM-2024-0892',
      type: 'Water Damage',
      policy: 'Homeowners - State Farm',
      status: 'under_review',
      dateOfLoss: '2024-10-15',
      dateSubmitted: '2024-10-18',
      description: 'Water damage from burst pipe in master bathroom',
      estimatedAmount: 15000,
      deductible: 2500,
      adjuster: {
        name: 'Sarah Johnson',
        phone: '(555) 123-4567',
        email: 'sjohnson@statefarm.com'
      },
      documents: 8,
      messages: 3,
      lastUpdate: '2 days ago',
      progress: 60
    },
    {
      id: '2',
      claimNumber: 'CLM-2024-0456',
      type: 'Wind Damage',
      policy: 'Homeowners - State Farm',
      status: 'paid',
      dateOfLoss: '2024-03-10',
      dateSubmitted: '2024-03-12',
      description: 'Roof damage from severe thunderstorm',
      estimatedAmount: 8500,
      approvedAmount: 7800,
      paidAmount: 5300,
      deductible: 2500,
      adjuster: {
        name: 'Mike Chen',
        phone: '(555) 987-6543',
        email: 'mchen@statefarm.com'
      },
      documents: 12,
      messages: 7,
      lastUpdate: '3 months ago',
      progress: 100
    },
    {
      id: '3',
      claimNumber: 'CLM-2024-1025',
      type: 'Auto Collision',
      policy: 'Auto - Progressive',
      status: 'draft',
      dateOfLoss: '2024-11-20',
      description: 'Rear-ended at traffic light, bumper damage',
      estimatedAmount: 3200,
      deductible: 1000,
      documents: 2,
      messages: 0,
      lastUpdate: 'Just now',
      progress: 10
    }
  ])

  const [activities] = useState<ClaimActivity[]>([
    {
      id: '1',
      claimId: '1',
      date: '2024-11-23',
      type: 'message',
      description: 'Adjuster requested additional photos of water damage',
      user: 'Sarah Johnson'
    },
    {
      id: '2',
      claimId: '1',
      date: '2024-11-22',
      type: 'document',
      description: 'Uploaded 3 photos of bathroom damage',
    },
    {
      id: '3',
      claimId: '1',
      date: '2024-11-21',
      type: 'status_change',
      description: 'Claim status changed to Under Review',
    }
  ])

  const getStatusColor = (status: ClaimStatus) => {
    switch(status) {
      case 'draft': return 'bg-gray-600'
      case 'submitted': return 'bg-blue-600'
      case 'under_review': return 'bg-yellow-600'
      case 'approved': return 'bg-green-600'
      case 'denied': return 'bg-red-600'
      case 'paid': return 'bg-emerald-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusIcon = (status: ClaimStatus) => {
    switch(status) {
      case 'draft': return FileText
      case 'submitted': return Clock
      case 'under_review': return AlertCircle
      case 'approved': return CheckCircle
      case 'denied': return XCircle
      case 'paid': return DollarSign
      default: return FileText
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalClaims = claims.length
  const activeClaims = claims.filter(c => ['submitted', 'under_review', 'approved'].includes(c.status)).length
  const totalEstimated = claims.reduce((sum, claim) => sum + claim.estimatedAmount, 0)
  const totalPaid = claims.reduce((sum, claim) => sum + (claim.paidAmount || 0), 0)

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Insurance Claims</h1>
              <p className="text-gray-400">Track and manage your insurance claims</p>
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              onClick={() => router.push('/dashboard/claims/new')}
            >
              <Plus className="w-4 h-4" />
              New Claim
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalClaims}</p>
                <p className="text-sm text-gray-400">Claims Filed</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Active</span>
                </div>
                <p className="text-2xl font-bold text-white">{activeClaims}</p>
                <p className="text-sm text-gray-400">In Progress</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalEstimated)}</p>
                <p className="text-sm text-gray-400">Total Claimed</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-400">Received</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPaid)}</p>
                <p className="text-sm text-gray-400">Total Paid</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Claims */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Claims</h2>
            <div className="space-y-4">
              {claims.map((claim) => {
                const StatusIcon = getStatusIcon(claim.status)
                
                return (
                  <Card key={claim.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(claim.status)}`}>
                            <StatusIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-white text-lg">{claim.type}</h3>
                              <Badge variant="outline" className="text-xs">
                                {claim.claimNumber}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{claim.policy}</p>
                            <p className="text-sm text-gray-300">{claim.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(claim.estimatedAmount)}
                          </p>
                          <p className="text-xs text-gray-400">Estimated</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Date of Loss</p>
                          <p className="text-sm text-white">{new Date(claim.dateOfLoss).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Status</p>
                          <Badge className={getStatusColor(claim.status)}>
                            {claim.status.replace('_', ' ').charAt(0).toUpperCase() + claim.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Deductible</p>
                          <p className="text-sm text-white">{formatCurrency(claim.deductible)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Last Update</p>
                          <p className="text-sm text-white">{claim.lastUpdate}</p>
                        </div>
                      </div>

                      {claim.progress > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-gray-400">{claim.progress}%</span>
                          </div>
                          <Progress value={claim.progress} className="h-2" />
                        </div>
                      )}

                      {claim.adjuster && (
                        <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
                          <p className="text-xs text-gray-400 mb-2">Adjuster Information</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{claim.adjuster.name}</p>
                              <div className="flex gap-4 mt-1">
                                <a href={`tel:${claim.adjuster.phone}`} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {claim.adjuster.phone}
                                </a>
                                <a href={`mailto:${claim.adjuster.email}`} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  Email
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <button 
                            onClick={() => router.push(`/dashboard/claims/${claim.id}/evidence`)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                          >
                            <FileText className="w-4 h-4" />
                            {claim.documents} Documents
                          </button>
                          <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                            <MessageSquare className="w-4 h-4" />
                            {claim.messages} Messages
                          </button>
                        </div>
                        <button 
                          onClick={() => router.push(`/dashboard/claims/${claim.id}`)}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/ai-augmented/damage-analyzer')}
                    className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white">Document Damage</p>
                        <p className="text-sm text-gray-400">Upload photos for AI analysis</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white">Upload Documents</p>
                        <p className="text-sm text-gray-400">Add receipts and estimates</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">Export Claims</p>
                        <p className="text-sm text-gray-400">Download claims history</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="font-medium text-white">Review Coverage</p>
                        <p className="text-sm text-gray-400">Check your policy details</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const claim = claims.find(c => c.id === activity.claimId)
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'status_change' ? 'bg-blue-600' :
                          activity.type === 'document' ? 'bg-green-600' :
                          activity.type === 'message' ? 'bg-purple-600' :
                          'bg-gray-600'
                        }`}>
                          {activity.type === 'status_change' && <AlertCircle className="w-4 h-4 text-white" />}
                          {activity.type === 'document' && <Paperclip className="w-4 h-4 text-white" />}
                          {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-white" />}
                          {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400">{claim?.claimNumber}</p>
                            <span className="text-gray-600">•</span>
                            <p className="text-xs text-gray-400">
                              {new Date(activity.date).toLocaleDateString()}
                            </p>
                            {activity.user && (
                              <>
                                <span className="text-gray-600">•</span>
                                <p className="text-xs text-gray-400">{activity.user}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function ClaimsDashboardPage() {
  return (
    <ProtectedRoute>
      <ClaimsDashboardContent />
    </ProtectedRoute>
  )
}