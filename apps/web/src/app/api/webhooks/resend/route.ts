/**
 * @fileMetadata
 * @purpose "Webhook endpoint for Resend email status updates"
 * @dependencies ["@/lib","crypto","next"]
 * @owner communications-team
 * @status stable
 */

import crypto from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// Resend webhook events
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained'
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    bounce_type?: string
    complaint_type?: string
  }
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const digest = hmac.digest('hex')
  return digest === signature
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    
    // Get signature from headers
    const signature = request.headers.get('resend-signature')
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    
    if (!signature || !webhookSecret) {
      logger.warn('Missing webhook signature or secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      logger.warn('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Parse webhook event
    const event: ResendWebhookEvent = JSON.parse(rawBody)
    
    logger.info('Resend webhook received', {
      type: event.type,
      emailId: event.data.email_id
    })
    
    const supabase = await createClient()
    
    // Map event type to status
    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'bounced'
    }
    
    const status = statusMap[event.type]
    if (!status) {
      logger.warn('Unknown webhook event type', { type: event.type })
      return NextResponse.json({ received: true })
    }
    
    // Update email log status
    const { error } = await supabase.rpc('update_email_status', {
      p_resend_id: event.data.email_id,
      p_status: status,
      p_timestamp: new Date(event.created_at).toISOString()
    })
    
    if (error) {
      logger.error('Failed to update email status', { 
        emailId: event.data.email_id,
        error 
      })
      // Don't return error to Resend - we don't want them to retry
    }
    
    // Handle bounces and complaints
    if (event.type === 'email.bounced' || event.type === 'email.complained') {
      // Log the issue for manual review
      logger.warn('Email delivery issue', {
        type: event.type,
        email: event.data.to[0],
        reason: event.data.bounce_type || event.data.complaint_type
      })
      
      // TODO: Implement suppression list or notification to admin
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    logger.error('Error processing Resend webhook', {}, error as Error)
    // Return success to prevent retries
    return NextResponse.json({ received: true })
  }
}

// Resend requires GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'Resend webhook endpoint',
    status: 'active' 
  })
}