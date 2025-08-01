'use client'

import { X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'

interface LegalDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
}

export function LegalDocumentModal({ isOpen, onClose, title, content }: LegalDocumentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="prose prose-invert prose-a:text-blue-400 hover:prose-a:text-blue-300">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        <div className="p-6 border-t border-gray-700 text-right">
            <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
