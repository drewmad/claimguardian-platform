/**
 * @fileMetadata
 * @purpose "LLM integration interfaces for Claude Learning System"
 * @dependencies []
 * @owner ai-team
 * @status stable
 */

/**
 * LLM Provider Configuration
 */
export interface LLMProvider {
  name: 'openai' | 'anthropic' | 'gemini' | 'local'
  apiKey?: string
  endpoint?: string
  model: string
  maxTokens: number
  temperature: number
}

/**
 * Learning Synthesis Request
 */
export interface LearningSynthesisRequest {
  learnings: Learning[]
  minConfidence?: number
  timeRange?: {
    from: Date
    to: Date
  }
  focusAreas?: string[]
  maxPatterns?: number
}

/**
 * Synthesized Meta-Pattern
 */
export interface SynthesizedMetaPattern {
  id: string
  name: string
  description: string
  derivedFrom: string[] // Learning IDs
  category: string
  confidence: number
  impact: {
    timeReduction: number
    errorReduction: number
    qualityImprovement: number
  }
  applicableTo: string[]
  prerequisites: string[]
  implementation: {
    steps: string[]
    codeExamples?: CodeExample[]
    warnings?: string[]
  }
  synthesizedAt: Date
  llmProvider: string
}

/**
 * Semantic Similarity Request
 */
export interface SemanticSimilarityRequest {
  query: string | Learning
  candidates: Learning[] | Pattern[]
  threshold?: number
  topK?: number
  useEmbeddings?: boolean
}

/**
 * Similarity Match Result
 */
export interface SimilarityMatch {
  item: Learning | Pattern
  score: number
  reasoning: string
  relevantAspects: string[]
  differences: string[]
}

/**
 * Natural Language Description Request
 */
export interface NaturalLanguageRequest {
  item: Learning | Pattern | BottleneckAnalysis
  audience: 'developer' | 'manager' | 'stakeholder'
  style: 'technical' | 'conversational' | 'executive'
  includeExamples?: boolean
  maxLength?: number
}

/**
 * Natural Language Description
 */
export interface NaturalLanguageDescription {
  title: string
  summary: string
  details: string
  keyPoints: string[]
  examples?: string[]
  actionItems?: string[]
  metadata: {
    readingTime: number
    technicalLevel: 'beginner' | 'intermediate' | 'advanced'
    generatedAt: Date
  }
}

/**
 * Bottleneck Analysis Request
 */
export interface BottleneckAnalysisRequest {
  metrics: PerformanceMetrics
  learnings: Learning[]
  patterns: Pattern[]
  timeframe: 'hour' | 'day' | 'week' | 'month'
  focusArea?: string
}

/**
 * Bottleneck Analysis Result
 */
export interface BottleneckAnalysis {
  id: string
  identifiedBottlenecks: Bottleneck[]
  rootCauses: RootCause[]
  recommendations: Recommendation[]
  estimatedImpact: {
    timesSaved: number
    errorReduction: number
    costSavings: number
  }
  priority: 'critical' | 'high' | 'medium' | 'low'
  analyzedAt: Date
}

/**
 * Identified Bottleneck
 */
export interface Bottleneck {
  id: string
  type: 'performance' | 'process' | 'knowledge' | 'tooling'
  description: string
  frequency: number
  avgTimeWasted: number
  affectedTasks: string[]
  symptoms: string[]
}

/**
 * Root Cause Analysis
 */
export interface RootCause {
  bottleneckId: string
  cause: string
  evidence: string[]
  confidence: number
  relatedLearnings: string[]
}

/**
 * AI-Powered Recommendation
 */
export interface Recommendation {
  id: string
  bottleneckId: string
  title: string
  description: string
  implementation: ImplementationPlan
  expectedOutcome: {
    timeReduction: number
    effortRequired: 'low' | 'medium' | 'high'
    riskLevel: 'low' | 'medium' | 'high'
  }
  relatedPatterns: string[]
  prerequisites: string[]
}

/**
 * Implementation Plan
 */
