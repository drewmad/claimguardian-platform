/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for photo management with upload status and offline support"
 * @dependencies ["@reduxjs/toolkit"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { Photo } from "../../types";

interface PhotosState {
  items: Photo[];
  uploading: string[]; // Photo IDs currently being uploaded
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  filters: {
    assessmentId: string | null;
    damageItemId: string | null;
    uploadStatus: Photo["upload_status"] | null;
    dateRange: {
      start: string | null;
      end: string | null;
    };
    sortBy: "timestamp" | "created_at" | "filename" | "file_size";
    sortOrder: "asc" | "desc";
  };
  stats: {
    totalPhotos: number;
    pendingUpload: number;
    uploadedPhotos: number;
    failedUploads: number;
    totalSizeMB: number;
  };
}

const initialState: PhotosState = {
  items: [],
  uploading: [],
  loading: false,
  error: null,
  lastUpdated: null,
  filters: {
    assessmentId: null,
    damageItemId: null,
    uploadStatus: null,
    dateRange: {
      start: null,
      end: null,
    },
    sortBy: "timestamp",
    sortOrder: "desc",
  },
  stats: {
    totalPhotos: 0,
    pendingUpload: 0,
    uploadedPhotos: 0,
    failedUploads: 0,
    totalSizeMB: 0,
  },
};

// Async thunks
export const loadPhotosFromDatabase = createAsyncThunk<
  Photo[],
  { assessmentId?: string; damageItemId?: string },
  { rejectValue: string }
>("photos/loadFromDatabase", async (filters, { rejectWithValue }) => {
  try {
    // Implementation would load from SQLite with optional filters
    return [];
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load photos",
    );
  }
});

export const uploadPhoto = createAsyncThunk<
  Photo,
  string,
  { rejectValue: string }
>("photos/upload", async (photoId, { rejectWithValue, getState }) => {
  try {
    // Implementation would upload to cloud storage
    // For now, simulate successful upload
    const state = getState() as any;
    const photo = state.photos.items.find((p: Photo) => p.id === photoId);
    if (!photo) {
      throw new Error("Photo not found");
    }

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const uploadedPhoto: Photo = {
      ...photo,
      remote_url: `https://storage.claimguardianai.com/photos/${photo.filename}`,
      upload_status: "completed",
      synced: true,
    };

    return uploadedPhoto;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to upload photo",
    );
  }
});

export const retryFailedUploads = createAsyncThunk<
  Photo[],
  void,
  { rejectValue: string }
>(
  "photos/retryFailedUploads",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState() as any;
      const failedPhotos = state.photos.items.filter(
        (p: Photo) => p.upload_status === "failed",
      );

      const retryResults = await Promise.allSettled(
        failedPhotos.map((photo: Photo) =>
          dispatch(uploadPhoto(photo.id)).unwrap(),
        ),
      );

      const successfulRetries = retryResults
        .filter(
          (result): result is PromiseFulfilledResult<Photo> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      return successfulRetries;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to retry uploads",
      );
    }
  },
);

export const compressPhoto = createAsyncThunk<
  Photo,
  { photoId: string; quality: number },
  { rejectValue: string }
>("photos/compress", async ({ photoId, quality }, { rejectWithValue }) => {
  try {
    // Implementation would compress photo using expo-image-manipulator
    throw new Error("Not implemented");
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to compress photo",
    );
  }
});

