/**
 * @fileMetadata
 * @purpose Automated triggers for Claude self-reflection and continuous improvement
 * @owner ai-team
 * @dependencies ["@/lib/claude/claude-self-reflection", "@/lib/logger"]
 * @exports ["ReflectionTriggers", "autoReflect", "reflectionTriggers"]
 * @complexity medium
 * @tags ["claude", "automation", "triggers", "continuous-improvement"]
 * @status active
 */

import { claudeSelfReflection, ReflectionContext } from './claude-self-reflection'
import { claudeErrorLogger } from './claude-error-logger'
import { logger } from '@/lib/logger'

export interface ReflectionTrigger {
  name: string
  condition: (context: TaskExecutionContext) => boolean
  priority: 'high' | 'medium' | 'low'
  description: string
  enabled: boolean
}

export interface TaskExecutionContext {
  taskType: ReflectionContext['taskType']
  startTime: number
  endTime?: number
  toolsUsed: string[]
  errorsCount: number
  stepsCount: number
  filesAccessed: number
  success?: boolean
  complexity: 'simple' | 'medium' | 'complex'
}

class ReflectionTriggers {
  private triggers: ReflectionTrigger[] = []
  private activeTask: TaskExecutionContext | null = null
  private reflectionQueue: string[] = []

  constructor() {
    this.initializeDefaultTriggers()
  }

  /**
   * Initialize default reflection triggers
   */
  private initializeDefaultTriggers() {
    this.triggers = [
      {
        name: 'high-error-rate',
        condition: (ctx) => ctx.errorsCount > 2,
        priority: 'high',
        description: 'Trigger reflection when error count exceeds 2',
        enabled: true
      },
      {
        name: 'long-execution-time',
        condition: (ctx) => {
          if (!ctx.endTime) return false
          const duration = ctx.endTime - ctx.startTime
          return duration > 5 * 60 * 1000 // 5 minutes
        },
        priority: 'medium',
        description: 'Trigger reflection for tasks taking over 5 minutes',
        enabled: true
      },
      {
        name: 'many-tools-used',
        condition: (ctx) => ctx.toolsUsed.length > 5,
        priority: 'medium',
        description: 'Trigger reflection when using more than 5 tools',
        enabled: true
      },
      {
        name: 'complex-task-failure',
        condition: (ctx) => ctx.complexity === 'complex' && ctx.success === false,
        priority: 'high',
        description: 'Trigger reflection for complex task failures',
        enabled: true
      },
      {
        name: 'many-steps-taken',
        condition: (ctx) => ctx.stepsCount > 15,
        priority: 'low',
        description: 'Trigger reflection for tasks with many steps',
        enabled: true
      },
      {
        name: 'excessive-file-access',
        condition: (ctx) => ctx.filesAccessed > 10,
        priority: 'medium',
        description: 'Trigger reflection when accessing many files',
        enabled: true
      },
      {
        name: 'task-success-but-inefficient',
        condition: (ctx) => {
          if (!ctx.endTime || ctx.success !== true) return false
          const duration = ctx.endTime - ctx.startTime
          // Successful but took long time with many tools
          return duration > 3 * 60 * 1000 && ctx.toolsUsed.length > 4
        },
        priority: 'medium',
        description: 'Trigger reflection for successful but potentially inefficient tasks',
        enabled: true
      }
    ]
  }

  /**
   * Start tracking a task for potential reflection
   */
  startTaskTracking(
    taskType: ReflectionContext['taskType'],
    complexity: TaskExecutionContext['complexity'] = 'medium'
  ): string {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.activeTask = {
      taskType,
      startTime: Date.now(),
      toolsUsed: [],
      errorsCount: 0,
      stepsCount: 0,
      filesAccessed: 0,
      complexity
    }
    
    logger.info('Task tracking started for reflection triggers', { taskId, taskType })
    return taskId
  }

  /**
   * Log a tool usage during task execution
   */
  logToolUsage(tool: string) {
    if (!this.activeTask) return
    
    if (!this.activeTask.toolsUsed.includes(tool)) {
      this.activeTask.toolsUsed.push(tool)
    }
  }

  /**
   * Log a step taken during task execution
   */
  logStep() {
    if (!this.activeTask) return
    this.activeTask.stepsCount++
  }

  /**
   * Log an error during task execution
   */
  logError() {
    if (!this.activeTask) return
    this.activeTask.errorsCount++
  }

