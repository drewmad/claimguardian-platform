import React, { useState } from 'react';
import { format, addHours, subHours } from 'date-fns';
import { FiPlay, FiPause, FiClock } from 'react-icons/fi';

// This Timeline component provides a time scrubbing interface.
// In a production application, the selected time range would be propagated to data fetching logic.

const Timeline: React.FC = () => {
  // State for the current time window (e.g., past 24 hours to next 24 hours)
  const [startTime, setStartTime] = useState(subHours(new Date(), 24));
  const [endTime, setEndTime] = useState(addHours(new Date(), 24));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);

  // Total duration in milliseconds
  const duration = endTime.getTime() - startTime.getTime();
  // Current progress percentage
  const progress = ((currentTime.getTime() - startTime.getTime()) / duration) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    const newTime = new Date(startTime.getTime() + (duration * newProgress) / 100);
    setCurrentTime(newTime);
  };

  // Placeholder for play/pause functionality (animation loop)
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // Implementation of animation loop to advance currentTime would go here.
  };

  return (
    <div className="p-4 bg-eoc-sidebar text-white">
      <div className="flex items-center gap-6">
        {/* Play/Pause Button */}
        <button 
            onClick={togglePlay} 
            className="text-eoc-accent hover:text-yellow-600 transition duration-150"
            title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
        </button>

        {/* Time Display */}
        <div className="text-center flex items-center gap-2">
          <FiClock className="text-gray-400" />
          <div>
            <div className="text-sm font-semibold text-gray-100">{format(currentTime, 'MMM dd, yyyy HH:mm')}</div>
            <div className="text-xs text-gray-500">(UTC)</div>
          </div>
        </div>

        {/* Time Slider */}
        <div className="flex-1 flex items-center gap-4">
            <span className="text-xs text-gray-500">{format(startTime, 'MMM dd HH:mm')}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSliderChange}
              className="flex-1 w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-sm"
            />
            <span className="text-xs text-gray-500">{format(endTime, 'MMM dd HH:mm')}</span>
        </div>
        
        {/* Time Range Settings (Placeholder) */}
        <button className="text-sm text-gray-400 hover:text-gray-200 transition duration-150">
            Set Range
        </button>
      </div>
    </div>
  );
};

export default Timeline;
