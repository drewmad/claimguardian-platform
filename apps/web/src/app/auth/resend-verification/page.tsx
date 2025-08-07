/**
 * @fileMetadata
 * @purpose "Resend email verification page with enhanced UX"
 * @owner auth-team
 * @dependencies ["react", "next", "@/components/auth"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["auth", "verification", "resend", "page"]
 * @status stable
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailVerificationWizard } from '@/components/auth/email-verification-enhanced'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export default function ResendVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userEmail, setUserEmail] = useState<string>('')

  // Get email from URL params or current user
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setUserEmail(emailParam)
      return
    }

    // Check if user is logged in and get their email
    const getUserEmail = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setUserEmail(user.email)
        }
      } catch (error) {
        logger.error('Failed to get user email for verification resend', {}, error as Error)
      }
    }

    getUserEmail()
  }, [searchParams])

  const handleSuccess = () => {
    router.push('/dashboard')
  }

  const handleCancel = () => {
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Email Verification
          </h1>
          <p className="text-xl text-gray-300 max-w-lg mx-auto">
            We need to verify your email address to secure your account and enable all features.
          </p>
        </motion.div>

        {/* Main verification component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <EmailVerificationWizard
            initialEmail={userEmail}
            verificationType="signup"
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            showSkipOption={false}
          />
        </motion.div>

        {/* Back navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <Link href="/auth/signin">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </motion.div>

        {/* Additional help card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center">
                Why Do We Need Email Verification?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="text-white font-medium">Account Security</h3>
                  <p className="text-gray-300 text-sm">
                    Protects your account from unauthorized access and ensures you're the rightful owner.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📧</span>
                  </div>
                  <h3 className="text-white font-medium">Important Updates</h3>
                  <p className="text-gray-300 text-sm">
                    Receive critical notifications about your properties, claims, and account activity.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h3 className="text-white font-medium">Full Features</h3>
                  <p className="text-gray-300 text-sm">
                    Access all ClaimGuardian features including AI tools, property management, and more.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
