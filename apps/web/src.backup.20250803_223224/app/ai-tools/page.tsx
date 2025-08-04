'use client'

import { Shield, Camera, FileText, Calculator, FolderOpen, MessageSquare, FileSearch, Sparkles, ChevronRight, Zap, CheckCircle, AlertTriangle, Clock, Lock, Bot, Wifi, WifiOff, Receipt, Home, Package } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePreload } from '@/hooks/use-preload'
import { AIClientService } from '@/lib/ai/client-service'


interface AITool {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  href: string
  status: 'active' | 'coming-soon' | 'beta'
  category: 'analysis' | 'assistance' | 'documentation' | 'communication'
  features: string[]
}

const AI_TOOLS: AITool[] = [
  {
    id: 'ar-damage-documenter',
    title: 'AR Damage Documenter',
    description: 'Professional documentation in minutes! WebXR measurement tools with AI validation and 3D visualization',
    icon: Camera,
    color: 'cyan',
    href: '/ai-tools/ar-damage-documenter',
    status: 'beta',
    category: 'analysis',
    features: ['WebXR Measurement Tools', 'AI Measurement Validation', '3D Damage Visualization', 'Professional Report Generation', 'Mobile AR Integration']
  },
  {
    id: 'damage-analyzer',
    title: 'Damage Analyzer',
    description: 'AI-powered damage assessment from photos with instant severity ratings and repair recommendations',
    icon: Camera,
    color: 'orange',
    href: '/ai-tools/damage-analyzer',
    status: 'active',
    category: 'analysis',
    features: ['Photo & Video Analysis', 'Severity Assessment', 'Cost Estimation', 'Safety Warnings']
  },
  {
    id: 'proactive-claim-optimizer',
    title: 'Proactive Claim Optimizer',
    description: 'It caught issues I never would have noticed! Pre-submission review with claim strength scoring',
    icon: Shield,
    color: 'emerald',
    href: '/ai-tools/proactive-claim-optimizer',
    status: 'beta',
    category: 'assistance',
    features: ['Pre-submission Claim Review', 'Missing Documentation Detector', 'Claim Strength Scoring', 'Optimization Recommendations', 'Success Probability Assessment']
  },
  {
    id: 'policy-advisor',
    title: 'Policy Advisor + Clarity',
    description: 'Get instant answers about your insurance policy with integrated explanations and plain English translations',
    icon: Shield,
    color: 'blue',
    href: '/ai-tools/policy-chat',
    status: 'active',
    category: 'assistance',
    features: ['Policy Q&A', 'Document Upload', 'Coverage Analysis', 'Plain English Explanations', 'Multi-Model Support']
  },
  {
    id: 'inventory-scanner',
    title: 'Inventory Scanner',
    description: 'Automatically catalog your belongings with AI-powered recognition and value estimation',
    icon: FolderOpen,
    color: 'purple',
    href: '/ai-tools/inventory-scanner',
    status: 'active',
    category: 'documentation',
    features: ['Auto Item Recognition', 'Value Estimation', 'Room Organization', 'Export Reports']
  },
  {
    id: 'receipt-scanner',
    title: 'Receipt Scanner (OCR)',
    description: 'Scan and extract data from receipts, invoices, and estimates with advanced OCR technology',
    icon: Receipt,
    color: 'amber',
    href: '/ai-tools/receipt-scanner',
    status: 'active',
    category: 'documentation',
    features: ['OCR Text Extraction', 'Structured Data Parsing', 'Multi-language Support', 'Expense Tracking', 'Export to Claims']
  },
  {
    id: 'floorplan-creator',
    title: 'AI Floorplan Creator',
    description: 'Create accurate floor plans with your phone! Keep scanning your whole home and get professional measurements',
    icon: Home,
    color: 'blue',
    href: '/ai-tools/floorplan-creator',
    status: 'active',
    category: 'documentation',
    features: ['Phone Scanning', 'Auto Room Detection', 'Professional Measurements', 'Export Floor Plans', '3D Visualization']
  },
  {
    id: 'donation-assistant',
    title: 'Donation Assistant',
    description: 'Create tax-deductible donation forms by taking pictures of items. AI estimates Fair Market Value',
    icon: Package,
    color: 'green',
    href: '/ai-tools/donation-assistant',
    status: 'active',
    category: 'documentation',
    features: ['Photo-based Valuation', 'Fair Market Value Estimation', 'Tax Form Generation', 'Charity Integration', 'Receipt Storage']
  },
  {
    id: '3d-model-generator',
    title: '3D Model Generator',
    description: 'Create 3D models of damage from multiple photos for comprehensive documentation',
    icon: Zap,
    color: 'cyan',
    href: '/ai-tools/3d-model-generator',
    status: 'beta',
    category: 'analysis',
    features: ['3D Reconstruction', 'Multiple Formats', 'Measurements', 'Texture Generation']
  },
  {
    id: 'claim-assistant',
    title: 'Claim Assistant',
    description: 'Step-by-step guidance through the claim filing process with document preparation',
    icon: FileText,
    color: 'green',
    href: '/ai-tools/claim-assistant',
    status: 'active',
    category: 'assistance',
    features: ['Claim Guidance', 'Document Checklist', 'Timeline Tracking', 'Submission Help']
  },
  {
    id: 'document-generator',
    title: 'Document Generator',
    description: 'Generate professional claim letters, appeals, and supporting documentation',
    icon: FileSearch,
    color: 'indigo',
    href: '/ai-tools/document-generator',
    status: 'active',
    category: 'documentation',
    features: ['Letter Templates', 'Legal Citations', 'Auto-Formatting', 'Export Options']
  },
  {
    id: 'communication-helper',
    title: 'Communication Helper',
    description: 'AI-powered assistance for writing emails and messages to insurance companies',
    icon: MessageSquare,
    color: 'pink',
    href: '/ai-tools/communication-helper',
    status: 'active',
    category: 'communication',
    features: ['Email Templates', 'Tone Adjustment', 'Follow-up Reminders', 'Response Analysis']
  },
  {
    id: 'settlement-analyzer',
    title: 'Settlement Analyzer',
    description: 'Analyze settlement offers and compare with typical payouts for similar claims',
    icon: Calculator,
    color: 'yellow',
    href: '/ai-tools/settlement-analyzer',
    status: 'active',
    category: 'analysis',
    features: ['Offer Analysis', 'Market Comparison', 'Negotiation Tips', 'Fair Value Assessment']
  },
  {
    id: 'evidence-organizer',
    title: 'Evidence Organizer + Auto-categorization',
    description: 'Smart organization with AI-powered auto-categorization, tagging, and advanced search capabilities',
    icon: FolderOpen,
    color: 'teal',
    href: '/ai-tools/evidence-organizer',
    status: 'beta',
    category: 'documentation',
    features: ['Smart Auto-categorization', 'AI Document Recognition', 'Evidence Timeline', 'Semantic Search', 'Chain of Custody']
  },
  {
    id: 'community-intelligence',
    title: 'Community Intelligence System',
    description: 'I know what others in my situation received! Aggregate insights from Florida claims with privacy-preserving analytics',
    icon: Calculator,
    color: 'violet',
    href: '/ai-tools/community-intelligence',
    status: 'beta',
    category: 'analysis',
    features: ['Privacy-preserving Analytics', 'Trend Detection', 'Anonymous Outcome Sharing', 'Market Data Integration', 'Comparative Analysis Dashboard']
  },
  {
    id: 'communication-helper',
    title: 'Communication Helper + Negotiation',
    description: 'AI-powered assistance for writing emails and messages with integrated negotiation guidance and tactics',
    icon: MessageSquare,
    color: 'pink',
    href: '/ai-tools/communication-helper',
    status: 'beta',
    category: 'communication',
    features: ['Email Templates', 'Negotiation Integration', 'Tone Adjustment', 'Follow-up Reminders', 'Response Analysis']
  }
]

