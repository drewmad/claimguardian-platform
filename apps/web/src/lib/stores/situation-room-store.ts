/**
 * @fileMetadata
 * @purpose Zustand store for Situation Room state management
 * @owner frontend-team
 * @dependencies ["zustand", "immer", "@/types/situation-room"]
 * @exports ["useSituationRoom"]
 * @complexity high
 * @tags ["situation-room", "state", "zustand"]
 * @status active
 */
'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'

import type {
  SituationRoomState,
  ThreatAssessment,
  IntelligenceFeed,
  PropertyStatus,
  CommunityIntelligence,
  AIRecommendation,
  RealtimeEvent,
  ActionItem,
  ThreatLevel,
  EventType,
  ActionStatus,
  EmergencyContact,
  EvacuationPlan,
  ThreatMonitoringConfig
} from '@/types/situation-room'

interface SituationRoomActions {
  // Data loading actions
  loadSituationData: (propertyId: string) => Promise<void>
  refreshThreatAssessment: () => Promise<void>
  refreshIntelligenceFeeds: () => Promise<void>
  refreshPropertyStatus: () => Promise<void>
  refreshCommunityIntel: () => Promise<void>
  
  // Threat management
  addThreat: (threat: ThreatAssessment) => void
  updateThreat: (threatId: string, updates: Partial<ThreatAssessment>) => void
  dismissThreat: (threatId: string) => void
  acknowledgeThreat: (threatId: string) => void
  
  // Intelligence feeds
  addIntelligenceFeed: (feed: IntelligenceFeed) => void
  markFeedAsRead: (feedId: string) => void
  markAllFeedsAsRead: () => void
  filterFeeds: (filter: any) => void
  
  // AI recommendations
  addRecommendation: (recommendation: AIRecommendation) => void
  executeRecommendation: (recommendationId: string) => Promise<void>
  dismissRecommendation: (recommendationId: string) => void
  
  // Action management
  addAction: (action: ActionItem) => void
  updateActionStatus: (actionId: string, status: ActionStatus) => void
  completeAction: (actionId: string) => void
  scheduleAction: (actionId: string, scheduledDate: Date) => void
  
  // Real-time events
  addRealtimeEvent: (event: RealtimeEvent) => void
  markEventAsProcessed: (eventId: string) => void
  clearProcessedEvents: () => void
  
  // Emergency protocols
  activateEmergencyMode: () => void
  deactivateEmergencyMode: () => void
  updateEmergencyContacts: (contacts: EmergencyContact[]) => void
  setEvacuationPlan: (plan: EvacuationPlan) => void
  
  // System controls
  setConnectionStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

type SituationRoomStore = SituationRoomState & SituationRoomActions

const initialState: SituationRoomState = {
  // Core threat monitoring
  threats: [],
  overallThreatLevel: ThreatLevel.LOW,
  activeThreatCount: 0,
  
  // Intelligence feeds
  intelligenceFeeds: [],
  unreadFeedCount: 0,
  
  // Property status
  propertyStatus: null,
  systemsOnline: 0,
  totalSystems: 0,
  
  // Community intelligence
  communityIntel: null,
  neighborhoodThreatLevel: ThreatLevel.LOW,
  
  // AI recommendations
  aiRecommendations: [],
  pendingActions: [],
  completedActions: [],
  
  // Real-time events
  realtimeEvents: [],
  eventSubscriptions: [],
  
  // Emergency protocols
  emergencyMode: false,
  emergencyContacts: [],
  evacuationPlan: null,
  
  // System status
  isLoading: false,
  lastUpdate: null,
  connectionStatus: 'disconnected',
  error: null
}

export const useSituationRoom = create<SituationRoomStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,
      
      // ===== DATA LOADING ACTIONS =====
      
