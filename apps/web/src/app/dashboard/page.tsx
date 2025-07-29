'use client'

import React, { useEffect, useState } from 'react'
import { 
  Shield, Building, TrendingUp, Wrench, CheckCircle, 
  AlertCircle, CloudRain, Wind, Droplets, Activity,
  FileCheck, Camera, FileText, UserPlus, ChevronRight
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/client'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [showOnboarding, setShowOnboarding] = useState(false)
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

  if (showOnboarding) {
    return <OnboardingFlow />
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.user_metadata?.firstName || 'Property Owner'}</h1>
            <p className="text-gray-400">Your complete property protection platform</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-8 h-8 text-cyan-400" />
                <span className="text-xs text-green-400">Active</span>
              </div>
              <p className="text-2xl font-bold text-white">92%</p>
              <p className="text-sm text-gray-400">Insurance Score</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Building className="w-8 h-8 text-blue-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">$450k</p>
              <p className="text-sm text-gray-400">Property Value</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Wrench className="w-8 h-8 text-green-400" />
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">14</p>
              <p className="text-sm text-gray-400">Systems Tracked</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="w-8 h-8 text-orange-400" />
                <span className="text-xs text-orange-400 animate-pulse">2 New</span>
              </div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-sm text-gray-400">Action Items</p>
            </div>
          </div>

          {/* Weather & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-cyan-400" />
                Weather & Risk Alerts
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg flex items-center gap-3">
                  <Wind className="w-5 h-5 text-orange-400" />
                  <div className="flex-1">
                    <p className="text-orange-300 font-medium">Hurricane Watch</p>
                    <p className="text-xs text-gray-400">Tropical system developing - 5 days out</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400" />
                </div>
                <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-cyan-300 font-medium">Heavy Rain Expected</p>
                    <p className="text-xs text-gray-400">Tomorrow - Check gutters and drainage</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">HVAC System Serviced</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Insurance Policy Renewed</p>
                    <p className="text-xs text-gray-400">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Camera className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">5 Items Added to Inventory</p>
                    <p className="text-xs text-gray-400">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => router.push('/dashboard/personal-property')}
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
              >
                <Camera className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Document Item</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/claims')}
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
              >
                <FileText className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm">File Claim</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/maintenance')}
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
              >
                <Wrench className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Schedule Service</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/contractors')}
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex flex-col items-center gap-2 group"
              >
                <UserPlus className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Find Contractor</span>
              </button>
            </div>
          </div>

          {/* Property Overview */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Property Overview</h3>
              <button 
                onClick={() => router.push('/dashboard/property')}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Main Residence</p>
                <p className="text-lg font-semibold text-white">1234 Main Street</p>
                <p className="text-sm text-gray-400">Austin, TX 78701</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Coverage Status</p>
                <p className="text-lg font-semibold text-green-400">Fully Protected</p>
                <p className="text-sm text-gray-400">Policy #: HO-2024-1234</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Next Renewal</p>
                <p className="text-lg font-semibold text-white">March 15, 2025</p>
                <p className="text-sm text-gray-400">90 days remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}