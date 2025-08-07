/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Loading screen component for app initialization and data loading"
 * @dependencies ["react-native", "@expo/vector-icons"]
 * @status stable
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface LoadingScreenProps {
  message?: string
  showProgress?: boolean
  progress?: number
}

export function LoadingScreen({
  message = 'Loading ClaimGuardian...',
  showProgress = false,
  progress = 0
}: LoadingScreenProps) {
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [rotateAnim] = useState(new Animated.Value(0))
  const [progressAnim] = useState(new Animated.Value(0))

  const { width } = Dimensions.get('window')

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()

    // Scale in animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start()

    // Continuous rotation for loading icon
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    )
    rotateLoop.start()

    return () => rotateLoop.stop()
  }, [fadeAnim, scaleAnim, rotateAnim])

  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }, [progress, showProgress, progressAnim])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, width - 80],
    extrapolate: 'clamp',
  })

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <MaterialCommunityIcons
              name="shield-check"
              size={64}
              color="#3B82F6"
            />
          </View>
        </View>

        {/* Loading Animation */}
        <Animated.View
          style={[
            styles.loadingIcon,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="loading"
            size={32}
            color="#3B82F6"
          />
        </Animated.View>

        {/* App Name */}
        <Text style={styles.appName}>ClaimGuardian</Text>
        <Text style={styles.tagline}>AI-Powered Insurance Claims</Text>

        {/* Loading Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Progress Bar */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Loading Steps */}
        <View style={styles.stepsContainer}>
          <LoadingStep
            icon="database"
            text="Initializing database"
            completed={progress > 20}
            active={progress <= 20 && progress > 0}
          />
          <LoadingStep
            icon="wifi"
            text="Checking connectivity"
            completed={progress > 40}
            active={progress <= 40 && progress > 20}
          />
          <LoadingStep
            icon="map-marker"
            text="Setting up location"
            completed={progress > 60}
            active={progress <= 60 && progress > 40}
          />
          <LoadingStep
            icon="camera"
            text="Preparing camera"
            completed={progress > 80}
            active={progress <= 80 && progress > 60}
          />
          <LoadingStep
            icon="check-circle"
            text="Ready to go"
            completed={progress > 95}
            active={progress <= 95 && progress > 80}
          />
        </View>
      </Animated.View>

      {/* Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2025 ClaimGuardian AI</Text>
      </View>
    </View>
  )
}

interface LoadingStepProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  text: string
  completed: boolean
  active: boolean
}

function LoadingStep({ icon, text, completed, active }: LoadingStepProps) {
  const [stepFadeAnim] = useState(new Animated.Value(0.3))

  useEffect(() => {
    if (active || completed) {
      Animated.timing(stepFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [active, completed, stepFadeAnim])

  return (
    <Animated.View
      style={[
        styles.step,
        {
          opacity: stepFadeAnim,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={completed ? 'check-circle' : icon}
        size={16}
        color={completed ? '#10B981' : active ? '#3B82F6' : '#6B7280'}
      />
      <Text
        style={[
          styles.stepText,
          {
            color: completed ? '#10B981' : active ? '#3B82F6' : '#6B7280',
          },
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  loadingIcon: {
    marginTop: 20,
    marginBottom: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  message: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  stepsContainer: {
    alignItems: 'flex-start',
    marginTop: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  stepText: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#4B5563',
  },
})
