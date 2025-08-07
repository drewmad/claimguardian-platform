/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux store configuration for offline-first state management"
 * @dependencies ["@reduxjs/toolkit", "redux-persist", "expo-sqlite"]
 * @status stable
 */

import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers } from "@reduxjs/toolkit";

import userReducer from "./slices/userSlice";
import propertiesReducer from "./slices/propertiesSlice";
import assessmentsReducer from "./slices/assessmentsSlice";
import damageItemsReducer from "./slices/damageItemsSlice";
import photosReducer from "./slices/photosSlice";
import voiceNotesReducer from "./slices/voiceNotesSlice";
import syncReducer from "./slices/syncSlice";
import networkReducer from "./slices/networkSlice";
import cameraReducer from "./slices/cameraSlice";
import locationReducer from "./slices/locationSlice";

const persistConfig = {
  key: "claimguardian-mobile",
  storage: AsyncStorage,
  whitelist: [
    "user",
    "properties",
    "assessments",
    "damageItems",
    "photos",
    "voiceNotes",
    "sync",
  ], // Only persist these slices
  blacklist: ["network", "camera", "location"], // Don't persist real-time state
};

const rootReducer = combineReducers({
  user: userReducer,
  properties: propertiesReducer,
  assessments: assessmentsReducer,
  damageItems: damageItemsReducer,
  photos: photosReducer,
  voiceNotes: voiceNotesReducer,
  sync: syncReducer,
  network: networkReducer,
  camera: cameraReducer,
  location: locationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/PAUSE",
          "persist/PERSIST",
          "persist/PURGE",
          "persist/REGISTER",
        ],
        ignoredPaths: ["register"], // Ignore non-serializable values in persist
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Selectors
export const selectUser = (state: RootState) => state.user;
export const selectProperties = (state: RootState) => state.properties;
export const selectAssessments = (state: RootState) => state.assessments;
export const selectDamageItems = (state: RootState) => state.damageItems;
export const selectPhotos = (state: RootState) => state.photos;
export const selectVoiceNotes = (state: RootState) => state.voiceNotes;
export const selectSync = (state: RootState) => state.sync;
export const selectNetwork = (state: RootState) => state.network;
export const selectCamera = (state: RootState) => state.camera;
export const selectLocation = (state: RootState) => state.location;

// Complex selectors
export const selectUnsyncedData = (state: RootState) => ({
  properties: state.properties.items.filter((p) => !p.synced),
  assessments: state.assessments.items.filter((a) => !a.synced),
  damageItems: state.damageItems.items.filter((d) => !d.synced),
  photos: state.photos.items.filter((p) => !p.synced),
  voiceNotes: state.voiceNotes.items.filter((v) => !v.synced),
  totalCount: [
    ...state.properties.items.filter((p) => !p.synced),
    ...state.assessments.items.filter((a) => !a.synced),
    ...state.damageItems.items.filter((d) => !d.synced),
    ...state.photos.items.filter((p) => !p.synced),
    ...state.voiceNotes.items.filter((v) => !v.synced),
  ].length,
});

export const selectAssessmentWithItems =
  (assessmentId: string) => (state: RootState) => ({
    assessment: state.assessments.items.find((a) => a.id === assessmentId),
    damageItems: state.damageItems.items.filter(
      (d) => d.assessment_id === assessmentId,
    ),
    photos: state.photos.items.filter((p) => p.assessment_id === assessmentId),
    voiceNotes: state.voiceNotes.items.filter(
      (v) => v.assessment_id === assessmentId,
    ),
  });

export const selectPropertyWithAssessments =
  (propertyId: string) => (state: RootState) => ({
    property: state.properties.items.find((p) => p.id === propertyId),
    assessments: state.assessments.items.filter(
      (a) => a.property_id === propertyId,
    ),
  });

export const selectOfflineCapabilities = (state: RootState) => ({
  totalRecords: [
    ...state.properties.items,
    ...state.assessments.items,
    ...state.damageItems.items,
    ...state.photos.items,
    ...state.voiceNotes.items,
  ].length,
  unsyncedRecords: selectUnsyncedData(state).totalCount,
  syncQueueSize: state.sync.queue.length,
  lastSyncTime: state.sync.lastSyncTime,
  isOfflineCapable: state.network.isConnected === false,
});
