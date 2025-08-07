/**
 * Notification Provider
 * Provides push notification context and manages notification state
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Alert } from 'react-native'

// Services
import pushNotificationService, { NotificationData, DisasterAlert } from '@/services/pushNotificationService'

// Redux
import { useAppDispatch, useAppSelector } from '@/store'

interface NotificationContextType {
  // State
  isInitialized: boolean
  hasPermission: boolean
  pushToken: string | null

  // Notifications
  disasterAlerts: NotificationData[]
  systemNotifications: NotificationData[]
  unreadCount: number

  // Methods
  requestPermission: () => Promise<boolean>
  clearBadge: () => Promise<void>
  sendTestNotification: () => Promise<void>
  markAsRead: (notificationId: string) => void
  clearAllNotifications: () => void

  // Settings
  notificationSettings: {
    disasterAlerts: boolean
    weatherWarnings: boolean
    assessmentUpdates: boolean
    syncNotifications: boolean
    sound: boolean
    vibration: boolean
    locationBasedAlerts: boolean
  }
  updateSettings: (settings: Partial<NotificationContextType['notificationSettings']>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const dispatch = useAppDispatch()

  // Redux selectors
  const isOnline = useAppSelector(state => state.network.isOnline)
  const currentLocation = useAppSelector(state => state.location.currentLocation)

  // Local state
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [pushToken, setPushToken] = useState<string | null>(null)
  const [disasterAlerts, setDisasterAlerts] = useState<NotificationData[]>([])
  const [systemNotifications, setSystemNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationSettings, setNotificationSettings] = useState({
    disasterAlerts: true,
    weatherWarnings: true,
    assessmentUpdates: true,
    syncNotifications: true,
    sound: true,
    vibration: true,
    locationBasedAlerts: true
  })

  // Initialize push notifications when the provider mounts
  useEffect(() => {
    initializeNotifications()

    return () => {
      pushNotificationService.cleanup()
    }
  }, [])

  // Listen for online/offline changes to handle deferred notifications
  useEffect(() => {
    if (isOnline && isInitialized) {
      handleOnlineStateChange()
    }
  }, [isOnline, isInitialized])

  const initializeNotifications = async () => {
    try {
      console.log('Initializing push notifications...')

      const initialized = await pushNotificationService.initialize()

      if (initialized) {
        const permissions = await pushNotificationService.checkPermissions()
        const token = await pushNotificationService.getPushToken()

        setIsInitialized(true)
        setHasPermission(permissions.granted)
        setPushToken(token)

        // Load existing notifications
        await loadStoredNotifications()

        console.log('Push notifications initialized successfully')
      } else {
        console.warn('Push notifications could not be initialized')
      }

    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
    }
  }

  const loadStoredNotifications = async () => {
    try {
      const [disasters, weather] = await Promise.all([
        pushNotificationService.getStoredAlerts(),
        pushNotificationService.getStoredWeatherAlerts()
      ])

      setDisasterAlerts(disasters)

      // Combine weather alerts with system notifications for now
      setSystemNotifications([
        ...weather,
        // Add mock system notifications for demo
        {
          type: 'sync_complete',
          severity: 'info',
          title: 'Sync Complete',
          body: 'All assessments have been synced successfully',
          data: { timestamp: new Date().toISOString() }
        }
      ])

      // Calculate unread count (mock implementation)
      const totalUnread = disasters.length + weather.length
      setUnreadCount(totalUnread)

    } catch (error) {
      console.error('Failed to load stored notifications:', error)
    }
  }

  const handleOnlineStateChange = async () => {
    // Handle any pending notifications or registrations when coming back online
    try {
      // Re-register push token if needed
      const token = await pushNotificationService.getPushToken()
      if (token && token !== pushToken) {
        setPushToken(token)
      }

      // Refresh stored notifications
      await loadStoredNotifications()

    } catch (error) {
      console.error('Failed to handle online state change:', error)
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await pushNotificationService.requestPermissions()
      setHasPermission(granted)

      if (granted && !isInitialized) {
        await initializeNotifications()
      }

      return granted

    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  const clearBadge = async (): Promise<void> => {
    try {
      await pushNotificationService.clearBadgeCount()
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to clear badge:', error)
    }
  }

  const sendTestNotification = async (): Promise<void> => {
    try {
      await pushNotificationService.sendAssessmentUpdate(
        'test-notification-123',
        'Test Notification',
        'This is a test notification to verify your settings are working correctly.'
      )

      Alert.alert(
        'Test Sent',
        'A test notification has been sent. It should appear shortly.',
        [{ text: 'OK' }]
      )

    } catch (error) {
      console.error('Failed to send test notification:', error)
      Alert.alert(
        'Test Failed',
        'Could not send test notification. Please check your settings.',
        [{ text: 'OK' }]
      )
    }
  }

  const markAsRead = (notificationId: string): void => {
    // Mark specific notification as read
    setDisasterAlerts(prev =>
      prev.map(alert =>
        alert.data.alertId === notificationId
          ? { ...alert, data: { ...alert.data, read: true } }
          : alert
      )
    )

    setSystemNotifications(prev =>
      prev.map(notification =>
        notification.data.id === notificationId
          ? { ...notification, data: { ...notification.data, read: true } }
          : notification
      )
    )

    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const clearAllNotifications = (): void => {
    setDisasterAlerts([])
    setSystemNotifications([])
    setUnreadCount(0)
    clearBadge()
  }

  const updateSettings = (settings: Partial<NotificationContextType['notificationSettings']>): void => {
    setNotificationSettings(prev => ({ ...prev, ...settings }))

    // Save settings to AsyncStorage or API
    // This would be implemented based on your storage strategy
  }

  // Listen for disaster alerts based on location
  useEffect(() => {
    if (currentLocation && notificationSettings.locationBasedAlerts && hasPermission) {
      // Subscribe to location-based alerts
      // This would be implemented with your disaster alert API
      subscribeToLocationBasedAlerts(currentLocation)
    }
  }, [currentLocation, notificationSettings.locationBasedAlerts, hasPermission])

  const subscribeToLocationBasedAlerts = async (location: { latitude: number; longitude: number }) => {
    try {
      // This would subscribe to disaster alerts for the user's location
      console.log('Subscribing to location-based alerts for:', location)

      // Mock disaster alert for demonstration
      if (__DEV__) {
        setTimeout(() => {
          const mockAlert: DisasterAlert = {
            id: 'mock-alert-123',
            type: 'hurricane',
            severity: 'warning',
            title: 'Hurricane Watch',
            description: 'A hurricane watch has been issued for your area.',
            instructions: [
              'Secure loose outdoor items',
              'Stock up on emergency supplies',
              'Monitor weather updates'
            ],
            affectedAreas: ['Your Location'],
            effectiveTime: new Date().toISOString(),
            expiresTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              radius: 50000
            },
            source: 'National Weather Service',
            urgency: 'expected',
            certainty: 'likely'
          }

          // Send mock alert after 10 seconds (for demo)
          // setTimeout(() => {
          //   pushNotificationService.sendDisasterAlert(mockAlert)
          // }, 10000)
        }, 1000)
      }

    } catch (error) {
      console.error('Failed to subscribe to location-based alerts:', error)
    }
  }

  // Context value
  const contextValue: NotificationContextType = {
    // State
    isInitialized,
    hasPermission,
    pushToken,

    // Notifications
    disasterAlerts,
    systemNotifications,
    unreadCount,

    // Methods
    requestPermission,
    clearBadge,
    sendTestNotification,
    markAsRead,
    clearAllNotifications,

    // Settings
    notificationSettings,
    updateSettings
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook to use notification context
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)

  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }

  return context
}

// Hook for disaster alerts specifically
export function useDisasterAlerts() {
  const { disasterAlerts, notificationSettings } = useNotifications()

  return {
    alerts: disasterAlerts.filter(alert => alert.type === 'disaster_alert'),
    isEnabled: notificationSettings.disasterAlerts,
    criticalAlerts: disasterAlerts.filter(alert =>
      alert.type === 'disaster_alert' &&
      (alert.severity === 'critical' || alert.severity === 'emergency')
    )
  }
}

// Hook for system notifications specifically
export function useSystemNotifications() {
  const { systemNotifications, notificationSettings } = useNotifications()

  return {
    notifications: systemNotifications,
    assessmentUpdates: systemNotifications.filter(n => n.type === 'assessment_update'),
    syncNotifications: systemNotifications.filter(n => n.type === 'sync_complete'),
    isAssessmentUpdatesEnabled: notificationSettings.assessmentUpdates,
    isSyncNotificationsEnabled: notificationSettings.syncNotifications
  }
}

export default NotificationProvider
