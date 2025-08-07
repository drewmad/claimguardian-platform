/**
 * Push Notification Service
 * Handles disaster alerts, assessment updates, and system notifications
 */

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Services
import { networkService } from './networkService'

export interface NotificationData {
  type: 'disaster_alert' | 'weather_warning' | 'assessment_update' | 'sync_complete' | 'system_alert'
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  title: string
  body: string
  data: Record<string, any>
  actionButtons?: NotificationAction[]
  expiresAt?: string
  location?: {
    latitude: number
    longitude: number
    radius: number // meters
  }
}

export interface NotificationAction {
  id: string
  title: string
  icon?: string
  destructive?: boolean
  authenticationRequired?: boolean
}

export interface DisasterAlert {
  id: string
  type: 'hurricane' | 'tornado' | 'flood' | 'wildfire' | 'earthquake' | 'storm'
  severity: 'watch' | 'warning' | 'emergency'
  title: string
  description: string
  instructions: string[]
  affectedAreas: string[]
  effectiveTime: string
  expiresTime: string
  location: {
    latitude: number
    longitude: number
    radius: number
  }
  source: string // NWS, FEMA, etc.
  urgency: 'immediate' | 'expected' | 'future' | 'past'
  certainty: 'observed' | 'likely' | 'possible' | 'unlikely' | 'unknown'
}

export interface PushToken {
  token: string
  platform: 'ios' | 'android'
  userId?: string
  deviceId: string
  registeredAt: string
  lastUsed: string
  isActive: boolean
}

