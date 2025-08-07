"use client";

import { useEffect, useState } from "react";
import { cookieManager } from "@/lib/cookie-manager";
import { Cookie, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function TestCookiesPage() {
  const [consent, setConsent] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [consentAge, setConsentAge] = useState<number | null>(null);
  const [cookies, setCookies] = useState<string[]>([]);

  const loadStatus = () => {
    const currentConsent = cookieManager.getConsent();
    const currentPrefs = cookieManager.getPreferences();
    const age = cookieManager.getConsentAge();
    
    setConsent(currentConsent);
    setPreferences(currentPrefs);
    setConsentAge(age);
    
    // Get all cookies
    if (typeof document !== 'undefined') {
      const allCookies = document.cookie.split(';').map(c => c.trim().split('=')[0]);
      setCookies(allCookies);
    }
  };

  useEffect(() => {
    loadStatus();
    
    // Listen for consent updates
    const handleUpdate = () => loadStatus();
    window.addEventListener('cookie-consent-updated', handleUpdate);
    return () => window.removeEventListener('cookie-consent-updated', handleUpdate);
  }, []);

  const clearConsent = () => {
    localStorage.removeItem('cookie-consent');
    localStorage.removeItem('cookie-consent-date');
    localStorage.removeItem('cookie-preferences');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Cookie className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Cookie Consent Testing</h1>
        </div>

        {/* Current Status */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Consent Status:</p>
              <p className="font-mono text-lg">
                {consent ? (
                  <span className={consent === 'accepted' ? 'text-green-500' : 'text-yellow-500'}>
                    {consent}
                  </span>
                ) : (
                  <span className="text-red-500">Not Set</span>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Consent Age:</p>
              <p className="font-mono text-lg">
                {consentAge !== null ? `${consentAge} days` : 'N/A'}
              </p>
            </div>
          </div>

          {preferences && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-2">Cookie Preferences:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 bg-gray-700 rounded px-3 py-2">
                    {value ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Cookies */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Active Cookies ({cookies.length})</h2>
          <div className="max-h-48 overflow-y-auto">
            <div className="space-y-1">
              {cookies.length > 0 ? (
                cookies.map((cookie, i) => (
                  <div key={i} className="font-mono text-sm text-gray-400">
                    {cookie}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No cookies found</p>
              )}
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                cookieManager.setConsent('accepted');
                loadStatus();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Accept All Cookies
            </button>
            
            <button
              onClick={() => {
                cookieManager.setConsent('necessary-only');
                loadStatus();
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            >
              Necessary Only
            </button>
            
            <button
              onClick={clearConsent}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Clear Consent (Reset)
            </button>
            
            <button
              onClick={loadStatus}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Testing Instructions</h2>
          <ol className="space-y-2 text-sm">
            <li>1. Click "Clear Consent" to reset and see the consent banner</li>
            <li>2. Choose "Accept All" or "Necessary Only" in the banner</li>
            <li>3. Verify the consent is saved and preferences are applied</li>
            <li>4. Refresh the page - consent should be remembered</li>
            <li>5. Check that analytics/tracking respects the choice</li>
          </ol>
        </div>
      </div>
    </div>
  );
}