  /**
   * Log file access during task execution
   */
  logFileAccess(filePath: string) {
    if (!this.activeTask) return
    this.activeTask.filesAccessed++
  }

  /**
   * Complete task tracking and check for reflection triggers
   */
  async completeTaskTracking(success: boolean): Promise<boolean> {
    if (!this.activeTask) return false
    
    this.activeTask.endTime = Date.now()
    this.activeTask.success = success
    
    // Check all enabled triggers
    const triggeredReflections = this.triggers
      .filter(trigger => trigger.enabled && trigger.condition(this.activeTask!))
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
    
    if (triggeredReflections.length > 0) {
      logger.info('Reflection triggers activated', {
        triggers: triggeredReflections.map(t => t.name),
        taskContext: this.activeTask
      })
      
      // Trigger reflection automatically
      await this.executeReflection(triggeredReflections[0])
      
      // Clear active task
      this.activeTask = null
      return true
    }
    
    // Clear active task
    this.activeTask = null
    return false
  }

  /**
   * Execute reflection based on triggered condition
   */
  private async executeReflection(trigger: ReflectionTrigger): Promise<void> {
    if (!this.activeTask) return
    
    const taskId = claudeSelfReflection.startReflection(
      this.activeTask.taskType,
      `Task triggered by: ${trigger.description}`,
      'Improve efficiency and approach',
      'Automated reflection trigger',
      'Standard approach with monitoring',
      ['automated-reflection']
    )
    
    // Log the steps and context we tracked
    this.activeTask.toolsUsed.forEach(tool => {
      claudeSelfReflection.logStep(`Used ${tool} tool`, 'Tool usage during task execution', tool)
    })
    
    // Log errors if any
    for (let i = 0; i < this.activeTask.errorsCount; i++) {
      claudeSelfReflection.logError(`Error ${i + 1} during task execution`)
    }
    
    // Complete reflection with the task outcome
    const quality = this.determineTaskQuality(this.activeTask)
    await claudeSelfReflection.completeReflection(
      this.activeTask.success || false,
      quality,
      this.activeTask.success ? 'high' : 'low'
    )
    
    logger.info('Automated reflection completed', {
      taskId,
      trigger: trigger.name,
      quality
    })
  }

  /**
   * Determine task quality based on execution metrics
   */
  private determineTaskQuality(context: TaskExecutionContext): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (!context.success) return 'poor'
    
    const duration = context.endTime ? context.endTime - context.startTime : 0
    const isEfficient = duration < 2 * 60 * 1000 && context.toolsUsed.length <= 3 && context.errorsCount === 0
    const isGood = duration < 5 * 60 * 1000 && context.toolsUsed.length <= 5 && context.errorsCount <= 1
    
    if (isEfficient) return 'excellent'
    if (isGood) return 'good'
    return 'acceptable'
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
    }
  }

  /**
   * Add custom reflection trigger
   */
  addCustomTrigger(trigger: ReflectionTrigger) {
    this.triggers.push(trigger)
    logger.info('Custom reflection trigger added', { name: trigger.name })
  }

  /**
   * Enable/disable trigger
   */
  setTriggerEnabled(triggerName: string, enabled: boolean) {
    const trigger = this.triggers.find(t => t.name === triggerName)
    if (trigger) {
      trigger.enabled = enabled
      logger.info('Reflection trigger updated', { name: triggerName, enabled })
    }
  }

  /**
   * Get current trigger configuration
   */
  getTriggers(): ReflectionTrigger[] {
    return [...this.triggers]
  }

  /**
   * Get trigger statistics
   */
  getTriggerStats(): {
    totalTriggers: number
    enabledTriggers: number
    highPriorityTriggers: number
    queuedReflections: number
  } {
    return {
      totalTriggers: this.triggers.length,
      enabledTriggers: this.triggers.filter(t => t.enabled).length,
      highPriorityTriggers: this.triggers.filter(t => t.enabled && t.priority === 'high').length,
      queuedReflections: this.reflectionQueue.length
    }
  }
}

// Export singleton instance
export const reflectionTriggers = new ReflectionTriggers()

/**
 * Higher-order function to automatically wrap functions with reflection tracking
 */
