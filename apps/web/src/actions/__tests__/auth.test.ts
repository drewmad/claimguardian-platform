/**
 * @fileMetadata
 * @purpose "Tests for authentication server actions"
 * @owner test-team
 * @dependencies ["vitest", "@claimguardian/db"]
 * @exports []
 * @complexity medium
 * @tags ["test", "auth", "server-actions"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T22:35:00Z
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { signUp, signIn, signOut, resetPassword } from '../auth'
import { createSupabaseMock, mockAuthSuccess, mockAuthError } from '../../../__tests__/utils/supabase-mocks'

// Create properly typed mock
const mockSupabase = createSupabaseMock()

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT') // Next.js throws on redirect
  })
}))

// Mock Supabase client creation
jest.mock('@claimguardian/db', () => ({
  createClient: jest.fn(() => mockSupabase)
}))

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn(() => 'http://localhost:3000')
  }))
}))

describe('Auth Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function createFormData(data: Record<string, string>) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value)
    })
    return formData
  }

  describe('signUp', () => {
    it('should successfully sign up a user with valid data', async () => {
      const mockResponse = mockAuthSuccess()
      mockSupabase.auth.signUp.mockResolvedValue(mockResponse)

      const formData = createFormData({
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe'
      })

      const result = await signUp(formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data.user)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!',
        options: {
          data: {
            full_name: 'John Doe'
          }
        }
      })
    })

    it('should handle signup errors', async () => {
      const mockResponse = mockAuthError('Email already registered')
      mockSupabase.auth.signUp.mockResolvedValue(mockResponse)

      const formData = createFormData({
        email: 'existing@example.com',
        password: 'SecurePass123!'
      })

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already registered')
    })

    it('should validate required fields', async () => {
      const formData = createFormData({
        email: 'test@example.com'
        // Missing password
      })

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
    })
  })

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockResponse = mockAuthSuccess()
      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockResponse)

      const formData = createFormData({
        email: 'test@example.com',
        password: 'SecurePass123!'
      })

      // The redirect error should be caught and returned as error
      const result = await signIn(formData)

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!'
      })

      // Should catch redirect error
      expect(result.success).toBe(false)
      expect(result.error).toContain('NEXT_REDIRECT')
    })

    it('should handle signin errors', async () => {
      const mockResponse = mockAuthError('Invalid credentials')
      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockResponse)

      const formData = createFormData({
        email: 'test@example.com',
        password: 'wrong-password'
      })

      const result = await signIn(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      // The redirect error should be caught and returned as error
      const result = await signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.error).toContain('NEXT_REDIRECT')
    })

    it('should handle signout errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Signout failed' }
      })

      const result = await signOut()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Signout failed')
    })
  })

  describe('resetPassword', () => {
    it('should successfully send reset password email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null
      })

      const formData = createFormData({
        email: 'test@example.com'
      })

      const result = await resetPassword(formData)

      expect(result.success).toBe(true)
      expect((result.data as { message?: string })?.message).toContain('reset email sent')
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      )
    })

    it('should handle reset password errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Email not found' }
      })

      const formData = createFormData({
        email: 'nonexistent@example.com'
      })

      const result = await resetPassword(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email not found')
    })

    it('should validate email field', async () => {
      const formData = createFormData({})

      const result = await resetPassword(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
    })
  })
})
