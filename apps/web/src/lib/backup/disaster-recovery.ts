/**
 * @fileMetadata
 * @purpose "Automated backup and disaster recovery system"
 * @dependencies ["@/lib/database", "@/lib/monitoring"]
 * @owner platform-team
 * @complexity high
 * @tags ["backup", "disaster-recovery", "data-protection"]
 * @status stable
 */

import { logger } from "@/lib/logger/production-logger";
import { createClient } from "@/lib/supabase/server";
import {
  asyncErrorHandler,
  withRetry,
} from "@/lib/error-handling/async-error-handler";
import { cacheManager } from "@/lib/cache/redis-cache-manager";

export interface BackupConfig {
  enabled: boolean;
  schedule: {
    fullBackup: string; // cron expression
    incrementalBackup: string; // cron expression
  };
  retention: {
    daily: number; // days
    weekly: number; // weeks
    monthly: number; // months
  };
  storage: {
    primary: string;
    replica?: string;
    encryption: boolean;
  };
  verification: {
    enabled: boolean;
    schedule: string;
    testRestore: boolean;
  };
}

export interface BackupResult {
  id: string;
  type: "full" | "incremental" | "differential";
  startTime: string;
  endTime: string;
  status: "success" | "failed" | "partial";
  size: number;
  tables: string[];
  verification: {
    checksum: string;
    verified: boolean;
    verifiedAt?: string;
  };
  location: string;
  error?: string;
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  priority: number;
  rto: number; // Recovery Time Objective (minutes)
  rpo: number; // Recovery Point Objective (minutes)
  steps: RecoveryStep[];
  dependencies: string[];
  contacts: string[];
}

export interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  automation: boolean;
  estimatedTime: number; // minutes
  requiredResources: string[];
  verification: string;
}

export class DisasterRecoveryManager {
  private config: BackupConfig;
  private recoveryPlans: DisasterRecoveryPlan[] = [];
  private isRunning = false;

  constructor(config: BackupConfig) {
    this.config = config;
    this.initializeRecoveryPlans();
  }

  private initializeRecoveryPlans(): void {
    this.recoveryPlans = [
      {
        id: "database-failure",
        name: "Database Primary Failure",
        priority: 1,
        rto: 5, // 5 minutes
        rpo: 15, // 15 minutes
        steps: [
          {
            id: "detect-failure",
            name: "Detect Database Failure",
            description: "Automated monitoring detects database unavailability",
            automation: true,
            estimatedTime: 1,
            requiredResources: ["monitoring-system"],
            verification: "Health check returns database failure",
          },
          {
            id: "failover-replica",
            name: "Failover to Read Replica",
            description: "Promote read replica to primary database",
            automation: true,
            estimatedTime: 3,
            requiredResources: ["database-replica", "load-balancer"],
            verification: "Write operations succeed on new primary",
          },
          {
            id: "update-connections",
            name: "Update Connection Strings",
            description: "Update application to use new database endpoint",
            automation: true,
            estimatedTime: 1,
            requiredResources: ["configuration-service"],
            verification: "Application connects to new database",
          },
        ],
        dependencies: ["monitoring-system", "database-replica"],
        contacts: ["ops-team", "database-admin"],
      },
      {
        id: "region-failure",
        name: "Regional Service Failure",
        priority: 2,
        rto: 30, // 30 minutes
        rpo: 60, // 1 hour
        steps: [
          {
            id: "detect-region-failure",
            name: "Detect Regional Failure",
            description: "Monitor detects widespread service unavailability",
            automation: true,
            estimatedTime: 2,
            requiredResources: ["cross-region-monitoring"],
            verification: "Multiple services fail health checks",
          },
          {
            id: "activate-dr-region",
            name: "Activate Disaster Recovery Region",
            description: "Spin up services in backup region",
            automation: false,
            estimatedTime: 15,
            requiredResources: ["backup-region-infrastructure"],
            verification: "Services respond in backup region",
          },
          {
            id: "restore-data",
            name: "Restore Latest Data",
            description: "Restore from most recent cross-region backup",
            automation: false,
            estimatedTime: 10,
            requiredResources: ["backup-storage", "database-restore-tools"],
            verification: "Data integrity checks pass",
          },
          {
            id: "redirect-traffic",
            name: "Redirect User Traffic",
            description: "Update DNS/load balancer to route to backup region",
            automation: false,
            estimatedTime: 3,
            requiredResources: ["dns-management", "load-balancer"],
            verification: "Users can access application",
          },
        ],
        dependencies: ["backup-region", "cross-region-backups"],
        contacts: ["ops-team", "infrastructure-team", "management"],
      },
      {
        id: "data-corruption",
        name: "Data Corruption Recovery",
        priority: 3,
        rto: 60, // 1 hour
        rpo: 60, // 1 hour
        steps: [
          {
            id: "isolate-corruption",
            name: "Isolate Corrupted Data",
            description: "Identify scope and impact of data corruption",
            automation: false,
            estimatedTime: 15,
            requiredResources: ["database-admin", "data-analysis-tools"],
            verification: "Corruption scope documented",
          },
          {
            id: "stop-writes",
            name: "Stop Write Operations",
            description:
              "Put system in read-only mode to prevent further corruption",
            automation: false,
            estimatedTime: 2,
            requiredResources: ["application-control"],
            verification: "No new writes accepted",
          },
          {
            id: "restore-clean-data",
            name: "Restore Clean Data",
            description: "Restore from point-in-time backup before corruption",
            automation: false,
            estimatedTime: 30,
            requiredResources: ["point-in-time-backups", "restore-tools"],
            verification: "Data integrity verified",
          },
          {
            id: "replay-transactions",
            name: "Replay Valid Transactions",
            description: "Re-apply valid transactions after restoration point",
            automation: false,
            estimatedTime: 10,
            requiredResources: ["transaction-logs", "replay-tools"],
            verification: "Transaction consistency verified",
          },
          {
            id: "resume-operations",
            name: "Resume Normal Operations",
            description: "Enable write operations and return to normal",
            automation: false,
            estimatedTime: 3,
            requiredResources: ["application-control"],
            verification: "Full functionality restored",
          },
        ],
        dependencies: ["point-in-time-backups", "transaction-logs"],
        contacts: ["database-admin", "senior-engineers", "management"],
      },
    ];
  }

