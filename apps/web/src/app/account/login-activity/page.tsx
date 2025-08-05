/**
 * @fileMetadata
 * @purpose "Login activity monitoring page"
 * @owner auth-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["auth", "security", "monitoring", "page"]
 * @status stable
 */
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { loginActivityService } from '@/lib/auth/login-activity-service'
import { logger } from '@/lib/logger'


export default function LoginActivityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
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
          logger.error('Failed to load login activity', { userId: user.id }, err instanceof Error ? err : new Error(String(err)))
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
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Login Activity</h1>
        {error && (
          <div className="bg-red-800 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-gray-400">Login activity tracking is temporarily disabled.</p>
        </div>
      </div>
    </div>
  )
}