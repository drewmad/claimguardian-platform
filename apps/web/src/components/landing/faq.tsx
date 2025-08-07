/**
 * @fileMetadata
 * @purpose "Enhanced FAQ section with categorized questions following best practices"
 * @dependencies ["lucide-react","react"]
 * @owner frontend-team
 * @status stable
 */
"use client";

import React, { useState } from "react";
import { ChevronDown, Phone } from "lucide-react";

type FAQCategory = 'general' | 'pricing' | 'technical' | 'legal';

interface FAQItem {
  question: string;
  answer: string;
  category: FAQCategory;
}

const faqs: FAQItem[] = [
  // General Category
  {
    category: 'general',
    question: "How much does ClaimGuardian cost?",
    answer: "ClaimGuardian starts at $29/month for Homeowner Essentials. Get complete property protection with AI-powered claim advocacy. Want a custom quote? Book a quick call with our team."
  },
  {
    category: 'general', 
    question: "How quickly can I get my property documented?",
    answer: "Most customers complete their initial property documentation in under 2 hours using our AI-powered mobile app. Your digital twin is live immediately, with full protection starting day one."
  },
  {
    category: 'general',
    question: "What happens when I need to file an insurance claim?",
    answer: "ClaimGuardian's AI generates your complete claim documentation in under 10 minutes. Our advocacy team reviews your case within 24 hours and guides you through maximizing your settlement. Average claim increase: 47%."
  },
  {
    category: 'general',
    question: "What if I'm not satisfied with ClaimGuardian?",
    answer: "We offer a 30-day money-back guarantee. If you're not completely satisfied, we'll refund your subscription - no questions asked. Plus, you keep all your property documentation."
  },
  {
    category: 'general',
    question: "Can ClaimGuardian work with my existing insurance company?",
    answer: "Yes! ClaimGuardian works with all Florida insurance carriers. We integrate with your existing policies and help you maximize coverage regardless of your current provider."
  },

  // Pricing Category
  {
    category: 'pricing',
    question: "Do you offer annual discounts?",
    answer: "Yes! Save 20% with annual billing. Homeowner Essentials: $278/year (vs $348). Landlord Pro: $470/year (vs $588). All plans include our 30-day guarantee."
  },
  {
    category: 'pricing',
    question: "What's included in the Homeowner plan vs Landlord Pro?",
    answer: "Homeowner ($29/month): Single property, basic AI features, claim advocacy. Landlord Pro ($49/month): Up to 10 properties, advanced analytics, tenant management, priority support."
  },
  {
    category: 'pricing',
    question: "Are there any hidden fees or setup costs?",
    answer: "No hidden fees ever. What you see is what you pay. Setup is free, support is included, and all AI features are part of your subscription. Cancel anytime with no penalties."
  },

  // Technical Category
  {
    category: 'technical',
    question: "How secure is my property data?",
    answer: "Bank-level encryption protects all data. Your information is stored on SOC 2 compliant servers. You control sharing permissions. We never sell data to third parties. Full audit trail included."
  },
  {
    category: 'technical',
    question: "What devices work with ClaimGuardian?",
    answer: "ClaimGuardian works on all devices: iPhone, Android, desktop, tablet. Cloud-based platform ensures your data is always accessible. Mobile app required for photo documentation and AI features."
  },
  {
    category: 'technical',
    question: "How does the AI actually work?",
    answer: "Our AI analyzes property photos, maintenance records, and warranty data to predict issues, optimize maintenance schedules, and generate claim documentation. Machine learning improves recommendations over time."
  },

  // Legal Category
  {
    category: 'legal',
    question: "Is ClaimGuardian available outside Florida?",
    answer: "Currently Florida-only. Our AI is specifically trained on Florida insurance laws, weather patterns, and building codes. National expansion planned for 2026 starting with hurricane-prone states."
  },
  {
    category: 'legal',
    question: "Do you provide legal advice for insurance disputes?",
    answer: "We provide claim advocacy and documentation support, not legal advice. For complex disputes, we partner with Florida insurance attorneys and public adjusters. Most claims resolve without legal action."
  },
  {
    category: 'legal',
    question: "What happens to my data if I cancel?",
    answer: "You retain access to all property documentation for 90 days after cancellation. Download your complete records anytime. After 90 days, data is permanently deleted per your privacy preferences."
  }
];

export function FAQ() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('general');
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First question open by default

  const categories = [
    { id: 'general' as FAQCategory, label: 'General' },
    { id: 'pricing' as FAQCategory, label: 'Pricing' },
    { id: 'technical' as FAQCategory, label: 'Technical' },
    { id: 'legal' as FAQCategory, label: 'Legal' }
  ];

  const filteredFAQs = faqs.filter(faq => faq.category === activeCategory);

  return (
    <section id="faq" className="py-16 md:py-24 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            <span className="text-white">Still Got Questions?</span>
            <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              We Got You
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            If you're thinking it, someone already asked it and we've answered it here.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-800/50 rounded-lg p-1 backdrop-blur-sm border border-gray-700">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setOpenIndex(0); // Open first question of new category
                }}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => (
              <div
                key={`${activeCategory}-${index}`}
                className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden hover:border-gray-600/50 transition-all"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-800/80 transition-colors"
                >
                  <span className="font-semibold text-lg text-white pr-6">
                    {index + 1}. {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-400 transition-transform flex-shrink-0 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openIndex === index && (
                  <div className="px-8 pb-6 border-t border-gray-700/30">
                    <div className="pt-4">
                      <p className="text-gray-300 leading-relaxed text-lg">
                        {faq.answer}
                      </p>
                      
                      {/* Add call-to-action for specific questions */}
                      {faq.question.includes('custom quote') && (
                        <div className="mt-4 pt-4 border-t border-gray-700/30">
                          <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            <Phone className="w-4 h-4" />
                            Book a call
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Can't find answer CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-6">Couldn't find an answer?</p>
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors border border-gray-600">
              Book a call
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
