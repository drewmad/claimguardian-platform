/**
 * @fileMetadata
 * @purpose "Centralized Google Maps API loading and management hook"
 * @owner frontend-team
 * @dependencies ["react"]
 * @exports ["useGoogleMaps"]
 * @complexity medium
 * @tags ["hook", "google-maps", "geocoding"]
 * @status stable
 */

import { useEffect, useState, useCallback } from 'react'

interface GoogleMapsConfig {
  libraries?: string[]
  language?: string
  region?: string
}

interface UseGoogleMapsReturn {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  loadError: boolean
}

/**
 * Centralized hook for loading Google Maps JavaScript API
 * 
 * @param config Configuration options for Google Maps API
 * @returns Object with loading state and error information
 * 
 * @example
 * ```tsx
 * const { isLoaded, isLoading, error } = useGoogleMaps({
 *   libraries: ['places']
 * })
 * 
 * if (isLoaded) {
 *   // Google Maps API is ready to use
 *   const autocomplete = new google.maps.places.Autocomplete(...)
 * }
 * ```
 */
export function useGoogleMaps(config: GoogleMapsConfig = { libraries: ['places'] }): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  const loadGoogleMaps = useCallback(async () => {
    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true)
      return
    }

    // Check if already loading
    if (isLoading) return

    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setError('Google Maps API key not configured')
      setLoadError(true)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Script exists, wait for it to load
        if (window.google?.maps) {
          setIsLoaded(true)
          setIsLoading(false)
          return
        }
        
        // Wait for existing script to finish loading
        await new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(checkInterval)
              resolve(true)
            }
          }, 100)
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval)
            reject(new Error('Google Maps API loading timeout'))
          }, 10000)
        })
        
        setIsLoaded(true)
        setIsLoading(false)
        return
      }

      // Create new script element
      const script = document.createElement('script')
      const libraries = config.libraries?.join(',') || 'places'
      const language = config.language || 'en'
      const region = config.region || 'US'
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&language=${language}&region=${region}&callback=initGoogleMaps`
      script.async = true
      script.defer = true

      // Create global callback
      const callbackName = 'initGoogleMaps'
      ;(window as Record<string, unknown>)[callbackName] = () => {
        // Check if Google Maps loaded successfully
        if (window.google?.maps) {
          setIsLoaded(true)
          setIsLoading(false)
        } else {
          setError('Google Maps API loaded but is not available')
          setLoadError(true)
          setIsLoading(false)
        }
        // Clean up callback
        delete (window as Record<string, unknown>)[callbackName]
      }

      // Handle script loading errors
      script.onerror = () => {
        setError('Failed to load Google Maps API script')
        setLoadError(true)
        setIsLoading(false)
        delete (window as Record<string, unknown>)[callbackName]
      }

      // Add script to document
      document.head.appendChild(script)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading Google Maps'
      setError(errorMessage)
      setLoadError(true)
      setIsLoading(false)
    }
  }, [config.libraries, config.language, config.region, isLoading])

  useEffect(() => {
    loadGoogleMaps()
  }, [loadGoogleMaps])

  return {
    isLoaded,
    isLoading,
    error,
    loadError
  }
}

/**
 * Hook specifically for Google Places Autocomplete
 * Includes additional setup for autocomplete functionality
 */
export function useGooglePlaces() {
  const mapsState = useGoogleMaps({ libraries: ['places'] })
  
  return {
    ...mapsState,
    createAutocomplete: useCallback((
      input: HTMLInputElement,
      options: Record<string, unknown> = {}
    ) => {
      if (!mapsState.isLoaded || !window.google?.maps?.places) {
        throw new Error('Google Places API not loaded')
      }

      const defaultOptions = {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry', 'place_id']
      }

      return new google.maps.places.Autocomplete(input, {
        ...defaultOptions,
        ...options
      })
    }, [mapsState.isLoaded])
  }
}