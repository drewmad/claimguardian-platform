'use client'

import { useState } from 'react'
import { Button } from '@claimguardian/ui'
import { SignupModal } from '@/components/modals/signup-modal'
import { VideoBackground } from '@/components/ui/video-background'

export function HeroSection() {
  const [showSignupModal, setShowSignupModal] = useState(false)

  return (
    <>
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        <VideoBackground
          src="https://videos.pexels.com/video-files/853881/853881-hd_1920_1080_25fps.mp4"
          poster="https://placehold.co/1920x1080/0D1117/E6EDF3?text=Loading..."
        />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Stop Settling for Less Than You Deserve.
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-300">
            Stop wasting hours deciphering complex policies and chasing adjusters. ClaimGuardian&apos;s AI-powered platform automates the most tedious parts of the claims process, building a powerful, evidence-backed case in a fraction of the time—so you get the settlement you deserve, faster.
          </p>
          <div className="mt-10 flex justify-center items-center gap-4">
            <Button
              size="lg"
              className="btn-primary text-white font-bold py-4 px-8 text-lg"
              onClick={() => setShowSignupModal(true)}
            >
              Protect Your Property
            </Button>
          </div>
          <div className="mt-8 flex justify-center items-center gap-2 text-slate-400">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2">Trusted by Florida Homeowners</span>
          </div>
        </div>
      </section>

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </>
  )
}