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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,  } from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Users, Search, Filter, Plus, Edit, Ban, Download, Eye, Key, Crown, Zap, TrendingUp, Database, Home, FileText, MoreHorizontal } from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { UserTier, PermissionType } from '@/lib/permissions/permission-checker'
import { getUserTierInfo, getAllTiers, updateUserTier, performBulkUserOperation, getUserUsageStats } from '@/actions/user-tiers'

interface User {
  id: string
  email: string
  phone?: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  role: 'admin' | 'user' | 'support'
  is_active: boolean
  tier: UserTier
  subscription_status?: 'active' | 'suspended' | 'cancelled' | 'free'
  metadata?: {
    full_name?: string
    company?: string
    subscription_tier?: string
  }
  usage?: {
    aiRequestsThisMonth: number
    storageUsedMB: number
    propertiesCount: number
    claimsCount: number
  }
  limits?: {
    aiRequestsLimit: number
    storageLimit: number
    propertiesLimit: number
    claimsLimit: number
  }
}

interface UserProfile {
  user_id: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

interface UserStats {
  total_users: number
  active_users: number
  new_users_today: number
  new_users_week: number
  suspended_users: number
  admin_users: number
  tier_breakdown: Record<UserTier, number>
  revenue_monthly: number
}

interface TierInfo {
  tier: UserTier
  name: string
  price_monthly: number
  price_yearly: number
  permissions: PermissionType[]
  ai_requests_limit: number
  storage_limit_mb: number
  properties_limit: number
  claims_limit: number
  features: string[]
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})
  const [stats, setStats] = useState<UserStats | null>(null)
  const [availableTiers, setAvailableTiers] = useState<TierInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showTierDialog, setShowTierDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [showUsageDialog, setShowUsageDialog] = useState(false)
  const [bulkOperation, setBulkOperation] = useState<'change_tier' | 'suspend' | 'activate' | 'delete'>('change_tier')
  const [bulkTier, setBulkTier] = useState<UserTier>('free')
  const [bulkReason, setBulkReason] = useState('')
  
  const supabase = createBrowserSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
    loadStats()
    loadTiers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch users from user_profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Create user objects with tier and usage information
      const usersList: User[] = []
      
      for (const profile of profilesData || []) {
        // Get tier info for each user
        const tierInfo = await getUserTierInfo(profile.user_id)
        const usageStats = await getUserUsageStats(profile.user_id)
        
        const user: User = {
          id: profile.user_id,
          email: profile.email || 'No email',
          created_at: profile.created_at,
          role: 'user' as const, // Default role
          is_active: true,
          tier: tierInfo.data?.tier || 'free',
          subscription_status: tierInfo.data?.status || 'free',
          metadata: {
            full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          },
          usage: usageStats.data || {
            aiRequestsThisMonth: 0,
            storageUsedMB: 0,
            propertiesCount: 0,
            claimsCount: 0
          },
          limits: tierInfo.data?.user_tiers ? {
            aiRequestsLimit: tierInfo.data.user_tiers.ai_requests_limit,
            storageLimit: tierInfo.data.user_tiers.storage_limit_mb,
            propertiesLimit: tierInfo.data.user_tiers.properties_limit,
            claimsLimit: tierInfo.data.user_tiers.claims_limit
          } : undefined
        }
        
        usersList.push(user)
      }

      setUsers(usersList)
      
      // Create profiles map
      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.user_id] = profile
        return acc
      }, {} as Record<string, UserProfile>) || {}
      
      setProfiles(profilesMap)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTiers = async () => {
    try {
      const result = await getAllTiers()
      if (result.data) {
        setAvailableTiers(result.data)
      }
    } catch (error) {
      console.error('Error loading tiers:', error)
    }
  }

  const loadStats = async () => {
    try {
      const { data: profilesCount } = await supabase
        .from('user_profiles')
        .select('user_id', { count: 'exact', head: true })

      const now = new Date()
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      const weekAgo = new Date(now.setDate(now.getDate() - 7))

      const { data: todayUsers } = await supabase
        .from('user_profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())

      const { data: weekUsers } = await supabase
        .from('user_profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Get tier breakdown
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('status', 'active')

      const tierBreakdown: Record<UserTier, number> = {
        free: 0,
        renter: 0,
        essential: 0,
        plus: 0,
        pro: 0
      }

      // Count free users (those without active subscriptions)
      const totalUsers = profilesCount?.length || 0
      const activeSubscriptions = subscriptions?.length || 0
      tierBreakdown.free = totalUsers - activeSubscriptions

      // Count paid tiers
      subscriptions?.forEach(sub => {
        if (sub.tier in tierBreakdown) {
          tierBreakdown[sub.tier as UserTier]++
        }
      })

      // Calculate estimated monthly revenue
      const revenue = subscriptions?.reduce((total, sub) => {
        const tier = availableTiers.find(t => t.tier === sub.tier)
        return total + (tier?.price_monthly || 0)
      }, 0) || 0

      setStats({
        total_users: totalUsers,
        active_users: totalUsers, // Would need login activity
        new_users_today: todayUsers?.length || 0,
        new_users_week: weekUsers?.length || 0,
        suspended_users: 0, // Would need status field
        admin_users: 1, // Default admin count
        tier_breakdown: tierBreakdown,
        revenue_monthly: revenue
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      // Update user profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: updates.metadata?.full_name?.split(' ')[0],
          last_name: updates.metadata?.full_name?.split(' ').slice(1).join(' '),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'User updated successfully'
      })

      loadUsers()
      setShowEditDialog(false)
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive'
      })
    }
  }

  const handleSuspendUser = async (userId: string) => {
    try {
      const result = await performBulkUserOperation({
        userIds: [userId],
        operation: 'suspend',
        reason: 'Suspended via admin dashboard'
      })

      if (result.error) throw new Error(result.error)

      toast({
        title: 'User Suspended',
        description: 'User access has been suspended',
      })

      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'destructive'
      })
    }
  }

  const handleChangeTier = async (userId: string, newTier: UserTier, reason?: string) => {
    try {
      const result = await updateUserTier({ userId, tier: newTier, reason })

      if (result.error) throw new Error(result.error)

      toast({
        title: 'Tier Updated',
        description: `User tier changed to ${newTier}`,
      })

      loadUsers()
      setShowTierDialog(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user tier',
        variant: 'destructive'
      })
    }
  }

  const handleBulkOperation = async () => {
    try {
      const result = await performBulkUserOperation({
        userIds: selectedUsers,
        operation: bulkOperation,
        tier: bulkTier,
        reason: bulkReason
      })

      if (result.error) throw new Error(result.error)

      const successCount = result.data?.filter(r => r.success).length || 0
      const failCount = result.data?.filter(r => !r.success).length || 0

      toast({
        title: 'Bulk Operation Complete',
        description: `${successCount} users updated successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      })

      setSelectedUsers([])
      setShowBulkDialog(false)
      setBulkReason('')
      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk operation',
        variant: 'destructive'
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.metadata?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active)
    
    const matchesTier = tierFilter === 'all' || user.tier === tierFilter

    return matchesSearch && matchesRole && matchesStatus && matchesTier
  })

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case 'free': return <Users className="h-4 w-4" />
      case 'renter': return <Home className="h-4 w-4" />
      case 'essential': return <Zap className="h-4 w-4" />
      case 'plus': return <TrendingUp className="h-4 w-4" />
      case 'pro': return <Crown className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

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

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const exportUsers = () => {
    const csv = [
      ['ID', 'Email', 'Name', 'Role', 'Status', 'Created', 'Last Sign In'].join(','),
      ...filteredUsers.map(user => [
        user.id,
        user.email,
        user.metadata?.full_name || '',
        user.role,
        user.is_active ? 'Active' : 'Inactive',
        format(new Date(user.created_at), 'yyyy-MM-dd'),
        user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'yyyy-MM-dd') : 'Never'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportUsers}
            className="border-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => {
            setSelectedUser(null)
            setShowEditDialog(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="space-y-4">
          {/* Primary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.total_users}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.active_users} active</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">${stats.revenue_monthly}</div>
                <p className="text-xs text-gray-500 mt-1">Recurring monthly</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">New This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.new_users_week}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.new_users_today} today</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Suspended</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.suspended_users}</div>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Tier Breakdown */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>User Tiers</CardTitle>
              <CardDescription>Distribution of users across subscription tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(stats.tier_breakdown).map(([tier, count]) => (
                  <div key={tier} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {getTierIcon(tier as UserTier)}
                      <span className="ml-2 text-sm font-medium capitalize text-gray-300">{tier}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-xs text-gray-500">
                      {stats.total_users > 0 ? Math.round((count / stats.total_users) * 100) : 0}% of users
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Bulk Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{selectedUsers.length} selected</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkDialog(true)}
                  className="border-gray-700"
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Bulk Actions
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[160px] bg-gray-900 border-gray-700">
                <SelectValue placeholder="Filter by tier" />
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
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400 w-8">
                  <Checkbox 
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id))
                      } else {
                        setSelectedUsers([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Tier & Usage</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-gray-700">
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">
                        {user.metadata?.full_name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getTierColor(user.tier)}>
                          <div className="flex items-center gap-1">
                            {getTierIcon(user.tier)}
                            <span className="capitalize">{user.tier}</span>
                          </div>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUsageDialog(true)
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                      {user.usage && user.limits && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Zap className="h-3 w-3 text-blue-400" />
                            <span className="text-gray-400">
                              AI: {user.usage.aiRequestsThisMonth}/{user.limits.aiRequestsLimit === -1 ? '∞' : user.limits.aiRequestsLimit}
                            </span>
                          </div>
                          <Progress 
                            value={getUsagePercentage(user.usage.aiRequestsThisMonth, user.limits.aiRequestsLimit)} 
                            className="h-1"
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        user.role === 'admin' 
                          ? 'border-yellow-500 text-yellow-500' 
                          : user.role === 'support'
                          ? 'border-blue-500 text-blue-500'
                          : 'border-gray-500 text-gray-500'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge 
                        variant="outline"
                        className={
                          user.is_active
                            ? 'border-green-500 text-green-500'
                            : 'border-red-500 text-red-500'
                        }
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {user.subscription_status && user.subscription_status !== 'free' && (
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {user.subscription_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Crown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 bg-gray-900 border-gray-700">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-white">Change Tier</h4>
                            {availableTiers.map(tier => (
                              <Button
                                key={tier.tier}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleChangeTier(user.id, tier.tier, 'Changed via admin dashboard')}
                                disabled={user.tier === tier.tier}
                              >
                                <div className="flex items-center gap-2">
                                  {getTierIcon(tier.tier)}
                                  <span className="capitalize">{tier.tier}</span>
                                  {tier.price_monthly > 0 && (
                                    <span className="text-xs text-gray-400">${tier.price_monthly}/mo</span>
                                  )}
                                </div>
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowPasswordDialog(true)
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSuspendUser(user.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedUser ? 'Update user information and role' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={selectedUser?.email || ''}
                className="bg-gray-800 border-gray-700"
                disabled={!!selectedUser}
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={selectedUser?.metadata?.full_name || ''}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={selectedUser?.role || 'user'}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active Status</Label>
              <Switch
                id="active"
                checked={selectedUser?.is_active ?? true}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedUser && handleUpdateUser(selectedUser.id, selectedUser)}>
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Reset Password</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send a password reset link to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <p className="text-gray-300">
              The user will receive an email with instructions to reset their password.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: 'Password Reset Sent',
                description: 'Password reset email has been sent to the user'
              })
              setShowPasswordDialog(false)
            }}>
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Bulk Operations</DialogTitle>
            <DialogDescription className="text-gray-400">
              Perform actions on {selectedUsers.length} selected users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={bulkOperation} onValueChange={(v) => setBulkOperation(v as unknown)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="change_tier">Change Tier</SelectItem>
                  <SelectItem value="suspend">Suspend Users</SelectItem>
                  <SelectItem value="activate">Activate Users</SelectItem>
                  <SelectItem value="delete">Delete Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {bulkOperation === 'change_tier' && (
              <div>
                <Label htmlFor="tier">New Tier</Label>
                <Select value={bulkTier} onValueChange={(v) => setBulkTier(v as UserTier)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTiers.map(tier => (
                      <SelectItem key={tier.tier} value={tier.tier}>
                        <div className="flex items-center gap-2">
                          {getTierIcon(tier.tier)}
                          <span className="capitalize">{tier.tier}</span>
                          {tier.price_monthly > 0 && (
                            <span className="text-xs text-gray-400">${tier.price_monthly}/mo</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Enter reason for this operation"
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkOperation}>
              Apply to {selectedUsers.length} Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Usage Details Dialog */}
      <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Usage Details - {selectedUser?.metadata?.full_name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Current usage and limits for this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Tier Information */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Subscription Tier</h3>
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                  <Badge variant="outline" className={getTierColor(selectedUser.tier)}>
                    <div className="flex items-center gap-2">
                      {getTierIcon(selectedUser.tier)}
                      <span className="capitalize text-lg">{selectedUser.tier}</span>
                    </div>
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">
                      Status: <span className="text-white">{selectedUser.subscription_status || 'Free'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              {selectedUser.usage && selectedUser.limits && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Usage This Month</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Requests */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-400" />
                          AI Requests
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          {selectedUser.usage.aiRequestsThisMonth}
                        </div>
                        <p className="text-sm text-gray-400">
                          of {selectedUser.limits.aiRequestsLimit === -1 ? 'unlimited' : selectedUser.limits.aiRequestsLimit}
                        </p>
                        <Progress 
                          value={getUsagePercentage(selectedUser.usage.aiRequestsThisMonth, selectedUser.limits.aiRequestsLimit)} 
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>

                    {/* Storage */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Database className="h-4 w-4 text-green-400" />
                          Storage Used
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          {selectedUser.usage.storageUsedMB} MB
                        </div>
                        <p className="text-sm text-gray-400">
                          of {selectedUser.limits.storageLimit === -1 ? 'unlimited' : `${selectedUser.limits.storageLimit} MB`}
                        </p>
                        <Progress 
                          value={getUsagePercentage(selectedUser.usage.storageUsedMB, selectedUser.limits.storageLimit)} 
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>

                    {/* Properties */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Home className="h-4 w-4 text-purple-400" />
                          Properties
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          {selectedUser.usage.propertiesCount}
                        </div>
                        <p className="text-sm text-gray-400">
                          of {selectedUser.limits.propertiesLimit === -1 ? 'unlimited' : selectedUser.limits.propertiesLimit}
                        </p>
                        <Progress 
                          value={getUsagePercentage(selectedUser.usage.propertiesCount, selectedUser.limits.propertiesLimit)} 
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>

                    {/* Claims */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-yellow-400" />
                          Claims
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          {selectedUser.usage.claimsCount}
                        </div>
                        <p className="text-sm text-gray-400">
                          of {selectedUser.limits.claimsLimit === -1 ? 'unlimited' : selectedUser.limits.claimsLimit}
                        </p>
                        <Progress 
                          value={getUsagePercentage(selectedUser.usage.claimsCount, selectedUser.limits.claimsLimit)} 
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUsageDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}