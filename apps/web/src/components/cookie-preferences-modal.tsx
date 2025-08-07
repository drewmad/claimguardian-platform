/**
 * @fileMetadata
 * @purpose "Cookie preferences modal for granular consent control"
 * @dependencies ["@/lib","lucide-react","react"]
 * @owner compliance-team
 * @status stable
 */
'use client'

import { X } from 'lucide-react'
import { useState } from 'react'

import { logger } from '@/lib/logger'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

interface CookiePreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (preferences: CookiePreferences) => void
}

export function CookiePreferencesModal({
  isOpen,
  onClose,
  onSave
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    functional: false
  })

  if (!isOpen) return null

  const handleSave = () => {
    logger.track('cookie_preferences_saved', { ...preferences })
    onSave(preferences)
    onClose()
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    logger.track('cookie_preferences_accept_all')
    onSave(allAccepted)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Cookie Preferences</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <p className="text-slate-300">
            We use cookies to enhance your browsing experience, personalize content,
            and analyze our traffic. Please choose which types of cookies you allow.
          </p>

          {/* Cookie Categories */}
          <div className="space-y-4">
            {/* Necessary Cookies */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="mt-1 w-5 h-5 bg-slate-700 border-slate-600 rounded text-blue-600 cursor-not-allowed opacity-50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">Necessary Cookies</span>
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">Always Active</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    These cookies are essential for the website to function properly.
                    They enable basic functions like page navigation and access to secure areas.
                  </p>
                </div>
              </label>
            </div>

            {/* Analytics Cookies */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="mt-1 w-5 h-5 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-white">Analytics Cookies</span>
                  <p className="text-sm text-slate-400 mt-1">
                    These cookies help us understand how visitors interact with our website
                    by collecting and reporting information anonymously.
                  </p>
                </div>
              </label>
            </div>

            {/* Marketing Cookies */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="mt-1 w-5 h-5 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-white">Marketing Cookies</span>
                  <p className="text-sm text-slate-400 mt-1">
                    These cookies are used to track visitors across websites to display
                    ads that are relevant and engaging for individual users.
                  </p>
                </div>
              </label>
            </div>

            {/* Functional Cookies */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="mt-1 w-5 h-5 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-white">Functional Cookies</span>
                  <p className="text-sm text-slate-400 mt-1">
                    These cookies enable enhanced functionality and personalization,
                    such as remembering your preferences and choices.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Privacy Links */}
          <div className="text-sm text-slate-400">
            <p>
              For more information about how we use cookies, please read our{' '}
              <a href="/legal/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/legal/cookie-policy" className="text-blue-400 hover:text-blue-300 underline">
                Cookie Policy
              </a>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-6 flex gap-4 justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Save Preferences
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
