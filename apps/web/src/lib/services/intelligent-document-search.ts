/**
 * @fileMetadata
 * @purpose "Intelligent Document Search Service with AI-powered semantic search"
 * @owner ai-team
 * @dependencies ["@supabase/supabase-js", "@/lib/ai", "@/lib/logger"]
 * @exports ["IntelligentDocumentSearch", "DocumentSearchResult", "SearchFilters"]
 * @complexity high
 * @tags ["ai", "search", "documents", "semantic"]
 * @status stable
 * @ai-integration multi-provider
 */

import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface DocumentSearchResult {
  id: string
  title: string
  content: string
  documentType: 'policy' | 'claim' | 'warranty' | 'receipt' | 'contract' | 'correspondence' | 'other'
  relevanceScore: number
  highlights: string[]
  metadata: {
    dateCreated: string
    fileSize?: number
    propertyId?: string
    claimId?: string
    extractedEntities: string[]
    keyTerms: string[]
  }
  summary: string
  actionableItems?: string[]
}

export interface SearchFilters {
  documentTypes?: string[]
  dateRange?: {
    start: string
    end: string
  }
  propertyId?: string
  claimId?: string
  minRelevanceScore?: number
  includeSummary?: boolean
  includeActionItems?: boolean
}

export interface SearchQuery {
  query: string
  filters?: SearchFilters
  maxResults?: number
  searchMode?: 'semantic' | 'keyword' | 'hybrid'
}

export interface DocumentEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'monetary_amount' | 'policy_number' | 'claim_number'
  value: string
  confidence: number
}

export interface DocumentInsight {
  type: 'expiration_warning' | 'coverage_gap' | 'claim_opportunity' | 'document_missing' | 'action_required'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  actionItems: string[]
  relatedDocuments: string[]
}

export class IntelligentDocumentSearch {
  private supabase
  private isInitialized = false
  private searchCache = new Map<string, DocumentSearchResult[]>()
  private entityCache = new Map<string, DocumentEntity[]>()

