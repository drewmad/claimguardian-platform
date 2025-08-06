/**
 * @fileMetadata
 * @purpose "Landing page header with enhanced navigation and branding"
 * @owner frontend-team
 * @dependencies ["react", "next/link", "@/lib/constants"]
 * @exports ["Header"]
 * @complexity medium
 * @tags ["header", "navigation", "landing"]
 * @status stable
 */
'use client'

import Link from 'next/link'

import { OptimizedImage } from '@/components/ui/optimized-image'
import { COLORS } from '@/lib/constants'

const HeaderLogoIcon = () => (
  <OptimizedImage 
    src="/ClaimGuardian.png" 
    alt="ClaimGuardian Logo" 
    width={32} 
    height={32}
    priority={true}
    className="object-contain"
  />
)

export function Header() {
  return (
    <header className="sticky top-0 z-50 p-4 md:px-6 flex justify-between items-center transition-colors duration-300" style={{ backgroundColor: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(10px)', borderBottom: `1px solid rgba(255, 255, 255, 0.1)` }}>
      <div className="flex items-center gap-3">
        <HeaderLogoIcon />
        <h1 className="font-slab text-xl md:text-2xl font-bold" style={{ textShadow: `0 0 8px rgba(0, 169, 255, 0.5)` }}>
          ClaimGuardian
        </h1>
      </div>
      <nav className="hidden md:flex items-center gap-4 text-sm font-semibold">
        <a href="#how-it-works" className="text-gray-300 hover:text-primary transition-colors">How It Works</a>
        <span className="text-gray-300/30">|</span>
        <Link href="/auth/signin" className="text-gray-300 hover:text-primary transition-colors">Sign In</Link>
        <span className="text-gray-300/30">|</span>
        <Link 
          href="/auth/signup" 
          className="py-2 px-4 rounded-full transition-colors hover:opacity-90" 
          style={{ backgroundColor: COLORS.primary, color: 'white' }}
        >
          Join the Community
        </Link>
      </nav>
      <div className="md:hidden">
        <Link 
          href="/auth/signup" 
          className="font-semibold text-sm py-2 px-4 rounded-full transition-colors hover:opacity-90 inline-block" 
          style={{ backgroundColor: COLORS.primary, color: 'white' }}
        >
          Join Community
        </Link>
      </div>
    </header>
  )
}