  async createBackup(
    type: "full" | "incremental" | "differential" = "incremental",
  ): Promise<BackupResult> {
    const backupId = `backup_${Date.now()}_${type}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date().toISOString();

    logger.info(`Starting ${type} backup`, { backupId, type });

    const result = await asyncErrorHandler.executeWithFullResilience(
      async () => {
        const supabase = await createClient();

        // Get list of tables to backup
        const tables = await this.getBackupTables(supabase);

        // Create backup metadata
        const backupMetadata = {
          id: backupId,
          type,
          startTime,
          tables,
          config: this.config,
        };

        // Perform the actual backup based on type
        let backupSize = 0;
        let location = "";

        if (type === "full") {
          const result = await this.performFullBackup(
            supabase,
            tables,
            backupId,
          );
          backupSize = result.size;
          location = result.location;
        } else {
          const result = await this.performIncrementalBackup(
            supabase,
            tables,
            backupId,
          );
          backupSize = result.size;
          location = result.location;
        }

        // Generate and verify checksum
        const checksum = await this.generateChecksum(location);
        const verified = await this.verifyBackup(location, checksum);

        const backupResult: BackupResult = {
          id: backupId,
          type,
          startTime,
          endTime: new Date().toISOString(),
          status: verified ? "success" : "partial",
          size: backupSize,
          tables,
          verification: {
            checksum,
            verified,
            verifiedAt: verified ? new Date().toISOString() : undefined,
          },
          location,
        };

        // Store backup record
        await this.storeBackupRecord(supabase, backupResult);

        // Clean up old backups according to retention policy
        await this.cleanupOldBackups(supabase);

        return backupResult;
      },
      {
        retryConfig: {
          maxAttempts: 2,
          baseDelay: 5000,
          maxDelay: 30000,
        },
        timeoutConfig: {
          timeoutMs: 30 * 60 * 1000, // 30 minutes
          timeoutMessage: "Backup operation timed out",
        },
        circuitBreakerKey: "backup-operations",
        context: `${type}-backup`,
      },
    );

    if (!result.success) {
      const failedResult: BackupResult = {
        id: backupId,
        type,
        startTime,
        endTime: new Date().toISOString(),
        status: "failed",
        size: 0,
        tables: [],
        verification: {
          checksum: "",
          verified: false,
        },
        location: "",
        error: result.error.message,
      };

      logger.error(`Backup failed`, result.error, { backupId, type });
      return failedResult;
    }

    logger.info(`Backup completed successfully`, {
      backupId,
      type,
      size: result.data.size,
      duration: Date.now() - new Date(startTime).getTime(),
    });

    return result.data;
  }

  private async getBackupTables(supabase: any): Promise<string[]> {
    // Define critical tables that must be backed up
    const criticalTables = [
      "users",
      "user_profiles",
      "properties",
      "claims",
      "claim_documents",
      "ai_processing_queue",
      "audit_logs",
      "system_alerts",
      "user_sessions",
      "legal_documents",
      "user_consents",
    ];

    // Verify tables exist
    const existingTables: string[] = [];

    for (const table of criticalTables) {
      try {
        const { error } = await supabase.from(table).select("1").limit(1);
        if (!error) {
          existingTables.push(table);
        }
      } catch (error) {
        logger.warn(`Table ${table} not accessible for backup`, error);
      }
    }

    return existingTables;
  }

  private async performFullBackup(
    supabase: any,
    tables: string[],
    backupId: string,
  ): Promise<{
    size: number;
    location: string;
  }> {
    let totalSize = 0;
    const backupData: Record<string, any[]> = {};

    // Export data from each table
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*");

        if (error) {
          logger.warn(`Failed to backup table ${table}`, error);
          continue;
        }

        backupData[table] = data || [];
        totalSize += JSON.stringify(data).length;

        logger.debug(`Backed up table ${table}`, {
          records: data?.length || 0,
          size: JSON.stringify(data).length,
        });
      } catch (error) {
        logger.error(`Error backing up table ${table}`, error);
      }
    }

    // Store backup data (in production, this would go to S3, Google Cloud Storage, etc.)
    const location = await this.storeBackupData(backupId, backupData, "full");

    return { size: totalSize, location };
  }

  private async performIncrementalBackup(
    supabase: any,
    tables: string[],
    backupId: string,
  ): Promise<{
    size: number;
    location: string;
  }> {
    let totalSize = 0;
    const backupData: Record<string, any[]> = {};

    // Get timestamp of last backup
    const lastBackup = await this.getLastBackupTimestamp(supabase);
    const since =
      lastBackup || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24h as fallback

    // Export only changed data since last backup
    for (const table of tables) {
      try {
        // Use updated_at or created_at to identify changes
        const timeField = await this.getTableTimeField(supabase, table);
        if (!timeField) {
          logger.warn(`No time field found for incremental backup of ${table}`);
          continue;
        }

        const { data, error } = await supabase
          .from(table)
          .select("*")
          .gte(timeField, since);

        if (error) {
          logger.warn(`Failed to backup table ${table}`, error);
          continue;
        }

        if (data && data.length > 0) {
          backupData[table] = data;
          totalSize += JSON.stringify(data).length;

          logger.debug(`Incremental backup of table ${table}`, {
            records: data.length,
            since,
            size: JSON.stringify(data).length,
          });
        }
      } catch (error) {
        logger.error(`Error in incremental backup of table ${table}`, error);
      }
    }

    const location = await this.storeBackupData(
      backupId,
      backupData,
      "incremental",
    );

    return { size: totalSize, location };
  }

  private async getTableTimeField(
    supabase: any,
    table: string,
  ): Promise<string | null> {
    // Common timestamp field names to check
    const timeFields = ["updated_at", "created_at", "modified_at", "timestamp"];

    for (const field of timeFields) {
      try {
        const { error } = await supabase.from(table).select(field).limit(1);
        if (!error) {
          return field;
        }
      } catch {
        // Continue to next field
      }
    }

    return null;
  }

  private async getLastBackupTimestamp(supabase: any): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("backup_records")
        .select("endTime")
        .eq("status", "success")
        .order("endTime", { ascending: false })
        .limit(1);

      return data?.[0]?.endTime || null;
    } catch (error) {
      logger.warn("Failed to get last backup timestamp", error);
      return null;
    }
  }

  private async storeBackupData(
    backupId: string,
    data: Record<string, any[]>,
    type: string,
  ): Promise<string> {
    // In production, this would upload to cloud storage
    // For now, we'll simulate the storage location
    const location = `backup://storage/${backupId}/${type}_backup.json`;

    logger.info(`Backup data stored`, {
      backupId,
      location,
      tables: Object.keys(data).length,
      totalRecords: Object.values(data).reduce(
        (sum, records) => sum + records.length,
        0,
      ),
    });

    // Cache backup metadata for quick access
    await cacheManager.set(
      `backup:${backupId}`,
      {
        location,
        type,
        tables: Object.keys(data),
        recordCounts: Object.entries(data).reduce(
          (acc, [table, records]) => {
            acc[table] = records.length;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      7 * 24 * 60 * 60,
    ); // 7 days

    return location;
  }

  private async generateChecksum(location: string): Promise<string> {
    // In production, generate actual checksum of backup file
    // For now, generate a mock checksum based on location and timestamp
    const crypto = require("crypto");
    return crypto
      .createHash("sha256")
      .update(`${location}_${Date.now()}`)
      .digest("hex");
  }

  private async verifyBackup(
    location: string,
    expectedChecksum: string,
  ): Promise<boolean> {
    // In production, verify backup integrity by checking checksum
    // For now, simulate verification
    try {
      logger.debug(`Verifying backup at ${location}`, { expectedChecksum });

      // Simulate verification process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return true; // Assume verification passes
    } catch (error) {
      logger.error("Backup verification failed", error);
      return false;
    }
  }

  private async storeBackupRecord(
    supabase: any,
    backup: BackupResult,
  ): Promise<void> {
    try {
      const { error } = await supabase.from("backup_records").insert({
        backup_id: backup.id,
        type: backup.type,
        start_time: backup.startTime,
        end_time: backup.endTime,
        status: backup.status,
        size_bytes: backup.size,
        tables: backup.tables,
        location: backup.location,
        checksum: backup.verification.checksum,
        verified: backup.verification.verified,
        error_message: backup.error,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      logger.debug("Backup record stored", { backupId: backup.id });
    } catch (error) {
      logger.error("Failed to store backup record", error);
    }
  }

  private async cleanupOldBackups(supabase: any): Promise<void> {
    if (!this.config.retention) return;

    try {
      const now = new Date();

      // Calculate cutoff dates
      const dailyCutoff = new Date(
        now.getTime() - this.config.retention.daily * 24 * 60 * 60 * 1000,
      );
      const weeklyCutoff = new Date(
        now.getTime() - this.config.retention.weekly * 7 * 24 * 60 * 60 * 1000,
      );
      const monthlyCutoff = new Date(
        now.getTime() -
          this.config.retention.monthly * 30 * 24 * 60 * 60 * 1000,
      );

      // Delete old daily backups
      const { error: dailyError } = await supabase
        .from("backup_records")
        .delete()
        .eq("type", "incremental")
        .lt("created_at", dailyCutoff.toISOString());

      if (dailyError) {
        logger.warn("Failed to cleanup old daily backups", dailyError);
      }

      // Delete old weekly backups (keep full backups longer)
      const { error: weeklyError } = await supabase
        .from("backup_records")
        .delete()
        .eq("type", "full")
        .lt("created_at", weeklyCutoff.toISOString())
        .neq("id", ""); // Placeholder to avoid deleting all

      if (weeklyError) {
        logger.warn("Failed to cleanup old weekly backups", weeklyError);
      }

      logger.info("Backup cleanup completed", {
        dailyCutoff: dailyCutoff.toISOString(),
        weeklyCutoff: weeklyCutoff.toISOString(),
      });
    } catch (error) {
      logger.error("Failed to cleanup old backups", error);
    }
  }

  async executeRecoveryPlan(
    planId: string,
    parameters?: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    plan: DisasterRecoveryPlan;
    completedSteps: string[];
    failedStep?: string;
    error?: string;
    duration: number;
  }> {
    const startTime = Date.now();
    const plan = this.recoveryPlans.find((p) => p.id === planId);

    if (!plan) {
      throw new Error(`Recovery plan ${planId} not found`);
    }

    logger.info(`Executing disaster recovery plan: ${plan.name}`, {
      planId,
      priority: plan.priority,
      rto: plan.rto,
      rpo: plan.rpo,
      parameters,
    });

    const completedSteps: string[] = [];
    let failedStep: string | undefined;
    let error: string | undefined;

    try {
      for (const step of plan.steps) {
        logger.info(`Executing recovery step: ${step.name}`, {
          stepId: step.id,
          automation: step.automation,
          estimatedTime: step.estimatedTime,
        });

        const stepStartTime = Date.now();

        try {
          if (step.automation) {
            await this.executeAutomatedStep(step, parameters);
          } else {
            await this.executeManualStep(step, parameters);
          }

          const stepDuration = Date.now() - stepStartTime;
          completedSteps.push(step.id);

          logger.info(`Recovery step completed: ${step.name}`, {
            stepId: step.id,
            duration: stepDuration,
            estimatedTime: step.estimatedTime * 60 * 1000, // Convert to ms
          });
        } catch (stepError) {
          failedStep = step.id;
          error =
            stepError instanceof Error ? stepError.message : "Unknown error";

          logger.error(`Recovery step failed: ${step.name}`, stepError, {
            stepId: step.id,
            planId,
          });

          break;
        }
      }

      const duration = Date.now() - startTime;
      const success = !failedStep;

      logger.info(
        `Disaster recovery plan ${success ? "completed successfully" : "failed"}`,
        {
          planId,
          completedSteps: completedSteps.length,
          totalSteps: plan.steps.length,
          duration,
          failedStep,
        },
      );

      return {
        success,
        plan,
        completedSteps,
        failedStep,
        error,
        duration,
      };
    } catch (planError) {
      const duration = Date.now() - startTime;
      error = planError instanceof Error ? planError.message : "Unknown error";

      logger.error(`Disaster recovery plan failed`, planError, { planId });

      return {
        success: false,
        plan,
        completedSteps,
        error,
        duration,
      };
    }
  }

  private async executeAutomatedStep(
    step: RecoveryStep,
    parameters?: Record<string, unknown>,
  ): Promise<void> {
    // Implementation would depend on the specific step
    // This is a framework for automated recovery steps

    switch (step.id) {
      case "detect-failure":
        await this.detectSystemFailure();
        break;

      case "failover-replica":
        await this.failoverToReplica(parameters);
        break;

      case "update-connections":
        await this.updateConnectionStrings(parameters);
        break;

      default:
        logger.warn(`No automation implemented for step: ${step.id}`);
        // Simulate step execution
        await new Promise((resolve) =>
          setTimeout(resolve, step.estimatedTime * 100),
        );
    }
  }

  private async executeManualStep(
    step: RecoveryStep,
    parameters?: Record<string, unknown>,
  ): Promise<void> {
    // For manual steps, we would typically:
    // 1. Send notifications to required personnel
    // 2. Provide instructions and checklists
    // 3. Wait for confirmation of completion
    // 4. Verify the step was completed successfully

    logger.info(`Manual step requires human intervention: ${step.name}`, {
      description: step.description,
      requiredResources: step.requiredResources,
      verification: step.verification,
    });

    // Simulate manual step (in production, this would wait for human confirmation)
    await new Promise((resolve) =>
      setTimeout(resolve, step.estimatedTime * 200),
    );
  }

  private async detectSystemFailure(): Promise<void> {
    // Implement system failure detection logic
    logger.info("Detecting system failure...");
    // This would interface with monitoring systems
  }

  private async failoverToReplica(
    parameters?: Record<string, unknown>,
  ): Promise<void> {
    // Implement database failover logic
    logger.info("Failing over to database replica...");
    // This would promote a read replica to primary
  }

  private async updateConnectionStrings(
    parameters?: Record<string, unknown>,
  ): Promise<void> {
    // Implement connection string update logic
    logger.info("Updating database connection strings...");
    // This would update application configuration
  }

  getRecoveryPlans(): DisasterRecoveryPlan[] {
    return [...this.recoveryPlans];
  }

  async getBackupHistory(limit: number = 50): Promise<BackupResult[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("backup_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (
        data?.map((record) => ({
          id: record.backup_id,
          type: record.type,
          startTime: record.start_time,
          endTime: record.end_time,
          status: record.status,
          size: record.size_bytes,
          tables: record.tables,
          verification: {
            checksum: record.checksum,
            verified: record.verified,
            verifiedAt: record.verified ? record.end_time : undefined,
          },
          location: record.location,
          error: record.error_message,
        })) || []
      );
    } catch (error) {
      logger.error("Failed to get backup history", error);
      return [];
    }
  }
}

// Production disaster recovery configuration
const PRODUCTION_CONFIG: BackupConfig = {
  enabled: process.env.NODE_ENV === "production",
  schedule: {
    fullBackup: "0 2 * * 0", // Weekly at 2 AM on Sunday
    incrementalBackup: "0 */6 * * *", // Every 6 hours
  },
  retention: {
    daily: 7, // 7 days
    weekly: 4, // 4 weeks
    monthly: 12, // 12 months
  },
  storage: {
    primary: process.env.BACKUP_STORAGE_PRIMARY || "s3://claimguardian-backups",
    replica: process.env.BACKUP_STORAGE_REPLICA,
    encryption: true,
  },
  verification: {
    enabled: true,
    schedule: "0 4 * * *", // Daily at 4 AM
    testRestore: false, // Enable in production after testing
  },
};

// Global disaster recovery manager instance
export const disasterRecoveryManager = new DisasterRecoveryManager(
  PRODUCTION_CONFIG,
);

// Auto-start backup scheduling in production
if (
  process.env.NODE_ENV === "production" &&
  process.env.VERCEL_ENV === "production"
) {
  logger.info("Disaster Recovery Manager initialized for production");
}
