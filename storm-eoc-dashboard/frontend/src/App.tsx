import React, { useState } from 'react';
import MapView from './components/Map/Map';
import Sidebar from './components/Sidebar/Sidebar';
import Timeline from './components/Timeline/Timeline';
import { LayerProvider } from './context/LayerContext';
import { Feature } from 'geojson';
import { WebSocketProvider } from './context/WebSocketContext';

const App: React.FC = () => {
  // State to hold the currently selected feature for detail view
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  // Determine WebSocket URL based on current protocol and host
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

  return (
    <WebSocketProvider url={wsUrl}>
      <LayerProvider>
        <div className="flex h-screen bg-eoc-background overflow-hidden">
          {/* Sidebar for controls, live feed, and details */}
          <Sidebar selectedFeature={selectedFeature} onFeatureDeselect={() => setSelectedFeature(null)} />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-eoc-primary text-white p-4 shadow-md z-10">
              <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold">Florida Storm EOC - Situational Awareness Dashboard</h1>
                  <div className="text-sm">
                      {/* Placeholder for user info or status indicators */}
                      <span>Status: Operational</span>
                  </div>
              </div>
            </header>
            
            {/* Main Content Area (Map) */}
            <main className="flex-1 relative overflow-hidden">
              <MapView onFeatureSelect={setSelectedFeature} />
            </main>
            
            {/* Timeline Footer */}
            <footer className="bg-eoc-sidebar shadow-inner-md z-10">
              <Timeline />
            </footer>
          </div>
        </div>
      </LayerProvider>
    </WebSocketProvider>
  );
};

export default App;
