import React, { createContext, useState, useContext, ReactNode } from 'react';

// Interface defining the structure of layer visibility state
interface LayerVisibility {
  [key: string]: boolean;
}

// Interface for the context value
interface LayerContextProps {
  visibleLayers: LayerVisibility;
  toggleLayerVisibility: (layerId: string) => void;
  setLayerVisibility: (layerId: string, isVisible: boolean) => void;
}

// Default visibility settings for layers
const defaultLayerVisibility: LayerVisibility = {
  hospitals: true,
  shelters: true,
  stormTrack: false,
  windProbabilities: false,
  communityReports: true,
  xPostsHeatmap: true,
  xPostsClusters: false,
  powerOutages: false,
  satellitePreStorm: false,
  satellitePostStorm: false,
};

// Create the context
const LayerContext = createContext<LayerContextProps | undefined>(undefined);

// Provider component
export const LayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visibleLayers, setVisibleLayers] = useState<LayerVisibility>(defaultLayerVisibility);

  const toggleLayerVisibility = (layerId: string) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const setLayerVisibility = (layerId: string, isVisible: boolean) => {
    setVisibleLayers((prev) => ({
        ...prev,
        [layerId]: isVisible,
    }));
  };

  return (
    <LayerContext.Provider value={{ visibleLayers, toggleLayerVisibility, setLayerVisibility }}>
      {children}
    </LayerContext.Provider>
  );
};

// Custom hook to use the LayerContext
export const useLayerContext = () => {
  const context = useContext(LayerContext);
  if (context === undefined) {
    throw new Error('useLayerContext must be used within a LayerProvider');
  }
  return context;
};
