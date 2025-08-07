/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { Check, AlertCircle, Calendar } from 'lucide-react'
import { useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface AgeVerificationProps {
  value: boolean
  onChange: (verified: boolean) => void
  error?: string
  required?: boolean
}

export function AgeVerification({
  value,
  onChange,
  error,
  required = true
}: AgeVerificationProps) {
  const [touched, setTouched] = useState(false)

  const handleChange = (checked: boolean) => {
    setTouched(true)
    onChange(checked)
  }

  const showError = touched && required && !value

  return (
    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="age-verification"
          checked={value}
          onCheckedChange={handleChange}
          className={`mt-1 ${showError || error ? 'border-red-500' : ''}`}
          aria-invalid={!!error || showError}
          aria-describedby={error || showError ? "age-error" : undefined}
        />
        <div className="flex-1">
          <Label
            htmlFor="age-verification"
            className="text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <Calendar className="h-4 w-4 text-slate-400" />
            I confirm that I am 18 years of age or older
            {required && <span className="text-red-500">*</span>}
          </Label>
          <p className="text-xs text-slate-500 mt-1">
            You must be at least 18 years old to use ClaimGuardian services
          </p>
        </div>
      </div>

      {(error || showError) && (
        <Alert variant="destructive" className="py-2" id="age-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error || 'Age verification is required to proceed'}
          </AlertDescription>
        </Alert>
      )}

      {value && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Check className="h-4 w-4" />
          <span>Age requirement verified</span>
        </div>
      )}
    </div>
  )
}

// Extended component with date of birth option (for Phase 2)
interface AgeVerificationWithDOBProps extends AgeVerificationProps {
  useDateOfBirth?: boolean
  dateOfBirth?: string
  onDateOfBirthChange?: (date: string) => void
}

export function AgeVerificationWithDOB({
  value,
  onChange,
  error,
  required = true,
  useDateOfBirth = false,
  dateOfBirth,
  onDateOfBirthChange
}: AgeVerificationWithDOBProps) {
  const [verificationMethod, setVerificationMethod] = useState<'checkbox' | 'dob'>('checkbox')

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const handleDateChange = (date: string) => {
    if (onDateOfBirthChange) {
      onDateOfBirthChange(date)
    }

    // Auto-verify if 18 or older
    const age = calculateAge(date)
    onChange(age >= 18)
  }

  if (!useDateOfBirth || verificationMethod === 'checkbox') {
    return <AgeVerification value={value} onChange={onChange} error={error} required={required} />
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="date-of-birth" className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          Date of Birth
          {required && <span className="text-red-500">*</span>}
        </Label>
        <input
          type="date"
          id="date-of-birth"
          value={dateOfBirth || ''}
          onChange={(e) => handleDateChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className={`mt-1 w-full px-3 py-2 border rounded-md ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          aria-invalid={!!error}
          aria-describedby={error ? "dob-error" : undefined}
        />
      </div>

      {dateOfBirth && (
        <div className={`flex items-center gap-2 text-sm ${
          calculateAge(dateOfBirth) >= 18 ? 'text-green-600' : 'text-red-600'
        }`}>
          {calculateAge(dateOfBirth) >= 18 ? (
            <>
              <Check className="h-4 w-4" />
              <span>Age requirement met ({calculateAge(dateOfBirth)} years old)</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Must be 18 or older ({calculateAge(dateOfBirth)} years old)</span>
            </>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="py-2" id="dob-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <button
        type="button"
        onClick={() => setVerificationMethod('checkbox')}
        className="text-sm text-blue-600 hover:text-blue-700 underline"
      >
        Use checkbox verification instead
      </button>
    </div>
  )
}
