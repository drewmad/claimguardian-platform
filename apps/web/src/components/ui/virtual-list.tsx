/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Virtual scrolling component for efficiently rendering large lists"
 * @dependencies ["react"]
 * @status stable
 */
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  containerClassName?: string
  onScroll?: (scrollTop: number) => void
  estimatedItemHeight?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  containerClassName,
  onScroll,
  estimatedItemHeight = 50
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const measuredHeights = useRef<Map<number, number>>(new Map())

  // Calculate item heights
  const getItemHeight = useCallback((index: number): number => {
    if (typeof itemHeight === 'function') {
      const measured = measuredHeights.current.get(index)
      return measured || itemHeight(index) || estimatedItemHeight
    }
    return itemHeight
  }, [itemHeight, estimatedItemHeight])

  // Calculate total height
  const totalHeight = useMemo(() => {
    let height = 0
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i)
    }
    return height
  }, [items.length, getItemHeight])

  // Calculate visible range
  const visibleRange = useMemo(() => {
    let accumulatedHeight = 0
    let startIndex = 0
    let endIndex = items.length - 1

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i)
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
      accumulatedHeight += height
    }

    // Find end index
    accumulatedHeight = 0
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > containerHeight + scrollTop) {
        endIndex = Math.min(items.length - 1, i + overscan)
        break
      }
      accumulatedHeight += getItemHeight(i)
    }

    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, items.length, getItemHeight, overscan])

  // Calculate offset for visible items
  const offsetY = useMemo(() => {
    let offset = 0
    for (let i = 0; i < visibleRange.startIndex; i++) {
      offset += getItemHeight(i)
    }
    return offset
  }, [visibleRange.startIndex, getItemHeight])

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    onScroll?.(scrollTop)
  }, [onScroll])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollElementRef.current) {
        setContainerHeight(scrollElementRef.current.clientHeight)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Visible items
  const visibleItems = items.slice(
    visibleRange.startIndex,
    visibleRange.endIndex + 1
  )

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', containerClassName)}
      onScroll={handleScroll}
    >
      <div
        style={{ height: totalHeight, position: 'relative' }}
        className={className}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, idx) => {
            const actualIndex = visibleRange.startIndex + idx
            return (
              <div
                key={actualIndex}
                data-index={actualIndex}
                style={{
                  height: getItemHeight(actualIndex)
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Windowing hook for custom implementations
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3
}: {
  items: T[]
  itemHeight: number | ((index: number) => number)
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const getItemHeight = useCallback((index: number): number => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight
  }, [itemHeight])

  const visibleRange = useMemo(() => {
    let accumulatedHeight = 0
    let startIndex = 0
    let endIndex = items.length - 1

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i)
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
      accumulatedHeight += height
    }

    // Find end index
    accumulatedHeight = 0
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan)
        break
      }
      accumulatedHeight += getItemHeight(i)
    }

    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, items.length, getItemHeight, overscan])

  const totalHeight = useMemo(() => {
    return items.reduce((acc, _, index) => acc + getItemHeight(index), 0)
  }, [items, getItemHeight])

  const offsetY = useMemo(() => {
    let offset = 0
    for (let i = 0; i < visibleRange.startIndex; i++) {
      offset += getItemHeight(i)
    }
    return offset
  }, [visibleRange.startIndex, getItemHeight])

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    totalHeight,
    offsetY,
    visibleItems: items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }
}

// Virtual grid for image galleries
interface VirtualGridProps<T> {
  items: T[]
  columns: number
  rowHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  gap?: number
  overscan?: number
  className?: string
}

export function VirtualGrid<T>({
  items,
  columns,
  rowHeight,
  renderItem,
  gap = 16,
  overscan = 2,
  className
}: VirtualGridProps<T>) {
  const rows = Math.ceil(items.length / columns)
  const rowItems = useMemo(() => {
    const result: T[][] = []
    for (let i = 0; i < rows; i++) {
      result.push(items.slice(i * columns, (i + 1) * columns))
    }
    return result
  }, [items, rows, columns])

  return (
    <VirtualList
      items={rowItems}
      itemHeight={rowHeight}
      overscan={overscan}
      className={className}
      renderItem={(rowData, rowIndex) => (
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: `${gap}px`
          }}
        >
          {rowData.map((item, colIndex) => {
            const actualIndex = rowIndex * columns + colIndex
            return (
              <div key={actualIndex}>
                {renderItem(item, actualIndex)}
              </div>
            )
          })}
        </div>
      )}
    />
  )
}
