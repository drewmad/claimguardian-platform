/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for damage item management with detailed categorization"
 * @dependencies ["@reduxjs/toolkit"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { DamageItem } from "../../types";

interface DamageItemsState {
  items: DamageItem[];
  currentItemId: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  filters: {
    assessmentId: string | null;
    category: DamageItem["category"] | null;
    damageType: DamageItem["damage_type"] | null;
    severity: DamageItem["severity"] | null;
    repairPriority: DamageItem["repair_priority"] | null;
    location: string | null;
    costRange: {
      min: number | null;
      max: number | null;
    };
    sortBy:
      | "location"
      | "estimated_cost"
      | "severity"
      | "repair_priority"
      | "created_at";
    sortOrder: "asc" | "desc";
  };
  stats: {
    totalItems: number;
    totalEstimatedCost: number;
    itemsByCategory: Record<DamageItem["category"], number>;
    itemsBySeverity: Record<DamageItem["severity"], number>;
    itemsByPriority: Record<DamageItem["repair_priority"], number>;
    pendingSync: number;
  };
  templates: {
    commonLocations: string[];
    categoryDefaults: Record<
      DamageItem["category"],
      {
        commonDamageTypes: DamageItem["damage_type"][];
        defaultPriority: DamageItem["repair_priority"];
      }
    >;
  };
}

const initialState: DamageItemsState = {
  items: [],
  currentItemId: null,
  loading: false,
  error: null,
  lastUpdated: null,
  filters: {
    assessmentId: null,
    category: null,
    damageType: null,
    severity: null,
    repairPriority: null,
    location: null,
    costRange: {
      min: null,
      max: null,
    },
    sortBy: "location",
    sortOrder: "asc",
  },
  stats: {
    totalItems: 0,
    totalEstimatedCost: 0,
    itemsByCategory: {
      structural: 0,
      exterior: 0,
      interior: 0,
      electrical: 0,
      plumbing: 0,
      hvac: 0,
      other: 0,
    },
    itemsBySeverity: {
      minor: 0,
      moderate: 0,
      major: 0,
      total_loss: 0,
    },
    itemsByPriority: {
      low: 0,
      medium: 0,
      high: 0,
      emergency: 0,
    },
    pendingSync: 0,
  },
  templates: {
    commonLocations: [
      "Living Room",
      "Kitchen",
      "Master Bedroom",
      "Bathroom",
      "Garage",
      "Basement",
      "Attic",
      "Roof",
      "Exterior Walls",
      "Front Yard",
      "Back Yard",
      "Driveway",
      "Porch",
      "Deck",
      "Windows",
      "Doors",
    ],
    categoryDefaults: {
      structural: {
        commonDamageTypes: ["water", "impact", "wind"],
        defaultPriority: "high",
      },
      exterior: {
        commonDamageTypes: ["wind", "hail", "water", "impact"],
        defaultPriority: "medium",
      },
      interior: {
        commonDamageTypes: ["water", "fire", "impact"],
        defaultPriority: "medium",
      },
      electrical: {
        commonDamageTypes: ["water", "fire", "wear"],
        defaultPriority: "high",
      },
      plumbing: {
        commonDamageTypes: ["water", "wear", "impact"],
        defaultPriority: "high",
      },
      hvac: {
        commonDamageTypes: ["water", "wind", "wear"],
        defaultPriority: "medium",
      },
      other: {
        commonDamageTypes: ["other", "wear"],
        defaultPriority: "low",
      },
    },
  },
};

// Async thunks
export const loadDamageItemsFromDatabase = createAsyncThunk<
  DamageItem[],
  string | undefined,
  { rejectValue: string }
>("damageItems/loadFromDatabase", async (assessmentId, { rejectWithValue }) => {
  try {
    // Implementation would load from SQLite, optionally filtered by assessment
    return [];
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load damage items",
    );
  }
});

