/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Type guards and utilities for safe unknown type handling"
 * @dependencies []
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */

/**
 * Checks if error is an Error instance and returns typed error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Safely converts unknown error to string message
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'Unknown error occurred'
}

/**
 * Type guard for checking if object has expected properties
 */
export function hasProperty<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return obj !== null && typeof obj === 'object' && prop in obj
}

/**
 * Type guard for checking if object has confidence property
 */
export function hasConfidence(obj: unknown): obj is { confidence: number } {
  return hasProperty(obj, 'confidence') && typeof obj.confidence === 'number'
}

/**
 * Type guard for checking if object has choices property (OpenAI response)
 */
export function hasChoices(obj: unknown): obj is { choices: unknown[] } {
  return hasProperty(obj, 'choices') && Array.isArray(obj.choices)
}

/**
 * Type guard for checking if object looks like OpenAI message
 */
export function isOpenAIMessage(msg: unknown): msg is { role: string; content: string } {
  return (
    hasProperty(msg, 'role') &&
    hasProperty(msg, 'content') &&
    typeof msg.role === 'string' &&
    typeof msg.content === 'string'
  )
}

/**
 * Type guard for checking if array contains OpenAI messages
 */
export function isOpenAIMessageArray(messages: unknown): messages is Array<{ role: string; content: string }> {
  return Array.isArray(messages) && messages.every(isOpenAIMessage)
}

/**
 * Type guard for checking if object looks like Gemini content
 */
export function isGeminiContent(content: unknown): content is { parts: Array<{ text: string }> } {
  return (
    hasProperty(content, 'parts') &&
    Array.isArray(content.parts) &&
    content.parts.every(part => 
      hasProperty(part, 'text') && typeof part.text === 'string'
    )
  )
}

/**
 * Safely extract data from unknown response
 */
export function extractData<T>(response: unknown, fallback: T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response.data as T) || fallback
  }
  return fallback
}

/**
 * Create a safe type assertion function
 */
export function assertType<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  errorMessage: string
): T {
  if (guard(value)) {
    return value
  }
  throw new Error(errorMessage)
}