/**
 * @fileMetadata
 * @purpose "Touch-optimized button component with haptic feedback and visual responses"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "class-variance-authority"]
 * @exports ["TouchButton"]
 * @complexity medium
 * @tags ["button", "touch", "mobile", "haptic", "ui"]
 * @status stable
 */
'use client'

import { forwardRef, useState, useCallback, useRef, useEffect } from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const touchButtonVariants = cva(
  'relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none touch-manipulation',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700',
        success: 'bg-green-600 text-white shadow-lg hover:bg-green-700',
        warning: 'bg-yellow-600 text-white shadow-lg hover:bg-yellow-700',
        danger: 'bg-red-600 text-white shadow-lg hover:bg-red-700'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-9 w-9',
        touch: 'h-12 px-6 text-base min-w-[44px]', // iOS minimum touch target
        fab: 'h-14 w-14 rounded-full shadow-xl' // Floating action button
      },
      pressEffect: {
        none: '',
        scale: 'active:scale-95',
        bounce: 'active:scale-110',
        sink: 'active:translate-y-0.5',
        glow: 'active:shadow-lg active:shadow-primary/25'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      pressEffect: 'scale'
    }
  }
)

export interface TouchButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof touchButtonVariants>,
    Omit<MotionProps, 'children'> {
  children?: React.ReactNode
  loading?: boolean
  loadingText?: string
  hapticFeedback?: 'light' | 'medium' | 'heavy' | false
  rippleEffect?: boolean
  longPressDelay?: number
  onLongPress?: () => void
  preventDoubleClick?: boolean
  doubleClickDelay?: number
  onDoubleClick?: () => void
  touchOptimized?: boolean
}

interface RippleEffect {
  id: number
  x: number
  y: number
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({
    className,
    variant,
    size,
    pressEffect,
    children,
    loading = false,
    loadingText,
    hapticFeedback = 'light',
    rippleEffect = true,
    longPressDelay = 500,
    onLongPress,
    preventDoubleClick = false,
    doubleClickDelay = 300,
    onDoubleClick,
    touchOptimized = true,
    onClick,
    onMouseDown,
    onTouchStart,
    disabled,
    ...props
  }, ref) => {
    const [ripples, setRipples] = useState<RippleEffect[]>([])
    const [isPressed, setIsPressed] = useState(false)
    const [lastClickTime, setLastClickTime] = useState(0)
    const longPressTimer = useRef<NodeJS.Timeout | null>(null)
    const rippleCounter = useRef(0)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // Trigger haptic feedback
    const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (hapticFeedback === false) return

      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [50]
        }
        navigator.vibrate(patterns[type])
      }
    }, [hapticFeedback])

    // Create ripple effect
    const createRipple = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      if (!rippleEffect || disabled || loading) return

      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left
      const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top

      const ripple: RippleEffect = {
        id: ++rippleCounter.current,
        x,
        y
      }

      setRipples(prev => [...prev, ripple])

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== ripple.id))
      }, 600)
    }, [rippleEffect, disabled, loading])

    // Handle press start (mouse down or touch start)
    const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || loading) return

      setIsPressed(true)
      createRipple(e)

      // Trigger haptic feedback
      triggerHaptic(hapticFeedback || 'light')

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          triggerHaptic('medium')
          onLongPress()
        }, longPressDelay)
      }

      // Call original handlers
      if ('button' in e && onMouseDown) {
        onMouseDown(e as React.MouseEvent<HTMLButtonElement>)
      }
      if ('touches' in e && onTouchStart) {
        onTouchStart(e as React.TouchEvent<HTMLButtonElement>)
      }
    }, [disabled, loading, createRipple, triggerHaptic, hapticFeedback, onLongPress, longPressDelay, onMouseDown, onTouchStart])

    // Handle press end
    const handlePressEnd = useCallback(() => {
      setIsPressed(false)
      
      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }, [])

    // Handle click with double-click prevention and detection
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return

      const now = Date.now()
      
      // Double click detection
      if (onDoubleClick && now - lastClickTime < doubleClickDelay) {
        triggerHaptic('medium')
        onDoubleClick()
        return
      }

      // Prevent double clicks if enabled
      if (preventDoubleClick && now - lastClickTime < doubleClickDelay) {
        return
      }

      setLastClickTime(now)
      
      // Call original onClick handler
      if (onClick && !preventDoubleClick) {
        onClick(e)
      } else if (onClick && preventDoubleClick) {
        // Delay the click to allow for double-click detection
        setTimeout(() => {
          if (Date.now() - lastClickTime >= doubleClickDelay) {
            onClick(e)
          }
        }, doubleClickDelay)
      }
    }, [disabled, loading, onDoubleClick, doubleClickDelay, preventDoubleClick, onClick, lastClickTime, triggerHaptic])

    // Clean up timers
    useEffect(() => {
      return () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
        }
      }
    }, [])

    const motionProps: MotionProps = {
      whileTap: pressEffect !== 'none' ? { scale: 0.95 } : undefined,
      whileHover: { scale: touchOptimized ? 1 : 1.05 },
      transition: { type: "spring", stiffness: 400, damping: 17 },
      ...props
    }

    return (
      <motion.button
        ref={ref || buttonRef}
        className={cn(
          touchButtonVariants({ variant, size, pressEffect, className }),
          touchOptimized && 'min-h-[44px] min-w-[44px]', // iOS minimum touch target
          isPressed && !disabled && !loading && 'scale-95'
        )}
        disabled={disabled || loading}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        onClick={handleClick}
        {...motionProps}
      >
        {/* Ripple effects */}
        {rippleEffect && (
          <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
            {ripples.map(ripple => (
              <motion.div
                key={ripple.id}
                className="absolute bg-white/30 rounded-full pointer-events-none"
                style={{
                  left: ripple.x,
                  top: ripple.y
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </div>
        )}

        {/* Button content */}
        <div className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingText && <span>{loadingText}</span>}
            </>
          ) : (
            children
          )}
        </div>

        {/* Accessibility improvements for touch */}
        <div className="absolute inset-0 rounded-[inherit]" aria-hidden="true" />
      </motion.button>
    )
  }
)

TouchButton.displayName = 'TouchButton'