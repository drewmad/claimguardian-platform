'use client'

// Force dynamic rendering to prevent SSG issues with Supabase client
export const dynamic = 'force-dynamic'

import { 
  Shield, Wrench, CheckCircle, 
  AlertCircle, CloudRain, Wind, Droplets, Activity,
  Camera, FileText, ChevronRight,
  Package, DollarSign, Bell, Calendar, Home, Car,
  Zap, Eye, Plus, ArrowUpRight, ArrowDownRight,
  Clock, MapPin, Thermometer, Timer, Settings2,
  ShieldCheck, Receipt, HardHat, Siren, Code
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { logger } from "@/lib/logger/production-logger"
import { toError } from '@claimguardian/utils'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { LearningWidget } from '@/components/learning/learning-widget'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSupabase } from '@/lib/supabase/client'
import { profileService, UserProfile } from '@/lib/auth/profile-service'

interface QuickAccessItem {
  id: string
  title: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  hoverColor: string
  isPrimary?: boolean
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'personal-property',
    title: 'Personal Property',
    path: '/dashboard/personal-property',
    icon: Package,
    hoverColor: 'hover:shadow-[0_8px_24px_rgba(147,51,234,0.15)]',
    isPrimary: true
  },
  {
    id: 'expenses',
    title: 'Expenses',
    path: '/dashboard/expenses',
    icon: DollarSign,
    hoverColor: 'hover:shadow-[0_8px_24px_rgba(34,197,94,0.15)]',
    isPrimary: true
  },
  {
    id: 'claims',
    title: 'Claims',
    path: '/dashboard/claims',
    icon: FileText,
    hoverColor: 'hover:shadow-[0_8px_24px_rgba(59,130,246,0.15)]',
    isPrimary: true
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    path: '/dashboard/maintenance',
    icon: Wrench,
    hoverColor: 'hover:shadow-[0_8px_24px_rgba(6,182,212,0.15)]',
    isPrimary: true
  },
  {
    id: 'warranty-watch',
    title: 'Warranty Watch',
    path: '/dashboard/warranty-watch',
    icon: ShieldCheck,
    hoverColor: 'hover:shadow-[0_8px_24px_rgba(234,179,8,0.15)]'
  },
  {
    id: 'contractors',
    title: 'Contractors',
    path: '/dashboard/contractors',
    icon: HardHat,
    hoverColor: 'hover:shadow-[0_8px_24px_rgba(251,146,60,0.15)]'
  },
  {
    id: 'situation-room',
    title: 'Situation Room',
    path: '/dashboard/situation-room',
    icon: Siren,
    hoverColor: 'hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)]'
  },
  {
    id: 'development',
    title: 'Development',
    path: '/dashboard/development',
    icon: Code,
    hoverColor: 'hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)]'
  }
]

function QuickAccessGrid({ router }: { router: ReturnType<typeof useRouter> }) {
  const [showAll, setShowAll] = useState(false)
  
  const primaryItems = QUICK_ACCESS_ITEMS.filter(item => item.isPrimary)
  const secondaryItems = QUICK_ACCESS_ITEMS.filter(item => !item.isPrimary)
  
  const displayItems = showAll ? QUICK_ACCESS_ITEMS : primaryItems
  
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {displayItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              data-quick-access={item.id}
              className={`p-3 sm:p-4 bg-gray-700/70 backdrop-blur-sm hover:bg-gray-600/80 active:scale-95 rounded-lg transition-all flex flex-col items-center gap-2 group shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${item.hoverColor}`}
            >
              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm text-center">{item.title}</span>
            </button>
          )
        })}
      </div>
      
      {!showAll && secondaryItems.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Show {secondaryItems.length} More
          </Button>
        </div>
      )}
      
      {showAll && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(false)}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            Show Less
          </Button>
        </div>
      )}
    </>
  )
}

// Empty state components
function EmptyRecentActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-3">
        <Activity className="h-6 w-6 text-blue-400" />
      </div>
      <h4 className="text-white font-medium mb-2">No recent activity</h4>
      <p className="text-sm text-gray-400 mb-4">
        Start managing your property to see activity here
      </p>
      <Button
        size="sm"
        onClick={() => document.querySelector<HTMLButtonElement>('[data-quick-access="personal-property"]')?.click()}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Add Property Items
      </Button>
    </div>
  )
}

