/**
 * Mapbox GL JS source configurations for vector tiles
 * Provides pre-configured source objects for different tile layers
 */
import type { VectorSourceSpecification } from 'mapbox-gl';

interface VectorTileSourceOptions {
  baseUrl: string;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
  scheme?: 'xyz' | 'tms';
}

/**
 * Create a vector source for Florida parcels
 */
export function parcelsVectorSource(baseUrl: string, options: Partial<VectorTileSourceOptions> = {}): VectorSourceSpecification {
  return {
    type: 'vector',
    tiles: [`${baseUrl}/{z}/{x}/{y}`],
    minzoom: options.minzoom || 6,
    maxzoom: options.maxzoom || 22,
    attribution: options.attribution || '© ClaimGuardian | Florida Department of Revenue',
    scheme: options.scheme || 'xyz',
    // Optional tile size and buffer optimization
    tileSize: 512, // Using 512px tiles for better performance
  };
}

/**
 * Create a vector source for property boundaries
 */
export function boundariesVectorSource(baseUrl: string, options: Partial<VectorTileSourceOptions> = {}): VectorSourceSpecification {
  return {
    type: 'vector',
    tiles: [`${baseUrl}/boundaries/{z}/{x}/{y}`],
    minzoom: options.minzoom || 8,
    maxzoom: options.maxzoom || 18,
    attribution: options.attribution || '© ClaimGuardian',
    scheme: options.scheme || 'xyz',
  };
}

/**
 * Create a vector source for risk zones
 */
export function riskZonesVectorSource(baseUrl: string, options: Partial<VectorTileSourceOptions> = {}): VectorSourceSpecification {
  return {
    type: 'vector',
    tiles: [`${baseUrl}/risk-zones/{z}/{x}/{y}`],
    minzoom: options.minzoom || 6,
    maxzoom: options.maxzoom || 16,
    attribution: options.attribution || '© ClaimGuardian | FEMA',
    scheme: options.scheme || 'xyz',
  };
}

/**
 * Default layer configurations for MVT layers
 */
export const DEFAULT_LAYER_CONFIGS = {
  // Properties layer configuration
  properties: {
    fill: {
      id: 'parcels-fill',
      'source-layer': 'properties',
      type: 'fill' as const,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'highlight'], false],
          '#D50000',  // accent when highlighted
          '#0038A8'   // ClaimGuardian royal blue
        ] as any,
        'fill-opacity': 0.25,
      },
      layout: {},
    },
    outline: {
      id: 'parcels-outline',
      'source-layer': 'properties',
      type: 'line' as const,
      paint: {
        'line-color': '#222629',
        'line-width': 0.5,
        'line-opacity': 0.6,
      },
      layout: {},
    },
    labels: {
      id: 'parcels-labels',
      'source-layer': 'properties',
      type: 'symbol' as const,
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1,
      },
      layout: {
        'text-field': ['get', 'parcel_id'],
        'text-font': ['Open Sans Regular'],
        'text-size': 10,
        'text-anchor': 'center',
        'text-max-width': 10,
        'text-allow-overlap': false,
      },
      minzoom: 16, // Only show labels at high zoom
    },
  },
  
  // Boundaries layer configuration
  boundaries: {
    line: {
      id: 'boundaries-line',
      'source-layer': 'boundaries',
      type: 'line' as const,
      paint: {
        'line-color': '#FF6B35', // ClaimGuardian orange
        'line-width': 2,
        'line-opacity': 0.8,
      },
      layout: {},
    },
  },
  
  // Risk zones layer configuration
  riskZones: {
    fill: {
      id: 'risk-zones-fill',
      'source-layer': 'risk_zones',
      type: 'fill' as const,
      paint: {
        'fill-color': [
          'match',
          ['get', 'risk_level'],
          'low', '#22c55e',
          'medium', '#fbbf24',
          'high', '#ef4444',
          'extreme', '#b91c1c',
          '#6b7280' // default
        ] as any,
        'fill-opacity': 0.3,
      },
      layout: {},
    },
  },
} as const;

/**
 * Get environment-specific base URL for tiles
 */
export function getTileBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/tiles/mvt`;
  }
  
  // Server-side fallback
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/tiles/mvt`;
}