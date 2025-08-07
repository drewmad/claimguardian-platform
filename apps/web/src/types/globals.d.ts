/**
 * @fileMetadata
 * @owner platform-team
 * @purpose "Global type declarations for the web application including Google Maps and Jest DOM matchers"
 * @dependencies ["@testing-library/jest-dom", "react", "next"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
// Global type declarations for Google Maps and Window extensions

declare global {
  // Jest DOM matchers extension
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveFocus(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveStyle(style: string | Record<string, any>): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toHaveValue(value: string | number): R;
    }
  }

  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: unknown) => void;
      getCurrentHub?: () => {
        getClient?: () => {
          getOptions?: () => {
            enabled?: boolean;
          };
        };
      };
    };
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options: Record<string, unknown>,
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => {
              address_components?: Array<{
                types: string[];
                long_name: string;
                short_name: string;
              }>;
              formatted_address?: string;
              geometry?: { location: { lat: () => number; lng: () => number } };
            };
          };
        };
        event: {
          clearInstanceListeners: (instance: object) => void;
        };
      };
    };
    initGooglePlaces?: () => void;
  }

  namespace google {
    namespace maps {
      namespace places {
        class Autocomplete {
          constructor(
            input: HTMLInputElement,
            options?: Record<string, unknown>,
          );
          addListener(event: string, callback: () => void): void;
          getPlace(): {
            address_components?: Array<{
              types: string[];
              long_name: string;
              short_name: string;
            }>;
            formatted_address?: string;
            geometry?: { location: { lat: () => number; lng: () => number } };
          };
        }
      }
      namespace event {
        function clearInstanceListeners(instance: object): void;
      }
    }
  }
}

export {};
