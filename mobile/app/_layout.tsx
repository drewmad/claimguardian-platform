/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Root layout for ClaimGuardian Mobile with offline-first architecture"
 * @dependencies ["expo-router", "react-redux", "expo-sqlite"]
 * @status stable
 */

import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { StatusBar } from 'expo-status-bar'
import * as SQLite from 'expo-sqlite'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { store, persistor } from '../shared/store'
import { LoadingScreen } from '../shared/components/LoadingScreen'
import { NetworkProvider } from '../shared/providers/NetworkProvider'
import { LocationProvider } from '../shared/providers/LocationProvider' 
import { CameraProvider } from '../shared/providers/CameraProvider'
import { DatabaseProvider } from '../shared/providers/DatabaseProvider'

export default function RootLayout() {
  useEffect(() => {
    // Initialize SQLite database for offline storage
    initializeDatabase()
  }, [])

  const initializeDatabase = async () => {
    try {
      const db = SQLite.openDatabase('claimguardian.db')
      
      // Create tables for offline data storage
      db.transaction(tx => {
        // Properties table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS properties (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            street1 TEXT NOT NULL,
            street2 TEXT,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            zip TEXT NOT NULL,
            county TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0
          );
        `)

        // Damage assessments table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS damage_assessments (
            id TEXT PRIMARY KEY,
            property_id TEXT NOT NULL,
            assessor_id TEXT NOT NULL,
            assessment_date TEXT NOT NULL,
            weather_conditions TEXT,
            overall_condition TEXT NOT NULL,
            estimated_total_damage REAL NOT NULL,
            priority_level TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            FOREIGN KEY (property_id) REFERENCES properties (id)
          );
        `)

        // Damage items table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS damage_items (
            id TEXT PRIMARY KEY,
            assessment_id TEXT NOT NULL,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            damage_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT NOT NULL,
            estimated_cost REAL NOT NULL,
            repair_priority TEXT NOT NULL,
            measurements TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            FOREIGN KEY (assessment_id) REFERENCES damage_assessments (id)
          );
        `)

        // Photos table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS photos (
            id TEXT PRIMARY KEY,
            assessment_id TEXT,
            damage_item_id TEXT,
            local_uri TEXT NOT NULL,
            remote_url TEXT,
            filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            latitude REAL,
            longitude REAL,
            timestamp TEXT NOT NULL,
            upload_status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0
          );
        `)

        // Voice notes table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS voice_notes (
            id TEXT PRIMARY KEY,
            assessment_id TEXT,
            damage_item_id TEXT,
            local_uri TEXT NOT NULL,
            remote_url TEXT,
            filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            duration_seconds REAL NOT NULL,
            transcription TEXT,
            upload_status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0
          );
        `)

        // Sync queue table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            operation TEXT NOT NULL,
            data TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0,
            last_error TEXT,
            created_at TEXT NOT NULL
          );
        `)

        console.log('Database initialized successfully')
      })
    } catch (error) {
      console.error('Failed to initialize database:', error)
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <DatabaseProvider>
              <NetworkProvider>
                <LocationProvider>
                  <CameraProvider>
                    <StatusBar style="light" backgroundColor="#111827" />
                    <Stack
                      screenOptions={{
                        headerStyle: {
                          backgroundColor: '#111827',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                          fontWeight: 'bold',
                        },
                        contentStyle: {
                          backgroundColor: '#111827',
                        },
                      }}
                    >
                      <Stack.Screen 
                        name="(tabs)" 
                        options={{ 
                          headerShown: false,
                          title: 'ClaimGuardian'
                        }} 
                      />
                      <Stack.Screen 
                        name="property/[id]" 
                        options={{ 
                          title: 'Property Details',
                          presentation: 'card'
                        }} 
                      />
                      <Stack.Screen 
                        name="assessment/[id]" 
                        options={{ 
                          title: 'Damage Assessment',
                          presentation: 'card'
                        }} 
                      />
                      <Stack.Screen 
                        name="camera" 
                        options={{ 
                          title: 'Capture Photo',
                          presentation: 'modal',
                          headerShown: false
                        }} 
                      />
                      <Stack.Screen 
                        name="photo-review" 
                        options={{ 
                          title: 'Review Photo',
                          presentation: 'modal'
                        }} 
                      />
                      <Stack.Screen 
                        name="sync-status" 
                        options={{ 
                          title: 'Sync Status',
                          presentation: 'modal'
                        }} 
                      />
                      <Stack.Screen 
                        name="settings" 
                        options={{ 
                          title: 'Settings',
                          presentation: 'modal'
                        }} 
                      />
                    </Stack>
                  </CameraProvider>
                </LocationProvider>
              </NetworkProvider>
            </DatabaseProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}