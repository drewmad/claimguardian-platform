/**
 * Admin AI Cost Settings Component
 * Configure pricing, budgets, and cost controls
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DollarSign,
  Settings,
  Users,
  Zap,
  AlertCircle,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react'

interface AIToolPricing {
  id: string
  name: string
  displayName: string
  provider: string
  modelName: string
  costPerInputToken: number
  costPerOutputToken: number
  costPerImage?: number
  costPerMinute?: number
  supportsImages: boolean
  supportsAudio: boolean
  isActive: boolean
}

interface BudgetTemplate {
  id: string
  name: string
  tier: string
  monthlyBudget: number
  dailyRequestLimit: number
  monthlyRequestLimit: number
  alertThresholds: number[]
  autoDisable: boolean
}

export function AICostSettings() {
  const [tools, setTools] = useState<AIToolPricing[]>([])
  const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTool, setEditingTool] = useState<string | null>(null)
  const [newTool, setNewTool] = useState<Partial<AIToolPricing>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const [toolsResponse, budgetsResponse] = await Promise.all([
        fetch('/api/admin/ai-costs/tools'),
        fetch('/api/admin/ai-costs/budget-templates')
      ])

      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json()
        setTools(toolsData.tools || [])
      }

      if (budgetsResponse.ok) {
        const budgetsData = await budgetsResponse.json()
        setBudgetTemplates(budgetsData.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTool = async (tool: AIToolPricing) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/ai-costs/tools/${tool.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tool)
      })

      if (response.ok) {
        await fetchSettings()
        setEditingTool(null)
      } else {
        console.error('Failed to save tool')
      }
    } catch (error) {
      console.error('Error saving tool:', error)
    } finally {
      setSaving(false)
    }
  }

  const createTool = async () => {
    if (!newTool.name || !newTool.displayName || !newTool.provider) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/ai-costs/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTool,
          costPerInputToken: newTool.costPerInputToken || 0,
          costPerOutputToken: newTool.costPerOutputToken || 0,
          costPerImage: newTool.costPerImage || 0,
          costPerMinute: newTool.costPerMinute || 0,
          supportsImages: newTool.supportsImages || false,
          supportsAudio: newTool.supportsAudio || false,
          isActive: true
        })
      })

      if (response.ok) {
        await fetchSettings()
        setNewTool({})
      } else {
        console.error('Failed to create tool')
      }
    } catch (error) {
      console.error('Error creating tool:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this AI tool? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/ai-costs/tools/${toolId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSettings()
      } else {
        console.error('Failed to delete tool')
      }
    } catch (error) {
      console.error('Error deleting tool:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatCost = (cost: number) => `$${cost.toFixed(8)}`
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-800/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-800/50 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-800/50 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Cost Settings</h1>
          <p className="text-gray-400">Configure pricing models, budgets, and cost controls</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchSettings}
          className="flex items-center gap-2"
          disabled={saving}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="tools" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            AI Tools Pricing
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Templates
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Cost Controls
          </TabsTrigger>
        </TabsList>

        {/* AI Tools Pricing */}
        <TabsContent value="tools" className="space-y-6">
          {/* Add New Tool */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New AI Tool
              </CardTitle>
              <CardDescription>
                Configure pricing for a new AI model or tool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newToolName">Tool Name</Label>
                  <Input
                    id="newToolName"
                    placeholder="e.g., damage-analyzer"
                    value={newTool.name || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newToolDisplayName">Display Name</Label>
                  <Input
                    id="newToolDisplayName"
                    placeholder="e.g., Damage Analyzer"
                    value={newTool.displayName || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, displayName: e.target.value }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newToolProvider">Provider</Label>
                  <Input
                    id="newToolProvider"
                    placeholder="e.g., openai, gemini"
                    value={newTool.provider || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, provider: e.target.value }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newToolModel">Model Name</Label>
                  <Input
                    id="newToolModel"
                    placeholder="e.g., gpt-4o, gemini-pro"
                    value={newTool.modelName || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, modelName: e.target.value }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newToolInputCost">Cost per Input Token</Label>
                  <Input
                    id="newToolInputCost"
                    type="number"
                    step="0.00000001"
                    placeholder="0.0000025"
                    value={newTool.costPerInputToken || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, costPerInputToken: parseFloat(e.target.value) }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newToolOutputCost">Cost per Output Token</Label>
                  <Input
                    id="newToolOutputCost"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00001"
                    value={newTool.costPerOutputToken || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, costPerOutputToken: parseFloat(e.target.value) }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newToolImageCost">Cost per Image (optional)</Label>
                  <Input
                    id="newToolImageCost"
                    type="number"
                    step="0.0001"
                    placeholder="0.00765"
                    value={newTool.costPerImage || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, costPerImage: parseFloat(e.target.value) }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newToolAudioCost">Cost per Minute Audio (optional)</Label>
                  <Input
                    id="newToolAudioCost"
                    type="number"
                    step="0.0001"
                    placeholder="0.006"
                    value={newTool.costPerMinute || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, costPerMinute: parseFloat(e.target.value) }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="newToolSupportsImages"
                    checked={newTool.supportsImages || false}
                    onCheckedChange={(checked) => setNewTool(prev => ({ ...prev, supportsImages: checked }))}
                  />
                  <Label htmlFor="newToolSupportsImages" className="text-gray-300">
                    Supports Images
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="newToolSupportsAudio"
                    checked={newTool.supportsAudio || false}
                    onCheckedChange={(checked) => setNewTool(prev => ({ ...prev, supportsAudio: checked }))}
                  />
                  <Label htmlFor="newToolSupportsAudio" className="text-gray-300">
                    Supports Audio
                  </Label>
                </div>
              </div>

              <Button
                onClick={createTool}
                disabled={saving || !newTool.name || !newTool.displayName}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Tool
              </Button>
            </CardContent>
          </Card>

          {/* Existing Tools */}
          <div className="space-y-4">
            {tools.map(tool => (
              <Card key={tool.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-white">{tool.displayName}</CardTitle>
                      <Badge variant={tool.isActive ? 'default' : 'outline'}>
                        {tool.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{tool.provider}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTool(editingTool === tool.id ? null : tool.id)}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-3 w-3" />
                        {editingTool === tool.id ? 'Cancel' : 'Edit'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTool(tool.id)}
                        className="flex items-center gap-2 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {tool.name} • {tool.modelName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {editingTool === tool.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Display Name</Label>
                          <Input
                            value={tool.displayName}
                            onChange={(e) => {
                              const updated = tools.map(t =>
                                t.id === tool.id ? { ...t, displayName: e.target.value } : t
                              )
                              setTools(updated)
                            }}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Model Name</Label>
                          <Input
                            value={tool.modelName}
                            onChange={(e) => {
                              const updated = tools.map(t =>
                                t.id === tool.id ? { ...t, modelName: e.target.value } : t
                              )
                              setTools(updated)
                            }}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cost per Input Token</Label>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={tool.costPerInputToken}
                            onChange={(e) => {
                              const updated = tools.map(t =>
                                t.id === tool.id ? { ...t, costPerInputToken: parseFloat(e.target.value) } : t
                              )
                              setTools(updated)
                            }}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cost per Output Token</Label>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={tool.costPerOutputToken}
                            onChange={(e) => {
                              const updated = tools.map(t =>
                                t.id === tool.id ? { ...t, costPerOutputToken: parseFloat(e.target.value) } : t
                              )
                              setTools(updated)
                            }}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={tool.isActive}
                            onCheckedChange={(checked) => {
                              const updated = tools.map(t =>
                                t.id === tool.id ? { ...t, isActive: checked } : t
                              )
                              setTools(updated)
                            }}
                          />
                          <Label className="text-gray-300">Active</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={tool.supportsImages}
                            onCheckedChange={(checked) => {
                              const updated = tools.map(t =>
                                t.id === tool.id ? { ...t, supportsImages: checked } : t
                              )
                              setTools(updated)
                            }}
                          />
                          <Label className="text-gray-300">Images</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={tool.supportsAudio}
                            onCheckedChange={(checked) => {
                              const updated = tools.map(t =>
                                t.id === tool.id ? { ...t, supportsAudio: checked } : t
                              )
                              setTools(updated)
                            }}
                          />
                          <Label className="text-gray-300">Audio</Label>
                        </div>
                      </div>

                      <Button
                        onClick={() => saveTool(tool)}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-400 text-sm">Input Tokens</div>
                        <div className="text-white font-medium">
                          {formatCost(tool.costPerInputToken)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Output Tokens</div>
                        <div className="text-white font-medium">
                          {formatCost(tool.costPerOutputToken)}
                        </div>
                      </div>
                      {tool.supportsImages && (
                        <div>
                          <div className="text-gray-400 text-sm">Images</div>
                          <div className="text-white font-medium">
                            {formatCurrency(tool.costPerImage || 0)}
                          </div>
                        </div>
                      )}
                      {tool.supportsAudio && (
                        <div>
                          <div className="text-gray-400 text-sm">Audio/Min</div>
                          <div className="text-white font-medium">
                            {formatCurrency(tool.costPerMinute || 0)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Budget Templates */}
        <TabsContent value="budgets" className="space-y-6">
          <Alert className="border-blue-500 bg-blue-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Budget templates define default spending limits and alerts for different subscription tiers.
              These are applied to new users automatically.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {['free', 'pro', 'enterprise'].map(tier => (
              <Card key={tier} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white capitalize flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {tier} Tier
                  </CardTitle>
                  <CardDescription>
                    Budget template for {tier} users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monthly Budget</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="25.00"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Daily Request Limit</Label>
                    <Input
                      type="number"
                      placeholder="500"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Monthly Request Limit</Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Alert Thresholds (%)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="50"
                        className="bg-gray-700 border-gray-600"
                      />
                      <Input
                        type="number"
                        placeholder="80"
                        className="bg-gray-700 border-gray-600"
                      />
                      <Input
                        type="number"
                        placeholder="95"
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id={`autoDisable-${tier}`} />
                    <Label htmlFor={`autoDisable-${tier}`} className="text-gray-300">
                      Auto-disable on budget limit
                    </Label>
                  </div>

                  <Button className="w-full" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cost Controls */}
        <TabsContent value="controls" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Global Settings
                </CardTitle>
                <CardDescription>
                  Platform-wide cost control settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Enable Budget Enforcement</Label>
                    <p className="text-sm text-gray-400">
                      Block requests when user budget is exceeded
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Real-time Cost Tracking</Label>
                    <p className="text-sm text-gray-400">
                      Track costs in real-time for all requests
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Automatic Alerts</Label>
                    <p className="text-sm text-gray-400">
                      Send budget alerts to users and admins
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Default Monthly Budget (Free Users)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue="5.00"
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost Anomaly Detection Threshold</Label>
                  <Input
                    type="number"
                    step="0.1"
                    defaultValue="2.0"
                    className="bg-gray-700 border-gray-600"
                  />
                  <p className="text-xs text-gray-400">
                    Standard deviations from normal usage patterns
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Alert Configuration
                </CardTitle>
                <CardDescription>
                  Configure when and how alerts are sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Admin Email for Critical Alerts</Label>
                  <Input
                    type="email"
                    placeholder="admin@claimguardian.ai"
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alert Cooldown Period (minutes)</Label>
                  <Input
                    type="number"
                    defaultValue="60"
                    className="bg-gray-700 border-gray-600"
                  />
                  <p className="text-xs text-gray-400">
                    Minimum time between duplicate alerts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Webhook URL (optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://hooks.slack.com/..."
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alert Template</Label>
                  <Textarea
                    placeholder="Alert: {user} has exceeded {percentage}% of their budget ({current_spend}/{budget_amount})"
                    className="bg-gray-700 border-gray-600"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Include Cost Breakdown</Label>
                    <p className="text-sm text-gray-400">
                      Include per-tool cost breakdown in alerts
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save All Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AICostSettings
