/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Redux slice for user authentication and profile management"
 * @dependencies ["@reduxjs/toolkit", "expo-secure-store"]
 * @status stable
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types";

interface UserState {
  current: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  authToken: string | null;
  refreshToken: string | null;
  lastLoginTime: string | null;
  sessionExpiry: string | null;
  preferences: User["preferences"];
  profile: {
    isComplete: boolean;
    lastUpdated: string | null;
  };
}

const initialState: UserState = {
  current: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  authToken: null,
  refreshToken: null,
  lastLoginTime: null,
  sessionExpiry: null,
  preferences: {
    units: "imperial",
    auto_sync: true,
    photo_quality: "high",
    gps_enabled: true,
  },
  profile: {
    isComplete: false,
    lastUpdated: null,
  },
};

// Async thunks
export const signIn = createAsyncThunk<
  { user: User; tokens: { access: string; refresh: string } },
  { email: string; password: string },
  { rejectValue: string }
>("user/signIn", async ({ email, password }, { rejectWithValue }) => {
  try {
    // Implementation would authenticate with Supabase
    // For now, return mock data
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      full_name: email.split("@")[0],
      phone: null,
      role: "homeowner",
      subscription_tier: "free",
      preferences: {
        units: "imperial",
        auto_sync: true,
        photo_quality: "high",
        gps_enabled: true,
      },
      last_sync: new Date().toISOString(),
    };

    const tokens = {
      access: `mock_access_token_${Date.now()}`,
      refresh: `mock_refresh_token_${Date.now()}`,
    };

    return { user, tokens };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Sign in failed",
    );
  }
});

export const signUp = createAsyncThunk<
  { user: User; tokens: { access: string; refresh: string } },
  { email: string; password: string; fullName?: string; phone?: string },
  { rejectValue: string }
>(
  "user/signUp",
  async ({ email, password, fullName, phone }, { rejectWithValue }) => {
    try {
      // Implementation would create account with Supabase
      const user: User = {
        id: `user_${Date.now()}`,
        email,
        full_name: fullName || email.split("@")[0],
        phone: phone || null,
        role: "homeowner",
        subscription_tier: "free",
        preferences: {
          units: "imperial",
          auto_sync: true,
          photo_quality: "high",
          gps_enabled: true,
        },
        last_sync: new Date().toISOString(),
      };

      const tokens = {
        access: `mock_access_token_${Date.now()}`,
        refresh: `mock_refresh_token_${Date.now()}`,
      };

      return { user, tokens };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Sign up failed",
      );
    }
  },
);

export const signOut = createAsyncThunk<void, void, { rejectValue: string }>(
  "user/signOut",
  async (_, { rejectWithValue }) => {
    try {
      // Implementation would sign out from Supabase
      // Clear stored tokens
      return;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Sign out failed",
      );
    }
  },
);

export const refreshAuthToken = createAsyncThunk<
  { access: string; refresh: string },
  void,
  { rejectValue: string }
>("user/refreshToken", async (_, { rejectWithValue }) => {
  try {
    // Implementation would refresh token with Supabase
    return {
      access: `refreshed_access_token_${Date.now()}`,
      refresh: `refreshed_refresh_token_${Date.now()}`,
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Token refresh failed",
    );
  }
});

export const updateProfile = createAsyncThunk<
  User,
  Partial<Pick<User, "full_name" | "phone" | "preferences">>,
  { rejectValue: string }
>("user/updateProfile", async (updates, { rejectWithValue, getState }) => {
  try {
    const state = getState() as any;
    const currentUser = state.user.current;

    if (!currentUser) {
      throw new Error("No user logged in");
    }

    // Implementation would update profile in Supabase
    const updatedUser: User = {
      ...currentUser,
      ...updates,
      last_sync: new Date().toISOString(),
    };

    return updatedUser;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Profile update failed",
    );
  }
});

export const loadStoredSession = createAsyncThunk<
  { user: User; tokens: { access: string; refresh: string } } | null,
  void,
  { rejectValue: string }
