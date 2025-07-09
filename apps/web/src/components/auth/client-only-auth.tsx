/**
 * @fileMetadata
 * @purpose Client-only wrapper for authentication to prevent hydration issues
 * @owner platform-team
 * @dependencies ["react", "next/dynamic"]
 * @exports ["ClientOnlyAuth"]
 * @complexity low
 * @tags ["auth", "client", "wrapper"]
 * @status active
 */

'use client'

import { useEffect, useState } from 'react'
import { AuthLoading } from './auth-loading'

interface ClientOnlyAuthProps {
  children: React.ReactNode
}

export function ClientOnlyAuth({ children }: ClientOnlyAuthProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <AuthLoading />
  }

  return <>{children}</>
}