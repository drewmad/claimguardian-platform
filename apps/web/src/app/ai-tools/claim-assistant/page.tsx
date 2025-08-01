'use client'

import { FileText, ChevronRight, CheckCircle, Circle, AlertTriangle, Camera, Phone, FileCheck, DollarSign, Sparkles, Download, Send, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { APIKeyValidator } from '@/components/ai/api-key-validator'
import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { AIClientService } from '@/lib/ai/client-service'


interface ClaimStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'completed' | 'current' | 'upcoming'
  tasks: ClaimTask[]
}

interface ClaimTask {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
  relatedTool?: string
}

const CLAIM_STEPS: ClaimStep[] = [
  {
    id: 'immediate',
    title: 'Immediate Actions',
    description: 'Critical steps to take right after damage occurs',
    icon: AlertTriangle,
    status: 'current',
    tasks: [
      {
        id: 'safety',
        title: 'Ensure Safety',
        description: 'Make sure everyone is safe and evacuate if necessary',
        completed: false,
        required: true
      },
      {
        id: 'prevent',
        title: 'Prevent Further Damage',
        description: 'Take reasonable steps to prevent additional damage (tarps, shut off water, etc.)',
        completed: false,
        required: true
      },
      {
        id: 'emergency-contact',
        title: 'Contact Emergency Services',
        description: 'Call 911 if there are injuries or immediate dangers',
        completed: false,
        required: false
      }
    ]
  },
  {
    id: 'document',
    title: 'Document Everything',
    description: 'Comprehensive documentation of all damage',
    icon: Camera,
    status: 'upcoming',
    tasks: [
      {
        id: 'photos',
        title: 'Take Photos & Videos',
        description: 'Document all damage from multiple angles with timestamps',
        completed: false,
        required: true,
        relatedTool: '/ai-augmented/damage-analyzer'
      },
      {
        id: 'inventory',
        title: 'Create Inventory List',
        description: 'List all damaged personal property with values',
        completed: false,
        required: true,
        relatedTool: '/ai-augmented/inventory-scanner'
      },
      {
        id: 'receipts',
        title: 'Gather Receipts',
        description: 'Collect receipts for damaged items and emergency repairs',
        completed: false,
        required: false
      }
    ]
  },
  {
    id: 'notify',
    title: 'Notify Insurance',
    description: 'Contact your insurance company promptly',
    icon: Phone,
    status: 'upcoming',
    tasks: [
      {
        id: 'call-insurer',
        title: 'Call Insurance Company',
        description: 'Report the claim within policy time limits (usually 24-72 hours)',
        completed: false,
        required: true
      },
      {
        id: 'claim-number',
        title: 'Get Claim Number',
        description: 'Record your claim number and adjuster contact info',
        completed: false,
        required: true
      },
      {
        id: 'follow-up-writing',
        title: 'Follow Up in Writing',
        description: 'Send written notice of claim via certified mail',
        completed: false,
        required: false,
        relatedTool: '/ai-tools/communication-helper'
      }
    ]
  },
  {
    id: 'prepare',
    title: 'Prepare for Adjuster',
    description: 'Get ready for the insurance adjuster visit',
    icon: FileCheck,
    status: 'upcoming',
    tasks: [
      {
        id: 'organize-docs',
        title: 'Organize Documentation',
        description: 'Prepare all photos, videos, and receipts for review',
        completed: false,
        required: true,
        relatedTool: '/ai-tools/evidence-organizer'
      },
      {
        id: 'repair-estimates',
        title: 'Get Repair Estimates',
        description: 'Obtain estimates from licensed contractors',
        completed: false,
        required: false
      },
      {
        id: 'questions-list',
        title: 'Prepare Questions',
        description: 'List questions about coverage and claim process',
        completed: false,
        required: false
      }
    ]
  },
  {
    id: 'settlement',
    title: 'Review Settlement',
    description: 'Evaluate and negotiate your settlement offer',
    icon: DollarSign,
    status: 'upcoming',
    tasks: [
      {
        id: 'review-offer',
        title: 'Review Settlement Offer',
        description: 'Carefully review all details of the settlement',
        completed: false,
        required: true,
        relatedTool: '/ai-tools/settlement-analyzer'
      },
      {
        id: 'compare-coverage',
        title: 'Compare to Policy Coverage',
        description: 'Ensure settlement matches your policy coverage',
        completed: false,
        required: true,
        relatedTool: '/ai-augmented/policy-chat'
      },
      {
        id: 'negotiate',
        title: 'Negotiate if Needed',
        description: 'Don&apos;t accept the first offer if it&apos;s inadequate',
        completed: false,
        required: false
      }
    ]
  }
]