      async loadSituationData(propertyId: string) {
        set(state => {
          state.isLoading = true
          state.error = null
        })
        
        try {
          // Simulate API calls - replace with actual API integration
          const [
            threatResponse,
            intelligenceResponse,
            propertyResponse,
            communityResponse,
            recommendationsResponse
          ] = await Promise.all([
            fetchThreatAssessment(propertyId),
            fetchIntelligenceFeeds(propertyId),
            fetchPropertyStatus(propertyId),
            fetchCommunityIntelligence(propertyId),
            fetchAIRecommendations(propertyId)
          ])
          
          set(state => {
            state.threats = threatResponse.threats
            state.overallThreatLevel = threatResponse.overallLevel
            state.activeThreatCount = threatResponse.threats.filter(t => t.isActive).length
            
            state.intelligenceFeeds = intelligenceResponse.feeds
            state.unreadFeedCount = intelligenceResponse.feeds.length
            
            state.propertyStatus = propertyResponse.status
            state.systemsOnline = propertyResponse.systemsOnline
            state.totalSystems = propertyResponse.totalSystems
            
            state.communityIntel = communityResponse.intelligence
            state.neighborhoodThreatLevel = communityResponse.threatLevel
            
            state.aiRecommendations = recommendationsResponse.recommendations
            state.pendingActions = recommendationsResponse.actions.filter(a => 
              a.status === ActionStatus.PENDING || a.status === ActionStatus.IN_PROGRESS
            )
            state.completedActions = recommendationsResponse.actions.filter(a => 
              a.status === ActionStatus.COMPLETED
            )
            
            state.lastUpdate = new Date()
            state.isLoading = false
          })
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to load situation data'
            state.isLoading = false
          })
        }
      },
      
      async refreshThreatAssessment() {
        try {
          const response = await fetchThreatAssessment(getCurrentPropertyId())
          set(state => {
            state.threats = response.threats
            state.overallThreatLevel = response.overallLevel
            state.activeThreatCount = response.threats.filter(t => t.isActive).length
          })
        } catch (error) {
          console.error('Failed to refresh threat assessment:', error)
        }
      },
      
      async refreshIntelligenceFeeds() {
        try {
          const response = await fetchIntelligenceFeeds(getCurrentPropertyId())
          set(state => {
            state.intelligenceFeeds = response.feeds
            state.unreadFeedCount = response.feeds.filter(f => !f.actionRequired).length
          })
        } catch (error) {
          console.error('Failed to refresh intelligence feeds:', error)
        }
      },
      
      async refreshPropertyStatus() {
        try {
          const response = await fetchPropertyStatus(getCurrentPropertyId())
          set(state => {
            state.propertyStatus = response.status
            state.systemsOnline = response.systemsOnline
            state.totalSystems = response.totalSystems
          })
        } catch (error) {
          console.error('Failed to refresh property status:', error)
        }
      },
      
      async refreshCommunityIntel() {
        try {
          const response = await fetchCommunityIntelligence(getCurrentPropertyId())
          set(state => {
            state.communityIntel = response.intelligence
            state.neighborhoodThreatLevel = response.threatLevel
          })
        } catch (error) {
          console.error('Failed to refresh community intelligence:', error)
        }
      },
      
      // ===== THREAT MANAGEMENT ACTIONS =====
      
      addThreat(threat: ThreatAssessment) {
        set(state => {
          state.threats.unshift(threat)
          state.activeThreatCount = state.threats.filter(t => t.isActive).length
          
          // Update overall threat level based on highest active threat
          const activeThreatLevels = state.threats
            .filter(t => t.isActive)
            .map(t => getThreatLevelValue(t.severity))
          
          if (activeThreatLevels.length > 0) {
            const maxLevel = Math.max(...activeThreatLevels)
            state.overallThreatLevel = getThreatLevelFromValue(maxLevel)
          } else {
            state.overallThreatLevel = ThreatLevel.LOW
          }
        })
      },
      
      updateThreat(threatId: string, updates: Partial<ThreatAssessment>) {
        set(state => {
          const index = state.threats.findIndex(t => t.id === threatId)
          if (index !== -1) {
            state.threats[index] = { ...state.threats[index], ...updates }
            state.activeThreatCount = state.threats.filter(t => t.isActive).length
          }
        })
      },
      
      dismissThreat(threatId: string) {
        set(state => {
          const index = state.threats.findIndex(t => t.id === threatId)
          if (index !== -1) {
            state.threats[index].isActive = false
            state.activeThreatCount = state.threats.filter(t => t.isActive).length
          }
        })
      },
      
      acknowledgeThreat(threatId: string) {
        set(state => {
          const index = state.threats.findIndex(t => t.id === threatId)
          if (index !== -1) {
            // Add acknowledged flag to threat
            state.threats[index] = {
              ...state.threats[index],
              aiAnalysis: {
                ...state.threats[index].aiAnalysis,
                // @ts-ignore - adding acknowledged property
                acknowledged: true,
                acknowledgedAt: new Date()
              }
            }
          }
        })
      },
      
      // ===== INTELLIGENCE FEED ACTIONS =====
      
      addIntelligenceFeed(feed: IntelligenceFeed) {
        set(state => {
          state.intelligenceFeeds.unshift(feed)
          if (!feed.actionRequired) {
            state.unreadFeedCount += 1
          }
          
          // Keep only last 50 feeds
          if (state.intelligenceFeeds.length > 50) {
            state.intelligenceFeeds = state.intelligenceFeeds.slice(0, 50)
          }
        })
      },
      
      markFeedAsRead(feedId: string) {
        set(state => {
          const index = state.intelligenceFeeds.findIndex(f => f.id === feedId)
          if (index !== -1 && !state.intelligenceFeeds[index].actionRequired) {
            // @ts-ignore - adding read property
            state.intelligenceFeeds[index].read = true
            state.unreadFeedCount = Math.max(0, state.unreadFeedCount - 1)
          }
        })
      },
      
      markAllFeedsAsRead() {
        set(state => {
          state.intelligenceFeeds.forEach(feed => {
            if (!feed.actionRequired) {
              // @ts-ignore - adding read property
              feed.read = true
            }
          })
          state.unreadFeedCount = 0
        })
      },
      
      filterFeeds(filter: any) {
        // Implementation for feed filtering
        // This would typically filter the displayed feeds without modifying state
        console.log('Filter feeds:', filter)
      },
      
      // ===== AI RECOMMENDATION ACTIONS =====
      
      addRecommendation(recommendation: AIRecommendation) {
        set(state => {
          state.aiRecommendations.unshift(recommendation)
          
          // Add associated actions to pending actions
          recommendation.actions.forEach(action => {
            if (!state.pendingActions.find(a => a.id === action.id)) {
              state.pendingActions.push(action)
            }
          })
        })
      },
      
      async executeRecommendation(recommendationId: string) {
        const recommendation = get().aiRecommendations.find(r => r.id === recommendationId)
        if (!recommendation) return
        
        try {
          // Execute recommendation actions
          for (const action of recommendation.actions) {
            await executeAction(action)
            get().updateActionStatus(action.id, ActionStatus.COMPLETED)
          }
          
          // Mark recommendation as executed
          set(state => {
            const index = state.aiRecommendations.findIndex(r => r.id === recommendationId)
            if (index !== -1) {
              // @ts-ignore - adding executed property
              state.aiRecommendations[index].executed = true
              state.aiRecommendations[index].executedAt = new Date()
            }
          })
        } catch (error) {
          console.error('Failed to execute recommendation:', error)
          set(state => {
            state.error = `Failed to execute recommendation: ${error}`
          })
        }
      },
      
      dismissRecommendation(recommendationId: string) {
        set(state => {
          const index = state.aiRecommendations.findIndex(r => r.id === recommendationId)
          if (index !== -1) {
            // @ts-ignore - adding dismissed property
            state.aiRecommendations[index].dismissed = true
            state.aiRecommendations[index].dismissedAt = new Date()
          }
        })
      },
      
      // ===== ACTION MANAGEMENT ACTIONS =====
      
      addAction(action: ActionItem) {
        set(state => {
          if (action.status === ActionStatus.COMPLETED) {
            state.completedActions.push(action)
          } else {
            state.pendingActions.push(action)
          }
        })
      },
      
      updateActionStatus(actionId: string, status: ActionStatus) {
        set(state => {
          // Check pending actions
          const pendingIndex = state.pendingActions.findIndex(a => a.id === actionId)
          if (pendingIndex !== -1) {
            state.pendingActions[pendingIndex].status = status
            
            if (status === ActionStatus.COMPLETED) {
              const completedAction = state.pendingActions.splice(pendingIndex, 1)[0]
              completedAction.completedAt = new Date()
              state.completedActions.push(completedAction)
            }
          }
          
          // Check completed actions
          const completedIndex = state.completedActions.findIndex(a => a.id === actionId)
          if (completedIndex !== -1) {
            state.completedActions[completedIndex].status = status
          }
        })
      },
      
      completeAction(actionId: string) {
        get().updateActionStatus(actionId, ActionStatus.COMPLETED)
      },
      
      scheduleAction(actionId: string, scheduledDate: Date) {
        set(state => {
          const pendingIndex = state.pendingActions.findIndex(a => a.id === actionId)
          if (pendingIndex !== -1) {
            state.pendingActions[pendingIndex].deadline = scheduledDate
          }
        })
      },
      
      // ===== REAL-TIME EVENT ACTIONS =====
      
      addRealtimeEvent(event: RealtimeEvent) {
        set(state => {
          state.realtimeEvents.unshift(event)
          
          // Keep only last 100 events
          if (state.realtimeEvents.length > 100) {
            state.realtimeEvents = state.realtimeEvents.slice(0, 100)
          }
          
          // Auto-process certain event types
          if (event.autoProcessed) {
            get().processRealtimeEvent(event)
          }
        })
      },
      
      markEventAsProcessed(eventId: string) {
        set(state => {
          const index = state.realtimeEvents.findIndex(e => e.id === eventId)
          if (index !== -1) {
            // @ts-ignore - adding processed property
            state.realtimeEvents[index].processed = true
            state.realtimeEvents[index].processedAt = new Date()
          }
        })
      },
      
      clearProcessedEvents() {
        set(state => {
          // @ts-ignore - filtering by processed property
          state.realtimeEvents = state.realtimeEvents.filter(e => !e.processed)
        })
      },
      
      // ===== EMERGENCY PROTOCOL ACTIONS =====
      
      activateEmergencyMode() {
        set(state => {
          state.emergencyMode = true
        })
        
        // Trigger emergency protocols
        triggerEmergencyProtocols()
      },
      
      deactivateEmergencyMode() {
        set(state => {
          state.emergencyMode = false
        })
      },
      
      updateEmergencyContacts(contacts: EmergencyContact[]) {
        set(state => {
          state.emergencyContacts = contacts
        })
      },
      
      setEvacuationPlan(plan: EvacuationPlan) {
        set(state => {
          state.evacuationPlan = plan
        })
      },
      
      // ===== SYSTEM CONTROL ACTIONS =====
      
      setConnectionStatus(status: 'connected' | 'reconnecting' | 'disconnected') {
        set(state => {
          state.connectionStatus = status
        })
      },
      
      setError(error: string | null) {
        set(state => {
          state.error = error
        })
      },
      
      clearError() {
        set(state => {
          state.error = null
        })
      },
      
      reset() {
        set(() => ({ ...initialState }))
      },
      
      // ===== INTERNAL HELPER METHODS =====
      
      processRealtimeEvent(event: RealtimeEvent) {
        // Auto-process certain event types
        switch (event.type) {
          case EventType.THREAT_UPDATE:
            if (event.data.threat) {
              get().addThreat(event.data.threat)
            }
            break
          case EventType.INTELLIGENCE_FEED:
            if (event.data.feed) {
              get().addIntelligenceFeed(event.data.feed)
            }
            break
          case EventType.AI_RECOMMENDATION:
            if (event.data.recommendation) {
              get().addRecommendation(event.data.recommendation)
            }
            break
          case EventType.EMERGENCY_BROADCAST:
            if (event.data.emergency) {
              get().activateEmergencyMode()
            }
            break
        }
      }
    }))
  )
)

