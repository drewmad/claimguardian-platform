/**
 * @fileMetadata
 * @purpose Public landing page for ClaimGuardian with comprehensive sections
 * @owner frontend-team
 * @dependencies ["react", "@/components/landing/*", "@/components/modals/*"]
 * @exports ["HomePage"]
 * @complexity high
 * @tags ["landing", "public", "home"]
 * @status active
 * @notes Main landing page with all marketing sections
 */
'use client'

import { Hero } from '@/components/landing/hero'
import { WhoWeServe } from '@/components/landing/who-we-serve'
import { WhoWeFightFor } from '@/components/landing/who-we-fight-for'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { Testimonials } from '@/components/landing/testimonials'
import { FAQ } from '@/components/landing/faq'
import { GetStarted } from '@/components/landing/get-started'
import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import { LoginModal } from '@/components/modals/login-modal'
import { SignupModal } from '@/components/modals/signup-modal'
import { ForgotPasswordModal } from '@/components/modals/forgot-password-modal'
import { ContentModal } from '@/components/modals/content-modal'

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-[#0D1117] text-[#E6EDF3] antialiased">
      <Header />
      
      <main>
        <Hero />
        <WhoWeServe />
        <WhoWeFightFor />
        <HowItWorks />
        <Features />
        <Testimonials />
        <FAQ />
        <GetStarted />
      </main>

      <Footer />

      {/* Modals */}
      <LoginModal />
      <SignupModal />
      <ForgotPasswordModal />
      <ContentModal />
    </div>
  )
}