export function autoReflect<T extends (...args: any[]) => Promise<any>>(
  taskType: ReflectionContext['taskType'],
  complexity: TaskExecutionContext['complexity'] = 'medium',
  fn: T
): T {
  return (async (...args: any[]) => {
    // Start tracking
    const taskId = reflectionTriggers.startTaskTracking(taskType, complexity)
    
    // Monkey patch console methods to track steps
    const originalLog = console.log
    const originalError = console.error
    let stepCount = 0
    
    console.log = (...logArgs: any[]) => {
      stepCount++
      if (stepCount % 5 === 0) { // Log every 5th console.log as a step
        reflectionTriggers.logStep()
      }
      return originalLog.apply(console, logArgs)
    }
    
    console.error = (...errorArgs: any[]) => {
      reflectionTriggers.logError()
      return originalError.apply(console, errorArgs)
    }
    
    try {
      const result = await fn(...args)
      
      // Complete tracking with success
      await reflectionTriggers.completeTaskTracking(true)
      
      return result
    } catch (error) {
      reflectionTriggers.logError()
      
      // Complete tracking with failure
      await reflectionTriggers.completeTaskTracking(false)
      
      throw error
    } finally {
      // Restore console methods
      console.log = originalLog
      console.error = originalError
    }
  }) as T
}

/**
 * Manual reflection trigger for immediate analysis
 */
export async function triggerManualReflection(
  taskType: ReflectionContext['taskType'],
  taskDescription: string,
  userIntent: string,
  actualSteps: string[],
  toolsUsed: string[],
  errorsEncountered: string[],
  success: boolean,
  completionQuality: 'excellent' | 'good' | 'acceptable' | 'poor',
  alternativeApproaches?: string[]
): Promise<void> {
  const taskId = claudeSelfReflection.startReflection(
    taskType,
    taskDescription,
    userIntent,
    'Manual reflection request',
    'Unknown approach - manual analysis',
    []
  )
  
  // Log all the steps
  actualSteps.forEach((step, index) => {
    claudeSelfReflection.logStep(step, `Step ${index + 1} reasoning`, toolsUsed[index])
  })
  
  // Log errors
  errorsEncountered.forEach(error => {
    claudeSelfReflection.logError(error)
  })
  
  // Complete reflection
  await claudeSelfReflection.completeReflection(
    success,
    completionQuality,
    success ? 'high' : 'low',
    alternativeApproaches
  )
  
  logger.info('Manual reflection completed', { taskId, taskType })
}

/**
 * Smart reflection wrapper that adapts to task complexity
 */
export function smartReflect<T extends (...args: any[]) => Promise<any>>(
  taskType: ReflectionContext['taskType'],
  taskDescription: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    // Determine complexity based on task type and description
    const complexity = determineTaskComplexity(taskType, taskDescription)
    
    // Use appropriate reflection level
    if (complexity === 'complex') {
      return await autoReflect(taskType, complexity, fn)(...args)
    } else if (complexity === 'medium') {
      // Lighter tracking for medium tasks
      const wrappedFn = autoReflect(taskType, complexity, fn)
      return await wrappedFn(...args)
    } else {
      // No automatic reflection for simple tasks, just execute
      return await fn(...args)
    }
  }) as T
}

/**
 * Determine task complexity based on type and description
 */
function determineTaskComplexity(
  taskType: ReflectionContext['taskType'],
  description: string
): TaskExecutionContext['complexity'] {
  const complexKeywords = ['complex', 'multiple', 'integration', 'migration', 'refactor', 'architecture']
  const mediumKeywords = ['modify', 'update', 'fix', 'enhance', 'add']
  
  if (taskType === 'planning' || complexKeywords.some(keyword => 
    description.toLowerCase().includes(keyword)
  )) {
    return 'complex'
  }
  
  if (mediumKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
    return 'medium'
  }
  
  return 'simple'
}

/**
 * Reflection summary for dashboard
 */
export function getReflectionSummary(): {
  triggersActive: number
  reflectionsToday: number
  topImprovementAreas: string[]
  efficiencyTrend: 'improving' | 'stable' | 'declining'
} {
  const stats = reflectionTriggers.getTriggerStats()
  const reflectionStats = claudeSelfReflection.getReflectionStats()
  
  return {
    triggersActive: stats.enabledTriggers,
    reflectionsToday: 0, // Would need to track daily counts
    topImprovementAreas: reflectionStats.topInsightCategories,
    efficiencyTrend: 'improving' // Would calculate from historical data
  }
}