/**
 * @fileMetadata
 * @purpose "User profile management page"
 * @owner auth-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["profile", "settings", "account", "page"]
 * @status stable
 */
'use client'

import {
  User, Shield, Mail, Save, Trash2,
  AlertCircle, CheckCircle, Lock, Activity, Key
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { profileService } from '@/lib/auth/profile-service'
import { logger } from '@/lib/logger'
import { useModalStore } from '@/stores/modal-store'


type ActiveTab = 'profile' | 'security' | 'email' | 'danger'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { openModal } = useModalStore()
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Profile form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Email change form state
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  useEffect(() => {
    const load = async () => {
      if (!authLoading && !user) {
        router.push('/login')
      } else if (user) {
        try {
          setLoading(true)
          const data = await profileService.getProfile(user.id)

          if (data) {
            setProfile(data)
            setFirstName(data.firstName || '')
            setLastName(data.lastName || '')
            setPhone(data.phone || '')
          }
        } catch (err) {
          logger.error('Failed to load profile', { userId: user.id }, err instanceof Error ? err : new Error(String(err)))
          showMessage('error', 'Failed to load profile')
        } finally {
          setLoading(false)
        }
      }
    }
    load()
  }, [user, authLoading, router])


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const success = await profileService.updateProfile(user.id, {
        firstName,
        lastName,
        phone
      })

      if (success) {
        showMessage('success', 'Profile updated successfully')
        // Reload profile
        const data = await profileService.getProfile(user.id)
        if (data) {
          setProfile(data)
          setFirstName(data.firstName || '')
          setLastName(data.lastName || '')
          setPhone(data.phone || '')
        }
      } else {
        showMessage('error', 'Failed to update profile')
      }
    } catch (err) {
      logger.error('Failed to update profile', { userId: user.id }, err instanceof Error ? err : new Error(String(err)))
      showMessage('error', 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const result = await profileService.requestEmailChange(user.id, {
        newEmail,
        password: emailPassword
      })

      if (result.success) {
        showMessage('success', 'Email change requested. Please check your new email for verification.')
        setNewEmail('')
        setEmailPassword('')
      } else {
        showMessage('error', result.error || 'Failed to change email')
      }
    } catch (err) {
      logger.error('Failed to change email', { userId: user.id }, err instanceof Error ? err : new Error(String(err)))
      showMessage('error', 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      showMessage('error', "Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      const result = await profileService.updatePassword(currentPassword, newPassword)

      if (result.success) {
        showMessage('success', 'Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showMessage('error', result.error || 'Failed to update password')
      }
    } catch (err) {
      logger.error('Failed to update password', { userId: user?.id }, err instanceof Error ? err : new Error(String(err)))
      showMessage('error', 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !confirmDelete) return

    setSaving(true)
    try {
      const result = await profileService.deleteAccount(user.id, deletePassword)

      if (result.success) {
        logger.track('account_deleted', { userId: user.id })
        router.push('/')
      } else {
        showMessage('error', result.error || 'Failed to delete account')
      }
    } catch (err) {
      logger.error('Failed to delete account', { userId: user.id }, err instanceof Error ? err : new Error(String(err)))
      showMessage('error', "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg shadow-xl">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your profile and account preferences
            </p>
          </div>

          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'security'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'email'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'danger'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Danger Zone
            </button>
          </div>

          <div className="p-6">
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    To change your email, use the Email tab
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>

                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={8}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Security Options</h3>

                  <div className="space-y-4">
                    <button
                      onClick={() => openModal('securityQuestions')}
                      className="w-full text-left p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Security Questions</p>
                            <p className="text-sm text-slate-400">
                              Set up security questions for account recovery
                            </p>
                          </div>
                        </div>
                        <Shield className="w-5 h-5 text-slate-400" />
                      </div>
                    </button>

                    <Link
                      href="/account/login-activity"
                      className="block w-full text-left p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="font-medium">Login Activity</p>
                            <p className="text-sm text-slate-400">
                              View recent login attempts and devices
                            </p>
                          </div>
                        </div>
                        <Activity className="w-5 h-5 text-slate-400" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <form onSubmit={handleEmailChange} className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Change Email Address</h3>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-400">
                    Changing your email will require verification. You'll receive a confirmation link at your new email address.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Current Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {saving ? 'Updating...' : 'Update Email'}
                </button>
              </form>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-500 mb-4">Delete Account</h3>

                  <p className="text-sm text-slate-300 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>

                  <form onSubmit={handleDeleteAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Enter your password to confirm
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 border border-red-500/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.checked)}
                        className="w-4 h-4 bg-slate-700 border border-slate-600 rounded text-red-500"
                      />
                      <span className="text-sm text-slate-300">
                        I understand that deleting my account is permanent and cannot be undone
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={saving || !confirmDelete}
                      className="btn-primary bg-red-600 hover:bg-red-700 inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {saving ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
