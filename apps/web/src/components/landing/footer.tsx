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
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-slab font-bold text-lg mb-4">ClaimGuardian</h3>
          <p className="text-sm text-gray-300 pr-4">AI-powered property management software for Florida homeowners, renters, and landlords. Document possessions, protect assets, manage maintenance, and maximize insurance claims.</p>
          <div className="space-y-2 mt-4 text-sm text-gray-300">
            <p className="flex items-center gap-2"><Mail size={16} /> support@claimguardian.com</p>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="#" className="hover:text-white">Features</a></li>
            <li><a href="#" className="hover:text-white">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="#" className="hover:text-white">About Us</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="#" className="hover:text-white">Help Center</a></li>
            <li><a href="#" className="hover:text-white">Contact Us</a></li>
            <li><a href="#" className="hover:text-white">FAQs</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white">Terms of Service</a></li>
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