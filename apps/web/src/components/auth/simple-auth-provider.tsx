'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { simpleAuthService } from '@/lib/auth/simple-auth-service'
import { logger } from "@/lib/logger/production-logger"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
  signUp: (data: SignUpData) => Promise<boolean>
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  clearError: () => void
}

interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data } = await simpleAuthService.getCurrentUser()
        setUser(data || null)
      } catch (err) {
        logger.error('Error checking user session:', err)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  const signUp = async (data: SignUpData): Promise<boolean> => {
    setError(null)
    try {
      const { error } = await simpleAuthService.signUp(data)
      if (error) {
        setError(error)
        return false
      }
      // Don't set user here - they need to confirm email first
      return true
    } catch (err) {
      setError(err as Error)
      return false
    }
  }

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setError(null)
    try {
      const { data: user, error } = await simpleAuthService.signIn({ email, password })
      if (error) {
        setError(error)
        return false
      }
      setUser(user || null)
      router.push('/dashboard')
      return true
    } catch (err) {
      setError(err as Error)
      return false
    }
  }

  const signOut = async () => {
    try {
      await simpleAuthService.signOut()
      setUser(null)
      router.push('/')
    } catch (err) {
      logger.error('Error signing out:', err)
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSimpleAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider')
  }
  return context
}