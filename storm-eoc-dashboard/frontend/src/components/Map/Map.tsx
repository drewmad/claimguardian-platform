import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useLayerContext } from '../../context/LayerContext';
import { initializeMap, addDataLayers, updateLayerVisibility, handleFeatureClick, updateMapDataSources } from './mapUtils';
import SatelliteSwipeTool from './SatelliteSwipeTool';
import { Feature } from 'geojson';
import { useWebSocketContext } from '../../context/WebSocketContext';

// Set Mapbox access token from environment variable or replace with your token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN';

if (!mapboxgl.accessToken || mapboxgl.accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN') {
    console.warn("Mapbox access token not set. Please set VITE_MAPBOX_TOKEN environment variable.");
}

interface MapViewProps {
  onFeatureSelect: (feature: Feature) => void;
}

const MapView: React.FC<MapViewProps> = ({ onFeatureSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  // Initial map view centered on Florida
  const [lng, setLng] = useState(-81.3792);
  const [lat, setLat] = useState(28.5384);
  const [zoom, setZoom] = useState(6);
  const { visibleLayers } = useLayerContext();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const { lastMessage } = useWebSocketContext();

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once
    if (!mapContainer.current) return;

    // Use a dark style suitable for EOC environments
    map.current = initializeMap(mapContainer.current, [lng, lat], zoom, 'mapbox://styles/mapbox/dark-v11');

    map.current.on('load', () => {
      setIsMapLoaded(true);
      if (map.current) {
        // Add data sources and layers once the map is loaded
        addDataLayers(map.current);
        // Set initial visibility based on context
        updateLayerVisibility(map.current, visibleLayers);
        // Fetch initial data
        updateMapDataSources(map.current);
      }
    });

    // Update coordinates and zoom level on map move
    map.current.on('move', () => {
      if (map.current) {
        setLng(Number(map.current.getCenter().lng.toFixed(4)));
        setLat(Number(map.current.getCenter().lat.toFixed(4)));
        setZoom(Number(map.current.getZoom().toFixed(2)));
      }
    });

    // Handle feature clicks for interaction
    map.current.on('click', (e) => {
        if (map.current) {
            handleFeatureClick(map.current, e, onFeatureSelect);
        }
    });

  }, []);

  // Update layer visibility when context changes
  useEffect(() => {
    if (map.current && isMapLoaded) {
      updateLayerVisibility(map.current, visibleLayers);
    }
  }, [visibleLayers, isMapLoaded]);

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (map.current && isMapLoaded && lastMessage) {
        try {
            const data = JSON.parse(lastMessage.data);
            // Assuming incoming messages are GeoJSON features for community reports
            if (data.type === 'Feature' && data.properties && data.properties.report_type) {
                // Update the community-reports source data
                // This requires fetching the full dataset again or incrementally updating the source
                // For simplicity here, we trigger a refresh of the data source.
                updateMapDataSources(map.current, ['community-reports']);
            }
            // Handle other types of real-time updates (e.g., X posts)
        } catch (error) {
            console.error("Error processing WebSocket message for map update:", error);
        }
    }
  }, [lastMessage, isMapLoaded]);

  // Check if swipe tool should be active
  const isSwipeActive = visibleLayers.satellitePreStorm && visibleLayers.satellitePostStorm;

  return (
    <div className="h-full relative">
      {/* Coordinate display overlay */}
      <div className="absolute bottom-2 left-2 bg-black/50 p-2 rounded shadow-md z-10 text-xs font-mono text-white">
        Lng: {lng} | Lat: {lat} | Zoom: {zoom}
      </div>
      
      {/* Map container */}
      <div ref={mapContainer} className="h-full" />
      
      {/* Satellite Swipe Tool (conditionally rendered) */}
      {isSwipeActive && map.current && isMapLoaded && (
        <SatelliteSwipeTool 
            map={map.current}
            preStormLayerId="satellite-pre-storm-layer"
            postStormLayerId="satellite-post-storm-layer"
        />
      )}
    </div>
  );
};

export default MapView;
