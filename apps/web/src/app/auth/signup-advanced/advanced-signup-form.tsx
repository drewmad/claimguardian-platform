'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { AccountWizard } from '@/components/forms/AccountWizard'
import { Button } from '@/components/ui/button'

export function AdvancedSignupForm() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/auth/signup"
            className="inline-flex items-center text-gray-400 hover:text-gray-200 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to simple signup
          </Link>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ClaimGuardian</h1>
              <p className="text-sm text-gray-400">Professional Account Setup</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Protect your Florida property in under 60 seconds
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Join thousands of Florida property owners who trust ClaimGuardian for comprehensive insurance claim assistance.
            </p>
          </div>
        </div>

        {/* Wizard */}
        <AccountWizard />

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link 
              href="/auth/signin" 
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Sign in here
            </Link>
          </p>
          
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <Link href="/legal/terms-of-service" className="hover:text-gray-300">
              Terms
            </Link>
            <Link href="/legal/privacy-policy" className="hover:text-gray-300">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-gray-300">
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}