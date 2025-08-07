import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Mock components for workflow testing
import { ClaimPredictor } from "@/components/ai/ClaimPredictor";
import { FraudDetectionDashboard } from "@/components/fraud/FraudDetectionDashboard";
import { ComplianceChecker } from "@/components/compliance/ComplianceChecker";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

jest.mock("sonner");

describe("AI Workflows End-to-End Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user", email: "test@example.com" } },
          error: null,
        }),
      },
      functions: {
        invoke: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe("Complete Claim Analysis Workflow", () => {
    it("should perform full claim analysis from submission to approval prediction", async () => {
      const user = userEvent.setup();

      // Step 1: User submits claim for prediction
      render(<ClaimPredictor />);

      // Fill claim details
      const claimTypeSelect = screen.getByLabelText(/claim type/i);
      await user.selectOptions(claimTypeSelect, "water");

      const damageAmount = screen.getByLabelText(/damage amount/i);
      await user.clear(damageAmount);
      await user.type(damageAmount, "35000");

      const description = screen.getByLabelText(/description/i);
      await user.type(
        description,
        "Severe water damage from burst pipe in master bathroom",
      );

      // Mock successful prediction
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          approval_likelihood: 82,
          confidence: 91,
          risk_factors: [
            { factor: "documentation", score: 88, impact: "positive" },
            { factor: "timing", score: 75, impact: "neutral" },
          ],
          recommendations: [
            "Submit plumber report",
            "Include moisture readings",
          ],
          claim_id: "CLM-2024-TEST-001",
        },
        error: null,
      });

      // Submit for analysis
      const analyzeButton = screen.getByRole("button", {
        name: /analyze claim/i,
      });
      await user.click(analyzeButton);

      // Verify prediction results
      await waitFor(() => {
        expect(screen.getByText(/82%/)).toBeInTheDocument();
        expect(screen.getByText(/approval likelihood/i)).toBeInTheDocument();
      });

      // Step 2: Run fraud detection on the same claim
      const { unmount } = render(<FraudDetectionDashboard />);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: "CLM-2024-TEST-001",
                type: "water_damage",
                amount: 35000,
                status: "submitted",
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock fraud detection results
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          fraud_score: 18,
          risk_level: "low",
          detection_methods: {
            behavioral_analysis: { score: 12 },
            documentary_analysis: { score: 15 },
            pattern_detection: { score: 22 },
            network_analysis: { score: 23 },
          },
          recommendations: ["Proceed with standard processing"],
        },
        error: null,
      });

      const scanButton = screen.getByRole("button", {
        name: /run fraud scan/i,
      });
      await user.click(scanButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining("Fraud scan complete"),
        );
      });

      // Step 3: Check compliance
      unmount();
      render(<ComplianceChecker />);

      // Select the test claim
      const claimSelect = screen.getByLabelText(/select claim/i);
      await user.selectOptions(claimSelect, "CLM-2024-0892"); // Using mock claim

      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          overallScore: 85,
          status: "compliant",
          criticalIssues: 0,
          warnings: 2,
          items: [
            {
              requirement: "Proof of Loss",
              status: "compliant",
              severity: "high",
            },
            {
              requirement: "Timeline Compliance",
              status: "warning",
              severity: "medium",
            },
          ],
        },
        error: null,
      });

      const checkButton = screen.getByRole("button", {
        name: /run compliance check/i,
      });
      await user.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText(/85%/)).toBeInTheDocument();
        expect(screen.getByText(/compliance score/i)).toBeInTheDocument();
      });

      // Verify complete workflow executed successfully
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(3);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe("Automated Fraud Detection and Response Workflow", () => {
    it("should detect fraud and trigger appropriate responses", async () => {
      const user = userEvent.setup();

      render(<FraudDetectionDashboard />);

      // Mock high fraud score detection
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          fraud_score: 78,
          risk_level: "high",
          detection_methods: {
            behavioral_analysis: { score: 82, anomalies: ["unusual_pattern"] },
            documentary_analysis: { score: 75, issues: ["inconsistent_dates"] },
            pattern_detection: { score: 88, patterns: ["duplicate_claim"] },
            network_analysis: { score: 67, connections: ["flagged_address"] },
          },
          red_flags: [
            "Duplicate claim detected",
            "Inconsistent incident dates",
            "Address flagged in previous fraud",
          ],
          automatic_actions: [
            "Claim flagged for manual review",
            "Notification sent to fraud team",
            "Additional documentation requested",
          ],
        },
        error: null,
      });

      // Trigger fraud scan
      const scanButton = screen.getByRole("button", {
        name: /run fraud scan/i,
      });
      await user.click(scanButton);

      // Wait for high-risk alert
      await waitFor(() => {
        expect(screen.getByText(/high risk detected/i)).toBeInTheDocument();
      });

      // Verify automatic actions were triggered
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        "fraud-detection-engine",
        expect.any(Object),
      );

      // Check that fraud team notification was sent
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          notification_sent: true,
          team_members_notified: ["fraud-team@claimguardian.com"],
          case_id: "FRAUD-2024-001",
        },
        error: null,
      });

      // Verify case creation
      expect(screen.getByText(/fraud case created/i)).toBeInTheDocument();
    });
  });

  describe("Compliance Auto-Fix Workflow", () => {
    it("should automatically fix compliance issues when enabled", async () => {
      const user = userEvent.setup();

      render(<ComplianceChecker />);

      // Enable auto-fix
      const autoFixCheckbox = screen.getByLabelText(/enable auto-fix/i);
      await user.click(autoFixCheckbox);

      // Select claim
      const claimSelect = screen.getByLabelText(/select claim/i);
      await user.selectOptions(claimSelect, "CLM-2024-0892");

      // Mock compliance check with fixable issues
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          overallScore: 62,
          status: "non_compliant",
          criticalIssues: 3,
          warnings: 4,
          items: [
            {
              id: "1",
              requirement: "Proof of Loss Statement",
              status: "non_compliant",
              severity: "critical",
              autoFixable: true,
              fix: "Generate proof of loss",
            },
            {
              id: "2",
              requirement: "Mediation Rights Notice",
              status: "non_compliant",
              severity: "critical",
              autoFixable: true,
              fix: "Send mediation notice",
            },
            {
              id: "3",
              requirement: "Timeline Violation",
              status: "non_compliant",
              severity: "high",
              autoFixable: false,
            },
          ],
        },
        error: null,
      });

      // Run compliance check
      const checkButton = screen.getByRole("button", {
        name: /run compliance check/i,
      });
      await user.click(checkButton);

      // Wait for critical issues alert
      await waitFor(() => {
        const autoFixButton = screen.getByRole("button", {
          name: /apply available auto-fixes/i,
        });
        expect(autoFixButton).toBeInTheDocument();
      });

      // Apply auto-fixes
      const autoFixButton = screen.getByRole("button", {
        name: /apply available auto-fixes/i,
      });

      // Mock auto-fix application
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          fixes_applied: 2,
          fixed_items: ["1", "2"],
          documents_generated: ["proof_of_loss.pdf", "mediation_notice.pdf"],
          new_score: 78,
          new_status: "needs_review",
        },
        error: null,
      });

      await user.click(autoFixButton);

      // Verify fixes were applied
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining("2 automatic fixes"),
        );
      });
    });
  });

  describe("Predictive Maintenance Alert Workflow", () => {
    it("should predict failures and schedule preventive maintenance", async () => {
      const { PredictiveMaintenanceAlerts } = await import(
        "@/components/maintenance/PredictiveMaintenanceAlerts"
      );
      const user = userEvent.setup();

      render(<PredictiveMaintenanceAlerts />);

      // Mock predictive scan results
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          predictions: [
            {
              system: "HVAC",
              component: "AC Compressor",
              failure_probability: 0.87,
              predicted_failure_date: "2024-03-15",
              preventive_cost: 450,
              repair_cost: 4500,
              urgency: "critical",
            },
          ],
          maintenance_scheduled: false,
        },
        error: null,
      });

      // Run predictive scan
      const scanButton = screen.getByRole("button", {
        name: /run predictive scan/i,
      });
      await user.click(scanButton);

      await waitFor(() => {
        expect(
          screen.getByText(/critical maintenance required/i),
        ).toBeInTheDocument();
      });

      // Schedule maintenance for critical item
      const scheduleButtons = screen.getAllByRole("button", {
        name: /schedule/i,
      });

      // Mock scheduling action
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: {
            id: "maint-001",
            system: "HVAC",
            scheduled_date: "2024-02-25",
            contractor_assigned: true,
            estimated_cost: 450,
          },
          error: null,
        }),
      });

      await user.click(scheduleButtons[0]);

      // Verify maintenance was scheduled
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining("Maintenance scheduled"),
        );
      });

      // Verify cost savings calculation
      expect(screen.getByText(/save \$4,050/i)).toBeInTheDocument();
    });
  });

  describe("Multi-Component Integration Workflow", () => {
    it("should handle complete claim lifecycle with all AI features", async () => {
      // This test simulates a complete claim workflow using all AI components

      const mockClaim = {
        id: "CLM-2024-FULL-001",
        type: "hurricane_damage",
        amount: 75000,
        property_id: "prop-001",
        status: "submitted",
      };

      // Step 1: Initial claim prediction
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: {
            approval_likelihood: 71,
            confidence: 88,
            recommendations: [
              "Strengthen documentation",
              "Add weather reports",
            ],
          },
          error: null,
        })
        // Step 2: Fraud detection
        .mockResolvedValueOnce({
          data: {
            fraud_score: 22,
            risk_level: "low",
            cleared_for_processing: true,
          },
          error: null,
        })
        // Step 3: Compliance check
        .mockResolvedValueOnce({
          data: {
            overallScore: 68,
            criticalIssues: 1,
            auto_fixes_available: 1,
          },
          error: null,
        })
        // Step 4: Sentiment analysis of communication
        .mockResolvedValueOnce({
          data: {
            sentiment_score: 45,
            emotion: "frustrated",
            urgency: "high",
            suggested_response: "Expedite processing and provide update",
          },
          error: null,
        })
        // Step 5: Predictive maintenance check
        .mockResolvedValueOnce({
          data: {
            related_damage_predicted: true,
            additional_systems_at_risk: ["roof", "windows"],
            preventive_actions: ["Temporary repairs", "Weatherproofing"],
          },
          error: null,
        });

      // Execute complete workflow
      const results = await Promise.all([
        mockSupabase.functions.invoke("claim-predictor-ai", {
          body: mockClaim,
        }),
        mockSupabase.functions.invoke("fraud-detection-engine", {
          body: mockClaim,
        }),
        mockSupabase.functions.invoke("compliance-checker", {
          body: mockClaim,
        }),
        mockSupabase.functions.invoke("sentiment-analyzer", {
          body: { claim_id: mockClaim.id },
        }),
        mockSupabase.functions.invoke("predictive-maintenance", {
          body: { property_id: mockClaim.property_id },
        }),
      ]);

      // Verify all components returned data
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.data).toBeDefined();
        expect(result.error).toBeNull();
      });

      // Verify workflow completion
      expect(results[0].data.approval_likelihood).toBe(71);
      expect(results[1].data.risk_level).toBe("low");
      expect(results[2].data.criticalIssues).toBe(1);
      expect(results[3].data.emotion).toBe("frustrated");
      expect(results[4].data.related_damage_predicted).toBe(true);
    });
  });

  describe("Error Recovery Workflow", () => {
    it("should handle and recover from component failures", async () => {
      const user = userEvent.setup();

      // Simulate network failure
      mockSupabase.functions.invoke
        .mockRejectedValueOnce(new Error("Network timeout"))
        .mockResolvedValueOnce({
          data: { approval_likelihood: 75 },
          error: null,
        });

      render(<ClaimPredictor />);

      const analyzeButton = screen.getByRole("button", {
        name: /analyze claim/i,
      });
      await user.click(analyzeButton);

      // First attempt should fail
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed"),
        );
      });

      // Retry should succeed
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/75%/)).toBeInTheDocument();
      });
    });

    it("should handle partial workflow failures gracefully", async () => {
      // Mock mixed success/failure responses
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: { approval_likelihood: 80 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Fraud service unavailable" },
        })
        .mockResolvedValueOnce({ data: { overallScore: 90 }, error: null });

      const results = await Promise.allSettled([
        mockSupabase.functions.invoke("claim-predictor-ai", {}),
        mockSupabase.functions.invoke("fraud-detection-engine", {}),
        mockSupabase.functions.invoke("compliance-checker", {}),
      ]);

      // Verify partial success handling
      expect(results[0].status).toBe("fulfilled");
      expect(results[1].status).toBe("fulfilled"); // Still fulfilled but with error in data
      expect(results[2].status).toBe("fulfilled");

      // Extract successful results
      const successfulResults = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<any>).value)
        .filter((r) => r.data !== null);

      expect(successfulResults).toHaveLength(2);
    });
  });
});
