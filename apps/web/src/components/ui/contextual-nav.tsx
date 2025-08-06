/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Contextual navigation for switching between related insurance entities"
 * @dependencies ["react", "next", "lucide-react"]
 * @status stable
 */
'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Home, Shield, FileText, AlertTriangle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

interface NavItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface ContextualNavProps {
  currentItem: NavItem
  previousItem?: NavItem
  nextItem?: NavItem
  relatedItems?: {
    properties?: NavItem[]
    policies?: NavItem[]
    claims?: NavItem[]
    items?: NavItem[]
  }
  className?: string
}

export function ContextualNav({ 
  currentItem,
  previousItem,
  nextItem,
  relatedItems,
  className
}: ContextualNavProps) {
  const router = useRouter()

  return (
    <div className={cn('flex items-center justify-between py-3 px-4 bg-gray-800/50 rounded-lg border border-gray-700/50', className)}>
      {/* Previous/Next Navigation */}
      <div className="flex items-center gap-2">
        {previousItem && (
          <button
            onClick={() => router.push(previousItem.href)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            aria-label={`Previous: ${previousItem.label}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">Previous</span>
          </button>
        )}
        
        <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white">
          {currentItem.icon && <currentItem.icon className="w-4 h-4" />}
          <span>{currentItem.label}</span>
          {currentItem.badge && (
            <span className="ml-1 px-2 py-0.5 bg-blue-600 text-xs rounded-full">
              {currentItem.badge}
            </span>
          )}
        </div>
        
        {nextItem && (
          <button
            onClick={() => router.push(nextItem.href)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            aria-label={`Next: ${nextItem.label}`}
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Related Items Quick Access */}
      {relatedItems && (
        <div className="flex items-center gap-4">
          {relatedItems.properties && relatedItems.properties.length > 0 && (
            <RelatedItemsDropdown
              title="Properties"
              icon={Home}
              items={relatedItems.properties}
            />
          )}
          
          {relatedItems.policies && relatedItems.policies.length > 0 && (
            <RelatedItemsDropdown
              title="Policies"
              icon={Shield}
              items={relatedItems.policies}
            />
          )}
          
          {relatedItems.claims && relatedItems.claims.length > 0 && (
            <RelatedItemsDropdown
              title="Claims"
              icon={AlertTriangle}
              items={relatedItems.claims}
            />
          )}
          
          {relatedItems.items && relatedItems.items.length > 0 && (
            <RelatedItemsDropdown
              title="Items"
              icon={Package}
              items={relatedItems.items}
            />
          )}
        </div>
      )}
    </div>
  )
}

function RelatedItemsDropdown({ 
  title, 
  icon: Icon, 
  items 
}: { 
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[] 
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        aria-label={`Related ${title}`}
        aria-expanded={isOpen}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden md:inline">{title}</span>
        <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
          {items.length}
        </span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-400 px-2 py-1 mb-1">
                {title}
              </div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors text-left"
                >
                  {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-gray-700 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}