const CATEGORIES = [
  { id: 'all', label: 'All Tools', icon: Sparkles },
  { id: 'analysis', label: 'Analysis', icon: Camera },
  { id: 'assistance', label: 'Assistance', icon: Bot },
  { id: 'documentation', label: 'Documentation', icon: FileText },
  { id: 'communication', label: 'Communication', icon: MessageSquare }
]

export default function AIToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [, setKeysLoaded] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { } = useAuth()
  const aiClient = useMemo(() => new AIClientService(), [])
  const { preloadComponent } = usePreload()

  useEffect(() => {
    // Check API keys
    const checkKeys = async () => {
      try {
        const keysStatus = await aiClient.checkKeys()
        setHasOpenAIKey(keysStatus.hasOpenAIKey)
        setHasGeminiKey(keysStatus.hasGeminiKey)
      } catch (error) {
        console.error('Failed to check API keys:', error)
      } finally {
        setKeysLoaded(true)
      }
    }
    
    checkKeys()

    // Check online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [aiClient])

  const filteredTools = selectedCategory === 'all' 
    ? AI_TOOLS 
    : AI_TOOLS.filter(tool => tool.category === selectedCategory)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case 'beta':
        return (
          <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Beta
          </Badge>
        )
      case 'coming-soon':
        return (
          <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Premium Header with Advanced Liquid Glass */}
            <div className="text-center mb-12">
              <div className="relative">
                {/* Premium Background Orb */}
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-purple-600/30 rounded-full blur-3xl animate-pulse opacity-30" />
                
                <div className="relative flex items-center justify-center gap-3 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-600/30 to-purple-600/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(59,130,246,0.3)] hover:shadow-[0_25px_80px_rgba(147,51,234,0.4)] transition-all duration-700">
                    <Sparkles className="h-10 w-10 text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
                  </div>
                  <h1 className="text-5xl font-bold">
                    <span className="text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]">Your AI-Powered</span>
                    <span className="block mt-2 text-4xl bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">Insurance Command Center</span>
                  </h1>
                </div>
              </div>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                Turn complex claims into simple wins. Each tool maximizes your settlement and minimizes your stress.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
                <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10 backdrop-blur-md shadow-[0_8px_32px_rgba(34,197,94,0.15)] hover:shadow-[0_8px_32px_rgba(34,197,94,0.25)] transition-all duration-300">
                  <CheckCircle className="w-3 h-3 mr-1 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  {AI_TOOLS.filter(t => t.status === 'active').length} Tools Ready
                </Badge>
                <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10 backdrop-blur-md shadow-[0_8px_32px_rgba(59,130,246,0.15)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.25)] transition-all duration-300">
                  <Clock className="w-3 h-3 mr-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  24/7 Available
                </Badge>
                <Badge variant="outline" className="text-purple-400 border-purple-400/30 bg-purple-400/10 backdrop-blur-md shadow-[0_8px_32px_rgba(147,51,234,0.15)] hover:shadow-[0_8px_32px_rgba(147,51,234,0.25)] transition-all duration-300">
                  <Shield className="w-3 h-3 mr-1 drop-shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
                  Florida Focused
                </Badge>
              </div>
            </div>

            {/* Premium Status Bar */}
            <Card className="bg-gray-800/60 backdrop-blur-xl border-gray-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_80px_rgba(59,130,246,0.15)] transition-all duration-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${hasOpenAIKey ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-gray-400">OpenAI: {hasOpenAIKey ? 'Connected' : 'Key Required'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-gray-400">Gemini: {hasGeminiKey ? 'Connected' : 'Key Required'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <Wifi className="h-4 w-4 text-green-400" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-gray-400">Network: {isOnline ? 'Connected' : 'Offline'}</span>
                    </div>
                  </div>
                  {(!hasOpenAIKey && !hasGeminiKey) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                      onClick={() => toast.info('Configure API keys in your environment variables')}
                    >
                      Setup API Keys
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Premium Category Filter */}
            <div className="flex gap-3 flex-wrap">
              {CATEGORIES.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)] backdrop-blur-md border-0' 
                      : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.1)] transition-all duration-300'
                    }
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.label}
                  </Button>
                )
              })}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => {
                const Icon = tool.icon
                const isDisabled = tool.status === 'coming-soon' || (!hasOpenAIKey && !hasGeminiKey && tool.status === 'active')
                
                return (
                  <Card 
                    key={tool.id} 
                    className={`bg-gray-800/70 backdrop-blur-xl border-gray-700/50 overflow-hidden transition-all duration-500 shadow-[0_12px_40px_rgba(0,0,0,0.3)] ${
                      !isDisabled 
                        ? 'hover:border-gray-600/70 hover:shadow-[0_20px_60px_rgba(59,130,246,0.2)] hover:bg-gray-800/80 hover:scale-[1.02] hover:-translate-y-1' 
                        : 'opacity-75'
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-3 rounded-xl bg-${tool.color}-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(59,130,246,0.2)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.3)] transition-all duration-300 border border-white/10`}>
                          <Icon className={`h-6 w-6 text-${tool.color}-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]`} />
                        </div>
                        {getStatusBadge(tool.status)}
                      </div>
                      <CardTitle className="text-xl text-white">{tool.title}</CardTitle>
                      <p className="text-sm text-gray-400 mt-2">{tool.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          {tool.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        {tool.status === 'coming-soon' ? (
                          <Button 
                            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-400 cursor-not-allowed" 
                            disabled
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Coming Soon
                          </Button>
                        ) : (
                          <Link 
                            href={tool.href} 
                            className="block"
                            onMouseEnter={() => {
                              // Preload components based on tool
                              if (tool.id === 'damage-analyzer') {
                                preloadComponent('ImageUploadAnalyzer')
                                preloadComponent('ReportGenerator')
                              } else if (tool.id === 'policy-advisor') {
                                preloadComponent('AIChatInterface')
                              }
                            }}
                          >
                            <Button 
                              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.4)] transition-all duration-300 backdrop-blur-md border-0"
                              disabled={!hasOpenAIKey && !hasGeminiKey}
                            >
                              {!hasOpenAIKey && !hasGeminiKey ? (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  API Key Required
                                </>
                              ) : (
                                <>
                                  Launch Tool
                                  <ChevronRight className="h-4 w-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Premium Help Section */}
            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 backdrop-blur-xl border-blue-600/40 shadow-[0_20px_60px_rgba(59,130,246,0.2)] hover:shadow-[0_25px_80px_rgba(59,130,246,0.3)] transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-600/30 to-cyan-600/20 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(59,130,246,0.3)]">
                    <Bot className="h-6 w-6 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Getting Started with AI Tools</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Our AI tools are designed to make the insurance claim process easier and more effective. Each tool uses advanced AI models to analyze your specific situation and provide personalized guidance.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-gray-200 mb-1">For Best Results:</h4>
                        <ul className="space-y-1 text-gray-400">
                          <li>• Take clear, well-lit photos</li>
                          <li>• Provide detailed descriptions</li>
                          <li>• Upload relevant documents</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-200 mb-1">Privacy & Security:</h4>
                        <ul className="space-y-1 text-gray-400">
                          <li>• Your data is encrypted</li>
                          <li>• AI processes locally when possible</li>
                          <li>• No data shared with insurers</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}