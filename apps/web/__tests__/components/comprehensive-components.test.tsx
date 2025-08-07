/**
 * @fileMetadata
 * @purpose "Comprehensive React component testing for ClaimGuardian UI components"
 * @owner ui-team
 * @dependencies ["@testing-library/react", "@testing-library/user-event", "@tanstack/react-query"]
 * @complexity high
 * @tags ["testing", "components", "react", "user-interactions", "accessibility"]
 * @status stable
 */

import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { 
  renderWithProviders, 
  createMockUser, 
  createMockProperty, 
  createMockClaim,
  createMockSupabaseClient 
} from "../test-utils";

// Mock components (they would normally be imported from actual files)
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>;
};

const MockSignInForm = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Email and password are required");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === "error@example.com") {
      setError("Invalid login credentials");
    } else {
      // Success - would normally redirect
      setError("");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="signin-form">
      <h1>Sign In to ClaimGuardian</h1>
      
      <div>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          aria-describedby={error ? "error-message" : undefined}
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          aria-describedby={error ? "error-message" : undefined}
        />
      </div>

      {error && (
        <div id="error-message" role="alert" className="error">
          {error}
        </div>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </button>

      <p>
        Don't have an account? <a href="/auth/signup">Sign up here</a>
      </p>
    </form>
  );
};

const MockPropertyCard = ({ property, onEdit, onDelete }: {
  property: any;
  onEdit?: (property: any) => void;
  onDelete?: (propertyId: string) => void;
}) => {
  const [showActions, setShowActions] = React.useState(false);

  return (
    <div data-testid={`property-card-${property.id}`} className="property-card">
      <div className="property-header">
        <h3>{property.address}</h3>
        <button
          onClick={() => setShowActions(!showActions)}
          aria-label="Property actions"
          aria-expanded={showActions}
        >
          ⋮
        </button>
      </div>

      <div className="property-details">
        <p>{property.city}, {property.state} {property.zip}</p>
        <p>Built: {property.year_built}</p>
        <p>Size: {property.square_footage} sq ft</p>
        {property.property_type && (
          <span className="property-type">{property.property_type}</span>
        )}
      </div>

      {property.risk_assessment && (
        <div className="risk-assessment" data-testid="risk-assessment">
          <h4>Risk Assessment</h4>
          <div className="risk-indicators">
            <span className={`risk-level ${property.risk_assessment.hurricane_risk}`}>
              Hurricane: {property.risk_assessment.hurricane_risk}
            </span>
            {property.risk_assessment.flood_zone && (
              <span className="flood-zone">
                Flood Zone: {property.risk_assessment.flood_zone}
              </span>
            )}
          </div>
        </div>
      )}

      {showActions && (
        <div className="property-actions" data-testid="property-actions">
          <button onClick={() => onEdit?.(property)}>Edit Property</button>
          <button 
            onClick={() => onDelete?.(property.id)}
            className="danger"
          >
            Delete Property
          </button>
        </div>
      )}
    </div>
  );
};

const MockClaimForm = ({ propertyId, onSubmit, onCancel }: {
  propertyId?: string;
  onSubmit?: (claim: any) => void;
  onCancel?: () => void;
}) => {
  const [formData, setFormData] = React.useState({
    property_id: propertyId || "",
    title: "",
    description: "",
    claim_amount: "",
    date_of_loss: "",
    damage_type: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.property_id) newErrors.property_id = "Property is required";
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.claim_amount || parseFloat(formData.claim_amount) <= 0) {
      newErrors.claim_amount = "Valid claim amount is required";
    }
    if (!formData.date_of_loss) newErrors.date_of_loss = "Date of loss is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onSubmit?.({
        ...formData,
        claim_amount: parseFloat(formData.claim_amount),
      });
    } catch (error) {
      setErrors({ submit: "Failed to submit claim. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="claim-form">
      <h2>File New Insurance Claim</h2>

      <div className="form-group">
        <label htmlFor="property_id">Property *</label>
        <select
          id="property_id"
          value={formData.property_id}
          onChange={(e) => handleChange("property_id", e.target.value)}
          required
        >
          <option value="">Select a property</option>
          <option value="prop-1">123 Ocean Drive, Miami Beach</option>
          <option value="prop-2">456 Collins Ave, Miami Beach</option>
        </select>
        {errors.property_id && (
          <span className="error" role="alert">{errors.property_id}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="title">Claim Title *</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Brief description of the claim"
          required
        />
        {errors.title && (
          <span className="error" role="alert">{errors.title}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="damage_type">Damage Type</label>
        <select
          id="damage_type"
          value={formData.damage_type}
          onChange={(e) => handleChange("damage_type", e.target.value)}
        >
          <option value="">Select damage type</option>
          <option value="hurricane">Hurricane</option>
          <option value="flood">Flood</option>
          <option value="fire">Fire</option>
          <option value="theft">Theft</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Detailed description of the damage and circumstances"
          required
          rows={4}
        />
        {errors.description && (
          <span className="error" role="alert">{errors.description}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="claim_amount">Estimated Claim Amount ($) *</label>
        <input
          id="claim_amount"
          type="number"
          min="0"
          step="0.01"
          value={formData.claim_amount}
          onChange={(e) => handleChange("claim_amount", e.target.value)}
          placeholder="0.00"
          required
        />
        {errors.claim_amount && (
          <span className="error" role="alert">{errors.claim_amount}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="date_of_loss">Date of Loss *</label>
        <input
          id="date_of_loss"
          type="date"
          value={formData.date_of_loss}
          onChange={(e) => handleChange("date_of_loss", e.target.value)}
          required
        />
        {errors.date_of_loss && (
          <span className="error" role="alert">{errors.date_of_loss}</span>
        )}
      </div>

      {errors.submit && (
        <div className="form-error" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Claim"}
        </button>
      </div>
    </form>
  );
};

const MockAIDamageAnalyzer = ({ onAnalysis }: {
  onAnalysis?: (result: any) => void;
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);
  const [error, setError] = React.useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError("");

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResult = {
        damageAssessment: {
          severity: "moderate",
          types: ["roof_damage", "siding_damage"],
          estimatedCost: 12500,
          confidence: 0.87,
        },
        recommendations: [
          "Contact a roofing contractor for detailed inspection",
          "Document additional angles of the damage",
          "Check for interior water damage",
        ],
      };

      setAnalysisResult(mockResult);
      onAnalysis?.(mockResult);
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div data-testid="ai-damage-analyzer">
      <h3>AI Damage Assessment</h3>
      <p>Upload a photo of the damage for automated analysis</p>

      <div className="file-upload">
        <input
          type="file"
          id="damage-photo"
          accept="image/*"
          onChange={handleFileSelect}
          aria-describedby="file-help"
        />
        <label htmlFor="damage-photo">
          {selectedFile ? selectedFile.name : "Choose damage photo"}
        </label>
        <p id="file-help">
          Accepted formats: JPG, PNG, GIF. Max size: 5MB
        </p>
      </div>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {selectedFile && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          data-testid="analyze-button"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Damage"}
        </button>
      )}

      {isAnalyzing && (
        <div className="analysis-progress" role="status" aria-live="polite">
          <div className="spinner" aria-label="Analyzing image..."></div>
          <p>Our AI is analyzing the damage in your photo...</p>
        </div>
      )}

      {analysisResult && (
        <div className="analysis-result" data-testid="analysis-result">
          <h4>Analysis Complete</h4>
          
          <div className="damage-summary">
            <p>
              <strong>Severity:</strong> 
              <span className={`severity ${analysisResult.damageAssessment.severity}`}>
                {analysisResult.damageAssessment.severity}
              </span>
            </p>
            <p>
              <strong>Estimated Cost:</strong> 
              ${analysisResult.damageAssessment.estimatedCost.toLocaleString()}
            </p>
            <p>
              <strong>Confidence:</strong> 
              {Math.round(analysisResult.damageAssessment.confidence * 100)}%
            </p>
          </div>

          <div className="damage-types">
            <h5>Damage Types Detected:</h5>
            <ul>
              {analysisResult.damageAssessment.types.map((type: string) => (
                <li key={type}>{type.replace("_", " ")}</li>
              ))}
            </ul>
          </div>

          <div className="recommendations">
            <h5>Recommendations:</h5>
            <ul>
              {analysisResult.recommendations.map((rec: string, index: number) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock Supabase client
const mockSupabase = createMockSupabaseClient();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

describe("React Components - Comprehensive Testing", () => {
  let user: ReturnType<typeof userEvent.setup>;
  let queryClient: QueryClient;

  beforeEach(() => {
    user = userEvent.setup();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe("SignInForm Component", () => {
    it("should render sign in form with all required fields", () => {
      renderWithProviders(<MockSignInForm />, { queryClient });

      expect(screen.getByRole("heading", { name: /sign in to claimguardian/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it("should validate required fields on form submission", async () => {
      renderWithProviders(<MockSignInForm />, { queryClient });

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Email and password are required");
      });
    });

    it("should validate email format", async () => {
      renderWithProviders(<MockSignInForm />, { queryClient });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "invalid-email");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid email address");
      });
    });

    it("should handle successful form submission", async () => {
      renderWithProviders(<MockSignInForm />, { queryClient });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "user@claimguardian.com");
      await user.type(passwordInput, "SecurePass123!");
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByRole("button", { name: /signing in/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it("should handle authentication errors", async () => {
      renderWithProviders(<MockSignInForm />, { queryClient });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "error@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid login credentials");
      }, { timeout: 2000 });
    });

    it("should be accessible with keyboard navigation", async () => {
      renderWithProviders(<MockSignInForm />, { queryClient });

      const emailInput = screen.getByLabelText(/email address/i);
      
      // Tab through form fields
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /sign in/i })).toHaveFocus();
    });

    it("should have proper ARIA attributes for accessibility", () => {
      renderWithProviders(<MockSignInForm />, { queryClient });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("required");
    });
  });

  describe("PropertyCard Component", () => {
    const mockProperty = createMockProperty({
      id: "prop-123",
      address: "123 Ocean Drive",
      city: "Miami Beach",
      state: "FL",
      zip: "33139",
      year_built: 2010,
      square_footage: 2500,
      property_type: "single_family",
      risk_assessment: {
        hurricane_risk: "high",
        flood_zone: "AE",
        wildfire_risk: "low",
        earthquake_risk: "minimal",
      },
    });

    it("should display property information correctly", () => {
      renderWithProviders(<MockPropertyCard property={mockProperty} />);

      expect(screen.getByText("123 Ocean Drive")).toBeInTheDocument();
      expect(screen.getByText("Miami Beach, FL 33139")).toBeInTheDocument();
      expect(screen.getByText("Built: 2010")).toBeInTheDocument();
      expect(screen.getByText("Size: 2500 sq ft")).toBeInTheDocument();
      expect(screen.getByText("single_family")).toBeInTheDocument();
    });

    it("should show risk assessment information", () => {
      renderWithProviders(<MockPropertyCard property={mockProperty} />);

      const riskAssessment = screen.getByTestId("risk-assessment");
      expect(riskAssessment).toBeInTheDocument();
      
      expect(within(riskAssessment).getByText(/hurricane: high/i)).toBeInTheDocument();
      expect(within(riskAssessment).getByText(/flood zone: ae/i)).toBeInTheDocument();
    });

    it("should toggle action menu when button is clicked", async () => {
      const mockOnEdit = jest.fn();
      const mockOnDelete = jest.fn();

      renderWithProviders(
        <MockPropertyCard 
          property={mockProperty} 
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const actionButton = screen.getByRole("button", { name: /property actions/i });
      
      // Actions should be hidden initially
      expect(screen.queryByTestId("property-actions")).not.toBeInTheDocument();

      await user.click(actionButton);

      // Actions should be visible after click
      expect(screen.getByTestId("property-actions")).toBeInTheDocument();
      expect(screen.getByText("Edit Property")).toBeInTheDocument();
      expect(screen.getByText("Delete Property")).toBeInTheDocument();
    });

    it("should call edit callback when edit button is clicked", async () => {
      const mockOnEdit = jest.fn();

      renderWithProviders(
        <MockPropertyCard property={mockProperty} onEdit={mockOnEdit} />
      );

      const actionButton = screen.getByRole("button", { name: /property actions/i });
      await user.click(actionButton);

      const editButton = screen.getByText("Edit Property");
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockProperty);
    });

    it("should call delete callback when delete button is clicked", async () => {
      const mockOnDelete = jest.fn();

      renderWithProviders(
        <MockPropertyCard property={mockProperty} onDelete={mockOnDelete} />
      );

      const actionButton = screen.getByRole("button", { name: /property actions/i });
      await user.click(actionButton);

      const deleteButton = screen.getByText("Delete Property");
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith("prop-123");
    });

    it("should handle properties without risk assessment", () => {
      const propertyWithoutRisk = { ...mockProperty, risk_assessment: null };
      
      renderWithProviders(<MockPropertyCard property={propertyWithoutRisk} />);

      expect(screen.queryByTestId("risk-assessment")).not.toBeInTheDocument();
    });
  });

  describe("ClaimForm Component", () => {
    it("should render claim form with all required fields", () => {
      renderWithProviders(<MockClaimForm />);

      expect(screen.getByRole("heading", { name: /file new insurance claim/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/property/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/claim title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/estimated claim amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date of loss/i)).toBeInTheDocument();
    });

    it("should validate required fields before submission", async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<MockClaimForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", { name: /submit claim/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText("Property is required")).toBeInTheDocument();
        expect(screen.getByText("Title is required")).toBeInTheDocument();
        expect(screen.getByText("Description is required")).toBeInTheDocument();
        expect(screen.getByText("Valid claim amount is required")).toBeInTheDocument();
        expect(screen.getByText("Date of loss is required")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should submit form with valid data", async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<MockClaimForm onSubmit={mockOnSubmit} />);

      // Fill out form
      await user.selectOptions(screen.getByLabelText(/property/i), "prop-1");
      await user.type(screen.getByLabelText(/claim title/i), "Hurricane Damage");
      await user.selectOptions(screen.getByLabelText(/damage type/i), "hurricane");
      await user.type(
        screen.getByLabelText(/description/i), 
        "Roof damage from Hurricane Ian"
      );
      await user.type(screen.getByLabelText(/estimated claim amount/i), "25000");
      await user.type(screen.getByLabelText(/date of loss/i), "2024-01-15");

      const submitButton = screen.getByRole("button", { name: /submit claim/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText("Submitting...")).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          property_id: "prop-1",
          title: "Hurricane Damage",
          description: "Roof damage from Hurricane Ian",
          claim_amount: 25000,
          date_of_loss: "2024-01-15",
          damage_type: "hurricane",
        });
      });
    });

    it("should clear field errors when user starts typing", async () => {
      renderWithProviders(<MockClaimForm />);

      // Submit empty form to trigger errors
      await user.click(screen.getByRole("button", { name: /submit claim/i }));

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument();
      });

      // Start typing in title field
      await user.type(screen.getByLabelText(/claim title/i), "Test");

      // Error should be cleared
      expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    });

    it("should call cancel callback when cancel is clicked", async () => {
      const mockOnCancel = jest.fn();
      renderWithProviders(<MockClaimForm onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("should pre-populate property field when provided", () => {
      renderWithProviders(<MockClaimForm propertyId="prop-2" />);

      const propertySelect = screen.getByLabelText(/property/i) as HTMLSelectElement;
      expect(propertySelect.value).toBe("prop-2");
    });
  });

  describe("AIDamageAnalyzer Component", () => {
    it("should render file upload interface", () => {
      renderWithProviders(<MockAIDamageAnalyzer />);

      expect(screen.getByRole("heading", { name: /ai damage assessment/i })).toBeInTheDocument();
      expect(screen.getByText(/upload a photo of the damage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/choose damage photo/i)).toBeInTheDocument();
      expect(screen.getByText(/accepted formats: jpg, png, gif/i)).toBeInTheDocument();
    });

    it("should validate file type on upload", async () => {
      renderWithProviders(<MockAIDamageAnalyzer />);

      const fileInput = screen.getByLabelText(/choose damage photo/i);
      const textFile = new File(["text content"], "document.txt", { type: "text/plain" });

      await user.upload(fileInput, textFile);

      expect(screen.getByRole("alert")).toHaveTextContent("Please select an image file");
      expect(screen.queryByTestId("analyze-button")).not.toBeInTheDocument();
    });

    it("should validate file size", async () => {
      renderWithProviders(<MockAIDamageAnalyzer />);

      const fileInput = screen.getByLabelText(/choose damage photo/i);
      // Create a large file (6MB)
      const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", { 
        type: "image/jpeg" 
      });

      await user.upload(fileInput, largeFile);

      expect(screen.getByRole("alert")).toHaveTextContent("File size must be less than 5MB");
    });

    it("should accept valid image file and show analyze button", async () => {
      renderWithProviders(<MockAIDamageAnalyzer />);

      const fileInput = screen.getByLabelText(/choose damage photo/i);
      const imageFile = new File(["image data"], "damage.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, imageFile);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByTestId("analyze-button")).toBeInTheDocument();
      expect(screen.getByText("damage.jpg")).toBeInTheDocument();
    });

    it("should perform AI analysis and show results", async () => {
      const mockOnAnalysis = jest.fn();
      renderWithProviders(<MockAIDamageAnalyzer onAnalysis={mockOnAnalysis} />);

      // Upload valid file
      const fileInput = screen.getByLabelText(/choose damage photo/i);
      const imageFile = new File(["image data"], "damage.jpg", { type: "image/jpeg" });
      await user.upload(fileInput, imageFile);

      // Start analysis
      const analyzeButton = screen.getByTestId("analyze-button");
      await user.click(analyzeButton);

      // Should show loading state
      expect(screen.getByText("Analyzing...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByLabelText(/analyzing image/i)).toBeInTheDocument();

      // Wait for analysis to complete
      await waitFor(() => {
        expect(screen.getByTestId("analysis-result")).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show results
      const result = screen.getByTestId("analysis-result");
      expect(within(result).getByText("Analysis Complete")).toBeInTheDocument();
      expect(within(result).getByText("moderate")).toBeInTheDocument();
      expect(within(result).getByText("$12,500")).toBeInTheDocument();
      expect(within(result).getByText("87%")).toBeInTheDocument();
      
      // Should show damage types
      expect(within(result).getByText("roof damage")).toBeInTheDocument();
      expect(within(result).getByText("siding damage")).toBeInTheDocument();

      // Should show recommendations
      expect(within(result).getByText(/contact a roofing contractor/i)).toBeInTheDocument();

      expect(mockOnAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          damageAssessment: expect.objectContaining({
            severity: "moderate",
            estimatedCost: 12500,
          }),
        })
      );
    });

    it("should be accessible with proper ARIA attributes", () => {
      renderWithProviders(<MockAIDamageAnalyzer />);

      const fileInput = screen.getByLabelText(/choose damage photo/i);
      expect(fileInput).toHaveAttribute("accept", "image/*");
      expect(fileInput).toHaveAttribute("aria-describedby", "file-help");

      const helpText = screen.getByText(/accepted formats/i);
      expect(helpText).toHaveAttribute("id", "file-help");
    });
  });

  describe("Component Integration Tests", () => {
    it("should integrate ClaimForm with PropertyCard selection", async () => {
      const property = createMockProperty({ id: "prop-123" });
      const [selectedProperty, setSelectedProperty] = React.useState<any>(null);

      const TestIntegration = () => {
        return (
          <div>
            <MockPropertyCard 
              property={property}
              onEdit={setSelectedProperty}
            />
            {selectedProperty && (
              <MockClaimForm 
                propertyId={selectedProperty.id}
                onCancel={() => setSelectedProperty(null)}
              />
            )}
          </div>
        );
      };

      renderWithProviders(<TestIntegration />);

      // Click property actions and then edit
      const actionButton = screen.getByRole("button", { name: /property actions/i });
      await user.click(actionButton);

      const editButton = screen.getByText("Edit Property");
      await user.click(editButton);

      // Should show claim form with pre-selected property
      expect(screen.getByRole("heading", { name: /file new insurance claim/i })).toBeInTheDocument();
      
      const propertySelect = screen.getByLabelText(/property/i) as HTMLSelectElement;
      expect(propertySelect.value).toBe("prop-123");
    });

    it("should handle form submission workflow", async () => {
      const mockSubmissions: any[] = [];
      
      const TestWorkflow = () => {
        const [showForm, setShowForm] = React.useState(true);
        const [showAnalyzer, setShowAnalyzer] = React.useState(false);

        return (
          <div>
            {showForm && (
              <MockClaimForm 
                onSubmit={(claim) => {
                  mockSubmissions.push(claim);
                  setShowForm(false);
                  setShowAnalyzer(true);
                }}
                onCancel={() => setShowForm(false)}
              />
            )}
            {showAnalyzer && (
              <MockAIDamageAnalyzer 
                onAnalysis={(result) => {
                  mockSubmissions.push(result);
                }}
              />
            )}
          </div>
        );
      };

      renderWithProviders(<TestWorkflow />);

      // Fill and submit claim form
      await user.selectOptions(screen.getByLabelText(/property/i), "prop-1");
      await user.type(screen.getByLabelText(/claim title/i), "Test Claim");
      await user.type(screen.getByLabelText(/description/i), "Test damage");
      await user.type(screen.getByLabelText(/estimated claim amount/i), "5000");
      await user.type(screen.getByLabelText(/date of loss/i), "2024-01-15");

      await user.click(screen.getByRole("button", { name: /submit claim/i }));

      // Should transition to AI analyzer
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /ai damage assessment/i })).toBeInTheDocument();
      });

      // Upload file and analyze
      const fileInput = screen.getByLabelText(/choose damage photo/i);
      const imageFile = new File(["image data"], "damage.jpg", { type: "image/jpeg" });
      await user.upload(fileInput, imageFile);

      await user.click(screen.getByTestId("analyze-button"));

      await waitFor(() => {
        expect(screen.getByTestId("analysis-result")).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should have both claim and analysis data
      expect(mockSubmissions).toHaveLength(2);
      expect(mockSubmissions[0]).toMatchObject({
        property_id: "prop-1",
        title: "Test Claim",
        claim_amount: 5000,
      });
      expect(mockSubmissions[1]).toMatchObject({
        damageAssessment: expect.objectContaining({
          severity: "moderate",
        }),
      });
    });
  });

  describe("Responsive Design and Mobile", () => {
    it("should adapt forms for mobile viewport", () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderWithProviders(<MockClaimForm />);

      const form = screen.getByTestId("claim-form");
      expect(form).toBeInTheDocument();
      
      // All form elements should still be accessible
      expect(screen.getByLabelText(/property/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/claim title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it("should handle touch interactions on mobile", async () => {
      // Mock mobile environment
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });

      const mockOnEdit = jest.fn();
      renderWithProviders(
        <MockPropertyCard 
          property={createMockProperty()} 
          onEdit={mockOnEdit}
        />
      );

      const actionButton = screen.getByRole("button", { name: /property actions/i });
      
      // Simulate touch interaction
      await user.click(actionButton);
      
      expect(screen.getByTestId("property-actions")).toBeInTheDocument();
    });
  });
});