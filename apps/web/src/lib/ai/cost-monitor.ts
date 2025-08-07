/**
 * @fileMetadata
 * @purpose "AI Cost Monitoring System with budget controls and predictive alerts"
 * @dependencies []
 * @owner ai-team
 * @status stable
 */

import { logger } from "@/lib/logger/production-logger";

interface CostBudget {
  id: string;
  name: string;
  type: "daily" | "weekly" | "monthly" | "yearly";
  amount: number;
  spent: number;
  remaining: number;
  featureId?: string;
  userId?: string;
  alertThresholds: {
    warning: number; // percentage
    critical: number; // percentage
  };
  isActive: boolean;
  resetDate: Date;
}

interface CostAlert {
  id: string;
  type:
    | "budget_warning"
    | "budget_critical"
    | "budget_exceeded"
    | "spike_detected"
    | "prediction_high";
  level: "info" | "warning" | "critical";
  message: string;
  budgetId?: string;
  featureId?: string;
  currentSpend: number;
  budgetAmount?: number;
  threshold?: number;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
}

interface CostMetrics {
  totalSpent: number;
  dailySpend: number;
  weeklySpend: number;
  monthlySpend: number;
  avgDailySpend: number;
  predictedMonthlySpend: number;
  costPerRequest: number;
  costPerFeature: Record<string, number>;
  costTrend: "increasing" | "decreasing" | "stable";
}

interface SpendingPattern {
  hour: number;
  avgCost: number;
  requestCount: number;
  day: string;
  weeklyPattern: number[];
  monthlyPattern: number[];
}

class AICostMonitor {
  private budgets: Map<string, CostBudget> = new Map();
  private alerts: CostAlert[] = [];
  private spendingHistory: Array<{
    timestamp: Date;
    cost: number;
    featureId: string;
    userId?: string;
    requestType: string;
  }> = [];

  private alertCallbacks: Array<(alert: CostAlert) => void> = [];

  constructor() {
    this.initializeDefaultBudgets();
    this.startMonitoring();
  }

  /**
   * Initialize default budgets for new installations
   */
  private initializeDefaultBudgets(): void {
    const defaultBudgets: Omit<CostBudget, "id">[] = [
      {
        name: "Monthly AI Operations",
        type: "monthly",
        amount: 500.0,
        spent: 0,
        remaining: 500.0,
        alertThresholds: { warning: 75, critical: 90 },
        isActive: true,
        resetDate: this.getNextResetDate("monthly"),
      },
      {
        name: "Daily AI Operations",
        type: "daily",
        amount: 50.0,
        spent: 0,
        remaining: 50.0,
        alertThresholds: { warning: 80, critical: 95 },
        isActive: true,
        resetDate: this.getNextResetDate("daily"),
      },
    ];

    defaultBudgets.forEach((budget) => {
      const id = this.generateBudgetId();
      this.budgets.set(id, { ...budget, id });
    });
  }

