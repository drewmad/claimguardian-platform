'use client';

import mapboxgl from 'mapbox-gl';

export interface LayerConfig {
  id: string;
  name: string;
  type: 'heatmap' | 'cluster' | 'choropleth' | '3d-extrusion';
  visible: boolean;
}

// Add heat map layer for property values
export function addPropertyValueHeatmap(map: mapboxgl.Map) {
  // Heat map based on property values
  map.addLayer({
    id: 'property-value-heatmap',
    type: 'heatmap',
    source: 'properties',
    maxzoom: 15,
    paint: {
      // Increase weight based on property value
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'JV'],
        0, 0,
        100000, 0.2,
        500000, 0.5,
        1000000, 0.8,
        5000000, 1
      ],
      // Increase intensity as zoom level increases
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 1,
        15, 3
      ],
      // Color ramp for heat map
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
      ],
      // Adjust radius by zoom level
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 2,
        15, 20
      ],
      // Transition from heatmap to points
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14, 1,
        15, 0
      ]
    }
  }, 'waterway-label');
}

// Add 3D extrusion layer for property values
export function add3DPropertyExtrusion(map: mapboxgl.Map) {
  map.addLayer({
    id: 'property-3d-extrusion',
    type: 'fill-extrusion',
    source: 'properties',
    minzoom: 14,
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['get', 'JV'],
        0, '#1a1a2e',
        100000, '#16213e',
        500000, '#0f3460',
        1000000, '#533483',
        5000000, '#c74177'
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['get', 'JV'],
        0, 10,
        100000, 50,
        500000, 100,
        1000000, 200,
        5000000, 400
      ],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.8
    }
  });
}

// Add choropleth layer for risk assessment
export function addRiskChoroplethLayer(map: mapboxgl.Map) {
  // This would typically use county or ZIP code boundaries
  map.addLayer({
    id: 'risk-choropleth',
    type: 'fill',
    source: 'county-boundaries', // You'll need to add this source
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'risk_score'],
        0, '#10b981', // Low risk - green
        30, '#f59e0b', // Medium risk - amber
        70, '#ef4444', // High risk - red
        100, '#7c3aed' // Very high risk - purple
      ],
      'fill-opacity': 0.5,
      'fill-outline-color': '#ffffff'
    }
  });
}

// Add animated pulse effect for active claims
export function addActiveClaimsPulse(map: mapboxgl.Map) {
  const size = 200;
  const pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    
    onAdd: function() {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext('2d');
    },
    
    render: function() {
      const duration = 1000;
      const t = (performance.now() % duration) / duration;
      
      const radius = (size / 2) * 0.3;
      const outerRadius = (size / 2) * 0.7 * t + radius;
      const context = this.context;
      
      // Draw outer circle
      context.clearRect(0, 0, this.width, this.height);
      context.beginPath();
      context.arc(
        this.width / 2,
        this.height / 2,
        outerRadius,
        0,
        Math.PI * 2
      );
      context.fillStyle = `rgba(239, 68, 68, ${1 - t})`;
      context.fill();
      
      // Draw inner circle
      context.beginPath();
      context.arc(
        this.width / 2,
        this.height / 2,
        radius,
        0,
        Math.PI * 2
      );
      context.fillStyle = 'rgba(239, 68, 68, 1)';
      context.strokeStyle = 'white';
      context.lineWidth = 2 + 4 * (1 - t);
      context.fill();
      context.stroke();
      
      // Update image data
      this.data = context.getImageData(0, 0, this.width, this.height).data;
      
      // Trigger repaint
      map.triggerRepaint();
      
      return true;
    }
  };
  
  map.addImage('pulsing-dot', pulsingDot as any, { pixelRatio: 2 });
  
  // Add layer for active claims with pulsing dots
  map.addLayer({
    id: 'active-claims-pulse',
    type: 'symbol',
    source: 'properties',
    filter: ['==', ['get', 'claim_status'], 'active'],
    layout: {
      'icon-image': 'pulsing-dot',
      'icon-allow-overlap': true
    }
  });
}

