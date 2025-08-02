/**
 * @fileMetadata
 * @purpose The main page for the Situation Room, providing a real-time threat monitoring dashboard.
 * @owner frontend-team
 * @status active
 */
'use client'

import { 
  AlertTriangle, Wind, CloudRain, Zap, Home, Shield,
  CheckCircle, XCircle, Clock, Phone, FileText,
  Map, Camera, Radio, Users, Siren, Activity,
  Brain, TrendingUp, Bell, Settings, Wifi, WifiOff,
  RefreshCw, ChevronRight, Eye, EyeOff, Filter,
  BarChart3, Navigation, MessageSquare, Gauge
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AIAssessmentPanel } from '@/components/situation-room/ai-assessment-panel'
import { useSituationRoom } from '@/lib/stores/situation-room-store'
import { useRealtimeSubscription } from '@/hooks/use-situation-room-realtime'
import { 
  ThreatLevel
} from '@/types/situation-room'
import type { 
  ThreatAssessment, 
  IntelligenceFeed, 
  ActionItem,
  AIRecommendation,
  PropertyStatus,
  CommunityIntelligence
} from '@/types/situation-room'

export default function SituationRoomPage() {
  const [propertyId] = useState('current-property-id') // This would come from auth context
  const [selectedView, setSelectedView] = useState<'overview' | 'threats' | 'intelligence' | 'community' | 'emergency'>('overview')
  const [showEmergencyMode, setShowEmergencyMode] = useState(false)
  
  const {
    threats,
    overallThreatLevel,
    activeThreatCount,
    intelligenceFeeds,
    unreadFeedCount,
    propertyStatus,
    systemsOnline,
    totalSystems,
    communityIntel,
    aiRecommendations,
    pendingActions,
    emergencyMode,
    connectionStatus,
    isLoading,
    error,
    loadSituationData,
    refreshThreatAssessment,
    activateEmergencyMode,
    deactivateEmergencyMode,
    clearError
  } = useSituationRoom()
  
  const { isConnected, isReconnecting, forceReconnect } = useRealtimeSubscription(propertyId, {
    onError: (error) => {
      toast.error(`Connection error: ${error.message}`)
    }
  })
  
  // Load initial data
  useEffect(() => {
    loadSituationData(propertyId)
  }, [propertyId, loadSituationData])
  
  // Monitor emergency mode changes
  useEffect(() => {
    setShowEmergencyMode(emergencyMode)
  }, [emergencyMode])
  
  const activeThreat = useMemo(() => {
    return threats.find(t => t.isActive && t.severity === overallThreatLevel)
  }, [threats, overallThreatLevel])
  
  const urgentActions = useMemo(() => {
    return pendingActions.filter(a => a.priority === 'urgent' || a.priority === 'immediate')
  }, [pendingActions])
  
  const recentFeeds = useMemo(() => {
    return intelligenceFeeds.slice(0, 5)
  }, [intelligenceFeeds])
  
  const handleEmergencyToggle = () => {
    if (emergencyMode) {
      deactivateEmergencyMode()
    } else {
      activateEmergencyMode()
    }
  }
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="liquid-glass-premium flex items-center justify-center min-h-[60vh] rounded-2xl m-6">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-xl text-white">Initializing Situation Room...</p>
            <p className="text-gray-400 mt-2">Connecting to AI threat assessment network</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout>
      <div className={`situation-room-container p-6 space-y-6 transition-all duration-500 ${
        emergencyMode ? 'emergency-mode' : ''
      }`}>
        {/* Command Header with Liquid Glass Premium */}
        <div className="liquid-glass-premium rounded-2xl p-6 border border-blue-500/20 relative overflow-hidden">
          {/* Emergency Mode Overlay */}
          {emergencyMode && (
            <div className="absolute inset-0 bg-red-600/20 animate-pulse pointer-events-none" />
          )}
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 relative">
                <Shield className="w-8 h-8 text-white" />
                {emergencyMode && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  Situation Room
                  {emergencyMode && (
                    <Badge variant="destructive" className="animate-pulse">
                      EMERGENCY MODE
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-300">Real-time property intelligence command center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Connected</span>
                  </>
                ) : isReconnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span className="text-sm text-yellow-400">Reconnecting</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Disconnected</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={forceReconnect}
                      className="ml-2"
                    >
                      Retry
                    </Button>
                  </>
                )}
              </div>
              
              {/* Overall Threat Level */}
              <ThreatLevelIndicator level={overallThreatLevel} count={activeThreatCount} />
              
              {/* Emergency Mode Toggle */}
              <Button 
                variant={emergencyMode ? "destructive" : "outline"} 
                onClick={handleEmergencyToggle}
                className="liquid-glass-subtle"
              >
                <Siren className="w-4 h-4 mr-2" />
                {emergencyMode ? 'Exit Emergency' : 'Emergency Mode'}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <p className="text-red-300">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
        
        {/* Active Threat Banner */}
        {activeThreat && (
          <ActiveThreatBanner threat={activeThreat} />
        )}
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Gauge },
            { id: 'threats', label: 'Threats', icon: AlertTriangle, badge: activeThreatCount },
            { id: 'intelligence', label: 'Intelligence', icon: Brain, badge: unreadFeedCount },
            { id: 'community', label: 'Community', icon: Users },
            { id: 'emergency', label: 'Emergency', icon: Siren }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                selectedView === tab.id 
                  ? 'liquid-glass-premium text-white' 
                  : 'liquid-glass-subtle text-gray-300 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Main Content Based on Selected View */}
        {selectedView === 'overview' && (
          <OverviewDashboard 
            threats={threats}
            intelligenceFeeds={recentFeeds}
            propertyStatus={propertyStatus}
            aiRecommendations={aiRecommendations.slice(0, 3)}
            urgentActions={urgentActions}
            systemsOnline={systemsOnline}
            totalSystems={totalSystems}
          />
        )}
        
        {selectedView === 'threats' && (
          <ThreatMonitoringView threats={threats} />
        )}
        
        {selectedView === 'intelligence' && (
          <IntelligenceFeedView feeds={intelligenceFeeds} />
        )}
        
        {selectedView === 'community' && (
          <CommunityIntelligenceView data={communityIntel} />
        )}
        
        {selectedView === 'emergency' && (
          <EmergencyProtocolsView 
            emergencyMode={emergencyMode}
            urgentActions={urgentActions}
            activeThreat={activeThreat}
          />
        )}

      </div>
    </DashboardLayout>
  )
}