export const createDamageItem = createAsyncThunk<
  DamageItem,
  Omit<DamageItem, "id" | "created_at" | "updated_at" | "synced">,
  { rejectValue: string }
>("damageItems/create", async (itemData, { rejectWithValue }) => {
  try {
    const damageItem: DamageItem = {
      ...itemData,
      id: `damage_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    };

    // Save to SQLite and add to sync queue
    // Implementation would save to database

    return damageItem;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create damage item",
    );
  }
});

export const bulkCreateDamageItems = createAsyncThunk<
  DamageItem[],
  {
    assessmentId: string;
    items: Omit<
      DamageItem,
      "id" | "assessment_id" | "created_at" | "updated_at" | "synced"
    >[];
  },
  { rejectValue: string }
>(
  "damageItems/bulkCreate",
  async ({ assessmentId, items }, { rejectWithValue }) => {
    try {
      const now = new Date().toISOString();
      const damageItems = items.map((item) => ({
        ...item,
        id: `damage_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assessment_id: assessmentId,
        created_at: now,
        updated_at: now,
        synced: false,
      }));

      return damageItems;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to create damage items",
      );
    }
  },
);

const damageItemsSlice = createSlice({
  name: "damageItems",
  initialState,
  reducers: {
    // CRUD operations
    addDamageItem: (state, action: PayloadAction<DamageItem>) => {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (existingIndex !== -1) {
        state.items[existingIndex] = action.payload;
      } else {
        state.items.push(action.payload);
      }
      state.lastUpdated = new Date().toISOString();
      damageItemsSlice.caseReducers.updateStats(state);
    },

    updateDamageItem: (state, action: PayloadAction<DamageItem>) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          updated_at: new Date().toISOString(),
        };
        state.lastUpdated = new Date().toISOString();
        damageItemsSlice.caseReducers.updateStats(state);
      }
    },

    removeDamageItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      if (state.currentItemId === action.payload) {
        state.currentItemId = null;
      }
      state.lastUpdated = new Date().toISOString();
      damageItemsSlice.caseReducers.updateStats(state);
    },

    markDamageItemSynced: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.synced = true;
        damageItemsSlice.caseReducers.updateStats(state);
      }
    },

    markDamageItemUnsynced: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.synced = false;
        damageItemsSlice.caseReducers.updateStats(state);
      }
    },

    // Current item selection
    setCurrentItem: (state, action: PayloadAction<string | null>) => {
      state.currentItemId = action.payload;
    },

    // Field updates
    updateEstimatedCost: (
      state,
      action: PayloadAction<{ itemId: string; cost: number }>,
    ) => {
      const item = state.items.find(
        (item) => item.id === action.payload.itemId,
      );
      if (item) {
        item.estimated_cost = action.payload.cost;
        item.updated_at = new Date().toISOString();
        item.synced = false;
        damageItemsSlice.caseReducers.updateStats(state);
      }
    },

    updateSeverity: (
      state,
      action: PayloadAction<{
        itemId: string;
        severity: DamageItem["severity"];
      }>,
    ) => {
      const item = state.items.find(
        (item) => item.id === action.payload.itemId,
      );
      if (item) {
        item.severity = action.payload.severity;
        item.updated_at = new Date().toISOString();
        item.synced = false;
        damageItemsSlice.caseReducers.updateStats(state);
      }
    },

    updateRepairPriority: (
      state,
      action: PayloadAction<{
        itemId: string;
        priority: DamageItem["repair_priority"];
      }>,
    ) => {
      const item = state.items.find(
        (item) => item.id === action.payload.itemId,
      );
      if (item) {
        item.repair_priority = action.payload.priority;
        item.updated_at = new Date().toISOString();
        item.synced = false;
        damageItemsSlice.caseReducers.updateStats(state);
      }
    },

    updateMeasurements: (
      state,
      action: PayloadAction<{
        itemId: string;
        measurements: DamageItem["measurements"];
      }>,
    ) => {
      const item = state.items.find(
        (item) => item.id === action.payload.itemId,
      );
      if (item) {
        item.measurements = action.payload.measurements;
        item.updated_at = new Date().toISOString();
        item.synced = false;
      }
    },

    updateDescription: (
      state,
      action: PayloadAction<{ itemId: string; description: string }>,
    ) => {
      const item = state.items.find(
        (item) => item.id === action.payload.itemId,
      );
      if (item) {
        item.description = action.payload.description;
        item.updated_at = new Date().toISOString();
        item.synced = false;
      }
    },

    // Filter management
    setAssessmentFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.assessmentId = action.payload;
    },

    setCategoryFilter: (
      state,
      action: PayloadAction<DamageItem["category"] | null>,
    ) => {
      state.filters.category = action.payload;
    },

    setDamageTypeFilter: (
      state,
      action: PayloadAction<DamageItem["damage_type"] | null>,
    ) => {
      state.filters.damageType = action.payload;
    },

    setSeverityFilter: (
      state,
      action: PayloadAction<DamageItem["severity"] | null>,
    ) => {
      state.filters.severity = action.payload;
    },

    setPriorityFilter: (
      state,
      action: PayloadAction<DamageItem["repair_priority"] | null>,
    ) => {
      state.filters.repairPriority = action.payload;
    },

    setLocationFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.location = action.payload;
    },

    setCostRangeFilter: (
      state,
      action: PayloadAction<{ min: number | null; max: number | null }>,
    ) => {
      state.filters.costRange = action.payload;
    },

    setSortBy: (
      state,
      action: PayloadAction<{
        sortBy: DamageItemsState["filters"]["sortBy"];
        sortOrder: "asc" | "desc";
      }>,
    ) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
    },

    clearFilters: (state) => {
      state.filters = {
        assessmentId: null,
        category: null,
        damageType: null,
        severity: null,
        repairPriority: null,
        location: null,
        costRange: {
          min: null,
          max: null,
        },
        sortBy: "location",
        sortOrder: "asc",
      };
    },

    // Bulk operations
    bulkAddDamageItems: (state, action: PayloadAction<DamageItem[]>) => {
      const newItems = action.payload.filter(
        (newItem) =>
          !state.items.some((existing) => existing.id === newItem.id),
      );
      state.items.push(...newItems);
      state.lastUpdated = new Date().toISOString();
      damageItemsSlice.caseReducers.updateStats(state);
    },

    bulkUpdateSeverity: (
      state,
      action: PayloadAction<{
        itemIds: string[];
        severity: DamageItem["severity"];
      }>,
    ) => {
      action.payload.itemIds.forEach((itemId) => {
        const item = state.items.find((item) => item.id === itemId);
        if (item) {
          item.severity = action.payload.severity;
          item.updated_at = new Date().toISOString();
          item.synced = false;
        }
      });
      damageItemsSlice.caseReducers.updateStats(state);
    },

    bulkUpdatePriority: (
      state,
      action: PayloadAction<{
        itemIds: string[];
        priority: DamageItem["repair_priority"];
      }>,
    ) => {
      action.payload.itemIds.forEach((itemId) => {
        const item = state.items.find((item) => item.id === itemId);
        if (item) {
          item.repair_priority = action.payload.priority;
          item.updated_at = new Date().toISOString();
          item.synced = false;
        }
      });
      damageItemsSlice.caseReducers.updateStats(state);
    },

    markAllSynced: (state) => {
      state.items.forEach((item) => {
        item.synced = true;
      });
      damageItemsSlice.caseReducers.updateStats(state);
    },

    // Statistics calculation
    updateStats: (state) => {
      state.stats = {
        totalItems: state.items.length,
        totalEstimatedCost: state.items.reduce(
          (sum, item) => sum + item.estimated_cost,
          0,
        ),
        itemsByCategory: {
          structural: state.items.filter(
            (item) => item.category === "structural",
          ).length,
          exterior: state.items.filter((item) => item.category === "exterior")
            .length,
          interior: state.items.filter((item) => item.category === "interior")
            .length,
          electrical: state.items.filter(
            (item) => item.category === "electrical",
          ).length,
          plumbing: state.items.filter((item) => item.category === "plumbing")
            .length,
          hvac: state.items.filter((item) => item.category === "hvac").length,
          other: state.items.filter((item) => item.category === "other").length,
        },
        itemsBySeverity: {
          minor: state.items.filter((item) => item.severity === "minor").length,
          moderate: state.items.filter((item) => item.severity === "moderate")
            .length,
          major: state.items.filter((item) => item.severity === "major").length,
          total_loss: state.items.filter(
            (item) => item.severity === "total_loss",
          ).length,
        },
        itemsByPriority: {
          low: state.items.filter((item) => item.repair_priority === "low")
            .length,
          medium: state.items.filter(
            (item) => item.repair_priority === "medium",
          ).length,
          high: state.items.filter((item) => item.repair_priority === "high")
            .length,
          emergency: state.items.filter(
            (item) => item.repair_priority === "emergency",
          ).length,
        },
        pendingSync: state.items.filter((item) => !item.synced).length,
      };
    },

    // Template management
    addCommonLocation: (state, action: PayloadAction<string>) => {
      if (!state.templates.commonLocations.includes(action.payload)) {
        state.templates.commonLocations.push(action.payload);
      }
    },

    removeCommonLocation: (state, action: PayloadAction<string>) => {
      state.templates.commonLocations = state.templates.commonLocations.filter(
        (location) => location !== action.payload,
      );
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
    clearAllDamageItems: (state) => {
      state.items = [];
      state.currentItemId = null;
      state.lastUpdated = new Date().toISOString();
      damageItemsSlice.caseReducers.updateStats(state);
    },

    removeItemsByAssessment: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.assessment_id !== action.payload,
      );
      if (state.currentItemId) {
        const currentItem = state.items.find(
          (item) => item.id === state.currentItemId,
        );
        if (!currentItem) {
          state.currentItemId = null;
        }
      }
      damageItemsSlice.caseReducers.updateStats(state);
    },
  },

  extraReducers: (builder) => {
    // Load from database
    builder
      .addCase(loadDamageItemsFromDatabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDamageItemsFromDatabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
        damageItemsSlice.caseReducers.updateStats(state);
      })
      .addCase(loadDamageItemsFromDatabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load damage items";
      });

    // Create single damage item
    builder
      .addCase(createDamageItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDamageItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.currentItemId = action.payload.id;
        state.lastUpdated = new Date().toISOString();
        damageItemsSlice.caseReducers.updateStats(state);
      })
      .addCase(createDamageItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create damage item";
      });

    // Bulk create damage items
    builder
      .addCase(bulkCreateDamageItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateDamageItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(...action.payload);
        state.lastUpdated = new Date().toISOString();
        damageItemsSlice.caseReducers.updateStats(state);
      })
      .addCase(bulkCreateDamageItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create damage items";
      });
  },
});

export const {
  addDamageItem,
  updateDamageItem,
  removeDamageItem,
  markDamageItemSynced,
  markDamageItemUnsynced,
  setCurrentItem,
  updateEstimatedCost,
  updateSeverity,
  updateRepairPriority,
  updateMeasurements,
  updateDescription,
  setAssessmentFilter,
  setCategoryFilter,
  setDamageTypeFilter,
  setSeverityFilter,
  setPriorityFilter,
  setLocationFilter,
  setCostRangeFilter,
  setSortBy,
  clearFilters,
  bulkAddDamageItems,
  bulkUpdateSeverity,
  bulkUpdatePriority,
  markAllSynced,
  updateStats,
  addCommonLocation,
  removeCommonLocation,
  setError,
  clearError,
  setLoading,
  clearAllDamageItems,
  removeItemsByAssessment,
} = damageItemsSlice.actions;

export default damageItemsSlice.reducer;
