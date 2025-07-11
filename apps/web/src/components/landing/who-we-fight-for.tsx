/**
 * @fileMetadata
 * @purpose Who We Fight For section with animated images
 * @owner frontend-team
 * @dependencies ["react"]
 * @exports ["WhoWeFightFor"]
 * @complexity medium
 * @tags ["landing", "advocacy", "gallery"]
 * @status active
 */
'use client'

import Image from 'next/image'

const images = [
  {
    src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    alt: 'Family home',
    title: 'Families Fighting for Fair Settlements'
  },
  {
    src: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&h=300&fit=crop',
    alt: 'Business property',
    title: 'Businesses Protecting Their Future'
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    alt: 'Storm damage',
    title: 'Communities Recovering from Disasters'
  }
]

export function WhoWeFightFor() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Who We Fight For
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-3xl mx-auto mb-12">
          Behind every claim is a story. We&apos;re here to ensure your story ends with the settlement you deserve.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {images.map((image, index) => (
            <div 
              key={index}
              className="relative group overflow-hidden rounded-lg"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
              }}
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <h3 className="absolute bottom-4 left-4 right-4 text-white font-bold text-lg">
                  {image.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}