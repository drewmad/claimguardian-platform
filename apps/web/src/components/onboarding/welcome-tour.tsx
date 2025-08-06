/**
 * @fileMetadata
 * @purpose "Interactive welcome tour for new users on the dashboard"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["WelcomeTour"]
 * @complexity high
 * @tags ["onboarding", "tour", "interactive", "dashboard"]
 * @status stable
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronRight, ChevronLeft, Home, Package, Shield, 
  FileText, Wrench, AlertCircle, CheckCircle, Sparkles,
  ArrowRight, Info, Target, MousePointer, Zap
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { logger } from '@/lib/logger'

interface TourStep {
  id: string
  title: string
  content: string
  target: string // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right'
  icon?: React.ComponentType<{ className?: string }>
  action?: () => void
  highlight?: boolean
  offset?: { x: number; y: number }
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ClaimGuardian! 🎉',
    content: 'Let me show you around your property management dashboard. This quick tour will help you get started.',
    target: 'body',
    position: 'bottom',
    icon: Sparkles
  },
  {
    id: 'property-value',
    title: 'Your Property Value',
    content: 'Track your property\'s current value and see year-over-year changes. Click here to view detailed property information.',
    target: '[aria-label*="View property details"]',
    position: 'bottom',
    icon: Home,
    highlight: true
  },
  {
    id: 'personal-property',
    title: 'Personal Property Inventory',
    content: 'Keep track of all your valuable items. Document everything from electronics to jewelry for insurance purposes.',
    target: '[data-quick-access="personal-property"]',
    position: 'top',
    icon: Package,
    highlight: true
  },
  {
    id: 'coverage-score',
    title: 'Insurance Coverage Score',
    content: 'See at a glance how well your property is protected. We analyze your coverage and highlight any gaps.',
    target: '[aria-label*="Coverage progress"]',
    position: 'left',
    icon: Shield
  },
  {
    id: 'pending-tasks',
    title: 'Stay on Top of Tasks',
    content: 'Never miss important maintenance or insurance deadlines. We\'ll remind you when action is needed.',
    target: '[aria-label*="View pending tasks"]',
    position: 'left',
    icon: AlertCircle,
    highlight: true
  },
  {
    id: 'weather-alerts',
    title: 'Environmental Monitoring',
    content: 'Get real-time weather alerts and prepare for severe conditions. Especially important during hurricane season!',
    target: '[aria-label="Weather alerts and conditions"]',
    position: 'top',
    icon: AlertCircle
  },
  {
    id: 'ai-insights',
    title: 'AI-Powered Insights',
    content: 'Our AI analyzes your property data and provides personalized recommendations to protect your investment.',
    target: '[aria-label*="AI recommendations"]',
    position: 'left',
    icon: Zap,
    highlight: true
  },
  {
    id: 'quick-access',
    title: 'Quick Access Menu',
    content: 'Jump to any feature quickly. From claims management to contractor connections, everything is just a click away.',
    target: '[aria-label="Quick access navigation"]',
    position: 'top',
    icon: MousePointer
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    content: 'That\'s the basics! Explore the dashboard and discover more features. Need help? Click the learning assistant in the corner.',
    target: 'body',
    position: 'bottom',
    icon: CheckCircle
  }
]

interface TooltipPosition {
  top?: string
  bottom?: string
  left?: string
  right?: string
}

interface WelcomeTourProps {
  onComplete?: () => void
  onSkip?: () => void
  startDelay?: number
}

export function WelcomeTour({ onComplete, onSkip, startDelay = 500 }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({})
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const animationFrame = useRef<number>()

  const currentTourStep = TOUR_STEPS[currentStep]
  const StepIcon = currentTourStep?.icon

  // Calculate tooltip position based on target element
  const calculatePosition = useCallback((element: HTMLElement, position: string): TooltipPosition => {
    const rect = element.getBoundingClientRect()
    const tooltipWidth = 320
    const tooltipHeight = 200
    const offset = 20
    const arrowSize = 10

    const positions: TooltipPosition = {}

    switch (position) {
      case 'top':
        positions.bottom = `${window.innerHeight - rect.top + offset}px`
        positions.left = `${rect.left + rect.width / 2 - tooltipWidth / 2}px`
        break
      case 'bottom':
        positions.top = `${rect.bottom + offset}px`
        positions.left = `${rect.left + rect.width / 2 - tooltipWidth / 2}px`
        break
      case 'left':
        positions.top = `${rect.top + rect.height / 2 - tooltipHeight / 2}px`
        positions.right = `${window.innerWidth - rect.left + offset}px`
        break
      case 'right':
        positions.top = `${rect.top + rect.height / 2 - tooltipHeight / 2}px`
        positions.left = `${rect.right + offset}px`
        break
      default:
        // Center for body or fallback
        positions.top = '50%'
        positions.left = '50%'
        positions.transform = 'translate(-50%, -50%)'
    }

    // Ensure tooltip stays within viewport
    if (positions.left && parseInt(positions.left) < 10) {
      positions.left = '10px'
    }
    if (positions.right && parseInt(positions.right) < 10) {
      positions.right = '10px'
    }
    if (positions.top && parseInt(positions.top) < 10) {
      positions.top = '10px'
    }
    if (positions.bottom && parseInt(positions.bottom) < 10) {
      positions.bottom = '10px'
    }

    return positions
  }, [])

  // Update position when step changes
  useEffect(() => {
    if (!currentTourStep) return

    const updatePosition = () => {
      const selector = currentTourStep.target
      let element: HTMLElement | null = null

      if (selector === 'body') {
        element = document.body
      } else {
        element = document.querySelector(selector)
      }

      if (element) {
        setTargetElement(element)
        
        if (currentTourStep.highlight && selector !== 'body') {
          const rect = element.getBoundingClientRect()
          setHighlightPosition(rect)
        } else {
          setHighlightPosition(null)
        }

        const position = calculatePosition(element, currentTourStep.position)
        setTooltipPosition(position)
        
        // Scroll element into view if needed
        if (selector !== 'body') {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        logger.warn(`Tour target not found: ${selector}`)
        // Skip to next step if target not found
        handleNext()
      }
    }

    // Wait for DOM to settle
    const timer = setTimeout(updatePosition, 100)
    
    // Update on scroll/resize
    const handleUpdate = () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
      animationFrame.current = requestAnimationFrame(updatePosition)
    }

    window.addEventListener('scroll', handleUpdate)
    window.addEventListener('resize', handleUpdate)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [currentStep, currentTourStep, calculatePosition])

  // Start tour after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
      logger.track('onboarding_tour_started')
    }, startDelay)

    return () => clearTimeout(timer)
  }, [startDelay])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      logger.track('onboarding_tour_step', { step: TOUR_STEPS[currentStep + 1].id })
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      logger.track('onboarding_tour_step_back', { step: TOUR_STEPS[currentStep - 1].id })
    }
  }

  const handleSkip = () => {
    logger.track('onboarding_tour_skipped', { step: currentTourStep?.id })
    setIsVisible(false)
    onSkip?.()
  }

  const handleComplete = () => {
    logger.track('onboarding_tour_completed')
    setIsVisible(false)
    
    // Save completion to localStorage
    localStorage.setItem('onboardingTourCompleted', 'true')
    
    onComplete?.()
  }

  if (!isVisible || !currentTourStep) return null

  return createPortal(
    <>
      {/* Backdrop with highlight cutout */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998]"
          onClick={handleSkip}
        >
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Highlight cutout */}
          {highlightPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute border-2 border-blue-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              style={{
                top: highlightPosition.top - 8,
                left: highlightPosition.left - 8,
                width: highlightPosition.width + 16,
                height: highlightPosition.height + 16,
                pointerEvents: 'none'
              }}
            >
              <div className="absolute inset-0 rounded-lg animate-pulse bg-blue-400/20" />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tour Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed z-[9999] w-80 pointer-events-auto"
          style={tooltipPosition}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 pointer-events-none" />
            
            {/* Header */}
            <div className="relative p-4 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {StepIcon && (
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <StepIcon className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-semibold">{currentTourStep.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Step {currentStep + 1} of {TOUR_STEPS.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Close tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                {currentTourStep.content}
              </p>
              
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {TOUR_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-blue-400 w-6'
                        : index < currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-600'
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="relative p-4 border-t border-slate-700 flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Skip Tour
              </button>
              
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1"
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all flex items-center gap-1 shadow-lg"
                  aria-label={currentStep === TOUR_STEPS.length - 1 ? 'Complete tour' : 'Next step'}
                >
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    <>
                      Complete
                      <CheckCircle className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Pointer arrow */}
          {currentTourStep.target !== 'body' && (
            <div
              className="absolute w-4 h-4 bg-slate-800 border-l border-t border-slate-700 transform rotate-45"
              style={{
                ...(currentTourStep.position === 'top' && {
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)'
                }),
                ...(currentTourStep.position === 'bottom' && {
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(225deg)'
                }),
                ...(currentTourStep.position === 'left' && {
                  right: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(135deg)'
                }),
                ...(currentTourStep.position === 'right' && {
                  left: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(-45deg)'
                })
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>,
    document.body
  )
}