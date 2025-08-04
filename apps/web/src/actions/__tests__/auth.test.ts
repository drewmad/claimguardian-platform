/**
 * @fileMetadata
 * @purpose Tests for authentication server actions
 * @owner test-team
 * @dependencies ["vitest", "@claimguardian/db"]
 * @exports []
 * @complexity medium
 * @tags ["test", "auth", "server-actions"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:15:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp, signIn, signOut, resetPassword } from '../auth'
import { createServerSupabaseClient } from '@claimguardian/db'

// Mock Supabase client
vi.mock('@claimguardian/db', () => ({
  createServerSupabaseClient: vi.fn()
}))

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn()
  }
}

describe('Auth Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createServerSupabaseClient as any).mockReturnValue(mockSupabase)
  })

  describe('signUp', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '(555) 123-4567',
      residencyType: 'homeowner' as const,
      over18: true,
      legalAgreements: true,
      aiDisclaimerAccepted: true
    }

    it('should successfully sign up a user with valid data', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const result = await signUp(validSignupData)

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validSignupData.email,
        password: validSignupData.password,
        options: {
          data: {
            first_name: validSignupData.firstName,
            last_name: validSignupData.lastName,
            phone: validSignupData.phone,
            residency_type: validSignupData.residencyType,
            over_18: validSignupData.over18,
            legal_agreements: validSignupData.legalAgreements,
            ai_disclaimer_accepted: validSignupData.aiDisclaimerAccepted
          }
        }
      })
    })

    it('should handle signup errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      })

      const result = await signUp(validSignupData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already registered')
    })

    it('should validate required fields', async () => {
      const invalidData = { ...validSignupData, email: '' }

      const result = await signUp(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('email')
    })

    it('should validate age requirement', async () => {
      const underageData = { ...validSignupData, over18: false }

      const result = await signUp(underageData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('18')
    })

    it('should validate legal agreements', async () => {
      const noAgreementData = { ...validSignupData, legalAgreements: false }

      const result = await signUp(noAgreementData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('legal')
    })
  })

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockSession = { access_token: 'token-123' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: mockSession },
        error: null
      })

      const result = await signIn({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const result = await signIn({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid login credentials')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await signOut()

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Network error' }
      })

      const result = await signOut()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('resetPassword', () => {
    it('should successfully send reset password email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      const result = await resetPassword('test@example.com')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: expect.stringContaining('/auth/reset-password') }
      )
    })

    it('should handle reset password errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Email not found' }
      })

      const result = await resetPassword('nonexistent@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email not found')
    })

    it('should validate email format', async () => {
      const result = await resetPassword('invalid-email')

      expect(result.success).toBe(false)
      expect(result.error).toContain('email')
    })
  })
})