'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@claimguardian/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { toast } from 'sonner'
import { processPDF } from '@/lib/ai/pdf-processor'

interface PolicyUploadProps {
  propertyId: string
  onUploadComplete?: (documentId: string) => void
}

interface UploadStatus {
  stage: 'idle' | 'uploading' | 'processing' | 'extracting' | 'complete' | 'error'
  progress: number
  message: string
  error?: string
}

export function PolicyUpload({ propertyId, onUploadComplete }: PolicyUploadProps) {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  })
  const [uploadedDocument, setUploadedDocument] = useState<{ id: string; carrier_name?: string; policy_number?: string; effective_date?: string; expiration_date?: string } | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validate file
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    try {
      // Stage 1: Upload file
      setUploadStatus({
        stage: 'uploading',
        progress: 20,
        message: 'Uploading policy document...'
      })

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${propertyId}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('policy-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Stage 2: Process PDF
      setUploadStatus({
        stage: 'processing',
        progress: 40,
        message: 'Processing PDF content...'
      })

      const pdfContent = await processPDF(file)

      // Stage 3: Create database record
      const { data: document, error: dbError } = await supabase
        .from('policy_documents_extended')
        .insert({
          user_id: user.id,
          property_id: propertyId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: fileName,
          extraction_status: 'pending'
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUploadedDocument(document)

      // Stage 4: Extract data with AI
      setUploadStatus({
        stage: 'extracting',
        progress: 60,
        message: 'Analyzing policy with AI...'
      })

      const { error: extractError } = await supabase.functions.invoke(
        'extract-policy-data',
        {
          body: {
            documentId: document.id,
            fileContent: pdfContent.text,
            fileName: file.name
          }
        }
      )

      if (extractError) throw extractError

      // Stage 5: Complete
      setUploadStatus({
        stage: 'complete',
        progress: 100,
        message: 'Policy uploaded and analyzed successfully!'
      })

      toast.success('Policy document uploaded successfully')
      
      if (onUploadComplete) {
        onUploadComplete(document.id)
      }

      // Poll for extraction completion
      pollExtractionStatus(document.id)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus({
        stage: 'error',
        progress: 0,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      toast.error('Failed to upload policy document')
    }
  }, [user, propertyId, supabase, onUploadComplete])

  const pollExtractionStatus = async (documentId: string) => {
    const maxAttempts = 30 // 30 seconds timeout
    let attempts = 0

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('policy_documents_extended')
        .select('extraction_status, extracted_data')
        .eq('id', documentId)
        .single()

      if (error || !data) return

      if (data.extraction_status === 'completed') {
        setUploadStatus({
          stage: 'complete',
          progress: 100,
          message: 'Policy analysis complete!'
        })
        toast.success('Policy data extracted successfully')
        return
      }

      if (data.extraction_status === 'failed') {
        setUploadStatus({
          stage: 'error',
          progress: 0,
          message: 'AI extraction failed',
          error: 'Failed to extract policy data'
        })
        return
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 1000)
      }
    }

    setTimeout(checkStatus, 1000)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: uploadStatus.stage !== 'idle' && uploadStatus.stage !== 'complete' && uploadStatus.stage !== 'error'
  })

  const resetUpload = () => {
    setUploadStatus({
      stage: 'idle',
      progress: 0,
      message: ''
    })
    setUploadedDocument(null)
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Upload Insurance Policy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploadStatus.stage === 'idle' || uploadStatus.stage === 'error' ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-cyan-400 bg-cyan-500/10' 
                : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">
              {isDragActive ? 'Drop your policy here' : 'Drag & drop your policy document'}
            </p>
            <p className="text-sm text-gray-400">
              or click to browse (PDF only, max 10MB)
            </p>
            {uploadStatus.stage === 'error' && (
              <p className="text-red-400 text-sm mt-4">
                {uploadStatus.error}
              </p>
            )}
          </div>
        ) : uploadStatus.stage === 'complete' ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Policy Uploaded Successfully!</p>
            <p className="text-gray-400 text-sm mb-4">
              Your policy has been analyzed and data extracted
            </p>
            {uploadedDocument && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-gray-300">
                  <span className="font-medium">File:</span> {uploadedDocument.file_name}
                </p>
                {uploadedDocument.carrier_name && (
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Carrier:</span> {uploadedDocument.carrier_name}
                  </p>
                )}
                {uploadedDocument.policy_number && (
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Policy #:</span> {uploadedDocument.policy_number}
                  </p>
                )}
              </div>
            )}
            <Button
              onClick={resetUpload}
              variant="secondary"
              className="border-gray-600 text-gray-300"
            >
              Upload Another Policy
            </Button>
          </div>
        ) : (
          <div className="py-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="text-white font-medium">{uploadStatus.message}</span>
              </div>
              <span className="text-sm text-gray-400">{uploadStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadStatus.progress}%` }}
              />
            </div>
            <div className="mt-6 space-y-2">
              {['uploading', 'processing', 'extracting'].map((stage) => (
                <div key={stage} className="flex items-center gap-2">
                  {uploadStatus.stage === stage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : uploadStatus.progress > getStageProgress(stage) ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                  <span className={`text-sm ${
                    uploadStatus.stage === stage 
                      ? 'text-white' 
                      : uploadStatus.progress > getStageProgress(stage)
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}>
                    {getStageLabel(stage)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getStageProgress(stage: string): number {
  switch (stage) {
    case 'uploading': return 20
    case 'processing': return 40
    case 'extracting': return 60
    default: return 0
  }
}

function getStageLabel(stage: string): string {
  switch (stage) {
    case 'uploading': return 'Uploading document'
    case 'processing': return 'Processing PDF content'
    case 'extracting': return 'Extracting policy information with AI'
    default: return stage
  }
}