# AI Tools System - Claude.md

## Overview
ClaimGuardian's AI tools provide property owners with AI-powered assistance for insurance claims, damage assessment, and property management.

## Architecture
- **Unified AI Services**: `@claimguardian/ai-services` package
- **Multi-Provider Support**: OpenAI GPT-4, Google Gemini Pro 1.5
- **Edge Functions**: Deno runtime for AI processing
- **Cost Tracking**: Token usage and expense monitoring
- **Semantic Caching**: Redis-based response caching
- **Performance**: 99% test success rate, optimized for production

## AI Tools Catalog

### Core Analysis Tools
1. **Damage Analyzer** (`/damage-analyzer/`) - Photo-based damage assessment
2. **Policy Chat** (`/policy-chat/`) - Interactive document chat
3. **Settlement Analyzer** (`/settlement-analyzer/`) - Offer analysis
4. **Evidence Organizer** (`/evidence-organizer/`) - Auto-categorization

### Advanced Tools
1. **AR Damage Documenter** (`/ar-damage-documenter/`) - AR-enhanced documentation
2. **Guided Property Inspection** (`/guided-property-inspection/`) - Step-by-step inspection
3. **Material Finish Analyzer** (`/material-finish-analyzer/`) - Surface analysis
4. **Room Builder** (`/room-builder/`) - 3D room reconstruction

### Communication Tools
1. **Communication Helper** (`/communication-helper/`) - Email templates
2. **Document Generator** (`/document-generator/`) - AI content generation
3. **Claim Assistant** (`/claim-assistant/`) - Step-by-step guidance
4. **Receipt Scanner** (`/receipt-scanner/`) - OCR processing

## Key Components

### Enhanced Damage Analyzer Pattern
```typescript
interface EnhancedDamageAnalyzerProps {
  onAnalysisComplete?: (result: AIAnalysisResult) => void
  propertyId?: string
  policyData?: Record<string, unknown> // Use undefined, not null
}

// Always use undefined for optional props
<EnhancedDamageAnalyzer
  onAnalysisComplete={(result) => {
    toast.success('Analysis completed')
    console.log('Result:', result)
  }}
  propertyId="property-uuid"
  policyData={undefined} // ✅ Correct
  // policyData={null}   // ❌ TypeScript error
/>
```

### AI Model Selection Pattern
```typescript
const [selectedAIModel, setSelectedAIModel] = useState<'gpt4-vision' | 'gemini-vision'>('gpt4-vision')

<Select
  value={selectedAIModel}
  onValueChange={(value: 'gpt4-vision' | 'gemini-vision') => setSelectedAIModel(value)}
>
  <SelectContent>
    <SelectItem value="gpt4-vision">GPT-4 Vision (Recommended)</SelectItem>
    <SelectItem value="gemini-vision">Gemini Vision</SelectItem>
  </SelectContent>
</Select>
```

### Camera Integration Pattern
```typescript
// Use CameraCapture component for consistent camera access
const [showCameraCapture, setShowCameraCapture] = useState(false)

const handleCameraCapture = async (file: File) => {
  // Process captured image
  const dataUrl = await fileToDataUrl(file)
  // Handle the captured image
  setShowCameraCapture(false)
}

{showCameraCapture && (
  <CameraCapture
    onClose={() => setShowCameraCapture(false)}
    onCapture={handleCameraCapture}
  />
)}
```

## File Organization

### Page Structure
```
/ai-tools/
├── page.tsx                    # Main AI tools hub
├── [tool-name]/
│   └── page.tsx                # Individual tool page
└── claude.md                   # This documentation
```

### Component Structure
```
/components/
├── ai/                         # AI-specific components
│   ├── enhanced-damage-analyzer.tsx
│   └── camera-capture.tsx
├── ui/                         # Shared UI components
└── forms/                      # Form components
```

## Common Patterns

### Import Fixes for Lucide React
```typescript
// ✅ Always import from package root
import {
  Camera, Upload, Brain, Target,
  // ... other icons
} from 'lucide-react'

// ❌ Never import from subpaths
import { Camera } from 'lucide-react/dist/esm/icons/camera'
```

### Type Safety for AI Results
```typescript
interface AIAnalysisResult {
  damageAssessment: {
    type: string
    severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical'
    confidence: number
    description: string
  }
  policyComparison: {
    isCovered: boolean
    estimatedPayout: number
    explanation: string
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}
```

### Progress Tracking Pattern
```typescript
const [analysisProgress, setAnalysisProgress] = useState(0)

const progressSteps = [
  { step: 10, message: 'Processing images...' },
  { step: 30, message: 'Detecting damage patterns...' },
  { step: 50, message: 'Analyzing severity...' },
  { step: 70, message: 'Comparing with policy...' },
  { step: 90, message: 'Generating recommendations...' },
  { step: 100, message: 'Analysis complete!' }
]
```

## Edge Functions Integration

### AI Processing Functions
- `ai-document-extraction` - Extract data from documents
- `analyze-damage-with-policy` - Damage analysis with policy context
- `ar-drone-processor` - AR/drone imagery processing
- `policy-chat` - Interactive document chat
- `ocr-document` - OCR processing

### Calling Edge Functions
```typescript
const { data, error } = await supabase.functions.invoke('analyze-damage-with-policy', {
  body: {
    images: imageFiles,
    policyData: userPolicy,
    propertyId: currentProperty.id
  }
})
```

## Performance Considerations

### Image Optimization
- Compress images before AI processing
- Use WebP format when possible
- Implement lazy loading for gallery views
- Cache analysis results to avoid reprocessing

### AI Cost Management
- Track token usage per request
- Implement request rate limiting
- Cache common analysis results
- Use appropriate model sizes

## Error Handling

### AI Service Errors
```typescript
try {
  const result = await aiService.analyzeImage(imageData)
  setAnalysisResult(result)
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    toast.error('Too many requests. Please try again later.')
  } else if (error.code === 'INVALID_API_KEY') {
    toast.error('AI service unavailable. Please contact support.')
  } else {
    toast.error('Analysis failed. Please try again.')
  }
}
```

## Testing AI Tools
1. Test with various image types and sizes
2. Verify error handling for API failures
3. Check progress indicators work correctly
4. Test camera capture on different devices
5. Validate analysis result formatting

## Dependencies
- `@claimguardian/ai-services` - AI orchestration
- `next/image` - Optimized image handling
- `lucide-react` - Icons (import from root)
- `sonner` - Toast notifications
- `@supabase/supabase-js` - Edge Functions calls
