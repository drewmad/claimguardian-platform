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

import { ChevronDown, ChevronRight } from 'lucide-react'
import React, { useState } from 'react'

import { cn } from '@/lib/utils'

interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function Accordion({ title, children, defaultOpen = false, className }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn("border border-gray-600 rounded-lg bg-gray-800", className)}>
      <button
        type="button"
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        tabIndex={0}
      >
        <span className="text-sm font-medium text-gray-200">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 py-3 border-t border-gray-600 bg-gray-900/50">
          <div className="text-sm text-gray-300">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}