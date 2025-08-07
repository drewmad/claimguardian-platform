# Mapbox Setup Guide for ClaimGuardian

## Overview
ClaimGuardian uses Mapbox for interactive property mapping and visualization of Florida parcels data. This guide will help you set up Mapbox integration.

## Getting Your Mapbox Token

1. **Create a Mapbox Account**
   - Go to [https://www.mapbox.com/](https://www.mapbox.com/)
   - Click "Sign up" and create a free account
   - Verify your email address

2. **Get Your Access Token**
   - After logging in, go to your [Account Dashboard](https://account.mapbox.com/)
   - Navigate to the "Tokens" section
   - Copy your default public token (starts with `pk.`)
   - Or create a new token with the following scopes:
     - `styles:read` - For map styles
     - `fonts:read` - For map fonts
     - `datasets:read` - For datasets
     - `vision:read` - For vision APIs

3. **Configure Environment Variables**
   
   Add your token to your `.env.local` file:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
   ```

   For production (Vercel), add it to your environment variables:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `NEXT_PUBLIC_MAPBOX_TOKEN` with your token value

## Features Using Mapbox

### 1. Property Map Dashboard
- Interactive map showing all Florida properties
- Clustering for performance with large datasets
- Custom property markers with status indicators
- Filter properties by insurance status, risk level, etc.

### 2. Parcel Visualization
- Display of 8.2M+ Florida parcels
- County-level data aggregation
- Heat maps for property values
- Vector tiles for performance

### 3. Disaster Monitoring
- Hurricane tracking overlays
- Flood zone visualization
- Risk assessment layers
- Emergency evacuation routes

## Map Styles Available

The application supports multiple map styles:
- **Dark Mode** (`mapbox://styles/mapbox/dark-v11`) - Default for dashboard
- **Streets** (`mapbox://styles/mapbox/streets-v12`) - Detailed street view
- **Satellite** (`mapbox://styles/mapbox/satellite-streets-v12`) - Aerial imagery

## Troubleshooting

### Map Not Displaying
1. Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set in your environment
2. Verify the token starts with `pk.`
3. Check browser console for any Mapbox-related errors
4. Ensure you're not exceeding the free tier limits (50,000 map loads/month)

### Performance Issues
- The app uses clustering for properties when zoomed out
- Vector tiles are used for parcel data to improve performance
- Consider upgrading your Mapbox plan if you exceed rate limits

### CORS Issues
- Mapbox tiles are served with proper CORS headers
- If you see CORS errors, check your Mapbox token permissions

## Usage Limits (Free Tier)

- **Map loads**: 50,000/month
- **Vector tiles**: 200,000/month
- **Geocoding**: 100,000/month

For production use with high traffic, consider upgrading to a paid Mapbox plan.

## Integration Points

### Components Using Mapbox:
- `/components/maps/florida-property-map.tsx` - Main map component
- `/components/maps/property-map-dashboard.tsx` - Dashboard integration
- `/components/maps/parcel-search-map.tsx` - Parcel search functionality
- `/app/api/parcels/tiles/[z]/[x]/[y]/route.ts` - Vector tile generation

### Data Flow:
1. Parcel data stored in Supabase (`florida_parcels` table)
2. Vector tiles generated on-demand via API route
3. Mapbox GL JS renders the map with custom layers
4. User interactions trigger property/parcel selection events

## Additional Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/guides/)
- [Mapbox Studio](https://studio.mapbox.com/) - Create custom map styles
- [Mapbox Pricing](https://www.mapbox.com/pricing) - Understand usage limits