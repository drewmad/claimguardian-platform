# AI Models and Prompts Summary

## Overview
This document details which AI models each feature uses by default and their specific prompts.

## 1. Policy Advisor Chat

### Default Model
- **OpenAI GPT-4** (gpt-4-turbo-preview)
- User can switch to Google Gemini Pro

### System Prompt
```
You are an expert Florida property insurance policy advisor for ClaimGuardian.
Your role is to help homeowners understand their insurance policies, coverage limits,
deductibles, and claim procedures. You specialize in:
- Hurricane and flood coverage specifics
- Florida insurance regulations
- Claim filing best practices
- Coverage gap identification
- Policy comparison and recommendations

Always provide clear, actionable advice while maintaining accuracy about policy details.
```

### Enhanced Features
- **Multi-document support**: Can analyze and compare multiple policy documents
- **Document context**: Integrates uploaded policy documents into responses
- **Comparison mode**: Highlights differences between policies when comparing

## 2. AI Damage Analyzer

### Default Model
- **OpenAI GPT-4 Vision** (gpt-4-vision-preview)
- User can switch to Google Gemini Pro Vision

### System Prompt
```
You are an expert property damage assessor specializing in Florida hurricane
and weather-related damage. Analyze images to:
- Identify types of damage (wind, water, structural)
- Estimate severity levels
- Suggest documentation requirements
- Recommend immediate safety actions
- Provide repair priority guidance

Be specific about damage observations and always prioritize safety.
```

### Response Format
The AI is instructed to return structured JSON with:
- Damage items (type, severity, location, description)
- Safety concerns and warnings
- Immediate actions required
- Repair priority levels
- Cost estimates

## 3. AI Inventory Scanner

### Default Model
- **OpenAI GPT-4 Vision** (gpt-4-vision-preview)
- User can switch to Google Gemini Pro Vision

### System Prompt
```
You are an AI-powered home inventory specialist. Your task is to:
- Identify items in photos with high accuracy
- Estimate replacement values based on current market prices
- Categorize items by room and type
- Flag high-value items requiring additional documentation
- Suggest insurance coverage considerations

Provide detailed item descriptions for insurance documentation purposes.
```

### Response Format
The AI returns JSON with:
- Item details (name, category, room, brand, model)
- Value estimates and condition assessments
- High-value flags for items over $500
- Quantity counts
- Insurance recommendations

## Key Enhancements Implemented

### 1. Multi-Document Support (Policy Advisor)
- Upload and analyze multiple policy documents
- Compare policies side-by-side
- Highlight coverage differences
- Context-aware responses based on all uploaded documents

### 2. Barcode Scanning (Inventory Scanner)
- Real-time barcode scanning using device camera
- Automatic serial number capture
- Integration with item records
- Support for multiple barcode formats

### 3. Enhanced Reporting (All Features)
- Professional report generation with metadata
- Export to PDF/HTML formats
- Customizable report sections
- Insurance-ready documentation

### 4. UI/UX Improvements (Damage Analyzer)
- Visual severity indicators with progress bars
- Color-coded damage cards
- Icon-based damage type visualization
- Improved mobile responsiveness
- Better information hierarchy

## API Configuration

### OpenAI
- **Endpoint**: `https://api.openai.com/v1`
- **Chat Model**: `gpt-4-turbo-preview`
- **Vision Model**: `gpt-4-vision-preview`
- **Temperature**: 0.7
- **Max Tokens**: 1000

### Google Gemini
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta`
- **Chat Model**: `gemini-pro`
- **Vision Model**: `gemini-pro-vision`

## Security & Compliance
- All AI interactions are logged in audit_logs table
- User actions tracked with timestamps and metadata
- IP address logging for security monitoring
- Document uploads tracked for compliance

## Best Practices
1. **Model Selection**: OpenAI generally provides more consistent results for structured data extraction
2. **Prompt Engineering**: Specific JSON format requests improve response parsing
3. **Error Handling**: Always include fallback parsing for non-JSON responses
4. **Rate Limiting**: Implement queuing for multiple image analyses
5. **Cost Optimization**: Cache results when possible, especially for document analysis
