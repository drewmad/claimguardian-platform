'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  ArrowLeft, 
  Users, 
  FileText, 
  AlertCircle, 
  Settings, 
  Activity,
  Database,
  Brain,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  Edit,
  Eye,
  History
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'users', 'ml-operations', 'errors', 'legal-docs', 'compliance', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

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
    }
  }

  const recentUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', joined: '2024-01-20', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', joined: '2024-01-19', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', joined: '2024-01-18', status: 'inactive' },
  ]

  const legalDocs = [
    { id: 1, title: 'Terms of Service', version: '2.3', lastUpdated: '2024-01-10', status: 'published' },
    { id: 2, title: 'Privacy Policy', version: '3.1', lastUpdated: '2024-01-08', status: 'published' },
    { id: 3, title: 'AI Use Agreement', version: '1.2', lastUpdated: '2024-01-05', status: 'draft' },
  ]

  const recentErrors = [
    { id: 1, level: 'critical', message: 'Database connection timeout', timestamp: '2024-01-20 14:23:45', count: 3 },
    { id: 2, level: 'warning', message: 'API rate limit approaching', timestamp: '2024-01-20 13:15:22', count: 1 },
    { id: 3, level: 'info', message: 'Scheduled maintenance completed', timestamp: '2024-01-20 12:00:00', count: 1 },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
          </div>
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
            <Button variant="outline" size="sm" className="border-slate-700">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ml-operations">ML Operations</TabsTrigger>
            <TabsTrigger value="errors">Error Dashboard</TabsTrigger>
            <TabsTrigger value="legal-docs">Legal Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeUsers} active
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClaims}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeClaims} active
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ML Accuracy</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.mlOperations.avgAccuracy}%</div>
                  <p className="text-xs text-muted-foreground">
                    Avg model performance
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Errors</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.errors.total}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-500">{stats.errors.critical} critical</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm">New user registration</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm">ML model training completed</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm">Database backup completed</p>
                      <p className="text-xs text-gray-500">3 hours ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('users')}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('ml-operations')}>
                    <Brain className="mr-2 h-4 w-4" />
                    ML Dashboard
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('errors')}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    View Errors
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('legal-docs')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Legal Docs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">User Management</h2>
                <p className="text-gray-400">Overview of all users in the system</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <div className="mt-4 flex items-center text-sm text-green-500">
                    <ArrowLeft className="mr-1 h-3 w-3 rotate-45" />
                    12% from last month
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  <p className="text-sm text-gray-400">Active Users</p>
                  <div className="mt-4 flex items-center text-sm text-green-500">
                    <ArrowLeft className="mr-1 h-3 w-3 rotate-45" />
                    8% from last month
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">79.9%</div>
                  <p className="text-sm text-gray-400">Retention Rate</p>
                  <div className="mt-4 flex items-center text-sm text-red-500">
                    <ArrowLeft className="mr-1 h-3 w-3 -rotate-45" />
                    2% from last month
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Joined</p>
                          <p className="text-sm font-medium">{user.joined}</p>
                        </div>
                        <Badge variant={user.status === 'active' ? 'secondary' : 'outline'}>
                          {user.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ML Operations Tab */}
          <TabsContent value="ml-operations" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">ML Operations Dashboard</h2>
              <p className="text-gray-400">Monitor and manage machine learning models</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Models Deployed</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.mlOperations.modelsDeployed}</div>
                  <p className="text-xs text-muted-foreground">Active models</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.mlOperations.totalPredictions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.mlOperations.avgAccuracy}%</div>
                  <p className="text-xs text-muted-foreground">Across all models</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Training</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.mlOperations.lastTraining}</div>
                  <p className="text-xs text-muted-foreground">Scheduled weekly</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
                <CardDescription>Performance metrics for deployed models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Damage Assessment Model</h4>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Accuracy</p>
                        <p className="font-semibold">96.2%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Predictions</p>
                        <p className="font-semibold">12,345</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Latency</p>
                        <p className="font-semibold">142ms</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Document Extraction Model</h4>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Accuracy</p>
                        <p className="font-semibold">93.8%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Predictions</p>
                        <p className="font-semibold">8,901</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Latency</p>
                        <p className="font-semibold">287ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Dashboard Tab */}
          <TabsContent value="errors" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Error Dashboard</h2>
                <p className="text-gray-400">System errors and warnings</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Clear Resolved
                </Button>
                <Button variant="outline" size="sm">
                  Export Log
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Errors</p>
                      <p className="text-2xl font-bold">{stats.errors.total}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Critical</p>
                      <p className="text-2xl font-bold text-red-500">{stats.errors.critical}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-500">{stats.errors.warning}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Info</p>
                      <p className="text-2xl font-bold text-blue-500">{stats.errors.info}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Latest system errors and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentErrors.map((error) => (
                    <div key={error.id} className="p-4 bg-slate-800 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {error.level === 'critical' && <XCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                          {error.level === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                          {error.level === 'info' && <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
                          <div>
                            <p className="font-medium text-white">{error.message}</p>
                            <p className="text-sm text-gray-400">{error.timestamp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {error.count > 1 && (
                            <Badge variant="secondary">×{error.count}</Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Documents Tab */}
          <TabsContent value="legal-docs" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Legal Documents</h2>
                <p className="text-gray-400">Manage terms, privacy policy, and other legal documents</p>
              </div>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                New Document
              </Button>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {legalDocs.map((doc) => (
                    <div key={doc.id} className="p-4 bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <FileText className="h-10 w-10 text-blue-500 bg-blue-500/10 rounded-lg p-2" />
                          <div>
                            <h4 className="font-medium text-white">{doc.title}</h4>
                            <p className="text-sm text-gray-400">Version {doc.version} • Last updated {doc.lastUpdated}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={doc.status === 'published' ? 'secondary' : 'outline'}>
                            {doc.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Document History</CardTitle>
                <CardDescription>Recent changes to legal documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-white">Terms of Service updated to v2.3</p>
                      <p className="text-gray-400">by Admin User • 3 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-white">Privacy Policy updated to v3.1</p>
                      <p className="text-gray-400">by Legal Team • 5 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-white">AI Use Agreement created</p>
                      <p className="text-gray-400">by Admin User • 1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Compliance Management</h2>
              <p className="text-gray-400">Florida insurance compliance and user consent tracking</p>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Consent Statistics</CardTitle>
                <CardDescription>User consent acceptance rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-400">Terms Accepted</p>
                    <p className="text-2xl font-bold">98.2%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Privacy Accepted</p>
                    <p className="text-2xl font-bold">97.8%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">FL Disclosures</p>
                    <p className="text-2xl font-bold">89.3%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">AI Disclaimer</p>
                    <p className="text-2xl font-bold">95.1%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin Settings</h2>
              <p className="text-gray-400">Configure admin panel and system settings</p>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" defaultValue="ClaimGuardian" className="mt-1 bg-slate-800 border-slate-700" />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input id="adminEmail" type="email" defaultValue="admin@claimguardian.com" className="mt-1 bg-slate-800 border-slate-700" />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="America/New_York" className="mt-1 bg-slate-800 border-slate-700" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}