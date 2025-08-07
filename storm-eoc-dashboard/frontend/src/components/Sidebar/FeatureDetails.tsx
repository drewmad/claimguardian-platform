import React from 'react';
import { Feature } from 'geojson';
import { FiX } from 'react-icons/fi';

interface FeatureDetailsProps {
  feature: Feature | null;
  onClose: () => void;
}

const FeatureDetails: React.FC<FeatureDetailsProps> = ({ feature, onClose }) => {
  if (!feature) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4 text-gray-100">Details</h2>
        <p className="text-gray-500">Select a feature on the map to view its details here.</p>
      </div>
    );
  }

  const properties = feature.properties || {};
  const geometry = feature.geometry;

  // Helper function to render property values nicely
  const renderValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">Feature Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition duration-150">
          <FiX size={24} />
        </button>
      </div>

      {/* Properties Table */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-300">Attributes</h3>
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-700">
          <dl>
            {Object.entries(properties).map(([key, value], index) => (
              <div key={key} className={`${index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'} px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                <dt className="text-sm font-medium text-gray-400">{key}</dt>
                <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2 break-words">
                  {renderValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Image Viewer (if available) */}
      {properties.image_url && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-300">Image</h3>
          <img src={properties.image_url} alt="Feature" className="w-full rounded-lg shadow-md" />
        </div>
      )}

      {/* Geometry Information */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-300">Geometry</h3>
        <div className="bg-gray-800 p-4 rounded-lg shadow-inner border border-gray-700">
          <p className="text-sm font-mono text-gray-400">Type: {geometry.type}</p>
          {geometry.type === 'Point' && (
            <p className="text-sm font-mono text-gray-400">Coordinates: {JSON.stringify((geometry as any).coordinates)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureDetails;
