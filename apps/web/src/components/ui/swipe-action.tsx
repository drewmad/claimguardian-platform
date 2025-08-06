/**
 * @fileMetadata
 * @purpose "Swipe-to-action component for mobile interfaces (like iOS swipe to delete)"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["SwipeAction", "SwipeActionItem"]
 * @complexity high
 * @tags ["swipe", "gesture", "mobile", "action", "ui"]
 * @status stable
 */
'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { Trash2, Archive, Edit, Heart, Share, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface SwipeActionConfig {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray'
  action: () => void
  destructive?: boolean
}

export interface SwipeActionProps {
  children: ReactNode
  leftActions?: SwipeActionConfig[]
  rightActions?: SwipeActionConfig[]
  onSwipe?: (direction: 'left' | 'right', actionId: string) => void
  disabled?: boolean
  threshold?: number
  maxSwipe?: number
  hapticFeedback?: boolean
  className?: string
}

const colorClasses = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  purple: 'bg-purple-500 text-white',
  gray: 'bg-gray-500 text-white'
}

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [50] }
    navigator.vibrate(patterns[type])
  }
}

export function SwipeAction({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  disabled = false,
  threshold = 80,
  maxSwipe = 200,
  hapticFeedback = true,
  className
}: SwipeActionProps) {
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const isDragging = useRef(false)
  const hasTriggeredHaptic = useRef(false)

  // Transform for background opacity based on drag distance
  const leftBackgroundOpacity = useTransform(x, [0, threshold], [0, 1])
  const rightBackgroundOpacity = useTransform(x, [-threshold, 0], [1, 0])

  const handleDragStart = useCallback(() => {
    isDragging.current = true
    hasTriggeredHaptic.current = false
  }, [])

  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return

    const { offset } = info
    const distance = Math.abs(offset.x)

    // Trigger haptic feedback when crossing threshold
    if (hapticFeedback && !hasTriggeredHaptic.current && distance > threshold) {
      triggerHaptic('light')
      hasTriggeredHaptic.current = true
    }

    // Determine which action would be triggered
    if (offset.x > threshold && rightActions.length > 0) {
      const actionIndex = Math.min(
        Math.floor((offset.x - threshold) / (maxSwipe - threshold) * rightActions.length),
        rightActions.length - 1
      )
      setActiveAction(rightActions[actionIndex]?.id || null)
    } else if (offset.x < -threshold && leftActions.length > 0) {
      const actionIndex = Math.min(
        Math.floor((Math.abs(offset.x) - threshold) / (maxSwipe - threshold) * leftActions.length),
        leftActions.length - 1
      )
      setActiveAction(leftActions[actionIndex]?.id || null)
    } else {
      setActiveAction(null)
    }
  }, [disabled, threshold, maxSwipe, rightActions, leftActions, hapticFeedback])

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = false
    hasTriggeredHaptic.current = false

    const { offset, velocity } = info
    const distance = Math.abs(offset.x)
    const velocityThreshold = 500

    // Check if we should trigger an action
    const shouldTriggerAction = distance > threshold || Math.abs(velocity.x) > velocityThreshold

    if (shouldTriggerAction) {
      if (offset.x > 0 && rightActions.length > 0) {
        // Swiped right - show right actions
        const actionIndex = Math.min(
          Math.floor((offset.x - threshold) / (maxSwipe - threshold) * rightActions.length),
          rightActions.length - 1
        )
        const action = rightActions[actionIndex]
        
        if (action) {
          if (hapticFeedback) triggerHaptic(action.destructive ? 'heavy' : 'medium')
          setIsOpen('right')
          onSwipe?.('right', action.id)
          
          // Auto-execute action after a brief delay
          setTimeout(() => {
            action.action()
            setIsOpen(null)
            setActiveAction(null)
          }, 150)
        }
      } else if (offset.x < 0 && leftActions.length > 0) {
        // Swiped left - show left actions
        const actionIndex = Math.min(
          Math.floor((Math.abs(offset.x) - threshold) / (maxSwipe - threshold) * leftActions.length),
          leftActions.length - 1
        )
        const action = leftActions[actionIndex]
        
        if (action) {
          if (hapticFeedback) triggerHaptic(action.destructive ? 'heavy' : 'medium')
          setIsOpen('left')
          onSwipe?.('left', action.id)
          
          // Auto-execute action after a brief delay
          setTimeout(() => {
            action.action()
            setIsOpen(null)
            setActiveAction(null)
          }, 150)
        }
      }
    } else {
      // Snap back to center
      setIsOpen(null)
      setActiveAction(null)
    }
  }, [threshold, maxSwipe, rightActions, leftActions, onSwipe, hapticFeedback])

  const renderActions = (actions: SwipeActionConfig[], side: 'left' | 'right') => {
    if (actions.length === 0) return null

    return (
      <div className={cn(
        'absolute top-0 h-full flex items-center',
        side === 'left' ? 'left-0' : 'right-0'
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon
          const isActive = activeAction === action.id

          return (
            <motion.div
              key={action.id}
              className={cn(
                'flex flex-col items-center justify-center px-4 h-full min-w-[80px] transition-all duration-200',
                colorClasses[action.color],
                isActive && 'scale-110 shadow-lg',
                action.destructive && 'bg-red-600'
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: isActive ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Icon className={cn('w-5 h-5 mb-1', isActive && 'scale-125')} />
              <span className="text-xs font-medium">{action.label}</span>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div 
      ref={constraintsRef}
      className={cn('relative overflow-hidden bg-white dark:bg-gray-800', className)}
    >
      {/* Left actions background */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute left-0 top-0 h-full w-full"
          style={{ opacity: leftBackgroundOpacity }}
        >
          {renderActions(leftActions, 'left')}
        </motion.div>
      )}

      {/* Right actions background */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute right-0 top-0 h-full w-full"
          style={{ opacity: rightBackgroundOpacity }}
        >
          {renderActions(rightActions, 'right')}
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={constraintsRef}
        dragElastic={{ left: 0.1, right: 0.1 }}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-white dark:bg-gray-800 z-10"
        whileDrag={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// Preset action configurations
export const SwipeActionPresets = {
  delete: (onDelete: () => void): SwipeActionConfig => ({
    id: 'delete',
    icon: Trash2,
    label: 'Delete',
    color: 'red',
    action: onDelete,
    destructive: true
  }),

  archive: (onArchive: () => void): SwipeActionConfig => ({
    id: 'archive',
    icon: Archive,
    label: 'Archive',
    color: 'blue',
    action: onArchive
  }),

  edit: (onEdit: () => void): SwipeActionConfig => ({
    id: 'edit',
    icon: Edit,
    label: 'Edit',
    color: 'gray',
    action: onEdit
  }),

  favorite: (onFavorite: () => void): SwipeActionConfig => ({
    id: 'favorite',
    icon: Heart,
    label: 'Favorite',
    color: 'red',
    action: onFavorite
  }),

  share: (onShare: () => void): SwipeActionConfig => ({
    id: 'share',
    icon: Share,
    label: 'Share',
    color: 'blue',
    action: onShare
  }),

  more: (onMore: () => void): SwipeActionConfig => ({
    id: 'more',
    icon: MoreHorizontal,
    label: 'More',
    color: 'gray',
    action: onMore
  })
}

// Example usage component
export function SwipeActionItem({ 
  title, 
  subtitle, 
  onDelete, 
  onEdit, 
  onShare,
  className 
}: {
  title: string
  subtitle?: string
  onDelete: () => void
  onEdit: () => void
  onShare: () => void
  className?: string
}) {
  return (
    <SwipeAction
      leftActions={[
        SwipeActionPresets.edit(onEdit),
        SwipeActionPresets.share(onShare)
      ]}
      rightActions={[
        SwipeActionPresets.delete(onDelete)
      ]}
      className={className}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </SwipeAction>
  )
}