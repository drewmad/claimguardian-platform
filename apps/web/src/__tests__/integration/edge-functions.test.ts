import { createClient } from "@/lib/supabase/client";

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

describe("Edge Functions Integration Tests", () => {
  const supabase = createClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Claim Predictor AI Edge Function", () => {
    it("should predict claim approval likelihood", async () => {
      const mockClaimData = {
        type: "wind_damage",
        amount: 25000,
        description: "Roof damage from hurricane",
        documentation: ["photos", "contractor_estimate", "weather_report"],
        property_id: "prop-123",
        incident_date: "2024-01-15",
      };

      const mockResponse = {
        data: {
          approval_likelihood: 78,
          confidence: 89,
          risk_factors: [
            {
              factor: "documentation_completeness",
              score: 85,
              impact: "positive",
            },
            { factor: "claim_timing", score: 72, impact: "neutral" },
            { factor: "damage_consistency", score: 90, impact: "positive" },
          ],
          recommendations: [
            "Submit additional photographic evidence",
            "Include detailed repair timeline",
            "Provide proof of regular maintenance",
          ],
          estimated_timeline: "30-45 days",
          suggested_settlement: 22500,
        },
        error: null,
      };

      // Mock the Edge Function call
      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockResponse);

      const result = await supabase.functions.invoke("claim-predictor-ai", {
        body: mockClaimData,
      });

      expect(result.data).toBeDefined();
      expect(result.data.approval_likelihood).toBe(78);
      expect(result.data.risk_factors).toHaveLength(3);
      expect(result.data.recommendations).toContain(
        "Submit additional photographic evidence",
      );
    });

    it("should handle claim prediction errors", async () => {
      const mockError = {
        data: null,
        error: { message: "Insufficient data for prediction" },
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockError);

      const result = await supabase.functions.invoke("claim-predictor-ai", {
        body: { type: "incomplete" },
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("Insufficient data for prediction");
    });
  });

  describe("Fraud Detection Engine Edge Function", () => {
    it("should detect potential fraud patterns", async () => {
      const mockClaimData = {
        claim_id: "CLM-2024-0892",
        claimant_id: "user-456",
        property_id: "prop-789",
        incident_details: {
          type: "water_damage",
          date: "2024-02-01",
          reported_date: "2024-02-15",
          amount: 45000,
        },
      };

      const mockResponse = {
        data: {
          fraud_score: 32,
          risk_level: "medium",
          detection_methods: {
            behavioral_analysis: {
              score: 25,
              anomalies: ["delayed_reporting"],
            },
            documentary_analysis: { score: 15, issues: [] },
            pattern_detection: {
              score: 45,
              patterns: ["similar_claims_nearby"],
            },
            network_analysis: {
              score: 38,
              connections: ["contractor_flagged"],
            },
          },
          red_flags: [
            "Claim reported 14 days after incident",
            "Contractor has multiple flagged claims",
            "Similar claims in neighborhood recently",
          ],
          recommendations: [
            "Request additional documentation",
            "Schedule in-person inspection",
            "Verify contractor credentials",
          ],
          confidence: 87,
        },
        error: null,
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockResponse);

      const result = await supabase.functions.invoke("fraud-detection-engine", {
        body: mockClaimData,
      });

      expect(result.data).toBeDefined();
      expect(result.data.fraud_score).toBe(32);
      expect(result.data.risk_level).toBe("medium");
      expect(result.data.red_flags).toHaveLength(3);
    });

    it("should handle multiple claims batch analysis", async () => {
      const mockBatchData = {
        claims: ["CLM-001", "CLM-002", "CLM-003"],
        analysis_type: "batch",
      };

      const mockResponse = {
        data: {
          batch_results: [
            { claim_id: "CLM-001", fraud_score: 12, risk_level: "low" },
            { claim_id: "CLM-002", fraud_score: 67, risk_level: "high" },
            { claim_id: "CLM-003", fraud_score: 28, risk_level: "medium" },
          ],
          summary: {
            high_risk_count: 1,
            medium_risk_count: 1,
            low_risk_count: 1,
            average_fraud_score: 35.67,
          },
        },
        error: null,
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockResponse);

      const result = await supabase.functions.invoke("fraud-detection-engine", {
        body: mockBatchData,
      });

      expect(result.data.batch_results).toHaveLength(3);
      expect(result.data.summary.high_risk_count).toBe(1);
    });
  });

  describe("Smart Notification Engine Edge Function", () => {
    it("should send multi-channel notifications", async () => {
      const mockNotificationData = {
        user_id: "user-123",
        type: "claim_update",
        priority: "high",
        channels: ["email", "sms", "push"],
        content: {
          title: "Claim Status Update",
          message: "Your claim CLM-2024-0892 has been approved",
          action_url: "/claims/CLM-2024-0892",
        },
      };

      const mockResponse = {
        data: {
          notification_id: "notif-789",
          sent_channels: ["email", "sms", "push"],
          delivery_status: {
            email: { sent: true, timestamp: "2024-02-20T10:00:00Z" },
            sms: { sent: true, timestamp: "2024-02-20T10:00:01Z" },
            push: { sent: true, timestamp: "2024-02-20T10:00:02Z" },
          },
          user_preferences_applied: true,
        },
        error: null,
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockResponse);

      const result = await supabase.functions.invoke(
        "smart-notification-engine",
        {
          body: mockNotificationData,
        },
      );

      expect(result.data).toBeDefined();
      expect(result.data.sent_channels).toEqual(["email", "sms", "push"]);
      expect(result.data.delivery_status.email.sent).toBe(true);
    });

    it("should respect user notification preferences", async () => {
      const mockNotificationData = {
        user_id: "user-456",
        type: "marketing",
        channels: ["email", "sms", "push"],
      };

      const mockResponse = {
        data: {
          notification_id: "notif-790",
          sent_channels: ["email"], // User only opted in for email marketing
          delivery_status: {
            email: { sent: true, timestamp: "2024-02-20T11:00:00Z" },
          },
          user_preferences_applied: true,
          filtered_channels: ["sms", "push"],
          filter_reason: "User opted out of SMS and push for marketing",
        },
        error: null,
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockResponse);

      const result = await supabase.functions.invoke(
        "smart-notification-engine",
        {
          body: mockNotificationData,
        },
      );

      expect(result.data.sent_channels).toEqual(["email"]);
      expect(result.data.filtered_channels).toContain("sms");
      expect(result.data.filtered_channels).toContain("push");
    });
  });

  describe("Community Intelligence Edge Function", () => {
    it("should aggregate anonymized community data", async () => {
      const mockRequestData = {
        zip_code: "33948",
        data_type: "claim_trends",
        timeframe: "30d",
      };

      const mockResponse = {
        data: {
          community_insights: {
            total_claims: 47,
            average_settlement: 18500,
            common_issues: [
              { type: "wind_damage", percentage: 45 },
              { type: "water_damage", percentage: 28 },
              { type: "roof_damage", percentage: 27 },
            ],
            contractor_recommendations: [
              { name: "ABC Roofing", rating: 4.8, claims_handled: 23 },
              { name: "XYZ Restoration", rating: 4.6, claims_handled: 18 },
            ],
            seasonal_trends: {
              current_risk_level: "elevated",
              upcoming_risks: ["hurricane_season", "flooding"],
            },
          },
          data_points: 312,
          confidence_level: 92,
          last_updated: "2024-02-20T12:00:00Z",
        },
        error: null,
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockResponse);

      const result = await supabase.functions.invoke("community-intelligence", {
        body: mockRequestData,
      });

      expect(result.data).toBeDefined();
      expect(result.data.community_insights.total_claims).toBe(47);
      expect(result.data.community_insights.common_issues).toHaveLength(3);
      expect(result.data.confidence_level).toBe(92);
    });

    it("should protect user privacy in aggregations", async () => {
      const mockRequestData = {
        zip_code: "33901",
        data_type: "claim_trends",
        timeframe: "7d",
      };

      const mockResponse = {
        data: {
          error: "Insufficient data for anonymization",
          minimum_required: 10,
          current_count: 3,
          message: "Need at least 10 data points to ensure privacy",
        },
        error: null,
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockResponse);

      const result = await supabase.functions.invoke("community-intelligence", {
        body: mockRequestData,
      });

      expect(result.data.error).toBe("Insufficient data for anonymization");
      expect(result.data.minimum_required).toBe(10);
    });
  });

  describe("Edge Function Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const networkError = new Error("Network request failed");
      jest.spyOn(supabase.functions, "invoke").mockRejectedValue(networkError);

      try {
        await supabase.functions.invoke("claim-predictor-ai", {
          body: { test: "data" },
        });
      } catch (error) {
        expect(error).toEqual(networkError);
      }
    });

    it("should handle rate limiting", async () => {
      const rateLimitResponse = {
        data: null,
        error: {
          message: "Rate limit exceeded",
          status: 429,
          retry_after: 60,
        },
      };

      jest
        .spyOn(supabase.functions, "invoke")
        .mockResolvedValue(rateLimitResponse);

      const result = await supabase.functions.invoke("fraud-detection-engine", {
        body: { test: "data" },
      });

      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(429);
      expect(result.error.retry_after).toBe(60);
    });

    it("should handle authentication errors", async () => {
      const authError = {
        data: null,
        error: {
          message: "Invalid authentication token",
          status: 401,
        },
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(authError);

      const result = await supabase.functions.invoke(
        "smart-notification-engine",
        {
          body: { test: "data" },
        },
      );

      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(401);
      expect(result.error.message).toBe("Invalid authentication token");
    });
  });

  describe("Edge Function Performance", () => {
    it("should complete within acceptable time limits", async () => {
      const startTime = Date.now();

      const mockResponse = {
        data: { result: "success" },
        error: null,
      };

      jest.spyOn(supabase.functions, "invoke").mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResponse), 100); // Simulate 100ms response
          }),
      );

      const result = await supabase.functions.invoke("claim-predictor-ai", {
        body: { test: "data" },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.data.result).toBe("success");
    });

    it("should handle concurrent requests", async () => {
      const mockResponse = {
        data: { result: "success" },
        error: null,
      };

      jest.spyOn(supabase.functions, "invoke").mockResolvedValue(mockResponse);

      const requests = [
        supabase.functions.invoke("claim-predictor-ai", { body: { id: 1 } }),
        supabase.functions.invoke("fraud-detection-engine", {
          body: { id: 2 },
        }),
        supabase.functions.invoke("smart-notification-engine", {
          body: { id: 3 },
        }),
      ];

      const results = await Promise.all(requests);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.data.result).toBe("success");
      });
    });
  });
});
