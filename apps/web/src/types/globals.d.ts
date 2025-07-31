// Global type declarations for Google Maps and Window extensions

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => {
            addListener: (event: string, callback: () => void) => void
            getPlace: () => { 
              address_components?: Array<{ 
                types: string[]
                long_name: string
                short_name: string 
              }>
              formatted_address?: string
              geometry?: { location: { lat: () => number, lng: () => number } }
            }
          }
        }
        event: {
          clearInstanceListeners: (instance: object) => void
        }
      }
    }
    initGooglePlaces?: () => void
  }
  
  namespace google {
    namespace maps {
      namespace places {
        class Autocomplete {
          constructor(input: HTMLInputElement, options?: Record<string, unknown>)
          addListener(event: string, callback: () => void): void
          getPlace(): {
            address_components?: Array<{
              types: string[]
              long_name: string
              short_name: string
            }>
            formatted_address?: string
            geometry?: { location: { lat: () => number, lng: () => number } }
          }
        }
      }
    }
  }
}

export {}
