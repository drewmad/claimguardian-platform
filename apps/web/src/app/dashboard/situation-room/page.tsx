'use client'

import { 
  AlertTriangle, Wind, CloudRain, Zap, Home, Shield,
  CheckCircle, XCircle, Clock, Phone, FileText,
  Map, Camera, Radio, Users, Siren, Activity
} from 'lucide-react'
import { useState } from 'react'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function SituationRoomPage() {
  const [activeAlert] = useState({
    type: 'Hurricane Watch',
    severity: 'high',
    timeframe: '72 hours',
    status: 'monitoring'
  })

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Siren className="w-8 h-8 text-red-400" />
              Situation Room
            </h1>
            <p className="text-gray-400">Real-time monitoring and emergency response coordination</p>
          </div>

          {/* Active Alert Banner */}
          {activeAlert && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Wind className="w-8 h-8 text-orange-400 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-orange-300">{activeAlert.type}</h3>
                    <p className="text-gray-300 mt-1">Expected impact in {activeAlert.timeframe}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm text-gray-400">Status:</span>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">
                        {activeAlert.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            </div>
          )}

          {/* Quick Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Home className="w-6 h-6 text-green-400" />
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-lg font-semibold text-white">Property Status</p>
              <p className="text-sm text-gray-400">Secure</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-lg font-semibold text-white">Insurance</p>
              <p className="text-sm text-gray-400">Coverage Active</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-6 h-6 text-yellow-400" />
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-lg font-semibold text-white">Utilities</p>
              <p className="text-sm text-gray-400">All Operational</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-6 h-6 text-cyan-400" />
                <span className="text-lg font-semibold text-white">3</span>
              </div>
              <p className="text-lg font-semibold text-white">Household</p>
              <p className="text-sm text-gray-400">Members Safe</p>
            </div>
          </div>

          {/* Emergency Contacts & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-400" />
                Emergency Contacts
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Emergency Services</p>
                      <p className="text-sm text-gray-400">911</p>
                    </div>
                  </div>
                  <span className="text-cyan-400">Call</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Insurance Company</p>
                      <p className="text-sm text-gray-400">24/7 Claims Hotline</p>
                    </div>
                  </div>
                  <span className="text-cyan-400">Call</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Utility Company</p>
                      <p className="text-sm text-gray-400">Power Outage Line</p>
                    </div>
                  </div>
                  <span className="text-cyan-400">Call</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Camera className="w-5 h-5" />
                  <span className="font-medium">Document Current Conditions</span>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <FileText className="w-5 h-5 text-gray-300" />
                  <span className="font-medium text-gray-300">Start Emergency Claim</span>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <Map className="w-5 h-5 text-gray-300" />
                  <span className="font-medium text-gray-300">View Evacuation Routes</span>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <Radio className="w-5 h-5 text-gray-300" />
                  <span className="font-medium text-gray-300">Emergency Radio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Updates */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Live Updates
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">National Weather Service Update</p>
                  <p className="text-xs text-gray-400">Hurricane watch extended to include your area - 2 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">Property Systems Check</p>
                  <p className="text-xs text-gray-400">All systems operational, battery backup at 100% - 15 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">Insurance Company Alert</p>
                  <p className="text-xs text-gray-400">Claims teams on standby, expedited processing available - 1 hour ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preparedness Checklist */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Emergency Preparedness Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-cyan-600 rounded" defaultChecked />
                <span className="text-gray-300">Emergency supplies stocked</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-cyan-600 rounded" defaultChecked />
                <span className="text-gray-300">Important documents secured</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-cyan-600 rounded" />
                <span className="text-gray-300">Property photos documented</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-cyan-600 rounded" />
                <span className="text-gray-300">Evacuation plan reviewed</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-cyan-600 rounded" defaultChecked />
                <span className="text-gray-300">Emergency contacts updated</span>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-cyan-600 rounded" />
                <span className="text-gray-300">Vehicle fueled and ready</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}