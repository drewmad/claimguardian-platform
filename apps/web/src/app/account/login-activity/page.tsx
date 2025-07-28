/**
 * @fileMetadata
 * @purpose Login activity monitoring page
 * @owner auth-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["auth", "security", "monitoring", "page"]
 * @status active
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Monitor, Globe, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { loginActivityService } from '@/lib/auth/login-activity-service'
import { logger } from '@/lib/logger'
import { formatDistanceToNow } from 'date-fns'

export default function LoginActivityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [activities, setActivities] = useState<LoginActivity[]>([])
  const [stats, setStats] = useState<LoginActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!authLoading && !user) {
        router.push('/login')
      } else if (user) {
        try {
          setLoading(true)
          const [activityData, statsData] = await Promise.all([
            loginActivityService.getUserLoginActivity(user.id),
            loginActivityService.getLoginStats(user.id)
          ])

          setActivities(activityData)
          setStats(statsData)
          logger.track('login_activity_viewed', { userId: user.id })
        } catch (err) {
          logger.error('Failed to load login activity', err)
          setError('Failed to load login activity')
        } finally {
          setLoading(false)
        }
      }
    }
    load()
  }, [user, authLoading, router])


  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return '📱'
      case 'tablet':
        return '📱'
      case 'desktop':
        return '💻'
      default:
        return '🖥️'
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold">Login Activity</h1>
              <p className="text-sm text-slate-400">
                Monitor your account access and security
              </p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-slate-400">Total Logins</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalLogins}</p>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-slate-400">Failed Attempts</span>
                </div>
                <p className="text-2xl font-bold">{stats.failedAttempts}</p>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-slate-400">Unique Devices</span>
                </div>
                <p className="text-2xl font-bold">{stats.uniqueDevices}</p>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-slate-400">Last Login</span>
                </div>
                <p className="text-sm font-medium">
                  {stats.lastLoginDate
                    ? formatDistanceToNow(new Date(stats.lastLoginDate), { addSuffix: true })
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          )}

          {stats?.suspiciousActivity && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-500 mb-1">
                    Suspicious Activity Detected
                  </h3>
                  <p className="text-sm text-yellow-400/80">
                    We've detected unusual login patterns on your account. 
                    Please review recent activity and consider changing your password.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                No login activity found
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`bg-slate-700 rounded-lg p-4 ${
                    !activity.success ? 'border border-red-500/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getDeviceIcon(activity.device_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {activity.browser || 'Unknown Browser'} on{' '}
                            {activity.os || 'Unknown OS'}
                          </p>
                          {activity.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {activity.ip_address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {!activity.success && activity.failure_reason && (
                          <p className="text-sm text-red-400 mt-1">
                            Failed: {activity.failure_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Review this page regularly to spot any unauthorized access</li>
            <li>• If you see any suspicious activity, change your password immediately</li>
            <li>• Enable two-factor authentication for additional security</li>
            <li>• Always sign out when using shared devices</li>
          </ul>
        </div>
      </div>
    </div>
  )
}