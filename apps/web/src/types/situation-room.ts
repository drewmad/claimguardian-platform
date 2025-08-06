/**
 * @fileMetadata
 * @purpose "Defines TypeScript types and enums for the real-time Situation Room feature."
 * @dependencies []
 * @owner frontend-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "Type definitions for Situation Room real-time threat monitoring"
 * @owner frontend-team
 * @dependencies ["react"]
 * @exports ["ThreatAssessment", "IntelligenceFeed", "SituationRoomState"]
 * @complexity high
 * @tags ["situation-room", "types", "real-time"]
 * @status stable
 */

// ===== CORE THREAT ASSESSMENT TYPES =====

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export enum ThreatType {
  WEATHER = 'weather',
  MARKET = 'market',
  PROPERTY = 'property',
  COMMUNITY = 'community',
  ENVIRONMENTAL = 'environmental',
  SECURITY = 'security'
}

export interface ThreatAssessment {
  id: string
  type: ThreatType
  severity: ThreatLevel
  title: string
  description: string
  timeline: string
  timeWindow: {
    start: Date
    peak: Date
    end: Date
  }
  confidence: number // 0-100
  impactRadius: number // miles
  affectedProperties: string[]
  actions: ActionItem[]
  sources: DataSource[]
  aiAnalysis: AIThreatAnalysis
  lastUpdated: Date
  isActive: boolean
  location?: {
    coordinates: [number, number] // [longitude, latitude]
    address?: string
    zipCode?: string
    county?: string
  }
  radius?: number // threat radius in meters
}

export interface AIThreatAnalysis {
  overallRisk: number // 0-100
  primaryThreat: string
  secondaryThreats: string[]
  riskProjection: RiskProjection[]
  recommendations: AIRecommendation[]
  modelConfidence: number
  processingTime: number
  agentsUsed: string[]
}

export interface RiskProjection {
  timestamp: Date
  riskLevel: number
  factors: string[]
  confidence: number
}

// ===== INTELLIGENCE FEED TYPES =====

export enum IntelligenceType {
  WEATHER_UPDATE = 'weather_update',
  MARKET_ANALYSIS = 'market_analysis',
  REGULATORY_CHANGE = 'regulatory_change',
  COMMUNITY_REPORT = 'community_report',
  PROPERTY_ALERT = 'property_alert',
  EMERGENCY_BROADCAST = 'emergency_broadcast'
}

export enum ImpactLevel {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  CRITICAL = 'critical'
}

export interface IntelligenceFeed {
  id: string
  source: string
  type: IntelligenceType
  title: string
  content: string
  summary: string
  impact: ImpactLevel
  urgency: ThreatLevel
  timestamp: Date
  location?: {
    lat: number
    lng: number
    radius: number
  }
  tags: string[]
  relatedThreats: string[]
  actionRequired: boolean
  expiresAt?: Date
}

export interface DataSource {
  name: string
  type: 'api' | 'sensor' | 'user_report' | 'ai_analysis'
  reliability: number // 0-100
  lastUpdate: Date
  status: 'active' | 'degraded' | 'offline'
}

// ===== ACTION AND RECOMMENDATION TYPES =====

export enum ActionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  IMMEDIATE = 'immediate'
}

export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed'
}

export interface ActionItem {
  id: string
  title: string
  description: string
  priority: ActionPriority
  status: ActionStatus
  category: 'preparation' | 'documentation' | 'communication' | 'evacuation' | 'recovery'
  estimatedTime: number // minutes
  deadline?: Date
  dependencies: string[]
  resources: ActionResource[]
  automationAvailable: boolean
  completedAt?: Date
}

export interface ActionResource {
  type: 'contact' | 'document' | 'tool' | 'service'
  name: string
  identifier: string // phone, url, tool_id, etc.
  description: string
}

export interface AIRecommendation {
  id: string
  title: string
  description: string
  reasoning: string
  priority: ActionPriority
  confidence: number
  category: string
  estimatedImpact: string
  timeframe: string
  actions: ActionItem[]
  alternatives: string[]
  executedAt?: Date
  dismissedAt?: Date
}

// ===== PROPERTY STATUS TYPES =====

export interface PropertyStatus {
  propertyId: string
  overallHealth: number // 0-100
  lastInspection: Date
  systems: PropertySystem[]
  alerts: PropertyAlert[]
  maintenanceSchedule: MaintenanceItem[]
  insuranceStatus: InsuranceStatus
  securityStatus: SecurityStatus
}

