/**
 * @fileMetadata
 * @purpose "Enhanced mobile-responsive modal component with touch interactions"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["ResponsiveModal"]
 * @complexity high
 * @tags ["modal", "responsive", "mobile", "touch", "accessibility"]
 * @status stable
 */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  position?: 'center' | 'top' | 'bottom'
  allowDismiss?: boolean
  showHeader?: boolean
  showCloseButton?: boolean
  className?: string
  overlayClassName?: string
  mobileSlideUp?: boolean
  enableSwipeToClose?: boolean
  enablePinchToZoom?: boolean
  maxHeight?: string
  scrollable?: boolean
  preventBodyScroll?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw] max-h-[95vh]'
}

const mobileBreakpoint = 768 // md breakpoint

export function ResponsiveModal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  position = 'center',
  allowDismiss = true,
  showHeader = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  mobileSlideUp = true,
  enableSwipeToClose = true,
  enablePinchToZoom = false,
  maxHeight = '90vh',
  scrollable = true,
  preventBodyScroll = true
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const startTouchY = useRef<number>(0)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && preventBodyScroll) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px' // Prevent layout shift
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen, preventBodyScroll])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && allowDismiss && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, allowDismiss, onClose])

  // Handle swipe to close on mobile
  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!enableSwipeToClose || !isMobile) return
    
    const { offset } = info
    setDragOffset(Math.max(0, offset.y))
  }, [enableSwipeToClose, isMobile])

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!enableSwipeToClose || !isMobile) return
    
    const { offset, velocity } = info
    const threshold = 150
    const velocityThreshold = 500

    if (offset.y > threshold || velocity.y > velocityThreshold) {
      onClose()
    } else {
      setDragOffset(0)
    }
  }, [enableSwipeToClose, isMobile, onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && allowDismiss) {
      onClose()
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!isOpen) return null

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: isMobile ? 1 : 0.95,
      y: isMobile && mobileSlideUp ? '100%' : 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: isMobile ? 1 : 0.95,
      y: isMobile && mobileSlideUp ? '100%' : 0,
      transition: {
        duration: 0.2
      }
    }
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const getModalClasses = () => {
    let classes = 'relative bg-white dark:bg-gray-900 shadow-2xl'
    
    if (isMobile) {
      classes += ' w-full max-w-none'
      if (mobileSlideUp) {
        classes += ' rounded-t-2xl'
        if (position === 'bottom') {
          classes += ' min-h-[60vh] max-h-[90vh]'
        }
      } else {
        classes += ' rounded-lg m-4'
      }
    } else {
      classes += ` ${sizeClasses[size]} rounded-xl`
      if (isFullscreen) {
        classes = classes.replace(sizeClasses[size], 'w-[95vw] h-[95vh]')
      }
    }

    return `${classes} ${className}`
  }

  const getModalPosition = () => {
    if (isMobile && mobileSlideUp) {
      return position === 'top' ? 'justify-start' : 'justify-end'
    }
    
    switch (position) {
      case 'top': return 'justify-start items-start pt-16'
      case 'bottom': return 'justify-end items-end pb-16'
      default: return 'justify-center items-center'
    }
  }

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex overflow-hidden">
        <motion.div
          ref={overlayRef}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${overlayClassName}`}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleOverlayClick}
        />
        
        <div className={`relative z-10 flex w-full ${getModalPosition()}`}>
          <motion.div
            ref={modalRef}
            className={getModalClasses()}
            style={{
              maxHeight: isMobile ? (isFullscreen ? '100vh' : maxHeight) : maxHeight,
              transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined
            }}
            variants={modalVariants}
            initial="hidden"
            animate="visible" 
            exit="exit"
            drag={enableSwipeToClose && isMobile ? 'y' : false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          >
            {/* Mobile swipe indicator */}
            {isMobile && mobileSlideUp && enableSwipeToClose && (
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
            )}

            {/* Header */}
            {showHeader && (title || showCloseButton) && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {title && (
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className={`${scrollable ? 'overflow-y-auto' : 'overflow-hidden'} flex-1`}>
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

// Hook for responsive modal state management
export function useResponsiveModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])
  
  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])
  
  return {
    isOpen,
    openModal,
    closeModal
  }
}