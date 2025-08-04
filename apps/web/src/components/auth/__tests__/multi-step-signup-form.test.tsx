/**
 * @fileMetadata
 * @purpose Tests for the optimized multi-step signup form
 * @owner test-team
 * @dependencies ["vitest", "@testing-library/react", "@testing-library/user-event", "@claimguardian/db", "next/navigation"]
 * @exports []
 * @complexity high
 * @tags ["test", "auth", "react", "form", "integration"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:20:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiStepSignupForm } from '../../../app/auth/signup/multi-step-signup-form'

// Mock dependencies
vi.mock('@claimguardian/db', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn()
    }
  }))
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

vi.mock('@/lib/logger/production-logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

const mockSupabase = {
  auth: {
    signUp: vi.fn()
  }
}

const mockRouter = {
  push: vi.fn()
}

describe('MultiStepSignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(require('@claimguardian/db').createBrowserSupabaseClient as any).mockReturnValue(mockSupabase)
    ;(require('next/navigation').useRouter as any).mockReturnValue(mockRouter)
  })

  describe('Welcome Step', () => {
    it('should render welcome step initially', () => {
      render(<MultiStepSignupForm />)
      
      expect(screen.getByText('Welcome to ClaimGuardian')).toBeInTheDocument()
      expect(screen.getByText(/AI-powered insurance claim advocate/)).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should show correct step progress', () => {
      render(<MultiStepSignupForm />)
      
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      expect(screen.getByText('25% complete')).toBeInTheDocument()
    })

    it('should navigate to account step on Next click', async () => {
      const user = userEvent.setup()
      render(<MultiStepSignupForm />)
      
      await user.click(screen.getByText('Next'))
      
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    })
  })

  describe('Account Step', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<MultiStepSignupForm />)
      await user.click(screen.getByText('Next')) // Navigate to account step
    })

    it('should render all form fields', () => {
      expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Confirm Password/)).toBeInTheDocument()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      const emailInput = screen.getByLabelText(/Email/)
      
      await user.type(emailInput, 'invalid-email')
      await user.tab() // Trigger blur
      
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })

    it('should format phone number automatically', async () => {
      const user = userEvent.setup()
      const phoneInput = screen.getByLabelText(/Phone Number/)
      
      await user.type(phoneInput, '5551234567')
      
      expect(phoneInput).toHaveValue('(555) 123-4567')
    })

    it('should validate password strength', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/^Password/)
      
      await user.type(passwordInput, 'weak')
      
      expect(screen.getByText(/weak/i)).toBeInTheDocument()
      
      await user.clear(passwordInput)
      await user.type(passwordInput, 'StrongPassword123!')
      
      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })

    it('should validate password confirmation', async () => {
      const user = userEvent.setup()
      const passwordInput = screen.getByLabelText(/^Password/)
      const confirmInput = screen.getByLabelText(/Confirm Password/)
      
      await user.type(passwordInput, 'password123')
      await user.type(confirmInput, 'different123')
      
      expect(screen.getByText(/Passwords don't match/)).toBeInTheDocument()
    })

    it('should require residency type selection', () => {
      expect(screen.getByText('Renter')).toBeInTheDocument()
      expect(screen.getByText('Homeowner')).toBeInTheDocument()
      expect(screen.getByText('Landlord')).toBeInTheDocument()
      expect(screen.getByText('Real Estate Pro')).toBeInTheDocument()
    })

    it('should disable Next button when form is invalid', () => {
      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })

    it('should enable Next button when form is valid', async () => {
      const user = userEvent.setup()
      
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Email/), 'john@example.com')
      await user.type(screen.getByLabelText(/Phone Number/), '5551234567')
      await user.type(screen.getByLabelText(/^Password/), 'StrongPassword123!')
      await user.type(screen.getByLabelText(/Confirm Password/), 'StrongPassword123!')
      await user.click(screen.getByText('Homeowner'))
      
      await waitFor(() => {
        expect(screen.getByText('Next')).not.toBeDisabled()
      })
    })
  })

  describe('Legal Step', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<MultiStepSignupForm />)
      
      // Navigate through steps
      await user.click(screen.getByText('Next')) // To account step
      
      // Fill out account form
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Email/), 'john@example.com')
      await user.type(screen.getByLabelText(/Phone Number/), '5551234567')
      await user.type(screen.getByLabelText(/^Password/), 'StrongPassword123!')
      await user.type(screen.getByLabelText(/Confirm Password/), 'StrongPassword123!')
      await user.click(screen.getByText('Homeowner'))
      
      await waitFor(() => screen.getByText('Next'))
      await user.click(screen.getByText('Next')) // To legal step
    })

    it('should render legal agreements', () => {
      expect(screen.getByText('Legal Agreements')).toBeInTheDocument()
      expect(screen.getByText(/I confirm that I am 18 years or older/)).toBeInTheDocument()
      expect(screen.getByText(/Terms of Service/)).toBeInTheDocument()
      expect(screen.getByText(/Privacy Policy/)).toBeInTheDocument()
    })

    it('should require age verification', async () => {
      const user = userEvent.setup()
      const nextButton = screen.getByText('Next')
      
      expect(nextButton).toBeDisabled()
      
      // Accept legal agreements but not age
      await user.click(screen.getByLabelText(/Terms of Service/))
      expect(nextButton).toBeDisabled()
      
      // Accept age verification
      await user.click(screen.getByLabelText(/18 years or older/))
      expect(nextButton).not.toBeDisabled()
    })

    it('should require legal agreements acceptance', async () => {
      const user = userEvent.setup()
      const nextButton = screen.getByText('Next')
      
      // Accept age but not legal agreements
      await user.click(screen.getByLabelText(/18 years or older/))
      expect(nextButton).toBeDisabled()
      
      // Accept legal agreements
      await user.click(screen.getByLabelText(/Terms of Service/))
      expect(nextButton).not.toBeDisabled()
    })
  })

  describe('AI Disclaimer Step', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<MultiStepSignupForm />)
      
      // Navigate through all steps to AI disclaimer
      await user.click(screen.getByText('Next')) // To account
      
      // Fill account form
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Email/), 'john@example.com')
      await user.type(screen.getByLabelText(/Phone Number/), '5551234567')
      await user.type(screen.getByLabelText(/^Password/), 'StrongPassword123!')
      await user.type(screen.getByLabelText(/Confirm Password/), 'StrongPassword123!')
      await user.click(screen.getByText('Homeowner'))
      
      await waitFor(() => screen.getByText('Next'))
      await user.click(screen.getByText('Next')) // To legal
      
      // Accept legal requirements
      await user.click(screen.getByLabelText(/18 years or older/))
      await user.click(screen.getByLabelText(/Terms of Service/))
      
      await user.click(screen.getByText('Next')) // To AI disclaimer
    })

    it('should render AI disclaimer content', () => {
      expect(screen.getByText('AI Disclaimer')).toBeInTheDocument()
      expect(screen.getByText(/AI can make mistakes/)).toBeInTheDocument()
      expect(screen.getByText(/verify important information/)).toBeInTheDocument()
    })

    it('should show Create Account button', () => {
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })

    it('should disable Create Account button until disclaimer is accepted', async () => {
      const user = userEvent.setup()
      const createButton = screen.getByText('Create Account')
      
      expect(createButton).toBeDisabled()
      
      await user.click(screen.getByLabelText(/AI can make mistakes/))
      
      expect(createButton).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<MultiStepSignupForm />)
      
      // Complete all steps
      await user.click(screen.getByText('Next')) // To account
      
      await user.type(screen.getByLabelText(/First Name/), 'John')
      await user.type(screen.getByLabelText(/Last Name/), 'Doe')
      await user.type(screen.getByLabelText(/Email/), 'john@example.com')
      await user.type(screen.getByLabelText(/Phone Number/), '5551234567')
      await user.type(screen.getByLabelText(/^Password/), 'StrongPassword123!')
      await user.type(screen.getByLabelText(/Confirm Password/), 'StrongPassword123!')
      await user.click(screen.getByText('Homeowner'))
      
      await waitFor(() => screen.getByText('Next'))
      await user.click(screen.getByText('Next')) // To legal
      
      await user.click(screen.getByLabelText(/18 years or older/))
      await user.click(screen.getByLabelText(/Terms of Service/))
      await user.click(screen.getByText('Next')) // To AI disclaimer
      
      await user.click(screen.getByLabelText(/AI can make mistakes/))
    })

    it('should call Supabase signUp on form submission', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: null },
        error: null
      })
      
      await user.click(screen.getByText('Create Account'))
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'StrongPassword123!',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe',
            phone: '(555) 123-4567'
          }
        }
      })
    })

    it('should redirect to onboarding on successful signup', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: null },
        error: null
      })
      
      await user.click(screen.getByText('Create Account'))
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/property-setup')
      })
    })

    it('should show error message on signup failure', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      })
      
      await user.click(screen.getByText('Create Account'))
      
      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signUp.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      
      await user.click(screen.getByText('Create Account'))
      
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should allow going back through steps', async () => {
      const user = userEvent.setup()
      render(<MultiStepSignupForm />)
      
      await user.click(screen.getByText('Next')) // To account step
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      
      await user.click(screen.getByText('Previous'))
      expect(screen.getByText('Welcome to ClaimGuardian')).toBeInTheDocument()
    })

    it('should show correct step indicators', async () => {
      const user = userEvent.setup()
      render(<MultiStepSignupForm />)
      
      // Check initial indicators
      const indicators = screen.getAllByText(/Welcome|Account|Legal|AI Terms/)
      expect(indicators).toHaveLength(4)
      
      await user.click(screen.getByText('Next'))
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<MultiStepSignupForm />)
      
      // Navigate to account step to test form labels
      fireEvent.click(screen.getByText('Next'))
      
      expect(screen.getByLabelText(/First Name/)).toBeRequired()
      expect(screen.getByLabelText(/Last Name/)).toBeRequired()
      expect(screen.getByLabelText(/Email/)).toBeRequired()
    })

    it('should provide proper error announcements', async () => {
      const user = userEvent.setup()
      render(<MultiStepSignupForm />)
      
      await user.click(screen.getByText('Next')) // To account step
      
      const emailInput = screen.getByLabelText(/Email/)
      await user.type(emailInput, 'invalid')
      await user.tab()
      
      const errorMessage = screen.getByText('Please enter a valid email')
      expect(errorMessage).toHaveAttribute('role', 'alert')
    })
  })
})