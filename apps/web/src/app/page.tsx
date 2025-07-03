import { Header } from '@/components/layout/header'
import { HeroSection } from '@/components/sections/hero-section'
import { WhoWeServeSection } from '@/components/sections/who-we-serve-section'
import { WhoWeFightForSection } from '@/components/sections/who-we-fight-for-section'
import { HowItWorksSection } from '@/components/sections/how-it-works-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { FaqSection } from '@/components/sections/faq-section'
import { CtaSection } from '@/components/sections/cta-section'
import { Footer } from '@/components/layout/footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <WhoWeServeSection />
      <WhoWeFightForSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  )
}