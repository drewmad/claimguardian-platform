/**
 * @fileMetadata
 * @purpose "Interactive introduction to ClaimGuardian's AI-powered features"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["AIToolsIntroduction"]
 * @complexity high
 * @tags ["onboarding", "ai-tools", "introduction", "interactive"]
 * @status stable
 */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Brain, Camera, FileText, MessageCircle, 
  BarChart3, Shield, Zap, ChevronRight, ChevronLeft,
  X, Play, CheckCircle, ArrowRight, Info, Star,
  Upload, Wand2, Bot, Eye, TrendingUp, AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface AITool {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  features: string[]
  useCases: string[]
  demoPath?: string
  comingSoon?: boolean
  premium?: boolean
}

const AI_TOOLS: AITool[] = [
  {
    id: 'damage-analyzer',
    title: 'Damage Analyzer',
    description: 'AI-powered damage assessment from photos with detailed repair cost estimates.',
    icon: Camera,
    features: [
      'Photo analysis with damage detection',
      'Repair cost estimation',
      'Severity scoring (1-10)',
      'Detailed damage descriptions'
    ],
    useCases: [
      'Document storm damage',
      'Pre-claim assessments',
      'Maintenance planning',
      'Insurance evidence'
    ],
    demoPath: '/dashboard/ai-tools/damage-analyzer'
  },
  {
    id: 'policy-advisor',
    title: 'Policy Chat',
    description: 'Chat with your insurance policies using AI to understand coverage and exclusions.',
    icon: MessageCircle,
    features: [
      'Natural language policy queries',
      'Coverage gap identification',
      'Multi-document comparison',
      'Claims guidance'
    ],
    useCases: [
      'Understand policy terms',
      'Compare coverage options',
      'Pre-claim preparation',
      'Renewal decisions'
    ],
    demoPath: '/dashboard/ai-tools/policy-advisor'
  },
  {
    id: 'inventory-scanner',
    title: 'Inventory Scanner',
    description: 'Automatically catalog your belongings with AI-powered item recognition.',
    icon: BarChart3,
    features: [
      'Barcode scanning',
      'Image-based item identification',
      'Automatic categorization',
      'Value estimation'
    ],
    useCases: [
      'Home inventory creation',
      'Insurance documentation',
      'Moving preparation',
      'Estate planning'
    ],
    demoPath: '/dashboard/ai-tools/inventory-scanner'
  },
  {
    id: 'claim-assistant',
    title: 'Claim Assistant',
    description: 'Get step-by-step guidance through the insurance claims process.',
    icon: Shield,
    features: [
      'Claim type identification',
      'Required documentation checklist',
      'Timeline tracking',
      'Settlement analysis'
    ],
    useCases: [
      'First-time claim filing',
      'Complex claim navigation',
      'Documentation organization',
      'Settlement negotiation'
    ],
    demoPath: '/dashboard/ai-tools/claim-assistant'
  },
  {
    id: 'document-generator',
    title: 'Document Generator',
    description: 'Generate professional claim documents and correspondence automatically.',
    icon: FileText,
    features: [
      'Demand letter generation',
      'Inventory reports',
      'Damage summaries',
      'Professional formatting'
    ],
    useCases: [
      'Claim documentation',
      'Insurance correspondence',
      'Legal preparation',
      'Professional reporting'
    ],
    demoPath: '/dashboard/ai-tools/document-generator'
  },
  {
    id: 'settlement-analyzer',
    title: 'Settlement Analyzer',
    description: 'Analyze settlement offers and determine if they\'re fair based on your damages.',
    icon: TrendingUp,
    features: [
      'Offer evaluation',
      'Market comparison',
      'Fairness scoring',
      'Negotiation strategies'
    ],
    useCases: [
      'Settlement evaluation',
      'Negotiation preparation',
      'Market research',
      'Decision support'
    ],
    demoPath: '/dashboard/ai-tools/settlement-analyzer',
    premium: true
  }
]

interface AIToolsIntroductionProps {
  onComplete?: () => void
  onSkip?: () => void
  selectedTools?: string[]
  isModal?: boolean
}

