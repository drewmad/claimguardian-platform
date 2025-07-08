/**
 * @fileMetadata
 * @purpose Footer with links and company info
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store"]
 * @exports ["Footer"]
 * @complexity medium
 * @tags ["landing", "footer", "navigation"]
 * @status active
 */
'use client'

import { Mail, Phone, MapPin, Twitter, Linkedin, Facebook } from 'lucide-react'
import { useModalStore } from '@/stores/modal-store'

export function Footer() {
  const { openModal } = useModalStore()
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { label: 'Features', action: () => openModal('content', { title: 'Features' }) },
      { label: 'Pricing', action: () => openModal('content', { title: 'Pricing' }) },
      { label: 'Demo', action: () => openModal('content', { title: 'Schedule Demo' }) },
      { label: 'Case Studies', action: () => openModal('content', { title: 'Case Studies' }) }
    ],
    company: [
      { label: 'About Us', action: () => openModal('content', { title: 'About ClaimGuardian' }) },
      { label: 'Blog', action: () => openModal('content', { title: 'Blog' }) },
      { label: 'Careers', action: () => openModal('content', { title: 'Careers' }) },
      { label: 'Press', action: () => openModal('content', { title: 'Press' }) }
    ],
    support: [
      { label: 'Help Center', action: () => openModal('content', { title: 'Help Center' }) },
      { label: 'Contact Us', action: () => openModal('content', { title: 'Contact Us' }) },
      { label: 'FAQs', action: () => window.scrollTo({ top: document.querySelector('.faq-section')?.getBoundingClientRect().top || 0, behavior: 'smooth' }) },
      { label: 'Status', action: () => openModal('content', { title: 'System Status' }) }
    ],
    legal: [
      { label: 'Privacy Policy', action: () => openModal('content', { title: 'Privacy Policy' }) },
      { label: 'Terms of Service', action: () => openModal('content', { title: 'Terms of Service' }) },
      { label: 'Cookie Policy', action: () => openModal('content', { title: 'Cookie Policy' }) },
      { label: 'GDPR', action: () => openModal('content', { title: 'GDPR Compliance' }) }
    ]
  }

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">ClaimGuardian</h3>
            <p className="text-slate-400 mb-6">
              Empowering property owners to fight insurance companies and win. 
              Built by experts who understand your struggle.
            </p>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Miami, Florida</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>1-800-GUARDIAN</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@claimguardian.com</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {currentYear} ClaimGuardian. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}