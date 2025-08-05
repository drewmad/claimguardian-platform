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
import { Card } from '@claimguardian/ui'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@claimguardian/ui'
import { Plus, Settings, Users, Building, DollarSign, BarChart3, Shield, Globe } from 'lucide-react'
import { tenantManager, EnterpriseOrganization, OrganizationUser, TenantUsageInfo } from '@/lib/multi-tenant/tenant-manager'

interface MultiTenantDashboardProps {
  currentUser?: { id: string; email?: string }
}

export function MultiTenantDashboard({ currentUser }: MultiTenantDashboardProps) {
  const [organizations, setOrganizations] = useState<EnterpriseOrganization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<EnterpriseOrganization | null>(null)
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([])
  const [orgUsage, setOrgUsage] = useState<TenantUsageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'billing' | 'settings'>('overview')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      loadOrganizationDetails(selectedOrg.id)
    }
  }, [selectedOrg])

  const loadInitialData = async () => {
    try {
      // Load user's organization (for now, we'll simulate multiple orgs)
      const userOrg = currentUser?.id ? await tenantManager.getUserOrganization(currentUser.id!) : null
      if (userOrg) {
        setOrganizations([userOrg])
        setSelectedOrg(userOrg)
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizationDetails = async (orgId: string) => {
    try {
      const [users, usage] = await Promise.all([
        tenantManager.getOrganizationUsers(orgId),
        tenantManager.getOrganizationUsage(orgId)
      ])
      
      setOrgUsers(users)
      setOrgUsage(usage)
    } catch (error) {
      console.error('Failed to load organization details:', error)
    }
  }

  const getSubscriptionTierColor = (tier: string) => {
    switch (tier) {
      case 'standard': return 'bg-blue-100 text-blue-800'
      case 'professional': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-gold-100 text-gold-800'
      case 'custom': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'trial': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateUsagePercentage = (current: number, limit: number) => {
    return limit > 0 ? Math.round((current / limit) * 100) : 0
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Multi-Tenant Administration</h1>
          <p className="text-gray-400 mt-2">Manage enterprise organizations and tenants</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Organization Selection */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedOrg?.id === org.id
                    ? 'border-blue-500 bg-blue-50/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setSelectedOrg(org)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{org.organizationName}</h3>
                  <Badge className={getSubscriptionTierColor(org.subscriptionTier)}>
                    {org.subscriptionTier}
                  </Badge>
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <div>Code: {org.organizationCode}</div>
                  <div>Domain: {org.domain}</div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge className={getStatusColor(org.subscriptionStatus)}>
                      {org.subscriptionStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedOrg && (
        <>
          {/* Organization Details Header */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-2xl">
                    {selectedOrg.organizationName}
                  </CardTitle>
                  <p className="text-gray-400 mt-1">
                    {selectedOrg.organizationCode} • {selectedOrg.domain}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSubscriptionTierColor(selectedOrg.subscriptionTier)}>
                    {selectedOrg.subscriptionTier}
                  </Badge>
                  <Badge className={getStatusColor(selectedOrg.subscriptionStatus)}>
                    {selectedOrg.subscriptionStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg border border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'billing', label: 'Billing', icon: DollarSign },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'billing' | 'settings')}
                className={`flex items-center px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Usage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Users</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedOrg.currentUsers}
                        </p>
                        <p className="text-xs text-gray-500">
                          of {selectedOrg.userLimit} ({calculateUsagePercentage(selectedOrg.currentUsers, selectedOrg.userLimit)}%)
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="mt-4 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(calculateUsagePercentage(selectedOrg.currentUsers, selectedOrg.userLimit), 100)}%`
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Properties</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedOrg.currentProperties}
                        </p>
                        <p className="text-xs text-gray-500">
                          of {selectedOrg.propertyLimit} ({calculateUsagePercentage(selectedOrg.currentProperties, selectedOrg.propertyLimit)}%)
                        </p>
                      </div>
                      <Building className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="mt-4 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(calculateUsagePercentage(selectedOrg.currentProperties, selectedOrg.propertyLimit), 100)}%`
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Claims</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedOrg.currentClaims}
                        </p>
                        <p className="text-xs text-gray-500">
                          of {selectedOrg.claimLimit} ({calculateUsagePercentage(selectedOrg.currentClaims, selectedOrg.claimLimit)}%)
                        </p>
                      </div>
                      <Shield className="w-8 h-8 text-purple-500" />
                    </div>
                    <div className="mt-4 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(calculateUsagePercentage(selectedOrg.currentClaims, selectedOrg.claimLimit), 100)}%`
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">AI Requests</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedOrg.currentAiRequests.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          of {selectedOrg.aiRequestLimit.toLocaleString()} ({calculateUsagePercentage(selectedOrg.currentAiRequests, selectedOrg.aiRequestLimit)}%)
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-orange-500" />
                    </div>
                    <div className="mt-4 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(calculateUsagePercentage(selectedOrg.currentAiRequests, selectedOrg.aiRequestLimit), 100)}%`
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Geographic Coverage */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Geographic Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Primary State</p>
                      <Badge className="bg-blue-100 text-blue-800">
                        {selectedOrg.primaryState}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Allowed States ({selectedOrg.allowedStates.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrg.allowedStates.map((state) => (
                          <Badge key={state} className="bg-gray-100 text-gray-800">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance & Security */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Compliance & Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Compliance Requirements</p>
                      <div className="space-y-2">
                        {selectedOrg.complianceRequirements.length > 0 ? (
                          selectedOrg.complianceRequirements.map((req) => (
                            <Badge key={req} className="bg-green-100 text-green-800 mr-2">
                              {req}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500">None specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Security Features</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white">SSO Enabled</span>
                          <Badge className={selectedOrg.ssoEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {selectedOrg.ssoEnabled ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">2FA Required</span>
                          <Badge className={selectedOrg.require2fa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {selectedOrg.require2fa ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">Data Region</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {selectedOrg.dataRegion}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Organization Users</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orgUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">User ID: {user.userId}</p>
                        <p className="text-gray-400 text-sm">Joined: {user.joinedAt.toLocaleDateString()}</p>
                        {user.lastLoginAt && (
                          <p className="text-gray-400 text-sm">Last Login: {user.lastLoginAt.toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={
                          user.role === 'owner' ? 'bg-gold-100 text-gold-800' :
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {user.role}
                        </Badge>
                        <Badge className={
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {user.status}
                        </Badge>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && orgUsage && (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Current Billing Period</CardTitle>
                  <p className="text-gray-400">
                    {orgUsage.billingPeriodStart.toLocaleDateString()} - {orgUsage.billingPeriodEnd.toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Base Cost</p>
                      <p className="text-2xl font-bold text-white">${orgUsage.baseCost.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Overage Costs</p>
                      <p className="text-2xl font-bold text-white">
                        ${Object.values(orgUsage.overageCosts).reduce((sum, cost) => sum + cost, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Cost</p>
                      <p className="text-2xl font-bold text-white">${orgUsage.totalCost.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Invoice Status</p>
                      <Badge className={
                        orgUsage.invoiceStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        orgUsage.invoiceStatus === 'sent' ? 'bg-yellow-100 text-yellow-800' :
                        orgUsage.invoiceStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {orgUsage.invoiceStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-white font-semibold mb-4">Usage Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-gray-400 text-sm">Users</p>
                        <p className="text-xl font-bold text-white">{orgUsage.usersCount}</p>
                      </div>
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-gray-400 text-sm">Properties</p>
                        <p className="text-xl font-bold text-white">{orgUsage.propertiesCount}</p>
                      </div>
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-gray-400 text-sm">Claims</p>
                        <p className="text-xl font-bold text-white">{orgUsage.claimsCount}</p>
                      </div>
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-gray-400 text-sm">AI Requests</p>
                        <p className="text-xl font-bold text-white">{orgUsage.aiRequestsCount.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-gray-400 text-sm">Storage (GB)</p>
                        <p className="text-xl font-bold text-white">{orgUsage.storageGb.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Organization Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-semibold mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          value={selectedOrg.organizationName}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Organization Code
                        </label>
                        <input
                          type="text"
                          value={selectedOrg.organizationCode}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Primary Domain
                        </label>
                        <input
                          type="text"
                          value={selectedOrg.domain}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Primary Contact Email
                        </label>
                        <input
                          type="email"
                          value={selectedOrg.primaryContactEmail}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-4">Feature Flags</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedOrg.featureFlags).map(([feature, enabled]) => (
                        <div key={feature} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                          <span className="text-white">{feature}</span>
                          <Badge className={enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button variant="secondary">Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}