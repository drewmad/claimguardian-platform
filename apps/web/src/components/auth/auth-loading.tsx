/**
 * @fileMetadata
 * @purpose Loading state component for authentication
 * @owner auth-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["AuthLoading"]
 * @complexity low
 * @tags ["auth", "loading", "component"]
 * @status active
 */
'use client'

import { Loader2 } from 'lucide-react'

export function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading your account...</p>
      </div>
    </div>
  )
}