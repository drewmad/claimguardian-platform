/**
 * @fileMetadata
 * @purpose Home systems tracking and maintenance dashboard
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "home-systems", "maintenance"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { 
  Wrench, Plus, Thermometer, Zap, Droplets, Flame,
  Shield, AlertTriangle, Calendar,
  TrendingUp, FileText, Settings, ChevronRight,
  Home, Activity, DollarSign, BarChart
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'

type SystemType = 'hvac' | 'plumbing' | 'electrical' | 'roofing' | 'water_heater' | 'appliances'
type SystemStatus = 'good' | 'fair' | 'needs_attention' | 'critical'

interface HomeSystem {
  id: string
  type: SystemType
  name: string
  brand?: string
  model?: string
  installDate: string
  warrantyExpiration?: string
  age: number
  expectedLifespan: number
  status: SystemStatus
  lastService?: string
  nextServiceDue?: string
  efficiency?: number
  notes?: string
  serviceRecords: number
  estimatedValue: number
}

interface MaintenanceTask {
  id: string
  systemId: string
  task: string
  frequency: string
  lastCompleted?: string
  nextDue: string
  priority: 'low' | 'medium' | 'high'
  estimatedCost?: number
}

function HomeSystemsContent() {
  const router = useRouter()
  
  // Mock data
  const [systems] = useState<HomeSystem[]>([
    {
      id: '1',
      type: 'hvac',
      name: 'Central AC & Heating',
      brand: 'Carrier',
      model: 'Infinity 21',
      installDate: '2019-05-15',
      warrantyExpiration: '2029-05-15',
      age: 5,
      expectedLifespan: 15,
      status: 'good',
      lastService: '2024-05-15',
      nextServiceDue: '2025-05-15',
      efficiency: 85,
      serviceRecords: 5,
      estimatedValue: 6500
    },
    {
      id: '2',
      type: 'water_heater',
      name: 'Tankless Water Heater',
      brand: 'Rinnai',
      model: 'RU199iN',
      installDate: '2021-03-10',
      warrantyExpiration: '2031-03-10',
      age: 3,
      expectedLifespan: 20,
      status: 'good',
      lastService: '2024-03-10',
      nextServiceDue: '2025-03-10',
      efficiency: 95,
      serviceRecords: 3,
      estimatedValue: 3200
    },
    {
      id: '3',
      type: 'roofing',
      name: 'Asphalt Shingle Roof',
      installDate: '2015-08-20',
      age: 9,
      expectedLifespan: 25,
      status: 'fair',
      lastService: '2024-03-01',
      notes: 'Minor repairs needed after last storm',
      serviceRecords: 7,
      estimatedValue: 15000
    },
    {
      id: '4',
      type: 'electrical',
      name: 'Main Electrical Panel',
      brand: 'Square D',
      model: 'QO142M200PC',
      installDate: '2010-01-01',
      age: 14,
      expectedLifespan: 30,
      status: 'needs_attention',
      lastService: '2023-11-15',
      notes: 'Consider upgrading to 200 amp service',
      serviceRecords: 2,
      estimatedValue: 2500
    }
  ])

  const [maintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: '1',
      systemId: '1',
      task: 'Replace HVAC Filter',
      frequency: 'Monthly',
      lastCompleted: '2024-10-01',
      nextDue: '2024-12-01',
      priority: 'medium',
      estimatedCost: 25
    },
    {
      id: '2',
      systemId: '1',
      task: 'Annual HVAC Service',
      frequency: 'Yearly',
      nextDue: '2025-05-15',
      priority: 'high',
      estimatedCost: 150
    },
    {
      id: '3',
      systemId: '3',
      task: 'Roof Inspection',
      frequency: 'Bi-Annual',
      nextDue: '2025-03-01',
      priority: 'high',
      estimatedCost: 200
    },
    {
      id: '4',
      systemId: '2',
      task: 'Flush Water Heater',
      frequency: 'Yearly',
      nextDue: '2025-03-10',
      priority: 'medium',
      estimatedCost: 100
    }
  ])

  const getSystemIcon = (type: SystemType) => {
    switch(type) {
      case 'hvac': return Thermometer
      case 'plumbing': return Droplets
      case 'electrical': return Zap
      case 'roofing': return Home
      case 'water_heater': return Flame
      case 'appliances': return Settings
      default: return Wrench
    }
  }

  const getStatusColor = (status: SystemStatus) => {
    switch(status) {
      case 'good': return 'text-green-400'
      case 'fair': return 'text-yellow-400'
      case 'needs_attention': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusBgColor = (status: SystemStatus) => {
    switch(status) {
      case 'good': return 'bg-green-600'
      case 'fair': return 'bg-yellow-600'
      case 'needs_attention': return 'bg-orange-600'
      case 'critical': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const totalSystems = systems.length
  const systemsNeedingAttention = systems.filter(s => s.status === 'needs_attention' || s.status === 'critical').length
  const totalValue = systems.reduce((sum, system) => sum + system.estimatedValue, 0)
  const avgEfficiency = systems.filter(s => s.efficiency).reduce((sum, s) => sum + (s.efficiency || 0), 0) / systems.filter(s => s.efficiency).length

  const upcomingTasks = maintenanceTasks.filter(task => {
    const dueDate = new Date(task.nextDue)
    const today = new Date()
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 90
  }).sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Home Systems</h1>
              <p className="text-gray-400">Monitor and maintain your home's critical systems</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add System
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalSystems}</p>
                <p className="text-sm text-gray-400">Systems Tracked</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-orange-400">Action</span>
                </div>
                <p className="text-2xl font-bold text-white">{systemsNeedingAttention}</p>
                <p className="text-sm text-gray-400">Need Attention</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-400">{avgEfficiency.toFixed(0)}%</span>
                </div>
                <p className="text-2xl font-bold text-white">Good</p>
                <p className="text-sm text-gray-400">Avg Efficiency</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Value</p>
              </CardContent>
            </Card>
          </div>

          {/* Systems Grid */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Home Systems</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {systems.map((system) => {
                const Icon = getSystemIcon(system.type)
                const lifePercentage = (system.age / system.expectedLifespan) * 100
                
                return (
                  <Card key={system.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusBgColor(system.status)}`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">{system.name}</h3>
                            {system.brand && (
                              <p className="text-sm text-gray-400">{system.brand} {system.model}</p>
                            )}
                            <Badge className={`mt-2 ${getStatusColor(system.status)}`}>
                              {system.status.replace('_', ' ').charAt(0).toUpperCase() + system.status.slice(1).replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-white">
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">System Age</span>
                            <span className="text-gray-300">{system.age} / {system.expectedLifespan} years</span>
                          </div>
                          <Progress value={lifePercentage} className="h-2" />
                        </div>

                        {system.efficiency && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Efficiency</span>
                            <span className={`font-medium ${
                              system.efficiency >= 90 ? 'text-green-400' : 
                              system.efficiency >= 70 ? 'text-yellow-400' : 'text-orange-400'
                            }`}>
                              {system.efficiency}%
                            </span>
                          </div>
                        )}

                        {system.warrantyExpiration && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Warranty</span>
                            <span className="text-gray-300">
                              {new Date(system.warrantyExpiration) > new Date() 
                                ? `Until ${new Date(system.warrantyExpiration).toLocaleDateString()}`
                                : 'Expired'
                              }
                            </span>
                          </div>
                        )}

                        {system.nextServiceDue && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Next Service</span>
                            <span className="text-gray-300">{new Date(system.nextServiceDue).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {system.notes && (
                        <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-300">{system.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                            <FileText className="w-4 h-4" />
                            {system.serviceRecords} Records
                          </button>
                          <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                            <Calendar className="w-4 h-4" />
                            Schedule
                          </button>
                        </div>
                        <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Maintenance Schedule & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Upcoming Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTasks.map((task) => {
                    const system = systems.find(s => s.id === task.systemId)
                    const daysUntil = Math.ceil((new Date(task.nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <div key={task.id} className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-white">{task.task}</p>
                            <p className="text-sm text-gray-400">{system?.name}</p>
                          </div>
                          <Badge variant={
                            task.priority === 'high' ? 'destructive' : 
                            task.priority === 'medium' ? 'secondary' : 'default'
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            Due in {daysUntil} days ({new Date(task.nextDue).toLocaleDateString()})
                          </span>
                          {task.estimatedCost && (
                            <span className="text-gray-300">${task.estimatedCost}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/dashboard/maintenance')}
                    className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white">Schedule Service</p>
                        <p className="text-sm text-gray-400">Book maintenance appointments</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white">Service Records</p>
                        <p className="text-sm text-gray-400">View maintenance history</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">Warranties</p>
                        <p className="text-sm text-gray-400">Manage warranty documents</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="font-medium text-white">Energy Report</p>
                        <p className="text-sm text-gray-400">View efficiency metrics</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function HomeSystemsPage() {
  return (
    <ProtectedRoute>
      <HomeSystemsContent />
    </ProtectedRoute>
  )
}