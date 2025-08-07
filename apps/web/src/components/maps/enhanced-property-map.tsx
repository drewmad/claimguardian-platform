/**
 * Enhanced Florida Property Map with Advanced Features
 * - Property data overlays with clustering
 * - Parcel search functionality
 * - Risk assessment layers (flood zones, hurricane paths, wildfire risk)
 * - Real-time weather overlays
 * - Property value heat maps
 */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import {
  MapPin,
  Home,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  Cloud,
  Droplets,
  Wind,
  Flame,
  DollarSign,
  Shield,
  Activity,
  Eye,
  EyeOff,
  Info,
  X,
} from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Types
interface Property {
  id: string;
  parcelId?: string;
  name: string;
  address: string;
  coordinates: [number, number];
  type: "single_family" | "condo" | "townhouse" | "commercial" | "multi_family";
  value: number;
  insuranceStatus: "active" | "expired" | "pending" | "none";
  claimsCount: number;
  riskLevel: "low" | "medium" | "high";
  county: string;
  yearBuilt?: number;
  squareFeet?: number;
  floodZone?: string;
  windZone?: string;
  lastUpdated: Date;
}

interface MapLayer {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
  color: string;
  opacity: number;
  type: "base" | "overlay" | "data";
  description?: string;
}

interface RiskZone {
  type: "flood" | "hurricane" | "wildfire" | "storm_surge";
  level: "minimal" | "low" | "moderate" | "high" | "extreme";
  coordinates: [number, number][];
  properties?: any;
}

interface EnhancedPropertyMapProps {
  properties?: Property[];
  center?: [number, number];
  zoom?: number;
  showControls?: boolean;
  showSearch?: boolean;
  showLayerPanel?: boolean;
  onPropertyClick?: (property: Property) => void;
  onMapLoad?: (map: mapboxgl.Map) => void;
  className?: string;
  height?: string;
  mapStyle?: string;
}

// Florida configuration
const FLORIDA_CENTER: [number, number] = [-82.4572, 27.9506];
const FLORIDA_BOUNDS: [[number, number], [number, number]] = [
  [-87.6349, 24.3963],
  [-79.9743, 31.0007],
];

// Enhanced map layers
const ENHANCED_LAYERS: MapLayer[] = [
  {
    id: "properties",
    name: "Properties",
    icon: Home,
    visible: true,
    color: "#10b981",
    opacity: 1,
    type: "data",
    description: "All tracked properties",
  },
  {
    id: "parcels",
    name: "Parcels",
    icon: MapPin,
    visible: false,
    color: "#6366f1",
    opacity: 0.5,
    type: "data",
    description: "Florida parcel boundaries",
  },
  {
    id: "heatmap",
    name: "Value Heatmap",
    icon: DollarSign,
    visible: false,
    color: "#fbbf24",
    opacity: 0.6,
    type: "overlay",
    description: "Property value density",
  },
  {
    id: "flood-zones",
    name: "Flood Zones",
    icon: Droplets,
    visible: false,
    color: "#3b82f6",
    opacity: 0.4,
    type: "overlay",
    description: "FEMA flood zone mapping",
  },
  {
    id: "hurricane-risk",
    name: "Hurricane Risk",
    icon: Wind,
    visible: false,
    color: "#8b5cf6",
    opacity: 0.5,
    type: "overlay",
    description: "Historical hurricane paths",
  },
  {
    id: "wildfire-risk",
    name: "Wildfire Risk",
    icon: Flame,
    visible: false,
    color: "#ef4444",
    opacity: 0.4,
    type: "overlay",
    description: "Wildfire susceptibility zones",
  },
  {
    id: "storm-surge",
    name: "Storm Surge",
    icon: Activity,
    visible: false,
    color: "#06b6d4",
    opacity: 0.5,
    type: "overlay",
    description: "Storm surge inundation zones",
  },
  {
    id: "insurance-claims",
    name: "Claims Density",
    icon: AlertTriangle,
    visible: false,
    color: "#f59e0b",
    opacity: 0.6,
    type: "data",
    description: "Insurance claim hotspots",
  },
  {
    id: "weather-radar",
    name: "Weather Radar",
    icon: Cloud,
    visible: false,
    color: "#22c55e",
    opacity: 0.3,
    type: "overlay",
    description: "Live weather conditions",
  },
];

// Risk zone colors
const RISK_COLORS = {
  minimal: "#22c55e",
  low: "#84cc16",
  moderate: "#fbbf24",
  high: "#fb923c",
  extreme: "#ef4444",
};

