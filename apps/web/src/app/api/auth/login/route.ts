/**
 * @fileMetadata
 * @purpose "Login API endpoint with rate limiting and bot protection"
 * @dependencies ["@/lib","next"]
 * @owner security-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { BotProtection, HONEYPOT_FIELDS } from '@/lib/security/bot-protection'
import { withRateLimit } from '@/lib/security/rate-limiter'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    'auth-login',
    {
      maxRequests: 5, // 5 login attempts
      windowMs: 15 * 60 * 1000 // per 15 minutes
    },
    async () => {
      try {
        const body = await request.json()
        const { email, password, rememberMe, [HONEYPOT_FIELDS.login]: honeypot } = body

        // Validate required fields
        if (!email || !password) {
          return NextResponse.json({
            success: false,
            error: 'Email and password are required'
          }, { status: 400 })
        }

        // Check honeypot
        if (honeypot) {
          logger.warn('Honeypot triggered on login API', {
            email,
            honeypotValue: honeypot,
            userAgent: request.headers.get('user-agent')
          })

          // Fake delay to not alert the bot
          await new Promise(resolve => setTimeout(resolve, 2000))

          return NextResponse.json({
            success: false,
            error: 'Invalid credentials'
          }, { status: 401 })
        }

        // Additional bot check
        const botProtection = new BotProtection()
        const botCheck = botProtection.checkRequest(request)

        if (botCheck.shouldBlock) {
          logger.warn('Bot detected on login API', {
            email,
            confidence: botCheck.confidence,
            reasons: botCheck.reasons
          })

          return NextResponse.json({
            success: false,
            error: 'Access denied'
          }, { status: 403 })
        }

        // Proceed with login
        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          logger.warn('Login failed', {
            email,
            error: error.message,
            errorCode: error.code
          })

          // Handle specific error cases
          if (error.message.includes('Email not confirmed')) {
            return NextResponse.json({
              success: false,
              error: 'Please verify your email before logging in',
              errorCode: 'AUTH_EMAIL_NOT_VERIFIED'
            }, { status: 401 })
          }

          if (error.message.includes('Invalid login credentials')) {
            return NextResponse.json({
              success: false,
              error: 'Invalid email or password',
              errorCode: 'AUTH_INVALID_CREDENTIALS'
            }, { status: 401 })
          }

          return NextResponse.json({
            success: false,
            error: error.message,
            errorCode: error.code || 'AUTH_ERROR'
          }, { status: 401 })
        }

        // Log successful login
        logger.info('User logged in', {
          userId: data.user?.id,
          email: data.user?.email,
          rememberMe
        })

        // Return success response
        const response = NextResponse.json({
          success: true,
          user: {
            id: data.user?.id,
            email: data.user?.email,
            emailConfirmed: data.user?.email_confirmed_at !== null
          },
          requiresChallenage: botCheck.shouldChallenge
        })

        // Set bot challenge header if needed
        if (botCheck.shouldChallenge) {
          response.headers.set('X-Bot-Challenge', 'true')
          response.headers.set('X-Bot-Confidence', botCheck.confidence.toString())
        }

        return response

      } catch (error) {
        logger.error('Login API error', {}, error as Error)

        return NextResponse.json({
          success: false,
          error: 'An unexpected error occurred'
        }, { status: 500 })
      }
    }
  )
}
