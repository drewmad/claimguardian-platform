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

import { FAQ } from '@/components/landing/faq'
import { Features } from '@/components/landing/features'
import { Footer } from '@/components/landing/footer'
import { FounderStory } from '@/components/landing/founder-story'
import { GetStarted } from '@/components/landing/get-started'
import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Pricing } from '@/components/landing/pricing'
import { Testimonials } from '@/components/landing/testimonials'
import { WhoWeFightFor } from '@/components/landing/who-we-fight-for'
import { WhoWeServe } from '@/components/landing/who-we-serve'
import { ContentModal } from '@/components/modals/content-modal'
import { ForgotPasswordModal } from '@/components/modals/forgot-password-modal'
import { LoginModal } from '@/components/modals/login-modal'
import { SignupModal } from '@/components/modals/signup-modal'

export default function HomePage() {
  return (
    <div className="min-h-screen w-full">
      <Header />
      
      <main className="relative">
        <Hero />
        <WhoWeServe />
        <WhoWeFightFor />
        <HowItWorks />
        <Features />
        <FounderStory />
        <Pricing />
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