export default function ClaimAssistantPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(CLAIM_STEPS)
  const [claimNotes, setClaimNotes] = useState('')
  const [hasAPIKeys, setHasAPIKeys] = useState(false)
  const { } = useAuth()
  const aiClient = new AIClientService()

  const toggleTask = (stepId: string, taskId: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId
          ? {
              ...step,
              tasks: step.tasks.map(task =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task
              )
            }
          : step
      )
    )
  }

  const calculateProgress = () => {
    const totalTasks = steps.reduce((acc, step) => acc + step.tasks.length, 0)
    const completedTasks = steps.reduce(
      (acc, step) => acc + step.tasks.filter(task => task.completed).length,
      0
    )
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  }

  const moveToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      
      // Update step statuses
      setSteps(prevSteps => 
        prevSteps.map((step, index) => ({
          ...step,
          status: 
            index < currentStep + 1 ? 'completed' :
            index === currentStep + 1 ? 'current' : 'upcoming'
        }))
      )
    }
  }

  const generateClaimSummary = async () => {
    try {
      const completedTasks = steps.flatMap(step => 
        step.tasks.filter(task => task.completed).map(task => `${step.title}: ${task.title}`)
      )
      
      const prompt = `Generate a concise claim summary based on these completed tasks:
${completedTasks.join('\n')}

Additional notes: ${claimNotes}

Format the summary for submission to an insurance company.`

      const response = await aiClient.chat([
        { role: 'system', content: 'You are a helpful insurance claim assistant.' },
        { role: 'user', content: prompt }
      ], 'openai')

      return response
    } catch (error) {
      console.error('Error generating summary:', error)
      toast.error('Failed to generate claim summary')
      return null
    }
  }

  const progress = calculateProgress()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <APIKeyValidator onValidation={setHasAPIKeys} requiredProviders={['openai']}>
          <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Claim Assistant</h1>
                <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Step-by-step guidance through the insurance claim process. Follow each step carefully to ensure you don&apos;t miss any critical actions or documentation.
              </p>
            </div>

            {/* Progress Overview */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
                    <p className="text-sm text-gray-400">
                      {Math.round(progress)}% Complete
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {steps.reduce((acc, step) => acc + step.tasks.filter(t => t.completed).length, 0)}
                    </p>
                    <p className="text-sm text-gray-400">
                      of {steps.reduce((acc, step) => acc + step.tasks.length, 0)} tasks
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>

            {/* Steps Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Steps List */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Claim Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {steps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = index === currentStep
                        const isCompleted = step.status === 'completed'
                        
                        return (
                          <button
                            key={step.id}
                            onClick={() => setCurrentStep(index)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                              isActive
                                ? 'bg-blue-600/20 border border-blue-600/30'
                                : isCompleted
                                ? 'bg-green-600/10 border border-green-600/20'
                                : 'hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                isActive
                                  ? 'bg-blue-600/20'
                                  : isCompleted
                                  ? 'bg-green-600/20'
                                  : 'bg-gray-700'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  isActive
                                    ? 'text-blue-400'
                                    : isCompleted
                                    ? 'text-green-400'
                                    : 'text-gray-400'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-semibold ${
                                  isActive ? 'text-white' : 'text-gray-300'
                                }`}>
                                  {step.title}
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">
                                  {step.description}
                                </p>
                                {isCompleted && (
                                  <Badge className="mt-2 bg-green-600/20 text-green-400 border-green-600/30">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Step Details */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = steps[currentStep].icon
                          return (
                            <div className="p-2 bg-blue-600/20 rounded-lg">
                              <Icon className="h-5 w-5 text-blue-400" />
                            </div>
                          )
                        })()}
                        <div>
                          <CardTitle className="text-white">
                            {steps[currentStep].title}
                          </CardTitle>
                          <p className="text-sm text-gray-400 mt-1">
                            {steps[currentStep].description}
                          </p>
                        </div>
                      </div>
                      {currentStep < steps.length - 1 && (
                        <Button
                          onClick={moveToNextStep}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Next Step
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {steps[currentStep].tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-4 rounded-lg border transition-all ${
                            task.completed
                              ? 'bg-green-900/20 border-green-600/30'
                              : 'bg-gray-700/50 border-gray-600'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleTask(steps[currentStep].id, task.id)}
                              className="mt-0.5"
                            >
                              {task.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-400" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-medium ${
                                  task.completed ? 'text-gray-300 line-through' : 'text-white'
                                }`}>
                                  {task.title}
                                </h4>
                                {task.required && (
                                  <Badge variant="outline" className="text-xs text-orange-400 border-orange-600/30">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {task.description}
                              </p>
                              {task.relatedTool && (
                                <Link href={task.relatedTool}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                                  >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Use AI Tool
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes Section */}
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">
                        Additional Notes
                      </h4>
                      <Textarea
                        value={claimNotes}
                        onChange={(e) => setClaimNotes(e.target.value)}
                        placeholder="Add any additional notes about this step..."
                        className="min-h-[100px] bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tips Card */}
                <Card className="mt-6 bg-blue-900/20 border-blue-600/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-blue-300">Pro Tips</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Always document everything - photos, conversations, receipts</li>
                          <li>• Never admit fault or sign anything without reading carefully</li>
                          <li>• Keep a detailed log of all interactions with your insurer</li>
                          <li>• Don&apos;t throw away damaged items until the adjuster approves</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={async () => {
                      const summary = await generateClaimSummary()
                      if (summary) {
                        toast.success('Claim summary generated!')
                        // In a real app, this would open a modal or download the summary
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Claim Summary
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Checklist
                  </Button>
                  <Link href="/ai-tools/communication-helper">
                    <Button
                      variant="outline"
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Draft Claim Letter
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </APIKeyValidator>
      </DashboardLayout>
    </ProtectedRoute>
  )
}