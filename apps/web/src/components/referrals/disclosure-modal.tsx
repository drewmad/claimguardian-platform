/**
 * @fileMetadata
 * @owner @revenue-team
 * @purpose "FTC-compliant referral disclosure modal with user consent tracking"
 * @dependencies ["@claimguardian/ui", "react", "lucide-react"]
 * @status stable
 * @ai-integration none
 * @insurance-context referrals
 */

'use client'

import { useState } from 'react'
import { AlertTriangle, Info, X, ExternalLink, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ReferralProvider {
  id: string
  name: string
  type: 'attorney' | 'broker' | 'contractor'
  commission?: string
  rating?: number
  reviewCount?: number
}

interface ReferralDisclosureModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (provider: ReferralProvider) => void
  providers: ReferralProvider[]
  type: 'attorney' | 'broker' | 'contractor'
}

export function ReferralDisclosureModal({
  isOpen,
  onClose,
  onAccept,
  providers,
  type
}: ReferralDisclosureModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<ReferralProvider | null>(null)
  const [disclosureAccepted, setDisclosureAccepted] = useState(false)
  const [understandCommission, setUnderstandCommission] = useState(false)

  const handleAccept = () => {
    if (selectedProvider && disclosureAccepted && understandCommission) {
      onAccept(selectedProvider)
      onClose()
    }
  }

  const getProviderTypeLabel = () => {
    switch (type) {
      case 'attorney':
        return 'Legal Professional'
      case 'broker':
        return 'Insurance Broker'
      case 'contractor':
        return 'Service Contractor'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            Choose Your {getProviderTypeLabel()}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Select from multiple independent providers. We are not affiliated with any of them.
          </DialogDescription>
        </DialogHeader>

        {/* FTC Disclosure Banner */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-yellow-300">
                Important Disclosure (FTC Required)
              </p>
              <p className="text-sm text-gray-300">
                ClaimGuardian may receive a referral fee if you choose one of these services. 
                This does not affect your cost or our recommendations. We are completely independent 
                and not affiliated with any insurance company. You are free to choose any provider, 
                including those not listed here.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Options */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Available Providers (Sorted by Rating)
          </h3>
          
          {providers.map((provider) => (
            <Card 
              key={provider.id}
              className={`bg-gray-800 border-gray-700 cursor-pointer transition-all ${
                selectedProvider?.id === provider.id 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'hover:border-gray-600'
              }`}
              onClick={() => setSelectedProvider(provider)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">
                      {provider.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {provider.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm text-gray-300">
                            {provider.rating}/5
                          </span>
                          {provider.reviewCount && (
                            <span className="text-sm text-gray-500">
                              ({provider.reviewCount} reviews)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.commission && (
                      <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                        Referral fee applies
                      </Badge>
                    )}
                    {selectedProvider?.id === provider.id && (
                      <Badge className="bg-blue-600 text-white">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-3 border-t border-gray-700 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={disclosureAccepted}
              onCheckedChange={(checked) => setDisclosureAccepted(checked as boolean)}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-300">
              I understand that ClaimGuardian may receive a referral fee from the provider I choose, 
              and this does not affect the cost of services to me.
            </span>
          </label>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={understandCommission}
              onCheckedChange={(checked) => setUnderstandCommission(checked as boolean)}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-300">
              I acknowledge that ClaimGuardian is not affiliated with any of these providers and 
              I am free to choose any provider, including those not listed here.
            </span>
          </label>
        </div>

        {/* Alternative Options */}
        <div className="bg-gray-800/50 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-1">
                Other Options Available
              </p>
              <p className="text-sm text-gray-400">
                You can always find your own {type} independently. Try searching online, 
                asking friends for recommendations, or checking with your local bar association 
                (for attorneys) or state insurance department (for brokers).
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Find My Own Provider
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!selectedProvider || !disclosureAccepted || !understandCommission}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue with {selectedProvider?.name || 'Selected Provider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}