# Testing the Enhanced Signup Flow

## Overview
This guide walks through testing the comprehensive user tracking system implemented in the signup flow.

## Prerequisites
1. Development server running: `pnpm dev` (http://localhost:3001)
2. Database migrations applied (all tracking tables created)

## Testing Steps

### 1. Prepare Test Environment
- Open Chrome DevTools (F12)
- Go to Network tab to monitor API calls
- Clear any existing cookies/localStorage

### 2. Navigate to Landing Page
- Visit: http://localhost:3001
- Notice the URL - this is the landing page that will be tracked
- If coming from a search engine, the referrer will be captured

### 3. Add UTM Parameters (Optional)
Test with attribution tracking:
```
http://localhost:3001?utm_source=google&utm_medium=cpc&utm_campaign=test-campaign&utm_term=insurance+help
```

### 4. Open Signup Modal
- Click the "Sign Up" button in the header
- Notice the location detection indicator
- Device fingerprinting happens automatically in the background

### 5. Fill Out the Form
Enter test data:
- **First Name**: Test
- **Last Name**: User
- **Email**: test-[timestamp]@example.com (use unique email)
- **Phone**: (555) 123-4567
- **Password**: TestPassword123!

### 6. Review Legal Documents
- Click to view each legal document
- Check all three document checkboxes
- Notice the additional consent options

### 7. Submit the Form
- Click "Create Account"
- You should see the email confirmation screen
- Check the Network tab for tracking API calls

### 8. Verify Data Capture in Supabase

Go to [Supabase Table Editor](https://app.supabase.com/project/tmlrvecuwgppbaynesji/editor/29166)

Check these tables:
1. **auth.users** - Basic user account
2. **user_profiles** - Enhanced profile with tracking data
3. **user_tracking** - Signup event recorded
4. **user_preferences** - Consent preferences
5. **user_legal_acceptance** - Document acceptances
6. **consent_audit_log** - Consent history
7. **marketing_attribution** - UTM tracking

## What's Being Tracked

### Device Information
- Device fingerprint (SHA-256 hash)
- Device type (mobile/tablet/desktop)
- Screen resolution
- Browser and version
- Operating system
- IP address

### Location Data
- Country, region, city (from IP)
- Postal code
- Timezone
- Approximate coordinates

### Marketing Attribution
- UTM parameters
- Referrer URL
- Landing page
- Conversion tracking

### User Consents
- GDPR consent
- Marketing emails
- Data processing
- AI processing
- Legal document acceptances

## Troubleshooting

### If signup fails:
1. Check browser console for errors
2. Verify all form fields are filled
3. Ensure unique email address
4. Check Network tab for API errors

### If tracking data is missing:
1. Verify migrations were applied
2. Check browser allows fingerprinting
3. Ensure location services aren't blocked
4. Review server logs: `pnpm dev`

## Testing Different Scenarios

### Mobile Device Test
1. Use Chrome DevTools device emulation
2. Select iPhone or Android device
3. Complete signup flow
4. Verify device_type = 'mobile' in database

### GDPR Compliance Test
1. Uncheck GDPR consent
2. Try to submit form
3. Should see validation error
4. Check consent and retry

### Marketing Attribution Test
1. Use different UTM parameters
2. Test with various referrers
3. Verify attribution data in marketing_attribution table

## Automated Testing
Run the comprehensive test script:
```bash
node scripts/test-complete-signup.js
```

This will:
- Create a test user
- Capture all tracking data
- Verify data integrity
- Clean up test data

## Production Considerations
- All tracking respects user privacy choices
- Sensitive data is hashed (device fingerprint)
- IP addresses are stored for security/compliance
- Full audit trail for GDPR/CCPA compliance
- Users can request data deletion
