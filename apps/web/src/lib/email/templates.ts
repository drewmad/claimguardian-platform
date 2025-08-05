/**
 * @fileMetadata
 * @purpose "Email templates for transactional emails"
 * @dependencies []
 * @owner communications-team
 * @status stable
 */

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Base email template wrapper
const emailWrapper = (content: string, preheader?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClaimGuardian</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #1a1a1a; padding: 24px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: bold; text-decoration: none; }
    .content { padding: 32px 24px; background-color: #ffffff; }
    .footer { background-color: #f5f5f5; padding: 24px; text-align: center; font-size: 14px; color: #666666; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .button:hover { background-color: #2563eb; }
    h1 { color: #1a1a1a; margin-top: 0; }
    p { color: #374151; line-height: 1.6; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="email-container">
    <div class="header">
      <a href="https://claimguardianai.com" class="logo">ClaimGuardian</a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ClaimGuardian. All rights reserved.</p>
      <p>This email was sent to you because you have an account with ClaimGuardian.</p>
      <p style="margin-top: 16px;">
        <a href="https://claimguardianai.com/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> | 
        <a href="https://claimguardianai.com/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
`

// Welcome email template
export function getWelcomeEmail(name: string): EmailTemplate {
  const content = `
    <h1>Welcome to ClaimGuardian, ${name}!</h1>
    <p>Thank you for joining ClaimGuardian, your AI-powered insurance claim advocate.</p>
    <p>We're here to help you navigate the complex world of insurance claims with confidence. Here's what you can do with ClaimGuardian:</p>
    <ul style="color: #374151; line-height: 1.8;">
      <li><strong>Document Your Property:</strong> Create a digital twin of your property with photos and details</li>
      <li><strong>AI-Powered Analysis:</strong> Get instant insights on damage assessment and claim documentation</li>
      <li><strong>Track Claims:</strong> Monitor the progress of your insurance claims in real-time</li>
      <li><strong>Expert Guidance:</strong> Access AI tools designed specifically for Florida property owners</li>
    </ul>
    <p style="margin-top: 24px;">
      <a href="https://app.claimguardianai.com/dashboard" class="button">Get Started</a>
    </p>
    <p style="margin-top: 24px; font-size: 14px; color: #666666;">
      Need help? Our support team is here for you at <a href="mailto:support@claimguardianai.com" style="color: #3b82f6;">support@claimguardianai.com</a>
    </p>
  `

  const text = `
Welcome to ClaimGuardian, ${name}!

Thank you for joining ClaimGuardian, your AI-powered insurance claim advocate.

We're here to help you navigate the complex world of insurance claims with confidence. Here's what you can do with ClaimGuardian:

- Document Your Property: Create a digital twin of your property with photos and details
- AI-Powered Analysis: Get instant insights on damage assessment and claim documentation
- Track Claims: Monitor the progress of your insurance claims in real-time
- Expert Guidance: Access AI tools designed specifically for Florida property owners

Get started at: https://app.claimguardianai.com/dashboard

Need help? Our support team is here for you at support@claimguardianai.com

© ${new Date().getFullYear()} ClaimGuardian. All rights reserved.
  `.trim()

  return {
    subject: 'Welcome to ClaimGuardian - Your AI Insurance Advocate',
    html: emailWrapper(content, 'Welcome to ClaimGuardian!'),
    text
  }
}

// Password reset email template
export function getPasswordResetEmail(name: string, resetLink: string): EmailTemplate {
  const content = `
    <h1>Reset Your Password</h1>
    <p>Hi ${name},</p>
    <p>We received a request to reset your ClaimGuardian password. Click the button below to create a new password:</p>
    <p style="margin: 24px 0;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </p>
    <p style="font-size: 14px; color: #666666;">This link will expire in 1 hour for security reasons.</p>
    <p style="font-size: 14px; color: #666666;">If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
    <p style="font-size: 12px; color: #999999;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="color: #3b82f6; word-break: break-all;">${resetLink}</span>
    </p>
  `

  const text = `
Reset Your Password

Hi ${name},

We received a request to reset your ClaimGuardian password. Visit the link below to create a new password:

${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.

© ${new Date().getFullYear()} ClaimGuardian. All rights reserved.
  `.trim()

  return {
    subject: 'Reset Your ClaimGuardian Password',
    html: emailWrapper(content, 'Reset your password'),
    text
  }
}

// Email verification template
export function getEmailVerificationEmail(name: string, verificationLink: string): EmailTemplate {
  const content = `
    <h1>Verify Your Email</h1>
    <p>Hi ${name},</p>
    <p>Thanks for signing up for ClaimGuardian! Please verify your email address to activate your account and get started.</p>
    <p style="margin: 24px 0;">
      <a href="${verificationLink}" class="button">Verify Email</a>
    </p>
    <p style="font-size: 14px; color: #666666;">This link will expire in 24 hours.</p>
    <p style="font-size: 14px; color: #666666;">If you didn't create an account with ClaimGuardian, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
    <p style="font-size: 12px; color: #999999;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="color: #3b82f6; word-break: break-all;">${verificationLink}</span>
    </p>
  `

  const text = `
Verify Your Email

Hi ${name},

Thanks for signing up for ClaimGuardian! Please verify your email address to activate your account and get started.

${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with ClaimGuardian, you can safely ignore this email.

© ${new Date().getFullYear()} ClaimGuardian. All rights reserved.
  `.trim()

  return {
    subject: 'Verify Your ClaimGuardian Email',
    html: emailWrapper(content, 'Verify your email'),
    text
  }
}

// Claim status update email template
export function getClaimUpdateEmail(
  name: string, 
  claimNumber: string, 
  status: string, 
  message: string
): EmailTemplate {
  const statusColor = {
    'submitted': '#3b82f6',
    'in_review': '#f59e0b',
    'approved': '#10b981',
    'denied': '#ef4444',
    'additional_info_required': '#8b5cf6'
  }[status] || '#3b82f6'

  const content = `
    <h1>Claim Update</h1>
    <p>Hi ${name},</p>
    <p>There's an update on your insurance claim:</p>
    <div style="background-color: #f9fafb; border-left: 4px solid ${statusColor}; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-weight: 600;">Claim #${claimNumber}</p>
      <p style="margin: 8px 0 0 0; color: ${statusColor}; font-weight: 500;">Status: ${status.replace(/_/g, ' ').toUpperCase()}</p>
    </div>
    <p>${message}</p>
    <p style="margin-top: 24px;">
      <a href="https://app.claimguardianai.com/dashboard/claims/${claimNumber}" class="button">View Claim Details</a>
    </p>
    <p style="margin-top: 24px; font-size: 14px; color: #666666;">
      Questions about your claim? Contact us at <a href="mailto:support@claimguardianai.com" style="color: #3b82f6;">support@claimguardianai.com</a>
    </p>
  `

  const text = `
Claim Update

Hi ${name},

There's an update on your insurance claim:

Claim #${claimNumber}
Status: ${status.replace(/_/g, ' ').toUpperCase()}

${message}

View claim details at: https://app.claimguardianai.com/dashboard/claims/${claimNumber}

Questions about your claim? Contact us at support@claimguardianai.com

© ${new Date().getFullYear()} ClaimGuardian. All rights reserved.
  `.trim()

  return {
    subject: `Claim Update: #${claimNumber}`,
    html: emailWrapper(content, `Update on claim #${claimNumber}`),
    text
  }
}

// Property enrichment complete email template
export function getPropertyEnrichmentEmail(
  name: string,
  propertyAddress: string,
  enrichmentData: {
    floodZone: string
    elevation: number
    hurricaneZone: string
    protectionClass: number
  }
): EmailTemplate {
  const content = `
    <h1>Property Analysis Complete</h1>
    <p>Hi ${name},</p>
    <p>We've completed the comprehensive analysis of your property at <strong>${propertyAddress}</strong>.</p>
    <p>Here's what we found:</p>
    <div style="background-color: #f9fafb; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1a1a1a;">Property Risk Assessment</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666666;">Flood Zone:</td>
          <td style="padding: 8px 0; font-weight: 600;">${enrichmentData.floodZone}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666;">Elevation:</td>
          <td style="padding: 8px 0; font-weight: 600;">${enrichmentData.elevation.toFixed(1)} meters above sea level</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666;">Hurricane Evacuation Zone:</td>
          <td style="padding: 8px 0; font-weight: 600;">${enrichmentData.hurricaneZone}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666;">Fire Protection Class:</td>
          <td style="padding: 8px 0; font-weight: 600;">${enrichmentData.protectionClass}/10</td>
        </tr>
      </table>
    </div>
    <p>This data helps us provide more accurate claim assistance and documentation for your property.</p>
    <p style="margin-top: 24px;">
      <a href="https://app.claimguardianai.com/dashboard/properties" class="button">View Full Report</a>
    </p>
    <p style="margin-top: 24px; font-size: 14px; color: #666666;">
      We've also captured street-level and aerial imagery of your property for documentation purposes.
    </p>
  `

  const text = `
Property Analysis Complete

Hi ${name},

We've completed the comprehensive analysis of your property at ${propertyAddress}.

Here's what we found:

Property Risk Assessment:
- Flood Zone: ${enrichmentData.floodZone}
- Elevation: ${enrichmentData.elevation.toFixed(1)} meters above sea level
- Hurricane Evacuation Zone: ${enrichmentData.hurricaneZone}
- Fire Protection Class: ${enrichmentData.protectionClass}/10

This data helps us provide more accurate claim assistance and documentation for your property.

View full report at: https://app.claimguardianai.com/dashboard/properties

We've also captured street-level and aerial imagery of your property for documentation purposes.

© ${new Date().getFullYear()} ClaimGuardian. All rights reserved.
  `.trim()

  return {
    subject: `Property Analysis Complete - ${propertyAddress}`,
    html: emailWrapper(content, 'Your property analysis is ready'),
    text
  }
}