export interface PropertySystem {
  id: string
  name: string
  type: 'hvac' | 'electrical' | 'plumbing' | 'security' | 'structural'
  status: 'operational' | 'degraded' | 'offline' | 'maintenance_required'
  health: number // 0-100
  lastMaintenance: Date
  nextMaintenance: Date
  alerts: string[]
  sensors: SystemSensor[]
}

export interface SystemSensor {
  id: string
  type: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  lastReading: Date
}

export interface PropertyAlert {
  id: string
  type: 'maintenance' | 'security' | 'environmental' | 'warranty'
  severity: ThreatLevel
  title: string
  description: string
  timestamp: Date
  resolved: boolean
  actions: ActionItem[]
}

export interface MaintenanceItem {
  id: string
  title: string
  description: string
  type: 'preventive' | 'corrective' | 'predictive'
  priority: ActionPriority
  scheduledDate: Date
  estimatedCost: number
  contractor?: string
  status: ActionStatus
}

export interface InsuranceStatus {
  policyActive: boolean
  coverageLevel: number // 0-100
  premiumStatus: 'current' | 'overdue' | 'lapsed'
  claimsHistory: ClaimSummary[]
  rateChanges: RateChange[]
  renewalDate: Date
  alerts: string[]
}

export interface ClaimSummary {
  id: string
  type: string
  status: string
  amount: number
  dateOpened: Date
  dateClosed?: Date
}

export interface RateChange {
  effectiveDate: Date
  changePercent: number
  reason: string
  impact: ImpactLevel
}

export interface SecurityStatus {
  systemArmed: boolean
  sensorsActive: number
  lastBreach?: Date
  alertsActive: SecurityAlert[]
  emergencyContacts: EmergencyContact[]
}

export interface SecurityAlert {
  id: string
  type: 'intrusion' | 'fire' | 'flood' | 'medical'
  timestamp: Date
  location: string
  severity: ThreatLevel
  responded: boolean
}

export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  primaryPhone: string
  alternatePhone?: string
  address?: string
  priority: number
}

// ===== COMMUNITY INTELLIGENCE TYPES =====

export interface CommunityIntelligence {
  neighborhoodId: string
  riskLevel: ThreatLevel
  activeIncidents: CommunityIncident[]
  contractorAvailability: ContractorStatus[]
  marketTrends: MarketTrend[]
  sharedResources: SharedResource[]
  communicationChannels: CommunicationChannel[]
}

export interface CommunityIncident {
  id: string
  type: 'damage' | 'outage' | 'emergency' | 'advisory'
  description: string
  location: {
    lat: number
    lng: number
    address: string
  }
  severity: ThreatLevel
  timestamp: Date
  reporter: string
  verified: boolean
  responses: IncidentResponse[]
}

export interface IncidentResponse {
  id: string
  responder: string
  timestamp: Date
  response: string
  helpful: number
  verified: boolean
}

export interface ContractorStatus {
  id: string
  name: string
  specialty: string[]
  availability: 'available' | 'busy' | 'emergency_only' | 'unavailable'
  rating: number
  responseTime: string
  location: string
  certifications: string[]
}

export interface MarketTrend {
  category: 'insurance_rates' | 'property_values' | 'contractor_costs' | 'material_costs'
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  changePercent: number
  timeframe: string
  impact: ImpactLevel
  description: string
}

export interface SharedResource {
  id: string
  type: 'equipment' | 'service' | 'expertise' | 'supplies'
  name: string
  description: string
  owner: string
  availability: 'available' | 'reserved' | 'in_use'
  cost?: number
  location: string
  conditions: string[]
}

export interface CommunicationChannel {
  id: string
  name: string
  type: 'emergency_radio' | 'neighborhood_app' | 'social_media' | 'phone_tree'
  status: 'active' | 'testing' | 'emergency_only'
  lastTest: Date
  reach: number // number of people
  instructions: string
}

// ===== REAL-TIME EVENT TYPES =====

export enum EventType {
  THREAT_UPDATE = 'threat_update',
  INTELLIGENCE_FEED = 'intelligence_feed',
  PROPERTY_ALERT = 'property_alert',
  COMMUNITY_UPDATE = 'community_update',
  EMERGENCY_BROADCAST = 'emergency_broadcast',
  SYSTEM_STATUS = 'system_status',
  AI_RECOMMENDATION = 'ai_recommendation'
}

