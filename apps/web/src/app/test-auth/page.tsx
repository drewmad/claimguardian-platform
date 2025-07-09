/**
 * @fileMetadata
 * @purpose Test page for authentication flow
 * @owner test-team
 * @dependencies ["react", "@/components/auth", "@/stores/modal-store"]
 * @exports ["default"]
 * @complexity low
 * @tags ["test", "auth", "page"]
 * @status development
 */
'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { useModalStore } from '@/stores/modal-store'
import { LoginModal } from '@/components/modals/login-modal'
import { SignupModal } from '@/components/modals/signup-modal'
import { ForgotPasswordModal } from '@/components/modals/forgot-password-modal'

export default function TestAuthPage() {
  const { user, loading, error, signOut } = useAuth()
  const { openModal } = useModalStore()

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Authentication Test Page</h1>
        
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-400">Loading:</span> <span className="text-white">{loading ? 'Yes' : 'No'}</span></p>
            <p><span className="text-slate-400">User:</span> <span className="text-white">{user ? user.email : 'Not logged in'}</span></p>
            <p><span className="text-slate-400">Error:</span> <span className="text-red-400">{error ? error.message : 'None'}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => openModal('signup')}
            className="btn-primary py-3"
          >
            Open Signup Modal
          </button>
          
          <button
            onClick={() => openModal('login')}
            className="btn-secondary py-3"
          >
            Open Login Modal
          </button>
        </div>

        {user && (
          <button
            onClick={signOut}
            className="w-full btn-secondary py-3"
          >
            Sign Out
          </button>
        )}

        <div className="mt-8 p-4 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
            <li>Click &quot;Open Signup Modal&quot; to test registration</li>
            <li>Fill in all fields with valid data</li>
            <li>Use a unique email address</li>
            <li>Password must be at least 8 characters</li>
            <li>Phone number should be 10 digits</li>
            <li>Check the console for any errors</li>
          </ol>
        </div>
      </div>

      {/* Modals */}
      <LoginModal />
      <SignupModal />
      <ForgotPasswordModal />
    </div>
  )
}