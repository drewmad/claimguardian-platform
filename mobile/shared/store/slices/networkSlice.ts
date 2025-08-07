/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for network connectivity state management"
 * @dependencies ["@reduxjs/toolkit", "expo-network"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { NetworkInfo } from "../../types";

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  connectionQuality: "unknown" | "poor" | "moderate" | "good" | "excellent";
  connectionHistory: {
    timestamp: string;
    isConnected: boolean;
    type: string | null;
  }[];
  offlineMode: boolean;
  lastOnlineTime: string | null;
  totalOfflineTime: number; // in milliseconds
  stats: {
    connectionChanges: number;
    totalOnlineTime: number;
    totalOfflineTime: number;
    averageConnectionDuration: number;
  };
}

const initialState: NetworkState = {
  isConnected: false,
  isInternetReachable: null,
  type: null,
  connectionQuality: "unknown",
  connectionHistory: [],
  offlineMode: false,
  lastOnlineTime: null,
  totalOfflineTime: 0,
  stats: {
    connectionChanges: 0,
    totalOnlineTime: 0,
    totalOfflineTime: 0,
    averageConnectionDuration: 0,
  },
};

// Async thunks
export const checkNetworkState = createAsyncThunk<
  NetworkInfo,
  void,
  { rejectValue: string }
>("network/checkState", async (_, { rejectWithValue }) => {
  try {
    // Implementation would use expo-network
    // For now return mock network state
    return {
      isConnected: navigator.onLine,
      isInternetReachable: navigator.onLine,
      type: "wifi",
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to check network state",
    );
  }
});

export const testConnectionSpeed = createAsyncThunk<
  { quality: NetworkState["connectionQuality"]; speed: number },
  void,
  { rejectValue: string }
>("network/testSpeed", async (_, { rejectWithValue }) => {
  try {
    // Implementation would test connection speed
    // For now return mock data
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    let quality: NetworkState["connectionQuality"] = "unknown";
    if (responseTime < 200) quality = "excellent";
    else if (responseTime < 500) quality = "good";
    else if (responseTime < 1000) quality = "moderate";
    else quality = "poor";

    return {
      quality,
      speed: Math.round((1000 / responseTime) * 100) / 100, // Mock speed calculation
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to test connection speed",
    );
  }
});

