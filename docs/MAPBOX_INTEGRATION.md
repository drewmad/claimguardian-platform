# MapBox Integration Guide for ClaimGuardian

## Overview

ClaimGuardian's MapBox integration provides a powerful, interactive visualization of Florida's 8.2M+ properties with real-time claim data, risk assessment, and disaster response capabilities.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
├─────────────────────────────────────────────────┤
│  MapBox GL JS    │  React Components  │  Next.js│
│  - PropertyMap   │  - Layer Controls  │  - API  │
│  - HeatMaps      │  - Search/Filter   │  Routes │
│  - 3D Extrusion  │  - Property Detail │         │
└─────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────┐
│                  Data Pipeline                   │
├─────────────────────────────────────────────────┤
│  Supabase        │  PostGIS          │  Redis   │
│  - florida_      │  - Spatial Index  │  - Tile  │
│    parcels       │  - Geo Functions  │  Cache   │
│  - Claims Data   │  - Clustering     │          │
└─────────────────────────────────────────────────┘
```

## Key Features

### 1. **Multi-Layer Visualization**
- **Property Points**: 8.2M individual properties with clustering
- **Heat Maps**: Property values, risk scores, claim density
- **3D Extrusion**: Building heights based on property value
- **Choropleth**: County/ZIP-level risk assessment
- **Weather Overlays**: Real-time radar, hurricane tracking
- **Flood Zones**: FEMA flood zone boundaries

### 2. **Interactive Features**
- Click properties for detailed information
- Search by address, owner name, or parcel ID
- Filter by claim status, property type, risk level
- Zoom-based clustering (performance optimized)
- Real-time updates via WebSocket

### 3. **Map Styles**
- Satellite with streets overlay
- Dark mode for EOC environments
- Light mode for daytime use
- Standard street map

## Implementation Details

### Components

#### `/apps/web/src/components/map/PropertyMap.tsx`
Main map component with MapBox GL JS integration:
- Initializes map with Florida center point
- Loads property data from API
- Manages layer visibility and interactions
- Handles property selection and popup display

#### `/apps/web/src/components/map/AdvancedMapLayers.tsx`
Advanced visualization layers:
- Property value heat maps
- 3D building extrusions
- Risk assessment choropleths
- Active claims with animated pulses
- Weather and hurricane overlays

#### `/apps/web/src/app/api/parcels/geojson/route.ts`
API endpoint serving GeoJSON data:
- Queries florida_parcels table
- Filters by county, bounding box
- Returns optimized GeoJSON format
- Implements caching headers

#### `/apps/web/src/app/map/page.tsx`
Full-page map interface:
- Split view with map and sidebar
- Property details panel
- Statistics overview
- Risk analysis dashboard

## Data Flow

1. **Initial Load**
   ```typescript
   Frontend → /api/parcels/geojson → Supabase → florida_parcels
   ```

2. **Clustering**
   ```typescript
   MapBox GL JS → cluster properties → render circles
   ```

3. **Property Selection**
   ```typescript
   Click event → query features → display popup → update sidebar
   ```

## Performance Optimization

### For 8.2M Properties:

1. **Server-Side**
   - Spatial indexes on latitude/longitude
   - Bounding box queries
   - Result limiting (10K default)
   - Cache headers for CDN

2. **Client-Side**
   - MapBox clustering (50px radius)
   - Zoom-based layer visibility
   - Tile caching
   - Progressive data loading

3. **Recommended Limits**
   - Initial load: 10,000 properties
   - Zoom > 10: Load additional data
   - Zoom > 14: Show all details

## Setup Instructions

### 1. Environment Variables
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### 2. Install Dependencies
```bash
pnpm add mapbox-gl @types/mapbox-gl --filter=web
```

### 3. Database Requirements
- florida_parcels table with lat/lon columns
- Spatial indexes for performance
- PostGIS extension (optional but recommended)

### 4. Start Development
```bash
pnpm dev
# Navigate to http://localhost:3000/map
```

## API Endpoints

### GET /api/parcels/geojson
Returns GeoJSON FeatureCollection of properties.

**Query Parameters:**
- `county`: Filter by county code (1-67)
- `limit`: Max properties to return (default: 10000)
- `bbox`: Bounding box (minLng,minLat,maxLng,maxLat)

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-81.379, 28.538]
      },
      "properties": {
        "PARCEL_ID": "123456",
        "OWN_NAME": "John Doe",
        "PHY_ADDR1": "123 Main St",
        "JV": 250000
      }
    }
  ]
}
```

## Advanced Features

### Heat Map Configuration
```javascript
'heatmap-weight': [
  'interpolate',
  ['linear'],
  ['get', 'JV'],  // Property value
  0, 0,
  100000, 0.2,
  500000, 0.5,
  1000000, 0.8,
  5000000, 1
]
```

### 3D Extrusion
```javascript
'fill-extrusion-height': [
  'interpolate',
  ['linear'],
  ['get', 'JV'],
  0, 10,
  100000, 50,
  500000, 100,
  1000000, 200
]
```

### Clustering
```javascript
cluster: true,
clusterMaxZoom: 14,
clusterRadius: 50
```

## Best Practices

1. **Data Loading**
   - Start with county-level view
   - Load details progressively
   - Use bounding box queries

2. **Performance**
   - Enable hardware acceleration
   - Use vector tiles for large datasets
   - Implement view frustum culling

3. **User Experience**
   - Show loading indicators
   - Provide search shortcuts
   - Enable keyboard navigation

## Troubleshooting

### Common Issues

1. **Map not displaying**
   - Check MapBox token is set
   - Verify token has correct scopes
   - Check browser console for errors

2. **Slow performance**
   - Reduce initial data load
   - Increase cluster radius
   - Enable tile caching

3. **Missing properties**
   - Verify lat/lon columns exist
   - Check for null coordinates
   - Confirm database connection

## Future Enhancements

1. **Vector Tiles**
   - Pre-generate tiles for all zoom levels
   - Serve via MapBox Tiling Service
   - Reduce server load

2. **Real-time Updates**
   - WebSocket for live claim updates
   - Push notifications for new claims
   - Animated transitions

3. **Advanced Analytics**
   - Time-series animations
   - Predictive risk modeling
   - ML-based clustering

4. **Mobile Optimization**
   - Touch gestures
   - Offline mode
   - Progressive Web App

## Resources

- [MapBox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [GeoJSON Specification](https://geojson.org/)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Supabase PostGIS Guide](https://supabase.com/docs/guides/database/extensions/postgis)