# Property Wizard Modal - Archived

## Status: Temporarily Disabled
**Date Archived:** January 2025
**Reason:** Per user request - not needed for current implementation

## Description
Multi-step property creation wizard that collects comprehensive property information from users including:
- Property Type (Single Family, Condo, Townhouse, Multi-Family)
- Property Name (Optional)
- Year Built
- Square Footage  
- Bedrooms & Bathrooms
- Additional property details across 5 steps

## Files Involved
1. **Component:** `/apps/web/src/components/property/property-wizard.tsx`
2. **Usage:** `/apps/web/src/app/dashboard/page.tsx`
3. **Other References:** 
   - `/apps/web/src/app/dashboard/property/page.tsx`
   - `/apps/web/src/components/onboarding/property-setup-wizard.tsx`

## How to Re-enable

### Step 1: Uncomment the modal in dashboard
In `/apps/web/src/app/dashboard/page.tsx`:

1. Around line 1007-1030, uncomment the PropertyWizard rendering:
```tsx
{showPropertyWizard && (
  <PropertySetupWizard
    onComplete={() => {
      setShowPropertyWizard(false);
      onboarding.markStepComplete("property");
      toast.success(
        "Property added successfully! Your dashboard is now personalized.",
      );
      // Show AI Tools intro next
      setShowAIToolsIntro(true);
    }}
    onSkip={() => {
      setShowPropertyWizard(false);
      localStorage.setItem(
        "property_wizard_skipped",
        Date.now().toString(),
      );
    }}
  />
)}
```

2. Around line 341, uncomment the auto-trigger:
```tsx
setShowPropertyWizard(true);
```

3. Around line 443-447, restore the button click handler:
```tsx
onClick={() => setShowPropertyWizard(true)}
```

### Step 2: Ensure imports are present
Make sure these imports exist in the dashboard page:
```tsx
import { PropertySetupWizard } from "@/components/onboarding/property-setup-wizard";
// or
import { PropertyWizard } from "@/components/property/property-wizard";
```

## Key Features
- **Multi-step form** with progress indicator (20% per step)
- **Skip for Now** option for users who want to defer
- **Validation** on required fields
- **Modern UI** with dark theme styling
- **Responsive** design for mobile and desktop

## Component State
The wizard maintains the following state:
- `showPropertyWizard`: Boolean to control modal visibility
- Property data collection across 5 steps
- Integration with onboarding flow
- LocalStorage tracking for skipped wizards

## Notes
- The wizard was part of the onboarding flow for new users
- It automatically triggered for users without properties
- Can be manually triggered via "Add Property" button
- Integrates with the broader onboarding system including welcome tours and AI tools introduction