import React, { useState, useEffect } from 'react';
import LayerControls from './LayerControls';
import LiveFeed from './LiveFeed';
import FeatureDetails from './FeatureDetails';
import { FiLayers, FiRss, FiInfo, FiSettings } from 'react-icons/fi';
import { Feature } from 'geojson';

interface SidebarProps {
  selectedFeature: Feature | null;
  onFeatureDeselect: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedFeature, onFeatureDeselect }) => {
  const [activeTab, setActiveTab] = useState('layers');

  // Effect to switch to the details tab when a feature is selected
  useEffect(() => {
    if (selectedFeature) {
      setActiveTab('details');
    }
  }, [selectedFeature]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'layers':
        return <LayerControls />;
      case 'liveFeed':
        return <LiveFeed />;
      case 'details':
        return <FeatureDetails feature={selectedFeature} onClose={onFeatureDeselect} />;
      case 'settings':
        return <div className="p-4 text-gray-300">Settings (Placeholder)</div>;
      default:
        return null;
    }
  };

  // Helper component for tab buttons
  const TabButton: React.FC<{ tabId: string, icon: React.ReactNode, label: string, disabled?: boolean }> = 
    ({ tabId, icon, label, disabled = false }) => (
    <button
      className={`flex-1 p-4 text-center flex items-center justify-center gap-2 transition duration-200 ${
        activeTab === tabId ? 'bg-eoc-primary text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && setActiveTab(tabId)}
      disabled={disabled}
    >
      {icon} <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="w-64 md:w-96 bg-eoc-sidebar shadow-xl flex flex-col h-full z-20">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        <TabButton tabId="layers" icon={<FiLayers />} label="Layers" />
        <TabButton tabId="liveFeed" icon={<FiRss />} label="Live Feed" />
        <TabButton tabId="details" icon={<FiInfo />} label="Details" disabled={!selectedFeature} />
        <TabButton tabId="settings" icon={<FiSettings />} label="Settings" />
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Sidebar;
