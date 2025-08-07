import mapboxgl, { MapMouseEvent } from 'mapbox-gl';
import { Feature } from 'geojson';
import axios from 'axios';

// Initialize Mapbox map instance
export const initializeMap = (container: HTMLDivElement, center: [number, number], zoom: number, style: string): mapboxgl.Map => {
  const map = new mapboxgl.Map({
    container: container,
    style: style,
    center: center,
    zoom: zoom,
  });

  // Add controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

  return map;
};

// Define layers that are clickable
const CLICKABLE_LAYERS = [
    'community-reports-layer',
    'x-posts-unclustered-point-layer',
    // 'hospitals-layer',
    // 'shelters-layer'
];

// Define data sources
const DATA_SOURCES = {
    'community-reports': {
        type: 'geojson',
        // Use relative URL for API requests (proxied by Vite/Nginx)
        apiUrl: '/api/v1/reports?hours=24',
        data: { type: 'FeatureCollection', features: [] } // Initial empty GeoJSON
    },
    'x-posts': {
        type: 'geojson',
        // apiUrl: '/api/v1/social_media/x_posts/geojson?hours=6',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    },
    // Add other sources (hospitals, shelters, weather data) here
};

// Add data sources and layers to the map
export const addDataLayers = (map: mapboxgl.Map) => {
  
  // Initialize sources
  Object.entries(DATA_SOURCES).forEach(([id, sourceDef]) => {
    map.addSource(id, sourceDef as mapboxgl.AnySourceData);
  });

  // 1. Community Reports
  map.addLayer({
    id: 'community-reports-layer',
    type: 'circle',
    source: 'community-reports',
    paint: {
      'circle-color': '#f59e0b', // EOC Accent color
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
    layout: {
      visibility: 'visible',
    }
  });

  // 2. X/Twitter Posts (Heatmap and Clusters)
  addXPostsLayers(map);

  // 3. Facilities (Hospitals and Shelters - Placeholder)
  // addFacilitiesLayers(map);

  // 4. Weather Data (Placeholder)
  // addWeatherDataLayers(map);

  // 5. Satellite Imagery (For swipe tool)
  addSatelliteImageryLayers(map);

  // Add cursor styling for clickable layers
  CLICKABLE_LAYERS.forEach(layerId => {
    if (map.getLayer(layerId)) {
        map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
        });
    }
  });
};

// Function to fetch data and update map sources
export const updateMapDataSources = async (map: mapboxgl.Map, sourceIds?: string[]) => {
    const sourcesToUpdate = sourceIds || Object.keys(DATA_SOURCES);

    for (const id of sourcesToUpdate) {
        const sourceDef = (DATA_SOURCES as any)[id];
        if (sourceDef && sourceDef.apiUrl) {
            try {
                const response = await axios.get(sourceDef.apiUrl);
                const data = response.data;
                
                // Handle both FeatureCollection and array of Features
                let geojsonData;
                if (Array.isArray(data)) {
                    geojsonData = { type: 'FeatureCollection', features: data };
                } else if (data.type === 'FeatureCollection') {
                    geojsonData = data;
                } else {
                    console.error(`Invalid GeoJSON format received for source ${id}`);
                    continue;
                }

                const source = map.getSource(id) as mapboxgl.GeoJSONSource;
                if (source) {
                    source.setData(geojsonData);
                }
            } catch (error) {
                console.error(`Error fetching data for source ${id}:`, error);
            }
        }
    }
};