// ===== HELPER FUNCTIONS =====

function getThreatLevelValue(level: ThreatLevel): number {
  switch (level) {
    case ThreatLevel.LOW: return 1
    case ThreatLevel.MEDIUM: return 2
    case ThreatLevel.HIGH: return 3
    case ThreatLevel.CRITICAL: return 4
    case ThreatLevel.EMERGENCY: return 5
    default: return 1
  }
}

function getThreatLevelFromValue(value: number): ThreatLevel {
  switch (value) {
    case 1: return ThreatLevel.LOW
    case 2: return ThreatLevel.MEDIUM
    case 3: return ThreatLevel.HIGH
    case 4: return ThreatLevel.CRITICAL
    case 5: return ThreatLevel.EMERGENCY
    default: return ThreatLevel.LOW
  }
}

function getCurrentPropertyId(): string {
  // This would get the current property ID from auth context or URL
  return 'current-property-id'
}

async function executeAction(action: ActionItem): Promise<void> {
  // This would execute the specific action
  console.log('Executing action:', action.title)
  
  // Simulate action execution
  await new Promise(resolve => setTimeout(resolve, 1000))
}

function triggerEmergencyProtocols(): void {
  // This would trigger emergency protocols
  console.log('Emergency protocols activated')
}

// ===== API SIMULATION FUNCTIONS =====
// These would be replaced with actual API calls