// ===== COMPONENT DEFINITIONS =====

interface ThreatLevelIndicatorProps {
  level: ThreatLevel
  count: number
}

function ThreatLevelIndicator({ level, count }: ThreatLevelIndicatorProps) {
  const getIndicatorColor = (threatLevel: ThreatLevel) => {
    switch (threatLevel) {
      case 'low': return 'text-green-400 bg-green-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/20'
      case 'high': return 'text-orange-400 bg-orange-400/20'
      case 'critical': return 'text-red-400 bg-red-400/20'
      case 'emergency': return 'text-red-600 bg-red-600/20 animate-pulse'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getIndicatorColor(level)}`}>
      <div className={`w-2 h-2 rounded-full ${getIndicatorColor(level).split(' ')[0]} bg-current`} />
      <span className="text-sm font-medium capitalize">{level}</span>
      {count > 0 && (
        <Badge variant="secondary" className="ml-1">
          {count}
        </Badge>
      )}
    </div>
  )
}

interface ActiveThreatBannerProps {
  threat: ThreatAssessment
}

function ActiveThreatBanner({ threat }: ActiveThreatBannerProps) {
  const getSeverityColor = (severity: ThreatLevel) => {
    switch (severity) {
      case 'high': return 'border-orange-500/30 bg-orange-900/20'
      case 'critical': return 'border-red-500/30 bg-red-900/20'
      case 'emergency': return 'border-red-600/50 bg-red-900/40 animate-pulse'
      default: return 'border-yellow-500/30 bg-yellow-900/20'
    }
  }
  
  const getSeverityIcon = (severity: ThreatLevel) => {
    switch (severity) {
      case 'high': return AlertTriangle
      case 'critical': return Siren
      case 'emergency': return Siren
      default: return Wind
    }
  }
  
  const Icon = getSeverityIcon(threat.severity)
  
  return (
    <div className={`liquid-glass-medium rounded-lg p-6 border ${getSeverityColor(threat.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Icon className={`w-8 h-8 mt-1 ${
            threat.severity === 'emergency' ? 'text-red-600' :
            threat.severity === 'critical' ? 'text-red-400' :
            threat.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'
          }`} />
          <div>
            <h3 className="text-xl font-semibold text-white">{threat.title}</h3>
            <p className="text-gray-300 mt-1">{threat.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm text-gray-400">Timeline:</span>
              <span className="px-3 py-1 bg-black/20 text-white rounded-full text-sm">
                {threat.timeline}
              </span>
              <span className="text-sm text-gray-400">Confidence:</span>
              <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm">
                {threat.confidence}%
              </span>
            </div>
            {threat.actions.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-400 mb-2">{threat.actions.length} recommended actions</p>
                <div className="flex gap-2">
                  {threat.actions.slice(0, 2).map(action => (
                    <Badge key={action.id} variant="outline" className="text-xs">
                      {action.title}
                    </Badge>
                  ))}
                  {threat.actions.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{threat.actions.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button size="sm" className="liquid-glass-neon">
            Take Action
          </Button>
        </div>
      </div>
    </div>
  )
}

interface OverviewDashboardProps {
  threats: ThreatAssessment[]
  intelligenceFeeds: IntelligenceFeed[]
  propertyStatus: PropertyStatus | null
  aiRecommendations: AIRecommendation[]
  urgentActions: ActionItem[]
  systemsOnline: number
  totalSystems: number
}

function OverviewDashboard({ 
  threats, 
  intelligenceFeeds, 
  propertyStatus, 
  aiRecommendations,
  urgentActions,
  systemsOnline,
  totalSystems 
}: OverviewDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Quick Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="liquid-glass-medium border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Home className="w-6 h-6 text-green-400" />
              {propertyStatus?.overallHealth && propertyStatus.overallHealth > 90 ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
            </div>
            <p className="text-lg font-semibold text-white">Property Status</p>
            <p className="text-sm text-gray-400">
              {propertyStatus?.overallHealth ? `${propertyStatus.overallHealth}% Health` : 'Monitoring'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="liquid-glass-medium border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
              {propertyStatus?.insuranceStatus.policyActive ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className="text-lg font-semibold text-white">Insurance</p>
            <p className="text-sm text-gray-400">
              {propertyStatus?.insuranceStatus.policyActive ? 'Coverage Active' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="liquid-glass-medium border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
              {systemsOnline === totalSystems ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
            </div>
            <p className="text-lg font-semibold text-white">Systems</p>
            <p className="text-sm text-gray-400">
              {systemsOnline}/{totalSystems} Online
            </p>
          </CardContent>
        </Card>
        
        <Card className="liquid-glass-medium border-cyan-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Brain className="w-6 h-6 text-cyan-400" />
              <span className="text-lg font-semibold text-white">{aiRecommendations.length}</span>
            </div>
            <p className="text-lg font-semibold text-white">AI Insights</p>
            <p className="text-sm text-gray-400">Active Recommendations</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Threats Panel */}
        <div className="lg:col-span-2">
          <ThreatMonitorPanel threats={threats.slice(0, 3)} />
        </div>
        
        {/* Intelligence Feeds */}
        <div>
          <IntelligenceFeedPanel feeds={intelligenceFeeds} />
        </div>
      </div>
      
      {/* AI Assessment Panel */}
      <AIAssessmentPanel propertyId="current-property-id" />
      
      {/* AI Recommendations & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIRecommendationsPanel recommendations={aiRecommendations} />
        <QuickActionsPanel urgentActions={urgentActions} />
      </div>
    </div>
  )
}

// ===== VIEW COMPONENTS =====

interface ThreatMonitoringViewProps {
  threats: ThreatAssessment[]
}

function ThreatMonitoringView({ threats }: ThreatMonitoringViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Threat Monitoring</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Threat Levels Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.values(ThreatLevel).map(level => {
          const count = threats.filter(t => t.severity === level && t.isActive).length
          return (
            <Card key={level} className="liquid-glass-medium border-gray-600/30">
              <CardContent className="p-4 text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  level === 'emergency' ? 'bg-red-600 animate-pulse' :
                  level === 'critical' ? 'bg-red-500' :
                  level === 'high' ? 'bg-orange-500' :
                  level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-sm text-gray-400 capitalize">{level}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Active Threats List */}
      <div className="space-y-4">
        {threats.filter(t => t.isActive).map(threat => (
          <Card key={threat.id} className="liquid-glass-medium border-gray-600/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <AlertTriangle className={`w-6 h-6 mt-1 ${
                    threat.severity === 'emergency' ? 'text-red-600' :
                    threat.severity === 'critical' ? 'text-red-500' :
                    threat.severity === 'high' ? 'text-orange-500' :
                    threat.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{threat.title}</h3>
                      <Badge variant="outline" className="capitalize">
                        {threat.severity}
                      </Badge>
                    </div>
                    <p className="text-gray-300 mb-3">{threat.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span>Timeline: {threat.timeline}</span>
                      <span>Confidence: {threat.confidence}%</span>
                      <span>Type: {threat.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                  <Button size="sm" className="liquid-glass-neon">
                    Take Action
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface IntelligenceFeedViewProps {
  feeds: IntelligenceFeed[]
}

function IntelligenceFeedView({ feeds }: IntelligenceFeedViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Intelligence Feeds</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter Sources
          </Button>
          <Button variant="outline" size="sm">
            Mark All Read
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {feeds.map(feed => (
          <Card key={feed.id} className="liquid-glass-medium border-gray-600/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    feed.impact === 'critical' ? 'bg-red-500' :
                    feed.impact === 'negative' ? 'bg-orange-500' :
                    feed.impact === 'positive' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <Badge variant="outline" className="text-xs">
                    {feed.source}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(feed.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <Badge variant={feed.urgency === 'high' ? 'destructive' : 'secondary'}>
                  {feed.urgency}
                </Badge>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">{feed.title}</h3>
              <p className="text-gray-300 mb-4">{feed.summary}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {feed.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {feed.actionRequired && (
                  <Button size="sm" className="liquid-glass-neon">
                    <Bell className="w-4 h-4 mr-2" />
                    Action Required
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface CommunityIntelligenceViewProps {
  data: CommunityIntelligence | null
}

function CommunityIntelligenceView({ data }: CommunityIntelligenceViewProps) {
  if (!data) {
    return (
      <div className="liquid-glass-medium rounded-2xl p-8 text-center">
        <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Community Intelligence</h3>
        <p className="text-gray-400">Loading community data...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Community Intelligence</h2>
        <Badge variant="outline" className="capitalize">
          Risk Level: {data.riskLevel}
        </Badge>
      </div>
      
      {/* Community Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="liquid-glass-medium border-blue-500/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">{data.activeIncidents.length}</p>
            <p className="text-sm text-gray-400">Active Incidents</p>
          </CardContent>
        </Card>
        
        <Card className="liquid-glass-medium border-green-500/20">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">{data.contractorAvailability.length}</p>
            <p className="text-sm text-gray-400">Available Contractors</p>
          </CardContent>
        </Card>
        
        <Card className="liquid-glass-medium border-purple-500/20">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">{data.communicationChannels.length}</p>
            <p className="text-sm text-gray-400">Communication Channels</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Incidents */}
      {data.activeIncidents.length > 0 && (
        <Card className="liquid-glass-medium border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-white">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.activeIncidents.slice(0, 3).map((incident: any) => (
                <div key={incident.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{incident.description}</p>
                    <p className="text-sm text-gray-400">
                      {incident.location.address} • {new Date(incident.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={incident.verified ? 'default' : 'secondary'}>
                    {incident.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface EmergencyProtocolsViewProps {
  emergencyMode: boolean
  urgentActions: ActionItem[]
  activeThreat: ThreatAssessment | undefined
}

function EmergencyProtocolsView({ emergencyMode, urgentActions, activeThreat }: EmergencyProtocolsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Emergency Protocols</h2>
        <Badge variant={emergencyMode ? 'destructive' : 'secondary'} className="animate-pulse">
          {emergencyMode ? 'EMERGENCY ACTIVE' : 'STANDBY'}
        </Badge>
      </div>
      
      {emergencyMode && activeThreat && (
        <Card className="liquid-glass-medium border-red-500/50 bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Siren className="w-6 h-6 text-red-500 animate-pulse" />
              <h3 className="text-xl font-bold text-red-400">EMERGENCY PROTOCOL ACTIVE</h3>
            </div>
            <p className="text-white mb-4">{activeThreat.title}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-red-400 font-semibold">Timeline:</p>
                <p className="text-white">{activeThreat.timeline}</p>
              </div>
              <div>
                <p className="text-red-400 font-semibold">Severity:</p>
                <p className="text-white capitalize">{activeThreat.severity}</p>
              </div>
              <div>
                <p className="text-red-400 font-semibold">Confidence:</p>
                <p className="text-white">{activeThreat.confidence}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Emergency Actions */}
      <Card className="liquid-glass-medium border-gray-600/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Urgent Actions ({urgentActions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {urgentActions.length > 0 ? (
            <div className="space-y-3">
              {urgentActions.map(action => (
                <div key={action.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">{action.title}</h4>
                    <p className="text-sm text-gray-400">{action.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Priority: {action.priority}</span>
                      <span>Est. Time: {action.estimatedTime}min</span>
                    </div>
                  </div>
                  <Button size="sm" className="liquid-glass-neon">
                    Execute
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No urgent actions at this time</p>
          )}
        </CardContent>
      </Card>
      
      {/* Emergency Contacts */}
      <Card className="liquid-glass-medium border-gray-600/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-400" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: '911 Emergency', phone: '911', type: 'Emergency Services' },
              { name: 'Insurance Hotline', phone: '1-800-STATE-FM', type: 'Insurance' },
              { name: 'Property Manager', phone: '(555) 123-4567', type: 'Property' },
              { name: 'Emergency Contractor', phone: '(555) 987-6543', type: 'Contractor' }
            ].map((contact, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <div>
                  <p className="text-white font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-400">{contact.type}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  {contact.phone}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== PANEL COMPONENTS =====

interface ThreatMonitorPanelProps {
  threats: ThreatAssessment[]
}

function ThreatMonitorPanel({ threats }: ThreatMonitorPanelProps) {
  return (
    <Card className="liquid-glass-medium border-red-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Active Threats ({threats.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {threats.length > 0 ? (
          <div className="space-y-3">
            {threats.map(threat => (
              <div key={threat.id} className="p-4 bg-black/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium">{threat.title}</h4>
                  <Badge variant="outline" className="capitalize">
                    {threat.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{threat.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Timeline: {threat.timeline}</span>
                  <Button size="sm" variant="outline">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No active threats detected</p>
        )}
      </CardContent>
    </Card>
  )
}

interface IntelligenceFeedPanelProps {
  feeds: IntelligenceFeed[]
}

function IntelligenceFeedPanel({ feeds }: IntelligenceFeedPanelProps) {
  return (
    <Card className="liquid-glass-medium border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-400" />
          Intelligence Feeds
        </CardTitle>
      </CardHeader>
      <CardContent>
        {feeds.length > 0 ? (
          <div className="space-y-3">
            {feeds.slice(0, 5).map(feed => (
              <div key={feed.id} className="p-3 bg-black/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {feed.source}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(feed.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <h5 className="text-sm font-medium text-white mb-1">{feed.title}</h5>
                <p className="text-xs text-gray-400">{feed.summary}</p>
                {feed.actionRequired && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    Action Required
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No recent intelligence feeds</p>
        )}
      </CardContent>
    </Card>
  )
}

interface AIRecommendationsPanelProps {
  recommendations: AIRecommendation[]
}

function AIRecommendationsPanel({ recommendations }: AIRecommendationsPanelProps) {
  return (
    <Card className="liquid-glass-medium border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          AI Recommendations ({recommendations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map(rec => (
              <div key={rec.id} className="p-4 bg-black/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium">{rec.title}</h4>
                  <Badge 
                    variant={rec.priority === 'urgent' || rec.priority === 'immediate' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{rec.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Confidence: {rec.confidence}%</span>
                  <Button size="sm" className="liquid-glass-neon">
                    Execute
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No recommendations available</p>
        )}
      </CardContent>
    </Card>
  )
}

interface QuickActionsPanelProps {
  urgentActions: ActionItem[]
}

function QuickActionsPanel({ urgentActions }: QuickActionsPanelProps) {
  return (
    <Card className="liquid-glass-medium border-orange-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-400" />
          Quick Actions ({urgentActions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {urgentActions.length > 0 ? (
          <div className="space-y-3">
            {urgentActions.map(action => (
              <div key={action.id} className="p-4 bg-black/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium">{action.title}</h4>
                  <Badge 
                    variant={action.priority === 'urgent' || action.priority === 'immediate' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {action.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{action.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Est. {action.estimatedTime}min</span>
                  <Button size="sm" variant="outline">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No urgent actions</p>
        )}
      </CardContent>
    </Card>
  )
}