const networkSlice = createSlice({
  name: "network",
  initialState,
  reducers: {
    // Network state updates
    setNetworkState: (state, action: PayloadAction<NetworkInfo>) => {
      const wasConnected = state.isConnected;
      const now = new Date().toISOString();

      state.isConnected = action.payload.isConnected;
      state.isInternetReachable = action.payload.isInternetReachable;
      state.type = action.payload.type;

      // Track connection changes
      if (wasConnected !== action.payload.isConnected) {
        state.stats.connectionChanges += 1;

        // Add to history
        state.connectionHistory.unshift({
          timestamp: now,
          isConnected: action.payload.isConnected,
          type: action.payload.type,
        });

        // Keep only last 100 entries
        if (state.connectionHistory.length > 100) {
          state.connectionHistory = state.connectionHistory.slice(0, 100);
        }

        // Update online/offline tracking
        if (action.payload.isConnected) {
          state.lastOnlineTime = now;
          if (state.offlineMode) {
            state.offlineMode = false;
          }
        } else {
          // Calculate offline duration if we were online before
          if (wasConnected && state.lastOnlineTime) {
            const offlineDuration =
              Date.now() - new Date(state.lastOnlineTime).getTime();
            state.totalOfflineTime += offlineDuration;
            state.stats.totalOfflineTime += offlineDuration;
          }
        }
      }

      // Update stats
      networkSlice.caseReducers.updateStats(state);
    },

    setConnectionQuality: (
      state,
      action: PayloadAction<NetworkState["connectionQuality"]>,
    ) => {
      state.connectionQuality = action.payload;
    },

    // Offline mode management
    enableOfflineMode: (state) => {
      state.offlineMode = true;
    },

    disableOfflineMode: (state) => {
      state.offlineMode = false;
    },

    toggleOfflineMode: (state) => {
      state.offlineMode = !state.offlineMode;
    },

    // Connection history management
    clearConnectionHistory: (state) => {
      state.connectionHistory = [];
    },

    // Statistics updates
    updateStats: (state) => {
      if (state.connectionHistory.length > 1) {
        // Calculate average connection duration
        let totalDuration = 0;
        let connectionCount = 0;

        for (let i = 0; i < state.connectionHistory.length - 1; i++) {
          const current = state.connectionHistory[i];
          const next = state.connectionHistory[i + 1];

          if (current.isConnected === next.isConnected) continue;

          const duration =
            new Date(current.timestamp).getTime() -
            new Date(next.timestamp).getTime();
          totalDuration += duration;
          connectionCount += 1;
        }

        if (connectionCount > 0) {
          state.stats.averageConnectionDuration =
            totalDuration / connectionCount;
        }
      }

      // Calculate total online time
      if (state.isConnected && state.lastOnlineTime) {
        const currentOnlineTime =
          Date.now() - new Date(state.lastOnlineTime).getTime();
        state.stats.totalOnlineTime = currentOnlineTime;
      }
    },

    resetStats: (state) => {
      state.stats = {
        connectionChanges: 0,
        totalOnlineTime: 0,
        totalOfflineTime: 0,
        averageConnectionDuration: 0,
      };
      state.connectionHistory = [];
      state.totalOfflineTime = 0;
    },

    // Network event tracking
    recordConnectionEvent: (
      state,
      action: PayloadAction<{
        event: "connected" | "disconnected" | "slow" | "timeout";
        details?: string;
      }>,
    ) => {
      const now = new Date().toISOString();

      state.connectionHistory.unshift({
        timestamp: now,
        isConnected: action.payload.event === "connected",
        type: action.payload.event === "connected" ? state.type : null,
      });

      if (state.connectionHistory.length > 100) {
        state.connectionHistory = state.connectionHistory.slice(0, 100);
      }
    },

    // Connection quality tracking
    recordSpeedTest: (
      state,
      action: PayloadAction<{
        quality: NetworkState["connectionQuality"];
        speed: number;
        timestamp: string;
      }>,
    ) => {
      state.connectionQuality = action.payload.quality;
    },

    // Utility actions
    setLastOnlineTime: (state, action: PayloadAction<string>) => {
      state.lastOnlineTime = action.payload;
    },

    incrementOfflineTime: (state, action: PayloadAction<number>) => {
      state.totalOfflineTime += action.payload;
      state.stats.totalOfflineTime += action.payload;
    },

    // Network type specific handling
    handleWifiConnection: (state) => {
      state.type = "wifi";
      state.connectionQuality = "good"; // Assume good for wifi
    },

    handleCellularConnection: (state, action: PayloadAction<string>) => {
      state.type = action.payload; // '4g', '5g', etc.
      // Cellular typically slower than wifi
      if (state.connectionQuality === "unknown") {
        state.connectionQuality = "moderate";
      }
    },

    // Emergency/disaster mode
    enableEmergencyMode: (state) => {
      state.offlineMode = true;
      // Reduce connection quality expectations for emergency scenarios
      if (state.connectionQuality === "poor") {
        state.connectionQuality = "moderate";
      }
    },

    disableEmergencyMode: (state) => {
      state.offlineMode = false;
    },
  },

  extraReducers: (builder) => {
    // Check network state
    builder
      .addCase(checkNetworkState.fulfilled, (state, action) => {
        networkSlice.caseReducers.setNetworkState(state, action);
      })
      .addCase(checkNetworkState.rejected, (state) => {
        // On error, assume disconnected
        networkSlice.caseReducers.setNetworkState(state, {
          payload: {
            isConnected: false,
            isInternetReachable: false,
            type: null,
          },
          type: "network/setNetworkState",
        });
      });

    // Test connection speed
    builder
      .addCase(testConnectionSpeed.fulfilled, (state, action) => {
        state.connectionQuality = action.payload.quality;
      })
      .addCase(testConnectionSpeed.rejected, (state) => {
        state.connectionQuality = "poor";
      });
  },
});

export const {
  setNetworkState,
  setConnectionQuality,
  enableOfflineMode,
  disableOfflineMode,
  toggleOfflineMode,
  clearConnectionHistory,
  updateStats,
  resetStats,
  recordConnectionEvent,
  recordSpeedTest,
  setLastOnlineTime,
  incrementOfflineTime,
  handleWifiConnection,
  handleCellularConnection,
  enableEmergencyMode,
  disableEmergencyMode,
} = networkSlice.actions;

export default networkSlice.reducer;
