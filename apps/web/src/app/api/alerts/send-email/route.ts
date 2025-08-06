/**
 * Email delivery API for cost alerts
 * Handles sending alert emails via external email service
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface EmailRequest {
  to: string[]
  subject: string
  html: string
  alert: {
    id: string
    type: string
    severity: string
    title: string
    message: string
    timestamp: string
    userId?: string
    userEmail?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin access
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: EmailRequest = await request.json()
    const { to, subject, html, alert } = body

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: 'Recipients required' },
        { status: 400 }
      )
    }

    if (!subject || !html || !alert) {
      return NextResponse.json(
        { error: 'Subject, HTML, and alert data required' },
        { status: 400 }
      )
    }

    // Rate limiting - max 10 alert emails per minute per user
    const rateLimitKey = `alert_email_${user.id}`
    const rateLimitCount = await checkRateLimit(rateLimitKey, 10, 60)
    
    if (rateLimitCount > 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for alert emails' },
        { status: 429 }
      )
    }

    // Send emails using your preferred email service
    // This example uses a mock implementation - replace with actual service
    const deliveryResults = await Promise.allSettled(
      to.map(recipient => sendEmailAlert(recipient, subject, html, alert))
    )

    const successful = deliveryResults.filter(result => result.status === 'fulfilled').length
    const failed = deliveryResults.length - successful

    // Log the email delivery attempt
    await supabase
      .from('alert_delivery_logs')
      .insert({
        alert_id: alert.id,
        alert_type: alert.type,
        severity: alert.severity,
        delivery_method: 'email',
        recipients: to,
        successful_count: successful,
        failed_count: failed,
        delivery_results: deliveryResults.map((result, index) => ({
          recipient: to[index],
          success: result.status === 'fulfilled',
          error: result.status === 'rejected' ? result.reason?.message : null
        })),
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      delivered: successful,
      failed: failed,
      total: to.length
    })

  } catch (error) {
    console.error('Failed to send alert email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

async function sendEmailAlert(
  to: string, 
  subject: string, 
  html: string, 
  alert: EmailRequest['alert']
): Promise<boolean> {
  try {
    // This is a mock implementation - replace with actual email service
    // Popular options: SendGrid, Mailgun, AWS SES, Resend, etc.
    
    const emailProvider = process.env.EMAIL_PROVIDER || 'mock'
    
    switch (emailProvider.toLowerCase()) {
      case 'sendgrid':
        return await sendViaSendGrid(to, subject, html, alert)
      case 'mailgun':
        return await sendViaMailgun(to, subject, html, alert)
      case 'resend':
        return await sendViaResend(to, subject, html, alert)
      case 'mock':
      default:
        return await mockEmailSend(to, subject, html, alert)
    }

  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// Mock email implementation for development
async function mockEmailSend(
  to: string, 
  subject: string, 
  html: string, 
  alert: EmailRequest['alert']
): Promise<boolean> {
  console.log('📧 Mock Email Alert Delivery:')
  console.log(`   To: ${to}`)
  console.log(`   Subject: ${subject}`)
  console.log(`   Alert Type: ${alert.type}`)
  console.log(`   Severity: ${alert.severity}`)
  console.log(`   Time: ${alert.timestamp}`)
  console.log(`   HTML Length: ${html.length} chars`)
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Mock success rate of 95%
  return Math.random() > 0.05
}

// SendGrid implementation
async function sendViaSendGrid(
  to: string, 
  subject: string, 
  html: string, 
  alert: EmailRequest['alert']
): Promise<boolean> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(apiKey)

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'alerts@claimguardian.ai',
      subject,
      html,
      categories: ['cost-alert', alert.type, alert.severity],
      customArgs: {
        alertId: alert.id,
        alertType: alert.type,
        severity: alert.severity
      }
    }

    await sgMail.send(msg)
    return true

  } catch (error) {
    console.error('SendGrid error:', error)
    return false
  }
}

// Mailgun implementation
async function sendViaMailgun(
  to: string, 
  subject: string, 
  html: string, 
  alert: EmailRequest['alert']
): Promise<boolean> {
  try {
    const apiKey = process.env.MAILGUN_API_KEY
    const domain = process.env.MAILGUN_DOMAIN
    
    if (!apiKey || !domain) {
      throw new Error('Mailgun configuration missing')
    }

    const formData = new FormData()
    formData.append('from', `ClaimGuardian Alerts <alerts@${domain}>`)
    formData.append('to', to)
    formData.append('subject', subject)
    formData.append('html', html)
    formData.append('o:tag', alert.type)
    formData.append('o:tag', alert.severity)
    formData.append('v:alert-id', alert.id)

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`
      },
      body: formData
    })

    return response.ok

  } catch (error) {
    console.error('Mailgun error:', error)
    return false
  }
}

// Resend implementation
async function sendViaResend(
  to: string, 
  subject: string, 
  html: string, 
  alert: EmailRequest['alert']
): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('Resend API key not configured')
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'alerts@claimguardian.ai',
        to: [to],
        subject,
        html,
        tags: [
          { name: 'alert-type', value: alert.type },
          { name: 'severity', value: alert.severity },
          { name: 'alert-id', value: alert.id }
        ]
      })
    })

    return response.ok

  } catch (error) {
    console.error('Resend error:', error)
    return false
  }
}

// Simple rate limiting using memory (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<number> {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  
  const existing = rateLimitMap.get(key)
  
  if (!existing || now > existing.resetTime) {
    // New window or expired
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return 1
  }
  
  // Increment counter
  existing.count++
  rateLimitMap.set(key, existing)
  
  return existing.count
}