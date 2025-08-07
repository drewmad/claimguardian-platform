'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Layers, Map, Home, Search, Filter, ZoomIn, ZoomOut, 
  Maximize2, X, Menu, ChevronUp, Loader2, MapPin,
  User, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

// Initialize Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface PropertyMapProps {
  className?: string;
  onPropertySelect?: (property: any) => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  owner: string;
  value: number;
  coordinates: [number, number];
  relevance: number;
  type: string;
}

export function EnhancedPropertyMap({ className = '', onPropertySelect }: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-81.3792); // Florida center
  const [lat, setLat] = useState(27.5384);
  const [zoom, setZoom] = useState(7);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState('satellite-streets-v12');
  const [isMobile, setIsMobile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Map styles
  const mapStyles = [
    { id: 'satellite-streets-v12', name: 'Satellite', icon: '🛰️' },
    { id: 'dark-v11', name: 'Dark', icon: '🌙' },
    { id: 'light-v11', name: 'Light', icon: '☀️' },
    { id: 'streets-v12', name: 'Streets', icon: '🗺️' }
  ];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize map with vector tiles
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [lng, lat],
      zoom: zoom,
      pitch: 0,
      bearing: 0,
      // Mobile optimizations
      ...(isMobile && {
        dragRotate: false,
        touchZoomRotate: true,
        touchPitch: false
      })
    });

    // Add controls
    if (!isMobile) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    }
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Add 3D terrain (desktop only)
    if (!isMobile) {
      map.current.on('load', () => {
        if (!map.current) return;

        map.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });

        map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      });
    }

    // Load vector tiles
    map.current.on('load', () => {
      if (!map.current) return;
      loadVectorTiles();
    });

    // Update coordinates on move
    map.current.on('move', () => {
      if (!map.current) return;
      setLng(Number(map.current.getCenter().lng.toFixed(4)));
      setLat(Number(map.current.getCenter().lat.toFixed(4)));
      setZoom(Number(map.current.getZoom().toFixed(2)));
    });

    // Touch gestures for mobile
    if (isMobile) {
      map.current.on('touchstart', (e) => {
        if (e.originalEvent.touches.length > 1) {
          map.current?.dragPan.disable();
        }
      });

      map.current.on('touchend', () => {
        map.current?.dragPan.enable();
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [isMobile]);

  // Load vector tiles instead of GeoJSON
  const loadVectorTiles = () => {
    if (!map.current) return;

    // Add vector tile source
    map.current.addSource('properties-tiles', {
      type: 'vector',
      tiles: ['/api/parcels/tiles/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 18
    });

    // Add layers with zoom-based styling
    map.current.addLayer({
      id: 'properties-heat',
      type: 'heatmap',
      source: 'properties-tiles',
      'source-layer': 'properties',
      maxzoom: 10,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, 0,
          500000, 0.5,
          1000000, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          10, 3
        ],
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
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          10, 20
        ]
      }
    });

    // Add individual points at higher zoom
    map.current.addLayer({
      id: 'properties-points',
      type: 'circle',
      source: 'properties-tiles',
      'source-layer': 'properties',
      minzoom: 10,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 2,
          15, 6,
          20, 12
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, '#3b82f6',
          500000, '#f59e0b',
          1000000, '#ef4444'
        ],
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          3,
          1
        ],
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add click handlers
    map.current.on('click', 'properties-points', (e) => {
      if (e.features && e.features[0]) {
        const property = e.features[0].properties;
        setSelectedProperty(property);
        onPropertySelect?.(property);
        
        if (isMobile) {
          setShowMobilePanel(true);
        } else {
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(createPopupContent(property))
            .addTo(map.current!);
        }
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'properties-points', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    
    map.current.on('mouseleave', 'properties-points', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  };

  // Search functionality
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 3) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/parcels/search?q=${encodeURIComponent(debouncedSearch)}`
        );
        const data = await response.json();
        setSearchResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch]);

  // Fly to search result
  const flyToResult = (result: SearchResult) => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: result.coordinates,
      zoom: 16,
      duration: 2000
    });

    setSelectedProperty({
      id: result.id,
      address: result.title,
      owner: result.owner,
      value: result.value
    });

    setSearchResults([]);
    setSearchQuery('');
    setShowSearch(false);
    
    if (isMobile) {
      setShowMobilePanel(true);
    }
  };

  // Create popup content
  const createPopupContent = (property: any) => {
    return `
      <div class="p-3">
        <h3 class="font-bold text-lg mb-2">${property.owner || 'Unknown Owner'}</h3>
        <p class="text-sm text-gray-600">${property.address || ''}</p>
        <p class="text-sm text-gray-600">${property.city || ''}, FL ${property.zip || ''}</p>
        <div class="mt-2 pt-2 border-t">
          <p class="text-sm"><strong>Parcel ID:</strong> ${property.id || 'N/A'}</p>
          <p class="text-sm"><strong>Value:</strong> $${(property.value || 0).toLocaleString()}</p>
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

  // Mobile panel component
  const MobilePropertyPanel = () => (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl z-50 transition-transform duration-300",
      showMobilePanel ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Property Details</h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowMobilePanel(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {selectedProperty && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <p className="font-medium">{selectedProperty.owner || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{selectedProperty.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Value</p>
              <p className="font-medium text-green-600">
                ${(selectedProperty.value || 0).toLocaleString()}
              </p>
            </div>
            <Button className="w-full">View Full Details</Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("relative h-full", className)}>
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Desktop Controls */}
      {!isMobile && (
        <>
          {/* Style Selector */}
          <div className="absolute top-4 left-4 space-y-2">
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
          </div>

          {/* Search Bar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-96 max-w-[90%]">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by address, owner, or parcel ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-white/95 backdrop-blur-sm"
              />
              {isSearching ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <Card className="absolute top-full mt-1 w-full max-h-80 overflow-y-auto bg-white">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      className="w-full p-3 hover:bg-gray-50 text-left border-b last:border-0"
                      onClick={() => flyToResult(result)}
                    >
                      <div className="font-medium">{result.title}</div>
                      <div className="text-sm text-gray-500">{result.subtitle}</div>
                      <div className="text-xs text-gray-400">Owner: {result.owner}</div>
                    </button>
                  ))}
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Controls */}
      {isMobile && (
        <>
          {/* Mobile Search Toggle */}
          <Button
            className="absolute top-4 right-4 z-10"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Mobile Search Bar */}
          {showSearch && (
            <div className="absolute top-16 left-4 right-4 z-10">
              <Input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/95 backdrop-blur-sm"
              />
              
              {/* Mobile Search Results */}
              {searchResults.length > 0 && (
                <Card className="mt-1 max-h-60 overflow-y-auto bg-white">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      className="w-full p-2 hover:bg-gray-50 text-left border-b last:border-0"
                      onClick={() => flyToResult(result)}
                    >
                      <div className="text-sm font-medium">{result.title}</div>
                      <div className="text-xs text-gray-500">{result.subtitle}</div>
                    </button>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* Mobile Style Switcher */}
          <div className="absolute bottom-20 left-4 z-10">
            <Button
              size="icon"
              className="bg-white/90 backdrop-blur-sm"
              onClick={() => {
                const currentIndex = mapStyles.findIndex(s => s.id === mapStyle);
                const nextIndex = (currentIndex + 1) % mapStyles.length;
                handleStyleChange(mapStyles[nextIndex].id);
              }}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Property Panel */}
          <MobilePropertyPanel />
        </>
      )}

      {/* Coordinates Display */}
      <div className={cn(
        "absolute bg-black/75 text-white px-3 py-1 rounded text-xs font-mono",
        isMobile ? "bottom-4 left-4" : "bottom-4 left-4"
      )}>
        {lng.toFixed(3)}, {lat.toFixed(3)} | Z: {zoom.toFixed(1)}
      </div>
    </div>
  );
}