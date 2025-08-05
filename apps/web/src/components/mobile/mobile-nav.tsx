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

import { motion, AnimatePresence } from 'framer-motion'
import { Home, Building, FileText, Shield, Menu, X, ChevronRight, Bot } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button, Modal } from '@claimguardian/ui'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Property', href: '/dashboard/property', icon: Building },
  { label: 'Claims', href: '/dashboard/claims', icon: FileText, badge: 2 },
  { label: 'Insurance', href: '/dashboard/policies', icon: Shield },
]

const moreNavItems: NavItem[] = [
  { label: 'AI Tools', href: '/ai-tools', icon: Bot },
  { label: 'Maintenance', href: '/dashboard/maintenance', icon: Building },
  { label: 'Community', href: '/dashboard/community', icon: Home },
  { label: 'Settings', href: '/dashboard/settings', icon: Shield },
]

export function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    
  }, [pathname])

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-900 border-t border-gray-800 safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center relative",
                  "transition-all duration-200 active:scale-95",
                  isActive ? "text-blue-500" : "text-gray-400"
                )}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className="text-xs mt-1">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-1 right-4 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500"
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
              </Link>
            )
          })}
          
          {/* More Menu */}
          <button 
            className="flex flex-col items-center justify-center text-gray-400"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs mt-1">More</span>
          </button>
          
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="More Options"
            className="max-w-sm"
          >
            <div className="pb-4">
              <div className="space-y-1">
                {moreNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname.startsWith(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg",
                        "transition-all duration-200 active:scale-95",
                        isActive 
                          ? "bg-blue-500/10 text-blue-500" 
                          : "text-gray-300 active:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </Modal>
        </div>
      </nav>

      {/* iOS-style Dynamic Island Notifications */}
      <AnimatePresence>
        {/* Notification component would go here */}
      </AnimatePresence>
    </>
  )
}

export function MobileHeader({ title, showBack = false }: { title: string; showBack?: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 md:hidden">
      <div className="flex items-center justify-between px-4 h-14 safe-area-top">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-gray-400"
          >
            <X className="w-5 h-5" />
          </Button>
        ) : (
          <div className="w-10" />
        )}
        
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        
        <div className="w-10" />
      </div>
    </header>
  )
}