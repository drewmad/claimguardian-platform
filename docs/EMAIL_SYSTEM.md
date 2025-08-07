# Email System Documentation

## Overview

ClaimGuardian uses Resend for transactional email delivery. The system is designed to send automated emails for user onboarding, notifications, and updates.

## Configuration

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@claimguardianai.com

# Optional
RESEND_REPLY_TO_EMAIL=support@claimguardianai.com
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Vercel Environment Setup

1. Add the above environment variables to your Vercel project
2. Ensure they are available in both Production and Preview environments
3. For Edge Functions, add them to the Supabase project as well

## Email Templates

### Available Templates

1. **Welcome Email** - Sent after user completes onboarding
2. **Email Verification** - Sent to verify user email address
3. **Password Reset** - Sent when user requests password reset
4. **Property Enrichment Complete** - Sent after property analysis
5. **Claim Update** - Sent when claim status changes

### Template Structure

All emails use a consistent HTML template with:
- Responsive design
- Dark header with ClaimGuardian branding
- Clear call-to-action buttons
- Plain text fallback

## Implementation

### Server Actions

```typescript
import { sendWelcomeEmail, sendPropertyEnrichmentEmail } from '@/actions/email'

// Send welcome email
await sendWelcomeEmail(userId)

// Send property enrichment email
await sendPropertyEnrichmentEmail({
  userId,
  propertyId,
  propertyAddress,
  enrichmentData: {
    floodZone: 'AE',
    elevation: 12.5,
    hurricaneZone: 'B',
    protectionClass: 5
  }
})
```

### Edge Functions

The `send-email` Edge Function handles email sending from other Edge Functions:

```typescript
await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'welcome',
    userId: 'user-uuid'
  })
})
```

## Email Tracking

All emails are logged in the `email_logs` table with:
- Email type and recipient
- Send timestamp
- Resend ID for tracking
- Status updates (sent, delivered, opened, clicked, bounced)

### Webhook Integration

Configure Resend webhook endpoint:
```
https://app.claimguardianai.com/api/webhooks/resend
```

This tracks:
- Email delivery status
- Open rates
- Click tracking
- Bounce handling

## Rate Limiting

The system includes rate limiting protection:
- Per-user limits to prevent spam
- Bulk email batching (up to 100 recipients)
- Automatic retry with exponential backoff

## Email Types

### Transactional Emails (Immediate)
- Welcome emails
- Password resets
- Email verification
- Claim updates
- Property analysis complete

### Notification Emails (Batched)
- Daily claim summaries
- Weekly property reports
- System announcements

## Testing

### Local Development

1. Use Resend test API key for development
2. Emails will appear in Resend dashboard but won't send
3. Check email logs table for tracking

### Production Testing

1. Use real email addresses
2. Monitor Resend dashboard for delivery status
3. Check webhook logs for issues

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY is set correctly
   - Verify sender domain is verified in Resend
   - Check email logs for error messages

2. **Emails going to spam**
   - Ensure SPF/DKIM records are configured
   - Avoid spam trigger words
   - Include unsubscribe links for marketing emails

3. **Webhook failures**
   - Verify RESEND_WEBHOOK_SECRET matches
   - Check webhook endpoint is publicly accessible
   - Monitor webhook logs for errors

## Best Practices

1. **Always use templates** - Don't construct HTML in code
2. **Include plain text** - Always provide text version
3. **Test thoroughly** - Use Resend's testing tools
4. **Monitor delivery** - Check logs and metrics regularly
5. **Handle failures** - Implement retry logic for critical emails
6. **Respect preferences** - Honor user email preferences

## Security

1. **API Keys** - Never expose in client-side code
2. **Webhook Validation** - Always verify signatures
3. **Input Sanitization** - Clean all user input
4. **Rate Limiting** - Prevent email bombs
5. **Audit Logging** - Track all email sends

## Future Enhancements

1. **Email Templates UI** - Admin interface for template management
2. **A/B Testing** - Test different subject lines and content
3. **Scheduled Emails** - Send emails at optimal times
4. **Email Preferences** - User control over email frequency
5. **Advanced Analytics** - Detailed engagement metrics