export function EnhancedPropertyMap({
  properties = [],
  center = FLORIDA_CENTER,
  zoom = 7,
  showControls = true,
  showSearch = true,
  showLayerPanel = true,
  onPropertyClick,
  onMapLoad,
  className = "",
  height = "600px",
  mapStyle = "mapbox://styles/mapbox/dark-v11",
}: EnhancedPropertyMapProps) {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const geocoder = useRef<MapboxGeocoder | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);

  // State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layers, setLayers] = useState<MapLayer[]>(ENHANCED_LAYERS);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [valueRange, setValueRange] = useState<[number, number]>([0, 5000000]);
  const [showStats, setShowStats] = useState(true);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!properties.length) return null;
    
    const totalValue = properties.reduce((sum, p) => sum + p.value, 0);
    const avgValue = totalValue / properties.length;
    const highRisk = properties.filter(p => p.riskLevel === "high").length;
    const activeCoverage = properties.filter(p => p.insuranceStatus === "active").length;
    
    return {
      totalProperties: properties.length,
      totalValue,
      avgValue,
      highRisk,
      coverageRate: (activeCoverage / properties.length) * 100,
    };
  }, [properties]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center,
      zoom,
      maxBounds: FLORIDA_BOUNDS,
      pitch: 0,
      bearing: 0,
    });

    // Add controls
    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.current.addControl(
        new mapboxgl.ScaleControl({ unit: "imperial" }),
        "bottom-right"
      );
    }

    // Add geocoder for search
    if (showSearch) {
      geocoder.current = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl as any,
        placeholder: "Search for address or parcel ID...",
        bbox: [-87.6349, 24.3963, -79.9743, 31.0007],
        countries: "us",
        types: "address,poi",
        limit: 5,
      });

      map.current.addControl(geocoder.current as any, "top-left");
    }

    // Map loaded event
    map.current.on("load", () => {
      setMapLoaded(true);
      setupMapLayers();
      onMapLoad?.(map.current!);
    });

    // Click event
    map.current.on("click", "properties-layer", (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        handlePropertyClick(feature.properties as Property);
      }
    });

    // Hover effects
    map.current.on("mouseenter", "properties-layer", () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = "pointer";
      }
    });

    map.current.on("mouseleave", "properties-layer", () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = "";
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [center, zoom, mapStyle, showControls, showSearch, onMapLoad]);

  // Setup map layers
  const setupMapLayers = useCallback(() => {
    if (!map.current) return;

    // Add property data source
    map.current.addSource("properties", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: properties.map((property) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: property.coordinates,
          },
          properties: property,
        })),
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Add clustered properties layer
    map.current.addLayer({
      id: "clusters",
      type: "circle",
      source: "properties",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6",
          10,
          "#f1f075",
          50,
          "#f28cb1",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20,
          10,
          30,
          50,
          40,
        ],
      },
    });

    // Add cluster count
    map.current.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "properties",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Add individual properties layer
    map.current.addLayer({
      id: "properties-layer",
      type: "circle",
      source: "properties",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "match",
          ["get", "riskLevel"],
          "low", "#22c55e",
          "medium", "#fbbf24",
          "high", "#ef4444",
          "#6b7280",
        ],
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": 0.8,
      },
    });

    // Add value heatmap
    map.current.addLayer({
      id: "property-heat",
      type: "heatmap",
      source: "properties",
      layout: {
        visibility: "none",
      },
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          0, 0,
          5000000, 1,
        ],
        "heatmap-intensity": 1,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(33,102,172,0)",
          0.2, "rgb(103,169,207)",
          0.4, "rgb(209,229,240)",
          0.6, "rgb(253,219,199)",
          0.8, "rgb(239,138,98)",
          1, "rgb(178,24,43)",
        ],
        "heatmap-radius": 30,
        "heatmap-opacity": 0.6,
      },
    });

    // Load risk zones (mock data for demo)
    loadRiskZones();
  }, [properties]);

  // Load risk zone overlays
  const loadRiskZones = useCallback(() => {
    if (!map.current) return;

    // Add flood zones layer (mock data)
    map.current.addSource("flood-zones", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          // Mock flood zone polygons
          {
            type: "Feature",
            properties: { zone: "AE", risk: "high" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [-80.15, 25.75],
                [-80.10, 25.75],
                [-80.10, 25.80],
                [-80.15, 25.80],
                [-80.15, 25.75],
              ]],
            },
          },
        ],
      },
    });

    map.current.addLayer({
      id: "flood-zones-layer",
      type: "fill",
      source: "flood-zones",
      layout: {
        visibility: "none",
      },
      paint: {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.4,
      },
    });

    // Add hurricane paths (historical data)
    map.current.addSource("hurricane-paths", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [], // Would load actual hurricane track data
      },
    });

    map.current.addLayer({
      id: "hurricane-paths-layer",
      type: "line",
      source: "hurricane-paths",
      layout: {
        visibility: "none",
      },
      paint: {
        "line-color": "#8b5cf6",
        "line-width": 3,
        "line-opacity": 0.7,
      },
    });
  }, []);

  // Update properties on map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const source = map.current.getSource("properties") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: properties.map((property) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: property.coordinates,
          },
          properties: property,
        })),
      });
    }
  }, [properties, mapLoaded]);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string) => {
    if (!map.current) return;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );

    const visibility = map.current.getLayoutProperty(
      `${layerId}-layer`,
      "visibility"
    );

    map.current.setLayoutProperty(
      `${layerId}-layer`,
      "visibility",
      visibility === "visible" ? "none" : "visible"
    );

    // Special handling for heatmap
    if (layerId === "heatmap") {
      map.current.setLayoutProperty(
        "property-heat",
        "visibility",
        visibility === "visible" ? "none" : "visible"
      );
    }
  }, []);

  // Handle property click
  const handlePropertyClick = useCallback((property: Property) => {
    setSelectedProperty(property);
    onPropertyClick?.(property);

    // Show popup
    if (map.current && property.coordinates) {
      if (popup.current) {
        popup.current.remove();
      }

      popup.current = new mapboxgl.Popup({ offset: 25 })
        .setLngLat(property.coordinates)
        .setHTML(`
          <div class="p-3">
            <h3 class="font-bold text-sm mb-1">${property.name}</h3>
            <p class="text-xs text-gray-600 mb-2">${property.address}</p>
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>Value:</span>
                <span class="font-medium">$${property.value.toLocaleString()}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span>Risk:</span>
                <span class="font-medium ${
                  property.riskLevel === "high" ? "text-red-500" :
                  property.riskLevel === "medium" ? "text-orange-500" :
                  "text-green-500"
                }">${property.riskLevel.toUpperCase()}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span>Insurance:</span>
                <span class="font-medium">${property.insuranceStatus}</span>
              </div>
            </div>
          </div>
        `)
        .addTo(map.current);
    }
  }, [onPropertyClick]);

  // Search for parcels
  const searchParcels = useCallback((query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results = properties.filter(
      (p) =>
        p.parcelId?.toLowerCase().includes(query.toLowerCase()) ||
        p.address.toLowerCase().includes(query.toLowerCase()) ||
        p.name.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(results);

    // Zoom to first result
    if (results.length > 0 && map.current) {
      map.current.flyTo({
        center: results[0].coordinates,
        zoom: 14,
      });
    }
  }, [properties]);

  return (
    <div className={cn("relative", className)} style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map not configured message */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-50">
          <Card className="max-w-md p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Map Configuration Required</h3>
            <p className="text-sm text-gray-400 mb-4">
              Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables to enable the map.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open("https://www.mapbox.com/", "_blank")}
            >
              Get Mapbox Token
            </Button>
          </Card>
        </div>
      )}

      {/* Statistics Overlay */}
      {showStats && stats && (
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <Card className="bg-gray-900/90 backdrop-blur border-gray-700 p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400">Properties</span>
                <span className="text-sm font-bold text-white">
                  {stats.totalProperties.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400">Total Value</span>
                <span className="text-sm font-bold text-green-400">
                  ${(stats.totalValue / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400">High Risk</span>
                <span className="text-sm font-bold text-orange-400">
                  {stats.highRisk}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400">Coverage</span>
                <span className="text-sm font-bold text-blue-400">
                  {stats.coverageRate.toFixed(0)}%
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2 text-xs"
              onClick={() => setShowStats(false)}
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Hide Stats
            </Button>
          </Card>
        </div>
      )}

      {/* Layer Controls */}
      {showLayerPanel && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLayers(!showLayers)}
            className="bg-gray-900/90 backdrop-blur border-gray-700 text-white hover:bg-gray-800"
          >
            <Layers className="w-4 h-4 mr-2" />
            Layers
          </Button>

          {showLayers && (
            <Card className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Map Layers</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLayers(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {layers.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <div key={layer.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: layer.color }} />
                          <span className="text-sm text-white">{layer.name}</span>
                        </div>
                        <Switch
                          checked={layer.visible}
                          onCheckedChange={() => toggleLayer(layer.id)}
                        />
                      </div>
                      {layer.description && (
                        <p className="text-xs text-gray-400 pl-6">
                          {layer.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">
                  Property Value Filter
                </h4>
                <div className="space-y-2">
                  <Slider
                    value={valueRange}
                    onValueChange={setValueRange}
                    min={0}
                    max={5000000}
                    step={100000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>${(valueRange[0] / 1000).toFixed(0)}k</span>
                    <span>${(valueRange[1] / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Parcel Search Results */}
      {searchResults.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Card className="bg-gray-900/95 backdrop-blur border-gray-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">
                Search Results ({searchResults.length})
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchResults([])}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {searchResults.slice(0, 5).map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                  onClick={() => {
                    handlePropertyClick(property);
                    if (map.current) {
                      map.current.flyTo({
                        center: property.coordinates,
                        zoom: 16,
                      });
                    }
                  }}
                >
                  <div>
                    <p className="text-xs font-medium text-white">
                      {property.name}
                    </p>
                    <p className="text-xs text-gray-400">{property.address}</p>
                  </div>
                  <Badge
                    className={cn(
                      "text-xs",
                      property.riskLevel === "high" && "bg-red-500/20 text-red-400",
                      property.riskLevel === "medium" && "bg-orange-500/20 text-orange-400",
                      property.riskLevel === "low" && "bg-green-500/20 text-green-400"
                    )}
                  >
                    {property.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="bg-gray-900/90 backdrop-blur border-gray-700 p-3">
          <h4 className="text-xs font-semibold text-white mb-2">Risk Levels</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-300">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-300">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-300">High Risk</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}