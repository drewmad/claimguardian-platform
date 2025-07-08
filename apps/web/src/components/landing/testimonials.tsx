/**
 * @fileMetadata
 * @purpose Testimonials section with carousel
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["Testimonials"]
 * @complexity medium
 * @tags ["landing", "testimonials", "social-proof"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'

const testimonials = [
  {
    quote: "ClaimGuardian turned my denied roof claim into a $47,000 settlement. Their AI found coverage I didn't even know I had!",
    author: "Sarah Mitchell",
    location: "Miami, FL",
    claim: "Hurricane Damage - $47,000 Settlement",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
  },
  {
    quote: "After fighting my insurance company for months, ClaimGuardian helped me document everything properly. Settlement increased by 3x!",
    author: "Marcus Chen",
    location: "Tampa, FL", 
    claim: "Water Damage - $28,000 Settlement",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
  },
  {
    quote: "The Evidence Vault saved my claim. When the adjuster 'lost' my photos, I had everything backed up and organized. Game changer!",
    author: "Maria Rodriguez",
    location: "Orlando, FL",
    claim: "Storm Damage - $35,000 Settlement",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
  }
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-16 md:py-24 bg-slate-900/30">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Real Results from Real People
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-3xl mx-auto mb-12">
          Join thousands of property owners who&apos;ve fought back and won.
        </p>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 rounded-lg p-8 md:p-12 border border-slate-700 relative">
            <div className="absolute top-4 right-4 text-6xl text-blue-600/20 font-serif">
              &ldquo;
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <p className="text-xl md:text-2xl font-medium mb-6 text-slate-100">
                {testimonials[currentIndex].quote}
              </p>
              
              <div className="flex items-center gap-4">
                <Image
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].author}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
                <div>
                  <p className="font-bold text-lg">{testimonials[currentIndex].author}</p>
                  <p className="text-slate-400">{testimonials[currentIndex].location}</p>
                  <p className="text-blue-400 text-sm font-medium">
                    {testimonials[currentIndex].claim}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'w-8 bg-blue-600' 
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextTestimonial}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}