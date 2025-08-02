/**
 * @fileMetadata
 * @purpose The main public-facing landing page for the ClaimGuardian application.
 * @owner frontend-team
 * @status active
 */
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
import { Header } from '@/components/landing/header-improved'
import { Hero } from '@/components/landing/hero-improved'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Pricing } from '@/components/landing/pricing'
import { Testimonials } from '@/components/landing/testimonials'
import { WhoWeFightFor } from '@/components/landing/who-we-fight-for'
import { WhoWeServe } from '@/components/landing/who-we-serve'
import { ContentModal } from '@/components/modals/content-modal'
import { ForgotPasswordModal } from '@/components/modals/forgot-password-modal'
import { SimpleLoginModal } from '@/components/modals/simple-login-modal'
import { SimpleSignupModal } from '@/components/modals/simple-signup-modal'
import { FAQData, HowToData, ProductData, OrganizationData, CLAIMGUARDIAN_FAQS, CLAIM_DOCUMENTATION_STEPS } from '@/components/seo/structured-data'

export default function HomePage() {
  return (
    <div className="min-h-screen w-full">
      {/* Structured Data for AI Answer Engines */}
      <OrganizationData />
      <ProductData 
        name="ClaimGuardian"
        description="AI-powered property intelligence network that creates living digital twins of everything you own. Track warranties, optimize maintenance, protect investments, and preserve your legacy. Built by Florida family for comprehensive property management and generational wealth building."
        url="https://claimguardianai.com"
        offers={{
          price: "0",
          priceCurrency: "USD", 
          availability: "https://schema.org/InStock"
        }}
      />
      <FAQData faqs={CLAIMGUARDIAN_FAQS} />
      <HowToData 
        name="How to Create Your Complete Property Digital Twin"
        description="Complete guide to using ClaimGuardian's AI-powered property intelligence network for comprehensive asset protection and generational wealth building"
        steps={CLAIM_DOCUMENTATION_STEPS}
      />
      
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

      {/* Application Modals - Simplified for better user experience */}
      <SimpleLoginModal />
      <SimpleSignupModal />
      <ForgotPasswordModal />
      <ContentModal />
      {/* Test comment for Co-Strategist */}
      {/* Test comment for Co-Strategist */}
    </div>
  )
}