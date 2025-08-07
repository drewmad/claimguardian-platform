/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "SQLite database provider for offline data management and initialization"
 * @dependencies ["expo-sqlite", "react-redux"]
 * @status stable
 */

import React, { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import * as SQLite from 'expo-sqlite'
import { useDispatch } from 'react-redux'

import {
  loadPropertiesFromDatabase
} from '../store/slices/propertiesSlice'
import {
  loadAssessmentsFromDatabase
} from '../store/slices/assessmentsSlice'
import {
  loadDamageItemsFromDatabase
} from '../store/slices/damageItemsSlice'
import {
  loadPhotosFromDatabase
} from '../store/slices/photosSlice'
import {
  loadVoiceNotesFromDatabase
} from '../store/slices/voiceNotesSlice'
import { syncService } from '../services/syncService'
import type { AppDispatch } from '../store'

interface DatabaseProviderProps {
  children: React.ReactNode
}

const DATABASE_NAME = 'claimguardian.db'
const DATABASE_VERSION = 1

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const dispatch = useDispatch<AppDispatch>()
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null)

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Open database connection
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME)
        dbRef.current = db

        // Enable foreign key constraints
        await db.execAsync('PRAGMA foreign_keys = ON;')

        // Create tables
        await createTables(db)

        // Load initial data from database
        await loadInitialData()

        console.log('Database initialized successfully')

      } catch (error) {
        console.error('Failed to initialize database:', error)

        Alert.alert(
          'Database Error',
          'Failed to initialize local database. Some features may not work properly.',
          [{ text: 'OK' }]
        )
      }
    }

    const createTables = async (db: SQLite.SQLiteDatabase) => {
      const createTableQueries = [
        // Properties table
        `CREATE TABLE IF NOT EXISTS properties (
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
        );`,

        // Damage assessments table
        `CREATE TABLE IF NOT EXISTS damage_assessments (
          id TEXT PRIMARY KEY,
          property_id TEXT NOT NULL,
          assessor_id TEXT NOT NULL,
          assessment_date TEXT NOT NULL,
          weather_conditions TEXT,
          overall_condition TEXT NOT NULL CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor', 'severe')),
          estimated_total_damage REAL NOT NULL DEFAULT 0,
          priority_level TEXT NOT NULL CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE
        );`,

        // Damage items table
        `CREATE TABLE IF NOT EXISTS damage_items (
          id TEXT PRIMARY KEY,
          assessment_id TEXT NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('structural', 'exterior', 'interior', 'electrical', 'plumbing', 'hvac', 'other')),
          location TEXT NOT NULL,
          damage_type TEXT NOT NULL CHECK (damage_type IN ('water', 'fire', 'wind', 'hail', 'flood', 'impact', 'wear', 'other')),
          severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'total_loss')),
          description TEXT NOT NULL,
          estimated_cost REAL NOT NULL DEFAULT 0,
          repair_priority TEXT NOT NULL CHECK (repair_priority IN ('low', 'medium', 'high', 'emergency')),
          measurements TEXT, -- JSON string for measurements object
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (assessment_id) REFERENCES damage_assessments (id) ON DELETE CASCADE
        );`,

        // Photos table
        `CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY,
          assessment_id TEXT,
          damage_item_id TEXT,
          local_uri TEXT NOT NULL UNIQUE,
          remote_url TEXT,
          filename TEXT NOT NULL,
          file_size INTEGER NOT NULL DEFAULT 0,
          mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
          width INTEGER NOT NULL DEFAULT 0,
          height INTEGER NOT NULL DEFAULT 0,
          latitude REAL,
          longitude REAL,
          timestamp TEXT NOT NULL,
          upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
          created_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (assessment_id) REFERENCES damage_assessments (id) ON DELETE CASCADE,
          FOREIGN KEY (damage_item_id) REFERENCES damage_items (id) ON DELETE CASCADE
        );`,

        // Voice notes table
        `CREATE TABLE IF NOT EXISTS voice_notes (
          id TEXT PRIMARY KEY,
          assessment_id TEXT,
          damage_item_id TEXT,
          local_uri TEXT NOT NULL UNIQUE,
          remote_url TEXT,
          filename TEXT NOT NULL,
          file_size INTEGER NOT NULL DEFAULT 0,
          duration_seconds REAL NOT NULL DEFAULT 0,
          transcription TEXT,
          upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
          created_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (assessment_id) REFERENCES damage_assessments (id) ON DELETE CASCADE,
          FOREIGN KEY (damage_item_id) REFERENCES damage_items (id) ON DELETE CASCADE
        );`,

        // Sync queue table
        `CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
          data TEXT NOT NULL, -- JSON string
          retry_count INTEGER DEFAULT 0,
          last_error TEXT,
          created_at TEXT NOT NULL,
          UNIQUE(entity_type, entity_id, operation)
        );`,

        // User settings table
        `CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      ]

      // Create indexes for better performance
      const createIndexQueries = [
        'CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);',
        'CREATE INDEX IF NOT EXISTS idx_assessments_property_id ON damage_assessments(property_id);',
        'CREATE INDEX IF NOT EXISTS idx_damage_items_assessment_id ON damage_items(assessment_id);',
        'CREATE INDEX IF NOT EXISTS idx_photos_assessment_id ON photos(assessment_id);',
        'CREATE INDEX IF NOT EXISTS idx_photos_damage_item_id ON photos(damage_item_id);',
        'CREATE INDEX IF NOT EXISTS idx_voice_notes_assessment_id ON voice_notes(assessment_id);',
        'CREATE INDEX IF NOT EXISTS idx_voice_notes_damage_item_id ON voice_notes(damage_item_id);',
        'CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);',
        'CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);',
        'CREATE INDEX IF NOT EXISTS idx_photos_upload_status ON photos(upload_status);',
        'CREATE INDEX IF NOT EXISTS idx_voice_notes_upload_status ON voice_notes(upload_status);',
        'CREATE INDEX IF NOT EXISTS idx_properties_synced ON properties(synced);',
        'CREATE INDEX IF NOT EXISTS idx_assessments_synced ON damage_assessments(synced);',
        'CREATE INDEX IF NOT EXISTS idx_damage_items_synced ON damage_items(synced);'
      ]

      // Execute all table creation queries
      for (const query of createTableQueries) {
        await db.execAsync(query)
      }

      // Execute all index creation queries
      for (const query of createIndexQueries) {
        await db.execAsync(query)
      }
    }

    const loadInitialData = async () => {
      try {
        // Load all data from database into Redux store
        await Promise.all([
          dispatch(loadPropertiesFromDatabase()),
          dispatch(loadAssessmentsFromDatabase()),
          dispatch(loadDamageItemsFromDatabase()),
          dispatch(loadPhotosFromDatabase({})),
          dispatch(loadVoiceNotesFromDatabase({}))
        ])
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    initializeDatabase()
  }, [dispatch])

  // Database maintenance
  useEffect(() => {
    const performMaintenance = async () => {
      if (!dbRef.current) return

      try {
        // Clean up old sync queue entries (older than 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        await dbRef.current.execAsync(
          `DELETE FROM sync_queue WHERE created_at < '${sevenDaysAgo}' AND retry_count >= 3;`
        )

        // Clean up orphaned photos (not linked to any assessment or damage item)
        await dbRef.current.execAsync(`
          DELETE FROM photos
          WHERE assessment_id IS NULL
            AND damage_item_id IS NULL
            AND created_at < '${sevenDaysAgo}';
        `)

        // Clean up orphaned voice notes
        await dbRef.current.execAsync(`
          DELETE FROM voice_notes
          WHERE assessment_id IS NULL
            AND damage_item_id IS NULL
            AND created_at < '${sevenDaysAgo}';
        `)

        // Vacuum database to reclaim space
        await dbRef.current.execAsync('VACUUM;')

        console.log('Database maintenance completed')

      } catch (error) {
        console.error('Database maintenance failed:', error)
      }
    }

    // Run maintenance daily
    const maintenanceInterval = setInterval(performMaintenance, 24 * 60 * 60 * 1000)

    return () => clearInterval(maintenanceInterval)
  }, [])

  // Database integrity checks
  useEffect(() => {
    const checkIntegrity = async () => {
      if (!dbRef.current) return

      try {
        const result = await dbRef.current.getFirstAsync('PRAGMA integrity_check;')
        if (result && typeof result === 'object' && 'integrity_check' in result) {
          if (result.integrity_check !== 'ok') {
            console.error('Database integrity check failed:', result.integrity_check)

            Alert.alert(
              'Database Integrity Issue',
              'Local database may be corrupted. Consider clearing app data if problems persist.',
              [{ text: 'OK' }]
            )
          }
        }
      } catch (error) {
        console.error('Failed to check database integrity:', error)
      }
    }

    // Check integrity on startup and then weekly
    checkIntegrity()
    const integrityInterval = setInterval(checkIntegrity, 7 * 24 * 60 * 60 * 1000)

    return () => clearInterval(integrityInterval)
  }, [])

  // Database size monitoring
  useEffect(() => {
    const monitorDatabaseSize = async () => {
      if (!dbRef.current) return

      try {
        // Get database size information
        const result = await dbRef.current.getFirstAsync('PRAGMA page_count;')
        const pageSize = await dbRef.current.getFirstAsync('PRAGMA page_size;')

        if (result && pageSize &&
            typeof result === 'object' && 'page_count' in result &&
            typeof pageSize === 'object' && 'page_size' in pageSize) {

          const totalSize = Number(result.page_count) * Number(pageSize.page_size)
          const sizeMB = totalSize / (1024 * 1024)

          console.log(`Database size: ${sizeMB.toFixed(2)} MB`)

          // Warn if database is getting large (> 100MB)
          if (sizeMB > 100) {
            console.warn('Database size is large, consider cleanup')
          }
        }
      } catch (error) {
        console.error('Failed to monitor database size:', error)
      }
    }

    // Monitor size weekly
    const sizeInterval = setInterval(monitorDatabaseSize, 7 * 24 * 60 * 60 * 1000)

    return () => clearInterval(sizeInterval)
  }, [])

  // Handle app state changes for database connections
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        // App going to background, could close database connection if needed
        console.log('App backgrounded, database connection remains open')
      } else if (nextAppState === 'active') {
        // App became active, ensure database is ready
        console.log('App active, database ready')
      }
    }

    // Note: In real implementation, would use AppState.addEventListener
    return () => {
      // Cleanup
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dbRef.current) {
        // Note: SQLite databases are automatically closed when app terminates
        console.log('Database provider cleanup')
      }
    }
  }, [])

  return <>{children}</>
}
