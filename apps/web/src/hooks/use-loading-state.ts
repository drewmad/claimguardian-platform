/**
 * @fileMetadata
 * @purpose "Centralized loading state management hook"
 * @owner ui-team
 * @dependencies ["react", "zustand"]
 * @exports ["useLoadingState", "LoadingStateStore", "createLoadingStore"]
 * @complexity medium
 * @tags ["loading", "state-management", "hooks"]
 * @status stable
 */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { create } from "zustand";

// Global loading state store
interface GlobalLoadingState {
  loadingStates: Record<string, boolean>;
  loadingMessages: Record<string, string>;
  setLoading: (key: string, isLoading: boolean, message?: string) => void;
  clearLoading: (key: string) => void;
  isAnyLoading: () => boolean;
  getLoadingState: (key: string) => boolean;
  getLoadingMessage: (key: string) => string | undefined;
}

export const useGlobalLoadingStore = create<GlobalLoadingState>((set, get) => ({
  loadingStates: {},
  loadingMessages: {},
  setLoading: (key: string, isLoading: boolean, message?: string) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: isLoading },
      loadingMessages: { ...state.loadingMessages, [key]: message || "" },
    })),
  clearLoading: (key: string) =>
    set((state) => {
      const newStates = { ...state.loadingStates };
      const newMessages = { ...state.loadingMessages };
      delete newStates[key];
      delete newMessages[key];
      return { loadingStates: newStates, loadingMessages: newMessages };
    }),
  isAnyLoading: () => Object.values(get().loadingStates).some(Boolean),
  getLoadingState: (key: string) => get().loadingStates[key] || false,
  getLoadingMessage: (key: string) => get().loadingMessages[key],
}));

// Individual loading state hook
export interface LoadingStateOptions {
  key?: string;
  initialState?: boolean;
  timeout?: number;
  onTimeout?: () => void;
  minDuration?: number;
}

export function useLoadingState(options: LoadingStateOptions = {}) {
  const {
    key,
    initialState = false,
    timeout,
    onTimeout,
    minDuration,
  } = options;

  const [isLoading, setIsLoading] = useState(initialState);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const minDurationRef = useRef<NodeJS.Timeout>(undefined);
  const startTimeRef = useRef<number>(undefined);

  const { setLoading: setGlobalLoading, clearLoading: clearGlobalLoading } =
    useGlobalLoadingStore();

  const startLoading = useCallback(
    (loadingMessage?: string) => {
      startTimeRef.current = Date.now();
      setIsLoading(true);
      setMessage(loadingMessage || "");
      setError(null);
      setProgress(0);

      if (key) {
        setGlobalLoading(key, true, loadingMessage);
      }

      // Set timeout if specified
      if (timeout) {
        timeoutRef.current = setTimeout(() => {
          if (onTimeout) {
            onTimeout();
          } else {
            stopLoading();
            setError(new Error("Loading timeout"));
          }
        }, timeout);
      }
    },
    [key, timeout, onTimeout, setGlobalLoading],
  );

  const stopLoading = useCallback(() => {
    const elapsed = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 0;
    const remainingMinDuration = minDuration
      ? Math.max(0, minDuration - elapsed)
      : 0;

    const finishLoading = () => {
      setIsLoading(false);
      setMessage("");
      setProgress(100);

      if (key) {
        clearGlobalLoading(key);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    if (remainingMinDuration > 0) {
      minDurationRef.current = setTimeout(finishLoading, remainingMinDuration);
    } else {
      finishLoading();
    }
  }, [key, minDuration, clearGlobalLoading]);

  const updateMessage = useCallback(
    (newMessage: string) => {
      setMessage(newMessage);
      if (key) {
        setGlobalLoading(key, true, newMessage);
      }
    },
    [key, setGlobalLoading],
  );

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (minDurationRef.current) {
        clearTimeout(minDurationRef.current);
      }
      if (key) {
        clearGlobalLoading(key);
      }
    };
  }, [key, clearGlobalLoading]);

  return {
    isLoading,
    message,
    error,
    progress,
    startLoading,
    stopLoading,
    updateMessage,
    updateProgress,
    setError,
  };
}

