/**
 * @fileMetadata
 * @purpose "Claude-specific error logging and learning system"
 * @owner ai-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger", "@claimguardian/db"]
 * @exports ["claudeErrorLogger", "ClaudeErrorContext", "ClaudeError"]
 * @complexity high
 * @tags ["claude", "error", "learning", "ai", "optimization"]
 * @status stable
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import type { Database } from "@claimguardian/db";

export interface ClaudeErrorContext {
  // Task context
  taskType:
    | "code-generation"
    | "file-modification"
    | "debugging"
    | "analysis"
    | "planning"
    | "other";
  taskDescription: string;
  userIntent: string;

  // Code context
  filePath?: string;
  fileType?: string;
  codeLanguage?: string;
  framework?: string;

  // Error context
  errorType:
    | "syntax"
    | "logic"
    | "type"
    | "runtime"
    | "build"
    | "deployment"
    | "integration"
    | "assumption";
  toolsUsed: string[];
  previousAttempts?: number;

  // Learning context
  mistakeCategory: string;
  rootCause?: string;
  correctApproach?: string;
  lessonLearned?: string;

  // Environment
  sessionId?: string;
  timestamp: string;
  codebaseContext?: {
    framework: string;
    languages: string[];
    packages: string[];
    patterns: string[];
  };
}

export interface ClaudeError {
  id: string;
  error_message: string;
  error_stack?: string;
  error_details: string;
  context: any;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  resolution_method?: string;
  learning_applied: boolean;
  pattern_id?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface ClaudeLearning {
  id: string;
  pattern_name: string;
  mistake_pattern: string;
  solution_pattern: string;
  context_tags: string[];
  confidence_score: number;
  usage_count: number;
  success_rate: number;
  created_at: Date;
  updated_at: Date;
}

class ClaudeErrorLogger {
  private supabase: SupabaseClient<Database> | null = null;
  private isEnabled: boolean = true;
  private sessionId: string;
  private learningCache: Map<string, ClaudeLearning[]> = new Map();

  constructor() {
    this.sessionId = `claude-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
    } catch (error) {
      logger.warn("Claude Error Logger: Supabase client not initialized");
      this.isEnabled = false;
    }
  }

  /**
   * Log a Claude-specific error with learning context
   */
  async logError(
    error: Error | string,
    context: Omit<ClaudeErrorContext, "timestamp" | "sessionId">,
    severity: ClaudeError["severity"] = "medium",
  ): Promise<string | null> {
    const errorObj = typeof error === "string" ? new Error(error) : error;

    // Create full context
    const fullContext: ClaudeErrorContext = {
      ...context,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    // Generate unique error ID
    const errorId = `claude-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log to console for immediate visibility
    console.error(
      `[CLAUDE ERROR] ${fullContext.taskType} - ${fullContext.mistakeCategory}:`,
      {
        error: errorObj.message,
        context: fullContext,
        severity,
        errorId,
      },
    );

    // Create error record
    const claudeError: Omit<ClaudeError, "created_at" | "updated_at"> = {
      id: errorId,
      error_message: errorObj.message,
      error_stack: errorObj.stack,
      error_details: this.extractErrorDetails(errorObj, fullContext),
      context: fullContext as any,
      severity,
      resolved: false,
      learning_applied: false,
    };

    // Save to database
    if (this.isEnabled && this.supabase) {
      // TODO: Create claude_errors table in database schema
      // try {
      //   const { error: dbError } = await this.supabase
      //     .from('claude_errors')
      //     .insert([
      //       {
      //         ...claudeError,
      //         created_at: new Date().toISOString()
      //       }
      //     ])
      //   if (dbError) {
      //     logger.error('Failed to save Claude error to database', {}, dbError)
      //   }
      // } catch (dbError) {
      //   logger.error('Database error while saving Claude error', {}, dbError instanceof Error ? dbError : new Error(String(dbError)))
      // }
    }

    // Analyze for patterns and create learning
    this.analyzeAndLearn(claudeError);

    return errorId;
  }

  /**
   * Mark an error as resolved with the solution method
   */
  async resolveError(
    errorId: string,
    resolutionMethod: string,
    lessonLearned?: string,
  ): Promise<void> {
    if (!this.isEnabled || !this.supabase) return;

    try {
      const updateData: any = {
        resolved: true,
        resolution_method: resolutionMethod,
        updated_at: new Date().toISOString(),
      };

      // TODO: Update context with lesson learned when claude_errors table exists
      // if (lessonLearned) {
      //   const { data: errorData } = await this.supabase
      //     .from('claude_errors')
      //     .select('context')
      //     .eq('id', errorId)
      //     .single()

      //   if (errorData && errorData.context) {
      //     updateData.context = {
      //       ...(errorData.context as Record<string, unknown>),
      //       lessonLearned,
      //       correctApproach: resolutionMethod
      //     }
      //   } else {
      //     updateData.context = {
      //       lessonLearned,
      //       correctApproach: resolutionMethod
      //     }
      //   }
      // }

      // await this.supabase
      //   .from('claude_errors')
      //   .update(updateData)
      //   .eq('id', errorId)

      logger.info("Claude error resolved", { errorId, resolutionMethod });
    } catch (error) {
      logger.error(
        "Failed to resolve Claude error",
        { errorId },
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Get relevant learnings for current context
   */
  async getRelevantLearnings(
    context: Partial<ClaudeErrorContext>,
  ): Promise<ClaudeLearning[]> {
    if (!this.isEnabled || !this.supabase) return [];

    // Create cache key from context
    const cacheKey = this.createContextKey(context);

    // Check cache first
    if (this.learningCache.has(cacheKey)) {
      return this.learningCache.get(cacheKey)!;
    }

    try {
      // TODO: Query learnings when claude_learnings table exists
      // const { data: learnings, error } = await this.supabase
      //   .from('claude_learnings')
      //   .select('*')
      //   .contains('context_tags', this.extractContextTags(context))
      //   .gte('confidence_score', 0.7)
      //   .order('usage_count', { ascending: false })
      //   .limit(10)

      // if (error) {
      //   logger.error('Failed to fetch Claude learnings', {}, error)
      //   return []
      // }

      // Cache the results
      // const typedLearnings = (learnings || []) as unknown as ClaudeLearning[]
      // this.learningCache.set(cacheKey, typedLearnings)
      // return typedLearnings

      // Return empty for now
      return [];
    } catch (error) {
      logger.error(
        "Error fetching Claude learnings",
        {},
        error instanceof Error ? error : new Error(String(error)),
      );
      return [];
    }
  }

  /**
   * Get error patterns and statistics
   */
  async getErrorPatterns(
    timeRange: "day" | "week" | "month" = "week",
  ): Promise<any[]> {
    if (!this.isEnabled || !this.supabase) return [];

    const timeFilter = this.getTimeFilter(timeRange);

    try {
      // TODO: Implement when claude_errors table exists
      // const { data, error } = await this.supabase
      //   .from('claude_errors')
      //   .select(`
      //     context->taskType,
      //     context->errorType,
      //     context->mistakeCategory,
      //     severity,
      //     resolved,
      //     created_at
      //   `)
      //   .gte('created_at', timeFilter)
      //   .order('created_at', { ascending: false })

      // if (error) {
      //   logger.error('Failed to fetch Claude error patterns', {}, error)
      //   return []
      // }

      // Return empty patterns for now
      return [];
    } catch (error) {
      logger.error(
        "Error analyzing Claude error patterns",
        {},
        error instanceof Error ? error : new Error(String(error)),
      );
      return [];
    }
  }

  /**
   * Create or update a learning pattern
   */
  async recordLearning(
    patternName: string,
    mistakePattern: string,
    solutionPattern: string,
    contextTags: string[],
    confidenceScore: number = 0.8,
  ): Promise<void> {
    if (!this.isEnabled || !this.supabase) return;

    try {
      // TODO: Create learning entries when claude_learnings table exists
      // const { data: existing } = await this.supabase
      //   .from('claude_learnings')
      //   .select('*')
      //   .eq('pattern_name', patternName)
      //   .single()

      // if (existing) {
      //   // Update existing learning
      //   await this.supabase
      //     .from('claude_learnings')
      //     .update({
      //       solution_pattern: solutionPattern,
      //       context_tags: contextTags,
      //       confidence_score: Math.max(existing.confidence_score || 0, confidenceScore),
      //       usage_count: (existing.usage_count || 0) + 1,
      //       updated_at: new Date().toISOString()
      //     })
      //     .eq('id', existing.id)
      // } else {
      //   // Create new learning
      //   await this.supabase
      //     .from('claude_learnings')
      //     .insert([
      //       {
      //         id: `learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      //         pattern_name: patternName,
      //         mistake_pattern: mistakePattern,
      //         solution_pattern: solutionPattern,
      //         context_tags: contextTags,
      //         confidence_score: confidenceScore,
      //         usage_count: 1,
      //         success_rate: 1.0,
      //         created_at: new Date().toISOString(),
      //         updated_at: new Date().toISOString()
      //       }
      //     ])
      // }

      // Clear cache to refresh learnings
      this.learningCache.clear();

      logger.info("Claude learning recorded", { patternName, confidenceScore });
    } catch (error) {
      logger.error(
        "Failed to record Claude learning",
        { patternName },
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Extract detailed error information
   */
  private extractErrorDetails(
    error: Error,
    context: ClaudeErrorContext,
  ): string {
    const details = {
      message: error.message,
      name: error.name,
      stack: error.stack?.split("\n").slice(0, 5), // First 5 lines of stack
      context: {
        task: context.taskDescription,
        file: context.filePath,
        tools: context.toolsUsed,
        attempts: context.previousAttempts,
      },
    };

    return JSON.stringify(details, null, 2);
  }

  /**
   * Analyze error for patterns and create learnings
   */
  private async analyzeAndLearn(
    error: Omit<ClaudeError, "created_at" | "updated_at">,
  ): Promise<void> {
    // Extract pattern from error
    const patternName = `${(error.context as any).taskType}-${(error.context as any).errorType}-${(error.context as any).mistakeCategory}`;
    const mistakePattern = this.extractMistakePattern(error);

    // Try to determine solution pattern from similar resolved errors
    const contextTags = this.extractContextTags(error.context as any);

    // This would be enhanced with ML in the future
    if ((error.context as any).correctApproach) {
      await this.recordLearning(
        patternName,
        mistakePattern,
        (error.context as any).correctApproach,
        contextTags,
        0.6, // Lower confidence for self-reported solutions
      );
    }
  }

  /**
   * Extract mistake pattern from error
   */
  private extractMistakePattern(
    error: Omit<ClaudeError, "created_at" | "updated_at">,
  ): string {
    return `Task: ${(error.context as any).taskType}, Error: ${(error.context as any).errorType}, Category: ${(error.context as any).mistakeCategory}, Tools: [${((error.context as any).toolsUsed as any[]).join(", ")}]`;
  }

  /**
   * Extract context tags for matching
   */
  private extractContextTags(context: Partial<ClaudeErrorContext>): string[] {
    const tags: string[] = [];

    if (context.taskType) tags.push(`task:${context.taskType}`);
    if (context.errorType) tags.push(`error:${context.errorType}`);
    if (context.mistakeCategory)
      tags.push(`mistake:${context.mistakeCategory}`);
    if (context.fileType) tags.push(`file:${context.fileType}`);
    if (context.codeLanguage) tags.push(`lang:${context.codeLanguage}`);
    if (context.framework) tags.push(`framework:${context.framework}`);

    context.toolsUsed?.forEach((tool) => tags.push(`tool:${tool}`));

    return tags;
  }

  /**
   * Create cache key from context
   */
  private createContextKey(context: Partial<ClaudeErrorContext>): string {
    return JSON.stringify({
      taskType: context.taskType,
      errorType: context.errorType,
      mistakeCategory: context.mistakeCategory,
      framework: context.framework,
      codeLanguage: context.codeLanguage,
    });
  }

  /**
   * Get time filter for queries
   */
  private getTimeFilter(range: "day" | "week" | "month"): string {
    const now = new Date();
    const daysBack = range === "day" ? 1 : range === "week" ? 7 : 30;
    const timeFilter = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return timeFilter.toISOString();
  }

  /**
   * Analyze error patterns for insights
   */
  private analyzePatterns(errors: any[]): any[] {
    const patterns = new Map();

    errors.forEach((error) => {
      const key = `${error.taskType}-${error.errorType}-${error.mistakeCategory}`;
      if (!patterns.has(key)) {
        patterns.set(key, {
          pattern: key,
          count: 0,
          resolved: 0,
          severity: { low: 0, medium: 0, high: 0, critical: 0 },
        });
      }

      const pattern = patterns.get(key);
      pattern.count++;
      if (error.resolved) pattern.resolved++;
      pattern.severity[error.severity]++;
    });

    return Array.from(patterns.values()).sort((a, b) => b.count - a.count);
  }
}

// Export singleton instance
export const claudeErrorLogger = new ClaudeErrorLogger();

// Helper functions for common error scenarios
export const claudeErrorHelpers = {
  // Code generation errors
  codeGeneration: {
    syntaxError: (
      error: Error,
      filePath: string,
      language: string,
      description: string,
    ) =>
      claudeErrorLogger.logError(
        error,
        {
          taskType: "code-generation",
          taskDescription: description,
          userIntent: "Generate correct code",
          filePath,
          codeLanguage: language,
          errorType: "syntax",
          toolsUsed: ["Write", "Edit"],
          mistakeCategory: "syntax-violation",
        },
        "medium",
      ),

    logicError: (
      error: Error,
      filePath: string,
      description: string,
      correctApproach?: string,
    ) =>
      claudeErrorLogger.logError(
        error,
        {
          taskType: "code-generation",
          taskDescription: description,
          userIntent: "Generate functionally correct code",
          filePath,
          errorType: "logic",
          toolsUsed: ["Write", "Edit"],
          mistakeCategory: "logic-flaw",
          correctApproach,
        },
        "high",
      ),
  },

  // File modification errors
  fileModification: {
    editError: (
      error: Error,
      filePath: string,
      description: string,
      toolsUsed: string[],
    ) =>
      claudeErrorLogger.logError(
        error,
        {
          taskType: "file-modification",
          taskDescription: description,
          userIntent: "Modify file correctly",
          filePath,
          errorType: "runtime",
          toolsUsed,
          mistakeCategory: "edit-failure",
        },
        "medium",
      ),

    typeError: (
      error: Error,
      filePath: string,
      language: string,
      description: string,
    ) =>
      claudeErrorLogger.logError(
        error,
        {
          taskType: "file-modification",
          taskDescription: description,
          userIntent: "Maintain type safety",
          filePath,
          codeLanguage: language,
          errorType: "type",
          toolsUsed: ["Edit", "MultiEdit"],
          mistakeCategory: "type-mismatch",
        },
        "medium",
      ),
  },

  // Analysis errors
  analysis: {
    misunderstanding: (
      description: string,
      userIntent: string,
      mistakeCategory: string,
    ) =>
      claudeErrorLogger.logError(
        new Error("Analysis misunderstanding"),
        {
          taskType: "analysis",
          taskDescription: description,
          userIntent,
          errorType: "assumption",
          toolsUsed: ["Read", "Grep", "Glob"],
          mistakeCategory,
        },
        "low",
      ),

    incompleteAnalysis: (description: string, missingAspect: string) =>
      claudeErrorLogger.logError(
        new Error("Incomplete analysis"),
        {
          taskType: "analysis",
          taskDescription: description,
          userIntent: "Complete comprehensive analysis",
          errorType: "logic",
          toolsUsed: ["Read", "Grep"],
          mistakeCategory: "incomplete-analysis",
          rootCause: `Missing: ${missingAspect}`,
        },
        "medium",
      ),
  },
};
