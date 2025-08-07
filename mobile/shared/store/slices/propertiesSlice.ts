/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for property management with offline-first support"
 * @dependencies ["@reduxjs/toolkit"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { Property } from "../../types";

interface PropertiesState {
  items: Property[];
  selectedPropertyId: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  filters: {
    searchQuery: string;
    propertyType: string | null;
    county: string | null;
    sortBy: "name" | "created_at" | "updated_at";
    sortOrder: "asc" | "desc";
  };
}

const initialState: PropertiesState = {
  items: [],
  selectedPropertyId: null,
  loading: false,
  error: null,
  lastUpdated: null,
  filters: {
    searchQuery: "",
    propertyType: null,
    county: null,
    sortBy: "name",
    sortOrder: "asc",
  },
};

// Async thunks
export const loadPropertiesFromDatabase = createAsyncThunk<
  Property[],
  void,
  { rejectValue: string }
>("properties/loadFromDatabase", async (_, { rejectWithValue }) => {
  try {
    // Implementation would load from SQLite
    // For now return empty array
    return [];
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load properties",
    );
  }
});

export const syncPropertyToServer = createAsyncThunk<
  Property,
  string,
  { rejectValue: string }
>("properties/syncToServer", async (propertyId, { rejectWithValue }) => {
  try {
    // Implementation would sync to server
    throw new Error("Not implemented");
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to sync property",
    );
  }
});

const propertiesSlice = createSlice({
  name: "properties",
  initialState,
  reducers: {
    // Property CRUD operations
    addProperty: (state, action: PayloadAction<Property>) => {
      const existingIndex = state.items.findIndex(
        (p) => p.id === action.payload.id,
      );
      if (existingIndex !== -1) {
        state.items[existingIndex] = action.payload;
      } else {
        state.items.push(action.payload);
      }
      state.lastUpdated = new Date().toISOString();
    },

    updateProperty: (state, action: PayloadAction<Property>) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          updated_at: new Date().toISOString(),
        };
        state.lastUpdated = new Date().toISOString();
      }
    },

    removeProperty: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.selectedPropertyId === action.payload) {
        state.selectedPropertyId = null;
      }
      state.lastUpdated = new Date().toISOString();
    },

    markPropertySynced: (state, action: PayloadAction<string>) => {
      const property = state.items.find((p) => p.id === action.payload);
      if (property) {
        property.synced = true;
      }
    },

    markPropertyUnsynced: (state, action: PayloadAction<string>) => {
      const property = state.items.find((p) => p.id === action.payload);
      if (property) {
        property.synced = false;
      }
    },

    // Selection management
    selectProperty: (state, action: PayloadAction<string | null>) => {
      state.selectedPropertyId = action.payload;
    },

    // Filter management
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    },

    setPropertyTypeFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.propertyType = action.payload;
    },

    setCountyFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.county = action.payload;
    },

    setSortBy: (
      state,
      action: PayloadAction<{
        sortBy: PropertiesState["filters"]["sortBy"];
        sortOrder: "asc" | "desc";
      }>,
    ) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
    },

    clearFilters: (state) => {
      state.filters = {
        searchQuery: "",
        propertyType: null,
        county: null,
        sortBy: "name",
        sortOrder: "asc",
      };
    },

    // Bulk operations
    bulkAddProperties: (state, action: PayloadAction<Property[]>) => {
      const newProperties = action.payload.filter(
        (newProp) =>
          !state.items.some((existingProp) => existingProp.id === newProp.id),
      );
      state.items.push(...newProperties);
      state.lastUpdated = new Date().toISOString();
    },

    bulkUpdateProperties: (state, action: PayloadAction<Property[]>) => {
      action.payload.forEach((updatedProperty) => {
        const index = state.items.findIndex((p) => p.id === updatedProperty.id);
        if (index !== -1) {
          state.items[index] = updatedProperty;
        }
      });
      state.lastUpdated = new Date().toISOString();
    },

    markAllSynced: (state) => {
      state.items.forEach((property) => {
        property.synced = true;
      });
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Data management
    clearAllProperties: (state) => {
      state.items = [];
      state.selectedPropertyId = null;
      state.lastUpdated = new Date().toISOString();
    },

    refreshLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
  },

  extraReducers: (builder) => {
    // Load from database
    builder
      .addCase(loadPropertiesFromDatabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPropertiesFromDatabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(loadPropertiesFromDatabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load properties";
      });

    // Sync to server
    builder
      .addCase(syncPropertyToServer.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncPropertyToServer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = {
            ...action.payload,
            synced: true,
          };
        }
      })
      .addCase(syncPropertyToServer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to sync property";
      });
  },
});

export const {
  addProperty,
  updateProperty,
  removeProperty,
  markPropertySynced,
  markPropertyUnsynced,
  selectProperty,
  setSearchQuery,
  setPropertyTypeFilter,
  setCountyFilter,
  setSortBy,
  clearFilters,
  bulkAddProperties,
  bulkUpdateProperties,
  markAllSynced,
  setError,
  clearError,
  setLoading,
  clearAllProperties,
  refreshLastUpdated,
} = propertiesSlice.actions;

export default propertiesSlice.reducer;
