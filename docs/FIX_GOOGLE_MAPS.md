# Fix Google Maps API - Quick Guide

## The Problem

You're seeing "Enter your address manually (Google Maps API key not configured)" because the Google Maps API key is not properly configured in your production environment (claimguardianai.com).

## Quick Fix

### Option 1: Use the Setup Script (Recommended)

```bash
cd /Users/madengineering/ClaimGuardian
./scripts/setup-google-maps.sh
```

This script will:

- Check your local configuration
- Help you add the API key to Vercel
- Verify everything is set up correctly

### Option 2: Manual Setup

#### Step 1: Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable these 3 APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
4. Go to Credentials → Create API Key
5. Restrict the key to these domains:
   ```
   http://localhost:3000/*
   https://claimguardianai.com/*
   https://*.vercel.app/*
   ```

#### Step 2: Add to Vercel (Production)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `claimguardian-platform` project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Your API key from Google
   - **Environment**: Select both `Production` and `Preview`
5. Click **Save**

#### Step 3: Redeploy

After adding the environment variable, you need to redeploy:

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

## Verify It's Working

After deployment (takes ~2 minutes):

1. Go to https://claimguardianai.com/dashboard/properties
2. Click "Add Property"
3. In the address field, you should see autocomplete suggestions when typing
4. The message should change from "Manual entry only" to "✓ Google Places autocomplete enabled"

## Troubleshooting

### Still seeing "Manual entry only"?

1. **Check the browser console** (F12) for errors
2. **Verify all 3 APIs are enabled** in Google Cloud Console
3. **Check API key restrictions** - make sure your domain is allowed
4. **Clear browser cache** and try again

### "This API key is not authorized"

- Your domain might not be in the allowed list
- Add `https://claimguardianai.com/*` to the API key restrictions

### Autocomplete not showing

- Make sure the **Places API** is enabled
- Check that your API key has access to Places API

## Cost Note

Google provides $200/month free credit, which is typically more than enough for most applications. Monitor usage in Google Cloud Console to stay within limits.

## Security Best Practices

- ✅ Always restrict API keys to specific domains
- ✅ Use different keys for dev and production
- ✅ Never commit API keys to git
- ✅ Monitor usage regularly

## Need Help?

If you're still having issues after following these steps, check:

- Browser console for specific error messages
- Google Cloud Console for API quotas/limits
- Vercel deployment logs for any build errors
