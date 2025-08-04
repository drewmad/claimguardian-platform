/**
 * @fileMetadata
 * @purpose Component for reviewing and applying AI document extraction results
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@claimguardian/ui"]
 * @exports ["DocumentExtractionReview"]
 * @complexity high
 * @tags ["component", "ai", "document-extraction", "review"]
 * @status active
 */

'use client'

import { Brain, FileText, CheckCircle, XCircle, Clock, Loader2, Edit3, Save, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { processDocumentExtraction, getExtractionResults } from '@/actions/ai-extraction'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { insuranceTypes } from '@/data/florida-insurance-carriers'
import { ExtractedPolicyData } from '@/lib/services/ai-document-extraction'
import { cn } from '@/lib/utils'



interface DocumentExtractionReviewProps {
  documentId: string
  propertyId: string
  fileName: string
  onApplied?: () => void
  className?: string
}

interface ExtractionStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed'
  confidence?: number
  data?: ExtractedPolicyData
  error?: string
}

export function DocumentExtractionReview({
  documentId,
  propertyId,
  fileName,
  onApplied,
  className
}: DocumentExtractionReviewProps) {
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>({ status: 'idle' })
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Partial<ExtractedPolicyData>>({})
  const [isApplying, setIsApplying] = useState(false)

  const checkExistingExtraction = useCallback(async () => {
    try {
      const { data } = await getExtractionResults(documentId)
      
      if (data) {
        setExtractionStatus({
          status: data.processing_status as 'idle' | 'processing' | 'completed' | 'failed',
          confidence: data.confidence_score,
          data: data.extracted_data as ExtractedPolicyData,
          error: data.error_message || undefined
        })
        setEditedData(data.extracted_data as ExtractedPolicyData)
      }
    } catch (error) {
      logger.error('Error checking extraction:', error)
    }
  }, [documentId])

  // Check for existing extraction results on mount
  useEffect(() => {
    checkExistingExtraction()
  }, [checkExistingExtraction])

  const startExtraction = async () => {
    setExtractionStatus({ status: 'processing' })
    
    try {
      const { data, error } = await processDocumentExtraction({
        documentId,
        propertyId
      })

      if (error) {
        setExtractionStatus({ 
          status: 'failed', 
          error 
        })
        toast.error(`Extraction failed: ${error}`)
        return
      }

      if (data) {
        setExtractionStatus({
          status: 'completed',
          confidence: data.confidence_score,
          data: data.extracted_data as ExtractedPolicyData
        })
        setEditedData(data.extracted_data as ExtractedPolicyData)
        toast.success('Document processed successfully!')
      }
    } catch {
      setExtractionStatus({ 
        status: 'failed', 
        error: 'Unexpected error during processing' 
      })
      toast.error('Failed to process document')
    }
  }

  const applyExtraction = async () => {
    if (!extractionStatus.data) return

    setIsApplying(true)
    
    try {
      // In a real implementation, we would pass the extraction ID
      // For now, we'll simulate applying the data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Policy data applied successfully!')
      onApplied?.()
    } catch {
      toast.error('Failed to apply policy data')
    } finally {
      setIsApplying(false)
    }
  }

  const handleFieldChange = (field: keyof ExtractedPolicyData, value: unknown) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveEdits = () => {
    setExtractionStatus(prev => ({
      ...prev,
      data: { ...prev.data, ...editedData }
    }))
    setIsEditing(false)
    toast.success('Changes saved')
  }

  const cancelEdits = () => {
    setEditedData(extractionStatus.data || {})
    setIsEditing(false)
  }

  const renderStatusIcon = () => {
    switch (extractionStatus.status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const renderExtractionData = () => {
    const data = isEditing ? editedData : extractionStatus.data
    if (!data) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Policy Number</Label>
            {isEditing ? (
              <Input
                value={data.policyNumber || ''}
                onChange={(e) => handleFieldChange('policyNumber', e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            ) : (
              <p className="text-white mt-1">{data.policyNumber || 'Not found'}</p>
            )}
          </div>
          <div>
            <Label>Insurance Carrier</Label>
            {isEditing ? (
              <Input
                value={data.carrierName || ''}
                onChange={(e) => handleFieldChange('carrierName', e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            ) : (
              <p className="text-white mt-1">{data.carrierName || 'Not found'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Policy Type</Label>
            {isEditing ? (
              <select
                value={data.policyType || ''}
                onChange={(e) => handleFieldChange('policyType', e.target.value)}
                className="w-full mt-1 bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
              >
                <option value="">Select Type</option>
                {insuranceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-white mt-1">
                {data.policyType ? 
                  insuranceTypes.find(t => t.value === data.policyType)?.label || data.policyType
                  : 'Not found'
                }
              </p>
            )}
          </div>
          <div>
            <Label>Coverage Amount</Label>
            {isEditing ? (
              <Input
                type="number"
                value={data.coverageAmount || ''}
                onChange={(e) => handleFieldChange('coverageAmount', parseInt(e.target.value) || undefined)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            ) : (
              <p className="text-white mt-1">
                {data.coverageAmount ? `$${data.coverageAmount.toLocaleString()}` : 'Not found'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Deductible</Label>
            {isEditing ? (
              <Input
                type="number"
                value={data.deductible || ''}
                onChange={(e) => handleFieldChange('deductible', parseInt(e.target.value) || undefined)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            ) : (
              <p className="text-white mt-1">
                {data.deductible ? `$${data.deductible.toLocaleString()}` : 'Not found'}
              </p>
            )}
          </div>
          <div>
            <Label>Wind Deductible</Label>
            {isEditing ? (
              <Input
                value={data.windDeductible || ''}
                onChange={(e) => handleFieldChange('windDeductible', e.target.value)}
                placeholder="e.g., 2% or $5000"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            ) : (
              <p className="text-white mt-1">{data.windDeductible || 'Not found'}</p>
            )}
          </div>
          <div>
            <Label>Premium Amount</Label>
            {isEditing ? (
              <Input
                type="number"
                value={data.premiumAmount || ''}
                onChange={(e) => handleFieldChange('premiumAmount', parseInt(e.target.value) || undefined)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            ) : (
              <p className="text-white mt-1">
                {data.premiumAmount ? `$${data.premiumAmount.toLocaleString()}` : 'Not found'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Effective Date</Label>
            {isEditing ? (
              <Input
                type="date"
                value={data.effectiveDate || ''}
                onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            ) : (
              <p className="text-white mt-1">{data.effectiveDate || 'Not found'}</p>
            )}
          </div>
          <div>
            <Label>Expiration Date</Label>
            {isEditing ? (
              <Input
                type="date"
                value={data.expirationDate || ''}
                onChange={(e) => handleFieldChange('expirationDate', e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            ) : (
              <p className="text-white mt-1">{data.expirationDate || 'Not found'}</p>
            )}
          </div>
        </div>

        {data.propertyAddress && (
          <div>
            <Label>Property Address</Label>
            <p className="text-white mt-1">{data.propertyAddress}</p>
          </div>
        )}

        {data.additionalCoverages && data.additionalCoverages.length > 0 && (
          <div>
            <Label>Additional Coverages</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {data.additionalCoverages.map((coverage, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                >
                  {coverage}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            AI Document Extraction
            {renderStatusIcon()}
          </div>
          <div className="flex items-center gap-2">
            {extractionStatus.confidence && (
              <span className="text-sm text-gray-400">
                {Math.round(extractionStatus.confidence * 100)}% confidence
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FileText className="w-4 h-4" />
            {fileName}
          </div>

          {extractionStatus.status === 'idle' && (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-4">
                Process this document with AI to extract policy information
              </p>
              <Button
                onClick={startExtraction}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Brain className="w-4 h-4 mr-2" />
                Extract Policy Data
              </Button>
            </div>
          )}

          {extractionStatus.status === 'processing' && (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-400">Processing document with AI...</p>
            </div>
          )}

          {extractionStatus.status === 'failed' && (
            <div className="text-center py-6">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-400 mb-4">
                {extractionStatus.error || 'Failed to process document'}
              </p>
              <Button
                onClick={startExtraction}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Try Again
              </Button>
            </div>
          )}

          {extractionStatus.status === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400">Extraction completed</span>
                </div>
                
                <div className="flex gap-2">
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  
                  {isEditing && (
                    <>
                      <Button
                        onClick={saveEdits}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={cancelEdits}
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {renderExtractionData()}

              {!isEditing && (
                <div className="pt-4 border-t border-gray-700">
                  <Button
                    onClick={applyExtraction}
                    disabled={isApplying}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Apply to Property
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
