/**
 * @fileMetadata
 * @purpose Reusable modal state management hook with common patterns
 * @owner platform-team
 * @complexity low
 * @tags ["hooks", "modal", "state-management", "reusable"]
 * @status active
 */

import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

export type ModalState = {
  isOpen: boolean
  loading: boolean
  error: string | null
  data: any
}

export type ModalConfig = {
  closeOnEscape?: boolean
  closeOnOutsideClick?: boolean
  preventClose?: boolean
  logInteractions?: boolean
}

const DEFAULT_CONFIG: Required<ModalConfig> = {
  closeOnEscape: true,
  closeOnOutsideClick: true,
  preventClose: false,
  logInteractions: true,
}

export function useModal<T = any>(
  modalName?: string,
  config: ModalConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    loading: false,
    error: null,
    data: null,
  })

  // Open modal with optional data
  const open = useCallback((data?: T) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      data: data || null,
      error: null, // Clear any previous errors
    }))

    if (finalConfig.logInteractions && modalName) {
      logger.info(`Modal opened: ${modalName}`, { data })
    }
  }, [finalConfig.logInteractions, modalName])

  // Close modal
  const close = useCallback(() => {
    if (finalConfig.preventClose || state.loading) {
      return
    }

    setState(prev => ({
      ...prev,
      isOpen: false,
      error: null,
    }))

    if (finalConfig.logInteractions && modalName) {
      logger.info(`Modal closed: ${modalName}`)
    }
  }, [finalConfig.preventClose, finalConfig.logInteractions, modalName, state.loading])

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
    
    if (error && finalConfig.logInteractions && modalName) {
      logger.warn(`Modal error: ${modalName}`, { error })
    }
  }, [finalConfig.logInteractions, modalName])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Update modal data
  const updateData = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setState(prev => ({
      ...prev,
      data: typeof updates === 'function' 
        ? { ...prev.data, ...updates(prev.data) }
        : { ...prev.data, ...updates }
    }))
  }, [])

  // Handle async operations with loading/error states
  const handleAsync = useCallback(async <R>(
    operation: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: Error) => void
  ): Promise<R | null> => {
    setLoading(true)
    clearError()

    try {
      const result = await operation()
      
      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)

      if (onError && error instanceof Error) {
        onError(error)
      }

      if (finalConfig.logInteractions && modalName) {
        logger.error(`Modal async operation failed: ${modalName}`, { error })
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, clearError, setError, finalConfig.logInteractions, modalName])

  // Handle keyboard events
  useEffect(() => {
    if (!state.isOpen || !finalConfig.closeOnEscape) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.isOpen, finalConfig.closeOnEscape, close])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (state.isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [state.isOpen])

  // Handle outside click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (finalConfig.closeOnOutsideClick && event.target === event.currentTarget) {
      close()
    }
  }, [finalConfig.closeOnOutsideClick, close])

  // Submit handler that manages loading/error states
  const handleSubmit = useCallback(async <R>(
    submitFn: () => Promise<R>,
    onSuccess?: (result: R) => void,
    closeOnSuccess: boolean = true
  ) => {
    const result = await handleAsync(
      submitFn,
      (result) => {
        if (onSuccess) {
          onSuccess(result)
        }
        if (closeOnSuccess) {
          close()
        }
      }
    )
    return result
  }, [handleAsync, close])

  // Create props object for modal components
  const modalProps = {
    isOpen: state.isOpen,
    onClose: close,
    onBackdropClick: handleBackdropClick,
  }

  // Create props object for form components
  const formProps = {
    loading: state.loading,
    error: state.error,
    onSubmit: handleSubmit,
    onError: setError,
    onClearError: clearError,
  }

  return {
    // State
    isOpen: state.isOpen,
    loading: state.loading,
    error: state.error,
    data: state.data as T,

    // Actions
    open,
    close,
    setLoading,
    setError,
    clearError,
    updateData,

    // Utilities
    handleAsync,
    handleSubmit,
    handleBackdropClick,

    // Props helpers
    modalProps,
    formProps,

    // Configuration
    config: finalConfig,
  }
}

// Convenience hook for confirmation modals
export function useConfirmationModal(modalName?: string) {
  const modal = useModal<{
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void | Promise<void>
    onCancel?: () => void
  }>(modalName)

  const confirm = useCallback((
    message: string,
    onConfirm: () => void | Promise<void>,
    options: {
      title?: string
      confirmText?: string
      cancelText?: string
    } = {}
  ) => {
    modal.open({
      title: options.title || 'Confirm Action',
      message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm,
    })
  }, [modal])

  const handleConfirm = useCallback(async () => {
    if (modal.data?.onConfirm) {
      await modal.handleAsync(
        () => Promise.resolve(modal.data.onConfirm()),
        () => modal.close()
      )
    }
  }, [modal])

  const handleCancel = useCallback(() => {
    if (modal.data?.onCancel) {
      modal.data.onCancel()
    }
    modal.close()
  }, [modal])

  return {
    ...modal,
    confirm,
    handleConfirm,
    handleCancel,
  }
}