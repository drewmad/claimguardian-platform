'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FileText, ShieldCheck, Cookie, Brain, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion } from '../Accordion'

interface AgreementsData {
  agreed: boolean
  ageVerified: boolean
}

interface AgreementsProps {
  onPrev: () => void
  onSubmit: (data: AgreementsData) => void
  isLoading?: boolean
}

export function Agreements({ onPrev, onSubmit, isLoading = false }: AgreementsProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false)
  
  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors } 
  } = useForm<AgreementsData>({
    mode: 'onChange'
  })

  const agreed = watch('agreed')
  const ageVerified = watch('ageVerified', true) // Default to true for adults

  const handleAgreementToggle = () => {
    setHasReadTerms(true)
    setValue('agreed', !agreed, { shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Legal Agreements</h2>
        <p className="text-gray-400">
          Please review and accept our terms to complete your account creation.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-label="Legal Agreements Form">
        <fieldset className="space-y-4">
          <legend className="sr-only">Age Verification</legend>
          
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-300 mb-2">Age Verification Required</h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={ageVerified}
                    onCheckedChange={(checked) => setValue('ageVerified', Boolean(checked), { shouldValidate: true })}
                    className="mt-0.5"
                    {...register('ageVerified', { required: 'You must be 18 or older to create an account' })}
                  />
                  <span className="text-sm text-gray-300">
                    I confirm that I am 18 years of age or older and legally able to enter into contracts in the state of Florida.
                  </span>
                </label>
                {errors.ageVerified && (
                  <p role="alert" className="mt-2 text-sm text-red-400">
                    {errors.ageVerified.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="sr-only">Legal Documents</legend>
          
          <Accordion title="📋 Review All Legal Agreements" defaultOpen={false}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Link 
                  href="/legal/terms-of-service" 
                  target="_blank"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 underline text-sm"
                >
                  <FileText className="h-4 w-4" />
                  Terms of Service
                </Link>
                
                <Link 
                  href="/legal/privacy-policy" 
                  target="_blank"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 underline text-sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Privacy Policy
                </Link>
                
                <Link 
                  href="/legal/data-processing" 
                  target="_blank"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 underline text-sm"
                >
                  <FileText className="h-4 w-4" />
                  Data Processing Agreement
                </Link>
                
                <Link 
                  href="/legal/ai-disclaimer" 
                  target="_blank"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 underline text-sm"
                >
                  <Brain className="h-4 w-4" />
                  AI Tools Disclaimer
                </Link>
                
                <Link 
                  href="/legal/cookie-policy" 
                  target="_blank"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 underline text-sm"
                >
                  <Cookie className="h-4 w-4" />
                  Cookie Policy
                </Link>
              </div>
              
              <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-600">
                <h4 className="text-sm font-medium text-gray-200 mb-2">Quick Summary:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• We protect your privacy and never sell your data</li>
                  <li>• AI tools provide assistance but aren't legal advice</li>
                  <li>• You can delete your account and data anytime</li>
                  <li>• Florida state laws govern these agreements</li>
                </ul>
              </div>
            </div>
          </Accordion>

          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={agreed}
                onCheckedChange={handleAgreementToggle}
                className="mt-1"
                {...register('agreed', { 
                  required: 'You must agree to all terms to continue' 
                })}
              />
              <div className="flex-1">
                <span className="text-sm text-gray-200 leading-relaxed">
                  I have read, understood, and agree to be bound by all of the above legal agreements, including the Terms of Service, Privacy Policy, Data Processing Agreement, AI Tools Disclaimer, and Cookie Policy.
                </span>
                <p className="text-xs text-gray-400 mt-2">
                  <strong>Required:</strong> You must accept all agreements to use ClaimGuardian services.
                </p>
              </div>
            </label>
            
            {errors.agreed && (
              <p role="alert" className="mt-2 text-sm text-red-400">
                {errors.agreed.message}
              </p>
            )}
          </div>
        </fieldset>

        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-300 mb-1">Almost Done!</h3>
              <p className="text-xs text-gray-300">
                Your account will be created securely and you'll receive a confirmation email. 
                You can start protecting your Florida property immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            onClick={onPrev}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button 
            type="submit" 
            disabled={!agreed || !ageVerified || isLoading}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create My Account
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}