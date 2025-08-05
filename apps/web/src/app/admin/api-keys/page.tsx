/**
 * @fileMetadata
 * @purpose "Admin panel for API key management and rate limiting configuration"
 * @dependencies ["@/components","react","sonner"]
 * @owner admin-team
 * @status stable
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Key, Activity, Shield, AlertTriangle, Users, TrendingUp, Clock, Ban, Settings } from 'lucide-react'
import {
  adminListAllAPIKeys,
  adminGetAPIAnalytics,
  adminUpdateTierLimits,
  revokeAPIKey
} from '@/actions/api-keys'

interface APIKey {
  id: string
  name: string
  key_prefix: string
  permissions: string[]
  is_active: boolean
  last_used_at?: string
  usage_count: number
  created_at: string
  user_profiles: {
    email: string
    full_name: string
    tier: string
  }
}

interface APIAnalytics {
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time: number
  rate_limit_violations: number
  top_users: Array<{ user: string; requests: number }>
  top_endpoints: Array<{ endpoint: string; requests: number }>
  daily_usage: Array<{ date: string; requests: number }>
  rate_limit_violations_by_user: Array<any>
}

export default function AdminAPIKeysPage() {
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([])
  const [analytics, setAnalytics] = useState<APIAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState('30')

  // Tier limits state
  const [tierLimitsOpen, setTierLimitsOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState('free')
  const [endpointPattern, setEndpointPattern] = useState('/api/*')
  const [dailyLimit, setDailyLimit] = useState('100')
  const [hourlyLimit, setHourlyLimit] = useState('10')

  useEffect(() => {
    loadData()
  }, [selectedDays])

  const loadData = async () => {
    setLoading(true)
    try {
      const [keysResult, analyticsResult] = await Promise.all([
        adminListAllAPIKeys(),
        adminGetAPIAnalytics(parseInt(selectedDays))
      ])

      if (keysResult.error) {
        toast.error(keysResult.error)
      } else {
        setAPIKeys(keysResult.data || [])
      }

      if (analyticsResult.error) {
        toast.error(analyticsResult.error)
      } else {
        setAnalytics(analyticsResult.data)
      }
    } catch (error) {
      toast.error('Failed to load API data')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${keyName}"?`)) {
      return
    }

    try {
      const result = await revokeAPIKey(keyId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('API key revoked successfully')
        loadData()
      }
    } catch (error) {
      toast.error('Failed to revoke API key')
    }
  }

  const handleUpdateTierLimits = async () => {
    try {
      const result = await adminUpdateTierLimits(selectedTier, endpointPattern, {
        requests_per_day: parseInt(dailyLimit),
        requests_per_hour: hourlyLimit ? parseInt(hourlyLimit) : undefined
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Tier limits updated successfully')
        setTierLimitsOpen(false)
      }
    } catch (error) {
      toast.error('Failed to update tier limits')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'free': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">API Key Management</h1>
          <p className="text-gray-400 mt-2">Manage API keys, rate limits, and usage analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedDays} onValueChange={setSelectedDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={tierLimitsOpen} onOpenChange={setTierLimitsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure Limits
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Tier Limits</DialogTitle>
                <DialogDescription>
                  Set rate limits for different user tiers and endpoints
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tier</Label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Endpoint Pattern</Label>
                  <Input
                    value={endpointPattern}
                    onChange={(e) => setEndpointPattern(e.target.value)}
                    placeholder="/api/*"
                  />
                </div>
                <div>
                  <Label>Daily Limit</Label>
                  <Input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>Hourly Limit (optional)</Label>
                  <Input
                    type="number"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <Button onClick={handleUpdateTierLimits} className="w-full">
                  Update Limits
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Requests</p>
                  <p className="text-2xl font-bold text-white">{analytics.total_requests.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {analytics.total_requests > 0 
                      ? Math.round((analytics.successful_requests / analytics.total_requests) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Avg Response Time</p>
                  <p className="text-2xl font-bold text-white">{Math.round(analytics.avg_response_time)}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Rate Limit Violations</p>
                  <p className="text-2xl font-bold text-white">{analytics.rate_limit_violations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="violations">Rate Limits</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Key className="h-5 w-5 mr-2" />
                API Keys ({apiKeys.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Tier</TableHead>
                    <TableHead className="text-gray-300">Prefix</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Usage</TableHead>
                    <TableHead className="text-gray-300">Last Used</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium text-white">{key.name}</TableCell>
                      <TableCell className="text-gray-300">
                        <div>
                          <div className="font-medium">{key.user_profiles.full_name}</div>
                          <div className="text-sm text-gray-400">{key.user_profiles.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierBadgeColor(key.user_profiles.tier)}>
                          {key.user_profiles.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono">{key.key_prefix}...</TableCell>
                      <TableCell>
                        <Badge variant={key.is_active ? "default" : "secondary"}>
                          {key.is_active ? "Active" : "Revoked"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{key.usage_count.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-300">
                        {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                      </TableCell>
                      <TableCell>
                        {key.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeKey(key.id, key.name)}
                            className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Users */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Top Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.top_users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="text-white font-medium">{user.user}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{user.requests} requests</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Endpoints */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Top Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.top_endpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="text-white font-mono text-sm">{endpoint.endpoint}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{endpoint.requests} requests</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rate Limit Violations Tab */}
        <TabsContent value="violations">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Rate Limit Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.rate_limit_violations_by_user.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No rate limit violations in the selected period</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">Endpoint</TableHead>
                      <TableHead className="text-gray-300">Violations</TableHead>
                      <TableHead className="text-gray-300">Last Violation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics?.rate_limit_violations_by_user.map((violation, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{violation.user_profiles.full_name}</div>
                            <div className="text-sm text-gray-400">{violation.user_profiles.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 font-mono">{violation.endpoint}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{violation.limit_exceeded_count}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{formatDate(violation.updated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
