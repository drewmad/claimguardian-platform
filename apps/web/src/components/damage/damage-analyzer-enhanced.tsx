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

import { Button } from '@claimguardian/ui'
import { Shield, AlertCircle, CheckCircle, FileText, DollarSign, AlertTriangle } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { PolicyUpload } from '@/components/policy/policy-upload'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePolicyData, getPolicyCoverageInfo } from '@/hooks/use-policy-data'
import { useSupabase } from '@/lib/supabase/client'



interface DamageAnalyzerEnhancedProps {
  propertyId: string
  damageType: string
  damageDescription: string
  estimatedValue: number
  images?: string[]
  onAnalysisComplete?: (analysis: CoverageAnalysis) => void
}

interface CoverageAnalysis {
  isCovered: boolean
  applicableCoverages: Array<{
    coverageType: string
    limit: number
    deductible: number
    isApplicable: boolean
    explanation: string
  }>
  exclusions: string[]
  deductibles: {
    standard?: number
    hurricane?: string
    flood?: number
  }
  estimatedPayout: number
  nextSteps: string[]
  warnings: string[]
  recommendations: string[]
}

export function DamageAnalyzerEnhanced({
  propertyId,
  damageType,
  damageDescription,
  estimatedValue,
  images = [],
  onAnalysisComplete
}: DamageAnalyzerEnhancedProps) {
  const { supabase } = useSupabase()
  const { activePolicy, loading: policyLoading, hasPolicies, refetch: refetchPolicies } = usePolicyData(propertyId)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<CoverageAnalysis | null>(null)
  const [showPolicyUpload, setShowPolicyUpload] = useState(false)

  const analyzeDamageWithPolicy = async () => {
    if (!activePolicy) {
      toast.error('No active policy found. Please upload your insurance policy first.')
      setShowPolicyUpload(true)
      return
    }

    setAnalyzing(true)
    try {
      const { data, error } = await supabase.functions.invoke('analyze-damage-with-policy', {
        body: {
          propertyId,
          damageDescription,
          damageType,
          images,
          estimatedValue
        }
      })

      if (error) throw error

      setAnalysis(data.coverageAnalysis)

      if (onAnalysisComplete) {
        onAnalysisComplete(data)
      }

      toast.success('Coverage analysis complete')
    } catch (error) {
      logger.error('Analysis error:', error)
      toast.error('Failed to analyze coverage')
    } finally {
      setAnalyzing(false)
    }
  }

  const policyInfo = activePolicy ? getPolicyCoverageInfo(activePolicy) : null

  if (showPolicyUpload || (!hasPolicies && !policyLoading)) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Policy Required for Coverage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-6">
              To analyze how your damage is covered, we need your insurance policy on file.
            </p>
            <PolicyUpload
              propertyId={propertyId}
              onUploadComplete={() => {
                setShowPolicyUpload(false)
                refetchPolicies()
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Policy Status */}
      {activePolicy && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Active Insurance Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400">Carrier</p>
                <p className="text-white font-medium">{activePolicy.carrier_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Policy Number</p>
                <p className="text-white font-medium">{activePolicy.policy_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Dwelling Coverage</p>
                <p className="text-white font-medium">{policyInfo?.dwelling}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {policyInfo?.isActive && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Active Coverage
                </Badge>
              )}
              {policyInfo?.hasFloodCoverage && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Flood Coverage
                </Badge>
              )}
              {policyInfo?.hasSinkholeCovetage && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Sinkhole Coverage
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Damage Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Damage Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Damage Type</p>
            <p className="text-white font-medium">{damageType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Description</p>
            <p className="text-white">{damageDescription}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Estimated Repair Cost</p>
            <p className="text-2xl font-bold text-white">${estimatedValue.toLocaleString()}</p>
          </div>

          <Button
            onClick={analyzeDamageWithPolicy}
            disabled={analyzing || !activePolicy}
            className="w-full bg-cyan-500 hover:bg-cyan-600"
          >
            {analyzing ? 'Analyzing Coverage...' : 'Analyze Policy Coverage'}
          </Button>
        </CardContent>
      </Card>

      {/* Coverage Analysis Results */}
      {analysis && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Coverage Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coverage Status */}
            <div className={`p-4 rounded-lg border ${
              analysis.isCovered
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {analysis.isCovered ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-semibold text-lg ${
                  analysis.isCovered ? 'text-green-400' : 'text-red-400'
                }`}>
                  {analysis.isCovered ? 'Damage is Covered' : 'Damage Not Covered'}
                </span>
              </div>
            </div>

            {/* Applicable Coverages */}
            {analysis.applicableCoverages.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Applicable Coverages</h4>
                <div className="space-y-3">
                  {analysis.applicableCoverages.map((coverage, idx) => (
                    <div key={idx} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-white font-medium">{coverage.coverageType}</span>
                        {coverage.isApplicable && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{coverage.explanation}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-300">
                          Limit: ${coverage.limit.toLocaleString()}
                        </span>
                        <span className="text-gray-300">
                          Deductible: ${coverage.deductible.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Payout */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Estimated Insurance Payout</p>
                  <p className="text-3xl font-bold text-cyan-400">
                    ${analysis.estimatedPayout.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    After ${analysis.deductibles.standard?.toLocaleString() || 0} deductible
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
              <div>
                <h4 className="text-orange-400 font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Important Warnings
                </h4>
                <ul className="space-y-2">
                  {analysis.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {analysis.nextSteps.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Recommended Next Steps</h4>
                <ol className="space-y-2">
                  {analysis.nextSteps.map((step, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-cyan-400 font-medium">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Exclusions */}
            {analysis.exclusions.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">Policy Exclusions</h4>
                <ul className="space-y-1">
                  {analysis.exclusions.map((exclusion, idx) => (
                    <li key={idx} className="text-sm text-gray-300">• {exclusion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
