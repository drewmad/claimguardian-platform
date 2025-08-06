/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Shared TypeScript types for ClaimGuardian Mobile offline-first architecture"
 * @dependencies ["expo-sqlite", "redux-persist"]
 * @status stable
 */

export interface Property {
  id: string
  user_id: string
  name: string
  type: 'single_family' | 'condo' | 'townhouse' | 'mobile_home' | 'commercial'
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  county: string
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
  synced: boolean
}

export interface DamageAssessment {
  id: string
  property_id: string
  assessor_id: string
  assessment_date: string
  weather_conditions?: string
  overall_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'severe'
  estimated_total_damage: number
  priority_level: 'low' | 'medium' | 'high' | 'critical'
  notes?: string
  created_at: string
  updated_at: string
  synced: boolean
}

export interface DamageItem {
  id: string
  assessment_id: string
  category: 'structural' | 'exterior' | 'interior' | 'electrical' | 'plumbing' | 'hvac' | 'other'
  location: string
  damage_type: 'water' | 'fire' | 'wind' | 'hail' | 'flood' | 'impact' | 'wear' | 'other'
  severity: 'minor' | 'moderate' | 'major' | 'total_loss'
  description: string
  estimated_cost: number
  repair_priority: 'low' | 'medium' | 'high' | 'emergency'
  measurements?: {
    length?: number
    width?: number
    height?: number
    area?: number
  }
  created_at: string
  updated_at: string
  synced: boolean
}

export interface Photo {
  id: string
  assessment_id?: string
  damage_item_id?: string
  local_uri: string
  remote_url?: string
  filename: string
  file_size: number
  mime_type: string
  width: number
  height: number
  latitude?: number
  longitude?: number
  timestamp: string
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed'
  created_at: string
  synced: boolean
}

export interface VoiceNote {
  id: string
  assessment_id?: string
  damage_item_id?: string
  local_uri: string
  remote_url?: string
  filename: string
  file_size: number
  duration_seconds: number
  transcription?: string
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed'
  created_at: string
  synced: boolean
}

export interface SyncQueue {
  id: string
  entity_type: 'property' | 'assessment' | 'damage_item' | 'photo' | 'voice_note'
  entity_id: string
  operation: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  retry_count: number
  last_error?: string
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: 'homeowner' | 'adjuster' | 'contractor' | 'admin'
  subscription_tier: 'free' | 'essential' | 'plus' | 'pro'
  preferences: {
    units: 'imperial' | 'metric'
    auto_sync: boolean
    photo_quality: 'low' | 'medium' | 'high'
    gps_enabled: boolean
  }
  last_sync: string
}

export interface AppState {
  user: User | null
  properties: Property[]
  assessments: DamageAssessment[]
  damageItems: DamageItem[]
  photos: Photo[]
  voiceNotes: VoiceNote[]
  syncQueue: SyncQueue[]
  network: {
    isConnected: boolean
    isInternetReachable: boolean
  }
  sync: {
    isAutoSyncEnabled: boolean
    lastSyncTime: string | null
    isSyncing: boolean
    syncProgress: number
  }
  camera: {
    hasPermission: boolean
    quality: 'low' | 'medium' | 'high'
  }
  location: {
    hasPermission: boolean
    current: {
      latitude: number
      longitude: number
      accuracy: number
    } | null
  }
}

export interface NetworkInfo {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string | null
}

export interface LocationData {
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface CameraResult {
  uri: string
  width: number
  height: number
  base64?: string
  type: 'image' | 'video'
  duration?: number
}

export interface SyncResult {
  success: boolean
  synced_count: number
  failed_count: number
  errors: string[]
}

export interface OfflineCapabilities {
  storage: {
    total_space_mb: number
    used_space_mb: number
    available_space_mb: number
  }
  database: {
    size_mb: number
    record_count: number
    last_backup: string
  }
  media: {
    photo_count: number
    video_count: number
    audio_count: number
    total_size_mb: number
  }
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Sync Event Types
export type SyncEventType = 
  | 'sync_started'
  | 'sync_progress' 
  | 'sync_completed'
  | 'sync_failed'
  | 'entity_synced'
  | 'entity_failed'

export interface SyncEvent {
  type: SyncEventType
  timestamp: string
  entity_type?: string
  entity_id?: string
  progress?: number
  error?: string
}

// Navigation Types
export type RootStackParamList = {
  '(tabs)': undefined
  'property/[id]': { id: string }
  'assessment/[id]': { id: string }  
  'camera': { 
    assessment_id?: string
    damage_item_id?: string
    return_screen: string
  }
  'photo-review': {
    uri: string
    assessment_id?: string
    damage_item_id?: string
  }
  'sync-status': undefined
  'settings': undefined
}

export type TabsParamList = {
  index: undefined
  properties: undefined
  assessments: undefined  
  sync: undefined
}