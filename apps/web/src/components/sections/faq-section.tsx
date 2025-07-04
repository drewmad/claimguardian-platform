/**
 * @fileMetadata
 * @purpose Displays a list of frequently asked questions with expandable answers.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@claimguardian/ui"]
 * @exports ["FaqSection"]
 * @complexity medium
 * @tags ["component", "section", "landing-page", "faq"]
 * @status active
 */
/**
 * @fileMetadata
 * @purpose Displays a list of frequently asked questions with expandable answers.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@claimguardian/ui"]
 * @exports ["FaqSection"]
 * @complexity medium
 * @tags ["component", "section", "landing-page", "faq"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, Button } from '@claimguardian/ui'

interface FaqItem {
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    question: 'How much does ClaimGuardian cost?',
    answer: 'Signing up and getting an AI-powered review of your insurance policy is completely free. You only pay if you decide to use our premium tools to generate a claim package or partner with a licensed professional from our network.'
  },
  {
    question: 'Is this a replacement for a public adjuster or attorney?',
    answer: 'ClaimGuardian is a powerful tool to help you manage your own claim effectively. For complex cases, we can connect you with a network of vetted, licensed public adjusters and attorneys in Florida. Our platform ensures that if you do need a professional, they start with a perfectly organized, evidence-rich file, saving them time and you money.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use bank-level encryption to protect your personal information and claim details. Your data is confidential and will never be shared without your explicit consent. Please see our Privacy Policy for more details.'
  }
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white section-title-underline inline-block">
            Frequently Asked Questions
          </h3>
        </div>
        <div className="mt-12 space-y-4">
          {faqItems.map((item, index) => (
            <Card key={index} className="card-bg rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center text-left p-5 hover:bg-slate-800/50"
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              >
                <span className="text-lg font-semibold text-white">
                  {item.question}
                </span>
                <ChevronDown 
                  className={`w-6 h-6 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </Button>
              <div 
                className={`px-5 overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === index ? 'max-h-48 pb-5' : 'max-h-0'
                }`}
              >
                <p className="text-slate-300">{item.answer}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}