/**
 * @fileMetadata
 * @purpose Reusable hook for file upload functionality with progress tracking
 * @owner platform-team
 * @complexity medium
 * @tags ["hooks", "file-upload", "utilities", "reusable"]
 * @status active
 */

import { useState, useCallback } from 'react'
import { inputSanitizer } from '@/lib/security/input-sanitizer'
import { logger } from '@/lib/logger'

export type FileUploadState = {
  files: File[]
  previews: string[]
  uploading: boolean
  progress: number
  error: string | null
}

export type FileUploadConfig = {
  maxFiles?: number
  maxSizeBytes?: number
  allowedTypes?: string[]
  convertToBase64?: boolean
  generatePreviews?: boolean
}

const DEFAULT_CONFIG: Required<FileUploadConfig> = {
  maxFiles: 5,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  convertToBase64: true,
  generatePreviews: true,
}

export function useFileUpload(config: FileUploadConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [state, setState] = useState<FileUploadState>({
    files: [],
    previews: [],
    uploading: false,
    progress: 0,
    error: null,
  })

  const validateFile = useCallback((file: File): string | null => {
    // Validate file type
    if (!finalConfig.allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: ${finalConfig.allowedTypes.join(', ')}`
    }

    // Validate file size
    if (file.size > finalConfig.maxSizeBytes) {
      const maxSizeMB = finalConfig.maxSizeBytes / (1024 * 1024)
      return `File size exceeds ${maxSizeMB}MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    }

    // Sanitize file name for security
    const sanitizedName = inputSanitizer.sanitizeFileName(file.name)
    if (sanitizedName !== file.name) {
      logger.warn('File name was sanitized for security', {
        originalName: file.name,
        sanitizedName,
      })
    }

    return null
  }, [finalConfig])

  const generateFilePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve('') // No preview for non-images
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        resolve(result || '')
      }
      reader.onerror = () => reject(new Error('Failed to generate preview'))
      reader.readAsDataURL(file)
    })
  }, [])

  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1] || result
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to convert file to base64'))
      reader.readAsDataURL(file)
    })
  }, [])

  const addFiles = useCallback(async (filesToAdd: File[]) => {
    setState(prev => ({ ...prev, error: null, uploading: true, progress: 0 }))

    try {
      // Check total file count limit
      const totalFiles = state.files.length + filesToAdd.length
      if (totalFiles > finalConfig.maxFiles) {
        throw new Error(`Cannot add ${filesToAdd.length} files. Maximum ${finalConfig.maxFiles} files allowed.`)
      }

      // Validate all files first
      const validationErrors: string[] = []
      for (const file of filesToAdd) {
        const error = validateFile(file)
        if (error) {
          validationErrors.push(`${file.name}: ${error}`)
        }
      }

      if (validationErrors.length > 0) {
        throw new Error(`File validation failed:\n${validationErrors.join('\n')}`)
      }

      // Process files
      const newFiles: File[] = []
      const newPreviews: string[] = []
      const totalOperations = filesToAdd.length * (finalConfig.generatePreviews ? 2 : 1)
      let completedOperations = 0

      for (const file of filesToAdd) {
        newFiles.push(file)

        // Generate preview if needed
        if (finalConfig.generatePreviews) {
          try {
            const preview = await generateFilePreview(file)
            newPreviews.push(preview)
          } catch (error) {
            logger.warn('Failed to generate preview for file', { fileName: file.name, error })
            newPreviews.push('')
          }
          completedOperations++
          setState(prev => ({ ...prev, progress: (completedOperations / totalOperations) * 100 }))
        }

        // Convert to base64 if needed (for API upload, etc.)
        if (finalConfig.convertToBase64) {
          try {
            await convertToBase64(file)
          } catch (error) {
            logger.error('Failed to convert file to base64', { fileName: file.name, error })
          }
        }

        completedOperations++
        setState(prev => ({ ...prev, progress: (completedOperations / totalOperations) * 100 }))
      }

      setState(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles],
        previews: [...prev.previews, ...newPreviews],
        uploading: false,
        progress: 100,
      }))

      logger.info('Files added successfully', {
        fileCount: newFiles.length,
        fileNames: newFiles.map(f => f.name),
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        uploading: false,
        progress: 0,
      }))

      logger.error('File upload failed', { error })
    }
  }, [state.files.length, finalConfig, validateFile, generateFilePreview, convertToBase64])

  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
      previews: prev.previews.filter((_, i) => i !== index),
      error: null,
    }))

    logger.info('File removed', { index })
  }, [])

  const clearFiles = useCallback(() => {
    setState({
      files: [],
      previews: [],
      uploading: false,
      progress: 0,
      error: null,
    })

    logger.info('All files cleared')
  }, [])

  const getFilesAsBase64 = useCallback(async (): Promise<Array<{ name: string; type: string; data: string }>> => {
    const results: Array<{ name: string; type: string; data: string }> = []

    for (const file of state.files) {
      try {
        const base64Data = await convertToBase64(file)
        results.push({
          name: inputSanitizer.sanitizeFileName(file.name),
          type: file.type,
          data: base64Data,
        })
      } catch (error) {
        logger.error('Failed to convert file to base64 for export', { fileName: file.name, error })
      }
    }

    return results
  }, [state.files, convertToBase64])

  const handleDropzoneFiles = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      )
      setState(prev => ({ 
        ...prev, 
        error: `Some files were rejected:\n${errors.join('\n')}` 
      }))
    }

    if (acceptedFiles.length > 0) {
      addFiles(acceptedFiles)
    }
  }, [addFiles])

  return {
    // State
    files: state.files,
    previews: state.previews,
    uploading: state.uploading,
    progress: state.progress,
    error: state.error,
    
    // Actions
    addFiles,
    removeFile,
    clearFiles,
    
    // Utilities
    getFilesAsBase64,
    handleDropzoneFiles,
    
    // Config
    config: finalConfig,
    
    // Computed values
    hasFiles: state.files.length > 0,
    canAddMore: state.files.length < finalConfig.maxFiles,
    remainingSlots: finalConfig.maxFiles - state.files.length,
  }
}