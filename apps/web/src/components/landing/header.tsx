/**
 * @fileMetadata
 * @purpose Landing page header with enhanced navigation and branding
 * @owner frontend-team
 * @dependencies ["react", "@/stores/modal-store", "@/lib/constants"]
 * @exports ["Header"]
 * @complexity medium
 * @tags ["header", "navigation", "landing"]
 * @status active
 */
'use client'

import { COLORS } from '@/lib/constants'
import { useModalStore } from '@/stores/modal-store'

const HeaderShieldIcon = () => (
  <svg width="28" height="32" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 0L2.78461 12V36C2.78461 52.8 15.2462 68.4 32 72C48.7538 68.4 61.2154 52.8 61.2154 36V12L32 0Z" fill="url(#shield-gradient-header)"/>
    <defs>
      <linearGradient id="shield-gradient-header" x1="32" y1="0" x2="32" y2="72" gradientUnits="userSpaceOnUse">
        <stop stopColor="#5BA3F5"/>
        <stop offset="1" stopColor="#3D7BC7"/>
      </linearGradient>
    </defs>
  </svg>
)

export function Header() {
  const { openModal } = useModalStore()

  return (
    <header className="sticky top-0 z-50 p-4 md:px-6 flex justify-between items-center transition-colors duration-300" style={{ backgroundColor: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(10px)', borderBottom: `1px solid rgba(255, 255, 255, 0.1)` }}>
      <div className="flex items-center gap-3">
        <HeaderShieldIcon />
        <h1 className="font-slab text-xl md:text-2xl font-bold" style={{ textShadow: `0 0 8px rgba(0, 169, 255, 0.5)` }}>
          ClaimGuardian
        </h1>
      </div>
      <nav className="hidden md:flex items-center gap-4 text-sm font-semibold">
        <a href="#how-it-works" className="text-gray-300 hover:text-primary transition-colors">How It Works</a>
        <span className="text-gray-300/30">|</span>
        <button onClick={() => openModal('login')} className="text-gray-300 hover:text-primary transition-colors">Sign In</button>
        <span className="text-gray-300/30">|</span>
        <button 
          onClick={() => openModal('signup')} 
          className="py-2 px-4 rounded-full transition-colors hover:opacity-90" 
          style={{ backgroundColor: COLORS.primary, color: 'black' }}
        >
          Start Free Trial
        </button>
      </nav>
      <div className="md:hidden">
        <button 
          onClick={() => openModal('signup')} 
          className="font-semibold text-sm py-2 px-4 rounded-full transition-colors hover:opacity-90" 
          style={{ backgroundColor: COLORS.primary, color: 'black' }}
        >
          Get Started
        </button>
      </div>
    </header>
  )
}