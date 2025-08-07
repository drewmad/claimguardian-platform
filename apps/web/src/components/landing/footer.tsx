/**
 * @fileMetadata
 * @purpose "Footer with comprehensive sitemap and company info"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/constants"]
 * @exports ["Footer"]
 * @complexity medium
 * @tags ["landing", "footer", "navigation"]
 * @status stable
 */
'use client'

import { Mail, X, FileText, Shield, Eye, LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { COLORS } from '@/lib/constants'

// Legal Modal Component
const LegalModal = ({
  isOpen,
  onClose,
  title,
  content,
  icon: Icon
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  icon: LucideIcon
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="text-green-400" size={24} />
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed whitespace-pre-line">
              {content}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur border-t border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Sample legal content
const LEGAL_CONTENT = {
  privacy: `ClaimGuardian Privacy Policy

Last Updated: January 2025

1. INFORMATION WE COLLECT

Personal Information:
• Name, email address, phone number
• Property details and documentation
• Insurance policy information
• Claim history and damage assessments

Automatically Collected Information:
• Device information and IP address
• Usage patterns and preferences
• Location data (with permission)
• AI interaction logs for service improvement

2. HOW WE USE YOUR INFORMATION

• Provide AI-powered property intelligence services
• Generate damage assessments and claim recommendations
• Maintain digital property twins and warranty tracking
• Communicate about your property and claims
• Improve our AI models and services
• Comply with legal and regulatory requirements

3. DATA SECURITY

We implement bank-level security measures including:
• End-to-end encryption for all sensitive data
• Secure cloud storage with AWS/Supabase
• Regular security audits and vulnerability assessments
• Multi-factor authentication requirements
• Zero-trust architecture principles

4. DATA SHARING

We do not sell your personal information. We may share data with:
• Service providers (contractors, adjusters) with your consent
• Insurance companies when filing claims
• Legal authorities when required by law
• AI model providers for processing (anonymized)

5. YOUR RIGHTS

Florida residents have the right to:
• Access, correct, or delete personal information
• Opt-out of AI processing for non-essential features
• Request data portability
• File complaints with regulatory authorities

6. FLORIDA-SPECIFIC PROTECTIONS

• Compliance with Florida Personal Information Protection Act
• Enhanced protections for hurricane and disaster-related data
• Specialized handling of insurance claim information
• Coordination with Florida Department of Financial Services

Contact: privacy@claimguardianai.com
Phone: (239) 555-0123`,

  terms: `ClaimGuardian Terms of Service

Last Updated: January 2025

1. ACCEPTANCE OF TERMS

By using ClaimGuardian services, you agree to these Terms of Service and our Privacy Policy. These terms constitute a binding agreement between you and ClaimGuardian, Inc.

2. SERVICE DESCRIPTION

ClaimGuardian provides AI-powered property intelligence services including:
• Digital property twin creation and management
• AI-assisted damage analysis and documentation
• Insurance claim guidance and optimization
• Warranty tracking and maintenance scheduling
• Property valuation and investment insights

3. USER RESPONSIBILITIES

You agree to:
• Provide accurate property and personal information
• Use the service only for lawful purposes
• Maintain confidentiality of your account credentials
• Report suspected security breaches immediately
• Comply with all applicable Florida and federal laws

4. AI SERVICES DISCLAIMER

Our AI-powered features:
• Provide guidance and analysis, not professional advice
• Should be verified by qualified professionals
• May not be 100% accurate in all situations
• Are continuously improved based on user feedback
• Should not replace proper insurance coverage

5. LIMITATION OF LIABILITY

ClaimGuardian's liability is limited to the amount paid for services in the preceding 12 months. We are not liable for:
• Indirect, consequential, or punitive damages
• Loss of profits, data, or business opportunities
• Third-party actions or decisions
• Force majeure events including natural disasters

6. FLORIDA JURISDICTION

These terms are governed by Florida law. Disputes will be resolved through:
• Good faith negotiation
• Mediation in Lee County, Florida
• Arbitration under Florida Arbitration Code
• Florida state courts as last resort

7. TERMINATION

Either party may terminate this agreement with 30 days notice. Upon termination:
• You retain ownership of your data
• We will provide data export for 90 days
• Certain provisions survive termination
• Refunds are provided on a pro-rata basis

8. MODIFICATIONS

We may update these terms with 30 days notice via:
• Email to your registered address
• In-app notifications
• Website announcements
• Postal mail for material changes

Contact: legal@claimguardianai.com
Phone: (239) 555-0123`,

  aiUse: `AI Use Agreement

Last Updated: January 2025

1. AI SERVICES OVERVIEW

ClaimGuardian uses artificial intelligence to provide:
• Automated damage assessment from photos
• Property valuation and market analysis
• Claim optimization recommendations
• Predictive maintenance scheduling
• Natural language processing for documents

2. AI DATA PROCESSING

Your data may be processed by:
• OpenAI GPT-4 models (encrypted)
• Google Gemini Pro (anonymized)
• Custom ClaimGuardian AI models
• Third-party vision recognition services

3. ACCURACY DISCLAIMER

AI recommendations are:
• Based on available data and algorithms
• Subject to limitations and biases
• Not guaranteed to be error-free
• Should be verified by professionals
• Continuously improved through feedback

4. DATA USAGE FOR AI TRAINING

We may use anonymized data to:
• Improve AI model accuracy
• Train specialized Florida property models
• Enhance damage recognition capabilities
• Develop better claim prediction algorithms

You can opt-out of AI training data usage at any time.

5. AI TRANSPARENCY

We provide:
• Explanations for AI recommendations
• Confidence scores for assessments
• Alternative scenarios and options
• Human review options for complex cases

6. YOUR CONTROL OVER AI

You can:
• Request human review of AI decisions
• Adjust AI sensitivity settings
• Opt-out of specific AI features
• Export AI-generated reports and data

Contact: ai-ethics@claimguardianai.com`
}

export function Footer() {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const openModal = (modalType: string) => setActiveModal(modalType)
  const closeModal = () => setActiveModal(null)

  return (
    <>
      <footer className="px-6 md:px-12 py-12 border-t" style={{ borderColor: COLORS.glass.border, backgroundColor: 'rgba(13, 17, 23, 0.5)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="font-slab font-bold text-xl mb-4 text-white">ClaimGuardian</h3>
          <p className="text-gray-300 pr-4 mb-4">
            Your AI-powered property intelligence network for comprehensive asset protection.
          </p>
          <div className="space-y-2 text-sm text-gray-300">
            <p className="flex items-center gap-2">
              <Mail size={16} />
              <a href="mailto:support@claimguardian.com" className="hover:text-white">support@claimguardian.com</a>
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Florida-focused property intelligence
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
            <li>
              <button
                onClick={() => openModal('privacy')}
                className="hover:text-white transition-colors text-left"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => openModal('terms')}
                className="hover:text-white transition-colors text-left"
              >
                Terms of Service
              </button>
            </li>
            <li>
              <button
                onClick={() => openModal('aiUse')}
                className="hover:text-white transition-colors text-left"
              >
                AI Use Agreement
              </button>
            </li>
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

    {/* Legal Modals */}
    <LegalModal
      isOpen={activeModal === 'privacy'}
      onClose={closeModal}
      title="Privacy Policy"
      content={LEGAL_CONTENT.privacy}
      icon={Shield}
    />
    <LegalModal
      isOpen={activeModal === 'terms'}
      onClose={closeModal}
      title="Terms of Service"
      content={LEGAL_CONTENT.terms}
      icon={FileText}
    />
    <LegalModal
      isOpen={activeModal === 'aiUse'}
      onClose={closeModal}
      title="AI Use Agreement"
      content={LEGAL_CONTENT.aiUse}
      icon={Eye}
    />
    </>
  )
}
