/**
 * @fileMetadata
 * @purpose "Demo page for enhanced email verification components"
 * @owner auth-team
 * @dependencies ["react", "@/components/auth", "@/hooks"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["demo", "verification", "auth", "showcase"]
 * @status stable
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  CheckCircle, 
  Settings, 
  Eye,
  Zap,
  Shield,
  Clock,
  AlertTriangle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  EmailVerificationWizard,
  VerificationStatusCard
} from '@/components/auth/email-verification-enhanced'
import { 
  VerificationBanner, 
  VerificationSuccessBanner 
} from '@/components/auth/verification-banner'
import { useToast } from '@/components/notifications/toast-system'

export default function VerificationDemoPage() {
  const [demoState, setDemoState] = useState({
    showWizard: false,
    showBanner: false,
    showSuccess: false,
    bannerVariant: 'default' as 'default' | 'compact' | 'inline',
    userVerified: false,
    demoEmail: 'user@example.com'
  })

  const { success, info } = useToast()

  const handleWizardSuccess = () => {
    setDemoState(prev => ({ ...prev, showWizard: false, userVerified: true }))
    success('Demo verification completed!', {
      subtitle: 'This is just a demonstration'
    })
  }

  const mockUser = {
    email: demoState.demoEmail,
    email_confirmed_at: demoState.userVerified ? new Date().toISOString() : null
  }

  const demoComponents = [
    {
      id: 'wizard',
      title: 'Email Verification Wizard',
      description: 'Full-featured verification workflow with progress tracking',
      icon: Zap,
      color: 'bg-blue-600',
      demo: (
        <div className="space-y-4">
          <Button 
            onClick={() => setDemoState(prev => ({ ...prev, showWizard: true }))}
            disabled={demoState.showWizard}
          >
            <Mail className="w-4 h-4 mr-2" />
            Show Verification Wizard
          </Button>
          
          {demoState.showWizard && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <EmailVerificationWizard
                initialEmail={demoState.demoEmail}
                verificationType="signup"
                onSuccess={handleWizardSuccess}
                onCancel={() => setDemoState(prev => ({ ...prev, showWizard: false }))}
                showSkipOption={true}
              />
            </motion.div>
          )}
        </div>
      )
    },
    {
      id: 'banner',
      title: 'Verification Banner',
      description: 'Contextual banner for unverified users with resend functionality',
      icon: AlertTriangle,
      color: 'bg-orange-600',
      demo: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              size="sm"
              variant={demoState.bannerVariant === 'default' ? 'default' : 'outline'}
              onClick={() => setDemoState(prev => ({ 
                ...prev, 
                bannerVariant: 'default',
                showBanner: true,
                userVerified: false 
              }))}
            >
              Default
            </Button>
            <Button 
              size="sm"
              variant={demoState.bannerVariant === 'compact' ? 'default' : 'outline'}
              onClick={() => setDemoState(prev => ({ 
                ...prev, 
                bannerVariant: 'compact',
                showBanner: true,
                userVerified: false 
              }))}
            >
              Compact
            </Button>
            <Button 
              size="sm"
              variant={demoState.bannerVariant === 'inline' ? 'default' : 'outline'}
              onClick={() => setDemoState(prev => ({ 
                ...prev, 
                bannerVariant: 'inline',
                showBanner: true,
                userVerified: false 
              }))}
            >
              Inline
            </Button>
          </div>

          {demoState.showBanner && !demoState.userVerified && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <VerificationBanner
                variant={demoState.bannerVariant}
                onVerified={() => setDemoState(prev => ({ ...prev, userVerified: true }))}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'status-card',
      title: 'Status Card',
      description: 'Compact verification status display for user profiles',
      icon: Shield,
      color: 'bg-green-600',
      demo: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              size="sm"
              onClick={() => setDemoState(prev => ({ ...prev, userVerified: false }))}
            >
              Unverified User
            </Button>
            <Button 
              size="sm"
              onClick={() => setDemoState(prev => ({ ...prev, userVerified: true }))}
            >
              Verified User
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <VerificationStatusCard
              user={mockUser}
              onRequestVerification={() => {
                info('Verification requested', {
                  subtitle: 'This would normally open the verification wizard'
                })
              }}
            />
          </div>
        </div>
      )
    },
    {
      id: 'success-banner',
      title: 'Success Banner',
      description: 'Celebration banner shown after successful verification',
      icon: CheckCircle,
      color: 'bg-emerald-600',
      demo: (
        <div className="space-y-4">
          <Button 
            onClick={() => setDemoState(prev => ({ ...prev, showSuccess: !prev.showSuccess }))}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Toggle Success Banner
          </Button>
          
          {demoState.showSuccess && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <VerificationSuccessBanner
                onDismiss={() => setDemoState(prev => ({ ...prev, showSuccess: false }))}
              />
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-6">
            Enhanced Email Verification Demo
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive demonstration of ClaimGuardian's enhanced email verification system 
            with improved UX, toast notifications, and better error handling.
          </p>
          
          <div className="flex justify-center mt-6">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-2">
              Task 13: Auth Flow - Email Verification Enhancement
            </Badge>
          </div>
        </motion.div>

        {/* Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">
                New Features & Improvements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">Rich Notifications</h3>
                  <p className="text-gray-300 text-sm">
                    Integrated with toast system for better user feedback
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">Smart Cooldowns</h3>
                  <p className="text-gray-300 text-sm">
                    Rate limiting with visual countdown and progress bars
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">Auto-Polling</h3>
                  <p className="text-gray-300 text-sm">
                    Automatic status checking for seamless verification
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">Better Errors</h3>
                  <p className="text-gray-300 text-sm">
                    Enhanced error mapping with helpful suggestions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Demo Components */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Interactive Component Demos
              </CardTitle>
              <p className="text-gray-300">
                Try out each component to see the enhanced email verification experience
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="wizard" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  {demoComponents.map((component) => (
                    <TabsTrigger key={component.id} value={component.id}>
                      {component.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {demoComponents.map((component) => (
                  <TabsContent key={component.id} value={component.id}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${component.color} flex items-center justify-center`}>
                            <component.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{component.title}</CardTitle>
                            <p className="text-gray-600 text-sm">{component.description}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {component.demo}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Technical Implementation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-white font-medium mb-4">Key Components</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• <code className="bg-gray-800 px-2 py-1 rounded">EmailVerificationWizard</code> - Complete verification flow</li>
                    <li>• <code className="bg-gray-800 px-2 py-1 rounded">VerificationBanner</code> - Contextual notification banner</li>
                    <li>• <code className="bg-gray-800 px-2 py-1 rounded">useEmailVerification</code> - Verification state hook</li>
                    <li>• <code className="bg-gray-800 px-2 py-1 rounded">VerificationStatusCard</code> - Status display component</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-4">Integration Features</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Toast notifications with actions</li>
                    <li>• Persistent notification center integration</li>
                    <li>• Server-side verification actions</li>
                    <li>• Rate limiting and cooldown handling</li>
                    <li>• Automatic status polling</li>
                    <li>• Email client deep linking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            ← Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  )
}