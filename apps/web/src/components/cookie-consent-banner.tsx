/**
 * @fileMetadata
 * @purpose Cookie consent banner for GDPR/CCPA compliance
 * @owner compliance-team
 * @status active
 */
'use client'

import { Cookie, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CookiePreferencesModal } from './cookie-preferences-modal'

import { logger } from '@/lib/logger'

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Show banner after a slight delay to avoid layout shift
      setTimeout(() => setIsVisible(true), 1000)
    } else {
      // Initialize analytics if consent was given
      if (consent === 'accepted') {
        initializeAnalytics()
      }
    }
  }, [])

  const initializeAnalytics = () => {
    // Initialize Google Analytics, Sentry, etc.
    logger.info('Analytics initialized with user consent')
    // Add your analytics initialization code here
  }

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem('cookie-consent', 'accepted')
      localStorage.setItem('cookie-consent-date', new Date().toISOString())
      
      logger.track('cookie_consent_accepted')
      initializeAnalytics()
      
      setIsVisible(false)
    } catch (error) {
      console.error('Failed to save cookie consent:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem('cookie-consent', 'rejected')
      localStorage.setItem('cookie-consent-date', new Date().toISOString())
      
      logger.track('cookie_consent_rejected')
      
      setIsVisible(false)
    } catch (error) {
      console.error('Failed to save cookie rejection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = (preferences: any) => {
    localStorage.setItem('cookie-consent', 'custom')
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    logger.track('cookie_preferences_saved', { ...preferences })
    
    // Initialize analytics based on preferences
    if (preferences.analytics) {
      initializeAnalytics()
    }
    
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
            {/* Icon and Content */}
            <div className="flex gap-4 flex-1">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  We use cookies
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  We use cookies and similar technologies to help personalize content, 
                  tailor and measure ads, and provide a better experience. By clicking 
                  accept, you agree to this use.
                </p>
                <p className="text-xs text-slate-400">
                  <a 
                    href="/legal/privacy-policy" 
                    className="text-blue-400 hover:text-blue-300 underline"
                    target="_blank"
                  >
                    Learn more in our Privacy Policy
                  </a>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreferences(true)}
                disabled={isLoading}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Manage</span>
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Accept
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={handleReject}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors sm:hidden"
              aria-label="Close cookie banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handleSavePreferences}
      />
    </div>
  )
}