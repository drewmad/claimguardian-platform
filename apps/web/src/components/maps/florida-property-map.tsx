/**
 * @fileMetadata
 * @purpose "Enhanced Interactive Mapbox map component for visualizing Florida properties and insurance data with real-time parcel integration"
 * @owner frontend-team
 * @dependencies ["react", "mapbox-gl", "@types/mapbox-gl", "lucide-react"]
 * @exports ["FloridaPropertyMap"]
 * @complexity high
 * @tags ["maps", "mapbox", "florida", "properties", "geospatial", "enhanced", "parcels"]
 * @status enhanced
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import {
  MapPin,
  Home,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  Maximize2,
  Minimize2,
  RotateCcw,
  Map as MapIcon,
  Satellite,
  Cloud,
  Activity,
  TrendingUp,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

// Types
interface Property {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: "single_family" | "condo" | "townhouse" | "commercial" | "multi_family";
  value: number;
  insuranceStatus: "active" | "expired" | "pending" | "none";
  claimsCount: number;
  riskLevel: "low" | "medium" | "high";
  county: string;
  lastUpdated: Date;
}

interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type?: 'base' | 'overlay' | 'data';
  description?: string;
}

interface ParcelData {
  PARCEL_ID: string;
  OWN_NAME: string;
  PHY_ADDR1: string;
  PHY_CITY: string;
  PHY_ZIPCD: string;
  JV: number; // Just Value
  latitude: number;
  longitude: number;
  DOR_UC: string; // Use Code
}

interface MapStats {
  totalProperties: number;
  averageValue: number;
  activeInsurance: number;
  expiredInsurance: number;
}

interface FloridaPropertyMapProps {
  properties?: Property[];
  center?: [number, number];
  zoom?: number;
  showControls?: boolean;
  showSearch?: boolean;
  onPropertyClick?: (property: Property) => void;
  className?: string;
  height?: string;
  mapStyle?: string;
  enableClustering?: boolean;
  showHeatMap?: boolean;
  showRealParcels?: boolean;
  maxZoom?: number;
  minZoom?: number;
}

// Florida-specific map configuration
const FLORIDA_CENTER: [number, number] = [-82.4572, 27.9506];
const FLORIDA_BOUNDS: [[number, number], [number, number]] = [
  [-87.6349, 24.3963], // Southwest coordinates
  [-79.9743, 31.0007], // Northeast coordinates
];

// Enhanced map layers configuration
const DEFAULT_LAYERS: MapLayer[] = [
  { 
    id: "properties", 
    name: "User Properties", 
    visible: true, 
    color: "#10b981", 
    type: "data",
    description: "Your tracked properties"
  },
  { 
    id: "florida-parcels", 
    name: "Florida Parcels", 
    visible: false, 
    color: "#6366f1", 
    type: "data",
    description: "Real property data from Florida DOR"
  },
  { 
    id: "property-values", 
    name: "Property Value Heatmap", 
    visible: false, 
    color: "#f59e0b", 
    type: "overlay",
    description: "Heat map showing property values"
  },
  { 
    id: "claims", 
    name: "Insurance Claims", 
    visible: true, 
    color: "#f59e0b", 
    type: "data",
    description: "Properties with insurance claims"
  },
  { 
    id: "risk-zones", 
    name: "Risk Assessment", 
    visible: false, 
    color: "#ef4444", 
    type: "overlay",
    description: "Hurricane and flood risk areas"
  },
  { 
    id: "flood-zones", 
    name: "FEMA Flood Zones", 
    visible: false, 
    color: "#3b82f6", 
    type: "overlay",
    description: "Federal flood risk zones"
  },
  {
    id: "hurricane-tracks",
    name: "Hurricane History",
    visible: false,
    color: "#8b5cf6",
    type: "overlay",
    description: "Historical hurricane paths"
  },
  {
    id: "weather-radar",
    name: "Weather Radar",
    visible: false,
    color: "#06d6a0",
    type: "overlay",
    description: "Current weather conditions"
  },
];

// Map style presets
const MAP_STYLES = [
  { id: "dark", name: "Dark", style: "mapbox://styles/mapbox/dark-v11" },
  { id: "satellite", name: "Satellite", style: "mapbox://styles/mapbox/satellite-v9" },
  { id: "streets", name: "Streets", style: "mapbox://styles/mapbox/streets-v12" },
  { id: "terrain", name: "Terrain", style: "mapbox://styles/mapbox/outdoors-v12" },
];

export function FloridaPropertyMap({
  properties = [],
  center = FLORIDA_CENTER,
  zoom = 7,
  showControls = true,
  showSearch = true,
  onPropertyClick,
  className = "",
  height = "500px",
  mapStyle = "mapbox://styles/mapbox/dark-v11",
  enableClustering = true,
  showHeatMap = false,
  showRealParcels = false,
  maxZoom = 20,
  minZoom = 5,
}: FloridaPropertyMapProps) {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Enhanced State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layers, setLayers] = useState<MapLayer[]>(DEFAULT_LAYERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showLayerControls, setShowLayerControls] = useState(false);
  const [showMapStyleControls, setShowMapStyleControls] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState(mapStyle);
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [mapStats, setMapStats] = useState<MapStats>({
    totalProperties: 0,
    averageValue: 0,
    activeInsurance: 0,
    expiredInsurance: 0,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [isLoadingParcels, setIsLoadingParcels] = useState(false);

  // Fetch Florida parcels data
  const fetchParcels = useCallback(async (bounds: mapboxgl.LngLatBounds) => {
    if (!bounds) return;

    setIsLoadingParcels(true);
    try {
      const { _ne: ne, _sw: sw } = bounds;
      const zoom = map.current?.getZoom() || 7;
      
      // Calculate appropriate zoom level for tile request
      const tileZ = Math.floor(zoom);
      const tileX = Math.floor((sw.lng + 180) / 360 * Math.pow(2, tileZ));
      const tileY = Math.floor((1 - Math.log(Math.tan(ne.lat * Math.PI / 180) + 1 / Math.cos(ne.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, tileZ));

      const response = await fetch(`/api/parcels/tiles/${tileZ}/${tileX}/${tileY}`);
      
      if (response.ok) {
        const geojson = await response.json();
        const parcelData = geojson.features.map((feature: any) => ({
          PARCEL_ID: feature.properties.id,
          OWN_NAME: feature.properties.owner,
          PHY_ADDR1: feature.properties.address,
          PHY_CITY: feature.properties.city,
          PHY_ZIPCD: feature.properties.zip,
          JV: feature.properties.value || 0,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          DOR_UC: feature.properties.year || '',
        }));
        
        setParcels(parcelData);
        
        // Update map stats
        const totalValue = parcelData.reduce((sum: number, parcel: ParcelData) => sum + (parcel.JV || 0), 0);
        setMapStats(prev => ({
          ...prev,
          totalProperties: parcelData.length,
          averageValue: parcelData.length > 0 ? totalValue / parcelData.length : 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching parcels:', error);
    } finally {
      setIsLoadingParcels(false);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token (should be in environment variables)
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    if (!mapboxgl.accessToken) {
      console.warn(
        "Mapbox access token not found. Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.",
      );
      return;
    }

    // Create map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: currentMapStyle,
      center,
      zoom,
      minZoom,
      maxZoom,
      maxBounds: FLORIDA_BOUNDS,
      attributionControl: false,
    });

    // Add navigation controls
    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.current.addControl(
        new mapboxgl.AttributionControl({ compact: true }),
        "bottom-right",
      );
    }

    // Map load event
    map.current.on("load", () => {
      setMapLoaded(true);

      // Add data sources and layers
      addMapSources();
      addMapLayers();
      
      // Load initial parcel data if enabled
      if (showRealParcels) {
        const bounds = map.current?.getBounds();
        if (bounds) {
          fetchParcels(bounds);
        }
      }
    });

    // Map move events for dynamic data loading
    map.current.on("moveend", () => {
      if (showRealParcels && map.current) {
        const bounds = map.current.getBounds();
        fetchParcels(bounds);
      }
    });

    // Fullscreen events
    map.current.on("fullscreenstart", () => setIsFullscreen(true));
    map.current.on("fullscreenend", () => setIsFullscreen(false));

    // Cleanup
    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, [center, zoom, currentMapStyle, showControls, minZoom, maxZoom, showRealParcels, fetchParcels]);

  // Add property markers when properties change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add markers for each property
    properties.forEach((property) => {
      const marker = createPropertyMarker(property);
      markers.current.push(marker);
    });
  }, [properties, mapLoaded]);

  // Create property marker
  const createPropertyMarker = useCallback(
    (property: Property) => {
      if (!map.current) return new mapboxgl.Marker();

      // Create custom marker element
      const markerElement = document.createElement("div");
      markerElement.className = "property-marker";
      markerElement.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      cursor: pointer;
      transition: transform 0.2s ease;
      background-color: ${getPropertyColor(property)};
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;

      // Hover effects
      markerElement.addEventListener("mouseenter", () => {
        markerElement.style.transform = "scale(1.5)";
        markerElement.style.zIndex = "1000";
      });

      markerElement.addEventListener("mouseleave", () => {
        markerElement.style.transform = "scale(1)";
        markerElement.style.zIndex = "auto";
      });

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(property.coordinates)
        .addTo(map.current!);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 15,
        className: "property-popup",
      }).setHTML(createPopupHTML(property));

      // Add click event
      markerElement.addEventListener("click", () => {
        setSelectedProperty(property);
        onPropertyClick?.(property);
        marker.setPopup(popup).togglePopup();
      });

      return marker;
    },
    [onPropertyClick],
  );

  // Get property marker color based on status
  const getPropertyColor = (property: Property): string => {
    switch (property.insuranceStatus) {
      case "active":
        return "#10b981"; // Green
      case "expired":
        return "#ef4444"; // Red
      case "pending":
        return "#f59e0b"; // Orange
      case "none":
        return "#6b7280"; // Gray
      default:
        return "#6b7280";
    }
  };

  // Create popup HTML
  const createPopupHTML = (property: Property): string => {
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);

    return `
      <div class="p-3 min-w-64">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-semibold text-white text-sm">${property.name}</h3>
          <span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(property.insuranceStatus)}">
            ${property.insuranceStatus.toUpperCase()}
          </span>
        </div>
        <p class="text-gray-300 text-xs mb-2">${property.address}</p>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-gray-400">Type:</span>
            <span class="text-white ml-1">${property.type.replace("_", " ")}</span>
          </div>
          <div>
            <span class="text-gray-400">Value:</span>
            <span class="text-white ml-1">${formatCurrency(property.value)}</span>
          </div>
          <div>
            <span class="text-gray-400">Claims:</span>
            <span class="text-white ml-1">${property.claimsCount}</span>
          </div>
          <div>
            <span class="text-gray-400">Risk:</span>
            <span class="text-white ml-1 ${getRiskColorClass(property.riskLevel)}">${property.riskLevel.toUpperCase()}</span>
          </div>
        </div>
      </div>
    `;
  };

  // Get status badge CSS class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-green-600 text-white";
      case "expired":
        return "bg-red-600 text-white";
      case "pending":
        return "bg-orange-600 text-white";
      case "none":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  // Get risk level color class
  const getRiskColorClass = (riskLevel: string): string => {
    switch (riskLevel) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-orange-400";
      case "high":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  // Enhanced map sources with real data integration
  const addMapSources = useCallback(() => {
    if (!map.current) return;

    // Add vector tile source for Florida parcels
    map.current.addSource("florida-parcels-tiles", {
      type: "vector",
      tiles: [`${window.location.origin}/api/parcels/tiles/{z}/{x}/{y}`],
      minzoom: 6,
      maxzoom: 14,
    });

    // Add GeoJSON source for Florida counties (placeholder)
    map.current.addSource("florida-counties", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [], // Would be populated with actual county data
      },
    });

    // Add source for flood zones
    map.current.addSource("flood-zones", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [], // Would be populated with FEMA flood zone data
      },
    });

    // Add property value heatmap source
    if (showHeatMap && properties.length > 0) {
      const heatmapData = {
        type: "FeatureCollection" as const,
        features: properties.map(prop => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: prop.coordinates
          },
          properties: {
            value: prop.value,
            weight: Math.log(prop.value) // Use logarithmic scale for better visualization
          }
        }))
      };

      map.current.addSource("property-values-heatmap", {
        type: "geojson",
        data: heatmapData,
      });
    }

    // Add real parcel data source if available
    if (parcels.length > 0) {
      const parcelGeoJSON = {
        type: "FeatureCollection" as const,
        features: parcels.map(parcel => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [parcel.longitude, parcel.latitude]
          },
          properties: {
            id: parcel.PARCEL_ID,
            owner: parcel.OWN_NAME,
            address: parcel.PHY_ADDR1,
            city: parcel.PHY_CITY,
            zip: parcel.PHY_ZIPCD,
            value: parcel.JV,
            year: parcel.DOR_UC
          }
        }))
      };

      if (map.current.getSource('parcels-data')) {
        (map.current.getSource('parcels-data') as mapboxgl.GeoJSONSource).setData(parcelGeoJSON);
      } else {
        map.current.addSource("parcels-data", {
          type: "geojson",
          data: parcelGeoJSON,
        });
      }
    }
  }, [parcels, properties, showHeatMap]);

  // Enhanced map layers with advanced visualizations
  const addMapLayers = useCallback(() => {
    if (!map.current) return;

    // Add property value heatmap layer
    if (showHeatMap) {
      map.current.addLayer({
        id: "property-values-heatmap-layer",
        type: "heatmap",
        source: "property-values-heatmap",
        maxzoom: 15,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0, 0,
            10, 1
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 1,
            15, 3
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(33, 102, 172, 0)",
            0.2, "rgb(103, 169, 207)",
            0.4, "rgb(209, 229, 240)",
            0.6, "rgb(253, 219, 199)",
            0.8, "rgb(239, 138, 98)",
            1, "rgb(178, 24, 43)"
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6, 10,
            15, 30
          ],
        },
      });
    }

    // Add real parcels layer with clustering
    if (enableClustering && map.current.getSource('parcels-data')) {
      // Add clustered circle layer
      map.current.addLayer({
        id: "parcels-clusters",
        type: "circle",
        source: "parcels-data",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#6366f1",
            100, "#4f46e5",
            750, "#4338ca"
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            15, // radius for clusters with < 100 points
            100, 25, // radius for clusters with 100-750 points
            750, 35  // radius for clusters with > 750 points
          ],
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });

      // Add cluster count labels
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "parcels-data",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12
        },
        paint: {
          "text-color": "#ffffff"
        }
      });

      // Add individual parcel points
      map.current.addLayer({
        id: "parcels-unclustered",
        type: "circle",
        source: "parcels-data",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0, "#22c55e",
            500000, "#eab308",
            1000000, "#f97316",
            2000000, "#ef4444"
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6, 3,
            14, 8
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.8
        }
      });
    }

    // Add county boundaries layer
    map.current.addLayer({
      id: "county-boundaries",
      type: "line",
      source: "florida-counties",
      paint: {
        "line-color": "#374151",
        "line-width": 1,
        "line-opacity": 0.5,
      },
    });

    // Add flood zones layer
    map.current.addLayer({
      id: "flood-zones-layer",
      type: "fill",
      source: "flood-zones",
      paint: {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.2,
      },
    });

    // Initially hide some layers
    map.current.setLayoutProperty("flood-zones-layer", "visibility", "none");
    if (showHeatMap) {
      map.current.setLayoutProperty("property-values-heatmap-layer", "visibility", layers.find(l => l.id === "property-values")?.visible ? "visible" : "none");
    }
  }, [enableClustering, showHeatMap, layers]);

  // Filter properties based on search
  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.county.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Enhanced layer visibility toggle
  const toggleLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !map.current) return;

    const newVisibility = !layer.visible;
    
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: newVisibility } : layer,
      ),
    );

    // Update map layer visibility based on layer type
    switch (layerId) {
      case "flood-zones":
        map.current.setLayoutProperty("flood-zones-layer", "visibility", newVisibility ? "visible" : "none");
        break;
      case "property-values":
        if (map.current.getLayer("property-values-heatmap-layer")) {
          map.current.setLayoutProperty("property-values-heatmap-layer", "visibility", newVisibility ? "visible" : "none");
        }
        break;
      case "florida-parcels":
        if (map.current.getLayer("parcels-clusters")) {
          map.current.setLayoutProperty("parcels-clusters", "visibility", newVisibility ? "visible" : "none");
          map.current.setLayoutProperty("cluster-count", "visibility", newVisibility ? "visible" : "none");
          map.current.setLayoutProperty("parcels-unclustered", "visibility", newVisibility ? "visible" : "none");
        }
        break;
    }
  };

  // Change map style
  const changeMapStyle = (styleId: string) => {
    const style = MAP_STYLES.find(s => s.id === styleId);
    if (style && map.current) {
      map.current.setStyle(style.style);
      setCurrentMapStyle(style.style);
      
      // Re-add sources and layers after style change
      map.current.on('styledata', () => {
        if (map.current?.isStyleLoaded()) {
          addMapSources();
          addMapLayers();
        }
      });
    }
  };

  // Reset map view
  const resetMapView = () => {
    if (map.current) {
      map.current.flyTo({
        center: FLORIDA_CENTER,
        zoom: 7,
        duration: 1000,
      });
    }
  };

  // Calculate map statistics
  const calculateStats = () => {
    const totalProps = properties.length + parcels.length;
    const activeInsurance = properties.filter(p => p.insuranceStatus === 'active').length;
    const expiredInsurance = properties.filter(p => p.insuranceStatus === 'expired').length;
    const totalValue = properties.reduce((sum, prop) => sum + prop.value, 0) + 
                      parcels.reduce((sum, parcel) => sum + (parcel.JV || 0), 0);
    const avgValue = totalProps > 0 ? totalValue / totalProps : 0;

    setMapStats({
      totalProperties: totalProps,
      averageValue: avgValue,
      activeInsurance,
      expiredInsurance,
    });
  };

  // Update stats when data changes
  useEffect(() => {
    calculateStats();
  }, [properties, parcels]);

  // Fly to property
  const flyToProperty = (property: Property) => {
    if (!map.current) return;

    map.current.flyTo({
      center: property.coordinates,
      zoom: 14,
      duration: 1000,
    });

    setSelectedProperty(property);
    onPropertyClick?.(property);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-700 ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Map Container */}
      <div ref={mapContainer} className="w-full" style={{ height: isFullscreen ? '100vh' : height }} />

      {/* Enhanced Search Bar */}
      {showSearch && (
        <div className="absolute top-4 left-4 right-4 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search properties, addresses, counties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/90 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Enhanced Controls Panel */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* Map Style Selector */}
          <div className="relative">
            <button
              onClick={() => setShowMapStyleControls(!showMapStyleControls)}
              className="p-2 bg-gray-800/90 border border-gray-600 rounded-lg text-white hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-all"
              title="Change Map Style"
            >
              {currentMapStyle.includes('satellite') ? <Satellite className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
            </button>
            
            {showMapStyleControls && (
              <div className="absolute top-12 right-0 bg-gray-800/95 border border-gray-600 rounded-lg p-3 min-w-40 backdrop-blur-sm shadow-xl">
                <h3 className="font-medium text-white mb-2 text-sm">Map Style</h3>
                {MAP_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      changeMapStyle(style.id);
                      setShowMapStyleControls(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                      currentMapStyle === style.style 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layer Controls */}
          <button
            onClick={() => setShowLayerControls(!showLayerControls)}
            className="p-2 bg-gray-800/90 border border-gray-600 rounded-lg text-white hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-all"
            title="Toggle Layers"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Reset View */}
          <button
            onClick={resetMapView}
            className="p-2 bg-gray-800/90 border border-gray-600 rounded-lg text-white hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-all"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Toggle Stats */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 bg-gray-800/90 border border-gray-600 rounded-lg text-white hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-all"
            title="Toggle Statistics"
          >
            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Enhanced Layer Controls Panel */}
          {showLayerControls && (
            <div className="absolute top-12 right-0 bg-gray-800/95 border border-gray-600 rounded-lg p-4 min-w-64 backdrop-blur-sm shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white text-sm">Map Layers</h3>
                <button
                  onClick={() => setShowLayerControls(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Group layers by type */}
              {['data', 'overlay'].map(type => (
                <div key={type} className="mb-3">
                  <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                    {type === 'data' ? 'Data Layers' : 'Overlay Layers'}
                  </h4>
                  {layers
                    .filter(layer => layer.type === type)
                    .map((layer) => (
                      <div key={layer.id} className="mb-2">
                        <label className="flex items-start justify-between py-1 group cursor-pointer">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: layer.color }}
                              />
                              <span className="text-sm text-gray-300 group-hover:text-white">
                                {layer.name}
                              </span>
                            </div>
                            {layer.description && (
                              <p className="text-xs text-gray-500 ml-5 mt-1">
                                {layer.description}
                              </p>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={layer.visible}
                            onChange={() => toggleLayer(layer.id)}
                            className="ml-2 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                          />
                        </label>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Property List Sidebar (when searching) */}
      {searchQuery && filteredProperties.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800/95 border-t border-gray-600 max-h-48 overflow-y-auto backdrop-blur-sm">
          <div className="p-3">
            <h3 className="font-medium text-white mb-2 text-sm">
              {filteredProperties.length} Properties Found
            </h3>
            <div className="space-y-2">
              {filteredProperties.slice(0, 5).map((property) => (
                <button
                  key={property.id}
                  onClick={() => flyToProperty(property)}
                  className="w-full text-left p-2 rounded bg-gray-700/50 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {property.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {property.address}
                      </p>
                    </div>
                    <div className="flex items-center ml-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          property.insuranceStatus === "active"
                            ? "bg-green-400"
                            : property.insuranceStatus === "expired"
                              ? "bg-red-400"
                              : property.insuranceStatus === "pending"
                                ? "bg-orange-400"
                                : "bg-gray-400"
                        }`}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Panel */}
      {showStats && (
        <div className="absolute bottom-4 left-4 bg-gray-800/95 border border-gray-600 rounded-lg p-4 backdrop-blur-sm shadow-xl min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              Map Statistics
            </h4>
            {isLoadingParcels && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center p-2 bg-gray-700/50 rounded">
              <div className="text-lg font-bold text-white">
                {mapStats.totalProperties.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Total Properties</div>
            </div>
            <div className="text-center p-2 bg-gray-700/50 rounded">
              <div className="text-lg font-bold text-white">
                ${(mapStats.averageValue / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-gray-400">Avg Value</div>
            </div>
          </div>

          <div className="mb-3">
            <h5 className="font-medium text-white mb-2 text-xs">Insurance Status</h5>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-400 mr-2" />
                  <span className="text-xs text-gray-300">Active</span>
                </div>
                <span className="text-xs text-white font-medium">
                  {mapStats.activeInsurance}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-400 mr-2" />
                  <span className="text-xs text-gray-300">Expired</span>
                </div>
                <span className="text-xs text-white font-medium">
                  {mapStats.expiredInsurance}
                </span>
              </div>
            </div>
          </div>

          {showRealParcels && (
            <div className="mb-3">
              <h5 className="font-medium text-white mb-2 text-xs">Property Values</h5>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-400 mr-2" />
                  <span className="text-xs text-gray-300">$0-500K</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2" />
                  <span className="text-xs text-gray-300">$500K-1M</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-400 mr-2" />
                  <span className="text-xs text-gray-300">$1M-2M</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-400 mr-2" />
                  <span className="text-xs text-gray-300">$2M+</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">Loading map...</p>
          </div>
        </div>
      )}

      {/* No Token Warning */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center p-6">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">
              Mapbox Token Required
            </h3>
            <p className="text-sm text-gray-300">
              Add your Mapbox access token to NEXT_PUBLIC_MAPBOX_TOKEN
              environment variable
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