function EmptyUpcomingTasks() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mb-3">
        <CheckCircle className="h-6 w-6 text-green-400" />
      </div>
      <h4 className="text-white font-medium mb-2">You're all caught up!</h4>
      <p className="text-sm text-gray-400 mb-4">
        No pending tasks at the moment
      </p>
      <Button
        size="sm"
        variant="outline"
        className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
      >
        View Completed Tasks
      </Button>
    </div>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingKey] = useState(0) // Force re-render
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  // Mock states for empty state demonstration - in real app, these would come from API calls
  const [hasRecentActivity] = useState(true) // Set to false to see empty state
  const [hasPendingTasks] = useState(true) // Set to false to see empty state

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return

      try {
        // Fetch user profile
        const profile = await profileService.getProfile(user.id)
        if (profile) {
          setUserProfile(profile)
        }

        const { data, error } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          logger.error('Error checking onboarding:', toError(error))
        }

        // Show onboarding if not completed or no record exists
        if (!data?.onboarding_completed) {
          setShowOnboarding(true)
        }
      } catch (error) {
        logger.error('Error checking onboarding status:', toError(error))
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user, supabase])


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Onboarding will be rendered as an overlay if needed

  return (
    <>
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Enhanced Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome back, {userProfile?.firstName || user?.user_metadata?.firstName || 'Property Owner'}</h1>
                <p className="text-gray-400 text-sm sm:text-base">Your property is protected and monitored 24/7</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="outline" size="sm" className="bg-gray-700 hover:bg-gray-600 border-gray-600 flex-1 sm:flex-none">
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="relative hidden sm:inline">
                    Alerts
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </span>
                  <span className="relative sm:hidden">
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </span>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Quick Add</span>
                </Button>
              </div>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <button 
                onClick={() => router.push('/dashboard/property')}
                className="w-full text-left"
              >
                <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] transition-all duration-300 hover:bg-gray-800/90 active:scale-95 cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Home className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400 drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]" />
                      <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs backdrop-blur-sm">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">$485,000</p>
                    <p className="text-sm text-gray-400">Property Value</p>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUpRight className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-400">+5.2% YoY</span>
                    </div>
                  </CardContent>
                </Card>
              </button>

              <button 
                onClick={() => router.push('/dashboard/personal-property')}
                className="w-full text-left"
              >
                <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(147,51,234,0.15)] transition-all duration-300 hover:bg-gray-800/90 active:scale-95 cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Package className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400 drop-shadow-[0_2px_8px_rgba(147,51,234,0.3)]" />
                      <span className="text-xs text-gray-500 hidden sm:inline">Updated 2h ago</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">247</p>
                    <p className="text-sm text-gray-400">Items Tracked</p>
                    <p className="text-xs text-purple-400 mt-2">$45,320 total value</p>
                  </CardContent>
                </Card>
              </button>

              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(6,182,212,0.15)] transition-all duration-300 hover:bg-gray-800/90 active:scale-95 cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-400 drop-shadow-[0_2px_8px_rgba(6,182,212,0.3)]" />
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">100%</p>
                  <p className="text-sm text-gray-400">Coverage Score</p>
                  <Progress value={100} className="h-1 mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(34,197,94,0.15)] transition-all duration-300 hover:bg-gray-800/90 active:scale-95 cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Receipt className="h-6 w-6 sm:h-7 sm:w-7 text-green-400 drop-shadow-[0_2px_8px_rgba(34,197,94,0.3)]" />
                    <span className="text-xs text-green-400">This month</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">$1,245</p>
                  <p className="text-sm text-gray-400">Expenses</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowDownRight className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">-12% vs last</span>
                  </div>
                </CardContent>
              </Card>

              <button 
                onClick={() => {
                  const upcomingTasksSection = document.getElementById('upcoming-tasks')
                  if (upcomingTasksSection) {
                    upcomingTasksSection.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="w-full text-left"
              >
                <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(251,146,60,0.15)] transition-all duration-300 hover:bg-gray-800/90 active:scale-95 cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-orange-400 drop-shadow-[0_2px_8px_rgba(251,146,60,0.3)]" />
                      <span className="text-xs text-orange-400 animate-pulse">Action needed</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{hasPendingTasks ? '3' : '0'}</p>
                    <p className="text-sm text-gray-400">Pending Tasks</p>
                    <p className={`text-xs mt-2 ${hasPendingTasks ? 'text-orange-400' : 'text-green-400'}`}>
                      {hasPendingTasks ? '2 urgent, 1 routine' : 'All caught up!'}
                    </p>
                  </CardContent>
                </Card>
              </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Weather & Environmental */}
                <Card className="bg-gray-800/85 backdrop-blur-md border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(6,182,212,0.1)] transition-all duration-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-cyan-400 drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]" />
                        Environmental Monitoring
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white backdrop-blur-sm hover:bg-white/10">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Hurricane Alert */}
                      <div className="p-4 bg-orange-900/25 backdrop-blur-sm border border-orange-500/40 rounded-lg shadow-[0_8px_24px_rgba(251,146,60,0.15)]">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-600/25 backdrop-blur-sm rounded-lg shadow-[0_4px_12px_rgba(251,146,60,0.2)]">
                            <Wind className="h-5 w-5 text-orange-400 drop-shadow-[0_2px_6px_rgba(251,146,60,0.4)]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-orange-300">Hurricane Watch - Category 2</p>
                              <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">
                                72hrs away
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">Tropical Storm Maria strengthening in Gulf</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                Updated 30m ago
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                150 miles SW
                              </span>
                            </div>
                            <Button size="sm" className="mt-3 bg-orange-600 hover:bg-orange-700">
                              View Preparation Checklist
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Current Conditions */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-700/60 backdrop-blur-sm rounded-lg p-3 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-gray-700/70 transition-all duration-300">
                          <div className="flex items-center gap-2 mb-1">
                            <Thermometer className="h-4 w-4 text-red-400 drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]" />
                            <span className="text-sm text-gray-400">Temperature</span>
                          </div>
                          <p className="text-xl font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">78°F</p>
                          <p className="text-xs text-gray-500">Feels like 82°F</p>
                        </div>
                        <div className="bg-gray-700/60 backdrop-blur-sm rounded-lg p-3 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-gray-700/70 transition-all duration-300">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="h-4 w-4 text-blue-400 drop-shadow-[0_2px_4px_rgba(59,130,246,0.3)]" />
                            <span className="text-sm text-gray-400">Humidity</span>
                          </div>
                          <p className="text-xl font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">85%</p>
                          <p className="text-xs text-gray-500">High moisture</p>
                        </div>
                        <div className="bg-gray-700/60 backdrop-blur-sm rounded-lg p-3 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-gray-700/70 transition-all duration-300">
                          <div className="flex items-center gap-2 mb-1">
                            <Wind className="h-4 w-4 text-gray-400 drop-shadow-[0_2px_4px_rgba(156,163,175,0.3)]" />
                            <span className="text-sm text-gray-400">Wind</span>
                          </div>
                          <p className="text-xl font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">12 mph</p>
                          <p className="text-xs text-gray-500">From SE</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Access Grid */}
                <Card className="bg-gray-800/85 backdrop-blur-md border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(59,130,246,0.1)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuickAccessGrid router={router} />
                  </CardContent>
                </Card>

                {/* Property Status */}
                <Card className="bg-gray-800/85 backdrop-blur-md border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Property Status</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push('/dashboard/property')}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-600/20 rounded">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">HVAC System</p>
                              <p className="text-xs text-gray-400">Last serviced 2 weeks ago</p>
                            </div>
                          </div>
                          <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">Good</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-600/20 rounded">
                              <AlertCircle className="h-4 w-4 text-yellow-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Roof</p>
                              <p className="text-xs text-gray-400">Inspection due in 30 days</p>
                            </div>
                          </div>
                          <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">Due Soon</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600/20 rounded">
                              <Shield className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Home Insurance</p>
                              <p className="text-xs text-gray-400">Policy #HO-2024-1234</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600/20 rounded">
                              <Car className="h-4 w-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Auto Insurance</p>
                              <p className="text-xs text-gray-400">2 vehicles covered</p>
                            </div>
                          </div>
                          <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-xs">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - 1/3 width */}
              <div className="space-y-4 sm:space-y-6">
                {/* Recent Activity */}
                <Card className="bg-gray-800/85 backdrop-blur-md border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(59,130,246,0.1)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400 drop-shadow-[0_2px_8px_rgba(59,130,246,0.4)]" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasRecentActivity ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                              <Plus className="h-4 w-4 text-green-400" />
                            </div>
                            <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-700"></div>
                          </div>
                          <div className="flex-1 -mt-0.5">
                            <p className="text-sm text-white">Added 3 items to inventory</p>
                            <p className="text-xs text-gray-400">Kitchen appliances - $2,400</p>
                            <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                              <Camera className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-700"></div>
                          </div>
                          <div className="flex-1 -mt-0.5">
                            <p className="text-sm text-white">Documented roof condition</p>
                            <p className="text-xs text-gray-400">5 photos uploaded</p>
                            <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
                              <Receipt className="h-4 w-4 text-yellow-400" />
                            </div>
                            <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-700"></div>
                          </div>
                          <div className="flex-1 -mt-0.5">
                            <p className="text-sm text-white">Expense logged</p>
                            <p className="text-xs text-gray-400">HVAC service - $185</p>
                            <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-purple-400" />
                          </div>
                          <div className="flex-1 -mt-0.5">
                            <p className="text-sm text-white">Warranty registered</p>
                            <p className="text-xs text-gray-400">Samsung Refrigerator - 5yr</p>
                            <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EmptyRecentActivity />
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card id="upcoming-tasks" className="bg-gray-800/85 backdrop-blur-md border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(251,146,60,0.1)] transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Upcoming Tasks</CardTitle>
                      {hasPendingTasks ? (
                        <Badge className="bg-orange-600/25 backdrop-blur-sm text-orange-400 border-orange-600/40">3 pending</Badge>
                      ) : (
                        <Badge className="bg-green-600/25 backdrop-blur-sm text-green-400 border-green-600/40">All done</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasPendingTasks ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-orange-900/25 backdrop-blur-sm border border-orange-600/40 rounded-lg shadow-[0_4px_16px_rgba(251,146,60,0.15)]">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">Prepare for Hurricane</p>
                              <p className="text-xs text-gray-400 mt-1">Review checklist and secure property</p>
                            </div>
                            <Badge className="bg-red-600/25 backdrop-blur-sm text-red-400 text-xs border-red-600/40">Urgent</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due in 2 days
                            </span>
                            <Button size="sm" className="h-6 px-2 text-xs bg-orange-600 hover:bg-orange-700">
                              Start
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">Schedule roof inspection</p>
                              <p className="text-xs text-gray-400 mt-1">Annual maintenance check</p>
                            </div>
                            <Badge className="bg-yellow-600/20 text-yellow-400 text-xs">Due Soon</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due in 30 days
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">Review insurance coverage</p>
                              <p className="text-xs text-gray-400 mt-1">Policy renewal coming up</p>
                            </div>
                            <Badge className="bg-gray-600/20 text-gray-400 text-xs">Routine</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due in 60 days
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EmptyUpcomingTasks />
                    )}
                  </CardContent>
                </Card>

                {/* AI Assistant */}
                <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md border-blue-600/40 shadow-[0_16px_40px_rgba(59,130,246,0.2)] hover:shadow-[0_20px_48px_rgba(59,130,246,0.25)] transition-all duration-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-600/25 backdrop-blur-sm rounded-lg shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
                        <Zap className="h-5 w-5 text-blue-400 drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]" />
                      </div>
                      <h3 className="font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">AI Insights</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">
                      Based on the approaching hurricane, I recommend documenting your property&apos;s current condition and reviewing your insurance coverage limits.
                    </p>
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                      <Eye className="h-4 w-4 mr-2" />
                      View Recommendations
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Learning Assistant Widget */}
        <LearningWidget />
      </DashboardLayout>
    
    {/* Onboarding Modal Overlay */}
    {showOnboarding && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <OnboardingFlow 
              key={onboardingKey}
              onComplete={() => {
                setShowOnboarding(false)
                // Force a full page refresh to ensure dashboard loads properly
                window.location.reload()
              }}
            />
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
