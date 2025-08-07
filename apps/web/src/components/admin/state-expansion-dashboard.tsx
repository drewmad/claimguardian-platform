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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, CheckCircle, Clock, AlertTriangle, XCircle, TrendingUp, Calendar, Settings, Plus, Eye, Edit, BarChart3, Globe, Target, FileText, AlertCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { stateExpansionManager } from '@/lib/expansion/state-manager'
import type { StateConfiguration, StateExpansionPlan } from '@/lib/expansion/state-manager'
import { toast } from 'sonner'
import type { StateData, RegionData, TooltipFormatter } from './types'

const DEPLOYMENT_STATUS_COLORS = {
  planning: '#64748B',
  development: '#3B82F6',
  testing: '#F59E0B',
  staging: '#10B981',
  production: '#22C55E'
}

const DEPLOYMENT_STATUS_ICONS = {
  planning: Clock,
  development: Settings,
  testing: AlertTriangle,
  staging: CheckCircle,
  production: CheckCircle
}

const REGION_COLORS = {
  Northeast: '#3B82F6',
  Southeast: '#10B981',
  Midwest: '#F59E0B',
  Southwest: '#EF4444',
  West: '#8B5CF6'
}

const US_STATES_DATA: StateData[] = [
  // This would typically be loaded from the database
  { code: 'FL', name: 'Florida', region: 'Southeast', population: 21538187, marketSize: 54200000000, status: 'production' },
  { code: 'TX', name: 'Texas', region: 'Southwest', population: 29145505, marketSize: 78200000000, status: 'planning' },
  { code: 'CA', name: 'California', region: 'West', population: 39538223, marketSize: 78500000000, status: 'planning' },
  { code: 'NY', name: 'New York', region: 'Northeast', population: 20201249, marketSize: 52300000000, status: 'planning' },
  { code: 'GA', name: 'Georgia', region: 'Southeast', population: 10711908, marketSize: 26800000000, status: 'planning' },
  { code: 'NC', name: 'North Carolina', region: 'Southeast', population: 10439388, marketSize: 24600000000, status: 'planning' },
  { code: 'SC', name: 'South Carolina', region: 'Southeast', population: 5118425, marketSize: 12400000000, status: 'planning' },
  { code: 'AL', name: 'Alabama', region: 'Southeast', population: 5024279, marketSize: 12500000000, status: 'planning' },
  { code: 'LA', name: 'Louisiana', region: 'Southeast', population: 4657757, marketSize: 15600000000, status: 'planning' }
]

