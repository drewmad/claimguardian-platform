'use client'

import { useState } from 'react'
import { LoginModal } from '@/components/modals/login-modal'
import { Button } from '@claimguardian/ui/button'

export function Header() {
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/60 backdrop-blur-lg border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">ClaimGuardian</h1>
          <Button
            variant="secondary"
            onClick={() => setShowLoginModal(true)}
            className="bg-slate-700 hover:bg-slate-600"
          >
            Log In
          </Button>
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  )
}