export interface ImplementationPlan {
  steps: ImplementationStep[]
  estimatedTime: number
  requiredSkills: string[]
  toolsNeeded: string[]
  successCriteria: string[]
}

/**
 * Implementation Step
 */
export interface ImplementationStep {
  order: number
  action: string
  details: string
  codeSnippet?: CodeExample
  validation: string
}

/**
 * Code Example
 */
export interface CodeExample {
  language: string
  code: string
  description: string
  lineHighlights?: number[]
}

/**
 * Auto-Fix Configuration
 */
export interface AutoFixConfig {
  enableAutoFix: boolean
  confidenceThreshold: number
  requireApproval: boolean
  allowedCategories: string[]
  excludedFiles: string[]
  maxChangesPerRun: number
  testBeforeFix: boolean
}

/**
 * Auto-Fix Candidate
 */
export interface AutoFixCandidate {
  id: string
  file: string
  line: number
  issue: string
  pattern: Pattern
  confidence: number
  fix: CodeFix
  estimatedImpact: {
    linesChanged: number
    riskLevel: 'low' | 'medium' | 'high'
  }
}

/**
 * Code Fix
 */
export interface CodeFix {
  type: 'replace' | 'insert' | 'delete' | 'refactor'
  original: string
  replacement: string
  reasoning: string
  relatedLearnings: string[]
}

/**
 * Proactive Suggestion
 */
export interface ProactiveSuggestion {
  id: string
  trigger: 'file-save' | 'commit' | 'pr' | 'schedule'
  file: string
  suggestion: string
  category: string
  reasoning: string
  examples: CodeExample[]
  impact: 'minor' | 'moderate' | 'significant'
  autoApplicable: boolean
}

/**
 * Refactoring Opportunity
 */
export interface RefactoringOpportunity {
  id: string
  scope: 'function' | 'class' | 'module' | 'project'
  target: string
  currentIssues: string[]
  proposedChanges: RefactoringChange[]
  benefits: string[]
  risks: string[]
  effort: 'low' | 'medium' | 'high'
  automatable: boolean
}

/**
 * Refactoring Change
 */
export interface RefactoringChange {
  file: string
  type: 'rename' | 'extract' | 'inline' | 'move' | 'restructure'
  description: string
  before: string
  after: string
  dependencies: string[]
}

/**
 * Self-Improving Generation Config
 */
export interface SelfImprovingConfig {
  enabled: boolean
  learningRate: number
  feedbackIntegration: boolean
  performanceTracking: boolean
  experimentalFeatures: boolean
  versionControl: boolean
}

/**
 * Generation Improvement
 */
export interface GenerationImprovement {
  id: string
  generationType: 'component' | 'function' | 'test' | 'documentation'
  originalTemplate: string
  improvedTemplate: string
  improvements: string[]
  metrics: {
    usageCount: number
    successRate: number
    userSatisfaction: number
    timesSaved: number
  }
  version: number
  createdAt: Date
}

// Re-export base types
export interface Learning {
  id: string
  task: string
  approach: string
  mistakes: string[]
  corrections: string[]
  learnings: string[]
  tags: string[]
  confidence: number
  impact: number
  category: string
  patterns: string[]
  toolsUsed: string[]
  timeSpent: number
  appliedCount: number
  successRate: number
  createdAt: Date
  lastApplied?: Date
}

export interface Pattern {
  id: string
  name: string
  category: string
  description: string
  problem: string
  solution: string
  examples: string[]
  applicableScenarios: string[]
  contraindications: string[]
  confidence: number
  impact: {
    timeReduction: number
    errorReduction: number
    qualityImprovement: number
  }
  metrics: {
    timesApplied: number
    successRate: number
    averageTimeSaved: number
    userRatings: number[]
  }
  relatedPatterns: string[]
  prerequisites: string[]
  tags: string[]
  createdAt: Date
  lastUpdated: Date
  version: number
}

export interface PerformanceMetrics {
  successRate: number
  avgExecutionTime: number
  errorRate: number
  learningApplicationRate: number
  patternUsageRate: number
  userSatisfaction: number
  systemUptime: number
  responseTime: number
}