class PushNotificationService {
  private pushToken: string | null = null
  private isInitialized = false
  private notificationListener?: Notifications.Subscription
  private responseListener?: Notifications.Subscription
  private backgroundListener?: Notifications.Subscription

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true

      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices')
        return false
      }

      // Configure notification behavior
      await this.configureNotifications()

      // Register for push notifications
      const success = await this.registerForPushNotifications()

      if (success) {
        // Set up notification listeners
        this.setupNotificationListeners()

        // Subscribe to disaster alerts
        await this.subscribeToDisasterAlerts()

        this.isInitialized = true
        console.log('Push notification service initialized successfully')
        return true
      }

      return false

    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  private async configureNotifications(): Promise<void> {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as NotificationData

        return {
          shouldShowAlert: true,
          shouldPlaySound: data.severity === 'critical' || data.severity === 'emergency',
          shouldSetBadge: true,
          priority: data.severity === 'emergency'
            ? Notifications.AndroidNotificationPriority.MAX
            : data.severity === 'critical'
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.DEFAULT
        }
      }
    })

    // Configure notification categories (for action buttons)
    await this.setupNotificationCategories()
  }

  private async setupNotificationCategories(): Promise<void> {
    // Disaster Alert category
    await Notifications.setNotificationCategoryAsync('disaster_alert', [
      {
        identifier: 'view_details',
        buttonTitle: 'View Details',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false
        }
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false
        }
      }
    ])

    // Assessment Update category
    await Notifications.setNotificationCategoryAsync('assessment_update', [
      {
        identifier: 'open_assessment',
        buttonTitle: 'Open Assessment',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false
        }
      }
    ])

    // System Alert category
    await Notifications.setNotificationCategoryAsync('system_alert', [
      {
        identifier: 'view_system',
        buttonTitle: 'View System',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false
        }
      }
    ])
  }

  private async registerForPushNotifications(): Promise<boolean> {
    try {
      // Get existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
            allowCriticalAlerts: true,
            allowProvisional: false,
            allowDisplayInCarPlay: true,
            allowDisplayInNotificationCenter: true,
            allowDisplayOnLockScreen: true
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true
          }
        })
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted')
        return false
      }

      // Get push notification token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      })

      this.pushToken = tokenData.data

      // Save token locally
      await AsyncStorage.setItem('push_token', this.pushToken)

      // Register token with server
      await this.registerTokenWithServer(this.pushToken)

      return true

    } catch (error) {
      console.error('Failed to register for push notifications:', error)
      return false
    }
  }

  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      const isOnline = await networkService.isConnected()
      if (!isOnline) {
        // Queue for later registration
        await AsyncStorage.setItem('pending_token_registration', token)
        return
      }

      const deviceId = await this.getDeviceId()
      const tokenData: PushToken = {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId,
        registeredAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        isActive: true
      }

      // Register with backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/push-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenData)
      })

      if (!response.ok) {
        throw new Error(`Token registration failed: ${response.statusText}`)
      }

      console.log('Push token registered successfully')

    } catch (error) {
      console.error('Failed to register token with server:', error)
      // Queue for retry
      await AsyncStorage.setItem('pending_token_registration', token)
    }
  }

  private setupNotificationListeners(): void {
    // Notification received (app is foregrounded)
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived.bind(this)
    )

    // Notification tapped/responded to
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    )

    // Background notification handling
    if (Platform.OS === 'android') {
      this.backgroundListener = Notifications.addNotificationResponseReceivedListener(
        this.handleBackgroundNotification.bind(this)
      )
    }
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    const data = notification.request.content.data as NotificationData

    console.log('Notification received:', {
      type: data.type,
      severity: data.severity,
      title: notification.request.content.title
    })

    // Handle specific notification types
    switch (data.type) {
      case 'disaster_alert':
        this.handleDisasterAlert(data)
        break
      case 'weather_warning':
        this.handleWeatherWarning(data)
        break
      case 'assessment_update':
        this.handleAssessmentUpdate(data)
        break
      case 'sync_complete':
        this.handleSyncComplete(data)
        break
    }

    // Update badge count
    this.updateBadgeCount()
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as NotificationData
    const actionIdentifier = response.actionIdentifier

    console.log('Notification response:', actionIdentifier, data.type)

    // Handle action button taps
    switch (actionIdentifier) {
      case 'view_details':
        this.handleViewDetails(data)
        break
      case 'open_assessment':
        this.handleOpenAssessment(data)
        break
      case 'view_system':
        this.handleViewSystem(data)
        break
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        this.handleDefaultAction(data)
        break
    }
  }

  private handleBackgroundNotification(response: Notifications.NotificationResponse): void {
    // Handle notifications when app is in background
    const data = response.notification.request.content.data as NotificationData
    console.log('Background notification handled:', data.type)
  }

  // Notification type handlers
  private handleDisasterAlert(data: NotificationData): void {
    // Store disaster alert for offline access
    this.storeDisasterAlert(data)

    // If emergency level, show persistent alert
    if (data.severity === 'emergency') {
      this.showEmergencyAlert(data)
    }
  }

  private handleWeatherWarning(data: NotificationData): void {
    // Store weather alert
    this.storeWeatherAlert(data)
  }

  private handleAssessmentUpdate(data: NotificationData): void {
    // Navigate to assessment if app is open
    // This would be handled by the navigation system
  }

  private handleSyncComplete(data: NotificationData): void {
    // Update sync status
    console.log('Sync completed:', data.data)
  }

  private handleViewDetails(data: NotificationData): void {
    // Navigate to details screen
    console.log('View details tapped:', data.type)
  }

  private handleOpenAssessment(data: NotificationData): void {
    // Navigate to assessment
    console.log('Open assessment tapped:', data.data.assessmentId)
  }

  private handleViewSystem(data: NotificationData): void {
    // Navigate to system screen
    console.log('View system tapped')
  }

  private handleDefaultAction(data: NotificationData): void {
    // Default tap behavior
    console.log('Default action:', data.type)
  }

  // Public methods for sending notifications
  async sendDisasterAlert(alert: DisasterAlert): Promise<void> {
    try {
      const notificationData: NotificationData = {
        type: 'disaster_alert',
        severity: alert.severity === 'emergency' ? 'emergency' : 'critical',
        title: alert.title,
        body: alert.description,
        data: {
          alertId: alert.id,
          alertType: alert.type,
          location: alert.location,
          instructions: alert.instructions,
          expiresTime: alert.expiresTime
        },
        actionButtons: [
          { id: 'view_details', title: 'View Details' },
          { id: 'dismiss', title: 'Dismiss' }
        ],
        expiresAt: alert.expiresTime,
        location: alert.location
      }

      await this.scheduleLocalNotification(notificationData)

    } catch (error) {
      console.error('Failed to send disaster alert:', error)
    }
  }

  async sendAssessmentUpdate(
    assessmentId: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      const notificationData: NotificationData = {
        type: 'assessment_update',
        severity: 'info',
        title,
        body: message,
        data: {
          assessmentId
        },
        actionButtons: [
          { id: 'open_assessment', title: 'Open Assessment' }
        ]
      }

      await this.scheduleLocalNotification(notificationData)

    } catch (error) {
      console.error('Failed to send assessment update:', error)
    }
  }

  async sendSyncNotification(
    success: boolean,
    itemCount: number,
    errors?: string[]
  ): Promise<void> {
    try {
      const notificationData: NotificationData = {
        type: 'sync_complete',
        severity: success ? 'info' : 'warning',
        title: success ? 'Sync Complete' : 'Sync Issues',
        body: success
          ? `Successfully synced ${itemCount} items`
          : `Synced with ${errors?.length || 0} errors`,
        data: {
          success,
          itemCount,
          errors
        }
      }

      await this.scheduleLocalNotification(notificationData)

    } catch (error) {
      console.error('Failed to send sync notification:', error)
    }
  }

  private async scheduleLocalNotification(data: NotificationData): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data,
          categoryIdentifier: data.type,
          sound: data.severity === 'emergency' ? 'emergency.wav' : 'default',
          badge: await this.getBadgeCount() + 1
        },
        trigger: null // Send immediately
      })

      return identifier

    } catch (error) {
      console.error('Failed to schedule notification:', error)
      throw error
    }
  }

  // Disaster alert subscription
  private async subscribeToDisasterAlerts(): Promise<void> {
    try {
      // Get user's location for location-based alerts
      const location = await this.getCurrentLocation()

      if (location && this.pushToken) {
        const subscription = {
          token: this.pushToken,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 50000 // 50km radius
          },
          alertTypes: ['hurricane', 'tornado', 'flood', 'wildfire', 'earthquake'],
          severityLevels: ['watch', 'warning', 'emergency']
        }

        // Subscribe via API
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/disaster-alerts/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        })

        if (response.ok) {
          console.log('Subscribed to disaster alerts')
        }
      }

    } catch (error) {
      console.error('Failed to subscribe to disaster alerts:', error)
    }
  }

  // Badge management
  private async updateBadgeCount(): Promise<void> {
    try {
      const count = await this.getBadgeCount()
      await Notifications.setBadgeCountAsync(count + 1)
    } catch (error) {
      console.error('Failed to update badge count:', error)
    }
  }

  private async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync() || 0
    } catch (error) {
      return 0
    }
  }

  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0)
    } catch (error) {
      console.error('Failed to clear badge count:', error)
    }
  }

  // Permission management
  async checkPermissions(): Promise<{
    granted: boolean
    status: string
    canAskAgain: boolean
  }> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync()

      return {
        granted: status === 'granted',
        status,
        canAskAgain
      }
    } catch (error) {
      return {
        granted: false,
        status: 'unknown',
        canAskAgain: true
      }
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true
        }
      })

      return status === 'granted'
    } catch (error) {
      console.error('Failed to request permissions:', error)
      return false
    }
  }

  // Utility methods
  private async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // This would integrate with the location service
      // For now, return null
      return null
    } catch (error) {
      return null
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id')

      if (!deviceId) {
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await AsyncStorage.setItem('device_id', deviceId)
      }

      return deviceId
    } catch (error) {
      return `${Platform.OS}_${Date.now()}_fallback`
    }
  }

  private async storeDisasterAlert(data: NotificationData): Promise<void> {
    try {
      const alerts = await this.getStoredAlerts()
      alerts.unshift(data)

      // Keep only last 50 alerts
      const trimmedAlerts = alerts.slice(0, 50)

      await AsyncStorage.setItem('disaster_alerts', JSON.stringify(trimmedAlerts))
    } catch (error) {
      console.error('Failed to store disaster alert:', error)
    }
  }

  private async storeWeatherAlert(data: NotificationData): Promise<void> {
    try {
      const alerts = await this.getStoredWeatherAlerts()
      alerts.unshift(data)

      // Keep only last 20 weather alerts
      const trimmedAlerts = alerts.slice(0, 20)

      await AsyncStorage.setItem('weather_alerts', JSON.stringify(trimmedAlerts))
    } catch (error) {
      console.error('Failed to store weather alert:', error)
    }
  }

  private async showEmergencyAlert(data: NotificationData): Promise<void> {
    // Show emergency alert modal
    // This would be handled by the app's navigation/modal system
    console.log('Emergency alert:', data.title)
  }

  // Public getter methods
  async getStoredAlerts(): Promise<NotificationData[]> {
    try {
      const stored = await AsyncStorage.getItem('disaster_alerts')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      return []
    }
  }

  async getStoredWeatherAlerts(): Promise<NotificationData[]> {
    try {
      const stored = await AsyncStorage.getItem('weather_alerts')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      return []
    }
  }

  async getPushToken(): Promise<string | null> {
    return this.pushToken
  }

  // Cleanup
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove()
      this.notificationListener = undefined
    }

    if (this.responseListener) {
      this.responseListener.remove()
      this.responseListener = undefined
    }

    if (this.backgroundListener) {
      this.backgroundListener.remove()
      this.backgroundListener = undefined
    }

    this.isInitialized = false
    console.log('Push notification service cleaned up')
  }
}

export const pushNotificationService = new PushNotificationService()
export default pushNotificationService
