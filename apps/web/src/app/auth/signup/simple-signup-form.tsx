'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Shield, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function SimpleSignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Agreements
    over18: false,
    legalAgreements: false, // Combined terms & privacy
    aiDisclaimerAccepted: false,
    
    // Residency
    residencyType: '' as '' | 'renter' | 'homeowner' | 'landlord' | 'real_estate_pro',
  })
  
  const supabase = createBrowserSupabaseClient()
  
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    return digits.length === 10
  }
  
  const isFormValid = () => {
    return !!(
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      validateEmail(formData.email) &&
      formData.phone &&
      validatePhone(formData.phone) &&
      formData.password &&
      formData.password.length >= 8 &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      formData.over18 &&
      formData.legalAgreements &&
      formData.aiDisclaimerAccepted &&
      formData.residencyType
    )
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      setError('Please fill in all required fields correctly')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      if (signUpData?.user) {
        // Store consent data and residency type
        await supabase.rpc('link_consent_to_user', {
          p_user_id: signUpData.user.id,
          p_consents: {
            terms_of_service: formData.legalAgreements,
            privacy_policy: formData.legalAgreements,
            ai_disclaimer: formData.aiDisclaimerAccepted,
          },
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        })
        
        // Store residency type in user profile
        await supabase.from('profiles').update({
          residency_type: formData.residencyType
        }).eq('id', signUpData.user.id)
        
        // Redirect to property setup
        router.push('/onboarding/property-setup')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4">ClaimGuardian</h1>
          <h2 className="text-xl text-white mt-2">Create Account</h2>
          <p className="text-gray-400 mt-1">Sign up to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                placeholder="John"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                placeholder="Doe"
                required
              />
            </div>
          </div>
          
          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={cn(
                "mt-1 bg-slate-800 border-slate-700 text-white",
                formData.email && !validateEmail(formData.email) && "border-red-500"
              )}
              placeholder="you@example.com"
              required
            />
            {formData.email && !validateEmail(formData.email) && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid email</p>
            )}
          </div>
          
          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
              className={cn(
                "mt-1 bg-slate-800 border-slate-700 text-white",
                formData.phone && !validatePhone(formData.phone) && "border-red-500"
              )}
              placeholder="(555) 123-4567"
              required
            />
            {formData.phone && !validatePhone(formData.phone) && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid 10-digit phone number</p>
            )}
          </div>
          
          {/* Password */}
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={cn(
                "mt-1 bg-slate-800 border-slate-700 text-white",
                formData.password && formData.password.length < 8 && "border-red-500"
              )}
              placeholder="••••••••"
              required
            />
            {formData.password && formData.password.length < 8 && (
              <p className="text-xs text-amber-500 mt-1">Must be at least 8 characters</p>
            )}
          </div>
          
          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={cn(
                "mt-1 bg-slate-800 border-slate-700 text-white",
                formData.confirmPassword && formData.password !== formData.confirmPassword && "border-red-500"
              )}
              placeholder="••••••••"
              required
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
            )}
          </div>
          
          {/* Residency Type */}
          <div className="border-t border-slate-700 pt-4">
            <Label className="text-base font-medium mb-3 block">I am a... *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, residencyType: 'renter' })}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all",
                  formData.residencyType === 'renter'
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-slate-700 bg-slate-800 text-gray-300 hover:border-slate-600"
                )}
              >
                Renter
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, residencyType: 'homeowner' })}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all",
                  formData.residencyType === 'homeowner'
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-slate-700 bg-slate-800 text-gray-300 hover:border-slate-600"
                )}
              >
                Homeowner
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, residencyType: 'landlord' })}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all",
                  formData.residencyType === 'landlord'
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-slate-700 bg-slate-800 text-gray-300 hover:border-slate-600"
                )}
              >
                Landlord
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, residencyType: 'real_estate_pro' })}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all",
                  formData.residencyType === 'real_estate_pro'
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-slate-700 bg-slate-800 text-gray-300 hover:border-slate-600"
                )}
              >
                Real Estate Pro
              </button>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-4 space-y-3">
            {/* Age Verification */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="over18"
                checked={formData.over18}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, over18: !!checked })}
                className="mt-1"
                required
              />
              <Label htmlFor="over18" className="text-sm cursor-pointer">
                I confirm that I am 18 years or older *
              </Label>
            </div>
            
            {/* Combined Legal Agreements */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="legal"
                checked={formData.legalAgreements}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, legalAgreements: !!checked })}
                className="mt-1"
                required
              />
              <Label htmlFor="legal" className="text-sm cursor-pointer">
                I accept the{' '}
                <Link href="/legal/terms-of-service" target="_blank" className="text-blue-400 hover:text-blue-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy-policy" target="_blank" className="text-blue-400 hover:text-blue-300">
                  Privacy Policy
                </Link> *
              </Label>
            </div>
            
            {/* AI Disclaimer */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="ai-disclaimer"
                checked={formData.aiDisclaimerAccepted}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, aiDisclaimerAccepted: !!checked })}
                className="mt-1"
                required
              />
              <Label htmlFor="ai-disclaimer" className="text-sm cursor-pointer">
                I understand that AI can make mistakes and I should verify important information *
              </Label>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">
                Sign In
              </Link>
            </p>
            <Link href="/" className="text-sm text-gray-400 hover:text-white flex items-center justify-center">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}