'use client'

import { 
  Shield, 
  ArrowLeft, 
  Users, 
  FileText, 
  AlertCircle, 
  Settings, 
  Activity,
  Brain,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  Eye,
  Zap,
  Target,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Home,
  Database,
  Lock,
  Menu,
  X as CloseIcon,
  Layers,
  Cpu,
  FileCheck,
  GraduationCap,
  TrendingDown,
  Info,
  RefreshCw
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { LegalDocumentsTab } from './legal-documents-tab'
import { ClaudeLearningDashboard } from '@/components/admin/claude-learning-dashboard'
import { AICostsDashboard } from '@/components/admin/ai-costs-dashboard'
import { ABTestDashboard } from '@/components/admin/ab-test-dashboard'
import { AICacheDashboard } from '@/components/admin/ai-cache-dashboard'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { liquidGlass } from '@/lib/styles/liquid-glass'

// Navigation menu structure
const navigationMenu = [
  {
    category: 'Dashboard',
    items: [
      { id: 'overview', label: 'Overview', icon: Home },
    ]
  },
  {
    category: 'User Management',
    items: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'compliance', label: 'Compliance', icon: FileCheck },
    ]
  },
  {
    category: 'AI & ML',
    items: [
      { id: 'ai-models', label: 'AI Models', icon: Brain },
      { id: 'ai-costs', label: 'AI Costs', icon: DollarSign },
      { id: 'ai-cache', label: 'AI Cache', icon: Database },
      { id: 'ml-operations', label: 'ML Operations', icon: Cpu },
      { id: 'claude-learning', label: 'Claude Learning', icon: GraduationCap },
    ]
  },
  {
    category: 'Analytics',
    items: [
      { id: 'ab-testing', label: 'A/B Testing', icon: Target },
      { id: 'errors', label: 'Error Dashboard', icon: AlertCircle },
    ]
  },
  {
    category: 'System',
    items: [
      { id: 'legal-docs', label: 'Legal Documents', icon: FileText },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  }
]

