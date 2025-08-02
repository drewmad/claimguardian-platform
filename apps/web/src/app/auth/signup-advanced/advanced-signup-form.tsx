'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2, AlertCircle, Check, FileText, Lock, ChevronRight, Info, Cookie } from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AgeVerification } from '@/components/compliance/age-verification'
import { LegalDocumentModal } from '@/components/modals/legal-document-modal'

interface ConsentState {
  termsAccepted: boolean
  privacyAccepted: boolean
  aiDisclaimerAccepted: boolean
  dataProcessingAccepted: boolean
  cookiesAccepted: boolean
  ageVerified: boolean
}

const consentNameToText: { [key: string]: string } = {
  terms_of_service: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
  ai_disclaimer: 'AI Tools Disclaimer',
  data_processing: 'Data Processing consent',
  age_verification: 'Age Verification',
  cookies: 'Cookie Policy'
};


export function AdvancedSignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [consents, setConsents] = useState<ConsentState>({
    termsAccepted: false,
    privacyAccepted: false,
    aiDisclaimerAccepted: false,
    dataProcessingAccepted: false,
    cookiesAccepted: false,
    ageVerified: false
  })
  
  const [consentErrors, setConsentErrors] = useState<string[]>([])
  const [modalContent, setModalContent] = useState({ title: '', content: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const supabase = createBrowserSupabaseClient()
  
  const showLegalModal = async (doc: 'terms-of-service' | 'privacy-policy') => {
    try {
      const response = await fetch(`/legal/${doc}.md`);
      const content = await response.text();
      const title = doc === 'terms-of-service' ? 'Terms of Service' : 'Privacy Policy';
      setModalContent({ title, content });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load legal document:', error);
      setError('Could not load the legal document. Please try again later.');
    }
  };

  const validateConsents = async () => {
    const payload = {
      p_terms_accepted: consents.termsAccepted,
      p_privacy_accepted: consents.privacyAccepted,
      p_ai_disclaimer_accepted: consents.aiDisclaimerAccepted,
      p_age_verified: consents.ageVerified,
      p_data_processing: consents.dataProcessingAccepted,
    };
    
    const { data, error } = await supabase.rpc('validate_signup_consent', payload)
    
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
    setError(null)
    setConsentErrors([])
    
    if (!email || !password || !firstName || !lastName || !phone) {
      setError('Please fill in all required fields.')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    
    const consentValidation = await validateConsents()
    if (!consentValidation.valid) {
      const missingConsents = consentValidation.missing.map((c: string) => consentNameToText[c] || c).join(', ')
      setError(`Please review and accept the following: ${missingConsents}.`)
      setConsentErrors(consentValidation.missing)
      return
    }
    
    setIsLoading(true)
    
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            full_name: `${firstName} ${lastName}`
          }
        }
      })
      
      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }
      
      if (signUpData?.user) {
        const { error: consentError } = await supabase.rpc('link_consent_to_user', {
          p_user_id: signUpData.user.id,
          p_consents: {
            terms_of_service: consents.termsAccepted,
            privacy_policy: consents.privacyAccepted,
            ai_disclaimer: consents.aiDisclaimerAccepted,
            data_processing: consents.dataProcessingAccepted,
            age_verification: consents.ageVerified,
            cookies: consents.cookiesAccepted,
          },
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        })
        
        if (consentError) {
          console.error('Error linking consents:', consentError)
        }
        
        setSuccess(true)
        setIsLoading(false)
        
        setTimeout(() => {
          router.push('/onboarding')
        }, 2000)
      } else {
        setError('There was an issue creating your account. Please try again.')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Sign up error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }
  
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const ConsentItem = ({ id, checked, onCheckedChange, error, children }: { id: string, checked: boolean, onCheckedChange: (checked: boolean) => void, error?: boolean, children: React.ReactNode }) => (
    <div 
      onClick={() => onCheckedChange(!checked)}
      className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all active:scale-95 ${
        error ? 'border-red-500 bg-red-900/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-start space-x-3">
        <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-sm border-slate-700">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-slate-400">
              Welcome to ClaimGuardian. Redirecting to set up your profile...
            </p>
          </div>
        </Card>
      </div>
    )
  }
  
  return (
    <>
      <LegalDocumentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 flex items-center space-x-2">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          <span className="text-xl sm:text-2xl font-bold text-white">ClaimGuardian</span>
        </div>
        <div className="flex items-center justify-center min-h-screen pt-16 sm:pt-0">
          <Card className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-sm border-slate-700">
            <div className="p-4 sm:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Create Your Account</h1>
                <p className="text-slate-400 text-sm sm:text-base">Join thousands of Florida property owners protecting their assets</p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                    <Input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" placeholder="John" disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" placeholder="Doe" disabled={isLoading} />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" disabled={isLoading} />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="mt-1" placeholder="(555) 123-4567" disabled={isLoading} />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={isLoading} />
                    <p className="mt-1 text-xs text-slate-400">Must be at least 8 characters</p>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                    <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-400" /> Legal Agreements
                  </h3>
                  
                  <AgeVerification value={consents.ageVerified} onChange={(verified) => setConsents(c => ({ ...c, ageVerified: verified }))} error={consentErrors.includes('age_verification') ? 'Age verification is required' : undefined} />
                  
                  <ConsentItem id="terms" checked={consents.termsAccepted} onCheckedChange={(c) => setConsents(s => ({...s, termsAccepted: c}))} error={consentErrors.includes('terms_of_service')}>
                    <Label htmlFor="terms" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" /> I accept the <button type="button" onClick={(e) => { e.stopPropagation(); showLegalModal('terms-of-service'); }} className="text-blue-400 hover:text-blue-300 underline">Terms of Service</button> <span className="text-red-500">*</span>
                    </Label>
                  </ConsentItem>
                  
                  <ConsentItem id="privacy" checked={consents.privacyAccepted} onCheckedChange={(c) => setConsents(s => ({...s, privacyAccepted: c}))} error={consentErrors.includes('privacy_policy')}>
                    <Label htmlFor="privacy" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-400" /> I accept the <button type="button" onClick={(e) => { e.stopPropagation(); showLegalModal('privacy-policy'); }} className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</button> <span className="text-red-500">*</span>
                    </Label>
                  </ConsentItem>

                  <ConsentItem id="ai-disclaimer" checked={consents.aiDisclaimerAccepted} onCheckedChange={(c) => setConsents(s => ({...s, aiDisclaimerAccepted: c}))} error={consentErrors.includes('ai_disclaimer')}>
                    <Label htmlFor="ai-disclaimer" className="text-sm font-medium cursor-pointer">
                      I understand that AI tools provide guidance only and may contain errors. AI-generated content should be reviewed and verified. This is not a replacement for professional advice. <span className="text-red-500">*</span>
                    </Label>
                  </ConsentItem>

                  <ConsentItem id="data-processing" checked={consents.dataProcessingAccepted} onCheckedChange={(c) => setConsents(s => ({...s, dataProcessingAccepted: c}))} error={consentErrors.includes('data_processing')}>
                    <Label htmlFor="data-processing" className="text-sm font-medium cursor-pointer">I consent to my data being processed as described in the Privacy Policy <span className="text-red-500">*</span></Label>
                  </ConsentItem>

                  <ConsentItem id="cookies" checked={consents.cookiesAccepted} onCheckedChange={(c) => setConsents(s => ({...s, cookiesAccepted: c}))} error={consentErrors.includes('cookies')}>
                    <Label htmlFor="cookies" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <Cookie className="h-4 w-4 text-slate-400" /> I accept the use of cookies as described in the <button type="button" onClick={(e) => { e.stopPropagation(); showLegalModal('privacy-policy'); }} className="text-blue-400 hover:text-blue-300 underline">Cookie Policy</button> <span className="text-red-500">*</span>
                    </Label>
                  </ConsentItem>
                </div>

                <Button type="submit" className="w-full !mt-8" size="lg" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : <>Create Account <ChevronRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-slate-400">
                  Already have an account?{' '}
                  <button onClick={() => router.push('/auth/signin')} className="text-blue-400 hover:text-blue-300 font-medium">Sign In</button>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}