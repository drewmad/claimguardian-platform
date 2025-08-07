'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Map, Home, Search, Filter, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// Initialize Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface PropertyMapProps {
  className?: string;
  onPropertySelect?: (property: any) => void;
}

export function PropertyMap({ className = '', onPropertySelect }: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-81.3792); // Florida center
  const [lat, setLat] = useState(27.5384);
  const [zoom, setZoom] = useState(7);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState('satellite-streets-v12');
  const [activeFilters, setActiveFilters] = useState({
    claimStatus: 'all',
    propertyType: 'all',
    riskLevel: 'all'
  });

  // Map styles
  const mapStyles = [
    { id: 'satellite-streets-v12', name: 'Satellite', icon: '🛰️' },
    { id: 'dark-v11', name: 'Dark', icon: '🌙' },
    { id: 'light-v11', name: 'Light', icon: '☀️' },
    { id: 'streets-v12', name: 'Streets', icon: '🗺️' }
  ];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [lng, lat],
      zoom: zoom,
      pitch: 0,
      bearing: 0
    });

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add 3D terrain
    map.current.on('load', () => {
      if (!map.current) return;

      // Add terrain source
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });

      // Add sky layer
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      // Load property data
      loadPropertyData();
    });

    // Update coordinates on move
    map.current.on('move', () => {
      if (!map.current) return;
      setLng(Number(map.current.getCenter().lng.toFixed(4)));
      setLat(Number(map.current.getCenter().lat.toFixed(4)));
      setZoom(Number(map.current.getZoom().toFixed(2)));
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Load property data from Supabase
  const loadPropertyData = async () => {
    if (!map.current) return;

    try {
      // Fetch florida_parcels data
      const response = await fetch('/api/parcels/geojson');
      const geojsonData = await response.json();

      // Add source
      map.current.addSource('properties', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add clustered circles
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      // Add cluster count
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Add individual property points
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'claim_status'], 'active'], '#ef4444',
            ['==', ['get', 'claim_status'], 'pending'], '#f59e0b',
            ['==', ['get', 'claim_status'], 'settled'], '#10b981',
            '#3b82f6'
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add property labels
      map.current.addLayer({
        id: 'property-labels',
        type: 'symbol',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'address'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-optional': true
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        minzoom: 14
      });

      // Add click handlers
      map.current.on('click', 'clusters', (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties?.cluster_id;
        const source = map.current!.getSource('properties') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          
          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        });
      });

      map.current.on('click', 'unclustered-point', (e) => {
        if (e.features && e.features[0]) {
          const property = e.features[0].properties;
          setSelectedProperty(property);
          onPropertySelect?.(property);
          
          // Create popup
          new mapboxgl.Popup()
            .setLngLat((e.features[0].geometry as any).coordinates)
            .setHTML(createPopupContent(property))
            .addTo(map.current!);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      map.current.on('mouseenter', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    } catch (error) {
      console.error('Error loading property data:', error);
    }
  };

  // Create popup content
  const createPopupContent = (property: any) => {
    return `
      <div class="p-3">
        <h3 class="font-bold text-lg mb-2">${property.OWN_NAME || 'Unknown Owner'}</h3>
        <p class="text-sm text-gray-600">${property.PHY_ADDR1 || ''}</p>
        <p class="text-sm text-gray-600">${property.PHY_CITY || ''}, FL ${property.PHY_ZIPCD || ''}</p>
        <div class="mt-2 pt-2 border-t">
          <p class="text-sm"><strong>Parcel ID:</strong> ${property.PARCEL_ID || 'N/A'}</p>
          <p class="text-sm"><strong>Value:</strong> $${(property.JV || 0).toLocaleString()}</p>
          <p class="text-sm"><strong>Year Built:</strong> ${property.DOR_UC || 'N/A'}</p>
        </div>
      </div>
    `;
  };

  // Handle style change
  const handleStyleChange = (styleId: string) => {
    if (!map.current) return;
    setMapStyle(styleId);
    map.current.setStyle(`mapbox://styles/mapbox/${styleId}`);
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (!map.current) return;
    map.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!map.current) return;
    map.current.zoomOut();
  };

  return (
    <div className={`relative h-full ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 space-y-2">
        {/* Style Selector */}
        <Card className="p-2 bg-white/90 backdrop-blur-sm">
          <div className="flex gap-1">
            {mapStyles.map((style) => (
              <Button
                key={style.id}
                size="sm"
                variant={mapStyle === style.id ? 'default' : 'ghost'}
                onClick={() => handleStyleChange(style.id)}
                title={style.name}
              >
                <span className="text-lg">{style.icon}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-3 bg-white/90 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-semibold">Filters</span>
            </div>
            <select 
              className="w-full text-sm p-1 rounded border"
              value={activeFilters.claimStatus}
              onChange={(e) => setActiveFilters({...activeFilters, claimStatus: e.target.value})}
            >
              <option value="all">All Claims</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
            </select>
            <select 
              className="w-full text-sm p-1 rounded border"
              value={activeFilters.propertyType}
              onChange={(e) => setActiveFilters({...activeFilters, propertyType: e.target.value})}
            >
              <option value="all">All Properties</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="vacant">Vacant Land</option>
            </select>
          </div>
        </Card>
      </div>

      {/* Coordinates Display */}
      <div className="absolute bottom-4 left-4 bg-black/75 text-white px-3 py-1 rounded text-xs font-mono">
        Lng: {lng} | Lat: {lat} | Zoom: {zoom}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded p-3">
        <div className="text-sm font-semibold mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Active Claim</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Settled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">No Claim</span>
          </div>
        </div>
      </div>
    </div>
  );
}