const photosSlice = createSlice({
  name: "photos",
  initialState,
  reducers: {
    // Photo CRUD operations
    addPhoto: (state, action: PayloadAction<Photo>) => {
      const existingIndex = state.items.findIndex(
        (p) => p.id === action.payload.id,
      );
      if (existingIndex !== -1) {
        state.items[existingIndex] = action.payload;
      } else {
        state.items.push(action.payload);
      }
      state.lastUpdated = new Date().toISOString();
      photosSlice.caseReducers.updateStats(state);
    },

    updatePhoto: (state, action: PayloadAction<Photo>) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        state.lastUpdated = new Date().toISOString();
        photosSlice.caseReducers.updateStats(state);
      }
    },

    removePhoto: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      state.uploading = state.uploading.filter((id) => id !== action.payload);
      state.lastUpdated = new Date().toISOString();
      photosSlice.caseReducers.updateStats(state);
    },

    markPhotoSynced: (state, action: PayloadAction<string>) => {
      const photo = state.items.find((p) => p.id === action.payload);
      if (photo) {
        photo.synced = true;
        photosSlice.caseReducers.updateStats(state);
      }
    },

    // Upload status management
    setUploadStatus: (
      state,
      action: PayloadAction<{
        photoId: string;
        status: Photo["upload_status"];
      }>,
    ) => {
      const photo = state.items.find((p) => p.id === action.payload.photoId);
      if (photo) {
        photo.upload_status = action.payload.status;
        photosSlice.caseReducers.updateStats(state);
      }
    },

    setRemoteUrl: (
      state,
      action: PayloadAction<{ photoId: string; url: string }>,
    ) => {
      const photo = state.items.find((p) => p.id === action.payload.photoId);
      if (photo) {
        photo.remote_url = action.payload.url;
        photo.upload_status = "completed";
        photo.synced = true;
        photosSlice.caseReducers.updateStats(state);
      }
    },

    // Batch operations
    bulkAddPhotos: (state, action: PayloadAction<Photo[]>) => {
      const newPhotos = action.payload.filter(
        (newPhoto) =>
          !state.items.some((existing) => existing.id === newPhoto.id),
      );
      state.items.push(...newPhotos);
      state.lastUpdated = new Date().toISOString();
      photosSlice.caseReducers.updateStats(state);
    },

    bulkUpdateUploadStatus: (
      state,
      action: PayloadAction<{
        photoIds: string[];
        status: Photo["upload_status"];
      }>,
    ) => {
      action.payload.photoIds.forEach((photoId) => {
        const photo = state.items.find((p) => p.id === photoId);
        if (photo) {
          photo.upload_status = action.payload.status;
        }
      });
      photosSlice.caseReducers.updateStats(state);
    },

    markAllSynced: (state) => {
      state.items.forEach((photo) => {
        photo.synced = true;
      });
      photosSlice.caseReducers.updateStats(state);
    },

    // Filter management
    setAssessmentFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.assessmentId = action.payload;
    },

    setDamageItemFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.damageItemId = action.payload;
    },

    setUploadStatusFilter: (
      state,
      action: PayloadAction<Photo["upload_status"] | null>,
    ) => {
      state.filters.uploadStatus = action.payload;
    },

    setDateRangeFilter: (
      state,
      action: PayloadAction<{ start: string | null; end: string | null }>,
    ) => {
      state.filters.dateRange = action.payload;
    },

    setSortBy: (
      state,
      action: PayloadAction<{
        sortBy: PhotosState["filters"]["sortBy"];
        sortOrder: "asc" | "desc";
      }>,
    ) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
    },

    clearFilters: (state) => {
      state.filters = {
        assessmentId: null,
        damageItemId: null,
        uploadStatus: null,
        dateRange: {
          start: null,
          end: null,
        },
        sortBy: "timestamp",
        sortOrder: "desc",
      };
    },

    // Statistics calculation
    updateStats: (state) => {
      const totalSizeBytes = state.items.reduce(
        (sum, photo) => sum + photo.file_size,
        0,
      );

      state.stats = {
        totalPhotos: state.items.length,
        pendingUpload: state.items.filter((p) => p.upload_status === "pending")
          .length,
        uploadedPhotos: state.items.filter(
          (p) => p.upload_status === "completed",
        ).length,
        failedUploads: state.items.filter((p) => p.upload_status === "failed")
          .length,
        totalSizeMB: Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100,
      };
    },

    // Photo metadata updates
    updatePhotoMetadata: (
      state,
      action: PayloadAction<{
        photoId: string;
        metadata: Partial<
          Pick<Photo, "latitude" | "longitude" | "width" | "height">
        >;
      }>,
    ) => {
      const photo = state.items.find((p) => p.id === action.payload.photoId);
      if (photo) {
        Object.assign(photo, action.payload.metadata);
        photo.synced = false;
      }
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Data management
    clearAllPhotos: (state) => {
      state.items = [];
      state.uploading = [];
      state.lastUpdated = new Date().toISOString();
      photosSlice.caseReducers.updateStats(state);
    },

    // Clean up orphaned photos (not linked to any assessment/damage item)
    removeOrphanedPhotos: (state) => {
      state.items = state.items.filter(
        (photo) => photo.assessment_id || photo.damage_item_id,
      );
      photosSlice.caseReducers.updateStats(state);
    },
  },

  extraReducers: (builder) => {
    // Load from database
    builder
      .addCase(loadPhotosFromDatabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPhotosFromDatabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
        photosSlice.caseReducers.updateStats(state);
      })
      .addCase(loadPhotosFromDatabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load photos";
      });

    // Upload photo
    builder
      .addCase(uploadPhoto.pending, (state, action) => {
        const photoId = action.meta.arg;
        if (!state.uploading.includes(photoId)) {
          state.uploading.push(photoId);
        }
        const photo = state.items.find((p) => p.id === photoId);
        if (photo) {
          photo.upload_status = "uploading";
        }
      })
      .addCase(uploadPhoto.fulfilled, (state, action) => {
        const photoId = action.payload.id;
        state.uploading = state.uploading.filter((id) => id !== photoId);

        const index = state.items.findIndex((p) => p.id === photoId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        photosSlice.caseReducers.updateStats(state);
      })
      .addCase(uploadPhoto.rejected, (state, action) => {
        const photoId = action.meta.arg;
        state.uploading = state.uploading.filter((id) => id !== photoId);

        const photo = state.items.find((p) => p.id === photoId);
        if (photo) {
          photo.upload_status = "failed";
        }
        state.error = action.payload || "Failed to upload photo";
        photosSlice.caseReducers.updateStats(state);
      });

    // Retry failed uploads
    builder
      .addCase(retryFailedUploads.fulfilled, (state, action) => {
        // Photos are updated individually through uploadPhoto.fulfilled
        state.error = null;
      })
      .addCase(retryFailedUploads.rejected, (state, action) => {
        state.error = action.payload || "Failed to retry uploads";
      });
  },
});

export const {
  addPhoto,
  updatePhoto,
  removePhoto,
  markPhotoSynced,
  setUploadStatus,
  setRemoteUrl,
  bulkAddPhotos,
  bulkUpdateUploadStatus,
  markAllSynced,
  setAssessmentFilter,
  setDamageItemFilter,
  setUploadStatusFilter,
  setDateRangeFilter,
  setSortBy,
  clearFilters,
  updateStats,
  updatePhotoMetadata,
  setError,
  clearError,
  setLoading,
  clearAllPhotos,
  removeOrphanedPhotos,
} = photosSlice.actions;

export default photosSlice.reducer;
