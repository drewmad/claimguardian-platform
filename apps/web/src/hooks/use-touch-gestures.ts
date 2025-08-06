/**
 * @fileMetadata
 * @purpose "Custom hook for handling touch gestures and mobile interactions"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion"]
 * @exports ["useTouchGestures", "useSwipeGesture", "usePinchGesture"]
 * @complexity high
 * @tags ["touch", "gestures", "mobile", "hooks"]
 * @status stable
 */
'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { PanInfo } from 'framer-motion'

export interface TouchGestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  onPinchIn?: (scale: number) => void
  onPinchOut?: (scale: number) => void
  swipeThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
  enableHapticFeedback?: boolean
}

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
  velocity: number
}

// Haptic feedback function (works on iOS Safari and Android Chrome)
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    }
    navigator.vibrate(patterns[type])
  }
  
  // iOS haptic feedback (if available)
  if ('hapticFeedback' in navigator) {
    try {
      ;(navigator as any).hapticFeedback.vibrate({ type })
    } catch (e) {
      // Silently fail if not supported
    }
  }
}

export function useTouchGestures(config: TouchGestureConfig) {
  const elementRef = useRef<HTMLElement>(null)
  const gestureState = useRef({
    startTime: 0,
    lastTap: 0,
    tapCount: 0,
    isLongPressing: false,
    longPressTimer: null as NodeJS.Timeout | null,
    startPosition: { x: 0, y: 0 },
    initialDistance: 0,
    currentScale: 1
  })

  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    enableHapticFeedback = true
  } = config

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    const now = Date.now()
    
    gestureState.current.startTime = now
    gestureState.current.startPosition = { x: touch.clientX, y: touch.clientY }
    
    // Handle long press
    if (config.onLongPress) {
      gestureState.current.longPressTimer = setTimeout(() => {
        gestureState.current.isLongPressing = true
        if (enableHapticFeedback) triggerHaptic('medium')
        config.onLongPress?.()
      }, longPressDelay)
    }

    // Handle pinch gestures
    if (e.touches.length === 2 && (config.onPinchIn || config.onPinchOut)) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      gestureState.current.initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
    }
  }, [config, longPressDelay, enableHapticFeedback])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Cancel long press if finger moves
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer)
      gestureState.current.longPressTimer = null
    }

    // Handle pinch gestures
    if (e.touches.length === 2 && (config.onPinchIn || config.onPinchOut)) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      const scale = currentDistance / gestureState.current.initialDistance
      
      if (scale > gestureState.current.currentScale) {
        config.onPinchOut?.(scale)
      } else {
        config.onPinchIn?.(scale)
      }
      
      gestureState.current.currentScale = scale
    }
  }, [config])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0]
    const now = Date.now()
    const deltaTime = now - gestureState.current.startTime
    const deltaX = touch.clientX - gestureState.current.startPosition.x
    const deltaY = touch.clientY - gestureState.current.startPosition.y
    const distance = Math.hypot(deltaX, deltaY)

    // Clear long press timer
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer)
      gestureState.current.longPressTimer = null
    }

    // Skip tap handling if this was a long press
    if (gestureState.current.isLongPressing) {
      gestureState.current.isLongPressing = false
      return
    }

    // Handle swipe gestures
    if (distance > swipeThreshold && deltaTime < 300) {
      const velocity = distance / deltaTime
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          if (enableHapticFeedback) triggerHaptic('light')
          config.onSwipeRight?.()
        } else {
          if (enableHapticFeedback) triggerHaptic('light')
          config.onSwipeLeft?.()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          if (enableHapticFeedback) triggerHaptic('light')
          config.onSwipeDown?.()
        } else {
          if (enableHapticFeedback) triggerHaptic('light')
          config.onSwipeUp?.()
        }
      }
      return
    }

    // Handle tap gestures (only if not a swipe)
    if (distance < 20 && deltaTime < 300) {
      gestureState.current.tapCount++
      
      if (gestureState.current.tapCount === 1) {
        // Wait for potential double tap
        setTimeout(() => {
          if (gestureState.current.tapCount === 1) {
            if (enableHapticFeedback) triggerHaptic('light')
            config.onTap?.()
          }
          gestureState.current.tapCount = 0
        }, doubleTapDelay)
      } else if (gestureState.current.tapCount === 2) {
        // Double tap
        if (enableHapticFeedback) triggerHaptic('medium')
        config.onDoubleTap?.()
        gestureState.current.tapCount = 0
      }
    }
  }, [config, swipeThreshold, doubleTapDelay, enableHapticFeedback])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      
      // Clear any pending timers
      if (gestureState.current.longPressTimer) {
        clearTimeout(gestureState.current.longPressTimer)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    elementRef,
    triggerHaptic
  }
}

// Simplified hook for basic swipe detection
export function useSwipeGesture(
  onSwipe: (direction: SwipeDirection) => void,
  threshold: number = 50
) {
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>({
    direction: null,
    distance: 0,
    velocity: 0
  })

  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    const distance = Math.hypot(offset.x, offset.y)
    
    if (distance < threshold) return
    
    let direction: SwipeDirection['direction'] = null
    
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      direction = offset.x > 0 ? 'right' : 'left'
    } else {
      direction = offset.y > 0 ? 'down' : 'up'
    }

    const swipeData: SwipeDirection = {
      direction,
      distance,
      velocity: Math.hypot(velocity.x, velocity.y)
    }

    setSwipeDirection(swipeData)
    onSwipe(swipeData)
  }, [onSwipe, threshold])

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Reset after a delay
    setTimeout(() => {
      setSwipeDirection({ direction: null, distance: 0, velocity: 0 })
    }, 100)
  }, [])

  return {
    swipeDirection,
    handleDrag,
    handleDragEnd
  }
}

// Hook for pinch-to-zoom functionality
export function usePinchGesture(
  onPinch: (scale: number, isZooming: boolean) => void,
  minScale: number = 0.5,
  maxScale: number = 3
) {
  const [scale, setScale] = useState(1)
  const [isActive, setIsActive] = useState(false)
  
  const gestureRef = useRef<HTMLElement>(null)
  const initialDistance = useRef(0)
  const currentScale = useRef(1)

  const getDistance = useCallback((touches: TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    )
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      setIsActive(true)
      initialDistance.current = getDistance(e.touches)
      e.preventDefault()
    }
  }, [getDistance])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && isActive) {
      const distance = getDistance(e.touches)
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, currentScale.current * (distance / initialDistance.current))
      )
      
      setScale(newScale)
      onPinch(newScale, newScale > currentScale.current)
      e.preventDefault()
    }
  }, [getDistance, isActive, minScale, maxScale, onPinch])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      setIsActive(false)
      currentScale.current = scale
    }
  }, [scale])

  useEffect(() => {
    const element = gestureRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchmove', handleTouchMove)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const resetScale = useCallback(() => {
    setScale(1)
    currentScale.current = 1
    onPinch(1, false)
  }, [onPinch])

  return {
    gestureRef,
    scale,
    isActive,
    resetScale
  }
}