export interface RealtimeEvent {
  id: string
  type: EventType
  timestamp: Date
  data: unknown
  priority: ActionPriority
  requiresAttention: boolean
  autoProcessed: boolean
  source: string
  processedAt?: Date
}

// ===== SITUATION ROOM STATE TYPES =====

export interface SituationRoomState {
  // Core threat monitoring
  threats: ThreatAssessment[]
  overallThreatLevel: ThreatLevel
  activeThreatCount: number
  
  // Intelligence feeds
  intelligenceFeeds: IntelligenceFeed[]
  unreadFeedCount: number
  
  // Property status
  propertyStatus: PropertyStatus | null
  systemsOnline: number
  totalSystems: number
  
  // Community intelligence
  communityIntel: CommunityIntelligence | null
  neighborhoodThreatLevel: ThreatLevel
  
  // AI recommendations
  aiRecommendations: AIRecommendation[]
  pendingActions: ActionItem[]
  completedActions: ActionItem[]
  
  // Real-time events
  realtimeEvents: RealtimeEvent[]
  eventSubscriptions: string[]
  
  // Emergency protocols
  emergencyMode: boolean
  emergencyContacts: EmergencyContact[]
  evacuationPlan: EvacuationPlan | null
  
  // System status
  isLoading: boolean
  lastUpdate: Date | null
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected'
  error: string | null
  
  // AI assessment status
  aiAssessmentRunning: boolean
  lastAIAssessment: Date | null
}

export interface EvacuationPlan {
  id: string
  name: string
  routes: EvacuationRoute[]
  shelters: Shelter[]
  checkpoints: Checkpoint[]
  timeline: EvacuationTimeline[]
  supplies: string[]
  contacts: EmergencyContact[]
  lastUpdated: Date
}

export interface EvacuationRoute {
  id: string
  name: string
  description: string
  startLocation: string
  endLocation: string
  distance: number
  estimatedTime: number
  waypoints: Waypoint[]
  conditions: RouteCondition[]
  alternatives: string[]
}

export interface Waypoint {
  lat: number
  lng: number
  description: string
  type: 'checkpoint' | 'hazard' | 'resource' | 'shelter'
}

export interface RouteCondition {
  type: 'road_closure' | 'flooding' | 'debris' | 'traffic'
  severity: ThreatLevel
  location: string
  description: string
  timestamp: Date
}

export interface Shelter {
  id: string
  name: string
  address: string
  capacity: number
  currentOccupancy: number
  amenities: string[]
  acceptsPets: boolean
  accessibility: string[]
  contact: string
  status: 'open' | 'full' | 'closed' | 'damaged'
}

export interface Checkpoint {
  id: string
  name: string
  location: string
  purpose: 'registration' | 'supply_distribution' | 'medical' | 'information'
  status: 'operational' | 'busy' | 'closed'
  waitTime: number // minutes
  services: string[]
}

export interface EvacuationTimeline {
  stage: string
  description: string
  trigger: string
  actions: string[]
  deadline?: Date
  completed: boolean
}

// ===== API RESPONSE TYPES =====

export interface SituationRoomResponse {
  situationAssessment: {
    overall: ThreatAssessment
    breakdown: {
      weather: unknown
      market: unknown
      property: unknown
      community: unknown
      predictions: unknown
    }
  }
  recommendations: {
    immediate: AIRecommendation[]
    shortTerm: AIRecommendation[]
    longTerm: AIRecommendation[]
  }
  intelligence: {
    feeds: IntelligenceFeed[]
    confidence: number
  }
}

export interface ThreatMonitoringConfig {
  updateInterval: number // milliseconds
  threatThresholds: Record<ThreatType, number>
  autoActions: boolean
  notificationMethods: ('push' | 'email' | 'sms')[]
  emergencyContacts: EmergencyContact[]
  monitoredSources: DataSource[]
}

// ===== UTILITY TYPES =====

export type ThreatFilter = {
  types?: ThreatType[]
  severities?: ThreatLevel[]
  timeRange?: {
    start: Date
    end: Date
  }
  location?: {
    lat: number
    lng: number
    radius: number
  }
}

export type SituationRoomView = 'overview' | 'threats' | 'intelligence' | 'community' | 'emergency'

export type NotificationPreference = {
  eventTypes: EventType[]
  methods: ('push' | 'email' | 'sms')[]
  urgencyThreshold: ThreatLevel
  quietHours: {
    start: string // HH:MM
    end: string // HH:MM
  }
}