export function StateExpansionDashboard() {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [stateConfigs, setStateConfigs] = useState<StateConfiguration[]>([])
  const [expansionPlans, setExpansionPlans] = useState<StateExpansionPlan[]>([])
  const [readinessScores, setReadinessScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'overview' | 'states' | 'plans' | 'analytics'>('overview')

  useEffect(() => {
    loadExpansionData()
  }, [])

  const loadExpansionData = async () => {
    try {
      setLoading(true)

      // Load active states
      const activeStates = await stateExpansionManager.getActiveStates()
      setStateConfigs(activeStates)

      // Load expansion plans
      const plans = await stateExpansionManager.getExpansionPlan()
      setExpansionPlans(plans)

      // Load readiness scores for priority states
      const priorityStates = ['TX', 'CA', 'NY', 'GA', 'NC']
      const scores: Record<string, number> = {}

      for (const stateCode of priorityStates) {
        const readiness = await stateExpansionManager.getExpansionReadiness(stateCode)
        scores[stateCode] = readiness.score
      }
      setReadinessScores(scores)

      setLoading(false)
    } catch (error) {
      console.error('Failed to load expansion data:', error)
      toast.error('Failed to load expansion data')
      setLoading(false)
    }
  }

  const handleInitializeState = async (stateCode: string, stateName: string) => {
    try {
      await stateExpansionManager.initializeNewState(stateCode, stateName)
      toast.success(`Initialized ${stateName} for expansion`)
      await loadExpansionData()
    } catch (error) {
      toast.error(`Failed to initialize ${stateName}`)
    }
  }

  const getDeploymentStatusInfo = (status: string) => {
    const Icon = DEPLOYMENT_STATUS_ICONS[status as keyof typeof DEPLOYMENT_STATUS_ICONS] || Clock
    const color = DEPLOYMENT_STATUS_COLORS[status as keyof typeof DEPLOYMENT_STATUS_COLORS] || '#64748B'

    return { Icon, color }
  }

  const formatMarketSize = (size: number) => {
    if (size >= 1e9) return `$${(size / 1e9).toFixed(1)}B`
    if (size >= 1e6) return `$${(size / 1e6).toFixed(1)}M`
    return `$${size.toLocaleString()}`
  }

  const getExpansionPriority = (state: StateData) => {
    const marketScore = Math.min(state.marketSize / 1e9 / 100, 1) * 40
    const populationScore = Math.min(state.population / 40e6, 1) * 30
    const readinessScore = (readinessScores[state.code] || 0) * 0.3

    return marketScore + populationScore + readinessScore
  }

  // Prepare chart data
  const regionData = US_STATES_DATA.reduce((acc, state) => {
    const existing = acc.find(r => r.region === state.region)
    if (existing) {
      existing.states += 1
      existing.population += state.population
      existing.marketSize += state.marketSize
    } else {
      acc.push({
        region: state.region,
        states: 1,
        population: state.population,
        marketSize: state.marketSize,
        color: REGION_COLORS[state.region as keyof typeof REGION_COLORS]
      })
    }
    return acc
  }, [] as RegionData[])

  const expansionOpportunityData = US_STATES_DATA
    .filter(state => state.code !== 'FL')
    .map(state => ({
      name: state.name,
      code: state.code,
      marketSize: state.marketSize / 1e9,
      population: state.population / 1e6,
      priority: getExpansionPriority(state),
      readiness: readinessScores[state.code] || 0
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading expansion data...</p>
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
            <Globe className="h-7 w-7 text-blue-400" />
            Multi-State Expansion
          </h2>
          <p className="text-gray-400">Nationwide deployment planning and management</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('plans')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            View Plans
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => stateExpansionManager.createDefaultExpansionPlan()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active States</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stateConfigs.filter(s => s.isActive).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              of {stateConfigs.length} configured
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Market Coverage</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatMarketSize(US_STATES_DATA.reduce((sum, s) => s.status === 'production' ? sum + s.marketSize : sum, 0))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total addressable market
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Expansion Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {US_STATES_DATA.filter(s => ['development', 'testing', 'staging'].includes(s.status)).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              States in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Readiness</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Object.values(readinessScores).length > 0
                ? (Object.values(readinessScores).reduce((sum, score) => sum + score, 0) / Object.values(readinessScores).length).toFixed(0)
                : '0'
              }%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Expansion readiness
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'overview' | 'states' | 'plans' | 'analytics')} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="plans">Expansion Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Regional Market Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ region, marketSize }) =>
                        `${region}: ${formatMarketSize(marketSize)}`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="marketSize"
                    >
                      {regionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatMarketSize(value), 'Market Size']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expansion Opportunities */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Top Expansion Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={expansionOpportunityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="marketSize"
                      stroke="#9CA3AF"
                      fontSize={12}
                      label={{ value: 'Market Size ($B)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      dataKey="population"
                      stroke="#9CA3AF"
                      fontSize={12}
                      label={{ value: 'Population (M)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                      formatter={(value: unknown, name: string) => [
                        name === 'marketSize' ? `$${value}B` : `${value}M`,
                        name === 'marketSize' ? 'Market Size' : 'Population'
                      ]}
                      labelFormatter={(code) => {
                        const state = expansionOpportunityData.find(s => s.code === code)
                        return state ? state.name : code
                      }}
                    />
                    <Scatter dataKey="population" fill="#3B82F6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* State Status Grid */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">State Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {US_STATES_DATA.map(state => {
                  const { Icon, color } = getDeploymentStatusInfo(state.status)
                  const readiness = readinessScores[state.code] || 0

                  return (
                    <div
                      key={state.code}
                      className="p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
                      onClick={() => setSelectedState(state.code)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-white">{state.name}</span>
                        </div>
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Population:</span>
                          <span className="text-white">{(state.population / 1e6).toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Market:</span>
                          <span className="text-white">{formatMarketSize(state.marketSize)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Readiness:</span>
                            <span className="text-white">{readiness}%</span>
                          </div>
                          <Progress value={readiness} className="h-2" />
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                          style={{ borderColor: color, color }}
                        >
                          {state.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {state.region}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* States Tab */}
        <TabsContent value="states" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">State Configurations</h3>
            <Button onClick={loadExpansionData}>
              <Eye className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {US_STATES_DATA.map(state => {
              const config = stateConfigs.find(c => c.stateCode === state.code)
              const readiness = readinessScores[state.code] || 0
              const { Icon, color } = getDeploymentStatusInfo(state.status)

              return (
                <Card key={state.code} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6" style={{ color }} />
                        <div>
                          <CardTitle className="text-white">{state.name} ({state.code})</CardTitle>
                          <p className="text-gray-400 text-sm">{state.region} Region</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {config ? (
                          <Badge variant="default">Configured</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleInitializeState(state.code, state.name)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Initialize
                          </Button>
                        )}
                        <Badge
                          variant="outline"
                          style={{ borderColor: color, color }}
                          className="capitalize"
                        >
                          {state.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Market Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">Market Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Population:</span>
                            <span className="text-white">{state.population.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Market Size:</span>
                            <span className="text-white">{formatMarketSize(state.marketSize)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Region:</span>
                            <span className="text-white">{state.region}</span>
                          </div>
                        </div>
                      </div>

                      {/* Readiness Score */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">Expansion Readiness</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Overall Score:</span>
                            <span className="text-white font-medium">{readiness}%</span>
                          </div>
                          <Progress value={readiness} className="h-3" />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Regulatory:</span>
                              <span className="text-gray-300">{Math.floor(readiness * 0.25)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Technical:</span>
                              <span className="text-gray-300">{Math.floor(readiness * 0.25)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Market:</span>
                              <span className="text-gray-300">{Math.floor(readiness * 0.25)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Operations:</span>
                              <span className="text-gray-300">{Math.floor(readiness * 0.25)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Configuration Status */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">Configuration</h4>
                        {config ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-white">State Initialized</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {config.isActive ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span className="text-white">
                                {config.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {config.deployment.migrationComplete ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500" />
                              )}
                              <span className="text-white">
                                Migration {config.deployment.migrationComplete ? 'Complete' : 'Pending'}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => setSelectedState(state.code)}
                            >
                              <Edit className="mr-2 h-3 w-3" />
                              Configure
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-3 w-3 text-yellow-500" />
                              <span>Not Initialized</span>
                            </div>
                            <p className="text-xs">
                              Initialize this state to begin expansion planning.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Expansion Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Expansion Plans</h3>
            <Button onClick={() => stateExpansionManager.createDefaultExpansionPlan()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>

          {expansionPlans.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Expansion Plans</h3>
                <p className="text-gray-400 mb-4">
                  Create expansion plans to organize your multi-state rollout strategy.
                </p>
                <Button onClick={() => stateExpansionManager.createDefaultExpansionPlan()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Default Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {expansionPlans.map(plan => (
                <Card key={plan.phase} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Phase {plan.phase} Expansion</CardTitle>
                        <p className="text-gray-400">
                          {plan.states.join(', ')} • {plan.timeline.start.toLocaleDateString()} - {plan.timeline.end.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {plan.states.length} States
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Timeline & Milestones */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">Timeline & Milestones</h4>
                        <div className="space-y-2">
                          {plan.timeline.milestones.map((milestone, index) => {
                            const StatusIcon = milestone.status === 'completed' ? CheckCircle :
                                             milestone.status === 'in_progress' ? Clock :
                                             milestone.status === 'blocked' ? XCircle : Clock
                            const statusColor = milestone.status === 'completed' ? 'text-green-500' :
                                              milestone.status === 'in_progress' ? 'text-blue-500' :
                                              milestone.status === 'blocked' ? 'text-red-500' : 'text-gray-500'

                            return (
                              <div key={index} className="flex items-center gap-3 text-sm">
                                <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                                <div className="flex-1">
                                  <div className="text-white">{milestone.name}</div>
                                  <div className="text-gray-400 text-xs">
                                    {milestone.date.toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Resources */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">Resource Planning</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Engineering:</span>
                            <span className="text-white">{plan.resources.engineeringEffort} weeks</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Data Acquisition:</span>
                            <span className="text-white">${plan.resources.dataAcquisitionCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Compliance:</span>
                            <span className="text-white">${plan.resources.complianceCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Operations:</span>
                            <span className="text-white">${plan.resources.operationalCost.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-gray-700 pt-2 mt-2">
                            <div className="flex justify-between font-medium">
                              <span className="text-gray-300">Total:</span>
                              <span className="text-white">
                                ${(plan.resources.dataAcquisitionCost +
                                   plan.resources.complianceCost +
                                   plan.resources.operationalCost).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Risks */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">Risk Assessment</h4>
                        <div className="space-y-2">
                          {plan.risks.map((risk, index) => {
                            const impactColor = risk.impact === 'high' ? 'text-red-500' :
                                              risk.impact === 'medium' ? 'text-yellow-500' : 'text-green-500'
                            const probColor = risk.probability === 'high' ? 'text-red-500' :
                                            risk.probability === 'medium' ? 'text-yellow-500' : 'text-green-500'

                            return (
                              <div key={index} className="p-3 border border-gray-700 rounded text-sm">
                                <div className="text-white font-medium mb-1">{risk.risk}</div>
                                <div className="flex gap-4 mb-2">
                                  <span className="text-gray-400">
                                    Impact: <span className={impactColor}>{risk.impact}</span>
                                  </span>
                                  <span className="text-gray-400">
                                    Probability: <span className={probColor}>{risk.probability}</span>
                                  </span>
                                </div>
                                <div className="text-gray-300 text-xs">{risk.mitigation}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expansion Progress Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Expansion Progress by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="region"
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="states" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Market Opportunity Timeline */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Market Opportunity vs Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={expansionOpportunityData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="priority"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Opportunity Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="readiness"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Readiness Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Expansion Metrics Summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Expansion Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {formatMarketSize(US_STATES_DATA.reduce((sum, s) => sum + s.marketSize, 0))}
                  </div>
                  <div className="text-gray-400 text-sm">Total US Market</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {((US_STATES_DATA.filter(s => s.status === 'production').reduce((sum, s) => sum + s.marketSize, 0) /
                       US_STATES_DATA.reduce((sum, s) => sum + s.marketSize, 0)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-gray-400 text-sm">Market Penetration</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {US_STATES_DATA.filter(s => s.status !== 'production').length}
                  </div>
                  <div className="text-gray-400 text-sm">States Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {expansionPlans.reduce((sum, plan) => sum + plan.resources.engineeringEffort, 0)}
                  </div>
                  <div className="text-gray-400 text-sm">Engineering Weeks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
