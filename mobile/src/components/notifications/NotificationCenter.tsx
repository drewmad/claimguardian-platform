/**
 * Notification Center Screen
 * Shows disaster alerts, system notifications, and assessment updates
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
  Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

// Services
import pushNotificationService, { NotificationData, DisasterAlert } from '@/services/pushNotificationService'

// Components
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface NotificationCenterProps {
  onClose?: () => void
}

interface NotificationPermissions {
  granted: boolean
  status: string
  canAskAgain: boolean
}

interface NotificationSettings {
  disasterAlerts: boolean
  weatherWarnings: boolean
  assessmentUpdates: boolean
  syncNotifications: boolean
  sound: boolean
  vibration: boolean
  locationBasedAlerts: boolean
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const navigation = useNavigation()

  // State
  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications' | 'settings'>('alerts')
  const [disasterAlerts, setDisasterAlerts] = useState<NotificationData[]>([])
  const [weatherAlerts, setWeatherAlerts] = useState<NotificationData[]>([])
  const [systemNotifications, setSystemNotifications] = useState<NotificationData[]>([])
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    granted: false,
    status: 'unknown',
    canAskAgain: true
  })
  const [settings, setSettings] = useState<NotificationSettings>({
    disasterAlerts: true,
    weatherWarnings: true,
    assessmentUpdates: true,
    syncNotifications: true,
    sound: true,
    vibration: true,
    locationBasedAlerts: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  useEffect(() => {
    loadNotifications()
    checkPermissions()
    loadSettings()
  }, [])

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const [disasters, weather] = await Promise.all([
        pushNotificationService.getStoredAlerts(),
        pushNotificationService.getStoredWeatherAlerts()
      ])

      setDisasterAlerts(disasters)
      setWeatherAlerts(weather)

      // Mock system notifications
      setSystemNotifications([
        {
          type: 'sync_complete',
          severity: 'info',
          title: 'Sync Complete',
          body: 'Successfully synced 5 assessments',
          data: { count: 5 }
        },
        {
          type: 'assessment_update',
          severity: 'info',
          title: 'Assessment Updated',
          body: 'Property assessment #12345 has been updated',
          data: { assessmentId: '12345' }
        }
      ])

    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkPermissions = useCallback(async () => {
    const permissionStatus = await pushNotificationService.checkPermissions()
    setPermissions(permissionStatus)

    if (!permissionStatus.granted && permissionStatus.canAskAgain) {
      setShowPermissionModal(true)
    }
  }, [])

  const loadSettings = useCallback(async () => {
    // Load settings from AsyncStorage or API
    // For now, use default settings
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadNotifications()
    setIsRefreshing(false)
  }, [loadNotifications])

  const handleRequestPermissions = useCallback(async () => {
    const granted = await pushNotificationService.requestPermissions()
    if (granted) {
      setPermissions({
        granted: true,
        status: 'granted',
        canAskAgain: false
      })
      setShowPermissionModal(false)

      // Initialize push notification service
      await pushNotificationService.initialize()
    } else {
      Alert.alert(
        'Permission Denied',
        'Push notifications are required for disaster alerts and important updates. You can enable them later in Settings.',
        [{ text: 'OK' }]
      )
    }
  }, [])

  const handleNotificationTap = useCallback((notification: NotificationData) => {
    switch (notification.type) {
      case 'disaster_alert':
        // Navigate to disaster alert details
        navigation.navigate('DisasterAlert', { alertId: notification.data.alertId })
        break
      case 'assessment_update':
        // Navigate to assessment
        navigation.navigate('AssessmentDetail', { id: notification.data.assessmentId })
        break
      case 'weather_warning':
        // Navigate to weather details
        navigation.navigate('WeatherAlert', { alertId: notification.data.alertId })
        break
      default:
        console.log('Unknown notification type:', notification.type)
    }
  }, [navigation])

  const handleClearBadge = useCallback(async () => {
    await pushNotificationService.clearBadgeCount()
  }, [])

  const updateSetting = useCallback((key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // Save to AsyncStorage or API
  }, [])

  const renderNotificationItem = (notification: NotificationData, index: number) => {
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'emergency': return '#f44336'
        case 'critical': return '#FF5722'
        case 'warning': return '#FF9800'
        case 'info': return '#2196F3'
        default: return '#666'
      }
    }

    const getSeverityIcon = (type: string, severity: string) => {
      if (type === 'disaster_alert') return 'warning'
      if (type === 'weather_warning') return 'thunderstorm'
      if (type === 'assessment_update') return 'document-text'
      if (type === 'sync_complete') return 'sync'
      return 'notifications'
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.notificationItem}
        onPress={() => handleNotificationTap(notification)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons
              name={getSeverityIcon(notification.type, notification.severity)}
              size={24}
              color={getSeverityColor(notification.severity)}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationBody}>{notification.body}</Text>
            <Text style={styles.notificationTime}>
              {new Date().toLocaleTimeString()} {/* Would use actual timestamp */}
            </Text>
          </View>
          <View style={styles.severityBadge}>
            <Text style={[styles.severityText, { color: getSeverityColor(notification.severity) }]}>
              {notification.severity.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'alerts':
        return (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          >
            {/* Disaster Alerts Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Disaster Alerts</Text>
              {disasterAlerts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="shield-checkmark" size={64} color="#666" />
                  <Text style={styles.emptyText}>No active disaster alerts</Text>
                </View>
              ) : (
                disasterAlerts.map(renderNotificationItem)
              )}
            </View>

            {/* Weather Alerts Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weather Warnings</Text>
              {weatherAlerts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="partly-sunny" size={64} color="#666" />
                  <Text style={styles.emptyText}>No weather warnings</Text>
                </View>
              ) : (
                weatherAlerts.map(renderNotificationItem)
              )}
            </View>
          </ScrollView>
        )

      case 'notifications':
        return (
          <ScrollView
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Notifications</Text>
              {systemNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off" size={64} color="#666" />
                  <Text style={styles.emptyText}>No notifications</Text>
                </View>
              ) : (
                systemNotifications.map(renderNotificationItem)
              )}
            </View>
          </ScrollView>
        )

      case 'settings':
        return (
          <ScrollView style={styles.tabContent}>
            {/* Permission Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Permission Status</Text>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <View style={styles.settingValue}>
                  <Text style={[styles.permissionStatus, {
                    color: permissions.granted ? '#4CAF50' : '#f44336'
                  }]}>
                    {permissions.granted ? 'Enabled' : 'Disabled'}
                  </Text>
                  {!permissions.granted && permissions.canAskAgain && (
                    <Button
                      title="Enable"
                      onPress={handleRequestPermissions}
                      style={styles.enableButton}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Notification Types */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Types</Text>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Disaster Alerts</Text>
                <Switch
                  value={settings.disasterAlerts}
                  onValueChange={(value) => updateSetting('disasterAlerts', value)}
                  trackColor={{ false: '#333', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Weather Warnings</Text>
                <Switch
                  value={settings.weatherWarnings}
                  onValueChange={(value) => updateSetting('weatherWarnings', value)}
                  trackColor={{ false: '#333', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Assessment Updates</Text>
                <Switch
                  value={settings.assessmentUpdates}
                  onValueChange={(value) => updateSetting('assessmentUpdates', value)}
                  trackColor={{ false: '#333', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Sync Notifications</Text>
                <Switch
                  value={settings.syncNotifications}
                  onValueChange={(value) => updateSetting('syncNotifications', value)}
                  trackColor={{ false: '#333', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Notification Behavior */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Behavior</Text>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Sound</Text>
                <Switch
                  value={settings.sound}
                  onValueChange={(value) => updateSetting('sound', value)}
                  trackColor={{ false: '#333', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <Switch
                  value={settings.vibration}
                  onValueChange={(value) => updateSetting('vibration', value)}
                  trackColor={{ false: '#333', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Location-based Alerts</Text>
                <Switch
                  value={settings.locationBasedAlerts}
                  onValueChange={(value) => updateSetting('locationBasedAlerts', value)}
                  trackColor={{ false: '#333', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <Button
                title="Clear Badge Count"
                onPress={handleClearBadge}
                style={styles.actionButton}
              />
              <Button
                title="Test Notification"
                onPress={async () => {
                  await pushNotificationService.sendAssessmentUpdate(
                    'test-123',
                    'Test Notification',
                    'This is a test notification to verify your settings.'
                  )
                }}
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        )

      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose || (() => navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <Ionicons
            name="warning"
            size={20}
            color={activeTab === 'alerts' ? '#4CAF50' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            Alerts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={activeTab === 'notifications' ? '#4CAF50' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Updates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? '#4CAF50' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" color="#4CAF50" />
        </View>
      ) : (
        renderTabContent()
      )}

      {/* Permission Modal */}
      <Modal
        visible={showPermissionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="notifications" size={64} color="#4CAF50" />
            <Text style={styles.modalTitle}>Enable Push Notifications</Text>
            <Text style={styles.modalText}>
              Stay informed with real-time disaster alerts, weather warnings, and important updates about your assessments.
            </Text>

            <View style={styles.modalFeatures}>
              <View style={styles.feature}>
                <Ionicons name="warning" size={24} color="#FF9800" />
                <Text style={styles.featureText}>Emergency disaster alerts</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="thunderstorm" size={24} color="#2196F3" />
                <Text style={styles.featureText}>Weather warnings</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="sync" size={24} color="#4CAF50" />
                <Text style={styles.featureText}>Assessment sync updates</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Enable Notifications"
                onPress={handleRequestPermissions}
                style={[styles.modalButton, styles.primaryButton]}
              />
              <Button
                title="Not Now"
                onPress={() => setShowPermissionModal(false)}
                style={[styles.modalButton, styles.secondaryButton]}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  headerAction: {
    padding: 8
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50'
  },
  tabText: {
    fontSize: 14,
    color: '#666'
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '500'
  },
  tabContent: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center'
  },
  notificationItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4
  },
  notificationBody: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8
  },
  notificationTime: {
    fontSize: 12,
    color: '#666'
  },
  severityBadge: {
    marginLeft: 12
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff'
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  permissionStatus: {
    fontSize: 14,
    fontWeight: '500'
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 6
  },
  actionButton: {
    backgroundColor: '#333',
    marginBottom: 12
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000'
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center'
  },
  modalText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32
  },
  modalFeatures: {
    width: '100%',
    marginBottom: 32
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16
  },
  featureText: {
    fontSize: 16,
    color: '#fff'
  },
  modalActions: {
    width: '100%',
    gap: 12
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 8
  },
  primaryButton: {
    backgroundColor: '#4CAF50'
  },
  secondaryButton: {
    backgroundColor: '#333'
  }
})

export default NotificationCenter
