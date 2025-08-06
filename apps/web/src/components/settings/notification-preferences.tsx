/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "User notification preferences with smart timing configuration"
 * @dependencies ["@claimguardian/ui", "react", "lucide-react"]
 * @status stable
 * @ai-integration smart-notification-engine
 * @insurance-context user-preferences
 */

'use client'

import { useState, useEffect } from 'react'
import { Mail, Smartphone, Bell, Clock, Volume2, VolumeX, Settings, Save, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NotificationPreferences {
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  timezone: string
  frequencyLimit: number
  categories: {
    deadlines: boolean
    reminders: boolean
    achievements: boolean
    communityUpdates: boolean
    workflowUpdates: boolean
    settlementOffers: boolean
  }
}

interface NotificationPreferencesProps {
  userId: string
  initialPreferences?: Partial<NotificationPreferences>
  onSave?: (preferences: NotificationPreferences) => Promise<void>
}

const defaultPreferences: NotificationPreferences = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  inAppEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  timezone: 'America/New_York',
  frequencyLimit: 10,
  categories: {
    deadlines: true,
    reminders: true,
    achievements: true,
    communityUpdates: false,
    workflowUpdates: true,
    settlementOffers: true
  }
}

const timezones = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu'
]

const categoryDescriptions = {
  deadlines: 'Important deadlines for your claims',
  reminders: 'Evidence collection and task reminders',
  achievements: 'Achievement unlocks and progress updates',
  communityUpdates: 'Community insights and pattern alerts',
  workflowUpdates: 'Automated workflow progress notifications',
  settlementOffers: 'Settlement offer alerts and recommendations'
}

export function NotificationPreferences({ 
  userId, 
  initialPreferences, 
  onSave 
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...defaultPreferences,
    ...initialPreferences
  })
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [testingChannel, setTestingChannel] = useState<string | null>(null)

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateCategory = (category: keyof NotificationPreferences['categories'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: enabled
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!onSave || !hasChanges) return
    
    setIsSaving(true)
    try {
      await onSave(preferences)
      setHasChanges(false)
      toast.success('Notification preferences saved successfully')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const testNotification = async (channel: string) => {
    setTestingChannel(channel)
    try {
      // This would call the smart notification engine with a test notification
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          channel,
          message: `Test notification via ${channel}`
        })
      })
      toast.success(`Test ${channel} notification sent!`)
    } catch (error) {
      toast.error(`Failed to send test ${channel} notification`)
    } finally {
      setTestingChannel(null)
    }
  }

  const enabledChannels = [
    preferences.emailEnabled && 'email',
    preferences.smsEnabled && 'sms', 
    preferences.pushEnabled && 'push',
    preferences.inAppEnabled && 'in-app'
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
          <p className="text-gray-400 mt-1">
            Control how and when you receive notifications from ClaimGuardian
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-gray-400 border-gray-600">
            {enabledChannels.length} channel{enabledChannels.length !== 1 ? 's' : ''} active
          </Badge>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Notification Channels */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className={cn(
                "h-5 w-5",
                preferences.emailEnabled ? "text-blue-400" : "text-gray-500"
              )} />
              <div>
                <Label className="text-white font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-400">
                  Detailed updates and summaries sent to your email
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
              />
              {preferences.emailEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification('email')}
                  disabled={testingChannel === 'email'}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                >
                  {testingChannel === 'email' ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* SMS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className={cn(
                "h-5 w-5",
                preferences.smsEnabled ? "text-green-400" : "text-gray-500"
              )} />
              <div>
                <Label className="text-white font-medium">SMS/Text Messages</Label>
                <p className="text-sm text-gray-400">
                  High-priority alerts sent via text message
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={preferences.smsEnabled}
                onCheckedChange={(checked) => updatePreference('smsEnabled', checked)}
              />
              {preferences.smsEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification('sms')}
                  disabled={testingChannel === 'sms'}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                >
                  {testingChannel === 'sms' ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className={cn(
                "h-5 w-5",
                preferences.pushEnabled ? "text-purple-400" : "text-gray-500"
              )} />
              <div>
                <Label className="text-white font-medium">Push Notifications</Label>
                <p className="text-sm text-gray-400">
                  Real-time alerts on your device
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={preferences.pushEnabled}
                onCheckedChange={(checked) => updatePreference('pushEnabled', checked)}
              />
              {preferences.pushEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification('push')}
                  disabled={testingChannel === 'push'}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                >
                  {testingChannel === 'push' ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* In-App Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className={cn(
                "h-5 w-5",
                preferences.inAppEnabled ? "text-orange-400" : "text-gray-500"
              )} />
              <div>
                <Label className="text-white font-medium">In-App Notifications</Label>
                <p className="text-sm text-gray-400">
                  Notifications while using ClaimGuardian
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.inAppEnabled}
              onCheckedChange={(checked) => updatePreference('inAppEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timing & Frequency */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing & Frequency
          </CardTitle>
          <CardDescription>
            Control when and how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiet Hours */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Quiet Hours</Label>
            <p className="text-sm text-gray-400">
              No notifications will be sent during these hours
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-gray-400 text-sm">From</Label>
                <Select
                  value={preferences.quietHoursStart}
                  onValueChange={(value) => updatePreference('quietHoursStart', value)}
                >
                  <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`} className="text-white">
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-gray-400 text-sm">To</Label>
                <Select
                  value={preferences.quietHoursEnd}
                  onValueChange={(value) => updatePreference('quietHoursEnd', value)}
                >
                  <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`} className="text-white">
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Timezone */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Timezone</Label>
            <Select
              value={preferences.timezone}
              onValueChange={(value) => updatePreference('timezone', value)}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-white">
                    {tz.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-gray-700" />

          {/* Frequency Limit */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Daily Notification Limit</Label>
            <p className="text-sm text-gray-400">
              Maximum notifications per day: {preferences.frequencyLimit}
            </p>
            <Slider
              value={[preferences.frequencyLimit]}
              onValueChange={([value]) => updatePreference('frequencyLimit', value)}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Notification Categories</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(preferences.categories).map(([category, enabled]) => (
            <div key={category} className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <p className="text-sm text-gray-400">
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => updateCategory(category as keyof NotificationPreferences['categories'], checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Smart Optimization */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Smart Optimization
          </CardTitle>
          <CardDescription>
            AI learns your engagement patterns to optimize notification timing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-medium">Enable Smart Timing</Label>
              <p className="text-sm text-gray-400 mt-1">
                AI analyzes when you typically respond to notifications and optimizes delivery timing
              </p>
            </div>
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
              Always On
            </Badge>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
          <p className="text-sm text-yellow-300">
            You have unsaved changes. Don't forget to save your preferences!
          </p>
        </div>
      )}
    </div>
  )
}