export function AIToolsIntroduction({ 
  onComplete, 
  onSkip, 
  selectedTools = [], 
  isModal = true 
}: AIToolsIntroductionProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(selectedTools)
  const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'selection'>('overview')
  const [currentToolIndex, setCurrentToolIndex] = useState(0)
  
  const totalSteps = 3 // Overview, Tool Details, Selection
  const progress = ((currentStep + 1) / totalSteps) * 100
  const currentTool = AI_TOOLS[currentToolIndex]

  useEffect(() => {
    // Track introduction start
    logger.track('ai_tools_introduction_started')
  }, [])

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      
      // Update view mode based on step
      if (currentStep === 0) {
        setViewMode('detail')
      } else if (currentStep === 1) {
        setViewMode('selection')
      }
      
      logger.track('ai_tools_introduction_step', { step: currentStep + 1 })
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      
      // Update view mode based on step
      if (currentStep === 1) {
        setViewMode('overview')
      } else if (currentStep === 2) {
        setViewMode('detail')
      }
    }
  }

  const handleComplete = () => {
    logger.track('ai_tools_introduction_completed', { 
      selectedTools: selectedToolIds,
      toolsCount: selectedToolIds.length 
    })
    
    // Save selected tools preference
    localStorage.setItem('selected_ai_tools', JSON.stringify(selectedToolIds))
    
    toast.success(`Great! You've selected ${selectedToolIds.length} AI tools to explore.`)
    onComplete?.()
  }

  const handleSkip = () => {
    logger.track('ai_tools_introduction_skipped', { step: currentStep })
    onSkip?.()
  }

  const handleToolSelect = (toolId: string) => {
    setSelectedToolIds(prev => {
      if (prev.includes(toolId)) {
        return prev.filter(id => id !== toolId)
      } else {
        return [...prev, toolId]
      }
    })
  }

  const handleTryTool = (tool: AITool) => {
    if (tool.demoPath) {
      logger.track('ai_tool_demo_started', { toolId: tool.id })
      router.push(tool.demoPath)
    } else {
      toast.info(`${tool.title} demo coming soon!`)
    }
  }

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <div className="space-y-3">
        <div className="inline-flex p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl">
          <Brain className="w-12 h-12 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">AI-Powered Tools</h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          ClaimGuardian's AI tools help you document damage, understand policies, 
          and navigate insurance claims with confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {AI_TOOLS.map((tool, index) => {
          const Icon = tool.icon
          return (
            <Card key={tool.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex gap-1">
                    {tool.premium && (
                      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">
                        Premium
                      </Badge>
                    )}
                    {tool.comingSoon && (
                      <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30 text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg text-white">{tool.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-3">{tool.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {tool.features.length} features
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCurrentToolIndex(index)
                      setCurrentStep(1)
                      setViewMode('detail')
                    }}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
                  >
                    Learn More
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-600/30">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white mb-2">Powered by Advanced AI</h3>
            <p className="text-sm text-gray-300 mb-3">
              Our AI tools use state-of-the-art machine learning models including 
              OpenAI GPT-4 and Google Gemini to provide accurate, helpful insights.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Privacy Protected
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Real-time Analysis
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Expert Trained
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderToolDetail = () => {
    if (!currentTool) return null
    const Icon = currentTool.icon

    return (
      <motion.div
        key={currentTool.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl">
            <Icon className="w-12 h-12 text-blue-400" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-white">{currentTool.title}</h2>
            {currentTool.premium && (
              <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                Premium
              </Badge>
            )}
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">{currentTool.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Features */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-blue-400" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentTool.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Use Cases */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-400" />
                Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentTool.useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{useCase}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Demo CTA */}
        <div className="text-center space-y-4">
          <Button
            onClick={() => handleTryTool(currentTool)}
            disabled={currentTool.comingSoon}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
          >
            {currentTool.comingSoon ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Coming Soon
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Try {currentTool.title}
              </>
            )}
          </Button>
          
          {/* Navigation between tools */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentToolIndex(Math.max(0, currentToolIndex - 1))}
              disabled={currentToolIndex === 0}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex gap-1">
              {AI_TOOLS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentToolIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentToolIndex ? 'bg-blue-400 w-6' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentToolIndex(Math.min(AI_TOOLS.length - 1, currentToolIndex + 1))}
              disabled={currentToolIndex === AI_TOOLS.length - 1}
              className="text-gray-400 hover:text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3">
        <div className="inline-flex p-4 bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-2xl">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Choose Your AI Tools</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Select the AI tools you'd like to explore first. You can always access all tools later.
        </p>
      </div>

      <div className="space-y-3">
        {AI_TOOLS.map((tool) => {
          const Icon = tool.icon
          const isSelected = selectedToolIds.includes(tool.id)
          
          return (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 shadow-lg'
                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
              }`}
              onClick={() => handleToolSelect(tool.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-blue-600/30' : 'bg-gray-700/50'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isSelected ? 'text-blue-400' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{tool.title}</h3>
                      {tool.premium && (
                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">
                          Premium
                        </Badge>
                      )}
                      {tool.comingSoon && (
                        <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30 text-xs">
                          Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{tool.description}</p>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-500'
                  }`}>
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedToolIds.length > 0 && (
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-blue-300 font-medium">
                {selectedToolIds.length} tool{selectedToolIds.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-400 mt-1">
                These tools will be highlighted in your dashboard for easy access.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )

  const renderStepContent = () => {
    switch (viewMode) {
      case 'overview':
        return renderOverview()
      case 'detail':
        return renderToolDetail()
      case 'selection':
        return renderSelection()
      default:
        return renderOverview()
    }
  }

  const content = (
    <div className="w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentStep}-${currentToolIndex}-${viewMode}`}
          className="space-y-6"
        >
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>AI Tools Introduction</span>
              <span>Step {currentStep + 1} of {totalSteps}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="min-h-[500px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={currentStep === 0 ? handleSkip : handlePrevious}
              className="text-gray-400 hover:text-white"
            >
              {currentStep === 0 ? 'Skip Introduction' : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === 2 && (
                <span className="text-sm text-gray-400">
                  {selectedToolIds.length} selected
                </span>
              )}
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    Get Started
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>
          {content}
        </div>
      </div>
    )
  }

  return content
}