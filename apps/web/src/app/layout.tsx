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
  title: 'ClaimGuardian - AI Insurance Claims Platform for Florida Property Owners',
  description: 'ClaimGuardian helps Florida property owners maximize insurance claim settlements using AI-powered damage assessment, policy analysis, and evidence organization. Document damage in 15 minutes, get settlement analysis, and recover the full value of your claim.',
  keywords: 'Florida insurance claims, AI damage assessment, property insurance Florida, hurricane damage claims, flood insurance claims, claim settlement analysis, insurance claim help Florida',
  authors: [{ name: 'ClaimGuardian Team' }],
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
    title: 'ClaimGuardian - AI Insurance Claims Platform for Florida',
    description: 'Maximize your Florida insurance claim settlements with AI-powered damage assessment and policy analysis. Built specifically for Florida property owners.',
    siteName: 'ClaimGuardian',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClaimGuardian - AI Insurance Claims for Florida',
    description: 'AI-powered platform helping Florida property owners maximize insurance claim settlements',
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