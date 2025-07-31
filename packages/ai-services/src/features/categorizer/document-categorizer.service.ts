import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { AIOrchestrator } from '../../orchestrator/orchestrator';
import { AIRequest, ImageAnalysisRequest } from '../../types/index';

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  priority: number;
  requiredForClaim: boolean;
}

interface CategorizedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  confidence: number;
  extractedData?: Record<string, unknown>;
  suggestedName?: string;
  tags: string[];
  uploadedAt: Date;
  processedAt: Date;
}

interface CategoryAnalysis {
  category: DocumentCategory;
  confidence: number;
  reasoning: string;
  extractedInfo: Record<string, unknown>;
}

export class DocumentCategorizerService {
  private orchestrator: AIOrchestrator;
  private supabase: SupabaseClient;
  
  // Insurance document categories
  private readonly DOCUMENT_CATEGORIES: DocumentCategory[] = [
    {
      id: 'policy',
      name: 'Insurance Policy',
      description: 'Full insurance policy documents',
      keywords: ['policy', 'coverage', 'declarations', 'insured', 'premium'],
      priority: 10,
      requiredForClaim: true
    },
    {
      id: 'damage-photos',
      name: 'Damage Photos',
      description: 'Photos showing property damage',
      keywords: ['damage', 'broken', 'destroyed', 'impact', 'affected'],
      priority: 9,
      requiredForClaim: true
    },
    {
      id: 'estimates',
      name: 'Repair Estimates',
      description: 'Contractor estimates and quotes',
      keywords: ['estimate', 'quote', 'repair', 'cost', 'contractor', 'labor'],
      priority: 8,
      requiredForClaim: true
    },
    {
      id: 'invoices',
      name: 'Invoices & Receipts',
      description: 'Paid invoices and receipts',
      keywords: ['invoice', 'receipt', 'paid', 'payment', 'bill'],
      priority: 7,
      requiredForClaim: false
    },
    {
      id: 'correspondence',
      name: 'Insurance Correspondence',
      description: 'Letters and emails with insurance company',
      keywords: ['claim', 'adjuster', 'insurance', 'letter', 'email', 'response'],
      priority: 6,
      requiredForClaim: false
    },
    {
      id: 'proof-of-loss',
      name: 'Proof of Loss',
      description: 'Sworn proof of loss forms',
      keywords: ['proof', 'loss', 'sworn', 'statement', 'affidavit'],
      priority: 9,
      requiredForClaim: true
    },
    {
      id: 'weather-reports',
      name: 'Weather Reports',
      description: 'Official weather reports and storm data',
      keywords: ['weather', 'storm', 'hurricane', 'wind', 'rain', 'meteorological'],
      priority: 5,
      requiredForClaim: false
    },
    {
      id: 'property-docs',
      name: 'Property Documents',
      description: 'Deeds, surveys, property records',
      keywords: ['deed', 'title', 'survey', 'property', 'ownership'],
      priority: 4,
      requiredForClaim: false
    },
    {
      id: 'mitigation',
      name: 'Mitigation Documents',
      description: 'Emergency repairs and mitigation efforts',
      keywords: ['mitigation', 'emergency', 'temporary', 'tarp', 'board-up'],
      priority: 7,
      requiredForClaim: true
    },
    {
      id: 'other',
      name: 'Other Documents',
      description: 'Uncategorized documents',
      keywords: [],
      priority: 1,
      requiredForClaim: false
    }
  ];
  
