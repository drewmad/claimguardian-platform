/**
 * @fileMetadata
 * @purpose Improved landing page header with better branding and navigation
 * @owner frontend-team
 * @dependencies ["react", "next/link", "@/lib/constants"]
 * @exports ["Header"]
 * @complexity medium
 * @tags ["header", "navigation", "landing"]
 * @status active
 */
'use client'

import Link from 'next/link'
import { COLORS } from '@/lib/constants'

// Enhanced shield with neon outline
const HeaderShieldIcon = () => (
  <div className="relative">
    <svg width="28" height="32" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 0L2.78461 12V36C2.78461 52.8 15.2462 68.4 32 72C48.7538 68.4 61.2154 52.8 61.2154 36V12L32 0Z" 
        fill="url(#shield-gradient-header-improved)"
        stroke={COLORS.brand.neonGreen}
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <defs>
        <linearGradient id="shield-gradient-header-improved" x1="32" y1="0" x2="32" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor={COLORS.brand.royalBlue}/>
          <stop offset="1" stopColor={COLORS.brand.gunmetal}/>
        </linearGradient>
      </defs>
    </svg>
    {/* Subtle glow */}
    <div className="absolute inset-0 blur-md opacity-50 bg-green-400 animate-pulse" />
  </div>
)

export function Header() {
  return (
    <header 
      className="sticky top-0 z-50 px-4 md:px-6 py-3 flex justify-between items-center transition-all duration-300 border-b" 
      style={{ 
        backgroundColor: 'rgba(43, 45, 66, 0.95)', // Gunmetal with transparency
        backdropFilter: 'blur(12px)', 
        borderBottomColor: 'rgba(57, 255, 20, 0.1)' // Subtle neon green border
      }}
    >
      {/* Logo - Shield + Wordmark paired -->
      <Link href="/" className="flex items-center gap-2 group">
        <HeaderShieldIcon />
        <h1 className="font-slab text-xl md:text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">
          ClaimGuardian
        </h1>
      </Link>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <a 
          href="#how-it-works" 
          className="text-gray-300 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-green-400 after:transition-all hover:after:w-full"
        >
          How It Works
        </a>
        <a 
          href="#features" 
          className="text-gray-300 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-green-400 after:transition-all hover:after:w-full"
        >
          Features
        </a>
        <a 
          href="#pricing" 
          className="text-gray-300 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-green-400 after:transition-all hover:after:w-full"
        >
          Pricing
        </a>
        
        <div className="flex items-center gap-4 ml-4">
          <Link 
            href="/auth/signin" 
            className="text-gray-300 hover:text-white transition-colors duration-200"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/signup" 
            className="relative py-2 px-5 rounded-full font-semibold transition-all duration-300 hover:scale-105 overflow-hidden group"
            style={{ 
              backgroundColor: COLORS.brand.neonGreen,
              color: 'black'
            }}
          >
            <span className="relative z-10">Start Free Trial</span>
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        </div>
      </nav>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Link 
          href="/auth/signup" 
          className="font-semibold text-sm py-2 px-4 rounded-full transition-all duration-300 hover:scale-105 inline-block" 
          style={{ 
            backgroundColor: COLORS.brand.neonGreen,
            color: 'black'
          }}
        >
          Get Started
        </Link>
      </div>
    </header>
  )
}