  /**
   * Record a cost transaction
   */
  recordCost(transaction: {
    cost: number;
    featureId: string;
    userId?: string;
    requestType: "chat" | "image" | "batch";
    modelUsed?: string;
    cacheHit?: boolean;
  }): void {
    // Skip recording if cache hit (no cost)
    if (transaction.cacheHit) return;

    const costEntry = {
      timestamp: new Date(),
      cost: transaction.cost,
      featureId: transaction.featureId,
      userId: transaction.userId,
      requestType: transaction.requestType,
    };

    this.spendingHistory.push(costEntry);

    // Keep only last 30 days of history
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.spendingHistory = this.spendingHistory.filter(
      (entry) => entry.timestamp > thirtyDaysAgo,
    );

    // Update relevant budgets
    this.updateBudgetSpending(
      transaction.cost,
      transaction.featureId,
      transaction.userId,
    );

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Update budget spending
   */
  private updateBudgetSpending(
    cost: number,
    featureId?: string,
    userId?: string,
  ): void {
    for (const budget of this.budgets.values()) {
      // Check if this transaction applies to this budget
      if (this.transactionAppliedToBudget(budget, featureId, userId)) {
        budget.spent += cost;
        budget.remaining = Math.max(0, budget.amount - budget.spent);
      }
    }
  }

  /**
   * Check if transaction applies to a specific budget
   */
  private transactionAppliedToBudget(
    budget: CostBudget,
    featureId?: string,
    userId?: string,
  ): boolean {
    // Global budgets (no specific feature/user) apply to all transactions
    if (!budget.featureId && !budget.userId) return true;

    // Feature-specific budgets
    if (budget.featureId && budget.featureId === featureId) return true;

    // User-specific budgets
    if (budget.userId && budget.userId === userId) return true;

    return false;
  }

  /**
   * Check for budget alerts and spending anomalies
   */
  private checkAlerts(): void {
    // Check budget thresholds
    for (const budget of this.budgets.values()) {
      if (!budget.isActive) continue;

      const spentPercentage = (budget.spent / budget.amount) * 100;

      // Budget exceeded
      if (budget.spent >= budget.amount) {
        this.createAlert({
          type: "budget_exceeded",
          level: "critical",
          message: `Budget "${budget.name}" has been exceeded. Spent: $${budget.spent.toFixed(2)} / $${budget.amount.toFixed(2)}`,
          budgetId: budget.id,
          featureId: budget.featureId,
          currentSpend: budget.spent,
          budgetAmount: budget.amount,
        });
      }
      // Critical threshold
      else if (spentPercentage >= budget.alertThresholds.critical) {
        this.createAlert({
          type: "budget_critical",
          level: "critical",
          message: `Budget "${budget.name}" is at ${spentPercentage.toFixed(1)}% (${budget.alertThresholds.critical}% threshold)`,
          budgetId: budget.id,
          featureId: budget.featureId,
          currentSpend: budget.spent,
          budgetAmount: budget.amount,
          threshold: budget.alertThresholds.critical,
        });
      }
      // Warning threshold
      else if (spentPercentage >= budget.alertThresholds.warning) {
        this.createAlert({
          type: "budget_warning",
          level: "warning",
          message: `Budget "${budget.name}" is at ${spentPercentage.toFixed(1)}% (${budget.alertThresholds.warning}% threshold)`,
          budgetId: budget.id,
          featureId: budget.featureId,
          currentSpend: budget.spent,
          budgetAmount: budget.amount,
          threshold: budget.alertThresholds.warning,
        });
      }
    }

    // Check for spending spikes
    this.checkSpendingSpikes();

    // Check predictive alerts
    this.checkPredictiveAlerts();
  }

  /**
   * Detect unusual spending spikes
   */
  private checkSpendingSpikes(): void {
    const last24Hours = this.getSpendingInPeriod(24 * 60 * 60 * 1000);
    const previous24Hours = this.getSpendingInPeriod(
      24 * 60 * 60 * 1000,
      24 * 60 * 60 * 1000,
    );

    if (previous24Hours > 0) {
      const increasePercentage =
        ((last24Hours - previous24Hours) / previous24Hours) * 100;

      if (increasePercentage > 200) {
        // 200% increase
        this.createAlert({
          type: "spike_detected",
          level: "warning",
          message: `Spending spike detected: ${increasePercentage.toFixed(1)}% increase in last 24 hours ($${last24Hours.toFixed(2)} vs $${previous24Hours.toFixed(2)})`,
          currentSpend: last24Hours,
        });
      }
    }
  }

  /**
   * Check predictive cost alerts
   */
  private checkPredictiveAlerts(): void {
    const metrics = this.getCostMetrics();

    // Check if predicted monthly spend exceeds any monthly budgets
    const monthlyBudgets = Array.from(this.budgets.values()).filter(
      (b) => b.type === "monthly" && b.isActive,
    );

    for (const budget of monthlyBudgets) {
      if (metrics.predictedMonthlySpend > budget.amount * 0.9) {
        // 90% of budget
        this.createAlert({
          type: "prediction_high",
          level: "warning",
          message: `Predicted monthly spend ($${metrics.predictedMonthlySpend.toFixed(2)}) may exceed budget "${budget.name}" ($${budget.amount.toFixed(2)})`,
          budgetId: budget.id,
          currentSpend: metrics.monthlySpend,
          budgetAmount: budget.amount,
        });
      }
    }
  }

  /**
   * Create new alert
   */
  private createAlert(
    alertData: Omit<CostAlert, "id" | "timestamp" | "isResolved">,
  ): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(
      (alert) =>
        !alert.isResolved &&
        alert.type === alertData.type &&
        alert.budgetId === alertData.budgetId &&
        alert.featureId === alertData.featureId,
    );

    if (existingAlert) {
      // Update existing alert instead of creating duplicate
      existingAlert.message = alertData.message;
      existingAlert.currentSpend = alertData.currentSpend;
      existingAlert.timestamp = new Date();
      return;
    }

    const alert: CostAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      isResolved: false,
    };

