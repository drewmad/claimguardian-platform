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

import {
  ArrowLeft,
  DollarSign,
  Download,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  User
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { ClaimTimeline, TimelineEvent } from '@/components/claims/claim-timeline'
import { EvidenceManager } from '@/components/claims/evidence-manager'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigateToParent } from '@/lib/utils/navigation'

interface ClaimDetails {
  id: string
  claimNumber: string
  status: string
  damageType: string
  dateOfLoss: string
  dateSubmitted: string
  description: string
  causeOfLoss: string
  estimatedAmount: number
  approvedAmount?: number
  paidAmount?: number
  deductible: number
  propertyAddress: string
  damageLocations: string[]
  policyNumber: string
  insuranceCompany: string
  adjuster?: {
    name: string
    phone: string
    email: string
  }
  progress: number
  timeline: Array<{
    date: string
    event: string
    description: string
    type: 'status' | 'document' | 'communication' | 'payment'
  }>
}

// Mock claims data based on ID
const mockClaims: Record<string, ClaimDetails> = {
  '1': {
    id: '1',
    claimNumber: 'CLM-2024-0892',
    status: 'investigating',
    damageType: 'Water Damage',
    dateOfLoss: '2024-10-15',
    dateSubmitted: '2024-10-18',
    description: 'Water damage from burst pipe in master bathroom. Significant damage to ceiling, walls, and flooring.',
    causeOfLoss: 'Burst pipe due to freezing temperatures',
    estimatedAmount: 15000,
    deductible: 2500,
    propertyAddress: '123 Main Street, Orlando, FL 32801',
    damageLocations: ['Master Bathroom', 'Master Bedroom', 'Hallway'],
    policyNumber: 'HO-123456789',
    insuranceCompany: 'State Farm',
    adjuster: {
      name: 'Sarah Johnson',
      phone: '(555) 123-4567',
      email: 'sjohnson@statefarm.com'
    },
    progress: 60,
    timeline: [
      {
        date: '2024-10-18',
        event: 'Claim Submitted',
        description: 'Initial claim filed with all required documentation',
        type: 'status'
      },
      {
        date: '2024-10-20',
        event: 'Adjuster Assigned',
        description: 'Sarah Johnson assigned as claim adjuster',
        type: 'communication'
      },
      {
        date: '2024-10-22',
        event: 'Inspection Scheduled',
        description: 'Property inspection scheduled for October 25th',
        type: 'communication'
      },
      {
        date: '2024-10-25',
        event: 'Property Inspected',
        description: 'Adjuster completed on-site inspection',
        type: 'status'
      },
      {
        date: '2024-11-01',
        event: 'Additional Documents Requested',
        description: 'Insurance company requested contractor estimates',
        type: 'document'
      },
      {
        date: '2024-11-05',
        event: 'Documents Submitted',
        description: 'Submitted 3 contractor estimates',
        type: 'document'
      }
    ]
  },
  '2': {
    id: '2',
    claimNumber: 'CLM-2024-0456',
    status: 'settled',
    damageType: 'Wind Damage',
    dateOfLoss: '2024-03-10',
    dateSubmitted: '2024-03-12',
    description: 'Roof damage from severe thunderstorm. Multiple shingles blown off, water intrusion in attic.',
    causeOfLoss: 'High winds during thunderstorm',
    estimatedAmount: 8500,
    approvedAmount: 7800,
    paidAmount: 5300,
    deductible: 2500,
    propertyAddress: '456 Oak Avenue, Miami, FL 33101',
    damageLocations: ['Roof', 'Attic', 'Ceiling - Bedroom 2'],
    policyNumber: 'HO-987654321',
    insuranceCompany: 'State Farm',
    adjuster: {
      name: 'Mike Chen',
      phone: '(555) 987-6543',
      email: 'mchen@statefarm.com'
    },
    progress: 100,
    timeline: [
      {
        date: '2024-03-12',
        event: 'Claim Submitted',
        description: 'Initial claim filed',
        type: 'status'
      },
      {
        date: '2024-03-15',
        event: 'Emergency Repairs Approved',
        description: 'Approved $2,000 for emergency tarping',
        type: 'payment'
      },
      {
        date: '2024-03-20',
        event: 'Final Settlement',
        description: 'Claim settled for $7,800',
        type: 'payment'
      }
    ]
  },
  '3': {
    id: '3',
    claimNumber: 'CLM-2024-1025',
    status: 'draft',
    damageType: 'Auto Collision',
    dateOfLoss: '2024-11-20',
    dateSubmitted: '',
    description: 'Rear-ended at traffic light, bumper and trunk damage',
    causeOfLoss: 'Other driver ran red light',
    estimatedAmount: 3200,
    deductible: 1000,
    propertyAddress: 'N/A - Vehicle Claim',
    damageLocations: ['Rear Bumper', 'Trunk', 'Tail Lights'],
    policyNumber: 'AUTO-123456',
    insuranceCompany: 'Progressive',
    progress: 10,
    timeline: [
      {
        date: '2024-11-20',
        event: 'Accident Occurred',
        description: 'Police report filed at scene',
        type: 'status'
      }
    ]
  }
}