// Add weather overlay
export function addWeatherOverlay(map: mapboxgl.Map) {
  // Add radar layer
  map.addSource('weather-radar', {
    type: 'raster',
    tiles: [
      'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY'
    ],
    tileSize: 256
  });
  
  map.addLayer({
    id: 'weather-radar-layer',
    type: 'raster',
    source: 'weather-radar',
    paint: {
      'raster-opacity': 0.5
    }
  });
}

// Add flood zone overlay
export function addFloodZoneLayer(map: mapboxgl.Map) {
  map.addSource('flood-zones', {
    type: 'vector',
    url: 'mapbox://mapbox.floodplains' // Example Mapbox dataset
  });
  
  map.addLayer({
    id: 'flood-zones-layer',
    type: 'fill',
    source: 'flood-zones',
    'source-layer': 'floodplains',
    paint: {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.3,
      'fill-outline-color': '#1e40af'
    }
  });
}

// Add hurricane tracking layer
export function addHurricaneTrackLayer(map: mapboxgl.Map, trackData: any) {
  map.addSource('hurricane-track', {
    type: 'geojson',
    data: trackData
  });
  
  // Cone of uncertainty
  map.addLayer({
    id: 'hurricane-cone',
    type: 'fill',
    source: 'hurricane-track',
    filter: ['==', '$type', 'Polygon'],
    paint: {
      'fill-color': '#fbbf24',
      'fill-opacity': 0.3
    }
  });
  
  // Track line
  map.addLayer({
    id: 'hurricane-track-line',
    type: 'line',
    source: 'hurricane-track',
    filter: ['==', '$type', 'LineString'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#dc2626',
      'line-width': 3,
      'line-dasharray': [2, 1]
    }
  });
  
  // Position markers
  map.addLayer({
    id: 'hurricane-positions',
    type: 'circle',
    source: 'hurricane-track',
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': [
        'case',
        ['==', ['get', 'current'], true], 12,
        6
      ],
      'circle-color': [
        'case',
        ['==', ['get', 'current'], true], '#dc2626',
        '#f87171'
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  });
}

// Add demographic overlay
export function addDemographicLayer(map: mapboxgl.Map) {
  map.addLayer({
    id: 'population-density',
    type: 'fill',
    source: 'census-blocks', // You'd need to add this source
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'population_density'],
        0, 'rgba(0,0,0,0)',
        100, 'rgba(241,238,246,0.4)',
        500, 'rgba(189,201,225,0.5)',
        1000, 'rgba(116,169,207,0.6)',
        5000, 'rgba(5,112,176,0.7)',
        10000, 'rgba(2,56,88,0.8)'
      ],
      'fill-outline-color': 'rgba(0,0,0,0.1)'
    }
  });
}

// Layer control utilities
export function toggleLayer(map: mapboxgl.Map, layerId: string, visible: boolean) {
  const visibility = visible ? 'visible' : 'none';
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visibility);
  }
}

export function updateLayerFilter(map: mapboxgl.Map, layerId: string, filter: any[]) {
  if (map.getLayer(layerId)) {
    map.setFilter(layerId, filter);
  }
}

// Performance optimization for large datasets
export function optimizeForPerformance(map: mapboxgl.Map) {
  // Enable tile caching
  map.showTileBoundaries = false;
  
  // Reduce label density
  map.setLayoutProperty('road-label', 'text-field', [
    'case',
    ['>', ['zoom'], 12],
    ['get', 'name'],
    ''
  ]);
  
  // Use data-driven styling for better performance
  map.setPaintProperty('unclustered-point', 'circle-radius', [
    'interpolate',
    ['linear'],
    ['zoom'],
    10, 2,
    15, 8,
    20, 16
  ]);
}

// Export all layer functions
export const MapLayers = {
  addPropertyValueHeatmap,
  add3DPropertyExtrusion,
  addRiskChoroplethLayer,
  addActiveClaimsPulse,
  addWeatherOverlay,
  addFloodZoneLayer,
  addHurricaneTrackLayer,
  addDemographicLayer,
  toggleLayer,
  updateLayerFilter,
  optimizeForPerformance
};