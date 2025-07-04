'use client'

/**
 * @fileMetadata
 * @purpose Landing page for unauthenticated users with sign-up and login functionality.
 * @owner frontend-team
 * @dependencies ["react", "@/components/sections/*", "@/components/modals/*", "@/components/layout/footer"]
 * @exports ["LandingPage"]
 * @complexity medium
 * @tags ["landing-page", "authentication", "public"]
 * @status active
 * @notes This is the public landing page that leads users to sign up or log in.
 */
import React, { useState } from 'react';
import { Button } from '@claimguardian/ui';
import { HeroSection } from '@/components/sections/hero-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { WhoWeServeSection } from '@/components/sections/who-we-serve-section';
import { HowItWorksSection } from '@/components/sections/how-it-works-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { WhoWeFightForSection } from '@/components/sections/who-we-fight-for-section';
import { FaqSection } from '@/components/sections/faq-section';
import { CtaSection } from '@/components/sections/cta-section';
import { Footer } from '@/components/layout/footer';
import { SignupModal } from '@/components/modals/signup-modal';
import { LoginModal } from '@/components/modals/login-modal';

export default function LandingPage() {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
    // Redirect to dashboard after successful signup
    window.location.href = '/dashboard';
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Redirect to dashboard after successful login
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CG</span>
              </div>
              <span className="text-xl font-bold text-white">ClaimGuardian</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowLoginModal(true)}
                className="text-slate-300 hover:text-white"
              >
                Log In
              </Button>
              <Button 
                onClick={() => setShowSignupModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <HeroSection />
        <WhoWeServeSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <WhoWeFightForSection />
        <FaqSection />
        <CtaSection />
      </main>

      <Footer />

      {/* Modals */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}


