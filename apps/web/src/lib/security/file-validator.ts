/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
/**
 * File Upload Security Validator
 * Validates files before upload to prevent security issues
 */

export interface FileValidationConfig {
  maxSize: number // in bytes
  allowedTypes: string[]
  allowedExtensions: string[]
  scanForMalware?: boolean
}

export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.pl', '.py', '.rb', '.sh', '.ps1'
]

// File type configurations
export const FILE_CONFIGS = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  },
  document: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.doc', '.docx']
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    allowedExtensions: ['.mp4', '.mov', '.avi']
  }
}

export function validateFile(
  file: { name: string; size: number; type: string },
  config: FileValidationConfig
): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check file size
  if (file.size > config.maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of ${(config.maxSize / 1024 / 1024).toFixed(1)}MB`)
  }

  // Check MIME type
  if (!config.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!config.allowedExtensions.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed`)
  }

  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    errors.push(`Dangerous file type detected: ${extension}`)
  }

  // Check for suspicious patterns
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push('File name contains suspicious characters')
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const nameParts = file.name.split('.')
  if (nameParts.length > 2) {
    const secondExtension = '.' + nameParts[nameParts.length - 2].toLowerCase()
    if (DANGEROUS_EXTENSIONS.includes(secondExtension)) {
      errors.push('File has suspicious double extension')
    }
  }

  // Warnings for large files
  if (file.size > config.maxSize * 0.8) {
    warnings.push('File is approaching size limit')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Pre-configured validators
export const validateImage = (file: { name: string; size: number; type: string }) =>
  validateFile(file, FILE_CONFIGS.image)

export const validateDocument = (file: { name: string; size: number; type: string }) =>
  validateFile(file, FILE_CONFIGS.document)

export const validateVideo = (file: { name: string; size: number; type: string }) =>
  validateFile(file, FILE_CONFIGS.video)
