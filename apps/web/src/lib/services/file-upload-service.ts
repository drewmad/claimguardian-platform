/**
 * @fileMetadata
 * @purpose "Service for uploading files to Supabase Storage"
 * @owner data-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["fileUploadService"]
 * @complexity medium
 * @tags ["service", "storage", "file-upload"]
 * @status stable
 */

import type { StorageFile } from './types'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export interface FileUploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface FileValidation {
  maxSize: number // in bytes
  allowedTypes: string[]
}

const DEFAULT_VALIDATION: FileValidation = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
}

class FileUploadService {
  private supabase = createClient()
  private bucketName = 'policy-documents'

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File, 
    folder: string = 'general',
    validation: FileValidation = DEFAULT_VALIDATION
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validationResult = this.validateFile(file, validation)
      if (!validationResult.success) {
        return validationResult
      }

      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        logger.error('User not authenticated for file upload', { error: userError })
        return { success: false, error: 'User not authenticated' }
      }

      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}_${sanitizedName}`
      const filePath = `${user.id}/${folder}/${fileName}`

      logger.info('Uploading file to storage', { 
        fileName, 
        filePath, 
        fileSize: file.size,
        fileType: file.type 
      })

      // Upload file
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        logger.error('Failed to upload file', { error, filePath })
        return { success: false, error: error.message }
      }

      // Get public URL (even though bucket is private, we get signed URL)
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      logger.info('File uploaded successfully', { filePath, url: urlData.publicUrl })

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      }
    } catch (error) {
      logger.error('Unexpected error during file upload', { error })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    folder: string = 'general',
    validation: FileValidation = DEFAULT_VALIDATION
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = []
    
    for (const file of files) {
      const result = await this.uploadFile(file, folder, validation)
      results.push(result)
    }

    return results
  }

  /**
   * Get a signed URL for a private file
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        logger.error('Failed to create signed URL', { error, filePath })
        return null
      }

      return data.signedUrl
    } catch (error) {
      logger.error('Unexpected error creating signed URL', { error })
      return null
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        logger.error('Failed to delete file', { error, filePath })
        return false
      }

      logger.info('File deleted successfully', { filePath })
      return true
    } catch (error) {
      logger.error('Unexpected error deleting file', { error })
      return false
    }
  }

  /**
   * List files in a user's folder
   */
  async listUserFiles(userId: string, folder: string = ''): Promise<StorageFile[]> {
    try {
      const prefix = folder ? `${userId}/${folder}` : userId
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(prefix)

      if (error) {
        logger.error('Failed to list files', { error, prefix })
        return []
      }

      return data || []
    } catch (error) {
      logger.error('Unexpected error listing files', { error })
      return []
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File, validation: FileValidation): FileUploadResult {
    // Check file size
    if (file.size > validation.maxSize) {
      const maxSizeMB = Math.round(validation.maxSize / (1024 * 1024))
      return { 
        success: false, 
        error: `File size exceeds ${maxSizeMB}MB limit` 
      }
    }

    // Check file type
    if (!validation.allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        error: `File type ${file.type} not allowed. Allowed types: ${validation.allowedTypes.join(', ')}` 
      }
    }

    // Check filename length
    if (file.name.length > 255) {
      return { 
        success: false, 
        error: 'Filename too long (max 255 characters)' 
      }
    }

    return { success: true }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string) {
    try {
      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      return data
    } catch (error) {
      logger.error('Unexpected error getting file metadata', { error, filePath })
      return null
    }
  }
}

export const fileUploadService = new FileUploadService()

// Export validation constants for reuse
export const POLICY_DOCUMENT_VALIDATION: FileValidation = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
}