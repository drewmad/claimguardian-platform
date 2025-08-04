'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Shield, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BasicSignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  
  const supabase = createBrowserSupabaseClient()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all fields')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (signUpError) {
        logger.error('Signup error:', signUpError)
        throw signUpError
      }
      
      if (data?.user) {
        logger.info('User created successfully:', data.user.id)
        
        // Profile will be automatically created by database trigger
        // No manual profile creation needed
        logger.info('User profile will be created automatically by database trigger')
        
        setSuccess(true)
        
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // Email already confirmed (e.g., if confirmations are disabled)
          router.push('/dashboard')
        } else {
          // Show success message
          setError(null)
        }
      }
    } catch (err) {
      logger.error('Signup error:', err)
      if (err instanceof Error) {
        if (err.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else if (err.message.includes('Password')) {
          setError('Password must be at least 6 characters')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-gray-400 mb-6">
              Please check your email to confirm your account.
            </p>
            <Link href="/auth/signin">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4">ClaimGuardian</h1>
          <h2 className="text-xl text-white mt-2">Create Account</h2>
          <p className="text-gray-400 mt-1">Sign up to protect your property</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Doe"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="john.doe@example.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
          
          <div className="text-center text-sm">
            <span className="text-gray-400">Already have an account? </span>
            <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
