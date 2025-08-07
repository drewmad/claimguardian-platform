/**
 * @fileMetadata
 * @purpose "LIVE DEMO - Claude Complete Learning System in Action"
 * @dependencies ["@/lib","lucide-react","react"]
 * @owner ai-team
 * @status stable
 * @tags ["demo", "live-example", "complete-learning"]
 */

import {
  withCompleteLearning,
  quickLearn,
} from "./claude-complete-learning-system";

// ================================================================
// 🧠 LIVE DEMONSTRATION - Complete Learning System Method 1
// ================================================================

/**
 * Example 1: Code Generation with Complete Learning
 * This demonstrates how Claude learns and improves from every task
 */
const createSmartComponent = withCompleteLearning(
  "code-generation",
  "Create a smart notification component with TypeScript",
  "Build reusable notification system for ClaimGuardian",
  "User wants better notification UI",
  {
    filePath: "src/components/ui/smart-notification.tsx",
    codeLanguage: "typescript",
    framework: "react",
    complexity: "medium",
    tools: ["Write", "Read"],
    enableAutoReflection: true,
  },
  async () => {
    console.log(
      "🧠 Claude Learning System ACTIVE - analyzing previous learnings...",
    );

    // The system automatically:
    // 1. Queries similar component generation tasks
    // 2. Applies previous TypeScript patterns
    // 3. Uses React best practices from learnings
    // 4. Monitors approach efficiency

    const componentCode = `
import React from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  dismissible?: boolean
  onDismiss?: (id: string) => void
  className?: string
}

export function SmartNotification({
  id,
  type,
  title,
  message,
  duration = 5000,
  dismissible = true,
  onDismiss,
  className
}: NotificationProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  // Auto-dismiss after duration
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(id), 300) // Wait for animation
  }

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info': return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 dark:bg-green-900/20'
      case 'error': return 'bg-red-50 border-red-200 dark:bg-red-900/20'
      case 'warning': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20'
      case 'info': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'relative flex items-start space-x-3 rounded-lg border p-4 shadow-sm transition-all duration-300',
        getBackgroundColor(),
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h4>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      )}
    </div>
  )
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = React.useState<NotificationProps[]>([])

  const addNotification = React.useCallback((notification: Omit<NotificationProps, 'id'>) => {
    const id = \`notification-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`
    setNotifications(prev => [...prev, { ...notification, id }])
    return id
  }, [])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = React.useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  }
}
`;

    console.log("✅ Component generated with applied learnings!");
    console.log(
      "🔍 Reflection will analyze: TypeScript usage, React patterns, accessibility",
    );

    return componentCode;
  },
);

/**
 * Example 2: Quick Learning for File Modification
 */
const improveExistingComponent = quickLearn.fileModification(
  "Add error boundary to existing component",
  "src/components/ui/smart-notification.tsx",
  async () => {
    console.log("🧠 Quick Learn: Applying file modification best practices...");

    // System automatically applies learnings like:
    // - Always read file first
    // - Use proper TypeScript patterns
    // - Maintain existing code style

    return "Error boundary added with learning insights applied!";
  },
);

/**
 * Example 3: Smart Learning for Debugging
 */
const debugWithLearning = quickLearn.debugging(
  "Fix TypeScript errors in notification system",
  "src/components/ui/smart-notification.tsx",
  async () => {
    console.log("🧠 Debug Mode: Using previous debugging patterns...");

    // System applies debugging learnings like:
    // - Check type definitions first
    // - Look for common TypeScript issues
    // - Apply fixes that worked before

    return "TypeScript errors resolved using learned patterns!";
  },
);

/**
 * Example 4: Analysis with Learning Context
 */
const analyzeWithContext = quickLearn.analysis(
  "Analyze notification system performance and suggest improvements",
  async () => {
    console.log("🧠 Analysis Mode: Applying previous analysis patterns...");

    // System provides context like:
    // - Previous performance analysis approaches
    // - Common optimization patterns
    // - Best practices for React performance

    return {
      performanceIssues: [
        "Re-renders on every notification change",
        "Timers not cleaned up properly",
      ],
      optimizations: [
        "Use React.memo for notification items",
        "Implement proper timer cleanup",
        "Add virtualization for many notifications",
      ],
      learningApplied: "Used previous React performance analysis patterns",
    };
  },
);

// ================================================================
// 🎯 PRACTICAL USAGE EXAMPLES
// ================================================================

/**
 * How to use these in your actual development workflow
 */
export async function demonstrateLearningSystem() {
  console.log("🚀 Starting Complete Learning System Demonstration...\n");

  try {
    // Example 1: Generate component with full learning
    console.log("1️⃣ Generating smart component with learning system...");
    const componentResult = await createSmartComponent();
    console.log("✅ Component created successfully!");
    console.log(
      "📊 Learning data captured for future component generation tasks\n",
    );

    // Example 2: File modification with quick learning
    console.log("2️⃣ Improving component with quick learning...");
    const modificationResult = await improveExistingComponent();
    console.log("✅ Component improved with applied learnings!\n");

    // Example 3: Debugging with learning context
    console.log("3️⃣ Debugging with previous patterns...");
    const debugResult = await debugWithLearning();
    console.log("✅ Bugs fixed using learned debugging approaches!\n");

    // Example 4: Analysis with context
    console.log("4️⃣ Analyzing with learned patterns...");
    const analysisResult = await analyzeWithContext();
    console.log("✅ Analysis complete with previous insights applied!");
    console.log("📈 Performance recommendations generated\n");

    console.log("🎉 Complete Learning System Demo Finished!");
    console.log("🧠 All tasks contributed to Claude's learning database");
    console.log("📊 Future similar tasks will be faster and more accurate");

    return {
      success: true,
      tasksCompleted: 4,
      learningsGenerated: "Multiple patterns learned and applied",
      nextSteps: "System ready for production use",
    };
  } catch (error) {
    console.error("❌ Demo encountered error:", error);
    console.log("🧠 Error logged to learning system for future improvement");

    // Even errors contribute to learning!
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      learningNote: "Error patterns captured for future prevention",
    };
  }
}

// ================================================================
// 🔧 PRODUCTION USAGE PATTERNS
// ================================================================

/**
 * Template for wrapping your existing functions
 */
export function wrapExistingFunction<
  T extends (...args: unknown[]) => Promise<any>,
>(
  functionName: string,
  originalFunction: T,
  options: {
    taskType:
      | "code-generation"
      | "file-modification"
      | "debugging"
      | "analysis"
      | "planning";
    filePath?: string;
    language?: string;
    complexity?: "simple" | "medium" | "complex";
  },
): T {
  const wrappedFunction = withCompleteLearning(
    options.taskType,
    functionName,
    `Execute ${functionName} with learning`,
    `User requested ${functionName}`,
    {
      filePath: options.filePath,
      codeLanguage: options.language,
      complexity: options.complexity || "medium",
      enableAutoReflection: true,
    },
    originalFunction,
  );

  return wrappedFunction as T;
}

/**
 * Smart wrapper that automatically determines task type
 */
export function smartWrap<T extends (...args: unknown[]) => Promise<any>>(
  functionName: string,
  originalFunction: T,
): T {
  // Auto-detect task type from function name
  let taskType:
    | "code-generation"
    | "file-modification"
    | "debugging"
    | "analysis"
    | "planning" = "analysis";

  if (functionName.includes("create") || functionName.includes("generate")) {
    taskType = "code-generation";
  } else if (
    functionName.includes("edit") ||
    functionName.includes("modify") ||
    functionName.includes("update")
  ) {
    taskType = "file-modification";
  } else if (functionName.includes("debug") || functionName.includes("fix")) {
    taskType = "debugging";
  } else if (functionName.includes("plan")) {
    taskType = "planning";
  }

  return wrapExistingFunction(functionName, originalFunction, { taskType });
}

// Export everything for easy usage
export {
  createSmartComponent,
  improveExistingComponent,
  debugWithLearning,
  analyzeWithContext,
};
