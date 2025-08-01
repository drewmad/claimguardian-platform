'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const handleSignUp = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Account created! Check your email for verification link.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Logged in successfully!' })
        setTimeout(() => router.push('/dashboard'), 1000)
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Test Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              className="bg-gray-800 border-gray-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              className="bg-gray-800 border-gray-700"
            />
          </div>

          {message && (
            <Alert className={message.type === 'error' ? 'bg-red-900/20 border-red-900' : 'bg-green-900/20 border-green-900'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleSignUp} 
              disabled={loading || !email || !password}
              variant="outline"
              className="flex-1"
            >
              Sign Up
            </Button>
            <Button 
              onClick={handleSignIn} 
              disabled={loading || !email || !password}
              className="flex-1"
            >
              Sign In
            </Button>
          </div>

          <div className="text-sm text-gray-400 space-y-2">
            <p className="font-semibold">Quick Test Account:</p>
            <div className="bg-gray-800 p-3 rounded space-y-1">
              <p>Email: <span className="text-white">demo@claimguardian.com</span></p>
              <p>Password: <span className="text-white">DemoPass123!</span></p>
            </div>
            <p className="text-xs mt-4">Or create your own account with any email address.</p>
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <Button
              onClick={() => {
                setEmail('demo@claimguardian.com')
                setPassword('DemoPass123!')
              }}
              variant="ghost"
              className="w-full"
            >
              Fill Demo Credentials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}