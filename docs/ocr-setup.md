# OCR (Optical Character Recognition) Setup

This guide covers the OCR capabilities added to ClaimGuardian for scanning receipts, invoices, estimates, and other documents.

## Overview

The OCR feature allows users to:
- Extract text from images using AI-powered vision models
- Parse structured data from receipts, invoices, and estimates
- Track expenses for insurance claims
- Save and organize scanned documents

## Architecture

### Components

1. **Edge Function**: `ocr-document`
   - Uses Gemini Vision API for text extraction
   - Supports multiple document types
   - Returns both raw text and structured data

2. **Client Service**: `ocr-service.ts`
   - Handles file uploads to temporary storage
   - Calls Edge Function for processing
   - Manages usage tracking

3. **UI Component**: `ocr-scanner.tsx`
   - Camera capture integration
   - File upload support
   - Results display with structured data

4. **Receipt Scanner Page**: `/ai-tools/receipt-scanner`
   - Complete receipt scanning workflow
   - Session-based expense tracking
   - Export capabilities

## Supported Document Types

- **Receipts**: Merchant info, items, totals
- **Invoices**: Vendor/client info, line items, terms
- **Estimates**: Contractor info, scope of work, pricing
- **Reports**: Key findings and recommendations
- **Letters**: Sender/recipient, key points
- **General**: Any text extraction

## Usage Limits

OCR usage is limited by subscription plan:

| Plan | Monthly Limit |
|------|--------------|
| Free | 10 scans |
| Essential | 100 scans |
| Plus | 500 scans |
| Pro | Unlimited |

## Database Tables

### ocr_history
Tracks all OCR scanning activity:
- User ID
- Document type
- Success/failure status
- Processing time
- Timestamp

### saved_receipts
Stores parsed receipt data:
- Merchant information
- Date and totals
- Raw text and structured data
- Links to properties/claims

## API Integration

The OCR system uses Google's Gemini 1.5 Flash model:
- High accuracy for text extraction
- Multi-language support (English and Spanish)
- Handles various image formats
- Fast processing times

## Setup Instructions

### 1. Environment Variables

Ensure your Gemini API key is set:
```env
GEMINI_API_KEY=your-api-key-here
```

### 2. Database Setup

Run the OCR table migrations:
```sql
-- Run in Supabase SQL editor
-- File: supabase/sql/add-ocr-tables.sql
-- File: supabase/sql/add-temp-documents-bucket.sql
```

### 3. Deploy Edge Function

Deploy the OCR Edge Function:
```bash
supabase functions deploy ocr-document
```

### 4. Storage Setup

The system uses a temporary storage bucket for processing. This is created automatically by the migration.

## Usage Examples

### Basic Receipt Scanning

```typescript
import { ocrService } from '@/lib/services/ocr-service'

// Process a receipt file
const file = // File from input
const result = await ocrService.processDocument(file, {
  documentType: 'receipt',
  extractStructuredData: true
})

if (result.success) {
  console.log('Extracted data:', result.structuredData)
  console.log('Raw text:', result.text)
}
```

### Using the OCR Scanner Component

```tsx
import { OCRScanner } from '@/components/ocr/ocr-scanner'

function MyComponent() {
  const handleScanComplete = (result: OCRResult) => {
    // Handle the scanned data
    console.log('Scan complete:', result)
  }

  return (
    <OCRScanner
      documentType="receipt"
      onScanComplete={handleScanComplete}
    />
  )
}
```

## Best Practices

### Image Quality
- Use well-lit images
- Avoid blurry or skewed photos
- Ensure text is clearly visible
- Minimize background clutter

### File Size
- Keep images under 10MB
- Use JPEG or PNG format
- Resize large images before upload

### Privacy
- Temporary files are auto-deleted after 1 hour
- Don't upload sensitive financial documents
- Review extracted data before saving

## Troubleshooting

### Common Issues

1. **"Monthly OCR limit reached"**
   - Upgrade your subscription plan
   - Wait until next month for limit reset

2. **"Failed to extract text"**
   - Check image quality
   - Ensure text is readable
   - Try a different angle or lighting

3. **"Structured data not found"**
   - Document may not match expected format
   - Use general document type for non-standard formats

### Debug Mode

Enable debug logging:
```typescript
// In browser console
localStorage.setItem('ocr_debug', 'true')
```

## Future Enhancements

- [ ] Batch processing multiple receipts
- [ ] Auto-categorization by expense type
- [ ] Integration with accounting software
- [ ] Offline OCR capability
- [ ] Receipt duplicate detection
- [ ] Multi-page document support

## Security Considerations

- Files are uploaded to temporary storage
- Processed via secure Edge Functions
- No permanent storage of raw images
- User isolation via RLS policies
- Automatic cleanup of temp files

## Performance

Typical processing times:
- Simple receipts: 1-2 seconds
- Complex invoices: 2-4 seconds
- Multi-item estimates: 3-5 seconds

Factors affecting performance:
- Image size and quality
- Document complexity
- Network speed
- API response time
