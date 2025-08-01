'use client'

import { 
  Shield, Building, TrendingUp, Wrench, CheckCircle, 
  AlertCircle, CloudRain, Wind, Droplets, Activity,
  FileCheck, Camera, FileText, UserPlus, ChevronRight,
  Package, DollarSign, Bell, Calendar, Home, Car,
  Zap, Users, Eye, Plus, ArrowUpRight, ArrowDownRight,
  Clock, MapPin, Thermometer, Timer, Settings2,
  ShieldCheck, Receipt, HardHat, Siren, Code
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { LearningWidget } from '@/components/learning/learning-widget'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { useSupabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingKey] = useState(0) // Force re-render
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking onboarding:', error)
        }

        // Show onboarding if not completed or no record exists
        if (!data?.onboarding_completed) {
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
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
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.user_metadata?.firstName || 'Property Owner'}</h1>
                <p className="text-gray-400">Your property is protected and monitored 24/7</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="bg-gray-700 hover:bg-gray-600 border-gray-600">
                  <Bell className="h-4 w-4 mr-2" />
                  <span className="relative">
                    Alerts
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </span>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Add
                </Button>
              </div>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Home className="h-6 w-6 text-blue-400" />
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                      Active
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-white">$485,000</p>
                  <p className="text-sm text-gray-400">Property Value</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">+5.2% YoY</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="h-6 w-6 text-purple-400" />
                    <span className="text-xs text-gray-500">Updated 2h ago</span>
                  </div>
                  <p className="text-2xl font-bold text-white">247</p>
                  <p className="text-sm text-gray-400">Items Tracked</p>
                  <p className="text-xs text-purple-400 mt-2">$45,320 total value</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="h-6 w-6 text-cyan-400" />
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-sm text-gray-400">Coverage Score</p>
                  <Progress value={100} className="h-1 mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Receipt className="h-6 w-6 text-green-400" />
                    <span className="text-xs text-green-400">This month</span>
                  </div>
                  <p className="text-2xl font-bold text-white">$1,245</p>
                  <p className="text-sm text-gray-400">Expenses</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowDownRight className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">-12% vs last</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="h-6 w-6 text-orange-400" />
                    <span className="text-xs text-orange-400 animate-pulse">Action needed</span>
                  </div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-sm text-gray-400">Pending Tasks</p>
                  <p className="text-xs text-orange-400 mt-2">2 urgent, 1 routine</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Weather & Environmental */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-cyan-400" />
                        Environmental Monitoring
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Hurricane Alert */}
                      <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-600/20 rounded-lg">
                            <Wind className="h-5 w-5 text-orange-400" />
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
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Thermometer className="h-4 w-4 text-red-400" />
                            <span className="text-sm text-gray-400">Temperature</span>
                          </div>
                          <p className="text-xl font-semibold text-white">78°F</p>
                          <p className="text-xs text-gray-500">Feels like 82°F</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-gray-400">Humidity</span>
                          </div>
                          <p className="text-xl font-semibold text-white">85%</p>
                          <p className="text-xs text-gray-500">High moisture</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Wind className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Wind</span>
                          </div>
                          <p className="text-xl font-semibold text-white">12 mph</p>
                          <p className="text-xs text-gray-500">From SE</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Access Grid */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button 
                        onClick={() => router.push('/dashboard/personal-property')}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
                      >
                        <Package className="h-8 w-8 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Personal Property</span>
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/expenses')}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
                      >
                        <DollarSign className="h-8 w-8 text-green-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Expenses</span>
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/warranty-watch')}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
                      >
                        <ShieldCheck className="h-8 w-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Warranty Watch</span>
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/contractors')}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
                      >
                        <HardHat className="h-8 w-8 text-orange-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Contractors</span>
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/situation-room')}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
                      >
                        <Siren className="h-8 w-8 text-red-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Situation Room</span>
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/claims')}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
                      >
                        <FileText className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Claims</span>
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/maintenance')}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
                      >
                        <Wrench className="h-8 w-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Maintenance</span>
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/development')}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
                      >
                        <Code className="h-8 w-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Development</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Property Status */}
                <Card className="bg-gray-800 border-gray-700">
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
              <div className="space-y-6">
                {/* Recent Activity */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Upcoming Tasks</CardTitle>
                      <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">3 pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">Prepare for Hurricane</p>
                            <p className="text-xs text-gray-400 mt-1">Review checklist and secure property</p>
                          </div>
                          <Badge className="bg-red-600/20 text-red-400 text-xs">Urgent</Badge>
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
                  </CardContent>
                </Card>

                {/* AI Assistant */}
                <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-600/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Zap className="h-5 w-5 text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-white">AI Insights</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">
                      Based on the approaching hurricane, I recommend documenting your property's current condition and reviewing your insurance coverage limits.
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