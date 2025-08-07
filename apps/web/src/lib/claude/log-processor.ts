/**
 * @fileMetadata
 * @purpose "Process and integrate production error logs into Claude Learning System"
 * @dependencies ["@/lib"]
 * @owner ai-team
 * @status stable
 */

import {
  logProductionErrorBatch,
  productionErrorMonitor,
} from "./production-error-monitor";
import { claudeErrorLogger } from "./claude-error-logger";
import { logger } from "@/lib/logger";

interface RawLogEntry {
  event_message: string;
  id: string;
  identifier: string;
  method: string;
  path: string;
  search?: string;
  status_code: number;
  timestamp: number;
}

/**
 * Process raw error log entries and integrate learnings
 */
export async function processErrorLogs(logEntries: RawLogEntry[]): Promise<{
  processed: number;
  patterns: number;
  learningsCreated: number;
  errorsLogged: number;
}> {
  const results = {
    processed: 0,
    patterns: 0,
    learningsCreated: 0,
    errorsLogged: 0,
  };

  try {
    // Convert raw logs to standardized format
    const processedLogs = logEntries.map((entry) => ({
      method: entry.method,
      path: entry.path,
      status_code: entry.status_code,
      timestamp: new Date(entry.timestamp / 1000), // Convert microseconds to milliseconds
      id: entry.id,
      search: entry.search,
    }));

    // Analyze patterns and create learnings
    const patterns = await logProductionErrorBatch(processedLogs);
    results.patterns = patterns.length;

    // Log specific error patterns to Claude Learning System
    for (const pattern of patterns) {
      if (pattern.frequency > 3 || pattern.severity === "critical") {
        // Log database infrastructure errors
        if (pattern.statusCode === 404) {
          const objectName = extractObjectName(pattern.endpoint);
          if (objectName) {
            await productionErrorMonitor.logDatabaseInfrastructureError(
              objectName,
              getObjectType(pattern.endpoint),
              pattern.endpoint,
              pattern.affectedUsers,
            );
            results.errorsLogged++;
          }
        }

        // Log user profile access errors
        if (
          pattern.statusCode === 400 &&
          pattern.endpoint.includes("user_profiles")
        ) {
          for (const userId of pattern.affectedUsers) {
            await productionErrorMonitor.logUserProfileAccessError(
              userId,
              pattern.method as "GET" | "PATCH" | "POST",
              pattern.rootCause || "User profile access denied",
            );
            results.errorsLogged++;
          }
        }

        // Log storage errors
        if (pattern.endpoint.includes("storage")) {
          const bucketName = extractBucketName(pattern.endpoint);
          if (bucketName) {
            for (const userId of pattern.affectedUsers) {
              await productionErrorMonitor.logStorageConfigError(
                bucketName,
                pattern.method,
                userId,
                pattern.rootCause || "Storage access failed",
              );
              results.errorsLogged++;
            }
          }
        }

        // Create general learning pattern
        await claudeErrorLogger.recordLearning(
          `production-${pattern.statusCode}-${pattern.method.toLowerCase()}`,
          `${pattern.method} ${pattern.endpoint} returns ${pattern.statusCode} with frequency ${pattern.frequency}`,
          pattern.resolution || "Manual investigation and fix required",
          [
            "production-error",
            `status-${pattern.statusCode}`,
            `method-${pattern.method.toLowerCase()}`,
            pattern.severity,
          ],
          pattern.frequency > 10 ? 0.9 : 0.7,
        );
        results.learningsCreated++;
      }
    }

    results.processed = logEntries.length;

    logger.info("Error log processing completed", results);
    return results;
  } catch (error) {
    logger.error(
      "Failed to process error logs",
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}

/**
 * Extract database object name from endpoint
 */
function extractObjectName(endpoint: string): string | null {
  const match = endpoint.match(/\/rest\/v1\/([^?]+)/);
  return match ? match[1] : null;
}

/**
 * Determine object type from endpoint
 */
function getObjectType(endpoint: string): "table" | "view" | "function" {
  if (endpoint.includes("_extended")) return "view";
  if (endpoint.includes("/rpc/")) return "function";
  return "table";
}

/**
 * Extract bucket name from storage endpoint
 */
function extractBucketName(endpoint: string): string | null {
  const match = endpoint.match(/\/storage\/v1\/object\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Helper function to manually process the error logs you provided
 */
export async function processClaimGuardianErrorLogs(): Promise<void> {
  // Sample of your error log data converted to processable format
  const sampleLogs: RawLogEntry[] = [
    {
      event_message: "PATCH | 400 | 71.79.56.135",
      id: "6f9a2959-610a-4b18-b7b7-51c5a8898890",
      identifier: "tmlrvecuwgppbaynesji",
      method: "PATCH",
      path: "/rest/v1/user_profiles",
      search: "?id=eq.950dc54e-52a0-436a-a30b-15ebd2ecaeb3",
      status_code: 400,
      timestamp: 1754384853742000,
    },
    {
      event_message: "GET | 404 | 71.79.56.135",
      id: "82ebdb6b-daa8-44cd-b16a-15cdb3a2226d",
      identifier: "tmlrvecuwgppbaynesji",
      method: "GET",
      path: "/rest/v1/policy_documents_extended",
      search:
        "?select=*&user_id=eq.950dc54e-52a0-436a-a30b-15ebd2ecaeb3&extraction_status=eq.completed&order=created_at.desc",
      status_code: 404,
      timestamp: 1754384831458000,
    },
    {
      event_message: "GET | 404 | 71.79.56.135",
      id: "4945905a-d3b7-435f-8ac1-159367028375",
      identifier: "tmlrvecuwgppbaynesji",
      method: "GET",
      path: "/rest/v1/learnings",
      search:
        "?select=category_id%2Cseverity%2Ccreated_at&created_at=gte.2025-07-29T09%3A04%3A26.535Z",
      status_code: 404,
      timestamp: 1754384666643000,
    },
    {
      event_message: "POST | 404 | 71.79.56.135",
      id: "9f083bdb-e062-4c1d-8b08-76f247948103",
      identifier: "tmlrvecuwgppbaynesji",
      method: "POST",
      path: "/rest/v1/rpc/search_learnings",
      search: undefined,
      status_code: 404,
      timestamp: 1754384663684000,
    },
  ];

  const results = await processErrorLogs(sampleLogs);

  console.log("ClaimGuardian Error Log Processing Results:", {
    ...results,
    message: "Error patterns have been integrated into Claude Learning System",
  });
}

/**
 * Start automated error log monitoring
 */
export function startErrorLogMonitoring(): void {
  // Start health monitoring every hour
  productionErrorMonitor.startHealthMonitoring(60);

  logger.info("Error log monitoring started", {
    healthCheckInterval: "60 minutes",
    features: [
      "database-health",
      "error-pattern-analysis",
      "learning-integration",
    ],
  });
}

/**
 * Stop automated error log monitoring
 */
export function stopErrorLogMonitoring(): void {
  productionErrorMonitor.stopHealthMonitoring();
  logger.info("Error log monitoring stopped");
}
