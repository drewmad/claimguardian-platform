/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Supabase API service for mobile sync with web platform"
 * @dependencies ["@supabase/supabase-js", "expo-secure-store"]
 * @status stable
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import type {
  Property,
  DamageAssessment,
  DamageItem,
  Photo,
  VoiceNote,
  User
} from '../types'

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tmlrvecuwgppbaynesji.supabase.co'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// Custom auth storage for Expo
const ExpoAuthStorage = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key)
  },
}

// Initialize Supabase client with custom auth storage
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export interface SyncResult<T> {
  success: boolean
  data?: T
  error?: string
  conflicts?: Array<{
    localItem: T
    remoteItem: T
    field: string
  }>
}

export interface SyncStatus {
  isOnline: boolean
  lastSyncTime?: string
  pendingUploads: number
  pendingDownloads: number
  conflictsCount: number
}

class SupabaseService {
  private client: SupabaseClient

  constructor() {
    this.client = supabase
  }

  // Authentication methods
  async signUp(email: string, password: string): Promise<{ user: any; error: any }> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    })

    return { user: data.user, error }
  }

  async signIn(email: string, password: string): Promise<{ user: any; error: any }> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })

    return { user: data.user, error }
  }

  async signOut(): Promise<{ error: any }> {
    const { error } = await this.client.auth.signOut()
    return { error }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await this.client.auth.getUser()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      updated_at: new Date().toISOString(),
      synced: true
    }
  }

  // Properties sync methods
  async syncProperties(localProperties: Property[]): Promise<SyncResult<Property[]>> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Fetch remote properties
      const { data: remoteProperties, error: fetchError } = await this.client
        .from('properties')
        .select('*')
        .eq('user_id', user.id)

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Determine what needs to be synced
      const toUpload = localProperties.filter(local => !local.synced)
      const conflicts: Array<{ localItem: Property; remoteItem: Property; field: string }> = []
      const merged: Property[] = []

      // Handle uploads (local changes to push to remote)
      for (const localProperty of toUpload) {
        const remoteProperty = remoteProperties?.find(r => r.id === localProperty.id)

        if (!remoteProperty) {
          // New property - insert
          const { data, error } = await this.client
            .from('properties')
            .insert({
              ...localProperty,
              synced: undefined // Remove local sync field
            })
            .select()
            .single()

          if (error) {
            console.error('Failed to insert property:', error)
            continue
          }

          merged.push({ ...localProperty, synced: true })
        } else {
          // Existing property - check for conflicts
          const localUpdated = new Date(localProperty.updated_at).getTime()
          const remoteUpdated = new Date(remoteProperty.updated_at).getTime()

          if (localUpdated > remoteUpdated) {
            // Local is newer - update remote
            const { data, error } = await this.client
              .from('properties')
              .update({
                ...localProperty,
                synced: undefined // Remove local sync field
              })
              .eq('id', localProperty.id)
              .select()
              .single()

            if (error) {
              console.error('Failed to update property:', error)
              continue
            }

            merged.push({ ...localProperty, synced: true })
          } else if (remoteUpdated > localUpdated) {
            // Remote is newer - potential conflict
            conflicts.push({
              localItem: localProperty,
              remoteItem: remoteProperty,
              field: 'updated_at'
            })
            merged.push({ ...remoteProperty, synced: true })
          } else {
            // Same timestamp - mark as synced
            merged.push({ ...localProperty, synced: true })
          }
        }
      }

      // Add remote properties not present locally
      const remoteOnlyProperties = remoteProperties?.filter(
        remote => !localProperties.find(local => local.id === remote.id)
      ) || []

      merged.push(...remoteOnlyProperties.map(p => ({ ...p, synced: true })))

      return {
        success: true,
        data: merged,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      }
    }
  }

  // Assessments sync methods
  async syncAssessments(localAssessments: DamageAssessment[]): Promise<SyncResult<DamageAssessment[]>> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Fetch remote assessments for user's properties
      const { data: userProperties } = await this.client
        .from('properties')
        .select('id')
        .eq('user_id', user.id)

      const propertyIds = userProperties?.map(p => p.id) || []

      if (propertyIds.length === 0) {
        return { success: true, data: [] }
      }

      const { data: remoteAssessments, error: fetchError } = await this.client
        .from('damage_assessments')
        .select('*')
        .in('property_id', propertyIds)

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Process uploads and conflicts similar to properties
      const toUpload = localAssessments.filter(local => !local.synced)
      const conflicts: Array<{ localItem: DamageAssessment; remoteItem: DamageAssessment; field: string }> = []
      const merged: DamageAssessment[] = []

      for (const localAssessment of toUpload) {
        const remoteAssessment = remoteAssessments?.find(r => r.id === localAssessment.id)

        if (!remoteAssessment) {
          // New assessment - insert
          const { data, error } = await this.client
            .from('damage_assessments')
            .insert({
              ...localAssessment,
              synced: undefined
            })
            .select()
            .single()

          if (error) {
            console.error('Failed to insert assessment:', error)
            continue
          }

          merged.push({ ...localAssessment, synced: true })
        } else {
          // Handle conflicts similar to properties
          const localUpdated = new Date(localAssessment.updated_at).getTime()
          const remoteUpdated = new Date(remoteAssessment.updated_at).getTime()

          if (localUpdated > remoteUpdated) {
            const { data, error } = await this.client
              .from('damage_assessments')
              .update({
                ...localAssessment,
                synced: undefined
              })
              .eq('id', localAssessment.id)
              .select()
              .single()

            if (!error) {
              merged.push({ ...localAssessment, synced: true })
            }
          } else if (remoteUpdated > localUpdated) {
            conflicts.push({
              localItem: localAssessment,
              remoteItem: remoteAssessment,
              field: 'updated_at'
            })
            merged.push({ ...remoteAssessment, synced: true })
          } else {
            merged.push({ ...localAssessment, synced: true })
          }
        }
      }

      // Add remote-only assessments
      const remoteOnlyAssessments = remoteAssessments?.filter(
        remote => !localAssessments.find(local => local.id === remote.id)
      ) || []

      merged.push(...remoteOnlyAssessments.map(a => ({ ...a, synced: true })))

      return {
        success: true,
        data: merged,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      }
    }
  }

  // Damage items sync methods
  async syncDamageItems(localItems: DamageItem[]): Promise<SyncResult<DamageItem[]>> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get user's assessments to filter damage items
      const { data: userAssessments } = await this.client
        .from('damage_assessments')
        .select('id')
        .eq('assessor_id', user.id)

      const assessmentIds = userAssessments?.map(a => a.id) || []

      if (assessmentIds.length === 0) {
        return { success: true, data: [] }
      }

      const { data: remoteItems, error: fetchError } = await this.client
        .from('damage_items')
        .select('*')
        .in('assessment_id', assessmentIds)

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Sync process similar to other entities
      const toUpload = localItems.filter(local => !local.synced)
      const merged: DamageItem[] = []

      for (const localItem of toUpload) {
        const remoteItem = remoteItems?.find(r => r.id === localItem.id)

        if (!remoteItem) {
          // New damage item - insert
          const { data, error } = await this.client
            .from('damage_items')
            .insert({
              ...localItem,
              measurements: localItem.measurements ? JSON.stringify(localItem.measurements) : null,
              synced: undefined
            })
            .select()
            .single()

          if (!error) {
            merged.push({ ...localItem, synced: true })
          }
        } else {
          // Update if local is newer
          const localUpdated = new Date(localItem.updated_at).getTime()
          const remoteUpdated = new Date(remoteItem.updated_at).getTime()

          if (localUpdated > remoteUpdated) {
            const { data, error } = await this.client
              .from('damage_items')
              .update({
                ...localItem,
                measurements: localItem.measurements ? JSON.stringify(localItem.measurements) : null,
                synced: undefined
              })
              .eq('id', localItem.id)
              .select()
              .single()

            if (!error) {
              merged.push({ ...localItem, synced: true })
            }
          } else {
            // Use remote version
            merged.push({
              ...remoteItem,
              measurements: remoteItem.measurements ? JSON.parse(remoteItem.measurements) : null,
              synced: true
            })
          }
        }
      }

      // Add remote-only items
      const remoteOnlyItems = remoteItems?.filter(
        remote => !localItems.find(local => local.id === remote.id)
      ) || []

      merged.push(...remoteOnlyItems.map(item => ({
        ...item,
        measurements: item.measurements ? JSON.parse(item.measurements) : null,
        synced: true
      })))

      return { success: true, data: merged }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      }
    }
  }

  // Photo upload methods
  async uploadPhoto(photo: Photo, fileUri: string): Promise<SyncResult<Photo>> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Read file as base64
      const response = await fetch(fileUri)
      const blob = await response.blob()

      const fileName = `${user.id}/${photo.assessment_id}/${photo.filename}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.client.storage
        .from('damage-photos')
        .upload(fileName, blob, {
          contentType: photo.mime_type,
          upsert: true
        })

      if (uploadError) {
        return { success: false, error: uploadError.message }
      }

      // Get public URL
      const { data: urlData } = this.client.storage
        .from('damage-photos')
        .getPublicUrl(fileName)

      // Insert photo record
      const { data: photoData, error: insertError } = await this.client
        .from('photos')
        .insert({
          ...photo,
          remote_url: urlData.publicUrl,
          upload_status: 'completed',
          synced: undefined
        })
        .select()
        .single()

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      return {
        success: true,
        data: {
          ...photo,
          remote_url: urlData.publicUrl,
          upload_status: 'completed' as const,
          synced: true
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  // Voice note upload methods
  async uploadVoiceNote(voiceNote: VoiceNote, fileUri: string): Promise<SyncResult<VoiceNote>> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const response = await fetch(fileUri)
      const blob = await response.blob()

      const fileName = `${user.id}/${voiceNote.assessment_id}/${voiceNote.filename}`

      // Upload to voice-notes bucket
      const { data: uploadData, error: uploadError } = await this.client.storage
        .from('voice-notes')
        .upload(fileName, blob, {
          contentType: 'audio/m4a',
          upsert: true
        })

      if (uploadError) {
        return { success: false, error: uploadError.message }
      }

      const { data: urlData } = this.client.storage
        .from('voice-notes')
        .getPublicUrl(fileName)

      // Insert voice note record
      const { data: voiceData, error: insertError } = await this.client
        .from('voice_notes')
        .insert({
          ...voiceNote,
          remote_url: urlData.publicUrl,
          upload_status: 'completed',
          synced: undefined
        })
        .select()
        .single()

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      return {
        success: true,
        data: {
          ...voiceNote,
          remote_url: urlData.publicUrl,
          upload_status: 'completed' as const,
          synced: true
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  // Sync status methods
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const user = await this.getCurrentUser()
      const isOnline = user !== null

      // Get pending sync items from local storage would be handled by calling component
      return {
        isOnline,
        lastSyncTime: new Date().toISOString(),
        pendingUploads: 0,
        pendingDownloads: 0,
        conflictsCount: 0
      }

    } catch (error) {
      return {
        isOnline: false,
        pendingUploads: 0,
        pendingDownloads: 0,
        conflictsCount: 0
      }
    }
  }

  // Full sync method
  async performFullSync(localData: {
    properties: Property[]
    assessments: DamageAssessment[]
    damageItems: DamageItem[]
  }): Promise<{
    success: boolean
    syncedData?: {
      properties: Property[]
      assessments: DamageAssessment[]
      damageItems: DamageItem[]
    }
    errors?: string[]
  }> {
    const errors: string[] = []
    let syncedData = {
      properties: localData.properties,
      assessments: localData.assessments,
      damageItems: localData.damageItems
    }

    // Sync properties first
    const propertiesResult = await this.syncProperties(localData.properties)
    if (propertiesResult.success && propertiesResult.data) {
      syncedData.properties = propertiesResult.data
    } else {
      errors.push(`Properties sync failed: ${propertiesResult.error}`)
    }

    // Sync assessments
    const assessmentsResult = await this.syncAssessments(localData.assessments)
    if (assessmentsResult.success && assessmentsResult.data) {
      syncedData.assessments = assessmentsResult.data
    } else {
      errors.push(`Assessments sync failed: ${assessmentsResult.error}`)
    }

    // Sync damage items
    const damageItemsResult = await this.syncDamageItems(localData.damageItems)
    if (damageItemsResult.success && damageItemsResult.data) {
      syncedData.damageItems = damageItemsResult.data
    } else {
      errors.push(`Damage items sync failed: ${damageItemsResult.error}`)
    }

    return {
      success: errors.length === 0,
      syncedData: errors.length < 3 ? syncedData : undefined,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  // Health check method
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const startTime = Date.now()

    try {
      const { data, error } = await this.client
        .from('properties')
        .select('count(*)')
        .limit(1)

      const latency = Date.now() - startTime

      return {
        healthy: !error,
        latency
      }

    } catch (error) {
      return { healthy: false }
    }
  }

  // Get client for direct access if needed
  getClient(): SupabaseClient {
    return this.client
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()
export default supabaseService
