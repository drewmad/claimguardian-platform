# Google Maps API Setup Guide

This guide helps you set up Google Maps API for address verification in ClaimGuardian.

## Why You Need This

The onboarding flow uses Google Places Autocomplete to:

- Verify property addresses
- Auto-complete addresses as users type
- Get accurate coordinates for properties
- Ensure only valid US addresses are entered

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it something like "ClaimGuardian"
4. Note your Project ID

### 2. Enable Billing

Google requires billing to be enabled, but provides $200 free credit:

1. In the console, go to "Billing"
2. Add a payment method
3. The free tier is usually sufficient for development

### 3. Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable these THREE APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**

### 4. Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Copy your API key

### 5. Secure Your API Key (Important!)

1. Click on your API key to edit it
2. Under **Application restrictions**:
   - Select "HTTP referrers (websites)"
   - Add these referrers:
     ```
     http://localhost:3000/*
     http://localhost:*
     https://*.vercel.app/*
     https://your-production-domain.com/*
     ```

3. Under **API restrictions**:
   - Select "Restrict key"
   - Check only these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API

4. Click **Save**

### 6. Add to Your Environment

#### Local Development

Edit `/apps/web/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

#### Vercel Production

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: Your API key
   - Environment: Production (and Preview if needed)

### 7. Test It

1. Restart your development server: `pnpm dev`
2. Go to the onboarding flow
3. You should see "Start typing and select from dropdown..." instead of "Address verification is loading..."
4. Start typing an address - you should see Google's autocomplete suggestions

## Troubleshooting

### "Address verification is loading..." never goes away

- Check that your API key is correctly set in `.env.local`
- Make sure you restarted the dev server after adding the key
- Check browser console for errors

### "This API key is not authorized"

- Make sure you enabled all 3 required APIs
- Check that your domain is in the allowed referrers
- For Vercel deployments, add `https://*.vercel.app/*` to referrers

### Autocomplete not showing

- Verify the Places API is enabled
- Check that your API key has access to Places API
- Look for errors in the browser console

## Cost Considerations

- Google provides $200/month free credit
- Places Autocomplete: $2.83 per 1,000 requests
- For most applications, you'll stay well within the free tier
- Monitor usage in the Google Cloud Console

## Security Notes

- Always restrict your API key to specific domains
- Never commit API keys to git
- Use different keys for development and production
- Monitor usage regularly in Google Cloud Console