>("user/loadStoredSession", async (_, { rejectWithValue }) => {
  try {
    // Implementation would load from SecureStore
    // For now, return null (no stored session)
    return null;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load session",
    );
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Profile updates
    updatePreferences: (
      state,
      action: PayloadAction<Partial<User["preferences"]>>,
    ) => {
      if (state.current) {
        state.current.preferences = {
          ...state.current.preferences,
          ...action.payload,
        };
        state.preferences = state.current.preferences;
      }
    },

    updateLastSync: (state, action: PayloadAction<string>) => {
      if (state.current) {
        state.current.last_sync = action.payload;
      }
    },

    // Session management
    setSessionExpiry: (state, action: PayloadAction<string>) => {
      state.sessionExpiry = action.payload;
    },

    clearSession: (state) => {
      state.current = null;
      state.isAuthenticated = false;
      state.authToken = null;
      state.refreshToken = null;
      state.lastLoginTime = null;
      state.sessionExpiry = null;
      state.profile.isComplete = false;
      state.profile.lastUpdated = null;
    },

    // Token management
    setAuthToken: (state, action: PayloadAction<string>) => {
      state.authToken = action.payload;
    },

    setRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
    },

    // Profile completion tracking
    markProfileComplete: (state) => {
      state.profile.isComplete = true;
      state.profile.lastUpdated = new Date().toISOString();
    },

    markProfileIncomplete: (state) => {
      state.profile.isComplete = false;
    },

    // Subscription tier updates
    updateSubscriptionTier: (
      state,
      action: PayloadAction<User["subscription_tier"]>,
    ) => {
      if (state.current) {
        state.current.subscription_tier = action.payload;
      }
    },

    // Role updates
    updateUserRole: (state, action: PayloadAction<User["role"]>) => {
      if (state.current) {
        state.current.role = action.payload;
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

    // Preferences shortcuts
    toggleAutoSync: (state) => {
      if (state.current) {
        state.current.preferences.auto_sync =
          !state.current.preferences.auto_sync;
        state.preferences.auto_sync = state.current.preferences.auto_sync;
      }
    },

    toggleGpsEnabled: (state) => {
      if (state.current) {
        state.current.preferences.gps_enabled =
          !state.current.preferences.gps_enabled;
        state.preferences.gps_enabled = state.current.preferences.gps_enabled;
      }
    },

    setPhotoQuality: (
      state,
      action: PayloadAction<User["preferences"]["photo_quality"]>,
    ) => {
      if (state.current) {
        state.current.preferences.photo_quality = action.payload;
        state.preferences.photo_quality = action.payload;
      }
    },

    setUnits: (state, action: PayloadAction<User["preferences"]["units"]>) => {
      if (state.current) {
        state.current.preferences.units = action.payload;
        state.preferences.units = action.payload;
      }
    },

    // Demo/testing helpers
    setDemoUser: (state) => {
      state.current = {
        id: "demo_user",
        email: "demo@claimguardian.com",
        full_name: "Demo User",
        phone: "+1-555-0123",
        role: "homeowner",
        subscription_tier: "pro",
        preferences: {
          units: "imperial",
          auto_sync: true,
          photo_quality: "high",
          gps_enabled: true,
        },
        last_sync: new Date().toISOString(),
      };
      state.isAuthenticated = true;
      state.authToken = "demo_token";
      state.lastLoginTime = new Date().toISOString();
      state.profile.isComplete = true;
    },
  },

  extraReducers: (builder) => {
    // Sign in
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.user;
        state.isAuthenticated = true;
        state.authToken = action.payload.tokens.access;
        state.refreshToken = action.payload.tokens.refresh;
        state.lastLoginTime = new Date().toISOString();
        state.preferences = action.payload.user.preferences;
        state.profile.isComplete = !!(
          action.payload.user.full_name && action.payload.user.phone
        );
        state.profile.lastUpdated = new Date().toISOString();
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Sign in failed";
        state.isAuthenticated = false;
      });

    // Sign up
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.user;
        state.isAuthenticated = true;
        state.authToken = action.payload.tokens.access;
        state.refreshToken = action.payload.tokens.refresh;
        state.lastLoginTime = new Date().toISOString();
        state.preferences = action.payload.user.preferences;
        state.profile.isComplete = !!(
          action.payload.user.full_name && action.payload.user.phone
        );
        state.profile.lastUpdated = new Date().toISOString();
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Sign up failed";
        state.isAuthenticated = false;
      });

    // Sign out
    builder
      .addCase(signOut.fulfilled, (state) => {
        state.current = null;
        state.isAuthenticated = false;
        state.authToken = null;
        state.refreshToken = null;
        state.lastLoginTime = null;
        state.sessionExpiry = null;
        state.profile.isComplete = false;
        state.profile.lastUpdated = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.error = action.payload || "Sign out failed";
        // Still clear session on failure
        userSlice.caseReducers.clearSession(state);
      });

    // Refresh token
    builder
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.authToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.sessionExpiry = null; // Reset expiry
      })
      .addCase(refreshAuthToken.rejected, (state, action) => {
        state.error = action.payload || "Token refresh failed";
        // Clear session if refresh fails
        userSlice.caseReducers.clearSession(state);
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
        state.preferences = action.payload.preferences;
        state.profile.isComplete = !!(
          action.payload.full_name && action.payload.phone
        );
        state.profile.lastUpdated = new Date().toISOString();
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Profile update failed";
      });

    // Load stored session
    builder
      .addCase(loadStoredSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoredSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.current = action.payload.user;
          state.isAuthenticated = true;
          state.authToken = action.payload.tokens.access;
          state.refreshToken = action.payload.tokens.refresh;
          state.preferences = action.payload.user.preferences;
          state.profile.isComplete = !!(
            action.payload.user.full_name && action.payload.user.phone
          );
        }
      })
      .addCase(loadStoredSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load session";
      });
  },
});

export const {
  updatePreferences,
  updateLastSync,
  setSessionExpiry,
  clearSession,
  setAuthToken,
  setRefreshToken,
  markProfileComplete,
  markProfileIncomplete,
  updateSubscriptionTier,
  updateUserRole,
  setError,
  clearError,
  setLoading,
  toggleAutoSync,
  toggleGpsEnabled,
  setPhotoQuality,
  setUnits,
  setDemoUser,
} = userSlice.actions;

export default userSlice.reducer;
