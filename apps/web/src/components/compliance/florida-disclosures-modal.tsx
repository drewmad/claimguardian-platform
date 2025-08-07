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

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { AlertTriangle, Scale, Users, FileText } from 'lucide-react'
import { useState } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'


interface FloridaDisclosuresModalProps {
  open: boolean
  onAccept: () => void
  onCancel: () => void
  userId: string
}

export function FloridaDisclosuresModal({
  open,
  onAccept,
  onCancel,
  userId
}: FloridaDisclosuresModalProps) {
  const [consents, setConsents] = useState({
    publicAdjuster: false,
    legalAdvice: false,
    insuranceCooperation: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserSupabaseClient()

  const allConsentsAccepted =
    consents.publicAdjuster &&
    consents.legalAdvice &&
    consents.insuranceCooperation

  const handleAccept = async () => {
    if (!allConsentsAccepted) {
      setError('Please acknowledge all disclosures to continue')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Link Florida-specific consents to user
      const { error: consentError } = await supabase.rpc('link_consent_to_user', {
        p_user_id: userId,
        p_consents: {
          public_adjuster_notice: consents.publicAdjuster,
          legal_advice_disclaimer: consents.legalAdvice,
          insurance_cooperation: consents.insuranceCooperation
        },
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      })

      if (consentError) {
        throw consentError
      }

      // Success - call parent callback
      onAccept()
    } catch (err) {
      logger.error('Error saving consents:', err)
      setError('Failed to save your acknowledgments. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            Important Florida Insurance Disclosures
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Before we can assist with your insurance claim, Florida law requires us to provide
            these important disclosures. Please read and acknowledge each one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-6">
          {/* Public Adjuster Notice */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Public Adjuster Notice</h3>
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-sm text-gray-700">
                    <strong>IMPORTANT:</strong> ClaimGuardian is NOT a licensed public adjuster.
                    Under Florida Statute 626.854, only licensed public adjusters can negotiate
                    with insurance companies on your behalf for a fee. Our AI tools provide
                    information and document organization assistance only. We do not negotiate
                    settlements or represent you in dealings with your insurance company.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-8">
              <Checkbox
                id="public-adjuster"
                checked={consents.publicAdjuster}
                onCheckedChange={(checked: boolean) =>
                  setConsents({ ...consents, publicAdjuster: !!checked })
                }
              />
              <Label htmlFor="public-adjuster" className="text-sm cursor-pointer">
                I understand ClaimGuardian is not a public adjuster
              </Label>
            </div>
          </div>

          {/* Legal Advice Disclaimer */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Legal Advice Disclaimer</h3>
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-sm text-gray-700">
                    ClaimGuardian does not provide legal advice or legal representation.
                    The information and tools we provide are for educational and organizational
                    purposes only. For legal matters regarding your insurance claim, including
                    disputes or litigation, you should consult with a licensed Florida attorney
                    who specializes in insurance law.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-8">
              <Checkbox
                id="legal-advice"
                checked={consents.legalAdvice}
                onCheckedChange={(checked: boolean) =>
                  setConsents({ ...consents, legalAdvice: !!checked })
                }
              />
              <Label htmlFor="legal-advice" className="text-sm cursor-pointer">
                I understand this is not legal advice
              </Label>
            </div>
          </div>

          {/* Insurance Cooperation Notice */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Insurance Policy Cooperation</h3>
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-gray-700">
                    Your insurance policy requires you to cooperate with your insurance company's
                    investigation of your claim. Using ClaimGuardian does not change or eliminate
                    these obligations. You must continue to:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Respond to your insurer's reasonable requests</li>
                      <li>Provide requested documentation</li>
                      <li>Allow property inspections as required</li>
                      <li>Comply with all policy terms and conditions</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-8">
              <Checkbox
                id="insurance-cooperation"
                checked={consents.insuranceCooperation}
                onCheckedChange={(checked: boolean) =>
                  setConsents({ ...consents, insuranceCooperation: !!checked })
                }
              />
              <Label htmlFor="insurance-cooperation" className="text-sm cursor-pointer">
                I will continue to cooperate with my insurance company
              </Label>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAccept}
            disabled={!allConsentsAccepted || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Saving...' : 'I Understand & Accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
