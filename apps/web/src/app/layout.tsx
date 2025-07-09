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
import * as Sentry from '@sentry/nextjs'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from 'sonner'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    if (event.extra?.password) {
      delete event.extra.password
    }
    return event
  },
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClaimGuardian - AI-Powered Insurance Claim Advocate for Florida',
  description: 'Stop wasting hours deciphering complex policies and chasing adjusters. ClaimGuardian\'s AI-powered platform automates the most tedious parts of the claims process.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-slate-950 text-slate-100`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}