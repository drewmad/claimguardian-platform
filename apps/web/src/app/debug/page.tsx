'use client'

import { FileText, Bug, TestTube, Settings, User, Key, Database, Shield } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const debugPages = [
  {
    title: 'Auth Testing',
    description: 'Test authentication flows and session management',
    href: '/debug/auth',
    icon: User,
    category: 'Auth'
  },
  {
    title: 'Signup Tests',
    description: 'Test various signup implementations',
    children: [
      { title: 'Basic Signup Test', href: '/debug/test-signup' },
      { title: 'Simple Signup Test', href: '/debug/test-signup-simple' },
      { title: 'Advanced Signup Test', href: '/debug/test-signup-advanced' },
      { title: 'Complete Signup Test', href: '/debug/test-signup-complete' },
      { title: 'Simple Signup Demo', href: '/debug/simple-signup-demo' }
    ],
    icon: TestTube,
    category: 'Auth'
  },
  {
    title: 'Login Test',
    description: 'Test login functionality',
    href: '/debug/test-login',
    icon: Key,
    category: 'Auth'
  },
  {
    title: 'Auth Test Complete',
    description: 'Complete authentication test suite',
    href: '/debug/auth-test-complete',
    icon: Shield,
    category: 'Auth'
  },
  {
    title: 'AI Features Test',
    description: 'Test AI functionality and features',
    href: '/debug/test-ai-features',
    icon: TestTube,
    category: 'AI'
  },
  {
    title: 'AI Complete Test',
    description: 'Complete AI test suite',
    href: '/debug/test-ai-complete',
    icon: TestTube,
    category: 'AI'
  },
  {
    title: 'System Test',
    description: 'Test system-wide functionality',
    href: '/debug/test-system',
    icon: Settings,
    category: 'System'
  },
  {
    title: 'Environment Debug',
    description: 'Debug environment variables and configuration',
    href: '/debug/env',
    icon: Database,
    category: 'System'
  }
]

const categoryColors = {
  Auth: 'bg-blue-900/20 border-blue-600/30 text-blue-300',
  AI: 'bg-purple-900/20 border-purple-600/30 text-purple-300',
  System: 'bg-green-900/20 border-green-600/30 text-green-300'
}

export default function DebugIndexPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-600/30 to-orange-600/20 backdrop-blur-md rounded-xl border border-white/10">
              <Bug className="h-8 w-8 text-red-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Debug & Testing Hub</h1>
              <p className="text-gray-400">Consolidated testing and debugging tools</p>
            </div>
          </div>
          <Badge className="bg-red-900/20 border-red-600/30 text-red-300">
            Development Only
          </Badge>
        </div>

        {/* Debug Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debugPages.map((page) => {
            const Icon = page.icon
            return (
              <Card key={page.title} className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 hover:border-gray-600/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-700/50 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-300" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{page.title}</CardTitle>
                        <Badge 
                          className={`text-xs mt-1 ${categoryColors[page.category as keyof typeof categoryColors]}`}
                        >
                          {page.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">{page.description}</p>
                  
                  {page.children ? (
                    <div className="space-y-2">
                      {page.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                        >
                          → {child.title}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      href={page.href}
                      className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
                    >
                      Open Test →
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Warning Notice */}
        <div className="mt-8">
          <Card className="bg-yellow-900/20 border-yellow-600/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <FileText className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-yellow-300 font-semibold">Development Environment Only</h3>
                  <p className="text-yellow-400/80 text-sm">
                    These debug tools are for development and testing purposes only. 
                    They should not be accessible in production environments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}