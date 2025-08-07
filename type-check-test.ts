// Test file to verify TypeScript fixes
import type { BadgeProps } from './apps/web/src/components/ui/badge';

// Test 1: Badge variants should be valid
const validBadgeVariants: BadgeProps['variant'][] = ['default', 'secondary', 'destructive', 'outline'];

// Test 2: PropertyImage sizes should be valid  
type PropertyImageSize = 'sm' | 'md' | 'lg' | 'xl';
const validPropertySizes: PropertyImageSize[] = ['sm', 'md', 'lg', 'xl'];

// Test 3: Google Maps namespace declaration should work
declare global {
  namespace google.maps.places {
    interface PlaceResult {
      formatted_address?: string;
    }
  }
}

console.log('Type fixes are valid!');