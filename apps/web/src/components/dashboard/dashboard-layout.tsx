/**
 * @fileMetadata
 * @purpose "Dashboard layout wrapper with sidebar navigation"
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["DashboardLayout"]
 * @complexity medium
 * @tags ["dashboard", "layout", "navigation"]
 * @status stable
 */
'use client'

import { 
  Home, Building, Package, Shield, FileText, 
  HardHat, Users, Cog, 
  Bell, Search, Menu, LogOut, User,
  Bot, Camera, FileSearch, Sparkles,
  ShieldCheck, Code, Siren, DollarSign, Wrench,
  CreditCard, MapPin, Clock, Brain, Cloud
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, ReactNode } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { useSettingsModal } from '@/hooks/use-settings-modal'
import { SettingsModal } from '@/components/modals/settings-modal'
import { AskGuardianChat, AskGuardianButton } from '@/components/ai/ask-guardian-chat'

interface DashboardLayoutProps {
  children: ReactNode
}

const navigationItems = [
  { id: 'home', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'property-map', label: 'Property Map', icon: MapPin, href: '/dashboard/property-map' },
  { id: 'property', label: 'My Home', icon: Building, href: '/dashboard/property' },
  { id: 'personal-property', label: 'Personal Property', icon: Package, href: '/dashboard/personal-property' },
  { id: 'insurance', label: 'Insurance', icon: Shield, href: '/dashboard/insurance' },
  { id: 'smart-policy-recommendations', label: 'Smart Policy Recommendations', icon: Brain, href: '/smart-policy-recommendations' },
  { id: 'claims', label: 'Claims', icon: FileText, href: '/dashboard/claims' },
  { id: 'deadline-guardian', label: 'Deadline Guardian', icon: Clock, href: '/dashboard/deadline-guardian' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, href: '/dashboard/maintenance' },
  { id: 'expenses', label: 'Expenses', icon: DollarSign, href: '/dashboard/expenses' },
  { id: 'warranty-watch', label: 'Warranty Watch', icon: ShieldCheck, href: '/dashboard/warranty-watch' },
  { id: 'contractors', label: 'Contractor Connect', icon: HardHat, href: '/dashboard/contractors' },
  { id: 'community', label: 'Community Pulse', icon: Users, href: '/dashboard/community' },
  { id: 'weather', label: 'Weather Intelligence', icon: Cloud, href: '/dashboard/weather' },
  { id: 'situation-room', label: 'Situation Room', icon: Siren, href: '/dashboard/situation-room' },
  { id: 'development', label: 'Development', icon: Code, href: '/dashboard/development' },
  { id: 'billing', label: 'Membership & Billing', icon: CreditCard, href: '/dashboard/billing' },
]

const adminFeatures = [
  { id: 'admin-dashboard', label: 'Admin Dashboard', icon: Cog, href: '/admin' }
]

const aiFeatures = [
  { id: 'damage-analyzer', label: 'Damage Analyzer', icon: Camera, href: '/ai-tools/damage-analyzer' },
  { id: 'policy-chat', label: 'Policy Advisor', icon: FileSearch, href: '/ai-tools/policy-chat' },
  { id: 'inventory-scanner', label: 'Inventory Scanner', icon: Package, href: '/ai-tools/inventory-scanner' },
  { id: '3d-model-generator', label: '3D Model Generator', icon: Package, href: '/ai-tools/3d-model-generator' }
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [notifications] = useState(3)
  const [isAskGuardianOpen, setIsAskGuardianOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { isOpen, openSettings, closeSettings } = useSettingsModal()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <img 
                src="/ClaimGuardian.png" 
                alt="ClaimGuardian Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-white hidden sm:block">
                ClaimGuardian
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3">
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors active:scale-95 hidden sm:block">
              <Search className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors active:scale-95 relative">
              <Bell className="w-5 h-5 text-gray-400" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <div className="h-6 w-px bg-gray-600 mx-2" />
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{user?.user_metadata?.firstName || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 overflow-hidden bg-gray-800 border-r border-gray-700 sticky top-[57px] h-[calc(100vh-57px)] flex flex-col`}>
          <div className="p-4 space-y-6 overflow-y-auto flex-1">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      if (isMobile) setIsSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* AI Features Section */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 px-4 mb-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Features</span>
              </div>
              <div className="space-y-1">
                {/* AI Tools Main Link */}
                <Link
                  href="/ai-tools"
                  onClick={() => {
                    if (isMobile) setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                    pathname === '/ai-tools'
                      ? 'bg-cyan-600/20 text-cyan-300'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>All AI Tools</span>
                </Link>
                
                {/* Individual AI Features */}
                {aiFeatures.map((feature) => {
                  const Icon = feature.icon
                  const isActive = pathname === feature.href
                  
                  return (
                    <Link
                      key={feature.id}
                      href={feature.href}
                      onClick={() => {
                        if (isMobile) setIsSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        isActive
                          ? 'bg-cyan-600/20 text-cyan-300'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{feature.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Admin Features Section */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 px-4 mb-2">
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
              </div>
              <div className="space-y-1">
                {/* AI Cost Tracking */}
                <Link
                  href="/admin/ai-costs"
                  onClick={() => {
                    if (isMobile) setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                    pathname === '/admin/ai-costs'
                      ? 'bg-red-600/20 text-red-300'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>AI Cost Tracking</span>
                </Link>
                
                {adminFeatures.map((feature) => {
                  const Icon = feature.icon
                  const isActive = pathname.startsWith(feature.href)
                  
                  return (
                    <Link
                      key={feature.id}
                      href={feature.href}
                      onClick={() => {
                        if (isMobile) setIsSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        isActive
                          ? 'bg-red-600/20 text-red-300'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{feature.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-700">
            {/* Settings Button */}
            <button
              onClick={() => {
                openSettings('profile')
                if (isMobile) setIsSidebarOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-gray-700 mb-3"
            >
              <Cog className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            
            {/* AI Toolkit Label */}
            <div className="px-4 py-2">
              <p className="text-xs text-gray-500 text-center">AI Toolkit</p>
              <p className="text-xs text-gray-600 text-center">Leverage powerful AI to protect, manage, and understand your assets.</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around h-16 z-50">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full pt-2 transition-colors ${
                  isActive ? 'text-blue-400' : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
      
      {/* Settings Modal */}
      <SettingsModal isOpen={isOpen} onClose={closeSettings} />
      
      {/* Ask Guardian AI Chat */}
      <AskGuardianChat 
        isOpen={isAskGuardianOpen}
        onClose={() => setIsAskGuardianOpen(false)}
        context={{
          propertyId: pathname.includes('/property/') ? pathname.split('/').pop() : undefined,
          policyId: pathname.includes('/policy/') ? pathname.split('/').pop() : undefined,
          claimId: pathname.includes('/claim/') ? pathname.split('/').pop() : undefined
        }}
      />
      
      {/* Ask Guardian Button */}
      {!isAskGuardianOpen && (
        <AskGuardianButton onClick={() => setIsAskGuardianOpen(true)} />
      )}
    </div>
  )
}
