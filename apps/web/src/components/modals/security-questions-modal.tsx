/**
 * @fileMetadata
 * @purpose Security questions setup modal
 * @owner auth-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store"]
 * @exports ["SecurityQuestionsModal"]
 * @complexity medium
 * @tags ["modal", "auth", "security", "recovery"]
 * @status active
 */
'use client'

import { useState, useEffect } from 'react'
import { X, Shield, AlertCircle } from 'lucide-react'
import { useModalStore } from '@/stores/modal-store'
import { useAuth } from '@/components/auth/auth-provider'
import { securityQuestionsService, SecurityQuestion } from '@/lib/auth/security-questions-service'
import { logger } from '@/lib/logger'

interface SecurityAnswer {
  questionId: string
  answer: string
}

export function SecurityQuestionsModal() {
  const { activeModal, closeModal } = useModalStore()
  const { user } = useAuth()
  const [questions, setQuestions] = useState<SecurityQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<SecurityAnswer[]>([
    { questionId: '', answer: '' },
    { questionId: '', answer: '' },
    { questionId: '', answer: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (activeModal === 'securityQuestions') {
      loadQuestions()
    }
  }, [activeModal])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await securityQuestionsService.getQuestions()
      setQuestions(data)
    } catch (err) {
      logger.error('Failed to load security questions', err)
      setError('Failed to load security questions')
    } finally {
      setLoading(false)
    }
  }

  if (activeModal !== 'securityQuestions' || !user) return null

  const handleQuestionChange = (index: number, questionId: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[index] = { ...newAnswers[index], questionId }
    setSelectedAnswers(newAnswers)
  }

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[index] = { ...newAnswers[index], answer }
    setSelectedAnswers(newAnswers)
  }

  const validateAnswers = (): boolean => {
    // Check all questions are selected
    const selectedQuestionIds = selectedAnswers.map(a => a.questionId).filter(Boolean)
    if (selectedQuestionIds.length !== 3) {
      setError('Please select 3 security questions')
      return false
    }

    // Check for duplicate questions
    if (new Set(selectedQuestionIds).size !== selectedQuestionIds.length) {
      setError('Please select different security questions')
      return false
    }

    // Check all answers are provided
    if (selectedAnswers.some(a => !a.answer.trim())) {
      setError('Please provide answers for all questions')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateAnswers()) return

    try {
      setSaving(true)
      await securityQuestionsService.saveAnswers(
        user.id,
        selectedAnswers.filter(a => a.questionId && a.answer)
      )
      
      logger.track('security_questions_saved', { userId: user.id })
      setSuccess(true)
      
      setTimeout(() => {
        closeModal()
        setSuccess(false)
        setSelectedAnswers([
          { questionId: '', answer: '' },
          { questionId: '', answer: '' },
          { questionId: '', answer: '' }
        ])
      }, 2000)
    } catch (err) {
      logger.error('Failed to save security questions', err)
      setError('Failed to save security questions. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-slate-800 rounded-lg w-full max-w-md p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Security Questions Saved!</h2>
            <p className="text-slate-400">
              Your security questions have been saved successfully.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      
      <div className="relative bg-slate-800 rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold">Set Up Security Questions</h2>
            <p className="text-sm text-slate-400">
              These will help you recover your account if needed
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                Select 3 different security questions and provide answers that only you know.
                Answers are not case-sensitive.
              </p>
            </div>

            {selectedAnswers.map((answer, index) => (
              <div key={index} className="space-y-3">
                <label className="block text-sm font-medium">
                  Security Question {index + 1}
                </label>
                <select
                  value={answer.questionId}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a question...</option>
                  {questions.map((q) => (
                    <option 
                      key={q.id} 
                      value={q.id}
                      disabled={selectedAnswers.some((a, i) => i !== index && a.questionId === q.id)}
                    >
                      {q.question}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={answer.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Your answer"
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

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-primary py-3 font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Security Questions'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 btn-secondary py-3"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}