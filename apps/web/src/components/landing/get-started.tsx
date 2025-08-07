/**
 * @fileMetadata
 * @purpose "Get Started CTA section"
 * @owner frontend-team
 * @dependencies ["react", "next/link", "@/stores/modal-store"]
 * @exports ["GetStarted"]
 * @complexity low
 * @tags ["landing", "cta", "conversion"]
 * @status stable
 */
'use client'

import React from 'react'
import Link from 'next/link'

import { useModalStore } from '@/stores/modal-store'

export function GetStarted() {
  const { openModal } = useModalStore()

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-blue-900/20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
            Ready to Fight for What's Yours?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of property owners who've taken control of their insurance claims.
            Start your free trial today and see why ClaimGuardian users recover 3x more on average.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/signup"
              className="btn-primary text-white font-bold py-4 px-8 text-lg w-full sm:w-auto text-center"
            >
              Start Your Free Trial
            </Link>
            <button
              onClick={() => openModal('content', {
                title: 'Schedule a Demo',
                content: {
                  description: 'See ClaimGuardian in action with a personalized demo from our team.'
                }
              })}
              className="btn-secondary text-white font-bold py-4 px-8 text-lg w-full sm:w-auto"
            >
              Schedule a Demo
            </button>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
