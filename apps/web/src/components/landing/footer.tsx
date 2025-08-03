/**
 * @fileMetadata
 * @purpose Footer with comprehensive sitemap and company info
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/constants"]
 * @exports ["Footer"]
 * @complexity medium
 * @tags ["landing", "footer", "navigation"]
 * @status active
 */
'use client'

import { Mail, X } from 'lucide-react'

import { COLORS } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="px-6 md:px-12 py-12 border-t" style={{ borderColor: COLORS.glass.border, backgroundColor: 'rgba(13, 17, 23, 0.5)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="font-slab font-bold text-xl mb-4 text-white">ClaimGuardian</h3>
          <p className="text-gray-300 pr-4 mb-4">
            Your AI-powered shield against Florida's insurance challenges. Built by Floridians, for Floridians.
          </p>
          <div className="space-y-2 text-sm text-gray-300">
            <p className="flex items-center gap-2">
              <Mail size={16} /> 
              <a href="mailto:support@claimguardian.com" className="hover:text-white">support@claimguardian.com</a>
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Built specifically for Florida property protection
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold mb-4 text-white">AI Tools</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="/ai-tools/damage-analyzer" className="hover:text-green-400 transition-colors">Damage Analyzer</a></li>
            <li><a href="/ai-tools/claim-assistant" className="hover:text-green-400 transition-colors">Claim Assistant</a></li>
            <li><a href="/ai-tools/settlement-analyzer" className="hover:text-green-400 transition-colors">Settlement Analyzer</a></li>
            <li><a href="/ai-tools/evidence-organizer" className="hover:text-green-400 transition-colors">Evidence Organizer</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-4 text-white">Quick Start</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="/auth/signup" className="hover:text-blue-400 transition-colors">Join Community</a></li>
            <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a></li>
            <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a></li>
            <li><a href="/hurricane-prep" className="hover:text-blue-400 transition-colors">Hurricane Prep</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-4 text-white">Resources</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="#faq" className="hover:text-purple-400 transition-colors">FAQ</a></li>
            <li><a href="/blog" className="hover:text-purple-400 transition-colors">Florida Claims Blog</a></li>
            <li><a href="/guides" className="hover:text-purple-400 transition-colors">Property Guides</a></li>
            <li><a href="/contact" className="hover:text-purple-400 transition-colors">Contact Support</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-4 text-white">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="/legal/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="/legal/ai-use-agreement" className="hover:text-white transition-colors">AI Use Agreement</a></li>
            <li><a href="/legal/compliance" className="hover:text-white transition-colors">Florida Compliance</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 border-t border-gray-700 pt-6 flex justify-between items-center text-sm text-gray-300">
        <div className="flex items-center gap-4">
          <p>&copy; 2025 ClaimGuardian. All rights reserved.</p>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Visit our X page"><X size={18}/></a>
        </div>
      </div>
    </footer>
  )
}