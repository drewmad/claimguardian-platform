/**
 * Damage Assessment E2E Tests
 * End-to-end tests for damage assessment creation, photo capture, and AI analysis
 */

import { device, element, by, expect as detoxExpect, waitFor } from "detox";

describe("Damage Assessment E2E Tests", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();

    // Login flow
    await waitFor(element(by.id("login-screen")))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id("email-input")).typeText("test@claimguardianai.com");
    await element(by.id("password-input")).typeText("testpass123");
    await element(by.id("signin-button")).tap();

    await waitFor(element(by.id("dashboard-screen")))
      .toBeVisible()
      .withTimeout(15000);
  });

  describe("Damage Assessment Creation", () => {
    test("should create a comprehensive damage assessment", async () => {
      // Navigate to assessments
      await element(by.id("assessments-tab")).tap();

      await waitFor(element(by.id("assessments-list-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Start new assessment
      await element(by.id("new-assessment-fab")).tap();

      await waitFor(element(by.id("assessment-wizard-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Step 1: Basic Assessment Information
      await element(by.id("assessment-title-input")).typeText(
        "Hurricane Damage Assessment",
      );

      await element(by.id("property-selector")).tap();
      await waitFor(element(by.id("property-selection-modal")))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text("Main Residence")).tap();

      await element(by.id("incident-date-picker")).tap();
      await element(by.text("Today")).tap();

      await element(by.id("damage-type-picker")).tap();
      await element(by.text("Storm Damage")).tap();

      await element(by.id("next-step-button")).tap();

      // Step 2: Damage Location and Details
      await waitFor(element(by.id("damage-details-step")))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id("damage-location-picker")).tap();
      await element(by.text("Roof")).tap();

      await element(by.id("damage-severity-picker")).tap();
      await element(by.text("Moderate")).tap();

      await element(by.id("damage-description-input")).typeText(
        "Multiple shingles blown off, exposed underlayment, water intrusion in attic",
      );

      await element(by.id("affected-area-input")).typeText(
        "Approximately 200 sq ft",
      );

      await element(by.id("next-step-button")).tap();

      // Step 3: Photo Documentation
      await waitFor(element(by.id("photo-documentation-step")))
        .toBeVisible()
        .withTimeout(3000);

      // Take first photo
      await element(by.id("capture-photo-button")).tap();

      await waitFor(element(by.id("camera-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Mock camera capture
      await element(by.id("capture-button")).tap();
      await waitFor(element(by.id("photo-preview-screen")))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id("photo-title-input")).typeText(
        "Roof Damage Overview",
      );
      await element(by.id("photo-notes-input")).typeText(
        "Wide view showing extent of shingle damage",
      );
      await element(by.id("save-photo-button")).tap();

      // Verify photo was added
      await waitFor(element(by.text("Roof Damage Overview")))
        .toBeVisible()
        .withTimeout(3000);

      // Add second photo
      await element(by.id("capture-photo-button")).tap();
      await element(by.id("capture-button")).tap();
      await element(by.id("photo-title-input")).typeText("Water Damage Detail");
      await element(by.id("photo-notes-input")).typeText(
        "Close-up of water staining in attic",
      );
      await element(by.id("save-photo-button")).tap();

      await element(by.id("next-step-button")).tap();

      // Step 4: Cost Estimation
      await waitFor(element(by.id("cost-estimation-step")))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id("estimated-repair-cost-input")).typeText("8500");

      await element(by.id("urgency-level-picker")).tap();
      await element(by.text("High")).tap();

      await element(by.id("contractor-needed-switch")).tap();

      await element(by.id("next-step-button")).tap();

      // Step 5: Review and Submit
      await waitFor(element(by.id("assessment-review-step")))
        .toBeVisible()
        .withTimeout(3000);

      // Verify all information is displayed correctly
      await detoxExpect(
        element(by.text("Hurricane Damage Assessment")),
      ).toBeVisible();
      await detoxExpect(element(by.text("Storm Damage"))).toBeVisible();
      await detoxExpect(element(by.text("Roof"))).toBeVisible();
      await detoxExpect(element(by.text("$8,500"))).toBeVisible();
      await detoxExpect(element(by.text("High Priority"))).toBeVisible();

      // Submit assessment
      await element(by.id("submit-assessment-button")).tap();

      // Verify successful creation
      await waitFor(element(by.id("assessment-created-success")))
        .toBeVisible()
        .withTimeout(10000);

      await waitFor(element(by.id("assessment-detail-screen")))
        .toBeVisible()
        .withTimeout(5000);
    });

    test("should validate required fields during assessment creation", async () => {
      await element(by.id("assessments-tab")).tap();
      await element(by.id("new-assessment-fab")).tap();

      // Try to proceed without filling required fields
      await element(by.id("next-step-button")).tap();

      // Should show validation errors
      await waitFor(element(by.text("Assessment title is required")))
        .toBeVisible()
        .withTimeout(3000);

      await waitFor(element(by.text("Property selection is required")))
        .toBeVisible()
        .withTimeout(3000);

      // Fill required fields and proceed
      await element(by.id("assessment-title-input")).typeText(
        "Test Assessment",
      );
      await element(by.id("property-selector")).tap();
      await element(by.text("Main Residence")).tap();

      await element(by.id("next-step-button")).tap();

      // Should proceed to next step
      await waitFor(element(by.id("damage-details-step")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe("Photo Capture and Management", () => {
    beforeEach(async () => {
      // Create a basic assessment to add photos to
      await element(by.id("assessments-tab")).tap();
      await element(by.id("new-assessment-fab")).tap();

      await element(by.id("assessment-title-input")).typeText(
        "Photo Test Assessment",
      );
      await element(by.id("property-selector")).tap();
      await element(by.text("Main Residence")).tap();
      await element(by.id("next-step-button")).tap();

      await element(by.id("damage-location-picker")).tap();
      await element(by.text("Exterior")).tap();
      await element(by.id("next-step-button")).tap();

      // Now at photo documentation step
      await waitFor(element(by.id("photo-documentation-step")))
        .toBeVisible()
        .withTimeout(3000);
    });

    test("should capture and organize multiple photos", async () => {
      // Capture first photo
      await element(by.id("capture-photo-button")).tap();

      await waitFor(element(by.id("camera-screen")))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id("capture-button")).tap();
      await element(by.id("photo-title-input")).typeText(
        "Exterior Wall Damage",
      );
      await element(by.id("photo-category-picker")).tap();
      await element(by.text("Damage")).tap();
      await element(by.id("save-photo-button")).tap();

      // Verify photo appears in gallery
      await waitFor(element(by.text("Exterior Wall Damage")))
        .toBeVisible()
        .withTimeout(3000);

      // Capture second photo with different category
      await element(by.id("capture-photo-button")).tap();
      await element(by.id("capture-button")).tap();
      await element(by.id("photo-title-input")).typeText(
        "Before Repair Reference",
      );
      await element(by.id("photo-category-picker")).tap();
      await element(by.text("Reference")).tap();
      await element(by.id("save-photo-button")).tap();

      // Test photo filtering by category
      await element(by.id("photo-category-filter")).tap();
      await element(by.text("Damage")).tap();

      await detoxExpect(element(by.text("Exterior Wall Damage"))).toBeVisible();
      await detoxExpect(
        element(by.text("Before Repair Reference")),
      ).not.toBeVisible();

      // Show all photos again
      await element(by.id("photo-category-filter")).tap();
      await element(by.text("All Categories")).tap();

      await detoxExpect(element(by.text("Exterior Wall Damage"))).toBeVisible();
      await detoxExpect(
        element(by.text("Before Repair Reference")),
      ).toBeVisible();
    });

    test("should edit photo metadata", async () => {
      // Capture a photo first
      await element(by.id("capture-photo-button")).tap();
      await element(by.id("capture-button")).tap();
      await element(by.id("photo-title-input")).typeText("Original Title");
      await element(by.id("save-photo-button")).tap();

      // Edit the photo
      await element(by.text("Original Title")).tap();

      await waitFor(element(by.id("photo-detail-screen")))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id("edit-photo-button")).tap();

      await waitFor(element(by.id("photo-edit-screen")))
        .toBeVisible()
        .withTimeout(3000);

      // Update photo details
      await element(by.id("photo-title-input")).clearText();
      await element(by.id("photo-title-input")).typeText("Updated Title");

      await element(by.id("photo-notes-input")).clearText();
      await element(by.id("photo-notes-input")).typeText(
        "Updated description with more details",
      );

      await element(by.id("save-photo-changes-button")).tap();

      // Verify changes were saved
      await waitFor(element(by.text("Updated Title")))
        .toBeVisible()
        .withTimeout(3000);
    });

    test("should handle camera permissions and errors", async () => {
      // Mock camera permission denied
      await device.setPermissions({
        camera: "denied",
      });

      await element(by.id("capture-photo-button")).tap();

      // Should show permission request
      await waitFor(
        element(by.text("Camera access is required to capture photos")),
      )
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id("request-camera-permission-button")).tap();

      // Grant permission
      await device.setPermissions({
        camera: "granted",
      });

      // Try again
      await element(by.id("capture-photo-button")).tap();

      await waitFor(element(by.id("camera-screen")))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe("AI Damage Analysis", () => {
    beforeEach(async () => {
      // Create assessment with photos for AI analysis
      await element(by.id("assessments-tab")).tap();
      await element(by.id("new-assessment-fab")).tap();

      await element(by.id("assessment-title-input")).typeText(
        "AI Analysis Test",
      );
      await element(by.id("property-selector")).tap();
      await element(by.text("Main Residence")).tap();
      await element(by.id("next-step-button")).tap();

      await element(by.id("damage-location-picker")).tap();
      await element(by.text("Roof")).tap();
      await element(by.id("next-step-button")).tap();

      // Add a photo for AI analysis
      await element(by.id("capture-photo-button")).tap();
      await element(by.id("capture-button")).tap();
      await element(by.id("photo-title-input")).typeText("Roof Damage for AI");
      await element(by.id("save-photo-button")).tap();

      await element(by.id("next-step-button")).tap();
      await element(by.id("estimated-repair-cost-input")).typeText("5000");
      await element(by.id("next-step-button")).tap();
      await element(by.id("submit-assessment-button")).tap();

      await waitFor(element(by.id("assessment-detail-screen")))
        .toBeVisible()
        .withTimeout(10000);
    });

    test("should perform AI damage analysis on photos", async () => {
      // Navigate to AI analysis section
      await element(by.id("ai-analysis-tab")).tap();

      await waitFor(element(by.id("ai-analysis-screen")))
        .toBeVisible()
        .withTimeout(3000);

      // Start AI analysis
      await element(by.id("analyze-damage-button")).tap();

      // Show analysis in progress
      await waitFor(element(by.id("ai-analysis-progress")))
        .toBeVisible()
        .withTimeout(3000);

      await detoxExpect(
        element(by.text("Analyzing damage using AI...")),
      ).toBeVisible();

      // Wait for analysis completion (mock delay)
      await waitFor(element(by.id("ai-analysis-results")))
        .toBeVisible()
        .withTimeout(30000);

      // Verify analysis results are displayed
      await detoxExpect(element(by.id("damage-type-result"))).toBeVisible();
      await detoxExpect(element(by.id("severity-assessment"))).toBeVisible();
      await detoxExpect(element(by.id("cost-estimate-ai"))).toBeVisible();
      await detoxExpect(element(by.id("confidence-score"))).toBeVisible();
    });

    test("should compare AI analysis with manual assessment", async () => {
      // Run AI analysis first
      await element(by.id("ai-analysis-tab")).tap();
      await element(by.id("analyze-damage-button")).tap();

      await waitFor(element(by.id("ai-analysis-results")))
        .toBeVisible()
        .withTimeout(30000);

      // Open comparison view
      await element(by.id("compare-with-manual-button")).tap();

      await waitFor(element(by.id("comparison-screen")))
        .toBeVisible()
        .withTimeout(3000);

      // Verify both assessments are shown
      await detoxExpect(element(by.text("Manual Assessment"))).toBeVisible();
      await detoxExpect(element(by.text("AI Analysis"))).toBeVisible();

      // Check for differences highlighting
      await detoxExpect(
        element(by.id("cost-difference-indicator")),
      ).toBeVisible();
      await detoxExpected(
        element(by.id("severity-difference-indicator")),
      ).toBeVisible();

      // Accept AI recommendations
      await element(by.id("accept-ai-suggestions-button")).tap();

      // Verify assessment was updated
      await waitFor(element(by.text("Assessment updated with AI analysis")))
        .toBeVisible()
        .withTimeout(5000);
    });

    test("should handle AI analysis errors gracefully", async () => {
      // Mock network error for AI service
      await device.setURLBlacklist([".*api/ai.*"]);

      await element(by.id("ai-analysis-tab")).tap();
      await element(by.id("analyze-damage-button")).tap();

      // Should show error message
      await waitFor(element(by.text("AI analysis temporarily unavailable")))
        .toBeVisible()
        .withTimeout(15000);

      await element(by.id("retry-analysis-button")).tap();

      // Restore network
      await device.setURLBlacklist([]);

      // Should work on retry
      await waitFor(element(by.id("ai-analysis-results")))
        .toBeVisible()
        .withTimeout(30000);
    });
  });

  describe("Assessment History and Tracking", () => {
    test("should track assessment status changes", async () => {
      // Create an assessment
      await element(by.id("assessments-tab")).tap();
      await element(by.id("new-assessment-fab")).tap();

      await element(by.id("assessment-title-input")).typeText(
        "Status Tracking Test",
      );
      await element(by.id("property-selector")).tap();
      await element(by.text("Main Residence")).tap();
      await element(by.id("next-step-button")).tap();

      await element(by.id("damage-location-picker")).tap();
      await element(by.text("Interior")).tap();
      await element(by.id("next-step-button")).tap();
      await element(by.id("next-step-button")).tap();
      await element(by.id("estimated-repair-cost-input")).typeText("3000");
      await element(by.id("next-step-button")).tap();
      await element(by.id("submit-assessment-button")).tap();

      await waitFor(element(by.id("assessment-detail-screen")))
        .toBeVisible()
        .withTimeout(10000);

      // Check initial status
      await detoxExpect(element(by.text("Draft"))).toBeVisible();

      // Change status to in progress
      await element(by.id("change-status-button")).tap();
      await element(by.text("In Progress")).tap();
      await element(by.id("status-change-notes-input")).typeText(
        "Contractor contacted",
      );
      await element(by.id("confirm-status-change-button")).tap();

      // Verify status change
      await waitFor(element(by.text("In Progress")))
        .toBeVisible()
        .withTimeout(3000);

      // Check status history
      await element(by.id("status-history-tab")).tap();

      await waitFor(element(by.id("status-history-list")))
        .toBeVisible()
        .withTimeout(3000);

      await detoxExpect(element(by.text("Draft"))).toBeVisible();
      await detoxExpect(element(by.text("In Progress"))).toBeVisible();
      await detoxExpect(element(by.text("Contractor contacted"))).toBeVisible();
    });

    test("should export assessment report", async () => {
      // Navigate to existing assessment
      await element(by.id("assessments-tab")).tap();

      // Assume we have at least one assessment from previous tests
      await element(by.id("first-assessment-item")).tap();

      await waitFor(element(by.id("assessment-detail-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Export report
      await element(by.id("export-report-button")).tap();

      await waitFor(element(by.id("export-options-modal")))
        .toBeVisible()
        .withTimeout(3000);

      // Select PDF export
      await element(by.id("export-pdf-option")).tap();

      // Wait for export completion
      await waitFor(element(by.text("Report exported successfully")))
        .toBeVisible()
        .withTimeout(15000);

      // Verify sharing options
      await element(by.id("share-report-button")).tap();

      await waitFor(element(by.id("share-sheet")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe("Offline Assessment Management", () => {
    test("should create assessments while offline", async () => {
      // Enable offline mode
      await device.setURLBlacklist([".*"]);

      await element(by.id("assessments-tab")).tap();
      await element(by.id("new-assessment-fab")).tap();

      // Create assessment offline
      await element(by.id("assessment-title-input")).typeText(
        "Offline Assessment",
      );
      await element(by.id("property-selector")).tap();
      await element(by.text("Main Residence")).tap();
      await element(by.id("next-step-button")).tap();

      await element(by.id("damage-location-picker")).tap();
      await element(by.text("Kitchen")).tap();
      await element(by.id("damage-description-input")).typeText(
        "Water damage from dishwasher leak",
      );
      await element(by.id("next-step-button")).tap();

      // Capture photo offline
      await element(by.id("capture-photo-button")).tap();
      await element(by.id("capture-button")).tap();
      await element(by.id("photo-title-input")).typeText(
        "Kitchen Water Damage",
      );
      await element(by.id("save-photo-button")).tap();

      await element(by.id("next-step-button")).tap();
      await element(by.id("estimated-repair-cost-input")).typeText("1500");
      await element(by.id("next-step-button")).tap();

      await element(by.id("submit-assessment-button")).tap();

      // Verify offline save
      await waitFor(element(by.id("offline-save-confirmation")))
        .toBeVisible()
        .withTimeout(10000);

      await detoxExpect(
        element(by.text("Assessment saved offline")),
      ).toBeVisible();

      // Check sync queue
      await element(by.id("view-sync-queue-button")).tap();

      await waitFor(element(by.id("sync-queue-screen")))
        .toBeVisible()
        .withTimeout(3000);

      await detoxExpected(element(by.text("Offline Assessment"))).toBeVisible();

      // Restore connectivity and sync
      await device.setURLBlacklist([]);
      await element(by.id("sync-now-button")).tap();

      await waitFor(element(by.text("Sync completed")))
        .toBeVisible()
        .withTimeout(20000);
    });
  });
});
