/**
 * @fileMetadata
 * @owner admin-team
 * @purpose "Admin panel for managing subscription tier permissions"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Shield, ChevronRight, Save, Loader2, Check, X,
  Home, Brain, FileText, File, ChartBar, Settings,
  Plus, Trash2, Edit2, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getAllPermissions,
  getAllTiers,
  getTierPermissions,
  updateTierPermissions,
  updateTier
} from '@/actions/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Permission, SubscriptionTier, TierPermission } from '@/types/permissions'

// Category icons
const CATEGORY_ICONS: Record<string, any> = {
  properties: Home,
  ai_tools: Brain,
  claims: FileText,
  documents: File,
  reports: ChartBar,
  features: Settings
}

export default function PermissionsManagementPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [tierPermissions, setTierPermissions] = useState<Record<string, boolean>>({})
  const [permissionLimits, setPermissionLimits] = useState<Record<string, number | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingTier, setEditingTier] = useState<string | null>(null)
  const [tierPrices, setTierPrices] = useState<Record<string, { monthly: number, yearly: number }>>({})

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [permissionsResult, tiersResult] = await Promise.all([
        getAllPermissions(),
        getAllTiers()
      ])

      if (permissionsResult.data) {
        setPermissions(permissionsResult.data)
      }

      if (tiersResult.data) {
        setTiers(tiersResult.data)
        // Set initial prices
        const prices: Record<string, { monthly: number, yearly: number }> = {}
        tiersResult.data.forEach((tier: SubscriptionTier) => {
          prices[tier.id] = {
            monthly: tier.price_monthly / 100, // Convert from cents
            yearly: tier.price_yearly / 100
          }
        })
        setTierPrices(prices)

        // Select first tier by default
        if (tiersResult.data.length > 0) {
          setSelectedTier(tiersResult.data[0].id)
          await loadTierPermissions(tiersResult.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load permissions data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTierPermissions = async (tierId: string) => {
    try {
      const result = await getTierPermissions(tierId)

      if (result.data) {
        const permissionsMap: Record<string, boolean> = {}
        const limitsMap: Record<string, number | null> = {}

        result.data.forEach((tp: any) => {
          if (tp.permission) {
            permissionsMap[tp.permission.id] = true
            limitsMap[tp.permission.id] = tp.limit_value
          }
        })

        setTierPermissions(permissionsMap)
        setPermissionLimits(limitsMap)
      }
    } catch (error) {
      console.error('Error loading tier permissions:', error)
      toast.error('Failed to load tier permissions')
    }
  }

  const handleTierSelect = async (tierId: string) => {
    setSelectedTier(tierId)
    await loadTierPermissions(tierId)
  }

  const handlePermissionToggle = (permissionId: string) => {
    setTierPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }))
  }

  const handleLimitChange = (permissionId: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value)
    setPermissionLimits(prev => ({
      ...prev,
      [permissionId]: numValue
    }))
  }

  const handleSavePermissions = async () => {
    if (!selectedTier) return

    setIsSaving(true)
    try {
      const permissionsToSave = Object.entries(tierPermissions)
        .filter(([_, enabled]) => enabled)
        .map(([permissionId]) => ({
          permission_id: permissionId,
          limit_value: permissionLimits[permissionId] || null
        }))

      const result = await updateTierPermissions(selectedTier, permissionsToSave)

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success('Permissions updated successfully')
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast.error('Failed to save permissions')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTierPrice = async (tierId: string) => {
    const prices = tierPrices[tierId]
    if (!prices) return

    setIsSaving(true)
    try {
      const result = await updateTier(tierId, {
        price_monthly: Math.round(prices.monthly * 100), // Convert to cents
        price_yearly: Math.round(prices.yearly * 100)
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success('Tier prices updated successfully')
      setEditingTier(null)
      await loadData() // Reload to get updated data
    } catch (error) {
      console.error('Error updating tier price:', error)
      toast.error('Failed to update tier prices')
    } finally {
      setIsSaving(false)
    }
  }

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Permissions Management</h1>
          <p className="text-gray-400">Configure permissions for each subscription tier</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tier Selection */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Subscription Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tiers.map(tier => (
                  <div key={tier.id}>
                    <button
                      onClick={() => handleTierSelect(tier.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedTier === tier.id
                          ? 'bg-cyan-600/20 border border-cyan-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{tier.display_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {editingTier === tier.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={tierPrices[tier.id]?.monthly || 0}
                                  onChange={(e) => setTierPrices(prev => ({
                                    ...prev,
                                    [tier.id]: {
                                      ...prev[tier.id],
                                      monthly: parseFloat(e.target.value) || 0
                                    }
                                  }))}
                                  className="w-20 h-6 text-xs bg-gray-900 border-gray-600 text-white"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-xs text-gray-400">/mo</span>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">
                                ${tier.price_monthly / 100}/mo
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingTier === tier.id ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateTierPrice(tier.id)
                                }}
                                className="p-1 text-green-400 hover:text-green-300"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingTier(null)
                                }}
                                className="p-1 text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingTier(tier.id)
                              }}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {selectedTier === tier.id && (
                            <ChevronRight className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Permissions Configuration */}
          <div className="lg:col-span-3">
            {selectedTier ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">
                        {tiers.find(t => t.id === selectedTier)?.display_name} Permissions
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        Select which features and tools are available for this tier
                      </p>
                    </div>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={isSaving}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                    const Icon = CATEGORY_ICONS[category] || Shield

                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {category.replace('_', ' ')}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryPermissions.map(permission => (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Switch
                                  checked={tierPermissions[permission.id] || false}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">
                                    {permission.description || permission.name}
                                  </p>
                                  {permission.resource && (
                                    <p className="text-xs text-gray-400">
                                      {permission.resource.replace('_', ' ')} - {permission.action}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Limit input for certain permissions */}
                              {tierPermissions[permission.id] &&
                               (permission.name.includes('properties') ||
                                permission.name.includes('claims')) &&
                               permission.action === 'create' && (
                                <div className="flex items-center gap-2 ml-3">
                                  <Label className="text-xs text-gray-400">Limit:</Label>
                                  <Input
                                    type="number"
                                    value={permissionLimits[permission.id] || ''}
                                    onChange={(e) => handleLimitChange(permission.id, e.target.value)}
                                    placeholder="∞"
                                    className="w-16 h-8 text-xs bg-gray-800 border-gray-600 text-white"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Select a tier to configure permissions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
