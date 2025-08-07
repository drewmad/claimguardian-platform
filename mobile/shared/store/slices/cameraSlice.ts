/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for camera permissions and settings management"
 * @dependencies ["@reduxjs/toolkit"]
 * @status stable
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CameraState {
  hasPermission: boolean;
  permissionStatus: "undetermined" | "granted" | "denied";
  quality: "low" | "medium" | "high";
  flashMode: "off" | "on" | "auto";
  cameraType: "back" | "front";
  isAvailable: boolean;
  supportedRatios: string[];
  supportedResolutions: string[];
  settings: {
    autoFocus: boolean;
    whiteBalance:
      | "auto"
      | "sunny"
      | "cloudy"
      | "shadow"
      | "incandescent"
      | "fluorescent";
    exposure: number; // -1.0 to 1.0
    zoom: number; // 0.0 to 1.0
    enabledGrid: boolean;
    mirrorImage: boolean;
    useVolumeButtonForCapture: boolean;
  };
  captureStats: {
    totalPhotos: number;
    successfulCaptures: number;
    failedCaptures: number;
    averageCaptureTime: number;
  };
  error: string | null;
}

const initialState: CameraState = {
  hasPermission: false,
  permissionStatus: "undetermined",
  quality: "high",
  flashMode: "auto",
  cameraType: "back",
  isAvailable: false,
  supportedRatios: [],
  supportedResolutions: [],
  settings: {
    autoFocus: true,
    whiteBalance: "auto",
    exposure: 0,
    zoom: 0,
    enabledGrid: false,
    mirrorImage: false,
    useVolumeButtonForCapture: true,
  },
  captureStats: {
    totalPhotos: 0,
    successfulCaptures: 0,
    failedCaptures: 0,
    averageCaptureTime: 0,
  },
  error: null,
};

