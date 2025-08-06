/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose Multi-modal AI provider orchestration with xAI Grok integration
 * @dependencies ["openai", "@google/generative-ai", "@anthropic-ai/sdk"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context document-extraction
 * @florida-specific true
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

export interface AIProvider {
  name: string
  analyze: (data: any) => Promise<any>
  confidence: number
  specialties: string[]
}

export class MultiModalAIOrchestrator {
  private providers: Map<string, AIProvider> = new Map()
  
  constructor(private config: {
    openaiKey?: string
    geminiKey?: string
    anthropicKey?: string
    xaiKey?: string
  }) {
    this.initializeProviders()
  }

  private initializeProviders() {
    // OpenAI GPT-4 Vision for general document analysis
    if (this.config.openaiKey) {
      this.providers.set('openai', {
        name: 'OpenAI GPT-4 Vision',
        analyze: this.analyzeWithOpenAI.bind(this),
        confidence: 0.9,
        specialties: ['invoices', 'receipts', 'contracts', 'general']
      })
    }

    // Google Gemini for complex multi-page documents
    if (this.config.geminiKey) {
      this.providers.set('gemini', {
        name: 'Google Gemini Pro Vision',
        analyze: this.analyzeWithGemini.bind(this),
        confidence: 0.88,
        specialties: ['policies', 'reports', 'multi-page', 'handwritten']
      })
    }

    // Anthropic Claude for nuanced understanding
    if (this.config.anthropicKey) {
      this.providers.set('claude', {
        name: 'Anthropic Claude 3',
        analyze: this.analyzeWithClaude.bind(this),
        confidence: 0.92,
        specialties: ['legal', 'medical', 'complex-reasoning', 'florida-regulations']
      })
    }

    // xAI Grok for cutting-edge multi-modal analysis
    if (this.config.xaiKey) {
      this.providers.set('xai', {
        name: 'xAI Grok',
        analyze: this.analyzeWithXAI.bind(this),
        confidence: 0.95,
        specialties: ['damage-assessment', 'real-time', 'anomaly-detection', 'hurricane-damage']
      })
    }
  }

  async analyzeDocument(
    fileData: Blob,
    documentType?: string,
    floridaContext?: any
  ): Promise<{
    consensus: any
    providers: any[]
    confidence: number
  }> {
    // Select optimal providers based on document type
    const selectedProviders = this.selectProviders(documentType, floridaContext)
    
    // Run parallel analysis with all selected providers
    const analyses = await Promise.allSettled(
      selectedProviders.map(async provider => ({
        provider: provider.name,
        result: await provider.analyze({ fileData, documentType, floridaContext })
      }))
    )

    // Process results
    const successfulAnalyses = analyses
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value)

    // Build consensus from multiple AI providers
    const consensus = this.buildConsensus(successfulAnalyses)
    
    // Calculate overall confidence
    const confidence = this.calculateConfidence(successfulAnalyses, consensus)

    return {
      consensus,
      providers: successfulAnalyses,
      confidence
    }
  }

  private selectProviders(documentType?: string, floridaContext?: any): AIProvider[] {
    const providers = Array.from(this.providers.values())
    
    // For Florida hurricane/flood claims, prioritize xAI and Claude
    if (floridaContext?.hurricane || floridaContext?.flood) {
      return providers.sort((a, b) => {
        if (a.name.includes('xAI')) return -1
        if (b.name.includes('xAI')) return 1
        if (a.name.includes('Claude')) return -1
        if (b.name.includes('Claude')) return 1
        return 0
      }).slice(0, 3)
    }

    // For complex documents, use all available providers
    if (documentType === 'policy' || documentType === 'legal') {
      return providers
    }

    // Default: use top 2 providers by confidence
    return providers
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2)
  }

  private async analyzeWithOpenAI(data: any): Promise<any> {
    const openai = new OpenAI({ apiKey: this.config.openaiKey! })
    const base64 = await this.fileToBase64(data.fileData)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert document analyzer for Florida insurance claims. 
            Extract all relevant information and return structured JSON.`
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this document. Context: ${JSON.stringify(data.floridaContext || {})}` 
            },
            { 
              type: "image_url", 
              image_url: { url: `data:${data.fileData.type};base64,${base64}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    })
    
    return JSON.parse(response.choices[0].message.content!)
  }

  private async analyzeWithGemini(data: any): Promise<any> {
    const gemini = new GoogleGenerativeAI(this.config.geminiKey!)
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro-vision" })
    
    const base64 = await this.fileToBase64(data.fileData)
    const result = await model.generateContent([
      `Analyze this insurance document for a Florida property claim. 
       Extract: document type, dates, amounts, parties, damage descriptions.
       Context: ${JSON.stringify(data.floridaContext || {})}
       Return structured JSON.`,
      { inlineData: { data: base64, mimeType: data.fileData.type } }
    ])
    
    return JSON.parse(result.response.text())
  }

  private async analyzeWithClaude(data: any): Promise<any> {
    const anthropic = new Anthropic({ apiKey: this.config.anthropicKey! })
    const base64 = await this.fileToBase64(data.fileData)
    
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this Florida insurance document with special attention to:
                - Hurricane/flood damage indicators
                - Policy coverage details
                - Claim deadlines and requirements
                - Florida-specific regulations (FLOIR)
                Context: ${JSON.stringify(data.floridaContext || {})}
                Return comprehensive structured JSON.`
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: data.fileData.type as any,
                data: base64
              }
            }
          ]
        }
      ]
    })
    
    const content = response.content[0]
    return JSON.parse(content.type === 'text' ? content.text : '{}')
  }

  private async analyzeWithXAI(data: any): Promise<any> {
    // xAI Grok integration for advanced multi-modal analysis
    // Grok excels at real-time analysis and anomaly detection
    
    const base64 = await this.fileToBase64(data.fileData)
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.xaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-vision-beta',
        messages: [
          {
            role: 'system',
            content: `You are Grok, an advanced AI specialized in Florida property damage assessment.
              Your strengths:
              - Hurricane and flood damage pattern recognition
              - Anomaly detection in insurance documents
              - Real-time damage progression analysis
              - Correlation with weather events and disaster data`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Perform comprehensive multi-modal analysis:
                  1. Document classification and information extraction
                  2. Damage assessment if visual damage present
                  3. Anomaly detection (fraudulent patterns, inconsistencies)
                  4. Florida-specific context correlation
                  5. Temporal analysis (damage progression, claim timing)
                  
                  Florida Context: ${JSON.stringify(data.floridaContext || {})}
                  
                  Return detailed JSON with confidence scores for each finding.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${data.fileData.type};base64,${base64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`xAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return JSON.parse(result.choices[0].message.content)
  }

  private buildConsensus(analyses: any[]): any {
    if (analyses.length === 0) {
      throw new Error('No successful analyses')
    }

    if (analyses.length === 1) {
      return analyses[0].result
    }

    // Build consensus from multiple AI providers
    const consensus: any = {
      documentType: this.findConsensusValue(analyses, 'documentType'),
      category: this.findConsensusValue(analyses, 'category'),
      dates: this.mergeDates(analyses),
      amounts: this.mergeAmounts(analyses),
      entities: this.mergeEntities(analyses),
      damageAssessment: this.mergeDamageAssessments(analyses),
      anomalies: this.mergeAnomalies(analyses),
      suggestedName: this.generateConsensusName(analyses),
      associations: this.mergeAssociations(analyses),
      floridaSpecific: this.mergeFloridaSpecific(analyses)
    }

    // Add provider-specific insights
    consensus.providerInsights = analyses.map(a => ({
      provider: a.provider,
      uniqueFindings: this.extractUniqueFindings(a.result, consensus)
    }))

    return consensus
  }

  private findConsensusValue(analyses: any[], field: string): any {
    const values = analyses.map(a => a.result[field]).filter(v => v)
    if (values.length === 0) return null
    
    // Find most common value
    const counts = new Map()
    values.forEach(v => {
      const key = JSON.stringify(v)
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    return JSON.parse(sorted[0][0])
  }

  private mergeDates(analyses: unknown[]): string[] {
    const allDates = new Set<string>()
    analyses.forEach((a: unknown) => {
      const analysis = a as any
      if (analysis.result?.dates && Array.isArray(analysis.result.dates)) {
        analysis.result.dates.forEach((d: string) => allDates.add(d))
      }
    })
    return Array.from(allDates).sort()
  }

  private mergeAmounts(analyses: unknown[]): unknown[] {
    const amounts: unknown[] = []
    const seen = new Set()
    
    analyses.forEach((a: unknown) => {
      const analysis = a as any
      if (analysis.result?.amounts && Array.isArray(analysis.result.amounts)) {
        analysis.result.amounts.forEach((amount: any) => {
          const key = `${amount.value}_${amount.type}`
          if (!seen.has(key)) {
            seen.add(key)
            amounts.push(amount)
          }
        })
      }
    })
    
    return amounts
  }

  private mergeEntities(analyses: any[]): any {
    const entities = {}
    
    analyses.forEach(a => {
      if (a.result.entities) {
        Object.assign(entities, a.result.entities)
      }
    })
    
    return entities
  }

  private mergeDamageAssessments(analyses: any[]): any {
    const xaiAnalysis = analyses.find(a => a.provider === 'xAI Grok')
    if (xaiAnalysis?.result?.damageAssessment) {
      return xaiAnalysis.result.damageAssessment
    }
    
    // Fallback to other providers
    const assessments = analyses
      .map(a => a.result.damageAssessment)
      .filter(d => d)
    
    if (assessments.length === 0) return null
    
    return {
      severity: this.findConsensusValue(analyses, 'damageAssessment.severity'),
      types: this.mergeArrays(assessments.map(a => a.types)),
      estimatedCost: this.averageValues(assessments.map(a => a.estimatedCost))
    }
  }

  private mergeAnomalies(analyses: unknown[]): unknown[] {
    // Prioritize xAI's anomaly detection
    const xaiAnalysis = (analyses as any[]).find(a => a.provider === 'xAI Grok')
    if (xaiAnalysis?.result?.anomalies) {
      return xaiAnalysis.result.anomalies
    }
    
    const allAnomalies: unknown[] = []
    analyses.forEach((a: unknown) => {
      const analysis = a as any
      if (analysis.result?.anomalies && Array.isArray(analysis.result.anomalies)) {
        allAnomalies.push(...analysis.result.anomalies)
      }
    })
    
    return this.deduplicateAnomalies(allAnomalies)
  }

  private mergeAssociations(analyses: unknown[]): unknown[] {
    const associations = new Map()
    
    analyses.forEach((a: unknown) => {
      const analysis = a as any
      if (analysis.result?.associations && Array.isArray(analysis.result.associations)) {
        analysis.result.associations.forEach((assoc: any) => {
          const key = `${assoc.type}_${assoc.id}`
          if (!associations.has(key) || assoc.confidence > associations.get(key).confidence) {
            associations.set(key, assoc)
          }
        })
      }
    })
    
    return Array.from(associations.values())
  }

  private mergeFloridaSpecific(analyses: any[]): any {
    // Combine Florida-specific insights from all providers
    const floridaData = {
      hurricaneRelated: false,
      floodZone: null,
      femaDeclaration: null,
      windMitigation: [],
      buildingCode: null,
      sinkholeRisk: false
    }
    
    analyses.forEach(a => {
      if (a.result.floridaSpecific) {
        Object.assign(floridaData, a.result.floridaSpecific)
      }
    })
    
    return floridaData
  }

  private generateConsensusName(analyses: any[]): string {
    const names = analyses.map(a => a.result.suggestedName).filter(n => n)
    if (names.length === 0) return 'document_' + Date.now()
    
    // Use the most detailed/specific name
    return names.sort((a, b) => b.length - a.length)[0]
  }

  private extractUniqueFindings(providerResult: any, consensus: any): unknown[] {
    const unique: unknown[] = []
    
    // Find findings unique to this provider
    Object.keys(providerResult).forEach(key => {
      if (!consensus[key] || JSON.stringify(consensus[key]) !== JSON.stringify(providerResult[key])) {
        unique.push({
          field: key,
          value: providerResult[key]
        })
      }
    })
    
    return unique
  }

  private calculateConfidence(analyses: any[], consensus: any): number {
    if (analyses.length === 1) {
      return analyses[0].result.confidence || 0.7
    }
    
    // Calculate agreement score
    let agreementScore = 0
    const fields = ['documentType', 'category', 'dates', 'amounts']
    
    fields.forEach(field => {
      const values = analyses.map(a => JSON.stringify(a.result[field]))
      const uniqueValues = new Set(values).size
      agreementScore += (analyses.length - uniqueValues + 1) / analyses.length
    })
    
    const baseConfidence = agreementScore / fields.length
    
    // Boost confidence if xAI is involved (due to its advanced capabilities)
    const hasXAI = analyses.some(a => a.provider === 'xAI Grok')
    const xaiBoost = hasXAI ? 0.1 : 0
    
    return Math.min(baseConfidence + xaiBoost, 0.99)
  }

  private mergeArrays(arrays: any[][]): any[] {
    const merged = new Set()
    arrays.forEach(arr => {
      if (arr) arr.forEach(item => merged.add(item))
    })
    return Array.from(merged)
  }

  private averageValues(values: number[]): number {
    const valid = values.filter(v => v && !isNaN(v))
    if (valid.length === 0) return 0
    return valid.reduce((a, b) => a + b, 0) / valid.length
  }

  private deduplicateAnomalies(anomalies: any[]): any[] {
    const seen = new Set()
    return anomalies.filter(a => {
      const key = JSON.stringify(a)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private async fileToBase64(file: Blob): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}