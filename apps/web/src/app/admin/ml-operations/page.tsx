'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MlOperationsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to admin dashboard with ML Operations tab selected
    router.push('/admin?tab=ml-operations')
  }, [router])
  
  return null
}
