/**
 * @fileMetadata
 * @purpose Session expiry warning modal
 * @owner auth-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["SessionWarningModal"]
 * @complexity low
 * @tags ["modal", "auth", "session"]
 * @status active
 */
'use client'

import { useState, useEffect } from 'react'
import { Clock, RefreshCw } from 'lucide-react'
import { sessionManager } from '@/lib/auth/session-manager'
import { logger } from '@/lib/logger'

interface SessionWarningModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SessionWarningModal({ isOpen, onClose }: SessionWarningModalProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const updateTimer = async () => {
      const seconds = await sessionManager.getTimeUntilExpiry()
      if (seconds !== null) {
        setTimeRemaining(Math.max(0, Math.floor(seconds)))
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await sessionManager.forceRefresh()
      logger.track('session_manually_refreshed')
      onClose()
    } catch (err) {
      logger.error('Failed to refresh session manually', err)
    } finally {
      setRefreshing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative bg-slate-800 rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Session Expiring Soon</h2>
          
          <p className="text-slate-400 mb-6">
            Your session will expire in{' '}
            <span className="font-bold text-yellow-500">{formatTime(timeRemaining)}</span>
          </p>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-400">
              Click &quot;Refresh Session&quot; to continue working without interruption.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 btn-primary py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh Session
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 btn-secondary py-3"
              disabled={refreshing}
            >
              Ignore
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}