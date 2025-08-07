/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Tab navigation layout for ClaimGuardian Mobile main screens"
 * @dependencies ["@expo/vector-icons", "@react-navigation/bottom-tabs"]
 * @status stable
 */

import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import { View, Text } from 'react-native'

import { selectUnsyncedData, selectNetwork } from '../../shared/store'

export default function TabsLayout() {
  const unsyncedData = useSelector(selectUnsyncedData)
  const network = useSelector(selectNetwork)

  const SyncBadge = ({ count }: { count: number }) => {
    if (count === 0) return null

    return (
      <View style={{
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{
          color: 'white',
          fontSize: 12,
          fontWeight: 'bold',
        }}>
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    )
  }

  const NetworkIndicator = () => {
    if (network.isConnected) return null

    return (
      <View style={{
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: '#F59E0B',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <MaterialCommunityIcons name="cloud-off-outline" size={10} color="white" />
      </View>
    )
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#111827',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
              <NetworkIndicator />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons name="home-group" size={size} color={color} />
              <SyncBadge count={unsyncedData.properties.length} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="assessments"
        options={{
          title: 'Assessments',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons name="clipboard-check" size={size} color={color} />
              <SyncBadge count={unsyncedData.assessments.length + unsyncedData.damageItems.length} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons
                name={network.isConnected ? "cloud-sync" : "cloud-off-outline"}
                size={size}
                color={color}
              />
              <SyncBadge count={unsyncedData.totalCount} />
            </View>
          ),
          tabBarBadge: unsyncedData.totalCount > 0 ? unsyncedData.totalCount : undefined,
        }}
      />
    </Tabs>
  )
}
