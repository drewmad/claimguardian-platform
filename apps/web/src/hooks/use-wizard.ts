/**
 * @fileMetadata
 * @purpose Reusable wizard/stepper hook for multi-step forms and workflows
 * @owner platform-team
 * @complexity medium
 * @tags ["hooks", "wizard", "stepper", "form", "reusable"]
 * @status active
 */

import { useState, useCallback, useMemo } from 'react'
import { logger } from '@/lib/logger'

export type WizardStep = {
  id: string
  title: string
  description?: string
  isValid?: boolean
  isOptional?: boolean
}

export type WizardState<T = any> = {
  currentStep: number
  steps: WizardStep[]
  data: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isCompleted: boolean
}

export type WizardConfig = {
  validateOnNext?: boolean
  resetOnComplete?: boolean
  persistData?: boolean
  storageKey?: string
}

const DEFAULT_CONFIG: Required<WizardConfig> = {
  validateOnNext: true,
  resetOnComplete: false,
  persistData: false,
  storageKey: 'wizard-data',
}

export function useWizard<T extends Record<string, any>>(
  steps: WizardStep[],
  initialData: T,
  config: WizardConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Load persisted data if enabled
  const getInitialData = useCallback(() => {
    if (finalConfig.persistData && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(finalConfig.storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          return { ...initialData, ...parsed }
        }
      } catch (error) {
        logger.warn('Failed to load persisted wizard data', { error })
      }
    }
    return initialData
  }, [initialData, finalConfig])

  const [state, setState] = useState<WizardState<T>>(() => ({
    currentStep: 0,
    steps: steps.map((step, index) => ({ ...step, isValid: index === 0 })),
    data: getInitialData(),
    errors: {},
    touched: {},
    isCompleted: false,
  }))

  // Persist data when it changes
  const persistData = useCallback((data: T) => {
    if (finalConfig.persistData && typeof window !== 'undefined') {
      try {
        localStorage.setItem(finalConfig.storageKey, JSON.stringify(data))
      } catch (error) {
        logger.warn('Failed to persist wizard data', { error })
      }
    }
  }, [finalConfig])

  // Update wizard data
  const updateData = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setState(prev => {
      const newData = typeof updates === 'function' 
        ? { ...prev.data, ...updates(prev.data) }
        : { ...prev.data, ...updates }
      
      persistData(newData)
      
      return {
        ...prev,
        data: newData,
      }
    })
  }, [persistData])

  // Set field value with touch tracking
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [field]: value }
      persistData(newData)
      
      return {
        ...prev,
        data: newData,
        touched: { ...prev.touched, [field]: true },
        errors: { ...prev.errors, [field]: '' }, // Clear error when value changes
      }
    })
  }, [persistData])

  // Set field error
  const setFieldError = useCallback((field: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }))
  }, [])

  // Clear field error
  const clearFieldError = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: '' },
    }))
  }, [])

  // Validate current step
  const validateStep = useCallback((stepIndex: number, data: T): boolean => {
    // This is a basic validation - can be extended with custom validators
    const step = steps[stepIndex]
    if (!step) return false

    // Check if step is marked as valid
    if (step.isValid === false) return false

    // For optional steps, always return true
    if (step.isOptional) return true

    // Custom validation can be added here based on step requirements
    return true
  }, [steps])

  // Go to next step
  const nextStep = useCallback(() => {
    setState(prev => {
      const currentStepIndex = prev.currentStep
      const isCurrentStepValid = finalConfig.validateOnNext 
        ? validateStep(currentStepIndex, prev.data)
        : true

      if (!isCurrentStepValid) {
        logger.warn('Cannot proceed: current step is invalid', { currentStep: currentStepIndex })
        return prev
      }

      const nextStepIndex = Math.min(currentStepIndex + 1, prev.steps.length - 1)
      const isLastStep = nextStepIndex === prev.steps.length - 1

      logger.info('Wizard step advanced', { 
        from: currentStepIndex, 
        to: nextStepIndex,
        stepTitle: prev.steps[nextStepIndex]?.title 
      })

      return {
        ...prev,
        currentStep: nextStepIndex,
        isCompleted: isLastStep,
      }
    })
  }, [finalConfig.validateOnNext, validateStep])

  // Go to previous step
  const prevStep = useCallback(() => {
    setState(prev => {
      const prevStepIndex = Math.max(prev.currentStep - 1, 0)
      
      logger.info('Wizard step reversed', { 
        from: prev.currentStep, 
        to: prevStepIndex,
        stepTitle: prev.steps[prevStepIndex]?.title 
      })

      return {
        ...prev,
        currentStep: prevStepIndex,
        isCompleted: false,
      }
    })
  }, [])

  // Go to specific step
  const goToStep = useCallback((stepIndex: number) => {
    setState(prev => {
      const targetStep = Math.max(0, Math.min(stepIndex, prev.steps.length - 1))
      
      logger.info('Wizard jumped to step', { 
        from: prev.currentStep, 
        to: targetStep,
        stepTitle: prev.steps[targetStep]?.title 
      })

      return {
        ...prev,
        currentStep: targetStep,
        isCompleted: targetStep === prev.steps.length - 1,
      }
    })
  }, [])

  // Mark step as valid/invalid
  const setStepValid = useCallback((stepIndex: number, isValid: boolean) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map((step, index) => 
        index === stepIndex ? { ...step, isValid } : step
      ),
    }))
  }, [])

  // Reset wizard
  const reset = useCallback(() => {
    setState({
      currentStep: 0,
      steps: steps.map((step, index) => ({ ...step, isValid: index === 0 })),
      data: initialData,
      errors: {},
      touched: {},
      isCompleted: false,
    })

    // Clear persisted data
    if (finalConfig.persistData && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(finalConfig.storageKey)
      } catch (error) {
        logger.warn('Failed to clear persisted wizard data', { error })
      }
    }

    logger.info('Wizard reset')
  }, [steps, initialData, finalConfig])

  // Complete wizard
  const complete = useCallback((onComplete?: (data: T) => void | Promise<void>) => {
    setState(prev => ({ ...prev, isCompleted: true }))
    
    logger.info('Wizard completed', { data: state.data })
    
    if (onComplete) {
      const result = onComplete(state.data)
      if (result instanceof Promise) {
        result.catch(error => {
          logger.error('Wizard completion handler failed', { error })
        })
      }
    }

    if (finalConfig.resetOnComplete) {
      setTimeout(reset, 100) // Reset after completion handlers run
    }
  }, [state.data, finalConfig.resetOnComplete, reset])

  // Computed values
  const computed = useMemo(() => {
    const currentStepData = state.steps[state.currentStep]
    const hasErrors = Object.values(state.errors).some(error => error.length > 0)
    const canGoNext = state.currentStep < state.steps.length - 1
    const canGoPrev = state.currentStep > 0
    const isFirstStep = state.currentStep === 0
    const isLastStep = state.currentStep === state.steps.length - 1
    const completionPercentage = ((state.currentStep + 1) / state.steps.length) * 100

    return {
      currentStepData,
      hasErrors,
      canGoNext,
      canGoPrev,
      isFirstStep,
      isLastStep,
      completionPercentage,
      totalSteps: state.steps.length,
      currentStepNumber: state.currentStep + 1,
    }
  }, [state])

  return {
    // State
    currentStep: state.currentStep,
    steps: state.steps,
    data: state.data,
    errors: state.errors,
    touched: state.touched,
    isCompleted: state.isCompleted,

    // Actions
    nextStep,
    prevStep,
    goToStep,
    reset,
    complete,

    // Data management
    updateData,
    setFieldValue,
    setFieldError,
    clearFieldError,
    setStepValid,

    // Validation
    validateStep: (stepIndex?: number) => validateStep(stepIndex ?? state.currentStep, state.data),

    // Computed values
    ...computed,
  }
}