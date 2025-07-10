'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname()

  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-400 ${className}`}>
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-white transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          
          {item.href && item.href !== pathname ? (
            <Link 
              href={item.href}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-white flex items-center gap-1">
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

// AI-specific breadcrumb helper
export function AIBreadcrumb({ 
  section, 
  page, 
  className = '' 
}: { 
  section: string
  page: string
  className?: string 
}) {
  const items: BreadcrumbItem[] = [
    { label: 'AI Tools', href: '/ai-augmented' },
    { label: section },
    { label: page }
  ]

  return <Breadcrumb items={items} className={className} />
}