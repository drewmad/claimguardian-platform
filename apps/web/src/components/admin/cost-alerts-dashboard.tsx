/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign,
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Target,
  Calendar,
  PieChart,
  Activity,
  Settings
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { aiCostMonitor } from '@/lib/ai/cost-monitor'
import type { CostBudget, CostAlert, CostMetrics } from '@/lib/ai/cost-monitor'
import { toast } from 'sonner'

const ALERT_COLORS = {
  info: 'bg-blue-900/20 border-blue-900 text-blue-300',
  warning: 'bg-yellow-900/20 border-yellow-900 text-yellow-300',
  critical: 'bg-red-900/20 border-red-900 text-red-300'
}

const FEATURE_COLORS = {
  'damage-analyzer': '#8B5CF6',
  'policy-chat': '#F59E0B',
  'settlement-analyzer': '#06B6D4',
  'claim-assistant': '#10B981',
  'document-generator': '#EF4444',
  'communication-helper': '#F97316'
}

export function CostAlertsDashboard() {
  const [budgets, setBudgets] = useState<CostBudget[]>([])
  const [alerts, setAlerts] = useState<CostAlert[]>([])
  const [metrics, setMetrics] = useState<CostMetrics>({
    totalSpent: 0,
    dailySpend: 0,
    weeklySpend: 0,
    monthlySpend: 0,
    avgDailySpend: 0,
    predictedMonthlySpend: 0,
    costPerRequest: 0,
    costPerFeature: {},
    costTrend: 'stable'
  })
  
  const [loading, setLoading] = useState(true)
  const [showCreateBudget, setShowCreateBudget] = useState(false)
  const [editingBudget, setEditingBudget] = useState<CostBudget | null>(null)
  const [newBudget, setNewBudget] = useState<{
    name: string
    type: 'daily' | 'weekly' | 'monthly' | 'yearly'
    amount: number
    featureId: string
    alertThresholds: { warning: number; critical: number }
  }>({
    name: '',
    type: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    amount: 100,
    featureId: '',
    alertThresholds: { warning: 75, critical: 90 }
  })

  useEffect(() => {
    const loadData = () => {
      try {
        const currentBudgets = aiCostMonitor.getBudgets()
        const currentAlerts = aiCostMonitor.getAlerts()
        const currentMetrics = aiCostMonitor.getCostMetrics()
        
        setBudgets(currentBudgets)
        setAlerts(currentAlerts)
        setMetrics(currentMetrics)
        setLoading(false)
      } catch (error) {
        console.error('Error loading cost monitoring data:', error)
        toast.error('Failed to load cost monitoring data')
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000) // Update every 30 seconds

    // Set up alert listener
    const unsubscribe = aiCostMonitor.onAlert((alert) => {
      toast.error(`Cost Alert: ${alert.message}`, {
        duration: 10000,
        action: {
          label: 'View Details',
          onClick: () => {
            // Could open alert details modal
          }
        }
      })
      loadData() // Refresh data when new alert arrives
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  const handleCreateBudget = () => {
    try {
      const budgetId = aiCostMonitor.createBudget({
        name: newBudget.name,
        type: newBudget.type,
        amount: newBudget.amount,
        featureId: newBudget.featureId || undefined,
        alertThresholds: newBudget.alertThresholds,
        isActive: true
      })

      setBudgets(aiCostMonitor.getBudgets())
      setNewBudget({
        name: '',
        type: 'monthly',
        amount: 100,
        featureId: '',
        alertThresholds: { warning: 75, critical: 90 }
      })
      setShowCreateBudget(false)
      toast.success('Budget created successfully')
    } catch (error) {
      toast.error('Failed to create budget')
    }
  }

  const handleUpdateBudget = () => {
    if (!editingBudget) return

    try {
      aiCostMonitor.updateBudget(editingBudget.id, editingBudget)
      setBudgets(aiCostMonitor.getBudgets())
      setEditingBudget(null)
      toast.success('Budget updated successfully')
    } catch (error) {
      toast.error('Failed to update budget')
    }
  }

  const handleDeleteBudget = (budgetId: string) => {
    try {
      aiCostMonitor.deleteBudget(budgetId)
      setBudgets(aiCostMonitor.getBudgets())
      toast.success('Budget deleted successfully')
    } catch (error) {
      toast.error('Failed to delete budget')
    }
  }

  const handleResolveAlert = (alertId: string) => {
    try {
      aiCostMonitor.resolveAlert(alertId)
      setAlerts(aiCostMonitor.getAlerts())
      toast.success('Alert resolved')
    } catch (error) {
      toast.error('Failed to resolve alert')
    }
  }

  const getAlertIcon = (level: CostAlert['level']) => {
    switch (level) {
      case 'info': return <Bell className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <XCircle className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: CostMetrics['costTrend']) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-400" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-400" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getBudgetStatus = (budget: CostBudget) => {
    const percentage = (budget.spent / budget.amount) * 100
    if (percentage >= 100) return { status: 'exceeded', color: 'text-red-400' }
    if (percentage >= budget.alertThresholds.critical) return { status: 'critical', color: 'text-red-400' }
    if (percentage >= budget.alertThresholds.warning) return { status: 'warning', color: 'text-yellow-400' }
    return { status: 'healthy', color: 'text-green-400' }
  }

  // Prepare chart data
  const budgetChartData = budgets.map(budget => ({
    name: budget.name.length > 15 ? budget.name.substring(0, 15) + '...' : budget.name,
    spent: budget.spent,
    remaining: budget.remaining,
    percentage: (budget.spent / budget.amount) * 100
  }))

  const featureSpendingData = Object.entries(metrics.costPerFeature).map(([feature, cost]) => ({
    name: feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: parseFloat(cost.toFixed(2)),
    color: FEATURE_COLORS[feature as keyof typeof FEATURE_COLORS] || '#6B7280'
  }))

  // Mock trend data - in production this would come from historical data
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
    spend: metrics.avgDailySpend * (0.8 + Math.random() * 0.4),
    prediction: metrics.avgDailySpend
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading cost monitoring data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="h-7 w-7 text-green-400" />
            Cost Monitoring & Budget Controls
          </h2>
          <p className="text-gray-400">Manage AI spending budgets and automated cost alerts</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateBudget(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
          <Badge variant={alerts.length > 0 ? "destructive" : "outline"}>
            {alerts.length > 0 ? (
              <>
                <Bell className="mr-1 h-3 w-3" />
                {alerts.length} Active Alerts
              </>
            ) : (
              <>
                <BellOff className="mr-1 h-3 w-3" />
                No Alerts
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
          {alerts.slice(0, 5).map((alert) => (
            <Alert key={alert.id} className={ALERT_COLORS[alert.level]}>
              {getAlertIcon(alert.level)}
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{alert.message}</span>
                  <span className="block text-xs opacity-80 mt-1">
                    {alert.timestamp.toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolveAlert(alert.id)}
                  className="ml-4"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          ))}
          {alerts.length > 5 && (
            <p className="text-sm text-gray-400 text-center">
              +{alerts.length - 5} more alerts
            </p>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics.monthlySpend.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Predicted: ${metrics.predictedMonthlySpend.toFixed(2)}
            </p>
            <div className="flex items-center mt-2">
              {getTrendIcon(metrics.costTrend)}
              <span className="text-sm ml-1 text-gray-400">
                {metrics.costTrend} trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics.avgDailySpend.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Today: ${metrics.dailySpend.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cost per Request</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics.costPerRequest.toFixed(4)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Average across all features
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Budgets</CardTitle>
            <Target className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {budgets.filter(b => b.isActive).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {budgets.filter(b => getBudgetStatus(b).status !== 'healthy').length} need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budgets" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="budgets">Budget Management</TabsTrigger>
          <TabsTrigger value="analytics">Spending Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alert History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Budget Management Tab */}
        <TabsContent value="budgets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Active Budgets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgets.map((budget) => {
                    const status = getBudgetStatus(budget)
                    const percentage = (budget.spent / budget.amount) * 100

                    return (
                      <div key={budget.id} className="p-4 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-white">{budget.name}</h4>
                            <p className="text-sm text-gray-400">
                              {budget.type} • {budget.featureId || 'All features'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={status.color}>
                              {status.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingBudget(budget)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBudget(budget.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Spent:</span>
                            <span className="text-white font-medium">
                              ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                            </span>
                          </div>
                          <Progress value={Math.min(percentage, 100)} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Warning: {budget.alertThresholds.warning}%</span>
                            <span>Critical: {budget.alertThresholds.critical}%</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-gray-400">
                          Resets: {budget.resetDate.toLocaleDateString()}
                        </div>
                      </div>
                    )
                  })}

                  {budgets.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No budgets configured</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowCreateBudget(true)}
                      >
                        Create First Budget
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Budget Overview Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {budgetChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="name"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                      />
                      <Bar dataKey="spent" stackId="a" fill="#EF4444" />
                      <Bar dataKey="remaining" stackId="a" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No budget data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Trend */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">7-Day Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Actual Spend"
                    />
                    <Line
                      type="monotone"
                      dataKey="prediction"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      name="Predicted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Spending by Feature</CardTitle>
              </CardHeader>
              <CardContent>
                {featureSpendingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={featureSpendingData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => 
                          `${name} ${((percent || 0) * 100).toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {featureSpendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No feature spending data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alert History Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiCostMonitor.getAlerts(true).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.isResolved 
                        ? 'bg-slate-700/30 border-slate-600 opacity-60' 
                        : ALERT_COLORS[alert.level]
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.level)}
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm opacity-80 mt-1">
                            {alert.timestamp.toLocaleString()}
                            {alert.resolvedAt && (
                              <span className="ml-2">
                                • Resolved {alert.resolvedAt.toLocaleString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {!alert.isResolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No alerts generated yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Global Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Alert Thresholds</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Warning (%)</Label>
                      <Input
                        type="number"
                        defaultValue="75"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Critical (%)</Label>
                      <Input
                        type="number"
                        defaultValue="90"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Alert Frequency</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Export Data</Label>
                  <p className="text-sm text-gray-400">
                    Export budget and alert data for backup or analysis
                  </p>
                  <Button variant="outline" className="w-full">
                    Export JSON
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Import Data</Label>
                  <p className="text-sm text-gray-400">
                    Import previously exported budget configuration
                  </p>
                  <Button variant="outline" className="w-full">
                    Import from File
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <Button variant="destructive" className="w-full">
                    Reset All Budgets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Budget Modal */}
      {showCreateBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Create New Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Budget Name</Label>
                <Input
                  value={newBudget.name}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly AI Operations"
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label>Budget Type</Label>
                <Select
                  value={newBudget.type}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setNewBudget(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Budget Amount ($)</Label>
                <Input
                  type="number"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label>Feature (Optional)</Label>
                <Select
                  value={newBudget.featureId}
                  onValueChange={(value) => setNewBudget(prev => ({ ...prev, featureId: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="All features" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All features</SelectItem>
                    <SelectItem value="damage-analyzer">Damage Analyzer</SelectItem>
                    <SelectItem value="policy-chat">Policy Chat</SelectItem>
                    <SelectItem value="settlement-analyzer">Settlement Analyzer</SelectItem>
                    <SelectItem value="claim-assistant">Claim Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Warning (%)</Label>
                  <Input
                    type="number"
                    value={newBudget.alertThresholds.warning}
                    onChange={(e) => setNewBudget(prev => ({ 
                      ...prev, 
                      alertThresholds: { 
                        ...prev.alertThresholds, 
                        warning: parseFloat(e.target.value) || 0 
                      }
                    }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label>Critical (%)</Label>
                  <Input
                    type="number"
                    value={newBudget.alertThresholds.critical}
                    onChange={(e) => setNewBudget(prev => ({ 
                      ...prev, 
                      alertThresholds: { 
                        ...prev.alertThresholds, 
                        critical: parseFloat(e.target.value) || 0 
                      }
                    }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateBudget} className="flex-1">
                  Create Budget
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateBudget(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Edit Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Budget Name</Label>
                <Input
                  value={editingBudget.name}
                  onChange={(e) => setEditingBudget(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label>Budget Amount ($)</Label>
                <Input
                  type="number"
                  value={editingBudget.amount}
                  onChange={(e) => setEditingBudget(prev => prev ? ({ ...prev, amount: parseFloat(e.target.value) || 0 }) : null)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Warning (%)</Label>
                  <Input
                    type="number"
                    value={editingBudget.alertThresholds.warning}
                    onChange={(e) => setEditingBudget(prev => prev ? ({ 
                      ...prev, 
                      alertThresholds: { 
                        ...prev.alertThresholds, 
                        warning: parseFloat(e.target.value) || 0 
                      }
                    }) : null)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label>Critical (%)</Label>
                  <Input
                    type="number"
                    value={editingBudget.alertThresholds.critical}
                    onChange={(e) => setEditingBudget(prev => prev ? ({ 
                      ...prev, 
                      alertThresholds: { 
                        ...prev.alertThresholds, 
                        critical: parseFloat(e.target.value) || 0 
                      }
                    }) : null)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <button
                  onClick={() => setEditingBudget(prev => prev ? ({ ...prev, isActive: !prev.isActive }) : null)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    editingBudget.isActive ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editingBudget.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateBudget} className="flex-1">
                  Update Budget
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingBudget(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}