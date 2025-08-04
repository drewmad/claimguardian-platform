/**
 * @fileMetadata
 * @purpose Root layout component for the Next.js application, defining the HTML structure, metadata, and global styles.
 * @owner frontend-team
 * @dependencies ["next", "react"]
 * @exports ["metadata", "RootLayout"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T22:58:17-04:00
 * @complexity low
 * @tags ["layout", "root", "nextjs"]
 * @status active
 * @notes Defines the basic HTML structure and imports global CSS.
 */
import type { Metadata } from 'next'
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#0f172a',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background text-text-primary`}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" richColors />
              <CookieConsentSimple />
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}