export function AdminDashboardImproved() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Dashboard', 'AI & ML'])
  
  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Mock data - replace with real data from your API
  const stats = {
    totalUsers: 1234,
    activeUsers: 987,
    totalClaims: 456,
    activeClaims: 123,
    mlOperations: {
      modelsDeployed: 5,
      totalPredictions: 45678,
      avgAccuracy: 94.3,
      lastTraining: '2024-01-15'
    },
    errors: {
      total: 23,
      critical: 2,
      warning: 8,
      info: 13
    },
    aiUsage: {
      totalRequests: 15400,
      totalCost: 234.50,
      avgResponseTime: 1.2,
      successRate: 98.5
    }
  }

  const quickStats = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      subtitle: `${stats.activeUsers} active`,
      icon: Users,
      trend: { value: 12, isUp: true }
    },
    {
      title: 'Active Claims',
      value: stats.activeClaims,
      subtitle: `${stats.totalClaims} total`,
      icon: FileText,
      trend: { value: 8, isUp: true }
    },
    {
      title: 'AI Success Rate',
      value: `${stats.aiUsage.successRate}%`,
      subtitle: 'Last 30 days',
      icon: Brain,
      trend: { value: 2.3, isUp: true }
    },
    {
      title: 'System Health',
      value: stats.errors.critical === 0 ? 'Healthy' : 'Critical',
      subtitle: `${stats.errors.total} issues`,
      icon: Activity,
      trend: { value: stats.errors.critical, isUp: false },
      status: stats.errors.critical === 0 ? 'success' : 'error'
    }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className={cn(liquidGlass.cards.default, "relative overflow-hidden")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-400">{stat.title}</CardTitle>
                        <Icon className="h-5 w-5 text-gray-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className={cn(
                            "text-2xl font-bold",
                            stat.status === 'error' && "text-red-500",
                            stat.status === 'success' && "text-green-500"
                          )}>
                            {stat.value}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                        </div>
                        {stat.trend && (
                          <div className={cn(
                            "flex items-center gap-1 text-sm",
                            stat.trend.isUp ? "text-green-500" : "text-red-500"
                          )}>
                            {stat.trend.isUp ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span>{stat.trend.value}%</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Recent Activity - Takes 2 columns */}
              <div className="xl:col-span-2">
                <Card className={liquidGlass.cards.default}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest system events and user actions</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { type: 'user', message: 'New user registration', user: 'john.doe@example.com', time: '2 minutes ago', icon: Users, color: 'text-blue-500' },
                        { type: 'ai', message: 'AI model training completed', model: 'damage-analyzer-v2', time: '15 minutes ago', icon: Brain, color: 'text-purple-500' },
                        { type: 'claim', message: 'New claim submitted', claimId: '#CL-2024-0156', time: '1 hour ago', icon: FileText, color: 'text-green-500' },
                        { type: 'error', message: 'API rate limit warning', service: 'OpenAI', time: '2 hours ago', icon: AlertCircle, color: 'text-yellow-500' },
                        { type: 'system', message: 'Database backup completed', size: '2.3 GB', time: '3 hours ago', icon: Database, color: 'text-gray-500' },
                      ].map((activity, index) => {
                        const Icon = activity.icon
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                            <div className={cn("p-2 rounded-lg bg-slate-700", activity.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{activity.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {activity.user || activity.model || activity.claimId || activity.service || activity.size} • {activity.time}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Health */}
              <div className="space-y-6">
                <Card className={liquidGlass.cards.default}>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Current system status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'API Gateway', status: 'operational', uptime: '99.99%' },
                      { name: 'Database', status: 'operational', uptime: '99.95%' },
                      { name: 'AI Services', status: 'degraded', uptime: '98.50%' },
                      { name: 'Storage', status: 'operational', uptime: '99.99%' },
                    ].map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            service.status === 'operational' ? "bg-green-500" : "bg-yellow-500"
                          )} />
                          <span className="text-sm font-medium">{service.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{service.uptime}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className={liquidGlass.cards.default}>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('users')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('ai-models')}
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Configure AI
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('errors')}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      View Errors
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )
      
      case 'ai-costs':
        return <AICostsDashboard />
      
      case 'ai-cache':
        return <AICacheDashboard />
      
      case 'claude-learning':
        return <ClaudeLearningDashboard />
      
      case 'ab-testing':
        return <ABTestDashboard />
      
      case 'legal-docs':
        return <LegalDocumentsTab />
      
      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Info className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Content for {activeTab} coming soon...</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center gap-2 transition-opacity duration-300",
              !sidebarOpen && "opacity-0 pointer-events-none"
            )}>
              <Shield className="h-6 w-6 text-blue-500" />
              <h2 className="font-bold text-white">Admin Panel</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <CloseIcon className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navigationMenu.map((section) => (
            <div key={section.category}>
              <button
                onClick={() => sidebarOpen && toggleCategory(section.category)}
                className={cn(
                  "flex items-center justify-between w-full text-left text-sm font-medium text-gray-400 hover:text-white transition-colors mb-2",
                  !sidebarOpen && "justify-center"
                )}
              >
                {sidebarOpen ? (
                  <>
                    <span>{section.category}</span>
                    {expandedCategories.includes(section.category) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </>
                ) : (
                  <Layers className="h-4 w-4" />
                )}
              </button>
              
              {(sidebarOpen && expandedCategories.includes(section.category)) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "flex items-center gap-3 w-full p-2 rounded-lg text-sm transition-colors",
                          activeTab === item.id
                            ? "bg-slate-800 text-white"
                            : "text-gray-400 hover:text-white hover:bg-slate-800/50"
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Collapsed state - show icons only */}
              {(!sidebarOpen && section.items.some(item => item.id === activeTab)) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "flex items-center justify-center w-full p-2 rounded-lg transition-colors",
                          activeTab === item.id
                            ? "bg-slate-800 text-white"
                            : "text-gray-400 hover:text-white hover:bg-slate-800/50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className={cn(
              "w-full justify-start text-gray-400 hover:text-white",
              !sidebarOpen && "justify-center"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Back to Dashboard</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {navigationMenu
                .flatMap(section => section.items)
                .find(item => item.id === activeTab)?.label || 'Overview'}
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 w-64 bg-slate-800 border-slate-700"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-700"
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}