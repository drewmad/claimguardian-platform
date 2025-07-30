/**
 * @fileMetadata
 * @purpose Email service using Resend for transactional emails
 * @owner communications-team
 * @status active
 */

import { Resend } from 'resend'
import { logger } from '@/lib/logger'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@claimguardianai.com'
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || 'support@claimguardianai.com'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = REPLY_TO_EMAIL,
  tags = []
}: EmailOptions): Promise<EmailResult> {
  try {
    // Validate inputs
    if (!to || !subject || (!html && !text)) {
      throw new Error('Missing required email parameters')
    }

    // Add default tags
    const emailTags = [
      { name: 'app', value: 'claimguardian' },
      { name: 'environment', value: process.env.NODE_ENV || 'development' },
      ...tags
    ]

    // Send email
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo: replyTo,
      tags: emailTags
    })

    if (error) {
      logger.error('Failed to send email', { error, to, subject })
      return { success: false, error: error.message }
    }

    logger.info('Email sent successfully', { 
      id: data?.id, 
      to: Array.isArray(to) ? to.join(', ') : to, 
      subject 
    })

    return { success: true, id: data?.id }

  } catch (error) {
    logger.error('Error sending email', { to, subject }, error as Error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}

/**
 * Send bulk emails (up to 100 recipients)
 */
export async function sendBulkEmails(
  recipients: Array<{
    to: string
    subject: string
    html?: string
    text?: string
    tags?: Array<{ name: string; value: string }>
  }>
): Promise<Array<EmailResult>> {
  try {
    if (recipients.length > 100) {
      throw new Error('Cannot send more than 100 emails at once')
    }

    const emails = recipients.map(recipient => ({
      from: FROM_EMAIL,
      to: recipient.to,
      subject: recipient.subject,
      html: recipient.html,
      text: recipient.text,
      replyTo: REPLY_TO_EMAIL,
      tags: [
        { name: 'app', value: 'claimguardian' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' },
        { name: 'bulk', value: 'true' },
        ...(recipient.tags || [])
      ]
    }))

    const { data, error } = await resend.batch.send(emails as any)

    if (error) {
      logger.error('Failed to send bulk emails', { error, count: recipients.length })
      return recipients.map(() => ({ success: false, error: error.message }))
    }

    logger.info('Bulk emails sent successfully', { 
      count: data?.data?.length || 0,
      ids: data?.data?.map(d => d.id).join(', ')
    })

    return data?.data?.map(d => ({ 
      success: true, 
      id: d.id 
    })) || []

  } catch (error) {
    logger.error('Error sending bulk emails', { count: recipients.length }, error as Error)
    return recipients.map(() => ({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }))
  }
}

/**
 * Send email with rate limiting protection
 */
export async function sendEmailWithRateLimit(
  options: EmailOptions,
  userId?: string
): Promise<EmailResult> {
  try {
    // TODO: Implement rate limiting using Redis or database
    // For now, just send the email
    return await sendEmail(options)
  } catch (error) {
    logger.error('Error in rate-limited email send', { userId }, error as Error)
    return { 
      success: false, 
      error: 'Failed to send email' 
    }
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize email content to prevent injection
 */
export function sanitizeEmailContent(content: string): string {
  // Remove any script tags or potentially harmful content
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}