/**
 * @fileMetadata
 * @purpose Hero section with Guardian shield and animated content
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store", "@/lib/constants"]
 * @exports ["Hero"]
 * @complexity high
 * @tags ["hero", "landing", "animations"]
 * @status active
 */
'use client'

import { Home, BrainCircuit, Hammer, KeyRound, ArrowRight, Building } from 'lucide-react'
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

const GuardianShieldIcon = () => (
  <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_8px_32px_rgba(91,163,245,0.4)] h-16 md:h-20 w-auto">
    <path d="M32 0L2.78461 12V36C2.78461 52.8 15.2462 68.4 32 72C48.7538 68.4 61.2154 52.8 61.2154 36V12L32 0Z" fill="url(#shield-gradient)"/>
    <circle cx="32" cy="28" r="6" fill="#0D1117" stroke="#5BA3F5" strokeOpacity="0.5" strokeWidth="2"/>
    <circle cx="32" cy="28" r="2" fill="#5BA3F5"/>
    <defs>
      <linearGradient id="shield-gradient" x1="32" y1="0" x2="32" y2="72" gradientUnits="userSpaceOnUse">
        <stop stopColor="#5BA3F5"/>
        <stop offset="1" stopColor="#3D7BC7"/>
      </linearGradient>
    </defs>
  </svg>
)

export function Hero() {
  
  const pills = [
    { label: 'Homeowners', icon: Home },
    { label: 'Renters', icon: KeyRound },
    { label: 'Landlords', icon: Building },
    { label: 'Builders', icon: Hammer },
    { label: 'AI-Augmented', icon: BrainCircuit },
  ]

  return (
    <>
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#0a0e1a]">
        {/* Animated Aurora Background */}
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
          <div className="aurora aurora-1"></div>
          <div className="aurora aurora-2"></div>
          <div className="aurora aurora-3"></div>
          <div className="aurora aurora-4"></div>
        </div>
        
        <style jsx>{`
          .aurora {
            position: absolute;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            will-change: transform, opacity;
          }
          .aurora-1 { width: 60vw; height: 60vw; top: 10%; left: 10%; background: ${COLORS.primary}; animation: aurora-1 25s infinite alternate; }
          .aurora-2 { width: 50vw; height: 50vw; top: 50%; left: 50%; background: ${COLORS.accent}; animation: aurora-2 30s infinite alternate; }
          .aurora-3 { width: 40vw; height: 40vw; bottom: 5%; right: 10%; background: ${COLORS.primary}; animation: aurora-3 20s infinite alternate; }
          .aurora-4 { width: 30vw; height: 30vw; top: 20%; right: 20%; background: ${COLORS.accent}; animation: aurora-4 35s infinite alternate; }

          @keyframes aurora-1 {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
            100% { transform: translate(-20%, -30%) scale(1.2); opacity: 0.2; }
          }
          @keyframes aurora-2 {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
            100% { transform: translate(-80%, -60%) scale(1.3); opacity: 0.2; }
          }
          @keyframes aurora-3 {
            0% { transform: translate(50%, 50%) scale(1); opacity: 0.1; }
            100% { transform: translate(20%, 30%) scale(1.1); opacity: 0.15; }
          }
          @keyframes aurora-4 {
            0% { transform: translate(50%, -50%) scale(1); opacity: 0.1; }
            100% { transform: translate(30%, -80%) scale(1.2); opacity: 0.15; }
          }
        `}</style>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center pt-16 pb-24">
          <AnimatedSection>
            <div className="mb-8 px-4 py-1.5 rounded-full border border-white/20 bg-black/20 text-sm font-semibold backdrop-blur-sm">
              Forged in Florida, for Floridians, by Floridians.
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <h1 className="font-slab text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight md:leading-snug flex flex-col md:flex-row items-center justify-center gap-6">
              <GuardianShieldIcon />
              Your Property Guardian
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <p className="mt-4 text-2xl md:text-3xl font-semibold text-primary">
              Your AI Guardian Never Sleeps. Because Florida Never Does.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-300 leading-relaxed">
              ClaimGuardian guards everything you own, rent, or manage—including that boat you&apos;ve used twice since buying it. Your personal AI <span className="font-semibold text-primary/90">Guardian</span> documents your stuff (even the manatee mailbox), tracks when your AC needs its monthly blessing, and maximizes claims when frozen iguanas damage your roof or love bugs cause $2,000 in paint damage. <span className="italic text-primary/80">Because Florida&apos;s gonna Florida</span>, but with <span className="font-semibold text-primary/90">Guardian</span> watching over you, your assets don&apos;t have to suffer.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={400}>
            <div className="mt-10">
              <Link
                href="/test-signup-simple"
                className="font-bold py-4 px-8 rounded-full text-black text-lg transition-transform hover:scale-105 inline-flex items-center gap-2 mx-auto shadow-[0_4px_20px_rgba(91,163,245,0.3)] hover:shadow-[0_6px_30px_rgba(91,163,245,0.4)]"
                style={{ backgroundColor: COLORS.primary }}
              >
                Guard My Property <ArrowRight size={20} />
              </Link>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={500}>
            <div className="mt-12 flex flex-wrap gap-3 justify-center">
              {pills.map(pill => (
                <div key={pill.label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[.03] backdrop-blur-sm transition-colors hover:bg-white/10">
                  <pill.icon size={16} className="text-primary"/>
                  <span className="text-sm font-medium">{pill.label}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Results Section */}
      <section className="px-4 md:px-8 py-16 bg-[#0a0e1a]">
        <AnimatedSection>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="font-slab text-4xl font-bold text-primary">15 Minutes</h3>
                <p className="mt-1 text-gray-300">To setup your property&apos;s digital twin.</p>
              </div>
              <div>
                <h3 className="font-slab text-4xl font-bold text-primary">Seconds</h3>
                <p className="mt-1 text-gray-300">To capture & value personal property.</p>
              </div>
              <div>
                <h3 className="font-slab text-4xl font-bold text-primary">Minutes</h3>
                <p className="mt-1 text-gray-300">To capture a full damage assessment.</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </>
  )
}