/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Main dashboard screen for ClaimGuardian Mobile field operations"
 * @dependencies ["expo-router", "react-redux", "@expo/vector-icons"]
 * @status stable
 */

import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import {
  selectUser,
  selectProperties,
  selectAssessments,
  selectUnsyncedData,
  selectNetwork,
  selectSync,
  selectOfflineCapabilities
} from '../../shared/store'
import { performFullSync } from '../../shared/store/slices/syncSlice'
import { AppDispatch } from '../../shared/store'

interface QuickStatCard {
  title: string
  value: string | number
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  color: string
  onPress?: () => void
}

export default function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector(selectUser)
  const properties = useSelector(selectProperties)
  const assessments = useSelector(selectAssessments)
  const unsyncedData = useSelector(selectUnsyncedData)
  const network = useSelector(selectNetwork)
  const sync = useSelector(selectSync)
  const offlineCapabilities = useSelector(selectOfflineCapabilities)

  const handleSyncPress = async () => {
    if (!network.isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      )
      return
    }

    try {
      await dispatch(performFullSync()).unwrap()
      Alert.alert('Sync Complete', 'All data has been synchronized successfully.')
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        error instanceof Error ? error.message : 'Failed to sync data. Please try again.',
        [{ text: 'OK' }]
      )
    }
  }

  const quickStats: QuickStatCard[] = [
    {
      title: 'Properties',
      value: properties.items.length,
      icon: 'home-group',
      color: '#3B82F6',
      onPress: () => router.push('/(tabs)/properties')
    },
    {
      title: 'Assessments',
      value: assessments.items.length,
      icon: 'clipboard-check',
      color: '#10B981',
      onPress: () => router.push('/(tabs)/assessments')
    },
    {
      title: 'Pending Sync',
      value: unsyncedData.totalCount,
      icon: 'cloud-sync-outline',
      color: unsyncedData.totalCount > 0 ? '#F59E0B' : '#6B7280',
      onPress: () => router.push('/sync-status')
    },
    {
      title: 'Storage Used',
      value: `${offlineCapabilities.totalRecords}`,
      icon: 'database',
      color: '#8B5CF6'
    }
  ]

  const quickActions = [
    {
      title: 'New Assessment',
      subtitle: 'Start damage assessment',
      icon: 'plus-circle' as keyof typeof MaterialCommunityIcons.glyphMap,
      color: '#10B981',
      onPress: () => {
        if (properties.items.length === 0) {
          Alert.alert(
            'No Properties',
            'Please add a property first before creating an assessment.',
            [
              { text: 'Cancel' },
              { text: 'Add Property', onPress: () => router.push('/(tabs)/properties') }
            ]
          )
          return
        }
        // Would show property selector, then create assessment
        Alert.alert('Feature Coming Soon', 'Assessment creation will be available in the next update.')
      }
    },
    {
      title: 'Take Photo',
      subtitle: 'Capture damage evidence',
      icon: 'camera' as keyof typeof MaterialCommunityIcons.glyphMap,
      color: '#3B82F6',
      onPress: () => {
        router.push('/camera?return_screen=dashboard')
      }
    },
    {
      title: 'View Reports',
      subtitle: 'Generate assessment reports',
      icon: 'file-document' as keyof typeof MaterialCommunityIcons.glyphMap,
      color: '#8B5CF6',
      onPress: () => {
        Alert.alert('Feature Coming Soon', 'Report generation will be available in the next update.')
      }
    }
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#111827' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingBottom: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
        </Text>
        <Text style={{ fontSize: 16, color: '#9CA3AF' }}>
          {user.current?.full_name || user.current?.email || 'Field Inspector'}
        </Text>
      </View>

      {/* Network Status Banner */}
      {!network.isConnected && (
        <View style={{
          backgroundColor: '#F59E0B',
          margin: 20,
          padding: 12,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <MaterialCommunityIcons name="cloud-off-outline" size={20} color="white" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              Working Offline
            </Text>
            <Text style={{ color: 'white', fontSize: 12 }}>
              Data will sync when connection is restored
            </Text>
          </View>
        </View>
      )}

      {/* Sync Status */}
      {sync.isSyncing && (
        <View style={{
          backgroundColor: '#1F2937',
          margin: 20,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#374151'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>Syncing...</Text>
            <Text style={{ color: '#9CA3AF' }}>{sync.syncProgress}%</Text>
          </View>
          <View style={{
            height: 4,
            backgroundColor: '#374151',
            borderRadius: 2,
            marginTop: 8
          }}>
            <View style={{
              height: 4,
              backgroundColor: '#3B82F6',
              borderRadius: 2,
              width: `${sync.syncProgress}%`
            }} />
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={{ padding: 20, paddingTop: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 16 }}>
          Quick Stats
        </Text>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {quickStats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 16,
                width: '48%',
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#374151'
              }}
              onPress={stat.onPress}
              disabled={!stat.onPress}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
                <Text style={{ 
                  color: '#9CA3AF', 
                  fontSize: 12, 
                  marginLeft: 8,
                  flex: 1
                }}>
                  {stat.title}
                </Text>
              </View>
              <Text style={{ 
                color: 'white', 
                fontSize: 24, 
                fontWeight: 'bold' 
              }}>
                {stat.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ padding: 20, paddingTop: 0 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 16 }}>
          Quick Actions
        </Text>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: '#1F2937',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#374151',
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={action.onPress}
          >
            <View style={{
              backgroundColor: action.color + '20',
              borderRadius: 10,
              padding: 12,
              marginRight: 16
            }}>
              <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 2 }}>
                {action.title}
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                {action.subtitle}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sync Button */}
      {unsyncedData.totalCount > 0 && (
        <View style={{ padding: 20, paddingTop: 0 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              opacity: network.isConnected ? 1 : 0.5
            }}
            onPress={handleSyncPress}
            disabled={!network.isConnected || sync.isSyncing}
          >
            <MaterialCommunityIcons 
              name={sync.isSyncing ? "loading" : "cloud-sync"} 
              size={20} 
              color="white" 
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {sync.isSyncing ? 'Syncing...' : `Sync ${unsyncedData.totalCount} Items`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Last Sync Info */}
      {sync.lastSyncTime && (
        <View style={{ padding: 20, paddingTop: 0, paddingBottom: 40 }}>
          <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center' }}>
            Last synced: {new Date(sync.lastSyncTime).toLocaleString()}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}