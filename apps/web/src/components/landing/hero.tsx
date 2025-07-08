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
    <section className="hero-section relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
      <video
        id="hero-video"
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto z-[-2] transform -translate-x-1/2 -translate-y-1/2 object-cover"
        poster="https://placehold.co/1920x1080/0D1117/E6EDF3?text=Loading..."
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="https://videos.pexels.com/video-files/853881/853881-hd_1920_1080_25fps.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-[#0D1117]/70 z-[-1]" />
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
          Stop Settling for Less Than You Deserve.
        </h2>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-300">
          Stop wasting hours deciphering complex policies and chasing adjusters. ClaimGuardian&apos;s AI-powered platform automates the most tedious parts of the claims process, building a powerful, evidence-backed case in a fraction of the time—so you get the settlement you deserve, faster.
        </p>
        <div className="mt-10 flex justify-center items-center gap-4">
          <button
            onClick={() => openModal('signup')}
            className="btn-primary text-white font-bold py-4 px-8 text-lg"
          >
            Protect Your Property
          </button>
        </div>
        <div className="mt-8 flex justify-center items-center gap-2 text-slate-400">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
            ))}
          </div>
          <span className="ml-2">Trusted by Florida Homeowners</span>
        </div>
      </div>
    </section>
  )
}