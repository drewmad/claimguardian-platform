/**
 * @fileMetadata
 * @purpose Disaster preparedness and emergency response hub
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "disaster", "emergency", "preparedness"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { 
  Shield, CloudRain, Phone,
  Map, Radio, Battery, Package, Home, Users,
  FileText, Download, ExternalLink, ChevronRight,
  CheckCircle, XCircle, AlertCircle,
  Megaphone, Navigation
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'

type ThreatLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'extreme'
type SupplyStatus = 'stocked' | 'partial' | 'needed'
type EmergencyContactType = 'emergency' | 'utility' | 'insurance' | 'medical' | 'shelter'

interface PreparednesItem {
  id: string
  category: string
  item: string
  status: SupplyStatus
  quantity?: string
  expirationDate?: string
  notes?: string
}

interface EmergencyContact {
  id: string
  name: string
  type: EmergencyContactType
  phone: string
  available: string
  description: string
}

interface WeatherAlert {
  id: string
  type: string
  severity: ThreatLevel
  title: string
  description: string
  issuedAt: string
  expiresAt: string
}

interface EvacuationZone {
  zone: string
  status: 'normal' | 'watch' | 'mandatory'
  shelters: number
  lastUpdated: string
}

function DisasterHubContent() {
  const router = useRouter() // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // Mock data
  const [currentThreatLevel] = useState<ThreatLevel>('elevated')
  const [evacuationZone] = useState<EvacuationZone>({
    zone: 'B',
    status: 'watch',
    shelters: 3,
    lastUpdated: '2 hours ago'
  })

  const [supplies] = useState<PreparednesItem[]>([
    {
      id: '1',
      category: 'Water',
      item: 'Drinking Water',
      status: 'stocked',
      quantity: '3 gallons per person',
      notes: '7-day supply'
    },
    {
      id: '2',
      category: 'Food',
      item: 'Non-perishable Food',
      status: 'partial',
      quantity: '5 days supply',
      notes: 'Need 2 more days'
    },
    {
      id: '3',
      category: 'Power',
      item: 'Batteries',
      status: 'stocked',
      quantity: '24 AA, 12 AAA, 6 D',
    },
    {
      id: '4',
      category: 'Medical',
      item: 'First Aid Kit',
      status: 'stocked',
      expirationDate: '2025-12-01'
    },
    {
      id: '5',
      category: 'Power',
      item: 'Generator',
      status: 'needed',
      notes: 'Consider portable generator'
    }
  ])

  const [emergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Emergency Services',
      type: 'emergency',
      phone: '911',
      available: '24/7',
      description: 'Police, Fire, Medical Emergency'
    },
    {
      id: '2',
      name: 'FPL Power Outages',
      type: 'utility',
      phone: '1-800-468-8243',
      available: '24/7',
      description: 'Report power outages and get updates'
    },
    {
      id: '3',
      name: 'State Farm Claims',
      type: 'insurance',
      phone: '1-800-732-5246',
      available: '24/7',
      description: 'File insurance claims'
    },
    {
      id: '4',
      name: 'Red Cross Shelter',
      type: 'shelter',
      phone: '1-800-733-2767',
      available: '24/7',
      description: 'Find emergency shelters'
    }
  ])

  const [weatherAlerts] = useState<WeatherAlert[]>([
    {
      id: '1',
      type: 'Tropical Storm Watch',
      severity: 'elevated',
      title: 'Tropical Storm Warning',
      description: 'Tropical storm conditions possible within 48 hours',
      issuedAt: '2024-11-25 14:00',
      expiresAt: '2024-11-27 14:00'
    },
    {
      id: '2',
      type: 'Storm Surge Watch',
      severity: 'high',
      title: 'Storm Surge Watch - 3-5 feet',
      description: 'Life-threatening storm surge possible',
      issuedAt: '2024-11-25 14:00',
      expiresAt: '2024-11-27 02:00'
    }
  ])

  const getThreatLevelColor = (level: ThreatLevel) => {
    switch(level) {
      case 'low': return 'bg-green-600'
      case 'moderate': return 'bg-yellow-600'
      case 'elevated': return 'bg-orange-600'
      case 'high': return 'bg-red-600'
      case 'extreme': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }

  const getSupplyStatusIcon = (status: SupplyStatus) => {
    switch(status) {
      case 'stocked': return CheckCircle
      case 'partial': return AlertCircle
      case 'needed': return XCircle
      default: return AlertCircle
    }
  }

  const getSupplyStatusColor = (status: SupplyStatus) => {
    switch(status) {
      case 'stocked': return 'text-green-400'
      case 'partial': return 'text-yellow-400'
      case 'needed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const totalSupplies = supplies.length
  const stockedSupplies = supplies.filter(s => s.status === 'stocked').length
  const preparednessScore = Math.round((stockedSupplies / totalSupplies) * 100)

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Disaster Preparedness Hub</h1>
              <p className="text-gray-400">Emergency resources and preparedness tracking</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Current Threat Level</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-4 h-4 rounded-full ${getThreatLevelColor(currentThreatLevel)}`} />
                  <span className="text-lg font-semibold text-white capitalize">{currentThreatLevel}</span>
                </div>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Emergency
              </button>
            </div>
          </div>

          {/* Active Weather Alerts */}
          {weatherAlerts.length > 0 && (
            <div className="space-y-3 mb-6">
              {weatherAlerts.map((alert) => (
                <Card key={alert.id} className={`border ${
                  alert.severity === 'extreme' ? 'bg-purple-900/20 border-purple-500/30' :
                  alert.severity === 'high' ? 'bg-red-900/20 border-red-500/30' :
                  alert.severity === 'elevated' ? 'bg-orange-900/20 border-orange-500/30' :
                  'bg-yellow-900/20 border-yellow-500/30'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getThreatLevelColor(alert.severity)}`}>
                        <CloudRain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{alert.title}</h3>
                        <p className="text-sm text-gray-300 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>Issued: {new Date(alert.issuedAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>Expires: {new Date(alert.expiresAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-white">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-gray-400">Score</span>
                </div>
                <p className="text-2xl font-bold text-white">{preparednessScore}%</p>
                <p className="text-sm text-gray-400">Preparedness</p>
                <Progress value={preparednessScore} className="mt-2 h-2" />
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Map className="w-5 h-5 text-orange-400" />
                  <Badge variant={evacuationZone.status === 'mandatory' ? 'destructive' : 'secondary'}>
                    {evacuationZone.status}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white">Zone {evacuationZone.zone}</p>
                <p className="text-sm text-gray-400">Evacuation Zone</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Status</span>
                </div>
                <p className="text-2xl font-bold text-white">{stockedSupplies}/{totalSupplies}</p>
                <p className="text-sm text-gray-400">Supplies Ready</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">Ready</p>
                <p className="text-sm text-gray-400">Family Plan</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Emergency Supplies Checklist */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Emergency Supplies Checklist</CardTitle>
                    <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supplies.map((item) => {
                      const StatusIcon = getSupplyStatusIcon(item.status)
                      return (
                        <div key={item.id} className="p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <StatusIcon className={`w-5 h-5 mt-0.5 ${getSupplyStatusColor(item.status)}`} />
                              <div>
                                <h4 className="font-medium text-white">{item.item}</h4>
                                <p className="text-sm text-gray-400">{item.category}</p>
                                {item.quantity && (
                                  <p className="text-sm text-gray-300 mt-1">Quantity: {item.quantity}</p>
                                )}
                                {item.notes && (
                                  <p className="text-sm text-gray-300 mt-1">{item.notes}</p>
                                )}
                                {item.expirationDate && (
                                  <p className="text-sm text-yellow-400 mt-1">
                                    Expires: {new Date(item.expirationDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <Battery className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">Power Backup</p>
                        <p className="text-xs text-gray-400 mt-1">Generator & batteries</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <Radio className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">Communication</p>
                        <p className="text-xs text-gray-400 mt-1">Radio & phone backup</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <FileText className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">Documents</p>
                        <p className="text-xs text-gray-400 mt-1">Important papers safe</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Contacts & Resources */}
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {emergencyContacts.map((contact) => (
                      <div key={contact.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-white text-sm">{contact.name}</p>
                            <p className="text-xs text-gray-400">{contact.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {contact.available}
                          </Badge>
                        </div>
                        <a href={`tel:${contact.phone}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {contact.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Navigation className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-white">Evacuation Routes</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-white">Find Shelters</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CloudRain className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-white">Weather Radar</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Megaphone className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-white">Alert Settings</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DisasterHubPage() {
  return (
    <ProtectedRoute>
      <DisasterHubContent />
    </ProtectedRoute>
  )
}