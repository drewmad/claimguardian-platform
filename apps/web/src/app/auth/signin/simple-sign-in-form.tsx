'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

interface SimpleSignInFormProps {
  message?: string
}

export function SimpleSignInForm({ message }: SimpleSignInFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(message || null)
  const supabase = createBrowserSupabaseClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Clear any existing errors
    setError(null)
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    setIsLoading(true)
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }
      
      if (data?.user) {
        // Successful sign in - redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-sm border-slate-700">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">ClaimGuardian</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-slate-400">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-slate-400 hover:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}