/**
 * @fileMetadata
 * @purpose "Permission Management interface for configuring tier permissions and system access"
 * @dependencies ["@/components","@/hooks","@/lib","react"]
 * @owner admin-team
 * @status stable
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Shield, Users, Lock, Edit, Save, RefreshCw, Plus, Trash2, Zap, Home, Crown, TrendingUp, AlertTriangle, CheckCircle, X, Search, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { UserTier, PermissionType } from '@/lib/permissions/permission-checker'
import { getAllTiers, createPermissionOverride, updateTierPermissions, getPermissionOverrides, deletePermissionOverride, getUserByEmail } from '@/actions/user-tiers'
import { PermissionAnalyticsDashboard } from './permission-analytics-dashboard'

interface TierPermissionMatrix {
  tier: UserTier
  name: string
  price_monthly: number
  permissions: PermissionType[]
  ai_requests_limit: number
  storage_limit_mb: number
  properties_limit: number
  claims_limit: number
  features: string[]
}

interface PermissionGroup {
  category: string
  description: string
  permissions: {
    type: PermissionType
    name: string
    description: string
    risk_level: 'low' | 'medium' | 'high'
    requires_subscription: boolean
  }[]
}

interface PermissionOverride {
  id: string
  user_id: string
  user_email: string
  permission_type: PermissionType
  granted: boolean
  reason: string
  expires_at?: string
  created_at: string
}

export function PermissionsManagement() {
  const [tiers, setTiers] = useState<TierPermissionMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<UserTier>('free')
  const [editingTier, setEditingTier] = useState<UserTier | null>(null)
  const [permissionOverrides, setPermissionOverrides] = useState<PermissionOverride[]>([])
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [newOverride, setNewOverride] = useState({
    userEmail: '',
    permission: '',
    access: '',
    reason: '',
    expiresAt: ''
  })
  
  const { toast } = useToast()

  // Permission groups with detailed information
  const permissionGroups: PermissionGroup[] = [
    {
      category: 'Dashboard Access',
      description: 'Basic platform access and navigation',
      permissions: [
        {
          type: 'access_dashboard',
          name: 'Access Dashboard',
          description: 'Can access the main dashboard',
          risk_level: 'low',
          requires_subscription: false
        }
      ]
    },
    {
      category: 'AI Tools',
      description: 'AI-powered analysis and assistance tools',
      permissions: [
        {
          type: 'access_damage_analyzer',
          name: 'Damage Analyzer',
          description: 'AI-powered damage assessment from photos',
          risk_level: 'medium',
          requires_subscription: true
        },
        {
          type: 'access_policy_chat',
          name: 'Policy Chat',
          description: 'Interactive chat with insurance policies',
          risk_level: 'medium',
          requires_subscription: true
        },
        {
          type: 'access_inventory_scanner',
          name: 'Inventory Scanner',
          description: 'AI-powered inventory cataloging',
          risk_level: 'low',
          requires_subscription: false
        },
        {
          type: 'access_claim_assistant',
          name: 'Claim Assistant',
          description: 'Step-by-step claim guidance',
          risk_level: 'medium',
          requires_subscription: true
        },
        {
          type: 'access_document_generator',
          name: 'Document Generator',
          description: 'Generate claim documents automatically',
          risk_level: 'high',
          requires_subscription: true
        },
        {
          type: 'access_communication_helper',
          name: 'Communication Helper',
          description: 'Professional correspondence assistance',
          risk_level: 'medium',
          requires_subscription: true
        },
        {
          type: 'access_settlement_analyzer',
          name: 'Settlement Analyzer',
          description: 'Analyze settlement offers for fairness',
          risk_level: 'high',
          requires_subscription: true
        },
        {
          type: 'access_evidence_organizer',
          name: 'Evidence Organizer',
          description: 'Organize and categorize claim evidence',
          risk_level: 'medium',
          requires_subscription: true
        },
        {
          type: 'access_3d_model_generator',
          name: '3D Model Generator',
          description: 'Generate 3D models from photos',
          risk_level: 'medium',
          requires_subscription: true
        },
        {
          type: 'access_ar_damage_documenter',
          name: 'AR Damage Documenter',
          description: 'AR-enhanced damage documentation',
          risk_level: 'high',
          requires_subscription: true
        },
        {
          type: 'access_receipt_scanner',
          name: 'Receipt Scanner',
          description: 'OCR-powered receipt processing',
          risk_level: 'low',
          requires_subscription: false
        },
        {
          type: 'access_proactive_optimizer',
          name: 'Proactive Claim Optimizer',
          description: 'Predictive claim optimization',
          risk_level: 'high',
          requires_subscription: true
        }
      ]
    },
    {
      category: 'Data Management',
      description: 'Creating and managing user data',
      permissions: [
        {
          type: 'create_properties',
          name: 'Create Properties',
          description: 'Add new properties to account',
          risk_level: 'low',
          requires_subscription: false
        },
        {
          type: 'create_claims',
          name: 'Create Claims',
          description: 'Submit new insurance claims',
          risk_level: 'medium',
          requires_subscription: false
        },
        {
          type: 'upload_documents',
          name: 'Upload Documents',
          description: 'Upload policy and claim documents',
          risk_level: 'low',
          requires_subscription: false
        },
        {
          type: 'export_data',
          name: 'Export Data',
          description: 'Export user data and reports',
          risk_level: 'medium',
          requires_subscription: true
        }
      ]
    },
    {
      category: 'Advanced Features',
      description: 'Premium platform capabilities',
      permissions: [
        {
          type: 'bulk_operations',
          name: 'Bulk Operations',
          description: 'Perform batch operations on data',
          risk_level: 'high',
          requires_subscription: true
        },
        {
          type: 'advanced_analytics',
          name: 'Advanced Analytics',
          description: 'Access detailed analytics and insights',
          risk_level: 'medium',
          requires_subscription: true
        },
        {
          type: 'priority_support',
          name: 'Priority Support',
          description: 'Access to priority customer support',
          risk_level: 'low',
          requires_subscription: true
        },
        {
          type: 'custom_integrations',
          name: 'Custom Integrations',
          description: 'API access and custom integrations',
          risk_level: 'high',
          requires_subscription: true
        }
      ]
    }
  ]

  useEffect(() => {
    loadTiers()
    loadPermissionOverrides()
  }, [])

  const loadTiers = async () => {
    try {
      setLoading(true)
      const result = await getAllTiers()
      if (result.data) {
        setTiers(result.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tier information',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPermissionOverrides = async () => {
    try {
      const result = await getPermissionOverrides()
      if (result.data) {
        setPermissionOverrides(result.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load permission overrides',
        variant: 'destructive'
      })
    }
  }

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

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'border-green-500 text-green-500'
      case 'medium': return 'border-yellow-500 text-yellow-500'
      case 'high': return 'border-red-500 text-red-500'
    }
  }

  const togglePermissionForTier = (tier: UserTier, permission: PermissionType) => {
    setTiers(prevTiers => 
      prevTiers.map(t => {
        if (t.tier === tier) {
          const hasPermission = t.permissions.includes(permission)
          return {
            ...t,
            permissions: hasPermission 
              ? t.permissions.filter(p => p !== permission)
              : [...t.permissions, permission]
          }
        }
        return t
      })
    )
    setUnsavedChanges(true)
  }

  const saveTierPermissions = async () => {
    try {
      const tierPermissionsData = tiers.map(tier => ({
        tier: tier.tier,
        permissions: tier.permissions
      }))

      const result = await updateTierPermissions(tierPermissionsData)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: 'Tier permissions updated successfully'
      })
      setUnsavedChanges(false)
      setEditingTier(null)
      
      // Reload tiers to reflect changes
      await loadTiers()
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update tier permissions: ${(error as Error).message}`,
        variant: 'destructive'
      })
    }
  }

  const handleDeleteOverride = async (overrideId: string) => {
    try {
      const result = await deletePermissionOverride(overrideId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: 'Permission override deleted successfully'
      })
      
      // Reload permission overrides
      await loadPermissionOverrides()
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete permission override: ${(error as Error).message}`,
        variant: 'destructive'
      })
    }
  }

  const handleCreateOverride = async () => {
    try {
      if (!newOverride.userEmail || !newOverride.permission || !newOverride.access) {
        throw new Error('Please fill in all required fields')
      }

      // Get user ID from email
      const userResult = await getUserByEmail(newOverride.userEmail)
      if (userResult.error || !userResult.data) {
        throw new Error(`User with email "${newOverride.userEmail}" not found`)
      }

      const result = await createPermissionOverride(
        userResult.data.id,
        newOverride.permission as PermissionType,
        newOverride.access === 'grant',
        newOverride.reason,
        newOverride.expiresAt || undefined
      )
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: 'Permission override created successfully'
      })
      
      setShowOverrideDialog(false)
      setNewOverride({
        userEmail: '',
        permission: '',
        access: '',
        reason: '',
        expiresAt: ''
      })
      
      // Reload permission overrides
      await loadPermissionOverrides()
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create permission override: ${(error as Error).message}`,
        variant: 'destructive'
      })
    }
  }

  const selectedTierData = tiers.find(t => t.tier === selectedTier)
  const allPermissions = permissionGroups.flatMap(group => group.permissions)
  
  const filteredPermissions = allPermissions.filter(permission => {
    const matchesSearch = 
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRisk = filterRisk === 'all' || permission.risk_level === filterRisk
    
    return matchesSearch && matchesRisk
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Permission Management</h1>
          <p className="text-gray-400 mt-1">Configure tier permissions and access control</p>
        </div>
        <div className="flex gap-2">
          {unsavedChanges && (
            <Button onClick={saveTierPermissions} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
          <Button variant="outline" onClick={loadTiers} className="border-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {unsavedChanges && (
        <Card className="bg-yellow-900/20 border-yellow-600/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-yellow-200">You have unsaved changes. Don't forget to save!</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="overrides">User Overrides</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          {/* Tier Selection */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Subscription Tiers</CardTitle>
              <CardDescription>Select a tier to configure its permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.tier}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTier === tier.tier 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedTier(tier.tier)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getTierIcon(tier.tier)}
                      <span className="font-medium capitalize text-white">{tier.tier}</span>
                      {editingTier === tier.tier && (
                        <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">
                          Editing
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{tier.name}</p>
                    <p className="text-xs text-gray-500">
                      {tier.price_monthly > 0 ? `$${tier.price_monthly}/mo` : 'Free'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tier.permissions.length} permissions
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permission Configuration Matrix */}
          {selectedTierData && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTierIcon(selectedTierData.tier)}
                      <span className="capitalize">{selectedTierData.tier} Tier Permissions</span>
                    </CardTitle>
                    <CardDescription>
                      Configure which features this tier can access
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={editingTier === selectedTierData.tier ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEditingTier(editingTier === selectedTierData.tier ? null : selectedTierData.tier)}
                      className="border-gray-700"
                    >
                      {editingTier === selectedTierData.tier ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Lock Editing
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Permissions
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {permissionGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <h3 className="text-lg font-medium text-white mb-3">{group.category}</h3>
                      <p className="text-sm text-gray-400 mb-4">{group.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.permissions.map((permission) => {
                          const hasPermission = selectedTierData.permissions.includes(permission.type)
                          const canEdit = editingTier === selectedTierData.tier
                          
                          return (
                            <div
                              key={permission.type}
                              className={`p-3 rounded-lg border transition-all ${
                                hasPermission 
                                  ? 'border-green-600 bg-green-600/10' 
                                  : 'border-gray-700 bg-gray-800/50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-white">
                                      {permission.name}
                                    </span>
                                    <Badge variant="outline" className={getRiskColor(permission.risk_level)}>
                                      {permission.risk_level}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-400">{permission.description}</p>
                                  {permission.requires_subscription && (
                                    <Badge variant="outline" className="text-xs mt-1 border-purple-500 text-purple-500">
                                      Premium
                                    </Badge>
                                  )}
                                </div>
                                <Switch
                                  checked={hasPermission}
                                  onCheckedChange={() => canEdit && togglePermissionForTier(selectedTierData.tier, permission.type)}
                                  disabled={!canEdit}
                                  className="ml-2"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {/* Search and Filter */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Permission Details</CardTitle>
              <CardDescription>Detailed view of all permissions and their configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-900 border-gray-700"
                    />
                  </div>
                </div>
                <Select value={filterRisk} onValueChange={setFilterRisk}>
                  <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Permission</TableHead>
                    <TableHead className="text-gray-400">Risk Level</TableHead>
                    <TableHead className="text-gray-400">Premium</TableHead>
                    <TableHead className="text-gray-400">Free</TableHead>
                    <TableHead className="text-gray-400">Renter</TableHead>
                    <TableHead className="text-gray-400">Essential</TableHead>
                    <TableHead className="text-gray-400">Plus</TableHead>
                    <TableHead className="text-gray-400">Pro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission) => (
                    <TableRow key={permission.type} className="border-gray-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{permission.name}</div>
                          <div className="text-sm text-gray-400">{permission.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRiskColor(permission.risk_level)}>
                          {permission.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {permission.requires_subscription ? (
                          <CheckCircle className="h-4 w-4 text-purple-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-500" />
                        )}
                      </TableCell>
                      {tiers.map(tier => (
                        <TableCell key={tier.tier}>
                          {tier.permissions.includes(permission.type) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-gray-500" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Permission Overrides</CardTitle>
                  <CardDescription>Manage custom permission overrides for specific users</CardDescription>
                </div>
                <Button onClick={() => setShowOverrideDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Override
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {permissionOverrides.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No permission overrides configured</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Override permissions for specific users when needed
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">User</TableHead>
                      <TableHead className="text-gray-400">Permission</TableHead>
                      <TableHead className="text-gray-400">Access</TableHead>
                      <TableHead className="text-gray-400">Reason</TableHead>
                      <TableHead className="text-gray-400">Expires</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionOverrides.map((override) => (
                      <TableRow key={override.id} className="border-gray-700">
                        <TableCell>
                          <div className="text-white">{override.user_email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-500 text-blue-500">
                            {override.permission_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {override.granted ? (
                            <Badge variant="outline" className="border-green-500 text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Granted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-500">
                              <X className="h-3 w-3 mr-1" />
                              Denied
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-400">{override.reason}</TableCell>
                        <TableCell className="text-gray-400">
                          {override.expires_at ? new Date(override.expires_at).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteOverride(override.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PermissionAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Permission Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Permission Override</DialogTitle>
            <DialogDescription className="text-gray-400">
              Grant or deny specific permissions for individual users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">User Email</Label>
              <Input
                id="user"
                placeholder="user@example.com"
                className="bg-gray-800 border-gray-700"
                value={newOverride.userEmail}
                onChange={(e) => setNewOverride(prev => ({ ...prev, userEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="permission">Permission</Label>
              <Select value={newOverride.permission} onValueChange={(value) => setNewOverride(prev => ({ ...prev, permission: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  {allPermissions.map(permission => (
                    <SelectItem key={permission.type} value={permission.type}>
                      {permission.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="access">Access</Label>
              <Select value={newOverride.access} onValueChange={(value) => setNewOverride(prev => ({ ...prev, access: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Grant or deny access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Grant Access</SelectItem>
                  <SelectItem value="deny">Deny Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Reason for this override"
                className="bg-gray-800 border-gray-700"
                value={newOverride.reason}
                onChange={(e) => setNewOverride(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="expires">Expires At (Optional)</Label>
              <Input
                id="expires"
                type="datetime-local"
                className="bg-gray-800 border-gray-700"
                value={newOverride.expiresAt}
                onChange={(e) => setNewOverride(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOverride}>Add Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}