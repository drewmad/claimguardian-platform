/**
 * @fileMetadata
 * @purpose Provides a modal for user registration, including form validation and Supabase integration.
 * @owner frontend-team
 * @dependencies ["react", "@claimguardian/ui", "@/hooks/use-form", "@/utils/validation"]
 * @exports ["SignupModal"]
 * @complexity medium
 * @tags ["modal", "authentication", "signup", "form"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { Modal, Button, Input, Label, Checkbox } from '@claimguardian/ui'
import { useForm } from '@/hooks/use-form'
import { validateEmail, validatePhone, validateRequired } from '@/utils/validation'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface SignupFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  agree: boolean
  [key: string]: unknown
}

export function SignupModal({ isOpen, onClose, onSuccess }: SignupModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    reset
  } = useForm<SignupFormData>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      agree: false
    },
    validate: (values) => {
      const errors: Partial<Record<keyof SignupFormData, string>> = {}
      
      if (!validateRequired(values.firstName)) {
        errors.firstName = 'First name is required'
      }
      if (!validateRequired(values.lastName)) {
        errors.lastName = 'Last name is required'
      }
      if (!validateEmail(values.email)) {
        errors.email = 'Please enter a valid email address'
      }
      if (!validatePhone(values.phone)) {
        errors.phone = 'Please enter a valid phone number'
      }
      if (!validateRequired(values.password)) {
        errors.password = 'Password is required'
      }
      if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
      if (!values.agree) {
        errors.agree = 'You must agree to the terms'
      }
      
      return errors
    },
    onSubmit: async (values) => {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to sign up')
        }

        setIsSubmitted(true)
        // Call onSuccess if provided
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000) // Give user time to see success message
        }
      } catch (error: unknown) {
        console.error('Signup error:', (error as Error).message)
        // You might want to set a general error state here to display to the user
        // For now, we'll just log it.
        alert((error as Error).message) // Simple alert for demonstration
      }
    }
  })

  const handleClose = () => {
    reset()
    setIsSubmitted(false)
    onClose()
  }

  const calculatePasswordStrength = (password: string) => {
    let score = 0
    if (password.length > 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 10)
    if (digits.length >= 6) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
    } else if (digits.length >= 3) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
    } else {
      return digits
    }
  }

  if (isSubmitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Success!">
        <div className="text-center">
          <p className="text-slate-300 text-lg">Thank you for signing up!</p>
          <p className="text-slate-400 mt-2">You can now log in with your new account.</p>
          <Button 
            className="mt-6 w-full" 
            onClick={handleClose}
          >
            Close
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sign Up">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={values.firstName}
              onChange={handleChange}
              error={errors.firstName}
              autoComplete="given-name"
            />
          </div>
          <div className="w-full">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={values.lastName}
              onChange={handleChange}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(e) => {
                handleChange(e)
                setPasswordStrength(calculatePasswordStrength(e.target.value))
              }}
              error={errors.password}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute inset-y-0 right-0 px-4 text-blue-400 hover:text-blue-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </Button>
          </div>
          {values.password && (
            <div className="mt-2">
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    passwordStrength >= 4 ? 'bg-green-500' : 
                    passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Strength: {passwordStrength >= 4 ? 'Strong' : passwordStrength >= 2 ? 'Medium' : 'Weak'}
              </p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={values.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute inset-y-0 right-0 px-4 text-blue-400 hover:text-blue-300"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formatPhoneNumber(values.phone)}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value)
              handleChange({ ...e, target: { ...e.target, value: formatted } })
            }}
            error={errors.phone}
            autoComplete="tel"
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="agree"
            checked={values.agree}
                          onCheckedChange={(checked: boolean) => 
                handleChange({ target: { name: 'agree', value: checked } })
            }
          />
          <Label htmlFor="agree" className="text-sm">
            I agree to the{' '}
            <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0 h-auto">
              Terms of Service
            </Button>
            {' '}and{' '}
            <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0 h-auto">
              Privacy Policy
            </Button>
            {' '}*
          </Label>
        </div>
        {errors.agree && (
          <p className="error-message">{errors.agree}</p>
        )}

        <Button type="submit" className="w-full mt-6">
          Sign Up
        </Button>
      </form>
    </Modal>
  )
}