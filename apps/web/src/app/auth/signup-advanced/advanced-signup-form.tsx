'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, Loader2, AlertCircle, Check, FileText, Brain, Lock, ChevronRight } from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AgeVerification } from '@/components/compliance/age-verification'

interface ConsentState {
  termsAccepted: boolean
  privacyAccepted: boolean
  aiDisclaimerAccepted: boolean
  dataProcessingAccepted: boolean
  ageVerified: boolean
}

export function AdvancedSignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [consents, setConsents] = useState<ConsentState>({
    termsAccepted: false,
    privacyAccepted: false,
    aiDisclaimerAccepted: false,
    dataProcessingAccepted: false,
    ageVerified: false
  })
  
  const [consentErrors, setConsentErrors] = useState<string[]>([])
  
  const supabase = createBrowserSupabaseClient()
  
  const validateConsents = async () => {
    // Call RPC function to validate consents
    const { data, error } = await supabase.rpc('validate_signup_consent', {
      p_terms_accepted: consents.termsAccepted,
      p_privacy_accepted: consents.privacyAccepted,
      p_ai_disclaimer_accepted: consents.aiDisclaimerAccepted,
      p_age_verified: consents.ageVerified,
      p_data_processing: consents.dataProcessingAccepted
    })
    
    if (error) {
      console.error('Consent validation error:', error)
      return { valid: false, missing: ['validation_error'] }
    }
    
    return {
      valid: data?.valid || false,
      missing: data?.missing_consents || []
    }
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Clear errors
    setError(null)
    setConsentErrors([])
    
    // Basic validation
    if (!email || !password || !fullName || !phone) {
      setError('Please fill in all required fields')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    // Validate consents
    const consentValidation = await validateConsents()
    if (!consentValidation.valid) {
      setConsentErrors(consentValidation.missing)
      setError('Please accept all required agreements')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      })
      
      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }
      
      if (signUpData?.user) {
        // Link consents to user
        const { error: consentError } = await supabase.rpc('link_consent_to_user', {
          p_user_id: signUpData.user.id,
          p_consents: {
            terms_of_service: consents.termsAccepted,
            privacy_policy: consents.privacyAccepted,
            ai_disclaimer: consents.aiDisclaimerAccepted,
            data_processing: consents.dataProcessingAccepted,
            age_verification: consents.ageVerified
          },
          p_ip_address: null, // Would be captured server-side in production
          p_user_agent: navigator.userAgent
        })
        
        if (consentError) {
          console.error('Error linking consents:', consentError)
        }
        
        setSuccess(true)
        setIsLoading(false)
        
        // Redirect after delay
        setTimeout(() => {
          router.push('/dashboard?welcome=true')
        }, 2000)
      }
    } catch (error) {
      console.error('Sign up error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }
  
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-sm border-slate-700">
          <div className="p-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-slate-400">
              Welcome to ClaimGuardian. Redirecting to your dashboard...
            </p>
          </div>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-sm border-slate-700">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">ClaimGuardian</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Create Your Account</h1>
            <p className="text-slate-400">Join thousands of Florida property owners protecting their assets</p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-blue-400">1.</span> Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="text-slate-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-slate-300">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                    placeholder="(555) 123-4567"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" className="text-slate-300">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="text-slate-300">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Must be at least 8 characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Legal Agreements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-blue-400">2.</span> Legal Agreements
              </h3>
              
              {/* Age Verification */}
              <AgeVerification
                value={consents.ageVerified}
                onChange={(verified) => setConsents({ ...consents, ageVerified: verified })}
                error={consentErrors.includes('age_verification') ? 'Age verification is required' : undefined}
              />
              
              {/* Terms of Service */}
              <div className={`p-4 rounded-lg border ${
                consentErrors.includes('terms_of_service') ? 'border-red-500 bg-red-900/10' : 'border-slate-700 bg-slate-800/50'
              }`}>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={consents.termsAccepted}
                    onCheckedChange={(checked) => setConsents({ ...consents, termsAccepted: !!checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="terms" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      I accept the Terms of Service <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      By accepting, you agree to our{' '}
                      <Link href="/legal/terms-of-service" target="_blank" className="text-blue-400 hover:text-blue-300">
                        Terms of Service
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Privacy Policy */}
              <div className={`p-4 rounded-lg border ${
                consentErrors.includes('privacy_policy') ? 'border-red-500 bg-red-900/10' : 'border-slate-700 bg-slate-800/50'
              }`}>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={consents.privacyAccepted}
                    onCheckedChange={(checked) => setConsents({ ...consents, privacyAccepted: !!checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="privacy" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-400" />
                      I accept the Privacy Policy <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      By accepting, you agree to our{' '}
                      <Link href="/legal/privacy-policy" target="_blank" className="text-blue-400 hover:text-blue-300">
                        Privacy Policy
                      </Link>
                      {' '}and data processing practices
                    </p>
                  </div>
                </div>
              </div>
              
              {/* AI Disclaimer */}
              <div className={`p-4 rounded-lg border ${
                consentErrors.includes('ai_disclaimer') ? 'border-red-500 bg-red-900/10' : 'border-slate-700 bg-slate-800/50'
              }`}>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="ai-disclaimer"
                    checked={consents.aiDisclaimerAccepted}
                    onCheckedChange={(checked) => setConsents({ ...consents, aiDisclaimerAccepted: !!checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="ai-disclaimer" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <Brain className="h-4 w-4 text-slate-400" />
                      I understand the AI Tools Disclaimer <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      I understand that ClaimGuardian's AI tools provide guidance only and may contain errors. 
                      AI-generated content should be reviewed and verified. This is not a replacement for 
                      professional legal or insurance advice.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Data Processing (GDPR) */}
              <div className={`p-4 rounded-lg border ${
                consentErrors.includes('data_processing') ? 'border-red-500 bg-red-900/10' : 'border-slate-700 bg-slate-800/50'
              }`}>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="data-processing"
                    checked={consents.dataProcessingAccepted}
                    onCheckedChange={(checked) => setConsents({ ...consents, dataProcessingAccepted: !!checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="data-processing" className="text-sm font-medium cursor-pointer">
                      I consent to data processing <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      I consent to ClaimGuardian processing my personal data as described in the Privacy Policy
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-slate-400 hover:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}