const addXPostsLayers = (map: mapboxgl.Map) => {
  // Heatmap Layer (Visualization 1)
  map.addLayer({
      id: 'x-posts-heatmap-layer',
      type: 'heatmap',
      source: 'x-posts',
      maxzoom: 9,
      paint: {
        // Weight by relevancy score (if available in properties)
        // 'heatmap-weight': ['interpolate', ['linear'], ['get', 'relevancy_score'], 0, 0.1, 1, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 9, 0]
      },
      layout: { visibility: 'visible' }
    },
    // Insert below labels
    'waterway-label'
  );

  // Clustered Points Layer (Visualization 2)
  map.addLayer({
    id: 'x-posts-clusters-layer',
    type: 'circle',
    source: 'x-posts',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
    },
    layout: { visibility: 'none' } // Hidden by default, controlled by context
  });

  map.addLayer({
    id: 'x-posts-cluster-count-layer',
    type: 'symbol',
    source: 'x-posts',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
      visibility: 'none'
    }
  });

  // Unclustered points
  map.addLayer({
    id: 'x-posts-unclustered-point-layer',
    type: 'circle',
    source: 'x-posts',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 6,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    },
    layout: { visibility: 'none' }
  });

  // Cluster zoom interaction
  map.on('click', 'x-posts-clusters-layer', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['x-posts-clusters-layer'] });
    const clusterId = features[0].properties?.cluster_id;
    const source = map.getSource('x-posts') as mapboxgl.GeoJSONSource;
    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      if (features[0].geometry.type === 'Point') {
        map.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom: zoom
        });
      }
    });
  });
};


const addSatelliteImageryLayers = (map: mapboxgl.Map) => {
  // Placeholder URLs for satellite imagery tiles. Replace with actual tile URLs from your provider.
  // In a production application, these URLs would be fetched from the backend (satellite_imagery_metadata table).
  const PRE_STORM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // Placeholder
  const POST_STORM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // Placeholder

  map.addSource('satellite-pre-storm', {
    type: 'raster',
    tiles: [PRE_STORM_TILE_URL],
    tileSize: 256,
    attribution: '© OpenStreetMap contributors'
  });

  map.addSource('satellite-post-storm', {
    type: 'raster',
    tiles: [POST_STORM_TILE_URL],
    tileSize: 256,
  });

  map.addLayer({
    id: 'satellite-pre-storm-layer',
    type: 'raster',
    source: 'satellite-pre-storm',
    layout: { visibility: 'none' },
  });

  map.addLayer({
    id: 'satellite-post-storm-layer',
    type: 'raster',
    source: 'satellite-post-storm',
    layout: { visibility: 'none' },
  });
};

// Update layer visibility based on context state
export const updateLayerVisibility = (map: mapboxgl.Map, visibleLayers: { [key: string]: boolean }) => {
  const layerMapping: { [key: string]: string[] } = {
    communityReports: ['community-reports-layer'],
    xPostsHeatmap: ['x-posts-heatmap-layer'],
    xPostsClusters: [
        'x-posts-clusters-layer',
        'x-posts-cluster-count-layer',
        'x-posts-unclustered-point-layer'
    ],
    // hospitals: ['hospitals-layer'],
    // shelters: ['shelters-layer'],
    // stormTrack: ['storm-track-line-layer'],
    // windProbabilities: ['wind-probabilities-layer'],
    // Satellite layers visibility is also controlled here, but the swipe tool manages their interaction
    satellitePreStorm: ['satellite-pre-storm-layer'],
    satellitePostStorm: ['satellite-post-storm-layer'],
  };

  Object.entries(visibleLayers).forEach(([key, isVisible]) => {
    const layerIds = layerMapping[key];
    if (layerIds) {
      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        }
      });
    }
  });
};

// Handle feature click interactions
export const handleFeatureClick = (map: mapboxgl.Map, e: MapMouseEvent, onFeatureSelect: (feature: Feature) => void) => {
    // Query rendered features at the click point for clickable layers
    const features = map.queryRenderedFeatures(e.point, {
        layers: CLICKABLE_LAYERS
    });

    if (!features.length) {
        return;
    }

    const feature = features[0];
    
    // Trigger feature selection for details view in the sidebar
    if (feature) {
        onFeatureSelect(feature as Feature);
    }
};
