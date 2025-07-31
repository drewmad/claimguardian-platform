/**
 * @fileMetadata
 * @purpose Admin layout wrapper component
 * @owner admin-team
 * @status active
 */
'use client'

import { AlertTriangle, Bug, Database, FileText, Home, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', icon: Home, label: 'Overview' },
    { href: '/admin/errors', icon: AlertTriangle, label: 'Error Logs' },
    { href: '/admin/compliance', icon: Shield, label: 'Compliance' },
    { href: '/debug-auth', icon: Bug, label: 'Debug Auth' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/database', icon: Database, label: 'Database' },
    { href: '/admin/legal', icon: FileText, label: 'Legal Docs' },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 min-h-screen p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}