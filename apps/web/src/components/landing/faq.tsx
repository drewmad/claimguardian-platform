/**
 * @fileMetadata
 * @purpose FAQ section with collapsible questions
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["FAQ"]
 * @complexity medium
 * @tags ["landing", "faq", "support"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: "How quickly can I get started with ClaimGuardian?",
    answer: "You can start documenting your claim immediately after signing up. Simply upload your insurance policy and any existing claim documents, and our AI will begin analyzing your coverage within minutes."
  },
  {
    question: "Is ClaimGuardian a replacement for hiring a public adjuster?",
    answer: "ClaimGuardian complements the work of public adjusters by providing powerful documentation and analysis tools. Many public adjusters actually use our platform to enhance their services. We help you build a stronger case whether you work with an adjuster or handle the claim yourself."
  },
  {
    question: "What types of insurance claims does ClaimGuardian support?",
    answer: "We support all types of property insurance claims including hurricane damage, flood damage, fire damage, theft, vandalism, and general property damage. Our AI is trained on thousands of successful claims across all categories."
  },
  {
    question: "How secure is my information?",
    answer: "We use bank-level encryption and security protocols to protect your data. All documents are stored in secure cloud servers with automatic backups. Your information is never shared with insurance companies unless you explicitly choose to do so."
  },
  {
    question: "What if my claim has already been denied?",
    answer: "Many initially denied claims are later approved with proper documentation. ClaimGuardian helps you identify why your claim was denied and build a comprehensive appeal with evidence that addresses the specific reasons for denial."
  },
  {
    question: "How much does ClaimGuardian cost?",
    answer: "We offer flexible pricing plans starting at $49/month for homeowners. There's also a 14-day free trial so you can experience the full power of our platform risk-free. Public adjusters and businesses can contact us for custom pricing."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-3xl mx-auto mb-12">
          Got questions? We've got answers.
        </p>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/70 transition-colors"
              >
                <span className="font-semibold text-lg pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}