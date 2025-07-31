/**
 * @fileMetadata
 * @purpose Account recovery page using security questions
 * @owner auth-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["auth", "recovery", "security", "page"]
 * @status active
 */
'use client'

import { Shield, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { authService } from '@/lib/auth/auth-service'
import { securityQuestionsService, type UserSecurityAnswer } from '@/lib/auth/security-questions-service'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

type RecoveryStep = 'email' | 'questions' | 'reset' | 'success'

export default function RecoverAccountPage() {
  const [step, setStep] = useState<RecoveryStep>('email')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [userQuestions, setUserQuestions] = useState<UserSecurityAnswer[]>([])
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Look up user by email
      const supabase = createClient()
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        setError('No account found with this email address')
        return
      }

      // Check if user has security questions
      const hasQuestions = await securityQuestionsService.hasSecurityQuestions(userData.id)
      
      if (!hasQuestions) {
        setError('This account does not have security questions set up. Please use password reset instead.')
        return
      }

      // Get user's security questions
      const questions = await securityQuestionsService.getUserQuestions(userData.id)
      
      if (questions.length === 0) {
        setError('Unable to load security questions. Please try again.')
        return
      }

      setUserId(userData.id)
      setUserQuestions(questions)
      setStep('questions')
      logger.track('account_recovery_started', { email })
    } catch (err) {
      logger.error('Failed to start account recovery', { userId }, err instanceof Error ? err : new Error(String(err)))
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const answersArray = userQuestions.map(q => ({
        questionId: q.question_id,
        answer: answers[q.question_id] || ''
      }))

      const isValid = await securityQuestionsService.verifyAnswers(userId, answersArray)
      
      if (!isValid) {
        setError('Incorrect answers. Please try again.')
        logger.track('account_recovery_failed', { userId, reason: 'incorrect_answers' })
        return
      }

      logger.track('security_questions_verified', { userId })
      setStep('reset')
    } catch (err) {
      logger.error('Failed to verify security questions', { userId }, err instanceof Error ? err : new Error(String(err)))
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      // Note: In production, this would be handled by a server-side API
      // For now, we'll send a password reset email
      const { error } = await authService.resetPassword(email)

      if (error) {
        throw error
      }

      logger.track('account_recovered', { userId })
      setStep('success')
    } catch (err) {
      logger.error('Failed to reset password', { userId }, err instanceof Error ? err : new Error(String(err)))
      setError('Failed to reset password. Please check your email for reset instructions.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 rounded-lg shadow-xl p-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Recovery Email Sent!</h1>
              <p className="text-slate-400 mb-6">
                We&apos;ve sent password reset instructions to your email.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Please check your inbox and follow the link to reset your password.
              </p>
              <Link
                href="/"
                className="btn-primary inline-block"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold">Account Recovery</h1>
              <p className="text-sm text-slate-400">
                {step === 'email' && 'Enter your email to get started'}
                {step === 'questions' && 'Answer your security questions'}
                {step === 'reset' && 'Create a new password'}
              </p>
            </div>
          </div>

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>

              <p className="text-center text-sm text-slate-400">
                Remembered your password?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Sign In
                </Link>
              </p>
            </form>
          )}

          {step === 'questions' && (
            <form onSubmit={handleQuestionsSubmit} className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-300">
                  Please answer your security questions to verify your identity.
                </p>
              </div>

              {userQuestions.map((q) => (
                <div key={q.question_id}>
                  <label className="block text-sm font-medium mb-2">
                    {q.question?.question}
                  </label>
                  <input
                    type="text"
                    value={answers[q.question_id] || ''}
                    onChange={(e) => setAnswers({
                      ...answers,
                      [q.question_id]: e.target.value
                    })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              ))}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}