// Async operation wrapper with loading state
export function useAsyncOperation() {
  const loadingState = useLoadingState();

  const execute = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options: {
        loadingMessage?: string;
        successMessage?: string;
        errorMessage?: string;
        showProgress?: boolean;
      } = {},
    ): Promise<T | null> => {
      const { loadingMessage, successMessage, errorMessage, showProgress } =
        options;

      try {
        loadingState.startLoading(loadingMessage);

        if (showProgress) {
          // Track current progress
          let currentProgress = 0;
          
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            const increment = Math.random() * 20 + 10;
            currentProgress = Math.min(90, currentProgress + increment);
            loadingState.updateProgress(currentProgress);
          }, 200);

          const result = await operation();

          clearInterval(progressInterval);
          loadingState.updateProgress(100);

          // Show success message briefly
          if (successMessage) {
            loadingState.updateMessage(successMessage);
            setTimeout(() => loadingState.stopLoading(), 500);
          } else {
            loadingState.stopLoading();
          }

          return result;
        } else {
          const result = await operation();
          loadingState.stopLoading();
          return result;
        }
      } catch (error) {
        const errorMsg =
          errorMessage ||
          (error instanceof Error ? error.message : "Operation failed");
        loadingState.setError(new Error(errorMsg));
        loadingState.stopLoading();
        return null;
      }
    },
    [loadingState],
  );

  return {
    ...loadingState,
    execute,
  };
}

// Multi-step loading state for wizards and forms
export interface Step {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed" | "error";
}

export function useMultiStepLoading(initialSteps: Omit<Step, "status">[]) {
  const [steps, setSteps] = useState<Step[]>(
    initialSteps.map((step) => ({ ...step, status: "pending" })),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startStep = useCallback(
    (stepId: string, message?: string) => {
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === stepId ? { ...step, status: "loading" } : step,
        ),
      );

      const stepIndex = steps.findIndex((step) => step.id === stepId);
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
      }
    },
    [steps],
  );

  const completeStep = useCallback((stepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, status: "completed" } : step,
      ),
    );
  }, []);

  const errorStep = useCallback((stepId: string, error?: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, status: "error" } : step,
      ),
    );
  }, []);

  const resetSteps = useCallback(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => ({ ...step, status: "pending" })),
    );
    setCurrentStepIndex(0);
  }, []);

  const getCurrentStep = useCallback(() => {
    return steps[currentStepIndex];
  }, [steps, currentStepIndex]);

  const getProgress = useCallback(() => {
    const completedSteps = steps.filter(
      (step) => step.status === "completed",
    ).length;
    return (completedSteps / steps.length) * 100;
  }, [steps]);

  const isLoading = steps.some((step) => step.status === "loading");
  const isCompleted = steps.every((step) => step.status === "completed");
  const hasError = steps.some((step) => step.status === "error");

  return {
    steps,
    currentStepIndex,
    currentStep: getCurrentStep(),
    progress: getProgress(),
    isLoading,
    isCompleted,
    hasError,
    startStep,
    completeStep,
    errorStep,
    resetSteps,
  };
}

// Page-level loading state
export function usePageLoading() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("");

  useEffect(() => {
    // Simulate page loading stages
    const stages = [
      { stage: "Loading user data...", progress: 20 },
      { stage: "Fetching properties...", progress: 40 },
      { stage: "Loading dashboard data...", progress: 60 },
      { stage: "Preparing interface...", progress: 80 },
      { stage: "Complete", progress: 100 },
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setLoadingStage(stages[currentStage].stage);
        setLoadingProgress(stages[currentStage].progress);
        currentStage++;
      } else {
        setIsPageLoading(false);
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return {
    isPageLoading,
    loadingProgress,
    loadingStage,
    setIsPageLoading,
  };
}