  constructor(orchestrator: AIOrchestrator, supabaseUrl?: string, supabaseKey?: string) {
    this.orchestrator = orchestrator;
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  
  async categorizeDocument(
    file: {
      name: string;
      url: string;
      type: string;
      size: number;
    },
    userId: string
  ): Promise<CategorizedDocument> {
    // 1. Analyze document content
    const analysis = await this.analyzeDocument(file, userId);
    
    // 2. Determine best category
    const category = this.selectCategory(analysis);
    
    // 3. Extract relevant information
    const extractedData = await this.extractDocumentData(
      file,
      category,
      analysis,
      userId
    );
    
    // 4. Generate suggested file name
    const suggestedName = await this.generateFileName(
      category,
      extractedData,
      file.name,
      userId
    );
    
    // 5. Generate tags
    const tags = this.generateTags(analysis, extractedData);
    
    const categorizedDoc: CategorizedDocument = {
      id: crypto.randomUUID(),
      fileName: file.name,
      fileUrl: file.url,
      fileType: file.type,
      fileSize: file.size,
      category,
      confidence: analysis.confidence,
      extractedData,
      suggestedName,
      tags,
      uploadedAt: new Date(),
      processedAt: new Date()
    };
    
    // 6. Save to database
    await this.saveCategorization(categorizedDoc, userId);
    
    // 7. Track metrics
    // Record metric if monitoring is available
    // this.orchestrator['monitoring']?.recordMetric(
    //   'document.categorized',
    //   Date.now() - startTime
    // );
    
    return categorizedDoc;
  }
  
  async categorizeMultiple(
    files: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>,
    userId: string
  ): Promise<CategorizedDocument[]> {
    // Process in parallel for efficiency
    const categorizations = await Promise.all(
      files.map(file => this.categorizeDocument(file, userId))
    );
    
    // Check for missing required documents
    await this.checkRequiredDocuments(categorizations, userId);
    
    return categorizations;
  }
  
  async getMissingRequiredDocuments(
    claimId: string,
    _userId: string
  ): Promise<DocumentCategory[]> {
    // Get all documents for this claim
    const { data: existingDocs } = await this.supabase
      .from('claim_documents')
      .select('category_id')
      .eq('claim_id', claimId);
    
    const existingCategoryIds = new Set(
      existingDocs?.map(doc => doc.category_id) || []
    );
    
    // Find missing required categories
    return this.DOCUMENT_CATEGORIES.filter(
      cat => cat.requiredForClaim && !existingCategoryIds.has(cat.id)
    );
  }
  
  private async analyzeDocument(
    file: { name: string; url: string; type: string },
    userId: string
  ): Promise<CategoryAnalysis> {
    let request: AIRequest | ImageAnalysisRequest;
    
    if (file.type.startsWith('image/')) {
      // Image analysis
      request = {
        imageUrl: file.url,
        prompt: `Analyze this document image and identify:
          1. What type of insurance-related document this is
          2. Key information visible (dates, amounts, names, addresses)
          3. Any damage visible if it's a damage photo
          4. Quality and completeness of the document
          
          Return as JSON with: documentType, keyInfo, quality, isComplete`,
        userId,
        feature: 'document-categorizer'
      } as ImageAnalysisRequest;
      
      const response = await this.orchestrator.analyzeImage(request);
      return this.parseImageAnalysis(response.text, file.name);
    } else {
      // Text/PDF analysis
      request = {
        prompt: `Analyze this document and identify:
          Filename: ${file.name}
          
          Based on the filename and common insurance document patterns, determine:
          1. The most likely document category
          2. Key information that might be in this document
          3. Importance for an insurance claim
          
          Categories: ${this.DOCUMENT_CATEGORIES.map(c => c.name).join(', ')}
          
          Return as JSON with: category, confidence (0-1), keyInfo, importance`,
        systemPrompt: `You are an expert at categorizing insurance claim documents.
          Be accurate and consider Florida-specific insurance requirements.`,
        userId,
        feature: 'document-categorizer',
        temperature: 0.2,
        responseFormat: 'json'
      } as AIRequest;
      
      const response = await this.orchestrator.process(request);
      return this.parseTextAnalysis(response.text);
    }
  }
  
  private parseImageAnalysis(analysisText: string, fileName: string): CategoryAnalysis {
    try {
      const parsed = JSON.parse(analysisText);
      
      // Map AI response to our categories
      const categoryMap: Record<string, string> = {
        'damage photo': 'damage-photos',
        'insurance policy': 'policy',
        'estimate': 'estimates',
        'invoice': 'invoices',
        'receipt': 'invoices',
        'letter': 'correspondence',
        'email': 'correspondence',
        'weather report': 'weather-reports',
        'property document': 'property-docs'
      };
      
      const detectedType = parsed.documentType?.toLowerCase() || '';
      const categoryId = categoryMap[detectedType] || 'other';
      const category = this.DOCUMENT_CATEGORIES.find(c => c.id === categoryId)!;
      
      return {
        category,
        confidence: parsed.confidence || 0.7,
        reasoning: `Detected as ${parsed.documentType} based on content analysis`,
        extractedInfo: parsed.keyInfo || {}
      };
    } catch (_error) {
      // Fallback analysis based on filename
      return this.analyzeByFilename(fileName);
    }
  }
  
  private parseTextAnalysis(analysisText: string): CategoryAnalysis {
    try {
      const parsed = JSON.parse(analysisText);
      
      const category = this.DOCUMENT_CATEGORIES.find(
        c => c.name.toLowerCase() === parsed.category?.toLowerCase()
      ) || this.DOCUMENT_CATEGORIES.find(c => c.id === 'other')!;
      
      return {
        category,
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'Based on document analysis',
        extractedInfo: parsed.keyInfo || {}
      };
    } catch (_error) {
      return {
        category: this.DOCUMENT_CATEGORIES.find(c => c.id === 'other')!,
        confidence: 0.3,
        reasoning: 'Could not analyze document',
        extractedInfo: {}
      };
    }
  }
  
  private analyzeByFilename(fileName: string): CategoryAnalysis {
    const lowerName = fileName.toLowerCase();
    
    // Check each category's keywords
    for (const category of this.DOCUMENT_CATEGORIES) {
      const matchScore = category.keywords.reduce((score, keyword) => {
        return lowerName.includes(keyword) ? score + 1 : score;
      }, 0);
      
      if (matchScore > 0) {
        return {
          category,
          confidence: Math.min(0.9, 0.3 + (matchScore * 0.2)),
          reasoning: `Filename contains keywords: ${category.keywords.filter(k => lowerName.includes(k)).join(', ')}`,
          extractedInfo: {}
        };
      }
    }
    
    // Check file patterns
    if (lowerName.match(/\.(jpg|jpeg|png|gif)$/)) {
      return {
        category: this.DOCUMENT_CATEGORIES.find(c => c.id === 'damage-photos')!,
        confidence: 0.6,
        reasoning: 'Image file - likely damage photo',
        extractedInfo: {}
      };
    }
    
    return {
      category: this.DOCUMENT_CATEGORIES.find(c => c.id === 'other')!,
      confidence: 0.3,
      reasoning: 'Could not determine category from filename',
      extractedInfo: {}
    };
  }
  
  private selectCategory(analysis: CategoryAnalysis): DocumentCategory {
    // If confidence is high enough, use the analyzed category
    if (analysis.confidence >= 0.7) {
      return analysis.category;
    }
    
    // Otherwise, present options to user or use 'other'
    return analysis.category;
  }
  
  private async extractDocumentData(
    file: { url: string },
    category: DocumentCategory,
    analysis: CategoryAnalysis,
    userId: string
  ): Promise<Record<string, unknown>> {
    // For certain categories, extract specific information
    if (category.id === 'policy') {
      return await this.extractPolicyData(file, analysis, userId);
    } else if (category.id === 'estimates') {
      return await this.extractEstimateData(file, analysis, userId);
    } else if (category.id === 'damage-photos') {
      return await this.extractDamagePhotoData(file, analysis, userId);
    }
    
    return analysis.extractedInfo || {};
  }
  
  private async extractPolicyData(
    _file: { url: string },
    analysis: CategoryAnalysis,
    userId: string
  ): Promise<Record<string, unknown>> {
    const request: AIRequest = {
      prompt: `Extract key information from this insurance policy document:
        ${JSON.stringify(analysis.extractedInfo)}
        
        Extract and structure:
        - Policy number
        - Policy holder name
        - Property address
        - Coverage amounts (dwelling, personal property, etc.)
        - Deductibles
        - Policy period (start and end dates)
        
        Return as structured JSON.`,
      userId,
      feature: 'document-categorizer',
      temperature: 0.1,
      responseFormat: 'json'
    };
    
    const response = await this.orchestrator.process(request);
    try {
      return JSON.parse(response.text);
    } catch {
      return analysis.extractedInfo;
    }
  }
  
  private async extractEstimateData(
    _file: { url: string },
    analysis: CategoryAnalysis,
    _userId: string
  ): Promise<Record<string, unknown>> {
    return {
      ...analysis.extractedInfo,
      requiresReview: true,
      extractionNote: 'Manual review recommended for accuracy'
    };
  }
  
  private async extractDamagePhotoData(
    _file: { url: string },
    analysis: CategoryAnalysis,
    _userId: string
  ): Promise<Record<string, unknown>> {
    return {
      ...analysis.extractedInfo,
      damageVisible: true,
      photoQuality: analysis.extractedInfo.quality || 'good'
    };
  }
  
  private async generateFileName(
    category: DocumentCategory,
    extractedData: Record<string, unknown>,
    originalName: string,
    _userId: string
  ): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now().toString().slice(-4);
    
    // Generate descriptive filename
    if (category.id === 'damage-photos') {
      const location = extractedData.location || 'property';
      return `damage_${location}_${date}_${timestamp}.jpg`;
    } else if (category.id === 'policy') {
      const policyNumber = extractedData.policyNumber || 'unknown';
      return `policy_${policyNumber}_${date}.pdf`;
    } else if (category.id === 'estimates') {
      const contractor = extractedData.contractor || 'contractor';
      return `estimate_${contractor}_${date}.pdf`;
    }
    
    // Default pattern
    return `${category.id}_${date}_${timestamp}${this.getFileExtension(originalName)}`;
  }
  
