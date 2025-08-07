/**
 * @fileMetadata
 * @purpose "Hook for managing onboarding state and progress"
 * @owner frontend-team
 * @dependencies ["react", "@supabase/supabase-js"]
 * @exports ["useOnboarding"]
 * @complexity medium
 * @tags ["hook", "onboarding", "state"]
 * @status stable
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useSupabase } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export interface OnboardingState {
  hasCompletedTour: boolean;
  hasAddedProperty: boolean;
  hasSetupInsurance: boolean;
  hasExploredAITools: boolean;
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
}

export interface OnboardingActions {
  startTour: () => void;
  completeTour: () => void;
  skipTour: () => void;
  markStepComplete: (step: string, data?: any) => void;
  resetOnboarding: () => void;
  shouldShowTour: () => boolean;
}

export interface UseOnboardingReturn
  extends OnboardingState,
    OnboardingActions {}

const ONBOARDING_STEPS = ["tour", "property", "insurance", "ai-tools"];

const LOCAL_STORAGE_KEY = "claimguardian_onboarding";

export function useOnboarding(): UseOnboardingReturn {
  const { user } = useAuth();
  const { supabase } = useSupabase();

  const [state, setState] = useState<OnboardingState>({
    hasCompletedTour: false,
    hasAddedProperty: false,
    hasSetupInsurance: false,
    hasExploredAITools: false,
    currentStep: 0,
    totalSteps: ONBOARDING_STEPS.length,
    isLoading: true,
  });

  // Load onboarding state from localStorage and database
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        // Check localStorage first for quick load
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          setState((prev) => ({ ...prev, ...parsed, isLoading: false }));
        }

        // Then sync with database if user is logged in
        if (user) {
          const { data, error } = await supabase
            .from("user_preferences")
            .select("onboarding_state")
            .eq("user_id", user.id)
            .single();

          if (!error && data?.onboarding_state) {
            const dbState = data.onboarding_state as Partial<OnboardingState>;
            setState((prev) => ({ ...prev, ...dbState, isLoading: false }));

            // Update localStorage with database state
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbState));
          } else if (error && error.code === "PGRST116") {
            // No preferences found, create default
            await createDefaultPreferences();
          }
        }
      } catch (error) {
        logger.error("Failed to load onboarding state", { error });
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadOnboardingState();
  }, [user, supabase]);

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const defaultState = {
        hasCompletedTour: false,
        hasAddedProperty: false,
        hasSetupInsurance: false,
        hasExploredAITools: false,
        currentStep: 0,
      };

      await supabase.from("user_preferences").insert({
        user_id: user.id,
        onboarding_state: defaultState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      logger.track("onboarding_preferences_created", { userId: user.id });
    } catch (error) {
      logger.error("Failed to create default preferences", { error });
    }
  };

  const saveState = useCallback(
    async (newState: Partial<OnboardingState>) => {
      // Update local state
      setState((prev) => {
        const updated = { ...prev, ...newState };

        // Save to localStorage immediately
        const toSave = {
          hasCompletedTour: updated.hasCompletedTour,
          hasAddedProperty: updated.hasAddedProperty,
          hasSetupInsurance: updated.hasSetupInsurance,
          hasExploredAITools: updated.hasExploredAITools,
          currentStep: updated.currentStep,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));

        return updated;
      });

      // Save to database if user is logged in
      if (user) {
        try {
          await supabase
            .from("user_preferences")
            .update({
              onboarding_state: newState,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);
        } catch (error) {
          logger.error("Failed to save onboarding state", { error });
        }
      }
    },
    [user, supabase],
  );

  const startTour = useCallback(() => {
    logger.track("onboarding_tour_started");
    saveState({ currentStep: 0 });
  }, [saveState]);

  const completeTour = useCallback(() => {
    logger.track("onboarding_tour_completed");
    saveState({
      hasCompletedTour: true,
      currentStep: 1,
    });
  }, [saveState]);

  const skipTour = useCallback(() => {
    logger.track("onboarding_tour_skipped");
    saveState({
      hasCompletedTour: true,
      currentStep: ONBOARDING_STEPS.length,
    });
  }, [saveState]);

  const markStepComplete = useCallback(
    (step: string, data?: any) => {
      logger.track("onboarding_step_completed", { step, data });

      const updates: Partial<OnboardingState> = {
        currentStep: state.currentStep + 1,
      };

      switch (step) {
        case "property":
          updates.hasAddedProperty = true;
          break;
        case "insurance":
          updates.hasSetupInsurance = true;
          break;
        case "ai-tools":
          updates.hasExploredAITools = true;
          // Save selected AI tools preference
          if (data?.selectedTools) {
            localStorage.setItem(
              "selected_ai_tools",
              JSON.stringify(data.selectedTools),
            );
          }
          break;
      }

      saveState(updates);
    },
    [state.currentStep, saveState],
  );

  const resetOnboarding = useCallback(() => {
    logger.track("onboarding_reset");
    const resetState = {
      hasCompletedTour: false,
      hasAddedProperty: false,
      hasSetupInsurance: false,
      hasExploredAITools: false,
      currentStep: 0,
    };
    saveState(resetState);
  }, [saveState]);

  const shouldShowTour = useCallback(() => {
    // Don't show if loading or already completed
    if (state.isLoading || state.hasCompletedTour) {
      return false;
    }

    // Check if user dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("onboarding_tour_dismissed");
    if (dismissedAt) {
      const daysSinceDismiss =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return false;
      }
    }

    // Show tour for new users
    return true;
  }, [state.isLoading, state.hasCompletedTour]);

  return {
    ...state,
    startTour,
    completeTour,
    skipTour,
    markStepComplete,
    resetOnboarding,
    shouldShowTour,
  };
}
