/**
 * @fileMetadata
 * @purpose Email notification service for user tier and permission changes
 * @owner admin-team
 * @status active
 */

import { UserTier, PermissionType } from '@/lib/permissions/permission-checker'

interface EmailNotificationOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface TierChangeNotification {
  userEmail: string
  oldTier: UserTier
  newTier: UserTier
  reason?: string
  changedBy: string
  effectiveDate?: Date
}

interface PermissionChangeNotification {
  userEmail: string
  tier: UserTier
  changedPermissions: {
    permission: PermissionType
    granted: boolean
    reason?: string
  }[]
  changedBy: string
}

interface UsageLimitNotification {
  userEmail: string
  tier: UserTier
  limitType: 'ai_requests' | 'storage' | 'properties' | 'claims'
  currentUsage: number
  limit: number
  percentageUsed: number
}

export class EmailNotificationService {
  private resendApiKey: string
  private fromEmail: string

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY || ''
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@claimguardianai.com'
  }

  /**
   * Send email notification
   */
  private async sendEmail(options: EmailNotificationOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.resendApiKey) {
        console.warn('RESEND_API_KEY not configured, skipping email notification')
        return { success: false, error: 'Email service not configured' }
      }

      // In production, this would use the Resend API
      // For now, log the email details
      console.log('📧 Email Notification:', {
        to: options.to,
        subject: options.subject,
        html: options.html.substring(0, 200) + '...'
      })

      // Mock successful email send
      return { success: true }
    } catch (error) {
      console.error('Failed to send email notification:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * Generate tier change email template
   */
  private generateTierChangeEmail(notification: TierChangeNotification): { subject: string; html: string; text: string } {
    const isUpgrade = this.getTierLevel(notification.newTier) > this.getTierLevel(notification.oldTier)
    const changeType = isUpgrade ? 'upgraded' : 'downgraded'
    const effectiveDate = notification.effectiveDate ? notification.effectiveDate.toLocaleDateString() : 'immediately'

    const subject = `Your ClaimGuardian subscription has been ${changeType}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; border-radius: 0 0 8px 8px; }
            .tier-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: capitalize; }
            .tier-old { background: #f8d7da; color: #721c24; }
            .tier-new { background: ${isUpgrade ? '#d4edda' : '#fff3cd'}; color: ${isUpgrade ? '#155724' : '#856404'}; }
            .benefits { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .benefit-item { margin: 8px 0; }
            .benefit-item::before { content: '✓'; color: #28a745; font-weight: bold; margin-right: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Subscription ${changeType.charAt(0).toUpperCase() + changeType.slice(1)}</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your ClaimGuardian subscription has been <strong>${changeType}</strong> effective ${effectiveDate}.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <span class="tier-badge tier-old">${notification.oldTier}</span>
                <span style="margin: 0 20px; font-size: 24px;">→</span>
                <span class="tier-badge tier-new">${notification.newTier}</span>
              </div>

              ${notification.reason ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <strong>Reason:</strong> ${notification.reason}
                </div>
              ` : ''}

              <div class="benefits">
                <h3>Your new benefits include:</h3>
                ${this.getTierBenefits(notification.newTier).map(benefit => 
                  `<div class="benefit-item">${benefit}</div>`
                ).join('')}
              </div>

              <p>You can manage your subscription and view usage details in your dashboard.</p>
              
              <div style="text-align: center;">
                <a href="https://claimguardianai.com/dashboard" class="button">View Dashboard</a>
              </div>

              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>The ClaimGuardian Team</p>
            </div>
            <div class="footer">
              <p>This email was sent by ClaimGuardian AI • Changed by: ${notification.changedBy}</p>
              <p>If you believe this was sent in error, please contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Your ClaimGuardian subscription has been ${changeType}
      
      From: ${notification.oldTier}
      To: ${notification.newTier}
      Effective: ${effectiveDate}
      
      ${notification.reason ? `Reason: ${notification.reason}` : ''}
      
      Your new benefits include:
      ${this.getTierBenefits(notification.newTier).map(benefit => `• ${benefit}`).join('\n')}
      
      Manage your subscription: https://claimguardianai.com/dashboard
      
      Best regards,
      The ClaimGuardian Team
    `

    return { subject, html, text }
  }

  /**
   * Generate permission change email template
   */
  private generatePermissionChangeEmail(notification: PermissionChangeNotification): { subject: string; html: string; text: string } {
    const subject = 'Your ClaimGuardian permissions have been updated'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6c757d; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; border-radius: 0 0 8px 8px; }
            .permission { margin: 15px 0; padding: 15px; border-radius: 6px; }
            .permission.granted { background: #d4edda; color: #155724; }
            .permission.revoked { background: #f8d7da; color: #721c24; }
            .permission-name { font-weight: bold; }
            .permission-reason { font-size: 14px; margin-top: 5px; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Permission Update</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your permissions for your <strong>${notification.tier}</strong> tier have been updated:</p>
              
              ${notification.changedPermissions.map(change => `
                <div class="permission ${change.granted ? 'granted' : 'revoked'}">
                  <div class="permission-name">
                    ${change.granted ? '✅' : '❌'} ${this.formatPermissionName(change.permission)}
                  </div>
                  ${change.reason ? `<div class="permission-reason">Reason: ${change.reason}</div>` : ''}
                </div>
              `).join('')}

              <p>These changes are effective immediately. You can view your current permissions in your dashboard.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://claimguardianai.com/dashboard" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">View Dashboard</a>
              </div>

              <p>If you have questions about these changes, please contact our support team.</p>
              
              <p>Best regards,<br>The ClaimGuardian Team</p>
            </div>
            <div class="footer">
              <p>This email was sent by ClaimGuardian AI • Changed by: ${notification.changedBy}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Your ClaimGuardian permissions have been updated
      
      Tier: ${notification.tier}
      
      Changes:
      ${notification.changedPermissions.map(change => 
        `${change.granted ? '✅' : '❌'} ${this.formatPermissionName(change.permission)}${change.reason ? ` (${change.reason})` : ''}`
      ).join('\n')}
      
      View your dashboard: https://claimguardianai.com/dashboard
      
      Changed by: ${notification.changedBy}
      
      Best regards,
      The ClaimGuardian Team
    `

    return { subject, html, text }
  }

  /**
   * Generate usage limit notification email
   */
  private generateUsageLimitEmail(notification: UsageLimitNotification): { subject: string; html: string; text: string } {
    const isNearLimit = notification.percentageUsed >= 80
    const isOverLimit = notification.percentageUsed >= 100
    
    let subject = `Usage notification: ${notification.limitType} at ${notification.percentageUsed.toFixed(1)}%`
    if (isOverLimit) {
      subject = `⚠️ ${notification.limitType} limit exceeded`
    } else if (isNearLimit) {
      subject = `⚠️ Approaching ${notification.limitType} limit`
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isOverLimit ? '#dc3545' : isNearLimit ? '#ffc107' : '#17a2b8'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; border-radius: 0 0 8px 8px; }
            .usage-bar { background: #e9ecef; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden; }
            .usage-fill { height: 100%; background: ${isOverLimit ? '#dc3545' : isNearLimit ? '#ffc107' : '#28a745'}; width: ${Math.min(notification.percentageUsed, 100)}%; }
            .stats { display: flex; justify-content: space-between; margin: 10px 0; }
            .upgrade-box { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isOverLimit ? '⚠️' : isNearLimit ? '⚠️' : '📊'} Usage Update</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your ${notification.limitType.replace('_', ' ')} usage for your <strong>${notification.tier}</strong> tier:</p>
              
              <div class="usage-bar">
                <div class="usage-fill"></div>
              </div>
              
              <div class="stats">
                <span><strong>Used:</strong> ${notification.currentUsage.toLocaleString()}</span>
                <span><strong>Limit:</strong> ${notification.limit.toLocaleString()}</span>
                <span><strong>Percentage:</strong> ${notification.percentageUsed.toFixed(1)}%</span>
              </div>

              ${isOverLimit ? `
                <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <strong>Limit Exceeded:</strong> Your access may be restricted until you upgrade or your usage resets.
                </div>
              ` : isNearLimit ? `
                <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <strong>Approaching Limit:</strong> Consider upgrading to avoid service interruption.
                </div>
              ` : ''}

              <div class="upgrade-box">
                <h3>Need more ${notification.limitType.replace('_', ' ')}?</h3>
                <p>Upgrade your plan for higher limits and additional features.</p>
                <a href="https://claimguardianai.com/pricing" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">View Plans</a>
              </div>

              <p>You can monitor your usage and manage your account in your dashboard.</p>
              
              <p>Best regards,<br>The ClaimGuardian Team</p>
            </div>
            <div class="footer">
              <p>This email was sent by ClaimGuardian AI</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Usage notification: ${notification.limitType.replace('_', ' ')}
      
      Tier: ${notification.tier}
      Used: ${notification.currentUsage.toLocaleString()}
      Limit: ${notification.limit.toLocaleString()}
      Percentage: ${notification.percentageUsed.toFixed(1)}%
      
      ${isOverLimit ? 'LIMIT EXCEEDED: Your access may be restricted.' : isNearLimit ? 'APPROACHING LIMIT: Consider upgrading.' : ''}
      
      Upgrade your plan: https://claimguardianai.com/pricing
      View dashboard: https://claimguardianai.com/dashboard
      
      Best regards,
      The ClaimGuardian Team
    `

    return { subject, html, text }
  }

  /**
   * Send tier change notification
   */
  async sendTierChangeNotification(notification: TierChangeNotification): Promise<{ success: boolean; error?: string }> {
    const emailTemplate = this.generateTierChangeEmail(notification)
    
    return await this.sendEmail({
      to: notification.userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })
  }

  /**
   * Send permission change notification
   */
  async sendPermissionChangeNotification(notification: PermissionChangeNotification): Promise<{ success: boolean; error?: string }> {
    const emailTemplate = this.generatePermissionChangeEmail(notification)
    
    return await this.sendEmail({
      to: notification.userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })
  }

  /**
   * Send usage limit notification
   */
  async sendUsageLimitNotification(notification: UsageLimitNotification): Promise<{ success: boolean; error?: string }> {
    const emailTemplate = this.generateUsageLimitEmail(notification)
    
    return await this.sendEmail({
      to: notification.userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })
  }

  /**
   * Helper methods
   */
  private getTierLevel(tier: UserTier): number {
    const levels = { free: 0, renter: 1, essential: 2, plus: 3, pro: 4 }
    return levels[tier] || 0
  }

  private getTierBenefits(tier: UserTier): string[] {
    const benefits: Record<UserTier, string[]> = {
      free: [
        '100 AI requests per month',
        '100MB storage',
        '3 properties',
        '5 claims'
      ],
      renter: [
        '500 AI requests per month',
        '500MB storage',
        '1 property',
        '10 claims',
        'Basic damage analyzer'
      ],
      essential: [
        '2,000 AI requests per month',
        '2GB storage',
        '5 properties',
        '25 claims',
        'Full AI toolkit',
        'Document generator',
        'Priority support'
      ],
      plus: [
        '5,000 AI requests per month',
        '10GB storage',
        '15 properties',
        '100 claims',
        'Advanced analytics',
        'Bulk operations',
        'Premium support'
      ],
      pro: [
        'Unlimited AI requests',
        'Unlimited storage',
        'Unlimited properties',
        'Unlimited claims',
        'Custom integrations',
        'API access',
        'Dedicated support'
      ]
    }
    
    return benefits[tier] || []
  }

  private formatPermissionName(permission: PermissionType): string {
    return permission
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService()