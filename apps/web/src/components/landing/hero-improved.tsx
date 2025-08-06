/**
 * @fileMetadata
 * @purpose "A visually improved and animated hero section component for the landing page."
 * @dependencies ["@/lib","lucide-react","next","react"]
 * @owner frontend-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "Improved Hero section with better UI/UX based on critique"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/constants", "next/link"]
 * @exports ["Hero"]
 * @complexity high
 * @tags ["hero", "landing", "animations"]
 * @status stable
 */
'use client'

import { Home, BrainCircuit, Hammer, KeyRound, ArrowRight, Building, PlayCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

import { COLORS } from '@/lib/constants'
import { liquidGlass } from '@/lib/styles/liquid-glass'

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

// Professional logo with enhanced styling for hero section
const GuardianHeroLogo = () => (
  <div className="relative">
    <img 
      src="/ClaimGuardian.png" 
      alt="ClaimGuardian Logo" 
      className="drop-shadow-[0_8px_32px_rgba(57,255,20,0.4)] h-16 md:h-20 w-auto object-contain"
    />
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
      <div className={`${liquidGlass.backgrounds.warning} border-b border-orange-500/30 h-12 flex items-center justify-center`}>
        <Link href="/hurricane-prep" className="flex items-center gap-2 text-sm font-medium text-orange-200 hover:text-white transition-colors group">
          <span className="animate-pulse">⚡</span>
          <span>Hurricane Season 2025: Free 15-Min Property Prep Checklist</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <section className="hero-liquid-glass relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        
        {/* Skip Link for Accessibility */}
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 focus:ring-2 focus:ring-blue-300">
          Skip to main content
        </a>
        
        {/* Animated Background - Reduced motion for accessibility */}
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden motion-reduce:hidden">
          <div className={liquidGlass.orbs.header} />
          <div className={liquidGlass.orbs.section} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center pt-12 pb-16" id="main">
          <AnimatedSection>
            <header className="flex items-center justify-center gap-3 mb-8">
              <GuardianHeroLogo />
              <h1 className="font-slab text-[clamp(2.5rem,5vw,4rem)] font-bold text-white leading-none" aria-label="ClaimGuardian - AI-powered insurance claim assistance">
                ClaimGuardian
              </h1>
            </header>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <p className="mt-4 text-[clamp(1.5rem,3vw,2rem)] font-bold text-white max-w-4xl mx-auto">
              Build the Digital Twin. Activate Your Digital Guardian
            </p>
            <p className="mt-3 text-[clamp(1.125rem,2vw,1.5rem)] font-medium text-gray-200 max-w-4xl mx-auto">
              Track it, Maintain it, Fix it, Warranty It, Claim it. Replace it. Donate it. Dispose
            </p>
            <p className="mt-2 text-lg text-gray-300 max-w-3xl mx-auto">
              AI-powered property intelligence that creates living digital twins of everything you own—tracking every warranty, scheduling every maintenance, documenting every upgrade.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <div className="mt-6 max-w-4xl mx-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-green-400 mb-1">Prepare for the Storm</h3>
                  <p className="text-sm text-gray-300">Pre-disaster documentation & readiness</p>
                </div>
                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-blue-400 mb-1">Command During Crisis</h3>
                  <p className="text-sm text-gray-300">Real-time damage tracking & claims</p>
                </div>
                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-purple-400 mb-1">Build Generational Wealth</h3>
                  <p className="text-sm text-gray-300">Asset optimization & legacy preservation</p>
                </div>
              </div>
              <p className="text-xl font-bold text-white mt-6">
                Founded in Florida, by a Florida Family, Exclusively for Floridians
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center" role="group" aria-label="Primary actions">
              <Link
                href="/auth/signup"
                className={`group relative font-bold py-5 px-10 text-black text-lg hover:scale-105 inline-flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-green-400/50 a11y-touch-target shadow-2xl rounded-2xl transition-all duration-300`}
                style={{ 
                  background: hoveredCTA 
                    ? `linear-gradient(135deg, #39FF14, #00FF7F)` 
                    : `linear-gradient(135deg, #39FF14, #32CD32)`,
                  boxShadow: hoveredCTA 
                    ? '0 0 40px rgba(57, 255, 20, 0.6), 0 20px 60px rgba(0, 0, 0, 0.4)'
                    : '0 0 20px rgba(57, 255, 20, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={() => setHoveredCTA(true)}
                onMouseLeave={() => setHoveredCTA(false)}
                aria-label="Create your complete property digital twin - no credit card required"
              >
                <span className="relative z-10 font-black tracking-wide">Create My Digital Twin →</span>
              </Link>
              
              <Link
                href="#how-it-works"
                className={`${liquidGlass.buttons.secondary} font-semibold py-3 px-6 rounded-full border-2 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white inline-flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-gray-400/50 a11y-touch-target`}
                aria-label="Learn how ClaimGuardian works"
              >
                <PlayCircle size={20} aria-hidden="true" />
                <span className="hidden sm:inline">Learn How It Works</span>
                <span className="sm:hidden">Learn More</span>
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
                    className={`${liquidGlass.backgrounds.secondary} flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black ${liquidGlass.hover.subtle}`}
                    onClick={() => document.getElementById('who-we-serve')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <pill.icon size={16} className={`text-green-400 ${liquidGlass.text.glowSubtle}`}/>
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

      {/* Florida Family Built Section */}
      <section className="px-4 md:px-8 py-16 bg-gradient-to-b from-black to-gray-900">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Built by a Florida Family, 
                  <span className="block text-green-400">For Florida Families</span>
                </h2>
                
                {/* Founder Quote */}
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                  <div className="flex items-start gap-4">
                    <div className="text-green-400 text-4xl leading-none font-serif">"</div>
                    <div className="flex-1">
                      <p className="text-lg text-gray-300 italic leading-relaxed mb-4">
                        Hurricane Ian taught us that surviving the storm was easy—navigating the aftermath was the real disaster. We lost over $100,000 and two precious years rebuilding that we'll never get back with our new family. But worse than the money was watching our neighbors lose their homes to insurance companies, not storms.
                      </p>
                      <p className="text-lg text-gray-300 italic leading-relaxed">
                        That's when we realized the real problem: <span className="text-white font-semibold">property owners had no way to prove what they owned or what it was worth</span>. From that struggle, ClaimGuardian was born—not just as an insurance tool, but as a complete property intelligence network that creates living digital twins of everything you own. We're transforming property ownership from anxiety into generational wealth building, ensuring every Florida family can protect their legacy with complete privacy control.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-600/30">
                    <p className="text-sm font-semibold text-white">— Drew M., P.E., Florida Professional Engineer & Founder</p>
                    <p className="text-xs text-gray-400 mt-1">Family team of five • Building one feature at a time based on real user needs</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Southwest Florida Based</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Engineered for Resilience</span>
                  </div>
                </div>
              </div>
              
              {/* Founders Photo */}
              <div className="flex-shrink-0 w-80 h-64 bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                <Image
                  src="/Founddrs.png"
                  alt="ClaimGuardian Founders"
                  width={320}
                  height={256}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>
      
    </>
  )
}