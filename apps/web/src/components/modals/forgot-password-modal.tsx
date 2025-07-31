/**
 * @fileMetadata
 * @purpose Forgot password modal component
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store", "@/lib/supabase"]
 * @exports ["ForgotPasswordModal"]
 * @complexity low
 * @tags ["modal", "auth", "password-reset"]
 * @status active
 */
'use client'

import { X } from 'lucide-react'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { useModalStore } from '@/stores/modal-store'

export function ForgotPasswordModal() {
  const { activeModal, closeModal, openModal } = useModalStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (activeModal !== 'forgotPassword') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setIsSubmitted(true)
    } catch (error) {
      setError((error as Error).message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
        <div className="relative bg-slate-800 rounded-lg w-full max-w-md p-6 shadow-xl text-center">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
          <p className="text-slate-300">
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Please check your email and follow the instructions to reset your password.
          </p>
          
          <button
            onClick={() => {
              closeModal()
              openModal('login')
            }}
            className="mt-6 btn-primary py-3 px-6"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      
      <div className="relative bg-slate-800 rounded-lg w-full max-w-md p-6 shadow-xl">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Forgot Your Password?</h2>
        <p className="text-slate-400 mb-6">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          Remember your password?{' '}
          <button
            onClick={() => {
              closeModal()
              openModal('login')
            }}
            className="text-blue-400 hover:text-blue-300"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}