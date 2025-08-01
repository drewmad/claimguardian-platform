'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { User, Mail, Phone as PhoneIcon, Lock, Shield } from 'lucide-react'
import { TextInput } from '../TextInput'
import { PasswordInput } from '../PasswordInput'
import { PhoneInput } from '../PhoneInput'
import { Button } from '@/components/ui/button'

interface PersonalInfoData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

interface PersonalInfoProps {
  onNext: (data: PersonalInfoData) => void
  defaultValues?: Partial<PersonalInfoData>
}

export function PersonalInfo({ onNext, defaultValues }: PersonalInfoProps) {
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue,
    formState: { errors, isValid } 
  } = useForm<PersonalInfoData>({ 
    defaultValues,
    mode: 'onBlur'
  })

  const password = watch('password')

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return true
  }

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required'
    if (password.length < 12) {
      return 'Password must be at least 12 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      return 'Password must contain at least one special character'
    }
    return true
  }

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) return 'Please confirm your password'
    if (confirmPassword !== password) {
      return 'Passwords do not match'
    }
    return true
  }

  const validatePhone = (phone: string) => {
    if (!phone || phone.length < 10) {
      return 'Please enter a valid phone number'
    }
    return true
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mx-auto mb-4">
          <User className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
        <p className="text-gray-400">
          Let's start with the basics. This information helps us protect your Florida property.
        </p>
      </div>

      <form onSubmit={handleSubmit(onNext)} className="space-y-6" aria-label="Personal Information Form">
        <fieldset className="space-y-4">
          <legend className="sr-only">Name Information</legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="First Name"
              {...register('firstName', { 
                required: 'First name is required',
                minLength: { value: 2, message: 'First name must be at least 2 characters' }
              })}
              error={errors.firstName}
              placeholder="Enter your first name"
              required
            />
            
            <TextInput
              label="Last Name"
              {...register('lastName', { 
                required: 'Last name is required',
                minLength: { value: 2, message: 'Last name must be at least 2 characters' }
              })}
              error={errors.lastName}
              placeholder="Enter your last name"
              required
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="sr-only">Contact Information</legend>
          
          <TextInput
            label="Email Address"
            type="email"
            {...register('email', { 
              required: 'Email address is required',
              validate: validateEmail
            })}
            error={errors.email}
            placeholder="Enter your email address"
            helperText="We'll use this to send you important updates about your claims"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <PhoneInput
              value={watch('phone')}
              onChange={(phone) => setValue('phone', phone, { shouldValidate: true })}
              error={errors.phone}
              helperText="For emergency claim notifications and two-factor authentication"
              required
            />
            <input 
              type="hidden" 
              {...register('phone', { 
                required: 'Phone number is required',
                validate: validatePhone
              })}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="sr-only">Security Information</legend>
          
          <PasswordInput
            label="Password"
            {...register('password', { 
              required: 'Password is required',
              validate: validatePassword
            })}
            error={errors.password}
            showStrength={true}
            placeholder="Create a strong password"
            helperText="Must be at least 12 characters with mixed case, numbers, and symbols"
            required
          />

          <PasswordInput
            label="Confirm Password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: validateConfirmPassword
            })}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            required
          />
        </fieldset>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-300 mb-1">Secure & Private</h3>
              <p className="text-xs text-gray-300">
                Your information is encrypted and stored securely. We never share your personal data with third parties.
              </p>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 text-lg font-medium transition-all duration-200"
          size="lg"
          disabled={!isValid}
        >
          Continue to Legal Agreements
        </Button>
      </form>
    </div>
  )
}