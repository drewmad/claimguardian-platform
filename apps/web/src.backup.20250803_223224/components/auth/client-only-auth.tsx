'use client'

import React, { useState, useEffect } from 'react'

interface ClientOnlyAuthProps {
  children: React.ReactNode
}

export function ClientOnlyAuth({ children }: ClientOnlyAuthProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <>{children}</>
}