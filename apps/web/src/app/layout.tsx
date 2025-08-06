/**
 * @fileMetadata
 * @purpose "Root layout component for the Next.js application, defining the HTML structure, metadata, and global styles."
 * @owner frontend-team
 * @dependencies ["next", "react"]
 * @exports ["metadata", "RootLayout"]
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-06T00:00:00Z
 * @complexity low
 * @tags ["layout", "root", "nextjs", "accessibility"]
 * @status stable
 * @notes Defines the basic HTML structure, imports global CSS, and includes accessibility enhancements.
 */
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/components/auth/auth-provider'
import { CookieConsentSimple } from '@/components/cookie-consent-simple'
import { QueryProvider } from '@/components/providers/query-provider'
import { ErrorBoundary } from '@/lib/error-handling/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClaimGuardian - Your Property\'s Complete Story, Protected Forever',
  description: 'AI-powered property intelligence network that creates a living digital twin of everything you own. Track warranties, optimize maintenance, protect investments, and preserve your legacy. Built by Florida family for Florida families.',
  keywords: 'property management Florida, AI property intelligence, warranty tracking, digital twin property, Florida hurricane protection, property insurance optimization, generational wealth building, community resilience Florida',
  authors: [{ name: 'ClaimGuardian Family Team' }],
  creator: 'ClaimGuardian',
  publisher: 'ClaimGuardian',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://claimguardianai.com',
    title: 'ClaimGuardian - Your Property\'s Complete Story, Protected Forever',
    description: 'Transform property ownership from anxiety into wealth building. AI-powered platform tracks everything you own, protects your investments, and preserves your legacy with complete privacy control.',
    siteName: 'ClaimGuardian',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClaimGuardian - Property Intelligence for Florida Families',
    description: 'Built by Florida family who survived Hurricane Ian. AI-powered property management that protects your investments and preserves your legacy.',
    creator: '@claimguardian',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-900 text-white`}>
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="skip-link sr-only-focusable focus:ring-2 focus:ring-accent-border focus:ring-offset-2"
          aria-label="Skip to main content"
        >
          Skip to main content
        </a>

        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {/* Main content wrapper with proper semantic structure */}
              <div id="main-content" role="main" tabIndex={-1}>
                {children}
              </div>
              
              {/* Toast notifications with accessibility attributes */}
              <div aria-live="polite" aria-atomic="true">
                <Toaster 
                  position="top-right" 
                  richColors 
                  closeButton
                  toastOptions={{
                    duration: 5000,
                    role: 'status',
                    ariaProps: {
                      role: 'status',
                      'aria-live': 'polite',
                    },
                  }}
                />
              </div>
              
              {/* Cookie consent with proper ARIA attributes */}
              <div role="complementary" aria-label="Cookie consent">
                <CookieConsentSimple />
              </div>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>

        {/* Hidden screen reader announcement area */}
        <div 
          id="screen-reader-announcements" 
          aria-live="assertive" 
          aria-atomic="true" 
          className="sr-only"
        />
      </body>
    </html>
  )
}