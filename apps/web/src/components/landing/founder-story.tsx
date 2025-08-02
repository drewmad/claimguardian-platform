/**
 * @fileMetadata
 * @purpose Founder story section with animated content
 * @owner frontend-team
 * @dependencies ["react"]
 * @exports ["FounderStory"]
 * @complexity low
 * @tags ["landing", "about", "founder"]
 * @status active
 */
'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

// Animation hook reused
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

export function FounderStory() {
  return (
    <section className="px-4 md:px-8 py-20 bg-[#0a0e1a]">
      <AnimatedSection className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <Image 
          loading="lazy"
          src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3" 
          alt="Founder" 
          width={160}
          height={160}
          className="w-40 h-40 rounded-full object-cover border-4 border-primary/50" 
        />
        <div>
          <h2 className="font-slab text-3xl font-bold">Built by Florida Family, For Florida Families</h2>
          <p className="mt-3 text-gray-300">
            &quot;Hurricane Ian taught us that surviving the storm was easy—navigating the aftermath was the real disaster. We lost over $100,000 and two precious years rebuilding that we'll never get back with our new family. From that struggle, ClaimGuardian was born—not just as an insurance tool, but as a complete property intelligence network. We're transforming property ownership from anxiety into wealth building, ensuring every Florida family can protect their investments and preserve their legacy with complete privacy control.&quot;
          </p>
          <p className="mt-3 font-semibold">- Drew M., P.E., Florida Professional Engineer & Founder</p>
          <p className="mt-2 text-sm text-gray-400">
            Family team of five • Single developer • Building one feature at a time based on real user needs
          </p>
        </div>
      </AnimatedSection>
    </section>
  )
}