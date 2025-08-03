/**
 * @fileMetadata
 * @purpose FAQ page for common questions
 * @owner frontend-team
 * @status active
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, MessageCircle, Shield, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | ClaimGuardian',
  description: 'Get answers to common questions about ClaimGuardian AI-powered insurance claim assistance',
}

const faqs = [
  {
    category: "Getting Started",
    icon: <Zap className="w-5 h-5" />,
    questions: [
      {
        q: "What is ClaimGuardian?",
        a: "ClaimGuardian is an AI-powered platform that helps Florida property owners navigate insurance claims more effectively. We provide tools for damage documentation, claim assistance, and settlement analysis."
      },
      {
        q: "How much does ClaimGuardian cost?",
        a: "We offer a free tier with basic features and premium plans starting at $29/month for enhanced AI tools and personalized support."
      },
      {
        q: "Is my data secure?",
        a: "Yes, we use enterprise-grade security including 256-bit encryption, secure data storage, and strict privacy controls. Your personal information is never shared without your consent."
      }
    ]
  },
  {
    category: "AI Features",
    icon: <MessageCircle className="w-5 h-5" />,
    questions: [
      {
        q: "How accurate is the AI damage analysis?",
        a: "Our AI models are trained on thousands of insurance claims and achieve high accuracy rates. However, AI suggestions should always be verified with professionals and insurance adjusters."
      },
      {
        q: "Can the AI replace my insurance adjuster?",
        a: "No, our AI is designed to assist and inform, not replace professional adjusters. It helps you prepare better documentation and understand your claim, but final decisions are made by qualified professionals."
      },
      {
        q: "What types of damage can the AI analyze?",
        a: "Our AI can analyze various types of property damage including water damage, wind damage, hail damage, fire damage, and structural issues common in Florida."
      }
    ]
  },
  {
    category: "Claims Process",
    icon: <Shield className="w-5 h-5" />,
    questions: [
      {
        q: "Do you work with all insurance companies?",
        a: "Yes, our tools and guidance work with all major insurance companies. We're familiar with Florida insurance regulations and company-specific processes."
      },
      {
        q: "Can you guarantee a higher settlement?",
        a: "We cannot guarantee specific outcomes, but our tools help you document damage thoroughly and understand your policy better, which often leads to more accurate claim settlements."
      },
      {
        q: "How long does the claim process typically take?",
        a: "Claim timelines vary by complexity and insurance company, but our tools help expedite the process by ensuring proper documentation from the start."
      }
    ]
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-slate-300">
            Get answers to common questions about ClaimGuardian and our AI-powered insurance claim assistance.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-slate-800/50 rounded-lg border border-slate-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-semibold text-white">{section.category}</h2>
              </div>
              
              <div className="space-y-6">
                {section.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="border-b border-slate-700 last:border-b-0 pb-6 last:pb-0">
                    <h3 className="text-lg font-medium text-white mb-3">{faq.q}</h3>
                    <p className="text-slate-300 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-semibold text-white mb-4">Still have questions?</h3>
          <p className="text-slate-300 mb-6">
            Our support team is here to help you navigate your insurance claim successfully.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
            >
              Contact Support
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-3 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}