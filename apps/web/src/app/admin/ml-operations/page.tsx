'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MlOperationsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to admin dashboard with ML Operations tab selected
    router.push('/admin?tab=ml-operations')
  }, [router])
  
  return null
}
