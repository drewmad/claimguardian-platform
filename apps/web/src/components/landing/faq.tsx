/**
 * @fileMetadata
 * @purpose "Renders the FAQ section with collapsible questions on the landing page."
 * @dependencies ["lucide-react","react"]
 * @owner frontend-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "FAQ section with collapsible questions"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["FAQ"]
 * @complexity medium
 * @tags ["landing", "faq", "support"]
 * @status stable
 */
"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is ClaimGuardian and how does it protect my property?",
    answer:
      "ClaimGuardian is an AI-powered property intelligence network that creates a living digital twin of everything you own. It tracks warranties, optimizes maintenance, protects investments, and preserves your property legacy. Built by a Florida family who survived Hurricane Ian specifically for comprehensive property management.",
  },
  {
    question: "How does ClaimGuardian track all my possessions and warranties?",
    answer:
      "ClaimGuardian creates a complete digital inventory of your property - from your home's roof to your headphone warranty. Our AI tracks maintenance schedules, warranty expirations, and optimization opportunities for everything you own, helping you save thousands through predictive maintenance and proper documentation.",
  },
  {
    question:
      "What makes ClaimGuardian different from other property management software?",
    answer:
      "ClaimGuardian is built by a Florida family team who survived Hurricane Ian, not Silicon Valley outsiders. We protect your complete property story with bank-level privacy, community wisdom sharing, and generational wealth building focus. Your data stays yours - we develop in-house AI to ensure complete privacy.",
  },
  {
    question:
      "How does ClaimGuardian help with insurance claims and property documentation?",
    answer:
      "ClaimGuardian's AI generates irrefutable documentation for insurance claims in under 10 minutes. Our platform tracks every property detail, warranty, and maintenance record, ensuring you receive every dollar of coverage you're entitled to while saving hours of stressful negotiations.",
  },
  {
    question:
      "Can ClaimGuardian help build generational wealth through property ownership?",
    answer:
      "Yes, ClaimGuardian transforms property ownership from anxiety into wealth building by optimizing maintenance, preserving complete property histories, and enabling seamless knowledge transfer to future generations. Your property story and lessons learned become a legacy, not lost information.",
  },
  {
    question: "How secure is my property data and who has access to it?",
    answer:
      "Your property data is YOUR private information, protected with bank-level encryption. You decide what to share, when to share it, and with whom. We never sell to third parties and develop AI in-house to ensure complete privacy. Community insights are anonymized - your specific data stays yours.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          <span className="text-white">Your Property Intelligence</span>
          <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Questions Answered
          </span>
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-3xl mx-auto mb-12">
          Everything you need to know about building your property's digital
          twin and preserving your legacy.
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
                <span className="font-semibold text-lg pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
                    openIndex === index ? "rotate-180" : ""
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
  );
}
