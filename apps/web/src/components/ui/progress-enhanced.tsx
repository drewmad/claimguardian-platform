/**
 * @fileMetadata
 * @purpose "Enhanced progress indicators with multi-stage tracking and AI processing states"
 * @owner ui-team
 * @dependencies ["react", "framer-motion", "@/components/notifications"]
 * @exports ["ProgressEnhanced", "MultiStageProgress", "AIProcessingProgress", "ProgressRing"]
 * @complexity high
 * @tags ["ui", "progress", "ai", "indicators", "enhanced"]
 * @status stable
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Brain,
  Eye,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  TrendingUp,
  Activity,
  Target,
  Cpu,
  Database,
  Upload,
  Download,
  Scan,
  FileText,
  Image,
  Calendar,
  Timer,
  BarChart3
} from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export type ProgressStatus = 'pending' | 'running' | 'completed' | 'error' | 'paused' | 'cancelled'
export type ProgressStage = 'upload' | 'processing' | 'analyzing' | 'reviewing' | 'finalizing'
export type ProcessingType = 'damage-analysis' | 'document-extraction' | 'inventory-scan' | 'claim-processing' | 'general'

export interface ProgressStep {
  id: string
  name: string
  description: string
  status: ProgressStatus
  progress: number
  duration?: number
  startTime?: Date
  endTime?: Date
  error?: string
  metadata?: Record<string, any>
}

export interface ProgressConfig {
  showTimeEstimates?: boolean
  showPercentages?: boolean
  showStepDetails?: boolean
  allowPauseResume?: boolean
  showErrorDetails?: boolean
  animated?: boolean
  compact?: boolean
  showThroughput?: boolean
}

interface ProgressEnhancedProps {
  steps: ProgressStep[]
  currentStepIndex: number
  overallProgress: number
  status: ProgressStatus
  config?: ProgressConfig
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
  onRetry?: (stepId: string) => void
  className?: string
}

export function ProgressEnhanced({
  steps,
  currentStepIndex,
  overallProgress,
  status,
  config = {},
  onPause,
  onResume,
  onCancel,
  onRetry,
  className
}: ProgressEnhancedProps) {
  const {
    showTimeEstimates = true,
    showPercentages = true,
    showStepDetails = true,
    allowPauseResume = true,
    showErrorDetails = true,
    animated = true,
    compact = false,
    showThroughput = false
  } = config

  const currentStep = steps[currentStepIndex]

  // Calculate time estimates
  const timeEstimates = useMemo(() => {
    if (!showTimeEstimates) return null

    const completedSteps = steps.filter(step => step.status === 'completed')
    const averageDuration = completedSteps.length > 0
      ? completedSteps.reduce((acc, step) => acc + (step.duration || 0), 0) / completedSteps.length
      : 30 // Default 30 seconds per step

    const remainingSteps = steps.length - currentStepIndex
    const estimatedTimeRemaining = Math.round(remainingSteps * averageDuration)

    return {
      averageDuration,
      estimatedTimeRemaining,
      totalElapsed: completedSteps.reduce((acc, step) => acc + (step.duration || 0), 0)
    }
  }, [steps, currentStepIndex, showTimeEstimates])

  const getStatusIcon = (stepStatus: ProgressStatus) => {
    switch (stepStatus) {
      case 'completed': return CheckCircle
      case 'error': return XCircle
      case 'running': return Loader2
      case 'paused': return Pause
      case 'cancelled': return XCircle
      default: return Clock
    }
  }

  const getStatusColor = (stepStatus: ProgressStatus) => {
    switch (stepStatus) {
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'running': return 'text-blue-600'
      case 'paused': return 'text-yellow-600'
      case 'cancelled': return 'text-gray-600'
      default: return 'text-gray-400'
    }
  }

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Overall Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-4 h-4", getStatusColor(status))}>
                  {(() => {
                    const Icon = getStatusIcon(status)
                    return <Icon className={cn("w-4 h-4", status === 'running' && "animate-spin")} />
                  })()}
                </div>
                <span className="font-medium">{currentStep?.name || 'Processing'}</span>
              </div>

              {showPercentages && (
                <Badge variant="outline">
                  {Math.round(overallProgress)}%
                </Badge>
              )}
            </div>

            <Progress value={overallProgress} className="h-2" />

            {showTimeEstimates && timeEstimates && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{steps.filter(s => s.status === 'completed').length} of {steps.length} steps</span>
                {timeEstimates.estimatedTimeRemaining > 0 && (
                  <span>~{Math.ceil(timeEstimates.estimatedTimeRemaining / 60)} min remaining</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Processing Progress</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>

            {/* Controls */}
            {allowPauseResume && (
              <div className="flex items-center gap-2">
                {status === 'running' && onPause && (
                  <Button variant="outline" size="sm" onClick={onPause}>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                )}

                {status === 'paused' && onResume && (
                  <Button variant="outline" size="sm" onClick={onResume}>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                )}

                {onCancel && status !== 'completed' && (
                  <Button variant="outline" size="sm" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              {showPercentages && (
                <span className="text-sm text-gray-600">
                  {Math.round(overallProgress)}%
                </span>
              )}
            </div>

            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Time Estimates */}
          {showTimeEstimates && timeEstimates && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600">Elapsed</p>
                  <p className="font-medium">{Math.ceil(timeEstimates.totalElapsed / 60)} min</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600">Remaining</p>
                  <p className="font-medium">
                    ~{Math.ceil(timeEstimates.estimatedTimeRemaining / 60)} min
                  </p>
                </div>
              </div>

              {showThroughput && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-600">Speed</p>
                    <p className="font-medium">
                      {(timeEstimates.averageDuration / 60).toFixed(1)} min/step
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step Details */}
          {showStepDetails && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Processing Steps</h4>

              <div className="space-y-2">
                {steps.map((step, index) => {
                  const Icon = getStatusIcon(step.status)
                  const isActive = index === currentStepIndex

                  return (
                    <motion.div
                      key={step.id}
                      initial={animated ? { opacity: 0, x: -10 } : false}
                      animate={animated ? { opacity: 1, x: 0 } : false}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <div className={cn("flex-shrink-0", getStatusColor(step.status))}>
                        <Icon className={cn(
                          "w-4 h-4",
                          step.status === 'running' && "animate-spin"
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{step.name}</p>

                          {showPercentages && step.status === 'running' && (
                            <Badge variant="outline" className="ml-2">
                              {Math.round(step.progress)}%
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {step.description}
                        </p>

                        {step.status === 'running' && (
                          <Progress value={step.progress} className="h-1 mt-2" />
                        )}

                        {step.status === 'error' && showErrorDetails && step.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription className="text-xs">
                              {step.error}
                              {onRetry && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => onRetry(step.id)}
                                  className="h-auto p-0 ml-2 text-xs"
                                >
                                  Retry
                                </Button>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {step.duration && step.status === 'completed' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed in {Math.ceil(step.duration)} seconds
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Multi-Stage Progress Component
interface MultiStageProgressProps {
  stages: { name: string; description: string; icon: React.ElementType }[]
  currentStage: number
  stageProgress: number
  overallProgress: number
  status: ProgressStatus
  className?: string
}

export function MultiStageProgress({
  stages,
  currentStage,
  stageProgress,
  overallProgress,
  status,
  className
}: MultiStageProgressProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Stage Indicators */}
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => {
              const Icon = stage.icon
              const isActive = index === currentStage
              const isCompleted = index < currentStage
              const isCurrent = index === currentStage

              return (
                <div key={index} className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-gray-200 border-gray-300 text-gray-500"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className={cn("w-5 h-5", isCurrent && status === 'running' && "animate-pulse")} />
                    )}
                  </div>

                  {index < stages.length - 1 && (
                    <div className={cn(
                      "w-8 sm:w-16 h-px mx-2",
                      isCompleted || (isCurrent && stageProgress > 50)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    )} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Stage Names */}
          <div className="flex justify-between">
            {stages.map((stage, index) => (
              <div key={index} className="text-center max-w-[100px]">
                <p className={cn(
                  "text-xs font-medium",
                  index === currentStage
                    ? "text-blue-600"
                    : index < currentStage
                    ? "text-green-600"
                    : "text-gray-500"
                )}>
                  {stage.name}
                </p>
              </div>
            ))}
          </div>

          {/* Current Stage Details */}
          {stages[currentStage] && (
            <div className="text-center space-y-2">
              <h4 className="font-medium">{stages[currentStage].name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stages[currentStage].description}
              </p>

              <div className="space-y-2">
                <Progress value={stageProgress} className="h-2" />
                <p className="text-xs text-gray-500">
                  Stage {currentStage + 1} of {stages.length} • {Math.round(stageProgress)}% complete
                </p>
              </div>
            </div>
          )}

          {/* Overall Progress */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// AI Processing Progress Component
interface AIProcessingProgressProps {
  type: ProcessingType
  progress: number
  stage: string
  status: ProgressStatus
  confidence?: number
  throughput?: { processed: number; total: number; rate: number }
  insights?: string[]
  onPause?: () => void
  onCancel?: () => void
  className?: string
}

export function AIProcessingProgress({
  type,
  progress,
  stage,
  status,
  confidence,
  throughput,
  insights = [],
  onPause,
  onCancel,
  className
}: AIProcessingProgressProps) {
  const getProcessingIcon = () => {
    switch (type) {
      case 'damage-analysis': return Scan
      case 'document-extraction': return FileText
      case 'inventory-scan': return Image
      case 'claim-processing': return BarChart3
      default: return Brain
    }
  }

  const getProcessingName = () => {
    switch (type) {
      case 'damage-analysis': return 'Damage Analysis'
      case 'document-extraction': return 'Document Extraction'
      case 'inventory-scan': return 'Inventory Scanning'
      case 'claim-processing': return 'Claim Processing'
      default: return 'AI Processing'
    }
  }

  const ProcessingIcon = getProcessingIcon()

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <ProcessingIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>

              <div>
                <h3 className="font-semibold">{getProcessingName()}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stage}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status === 'running' && onPause && (
                <Button variant="outline" size="sm" onClick={onPause}>
                  <Pause className="w-4 h-4" />
                </Button>
              )}

              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Processing Progress</span>
              <div className="flex items-center gap-2">
                {confidence && (
                  <Badge variant="outline" className="text-xs">
                    {confidence}% confidence
                  </Badge>
                )}
                <span className="text-sm text-gray-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            <Progress value={progress} className="h-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </Progress>
          </div>

          {/* Throughput */}
          {throughput && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Processed</p>
                <p className="font-medium">{throughput.processed}</p>
              </div>

              <div className="text-center">
                <p className="text-gray-600">Total</p>
                <p className="font-medium">{throughput.total}</p>
              </div>

              <div className="text-center">
                <p className="text-gray-600">Rate</p>
                <p className="font-medium">{throughput.rate}/min</p>
              </div>
            </div>
          )}

          {/* Live Insights */}
          {insights.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-medium text-purple-800 dark:text-purple-300">
                  Live Analysis Insights
                </h4>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2"
                    >
                      <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="flex items-center justify-center">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-sm",
              status === 'running'
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : status === 'completed'
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : status === 'error'
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            )}>
              {status === 'running' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'completed' && <CheckCircle className="w-4 h-4" />}
              {status === 'error' && <XCircle className="w-4 h-4" />}
              {status === 'paused' && <Pause className="w-4 h-4" />}

              <span className="capitalize">{status}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Progress Ring Component
interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  children
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-500 transition-all duration-300 ease-in-out"
          strokeLinecap="round"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-sm font-medium">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  )
}
