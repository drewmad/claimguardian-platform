/**
 * @fileMetadata
 * @purpose "Comprehensive toast and notification system demonstration"
 * @owner ui-team
 * @dependencies ["react", "@/components/notifications"]
 * @exports ["ToastDemoPage"]
 * @complexity high
 * @tags ["demo", "toast", "notifications", "ui"]
 * @status stable
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Loader2,
  Upload,
  Download,
  Zap,
  Home,
  Shield,
  Star,
  Heart,
  Coffee,
  Rocket
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast, toastPresets } from '@/components/notifications/toast-system'
import { useNotifications, NotificationBell } from '@/components/notifications/notification-center'
import { cn } from '@/lib/utils'

export default function ToastDemoPage() {
  const { toast, success, error, warning, info, loading, promise, dismiss } = useToast()
  const { addNotification } = useNotifications()

  const [customMessage, setCustomMessage] = useState('This is a custom toast message')
  const [customTitle, setCustomTitle] = useState('Custom Toast')
  const [progress, setProgress] = useState([45])
  const [activeLoadingToast, setActiveLoadingToast] = useState<string | number | null>(null)

  // Basic toast examples
  const basicToasts = [
    {
      id: 'success',
      label: 'Success Toast',
      handler: () => success('Operation completed successfully!'),
      color: 'bg-green-600 hover:bg-green-700',
      icon: CheckCircle
    },
    {
      id: 'error',
      label: 'Error Toast',
      handler: () => error('Something went wrong. Please try again.'),
      color: 'bg-red-600 hover:bg-red-700',
      icon: AlertTriangle
    },
    {
      id: 'warning',
      label: 'Warning Toast',
      handler: () => warning('Please review your settings before proceeding.'),
      color: 'bg-orange-600 hover:bg-orange-700',
      icon: AlertTriangle
    },
    {
      id: 'info',
      label: 'Info Toast',
      handler: () => info('Here\'s some helpful information for you.'),
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: Info
    }
  ]

  // Rich toast examples
  const richToasts = [
    {
      id: 'with-actions',
      label: 'Toast with Actions',
      handler: () => success('File uploaded successfully!', {
        actions: [
          {
            label: 'View File',
            onClick: () => console.log('Viewing file...')
          },
          {
            label: 'Share',
            onClick: () => console.log('Sharing file...')
          }
        ]
      }),
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'with-progress',
      label: 'Toast with Progress',
      handler: () => toast(customMessage, {
        variant: 'info',
        rich: true,
        title: 'Processing...',
        progress: progress[0],
        persistent: true
      }),
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'with-metadata',
      label: 'Toast with Metadata',
      handler: () => success('Property analysis complete', {
        rich: true,
        subtitle: 'Your property has been analyzed for insurance optimization',
        metadata: {
          'Property': '123 Main St',
          'Score': '8.5/10',
          'Time': '2.3s'
        }
      }),
      color: 'bg-emerald-600 hover:bg-emerald-700'
    }
  ]

  // Specialized toast examples
  const specializedToasts = [
    {
      id: 'property-added',
      label: 'Property Added',
      handler: () => toastPresets.propertyAdded('123 Ocean Drive'),
      color: 'bg-teal-600 hover:bg-teal-700'
    },
    {
      id: 'ai-analysis',
      label: 'AI Analysis',
      handler: () => toastPresets.aiAnalysisComplete('Damage Assessment'),
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'upload-complete',
      label: 'Upload Complete',
      handler: () => toastPresets.uploadComplete('policy-document.pdf'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'login-success',
      label: 'Login Success',
      handler: () => toastPresets.loginSuccess(),
      color: 'bg-green-600 hover:bg-green-700'
    }
  ]

  // Promise toast demo
  const runPromiseDemo = async (shouldFail = false) => {
    const mockPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Operation failed'))
        } else {
          resolve({ id: '123', name: 'Sample Data' })
        }
      }, 3000)
    })

    try {
      await promise(mockPromise, {
        loading: 'Processing your request...',
        success: (data: any) => `Successfully processed ${data.name}!`,
        error: (error: Error) => `Failed: ${error.message}`
      })
    } catch (error) {
      console.log('Promise demo failed as expected')
    }
  }

  // Loading toast demo
  const runLoadingDemo = () => {
    const toastId = loading('Processing data, please wait...', {
      persistent: true
    })
    
    setActiveLoadingToast(toastId)
    
    setTimeout(() => {
      dismiss(toastId)
      success('Processing completed successfully!')
      setActiveLoadingToast(null)
    }, 4000)
  }

  // Persistent notification examples
  const persistentNotifications = [
    {
      id: 'property-alert',
      label: 'Property Alert',
      handler: () => addNotification({
        title: 'Property Insurance Renewal Due',
        message: 'Your property insurance for 123 Main St expires in 30 days. Consider reviewing your coverage options.',
        type: 'warning',
        priority: 'high',
        source: 'property',
        actionable: true,
        actions: [
          {
            id: 'review',
            label: 'Review Coverage',
            type: 'primary',
            handler: () => console.log('Reviewing coverage...')
          },
          {
            id: 'remind-later',
            label: 'Remind Later',
            type: 'secondary',
            handler: () => console.log('Setting reminder...')
          }
        ]
      }),
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      id: 'ai-insight',
      label: 'AI Insight',
      handler: () => addNotification({
        title: 'New AI Insight Available',
        message: 'Our AI analysis has identified potential cost savings for your property maintenance schedule.',
        type: 'ai',
        priority: 'medium',
        source: 'ai',
        actionable: true,
        actions: [
          {
            id: 'view-insights',
            label: 'View Insights',
            type: 'primary',
            handler: () => console.log('Viewing AI insights...')
          }
        ]
      }),
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'system-update',
      label: 'System Update',
      handler: () => addNotification({
        title: 'System Update Available',
        message: 'A new version of ClaimGuardian is available with enhanced AI features and performance improvements.',
        type: 'system',
        priority: 'low',
        source: 'system',
        actionable: true,
        actions: [
          {
            id: 'update-now',
            label: 'Update Now',
            type: 'primary',
            handler: () => console.log('Updating system...')
          },
          {
            id: 'schedule-later',
            label: 'Schedule Later',
            type: 'secondary',
            handler: () => console.log('Scheduling update...')
          }
        ]
      }),
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ]

  const customToastDemo = () => {
    toast(customMessage, {
      variant: 'default',
      rich: true,
      title: customTitle,
      icon: Star,
      actions: [
        {
          label: 'Like',
          onClick: () => success('Thanks for the feedback!')
        }
      ]
    })
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
          <div className="flex items-center justify-center space-x-4 mb-6">
            <h1 className="text-5xl font-bold text-white">
              Toast & Notifications Demo
            </h1>
            <NotificationBell className="text-white" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive demonstration of toast notifications, persistent notifications, 
            and user feedback systems in ClaimGuardian.
          </p>
        </motion.div>

        {/* Basic Toasts */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Basic Toast Notifications
              </CardTitle>
              <p className="text-gray-300">
                Simple, effective notifications for common user actions
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {basicToasts.map((toastConfig) => {
                  const Icon = toastConfig.icon
                  return (
                    <Button
                      key={toastConfig.id}
                      onClick={toastConfig.handler}
                      className={cn("h-16 flex-col space-y-2", toastConfig.color)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{toastConfig.label}</span>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rich Toasts */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Rich Toast Components
              </CardTitle>
              <p className="text-gray-300">
                Enhanced toasts with actions, progress, and metadata
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {richToasts.map((toastConfig) => (
                  <Button
                    key={toastConfig.id}
                    onClick={toastConfig.handler}
                    className={cn("h-16", toastConfig.color)}
                  >
                    {toastConfig.label}
                  </Button>
                ))}
              </div>

              {/* Custom progress control */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <Label>Progress Value: {progress[0]}%</Label>
                    <Slider
                      value={progress}
                      onValueChange={setProgress}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Promise & Loading Toasts */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Promise & Loading States
              </CardTitle>
              <p className="text-gray-300">
                Async operations with loading and result feedback
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => runPromiseDemo(false)}
                  className="bg-green-600 hover:bg-green-700 h-16 flex-col space-y-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-xs">Promise Success</span>
                </Button>
                
                <Button
                  onClick={() => runPromiseDemo(true)}
                  className="bg-red-600 hover:bg-red-700 h-16 flex-col space-y-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-xs">Promise Error</span>
                </Button>
                
                <Button
                  onClick={runLoadingDemo}
                  disabled={activeLoadingToast !== null}
                  className="bg-purple-600 hover:bg-purple-700 h-16 flex-col space-y-2"
                >
                  {activeLoadingToast ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Loader2 className="w-5 h-5" />
                  )}
                  <span className="text-xs">Loading Toast</span>
                </Button>
                
                <Button
                  onClick={() => dismiss()}
                  className="bg-gray-600 hover:bg-gray-700 h-16 flex-col space-y-2"
                >
                  <Bell className="w-5 h-5" />
                  <span className="text-xs">Dismiss All</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Specialized Toasts */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                ClaimGuardian Presets
              </CardTitle>
              <p className="text-gray-300">
                Pre-configured toasts for common ClaimGuardian actions
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {specializedToasts.map((toastConfig) => (
                  <Button
                    key={toastConfig.id}
                    onClick={toastConfig.handler}
                    className={cn("h-16", toastConfig.color)}
                  >
                    {toastConfig.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Custom Toast Builder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Custom Toast Builder
              </CardTitle>
              <p className="text-gray-300">
                Create your own toast with custom content
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Toast Title</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Enter toast title..."
                    />
                  </div>
                  <div>
                    <Label>Toast Message</Label>
                    <Input
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter toast message..."
                    />
                  </div>
                </div>
                
                <Button onClick={customToastDemo} className="bg-indigo-600 hover:bg-indigo-700">
                  <Star className="w-4 h-4 mr-2" />
                  Show Custom Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Persistent Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mb-16"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                Persistent Notifications
              </CardTitle>
              <p className="text-gray-300">
                Add notifications to the notification center (check the bell icon)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {persistentNotifications.map((notification) => (
                  <Button
                    key={notification.id}
                    onClick={notification.handler}
                    className={cn("h-16", notification.color)}
                  >
                    {notification.label}
                  </Button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 text-sm">
                  <Bell className="w-4 h-4 inline mr-2" />
                  Persistent notifications appear in the notification center. 
                  Click the bell icon in the header to view and manage them.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
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