export default function ClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string
  const { navigateToParent, getParentInfo } = useNavigateToParent('claimDetail')
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])

  // Get the correct claim based on ID
  const [claim] = useState<ClaimDetails>(() => {
    return mockClaims[claimId] || mockClaims['1'] // Default to claim 1 if not found
  })

  // Convert claim timeline to TimelineEvent format
  useState(() => {
    const events: TimelineEvent[] = claim.timeline.map((item, index) => ({
      id: `timeline-${index}`,
      claimId: claimId,
      date: item.date,
      type: item.type === 'status' ? 'status_change' : 
            item.type === 'document' ? 'document_upload' :
            item.type === 'communication' ? 'communication' :
            item.type === 'payment' ? 'payment' : 'other',
      category: 'insurance',
      title: item.event,
      description: item.description
    }))
    setTimelineEvents(events)
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-gray-600'
      case 'submitted': return 'bg-blue-600'
      case 'investigating': return 'bg-yellow-600'
      case 'approved': return 'bg-green-600'
      case 'denied': return 'bg-red-600'
      case 'paid': return 'bg-emerald-600'
      default: return 'bg-gray-600'
    }
  }


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={navigateToParent}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {getParentInfo().parentLabel}
            </Button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {claim.damageType} Claim
                </h1>
                <div className="flex items-center gap-4 text-gray-400">
                  <span>{claim.claimNumber}</span>
                  <Badge className={getStatusColor(claim.status)}>
                    {claim.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="border-gray-700"
                  onClick={() => toast.info('Export feature coming soon! You\'ll be able to download claim details as PDF.')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (claim.adjuster?.email) {
                      window.location.href = `mailto:${claim.adjuster.email}?subject=Regarding Claim ${claim.claimNumber}`
                    } else {
                      toast.info('Contact feature will be available once an adjuster is assigned to your claim.')
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Adjuster
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Claim Progress</span>
                <span className="text-sm text-gray-400">{claim.progress}%</span>
              </div>
              <Progress value={claim.progress} className="h-3" />
              <div className="flex justify-between mt-3 text-xs text-gray-500">
                <span>Submitted</span>
                <span>Under Review</span>
                <span>Approved</span>
                <span>Payment</span>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Claim Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-400">Date of Loss</span>
                        <p className="font-medium text-white">
                          {new Date(claim.dateOfLoss).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Date Submitted</span>
                        <p className="font-medium text-white">
                          {new Date(claim.dateSubmitted).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-400">Property Address</span>
                      <p className="font-medium text-white">{claim.propertyAddress}</p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-400">Affected Areas</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {claim.damageLocations.map(location => (
                          <Badge key={location} variant="secondary">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-400">Description</span>
                      <p className="text-white mt-1">{claim.description}</p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-400">Cause of Loss</span>
                      <p className="text-white mt-1">{claim.causeOfLoss}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {/* Financial Summary */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Financial Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Estimated Amount</span>
                        <span className="font-medium text-white">
                          ${claim.estimatedAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Deductible</span>
                        <span className="font-medium text-white">
                          ${claim.deductible.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-gray-700 pt-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Expected Payout</span>
                          <span className="font-medium text-white">
                            ${(claim.estimatedAmount - claim.deductible).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insurance Info */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Insurance Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-400">Company</span>
                        <p className="font-medium text-white">{claim.insuranceCompany}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Policy Number</span>
                        <p className="font-medium text-white">{claim.policyNumber}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Adjuster Info */}
                  {claim.adjuster && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Adjuster Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-400">Name</span>
                          <p className="font-medium text-white">{claim.adjuster.name}</p>
                        </div>
                        <div>
                          <a 
                            href={`tel:${claim.adjuster.phone}`}
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                          >
                            <Phone className="w-4 h-4" />
                            {claim.adjuster.phone}
                          </a>
                        </div>
                        <div>
                          <a 
                            href={`mailto:${claim.adjuster.email}`}
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                          >
                            <Mail className="w-4 h-4" />
                            {claim.adjuster.email}
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="evidence">
              <EvidenceManager claimId={claimId} />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <ClaimTimeline 
                claimId={claimId}
                events={timelineEvents}
                allowAddEvent={true}
                onEventAdd={(event) => {
                  setTimelineEvents(prev => [event, ...prev])
                }}
              />
            </TabsContent>

            <TabsContent value="communications">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Communications</CardTitle>
                  <CardDescription>Messages and correspondence with your insurance company</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No messages yet</p>
                    <Button 
                      className="mt-4"
                      onClick={() => toast.info('Messaging feature coming soon! You\'ll be able to chat directly with your adjuster.')}
                    >
                      Start Conversation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
