'use client'

import { useState, useRef } from 'react'
import { FileText, Plus, UploadCloud, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { uploadLegalDocument } from '@/actions/legal'
import { toast } from 'sonner'

const legalDocs = {
  'terms-of-service': [
    { id: 1, title: 'Terms of Service', version: '2.3', lastUpdated: '2024-01-10', status: 'published' },
  ],
  'privacy-policy': [
    { id: 2, title: 'Privacy Policy', version: '3.1', lastUpdated: '2024-01-08', status: 'published' },
  ],
  'ai-use-agreement': [
    { id: 3, title: 'AI Use Agreement', version: '1.2', lastUpdated: '2024-01-05', status: 'draft' },
  ]
}

function UploadDocumentModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if(fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile) {
      toast.error('Please select a file to upload.')
      return
    }
    const formData = new FormData(event.currentTarget)
    formData.set('file', selectedFile)
    
    const result = await uploadLegalDocument(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Document uploaded successfully!')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <form ref={formRef} onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg">
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
          <CardDescription>Upload a new version of a legal document.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="docType">Document Type</Label>
            <Select name="docType" required>
              <SelectTrigger id="docType">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terms-of-service">Terms of Service</SelectItem>
                <SelectItem value="privacy-policy">Privacy Policy</SelectItem>
                <SelectItem value="ai-use-agreement">AI Use Agreement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="version">Version</Label>
            <Input id="version" name="version" placeholder="e.g., 2.4" required />
          </div>
          <div>
            <Label>File</Label>
            {selectedFile ? (
              <div className="flex items-center justify-between p-3 mt-1 bg-slate-700 rounded-md">
                <div className="flex items-center gap-2 text-sm text-white">
                  <Paperclip className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={removeSelectedFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-400">
                    <Label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <Input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".md" />
                    </Label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">Markdown (.md) files only</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Upload Document</Button>
          </div>
        </CardContent>
      </form>
    </div>
  )
}

export function LegalDocumentsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <UploadDocumentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Legal Documents</h2>
            <p className="text-gray-400">Manage terms, privacy policy, and other legal documents</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </div>

        <Tabs defaultValue="terms-of-service">
          <TabsList>
            <TabsTrigger value="terms-of-service">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy-policy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="ai-use-agreement">AI Use Agreement</TabsTrigger>
          </TabsList>
          {Object.entries(legalDocs).map(([docType, docs]) => (
            <TabsContent key={docType} value={docType}>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {docs.map((doc) => (
                      <div key={doc.id} className="p-4 bg-slate-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <FileText className="h-10 w-10 text-blue-500 bg-blue-500/10 rounded-lg p-2" />
                            <div>
                              <h4 className="font-medium text-white">{doc.title}</h4>
                              <p className="text-sm text-gray-400">Version {doc.version} • Last updated {doc.lastUpdated}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={doc.status === 'published' ? 'secondary' : 'outline'}>
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  )
}