/**
 * @fileMetadata
 * @purpose "Demo page showcasing responsive modal improvements"
 * @owner frontend-team
 * @dependencies ["react", "@/components/ui/responsive-modal", "@/components/modals"]
 * @exports ["ModalDemoPage"]
 * @complexity medium
 * @tags ["demo", "modal", "responsive", "mobile"]
 * @status stable
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, Monitor, Tablet, CheckCircle, 
  ArrowRight, Eye, Touch, Zap, Shield
} from 'lucide-react'

import { useModalStore } from '@/stores/modal-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Optimized for touch interactions with slide-up animations on mobile devices'
  },
  {
    icon: Touch,
    title: 'Touch Gestures',
    description: 'Swipe to close, drag to dismiss, and native touch feel on all interactions'
  },
  {
    icon: Eye,
    title: 'Visual Feedback',
    description: 'Real-time validation, password strength indicators, and smooth transitions'
  },
  {
    icon: Zap,
    title: 'Performance',
    description: 'Framer Motion animations with optimized rendering for smooth 60fps'
  },
  {
    icon: Shield,
    title: 'Accessibility',
    description: 'Full keyboard navigation, ARIA labels, and screen reader support'
  },
  {
    icon: Monitor,
    title: 'Responsive',
    description: 'Adapts perfectly to any screen size from mobile to desktop'
  }
]

const modalComparisons = [
  {
    feature: 'Mobile Optimization',
    old: 'Basic responsive scaling',
    new: 'Native mobile slide-up with touch gestures',
    improved: true
  },
  {
    feature: 'Form Validation',
    old: 'Simple error messages',
    new: 'Real-time validation with visual feedback',
    improved: true
  },
  {
    feature: 'Password Strength',
    old: 'Text requirements only',
    new: 'Visual strength meter with progress bar',
    improved: true
  },
  {
    feature: 'Animations',
    old: 'CSS transitions',
    new: 'Framer Motion with spring physics',
    improved: true
  },
  {
    feature: 'Touch Interactions',
    old: 'Click only',
    new: 'Swipe to close, drag gestures',
    improved: true
  },
  {
    feature: 'Loading States',
    old: 'Basic loading text',
    new: 'Animated spinners with progress feedback',
    improved: true
  }
]

export default function ModalDemoPage() {
  const { openModal } = useModalStore()
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')

  const deviceIcons = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor
  }

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
            Responsive Modal System
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience our enhanced mobile-first modals with touch interactions, 
            visual feedback, and seamless responsive design.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="p-3 bg-blue-600/20 rounded-lg w-fit">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>

        {/* Modal Test Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">
                Try the New Modals
              </CardTitle>
              <p className="text-gray-300 text-center">
                Test the responsive behavior on different screen sizes
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Device Size Selector */}
              <div className="flex justify-center gap-2 mb-6">
                {(['mobile', 'tablet', 'desktop'] as const).map((device) => {
                  const Icon = deviceIcons[device]
                  return (
                    <Button
                      key={device}
                      variant={selectedDevice === device ? 'default' : 'outline'}
                      onClick={() => setSelectedDevice(device)}
                      className={selectedDevice === device ? 'bg-blue-600' : 'border-white/20 text-white hover:bg-white/10'}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {device.charAt(0).toUpperCase() + device.slice(1)}
                    </Button>
                  )
                })}
              </div>

              {/* Modal Demo Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => openModal('responsive-signup')}
                  className="bg-green-600 hover:bg-green-700 h-12"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Try Signup Modal
                </Button>
                <Button
                  onClick={() => openModal('responsive-login')}
                  className="bg-blue-600 hover:bg-blue-700 h-12"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Try Login Modal
                </Button>
                <Button
                  onClick={() => openModal('responsive-forgot-password')}
                  className="bg-purple-600 hover:bg-purple-700 h-12"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Try Reset Modal
                </Button>
              </div>

              {/* Mobile Instructions */}
              <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <h3 className="text-blue-300 font-semibold mb-2">Mobile Features to Try:</h3>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Swipe down to close modal</li>
                  <li>• Drag from the top indicator</li>
                  <li>• Tap outside to dismiss</li>
                  <li>• Notice smooth slide-up animation</li>
                  <li>• Test form validation feedback</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">
                Old vs New Comparison
              </CardTitle>
              <p className="text-gray-300 text-center">
                See what's improved in the new responsive modal system
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-3">Feature</th>
                      <th className="text-left p-3">Old System</th>
                      <th className="text-left p-3">New System</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalComparisons.map((comparison, index) => (
                      <tr key={comparison.feature} className="border-b border-white/10">
                        <td className="p-3 font-medium">{comparison.feature}</td>
                        <td className="p-3 text-gray-400">{comparison.old}</td>
                        <td className="p-3 text-green-400">{comparison.new}</td>
                        <td className="p-3">
                          {comparison.improved && (
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Improved
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
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