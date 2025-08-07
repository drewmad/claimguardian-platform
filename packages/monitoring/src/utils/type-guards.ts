/**
 * @fileMetadata
 * @owner @monitoring-team
 * @purpose "Type guards for browser performance APIs and monitoring"
 * @dependencies []
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */

/**
 * Type guard for LayoutShift entries
 */

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: unknown[];
}

export interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  target: Element;
}

/**
 * Type guard for LayoutShift entries
 */
export function isLayoutShift(entry: PerformanceEntry): entry is LayoutShift {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'value' in entry &&
    'hadRecentInput' in entry &&
    typeof (entry as LayoutShift).value === 'number'
  )
}

/**
 * Type guard for FirstInput entries
 */
export function isFirstInput(entry: PerformanceEntry): entry is PerformanceEventTiming {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'processingStart' in entry &&
    'processingEnd' in entry &&
    'startTime' in entry &&
    typeof (entry as PerformanceEventTiming).processingStart === 'number' &&
    typeof (entry as PerformanceEventTiming).processingEnd === 'number'
  )
}

/**
 * Type guard for Performance entries
 */
export function isPerformanceEntry(entry: unknown): entry is PerformanceEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'name' in entry &&
    'entryType' in entry &&
    'startTime' in entry &&
    'duration' in entry
  )
}

/**
 * Type guard for checking if object has error message
 */
export function hasErrorMessage(obj: unknown): obj is { message: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof (obj as { message: unknown }).message === 'string'
  )
}

/**
 * Type guard for checking if error has stack trace
 */
export function hasStack(obj: unknown): obj is { stack: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'stack' in obj &&
    typeof (obj as { stack: unknown }).stack === 'string'
  )
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (hasErrorMessage(error)) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

/**
 * Type guard for Supabase response with data
 */
export function hasSupabaseData<T>(response: unknown): response is { data: T } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response
  )
}

/**
 * Type guard for checking if response has error
 */
export function hasSupabaseError(response: unknown): response is { error: { message: string } } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    (response as { error: unknown }).error !== null &&
    typeof (response as { error: unknown }).error === 'object' &&
    'message' in ((response as { error: unknown }).error as { message: unknown })
  )
}
