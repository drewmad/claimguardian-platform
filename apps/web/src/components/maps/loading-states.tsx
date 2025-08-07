/**
 * Map Loading States Component
 * Provides visual feedback for tile loading with progressive enhancement
 */
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import type { Map } from 'mapbox-gl';

interface LoadingStatesProps {
  map: Map | null;
  viewportPriority?: 'center' | 'edges';
  showNetworkStatus?: boolean;
  className?: string;
}

interface TileLoadingState {
  loading: number;
  loaded: number;
  error: number;
  total: number;
}

export default function LoadingStates({
  map,
  viewportPriority = 'center',
  showNetworkStatus = true,
  className = '',
}: LoadingStatesProps) {
  const [tileState, setTileState] = useState<TileLoadingState>({
    loading: 0,
    loaded: 0,
    error: 0,
    total: 0,
  });
  
  const [isOnline, setIsOnline] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  // Track online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Track tile loading state
  const handleSourceDataLoading = useCallback((e: any) => {
    if (e.sourceId && e.sourceId.includes('parcels') && e.dataType === 'source') {
      setTileState(prev => ({
        ...prev,
        loading: prev.loading + 1,
        total: prev.total + 1,
      }));
      setShowLoader(true);
    }
  }, []);

  const handleSourceData = useCallback((e: any) => {
    if (e.sourceId && e.sourceId.includes('parcels') && e.dataType === 'source') {
      setTileState(prev => ({
        ...prev,
        loading: Math.max(0, prev.loading - 1),
        loaded: prev.loaded + 1,
      }));
    }
  }, []);

  const handleSourceError = useCallback((e: any) => {
    if (e.sourceId && e.sourceId.includes('parcels')) {
      setTileState(prev => ({
        ...prev,
        loading: Math.max(0, prev.loading - 1),
        error: prev.error + 1,
      }));
    }
  }, []);

  const handleMapIdle = useCallback(() => {
    setShowLoader(false);
    setTileState(prev => ({ ...prev, loading: 0 }));
  }, []);

  // Setup map event listeners
  useEffect(() => {
    if (!map) return;

    map.on('sourcedataloading', handleSourceDataLoading);
    map.on('sourcedata', handleSourceData);
    map.on('error', handleSourceError);
    map.on('idle', handleMapIdle);

    return () => {
      map.off('sourcedataloading', handleSourceDataLoading);
      map.off('sourcedata', handleSourceData);
      map.off('error', handleSourceError);
      map.off('idle', handleMapIdle);
    };
  }, [map, handleSourceDataLoading, handleSourceData, handleSourceError, handleMapIdle]);

  // Reset loader after a timeout
  useEffect(() => {
    if (showLoader && tileState.loading === 0) {
      const timer = setTimeout(() => setShowLoader(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showLoader, tileState.loading]);

  if (!map) return null;

  const loadingPercentage = tileState.total > 0 
    ? Math.round((tileState.loaded / tileState.total) * 100)
    : 100;

  const hasErrors = tileState.error > 0;
  const isLoading = tileState.loading > 0 || showLoader;

  return (
    <div className={`absolute top-2 right-2 z-10 ${className}`}>
      {/* Network Status Indicator */}
      {showNetworkStatus && (
        <div className={`
          mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm
          transition-all duration-300
          ${isOnline 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }
        `}>
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </>
          )}
        </div>
      )}

      {/* Tile Loading Indicator */}
      {isLoading && (
        <div className="bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg p-3 min-w-[200px]">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-sm text-white font-medium">Loading Map Data</span>
          </div>
          
          <div className="space-y-2">
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-out"
                style={{ width: `${loadingPercentage}%` }}
              />
            </div>
            
            {/* Loading Stats */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>{loadingPercentage}% complete</span>
              <span>
                {tileState.loaded}/{tileState.total} tiles
                {hasErrors && (
                  <span className="text-red-400 ml-2">
                    ({tileState.error} failed)
                  </span>
                )}
              </span>
            </div>
            
            {/* Priority Mode Indicator */}
            <div className="text-xs text-gray-500 text-center">
              Loading {viewportPriority === 'center' ? 'center-out' : 'edge-in'} priority
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasErrors && !isLoading && (
        <div className="bg-red-900/90 backdrop-blur border border-red-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <WifiOff className="w-4 h-4" />
            <span>{tileState.error} tiles failed to load</span>
          </div>
        </div>
      )}
    </div>
  );
}