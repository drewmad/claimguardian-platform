'use client'

import { SimpleAuthProvider } from '@/components/auth/simple-auth-provider'
import { SimpleSignupModal } from '@/components/modals/simple-signup-modal'
import { Button } from '@/components/ui/button'
import { useModalStore } from '@/stores/modal-store'

function SignupDemo() {
  const { openModal } = useModalStore()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Simple Signup Demo</h1>
          <p className="mt-2 text-gray-600">
            Stripped down to just the essentials
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">What we kept:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Email & Password</li>
              <li>First & Last Name</li>
              <li>Email verification</li>
              <li>Simple terms checkbox</li>
              <li>Basic error handling</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">What we removed:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Device fingerprinting</li>
              <li>Location tracking</li>
              <li>UTM parameters</li>
              <li>Complex consent management</li>
              <li>Legal document system</li>
              <li>Session tracking</li>
              <li>All analytics tracking</li>
              <li>Complex UI animations</li>
              <li>Phone number collection</li>
              <li>Marketing preferences</li>
            </ul>
          </div>

          <Button 
            onClick={() => openModal('signup')} 
            className="w-full"
            size="lg"
          >
            Try Simple Signup
          </Button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Database requirements: Just the basic Supabase auth tables</p>
          <p>No custom tables or RPC functions needed!</p>
        </div>
      </div>

      <SimpleSignupModal />
    </div>
  )
}

export default function SimpleSignupDemoPage() {
  return (
    <SimpleAuthProvider>
      <SignupDemo />
    </SimpleAuthProvider>
  )
}