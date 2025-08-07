/**
 * Property Management E2E Tests
 * End-to-end tests for property creation, editing, and management workflows
 */

import { device, element, by, expect as detoxExpect, waitFor } from "detox";

describe("Property Management E2E Tests", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();

    // Login flow - simplified for testing
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

  afterEach(async () => {
    // Cleanup: delete any test properties created
    try {
      const deleteButton = element(by.id("delete-property-button"));
      if (await deleteButton.tap().catch(() => false)) {
        await element(by.id("confirm-delete-button")).tap();
      }
    } catch (error) {
      // Ignore cleanup errors
      console.log("Cleanup not needed or failed:", error);
    }
  });

  describe("Property Creation Workflow", () => {
    test("should create a new property successfully", async () => {
      // Navigate to property creation
      await element(by.id("properties-tab")).tap();
      await element(by.id("add-property-button")).tap();

      await waitFor(element(by.id("property-wizard-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Step 1: Basic Information
      await element(by.id("property-name-input")).typeText("Test Property E2E");
      await element(by.id("property-type-picker")).tap();
      await element(by.text("Single Family Home")).tap();
      await element(by.id("next-button")).tap();

      // Step 2: Address Information
      await waitFor(element(by.id("address-step")))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id("street-input")).typeText("123 Test Street");
      await element(by.id("city-input")).typeText("Miami");

      await element(by.id("state-picker")).tap();
      await element(by.text("Florida")).tap();

      await element(by.id("zip-input")).typeText("33101");
      await element(by.id("next-button")).tap();

      // Step 3: Property Details
      await waitFor(element(by.id("details-step")))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id("year-built-input")).typeText("2010");
      await element(by.id("square-feet-input")).typeText("2500");
      await element(by.id("bedrooms-input")).typeText("3");
      await element(by.id("bathrooms-input")).typeText("2");

      // Test Florida-specific features
      await element(by.id("hurricane-shutters-switch")).tap();
      await element(by.id("impact-windows-switch")).tap();

      await element(by.id("next-button")).tap();

      // Step 4: Property Value
      await waitFor(element(by.id("value-step")))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id("purchase-price-input")).typeText("350000");
      await element(by.id("current-value-input")).typeText("425000");

      // Insurance information
      await element(by.id("insurance-carrier-picker")).tap();
      await element(by.text("State Farm")).tap();

      await element(by.id("policy-number-input")).typeText("SF123456789");
      await element(by.id("next-button")).tap();

      // Step 5: Review and Submit
      await waitFor(element(by.id("review-step")))
        .toBeVisible()
        .withTimeout(3000);

      // Verify review information
      await detoxExpect(element(by.text("Test Property E2E"))).toBeVisible();
      await detoxExpect(element(by.text("123 Test Street"))).toBeVisible();
      await detoxExpect(element(by.text("Miami, FL 33101"))).toBeVisible();
      await detoxExpect(element(by.text("$425,000"))).toBeVisible();

      // Submit the property
      await element(by.id("create-property-button")).tap();

      // Verify success
      await waitFor(element(by.id("property-created-success")))
        .toBeVisible()
        .withTimeout(10000);

      await waitFor(element(by.id("property-detail-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Verify property details are displayed
      await detoxExpect(element(by.text("Test Property E2E"))).toBeVisible();
      await detoxExpect(element(by.text("Single Family Home"))).toBeVisible();
    });

    test("should validate required fields in property creation", async () => {
      await element(by.id("properties-tab")).tap();
      await element(by.id("add-property-button")).tap();

      await waitFor(element(by.id("property-wizard-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Try to proceed without filling required fields
      await element(by.id("next-button")).tap();

      // Should show validation error
      await waitFor(element(by.text("Property name is required")))
        .toBeVisible()
        .withTimeout(3000);

      // Fill property name and try again
      await element(by.id("property-name-input")).typeText("Test Property");
      await element(by.id("next-button")).tap();

      // Should show property type validation
      await waitFor(element(by.text("Property type is required")))
        .toBeVisible()
        .withTimeout(3000);

      // Complete the required fields
      await element(by.id("property-type-picker")).tap();
      await element(by.text("Condominium")).tap();
      await element(by.id("next-button")).tap();

      // Should proceed to address step
      await waitFor(element(by.id("address-step")))
        .toBeVisible()
        .withTimeout(3000);
    });

    test("should handle Florida ZIP code validation", async () => {
      await element(by.id("properties-tab")).tap();
      await element(by.id("add-property-button")).tap();

      // Navigate to address step
      await element(by.id("property-name-input")).typeText("ZIP Test Property");
      await element(by.id("property-type-picker")).tap();
      await element(by.text("Single Family Home")).tap();
      await element(by.id("next-button")).tap();

      // Test invalid ZIP code
      await element(by.id("zip-input")).typeText("90210"); // California ZIP
      await element(by.id("next-button")).tap();

      await waitFor(element(by.text("Please enter a valid Florida ZIP code")))
        .toBeVisible()
        .withTimeout(3000);

      // Clear and enter valid Florida ZIP
      await element(by.id("zip-input")).clearText();
      await element(by.id("zip-input")).typeText("33101");

      // Fill other required address fields
      await element(by.id("street-input")).typeText("456 Beach Drive");
      await element(by.id("city-input")).typeText("Miami Beach");
      await element(by.id("state-picker")).tap();
      await element(by.text("Florida")).tap();

      await element(by.id("next-button")).tap();

      // Should proceed to details step
      await waitFor(element(by.id("details-step")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe("Property Editing and Management", () => {
    beforeEach(async () => {
      // Create a test property first
      await element(by.id("properties-tab")).tap();
      await element(by.id("add-property-button")).tap();

      // Quick property creation
      await element(by.id("property-name-input")).typeText(
        "Edit Test Property",
      );
      await element(by.id("property-type-picker")).tap();
      await element(by.text("Townhouse")).tap();
      await element(by.id("next-button")).tap();

      await element(by.id("street-input")).typeText("789 Edit Street");
      await element(by.id("city-input")).typeText("Orlando");
      await element(by.id("state-picker")).tap();
      await element(by.text("Florida")).tap();
      await element(by.id("zip-input")).typeText("32801");
      await element(by.id("next-button")).tap();

      await element(by.id("year-built-input")).typeText("2015");
      await element(by.id("square-feet-input")).typeText("1800");
      await element(by.id("bedrooms-input")).typeText("2");
      await element(by.id("bathrooms-input")).typeText("2");
      await element(by.id("next-button")).tap();

      await element(by.id("purchase-price-input")).typeText("275000");
      await element(by.id("current-value-input")).typeText("320000");
      await element(by.id("next-button")).tap();

      await element(by.id("create-property-button")).tap();

      await waitFor(element(by.id("property-detail-screen")))
        .toBeVisible()
        .withTimeout(10000);
    });

    test("should edit property details successfully", async () => {
      // Enter edit mode
      await element(by.id("edit-property-button")).tap();

      await waitFor(element(by.id("property-edit-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Edit property name
      await element(by.id("property-name-input")).clearText();
      await element(by.id("property-name-input")).typeText(
        "Edited Property Name",
      );

      // Edit property value
      await element(by.id("current-value-input")).clearText();
      await element(by.id("current-value-input")).typeText("335000");

      // Add insurance information
      await element(by.id("insurance-carrier-picker")).tap();
      await element(by.text("Allstate")).tap();
      await element(by.id("policy-number-input")).typeText("AL987654321");

      // Save changes
      await element(by.id("save-property-button")).tap();

      // Verify changes were saved
      await waitFor(element(by.id("property-saved-success")))
        .toBeVisible()
        .withTimeout(5000);

      await waitFor(element(by.id("property-detail-screen")))
        .toBeVisible()
        .withTimeout(3000);

      // Verify updated information is displayed
      await detoxExpect(element(by.text("Edited Property Name"))).toBeVisible();
      await detoxExpect(element(by.text("$335,000"))).toBeVisible();
      await detoxExpect(element(by.text("Allstate"))).toBeVisible();
    });

    test("should add and manage property photos", async () => {
      // Navigate to photos section
      await element(by.id("property-photos-tab")).tap();

      await waitFor(element(by.id("property-photos-screen")))
        .toBeVisible()
        .withTimeout(3000);

      // Add a photo
      await element(by.id("add-photo-button")).tap();

      // Mock photo capture
      await waitFor(element(by.id("camera-screen")))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id("capture-button")).tap();
      await element(by.id("use-photo-button")).tap();

      // Add photo metadata
      await element(by.id("photo-title-input")).typeText("Front Exterior");
      await element(by.id("photo-description-input")).typeText(
        "Front view of property showing main entrance",
      );
      await element(by.id("save-photo-button")).tap();

      // Verify photo was added
      await waitFor(element(by.text("Front Exterior")))
        .toBeVisible()
        .withTimeout(5000);

      // Test photo organization
      await element(by.id("photo-category-picker")).tap();
      await element(by.text("Exterior")).tap();

      await detoxExpect(element(by.text("Exterior"))).toBeVisible();
    });

    test("should create property assessment", async () => {
      // Navigate to assessments
      await element(by.id("property-assessments-tab")).tap();

      await waitFor(element(by.id("property-assessments-screen")))
        .toBeVisible()
        .withTimeout(3000);

      // Create new assessment
      await element(by.id("new-assessment-button")).tap();

      await waitFor(element(by.id("assessment-creation-screen")))
        .toBeVisible()
        .withTimeout(3000);

      // Fill assessment details
      await element(by.id("assessment-title-input")).typeText(
        "Roof Inspection",
      );
      await element(by.id("assessment-type-picker")).tap();
      await element(by.text("Damage Assessment")).tap();

      await element(by.id("damage-description-input")).typeText(
        "Minor shingle damage observed after recent storm",
      );

      // Set damage location
      await element(by.id("damage-location-picker")).tap();
      await element(by.text("Roof")).tap();

      // Set estimated cost
      await element(by.id("estimated-cost-input")).typeText("2500");

      // Set urgency
      await element(by.id("urgency-medium-radio")).tap();

      // Save assessment
      await element(by.id("create-assessment-button")).tap();

      // Verify assessment was created
      await waitFor(element(by.id("assessment-created-success")))
        .toBeVisible()
        .withTimeout(5000);

      await waitFor(element(by.text("Roof Inspection")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe("Property List and Search", () => {
    beforeEach(async () => {
      // Navigate to properties list
      await element(by.id("properties-tab")).tap();
    });

    test("should display properties list", async () => {
      await waitFor(element(by.id("properties-list-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Check if properties list is displayed
      const propertiesList = element(by.id("properties-list"));
      await detoxExpect(propertiesList).toBeVisible();
    });

    test("should search properties by name", async () => {
      await waitFor(element(by.id("properties-list-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Open search
      await element(by.id("search-properties-button")).tap();

      await waitFor(element(by.id("property-search-input")))
        .toBeVisible()
        .withTimeout(3000);

      // Search for properties
      await element(by.id("property-search-input")).typeText("Test");

      // Wait for search results
      await waitFor(element(by.id("search-results-list")))
        .toBeVisible()
        .withTimeout(5000);

      // Verify search results
      await detoxExpect(element(by.id("search-results-list"))).toBeVisible();
    });

    test("should filter properties by type", async () => {
      await waitFor(element(by.id("properties-list-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Open filters
      await element(by.id("filter-properties-button")).tap();

      await waitFor(element(by.id("property-filters-modal")))
        .toBeVisible()
        .withTimeout(3000);

      // Select property type filter
      await element(by.id("property-type-filter")).tap();
      await element(by.text("Single Family Home")).tap();

      // Apply filters
      await element(by.id("apply-filters-button")).tap();

      // Verify filtered results
      await waitFor(element(by.id("filtered-properties-list")))
        .toBeVisible()
        .withTimeout(5000);
    });

    test("should sort properties by different criteria", async () => {
      await waitFor(element(by.id("properties-list-screen")))
        .toBeVisible()
        .withTimeout(5000);

      // Open sort options
      await element(by.id("sort-properties-button")).tap();

      await waitFor(element(by.id("property-sort-modal")))
        .toBeVisible()
        .withTimeout(3000);

      // Sort by value (high to low)
      await element(by.id("sort-by-value-desc")).tap();

      await waitFor(element(by.id("sorted-properties-list")))
        .toBeVisible()
        .withTimeout(3000);

      // Verify sort was applied (would check first item has higher value)
      await detoxExpect(element(by.id("sorted-properties-list"))).toBeVisible();
    });
  });

  describe("Offline Property Management", () => {
    test("should create property while offline", async () => {
      // Enable airplane mode (mock offline state)
      await device.setURLBlacklist([".*"]);

      await element(by.id("properties-tab")).tap();
      await element(by.id("add-property-button")).tap();

      // Create property offline
      await element(by.id("property-name-input")).typeText("Offline Property");
      await element(by.id("property-type-picker")).tap();
      await element(by.text("Condominium")).tap();
      await element(by.id("next-button")).tap();

      await element(by.id("street-input")).typeText("123 Offline Street");
      await element(by.id("city-input")).typeText("Tampa");
      await element(by.id("state-picker")).tap();
      await element(by.text("Florida")).tap();
      await element(by.id("zip-input")).typeText("33602");
      await element(by.id("next-button")).tap();

      await element(by.id("year-built-input")).typeText("2018");
      await element(by.id("square-feet-input")).typeText("1200");
      await element(by.id("bedrooms-input")).typeText("2");
      await element(by.id("bathrooms-input")).typeText("2");
      await element(by.id("next-button")).tap();

      await element(by.id("purchase-price-input")).typeText("250000");
      await element(by.id("current-value-input")).typeText("275000");
      await element(by.id("next-button")).tap();

      // Save offline
      await element(by.id("create-property-button")).tap();

      // Verify offline save indicator
      await waitFor(element(by.id("offline-save-indicator")))
        .toBeVisible()
        .withTimeout(5000);

      await detoxExpect(
        element(by.text("Saved offline - will sync when connected")),
      ).toBeVisible();

      // Restore network connectivity
      await device.setURLBlacklist([]);

      // Trigger sync
      await element(by.id("sync-offline-data-button")).tap();

      // Verify sync completion
      await waitFor(element(by.id("sync-complete-indicator")))
        .toBeVisible()
        .withTimeout(15000);
    });
  });
});
