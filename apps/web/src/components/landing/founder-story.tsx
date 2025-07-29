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

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

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
          <h2 className="font-slab text-3xl font-bold">Developed from a Disaster</h2>
          <p className="mt-3 text-gray-300">
            &quot;After Hurricane Ian, my family&apos;s life was turned upside down. I was blindsided by a massive hurricane deductible I didn&apos;t know I had, forcing me to spend over $100,000 out-of-pocket. Worse, I lost two years fighting insurers and rebuilding—time with my new family that I can never get back. I built ClaimGuardian from that experience, engineering a tool to ensure no other Floridian has to feel that powerless. This is about giving you the control you deserve.&quot;
          </p>
          <p className="mt-3 font-semibold">- Drew M., P.E., Founder</p>
        </div>
      </AnimatedSection>
    </section>
  )
}