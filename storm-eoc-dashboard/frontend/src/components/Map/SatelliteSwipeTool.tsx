import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
// Import mapbox-gl-compare (handling potential TypeScript issues)
// @ts-ignore
import MapboxCompare from 'mapbox-gl-compare';

interface SatelliteSwipeToolProps {
  map: mapboxgl.Map;
  preStormLayerId: string;
  postStormLayerId: string;
}

// The SatelliteSwipeTool implements the swipe functionality using mapbox-gl-compare.
// It creates two synchronized map instances, one showing pre-storm imagery and the other post-storm imagery.
const SatelliteSwipeTool: React.FC<SatelliteSwipeToolProps> = ({ map, preStormLayerId, postStormLayerId }) => {
  const compareContainer = useRef<HTMLDivElement>(null);
  const [compareInstance, setCompareInstance] = useState<any>(null);

  useEffect(() => {
    if (!compareContainer.current || !map.isStyleLoaded()) return;

    // Get the current style of the main map to clone it
    const style = map.getStyle();

    // Modify the style for pre-storm and post-storm maps to ensure correct layer visibility

    // Pre-storm style: Show pre-storm layer, hide post-storm layer
    const preStormStyle = {
        ...style,
        layers: style.layers.map(layer => {
            if (layer.id === postStormLayerId) {
                return { ...layer, layout: { ...(layer.layout || {}), visibility: 'none' } };
            }
            if (layer.id === preStormLayerId) {
                return { ...layer, layout: { ...(layer.layout || {}), visibility: 'visible' } };
            }
            return layer;
        })
    };

    // Post-storm style: Hide pre-storm layer, show post-storm layer
    const postStormStyle = {
        ...style,
        layers: style.layers.map(layer => {
            if (layer.id === preStormLayerId) {
                return { ...layer, layout: { ...(layer.layout || {}), visibility: 'none' } };
            }
            if (layer.id === postStormLayerId) {
                return { ...layer, layout: { ...(layer.layout || {}), visibility: 'visible' } };
            }
            return layer;
        })
    };

    // Create map instances for the comparison tool.
    const preStormMap = new mapboxgl.Map({
      container: document.createElement('div'),
      style: preStormStyle,
      center: map.getCenter(),
      zoom: map.getZoom(),
      accessToken: mapboxgl.accessToken
    });

    const postStormMap = new mapboxgl.Map({
      container: document.createElement('div'),
      style: postStormStyle,
      center: map.getCenter(),
      zoom: map.getZoom(),
      accessToken: mapboxgl.accessToken
    });

    // Initialize MapboxCompare
    const compare = new MapboxCompare(preStormMap, postStormMap, compareContainer.current, {
        // options (e.g., orientation: 'vertical' or 'horizontal')
    });
    setCompareInstance(compare);

    // Cleanup function
    return () => {
      if (compareInstance) {
        compareInstance.remove();
      }
      preStormMap.remove();
      postStormMap.remove();
    };
  }, [map, preStormLayerId, postStormLayerId]);

  // The container for the swipe tool, positioned absolutely over the main map area.
  return (
    <div ref={compareContainer} className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
        {/* MapboxCompare injects the maps and slider here */}
    </div>
  );
};

export default SatelliteSwipeTool;