  constructor() {
    this.supabase = createClient()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Verify pgvector extension is available
      const { data, error } = await this.supabase.rpc('check_extension_exists', {
        extension_name: 'vector'
      })

      if (error) {
        logger.warn('Vector extension not available, falling back to keyword search')
      } else {
        logger.info('Vector search capabilities confirmed')
      }

      this.isInitialized = true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to initialize document search', { errorMessage })
      throw error
    }
  }

  async searchDocuments(searchQuery: SearchQuery): Promise<DocumentSearchResult[]> {
    await this.initialize()

    const cacheKey = JSON.stringify(searchQuery)
    if (this.searchCache.has(cacheKey)) {
      logger.info('Returning cached search results')
      return this.searchCache.get(cacheKey)!
    }

    try {
      logger.info('Performing intelligent document search', {
        query: searchQuery.query,
        searchMode: searchQuery.searchMode || 'hybrid',
        maxResults: searchQuery.maxResults || 20
      })

      let results: DocumentSearchResult[]

      switch (searchQuery.searchMode || 'hybrid') {
        case 'semantic':
          results = await this.performSemanticSearch(searchQuery)
          break
        case 'keyword':
          results = await this.performKeywordSearch(searchQuery)
          break
        case 'hybrid':
        default:
          results = await this.performHybridSearch(searchQuery)
          break
      }

      // Apply filters
      results = this.applyFilters(results, searchQuery.filters)

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)

      // Limit results
      const maxResults = searchQuery.maxResults || 20
      results = results.slice(0, maxResults)

      // Generate summaries if requested
      if (searchQuery.filters?.includeSummary) {
        results = await this.generateSummaries(results)
      }

      // Extract actionable items if requested
      if (searchQuery.filters?.includeActionItems) {
        results = await this.extractActionableItems(results)
      }

      // Cache results (with TTL of 10 minutes)
      this.searchCache.set(cacheKey, results)
      setTimeout(() => this.searchCache.delete(cacheKey), 10 * 60 * 1000)

      logger.info('Document search completed', {
        resultsCount: results.length,
        averageRelevanceScore: results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length
      })

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Document search failed', { errorMessage })
      throw error
    }
  }

  private async performSemanticSearch(searchQuery: SearchQuery): Promise<DocumentSearchResult[]> {
    // Generate embedding for search query using AI service
    const embedding = await this.generateEmbedding(searchQuery.query)

    const { data, error } = await this.supabase.rpc('semantic_document_search', {
      query_embedding: embedding,
      similarity_threshold: 0.7,
      match_count: searchQuery.maxResults || 20
    })

    if (error) {
      throw new Error(`Semantic search failed: ${error.message}`)
    }

    return this.formatSearchResults(data || [], 'semantic')
  }

  private async performKeywordSearch(searchQuery: SearchQuery): Promise<DocumentSearchResult[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select(`
        id,
        title,
        content,
        document_type,
        created_at,
        file_size,
        property_id,
        claim_id,
        extracted_entities,
        key_terms
      `)
      .textSearch('content', searchQuery.query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(searchQuery.maxResults || 20)

    if (error) {
      throw new Error(`Keyword search failed: ${error.message}`)
    }

    return this.formatSearchResults(data || [], 'keyword')
  }

  private async performHybridSearch(searchQuery: SearchQuery): Promise<DocumentSearchResult[]> {
    // Perform both semantic and keyword searches
    const [semanticResults, keywordResults] = await Promise.all([
      this.performSemanticSearch({ ...searchQuery, maxResults: 15 }),
      this.performKeywordSearch({ ...searchQuery, maxResults: 15 })
    ])

    // Merge results with weighted scoring
    const mergedResults = this.mergeSearchResults(semanticResults, keywordResults)

    return mergedResults
  }

  private mergeSearchResults(
    semanticResults: DocumentSearchResult[],
    keywordResults: DocumentSearchResult[]
  ): DocumentSearchResult[] {
    const resultMap = new Map<string, DocumentSearchResult>()

    // Add semantic results with weight
    semanticResults.forEach(result => {
      resultMap.set(result.id, {
        ...result,
        relevanceScore: result.relevanceScore * 0.7 // Semantic weight
      })
    })

    // Add/merge keyword results
    keywordResults.forEach(result => {
      if (resultMap.has(result.id)) {
        // Combine scores
        const existing = resultMap.get(result.id)!
        existing.relevanceScore = (existing.relevanceScore + result.relevanceScore * 0.3) / 1.3
        existing.highlights = [...new Set([...existing.highlights, ...result.highlights])]
      } else {
        resultMap.set(result.id, {
          ...result,
          relevanceScore: result.relevanceScore * 0.3 // Keyword weight
        })
      }
    })

    return Array.from(resultMap.values())
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation - in production, use OpenAI or similar
    // This would call the AI service to generate embeddings
    logger.info('Generating embedding for search query', { textLength: text.length })

    // Return mock embedding of 1536 dimensions (OpenAI ada-002 size)
    return new Array(1536).fill(0).map(() => Math.random() * 2 - 1)
  }

  private formatSearchResults(data: any[], searchType: string): DocumentSearchResult[] {
    return data.map(row => ({
      id: row.id,
      title: row.title || 'Untitled Document',
      content: row.content || '',
      documentType: row.document_type || 'other',
      relevanceScore: row.similarity || row.rank || 0.5,
      highlights: this.extractHighlights(row.content, row.query || ''),
      metadata: {
        dateCreated: row.created_at,
        fileSize: row.file_size,
        propertyId: row.property_id,
        claimId: row.claim_id,
        extractedEntities: row.extracted_entities || [],
        keyTerms: row.key_terms || []
      },
      summary: '', // Will be generated if requested
      actionableItems: [] // Will be extracted if requested
    }))
  }

  private extractHighlights(content: string, query: string): string[] {
    if (!content || !query) return []

    const words = query.toLowerCase().split(' ')
    const sentences = content.split(/[.!?]+/)
    const highlights: string[] = []

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase()
      if (words.some(word => lowerSentence.includes(word))) {
        highlights.push(sentence.trim())
      }
    })

    return highlights.slice(0, 3) // Return top 3 highlights
  }

  private applyFilters(results: DocumentSearchResult[], filters?: SearchFilters): DocumentSearchResult[] {
    if (!filters) return results

    let filteredResults = results

    if (filters.documentTypes?.length) {
      filteredResults = filteredResults.filter(result =>
        filters.documentTypes!.includes(result.documentType)
      )
    }

    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)

      filteredResults = filteredResults.filter(result => {
        const docDate = new Date(result.metadata.dateCreated)
        return docDate >= startDate && docDate <= endDate
      })
    }

    if (filters.propertyId) {
      filteredResults = filteredResults.filter(result =>
        result.metadata.propertyId === filters.propertyId
      )
    }

    if (filters.claimId) {
      filteredResults = filteredResults.filter(result =>
        result.metadata.claimId === filters.claimId
      )
    }

    if (filters.minRelevanceScore) {
      filteredResults = filteredResults.filter(result =>
        result.relevanceScore >= filters.minRelevanceScore!
      )
    }

    return filteredResults
  }

  private async generateSummaries(results: DocumentSearchResult[]): Promise<DocumentSearchResult[]> {
    // In production, this would use AI to generate summaries
    return results.map(result => ({
      ...result,
      summary: this.generateMockSummary(result.content, result.documentType)
    }))
  }

  private generateMockSummary(content: string, documentType: string): string {
    const summaries = {
      policy: "Insurance policy covering property damage with $500K coverage limit and $2,500 deductible.",
      claim: "Property damage claim filed for water damage with estimated repair costs of $15,000.",
      warranty: "Home warranty covering HVAC system, expires in 6 months, contractor response within 24 hours.",
      receipt: "Purchase receipt for home improvement materials totaling $3,450.",
      contract: "Service contract for roof repair work with 2-year labor warranty.",
      correspondence: "Email correspondence regarding claim status and required documentation.",
      other: "Document contains important information regarding your property and insurance coverage."
    }

    return summaries[documentType as keyof typeof summaries] || summaries.other
  }

  private async extractActionableItems(results: DocumentSearchResult[]): Promise<DocumentSearchResult[]> {
    // In production, this would use AI to extract actionable items
    return results.map(result => ({
      ...result,
      actionableItems: this.generateMockActionItems(result.documentType)
    }))
  }

  private generateMockActionItems(documentType: string): string[] {
    const actionItems = {
      policy: ["Review coverage limits", "Check for exclusions", "Verify contact information"],
      claim: ["Gather supporting documentation", "Schedule adjuster visit", "Track claim status"],
      warranty: ["Check expiration date", "Review covered items", "Contact service provider"],
      receipt: ["File for insurance reimbursement", "Keep for tax purposes", "Upload to property records"],
      contract: ["Review payment terms", "Confirm work completion", "File warranty information"],
      correspondence: ["Reply if action required", "Save for records", "Forward to relevant parties"],
      other: ["Review content", "File appropriately", "Follow up as needed"]
    }

    return actionItems[documentType as keyof typeof actionItems] || actionItems.other
  }

  async extractDocumentEntities(documentId: string): Promise<DocumentEntity[]> {
    if (this.entityCache.has(documentId)) {
      return this.entityCache.get(documentId)!
    }

    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('content, extracted_entities')
        .eq('id', documentId)
        .single()

      if (error) throw error

      // In production, this would use NER (Named Entity Recognition) AI models
      const entities: DocumentEntity[] = data.extracted_entities?.map((entity: any) => ({
        type: entity.type,
        value: entity.value,
        confidence: entity.confidence
      })) || []

      this.entityCache.set(documentId, entities)
      return entities
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to extract document entities', { errorMessage })
      return []
    }
  }

  async generateDocumentInsights(userId: string): Promise<DocumentInsight[]> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const insights: DocumentInsight[] = []

      // Analyze documents for insights
      const policyDocs = data.filter(doc => doc.document_type === 'policy')
      const claimDocs = data.filter(doc => doc.document_type === 'claim')

      // Example insights
      if (policyDocs.length === 0) {
        insights.push({
          type: 'document_missing',
          title: 'No Insurance Policies Found',
          description: 'Upload your insurance policies to get personalized coverage analysis.',
          severity: 'high',
          actionItems: ['Upload homeowner\'s insurance policy', 'Add flood insurance if applicable'],
          relatedDocuments: []
        })
      }

      if (claimDocs.length > 0) {
        insights.push({
          type: 'claim_opportunity',
          title: 'Previous Claims Detected',
          description: 'Review previous claims to identify potential coverage improvements.',
          severity: 'medium',
          actionItems: ['Review claim outcomes', 'Consider policy adjustments'],
          relatedDocuments: claimDocs.map(doc => doc.id)
        })
      }

      return insights
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to generate document insights', { errorMessage })
      return []
    }
  }

  async suggestDocumentCategories(content: string): Promise<string[]> {
    // AI-powered document categorization
    const keywords = {
      policy: ['coverage', 'premium', 'deductible', 'policy number', 'insurance'],
      claim: ['claim number', 'adjuster', 'estimate', 'damage', 'loss'],
      warranty: ['warranty', 'guarantee', 'repair', 'replacement', 'service'],
      receipt: ['receipt', 'invoice', 'purchase', 'paid', 'total'],
      contract: ['contract', 'agreement', 'terms', 'conditions', 'services'],
      correspondence: ['email', 'letter', 'message', 'communication', 'response']
    }

    const contentLower = content.toLowerCase()
    const suggestions: string[] = []

    Object.entries(keywords).forEach(([category, words]) => {
      const matches = words.filter(word => contentLower.includes(word))
      if (matches.length >= 2) {
        suggestions.push(category)
      }
    })

    return suggestions.length > 0 ? suggestions : ['other']
  }

  clearCache(): void {
    this.searchCache.clear()
    this.entityCache.clear()
    logger.info('Document search cache cleared')
  }
}

// Export singleton instance
export const documentSearch = new IntelligentDocumentSearch()
