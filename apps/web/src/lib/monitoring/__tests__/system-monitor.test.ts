/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Comprehensive tests for system monitoring functionality"
 * @dependencies ["jest", "@/lib/monitoring/system-monitor"]
 * @status stable
 */

import { SystemMonitor } from "../system-monitor";
import { cacheService } from "@/lib/cache/cache-service";

// Mock cache service
jest.mock("@/lib/cache/cache-service", () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

// Mock logger
jest.mock("@/lib/logger/production-logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("SystemMonitor", () => {
  let monitor: SystemMonitor;
  const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

  beforeEach(() => {
    monitor = new SystemMonitor({
      intervals: {
        metricsCollection: 1000,
        alertCheck: 500,
        healthCheck: 2000,
        businessMetrics: 5000,
      },
      alerting: {
        enabled: false, // Disable for testing
        channels: ["console"],
        suppressDuplicates: true,
        maxAlertsPerHour: 10,
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.shutdown();
  });

  describe("Metrics Collection", () => {
    test("should collect and return system metrics", async () => {
      const metrics = await monitor.getMetrics();

      expect(metrics).toHaveProperty("performance");
      expect(metrics).toHaveProperty("business");
      expect(metrics).toHaveProperty("ai");
      expect(metrics).toHaveProperty("security");
      expect(metrics).toHaveProperty("florida");

      expect(metrics.performance).toHaveProperty("responseTime");
      expect(metrics.performance).toHaveProperty("throughput");
      expect(metrics.performance).toHaveProperty("errorRate");
      expect(metrics.performance).toHaveProperty("uptime");
      expect(metrics.performance).toHaveProperty("memoryUsage");
      expect(metrics.performance).toHaveProperty("cpuUsage");
    });

    test("should record individual metrics", async () => {
      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue({ count: 5, sum: 500, avg: 100 });

      await monitor.recordMetric("performance", "response_time", 150, { endpoint: "/api/test" });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        "metrics:performance:response_time",
        expect.objectContaining({
          value: 150,
          timestamp: expect.any(String),
          metadata: { endpoint: "/api/test" },
        }),
        86400
      );
    });

    test("should handle metric recording errors gracefully", async () => {
      mockCacheService.set.mockRejectedValue(new Error("Cache failure"));

      await expect(monitor.recordMetric("performance", "test", 100)).resolves.not.toThrow();
    });
  });

  describe("Alert Management", () => {
    test("should create alerts successfully", async () => {
      const alertId = await monitor.createAlert(
        "warning",
        "performance",
        "High Response Time",
        "Response time exceeded threshold",
        { threshold: 1000, actual: 1500 }
      );

      expect(alertId).toMatch(/^alert_/);

      const alerts = monitor.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        id: alertId,
        level: "warning",
        category: "performance",
        title: "High Response Time",
        message: "Response time exceeded threshold",
        resolved: false,
        metadata: { threshold: 1000, actual: 1500 },
      });
    });

    test("should resolve alerts", async () => {
      const alertId = await monitor.createAlert(
        "warning",
        "performance",
        "Test Alert",
        "Test message"
      );

      const resolved = await monitor.resolveAlert(alertId, "Issue fixed");
      expect(resolved).toBe(true);

      const alerts = monitor.getAlerts();
      expect(alerts[0].resolved).toBe(true);
      expect(alerts[0].metadata?.resolution).toBe("Issue fixed");
    });

    test("should filter alerts correctly", async () => {
      await monitor.createAlert("critical", "security", "Critical Security Alert", "Test");
      await monitor.createAlert("warning", "performance", "Performance Warning", "Test");
      await monitor.createAlert("info", "business", "Business Info", "Test");

      const criticalAlerts = monitor.getAlerts({ level: "critical" });
      expect(criticalAlerts).toHaveLength(1);
      expect(criticalAlerts[0].level).toBe("critical");

      const securityAlerts = monitor.getAlerts({ category: "security" });
      expect(securityAlerts).toHaveLength(1);
      expect(securityAlerts[0].category).toBe("security");

      const unresolvedAlerts = monitor.getAlerts({ resolved: false });
      expect(unresolvedAlerts).toHaveLength(3);
    });

    test("should suppress duplicate alerts", async () => {
      // Create first alert
      await monitor.createAlert("warning", "performance", "Duplicate Test", "Message");
      
      // Try to create duplicate (should be suppressed)
      await monitor.createAlert("warning", "performance", "Duplicate Test", "Message");

      const alerts = monitor.getAlerts();
      expect(alerts).toHaveLength(1);
    });

    test("should enforce alert rate limits", async () => {
      const monitorWithLimits = new SystemMonitor({
        alerting: {
          enabled: false,
          channels: ["console"],
          suppressDuplicates: false,
          maxAlertsPerHour: 3,
        },
      });

      // Create alerts up to limit
      await monitorWithLimits.createAlert("info", "system", "Alert 1", "Message");
      await monitorWithLimits.createAlert("info", "system", "Alert 2", "Message");
      await monitorWithLimits.createAlert("info", "system", "Alert 3", "Message");
      
      // This should be dropped due to rate limit
      await monitorWithLimits.createAlert("info", "system", "Alert 4", "Message");

      const alerts = monitorWithLimits.getAlerts();
      expect(alerts).toHaveLength(3);

      monitorWithLimits.shutdown();
    });
  });

  describe("Health Checks", () => {
    test("should return health status", async () => {
      mockCacheService.healthCheck.mockResolvedValue({
        status: "healthy",
        redis: true,
        memory: true,
        latency: 50,
      });

      const health = await monitor.getHealthStatus();

      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("checks");
      expect(health).toHaveProperty("uptime");
      expect(health).toHaveProperty("version");
      expect(health).toHaveProperty("timestamp");

      expect(health.checks).toHaveProperty("database");
      expect(health.checks).toHaveProperty("cache");
      expect(health.checks).toHaveProperty("ai");
      expect(health.checks).toHaveProperty("memory");
      expect(health.checks).toHaveProperty("errorRate");
    });

    test("should handle health check failures", async () => {
      mockCacheService.healthCheck.mockRejectedValue(new Error("Cache down"));

      const health = await monitor.getHealthStatus();
      
      expect(health.status).toBe("unhealthy");
      expect(health.checks.cache?.status).toBe("fail");
    });

    test("should determine overall status correctly", async () => {
      mockCacheService.healthCheck.mockResolvedValue({
        status: "degraded",
        redis: false,
        memory: true,
        latency: 100,
      });

      const health = await monitor.getHealthStatus();
      
      // Should be degraded due to cache issues
      expect(health.status).toBe("degraded");
    });
  });

  describe("Florida Emergency Monitoring", () => {
    test("should detect emergency situations", async () => {
      await monitor.checkFloridaEmergencyStatus();

      const metrics = await monitor.getMetrics();
      expect(metrics.florida).toHaveProperty("emergencyAlerts");
      expect(metrics.florida).toHaveProperty("emergencyTraffic");
      expect(metrics.florida).toHaveProperty("disasterClaims");
      expect(metrics.florida).toHaveProperty("affectedCounties");
    });

    test("should create alerts for emergency situations", async () => {
      // Mock emergency data to trigger alert
      jest.spyOn(monitor as any, "fetchEmergencyData").mockResolvedValue({
        emergencyAlerts: [{
          county: "Orange",
          type: "hurricane",
          level: "emergency",
          timestamp: new Date().toISOString(),
        }],
        emergencyTraffic: 1500,
        disasterClaims: 50,
        affectedCounties: 3,
      });

      await monitor.checkFloridaEmergencyStatus();

      const alerts = monitor.getAlerts({ category: "florida" });
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe("AI Cost Monitoring", () => {
    test("should monitor AI costs and create alerts", async () => {
      // Set high AI costs to trigger alerts
      const highCostMonitor = new SystemMonitor({
        thresholds: {
          responseTime: { warning: 1000, critical: 3000 },
          errorRate: { warning: 5, critical: 10 },
          memoryUsage: { warning: 80, critical: 95 },
          aiCosts: {
            dailyWarning: 100,
            dailyCritical: 200,
            monthlyWarning: 1000,
            monthlyCritical: 2000,
          },
        },
        alerting: {
          enabled: false,
          channels: ["console"],
          suppressDuplicates: true,
          maxAlertsPerHour: 50,
        },
      });

      // Mock high AI costs
      jest.spyOn(highCostMonitor as any, "collectAIMetrics").mockImplementation(() => {
        (highCostMonitor as any).metrics.ai = {
          openaiCosts: { today: 150, thisMonth: 1500 },
          geminiCosts: { today: 100, thisMonth: 1000 },
          averageResponseTime: 2000,
          successRate: 98,
          costPerUser: 25,
        };
      });

      await highCostMonitor.monitorAICosts();

      const alerts = highCostMonitor.getAlerts({ category: "ai" });
      expect(alerts.length).toBeGreaterThan(0);

      highCostMonitor.shutdown();
    });

    test("should track cost per user efficiently", async () => {
      const metrics = await monitor.getMetrics();
      
      expect(metrics.ai.costPerUser).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.ai.costPerUser).toBe("number");
    });
  });

  describe("Performance Monitoring", () => {
    test("should create performance alerts when thresholds exceeded", async () => {
      const performanceMonitor = new SystemMonitor({
        thresholds: {
          responseTime: { warning: 100, critical: 200 },
          errorRate: { warning: 1, critical: 5 },
          memoryUsage: { warning: 50, critical: 80 },
          aiCosts: {
            dailyWarning: 1000,
            dailyCritical: 2000,
            monthlyWarning: 10000,
            monthlyCritical: 20000,
          },
        },
        alerting: {
          enabled: false,
          channels: ["console"],
          suppressDuplicates: true,
          maxAlertsPerHour: 50,
        },
      });

      // Mock high performance metrics
      jest.spyOn(performanceMonitor as any, "collectPerformanceMetrics").mockImplementation(() => {
        (performanceMonitor as any).metrics.performance = {
          responseTime: { avg: 250, p50: 200, p95: 500, p99: 800 },
          throughput: { requestsPerSecond: 100 },
          errorRate: 8,
          uptime: 99.5,
          memoryUsage: { used: 1600, total: 2000, percentage: 85 },
          cpuUsage: 75,
        };
      });

      await (performanceMonitor as any).checkAlerts();

      const alerts = performanceMonitor.getAlerts({ category: "performance" });
      expect(alerts.length).toBeGreaterThan(0);

      // Should have critical alerts for response time, error rate, and memory
      const criticalAlerts = alerts.filter(a => a.level === "critical");
      expect(criticalAlerts.length).toBeGreaterThanOrEqual(3);

      performanceMonitor.shutdown();
    });
  });

  describe("Business Metrics", () => {
    test("should collect business metrics correctly", async () => {
      const metrics = await monitor.getMetrics();

      expect(metrics.business.activeUsers).toBeGreaterThanOrEqual(0);
      expect(metrics.business.newSignups).toBeGreaterThanOrEqual(0);
      expect(metrics.business.aiRequestsToday).toBeGreaterThanOrEqual(0);
      expect(metrics.business.documentsProcessed).toBeGreaterThanOrEqual(0);
      expect(metrics.business.claimsCreated).toBeGreaterThanOrEqual(0);
      expect(metrics.business.revenue.daily).toBeGreaterThanOrEqual(0);
      expect(metrics.business.revenue.monthly).toBeGreaterThanOrEqual(0);
      expect(metrics.business.revenue.annual).toBeGreaterThanOrEqual(0);
      expect(metrics.business.conversionRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Security Monitoring", () => {
    test("should track security metrics", async () => {
      const metrics = await monitor.getMetrics();

      expect(metrics.security).toHaveProperty("failedLogins");
      expect(metrics.security).toHaveProperty("suspiciousActivity");
      expect(metrics.security).toHaveProperty("blockedIPs");
      expect(metrics.security).toHaveProperty("rateLimitViolations");
      expect(metrics.security).toHaveProperty("securityAlerts");

      expect(typeof metrics.security.failedLogins).toBe("number");
      expect(typeof metrics.security.suspiciousActivity).toBe("number");
      expect(typeof metrics.security.blockedIPs).toBe("number");
    });
  });

  describe("Configuration and Initialization", () => {
    test("should initialize with default configuration", () => {
      const defaultMonitor = new SystemMonitor();
      const metrics = defaultMonitor.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe("object");

      defaultMonitor.shutdown();
    });

    test("should accept custom configuration", () => {
      const customMonitor = new SystemMonitor({
        intervals: {
          metricsCollection: 10000,
          alertCheck: 5000,
          healthCheck: 20000,
          businessMetrics: 60000,
        },
        thresholds: {
          responseTime: { warning: 500, critical: 1000 },
          errorRate: { warning: 2, critical: 5 },
          memoryUsage: { warning: 70, critical: 90 },
          aiCosts: {
            dailyWarning: 200,
            dailyCritical: 500,
            monthlyWarning: 5000,
            monthlyCritical: 10000,
          },
        },
      });

      expect(customMonitor).toBeInstanceOf(SystemMonitor);
      customMonitor.shutdown();
    });
  });

  describe("Cleanup and Resource Management", () => {
    test("should shutdown cleanly", () => {
      const testMonitor = new SystemMonitor();
      
      expect(() => testMonitor.shutdown()).not.toThrow();
    });

    test("should handle multiple shutdown calls", () => {
      const testMonitor = new SystemMonitor();
      
      expect(() => {
        testMonitor.shutdown();
        testMonitor.shutdown();
        testMonitor.shutdown();
      }).not.toThrow();
    });
  });
});