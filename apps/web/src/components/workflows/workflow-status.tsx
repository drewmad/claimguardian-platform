/**
 * @fileMetadata
 * @owner @automation-team
 * @purpose "Display automated evidence workflow status with progress visualization"
 * @dependencies ["@claimguardian/ui", "react", "lucide-react"]
 * @status stable
 * @ai-integration workflow-engine
 * @insurance-context evidence-collection
 */

'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  FileCheck,
  Camera,
  FileText,
  Calculator,
  ChevronRight,
  Play,
  Pause,
  RotateCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  name: string
  type: 'collect' | 'validate' | 'remind' | 'escalate' | 'approve'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  description?: string
  startedAt?: string
  completedAt?: string
  error?: string
  retryCount?: number
}

interface Workflow {
  id: string
  name: string
  type: string
  status: 'active' | 'paused' | 'completed' | 'failed'
  currentStepIndex: number
  steps: WorkflowStep[]
  progress: number
  estimatedCompletion?: string
  createdAt: string
  completedAt?: string
}

interface WorkflowStatusProps {
  workflow: Workflow
  onPause?: () => void
  onResume?: () => void
  onRetry?: (stepId: string) => void
  onSkip?: (stepId: string) => void
  compact?: boolean
}

const stepIcons = {
  collect: Camera,
  validate: FileCheck,
  remind: Clock,
  escalate: AlertCircle,
  approve: CheckCircle2
}

const statusColors = {
  pending: 'text-gray-500',
  in_progress: 'text-blue-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
  skipped: 'text-yellow-400'
}

const statusBadgeStyles = {
  active: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  paused: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  completed: 'bg-green-600/20 text-green-400 border-green-600/30',
  failed: 'bg-red-600/20 text-red-400 border-red-600/30'
}

export function WorkflowStatus({
  workflow,
  onPause,
  onResume,
  onRetry,
  onSkip,
  compact = false
}: WorkflowStatusProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    if (workflow.estimatedCompletion) {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const target = new Date(workflow.estimatedCompletion!).getTime()
        const diff = target - now

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setTimeRemaining(`${hours}h ${minutes}m remaining`)
        } else {
          setTimeRemaining('Overdue')
        }
      }, 60000)

      return () => clearInterval(timer)
    }
    return undefined
  }, [workflow.estimatedCompletion])

  const getStepIcon = (step: WorkflowStep) => {
    const Icon = stepIcons[step.type]

    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      case 'in_progress':
        return <Icon className="h-5 w-5 text-blue-400 animate-pulse" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'skipped':
        return <Icon className="h-5 w-5 text-yellow-400 opacity-50" />
      case 'pending':
      default:
        return <Circle className="h-5 w-5 text-gray-500" />
    }
  }

  if (compact) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-blue-400" />
              <div>
                <CardTitle className="text-base text-white">
                  {workflow.name}
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Step {workflow.currentStepIndex + 1} of {workflow.steps.length}
                </CardDescription>
              </div>
            </div>
            <Badge className={statusBadgeStyles[workflow.status]}>
              {workflow.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={workflow.progress} className="h-2 bg-gray-700" />
          <p className="text-xs text-gray-400 mt-2">
            {workflow.progress}% complete • {timeRemaining}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-blue-400" />
              {workflow.name}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Automated evidence collection and validation workflow
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={statusBadgeStyles[workflow.status]}>
              {workflow.status}
            </Badge>

            {workflow.status === 'active' && onPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}

            {workflow.status === 'paused' && onResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResume}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-600/30"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-gray-300 font-medium">
              {workflow.progress}% • {timeRemaining}
            </span>
          </div>
          <Progress
            value={workflow.progress}
            className="h-3 bg-gray-700"
          />
        </div>

        {/* Workflow Steps */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Workflow Steps
          </h4>

          <div className="space-y-1">
            {workflow.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "group relative flex items-start gap-3 p-3 rounded-lg transition-all",
                  "hover:bg-gray-700/50 cursor-pointer",
                  expandedStep === step.id && "bg-gray-700/50",
                  step.status === 'in_progress' && "bg-blue-900/20 border border-blue-600/30"
                )}
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              >
                {/* Step Number & Icon */}
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-medium",
                    statusColors[step.status]
                  )}>
                    {index + 1}
                  </span>
                  {getStepIcon(step)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn(
                        "font-medium",
                        step.status === 'completed' ? 'text-gray-300' : 'text-white'
                      )}>
                        {step.name}
                      </p>
                      {step.description && (
                        <p className="text-sm text-gray-400 mt-0.5">
                          {step.description}
                        </p>
                      )}
                    </div>

                    {/* Step Actions */}
                    {step.status === 'failed' && onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRetry(step.id)
                        }}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30"
                      >
                        <RotateCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}

                    {step.status === 'pending' && index === workflow.currentStepIndex && onSkip && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSkip(step.id)
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-400 border-gray-600"
                      >
                        Skip
                      </Button>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedStep === step.id && (
                    <div className="mt-3 space-y-2 text-sm">
                      {step.startedAt && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="h-3 w-3" />
                          Started: {new Date(step.startedAt).toLocaleString()}
                        </div>
                      )}
                      {step.completedAt && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed: {new Date(step.completedAt).toLocaleString()}
                        </div>
                      )}
                      {step.error && (
                        <div className="flex items-start gap-2 text-red-400">
                          <AlertCircle className="h-3 w-3 mt-0.5" />
                          <span>{step.error}</span>
                        </div>
                      )}
                      {step.retryCount && step.retryCount > 0 && (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <RotateCw className="h-3 w-3" />
                          Retried {step.retryCount} time{step.retryCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expand Indicator */}
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-500 transition-transform",
                  expandedStep === step.id && "rotate-90"
                )} />

                {/* Connection Line */}
                {index < workflow.steps.length - 1 && (
                  <div className={cn(
                    "absolute left-[30px] top-[44px] w-0.5 h-[calc(100%+4px)]",
                    step.status === 'completed' ? 'bg-green-600/30' : 'bg-gray-700'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Metadata */}
        {workflow.completedAt && (
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Started</span>
              <span className="text-gray-300">
                {new Date(workflow.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-400">Completed</span>
              <span className="text-gray-300">
                {new Date(workflow.completedAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