  private generateTags(
    analysis: CategoryAnalysis,
    extractedData: Record<string, unknown>
  ): string[] {
    const tags: string[] = [];
    
    // Add category as tag
    tags.push(analysis.category.name.toLowerCase());
    
    // Add confidence level
    if (analysis.confidence >= 0.8) {
      tags.push('high-confidence');
    } else if (analysis.confidence >= 0.5) {
      tags.push('medium-confidence');
    } else {
      tags.push('needs-review');
    }
    
    // Add data-specific tags
    if (extractedData.damageType) {
      tags.push(String(extractedData.damageType).toLowerCase());
    }
    if (extractedData.isComplete === false) {
      tags.push('incomplete');
    }
    if (analysis.category.requiredForClaim) {
      tags.push('required');
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }
  
  private async saveCategorization(
    doc: CategorizedDocument,
    userId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('categorized_documents')
      .insert({
        id: doc.id,
        user_id: userId,
        file_name: doc.fileName,
        file_url: doc.fileUrl,
        file_type: doc.fileType,
        file_size: doc.fileSize,
        category_id: doc.category.id,
        category_name: doc.category.name,
        confidence: doc.confidence,
        extracted_data: doc.extractedData,
        suggested_name: doc.suggestedName,
        tags: doc.tags,
        uploaded_at: doc.uploadedAt.toISOString(),
        processed_at: doc.processedAt.toISOString()
      });
    
    if (error) {
      console.error('Error saving categorization:', error);
    }
  }
  
  private async checkRequiredDocuments(
    categorizations: CategorizedDocument[],
    userId: string
  ): Promise<void> {
    const uploadedCategories = new Set(
      categorizations.map(doc => doc.category.id)
    );
    
    const missingRequired = this.DOCUMENT_CATEGORIES
      .filter(cat => cat.requiredForClaim && !uploadedCategories.has(cat.id))
      .map(cat => cat.name);
    
    if (missingRequired.length > 0) {
      // Create a notification about missing documents
      await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'missing_documents',
          title: 'Required Documents Missing',
          message: `Please upload: ${missingRequired.join(', ')}`,
          metadata: { missingCategories: missingRequired }
        });
    }
  }
  
  private getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^.]+$/);
    return match ? match[0] : '';
  }
}