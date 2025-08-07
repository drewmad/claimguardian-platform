/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Network connectivity provider with real-time monitoring and offline support"
 * @dependencies ["expo-network", "react-redux"]
 * @status stable
 */

import React, { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import * as Network from 'expo-network'
import { useDispatch } from 'react-redux'

import {
  setNetworkState,
  recordConnectionEvent,
  enableOfflineMode,
  disableOfflineMode,
  testConnectionSpeed,
  checkNetworkState
} from '../store/slices/networkSlice'
import { performFullSync } from '../store/slices/syncSlice'
import type { AppDispatch } from '../store'

interface NetworkProviderProps {
  children: React.ReactNode
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const dispatch = useDispatch<AppDispatch>()
  const networkStateRef = useRef<any>(null)
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const offlineTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let networkSubscription: any = null

    const initializeNetworkMonitoring = async () => {
      try {
        // Get initial network state
        const initialState = await Network.getNetworkStateAsync()
        dispatch(setNetworkState({
          isConnected: initialState.isConnected || false,
          isInternetReachable: initialState.isInternetReachable,
          type: initialState.type || null
        }))

        networkStateRef.current = initialState

        // Set up network state listener
        networkSubscription = Network.addNetworkStateListener((state) => {
          const previousState = networkStateRef.current
          networkStateRef.current = state

          // Dispatch network state update
          dispatch(setNetworkState({
            isConnected: state.isConnected || false,
            isInternetReachable: state.isInternetReachable,
            type: state.type || null
          }))

          // Handle connection changes
          if (previousState && previousState.isConnected !== state.isConnected) {
            handleConnectionChange(previousState.isConnected, state.isConnected || false)
          }

          // Test connection speed when connected
          if (state.isConnected && state.isInternetReachable) {
            scheduleConnectionSpeedTest()
          }
        })

        // Initial connection speed test if connected
        if (initialState.isConnected && initialState.isInternetReachable) {
          setTimeout(() => {
            dispatch(testConnectionSpeed())
          }, 2000)
        }

      } catch (error) {
        console.error('Failed to initialize network monitoring:', error)
        dispatch(recordConnectionEvent({
          event: 'timeout',
          details: 'Failed to initialize network monitoring'
        }))
      }
    }

    const handleConnectionChange = (wasConnected: boolean, isConnected: boolean) => {
      if (!wasConnected && isConnected) {
        // Connected
        dispatch(recordConnectionEvent({ event: 'connected' }))
        dispatch(disableOfflineMode())

        // Clear offline timer
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current)
          offlineTimerRef.current = null
        }

        // Auto-sync when connection restored
        setTimeout(() => {
          dispatch(performFullSync())
        }, 1000)

        // Show connection restored alert
        Alert.alert(
          'Connection Restored',
          'Internet connection restored. Syncing data...',
          [{ text: 'OK' }]
        )

      } else if (wasConnected && !isConnected) {
        // Disconnected
        dispatch(recordConnectionEvent({ event: 'disconnected' }))

        // Start offline mode after delay to avoid false alarms
        offlineTimerRef.current = setTimeout(() => {
          dispatch(enableOfflineMode())

          Alert.alert(
            'Working Offline',
            'Internet connection lost. You can continue working - data will sync when connection is restored.',
            [{ text: 'OK' }]
          )
        }, 5000) // 5 second delay
      }
    }

    const scheduleConnectionSpeedTest = () => {
      // Clear existing timer
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current)
      }

      // Schedule speed test after delay
      connectionTimerRef.current = setTimeout(() => {
        dispatch(testConnectionSpeed())
      }, 3000)
    }

    // Initialize monitoring
    initializeNetworkMonitoring()

    // Periodic network state checks (every 30 seconds)
    const intervalId = setInterval(() => {
      dispatch(checkNetworkState())
    }, 30000)

    // Cleanup
    return () => {
      if (networkSubscription) {
        networkSubscription.remove()
      }
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current)
      }
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current)
      }
      clearInterval(intervalId)
    }
  }, [dispatch])

  // Handle app state changes for background/foreground transitions
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App became active, check network state
        dispatch(checkNetworkState())
      }
    }

    // Note: In a real implementation, we'd use AppState from react-native
    // For now, just check network state on mount

    return () => {
      // Cleanup if needed
    }
  }, [dispatch])

  // Network quality monitoring
  useEffect(() => {
    let qualityCheckInterval: NodeJS.Timeout | null = null

    const startQualityMonitoring = () => {
      qualityCheckInterval = setInterval(() => {
        if (networkStateRef.current?.isConnected && networkStateRef.current?.isInternetReachable) {
          // Test connection quality every 2 minutes
          dispatch(testConnectionSpeed())
        }
      }, 120000) // 2 minutes
    }

    const stopQualityMonitoring = () => {
      if (qualityCheckInterval) {
        clearInterval(qualityCheckInterval)
        qualityCheckInterval = null
      }
    }

    // Start monitoring if connected
    if (networkStateRef.current?.isConnected) {
      startQualityMonitoring()
    }

    return () => {
      stopQualityMonitoring()
    }
  }, [dispatch])

  // Emergency mode detection
  useEffect(() => {
    const handleEmergencyMode = () => {
      // In emergency mode, we're more tolerant of poor connections
      if (networkStateRef.current?.isConnected) {
        // Lower quality thresholds during disasters
        // This could be triggered by weather alerts or user settings
      }
    }

    // Could be triggered by external events
    // handleEmergencyMode()
  }, [])

  return <>{children}</>
}
