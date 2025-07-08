/**
 * @fileMetadata
 * @purpose Landing page header with navigation and login button
 * @owner frontend-team
 * @dependencies ["react", "@/stores/modal-store"]
 * @exports ["Header"]
 * @complexity low
 * @tags ["header", "navigation", "landing"]
 * @status active
 */
'use client'

import { useModalStore } from '@/stores/modal-store'

export function Header() {
  const { openModal } = useModalStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-slate-700">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-blue-400">Claim</span>Guardian
        </h1>
        <button
          onClick={() => openModal('login')}
          className="btn-secondary py-2 px-6"
        >
          Log In
        </button>
      </div>
    </header>
  )
}