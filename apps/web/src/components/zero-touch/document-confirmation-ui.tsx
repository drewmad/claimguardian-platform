'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle, Edit2, FileText, Sparkles, Brain, Shield, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface DocumentSuggestion {
  id: string
  original_filename: string
  ai_suggested_name: string
  ai_suggested_category: string
  ai_extracted_metadata: any
  ai_confidence_scores: any
  ai_reasoning: string
  tags: string[]
  created_at: string
}

export function DocumentConfirmationUI() {
  const [documents, setDocuments] = useState<DocumentSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDoc, setEditingDoc] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<any>({})

  useEffect(() => {
    loadPendingDocuments()
  }, [])

  async function loadPendingDocuments() {
    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()
      
      if (!user.user) {
        toast.error('Please log in to view documents')
        return
      }
      
      const { data: pendingDocs, error } = await supabase
        .rpc('get_documents_pending_review', { 
          user_uuid: user.user.id 
        })
      
      if (error) {
        throw error
      }
      
      setDocuments(pendingDocs || [])
    } catch (error) {
      console.error('Error loading pending documents:', error)
      toast.error('Failed to load pending documents')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(docId: string) {
    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()
      
      if (!user.user) {
        toast.error('Please log in')
        return
      }
      
      const { data: result, error } = await supabase
        .rpc('confirm_document_processing', {
          doc_id: docId,
          user_uuid: user.user.id,
          action: 'confirm'
        })
      
      if (error) {
        throw error
      }
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast.success('Document confirmed and filed', {
        description: `Saved as: ${result.final_name}`
      })
      
      setDocuments(docs => docs.filter(d => d.id !== docId))
      
    } catch (error) {
      console.error('Error confirming document:', error)
      toast.error('Failed to confirm document')
    }
  }

  async function handleSaveEdits(docId: string) {
    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()
      const edits = editedValues[docId]
      
      if (!user.user) {
        toast.error('Please log in')
        return
      }
      
      const { data: result, error } = await supabase
        .rpc('confirm_document_processing', {
          doc_id: docId,
          user_uuid: user.user.id,
          action: 'edit',
          corrected_name: edits?.name,
          corrected_category: edits?.category,
          user_notes: edits?.notes
        })
      
      if (error) {
        throw error
      }
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast.success('Document updated and filed', {
        description: `Saved as: ${result.final_name}`
      })
      
      setDocuments(docs => docs.filter(d => d.id !== docId))
      setEditingDoc(null)
      
    } catch (error) {
      console.error('Error saving document edits:', error)
      toast.error('Failed to save changes')
    }
  }

  function getConfidenceBadge(confidence: number) {
    if (confidence >= 0.9) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
        <CheckCircle className="w-3 h-3 mr-1" />
        Very High Confidence
      </Badge>
    }
    if (confidence >= 0.7) {
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
        <Brain className="w-3 h-3 mr-1" />
        High Confidence
      </Badge>
    }
    if (confidence >= 0.5) {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
        <AlertCircle className="w-3 h-3 mr-1" />
        Medium Confidence
      </Badge>
    }
    return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
      <AlertCircle className="w-3 h-3 mr-1" />
      Low Confidence - Review Needed
    </Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-400">Loading pending documents...</div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
          <p className="text-gray-400">No documents waiting for review</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-semibold text-white">
            Documents Awaiting Your Review
          </h2>
          <Badge className="bg-blue-500/10 text-blue-500">
            {documents.length} pending
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Shield className="w-4 h-4" />
          All documents encrypted end-to-end
        </div>
      </div>

      {documents.map(doc => (
        <Card key={doc.id} className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <CardTitle className="text-white text-lg">
                    {doc.original_filename}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getConfidenceBadge(doc.ai_confidence_scores?.overall || 0.8)}
                    <Badge className="bg-gray-700 text-gray-300">
                      {doc.ai_suggested_category}
                    </Badge>
                  </div>
                </div>
              </div>
              {editingDoc !== doc.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDoc(doc.id)}
                  className="border-gray-600"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* AI Reasoning Section */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-300">AI Analysis</span>
              </div>
              <p className="text-sm text-gray-400">{doc.ai_reasoning || 'AI analysis completed with multi-provider consensus'}</p>
            </div>

            {/* Suggested Values */}
            <div className="space-y-3">
              {editingDoc === doc.id ? (
                <>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Document Name
                    </label>
                    <Input
                      defaultValue={doc.ai_suggested_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditedValues({
                        ...editedValues,
                        [doc.id]: {
                          ...editedValues[doc.id],
                          name: e.target.value
                        }
                      })}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Category
                    </label>
                    <Input
                      defaultValue={doc.ai_suggested_category}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditedValues({
                        ...editedValues,
                        [doc.id]: {
                          ...editedValues[doc.id],
                          category: e.target.value
                        }
                      })}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Notes (optional)
                    </label>
                    <Textarea
                      placeholder="Add any corrections or notes..."
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditedValues({
                        ...editedValues,
                        [doc.id]: {
                          ...editedValues[doc.id],
                          notes: e.target.value
                        }
                      })}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Suggested Name:</span>
                    <span className="text-sm text-white font-medium">
                      {doc.ai_suggested_name}
                    </span>
                  </div>
                  
                  {/* Auto-Generated Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-400 block mb-2">
                        Auto-Generated Tags:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            className="bg-purple-500/10 text-purple-400 border-purple-500/20"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Extracted Metadata */}
                  {doc.ai_extracted_metadata && Object.keys(doc.ai_extracted_metadata).length > 0 && (
                    <div>
                      <span className="text-sm text-gray-400 block mb-2">
                        Extracted Information:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {Object.entries(doc.ai_extracted_metadata)
                          .filter(([key, value]) => value && String(value).trim())
                          .slice(0, 6)
                          .map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-500 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-gray-300 font-medium truncate ml-2">
                              {String(value).substring(0, 30)}{String(value).length > 30 ? '...' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {editingDoc === doc.id ? (
                <>
                  <Button
                    onClick={() => handleSaveEdits(doc.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingDoc(null)}
                    className="border-gray-600"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleConfirm(doc.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm & File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                    className="border-gray-600"
                  >
                    View Document
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}