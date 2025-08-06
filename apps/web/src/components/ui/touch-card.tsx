/**
 * @fileMetadata
 * @purpose "Touch-optimized card component with gesture support and mobile interactions"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "class-variance-authority"]
 * @exports ["TouchCard", "TouchCardHeader", "TouchCardContent", "TouchCardFooter"]
 * @complexity medium
 * @tags ["card", "touch", "mobile", "gesture", "ui"]
 * @status stable
 */
'use client'

import { forwardRef, useState, useRef, useCallback, ReactNode } from 'react'
import { motion, MotionProps, PanInfo } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { MoreVertical, Heart, Share, Bookmark } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useTouchGestures } from '@/hooks/use-touch-gestures'

const touchCardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 touch-manipulation',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'shadow-lg border-transparent bg-white dark:bg-gray-800',
        outlined: 'border-2 shadow-none',
        ghost: 'border-transparent shadow-none bg-transparent',
        gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-transparent shadow-lg'
      },
      size: {
        default: 'p-4',
        sm: 'p-3',
        lg: 'p-6',
        xl: 'p-8'
      },
      interactive: {
        none: '',
        hover: 'hover:shadow-md cursor-pointer',
        press: 'active:scale-[0.98] cursor-pointer',
        both: 'hover:shadow-md active:scale-[0.98] cursor-pointer'
      },
      selectable: {
        none: '',
        single: 'cursor-pointer',
        multiple: 'cursor-pointer'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: 'none',
      selectable: 'none'
    }
  }
)

export interface TouchCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof touchCardVariants>,
    Omit<MotionProps, 'children'> {
  children?: ReactNode
  selected?: boolean
  onSelectionChange?: (selected: boolean) => void
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  hapticFeedback?: boolean
  rippleEffect?: boolean
  swipeActions?: boolean
  favoritable?: boolean
  onFavorite?: (favorited: boolean) => void
  shareable?: boolean
  onShare?: () => void
  bookmarkable?: boolean
  onBookmark?: (bookmarked: boolean) => void
  showMenu?: boolean
  onMenuClick?: () => void
}

export const TouchCard = forwardRef<HTMLDivElement, TouchCardProps>(
  ({
    className,
    variant,
    size,
    interactive,
    selectable,
    children,
    selected = false,
    onSelectionChange,
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipeLeft,
    onSwipeRight,
    hapticFeedback = true,
    rippleEffect = true,
    swipeActions = false,
    favoritable = false,
    onFavorite,
    shareable = false,
    onShare,
    bookmarkable = false,
    onBookmark,
    showMenu = false,
    onMenuClick,
    ...props
  }, ref) => {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
    const [isFavorited, setIsFavorited] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const rippleCounter = useRef(0)
    const cardRef = useRef<HTMLDivElement>(null)

    // Touch gesture handling
    const { elementRef: gestureRef, triggerHaptic } = useTouchGestures({
      onTap: () => {
        if (selectable !== 'none') {
          onSelectionChange?.(!selected)
        }
        onTap?.()
      },
      onDoubleTap: () => {
        if (favoritable) {
          const newState = !isFavorited
          setIsFavorited(newState)
          onFavorite?.(newState)
        }
        onDoubleTap?.()
      },
      onLongPress: () => {
        if (showMenu) {
          onMenuClick?.()
        }
        onLongPress?.()
      },
      onSwipeLeft,
      onSwipeRight,
      enableHapticFeedback: hapticFeedback
    })

    // Create ripple effect
    const createRipple = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      if (!rippleEffect || !interactive) return

      const card = cardRef.current
      if (!card) return

      const rect = card.getBoundingClientRect()
      const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left
      const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top

      const ripple = {
        id: ++rippleCounter.current,
        x,
        y
      }

      setRipples(prev => [...prev, ripple])

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== ripple.id))
      }, 600)
    }, [rippleEffect, interactive])

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      const newState = !isFavorited
      setIsFavorited(newState)
      onFavorite?.(newState)
      if (hapticFeedback) triggerHaptic('light')
    }

    const handleBookmarkClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      const newState = !isBookmarked
      setIsBookmarked(newState)
      onBookmark?.(newState)
      if (hapticFeedback) triggerHaptic('light')
    }

    const handleShareClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onShare?.()
      if (hapticFeedback) triggerHaptic('medium')
    }

    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onMenuClick?.()
      if (hapticFeedback) triggerHaptic('medium')
    }

    const motionProps: MotionProps = {
      whileTap: interactive === 'press' || interactive === 'both' ? { scale: 0.98 } : undefined,
      whileHover: interactive === 'hover' || interactive === 'both' ? { y: -2 } : undefined,
      transition: { type: "spring", stiffness: 300, damping: 20 },
      ...props
    }

    return (
      <motion.div
        ref={(node) => {
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
          cardRef.current = node
          gestureRef.current = node
        }}
        className={cn(
          touchCardVariants({ variant, size, interactive, selectable }),
          selected && selectable !== 'none' && 'ring-2 ring-primary shadow-lg',
          className
        )}
        onMouseDown={createRipple}
        onTouchStart={createRipple}
        {...motionProps}
      >
        {/* Selection indicator */}
        {selected && selectable !== 'none' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-3 h-3 bg-white rounded-full"
            />
          </motion.div>
        )}

        {/* Action buttons */}
        {(favoritable || shareable || bookmarkable || showMenu) && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {favoritable && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleFavoriteClick}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isFavorited 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30' 
                    : 'bg-white/80 text-gray-600 hover:bg-white dark:bg-gray-800/80'
                )}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart 
                  className={cn('w-4 h-4', isFavorited && 'fill-current')} 
                />
              </motion.button>
            )}

            {bookmarkable && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBookmarkClick}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isBookmarked 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' 
                    : 'bg-white/80 text-gray-600 hover:bg-white dark:bg-gray-800/80'
                )}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                <Bookmark 
                  className={cn('w-4 h-4', isBookmarked && 'fill-current')} 
                />
              </motion.button>
            )}

            {shareable && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShareClick}
                className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white dark:bg-gray-800/80 transition-colors"
                aria-label="Share"
              >
                <Share className="w-4 h-4" />
              </motion.button>
            )}

            {showMenu && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMenuClick}
                className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white dark:bg-gray-800/80 transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        )}

        {/* Ripple effects */}
        {rippleEffect && interactive && (
          <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
            {ripples.map(ripple => (
              <motion.div
                key={ripple.id}
                className="absolute bg-primary/20 rounded-full"
                style={{
                  left: ripple.x - 20,
                  top: ripple.y - 20,
                  width: 40,
                  height: 40
                }}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative">
          {children}
        </div>
      </motion.div>
    )
  }
)

TouchCard.displayName = 'TouchCard'

// Header component
export const TouchCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-3', className)}
    {...props}
  />
))
TouchCardHeader.displayName = 'TouchCardHeader'

// Content component
export const TouchCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
))
TouchCardContent.displayName = 'TouchCardContent'

// Footer component
export const TouchCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-3', className)}
    {...props}
  />
))
TouchCardFooter.displayName = 'TouchCardFooter'