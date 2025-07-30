declare global {
  interface Window {
    google: {
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
            }
          }
        }
        event: {
          clearInstanceListeners: (instance: unknown) => void
        }
      }
    }
    initGooglePlaces: () => void
  }
}
