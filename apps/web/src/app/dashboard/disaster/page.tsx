/**
 * @fileMetadata
 * @purpose Disaster hub with Prepare, Survive, Recover phases
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "disaster", "emergency", "preparedness"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { Shield, CloudRain, Phone, AlertTriangle, Zap, Activity, Map, Radio, Package, Home, Users, Target, FileText, ExternalLink, ChevronRight, Heart, CheckCircle, XCircle, AlertCircle, Clock, Wrench, Wifi, Camera, ScanLine } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'

type DisasterPhase = 'prepare' | 'survive' | 'recover'
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
  const router = useRouter()
  const [activePhase, setActivePhase] = useState<DisasterPhase>('prepare')
  
  // Mock data
  const [currentThreatLevel] = useState<ThreatLevel>('elevated')
  const [] = useState<EvacuationZone>({
    zone: 'B',
    status: 'watch',
    shelters: 3,
    lastUpdated: '2 hours ago'
  })

  const phases = [
    { id: 'prepare', label: 'Prepare', icon: Target, description: 'Ready your home and family' },
    { id: 'survive', label: 'Survive', icon: Activity, description: 'Active emergency response' },
    { id: 'recover', label: 'Recover', icon: Heart, description: 'Post-disaster restoration' }
  ]

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
              <h1 className="text-3xl font-bold text-white mb-2">Disaster Hub</h1>
              <p className="text-gray-400">Comprehensive emergency management across all phases</p>
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

          {/* Phase Navigation */}
          <div className="bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {phases.map((phase) => {
                const Icon = phase.icon
                return (
                  <button
                    key={phase.id}
                    onClick={() => setActivePhase(phase.id as DisasterPhase)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activePhase === phase.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">{phase.label}</div>
                      <div className="text-xs opacity-75">{phase.description}</div>
                    </div>
                  </button>
                )
              })}
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

          {/* Phase Content */}
          {activePhase === 'prepare' && (
            <div className="space-y-6">
              {/* Preparedness Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Home className="w-5 h-5 text-cyan-400" />
                      <Badge variant="default">Protected</Badge>
                    </div>
                    <p className="text-2xl font-bold text-white">Secured</p>
                    <p className="text-sm text-gray-400">Property</p>
                  </CardContent>
                </Card>
              </div>

              {/* Preparation Checklist */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Emergency Kit Essentials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {supplies.slice(0, 3).map((item) => {
                      const StatusIcon = getSupplyStatusIcon(item.status)
                      return (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                          <StatusIcon className={`w-5 h-5 ${getSupplyStatusColor(item.status)}`} />
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{item.item}</p>
                            <p className="text-xs text-gray-400">{item.quantity}</p>
                          </div>
                        </div>
                      )
                    })}
                    <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">
                      View Full Checklist
                    </button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Home Hardening</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white text-sm">Storm Shutters</p>
                        <p className="text-xs text-gray-400">All windows protected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="font-medium text-white text-sm">Roof Inspection</p>
                        <p className="text-xs text-gray-400">Due for annual check</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium text-white text-sm">Backup Generator</p>
                        <p className="text-xs text-gray-400">Needs installation</p>
                      </div>
                    </div>
                    <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm">
                      Schedule Inspection
                    </button>
                  </CardContent>
                </Card>
              </div>

              {/* Family Emergency Plan */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Family Emergency Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-700 rounded-lg text-center">
                      <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-white mb-2">Meeting Points</h3>
                      <p className="text-sm text-gray-400">Primary: Home</p>
                      <p className="text-sm text-gray-400">Secondary: School</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg text-center">
                      <Phone className="w-8 h-8 text-green-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-white mb-2">Emergency Contacts</h3>
                      <p className="text-sm text-gray-400">4 contacts saved</p>
                      <p className="text-sm text-gray-400">Cards printed</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg text-center">
                      <Map className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-white mb-2">Evacuation Routes</h3>
                      <p className="text-sm text-gray-400">3 routes planned</p>
                      <p className="text-sm text-gray-400">Maps downloaded</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activePhase === 'survive' && (
            <div className="space-y-6">
              {/* Emergency Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-red-900/20 border-red-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <Badge variant="destructive">Active</Badge>
                    </div>
                    <p className="text-2xl font-bold text-white">ALERT</p>
                    <p className="text-sm text-red-300">Emergency Mode Active</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-xs text-gray-400">Status</span>
                    </div>
                    <p className="text-2xl font-bold text-white">12 hrs</p>
                    <p className="text-sm text-gray-400">Power Backup Left</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Wifi className="w-5 h-5 text-blue-400" />
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">Connected</p>
                    <p className="text-sm text-gray-400">Emergency Network</p>
                  </CardContent>
                </Card>
              </div>

              {/* Real-time Updates */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-400" />
                    Live Emergency Updates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-white">Hurricane Warning Extended</p>
                        <p className="text-sm text-gray-300 mt-1">Storm expected to make landfall in 6 hours. Seek immediate shelter.</p>
                        <p className="text-xs text-gray-400 mt-2">Updated 15 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-orange-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-white">Power Outages Reported</p>
                        <p className="text-sm text-gray-300 mt-1">Widespread outages in Zone B. Emergency services active.</p>
                        <p className="text-xs text-gray-400 mt-2">Updated 1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Immediate Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <button className="w-full p-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold flex items-center gap-3">
                      <Phone className="w-5 h-5" />
                      Call 911 Emergency
                    </button>
                    <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Radio className="w-5 h-5 text-blue-400" />
                        <span>Emergency Radio</span>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Map className="w-5 h-5 text-green-400" />
                        <span>Evacuation Map</span>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-purple-400" />
                        <span>Find Shelter</span>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Emergency Contacts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {emergencyContacts.slice(0, 4).map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-white text-sm">{contact.name}</p>
                          <p className="text-xs text-gray-400">{contact.phone}</p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                          Call
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activePhase === 'recover' && (
            <div className="space-y-6">
              {/* Recovery Progress */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Heart className="w-5 h-5 text-green-400" />
                      <span className="text-xs text-gray-400">Status</span>
                    </div>
                    <p className="text-2xl font-bold text-white">Safe</p>
                    <p className="text-sm text-gray-400">Family Status</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Camera className="w-5 h-5 text-blue-400" />
                      <span className="text-xs text-gray-400">Progress</span>
                    </div>
                    <p className="text-2xl font-bold text-white">65%</p>
                    <p className="text-sm text-gray-400">Damage Assessed</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <Badge variant="default">Filed</Badge>
                    </div>
                    <p className="text-2xl font-bold text-white">1 Claim</p>
                    <p className="text-sm text-gray-400">Insurance Claims</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Wrench className="w-5 h-5 text-orange-400" />
                      <span className="text-xs text-gray-400">Est. Days</span>
                    </div>
                    <p className="text-2xl font-bold text-white">14</p>
                    <p className="text-sm text-gray-400">Recovery Time</p>
                  </CardContent>
                </Card>
              </div>

              {/* Damage Assessment */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    Damage Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <h3 className="font-semibold text-white mb-2">Roof Damage</h3>
                      <p className="text-sm text-gray-300 mb-3">Missing shingles, minor leak detected</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="destructive">High Priority</Badge>
                        <span className="text-xs text-gray-400">Estimated: $8,500</span>
                      </div>
                      <button 
                        onClick={() => router.push('/ai-augmented/damage-analyzer')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm"
                      >
                        AI Damage Analysis
                      </button>
                    </div>
                    
                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <h3 className="font-semibold text-white mb-2">Window Damage</h3>
                      <p className="text-sm text-gray-300 mb-3">Cracked glass on east side windows</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">Medium Priority</Badge>
                        <span className="text-xs text-gray-400">Estimated: $2,200</span>
                      </div>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm">
                        Schedule Repair
                      </button>
                    </div>
                    
                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <h3 className="font-semibold text-white mb-2">Fence Repair</h3>
                      <p className="text-sm text-gray-300 mb-3">Two fence sections need replacement</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">Low Priority</Badge>
                        <span className="text-xs text-gray-400">Estimated: $900</span>
                      </div>
                      <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded text-sm">
                        Get Quotes
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recovery Resources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recovery Assistance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <button className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      File Insurance Claim
                    </button>
                    <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-green-400" />
                        <span>FEMA Assistance</span>
                      </div>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-orange-400" />
                        <span>Find Contractors</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ScanLine className="w-5 h-5 text-purple-400" />
                        <span>Document Scanner</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recovery Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white text-sm">Initial Assessment</p>
                        <p className="text-xs text-gray-400">Completed Day 1</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white text-sm">Insurance Contact</p>
                        <p className="text-xs text-gray-400">Completed Day 2</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white text-sm">Adjuster Visit</p>
                        <p className="text-xs text-gray-400">Scheduled Day 5</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-300 text-sm">Repairs Begin</p>
                        <p className="text-xs text-gray-400">Estimated Day 10</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
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