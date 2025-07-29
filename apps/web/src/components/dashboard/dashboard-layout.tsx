/**
 * @fileMetadata
 * @purpose Dashboard layout wrapper with sidebar navigation
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["DashboardLayout"]
 * @complexity medium
 * @tags ["dashboard", "layout", "navigation"]
 * @status active
 */
'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, Building, Package, Shield, FileText, 
  Calendar, HardHat, Users, AlertTriangle, Settings, 
  Bell, Search, Menu, LogOut,
  Bot, Camera, FileSearch, Sparkles
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { SettingsModal } from '@/components/modals/settings-modal'
import { useSettingsModal } from '@/hooks/use-settings-modal'

interface DashboardLayoutProps {
  children: ReactNode
}

const navigationItems = [
  { id: 'home', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'property', label: 'My Home', icon: Building, href: '/dashboard/property' },
  { id: 'personal-property', label: 'Personal Property', icon: Package, href: '/dashboard/personal-property' },
  { id: 'insurance', label: 'Insurance', icon: Shield, href: '/dashboard/policies' },
  { id: 'claims', label: 'Claims', icon: FileText, href: '/dashboard/claims' },
  { id: 'maintenance', label: 'Maintenance Hub', icon: Calendar, href: '/dashboard/maintenance' },
  { id: 'contractors', label: 'Contractor Connect', icon: HardHat, href: '/dashboard/contractors' },
  { id: 'community', label: 'Community Pulse', icon: Users, href: '/dashboard/community' },
  { id: 'disaster', label: 'Disaster Hub', icon: AlertTriangle, href: '/dashboard/disaster' }
]

const aiFeatures = [
  { id: 'damage-analyzer', label: 'Damage Analyzer', icon: Camera, href: '/ai-augmented/damage-analyzer' },
  { id: 'policy-chat', label: 'Policy Advisor', icon: FileSearch, href: '/ai-augmented/policy-chat' },
  { id: 'inventory-scanner', label: 'Inventory Scanner', icon: Package, href: '/ai-augmented/inventory-scanner' },
  { id: '3d-model-generator', label: '3D Model Generator', icon: Package, href: '/ai-augmented/3d-model-generator' }
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [notifications] = useState(3)
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { isOpen: isSettingsOpen, openSettings, closeSettings } = useSettingsModal()

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
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="text-xl font-bold text-white">
                ClaimGuardian
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-400" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <button 
              onClick={() => openSettings('profile')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.user_metadata?.firstName || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
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
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 overflow-hidden bg-gray-800 border-r border-gray-700 sticky top-[57px] h-[calc(100vh-57px)]`}>
          <div className="p-4 space-y-6 overflow-y-auto h-full">
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
              
              {/* Settings Button */}
              <button
                onClick={() => {
                  openSettings('profile')
                  if (isMobile) setIsSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </button>
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
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </div>
  )
}