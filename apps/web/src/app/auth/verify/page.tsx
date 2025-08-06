/**
 * @fileMetadata
 * @purpose "Email verification callback page - redirects to enhanced version"
 * @owner auth-team
 * @dependencies ["react", "next"]
 * @exports ["default"]
 * @complexity low
 * @tags ["auth", "verification", "redirect"]
 * @status stable
 */
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { Loader2 } from 'lucide-react'


function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect to enhanced verification page with all parameters preserved
    const currentUrl = new URL(window.location.href)
    const enhancedUrl = new URL('/auth/verify-enhanced', window.location.origin)
    
    // Copy all search params and hash to the enhanced version
    currentUrl.searchParams.forEach((value, key) => {
      enhancedUrl.searchParams.set(key, value)
    })
    
    if (currentUrl.hash) {
      enhancedUrl.hash = currentUrl.hash
    }
    
    router.replace(enhancedUrl.toString())
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
            <p className="text-slate-400">Taking you to the enhanced verification page...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 rounded-lg shadow-xl p-8">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Loading...</h1>
              <p className="text-slate-400">Please wait while we load the verification page.</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}