async function fetchThreatAssessment(propertyId: string): Promise<any> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    threats: [
      {
        id: 'threat-1',
        type: 'weather',
        severity: ThreatLevel.HIGH,
        title: 'Hurricane Watch',
        description: 'Hurricane Debby approaching with Category 2 strength',
        timeline: '48-72 hours',
        timeWindow: {
          start: new Date(),
          peak: new Date(Date.now() + 48 * 60 * 60 * 1000),
          end: new Date(Date.now() + 96 * 60 * 60 * 1000)
        },
        confidence: 85,
        impactRadius: 50,
        affectedProperties: [propertyId],
        actions: [],
        sources: [],
        aiAnalysis: {
          overallRisk: 75,
          primaryThreat: 'High winds and storm surge',
          secondaryThreats: ['Power outages', 'Flooding'],
          riskProjection: [],
          recommendations: [],
          modelConfidence: 85,
          processingTime: 2500,
          agentsUsed: ['weather-analyzer', 'risk-predictor']
        },
        lastUpdated: new Date(),
        isActive: true
      }
    ],
    overallLevel: ThreatLevel.HIGH
  }
}

async function fetchIntelligenceFeeds(propertyId: string): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 800))
  
  return {
    feeds: [
      {
        id: 'feed-1',
        source: 'National Weather Service',
        type: 'weather_update',
        title: 'Hurricane Watch Extended',
        content: 'Hurricane watch has been extended to include your area. Expected landfall in 48-72 hours.',
        summary: 'Hurricane watch extended for your area',
        impact: 'negative',
        urgency: ThreatLevel.HIGH,
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        tags: ['hurricane', 'weather', 'emergency'],
        relatedThreats: ['threat-1'],
        actionRequired: true
      }
    ]
  }
}