const cameraSlice = createSlice({
  name: "camera",
  initialState,
  reducers: {
    // Permission management
    setPermissionStatus: (
      state,
      action: PayloadAction<CameraState["permissionStatus"]>,
    ) => {
      state.permissionStatus = action.payload;
      state.hasPermission = action.payload === "granted";
    },

    setHasPermission: (state, action: PayloadAction<boolean>) => {
      state.hasPermission = action.payload;
      state.permissionStatus = action.payload ? "granted" : "denied";
    },

    // Camera availability
    setCameraAvailable: (state, action: PayloadAction<boolean>) => {
      state.isAvailable = action.payload;
    },

    // Basic camera controls
    setQuality: (state, action: PayloadAction<CameraState["quality"]>) => {
      state.quality = action.payload;
    },

    setFlashMode: (state, action: PayloadAction<CameraState["flashMode"]>) => {
      state.flashMode = action.payload;
    },

    toggleFlashMode: (state) => {
      switch (state.flashMode) {
        case "off":
          state.flashMode = "auto";
          break;
        case "auto":
          state.flashMode = "on";
          break;
        case "on":
          state.flashMode = "off";
          break;
      }
    },

    setCameraType: (
      state,
      action: PayloadAction<CameraState["cameraType"]>,
    ) => {
      state.cameraType = action.payload;
    },

    toggleCameraType: (state) => {
      state.cameraType = state.cameraType === "back" ? "front" : "back";
    },

    // Advanced camera settings
    setAutoFocus: (state, action: PayloadAction<boolean>) => {
      state.settings.autoFocus = action.payload;
    },

    toggleAutoFocus: (state) => {
      state.settings.autoFocus = !state.settings.autoFocus;
    },

    setWhiteBalance: (
      state,
      action: PayloadAction<CameraState["settings"]["whiteBalance"]>,
    ) => {
      state.settings.whiteBalance = action.payload;
    },

    setExposure: (state, action: PayloadAction<number>) => {
      // Clamp exposure between -1.0 and 1.0
      state.settings.exposure = Math.max(-1, Math.min(1, action.payload));
    },

    adjustExposure: (state, action: PayloadAction<number>) => {
      const newExposure = state.settings.exposure + action.payload;
      state.settings.exposure = Math.max(-1, Math.min(1, newExposure));
    },

    setZoom: (state, action: PayloadAction<number>) => {
      // Clamp zoom between 0.0 and 1.0
      state.settings.zoom = Math.max(0, Math.min(1, action.payload));
    },

    adjustZoom: (state, action: PayloadAction<number>) => {
      const newZoom = state.settings.zoom + action.payload;
      state.settings.zoom = Math.max(0, Math.min(1, newZoom));
    },

    resetZoom: (state) => {
      state.settings.zoom = 0;
    },

    // UI settings
    setGridEnabled: (state, action: PayloadAction<boolean>) => {
      state.settings.enabledGrid = action.payload;
    },

    toggleGrid: (state) => {
      state.settings.enabledGrid = !state.settings.enabledGrid;
    },

    setMirrorImage: (state, action: PayloadAction<boolean>) => {
      state.settings.mirrorImage = action.payload;
    },

    toggleMirrorImage: (state) => {
      state.settings.mirrorImage = !state.settings.mirrorImage;
    },

    setVolumeButtonCapture: (state, action: PayloadAction<boolean>) => {
      state.settings.useVolumeButtonForCapture = action.payload;
    },

    toggleVolumeButtonCapture: (state) => {
      state.settings.useVolumeButtonForCapture =
        !state.settings.useVolumeButtonForCapture;
    },

    // Camera capabilities
    setSupportedRatios: (state, action: PayloadAction<string[]>) => {
      state.supportedRatios = action.payload;
    },

    setSupportedResolutions: (state, action: PayloadAction<string[]>) => {
      state.supportedResolutions = action.payload;
    },

    // Statistics tracking
    recordCaptureAttempt: (
      state,
      action: PayloadAction<{ success: boolean; captureTime?: number }>,
    ) => {
      state.captureStats.totalPhotos += 1;

      if (action.payload.success) {
        state.captureStats.successfulCaptures += 1;

        // Update average capture time if provided
        if (action.payload.captureTime) {
          const totalTime =
            state.captureStats.averageCaptureTime *
              (state.captureStats.successfulCaptures - 1) +
            action.payload.captureTime;
          state.captureStats.averageCaptureTime =
            totalTime / state.captureStats.successfulCaptures;
        }
      } else {
        state.captureStats.failedCaptures += 1;
      }
    },

    resetCaptureStats: (state) => {
      state.captureStats = {
        totalPhotos: 0,
        successfulCaptures: 0,
        failedCaptures: 0,
        averageCaptureTime: 0,
      };
    },

    // Bulk settings updates
    updateCameraSettings: (
      state,
      action: PayloadAction<Partial<CameraState["settings"]>>,
    ) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    resetCameraSettings: (state) => {
      state.settings = {
        autoFocus: true,
        whiteBalance: "auto",
        exposure: 0,
        zoom: 0,
        enabledGrid: false,
        mirrorImage: false,
        useVolumeButtonForCapture: true,
      };
    },

    // Preset configurations
    setOutdoorPreset: (state) => {
      state.settings.whiteBalance = "sunny";
      state.settings.exposure = 0.1;
      state.settings.autoFocus = true;
    },

    setIndoorPreset: (state) => {
      state.settings.whiteBalance = "incandescent";
      state.settings.exposure = 0.2;
      state.settings.autoFocus = true;
    },

    setLowLightPreset: (state) => {
      state.settings.whiteBalance = "auto";
      state.settings.exposure = 0.5;
      state.settings.autoFocus = true;
      state.flashMode = "auto";
    },

    setMacroPreset: (state) => {
      state.settings.autoFocus = true;
      state.settings.zoom = 0.3;
      state.settings.exposure = 0;
      state.settings.enabledGrid = true;
    },

    // Professional mode settings
    setManualMode: (
      state,
      action: PayloadAction<{
        exposure?: number;
        whiteBalance?: CameraState["settings"]["whiteBalance"];
        focus?: boolean;
      }>,
    ) => {
      if (action.payload.exposure !== undefined) {
        state.settings.exposure = Math.max(
          -1,
          Math.min(1, action.payload.exposure),
        );
      }
      if (action.payload.whiteBalance) {
        state.settings.whiteBalance = action.payload.whiteBalance;
      }
      if (action.payload.focus !== undefined) {
        state.settings.autoFocus = action.payload.focus;
      }
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Camera initialization
    initializeCamera: (
      state,
      action: PayloadAction<{
        hasPermission: boolean;
        supportedRatios?: string[];
        supportedResolutions?: string[];
      }>,
    ) => {
      state.hasPermission = action.payload.hasPermission;
      state.permissionStatus = action.payload.hasPermission
        ? "granted"
        : "denied";
      state.isAvailable = action.payload.hasPermission;

      if (action.payload.supportedRatios) {
        state.supportedRatios = action.payload.supportedRatios;
      }
      if (action.payload.supportedResolutions) {
        state.supportedResolutions = action.payload.supportedResolutions;
      }
    },

    // Emergency reset
    resetCameraState: (state) => {
      Object.assign(state, {
        ...initialState,
        hasPermission: state.hasPermission,
        permissionStatus: state.permissionStatus,
      });
    },
  },
});

export const {
  setPermissionStatus,
  setHasPermission,
  setCameraAvailable,
  setQuality,
  setFlashMode,
  toggleFlashMode,
  setCameraType,
  toggleCameraType,
  setAutoFocus,
  toggleAutoFocus,
  setWhiteBalance,
  setExposure,
  adjustExposure,
  setZoom,
  adjustZoom,
  resetZoom,
  setGridEnabled,
  toggleGrid,
  setMirrorImage,
  toggleMirrorImage,
  setVolumeButtonCapture,
  toggleVolumeButtonCapture,
  setSupportedRatios,
  setSupportedResolutions,
  recordCaptureAttempt,
  resetCaptureStats,
  updateCameraSettings,
  resetCameraSettings,
  setOutdoorPreset,
  setIndoorPreset,
  setLowLightPreset,
  setMacroPreset,
  setManualMode,
  setError,
  clearError,
  initializeCamera,
  resetCameraState,
} = cameraSlice.actions;

export default cameraSlice.reducer;
