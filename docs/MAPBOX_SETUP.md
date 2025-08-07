# MapBox Setup Guide for ClaimGuardian

## Overview
ClaimGuardian uses MapBox GL JS for interactive property mapping with 8.2M+ Florida parcels data. This guide covers setting up MapBox for both development and production.

## 1. Get Your MapBox Token

1. Go to [MapBox](https://www.mapbox.com/)
2. Sign up or log in to your account
3. Navigate to your [Account Dashboard](https://account.mapbox.com/)
4. Find your **Default public token** or create a new one
5. Copy the token (starts with `pk.`)

## 2. Configure for Local Development

Add to your `.env.local` file:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

## 3. Configure for Production (Vercel)

### Via Vercel Dashboard:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **claimguardian-platform** project
3. Navigate to **Settings** → **Environment Variables**
4. Add new variable:
   - **Key**: `NEXT_PUBLIC_MAPBOX_TOKEN`
   - **Value**: Your MapBox token (pk.xxx...)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**

### Via Vercel CLI:
```bash
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
```

## 4. MapBox Features Used

### Property Map Component (`/components/map/PropertyMap.tsx`)
- Interactive property visualization
- Satellite and street view toggle
- 3D terrain support
- Property clustering for performance
- Search integration

### Vector Tiles API (`/api/parcels/tiles/[z]/[x]/[y]`)
- Dynamic tile generation for 8.2M+ properties
- Zoom-based data reduction
- Caching for performance

### Search API (`/api/parcels/search`)
- Property search by address, owner, or parcel ID
- Autocomplete support
- Relevance scoring

## 5. MapBox Usage Limits

### Free Tier:
- 50,000 map loads/month
- 200,000 tile requests/month
- 100,000 geocoding requests/month

### Recommended for Production:
- Pay-as-you-go plan for scale
- Monitor usage in MapBox dashboard
- Set up usage alerts

## 6. Performance Optimizations

The app implements several optimizations:

1. **Vector Tiles**: Only load visible properties
2. **Zoom-based Filtering**: 
   - Zoom < 10: Show properties > $1M
   - Zoom < 12: Show properties > $500K
   - Zoom 14+: Show all properties (max 5000)
3. **Caching**: 1-hour client, 24-hour CDN cache
4. **Clustering**: Group nearby properties at low zoom

## 7. Testing MapBox Integration

After setting up the token:

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to a page with the map
3. Check browser console for any MapBox errors
4. Verify map loads and shows Florida properties

## 8. Troubleshooting

### Map not loading:
- Check token is set in environment variables
- Verify token starts with `pk.`
- Check browser console for errors
- Ensure token has correct scopes

### Performance issues:
- Reduce max features per tile
- Increase zoom threshold for filtering
- Enable browser caching
- Use CDN for production

### CORS errors:
- MapBox tokens are domain-restricted by default
- Add your domains in MapBox dashboard
- For development, add `localhost:3000`

## 9. Security Best Practices

1. **Token Scoping**: Create separate tokens for dev/staging/production
2. **URL Restrictions**: Limit tokens to specific domains
3. **Rate Limiting**: Monitor and set alerts for unusual usage
4. **Token Rotation**: Rotate tokens periodically
5. **Never commit tokens**: Always use environment variables

## 10. Advanced Features (Future)

- [ ] Custom map styles for ClaimGuardian branding
- [ ] Offline map support for disaster scenarios
- [ ] Real-time property updates via WebSocket
- [ ] Heat maps for claim density
- [ ] Hurricane path overlays
- [ ] FEMA flood zone layers

## Support

For MapBox-specific issues:
- [MapBox Documentation](https://docs.mapbox.com/)
- [MapBox Support](https://support.mapbox.com/)

For ClaimGuardian integration issues:
- Check `/docs/troubleshooting.md`
- Open issue on GitHub