async function fetchPropertyStatus(propertyId: string): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 600))
  
  return {
    status: {
      propertyId,
      overallHealth: 95,
      lastInspection: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      systems: [],
      alerts: [],
      maintenanceSchedule: [],
      insuranceStatus: {
        policyActive: true,
        coverageLevel: 100,
        premiumStatus: 'current',
        claimsHistory: [],
        rateChanges: [],
        renewalDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        alerts: []
      },
      securityStatus: {
        systemArmed: true,
        sensorsActive: 12,
        alertsActive: [],
        emergencyContacts: []
      }
    },
    systemsOnline: 8,
    totalSystems: 8
  }
}

async function fetchCommunityIntelligence(propertyId: string): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 700))
  
  return {
    intelligence: {
      neighborhoodId: 'neighborhood-1',
      riskLevel: ThreatLevel.MEDIUM,
      activeIncidents: [],
      contractorAvailability: [],
      marketTrends: [],
      sharedResources: [],
      communicationChannels: []
    },
    threatLevel: ThreatLevel.MEDIUM
  }
}

async function fetchAIRecommendations(propertyId: string): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 900))
  
  return {
    recommendations: [
      {
        id: 'rec-1',
        title: 'Secure Outdoor Items',
        description: 'Remove or secure outdoor furniture and decorations before hurricane arrives',
        reasoning: 'High winds can turn outdoor items into projectiles causing property damage',
        priority: 'urgent',
        confidence: 95,
        category: 'preparation',
        estimatedImpact: 'Prevents potential $5,000-$15,000 in damage',
        timeframe: 'Complete within 24 hours',
        actions: [],
        alternatives: []
      }
    ],
    actions: []
  }
}