/**
 * @fileMetadata
 * @purpose Generic content modal for displaying various information
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store"]
 * @exports ["ContentModal"]
 * @complexity low
 * @tags ["modal", "content", "generic"]
 * @status active
 */
'use client'

import { X } from 'lucide-react'
import { useModalStore } from '@/stores/modal-store'

export function ContentModal() {
  const { activeModal, modalData, closeModal } = useModalStore()

  if (activeModal !== 'content' || !modalData) return null

  const { title, content } = modalData

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      
      <div className="relative bg-slate-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-5rem)]">
          {content?.description && (
            <p className="text-slate-300 mb-4">{content.description}</p>
          )}
          
          {content?.benefits && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Benefits</h3>
              <ul className="space-y-2">
                {content.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Add more content types as needed */}
          {content?.sections && content.sections.map((section: any, index: number) => (
            <div key={index} className="mt-6">
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-slate-300">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}