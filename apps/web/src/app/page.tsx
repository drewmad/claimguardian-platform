/**
 * @fileMetadata
 * @purpose Public landing page for ClaimGuardian with hero section and authentication options.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@claimguardian/ui"]
 * @exports ["LandingPage"]
 * @complexity medium
 * @tags ["landing", "public", "authentication", "hero"]
 * @status active
 * @notes This is the public landing page that users see before authentication.
 */
'use client'

import React, { useState } from 'react';
import { Shield, CheckCircle, Users, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@claimguardian/ui';
import { SignupModal } from '@/components/modals/signup-modal';

export default function LandingPage() {
  const [showSignupModal, setShowSignupModal] = useState(false);

  const features = [
    {
      icon: Shield,
      title: "AI-Powered Protection",
      description: "Advanced AI analyzes your policies and identifies coverage gaps before disasters strike."
    },
    {
      icon: FileText,
      title: "Smart Document Management",
      description: "Automatically organize and digitize all your important documents in one secure location."
    },
    {
      icon: Users,
      title: "Expert Advocacy",
      description: "Professional claim advocates fight for maximum settlements on your behalf."
    },
    {
      icon: CheckCircle,
      title: "Streamlined Claims",
      description: "Submit claims 10x faster with pre-populated forms and automated documentation."
    }
  ];

  const handleSignIn = () => {
    // Navigate to sign-in page (we'll create this next)
    window.location.href = '/auth/signin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="relative z-50 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">ClaimGuardian</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleSignIn}
                className="text-slate-300 hover:text-white"
              >
                Sign In
              </Button>
              <Button
                onClick={() => setShowSignupModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Stop Fighting Insurance Companies
              <span className="block text-blue-400">Start Winning Claims</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto">
              Stop wasting hours deciphering complex policies and chasing adjusters. 
              ClaimGuardian's AI-powered platform automates the most tedious parts of the claims process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => setShowSignupModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handleSignIn}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg"
              >
                Sign In to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose ClaimGuardian?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Our AI-powered platform gives you the tools and expertise to maximize your insurance claims.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
                <feature.icon className="h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Claims?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of homeowners who've maximized their insurance settlements with ClaimGuardian.
          </p>
          <Button
            size="lg"
            onClick={() => setShowSignupModal(true)}
            className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-4 text-lg font-semibold"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">ClaimGuardian</span>
            </div>
            <div className="flex space-x-8 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 ClaimGuardian. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={() => {
          setShowSignupModal(false);
          // Navigate to dashboard after successful signup
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
}