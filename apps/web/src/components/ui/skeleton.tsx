/**
 * @fileMetadata
 * @purpose "Versatile skeleton loading component with animation effects"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "cn"]
 * @exports ["Skeleton", "SkeletonText", "SkeletonCard", "SkeletonTable"]
 * @complexity low
 * @tags ["loading", "skeleton", "animation", "ui"]
 * @status stable
 */
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'rounded' | 'circular'
  animation?: 'pulse' | 'wave' | 'none'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'default',
  animation = 'pulse',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const skeletonStyle = {
    width,
    height,
    ...style
  }

  const baseClasses = cn(
    "bg-gray-300 dark:bg-gray-700",
    {
      "rounded-md": variant === 'default',
      "rounded-lg": variant === 'rounded',
      "rounded-full": variant === 'circular',
    },
    className
  )

  if (animation === 'pulse') {
    return (
      <motion.div
        className={baseClasses}
        style={skeletonStyle}
        animate={{
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        {...props}
      />
    )
  }

  if (animation === 'wave') {
    return (
      <div
        className={cn(baseClasses, "relative overflow-hidden")}
        style={skeletonStyle}
        {...props}
      >
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['100%', '-100%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={baseClasses}
      style={skeletonStyle}
      {...props}
    />
  )
}

export interface SkeletonTextProps {
  lines?: number
  className?: string
  width?: 'full' | 'short' | 'medium' | 'long'
}

export function SkeletonText({
  lines = 1,
  className,
  width = 'full'
}: SkeletonTextProps) {
  const widthClasses = {
    full: 'w-full',
    short: 'w-1/4',
    medium: 'w-1/2',
    long: 'w-3/4'
  }

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => {
        const isLastLine = index === lines - 1
        const lineWidth = isLastLine && lines > 1 ? 'w-2/3' : widthClasses[width]

        return (
          <Skeleton
            key={index}
            className={cn("h-4", lineWidth)}
            animation="wave"
          />
        )
      })}
    </div>
  )
}

export interface SkeletonCardProps {
  showAvatar?: boolean
  showImage?: boolean
  textLines?: number
  className?: string
}

export function SkeletonCard({
  showAvatar = false,
  showImage = false,
  textLines = 3,
  className
}: SkeletonCardProps) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      {/* Header with avatar */}
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <Skeleton variant="circular" className="w-10 h-10" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      )}

      {/* Featured image */}
      {showImage && (
        <Skeleton
          variant="rounded"
          className="w-full h-48"
          animation="wave"
        />
      )}

      {/* Title */}
      <Skeleton className="h-6 w-3/4" animation="pulse" />

      {/* Text content */}
      <SkeletonText lines={textLines} width="full" />

      {/* Action buttons */}
      <div className="flex space-x-2 pt-2">
        <Skeleton className="h-10 w-20" variant="rounded" />
        <Skeleton className="h-10 w-24" variant="rounded" />
      </div>
    </div>
  )
}

export interface SkeletonTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}: SkeletonTableProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Table header */}
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} className="h-4 w-full" />
          ))}
        </div>
      )}

      {/* Table rows */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4 p-2"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4"
                animation="wave"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Pre-built skeletons for common use cases
export const PropertyCardSkeleton = () => (
  <SkeletonCard
    showImage={true}
    showAvatar={false}
    textLines={2}
    className="border rounded-lg bg-white dark:bg-gray-800"
  />
)

export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="p-6 border rounded-lg bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton variant="circular" className="w-8 h-8" />
        </div>
        <Skeleton className="h-8 w-20 mt-4" />
        <Skeleton className="h-3 w-24 mt-2" />
      </div>
    ))}
  </div>
)

export const ClaimCardSkeleton = () => (
  <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <SkeletonText lines={2} />
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
)
