/**
 * @fileMetadata
 * @purpose Improved Hero section with better UI/UX based on critique
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/constants", "next/link"]
 * @exports ["Hero"]
 * @complexity high
 * @tags ["hero", "landing", "animations"]
 * @status active
 */
'use client'

import { Home, BrainCircuit, Hammer, KeyRound, ArrowRight, Building, PlayCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

import { COLORS } from '@/lib/constants'

// Animation hook
const useInView = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        observer.unobserve(entry.target)
      }
    }, options)

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [ref, options])

  return [ref, isInView] as const
}

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => {
  const [ref, isInView] = useInView({ threshold: 0.1 })

  return (
    <div 
      ref={ref} 
      className={`${className} transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// Enhanced shield with neon glow
const GuardianShieldIcon = () => (
  <div className="relative">
    <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" 
      className="drop-shadow-[0_8px_32px_rgba(57,255,20,0.4)] h-16 md:h-20 w-auto animate-pulse-slow">
      <path d="M32 0L2.78461 12V36C2.78461 52.8 15.2462 68.4 32 72C48.7538 68.4 61.2154 52.8 61.2154 36V12L32 0Z" 
        fill="url(#shield-gradient-improved)" 
        stroke={COLORS.brand.neonGreen} 
        strokeWidth="2" 
        strokeOpacity="0.6"/>
      <circle cx="32" cy="28" r="6" fill="#0D1117" stroke={COLORS.brand.neonGreen} strokeOpacity="0.8" strokeWidth="2"/>
      <circle cx="32" cy="28" r="2" fill={COLORS.brand.neonGreen}/>
      <defs>
        <linearGradient id="shield-gradient-improved" x1="32" y1="0" x2="32" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor={COLORS.brand.royalBlue}/>
          <stop offset="1" stopColor={COLORS.brand.gunmetal}/>
        </linearGradient>
      </defs>
    </svg>
    {/* Ambient glow effect */}
    <div className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-b from-green-400 to-transparent animate-pulse" />
  </div>
)

export function Hero() {
  const [hoveredCTA, setHoveredCTA] = useState(false)
  
  const pills = [
    { label: 'Homeowners', icon: Home },
    { label: 'Renters', icon: KeyRound },
    { label: 'Landlords', icon: Building },
    { label: 'Builders', icon: Hammer },
    { label: 'AI-Augmented', icon: BrainCircuit },
  ]

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-orange-500/30 h-12 flex items-center justify-center">
        <Link href="/hurricane-prep" className="flex items-center gap-2 text-sm font-medium text-orange-200 hover:text-white transition-colors group">
          <span className="animate-pulse">⚡</span>
          <span>Hurricane Season 2025: Free 15-Min Property Prep Checklist</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden" 
        style={{ background: `radial-gradient(circle at 50% 50%, ${COLORS.brand.royalBlue}22 0%, ${COLORS.brand.gunmetal} 100%)` }}>
        
        {/* Skip Link for Accessibility */}
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 focus:ring-2 focus:ring-blue-300">
          Skip to main content
        </a>
        
        {/* Animated Background - Reduced motion for accessibility */}
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden motion-reduce:hidden">
          <div className="absolute w-[60vw] h-[60vw] top-[10%] left-[10%] rounded-full blur-[120px] opacity-10 bg-gradient-to-br from-blue-600 to-transparent animate-drift-1" />
          <div className="absolute w-[50vw] h-[50vw] top-[50%] left-[50%] rounded-full blur-[120px] opacity-10 bg-gradient-to-br from-green-500 to-transparent animate-drift-2" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center pt-12 pb-16" id="main">
          <AnimatedSection>
            <header className="flex items-center justify-center gap-3 mb-8">
              <GuardianShieldIcon />
              <h1 className="font-slab text-[clamp(2.5rem,5vw,4rem)] font-bold text-white leading-none" aria-label="ClaimGuardian - AI-powered insurance claim assistance">
                ClaimGuardian
              </h1>
            </header>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <p className="mt-4 text-[clamp(1.125rem,2.5vw,1.5rem)] font-medium text-gray-200 max-w-3xl mx-auto">
              <span className="font-bold text-white">Your Property's Complete Story, Protected Forever</span>
            </p>
            <p className="mt-2 text-lg text-gray-300 max-w-3xl mx-auto">
              AI-powered property intelligence network that creates living digital twins of everything you own—from your headphones to your air conditioner.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <div className="mt-6 max-w-3xl mx-auto space-y-4">
              <p className="text-lg text-gray-300">
                Transform property ownership from anxiety into wealth building • Track warranties • Optimize maintenance • Preserve your legacy
              </p>
              <p className="text-xl font-bold text-green-400">
                Built by Florida family for generational wealth and community resilience.
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center" role="group" aria-label="Primary actions">
              <Link
                href="/auth/signup-advanced"
                className="group relative font-bold py-4 px-8 rounded-full text-black text-lg transition-all duration-300 hover:scale-105 inline-flex items-center gap-2 shadow-lg overflow-hidden focus:outline-none focus:ring-4 focus:ring-green-400/50"
                style={{ 
                  background: hoveredCTA 
                    ? `linear-gradient(135deg, ${COLORS.brand.royalBlue}, ${COLORS.brand.neonGreen})` 
                    : COLORS.brand.neonGreen 
                }}
                onMouseEnter={() => setHoveredCTA(true)}
                onMouseLeave={() => setHoveredCTA(false)}
                aria-label="Create your complete property digital twin - no credit card required"
              >
                <span className="relative z-10">Create My Digital Twin →</span>
                {/* Gradient sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Link>
              
              <Link
                href="#how-it-works"
                className="font-semibold py-3 px-6 rounded-full border-2 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white transition-all duration-300 inline-flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-gray-400/50"
                aria-label="Watch our 2-minute product demonstration video"
              >
                <PlayCircle size={20} aria-hidden="true" />
                Watch 2-Min Demo
              </Link>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={400}>
            {/* Horizontal scroll chips for mobile */}
            <div className="mt-8 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3 justify-center min-w-max px-4">
                {pills.map(pill => (
                  <button 
                    key={pill.label} 
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[.03] backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                    onClick={() => document.getElementById('who-we-serve')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <pill.icon size={16} className="text-green-400"/>
                    <span className="text-sm font-medium whitespace-nowrap">{pill.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </AnimatedSection>
          
          {/* Trust Signals */}
          <AnimatedSection delay={500}>
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Bank-Level Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-400 text-lg">24/7</span>
                  <span>AI monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-400 text-lg">15 min</span>
                  <span>property setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-400 text-lg">100%</span>
                  <span>Florida focused</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Results Section - Compressed spacing */}
      <section className="px-4 md:px-8 py-12 bg-gradient-to-b from-gray-900 to-black">
        <AnimatedSection>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="group hover:scale-105 transition-transform">
                <h3 className="font-slab text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Everything</h3>
                <p className="mt-1 text-gray-300">Track from your home's foundation to your headphone warranty.</p>
              </div>
              <div className="group hover:scale-105 transition-transform">
                <h3 className="font-slab text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Generations</h3>
                <p className="mt-1 text-gray-300">Preserve property knowledge for your family's future.</p>
              </div>
              <div className="group hover:scale-105 transition-transform">
                <h3 className="font-slab text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Community</h3>
                <p className="mt-1 text-gray-300">Share wisdom while protecting your privacy.</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>
      
    </>
  )
}