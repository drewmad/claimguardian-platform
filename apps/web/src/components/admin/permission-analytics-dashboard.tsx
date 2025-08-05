/**
 * @fileMetadata
 * @purpose Advanced analytics dashboard for permission usage patterns
 * @owner admin-team
 * @status active
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Eye,
  Activity
} from 'lucide-react'
import { UserTier, PermissionType } from '@/lib/permissions/permission-checker'

interface PermissionUsageStats {
  permission: PermissionType
  name: string
  totalUsers: number
  activeUsers: number
  usageCount: number
  successRate: number
  avgResponseTime: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

interface TierAnalytics {
  tier: UserTier
  totalUsers: number
  activeUsers: number
  churnRate: number
  avgUsage: number
  revenue: number
  topPermissions: {
    permission: PermissionType
    usage: number
  }[]
}

interface ViolationAlert {
  id: string
  userId: string
  userEmail: string
  permission: PermissionType
  violationType: 'unauthorized_access' | 'rate_limit_exceeded' | 'tier_mismatch'
  timestamp: Date
  severity: 'low' | 'medium' | 'high'
  resolved: boolean
}

interface UsagePattern {
  timeframe: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  peakHour: number
}

export function PermissionAnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [selectedTier, setSelectedTier] = useState<UserTier | 'all'>('all')
  
  // Mock data - in production, this would come from analytics API
  const [permissionStats, setPermissionStats] = useState<PermissionUsageStats[]>([
    {
      permission: 'access_damage_analyzer',
      name: 'Damage Analyzer',
      totalUsers: 1234,
      activeUsers: 987,
      usageCount: 15678,
      successRate: 94.2,
      avgResponseTime: 1.8,
      trend: 'up',
      trendPercentage: 12.5
    },
    {
      permission: 'access_policy_chat',
      name: 'Policy Chat',
      totalUsers: 856,
      activeUsers: 645,
      usageCount: 8934,
      successRate: 91.7,
      avgResponseTime: 2.1,
      trend: 'up',
      trendPercentage: 8.3
    },
    {
      permission: 'create_claims',
      name: 'Create Claims',
      totalUsers: 2341,
      activeUsers: 1876,
      usageCount: 4567,
      successRate: 98.9,
      avgResponseTime: 0.4,
      trend: 'stable',
      trendPercentage: 1.2
    },
    {
      permission: 'export_data',
      name: 'Export Data',
      totalUsers: 234,
      activeUsers: 189,
      usageCount: 1234,
      successRate: 89.4,
      avgResponseTime: 3.2,
      trend: 'down',
      trendPercentage: -5.8
    }
  ])

  const [tierAnalytics, setTierAnalytics] = useState<TierAnalytics[]>([
    {
      tier: 'free',
      totalUsers: 5678,
      activeUsers: 4234,
      churnRate: 15.2,
      avgUsage: 23,
      revenue: 0,
      topPermissions: [
        { permission: 'access_dashboard', usage: 4234 },
        { permission: 'create_properties', usage: 3456 },
        { permission: 'upload_documents', usage: 2345 }
      ]
    },
    {
      tier: 'essential',
      totalUsers: 1234,
      activeUsers: 1089,
      churnRate: 8.7,
      avgUsage: 156,
      revenue: 36990,
      topPermissions: [
        { permission: 'access_damage_analyzer', usage: 1089 },
        { permission: 'access_policy_chat', usage: 934 },
        { permission: 'create_claims', usage: 856 }
      ]
    },
    {
      tier: 'plus',
      totalUsers: 456,
      activeUsers: 423,
      churnRate: 4.2,
      avgUsage: 287,
      revenue: 36468,
      topPermissions: [
        { permission: 'advanced_analytics', usage: 423 },
        { permission: 'bulk_operations', usage: 389 },
        { permission: 'priority_support', usage: 376 }
      ]
    },
    {
      tier: 'pro',
      totalUsers: 89,
      activeUsers: 87,
      churnRate: 2.1,
      avgUsage: 534,
      revenue: 17763,
      topPermissions: [
        { permission: 'custom_integrations', usage: 87 },
        { permission: 'advanced_analytics', usage: 87 },
        { permission: 'bulk_operations', usage: 85 }
      ]
    }
  ])

  const [violations, setViolations] = useState<ViolationAlert[]>([
    {
      id: '1',
      userId: 'user-123',
      userEmail: 'john@example.com',
      permission: 'access_damage_analyzer',
      violationType: 'unauthorized_access',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      severity: 'high',
      resolved: false
    },
    {
      id: '2',
      userId: 'user-456',
      userEmail: 'jane@example.com',
      permission: 'export_data',
      violationType: 'rate_limit_exceeded',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      severity: 'medium',
      resolved: false
    },
    {
      id: '3',
      userId: 'user-789',
      userEmail: 'bob@example.com',
      permission: 'bulk_operations',
      violationType: 'tier_mismatch',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      severity: 'low',
      resolved: true
    }
  ])

  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([
    {
      timeframe: 'Monday',
      totalRequests: 12456,
      successfulRequests: 11734,
      failedRequests: 722,
      avgResponseTime: 1.8,
      peakHour: 14
    },
    {
      timeframe: 'Tuesday',
      totalRequests: 13678,
      successfulRequests: 12934,
      failedRequests: 744,
      avgResponseTime: 1.9,
      peakHour: 15
    },
    {
      timeframe: 'Wednesday',
      totalRequests: 15234,
      successfulRequests: 14456,
      failedRequests: 778,
      avgResponseTime: 2.1,
      peakHour: 13
    }
  ])

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [timeRange, selectedTier])

  const totalActiveUsers = tierAnalytics.reduce((sum, tier) => sum + tier.activeUsers, 0)
  const totalRevenue = tierAnalytics.reduce((sum, tier) => sum + tier.revenue, 0)
  const avgSuccessRate = permissionStats.reduce((sum, stat) => sum + stat.successRate, 0) / permissionStats.length
  const unresolvedViolations = violations.filter(v => !v.resolved).length

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case 'free': return 'border-gray-500 text-gray-500'
      case 'renter': return 'border-blue-500 text-blue-500'
      case 'essential': return 'border-green-500 text-green-500'
      case 'plus': return 'border-purple-500 text-purple-500'
      case 'pro': return 'border-yellow-500 text-yellow-500'
      default: return 'border-gray-500 text-gray-500'
    }
  }

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'border-green-500 text-green-500'
      case 'medium': return 'border-yellow-500 text-yellow-500'  
      case 'high': return 'border-red-500 text-red-500'
    }
  }

  const formatPermissionName = (permission: PermissionType) => {
    return permission
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[120px] bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTier} onValueChange={(value: any) => setSelectedTier(value)}>
            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="renter">Renter</SelectItem>
              <SelectItem value="essential">Essential</SelectItem>
              <SelectItem value="plus">Plus</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="border-gray-700">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
              <Users className="h-5 w-5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalActiveUsers.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+8.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
              <CheckCircle className="h-5 w-5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgSuccessRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+2.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Monthly Revenue</CardTitle>
              <BarChart3 className="h-5 w-5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+15.4%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Security Alerts</CardTitle>
              <AlertTriangle className="h-5 w-5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{unresolvedViolations}</div>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>Unresolved violations</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Permission Usage Stats */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Permission Usage Analytics</CardTitle>
            <CardDescription>Most used permissions and their performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Permission</TableHead>
                  <TableHead className="text-gray-400">Users</TableHead>
                  <TableHead className="text-gray-400">Usage</TableHead>
                  <TableHead className="text-gray-400">Success</TableHead>
                  <TableHead className="text-gray-400">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionStats.map((stat) => (
                  <TableRow key={stat.permission} className="border-gray-700">
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">{stat.name}</div>
                        <div className="text-xs text-gray-400">{stat.permission}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-white">{stat.activeUsers.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">of {stat.totalUsers.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">{stat.usageCount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        {stat.successRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 text-sm ${
                        stat.trend === 'up' ? 'text-green-500' : 
                        stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {stat.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : stat.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                        <span>{stat.trendPercentage > 0 ? '+' : ''}{stat.trendPercentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tier Analytics */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Tier Performance</CardTitle>
            <CardDescription>User distribution and revenue by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Tier</TableHead>
                  <TableHead className="text-gray-400">Users</TableHead>
                  <TableHead className="text-gray-400">Churn</TableHead>
                  <TableHead className="text-gray-400">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tierAnalytics.map((tier) => (
                  <TableRow key={tier.tier} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className={getTierColor(tier.tier)}>
                        {tier.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-white">{tier.activeUsers.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">of {tier.totalUsers.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${tier.churnRate > 10 ? 'text-red-500' : tier.churnRate > 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {tier.churnRate.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        {tier.revenue > 0 ? `$${tier.revenue.toLocaleString()}` : 'Free'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Security Violations */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security Violations</CardTitle>
              <CardDescription>Recent permission violations and security alerts</CardDescription>
            </div>
            <Badge variant="outline" className="border-red-500 text-red-500">
              {unresolvedViolations} Unresolved
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Permission</TableHead>
                <TableHead className="text-gray-400">Violation</TableHead>
                <TableHead className="text-gray-400">Severity</TableHead>
                <TableHead className="text-gray-400">Time</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.map((violation) => (
                <TableRow key={violation.id} className="border-gray-700">
                  <TableCell>
                    <div className="text-sm text-white">{violation.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{formatPermissionName(violation.permission)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">
                      {violation.violationType.replace('_', ' ').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(violation.severity)}>
                      {violation.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-400">
                      {violation.timestamp.toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {violation.resolved ? (
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-500">
                        Open
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage Patterns */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Usage Patterns</CardTitle>
          <CardDescription>Weekly usage trends and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {usagePatterns.map((pattern, index) => (
              <div key={index} className="p-4 bg-gray-900 rounded-lg">
                <h4 className="font-medium text-white mb-2">{pattern.timeframe}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Requests:</span>
                    <span className="text-white">{pattern.totalRequests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Success Rate:</span>
                    <span className="text-green-500">
                      {((pattern.successfulRequests / pattern.totalRequests) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Response:</span>
                    <span className="text-white">{pattern.avgResponseTime.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Peak Hour:</span>
                    <span className="text-white">{pattern.peakHour}:00</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}