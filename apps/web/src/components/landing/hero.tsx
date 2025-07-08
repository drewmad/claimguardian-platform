/**
 * @fileMetadata
 * @purpose Hero section with video background and call to action
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store"]
 * @exports ["Hero"]
 * @complexity medium
 * @tags ["hero", "landing", "video"]
 * @status active
 */
'use client'

import { useModalStore } from '@/stores/modal-store'
import { Star } from 'lucide-react'

export function Hero() {
  const { openModal } = useModalStore()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient background as fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900/20" />
      
      {/* Video background with better fallback */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        poster="/images/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        onError={(e) => {
          // Hide video if it fails to load
          e.currentTarget.style.display = 'none'
        }}
      >
        <source src="https://videos.pexels.com/video-files/853881/853881-hd_1920_1080_25fps.mp4" type="video/mp4" />
      </video>
      
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center pt-32 pb-24">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
          Stop Settling for Less<br />
          <span className="text-blue-400">Than You Deserve.</span>
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-slate-200 max-w-3xl mx-auto mb-10">
          Stop wasting hours deciphering complex policies and chasing adjusters. 
          ClaimGuardian&apos;s AI-powered platform automates the most tedious parts 
          of the claims process.
        </p>
        
        <button
          onClick={() => openModal('signup')}
          className="btn-primary text-lg px-8 py-4 shadow-xl"
        >
          Protect Your Property
        </button>
        
        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
            ))}
          </div>
          <span className="text-slate-200 font-medium">Trusted by Florida Homeowners</span>
        </div>
      </div>
    </section>
  )
}