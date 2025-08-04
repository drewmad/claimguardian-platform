'use client'

import { AuthProvider } from '@/components/auth/auth-provider'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export default function OnboardingPage() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-900/50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl">
          <OnboardingFlow />
        </div>
      </div>
    </AuthProvider>
  )
}
