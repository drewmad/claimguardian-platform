'use client'

import { useState, useEffect } from 'react'
import { X, User, Shield, Bell, Palette, Globe, Key, Save, Trash2, AlertCircle, CheckCircle, Moon, Sun, Monitor, Volume2, VolumeX, Mail, Phone, Lock, Eye, EyeOff, Smartphone, Settings as SettingsIcon, Wrench, FileText } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { profileService, UserProfile } from '@/lib/auth/profile-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: SettingsTab
}

type SettingsTab = 'profile' | 'preferences' | 'notifications' | 'security' | 'privacy' | 'warranty'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  twoFactorEnabled: boolean
  analyticsEnabled: boolean
  dataSharingEnabled: boolean
  marketingEnabled: boolean
}

export function SettingsModal({ isOpen, onClose, defaultTab = 'profile' }: SettingsModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
  // Profile form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [xHandle, setXHandle] = useState('')
  const [isXConnected, setIsXConnected] = useState(false)
  
  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    twoFactorEnabled: false,
    analyticsEnabled: true,
    dataSharingEnabled: false,
    marketingEnabled: true,
  })
  
  // Security state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'warranty', label: 'Warranty Center', icon: Wrench },
  ] as const

  // Load profile data
  useEffect(() => {
    if (isOpen && user) {
      loadProfile()
    }
  }, [isOpen, user])

  // Update active tab when defaultTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  const loadProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = await profileService.getProfile(user.id)
      if (data) {
        setProfile(data)
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setPhone(data.phone || '')
        setXHandle(data.xHandle || '')
        setIsXConnected(data.isXConnected || false)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const success = await profileService.updateProfile(user.id, {
        firstName,
        lastName,
        phone,
        xHandle
      })

      if (success) {
        toast.success('Profile updated successfully')
        await loadProfile() // Reload to get fresh data
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('An error occurred while updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      const result = await profileService.updatePassword(currentPassword, newPassword)

      if (result.success) {
        toast.success('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(result.error || 'Failed to update password')
      }
    } catch (error) {
      console.error('Failed to update password:', error)
      toast.error('An error occurred while updating password')
    } finally {
      setSaving(false)
    }
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: unknown) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    // Auto-save preferences
    toast.success(`${key} updated`)
  }

  const handleXConnect = async () => {
    if (isXConnected) {
      // Disconnect X account
      setIsXConnected(false)
      setXHandle('')
      toast.success('X account disconnected')
    } else {
      // In a real implementation, this would redirect to X OAuth
      // For now, we'll simulate the connection
      const handle = prompt('Enter your X handle (without @):')
      if (handle) {
        setXHandle(handle)
        setIsXConnected(true)
        toast.success('X account connected successfully')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <SettingsIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <p className="text-sm text-gray-400">Manage your account and preferences</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-88px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Profile Information</h3>
                    <p className="text-sm text-gray-400 mb-6">Update your personal information and profile details.</p>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={profile?.email || user?.email || ''}
                          disabled
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email changes require verification</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Social Media</label>
                        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-black rounded-lg">
                                <X className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-white">X (Twitter)</p>
                                <p className="text-sm text-gray-400">
                                  {isXConnected ? `Connected as @${xHandle}` : 'Connect your X account'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isXConnected && (
                                <Badge variant="default" className="bg-green-600">
                                  Connected
                                </Badge>
                              )}
                              <Button
                                type="button"
                                onClick={handleXConnect}
                                variant={isXConnected ? "destructive" : "outline"}
                                size="sm"
                                className={isXConnected ? "" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
                              >
                                {isXConnected ? 'Disconnect' : 'Connect'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Preferences</h3>
                    <p className="text-sm text-gray-400 mb-6">Customize your experience and interface settings.</p>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Appearance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'light', label: 'Light', icon: Sun },
                            { value: 'dark', label: 'Dark', icon: Moon },
                            { value: 'system', label: 'System', icon: Monitor },
                          ].map(({ value, label, icon: Icon }) => (
                            <button
                              key={value}
                              onClick={() => handlePreferenceChange('theme', value)}
                              className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                                preferences.theme === value
                                  ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                                  : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-sm font-medium">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                        <select
                          value={preferences.language}
                          onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                        <select
                          value={preferences.timezone}
                          onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                        >
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Audio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {preferences.soundEnabled ? (
                            <Volume2 className="h-5 w-5 text-green-400" />
                          ) : (
                            <VolumeX className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-white">Sound Effects</p>
                            <p className="text-sm text-gray-400">Play sounds for notifications and interactions</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('soundEnabled', !preferences.soundEnabled)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            preferences.soundEnabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Notification Settings</h3>
                    <p className="text-sm text-gray-400 mb-6">Choose what notifications you want to receive.</p>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="font-medium text-white">Email Notifications</p>
                            <p className="text-sm text-gray-400">Receive updates via email</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('emailNotifications', !preferences.emailNotifications)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            preferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="font-medium text-white">Push Notifications</p>
                            <p className="text-sm text-gray-400">Receive push notifications in your browser</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('pushNotifications', !preferences.pushNotifications)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            preferences.pushNotifications ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.pushNotifications ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Security Settings</h3>
                    <p className="text-sm text-gray-400 mb-6">Manage your account security and authentication.</p>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Change Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                              required
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                              required
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          {saving ? 'Updating...' : 'Update Password'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Key className="h-5 w-5 text-yellow-400" />
                          <div>
                            <p className="font-medium text-white">2FA Protection</p>
                            <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                          </div>
                          <Badge variant={preferences.twoFactorEnabled ? 'default' : 'secondary'}>
                            {preferences.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => handlePreferenceChange('twoFactorEnabled', !preferences.twoFactorEnabled)}
                          variant={preferences.twoFactorEnabled ? 'destructive' : 'default'}
                          size="sm"
                        >
                          {preferences.twoFactorEnabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Privacy Settings</h3>
                    <p className="text-sm text-gray-400 mb-6">Control your privacy and data sharing preferences.</p>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Data Collection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="font-medium text-white">Analytics & Usage Data</p>
                            <p className="text-sm text-gray-400">Help us improve ClaimGuardian with anonymous usage data</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('analyticsEnabled', !preferences.analyticsEnabled)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            preferences.analyticsEnabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.analyticsEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="font-medium text-white">Data Sharing with Partners</p>
                            <p className="text-sm text-gray-400">Share anonymized data with insurance partners for better rates</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('dataSharingEnabled', !preferences.dataSharingEnabled)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            preferences.dataSharingEnabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.dataSharingEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-purple-400" />
                          <div>
                            <p className="font-medium text-white">Marketing Communications</p>
                            <p className="text-sm text-gray-400">Receive updates about new features and services</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('marketingEnabled', !preferences.marketingEnabled)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            preferences.marketingEnabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.marketingEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Data & Privacy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                        <div className="flex gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-yellow-200 mb-1">Privacy Notice</p>
                            <p className="text-sm text-yellow-300">
                              Your data is protected and only used to provide ClaimGuardian services. 
                              We never sell your personal information to third parties.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                          <Shield className="h-4 w-4 mr-2" />
                          Download My Data
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete My Data
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                          <Eye className="h-4 w-4 mr-2" />
                          Privacy Policy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'warranty' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Warranty Center</h3>
                    <p className="text-sm text-gray-400 mb-6">Manage your warranty registrations and coverage information.</p>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Active Warranties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                        <div className="flex gap-3">
                          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-green-200 mb-1">HVAC System</p>
                            <p className="text-sm text-green-300">
                              Warranty active until: December 15, 2026
                            </p>
                            <p className="text-xs text-green-400 mt-1">
                              Provider: Carrier Corporation
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <div className="flex gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-200 mb-1">Water Heater</p>
                            <p className="text-sm text-blue-300">
                              Warranty active until: March 22, 2025
                            </p>
                            <p className="text-xs text-blue-400 mt-1">
                              Provider: Rheem Manufacturing
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Register New Warranty</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Product Type</label>
                        <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white">
                          <option value="">Select product type</option>
                          <option value="hvac">HVAC System</option>
                          <option value="appliance">Appliance</option>
                          <option value="roofing">Roofing</option>
                          <option value="electrical">Electrical</option>
                          <option value="plumbing">Plumbing</option>
                          <option value="flooring">Flooring</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Serial Number</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                          placeholder="Enter serial number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Warranty Document</label>
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                          <input type="file" className="hidden" id="warranty-upload" accept=".pdf,.jpg,.png" />
                          <label htmlFor="warranty-upload" className="cursor-pointer">
                            <div className="text-gray-400">
                              <p className="text-sm">Click to upload warranty document</p>
                              <p className="text-xs mt-1">PDF, JPG, PNG up to 10MB</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="h-4 w-4 mr-2" />
                        Register Warranty
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Warranty Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Wrench className="h-4 w-4 mr-2" />
                        Submit Warranty Claim
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                        <FileText className="h-4 w-4 mr-2" />
                        View Coverage Details
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}