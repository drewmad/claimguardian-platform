/**
 * @fileMetadata
 * @purpose Home maintenance tracking and scheduling dashboard
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "maintenance", "scheduling"]
 * @status active
 */
'use client'

import { 
  Calendar, Plus, Clock, CheckCircle, AlertCircle, XCircle,
  Wrench, DollarSign, FileText, User, ChevronRight,
  Filter, Download, Bell, BarChart,
  Home, Shield, Edit,
  Wind, Droplets, Zap, Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
type TaskFrequency = 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual'

interface MaintenanceTask {
  id: string
  title: string
  description: string
  category: string
  system?: string
  status: TaskStatus
  priority: TaskPriority
  frequency: TaskFrequency
  dueDate: string
  completedDate?: string
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  duration?: string
  notes?: string
  attachments?: number
}

interface MaintenanceCategory {
  id: string
  name: string
  icon: React.ComponentType<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  color: string
  taskCount: number
}

interface Contractor {
  id: string
  name: string
  specialty: string
  rating: number
  jobs: number
}

function MaintenanceDashboardContent() {
  const router = useRouter()
  
  // Mock data
  const [tasks] = useState<MaintenanceTask[]>([
    {
      id: '1',
      title: 'Replace HVAC Filter',
      description: 'Monthly filter replacement for central AC system',
      category: 'HVAC',
      system: 'Central AC & Heating',
      status: 'overdue',
      priority: 'medium',
      frequency: 'monthly',
      dueDate: '2024-11-15',
      estimatedCost: 25,
      duration: '15 mins'
    },
    {
      id: '2',
      title: 'Gutter Cleaning',
      description: 'Clean and inspect gutters before rainy season',
      category: 'Exterior',
      status: 'scheduled',
      priority: 'high',
      frequency: 'semi_annual',
      dueDate: '2024-12-01',
      assignedTo: 'ProClean Services',
      estimatedCost: 150,
      duration: '2 hours'
    },
    {
      id: '3',
      title: 'Annual HVAC Service',
      description: 'Professional inspection and tune-up of AC system',
      category: 'HVAC',
      system: 'Central AC & Heating',
      status: 'scheduled',
      priority: 'high',
      frequency: 'annual',
      dueDate: '2025-05-15',
      assignedTo: 'Cool Air Pros',
      estimatedCost: 150,
      duration: '1 hour'
    },
    {
      id: '4',
      title: 'Test Smoke Detectors',
      description: 'Test all smoke and carbon monoxide detectors',
      category: 'Safety',
      status: 'completed',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2024-11-01',
      completedDate: '2024-11-01',
      actualCost: 0,
      duration: '30 mins'
    },
    {
      id: '5',
      title: 'Pressure Wash Driveway',
      description: 'Clean driveway and walkways',
      category: 'Exterior',
      status: 'scheduled',
      priority: 'low',
      frequency: 'annual',
      dueDate: '2025-03-15',
      estimatedCost: 200,
      duration: '3 hours'
    }
  ])

  const [categories] = useState<MaintenanceCategory[]>([
    { id: 'hvac', name: 'HVAC', icon: Wind, color: 'text-blue-400', taskCount: 2 },
    { id: 'plumbing', name: 'Plumbing', icon: Droplets, color: 'text-cyan-400', taskCount: 0 },
    { id: 'electrical', name: 'Electrical', icon: Zap, color: 'text-yellow-400', taskCount: 0 },
    { id: 'exterior', name: 'Exterior', icon: Home, color: 'text-green-400', taskCount: 2 },
    { id: 'safety', name: 'Safety', icon: Shield, color: 'text-purple-400', taskCount: 1 },
    { id: 'appliances', name: 'Appliances', icon: Settings, color: 'text-orange-400', taskCount: 0 }
  ])

  const [contractors] = useState<Contractor[]>([
    { id: '1', name: 'Cool Air Pros', specialty: 'HVAC', rating: 4.8, jobs: 12 },
    { id: '2', name: 'ProClean Services', specialty: 'Cleaning', rating: 4.9, jobs: 8 },
    { id: '3', name: 'Fix-It Electric', specialty: 'Electrical', rating: 4.7, jobs: 5 }
  ])

  const getStatusColor = (status: TaskStatus) => {
    switch(status) {
      case 'completed': return 'bg-green-600'
      case 'in_progress': return 'bg-blue-600'
      case 'scheduled': return 'bg-gray-600'
      case 'overdue': return 'bg-red-600'
      case 'cancelled': return 'bg-gray-700'
      default: return 'bg-gray-600'
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch(status) {
      case 'completed': return CheckCircle
      case 'in_progress': return Clock
      case 'scheduled': return Calendar
      case 'overdue': return AlertCircle
      case 'cancelled': return XCircle
      default: return Calendar
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch(priority) {
      case 'urgent': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const totalTasks = tasks.length
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length
  const completedThisMonth = tasks.filter(t => 
    t.status === 'completed' && 
    t.completedDate && 
    new Date(t.completedDate).getMonth() === new Date().getMonth()
  ).length
  const estimatedCostThisMonth = tasks
    .filter(t => t.dueDate && new Date(t.dueDate).getMonth() === new Date().getMonth())
    .reduce((sum, task) => sum + (task.estimatedCost || 0), 0)

  const upcomingTasks = tasks
    .filter(t => t.status === 'scheduled' || t.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Maintenance Schedule</h1>
              <p className="text-gray-400">Track and manage home maintenance tasks</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Task
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
                <p className="text-2xl font-bold text-white">{totalTasks}</p>
                <p className="text-sm text-gray-400">Active Tasks</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-xs text-red-400">Overdue</span>
                </div>
                <p className="text-2xl font-bold text-white">{overdueTasks}</p>
                <p className="text-sm text-gray-400">Need Attention</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-400">This Month</span>
                </div>
                <p className="text-2xl font-bold text-white">{completedThisMonth}</p>
                <p className="text-sm text-gray-400">Completed</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs text-gray-400">Est. Cost</span>
                </div>
                <p className="text-2xl font-bold text-white">${estimatedCostThisMonth}</p>
                <p className="text-sm text-gray-400">This Month</p>
              </CardContent>
            </Card>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Task Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Card key={category.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${category.color}`} />
                      <p className="text-sm font-medium text-white">{category.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{category.taskCount} tasks</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Tasks and Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Upcoming Tasks</CardTitle>
                    <div className="flex gap-2">
                      <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-400">
                        <Filter className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-400">
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => {
                      const StatusIcon = getStatusIcon(task.status)
                      const daysUntil = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      
                      return (
                        <div key={task.id} className="p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(task.status)}`}>
                                <StatusIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-medium text-white">{task.title}</h3>
                                <p className="text-sm text-gray-400">{task.description}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                  <span className="text-xs text-gray-400">{task.category}</span>
                                  {task.frequency !== 'one_time' && (
                                    <span className="text-xs text-gray-400">
                                      Repeats {task.frequency.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {task.estimatedCost && (
                                <p className="text-lg font-semibold text-white mb-1">${task.estimatedCost}</p>
                              )}
                              <p className="text-xs text-gray-400">
                                {task.status === 'overdue' 
                                  ? `${Math.abs(daysUntil)} days overdue`
                                  : `Due in ${daysUntil} days`
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              {task.assignedTo && (
                                <span className="flex items-center gap-1 text-gray-400">
                                  <User className="w-3 h-3" />
                                  {task.assignedTo}
                                </span>
                              )}
                              {task.duration && (
                                <span className="flex items-center gap-1 text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {task.duration}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded text-gray-300">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded text-gray-300">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <button className="w-full mt-4 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center text-gray-300">
                    View All Tasks
                  </button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Preferred Contractors */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Preferred Contractors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contractors.map((contractor) => (
                      <div key={contractor.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-white">{contractor.name}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-white">{contractor.rating}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{contractor.specialty}</span>
                          <span className="text-gray-400">{contractor.jobs} jobs</span>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => router.push('/dashboard/contractors')}
                      className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center text-gray-300 flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Manage Contractors
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-white">Export Schedule</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-white">Set Reminders</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-white">Cost Report</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-white">Task Templates</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function MaintenancePage() {
  return (
    <ProtectedRoute>
      <MaintenanceDashboardContent />
    </ProtectedRoute>
  )
}