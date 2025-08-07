/**
 * Parcel Tiles API Route (Alias)
 * Alternative endpoint for parcel-specific vector tiles
 * 
 * Route: /api/parcels/tiles/{z}/{x}/{y}
 * This is an alias to the main MVT endpoint for backward compatibility
 */
export { GET, OPTIONS } from '@/app/api/tiles/mvt/[z]/[x]/[y]/route';