import React from 'react';
import { useLayerContext } from '../../context/LayerContext';
import { FiCloud, FiUsers, FiActivity, FiImage, FiTool, FiHome } from 'react-icons/fi';

const LayerControls: React.FC = () => {
  const { visibleLayers, toggleLayerVisibility } = useLayerContext();

  // Layer definitions organized by category
  const layerCategories = [
    {
      category: 'Facilities & Infrastructure',
      icon: <FiHome className="text-eoc-primary" />,
      layers: [
        { id: 'hospitals', name: 'Hospitals (Placeholder)' },
        { id: 'shelters', name: 'Shelters (Placeholder)' },
        { id: 'powerOutages', name: 'Power Outages (Placeholder)' },
      ],
    },
    {
      category: 'Weather & Forecasts',
      icon: <FiCloud className="text-blue-500" />,
      layers: [
        { id: 'stormTrack', name: 'Storm Track Forecast (Placeholder)' },
        { id: 'windProbabilities', name: 'Wind Speed Probabilities (Placeholder)' },
      ],
    },
    {
      category: 'Crowdsourced & Community',
      icon: <FiUsers className="text-green-600" />,
      layers: [
        { id: 'communityReports', name: 'Verified Community Reports' },
      ],
    },
    {
      category: 'Social Media Intelligence (X/Twitter)',
      icon: <FiActivity className="text-purple-600" />,
      layers: [
        { id: 'xPostsHeatmap', name: 'Density Heatmap' },
        { id: 'xPostsClusters', name: 'Clustered Points' },
      ],
    },
    {
      category: 'Satellite Imagery & Comparison',
      icon: <FiImage className="text-yellow-600" />,
      layers: [
        { id: 'satellitePreStorm', name: 'Pre-Storm Imagery (Placeholder)' },
        { id: 'satellitePostStorm', name: 'Post-Storm Imagery (Placeholder)' },
      ],
      note: "Enable both Pre-Storm and Post-Storm layers to activate the swipe comparison tool.",
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-6 text-gray-100">Layer Management</h2>
      
      {layerCategories.map(({ category, icon, layers, note }) => (
        <div key={category} className="mb-6 border-b border-gray-700 pb-4">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2 text-gray-300">
            {icon} {category}
          </h3>
          <div className="space-y-3 pl-6">
            {layers.map(layer => (
              <div key={layer.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={layer.id}
                  checked={visibleLayers[layer.id] || false}
                  onChange={() => toggleLayerVisibility(layer.id)}
                  className="mr-3 h-5 w-5 text-eoc-primary focus:ring-eoc-primary border-gray-500 rounded transition duration-150 ease-in-out bg-gray-700"
                />
                <label htmlFor={layer.id} className="text-gray-300 cursor-pointer select-none">
                  {layer.name}
                </label>
              </div>
            ))}
          </div>
          {note && (
            <div className="mt-3 ml-6 p-3 bg-blue-900 border-l-4 border-blue-400 text-blue-200 text-sm">
              <p>{note}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LayerControls;