    this.alerts.unshift(alert); // Add to beginning

    // Keep only last 100 alerts
    this.alerts = this.alerts.slice(0, 100);

    // Trigger alert callbacks
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        logger.error(
          "Alert callback failed",
          error instanceof Error ? error : new Error(String(error)),
          "AICostMonitor"
        );
      }
    });

    logger.info(
      `Cost Alert [${alert.level.toUpperCase()}]: ${alert.message}`,
      { alertId: alert.id, level: alert.level, type: alert.type },
      "AICostMonitor"
    );
  }

  /**
   * Get spending in a specific time period
   */
  private getSpendingInPeriod(periodMs: number, offsetMs = 0): number {
    const endTime = Date.now() - offsetMs;
    const startTime = endTime - periodMs;

    return this.spendingHistory
      .filter((entry) => {
        const entryTime = entry.timestamp.getTime();
        return entryTime >= startTime && entryTime <= endTime;
      })
      .reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get comprehensive cost metrics
   */
  getCostMetrics(): CostMetrics {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    const totalSpent = this.spendingHistory.reduce(
      (sum, entry) => sum + entry.cost,
      0,
    );
    const dailySpend = this.getSpendingInPeriod(dayMs);
    const weeklySpend = this.getSpendingInPeriod(weekMs);
    const monthlySpend = this.getSpendingInPeriod(monthMs);

    // Calculate average daily spend over last 7 days
    const avgDailySpend = weeklySpend / 7;

    // Predict monthly spend based on current trend
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate();
    const predictedMonthlySpend = avgDailySpend * daysInMonth;

    // Calculate cost per request
    const totalRequests = this.spendingHistory.length;
    const costPerRequest = totalRequests > 0 ? totalSpent / totalRequests : 0;

    // Calculate cost per feature
    const costPerFeature = this.spendingHistory.reduce(
      (acc, entry) => {
        acc[entry.featureId] = (acc[entry.featureId] || 0) + entry.cost;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Determine cost trend
    const lastWeekSpend = this.getSpendingInPeriod(weekMs);
    const previousWeekSpend = this.getSpendingInPeriod(weekMs, weekMs);

    let costTrend: "increasing" | "decreasing" | "stable" = "stable";
    if (previousWeekSpend > 0) {
      const trendPercentage =
        ((lastWeekSpend - previousWeekSpend) / previousWeekSpend) * 100;
      if (trendPercentage > 10) costTrend = "increasing";
      else if (trendPercentage < -10) costTrend = "decreasing";
    }

    return {
      totalSpent,
      dailySpend,
      weeklySpend,
      monthlySpend,
      avgDailySpend,
      predictedMonthlySpend,
      costPerRequest,
      costPerFeature,
      costTrend,
    };
  }

  /**
   * Create new budget
   */
  createBudget(
    budgetData: Omit<CostBudget, "id" | "spent" | "remaining" | "resetDate">,
  ): string {
    const id = this.generateBudgetId();
    const budget: CostBudget = {
      ...budgetData,
      id,
      spent: 0,
      remaining: budgetData.amount,
      resetDate: this.getNextResetDate(budgetData.type),
    };

    this.budgets.set(id, budget);
    return id;
  }

  /**
   * Update existing budget
   */
  updateBudget(id: string, updates: Partial<CostBudget>): boolean {
    const budget = this.budgets.get(id);
    if (!budget) return false;

    Object.assign(budget, updates);

    // Recalculate remaining if amount changed
    if ("amount" in updates) {
      budget.remaining = Math.max(0, budget.amount - budget.spent);
    }

    return true;
  }

  /**
   * Delete budget
   */
  deleteBudget(id: string): boolean {
    return this.budgets.delete(id);
  }

  /**
   * Get all budgets
   */
  getBudgets(): CostBudget[] {
    return Array.from(this.budgets.values());
  }

  /**
   * Get active alerts
   */
  getAlerts(includeResolved = false): CostAlert[] {
    return includeResolved
      ? this.alerts
      : this.alerts.filter((alert) => !alert.isResolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;

    alert.isResolved = true;
    alert.resolvedAt = new Date();
    return true;
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: CostAlert) => void): () => void {
    this.alertCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get spending patterns for analytics
   */
  getSpendingPatterns(): SpendingPattern[] {
    const patterns: SpendingPattern[] = [];
    const last7Days = this.spendingHistory.filter(
      (entry) =>
        entry.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );

    // Group by hour for hourly patterns
    const hourlySpending = last7Days.reduce(
      (acc, entry) => {
        const hour = entry.timestamp.getHours();
        if (!acc[hour]) acc[hour] = { cost: 0, count: 0 };
        acc[hour].cost += entry.cost;
        acc[hour].count += 1;
        return acc;
      },
      {} as Record<number, { cost: number; count: number }>,
    );

    for (let hour = 0; hour < 24; hour++) {
      const data = hourlySpending[hour] || { cost: 0, count: 0 };
      patterns.push({
        hour,
        avgCost: data.count > 0 ? data.cost / data.count : 0,
        requestCount: data.count,
        day: new Date().toLocaleDateString(),
        weeklyPattern: [], // Would be populated with more data
        monthlyPattern: [], // Would be populated with more data
      });
    }

    return patterns;
  }

  /**
   * Reset budgets that have reached their reset date
   */
  private resetExpiredBudgets(): void {
    const now = new Date();

    for (const budget of this.budgets.values()) {
      if (budget.resetDate <= now) {
        budget.spent = 0;
        budget.remaining = budget.amount;
        budget.resetDate = this.getNextResetDate(budget.type);

        logger.info(
          `Budget "${budget.name}" has been reset`,
          { budgetId: budget.id, type: budget.type, amount: budget.amount },
          "AICostMonitor"
        );
      }
    }
  }

  /**
   * Get next reset date for budget type
   */
  private getNextResetDate(type: CostBudget["type"]): Date {
    const now = new Date();

    switch (type) {
      case "daily":
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;

      case "weekly":
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;

      case "monthly":
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth;

      case "yearly":
        const nextYear = new Date(now.getFullYear() + 1, 0, 1);
        return nextYear;

      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day
    }
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    // Check for budget resets every hour
    setInterval(
      () => {
        this.resetExpiredBudgets();
      },
      60 * 60 * 1000,
    );

    // Check for alerts every 5 minutes
    setInterval(
      () => {
        this.checkAlerts();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Generate unique budget ID
   */
  private generateBudgetId(): string {
    return `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export data for backup/analysis
   */
  exportData() {
    return {
      budgets: Array.from(this.budgets.values()),
      alerts: this.alerts,
      spendingHistory: this.spendingHistory.slice(-1000), // Last 1000 transactions
      metrics: this.getCostMetrics(),
    };
  }

  /**
   * Import data from backup
   */
  importData(data: unknown) {
    const importData = data as {
      budgets?: CostBudget[];
      alerts?: (CostAlert & {
        timestamp: string | Date;
        resolvedAt?: string | Date;
      })[];
      spendingHistory?: (any & { timestamp: string | Date })[];
    };

    if (importData.budgets) {
      this.budgets.clear();
      importData.budgets.forEach((budget: CostBudget) => {
        this.budgets.set(budget.id, {
          ...budget,
          resetDate: new Date(budget.resetDate),
        });
      });
    }

    if (importData.alerts) {
      this.alerts = importData.alerts.map((alert) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
        resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined,
      }));
    }

    if (importData.spendingHistory) {
      this.spendingHistory = importData.spendingHistory.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    }
  }
}

// Export singleton instance
export const aiCostMonitor = new AICostMonitor();
export type { CostBudget, CostAlert, CostMetrics, SpendingPattern };
